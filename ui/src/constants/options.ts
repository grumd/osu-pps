import type { SortTypes } from '@/features/Maps/types';

export const languageOptions = [
  { value: 5, label: 'instrumental' },
  { value: 2, label: 'english' },
  { value: 3, label: 'japanese' },
  { value: 4, label: 'chinese' },
  { value: 6, label: 'korean' },
  { value: 7, label: 'french' },
  { value: 8, label: 'german' },
  { value: 9, label: 'swedish' },
  { value: 10, label: 'spanish' },
  { value: 11, label: 'italian' },
  { value: 1, label: 'other' },
];

export const genreOptions = [
  { value: 2, label: 'video game' },
  { value: 3, label: 'anime' },
  { value: 4, label: 'rock' },
  { value: 5, label: 'pop' },
  { value: 7, label: 'novelty' },
  { value: 9, label: 'hip hop' },
  { value: 10, label: 'electronic' },
  { value: 1, label: 'unspecified' },
  { value: 6, label: 'other' },
];

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

export const languageMap = languageOptions.reduce(
  (map: Record<number, string>, option) => ({
    ...map,
    [option.value]: option.label,
  }),
  {}
);

export const genreMap = genreOptions.reduce(
  (map: Record<number, string>, option) => ({
    ...map,
    [option.value]: option.label,
  }),
  {}
);
