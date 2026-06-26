import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

import { parseChunked, stringifyChunked } from '@discoveryjs/json-ext';

/**
 * Reads and parses a JSON file as a stream.
 * Handles files too large for a single V8 string (e.g. the beatmap cache).
 */
export async function readJson<T>(filePath: string): Promise<T> {
  return (await parseChunked(fs.createReadStream(filePath))) as T;
}

/**
 * Stringifies data as a stream and writes it to a file, creating parent folders as needed.
 * Handles data too large for a single V8 string.
 */
export async function writeJson(filePath: string, data: unknown): Promise<void> {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await pipeline(Readable.from(stringifyChunked(data)), fs.createWriteStream(filePath, 'utf8'));
}

/** Synchronously writes a text file, creating parent folders as needed. */
export function writeFile(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
