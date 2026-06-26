import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mock, test } from 'node:test';

import type { CachedBeatmap, MapRecord } from '../src/data/types.ts';
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

const makeCached = (id: number, over: Record<string, unknown> = {}): CachedBeatmap =>
  ({
    id,
    beatmapset_id: id * 10,
    mode_int: 0,
    version: `diff-${id}`,
    difficulty_rating: 5,
    bpm: 180,
    hit_length: 100,
    accuracy: 9,
    ar: 9,
    cs: 4,
    drain: 5,
    passcount: 100_000,
    playcount: 2_000_000,
    last_updated: '2024-01-01T00:00:00Z',
    user_id: 100,
    owners: [{ id: 100, username: 'host' }],
    cache_date: '2026-01-01 00:00:00',
    beatmapset: {
      id: id * 10,
      artist: `artist-${id}`,
      title: `title-${id}`,
      creator: 'host',
      user_id: 100,
      favourite_count: 50,
      ranked_date: '2024-01-01T00:00:00Z',
    },
    ...over,
  }) as CachedBeatmap;

// Mapper 100 ("host") owns maps 1, 2, 3 (3 mapsets — a voter, with a guest diff by 600 on map 3).
// Map 4 has no owners but its mapset host (100) is known from the cache.
// Map 5 has no owners and an unknown mapper (200) — username fetched from the API.
// Map 6 has no owners and an unknown mapper (400) whose fetch fails.
// Map 7 is another mode (taiko) — ignored for mapper stats.
const cache: Record<string, CachedBeatmap> = {
  1: makeCached(1),
  2: makeCached(2),
  3: makeCached(3, {
    owners: [
      { id: 100, username: 'host-new-name' },
      { id: 600, username: 'guest' },
    ],
  }),
  4: makeCached(4, { owners: undefined }),
  5: makeCached(5, {
    owners: undefined,
    user_id: 200,
    beatmapset: { ...makeCached(5).beatmapset, creator: 'someone-else', user_id: 300 },
  }),
  6: makeCached(6, {
    owners: undefined,
    user_id: 400,
    beatmapset: { ...makeCached(6).beatmapset, creator: 'other', user_id: 500 },
  }),
  7: makeCached(7, { mode_int: 1 }),
  // mapper 200 hosts 3 mapsets (incl. map 5) — a voter whose favourites fetch fails
  8: makeCached(8, { user_id: 200 }),
  9: makeCached(9, { user_id: 200 }),
  // mapper 100 released a taiko mapset under another name — both names become known
  14: makeCached(14, {
    mode_int: 1,
    beatmapset: { ...makeCached(14).beatmapset, creator: 'host-alias' },
  }),
  // mapper 700 hosts 3 mapsets — another voter
  15: makeCached(15, {
    user_id: 700,
    beatmapset: { ...makeCached(15).beatmapset, creator: 'seven', user_id: 700 },
  }),
  16: makeCached(16, {
    user_id: 700,
    beatmapset: { ...makeCached(16).beatmapset, creator: 'seven', user_id: 700 },
  }),
  17: makeCached(17, {
    user_id: 700,
    beatmapset: { ...makeCached(17).beatmapset, creator: 'seven', user_id: 700 },
  }),
};

const mapsList: MapRecord[] = [
  { m: 0, b: 1, x: 100, pp99: 300, adj: 10 },
  { m: 64, b: 1, x: 50, pp99: 400, adj: 5 }, // same beatmap, DT — counted once per mapper
  { m: 0, b: 2, x: 80, pp99: 250, adj: 8 },
  { m: 0, b: 3, x: 60, pp99: 200, adj: 6 },
  { m: 0, b: 4, x: 40, pp99: 150, adj: 4 },
  { m: 0, b: 5, x: 30, pp99: 100, adj: 3 },
  { m: 0, b: 6, x: 20, pp99: 90, adj: 2 },
  { m: 0, b: 999, x: 10, pp99: 80, adj: 1 }, // not cached — filtered out
];

const fetchUser = mock.fn(async (userId: number) => {
  if (userId === 400) throw new Error('Request failed with status code 404');
  return { id: userId, username: `fetched-${userId}` };
});
const fetchUserFavourites = mock.fn(async (userId: number) => {
  if (userId === 700) {
    return [
      // favourites the same mapset as voter 100 — its votes must accumulate
      {
        id: 11,
        artist: 'fav-artist',
        title: 'fav-title',
        creator: 'favored-mapper',
        user_id: 500,
        ranked_date: '2020-05-05T00:00:00Z',
        covers: { list: 'https://example.com/cover.jpg' },
      },
      // a second favored mapper, ranked below the first
      {
        id: 21,
        artist: 'second',
        title: 'second',
        creator: 'runner-up',
        user_id: 800,
        ranked_date: '2023-01-01T00:00:00Z',
        covers: { list: 'z' },
      },
    ];
  }
  if (userId !== 100) throw new Error('no favourites here');
  return [
    // a favourite of mapper 500's mapset
    {
      id: 11,
      artist: 'fav-artist',
      title: 'fav-title',
      creator: 'favored-mapper',
      user_id: 500,
      ranked_date: '2020-05-05T00:00:00Z',
      covers: { list: 'https://example.com/cover.jpg' },
    },
    // the same mapset favourited again can't happen, but another mapset by the same mapper can
    {
      id: 12,
      artist: 'fav-artist-2',
      title: 'fav-title-2',
      creator: 'favored-mapper',
      user_id: 500,
      ranked_date: '2021-05-05T00:00:00Z',
      covers: undefined,
    },
    // a mapset by the same mapper under another name — names are ranked by received weight
    {
      id: 14,
      artist: 'fav-artist-3',
      title: 'fav-title-3',
      creator: 'favored-mapper-alt',
      user_id: 500,
      ranked_date: '2022-05-05T00:00:00Z',
      covers: { list: 'y' },
    },
    // self-fav — ignored
    {
      id: 13,
      artist: 'self',
      title: 'self',
      creator: 'host',
      user_id: 100,
      ranked_date: null,
      covers: { list: 'x' },
    },
  ];
});
mock.module(srcUrl('osu-api/api.ts'), { namedExports: { fetchUser, fetchUserFavourites } });

const { calculateTopMappers } = await import('../src/steps/calculate-top-mappers.ts');
const { files } = await import('../src/paths.ts');
const { modes } = await import('../src/modes.ts');

fs.mkdirSync(`${dirs.tempDir}/osu`, { recursive: true });
fs.writeFileSync(files.mapInfoCache(modes.osu), JSON.stringify(cache));
fs.writeFileSync(files.mapsList(modes.osu), JSON.stringify(mapsList));

await calculateTopMappers(modes.osu);

interface PpMapperOut {
  name: string;
  id: number;
  points: number;
  mapsRecorded: Array<{ id: number; text: string; ow: number; pp: number; m: number }>;
}
const ppMappers = readJsonFile<{
  top20: PpMapperOut[];
  top20age: PpMapperOut[];
  top20adj: PpMapperOut[];
}>(files.ppMappers(modes.osu));

test('fetches usernames only for maps with unknown mappers', () => {
  // map 5 (mapper 200) and map 6 (mapper 400, fails); map 4's host is known from the cache
  assert.deepEqual(fetchUser.mock.calls.map((call) => call.arguments[0]).sort(), [200, 400]);
});

test('credits farmability points to all map owners, once per beatmap', () => {
  const host = ppMappers.top20.find((mapper) => mapper.id === 100)!;
  // maps 1 (x=100, DT combo not double counted), 2 (80), 3 (60), 4 (40, generated owners)
  assert.equal(host.points, 280);
  // the mapper's name follows their most recent map (highest beatmap id with their credit)
  assert.equal(host.name, 'host');
  assert.deepEqual(host.mapsRecorded.map((map) => map.id), [1, 2, 3, 4]);
  assert.equal(host.mapsRecorded[0]!.text, 'artist-1 - title-1 [diff-1]');
  // the top map record keeps the better mod combo's x
  assert.equal(host.mapsRecorded[0]!.ow, 100);
  assert.equal(host.mapsRecorded[0]!.pp, 300);

  const guest = ppMappers.top20.find((mapper) => mapper.id === 600)!;
  assert.equal(guest.name, 'guest');
  assert.equal(guest.points, 60);

  const fetched = ppMappers.top20.find((mapper) => mapper.id === 200)!;
  assert.equal(fetched.name, 'fetched-200');
  assert.equal(fetched.points, 30);

  // mapper 400's username could not be fetched — the map is skipped entirely
  assert.equal(ppMappers.top20.some((mapper) => mapper.id === 400), false);
});

test('produces all three top lists', () => {
  assert.ok(ppMappers.top20age.length > 0);
  assert.ok(ppMappers.top20adj.length > 0);
  // top20adj values are not truncated
  const adjHost = ppMappers.top20adj.find((mapper) => mapper.id === 100)!;
  assert.ok(!Number.isInteger(adjHost.points));
});

test('ranks favored mappers weighted by the voter mapset count', () => {
  const favored = readJsonFile<Array<{ count: number; mapperId: number; names: string[] }>>(
    files.favoredMappers(modes.osu)
  );
  // sorted by votes received: mapper 500 (1.5) before mapper 800 (0.3)
  assert.deepEqual(favored.map((mapper) => mapper.mapperId), [500, 800]);
  // voter 100 has 4 mapsets -> weight 0.4 per favourite, 3 favourites for mapper 500;
  // voter 700 has 3 mapsets -> weight 0.3, 1 favourite each for mappers 500 and 800;
  // voter 200's favourites fetch failed, so they cast no votes.
  assert.ok(Math.abs(favored[0]!.count - 1.5) < 1e-9);
  // names sorted by received weight: 'favored-mapper' got 1.1, 'favored-mapper-alt' got 0.4
  assert.deepEqual(favored[0]!.names, ['favored-mapper', 'favored-mapper-alt']);

  const favoredMaps = readJsonFile<Array<Record<string, unknown>>>(
    files.favoredMappersMaps(modes.osu, 500)
  );
  assert.equal(favoredMaps.length, 3);
  assert.deepEqual(Object.keys(favoredMaps[0]!), [
    'count',
    'cover',
    'id',
    'artist',
    'title',
    'ranked_date',
  ]);
  // mapset 11 was favourited by both voters (0.4 + 0.3) and sorts first
  assert.equal(favoredMaps[0]!.id, 11);
  assert.ok(Math.abs((favoredMaps[0]!.count as number) - 0.7) < 1e-9);
  assert.equal(favoredMaps[0]!.cover, 'https://example.com/cover.jpg');
});

test('writes informal text tops by playcount and favourites', () => {
  const playcountTxt = fs.readFileSync(files.mappersPlaycountTxt(modes.osu), 'utf8');
  const favsTxt = fs.readFileSync(files.mappersFavsTxt(modes.osu), 'utf8');
  // mapper 100 has 4 osu maps * 2M playcount = 8M -> "8"
  assert.ok(playcountTxt.split('\n').some((line) => line === 'host\t8'));
  // 4 mapsets * 50 favs = 200
  assert.ok(favsTxt.split('\n').some((line) => line === 'host\t200'));
});
