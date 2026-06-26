import { modes, type Mode } from '../modes.ts';
import { DELAY_BETWEEN_MAP_BATCHES_MS } from '../timings.ts';
import { files } from '../paths.ts';
import { BEATMAP_BATCH_SIZE, fetchBeatmaps } from '../osu-api/api.ts';
import type { OsuApiBeatmap } from '../osu-api/types.ts';
import type {
  CachedBeatmap,
  DetailedMapRecord,
  MapInfoCache,
  MapRecord,
} from '../data/types.ts';
import { fileExists, readJson, writeJson } from '../utils/io.ts';
import { chunk, hoursSince, uniqBy } from '../utils/misc.ts';
import { runJobs } from '../utils/run-jobs.ts';

/** Save the cache to disk every N batches so a crash doesn't lose all progress. */
const BATCHES_PER_CACHE_SAVE = 100;

/**
 * Step 3: enriches the map list with beatmap metadata (artist, title, difficulty settings,
 * timestamps, mapper). Metadata is kept in a long-lived local cache; only new or stale
 * beatmaps are fetched, in batches of up to 50 per request.
 */
export async function fetchMapInfo(mode: Mode): Promise<void> {
  console.log(`3. FETCHING MAP INFO - ${mode.text}`);

  let cache: MapInfoCache = {};
  if (fileExists(files.mapInfoCache(mode))) {
    try {
      cache = await readJson<MapInfoCache>(files.mapInfoCache(mode));
      console.log('Loaded maps cache');
    } catch (error) {
      console.log(`Error parsing ${files.mapInfoCache(mode)}`, error);
    }
  }

  const mapsList = await readJson<MapRecord[]>(files.mapsList(mode));
  console.log('Loaded maps list');

  const uniqueBeatmapIds = uniqBy(mapsList.map((map) => map.b), (id) => id);
  const idsToFetch = uniqueBeatmapIds.filter((beatmapId) => {
    const cached = cache[beatmapId];
    return !cached || isCacheEntryStale(cached);
  });
  console.log(
    `${uniqueBeatmapIds.length} unique beatmaps, fetching ${idsToFetch.length} new or stale ones...`
  );

  const batches = chunk(idsToFetch, BEATMAP_BATCH_SIZE);
  await runJobs({
    items: batches,
    minJobTime: DELAY_BETWEEN_MAP_BATCHES_MS,
    job: async (batch, batchIndex) => {
      try {
        const beatmaps = await fetchBeatmaps(batch);
        for (const beatmap of beatmaps) {
          cache[beatmap.id] = { ...beatmap, cache_date: formatCacheDate(new Date()) };
        }
        if (beatmaps.length < batch.length) {
          const returnedIds = new Set(beatmaps.map((beatmap) => beatmap.id));
          const missing = batch.filter((id) => !returnedIds.has(id));
          console.warn(`Beatmaps not returned by the API (deleted?): ${missing.join(', ')}`);
        }
      } catch (error) {
        // Skipped maps stay stale and will be retried on the next run
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to fetch a batch of ${batch.length} beatmaps:`, message);
      }
      if ((batchIndex + 1) % BATCHES_PER_CACHE_SAVE === 0) {
        await writeJson(files.mapInfoCache(mode), cache);
      }
    },
  });

  const detailedMaps: DetailedMapRecord[] = [];
  for (const map of mapsList) {
    const cached = cache[map.b];
    if (!cached) {
      console.warn(`No info for beatmap ${map.b}, skipping it`);
      continue;
    }
    detailedMaps.push(buildDetailedMap(map, cached, mode));
  }
  detailedMaps.sort((a, b) => b.x - a.x);

  await writeJson(files.mapsDetailedList(mode), detailedMaps);
  await writeJson(files.mapInfoCache(mode), cache);
  console.log(`${detailedMaps.length} maps saved. Done fetching detailed map info! (${mode.text})`);
}

/**
 * Decides whether a cached beatmap should be refetched:
 * - exponential staleness: each refresh doubles the allowed cache age
 *   (old stable maps are refreshed very rarely),
 * - the map or its mapset changed after it was cached,
 * - the entry predates the `owners` array (needed for guest difficulty credits),
 * - the map is young (low passcount) and its stats still change quickly.
 */
function isCacheEntryStale(cached: CachedBeatmap): boolean {
  const cachedAt = cached.cache_date ? new Date(cached.cache_date) : null;
  const rankedAt = cached.beatmapset?.ranked_date ? new Date(cached.beatmapset.ranked_date) : null;

  const wasCachedLongAgo =
    !cachedAt ||
    !rankedAt ||
    Date.now() - cachedAt.getTime() > cachedAt.getTime() - rankedAt.getTime();

  const changedAfterCached =
    cachedAt != null &&
    (new Date(cached.last_updated) > cachedAt || (rankedAt != null && rankedAt > cachedAt));

  return wasCachedLongAgo || changedAfterCached || !cached.owners || cached.passcount < 1000;
}

/** "YYYY-MM-DD hh:mm:ss" (UTC) */
function formatCacheDate(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function buildDetailedMap(map: MapRecord, beatmap: OsuApiBeatmap, mode: Mode): DetailedMapRecord {
  const detailed: DetailedMapRecord = {
    m: map.m,
    b: map.b,
    x: map.x,
    pp99: map.pp99,
    adj: map.adj,
    art: beatmap.beatmapset.artist,
    t: beatmap.beatmapset.title,
    v: beatmap.version,
    s: beatmap.beatmapset_id,
    l: beatmap.hit_length,
    bpm: beatmap.bpm,
    d: beatmap.difficulty_rating,
    p: beatmap.passcount,
    h: hoursSince(beatmap.last_updated),
    appr_h: Math.floor(new Date(beatmap.beatmapset.ranked_date ?? 0).getTime() / 1000 / 60 / 60),
    ar: beatmap.ar,
    accuracy: beatmap.accuracy, // overall difficulty
    cs: beatmap.cs,
    drain: beatmap.drain, // hp
    mapper_id: beatmap.user_id,
  };

  // For mania-specific maps (not converts), circle size is the key count
  if (mode.id === modes.mania.id && beatmap.mode_int === modes.mania.id) {
    detailed.k = beatmap.cs;
  }

  return detailed;
}
