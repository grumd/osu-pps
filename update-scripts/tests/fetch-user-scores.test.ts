import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mock, test } from 'node:test';

import type { OsuApiScore } from '../src/osu-api/types.ts';
import type { BeatmapScoreStats, MapRecord } from '../src/data/types.ts';
import {
  mockConfigModule,
  mockTimingsModule,
  readJsonFile,
  setupTestDirs,
  srcUrl,
} from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

const makeScore = (over: Partial<OsuApiScore>): OsuApiScore => ({
  id: 9000,
  user_id: 0,
  beatmap_id: 100,
  ruleset_id: 0,
  accuracy: 0.99,
  pp: 100,
  max_combo: 500,
  rank: 'S',
  mods: [],
  statistics: { great: 100, ok: 10, meh: 1, miss: 2 },
  ended_at: '2026-01-01T00:00:00Z',
  passed: true,
  total_score: 1_000_000,
  legacy_total_score: 0,
  legacy_score_id: null,
  ...over,
});

const scoresByUser: Record<number, OsuApiScore[]> = {
  // top user: two scores on the same map+mods (different accuracy), one with NC+HD
  1: [
    makeScore({
      id: 11,
      user_id: 1,
      beatmap_id: 100,
      accuracy: 0.991,
      pp: 400,
      max_combo: 1000,
      mods: [{ acronym: 'HD' }, { acronym: 'NC' }, { acronym: 'CL' }],
    }),
    makeScore({
      id: 12,
      user_id: 1,
      beatmap_id: 100,
      accuracy: 0.9915, // same 99.1 bucket, lower combo — must not replace score 11
      pp: 390,
      max_combo: 900,
      mods: [{ acronym: 'HD' }, { acronym: 'NC' }],
    }),
    makeScore({ id: 13, user_id: 1, beatmap_id: 200, accuracy: 0.95, pp: 300 }),
  ],
  // 0.04pp below user 1 — must be skipped entirely
  2: [makeScore({ id: 21, user_id: 2 })],
  // a score without pp (still processing) — must be ignored
  3: [
    makeScore({ id: 31, user_id: 3, beatmap_id: 100, pp: null }),
    makeScore({
      id: 32,
      user_id: 3,
      beatmap_id: 100,
      accuracy: 0.97,
      pp: 350,
      max_combo: 800,
      mods: [{ acronym: 'HD' }, { acronym: 'DT' }],
    }),
  ],
};

const fetchUserBestScores = mock.fn(async (userId: number) => {
  if (userId === 4) {
    throw new Error('Request failed with status code 404');
  }
  return scoresByUser[userId] ?? [];
});
mock.module(srcUrl('osu-api/api.ts'), { namedExports: { fetchUserBestScores } });

const { fetchUserScores, estimatePp99 } = await import('../src/steps/fetch-user-scores.ts');
const { files } = await import('../src/paths.ts');
const { modes } = await import('../src/modes.ts');

const users = [
  { name: 'one', id: 1, pp: 9000 },
  { name: 'one-dupe', id: 1, pp: 9000 }, // duplicate id — removed by uniqBy
  { name: 'two', id: 2, pp: 8999.96 }, // 0.04pp below user 1 — skipped, folded into user 1
  { name: 'five', id: 5, pp: 8999.93 }, // 0.03pp below user 2 — also skipped into user 1 (so its weight is 3)
  { name: 'three', id: 3, pp: 8000 },
  { name: 'four-restricted', id: 4, pp: 7000 }, // API returns 404
];
fs.mkdirSync(`${dirs.tempDir}/osu`, { recursive: true });
fs.writeFileSync(files.userIdsList(modes.osu), JSON.stringify(users));

await fetchUserScores(modes.osu);

const mapsList = readJsonFile<MapRecord[]>(files.mapsList(modes.osu));

test('skips duplicate users, near-identical pp users, and restricted users', () => {
  // only users 1, 3 and 4 are fetched; 4 fails with 404
  assert.equal(fetchUserBestScores.mock.callCount(), 3);
  const fetchedIds = fetchUserBestScores.mock.calls.map((call) => call.arguments[0]);
  assert.deepEqual(fetchedIds, [1, 3, 4]);
});

test('aggregates farmability per map+mods combination, weighted by represented users', () => {
  // user 1 mods HD+NC+CL -> legacy bitmask 72 (HD 8 + DT 64); user 3 HD+DT -> the same combo
  const map100 = mapsList.find((map) => map.b === 100 && map.m === 72);
  assert.ok(map100);
  // user 1 carries weight 3 (itself + skipped users 2 and 5); user 3 carries weight 1.
  // user 1: indexes 0 and 1; user 3: index 0 (null-pp score is filtered out first).
  // magnitude(0) = 1, magnitude(1) = 0.9801^20 ≈ 0.669
  // x = 3 * (1 + 0.669) + 1 * 1 = 6.007 -> 6.00
  assert.equal(map100.x, 6);
  // nomod map from user 1's third score
  const map200 = mapsList.find((map) => map.b === 200 && map.m === 0);
  assert.ok(map200);
});

test('estimates pp99 from the recorded accuracy buckets', () => {
  const map200 = mapsList.find((map) => map.b === 200)!;
  // single bucket: acc 95, pp 300 -> 300 * 95 / 1 / 99 = 287.87...
  assert.equal(map200.pp99, 287.87);
  // defensive guard: a map with no recorded buckets estimates 0
  assert.equal(estimatePp99(new Map()), 0);

  // ties on combo are broken by closeness to 99% accuracy
  const stats = (pp: number) => ({
    maxcombo: 500,
    statistics: {
      count_300: 1,
      count_100: 0,
      count_50: 0,
      count_miss: 0,
      count_katu: 0,
      count_geki: 0,
    },
    user_id: 1,
    score_id: 1,
    rank: 'S',
    pp,
  });
  const tied = estimatePp99(
    new Map([
      [95, stats(100)],
      [98.9, stats(200)],
    ])
  );
  // both buckets are sampled: (200*98.9 + 100*95) / 2 / 99
  assert.equal(tied, Math.floor(((200 * 98.9 + 100 * 95) / 2 / 99) * 100) / 100);
});

test('writes per-accuracy score stats with legacy statistics and the best combo', () => {
  const stats = readJsonFile<Record<string, BeatmapScoreStats>>(
    files.beatmapScores(modes.osu, '100_72')
  );
  // two buckets: 99.1 (user 1) and 97 (user 3)
  assert.deepEqual(Object.keys(stats).sort(), ['97', '99.1']);
  // the higher-combo score won the 99.1 bucket
  assert.equal(stats['99.1']!.score_id, 11);
  assert.equal(stats['99.1']!.maxcombo, 1000);
  assert.deepEqual(stats['99.1']!.statistics, {
    count_300: 100,
    count_100: 10,
    count_50: 1,
    count_miss: 2,
    count_katu: 0,
    count_geki: 0,
  });
});

test('records compressed per-user score strings with the full mods bitmask', () => {
  const userScores = readJsonFile<Record<string, string[]>>(files.userScoresList(modes.osu));
  assert.deepEqual(userScores['1'], ['100_72_400', '100_72_390', '200_0_300']);
  assert.deepEqual(userScores['3'], ['100_72_350']);
  assert.equal(userScores['4'], undefined);

  const dates = readJsonFile<Record<string, number>>(files.userScoresDates(modes.osu));
  const nowMinutes = Math.floor(Date.now() / 1000 / 60);
  assert.ok(Math.abs(dates['1']! - nowMinutes) <= 1);
});

test('weights pp blocks by represented users so adj reflects the real, un-skipped player count', () => {
  const blocks = readJsonFile<Array<number | null>>(files.ppBlocks(modes.osu));
  // user 1 (weight 3 = itself + skipped users 2 and 5): top scores avg = (400+390+300)/10 = 109 -> block 21
  // user 3 (weight 1): 350/10 = 35 -> block 7
  // The skipped users 2 and 5 are counted in their representative's block, not dropped.
  assert.equal(blocks[21], 3);
  assert.equal(blocks[7], 1);

  // Invariant: block totals account for every represented real user exactly once.
  // users 1 + 2 + 5 (block 21) and user 3 (block 7) = 4; restricted user 4 errored before
  // recording, so it contributes nothing.
  const totalRecorded = blocks.reduce<number>((sum, count) => sum + (count ?? 0), 0);
  assert.equal(totalRecorded, 4);

  // adj is the (weighted) player count at each map's level
  for (const map of mapsList) {
    assert.ok(map.adj >= 1);
  }
});
