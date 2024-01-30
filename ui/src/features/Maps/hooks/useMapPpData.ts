import { useQuery } from '@tanstack/react-query';

import { API_PREFIX } from '@/constants/api';
import type { Mode } from '@/constants/modes';
// import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { fetchJson } from '@/utils/fetch';
import { queryClient } from '@/utils/queryClient';

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

const getMapPpDataQueryKey = (mode: Mode, beatmapId: number, modsBitmask: number) => {
  return ['map-pp-data', mode, beatmapId, modsBitmask /*, metadata.data?.lastUpdated*/];
};

const fetchMapPpData = (mode: Mode, beatmapId: number, modsBitmask: number) => {
  return fetchJson<MapPpData>({
    url: `${API_PREFIX}/data/maps/${mode}/maps-scores/${beatmapId}_${modsBitmask}.json`,
  });
};

export const useMapPpData = (beatmapId: number, modsBitmask: number) => {
  const mode = useMode();
  // const metadata = useMetadata();

  const { isLoading, error, data } = useQuery(
    getMapPpDataQueryKey(mode, beatmapId, modsBitmask),
    () => fetchMapPpData(mode, beatmapId, modsBitmask)
  );

  return {
    isLoading: /*metadata.isLoading || */ isLoading,
    error: /*metadata.error || */ error,
    data,
  };
};

export const prefetchMapPpData = async (mode: Mode, beatmapId: number, modsBitmask: number) => {
  await queryClient.prefetchQuery({
    queryKey: getMapPpDataQueryKey(mode, beatmapId, modsBitmask),
    queryFn: () => fetchMapPpData(mode, beatmapId, modsBitmask),
  });
};
