import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { runJobs } from '../src/utils/run-jobs.ts';

test('runs jobs sequentially in order with indexes', async () => {
  const seen: Array<[string, number]> = [];
  await runJobs({
    items: ['a', 'b', 'c'],
    job: async (item, index) => {
      seen.push([item, index]);
    },
    logProgress: false,
  });
  assert.deepEqual(seen, [['a', 0], ['b', 1], ['c', 2]]);
});

test('keeps at least minJobTime between job starts', async () => {
  const start = Date.now();
  await runJobs({
    items: [1, 2, 3],
    job: async () => {},
    minJobTime: 15,
    logProgress: false,
  });
  assert.ok(Date.now() - start >= 40, 'three jobs at >=15ms each');
});

test('logs progress with an ETA every ~10% of items', async () => {
  const log = mock.method(console, 'log', () => {});
  await runJobs({ items: Array.from({ length: 20 }, (_, i) => i), job: async () => {} });
  log.mock.restore();
  const progressLines = log.mock.calls
    .map((call) => String(call.arguments[0]))
    .filter((line) => line.includes('% done - ETA'));
  // logs at every 2nd item except the very last one
  assert.equal(progressLines.length, 9);
  assert.match(progressLines[0]!, /^10% done - ETA \d+:\d{2}:\d{2}$/);
});

test('errors from jobs propagate', async () => {
  await assert.rejects(
    runJobs({
      items: [1],
      job: async () => {
        throw new Error('boom');
      },
      logProgress: false,
    }),
    /boom/
  );
});
