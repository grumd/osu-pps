import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { API_PREFIX, QUERY_PERSISTENT_DATA_CONFIG } from '@/constants/api';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';

import type { FavMapper } from '../types';

export const useFavMappers = () => {
  const mode = useMode();
  const metadata = useMetadata();

  const { isLoading, error, data } = useQuery(
    ['mapper-maps', mode, metadata.data?.lastUpdated],
    () => {
      return fetchJson<FavMapper[]>({
        url: `${API_PREFIX}/data/mappers/${mode}/favored-mappers.json`,
      });
    },
    QUERY_PERSISTENT_DATA_CONFIG
  );

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data: useMemo(() => {
      return data?.map((mapper, index) => ({
        ...mapper,
        place: index + 1,
        namesString: mapper.names.join(' '),
      }));
    }, [data]),
  };
};
