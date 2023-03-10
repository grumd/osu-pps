import _ from 'lodash/fp';
import create from 'zustand';
import { persist } from 'zustand/middleware';

import { CalcMode, Mode } from '@/constants/modes';
import { sortOptions } from '@/constants/options';
import { useMode } from '@/hooks/useMode';
import { keys } from '@/utils/object';

import type { Filters } from '../../types';

const initialFilters: Filters = {
  count: 20,
  calcMode: CalcMode.ByPopulationAndTime,
  isShowingMore: false,
  sorting: sortOptions[0],
};

const initialFiltersMap: Record<Mode, Filters> = Object.fromEntries(
  Object.values(Mode).map((mode) => {
    return [mode, initialFilters];
  })
) as Record<Mode, Filters>;

interface FiltersStore {
  filters: Record<Mode, Filters>;
  readonly setFilter: <K extends keyof Filters>(mode: Mode, key: K, value: Filters[K]) => void;
  readonly resetFilter: (mode: Mode) => void;
  readonly nextPage: (mode: Mode) => void;
}

const isFilterStoreLike = (obj: unknown): obj is { filters: Record<Mode, Filters> } => {
  return typeof (obj as { filters: Record<Mode, Filters> })?.filters === 'object';
};

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set) => ({
      filters: initialFiltersMap,
      resetFilter: (mode) =>
        set((state) => ({
          filters: { ...state.filters, [mode]: initialFilters },
        })),
      setFilter: (mode, key, value) =>
        set((state) => ({
          filters: { ...state.filters, [mode]: { ...state.filters[mode], [key]: value } },
        })),
      nextPage: (mode) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [mode]: { ...state.filters[mode], count: state.filters[mode].count + 20 },
          },
        })),
    }),
    {
      name: 'filter-storage',
      // Do not persist `count` property of the filters
      partialize: (state) => ({ filters: _.mapValues(_.omit('count', state.filters)) }),
      merge: (persistedState, currentState) => {
        if (!isFilterStoreLike(persistedState)) {
          return currentState;
        }
        return {
          ...currentState,
          filters: {
            ...currentState.filters,
            ..._.fromPairs(
              keys(persistedState.filters).map((mode) => [
                mode,
                {
                  ...currentState.filters[mode],
                  ...persistedState.filters[mode],
                  count: currentState.filters[mode].count + 20,
                },
              ])
            ),
          },
        };
      },
      version: 3,
    }
  )
);

export const useFilters = () => {
  const mode = useMode();
  return useFiltersStore((state) => state.filters[mode]);
};

export const { setFilter, resetFilter, nextPage } = useFiltersStore.getState();
