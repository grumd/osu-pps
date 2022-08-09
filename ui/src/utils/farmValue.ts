import { CalcMode } from '@/constants/modes';
import type { BeatmapDiff } from '@/features/maps/types';

export const farmValueCalc: Record<CalcMode, (map: BeatmapDiff) => number> = {
  [CalcMode.Base]: (map) => map.farmValue,
  [CalcMode.ByAge]: (map) => map.farmValue / map.hoursSinceRanked,
  [CalcMode.ByPasscount]: (map) => map.farmValue / map.passCount,
  [CalcMode.ByPopulationAndTime]: (map) =>
    (1000 * map.farmValue) /
    (map.adjusted || 1)**0.65 /
    (map.hoursSinceRanked || 1)**0.35,
};
