import { API_PREFIX } from '@/constants/api';
import { useMode } from '@/hooks/useMode';
import { usePersistQuery } from '@/hooks/usePersistQuery';
import { fetchJson } from '@/utils/fetch';

import type { PpMappersBody } from '../types';

export const usePpMappers = () => {
  const mode = useMode();

  return usePersistQuery(['pp-mappers', mode], () => {
    return fetchJson<PpMappersBody>({
      url: `${API_PREFIX}/data/mappers/${mode}/pp-mappers.json`,
    });
  });
};
