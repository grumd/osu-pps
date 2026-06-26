import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mock, test } from 'node:test';

// A config.json is present: the module must parse and return it.
mock.method(fs, 'existsSync', () => true);
mock.method(
  fs,
  'readFileSync',
  (() => JSON.stringify({ client_id: 42, client_secret: 'real-secret', debug: false })) as never
);
const { config } = await import('../src/config.ts');
mock.restoreAll();

test('parses config.json when it exists', () => {
  assert.deepEqual(config, { client_id: 42, client_secret: 'real-secret', debug: false });
});
