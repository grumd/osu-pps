import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { mockConfigModule, mockTimingsModule, setupTestDirs, srcUrl } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

const osuApiGet = mock.fn<(url: string, options?: any) => Promise<any>>();
mock.module(srcUrl('osu-api/http.ts'), {
  namedExports: { osuApiGet, isNotFoundError: () => false },
});

const { fetchCountryRanking, fetchUserBestScores, fetchBeatmaps, fetchUser, fetchUserFavourites } =
  await import('../src/osu-api/api.ts');
const { modes } = await import('../src/modes.ts');

const rankingEntry = (id: number, pp: number) => ({ pp, user: { id, username: `user${id}` } });

test('fetchCountryRanking pages while every player is above 1000pp', async () => {
  osuApiGet.mock.resetCalls();
  const pages = [
    { cursor: { page: 2 }, ranking: [rankingEntry(1, 5000), rankingEntry(2, 2000)], total: 4 },
    { cursor: { page: 3 }, ranking: [rankingEntry(3, 1500), rankingEntry(4, 900)], total: 4 },
    { cursor: { page: 4 }, ranking: [rankingEntry(5, 800)], total: 4 },
  ];
  osuApiGet.mock.mockImplementation(async (_url, options) => {
    const page = options?.params?.['cursor[page]'] ?? 1;
    return pages[page - 1];
  });

  const ranking = await fetchCountryRanking(modes.osu, 'US');
  // page 2 contains a sub-1000pp player, so page 3 is never requested
  assert.equal(osuApiGet.mock.callCount(), 2);
  assert.deepEqual(ranking.map((entry) => entry.user.id), [1, 2, 3, 4]);
  assert.equal(osuApiGet.mock.calls[0]!.arguments[0], '/rankings/osu/performance');
  assert.deepEqual(osuApiGet.mock.calls[0]!.arguments[1]?.params, { country: 'US' });
  assert.deepEqual(osuApiGet.mock.calls[1]!.arguments[1]?.params, {
    country: 'US',
    'cursor[page]': 2,
  });
});

test('fetchCountryRanking stops when there is no next cursor', async () => {
  osuApiGet.mock.resetCalls();
  osuApiGet.mock.mockImplementation(async () => ({
    cursor: null,
    ranking: [rankingEntry(1, 5000)],
    total: 1,
  }));
  const ranking = await fetchCountryRanking(modes.osu, 'DE');
  assert.equal(osuApiGet.mock.callCount(), 1);
  assert.equal(ranking.length, 1);
});

test('fetchUserBestScores requests the right endpoint and params', async () => {
  osuApiGet.mock.resetCalls();
  osuApiGet.mock.mockImplementation(async () => [{ id: 1 }]);
  const scores = await fetchUserBestScores(123, modes.mania, 100);
  assert.deepEqual(scores, [{ id: 1 }]);
  assert.equal(osuApiGet.mock.calls[0]!.arguments[0], '/users/123/scores/best');
  assert.deepEqual(osuApiGet.mock.calls[0]!.arguments[1]?.params, { mode: 'mania', limit: 100 });
});

test('fetchBeatmaps requests batches and rejects oversized ones', async () => {
  osuApiGet.mock.resetCalls();
  osuApiGet.mock.mockImplementation(async () => ({ beatmaps: [{ id: 5 }] }));
  const beatmaps = await fetchBeatmaps([5, 6]);
  assert.deepEqual(beatmaps, [{ id: 5 }]);
  assert.equal(osuApiGet.mock.calls[0]!.arguments[0], '/beatmaps');
  assert.deepEqual(osuApiGet.mock.calls[0]!.arguments[1]?.params, { 'ids[]': [5, 6] });

  await assert.rejects(
    fetchBeatmaps(Array.from({ length: 51 }, (_, i) => i)),
    /up to 50 beatmaps/
  );
});

test('fetchUser', async () => {
  osuApiGet.mock.resetCalls();
  osuApiGet.mock.mockImplementation(async () => ({ id: 7, username: 'seven' }));
  assert.deepEqual(await fetchUser(7), { id: 7, username: 'seven' });
  assert.equal(osuApiGet.mock.calls[0]!.arguments[0], '/users/7');
});

test('fetchUserFavourites paginates by offset until a short page', async () => {
  osuApiGet.mock.resetCalls();
  const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i }));
  const lastPage = [{ id: 100 }, { id: 101 }];
  osuApiGet.mock.mockImplementation(async (_url, options) =>
    options?.params?.offset === 0 ? fullPage : lastPage
  );
  const favourites = await fetchUserFavourites(55);
  assert.equal(favourites.length, 102);
  assert.equal(osuApiGet.mock.callCount(), 2);
  assert.deepEqual(osuApiGet.mock.calls[1]!.arguments[1]?.params, { offset: 100, limit: 100 });
});
