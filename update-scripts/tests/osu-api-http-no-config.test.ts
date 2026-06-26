import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { AxiosError } from 'axios';

import { mockConfigModule, mockTimingsModule, setupTestDirs } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot, { clientId: 0, clientSecret: '' });
mockTimingsModule();

mock.module('axios', {
  defaultExport: { create: () => ({ get: async () => ({ data: 1 }) }), post: async () => ({}), AxiosError },
  namedExports: { AxiosError },
});

const { osuApiGet } = await import('../src/osu-api/http.ts');

test('throws when OAuth credentials are missing', async () => {
  await assert.rejects(osuApiGet('/url'), /client_id\/client_secret not found/);
});
