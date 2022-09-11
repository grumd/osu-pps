import { useQuery } from '@tanstack/react-query';
import { get, set } from 'idb-keyval';

import { useMetadata } from './useMetadata';

/**
 * Built-in persist in react-query is pretty bad.
 * There's a discussion about it here https://github.com/TanStack/query/discussions/2649
 * Basically, it saves the whole client into localStorage/IndexedDB every time something updates.
 * It's incredibly slow and lags the whole application.
 * I've made a small hook that persists one query into IndexedDB,
 * and fetches from the server in the background if needed.
 */

interface PersistDataStore<TData> {
  data: TData;
  updatedOn: string;
}

const getPersistData = async <TData>(key: readonly unknown[]) => {
  return await get<PersistDataStore<TData>>(key.toString());
};

const savePersistData = async <TData>(key: readonly unknown[], data: TData, updatedOn: string) => {
  await set(key.toString(), { data, updatedOn });
};

export const usePersistQuery = <TKey extends readonly unknown[], TData>(
  key: TKey,
  fetchFn: () => Promise<TData | null>
) => {
  const meta = useMetadata();

  // Persisted IndexedDB query
  const { data: cachedStore, isLoading: isLoadingCache } = useQuery([...key, 'cached'], () => {
    return getPersistData<TData>(key);
  });
  const { data: cachedData, updatedOn: cachedOn } = cachedStore ?? {};

  // Server state query
  const { isLoading, error, ...rest } = useQuery(
    [...key, meta.data?.lastUpdated, cachedOn],
    async () => {
      if (meta.data && (!cachedOn || cachedOn < meta.data?.lastUpdated)) {
        const freshData = await fetchFn();
        void savePersistData(key, freshData, meta.data?.lastUpdated ?? '');
        return freshData;
      } else {
        return null; // Do not refetch data from server if cache is fresh enough
      }
    },
    {
      // Only start fetching from the server when we know if we have anything cached
      enabled: !!meta.data && !isLoadingCache,
    }
  );

  return {
    ...rest,
    data: rest.data ?? cachedData,
    isLoading: !rest.data && !cachedData && (meta.isLoading || isLoading),
    error: meta.error || error,
  };
};
