/**
 * Types for the osu! API v2 responses we consume.
 * Score objects use the new "solo score" format (requires the `x-api-version` header,
 * see https://osu.ppy.sh/docs/index.html#score).
 * Only fields actually used by the pipeline are declared.
 */

export interface OsuApiMod {
  acronym: string;
  settings?: Record<string, unknown>;
}

/**
 * Lazer hit results. Which keys are present depends on the ruleset;
 * see https://osu.ppy.sh/docs/index.html#scorestatistics
 */
export interface OsuApiScoreStatistics {
  perfect?: number;
  great?: number;
  good?: number;
  ok?: number;
  meh?: number;
  miss?: number;
  small_tick_hit?: number;
  small_tick_miss?: number;
  large_tick_hit?: number;
  large_tick_miss?: number;
  ignore_hit?: number;
  ignore_miss?: number;
  slider_tail_hit?: number;
  legacy_combo_increase?: number;
}

/** A score in the solo-score format (x-api-version >= 20220705). */
export interface OsuApiScore {
  id: number;
  user_id: number;
  beatmap_id: number;
  ruleset_id: number;
  /** 0..1 */
  accuracy: number;
  /** null while the score is not yet processed server-side */
  pp: number | null;
  max_combo: number;
  rank: string;
  mods: OsuApiMod[];
  statistics: OsuApiScoreStatistics;
  ended_at: string;
  passed: boolean;
  total_score: number;
  legacy_total_score: number | null;
  legacy_score_id: number | null;
}

export interface OsuApiBeatmapOwner {
  id: number;
  username: string;
}

export interface OsuApiBeatmapsetCovers {
  list?: string;
  [key: string]: string | undefined;
}

export interface OsuApiBeatmapset {
  id: number;
  artist: string;
  title: string;
  creator: string;
  user_id: number;
  favourite_count: number;
  ranked_date: string | null;
  submitted_date?: string | null;
  covers?: OsuApiBeatmapsetCovers;
}

/** BeatmapExtended with the `beatmapset` and `owners` includes (GET /beatmaps?ids[]=). */
export interface OsuApiBeatmap {
  id: number;
  beatmapset_id: number;
  mode_int: number;
  version: string;
  difficulty_rating: number;
  bpm: number | null;
  /** drain length in seconds */
  hit_length: number;
  /** overall difficulty */
  accuracy: number;
  ar: number;
  cs: number;
  /** HP drain */
  drain: number;
  passcount: number;
  playcount: number;
  last_updated: string;
  /** mapset host user id */
  user_id: number;
  owners?: OsuApiBeatmapOwner[];
  beatmapset: OsuApiBeatmapset;
}

export interface OsuApiRankingEntry {
  pp: number;
  user: {
    id: number;
    username: string;
  };
}

export interface OsuApiRankingsResponse {
  cursor: { page: number } | null;
  ranking: OsuApiRankingEntry[];
  total: number;
}

export interface OsuApiUser {
  id: number;
  username: string;
}

/** A favourited beatmapset from GET /users/{id}/beatmapsets/favourite. */
export interface OsuApiFavouriteBeatmapset {
  id: number;
  artist: string;
  title: string;
  creator: string;
  user_id: number;
  ranked_date: string | null;
  covers?: OsuApiBeatmapsetCovers;
}
