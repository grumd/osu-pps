import { useQuery } from '@tanstack/react-query';

import { API_PREFIX } from '@/constants/api';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';
import { SHARD_COUNTS, shardName } from '@/utils/shards';

import type { FavMapperMap } from '../types';

/** A whole shard file: mapper id -> that mapper's mapsets. */
type MapperMapsShard = Record<string, FavMapperMap[]>;

export const useMapperMaps = (mapperId: number) => {
  const mode = useMode();
  const metadata = useMetadata();
  const shard = shardName(mapperId, SHARD_COUNTS.favoredMappersMaps);

  // Keyed by shard rather than by mapper, so mappers sharing a shard are fetched once.
  const { isLoading, error, data } = useQuery(
    ['mapper-maps-shard', mode, shard, metadata.data?.lastUpdated],
    () => {
      return fetchJson<MapperMapsShard>({
        url: `${API_PREFIX}/mappers/${mode}/favored-mappers-maps/${shard}.json`,
      });
    },
    { select: (data: MapperMapsShard) => data[mapperId] },
  );

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data,
  };
};
