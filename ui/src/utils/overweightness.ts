export const OVERWEIGHTNESS_DISPLAY_SCALE = 1000;

export const overweightness = (map: {
  farmValue: number;
  adjusted: number;
  hoursSinceRanked: number;
}): number =>
  (OVERWEIGHTNESS_DISPLAY_SCALE * map.farmValue) /
  (map.adjusted || 1) ** 0.65 /
  (map.hoursSinceRanked || 1) ** 0.35;
