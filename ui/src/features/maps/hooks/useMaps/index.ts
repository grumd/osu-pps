import { useQuery } from '@tanstack/react-query';
import create from 'zustand';

import { QUERY_PERSISTENT_DATA_CONFIG } from '@/constants/api';
import type { CalcMode, Mode } from '@/constants/modes';
import { useMetadata } from '@/hooks/useMetadata';
import { useMode } from '@/hooks/useMode';
import { farmValueCalc } from '@/utils/farmValue';
import { fetchCsvWithProgress, fetchWithPersist } from '@/utils/fetch';
import { keys } from '@/utils/object';
import { getMapsDataStorageKey } from '@/utils/storage';

import type {
  Beatmap,
  BeatmapDiff,
  BeatmapDiffLegacy,
  BeatmapSet,
  BeatmapSetLegacy,
} from '../../types';
import { normalizeBeatmap, normalizeMapset } from './normalizer';

export const useLoadingProgress = create<{
  progress: number | null;
  setProgress: (progress: number | null) => void;
}>()((set) => ({
  progress: null,
  setProgress: (progress: number | null) => set({ progress }),
}));

export const useMaps = () => {
  const mode = useMode();
  const metadata = useMetadata();
  const setProgress = useLoadingProgress((state) => state.setProgress);

  const fetchData = async (modeToFetch: Mode): Promise<Beatmap[] | null> => {
    let diffsProgress = 0;
    let mapsetsProgress = 0;

    const [mapsetsInfo, diffsInfo] = await Promise.all([
      fetchCsvWithProgress<BeatmapSetLegacy | BeatmapSet>({
        path: `data/maps/${modeToFetch}/mapsets.csv`,
        setProgress: (progress) => {
          mapsetsProgress = progress;
          setProgress((mapsetsProgress + diffsProgress) / 2);
        },
      }),
      fetchCsvWithProgress<BeatmapDiffLegacy | BeatmapDiff>({
        path: `data/maps/${modeToFetch}/diffs.csv`,
        setProgress: (progress) => {
          diffsProgress = progress;
          setProgress((mapsetsProgress + diffsProgress) / 2);
        },
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
          farmValues: keys(farmValueCalc).reduce((farmAcc, key) => {
            farmAcc[key] = farmValueCalc[key](normItem);
            return farmAcc;
          }, {} as Record<CalcMode, number>),
        });
      }
      return acc;
    }, []);

    return beatmaps;
  };

  const { isLoading, error, data } = useQuery(
    ['maps', mode, metadata.data?.lastUpdated],
    () => {
      // Setting progress to null to hide the progress bar when data is taken from cache
      // We only want to show progress when the actual download is started
      setProgress(null);

      return fetchWithPersist({
        storageKey: getMapsDataStorageKey(mode),
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
  };
};
