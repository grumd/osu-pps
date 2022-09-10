import type { CalcMode } from '@/constants/modes';

import type { ModToggleState } from '../components/ModToggle';

export interface BeatmapDiffLegacy {
  m: number;
  b: number; // map id
  x: number;
  pp99: number;
  adj: number;
  v: string;
  s: number; // mapset id
  l: number;
  d: number;
  p: number;
  h: number;
  appr_h: number;
  k?: number;
}

export interface BeatmapSetLegacy {
  art: string;
  t: string;
  bpm: number;
  g: number;
  ln: number;
  s: number;
}

export interface BeatmapLegacy extends BeatmapDiffLegacy, BeatmapSetLegacy {}

export interface BeatmapDiff {
  beatmapId: number;
  mapsetId: number;
  farmValue: number;
  mods: number;
  pp: number;
  adjusted: number; // deprecate?
  version: string;
  length: number;
  difficulty: number;
  passCount: number;
  hoursSinceRanked: number;
  approvedHoursTimestamp: number;
  maniaKeys?: number;
}

export interface BeatmapSet {
  mapsetId: number;
  artist: string;
  title: string;
  bpm: number;
  genre: number;
  language: number;
}

export interface Beatmap extends BeatmapDiff, BeatmapSet {
  farmValues: Record<CalcMode, number>;
}

export interface Filters {
  songName?: string;
  bpmMax?: number | null;
  bpmMin?: number | null;
  ppMax?: number | null;
  ppMin?: number | null;
  lengthMin?: number | null;
  lengthMax?: number | null;
  diffMin?: number | null;
  diffMax?: number | null;
  dt?: ModToggleState;
  hd?: ModToggleState;
  hr?: ModToggleState;
  fl?: ModToggleState;
  calcMode: CalcMode;
  count: number;
  isShowingMore: boolean;
  languages?: string[];
  genres?: string[];
}
