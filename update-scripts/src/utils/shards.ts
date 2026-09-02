import fs from 'node:fs';
import path from 'node:path';

import { writeJson } from './io.ts';

/**
 * The per-entity data folders (map scores, player scores, mapper maps) used to hold one tiny
 * JSON file per key — around a million files in total, which is more than git or any static
 * host wants to deal with. They are now split into a fixed number of shards instead: the key
 * is hashed into a shard name, and the shard file holds every entry that hashed to it.
 *
 * MUST stay in sync with `ui/src/utils/shards.ts`, which reads the files.
 * `tests/shards.test.ts` imports both copies and fails if they disagree.
 */

/** Number of shards each per-entity folder is split into. */
export const SHARD_COUNTS = {
  mapsScores: 1024,
  playerScores: 2048,
  favoredMappersMaps: 256,
} as const;

/**
 * FNV-1a, 32 bit. Deliberately simple so both sides can implement it identically —
 * `Math.imul` keeps the multiply in 32-bit range in every JS engine.
 */
const hash = (key: string): number => {
  let value = 2166136261;
  for (let index = 0; index < key.length; index++) {
    value ^= key.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
};

/** The file name (without extension) of the shard a key belongs to, e.g. "07f". */
export const shardName = (key: string | number, shardCount: number): string => {
  const width = (shardCount - 1).toString(16).length;
  return (hash(String(key)) % shardCount).toString(16).padStart(width, '0');
};

/**
 * Groups `entries` into `shardCount` shard files inside `directory`.
 *
 * Every shard is written, empty ones included, so the folder's contents are the same on every
 * run and a 404 from the UI always means a genuinely bad key rather than an empty bucket.
 * The folder is emptied first, which also clears out the old one-file-per-key layout.
 */
export async function writeShards<T>({
  directory,
  shardCount,
  entries,
}: {
  directory: string;
  shardCount: number;
  entries: Iterable<readonly [string | number, T]>;
}): Promise<void> {
  const shards: Record<string, T>[] = Array.from({ length: shardCount }, () => ({}));
  for (const [key, value] of entries) {
    shards[hash(String(key)) % shardCount]![String(key)] = value;
  }

  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });

  const width = (shardCount - 1).toString(16).length;
  for (const [index, shard] of shards.entries()) {
    const name = index.toString(16).padStart(width, '0');
    await writeJson(path.join(directory, `${name}.json`), shard);
  }
}
