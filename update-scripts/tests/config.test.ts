import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mock, test } from 'node:test';

// No config.json: the module must warn and fall back to empty credentials
// instead of crashing (the OAuth client throws later if credentials are needed).
mock.method(fs, 'existsSync', () => false);
const { config, DEBUG, SKIP_PUSH, PACKAGE_ROOT } = await import('../src/config.ts');
mock.restoreAll();

test('falls back to empty credentials when config.json is missing', () => {
  assert.deepEqual(config, { client_id: 0, client_secret: '' });
  assert.equal(typeof PACKAGE_ROOT, 'string');
});

test('debug and no-push flags come from argv (not set in tests)', () => {
  assert.equal(DEBUG, false);
  assert.equal(SKIP_PUSH, false);
});
