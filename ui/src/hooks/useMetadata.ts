import { useQuery } from '@tanstack/react-query';

import { API_PREFIX } from '@/constants/api';
import type { Mode } from '@/constants/modes';
import type { Metadata } from '@/types/metadata';
import { fetchJson } from '@/utils/fetch';

import { useMode } from './useMode';

const fetchMetadata = async (mode: Mode) => {
  if (mode) {
    return fetchJson<Metadata>({
      url: `${API_PREFIX}/data/metadata/${mode}/metadata.json`,
    });
  }
};

export const useMetadata = () => {
  const mode = useMode();

  const { isLoading, error, data } = useQuery(['metadata', mode], () => fetchMetadata(mode), {
    enabled: !!mode,
  });

  return { isLoading, error, data };
};
