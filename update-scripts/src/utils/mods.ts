import { modes, type RulesetId } from '../modes.ts';

/** Legacy osu! mod bitmask values (API v1 / stable scoring). */
export const modBits = {
  NF: 1,
  EZ: 2,
  TD: 4,
  HD: 8,
  HR: 16,
  SD: 32,
  DT: 64,
  RX: 128,
  HT: 256,
  NC: 512,
  FL: 1024,
  AT: 2048,
  SO: 4096,
  AP: 8192,
  PF: 16384,
} as const;

/**
 * Converts an array of mod acronyms (as returned by the current API, e.g. ["HD", "DT", "CL"])
 * to the legacy bitmask. NC counts as DT; acronyms without a legacy bit (CL, lazer-only mods,
 * key mods, ...) contribute nothing.
 */
export function modAcronymsToBitmask(acronyms: readonly string[]): number {
  let bitmask = 0;
  for (const acronym of acronyms) {
    const bit = acronym === 'NC' ? modBits.DT : modBits[acronym as keyof typeof modBits] ?? 0;
    bitmask |= bit;
  }
  return bitmask;
}

function keepMods(bitmask: number, allowed: readonly number[]): number {
  return allowed.reduce((sum, mod) => sum + ((bitmask & mod) === mod ? mod : 0), 0);
}

/**
 * Removes mods that don't affect PP.
 * osu/taiko/fruits: DT, HD, HR, FL, HT, EZ. mania: DT, EZ, HT.
 */
export function simplifyMods(bitmask: number, rulesetId: RulesetId): number {
  const allowed =
    rulesetId === modes.mania.id
      ? [modBits.DT, modBits.EZ, modBits.HT]
      : [modBits.DT, modBits.HD, modBits.HR, modBits.FL, modBits.HT, modBits.EZ];
  return keepMods(bitmask, allowed);
}

/** Keeps only DT/HT — used to find the "base" version of a map for overweightness checks. */
export function trimModsToDtHt(bitmask: number): number {
  return keepMods(bitmask, [modBits.DT, modBits.HT]);
}
