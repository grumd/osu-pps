import { useQuery } from '@tanstack/react-query';

import { API_PREFIX } from 'constants/api';
import { Mode } from 'constants/modes';

import { useMode } from 'hooks/useMode';
import { useMetadata } from 'hooks/useMetadata';

import { fetchCsv, fetchWithPersist } from 'utils/fetch';
import { getMapsDataStorageKey } from 'utils/storage';

import { BeatmapSet, BeatmapDiff, BeatmapSetLegacy, BeatmapDiffLegacy, Beatmap } from './types';
import { normalizeBeatmap, normalizeMapset } from './normalizer';

const fetchData = async (mode: Mode): Promise<Beatmap[] | null> => {
  const [mapsetsInfo, diffsInfo] = await Promise.all([
    fetchCsv<BeatmapSetLegacy | BeatmapSet>({ url: `${API_PREFIX}/data/maps/${mode}/mapsets.csv` }),
    fetchCsv<BeatmapDiffLegacy | BeatmapDiff>({ url: `${API_PREFIX}/data/maps/${mode}/diffs.csv` }),
  ]);

  const mapsets = new Map<number, BeatmapSet>();
  for (const mapset of mapsetsInfo) {
    const normMapset = normalizeMapset(mapset);
    mapsets.set(normMapset.mapsetId, normMapset);
  }

  const beatmaps = diffsInfo.map((item) => {
    const normItem = normalizeBeatmap(item);
    return {
      ...normItem,
      ...mapsets.get(normItem.mapsetId)!, // Corresponding mapset always exists
    };
  });

  return beatmaps;
};

export const useMaps = () => {
  const mode = useMode();
  const metadata = useMetadata();

  const { isLoading, error, data } = useQuery(['maps', mode, metadata.data], () => {
    return fetchWithPersist({
      storageKey: getMapsDataStorageKey(mode),
      metadata: metadata.data,
      action: fetchData,
    })(mode);
  });

  return {
    isLoading: metadata.isLoading || isLoading,
    error: metadata.error || error,
    data,
  };
};
