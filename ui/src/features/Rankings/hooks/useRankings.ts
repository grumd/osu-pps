import { useState } from 'react';

import type { Mode } from '@/constants/modes';
import { useMode } from '@/hooks/useMode';
import { usePersistQuery } from '@/hooks/usePersistQuery';
import { fetchCsvWithProgress } from '@/utils/fetch';

import type { Ranking } from '../types';

export const useRankings = () => {
  const mode = useMode();
  const [progress, setProgress] = useState<number | null>(null);

  const fetchData = async (modeToFetch: Mode): Promise<Ranking[] | null> => {
    const rankings = await fetchCsvWithProgress<Ranking>({
      path: `data/ranking/${modeToFetch}/players.csv`,
      setProgress,
    });
    return rankings;
  };

  const { isLoading, error, data } = usePersistQuery(['rankings', mode], () => {
    // Setting progress to null to hide the progress bar when data is taken from cache
    // We only want to show progress when the actual download is started
    setProgress(null);
    return fetchData(mode);
  });

  return {
    isLoading,
    error,
    data,
    progress,
  };
};
