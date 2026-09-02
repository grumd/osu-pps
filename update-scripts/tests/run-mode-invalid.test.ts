import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { mockConfigModule, mockTimingsModule, setupTestDirs, srcUrl } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

mock.module(srcUrl('update-job.ts'), {
  namedExports: {
    runPipelineForMode: async () => {},
    runUpdateJob: async () => {},
    pushDataToR2: async () => 0,
  },
});

test('exits with an error for an unknown mode', async () => {
  process.argv[2] = 'not-a-mode';
  const exit = mock.method(process, 'exit', (() => {
    throw new Error('process.exit(1)');
  }) as never);

  await assert.rejects(import('../src/run-mode.ts'), /process.exit\(1\)/);
  assert.equal((exit.mock.calls[0]!.arguments as unknown as [number])[0], 1);
  exit.mock.restore();
});
