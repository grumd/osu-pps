import { DEBUG } from '../config.ts';
import { DELAY_BETWEEN_USERS_MS } from '../timings.ts';
import type { Mode } from '../modes.ts';
import { files } from '../paths.ts';
import { fetchUserBestScores } from '../osu-api/api.ts';
import { toLegacyStatistics } from '../osu-api/statistics.ts';
import type {
  BeatmapScoreStats,
  LegacyScoreStatistics,
  MapRecord,
  UserListEntry,
  UserScoreDatesFile,
  UserScoresFile,
} from '../data/types.ts';
import { readJson, writeJson } from '../utils/io.ts';
import { modAcronymsToBitmask, simplifyMods } from '../utils/mods.ts';
import { truncateFloat, uniqBy } from '../utils/misc.ts';
import { runJobs } from '../utils/run-jobs.ts';
import { SHARD_COUNTS, writeShards } from '../utils/shards.ts';

/** Users are grouped into pp blocks of this size (average pp of their top maps / 5). */
const PP_BLOCK_SIZE = 5;
/** How many of a user's top scores are averaged to find their pp block. */
const PP_BLOCK_MAP_COUNT = 10;
/** Full top-100 lists (and per-user score records for rankings) for this many top users. */
const USERS_WITH_FULL_SCORES = 11_000;
/** Users whose pp total is closer than this to the previous user's are skipped. */
const MIN_PP_GAP_BETWEEN_USERS = 0.05;
/** How many accuracy buckets are averaged for the pp99 estimate. */
const PP99_SAMPLE_SIZE = 7;
/** Half-width (in pp blocks) of the window used to smooth the player histogram. */
const PP_BLOCK_SMOOTHING_WINDOW = 2;

/** A user's best score, normalized to the values the pipeline works with. */
interface NormalizedScore {
  beatmapId: number;
  scoreId: number;
  userId: number;
  /** percentage, 0..100 */
  accuracy: number;
  pp: number;
  maxCombo: number;
  rank: string;
  statistics: LegacyScoreStatistics;
  /** full legacy mods bitmask (before removing non-pp mods) */
  mods: number;
  /** pp-affecting mods only — used to group scores into map+mods combinations */
  simplifiedMods: number;
}

/**
 * The weight a score contributes to a map's farmability based on its position in the
 * user's best-scores list: 1.0 for the top score, decaying rapidly to ~0 past index ~20.
 */
const magnitudeByIndex = (index: number) => Math.pow(Math.pow(index - 100, 2) / 10_000, 20);

/**
 * Step 2: fetches the best scores of every user and aggregates them into:
 * - the map+mods list with farmability scores and pp99 estimates (`maps.json`),
 * - per-accuracy score samples for every map+mods combination (`maps-scores/*.json`),
 * - the pp-block histogram of the player base (`pp-blocks.json`),
 * - per-user compressed score lists for the rankings step (`user-scores.json`).
 */
export async function fetchUserScores(mode: Mode): Promise<void> {
  console.log(`2. FETCHING USERS' BEST SCORES - ${mode.text}`);

  const fullUsersList = await readJson<UserListEntry[]>(files.userIdsList(mode));
  fullUsersList.sort((a, b) => b.pp - a.pp);

  let allUsers = uniqBy(fullUsersList, (user) => user.id);
  if (DEBUG) allUsers = allUsers.slice(0, 100);
  console.log(`Loaded ${allUsers.length} users, reducing the number of users to fetch`);
  // Skip users with near-identical pp totals to cut down on requests. The catch: players are
  // packed far more densely in pp at low/mid skill than at the top, so a fixed pp gap removes a
  // much larger fraction of low/mid players. This deflates farmability (`x`)
  // and player-base (`usersPerPpBlock`) at low/mid levels and biases overweightness toward the
  // hard maps. To fix this, each player has `weight` = how many skipped, near-identical-pp users
  // it represents.
  const users: { user: UserListEntry; weight: number }[] = [];
  for (const [index, user] of allUsers.entries()) {
    if (index === 0 || user.pp < allUsers[index - 1]!.pp - MIN_PP_GAP_BETWEEN_USERS) {
      users.push({ user, weight: 1 });
    } else {
      // Near-identical pp to the previous user — fold into the last kept representative
      users[users.length - 1]!.weight += 1;
    }
  }
  console.log(`Reduced to ${users.length} kept users (representing ${allUsers.length} total)`);

  // mapModId ("<beatmapId>_<simplifiedMods>") -> aggregated farmability
  const maps = new Map<string, { m: number; b: number; x: number }>();
  // mapModId -> (accuracy bucket -> best-combo score in that bucket)
  const scoreStatsPerMap = new Map<string, Map<number, BeatmapScoreStats>>();
  const userScores: UserScoresFile = {};
  const userScoreDates: UserScoreDatesFile = {};
  // pp block index -> weighted number of users in that block
  const usersPerPpBlock: number[] = [];

  const recordScores = (scores: NormalizedScore[], weight: number) => {
    // Count the user — and the skipped near-pp users it represents — into their pp block
    // (average pp of their top scores / block size)
    const topPpSum = scores.slice(0, PP_BLOCK_MAP_COUNT).reduce((sum, score) => sum + score.pp, 0);
    const ppBlock = Math.floor(Math.round(topPpSum / PP_BLOCK_MAP_COUNT) / PP_BLOCK_SIZE);
    usersPerPpBlock[ppBlock] = (usersPerPpBlock[ppBlock] ?? 0) + weight;

    for (const [index, score] of scores.entries()) {
      const mapModId = `${score.beatmapId}_${score.simplifiedMods}`;
      const magnitude = weight * magnitudeByIndex(index);
      const map = maps.get(mapModId);
      if (map) {
        map.x += magnitude;
      } else {
        maps.set(mapModId, {
          m: score.simplifiedMods,
          b: score.beatmapId,
          x: magnitude,
        });
      }

      // Keep the highest-combo score per accuracy bucket (XX.X%) for the pp-by-accuracy data
      const accuracyBucket = truncateFloat(score.accuracy, 1);
      const stats: BeatmapScoreStats = {
        maxcombo: score.maxCombo,
        statistics: score.statistics,
        user_id: score.userId,
        score_id: score.scoreId,
        rank: score.rank,
        pp: score.pp,
      };
      const buckets = scoreStatsPerMap.get(mapModId);
      if (!buckets) {
        scoreStatsPerMap.set(mapModId, new Map([[accuracyBucket, stats]]));
      } else {
        const existing = buckets.get(accuracyBucket);
        if (!existing || existing.maxcombo < stats.maxcombo) {
          buckets.set(accuracyBucket, stats);
        }
      }
    }
  };

  const processUser = async (
    { user, weight }: { user: UserListEntry; weight: number },
    index: number
  ) => {
    const shouldRecordScores = index < USERS_WITH_FULL_SCORES;
    try {
      const apiScores = await fetchUserBestScores(user.id, mode, shouldRecordScores ? 100 : 20);
      const scores: NormalizedScore[] = apiScores
        .filter((score) => score.pp != null)
        .map((score) => ({
          beatmapId: score.beatmap_id,
          scoreId: score.id,
          userId: score.user_id,
          accuracy: score.accuracy * 100,
          pp: score.pp!,
          maxCombo: score.max_combo,
          rank: score.rank,
          statistics: toLegacyStatistics(score.statistics, mode.id),
          mods: modAcronymsToBitmask(score.mods.map((mod) => mod.acronym)),
          simplifiedMods: simplifyMods(
            modAcronymsToBitmask(score.mods.map((mod) => mod.acronym)),
            mode.id
          ),
        }));

      if (shouldRecordScores) {
        userScores[user.id] = scores.map((s) => `${s.beatmapId}_${s.mods}_${s.pp}`);
        userScoreDates[user.id] = Math.floor(Date.now() / 1000 / 60); // unix minutes
      }
      recordScores(scores, weight);
    } catch (error) {
      // Restricted users return 404 — log and move on
      const message = error instanceof Error ? error.message : String(error);
      console.log('\x1b[33m%s\x1b[0m', `User ${user.id}: ${message}`);
    }
  };

  console.log('Fetching scores of all users to find the list of popular maps...');
  await runJobs({ items: users, job: processUser, minJobTime: DELAY_BETWEEN_USERS_MS });

  const truncation = findHistogramTruncation(usersPerPpBlock);
  console.log(
    `Player histogram peaks at block ${truncation.block} ` +
      `(${truncation.block * PP_BLOCK_SIZE}-${truncation.block * PP_BLOCK_SIZE + PP_BLOCK_SIZE - 1}pp), ` +
      `using ${truncation.playerCount} players for every block below it`
  );
  /** Number of players who play at a map's level, guarded against the truncated low end. */
  const playersAtLevel = (pp99: number) => {
    const block = Math.floor(Math.round(pp99) / PP_BLOCK_SIZE);
    const counted = usersPerPpBlock[block] ?? 1;
    // Below the peak both numbers are lower bounds on the real player count — the block's own
    // (truncated) tally and the peak's. Take the larger, so a block that happens to have been
    // sampled above the peak is never pushed down and made to look farmier than it is.
    return block <= truncation.block ? Math.max(counted, truncation.playerCount) : counted;
  };

  console.log(`${maps.size} unique map+mods combinations found! Saving.`);
  const mapsList: MapRecord[] = [];
  const scoresPerMap: [string, Record<number, BeatmapScoreStats>][] = [];
  for (const [mapModId, map] of maps) {
    const buckets = scoreStatsPerMap.get(mapModId)!;
    const pp99 = estimatePp99(buckets);
    scoresPerMap.push([mapModId, Object.fromEntries(buckets)]);
    mapsList.push({
      m: map.m,
      b: map.b,
      x: truncateFloat(map.x),
      pp99,
      adj: playersAtLevel(pp99),
    });
  }

  await writeShards({
    directory: files.beatmapScoresDir(mode),
    shardCount: SHARD_COUNTS.mapsScores,
    entries: scoresPerMap,
  });

  await writeJson(files.mapsList(mode), mapsList);
  console.log('Saving info about PP blocks too');
  await writeJson(files.ppBlocks(mode), usersPerPpBlock);
  console.log('Saving users maps list');
  await writeJson(files.userScoresList(mode), userScores);
  await writeJson(files.userScoresDates(mode), userScoreDates);
  console.log(`Done fetching list of beatmaps! (${mode.text})`);
}

/**
 * Finds where the player histogram stops being trustworthy at the low end.
 *
 * The rankings are only walked down to ~1000pp, so the low blocks are missing most of their
 * players and decay to 1. In reality the player base only grows as the level drops — the whole
 * rise on the left of the histogram is an artifact of that cutoff, and its peak marks where the
 * truncation stops biting. Left alone, maps below the tracked skill range divide by `adj = 1`
 * and a single beginner's score is enough to top the farm list.
 *
 * Returns the peak's block index and the player count to use for every block at or below it.
 * The histogram is smoothed first so the peak doesn't hop around the plateau (where neighbouring
 * blocks hold near-identical player counts) on sampling noise alone.
 */
export function findHistogramTruncation(usersPerPpBlock: readonly (number | undefined)[]): {
  block: number;
  playerCount: number;
} {
  // No players recorded at all — leave every block on its own (clamped) count
  if (usersPerPpBlock.length === 0) return { block: -1, playerCount: 1 };

  // `Array.from` rather than `.map` — the histogram is sparse and `.map` would skip the holes
  const smoothed = Array.from({ length: usersPerPpBlock.length }, (_, block) => {
    let sum = 0;
    for (let i = block - PP_BLOCK_SMOOTHING_WINDOW; i <= block + PP_BLOCK_SMOOTHING_WINDOW; i++) {
      sum += usersPerPpBlock[i] ?? 0;
    }
    return sum / (2 * PP_BLOCK_SMOOTHING_WINDOW + 1);
  });

  let peak = 0;
  for (const [block, count] of smoothed.entries()) {
    if (count > smoothed[peak]!) peak = block;
  }

  return { block: peak, playerCount: Math.max(Math.round(smoothed[peak]!), 1) };
}

/**
 * Estimates the pp of a ~99% accuracy play from the recorded accuracy buckets:
 * takes the buckets with the highest combo (ties broken by closeness to 99%),
 * and averages `pp / accuracy` scaled to 99%.
 */
export function estimatePp99(buckets: Map<number, BeatmapScoreStats>): number {
  if (buckets.size === 0) return 0;

  const sorted = [...buckets.entries()].sort(([accuracyA, scoreA], [accuracyB, scoreB]) => {
    // higher combo first
    if (scoreA.maxcombo !== scoreB.maxcombo) return scoreB.maxcombo - scoreA.maxcombo;
    // accuracy closer to 99% second
    return Math.abs(accuracyA - 99) - Math.abs(accuracyB - 99);
  });

  const sample = sorted.slice(0, PP99_SAMPLE_SIZE);
  const ppPerAccuracySum = sample.reduce((sum, [accuracy, score]) => sum + score.pp * accuracy, 0);
  return truncateFloat(ppPerAccuracySum / sample.length / 99);
}
