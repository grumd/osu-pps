import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import { useMode } from '@/hooks/useMode';

import type { Beatmap, Filters } from '../../types';

const filterWorker = new Worker(new URL('./filter.worker.ts', import.meta.url));

const useWorkerResult = (worker: Worker) => {
  const data = useRef<Beatmap[] | null>(null);

  return useSyncExternalStore(
    useCallback(
      (notify) => {
        const onMessage = (res: MessageEvent<Beatmap[]>) => {
          if (res.data) {
            // Keep old data when worker skipped filtering and returned null
            data.current = res.data;
            notify();
          }
        };
        worker.addEventListener('message', onMessage);
        return () => {
          worker.removeEventListener('message', onMessage);
        };
      },
      [worker]
    ),
    () => data.current
  );
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
    // HACK: Takes more than 200ms to serialize the message,
    // so this effect runs last to not block previous effects from running
    filterWorker.postMessage(['maps-mode', { data, mode }]);
  }, [data, mode]);

  useEffect(() => {
    return () => {
      filterWorker.postMessage(['mode', null]);
    };
  }, []);

  return filteredData;
};
