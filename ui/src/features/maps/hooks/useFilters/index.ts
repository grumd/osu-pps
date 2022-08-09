import create from 'zustand';

import { CalcMode } from '@/constants/modes';

import type { Filters } from '../../types';

export const useFiltersStore = create<{
  filters: Filters;
  readonly setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  readonly nextPage: () => void;
}>()((set) => ({
  filters: {
    count: 20,
    calcMode: CalcMode.ByPopulationAndTime,
  },
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  nextPage: () =>
    set((state) => ({ filters: { ...state.filters, count: state.filters.count + 20 } })),
}));

export const useFilters = () => useFiltersStore((state) => state.filters);

export const {setFilter} = useFiltersStore.getState();
export const {nextPage} = useFiltersStore.getState();
