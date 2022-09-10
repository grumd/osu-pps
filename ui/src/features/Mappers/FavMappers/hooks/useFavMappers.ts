import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { API_PREFIX } from '@/constants/api';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';

import type { FavMapper } from '../types';

export const useFavMappers = () => {
  const mode = useMode();
  const metadata = useMetadata();

  const { isLoading, error, data } = useQuery(
    ['fav-mappers', mode, metadata.data?.lastUpdated],
    () => {
      return fetchJson<FavMapper[]>({
        url: `${API_PREFIX}/data/mappers/${mode}/favored-mappers.json`,
      });
    }
  );

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data: useMemo(() => {
      return data?.map((mapper, index) => ({
        place: index + 1,
        namesString: mapper.names.join(' '),
        id: mapper.mapperId,
        value: mapper.count,
        names: mapper.names,
      }));
    }, [data]),
  };
};
