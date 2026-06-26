import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import type { DetailedMapRecord } from '../src/data/types.ts';
import { mockConfigModule, mockTimingsModule, readJsonFile, setupTestDirs } from './helpers.ts';

const dirs = setupTestDirs();
mockConfigModule(dirs.packageRoot);
mockTimingsModule();

const { calculateRankings } = await import('../src/steps/calculate-rankings.ts');
const { files } = await import('../src/paths.ts');
const { modes } = await import('../src/modes.ts');

const makeMap = (over: Partial<DetailedMapRecord>): DetailedMapRecord => ({
  m: 0,
  b: 0,
  x: 1,
  pp99: 300,
  adj: 1,
  art: 'Artist',
  t: 'Title',
  v: 'Hard',
  s: 1,
  l: 100,
  bpm: 180,
  d: 5,
  p: 10_000,
  h: 1000,
  appr_h: 400_000,
  ar: 9,
  accuracy: 8,
  cs: 4,
  drain: 5,
  mapper_id: 1,
  ...over,
});

// Map 1 is heavily overweighted (huge x), map 2 is underweighted (tiny x).
// Both have adj=1, h=1000 -> ow = x / 1000^0.35 = x / 11.18...
const maps: DetailedMapRecord[] = [
  makeMap({ b: 1, m: 0, x: 1000, art: 'A', t: 'One', v: 'Easy' }),
  makeMap({ b: 1, m: 72, x: 500 }), // HD+DT combo of the same map
  makeMap({ b: 2, m: 0, x: 0.01, art: 'B', t: 'Two', v: 'Hard' }),
  // unplayed filler maps that drag the average overweightness down
  makeMap({ b: 3, m: 0, x: 0.01 }),
  makeMap({ b: 4, m: 0, x: 0.01 }),
  makeMap({ b: 5, m: 0, x: 0.01 }),
];

const players = [
  { name: 'farmer', id: 10, pp: 5000 },
  { name: 'honest', id: 11, pp: 4000 },
  { name: 'no-scores', id: 12, pp: 3000 },
];

// score strings: "<beatmapId>_<fullModsBitmask>_<pp>"
const userScores = {
  // plays the overweighted map with NC+HD (584 = 512 NC + 64 DT + 8 HD), and an unknown map
  10: ['1_584_500', '999_0_100'],
  // plays the underweighted map nomod
  11: ['2_0_400'],
};
const userScoreDates = { 10: 29_000_000, 11: 29_000_001 };

fs.mkdirSync(`${dirs.tempDir}/osu`, { recursive: true });
fs.writeFileSync(files.userIdsList(modes.osu), JSON.stringify(players));
fs.writeFileSync(files.userScoresList(modes.osu), JSON.stringify(userScores));
fs.writeFileSync(files.userScoresDates(modes.osu), JSON.stringify(userScoreDates));
fs.writeFileSync(files.mapsDetailedList(modes.osu), JSON.stringify(maps));

await calculateRankings(modes.osu);

test('penalizes scores on overweighted maps and boosts underweighted ones', () => {
  const farmerScores = readJsonFile<Array<Record<string, unknown>>>(
    files.rankingsPlayerScores(modes.osu, 10)
  );
  const overweighted = farmerScores.find((score) => score.beatmapId === 1)!;
  assert.equal(overweighted.title, 'A - One [Easy]');
  assert.equal(overweighted.mods, '584');
  assert.equal(overweighted.ppOld, 500);
  assert.ok((overweighted.ppNew as number) < 500, 'overweighted score must lose pp');

  const honestScores = readJsonFile<Array<Record<string, unknown>>>(
    files.rankingsPlayerScores(modes.osu, 11)
  );
  const underweighted = honestScores[0]!;
  assert.equal(underweighted.ppOld, 400);
  assert.ok((underweighted.ppNew as number) > 400, 'underweighted score must gain pp');
});

test('passes scores on unknown beatmaps through unchanged', () => {
  const farmerScores = readJsonFile<Array<Record<string, unknown>>>(
    files.rankingsPlayerScores(modes.osu, 10)
  );
  const unknown = farmerScores.find((score) => score.beatmapId === 999)!;
  assert.equal(unknown.title, '999');
  assert.equal(unknown.ppOld, 100);
  assert.equal(unknown.ppNew, 100);
});

test('writes the players csv sorted by new pp, skipping players without scores', () => {
  const csv = fs.readFileSync(files.rankingsCsv(modes.osu), 'utf8');
  const [header, ...rows] = csv.split('\r\n');
  assert.equal(header, 'id,name,ppOld,ppNew,ppDiff,minuteUpdated');
  assert.equal(rows.length, 2, 'player 12 has no scores and is skipped');
  // the farmer keeps a higher total, but the order is by recalculated pp
  const ids = rows.map((row) => row.split(',')[0]);
  assert.deepEqual(ids, ['10', '11']);
  const farmerRow = rows[0]!.split(',');
  assert.equal(farmerRow[1], 'farmer');
  assert.equal(farmerRow[2], '5000'); // ppOld
  assert.match(farmerRow[3]!, /^\d+\.\d{2}$/); // ppNew with 2 decimals
  assert.equal(farmerRow[5], '29000000');
});

test('writes the legacy compressed rankings with a map-info string table', () => {
  const compressed = readJsonFile<Array<[string, number, number, string[]]>>(
    files.rankingsCompressed(modes.osu)
  );
  const mapInfos = readJsonFile<string[]>(files.rankingsMapInfos(modes.osu));

  assert.equal(compressed.length, 2);
  const [name, minuteUpdated, ppDiff, scores] = compressed[0]!;
  assert.equal(name, 'farmer');
  assert.equal(minuteUpdated, 29_000_000);
  assert.ok(ppDiff < 0, 'the farmer lost pp overall');
  // every score string references a map-info index
  for (const scoreString of scores) {
    const index = Number(scoreString.split('_')[0]);
    assert.ok(mapInfos[index]);
  }
  assert.ok(mapInfos.includes('1 A - One [Easy]'));
  assert.ok(mapInfos.includes('999 999'));
});
