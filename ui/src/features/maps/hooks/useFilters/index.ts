import _ from 'lodash/fp';
import create from 'zustand';
import { persist } from 'zustand/middleware';

import { CalcMode } from '@/constants/modes';

import type { Filters } from '../../types';

const initialFilters: Filters = {
  count: 20,
  calcMode: CalcMode.ByPopulationAndTime,
  isShowingMore: false,
};

interface FiltersStore {
  filters: Filters;
  readonly setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  readonly resetFilter: () => void;
  readonly nextPage: () => void;
}

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set) => ({
      filters: initialFilters,
      resetFilter: () =>
        set((state) => ({
          filters: { ...initialFilters, ..._.pick(['calcMode', 'isShowingMore'], state.filters) },
        })),
      setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
      nextPage: () =>
        set((state) => ({ filters: { ...state.filters, count: state.filters.count + 20 } })),
    }),
    {
      name: 'filter-storage',
      // Do not persist `count` property of the filters
      partialize: (state) => ({ filters: _.omit('count', state.filters) }),
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          filters: {
            ...currentState.filters,
            ...(persistedState as FiltersStore).filters,
            count: currentState.filters.count,
          },
        };
      },
      version: 1,
    }
  )
);

export const useFilters = () => useFiltersStore((state) => state.filters);

export const { setFilter, resetFilter, nextPage } = useFiltersStore.getState();
