import assert from 'node:assert/strict';
import { test } from 'node:test';

import { modes } from '../src/modes.ts';
import {
  modAcronymsToBitmask,
  modBits,
  simplifyMods,
  trimModsToDtHt,
} from '../src/utils/mods.ts';

test('modAcronymsToBitmask converts acronyms to the legacy bitmask', () => {
  assert.equal(modAcronymsToBitmask([]), 0);
  assert.equal(modAcronymsToBitmask(['HD', 'DT']), modBits.HD + modBits.DT);
  // NC counts as DT
  assert.equal(modAcronymsToBitmask(['NC']), modBits.DT);
  assert.equal(modAcronymsToBitmask(['DT', 'NC']), modBits.DT);
  // mods without a legacy bit (classic, lazer-only) are ignored
  assert.equal(modAcronymsToBitmask(['CL', 'BL', 'HD']), modBits.HD);
});

test('simplifyMods keeps only pp-affecting mods', () => {
  const all = modBits.NF + modBits.HD + modBits.DT + modBits.SD + modBits.PF;
  assert.equal(simplifyMods(all, modes.osu.id), modBits.HD + modBits.DT);
  assert.equal(simplifyMods(all, modes.taiko.id), modBits.HD + modBits.DT);
  assert.equal(simplifyMods(all, modes.fruits.id), modBits.HD + modBits.DT);
  // mania only keeps DT/EZ/HT
  assert.equal(simplifyMods(all, modes.mania.id), modBits.DT);
  assert.equal(simplifyMods(modBits.EZ + modBits.FL, modes.mania.id), modBits.EZ);
});

test('trimModsToDtHt keeps only DT and HT', () => {
  assert.equal(trimModsToDtHt(modBits.HD + modBits.DT + modBits.HR), modBits.DT);
  assert.equal(trimModsToDtHt(modBits.HT + modBits.FL), modBits.HT);
  assert.equal(trimModsToDtHt(modBits.HD), 0);
});
