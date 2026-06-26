import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { fileExists, readJson, writeFile, writeJson } from '../src/utils/io.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'osu-pps-io-test-'));

test('writeJson/readJson roundtrip, creating parent folders', async () => {
  const filePath = path.join(tmp, 'nested', 'deep', 'data.json');
  const data = { list: [1, 2, 3], name: 'тест', nested: { ok: true } };
  await writeJson(filePath, data);
  assert.deepEqual(await readJson(filePath), data);
});

test('writeJson serializes dates like JSON.stringify', async () => {
  const filePath = path.join(tmp, 'date.json');
  const date = new Date('2026-06-10T03:00:00.000Z');
  await writeJson(filePath, { lastUpdated: date });
  assert.equal(fs.readFileSync(filePath, 'utf8'), JSON.stringify({ lastUpdated: date }));
});

test('writeFile writes text and creates parent folders', () => {
  const filePath = path.join(tmp, 'text', 'out.csv');
  writeFile(filePath, 'a,b\n1,2');
  assert.equal(fs.readFileSync(filePath, 'utf8'), 'a,b\n1,2');
});

test('fileExists', () => {
  assert.equal(fileExists(tmp), true);
  assert.equal(fileExists(path.join(tmp, 'nope.json')), false);
});
