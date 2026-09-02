/**
 * Pushes the published data folder to the Cloudflare R2 bucket.
 *
 * Usage: node src/push-r2.ts [--clean] [--mode <osu|taiko|fruits|mania>]
 *   --clean  also delete bucket objects that no longer exist locally.
 *            Only needed when the file layout changes (e.g. the one-time switch
 *            from the old one-file-per-key layout to shards).
 *   --mode   only push files belonging to one game mode (every key is
 *            <category>/<mode>/...). Used by the update job to publish each
 *            mode as soon as its pipeline finishes without re-uploading the
 *            other modes' unchanged data. --clean is scoped the same way.
 *
 * Requires the "r2" section in config.json. Files are uploaded with a
 * concurrency limit and overwrite in place — the shard layout is stable, so a
 * daily push is ~13K PUTs (Class A ops) and no deletes.
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { config, type R2Config } from './config.ts';
import { modes, type ModeName } from './modes.ts';
import { DATA_ROOT } from './paths.ts';

const CONCURRENCY = 16;

function requireR2(): R2Config {
  const r2 = config.r2;
  if (!r2) {
    console.error('Missing "r2" section in config.json — see README.md');
    process.exit(1);
  }
  return r2;
}

const r2 = requireR2();

const client = new S3Client({
  endpoint: r2.endpoint,
  region: 'auto',
  credentials: {
    accessKeyId: r2.access_key_id,
    secretAccessKey: r2.secret_access_key,
  },
  maxAttempts: 5,
});

/** All files under `dir`, as bucket keys (slash-separated, relative to `root`). */
function walk(dir: string, root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full, root));
    } else if (entry.isFile()) {
      files.push(path.relative(root, full).split(path.sep).join('/'));
    }
  }
  return files;
}

const contentType = (key: string): string => {
  if (key.endsWith('.json')) return 'application/json; charset=utf-8';
  if (key.endsWith('.csv')) return 'text/csv; charset=utf-8';
  return 'application/octet-stream';
};

/**
 * metadata.json is the UI's cache-bust signal, so keep its edge TTL short.
 * Everything else matches the old raw.githubusercontent max-age of 10 minutes,
 * so a daily update is visible edge-wide within ~10 minutes.
 */
const cacheControl = (key: string): string =>
  key.endsWith('metadata.json') ? 'max-age=60' : 'max-age=600';

async function uploadAll(keys: string[]): Promise<{ done: number; bytes: number; errors: string[] }> {
  let done = 0;
  let bytes = 0;
  let next = 0;
  const errors: string[] = [];

  const worker = async (): Promise<void> => {
    while (next < keys.length) {
      const key = keys[next++];
      if (key === undefined) return;
      const filePath = path.join(DATA_ROOT, ...key.split('/'));
      try {
        // A Buffer body (unlike a stream) lets the SDK retry on transient
        // network errors; the largest data file is ~11 MB.
        const body = fs.readFileSync(filePath);
        await client.send(
          new PutObjectCommand({
            Bucket: r2.bucket,
            Key: key,
            Body: body,
            ContentType: contentType(key),
            CacheControl: cacheControl(key),
          })
        );
        done++;
        bytes += body.length;
        if (done % 250 === 0) console.log(`  uploaded ${done}/${keys.length}`);
      } catch (error) {
        errors.push(`${key}: ${error instanceof Error ? error.message : error}`);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, keys.length) }, () => worker()));
  return { done, bytes, errors };
}

/**
 * Lists the bucket and deletes objects whose keys are not in `localKeys`.
 * When pushing a single mode, only that mode's remote keys are considered.
 */
async function cleanStale(localKeys: Set<string>, mode: ModeName | undefined): Promise<number> {
  const remoteKeys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: r2.bucket, ContinuationToken: continuationToken })
    );
    remoteKeys.push(...(res.Contents ?? []).map((obj) => obj.Key!));
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  const stale = remoteKeys.filter(
    (key) => (mode === undefined || keyMode(key) === mode) && !localKeys.has(key)
  );
  for (let i = 0; i < stale.length; i += 1000) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: r2.bucket,
        Delete: { Objects: stale.slice(i, i + 1000).map((Key) => ({ Key })) },
      })
    );
  }
  return stale.length;
}

/** Every published key is <category>/<mode>/... — this extracts the mode segment. */
const keyMode = (key: string): string | undefined => key.split('/')[1];

function parseModeArg(): ModeName | undefined {
  const index = process.argv.indexOf('--mode');
  if (index === -1) return undefined;
  const name = process.argv[index + 1];
  if (name === undefined || !(name in modes)) {
    console.error(`--mode must be one of: ${Object.keys(modes).join(', ')}`);
    process.exit(1);
  }
  return name as ModeName;
}

const clean = process.argv.includes('--clean');
const mode = parseModeArg();

console.log(
  `Pushing ${DATA_ROOT}${mode ? ` (mode: ${mode})` : ''} -> r2://${r2.bucket}${clean ? ' (clean)' : ''}`
);
const keys = walk(DATA_ROOT, DATA_ROOT)
  .filter((key) => mode === undefined || keyMode(key) === mode)
  // metadata.json is the UI's cache-bust signal — upload it after the data it points to.
  .sort((a, b) => Number(a.startsWith('metadata/')) - Number(b.startsWith('metadata/')));
console.log(`Found ${keys.length} files`);
if (keys.length === 0) {
  console.error('Nothing to push — is the data folder populated?');
  process.exit(1);
}

const started = Date.now();
const { done, bytes, errors } = await uploadAll(keys);

let deleted = 0;
if (clean) {
  deleted = await cleanStale(new Set(keys), mode);
  console.log(`Deleted ${deleted} stale objects`);
}

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(
  `Done in ${seconds}s: ${done} uploaded (${(bytes / 1024 / 1024).toFixed(1)} MB), ` +
    `${errors.length} failed` +
    (clean ? `, ${deleted} deleted` : '')
);
if (errors.length > 0) {
  console.error(errors.slice(0, 10).join('\n'));
  process.exit(1);
}
