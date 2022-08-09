import type { BeatmapDiff, BeatmapDiffLegacy, BeatmapSet, BeatmapSetLegacy } from '../../types';

export const isLegacyMapset = (map: BeatmapSet | BeatmapSetLegacy): map is BeatmapSetLegacy => !!(map as BeatmapSetLegacy).s;

export const isLegacyBeatmap = (map: BeatmapDiff | BeatmapDiffLegacy): map is BeatmapDiffLegacy => !!(map as BeatmapDiffLegacy).b;

export const normalizeMapset = (mapset: BeatmapSet | BeatmapSetLegacy): BeatmapSet => {
  if (isLegacyMapset(mapset)) {
    return {
      mapsetId: mapset.s,
      artist: mapset.art,
      title: mapset.t,
      bpm: mapset.bpm,
      genre: mapset.g,
      language: mapset.ln,
    };
  }
  return mapset;
};

export const normalizeBeatmap = (diff: BeatmapDiff | BeatmapDiffLegacy): BeatmapDiff => {
  if (isLegacyBeatmap(diff)) {
    return {
      beatmapId: diff.b,
      mapsetId: diff.s,
      farmValue: diff.x,
      mods: diff.m,
      pp: diff.pp99,
      adjusted: diff.adj, // deprecate?
      version: diff.v,
      length: diff.l,
      difficulty: diff.d,
      passCount: diff.p,
      hoursSinceRanked: diff.h,
      approvedHoursTimestamp: diff.appr_h,
      maniaKeys: diff.k,
    };
  }
  return diff;
};
