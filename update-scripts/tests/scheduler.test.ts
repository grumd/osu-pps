import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { mockConfigModule, mockTimingsModule, setupTestDirs, srcUrl } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

const runUpdateJob = mock.fn(async (_options: { skipPush: boolean; debug: boolean }) => {});
mock.module(srcUrl('update-job.ts'), {
  namedExports: { runUpdateJob, runPipelineForMode: async () => {}, pushDataToR2: async () => 0 },
});

const scheduleJob = mock.fn((_cron: string, _job: () => Promise<void>) => {});
mock.module('node-schedule', { defaultExport: { scheduleJob }, namedExports: { scheduleJob } });

await import('../src/scheduler.ts');

test('schedules the daily job and runs it immediately', () => {
  assert.equal(scheduleJob.mock.callCount(), 1);
  const [cronExpression, job] = scheduleJob.mock.calls[0]!.arguments as unknown as [
    string,
    () => Promise<void>,
  ];
  assert.equal(cronExpression, '0 3 * * *');

  // one immediate run at startup
  assert.equal(runUpdateJob.mock.callCount(), 1);
  assert.deepEqual(runUpdateJob.mock.calls[0]!.arguments[0], { skipPush: false, debug: false });

  // the scheduled job triggers the same update
  void job();
  assert.equal(runUpdateJob.mock.callCount(), 2);
});
