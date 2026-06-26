import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mock, test } from 'node:test';

import type { OsuApiBeatmap } from '../src/osu-api/types.ts';
import type { CachedBeatmap, DetailedMapRecord, MapRecord } from '../src/data/types.ts';
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

const NOW = new Date('2026-06-10T00:00:00Z');

const makeBeatmap = (id: number, over: Partial<OsuApiBeatmap> = {}): OsuApiBeatmap => ({
  id,
  beatmapset_id: id * 10,
  mode_int: 0,
  version: `diff-${id}`,
  difficulty_rating: 5.5,
  bpm: 180,
  hit_length: 120,
  accuracy: 9,
  ar: 9.5,
  cs: 4,
  drain: 5,
  passcount: 50_000,
  playcount: 1_000_000,
  last_updated: '2024-01-01T00:00:00Z',
  user_id: 777,
  owners: [{ id: 777, username: 'mapper' }],
  beatmapset: {
    id: id * 10,
    artist: `artist-${id}`,
    title: `title-${id}`,
    creator: 'mapper',
    user_id: 777,
    favourite_count: 100,
    ranked_date: '2024-01-01T00:00:00Z',
  },
  ...over,
});

const fetchBeatmaps = mock.fn(async (ids: readonly number[]) => {
  // beatmap 404404 is deleted and never returned
  return ids.filter((id) => id !== 404404).map((id) => makeBeatmap(id));
});
mock.module(srcUrl('osu-api/api.ts'), {
  namedExports: { fetchBeatmaps, BEATMAP_BATCH_SIZE: 50 },
});

const { fetchMapInfo } = await import('../src/steps/fetch-map-info.ts');
const { files } = await import('../src/paths.ts');
const { modes } = await import('../src/modes.ts');

const mapRecord = (b: number, m = 0, over: Partial<MapRecord> = {}): MapRecord => ({
  m,
  b,
  x: 10,
  pp99: 300,
  adj: 5,
  ...over,
});

test('fetches new and stale beatmaps in batches and builds the detailed list', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: NOW });

  // A cached map that is fresh by every rule: cached recently relative to its age,
  // not updated since, has owners, high passcount.
  const freshCached: CachedBeatmap = {
    ...makeBeatmap(1),
    cache_date: '2026-06-09 00:00:00',
    last_updated: '2020-01-01T00:00:00Z',
    beatmapset: { ...makeBeatmap(1).beatmapset, ranked_date: '2020-01-01T00:00:00Z' },
  };
  // Stale: the map was updated after it was cached.
  const updatedAfterCache: CachedBeatmap = {
    ...makeBeatmap(2),
    cache_date: '2025-01-01 00:00:00',
    last_updated: '2025-06-01T00:00:00Z',
    beatmapset: { ...makeBeatmap(2).beatmapset, ranked_date: '2020-01-01T00:00:00Z' },
  };
  // Stale: no owners array (legacy cache entry).
  const noOwners = { ...makeBeatmap(3), cache_date: '2026-06-09 00:00:00' } as CachedBeatmap;
  delete (noOwners as Partial<CachedBeatmap>).owners;
  // Stale: low passcount.
  const lowPasscount: CachedBeatmap = {
    ...freshCached,
    ...makeBeatmap(4),
    cache_date: '2026-06-09 00:00:00',
    last_updated: '2020-01-01T00:00:00Z',
    passcount: 50,
  };
  fs.mkdirSync(`${dirs.tempDir}/osu`, { recursive: true });
  fs.writeFileSync(
    files.mapInfoCache(modes.osu),
    JSON.stringify({ 1: freshCached, 2: updatedAfterCache, 3: noOwners, 4: lowPasscount })
  );

  const maps = [
    mapRecord(1), // fresh in cache — not fetched
    mapRecord(1, 8), // same beatmap, another mod combo — no extra fetch
    mapRecord(2),
    mapRecord(3),
    mapRecord(4),
    mapRecord(5), // not cached at all — fetched
    mapRecord(404404), // deleted — fetched but not returned, then skipped
  ];
  fs.writeFileSync(files.mapsList(modes.osu), JSON.stringify(maps));

  await fetchMapInfo(modes.osu);

  // one batch with the 5 beatmaps that needed fetching
  assert.equal(fetchBeatmaps.mock.callCount(), 1);
  assert.deepEqual(fetchBeatmaps.mock.calls[0]!.arguments[0], [2, 3, 4, 5, 404404]);

  const detailed = readJsonFile<DetailedMapRecord[]>(files.mapsDetailedList(modes.osu));
  // the deleted map is skipped; everything else is enriched
  assert.deepEqual(detailed.map((map) => map.b).sort(), [1, 1, 2, 3, 4, 5]);

  const map5 = detailed.find((map) => map.b === 5)!;
  assert.equal(map5.art, 'artist-5');
  assert.equal(map5.t, 'title-5');
  assert.equal(map5.v, 'diff-5');
  assert.equal(map5.s, 50);
  assert.equal(map5.l, 120);
  assert.equal(map5.bpm, 180);
  assert.equal(map5.d, 5.5);
  assert.equal(map5.p, 50_000);
  // hours from 2024-01-01 to 2026-06-10 (NOW is mocked)
  assert.equal(map5.h, Math.ceil((NOW.getTime() - new Date('2024-01-01T00:00:00Z').getTime()) / 3_600_000));
  assert.equal(map5.appr_h, Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 3_600_000));
  assert.equal(map5.ar, 9.5);
  assert.equal(map5.accuracy, 9);
  assert.equal(map5.cs, 4);
  assert.equal(map5.drain, 5);
  assert.equal(map5.mapper_id, 777);
  assert.equal(map5.k, undefined); // not mania

  // the fresh cached map was reused without fetching
  const map1 = detailed.find((map) => map.b === 1 && map.m === 0)!;
  assert.equal(map1.art, 'artist-1');

  // refetched maps got a new cache_date
  const cache = readJsonFile<Record<string, CachedBeatmap>>(files.mapInfoCache(modes.osu));
  assert.equal(cache['5']!.cache_date, '2026-06-10 00:00:00');
  assert.equal(cache['1']!.cache_date, '2026-06-09 00:00:00');
});

test('records the key count for mania-specific maps', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: NOW });
  fetchBeatmaps.mock.resetCalls();
  fetchBeatmaps.mock.mockImplementation(async (ids: readonly number[]) => [
    makeBeatmap(ids[0]!, { mode_int: 3, cs: 7 }), // mania map: 7 keys
    makeBeatmap(ids[1]!, { mode_int: 0, cs: 4 }), // osu map converted to mania
  ]);

  fs.mkdirSync(`${dirs.tempDir}/mania`, { recursive: true });
  // a corrupt cache file is logged and treated as empty
  fs.writeFileSync(files.mapInfoCache(modes.mania), 'not valid json');
  fs.writeFileSync(files.mapsList(modes.mania), JSON.stringify([mapRecord(10), mapRecord(11)]));

  await fetchMapInfo(modes.mania);

  const detailed = readJsonFile<DetailedMapRecord[]>(files.mapsDetailedList(modes.mania));
  assert.equal(detailed.find((map) => map.b === 10)!.k, 7);
  assert.equal(detailed.find((map) => map.b === 11)!.k, undefined);
});

test('continues when a batch fails and saves the cache periodically', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: NOW });
  // 101 batches: batch 13 fails entirely, the rest succeed
  let batchNumber = 0;
  fetchBeatmaps.mock.mockImplementation(async (ids: readonly number[]) => {
    batchNumber += 1;
    if (batchNumber === 13) throw new Error('temporary api failure');
    return ids.map((id) => makeBeatmap(id));
  });

  const manyMaps = Array.from({ length: 5050 }, (_, i) => mapRecord(1000 + i));
  fs.rmSync(files.mapInfoCache(modes.osu));
  fs.writeFileSync(files.mapsList(modes.osu), JSON.stringify(manyMaps));

  await fetchMapInfo(modes.osu);

  const detailed = readJsonFile<DetailedMapRecord[]>(files.mapsDetailedList(modes.osu));
  // all maps except the failed batch of 50
  assert.equal(detailed.length, 5000);
});
