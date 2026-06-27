import _ from 'lodash/fp';
import { useState } from 'react';

import type { Mode } from '@/constants/modes';
import { useMode } from '@/hooks/useMode';
import { usePersistQuery } from '@/hooks/usePersistQuery';
import { fetchCsvWithProgress } from '@/utils/fetch';
import { overweightness } from '@/utils/overweightness';

import type {
  Beatmap,
  BeatmapDiff,
  BeatmapDiffLegacy,
  BeatmapSet,
  BeatmapSetLegacy,
} from '../../types';
import { normalizeBeatmap, normalizeMapset } from './normalizer';

export const useMaps = () => {
  const mode = useMode();

  const [diffsProgress, setDiffsProgress] = useState<number | null>(null);
  const [mapsetsProgress, setMapsetsProgress] = useState<number | null>(null);

  const fetchData = async (modeToFetch: Mode): Promise<Beatmap[] | null> => {
    const [mapsetsInfo, diffsInfo] = await Promise.all([
      fetchCsvWithProgress<BeatmapSetLegacy | BeatmapSet>({
        path: `data/maps/${modeToFetch}/mapsets.csv`,
        setProgress: setMapsetsProgress,
      }),
      fetchCsvWithProgress<BeatmapDiffLegacy | BeatmapDiff>({
        path: `data/maps/${modeToFetch}/diffs.csv`,
        setProgress: setDiffsProgress,
      }),
    ]);

    const mapsets = new Map<number, BeatmapSet>();
    for (const mapset of mapsetsInfo) {
      const normMapset = normalizeMapset(mapset);
      mapsets.set(normMapset.mapsetId, normMapset);
    }

    const beatmaps = diffsInfo.reduce((acc: Beatmap[], item) => {
      const normItem = normalizeBeatmap(item);
      const mapset = mapsets.get(normItem.mapsetId);
      if (mapset) {
        acc.push({
          ...normItem,
          ...mapset,
          overweightness: overweightness(normItem),
        });
      }
      return acc;
    }, []);

    setMapsetsProgress(null);
    setDiffsProgress(null);

    return beatmaps;
  };

  const { isLoading, error, data } = usePersistQuery(['maps', mode, 'version-2'], () => {
    return fetchData(mode);
  });

  return {
    isLoading,
    error,
    data,
    progress:
      _.isNumber(diffsProgress) && _.isNumber(mapsetsProgress)
        ? (diffsProgress + mapsetsProgress) / 2
        : null,
  };
};
