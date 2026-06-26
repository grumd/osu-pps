export const overweightness = (x: number, adj: number, hours: number): number =>
  x / Math.pow(adj || 1, 0.65) / Math.pow(hours || 1, 0.35);
