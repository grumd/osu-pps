import type { Mode } from '../modes.ts';
import { MOD_STAR_RATINGS_TIME_BUDGET_MS } from '../timings.ts';
import { files } from '../paths.ts';
import { fetchBeatmapStarRating } from '../osu-api/api.ts';
import { isNotFoundError } from '../osu-api/http.ts';
import type { MapInfoCache, MapRecord, ModStarRatingsCache } from '../data/types.ts';
import type { OsuApiBeatmap } from '../osu-api/types.ts';
import { fileExists, readJson, writeJson } from '../utils/io.ts';
import { simplifyModsForStarRating } from '../utils/mods.ts';
import { runJobs } from '../utils/run-jobs.ts';

/** Star ratings closer than this are considered equal. */
const STAR_RATING_TOLERANCE = 0.001;
/** Number of cached star ratings refetched on every update to detect algorithm changes. */
const CANARY_COUNT = 10;
/**
 * Number of canaries that must change to count as an algorithm change: one changed map could be
 * a one-off, while a rework changes nearly all of them. Smaller changes are still picked up map
 * by map once ppy recalculates their no-mod star rating.
 */
const MIN_CHANGED_CANARIES = 2;
/** Save the cache to disk every N fetches so a crash doesn't lose all progress. */
const FETCHES_PER_CACHE_SAVE = 500;

export interface StarRatingLookupResult {
  /** Star rating with the mods; undefined when it's the no-mod one or wasn't fetched yet */
  starRating?: number;
  /** The star rating changes with these mods, but it wasn't fetched yet */
  pending: boolean;
}

/** Star rating of a beatmap with the given (simplified) mods. */
export type StarRatingLookup = (beatmapId: number, mods: number) => StarRatingLookupResult;

interface StarRatingRequest {
  beatmapId: number;
  /** star-rating-affecting mods bitmask */
  mods: number;
}

interface Canary extends StarRatingRequest {
  starRating: number;
}

/**
 * Step 3b, part of step 3: star ratings of the listed maps with their mods, kept in a persistent
 * cache. Only fetched for the mod combos in the map list that change star rating, plus no-mod for
 * maps converted from another ruleset (their `difficulty_rating` is for the original ruleset).
 * - A beatmap's star ratings are refetched when its no-mod star rating changes.
 * - A few cached star ratings are refetched on every update as canaries. If they changed, the
 *   algorithm changed and everything is refetched, showing the old values in the meantime.
 * - Fetching stops after MOD_STAR_RATINGS_TIME_BUDGET_MS, the most farmable maps first;
 *   the rest is fetched in the next updates.
 */
export async function fetchModStarRatings(
  mode: Mode,
  mapsList: readonly MapRecord[],
  mapInfo: MapInfoCache
): Promise<StarRatingLookup> {
  console.log(`3b. FETCHING MOD STAR RATINGS - ${mode.text}`);

  const cache = await loadCache(mode);
  const neededMods = findNeededMods(mode, mapsList, mapInfo);

  // The map was updated, or ppy recalculated its difficulty
  let changedMapsCount = 0;
  for (const beatmapId of neededMods.keys()) {
    const entry = cache.beatmaps[beatmapId];
    if (entry && !isSameStarRating(entry.nm, mapInfo[beatmapId]!.difficulty_rating)) {
      cache.outdated[beatmapId] = entry;
      delete cache.beatmaps[beatmapId];
      changedMapsCount += 1;
    }
  }
  if (changedMapsCount > 0) {
    console.log(`No-mod star rating changed for ${changedMapsCount} beatmaps, refetching them`);
  }

  if (await hasAlgorithmChanged(mode, cache, pickCanaries(cache, neededMods))) {
    console.log('Star rating algorithm changed, refetching all star ratings');
    cache.outdated = { ...cache.outdated, ...cache.beatmaps };
    cache.beatmaps = {};
  }

  const requests = [...neededMods].flatMap(([beatmapId, mods]) =>
    [...mods]
      .filter((modsKey) => cache.beatmaps[beatmapId]?.sr[modsKey] === undefined)
      .map((modsKey) => ({ beatmapId, mods: modsKey }))
  );
  console.log(`${requests.length} star ratings to fetch`);

  const deadline = Date.now() + MOD_STAR_RATINGS_TIME_BUDGET_MS;
  // Rate limited by the API client, one request per job
  await runJobs({
    items: requests,
    shouldStop: () => Date.now() > deadline,
    job: async ({ beatmapId, mods }, index) => {
      try {
        const starRating = await fetchBeatmapStarRating(beatmapId, mods, mode);
        const entry = (cache.beatmaps[beatmapId] ??= {
          nm: mapInfo[beatmapId]!.difficulty_rating,
          sr: {},
        });
        entry.sr[mods] = starRating;
      } catch (error) {
        // Skipped star ratings are retried on the next run
        const message = isNotFoundError(error)
          ? 'not found (deleted?)'
          : error instanceof Error
            ? error.message
            : String(error);
        console.error(`Failed to fetch star rating of beatmap ${beatmapId}+${mods}:`, message);
      }
      if ((index + 1) % FETCHES_PER_CACHE_SAVE === 0) {
        await writeJson(files.modStarRatingsCache(mode), cache);
      }
    },
  });

  removeRefetchedOutdatedEntries(cache);
  await writeJson(files.modStarRatingsCache(mode), cache);

  return (beatmapId, mods) => {
    const modsKey = simplifyModsForStarRating(mods, mode.id);
    const starRating =
      cache.beatmaps[beatmapId]?.sr[modsKey] ?? cache.outdated[beatmapId]?.sr[modsKey];
    const beatmap = mapInfo[beatmapId];
    const pending =
      starRating === undefined && !!beatmap && !isNoModStarRating(mode, beatmap, modsKey);
    return { starRating, pending };
  };
}

async function loadCache(mode: Mode): Promise<ModStarRatingsCache> {
  if (fileExists(files.modStarRatingsCache(mode))) {
    try {
      return await readJson<ModStarRatingsCache>(files.modStarRatingsCache(mode));
    } catch (error) {
      console.log(`Error parsing ${files.modStarRatingsCache(mode)}`, error);
    }
  }
  return { beatmaps: {}, outdated: {} };
}

/**
 * Beatmap id -> star rating mods that need a star rating, most farmable maps first.
 * No-mod star ratings of maps from this ruleset are left out, that's `difficulty_rating`.
 */
function findNeededMods(
  mode: Mode,
  mapsList: readonly MapRecord[],
  mapInfo: MapInfoCache
): Map<number, Set<number>> {
  const neededMods = new Map<number, Set<number>>();
  const mapsByFarmValue = [...mapsList].sort((a, b) => b.x - a.x);
  for (const map of mapsByFarmValue) {
    const beatmap = mapInfo[map.b];
    if (!beatmap) continue;
    const mods = simplifyModsForStarRating(map.m, mode.id);
    if (isNoModStarRating(mode, beatmap, mods)) continue;

    const beatmapMods = neededMods.get(map.b) ?? new Set();
    beatmapMods.add(mods);
    neededMods.set(map.b, beatmapMods);
  }
  return neededMods;
}

/** Whether the star rating is just `difficulty_rating`: no-mod on a map from this ruleset. */
function isNoModStarRating(mode: Mode, beatmap: OsuApiBeatmap, starRatingMods: number): boolean {
  return starRatingMods === 0 && beatmap.mode_int === mode.id;
}

/**
 * Picks cached star ratings to refetch as canaries: spread over the most common mod combos,
 * and over the star rating range within each combo. Deterministic for the same cache.
 */
function pickCanaries(
  cache: ModStarRatingsCache,
  neededMods: Map<number, Set<number>>
): Canary[] {
  const byMods = new Map<number, Canary[]>();
  for (const [beatmapId, mods] of neededMods) {
    const entry = cache.beatmaps[beatmapId];
    if (!entry) continue;
    for (const modsKey of mods) {
      const starRating = entry.sr[modsKey];
      if (starRating === undefined) continue;
      const group = byMods.get(modsKey) ?? [];
      group.push({ beatmapId, mods: modsKey, starRating });
      byMods.set(modsKey, group);
    }
  }

  const groups = [...byMods.values()].sort((a, b) => b.length - a.length);
  const perGroup = Math.ceil(CANARY_COUNT / Math.max(1, groups.length));
  const picksPerGroup = groups.map((group) => {
    group.sort((a, b) => a.starRating - b.starRating || a.beatmapId - b.beatmapId);
    const count = Math.min(perGroup, group.length);
    return Array.from(
      { length: count },
      (_, i) => group[Math.floor(((i + 0.5) * group.length) / count)]!
    );
  });

  // Every mod combo gets a canary before any combo gets a second one
  const canaries: Canary[] = [];
  for (let round = 0; round < perGroup; round++) {
    for (const picks of picksPerGroup) {
      const pick = picks[round];
      if (pick && canaries.length < CANARY_COUNT) canaries.push(pick);
    }
  }
  return canaries;
}

/** Refetches the canaries; updates the changed ones in the cache. */
async function hasAlgorithmChanged(
  mode: Mode,
  cache: ModStarRatingsCache,
  canaries: readonly Canary[]
): Promise<boolean> {
  if (canaries.length === 0) return false;

  let changedCount = 0;
  for (const { beatmapId, mods, starRating } of canaries) {
    try {
      const newStarRating = await fetchBeatmapStarRating(beatmapId, mods, mode);
      if (!isSameStarRating(starRating, newStarRating)) {
        console.log(
          `Star rating of beatmap ${beatmapId}+${mods} changed: ${starRating} -> ${newStarRating}`
        );
        cache.beatmaps[beatmapId]!.sr[mods] = newStarRating;
        changedCount += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to check star rating of beatmap ${beatmapId}+${mods}:`, message);
    }
  }
  console.log(`${changedCount} of ${canaries.length} canary star ratings changed`);
  return changedCount >= Math.min(MIN_CHANGED_CANARIES, canaries.length);
}

/** Drops outdated entries once all their star ratings have been refetched. */
function removeRefetchedOutdatedEntries(cache: ModStarRatingsCache): void {
  for (const [beatmapId, outdated] of Object.entries(cache.outdated)) {
    const current = cache.beatmaps[beatmapId];
    if (current && Object.keys(outdated.sr).every((modsKey) => modsKey in current.sr)) {
      delete cache.outdated[beatmapId];
    }
  }
}

function isSameStarRating(a: number, b: number): boolean {
  return Math.abs(a - b) < STAR_RATING_TOLERANCE;
}
