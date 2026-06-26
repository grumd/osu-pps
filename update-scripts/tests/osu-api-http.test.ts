import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { AxiosError } from 'axios';

import { mockConfigModule, mockTimingsModule, setupTestDirs } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

const get = mock.fn<(url: string, config: Record<string, any>) => Promise<{ data: unknown }>>();
const post = mock.fn(async () => ({
  data: { access_token: 'TOKEN', token_type: 'Bearer', expires_in: 3600 },
}));
const create = mock.fn((_config?: Record<string, unknown>) => ({ get }));

mock.module('axios', {
  defaultExport: { create, post, AxiosError },
  namedExports: { AxiosError },
});

const { osuApiGet, isNotFoundError } = await import('../src/osu-api/http.ts');

const httpError = (status: number) =>
  new AxiosError(`status ${status}`, 'ERR', undefined, undefined, { status } as any);

function resetMocks() {
  get.mock.resetCalls();
  post.mock.resetCalls();
}

test('sets the x-api-version header for the solo score format', () => {
  const createConfig = create.mock.calls[0]!.arguments[0] as any;
  assert.equal(createConfig.headers['x-api-version'], '20220705');
  assert.equal(createConfig.baseURL, 'https://osu.ppy.sh/api/v2');
});

test('fetches a token and sends it as the Authorization header', async () => {
  resetMocks();
  get.mock.mockImplementationOnce(async () => ({ data: { ok: true } }));
  const data = await osuApiGet<{ ok: boolean }>('/some/url', {
    params: { a: 1 },
    logRequests: true,
  });
  assert.deepEqual(data, { ok: true });
  assert.equal(post.mock.callCount(), 1);
  const [url, requestConfig] = get.mock.calls[0]!.arguments;
  assert.equal(url, '/some/url');
  assert.equal((requestConfig as any).headers.Authorization, 'Bearer TOKEN');
  assert.deepEqual((requestConfig as any).params, { a: 1 });
});

test('reuses the token while it is fresh', async () => {
  resetMocks();
  get.mock.mockImplementationOnce(async () => ({ data: 1 }));
  await osuApiGet('/again');
  assert.equal(post.mock.callCount(), 0);
});

test('retries after refreshing the token on 401', async () => {
  resetMocks();
  let calls = 0;
  get.mock.mockImplementation(async () => {
    calls += 1;
    if (calls === 1) throw httpError(401);
    return { data: 'after-refresh' };
  });
  assert.equal(await osuApiGet('/url'), 'after-refresh');
  assert.equal(post.mock.callCount(), 1);
});

test('waits and retries on 429 rate limits', async () => {
  resetMocks();
  let calls = 0;
  get.mock.mockImplementation(async () => {
    calls += 1;
    if (calls <= 2) throw httpError(429);
    return { data: 'rate-limited-ok' };
  });
  assert.equal(await osuApiGet('/url'), 'rate-limited-ok');
  assert.equal(calls, 3);
});

test('throws on 404 and 400 without retrying', async () => {
  resetMocks();
  get.mock.mockImplementationOnce(async () => {
    throw httpError(404);
  });
  await assert.rejects(osuApiGet('/url'), (error) => isNotFoundError(error));

  get.mock.mockImplementationOnce(async () => {
    throw httpError(400);
  });
  await assert.rejects(osuApiGet('/url'), /status 400/);
});

test('retries network errors (no response) after resetting the token', async () => {
  resetMocks();
  let calls = 0;
  get.mock.mockImplementation(async () => {
    calls += 1;
    if (calls === 1) throw new Error('socket hang up');
    return { data: 'network-ok' };
  });
  assert.equal(await osuApiGet('/url'), 'network-ok');
  // token was cleared and refetched
  assert.equal(post.mock.callCount(), 1);
});

test('retries other HTTP errors twice, then throws', async () => {
  resetMocks();
  get.mock.mockImplementation(async () => {
    throw httpError(500);
  });
  await assert.rejects(osuApiGet('/url'), /status 500/);
  assert.equal(get.mock.callCount(), 3); // initial try + 2 retries
});

test('isNotFoundError only matches 404 axios errors', () => {
  assert.equal(isNotFoundError(httpError(404)), true);
  assert.equal(isNotFoundError(httpError(500)), false);
  assert.equal(isNotFoundError(new Error('404')), false);
});
