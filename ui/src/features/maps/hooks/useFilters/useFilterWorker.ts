import { startTransition, useEffect, useState } from 'react';

import { useMode } from '@/hooks/useMode';

import type { Beatmap, Filters } from '../../types';

const filterWorker = new Worker(new URL('./filter.worker.ts', import.meta.url));

const useWorkerResult = (worker: Worker) => {
  const [result, setResult] = useState<Beatmap[] | null>(null);

  useEffect(() => {
    const listener = (res: MessageEvent<Beatmap[]>) => {
      console.log('worker sends new data', res.data?.length);
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
): Beatmap[] | null | undefined => {
  const mode = useMode();

  const filteredData = useWorkerResult(filterWorker);

  useEffect(() => {
    filterWorker.postMessage(['mode', mode]);
  }, [mode]);

  useEffect(() => {
    filterWorker.postMessage(['filters', filters]);
  }, [filters]);

  useEffect(() => {
    startTransition(() => {
      // HACK: Takes more than 200ms to serialize, so this effect runs last to not block previous effects from running
      filterWorker.postMessage(['maps-mode', { data, mode }]);
    });
  }, [data, mode]);

  useEffect(() => {
    return () => {
      filterWorker.postMessage(['mode', null]);
    };
  }, []);

  return filteredData;
};
