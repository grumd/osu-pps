import { useQuery } from '@tanstack/react-query';

import { API_PREFIX, QUERY_PERSISTENT_DATA_CONFIG } from '@/constants/api';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';

import type { FavMapperMap } from '../types';

export const useMapperMaps = (mapperId: number) => {
  const mode = useMode();
  const metadata = useMetadata();

  const { isLoading, error, data } = useQuery(
    ['mapper-maps', mode, mapperId, metadata.data?.lastUpdated],
    () => {
      return fetchJson<FavMapperMap[]>({
        url: `${API_PREFIX}/data/mappers/${mode}/favored-mappers-maps/${mapperId}.json`,
      });
    },
    QUERY_PERSISTENT_DATA_CONFIG
  );

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data,
  };
};
