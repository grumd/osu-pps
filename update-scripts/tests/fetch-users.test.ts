import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mock, test } from 'node:test';

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

const rankingsByCountry: Record<string, Array<{ pp: number; user: { id: number; username: string } }>> = {
  US: [
    { pp: 5000, user: { id: 1, username: 'one' } },
    { pp: 4000, user: { id: 2, username: 'two' } },
  ],
  DE: [
    { pp: 4500, user: { id: 3, username: 'three' } },
    // duplicate of a US player — must be deduplicated
    { pp: 4000, user: { id: 2, username: 'two' } },
  ],
};
const fetchCountryRanking = mock.fn(async (_mode: unknown, country: string) => {
  return rankingsByCountry[country] ?? [];
});
mock.module(srcUrl('osu-api/api.ts'), { namedExports: { fetchCountryRanking } });

const { fetchUsers } = await import('../src/steps/fetch-users.ts');
const { files } = await import('../src/paths.ts');
const { modes } = await import('../src/modes.ts');

fs.writeFileSync(files.countriesList(modes.osu), JSON.stringify(['US', 'DE']));

test('fetches country rankings and saves a deduplicated user list', async () => {
  await fetchUsers(modes.osu);

  assert.equal(fetchCountryRanking.mock.callCount(), 2);
  assert.deepEqual(readJsonFile(files.userIdsList(modes.osu)), [
    { name: 'one', id: 1, pp: 5000 },
    { name: 'two', id: 2, pp: 4000 },
    { name: 'three', id: 3, pp: 4500 },
  ]);
  const savedDate = readJsonFile<string>(files.userIdsDate(modes.osu));
  assert.ok(Date.now() - new Date(savedDate).getTime() < 60_000);
});

test('reuses the list while it is younger than 14 days', async () => {
  fetchCountryRanking.mock.resetCalls();
  await fetchUsers(modes.osu); // the date file was just written by the previous test
  assert.equal(fetchCountryRanking.mock.callCount(), 0);
});

test('refetches when the date file is corrupt', async () => {
  fetchCountryRanking.mock.resetCalls();
  fs.writeFileSync(files.userIdsDate(modes.osu), 'not json');
  await fetchUsers(modes.osu);
  assert.equal(fetchCountryRanking.mock.callCount(), 2);
});

test('refetches when the list is older than 14 days', async () => {
  fetchCountryRanking.mock.resetCalls();
  const oldDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  fs.writeFileSync(files.userIdsDate(modes.osu), JSON.stringify(oldDate));
  await fetchUsers(modes.osu);
  assert.equal(fetchCountryRanking.mock.callCount(), 2);
});

test('fetches when no date file exists', async () => {
  fetchCountryRanking.mock.resetCalls();
  fs.rmSync(files.userIdsDate(modes.osu));
  await fetchUsers(modes.osu);
  assert.equal(fetchCountryRanking.mock.callCount(), 2);
});
