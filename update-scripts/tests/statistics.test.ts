import assert from 'node:assert/strict';
import { test } from 'node:test';

import { modes } from '../src/modes.ts';
import { toLegacyStatistics } from '../src/osu-api/statistics.ts';

test('osu statistics map to legacy counts', () => {
  assert.deepEqual(
    toLegacyStatistics({ great: 100, ok: 20, meh: 3, miss: 2 }, modes.osu.id),
    { count_300: 100, count_100: 20, count_50: 3, count_miss: 2, count_katu: 0, count_geki: 0 }
  );
});

test('taiko statistics map to legacy counts', () => {
  assert.deepEqual(
    toLegacyStatistics({ great: 500, ok: 30, miss: 1 }, modes.taiko.id),
    { count_300: 500, count_100: 30, count_50: 0, count_miss: 1, count_katu: 0, count_geki: 0 }
  );
});

test('fruits statistics map fruits/drops/droplets to legacy counts', () => {
  assert.deepEqual(
    toLegacyStatistics(
      { great: 400, large_tick_hit: 50, small_tick_hit: 30, small_tick_miss: 4, miss: 2 },
      modes.fruits.id
    ),
    { count_300: 400, count_100: 50, count_50: 30, count_miss: 2, count_katu: 4, count_geki: 0 }
  );
});

test('mania statistics map perfect/good to geki/katu', () => {
  assert.deepEqual(
    toLegacyStatistics(
      { perfect: 900, great: 300, good: 40, ok: 10, meh: 5, miss: 3 },
      modes.mania.id
    ),
    { count_300: 300, count_100: 10, count_50: 5, count_miss: 3, count_katu: 40, count_geki: 900 }
  );
});

test('missing hit results default to 0', () => {
  assert.deepEqual(toLegacyStatistics({}, modes.osu.id), {
    count_300: 0,
    count_100: 0,
    count_50: 0,
    count_miss: 0,
    count_katu: 0,
    count_geki: 0,
  });
});
