export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Truncates (floors) a number to the given number of decimal places. */
export function truncateFloat(x: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(x * factor) / factor;
}

/** Returns the array without duplicates, keeping the first occurrence of each key. */
export function uniqBy<T>(array: readonly T[], getKey: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return array.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Splits an array into chunks of at most `size` elements. */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/** Sums `getValue` over the array. */
export function sumBy<T>(array: readonly T[], getValue: (item: T) => number): number {
  return array.reduce((sum, item) => sum + getValue(item), 0);
}

/** Hours elapsed since the given timestamp, rounded up. */
export function hoursSince(date: string): number {
  return Math.ceil((Date.now() - new Date(date).getTime()) / 1000 / 60 / 60);
}
