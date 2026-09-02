import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mock } from 'node:test';

import * as shards from '../src/utils/shards.ts';

/** Resolves a path inside src/ to the absolute URL used by mock.module. */
export const srcUrl = (relativePath: string) =>
  new URL(`../src/${relativePath}`, import.meta.url).href;

export interface TestDirs {
  root: string;
  dataDir: string;
  tempDir: string;
  packageRoot: string;
}

/**
 * Creates a throwaway directory tree for one test process and points the
 * data/temp paths of the scripts at it. Must be called before importing src/paths.ts.
 */
export function setupTestDirs(): TestDirs {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'osu-pps-test-'));
  const dirs = {
    root,
    dataDir: path.join(root, 'data'),
    tempDir: path.join(root, 'temp'),
    packageRoot: path.join(root, 'package'),
  };
  fs.mkdirSync(dirs.dataDir, { recursive: true });
  fs.mkdirSync(dirs.tempDir, { recursive: true });
  fs.mkdirSync(dirs.packageRoot, { recursive: true });
  process.env.OSU_PPS_DATA_DIR = dirs.dataDir;
  process.env.OSU_PPS_TEMP_DIR = dirs.tempDir;
  return dirs;
}

/** Replaces src/config.ts for all modules imported after this call. */
export function mockConfigModule(
  packageRoot: string,
  { debug = false, clientId = 1, clientSecret = 'secret' } = {}
): void {
  mock.module(srcUrl('config.ts'), {
    namedExports: {
      PACKAGE_ROOT: packageRoot,
      config: { client_id: clientId, client_secret: clientSecret },
      DEBUG: debug,
      SKIP_PUSH: false,
    },
  });
}

/** Replaces src/timings.ts with (near-)zero waits so tests run instantly. */
export function mockTimingsModule(): void {
  mock.module(srcUrl('timings.ts'), {
    namedExports: {
      REQUEST_TIMEOUT_MS: 1000,
      RATE_LIMIT_WAIT_MS: 1,
      NETWORK_ERROR_WAIT_MS: 1,
      RETRY_WAIT_MS: 1,
      DELAY_BETWEEN_RANKING_PAGES_MS: 0,
      DELAY_BETWEEN_USERS_MS: 0,
      DELAY_BETWEEN_MAP_BATCHES_MS: 0,
      DELAY_BETWEEN_MAPPER_NAME_FETCHES_MS: 0,
      DELAY_BETWEEN_MAPPERS_MS: 0,
      DELAY_BETWEEN_FAVOURITE_PAGES_MS: 0,
    },
  });
}

export const readJsonFile = <T>(filePath: string): T =>
  JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;

/** Reads one entry out of a sharded folder, the way the UI does. */
export const readShardedEntry = <T>(
  directory: string,
  key: string | number,
  shardCount: number
): T => {
  const { shardName } = shards;
  const shard = readJsonFile<Record<string, T>>(
    path.join(directory, `${shardName(key, shardCount)}.json`)
  );
  return shard[String(key)]!;
};
