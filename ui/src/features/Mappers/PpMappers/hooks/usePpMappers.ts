import { useQuery } from '@tanstack/react-query';

import { API_PREFIX, QUERY_PERSISTENT_DATA_CONFIG } from '@/constants/api';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';

import type { PpMappersBody } from '../types';

export const usePpMappers = () => {
  const mode = useMode();
  const metadata = useMetadata();

  const { isLoading, error, data } = useQuery(
    ['pp-mappers', mode, metadata.data?.lastUpdated],
    () => {
      return fetchJson<PpMappersBody>({
        url: `${API_PREFIX}/data/mappers/${mode}/pp-mappers.json`,
      });
    },
    QUERY_PERSISTENT_DATA_CONFIG
  );

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data: data?.top20adj,
  };
};
