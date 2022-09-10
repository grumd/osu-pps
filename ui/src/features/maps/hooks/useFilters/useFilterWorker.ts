import { useEffect, useState } from 'react';

import type { Beatmap, Filters } from '../../types';

const filterWorker = new Worker(new URL('./filter.worker.ts', import.meta.url));

const useWorkerResult = (worker: Worker) => {
  const [result, setResult] = useState<Beatmap[] | null>(null);

  useEffect(() => {
    const listener = (res: MessageEvent<Beatmap[]>) => {
      setResult(res.data);
    };
    worker.addEventListener('message', listener);
    return () => {
      worker.removeEventListener('message', listener);
    };
  }, [worker]);

  return result;
};

export const useFilterWorker = (
  data: Beatmap[] | null | undefined,
  filters: Filters
): Beatmap[] | null => {
  const filteredData = useWorkerResult(filterWorker);

  useEffect(() => {
    filterWorker.postMessage(['maps', data || []]);
  }, [data]);

  useEffect(() => {
    filterWorker.postMessage(['filters', filters]);
  }, [filters]);

  return filteredData;
};
