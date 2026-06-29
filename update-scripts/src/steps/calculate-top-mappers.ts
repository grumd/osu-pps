import { DEBUG } from '../config.ts';
import {
  DELAY_BETWEEN_MAPPER_NAME_FETCHES_MS,
  DELAY_BETWEEN_MAPPERS_MS,
} from '../timings.ts';
import type { Mode } from '../modes.ts';
import { files } from '../paths.ts';
import { fetchUser, fetchUserFavourites } from '../osu-api/api.ts';
import type { CachedBeatmap, MapInfoCache, MapRecord } from '../data/types.ts';
import { readJson, writeFile, writeJson } from '../utils/io.ts';
import { hoursSince, sumBy, truncateFloat, uniqBy } from '../utils/misc.ts';
import { overweightness } from '../utils/overweightness.ts';
import { runJobs } from '../utils/run-jobs.ts';

/** Mappers need at least this many ranked mapsets for their favourites to count as votes. */
const MIN_MAPSETS_FOR_VOTING = 3;
/** A voter's weight reaches the maximum of 1.0 at this many ranked mapsets. */
const MAPSETS_FOR_FULL_VOTE = 10;
const TOP_MAPPERS_COUNT = 20;
/** How many of a mapper's maps are listed in the top-mappers output. */
const TOP_MAPS_PER_MAPPER = 20;

const log = (...args: unknown[]) => console.log('Mapper stats:', ...args);
const logError = (...args: unknown[]) => console.error('Mapper stats error:', ...args);

interface MapperMapRecord {
  /** beatmap id */
  id: number;
  /** raw farmability (best mod combo) */
  x: number;
  /** farmability per map age (peaks on the same combo as `x`, since the age divisor is constant per beatmap) */
  xAge: number;
  /** pp99 of the most farmable mod combo */
  pp: number;
  /** mods bitmask of the most farmable mod combo */
  m: number;
  /** overweightness-adjusted farmability (best mod combo) */
  xAdj: number;
  /** pp99 of the most overweight mod combo */
  ppAdj: number;
  /** mods bitmask of the most overweight mod combo */
  mAdj: number;
}

interface PpMapper {
  name: string;
  id: number;
  mapsRecorded: MapperMapRecord[];
  points: number;
  pointsAge: number;
  pointsAdj: number;
}

/**
 * Step 5: computes mapper statistics:
 * - top 20 "pp mappers" by farmability points (raw / by age / overweightness-adjusted),
 * - which mappers are favored most by other mappers (weighted by the voter's ranked mapsets).
 */
export async function calculateTopMappers(mode: Mode): Promise<void> {
  log(`Calculating TOP ${TOP_MAPPERS_COUNT} pp mappers for ${mode.text}`);

  log('Reading maps cache');
  const cache = await readJson<MapInfoCache>(files.mapInfoCache(mode));
  const mapsList = await readJson<MapRecord[]>(files.mapsList(mode));

  log('Sorting maps by farmability');
  const mapsByFarmability = mapsList
    .filter((map) => cache[map.b])
    .sort((a, b) => b.x - a.x);

  await backfillMissingOwners(mapsByFarmability, cache);

  log('Calculating pp mappers list');
  const ppMappers = collectPpMappers(mapsByFarmability, cache);

  log('Calculating favs, playcount, mapper favs');
  const mapperStats = collectMapperStats(cache, mode);
  writeTextTops(mapperStats, mode);

  const votingMappers = mapperStats.filter((mapper) => mapper.mapsets >= MIN_MAPSETS_FOR_VOTING);
  const voters = DEBUG ? votingMappers.slice(0, 5) : votingMappers;
  log(`Mappers with ${MIN_MAPSETS_FOR_VOTING}+ mapsets ranked:`, voters.length);
  log('Fetching their favourite maps...');
  await fetchFavourites(voters);
  log('Finished fetching favourites');

  await writeFavoredMappers(voters, mode);
  log('Recorded top of mappers by mapper favs');

  const formatTop = (
    pointsKey: 'points' | 'pointsAge' | 'pointsAdj',
    xKey: 'x' | 'xAge' | 'xAdj',
    ppKey: 'pp' | 'ppAdj',
    mKey: 'm' | 'mAdj',
    shouldTruncate = true
  ) => {
    return [...ppMappers]
      .sort((a, b) => b[pointsKey] - a[pointsKey])
      .slice(0, TOP_MAPPERS_COUNT)
      .map((mapper) => ({
        name: mapper.name,
        id: mapper.id,
        points: shouldTruncate ? truncateFloat(mapper[pointsKey]) : mapper[pointsKey],
        mapsRecorded: [...mapper.mapsRecorded]
          .sort((a, b) => b[xKey] - a[xKey])
          .slice(0, TOP_MAPS_PER_MAPPER)
          .map((map) => {
            const cached = cache[map.id]!;
            return {
              id: map.id,
              text: `${cached.beatmapset.artist} - ${cached.beatmapset.title} [${cached.version}]`,
              ow: shouldTruncate ? truncateFloat(map[xKey]) : map[xKey],
              pp: map[ppKey],
              m: map[mKey],
            };
          }),
      }));
  };

  await writeJson(files.ppMappers(mode), {
    top20: formatTop('points', 'x', 'pp', 'm'),
    top20age: formatTop('pointsAge', 'xAge', 'pp', 'm'),
    top20adj: formatTop('pointsAdj', 'xAdj', 'ppAdj', 'mAdj', false),
  });
  log(`Finished calculating TOP ${TOP_MAPPERS_COUNT} mappers!`);
}

/**
 * Older cache entries don't have the `owners` array (which credits guest difficulties).
 * Generates one from the mapset host's username, fetching usernames not seen in the cache.
 */
async function backfillMissingOwners(
  maps: readonly MapRecord[],
  cache: MapInfoCache
): Promise<void> {
  // All usernames a mapset-host user id is known under in the cache
  const namesPerMapper = new Map<number, string[]>();
  for (const cached of Object.values(cache)) {
    const names = namesPerMapper.get(cached.beatmapset.user_id);
    if (!names) {
      namesPerMapper.set(cached.beatmapset.user_id, [cached.beatmapset.creator]);
    } else if (!names.includes(cached.beatmapset.creator)) {
      names.push(cached.beatmapset.creator);
    }
  }
  log(`Recorded ${namesPerMapper.size} known mapper names from the maps cache`);

  const mapsWithoutOwners = maps.filter((map) => {
    const cached = cache[map.b]!;
    return !cached.owners || cached.owners.length === 0;
  });

  const mapsWithUnknownMapper = mapsWithoutOwners.filter(
    (map) => !namesPerMapper.has(cache[map.b]!.user_id)
  );
  log(`Fetching usernames for ${mapsWithUnknownMapper.length} maps with unknown mappers...`);
  await runJobs({
    items: mapsWithUnknownMapper,
    minJobTime: DELAY_BETWEEN_MAPPER_NAME_FETCHES_MS,
    job: async (map) => {
      const cached = cache[map.b]!;
      try {
        const user = await fetchUser(cached.user_id);
        namesPerMapper.set(cached.user_id, [user.username]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logError(
          `Fetching mapper ${cached.user_id} of mapset ${cached.beatmapset_id}, beatmap ${cached.id}:`,
          message
        );
      }
    },
  });

  log(`Adding generated owners to ${mapsWithoutOwners.length} maps without an owners array...`);
  for (const map of mapsWithoutOwners) {
    const cached = cache[map.b]!;
    const names = namesPerMapper.get(cached.user_id);
    if (!names || names.length === 0) {
      logError('Mapper name information missing', map);
      continue;
    }
    cached.owners = names.map((name) => ({ username: name, id: cached.user_id }));
  }
}

/**
 * Collapses each beatmap's mod combinations into one record. The same beatmap appears once
 * per mod combination; raw farmability and overweightness can peak on *different* combos
 * (overweightness divides by the combo's player count), so each metric keeps its own best.
 */
function reduceToBeatmapRecords(
  maps: readonly MapRecord[],
  cache: MapInfoCache
): Map<number, MapperMapRecord> {
  const records = new Map<number, MapperMapRecord>();

  for (const map of maps) {
    const cached = cache[map.b]!;
    if (!cached.owners || cached.owners.length === 0) {
      logError('Owners array missing', map);
      continue;
    }

    const hours = hoursSince(cached.last_updated);
    const xAge = (map.x / hours) * 10_000;
    const xAdj = overweightness(map.x, map.adj, hours);

    const existing = records.get(cached.id);
    if (!existing) {
      records.set(cached.id, {
        id: cached.id,
        x: map.x,
        xAge,
        pp: map.pp99,
        m: map.m,
        xAdj,
        ppAdj: map.pp99,
        mAdj: map.m,
      });
      continue;
    }
    // `xAge` peaks on the same combo as `x` (the age divisor is constant per beatmap).
    if (map.x > existing.x) {
      existing.x = map.x;
      existing.xAge = xAge;
      existing.pp = map.pp99;
      existing.m = map.m;
    }
    if (xAdj > existing.xAdj) {
      existing.xAdj = xAdj;
      existing.ppAdj = map.pp99;
      existing.mAdj = map.m;
    }
  }

  return records;
}

/** Accumulates farmability points per mapper over all maps they own (incl. guest diffs). */
function collectPpMappers(maps: readonly MapRecord[], cache: MapInfoCache): PpMapper[] {
  const records = reduceToBeatmapRecords(maps, cache);
  const mappers = new Map<number, PpMapper>();

  for (const record of records.values()) {
    for (const owner of cache[record.id]!.owners!) {
      const mapper = mappers.get(owner.id);
      if (!mapper) {
        mappers.set(owner.id, {
          name: owner.username,
          id: owner.id,
          mapsRecorded: [record],
          points: record.x,
          pointsAge: record.xAge,
          pointsAdj: record.xAdj,
        });
        continue;
      }
      // Display the name the mapper used on their most recent map
      if (record.id > Math.max(...mapper.mapsRecorded.map((m) => m.id))) {
        mapper.name = owner.username;
      }
      // `owners` can list the same mapper id more than once (under different names) — count it once
      if (!mapper.mapsRecorded.some((m) => m.id === record.id)) {
        mapper.mapsRecorded.push(record);
        mapper.points += record.x;
        mapper.pointsAge += record.xAge;
        mapper.pointsAdj += record.xAdj;
      }
    }
  }

  return [...mappers.values()];
}

interface MapperStats {
  userId: number;
  names: string[];
  playcount: number;
  favs: number;
  /** ranked maps of this mode in the cache */
  count: number;
  /** ranked mapsets of this mode in the cache */
  mapsets: number;
  favourites?: FavouriteRecord[];
}

interface FavouriteRecord {
  /** mapset host */
  user_id: number;
  creator: string;
  id: number;
  artist: string;
  title: string;
  ranked_date: string | null;
  cover: string | undefined;
}

/** Groups all cached maps by mapset host and sums playcounts/favourites per mapper. */
function collectMapperStats(cache: MapInfoCache, mode: Mode): MapperStats[] {
  const mapsPerMapper = new Map<number, CachedBeatmap[]>();
  for (const cached of Object.values(cache)) {
    const list = mapsPerMapper.get(cached.user_id);
    if (list) {
      list.push(cached);
    } else {
      mapsPerMapper.set(cached.user_id, [cached]);
    }
  }

  const stats: MapperStats[] = [];
  for (const [userId, allMaps] of mapsPerMapper) {
    const maps = allMaps.filter((map) => map.mode_int === mode.id);
    if (maps.length === 0) continue;

    const mapsets = uniqBy(maps, (map) => map.beatmapset_id);
    stats.push({
      userId,
      names: uniqBy(maps, (map) => map.beatmapset.creator).map((map) => map.beatmapset.creator),
      playcount: sumBy(maps, (map) => map.playcount),
      favs: sumBy(mapsets, (map) => map.beatmapset.favourite_count),
      count: maps.length,
      mapsets: mapsets.length,
    });
  }
  return stats;
}

/** Writes informal text top-51 lists by playcount and by favourites. */
function writeTextTops(stats: readonly MapperStats[], mode: Mode): void {
  const byPlaycount = [...stats].sort((a, b) => b.playcount - a.playcount).slice(0, 51);
  const byFavs = [...stats].sort((a, b) => b.favs - a.favs).slice(0, 51);
  writeFile(
    files.mappersPlaycountTxt(mode),
    byPlaycount.map((s) => `${s.names.join('/')}\t${(s.playcount / 1_000_000).toFixed(0)}`).join('\n')
  );
  writeFile(
    files.mappersFavsTxt(mode),
    byFavs.map((s) => `${s.names.join('/')}\t${s.favs.toFixed(0)}`).join('\n')
  );
}

async function fetchFavourites(voters: MapperStats[]): Promise<void> {
  await runJobs({
    items: voters,
    minJobTime: DELAY_BETWEEN_MAPPERS_MS,
    job: async (voter) => {
      try {
        const favourites = await fetchUserFavourites(voter.userId);
        voter.favourites = favourites.map((favourite) => ({
          user_id: favourite.user_id,
          creator: favourite.creator,
          id: favourite.id,
          artist: favourite.artist,
          title: favourite.title,
          ranked_date: favourite.ranked_date,
          cover: favourite.covers?.list,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logError(`User ${voter.userId} (${voter.names[0]}):`, message);
      }
    },
  });
}

/**
 * Counts weighted "votes": every favourite of a voting mapper is a vote for the favored
 * mapset's host (self-favs ignored). Writes the favored-mappers ranking and a per-mapper
 * list of their favored mapsets.
 */
async function writeFavoredMappers(voters: readonly MapperStats[], mode: Mode): Promise<void> {
  interface FavoredMapset {
    count: number;
    cover: string | undefined;
    id: number;
    artist: string;
    title: string;
    ranked_date: string | null;
  }
  interface FavoredMapper {
    count: number;
    mapperId: number;
    weightPerName: Map<string, number>;
    mapsets: Map<number, FavoredMapset>;
  }

  const favoredMappers = new Map<number, FavoredMapper>();

  for (const voter of voters) {
    if (!voter.favourites) continue;
    // 3 ranked mapsets -> 0.3 votes, 10+ ranked mapsets -> 1 vote
    const weight = Math.min(1, voter.mapsets / MAPSETS_FOR_FULL_VOTE);

    for (const favourite of voter.favourites) {
      const favoredMapperId = favourite.user_id;
      if (favoredMapperId === voter.userId) continue;

      let favored = favoredMappers.get(favoredMapperId);
      if (!favored) {
        favored = { count: 0, mapperId: favoredMapperId, weightPerName: new Map(), mapsets: new Map() };
        favoredMappers.set(favoredMapperId, favored);
      }
      favored.count += weight;
      favored.weightPerName.set(
        favourite.creator,
        (favored.weightPerName.get(favourite.creator) ?? 0) + weight
      );

      const mapset = favored.mapsets.get(favourite.id);
      if (mapset) {
        mapset.count += weight;
      } else {
        favored.mapsets.set(favourite.id, {
          count: weight,
          cover: favourite.cover,
          id: favourite.id,
          artist: favourite.artist,
          title: favourite.title,
          ranked_date: favourite.ranked_date,
        });
      }
    }
  }

  for (const favored of favoredMappers.values()) {
    const mapsetsSorted = [...favored.mapsets.values()].sort((a, b) => b.count - a.count);
    await writeJson(files.favoredMappersMaps(mode, favored.mapperId), mapsetsSorted);
  }

  const ranking = [...favoredMappers.values()]
    .sort((a, b) => b.count - a.count)
    .map((favored) => ({
      count: favored.count,
      mapperId: favored.mapperId,
      names: [...favored.weightPerName.entries()]
        .sort(([, weightA], [, weightB]) => weightB - weightA)
        .map(([name]) => name),
    }));
  await writeJson(files.favoredMappers(mode), ranking);
}
