import { useQuery } from '@tanstack/react-query';

import { API_PREFIX } from '@/constants/api';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';
import { SHARD_COUNTS, shardName } from '@/utils/shards';

import type { Score } from '../types';

/** A whole shard file: player id -> that player's scores. */
type ScoresShard = Record<string, Score[]>;

export const useScores = (playerId: number) => {
  const mode = useMode();
  const metadata = useMetadata();
  const shard = shardName(playerId, SHARD_COUNTS.playerScores);

  // Keyed by shard rather than by player, so players sharing a shard are fetched once.
  const { isLoading, error, data } = useQuery(
    ['scores-shard', mode, shard, metadata.data?.lastUpdated],
    () => {
      return fetchJson<ScoresShard>({
        url: `${API_PREFIX}/ranking/${mode}/player-scores/${shard}.json`,
      });
    },
    { select: (data: ScoresShard) => data[playerId] },
  );

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data,
  };
};
