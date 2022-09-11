import { useEffect, useState } from 'react';

import { useMode } from '@/hooks/useMode';

import type { Beatmap, Filters } from '../../types';

const filterWorker = new Worker(new URL('./filter.worker.ts', import.meta.url));

const useWorkerResult = (worker: Worker) => {
  const [result, setResult] = useState<Beatmap[] | null>(null);

  useEffect(() => {
    const listener = (res: MessageEvent<Beatmap[]>) => {
      console.log('worker sends new data', res.data.length);
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
  const mode = useMode();
  const filteredData = useWorkerResult(filterWorker);

  useEffect(() => {
    console.log('posting mode change', mode);
    filterWorker.postMessage(['mode', mode]);
  }, [mode]);

  useEffect(() => {
    console.log('posting maps change', data?.length);
    filterWorker.postMessage(['maps', data || []]);
  }, [data]);

  useEffect(() => {
    console.log('posting filters change');
    filterWorker.postMessage(['filters', filters]);
  }, [filters]);

  return filteredData;
};
