import { useQuery } from '@tanstack/react-query';

import { API_PREFIX } from '@/constants/api';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';

import type { Score } from '../types';

export const useScores = (playerId: number) => {
  const mode = useMode();
  const metadata = useMetadata();

  const { isLoading, error, data } = useQuery(
    ['scores', mode, playerId, metadata.data?.lastUpdated],
    () => {
      return fetchJson<Score[]>({
        url: `${API_PREFIX}/data/ranking/${mode}/player-scores/${playerId}.json`,
      });
    }
  );

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data,
  };
};
