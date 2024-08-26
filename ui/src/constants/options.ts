import type { SortTypes } from '@/features/Maps/types';

export const rankedDateOptions = [
  { value: 7, label: 'last week' },
  { value: 30, label: 'last 30 days' },
  { value: 90, label: 'last 3 months' },
  { value: 180, label: 'last 6 months' },
  { value: 365, label: 'last year' },
  { value: -1, label: 'all time' },
];

export const sortOptions: { value: [SortTypes, 'asc' | 'desc']; label: string }[] = [
  { value: ['farmValue', 'desc'], label: 'farmable first (recommended)' },
  { value: ['difficulty', 'desc'], label: '↑ difficulty' },
  { value: ['difficulty', 'asc'], label: '↓ difficulty' },
  { value: ['length', 'desc'], label: '↑ length' },
  { value: ['length', 'asc'], label: '↓ length' },
  { value: ['bpm', 'desc'], label: '↑ bpm' },
  { value: ['bpm', 'asc'], label: '↓ bpm' },
  { value: ['pp', 'desc'], label: '↑ pp' },
  { value: ['pp', 'asc'], label: '↓ pp' },
  { value: ['hoursSinceRanked', 'desc'], label: '↑ ranked' },
  { value: ['hoursSinceRanked', 'asc'], label: '↓ ranked' },
];
