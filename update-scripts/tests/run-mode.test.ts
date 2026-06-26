import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { mockConfigModule, mockTimingsModule, setupTestDirs, srcUrl } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

const runPipelineForMode = mock.fn(async (_mode: { text: string; id: number }) => {});
mock.module(srcUrl('update-job.ts'), {
  namedExports: { runPipelineForMode, runUpdateJob: async () => {}, pushDataToGit: async () => 0 },
});

process.argv[2] = 'taiko';
await import('../src/run-mode.ts');

test('runs the pipeline for the mode given on the command line', () => {
  assert.equal(runPipelineForMode.mock.callCount(), 1);
  assert.deepEqual(runPipelineForMode.mock.calls[0]!.arguments[0], { text: 'taiko', id: 1 });
});
