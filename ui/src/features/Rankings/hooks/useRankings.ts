import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { QUERY_PERSISTENT_DATA_CONFIG } from '@/constants/api';
import type { Mode } from '@/constants/modes';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchCsvWithProgress, fetchWithPersist } from '@/utils/fetch';
import { getRankingsStorageKey } from '@/utils/storage';

import type { Ranking } from '../types';

export const useRankings = () => {
  const mode = useMode();
  const metadata = useMetadata();
  const [progress, setProgress] = useState<number | null>(null);

  const fetchData = async (modeToFetch: Mode): Promise<Ranking[] | null> => {
    const rankings = await fetchCsvWithProgress<Ranking>({
      path: `data/ranking/${modeToFetch}/players.csv`,
      setProgress,
    });
    return rankings;
  };

  const { isLoading, error, data } = useQuery(
    ['rankings', mode, metadata.data?.lastUpdated],
    () => {
      // Setting progress to null to hide the progress bar when data is taken from cache
      // We only want to show progress when the actual download is started
      setProgress(null);

      return fetchWithPersist({
        storageKey: getRankingsStorageKey(mode),
        metadata: metadata.data,
        action: fetchData,
      })(mode);
    },
    QUERY_PERSISTENT_DATA_CONFIG
  );

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data,
    progress,
  };
};
