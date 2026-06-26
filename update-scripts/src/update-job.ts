import { spawn } from 'node:child_process';
import path from 'node:path';

import { PACKAGE_ROOT } from './config.ts';
import { allModes, type Mode } from './modes.ts';
import { fetchUsers } from './steps/fetch-users.ts';
import { fetchUserScores } from './steps/fetch-user-scores.ts';
import { fetchMapInfo } from './steps/fetch-map-info.ts';
import { calculateRankings } from './steps/calculate-rankings.ts';
import { calculateTopMappers } from './steps/calculate-top-mappers.ts';
import { exportFrontendData } from './steps/export-frontend-data.ts';

export interface UpdateJobOptions {
  /** Don't commit/push the data folder (--no-push). */
  skipPush: boolean;
  /** Debug mode never pushes either. */
  debug: boolean;
}

let jobIsRunning = false;

export async function runPipelineForMode(mode: Mode): Promise<void> {
  await fetchUsers(mode);
  await fetchUserScores(mode);
  await fetchMapInfo(mode);
  await calculateRankings(mode);
  await calculateTopMappers(mode);
  await exportFrontendData(mode);
}

export function pushDataToGit(): Promise<number | null> {
  return new Promise((resolve) => {
    const child = spawn('bash', [path.join(PACKAGE_ROOT, 'push-safe.sh')], { stdio: 'inherit' });
    child.on('close', (code) => {
      console.log('Push script exited with code', code);
      resolve(code);
    });
  });
}

/**
 * Runs the full pipeline for every mode, pushing the data to git after each mode so
 * fresh data is published as soon as it's ready. Won't start if already running.
 */
export async function runUpdateJob({ skipPush, debug }: UpdateJobOptions): Promise<void> {
  if (jobIsRunning) {
    console.log('Updater is already running');
    return;
  }
  jobIsRunning = true;

  for (const mode of allModes) {
    try {
      await runPipelineForMode(mode);

      if (skipPush) {
        console.log(`Saved all ${mode.text} info, --no-push is enabled, not pushing to origin`);
      } else if (debug) {
        console.log(`Saved all ${mode.text} info, debug is on - not updating origin`);
      } else {
        console.log(`Saved all ${mode.text} info, updating origin`);
        await pushDataToGit();
      }
    } catch (error) {
      console.error(`Update failed for ${mode.text}:`, error);
    }
  }

  console.log('Finished an updater job');
  jobIsRunning = false;
}
