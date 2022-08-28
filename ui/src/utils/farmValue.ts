import { CalcMode } from '@/constants/modes';

export const farmValueCalc: Record<
  CalcMode,
  (map: {
    farmValue: number;
    hoursSinceRanked: number;
    passCount: number;
    adjusted: number;
  }) => number
> = {
  [CalcMode.Base]: (map) => map.farmValue,
  [CalcMode.ByAge]: (map) => map.farmValue / map.hoursSinceRanked,
  [CalcMode.ByPasscount]: (map) => map.farmValue / map.passCount,
  [CalcMode.ByPopulationAndTime]: (map) =>
    (1000 * map.farmValue) / (map.adjusted || 1) ** 0.65 / (map.hoursSinceRanked || 1) ** 0.35,
};
