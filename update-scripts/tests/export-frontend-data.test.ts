import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import type { DetailedMapRecord } from '../src/data/types.ts';
import { mockConfigModule, mockTimingsModule, setupTestDirs } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

const { exportFrontendData } = await import('../src/steps/export-frontend-data.ts');
const { files } = await import('../src/paths.ts');
const { modes } = await import('../src/modes.ts');

const makeMap = (over: Partial<DetailedMapRecord>): DetailedMapRecord => ({
  m: 0,
  b: 1,
  x: 10.5,
  pp99: 300.25,
  adj: 5,
  art: 'Artist',
  t: 'Title',
  v: 'Hard',
  s: 11,
  l: 100,
  bpm: 180,
  d: 5.5,
  p: 10_000,
  h: 1000,
  appr_h: 400_000,
  ar: 9,
  accuracy: 8,
  cs: 4,
  drain: 5,
  mapper_id: 777,
  ...over,
});

// two diffs of the same mapset + one other mapset
const maps = [
  makeMap({ b: 1, m: 0, s: 11 }),
  makeMap({ b: 2, m: 64, s: 11, v: 'Insane' }),
  makeMap({ b: 3, m: 0, s: 22, art: 'Other', t: 'Song', bpm: 200 }),
];

fs.mkdirSync(`${dirs.tempDir}/osu`, { recursive: true });
fs.writeFileSync(files.mapsDetailedList(modes.osu), JSON.stringify(maps));

await exportFrontendData(modes.osu);

test('writes mapsets.csv with one row per unique mapset', () => {
  const csv = fs.readFileSync(files.mapsetsCsv(modes.osu), 'utf8');
  assert.equal(csv, 'art,t,bpm,s\r\nArtist,Title,180,11\r\nOther,Song,200,22');
});

test('writes diffs.csv with the legacy column order', () => {
  const csv = fs.readFileSync(files.diffsCsv(modes.osu), 'utf8');
  const [header, firstRow] = csv.split('\r\n');
  assert.equal(header, 'm,b,x,pp99,adj,v,s,l,d,p,h,appr_h,ar,accuracy,cs,drain');
  assert.equal(firstRow, '0,1,10.5,300.25,5,Hard,11,100,5.5,10000,1000,400000,9,8,4,5');
  assert.equal(csv.split('\r\n').length, 4);
});

test('stamps metadata with the update time', () => {
  const metadata = JSON.parse(fs.readFileSync(files.metadata(modes.osu), 'utf8'));
  assert.ok(Date.now() - new Date(metadata.lastUpdated).getTime() < 60_000);
});
