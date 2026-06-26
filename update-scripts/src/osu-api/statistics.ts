import { modes, type RulesetId } from '../modes.ts';
import type { LegacyScoreStatistics } from '../data/types.ts';
import type { OsuApiScoreStatistics } from './types.ts';

/**
 * Converts lazer hit results to the legacy `count_*` statistics published for the UI.
 *
 * | legacy      | osu   | taiko | fruits            | mania   |
 * | ----------- | ----- | ----- | ----------------- | ------- |
 * | count_300   | great | great | great (fruits)    | great   |
 * | count_100   | ok    | ok    | large_tick_hit    | ok      |
 * | count_50    | meh   | —     | small_tick_hit    | meh     |
 * | count_miss  | miss  | miss  | miss              | miss    |
 * | count_geki  | —     | —     | —                 | perfect |
 * | count_katu  | —     | —     | small_tick_miss   | good    |
 */
export function toLegacyStatistics(
  statistics: OsuApiScoreStatistics,
  rulesetId: RulesetId
): LegacyScoreStatistics {
  const count = (value: number | undefined) => value ?? 0;

  if (rulesetId === modes.fruits.id) {
    return {
      count_300: count(statistics.great),
      count_100: count(statistics.large_tick_hit),
      count_50: count(statistics.small_tick_hit),
      count_miss: count(statistics.miss),
      count_katu: count(statistics.small_tick_miss),
      count_geki: 0,
    };
  }
  if (rulesetId === modes.mania.id) {
    return {
      count_300: count(statistics.great),
      count_100: count(statistics.ok),
      count_50: count(statistics.meh),
      count_miss: count(statistics.miss),
      count_katu: count(statistics.good),
      count_geki: count(statistics.perfect),
    };
  }
  // osu, taiko
  return {
    count_300: count(statistics.great),
    count_100: count(statistics.ok),
    count_50: count(statistics.meh),
    count_miss: count(statistics.miss),
    count_katu: 0,
    count_geki: 0,
  };
}
