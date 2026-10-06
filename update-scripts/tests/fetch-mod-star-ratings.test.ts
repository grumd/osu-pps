import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mock, test } from 'node:test';

import type { OsuApiBeatmap } from '../src/osu-api/types.ts';
import type { MapInfoCache, MapRecord, ModStarRatingsCache } from '../src/data/types.ts';
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

class NotFoundError extends Error {}

/** Star rating returned by the mocked API; `algorithmBonus` simulates an algorithm change. */
let algorithmBonus = 0;
const apiStarRating = (beatmapId: number, mods: number) =>
  beatmapId + mods / 1000 + algorithmBonus;

const fetchBeatmapStarRating = mock.fn(
  async (beatmapId: number, mods: number, _mode: unknown) => apiStarRating(beatmapId, mods)
);
mock.module(srcUrl('osu-api/api.ts'), { namedExports: { fetchBeatmapStarRating } });
mock.module(srcUrl('osu-api/http.ts'), {
  namedExports: { isNotFoundError: (error: unknown) => error instanceof NotFoundError },
});

const { fetchModStarRatings } = await import('../src/steps/fetch-mod-star-ratings.ts');
const { files } = await import('../src/paths.ts');
const { modes } = await import('../src/modes.ts');
const { modBits } = await import('../src/utils/mods.ts');

const { HD, HR, DT, FL } = modBits;

const mapRecord = (b: number, m: number, x = 10): MapRecord => ({ m, b, x, pp99: 300, adj: 5 });

const mapInfoOf = (
  beatmaps: Array<[id: number, difficultyRating: number, modeInt?: number]>
): MapInfoCache =>
  Object.fromEntries(
    beatmaps.map(([id, difficultyRating, modeInt = 0]) => [
      id,
      { id, difficulty_rating: difficultyRating, mode_int: modeInt } as OsuApiBeatmap,
    ])
  );

const fetchedRequests = () =>
  fetchBeatmapStarRating.mock.calls.map(
    ({ arguments: [beatmapId, mods] }) => `${beatmapId}+${mods}`
  );

function reset(mode: (typeof modes)[keyof typeof modes]) {
  fs.rmSync(files.modStarRatingsCache(mode), { force: true });
  fetchBeatmapStarRating.mock.resetCalls();
  fetchBeatmapStarRating.mock.restore();
  algorithmBonus = 0;
}

const quietly = async <T>(fn: () => Promise<T>): Promise<T> => {
  const log = mock.method(console, 'log', () => {});
  const error = mock.method(console, 'error', () => {});
  const warn = mock.method(console, 'warn', () => {});
  try {
    return await fn();
  } finally {
    log.mock.restore();
    error.mock.restore();
    warn.mock.restore();
  }
};

test('fetches only star-rating-affecting mod combos, most farmable maps first', async () => {
  reset(modes.osu);
  const mapInfo = mapInfoOf([
    [1, 5],
    [2, 6],
  ]);
  const maps = [
    mapRecord(1, 0), // no-mod star rating is difficulty_rating — not fetched
    mapRecord(1, HD),
    mapRecord(1, DT),
    mapRecord(2, HD + DT, 50),
    mapRecord(2, HD + DT, 20), // duplicate combo — fetched once
    mapRecord(3, DT), // not in the beatmap cache — skipped
  ];

  const starRatingOf = await quietly(() => fetchModStarRatings(modes.osu, maps, mapInfo));

  assert.deepEqual(fetchedRequests(), [`2+${HD + DT}`, `1+${HD}`, `1+${DT}`]);
  assert.equal(fetchBeatmapStarRating.mock.calls[0]!.arguments[2], modes.osu);
  assert.equal(starRatingOf(1, HD).starRating, apiStarRating(1, HD));
  assert.equal(starRatingOf(2, HD + DT).starRating, apiStarRating(2, HD + DT));
  assert.deepEqual(starRatingOf(1, 0), { starRating: undefined, pending: false });
  // not fetched yet, but HR changes the star rating
  assert.deepEqual(starRatingOf(1, HR), { starRating: undefined, pending: true });

  const cache = readJsonFile<ModStarRatingsCache>(files.modStarRatingsCache(modes.osu));
  assert.deepEqual(cache.beatmaps['1'], {
    nm: 5,
    sr: { [HD]: apiStarRating(1, HD), [DT]: apiStarRating(1, DT) },
  });
  assert.deepEqual(cache.outdated, {});
});

test('fetches no-mod for converts and ignores HD/FL outside osu!', async () => {
  reset(modes.taiko);
  const mapInfo = mapInfoOf([
    [10, 4, 0], // converted from osu!
    [11, 3, 1], // taiko map
  ]);
  const maps = [
    mapRecord(10, 0),
    mapRecord(10, HD + FL), // same star rating as no-mod in taiko
    mapRecord(11, HD), // same as no-mod of a taiko map — nothing to fetch
    mapRecord(11, HD + DT),
  ];

  const starRatingOf = await quietly(() => fetchModStarRatings(modes.taiko, maps, mapInfo));

  assert.deepEqual(fetchedRequests().sort(), ['10+0', `11+${DT}`]);
  assert.equal(starRatingOf(10, HD + FL).starRating, apiStarRating(10, 0));
  assert.equal(starRatingOf(11, HD + DT).starRating, apiStarRating(11, DT));
  assert.deepEqual(starRatingOf(11, HD), { starRating: undefined, pending: false });
});

test('later runs only refetch canaries and fill in new maps', async () => {
  reset(modes.osu);
  const mapInfo = mapInfoOf([
    [1, 5],
    [2, 6],
  ]);
  const maps = [mapRecord(1, DT), mapRecord(1, HR), mapRecord(2, DT)];
  await quietly(() => fetchModStarRatings(modes.osu, maps, mapInfo));
  fetchBeatmapStarRating.mock.resetCalls();

  // a new map entered the list
  const newMapInfo = { ...mapInfo, ...mapInfoOf([[3, 7]]) };
  const starRatingOf = await quietly(() =>
    fetchModStarRatings(modes.osu, [...maps, mapRecord(3, DT)], newMapInfo)
  );

  // 3 canaries (everything cached), then only the new map
  assert.deepEqual(fetchedRequests().slice(0, 3).sort(), [`1+${HR}`, `1+${DT}`, `2+${DT}`]);
  assert.deepEqual(fetchedRequests().slice(3), [`3+${DT}`]);
  assert.equal(starRatingOf(3, DT).starRating, apiStarRating(3, DT));
});

test('refetches a beatmap when its no-mod star rating changes, showing old values meanwhile', async () => {
  reset(modes.osu);
  const maps = [mapRecord(1, DT), mapRecord(1, HR), mapRecord(2, DT)];
  await quietly(() =>
    fetchModStarRatings(
      modes.osu,
      maps,
      mapInfoOf([
        [1, 5],
        [2, 6],
      ])
    )
  );
  fetchBeatmapStarRating.mock.resetCalls();

  // beatmap 1 changed; the first refetch fails, the second works
  let failedOnce = false;
  fetchBeatmapStarRating.mock.mockImplementation(async (beatmapId: number, mods: number) => {
    if (beatmapId === 1 && mods === DT && !failedOnce) {
      failedOnce = true;
      throw new NotFoundError('404');
    }
    return apiStarRating(beatmapId, mods) + (beatmapId === 1 ? 1 : 0);
  });
  const changedMapInfo = mapInfoOf([
    [1, 5.5],
    [2, 6],
  ]);
  const starRatingOf = await quietly(() => fetchModStarRatings(modes.osu, maps, changedMapInfo));

  // only beatmap 2 is left as a canary, beatmap 1 is refetched
  assert.deepEqual(fetchedRequests(), [`2+${DT}`, `1+${DT}`, `1+${HR}`]);
  assert.equal(starRatingOf(1, HR).starRating, apiStarRating(1, HR) + 1);
  // the failed one falls back to the outdated value
  assert.equal(starRatingOf(1, DT).starRating, apiStarRating(1, DT));

  let cache = readJsonFile<ModStarRatingsCache>(files.modStarRatingsCache(modes.osu));
  assert.equal(cache.beatmaps['1']!.nm, 5.5);
  assert.ok(cache.outdated['1']);

  // the next run fills in the missing one and drops the outdated entry
  fetchBeatmapStarRating.mock.resetCalls();
  const nextStarRatingOf = await quietly(() =>
    fetchModStarRatings(modes.osu, maps, changedMapInfo)
  );
  assert.ok(fetchedRequests().includes(`1+${DT}`));
  assert.equal(nextStarRatingOf(1, DT).starRating, apiStarRating(1, DT) + 1);
  cache = readJsonFile<ModStarRatingsCache>(files.modStarRatingsCache(modes.osu));
  assert.deepEqual(cache.outdated, {});
});

test('refetches everything when the canaries detect an algorithm change', async () => {
  reset(modes.osu);
  const mapInfo = mapInfoOf(Array.from({ length: 20 }, (_, i) => [i + 1, 5] as [number, number]));
  const maps = Array.from({ length: 20 }, (_, i) => mapRecord(i + 1, DT));
  await quietly(() => fetchModStarRatings(modes.osu, maps, mapInfo));
  fetchBeatmapStarRating.mock.resetCalls();

  algorithmBonus = 0.5;
  let fetchesLeft = 10 + 5; // 10 canaries, then only 5 maps get refetched (e.g. out of time)
  fetchBeatmapStarRating.mock.mockImplementation(async (beatmapId: number, mods: number) => {
    if (fetchesLeft-- <= 0) throw new Error('api down');
    return apiStarRating(beatmapId, mods);
  });
  const starRatingOf = await quietly(() => fetchModStarRatings(modes.osu, maps, mapInfo));

  assert.equal(fetchBeatmapStarRating.mock.callCount(), 10 + 20);
  const values = maps.map((map) => starRatingOf(map.b, map.m).starRating);
  const refetched = values.filter((value, i) => value === apiStarRating(i + 1, DT));
  // 5 new values; the rest show the old (or canary-updated) values until refetched
  assert.ok(refetched.length >= 5);
  assert.ok(values.every((value) => value !== undefined));
  const cache = readJsonFile<ModStarRatingsCache>(files.modStarRatingsCache(modes.osu));
  assert.equal(Object.keys(cache.beatmaps).length, 5);
});

test('a single changed canary is not treated as an algorithm change', async () => {
  reset(modes.osu);
  const mapInfo = mapInfoOf(Array.from({ length: 20 }, (_, i) => [i + 1, 5] as [number, number]));
  const maps = Array.from({ length: 20 }, (_, i) => mapRecord(i + 1, DT));
  await quietly(() => fetchModStarRatings(modes.osu, maps, mapInfo));
  fetchBeatmapStarRating.mock.resetCalls();

  let changedBeatmapId: number | undefined;
  fetchBeatmapStarRating.mock.mockImplementation(async (beatmapId: number, mods: number) => {
    changedBeatmapId ??= beatmapId;
    return apiStarRating(beatmapId, mods) + (beatmapId === changedBeatmapId ? 0.3 : 0);
  });
  const starRatingOf = await quietly(() => fetchModStarRatings(modes.osu, maps, mapInfo));

  assert.equal(fetchBeatmapStarRating.mock.callCount(), 10); // canaries only
  assert.equal(starRatingOf(changedBeatmapId!, DT).starRating, apiStarRating(changedBeatmapId!, DT) + 0.3);
});

test('canaries are spread over mod combos and the star rating range', async () => {
  reset(modes.osu);
  const ids = Array.from({ length: 30 }, (_, i) => i + 1);
  const mapInfo = mapInfoOf(ids.map((id) => [id, 5] as [number, number]));
  // DT on all 30 maps, HR on 20, FL on 5
  const maps = [
    ...ids.map((id) => mapRecord(id, DT)),
    ...ids.slice(0, 20).map((id) => mapRecord(id, HR)),
    ...ids.slice(0, 5).map((id) => mapRecord(id, FL)),
  ];
  await quietly(() => fetchModStarRatings(modes.osu, maps, mapInfo));
  fetchBeatmapStarRating.mock.resetCalls();

  await quietly(() => fetchModStarRatings(modes.osu, maps, mapInfo));

  const canaries = fetchedRequests();
  assert.equal(canaries.length, 10);
  const dtCanaries = canaries.filter((request) => request.endsWith(`+${DT}`));
  assert.equal(dtCanaries.length, 4);
  assert.equal(canaries.filter((request) => request.endsWith(`+${HR}`)).length, 3);
  assert.equal(canaries.filter((request) => request.endsWith(`+${FL}`)).length, 3);
  // evenly spread over the 30 DT star ratings
  assert.deepEqual(
    dtCanaries.map((request) => Number(request.split('+')[0])),
    [4, 12, 19, 27]
  );
});

test('stops fetching after the time budget and continues on the next run', async (t) => {
  reset(modes.mania);
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-06-10T00:00:00Z') });
  fetchBeatmapStarRating.mock.mockImplementation(async (beatmapId: number, mods: number) => {
    t.mock.timers.tick(75 * 60 * 1000);
    return apiStarRating(beatmapId, mods);
  });
  const mapInfo = mapInfoOf(
    Array.from({ length: 5 }, (_, i) => [i + 1, 5, 3] as [number, number, number])
  );
  const maps = Array.from({ length: 5 }, (_, i) => mapRecord(i + 1, DT));

  // 75 minutes per fetch, 3 hour budget: the 4th fetch would start after 225 minutes
  const firstStarRatingOf = await quietly(() => fetchModStarRatings(modes.mania, maps, mapInfo));
  assert.equal(fetchBeatmapStarRating.mock.callCount(), 3);
  assert.deepEqual(
    maps.map((map) => firstStarRatingOf(map.b, map.m).pending),
    [false, false, false, true, true]
  );

  fetchBeatmapStarRating.mock.resetCalls();
  const starRatingOf = await quietly(() => fetchModStarRatings(modes.mania, maps, mapInfo));
  // 3 canaries, then the 2 remaining maps
  assert.equal(fetchBeatmapStarRating.mock.callCount(), 5);
  assert.ok(maps.every((map) => starRatingOf(map.b, map.m).starRating !== undefined));
});

test('a corrupt cache file is treated as empty', async () => {
  reset(modes.fruits);
  fs.mkdirSync(`${dirs.tempDir}/fruits`, { recursive: true });
  fs.writeFileSync(files.modStarRatingsCache(modes.fruits), 'not valid json');

  const starRatingOf = await quietly(() =>
    fetchModStarRatings(modes.fruits, [mapRecord(1, DT)], mapInfoOf([[1, 5, 2]]))
  );
  assert.deepEqual(fetchedRequests(), [`1+${DT}`]);
  assert.equal(starRatingOf(1, DT).starRating, apiStarRating(1, DT));
});
