import { useMemo } from 'react';

import { API_PREFIX } from '@/constants/api';
import { useMode } from '@/hooks/useMode';
import { usePersistQuery } from '@/hooks/usePersistQuery';
import { fetchJson } from '@/utils/fetch';

import type { FavMapper } from '../types';

export const useFavMappers = () => {
  const mode = useMode();

  const { isLoading, error, data } = usePersistQuery(['fav-mappers', mode], () => {
    return fetchJson<FavMapper[]>({
      url: `${API_PREFIX}/data/mappers/${mode}/favored-mappers.json`,
    });
  });

  return {
    isLoading,
    error,
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
