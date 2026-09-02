import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { SHARD_COUNTS, shardName, writeShards } from '../src/utils/shards.ts';

interface ShardsModule {
  SHARD_COUNTS: Record<string, number>;
  shardName: (key: string | number, shardCount: number) => string;
}

// The UI's copy of the hash, loaded so the two implementations can be compared — if they ever
// drift, the shard the updater writes to stops being the one the UI fetches. The specifier is
// built at runtime on purpose: it belongs to the other package, which tsc compiles under its
// own (non-module) settings and would reject as part of this program.
const ui = (await import(
  new URL('../../ui/src/utils/shards.ts', import.meta.url).href
)) as ShardsModule;

test('the UI copy of the sharding logic matches this one', () => {
  assert.deepEqual(ui.SHARD_COUNTS, SHARD_COUNTS);

  const keys = ['123456_0', '123456_64', '1_0', '', '999999999_576', 12345, 0, 7];
  for (const shardCount of Object.values(SHARD_COUNTS)) {
    for (const key of keys) {
      assert.equal(
        ui.shardName(key, shardCount),
        shardName(key, shardCount),
        `mismatch for key "${key}" with ${shardCount} shards`
      );
    }
  }
});

test('shard names are zero padded to a fixed width', () => {
  for (const [name, shardCount] of Object.entries(SHARD_COUNTS)) {
    const width = (shardCount - 1).toString(16).length;
    for (let i = 0; i < 500; i++) {
      assert.match(
        shardName(`key-${i}`, shardCount),
        new RegExp(`^[0-9a-f]{${width}}$`),
        `bad shard name for ${name}`
      );
    }
  }
});

test('keys are spread over the shards rather than piling into one', () => {
  const shardCount = 256;
  const used = new Set<string>();
  for (let beatmapId = 1; beatmapId <= 5000; beatmapId++) {
    used.add(shardName(`${beatmapId}_0`, shardCount));
  }
  // Sequential ids are the realistic worst case - every shard should still get entries
  assert.equal(used.size, shardCount);
});

test('writeShards round-trips every entry into the shard the readers will look in', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shards-test-'));
  const shardCount = 16;
  const entries: [string, { value: number }][] = Array.from({ length: 200 }, (_, i) => [
    `${i}_64`,
    { value: i },
  ]);

  // A leftover file from the old one-file-per-key layout must not survive the rewrite
  fs.writeFileSync(path.join(directory, '12345_0.json'), '{}');

  await writeShards({ directory, shardCount, entries });

  const written = fs.readdirSync(directory).sort();
  assert.equal(written.length, shardCount, 'every shard is written, empty ones included');
  assert.ok(!written.includes('12345_0.json'), 'stale per-key files are cleared');

  for (const [key, value] of entries) {
    const file = path.join(directory, `${shardName(key, shardCount)}.json`);
    const shard = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(shard[key], value, `entry ${key} is missing from its shard`);
  }

  fs.rmSync(directory, { recursive: true, force: true });
});
