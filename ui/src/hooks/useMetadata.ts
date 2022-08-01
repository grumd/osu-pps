import { useQuery } from '@tanstack/react-query';

import { API_PREFIX, QUERY_PERSISTENT_DATA_CONFIG } from '@/constants/api';
import { Mode } from '@/constants/modes';
import { Metadata } from '@/types/metadata';
import { fetchJson } from '@/utils/fetch';

import { useMode } from './useMode';

const fetchMetadata = async (mode: Mode) => {
  return await fetchJson<Metadata>({
    url: `${API_PREFIX}/data/metadata/${mode}/metadata.json`,
  });
};

export const useMetadata = () => {
  const mode = useMode();
  const { isLoading, error, data } = useQuery(
    ['metadata', mode],
    () => fetchMetadata(mode),
    QUERY_PERSISTENT_DATA_CONFIG
  );

  return { isLoading, error, data };
};
