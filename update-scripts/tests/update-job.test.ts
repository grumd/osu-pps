import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { mockConfigModule, mockTimingsModule, setupTestDirs, srcUrl } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

const stepCalls: string[] = [];
const makeStep = (name: string) =>
  mock.fn(async (mode: { text: string }) => {
    stepCalls.push(`${name}:${mode.text}`);
  });

const fetchUsers = makeStep('users');
const fetchUserScores = makeStep('scores');
const fetchMapInfo = makeStep('maps');
const calculateRankings = makeStep('rankings');
const calculateTopMappers = makeStep('mappers');
const exportFrontendData = makeStep('export');

mock.module(srcUrl('steps/fetch-users.ts'), { namedExports: { fetchUsers } });
mock.module(srcUrl('steps/fetch-user-scores.ts'), { namedExports: { fetchUserScores } });
mock.module(srcUrl('steps/fetch-map-info.ts'), { namedExports: { fetchMapInfo } });
mock.module(srcUrl('steps/calculate-rankings.ts'), { namedExports: { calculateRankings } });
mock.module(srcUrl('steps/calculate-top-mappers.ts'), { namedExports: { calculateTopMappers } });
mock.module(srcUrl('steps/export-frontend-data.ts'), { namedExports: { exportFrontendData } });

const spawn = mock.fn(() => ({
  on: (_event: string, callback: (code: number) => void) => callback(0),
}));
mock.module('node:child_process', { namedExports: { spawn } });

const { runUpdateJob, runPipelineForMode } = await import('../src/update-job.ts');
const { modes } = await import('../src/modes.ts');

test('runPipelineForMode runs all steps in order', async () => {
  stepCalls.length = 0;
  await runPipelineForMode(modes.taiko);
  assert.deepEqual(stepCalls, [
    'users:taiko',
    'scores:taiko',
    'maps:taiko',
    'rankings:taiko',
    'mappers:taiko',
    'export:taiko',
  ]);
});

test('updates every mode and pushes after each one', async () => {
  stepCalls.length = 0;
  spawn.mock.resetCalls();
  await runUpdateJob({ skipPush: false, debug: false });
  // 4 modes * 6 steps
  assert.equal(stepCalls.length, 24);
  assert.deepEqual(
    stepCalls.filter((call) => call.startsWith('users:')),
    ['users:osu', 'users:mania', 'users:taiko', 'users:fruits']
  );
  // each mode pushes its data to R2
  assert.equal(spawn.mock.callCount(), 4);
  const [, r2Args] = spawn.mock.calls[0]!.arguments as unknown as [string, string[]];
  assert.match(r2Args[0]!, /push-r2\.ts$/);
  assert.deepEqual(r2Args.slice(1), ['--mode', 'osu']);
});

test('does not push with skipPush or in debug mode', async () => {
  spawn.mock.resetCalls();
  await runUpdateJob({ skipPush: true, debug: false });
  await runUpdateJob({ skipPush: false, debug: true });
  assert.equal(spawn.mock.callCount(), 0);
});

test('continues with the other modes when one fails', async () => {
  stepCalls.length = 0;
  spawn.mock.resetCalls();
  fetchUsers.mock.mockImplementationOnce(async () => {
    throw new Error('osu fetch broke');
  });
  await runUpdateJob({ skipPush: false, debug: false });
  // osu failed at the first step; the other 3 modes ran fully and pushed to R2
  assert.equal(stepCalls.length, 18);
  assert.equal(spawn.mock.callCount(), 3);
});

test('refuses to run two jobs at once', async () => {
  stepCalls.length = 0;
  const first = runUpdateJob({ skipPush: true, debug: false });
  const second = runUpdateJob({ skipPush: true, debug: false });
  await Promise.all([first, second]);
  assert.equal(stepCalls.length, 24, 'the second concurrent job must not run');
});
