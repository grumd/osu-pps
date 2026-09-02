/**
 * The per-entity data folders (map scores, player scores, mapper maps) used to hold one tiny
 * JSON file per key — around a million files in total, which is more than git or any static
 * host wants to deal with. They are now split into a fixed number of shards instead: the key
 * is hashed into a shard name, and the shard file holds every entry that hashed to it.
 *
 * MUST stay in sync with `update-scripts/src/utils/shards.ts`, which writes the files.
 * `update-scripts/tests/shards.test.ts` imports both copies and fails if they disagree.
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
