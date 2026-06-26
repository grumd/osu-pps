import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chunk, delay, sumBy, truncateFloat, uniqBy } from '../src/utils/misc.ts';

test('delay waits roughly the given time', async () => {
  const start = Date.now();
  await delay(20);
  assert.ok(Date.now() - start >= 15);
});

test('truncateFloat floors to the given decimals', () => {
  assert.equal(truncateFloat(1.239), 1.23);
  assert.equal(truncateFloat(1.239, 1), 1.2);
  assert.equal(truncateFloat(99.99999, 1), 99.9);
  assert.equal(truncateFloat(5), 5);
});

test('uniqBy keeps the first occurrence of each key', () => {
  assert.deepEqual(
    uniqBy([{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 1, v: 'c' }], (item) => item.id),
    [{ id: 1, v: 'a' }, { id: 2, v: 'b' }]
  );
  assert.deepEqual(uniqBy([], () => 0), []);
});

test('chunk splits arrays into pieces of at most the given size', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([1, 2], 5), [[1, 2]]);
  assert.deepEqual(chunk([], 3), []);
});

test('sumBy sums the values returned by the getter', () => {
  assert.equal(sumBy([{ n: 1 }, { n: 2 }, { n: 3 }], (item) => item.n), 6);
  assert.equal(sumBy([], () => 1), 0);
});
