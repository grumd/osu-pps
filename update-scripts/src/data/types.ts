import type { OsuApiBeatmap } from '../osu-api/types.ts';

/** Entry of `temp/<mode>/user-ids.json`. */
export interface UserListEntry {
  name: string;
  id: number;
  /** total pp at the time of the rankings fetch */
  pp: number;
}

/**
 * Score statistics in the legacy (API v1 / "stable") format.
 * This is the shape published in `data/maps/<mode>/maps-scores/` and consumed by the UI.
 */
export interface LegacyScoreStatistics {
  count_50: number;
  count_100: number;
  count_300: number;
  count_miss: number;
  count_katu: number;
  count_geki: number;
}

/** A score kept per accuracy bucket; published in `data/maps/<mode>/maps-scores/<b>_<m>.json`. */
export interface BeatmapScoreStats {
  maxcombo: number;
  statistics: LegacyScoreStatistics;
  user_id: number;
  score_id: number;
  rank: string;
  pp: number;
}

/** Entry of `temp/<mode>/maps.json`. */
export interface MapRecord {
  /** simplified (pp-affecting only) mods bitmask */
  m: number;
  /** beatmap id */
  b: number;
  /** farmability score */
  x: number;
  /** estimated pp of a ~99% play */
  pp99: number;
  /**
   * number of players in this map's pp block (popularity adjustment). Blocks below the player
   * histogram's peak all share the peak's count — see `findHistogramTruncation`.
   */
  adj: number;
}

/** Entry of `temp/<mode>/maps-detailed.json`; also the source of `diffs.csv`/`mapsets.csv`. */
export interface DetailedMapRecord extends MapRecord {
  /** artist */
  art: string;
  /** title */
  t: string;
  /** difficulty (version) name */
  v: string;
  /** beatmapset id */
  s: number;
  /** drain length in seconds */
  l: number;
  bpm: number | null;
  /** star rating */
  d: number;
  /** passcount */
  p: number;
  /** hours since the map was last updated/ranked */
  h: number;
  /** ranked date in hours since epoch */
  appr_h: number;
  ar: number;
  /** overall difficulty */
  accuracy: number;
  cs: number;
  /** HP drain */
  drain: number;
  /** mapset host user id */
  mapper_id: number;
  /** key count, mania-specific maps only */
  k?: number;
}

/** Entry of `temp/<mode>/map-cache.json`, keyed by beatmap id. */
export type CachedBeatmap = OsuApiBeatmap & {
  /** "YYYY-MM-DD hh:mm:ss" (UTC), set when the entry was (re)fetched */
  cache_date?: string;
};

export type MapInfoCache = Record<string, CachedBeatmap>;

/** `temp/<mode>/user-scores.json`: per user id, scores as "<beatmapId>_<modsBitmask>_<pp>". */
export type UserScoresFile = Record<string, string[]>;

/** `temp/<mode>/user-scores-dates.json`: per user id, fetch time in unix minutes. */
export type UserScoreDatesFile = Record<string, number>;
