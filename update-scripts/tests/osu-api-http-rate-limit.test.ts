import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { AxiosError } from 'axios';

import { mockConfigModule, mockTimingsModule, setupTestDirs } from './helpers.ts';

const MIN_TIME_BETWEEN_REQUESTS_MS = 40;

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule({ MIN_TIME_BETWEEN_REQUESTS_MS });

const requestStarts: number[] = [];
const recordStart = async () => {
  requestStarts.push(Date.now());
  return { data: 'ok' };
};
const get = mock.fn(recordStart);
const instancePost = mock.fn(recordStart);
const tokenPost = mock.fn(async () => {
  requestStarts.push(Date.now());
  return { data: { access_token: 'TOKEN', token_type: 'Bearer', expires_in: 3600 } };
});

mock.module('axios', {
  defaultExport: { create: () => ({ get, post: instancePost }), post: tokenPost, AxiosError },
  namedExports: { AxiosError },
});

const { osuApiGet, osuApiPost } = await import('../src/osu-api/http.ts');

test('spaces out all requests, including concurrent ones and token refreshes', async () => {
  await Promise.all([
    osuApiGet('/a'),
    osuApiPost('/b', { body: {} }),
    osuApiGet('/c'),
    osuApiPost('/d', { body: {} }),
  ]);

  assert.equal(tokenPost.mock.callCount() >= 1, true);
  assert.equal(requestStarts.length, 4 + tokenPost.mock.callCount());
  const sorted = [...requestStarts].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    // timers can fire a millisecond early
    assert.ok(
      sorted[i]! - sorted[i - 1]! >= MIN_TIME_BETWEEN_REQUESTS_MS - 1,
      `requests ${i - 1} and ${i} started ${sorted[i]! - sorted[i - 1]!}ms apart`
    );
  }
});
