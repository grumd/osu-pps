import _ from 'lodash/fp';
import { useEffect, useMemo, useState } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

// Subscribes to a zustand state with a debounce function.
export const useDebouncedStateSnapshot = <T extends object>(
  useStore: UseBoundStore<StoreApi<T>>
): T => {
  const [snapshot, setSnapshot] = useState<T>(useStore.getState());

  const setSnapshotDebounced = useMemo(() => _.debounce(100, setSnapshot), [setSnapshot]);

  useEffect(() =>
    useStore.subscribe((newState) => {
      setSnapshotDebounced(newState);
    })
  );

  return snapshot;
};
