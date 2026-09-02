import { useQuery } from '@tanstack/react-query';

import { API_PREFIX } from '@/constants/api';
import type { Mode } from '@/constants/modes';
// import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';
import { queryClient } from '@/utils/queryClient';
import { SHARD_COUNTS, shardName } from '@/utils/shards';

type PpData = {
  maxcombo: number;
  statistics: {
    count_50: number;
    count_100: number;
    count_300: number;
    count_miss: number;
    count_katu: number;
    count_geki: number;
  };
  user_id: number;
  score_id: number;
  rank: 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'X' | 'SH' | 'XH';
  pp: number;
};

export type MapPpData = Record<number, PpData>;

export type DataPoint = PpData & { accuracy: number };

/** A whole shard file: map+mods id -> that map's scores by accuracy. */
type MapPpShard = Record<string, MapPpData>;

const getMapModId = (beatmapId: number, modsBitmask: number) => `${beatmapId}_${modsBitmask}`;

// Keyed by shard rather than by map, so the maps sharing a shard are fetched once between them.
const getMapPpShardQueryKey = (mode: Mode, mapModId: string) => {
  return ['map-pp-shard', mode, shardName(mapModId, SHARD_COUNTS.mapsScores)];
};

const fetchMapPpShard = (mode: Mode, mapModId: string) => {
  const shard = shardName(mapModId, SHARD_COUNTS.mapsScores);
  return fetchJson<MapPpShard>({
    url: `${API_PREFIX}/maps/${mode}/maps-scores/${shard}.json`,
  });
};

export const useMapPpData = (beatmapId: number, modsBitmask: number) => {
  const mode = useMode();
  // const metadata = useMetadata();
  const mapModId = getMapModId(beatmapId, modsBitmask);

  const { isLoading, error, data } = useQuery(
    getMapPpShardQueryKey(mode, mapModId),
    () => fetchMapPpShard(mode, mapModId),
    { select: (shard: MapPpShard) => shard[mapModId] },
  );

  return {
    isLoading: /*metadata.isLoading || */ isLoading,
    error: /*metadata.error || */ error,
    data,
  };
};

export const prefetchMapPpData = async (mode: Mode, beatmapId: number, modsBitmask: number) => {
  const mapModId = getMapModId(beatmapId, modsBitmask);
  await queryClient.prefetchQuery({
    queryKey: getMapPpShardQueryKey(mode, mapModId),
    queryFn: () => fetchMapPpShard(mode, mapModId),
  });
};
