import _ from 'lodash/fp';
import { useMemo } from 'react';

import { Mode } from '@/constants/modes';
import { keys } from '@/utils/object';

import type { Filters } from '../types';

export const useFiltersCount = (
  mode: Mode,
  filters: Filters
): { moreCount: number; filtersCount: number } => {
  return useMemo(() => {
    const moreCount = [
      !!filters.ranked,
      !!filters.genres?.length,
      !!filters.languages?.length,
    ].reduce((sum, bool) => sum + (bool ? 1 : 0), 0);

    const filtersCount = keys(filters)
      .filter(
        (key) =>
          ![
            'calcMode',
            'count',
            'isShowingMore',
            mode !== Mode.mania ? 'maniaKeys' : null,
          ].includes(key)
      )
      .reduce((sum, key) => {
        const value = filters[key];
        return sum + ((_.isArray(value) ? !!value.length : !!value && value !== 'any') ? 1 : 0);
      }, 0);

    return { moreCount, filtersCount };
  }, [filters, mode]);
};
