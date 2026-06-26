import { delay } from './misc.ts';

interface RunJobsOptions<T> {
  items: readonly T[];
  /** Processes one item. Errors propagate — catch inside the job if the run should continue. */
  job: (item: T, index: number) => Promise<void>;
  /** Minimum time per job in ms — effectively a rate limit for API-calling jobs. */
  minJobTime?: number;
  /** Log progress + ETA every 10% of items (default true). */
  logProgress?: boolean;
}

/**
 * Runs a job for every item sequentially, keeping at least `minJobTime` between job starts,
 * and logs progress with an ETA estimate.
 */
export async function runJobs<T>({
  items,
  job,
  minJobTime,
  logProgress = true,
}: RunJobsOptions<T>): Promise<void> {
  const startTime = Date.now();
  const logEvery = Math.max(1, Math.floor(items.length / 10));

  for (let index = 0; index < items.length; index++) {
    const item = items[index]!;
    if (minJobTime) {
      await Promise.all([job(item, index), delay(minJobTime)]);
    } else {
      await job(item, index);
    }

    const done = index + 1;
    if (logProgress && done % logEvery === 0 && done < items.length) {
      const elapsedMs = Date.now() - startTime;
      const etaSeconds = ((elapsedMs / done) * (items.length - done)) / 1000;
      const h = Math.floor(etaSeconds / 3600);
      const m = Math.floor((etaSeconds % 3600) / 60);
      const s = Math.floor(etaSeconds % 60);
      console.log(
        `${Math.floor((100 * done) / items.length)}% done - ETA ${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }
  }
}
