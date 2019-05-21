export const FIELDS = {
  LANG: 'language',
  GENRE: 'genre',
  TEXT: 'text',
  PP_MIN: 'ppmin',
  PP_MAX: 'ppmax',
  MIN_M_LEN: 'lenmmin', // MINUTES
  MIN_S_LEN: 'lensmin', // SECONDS
  MAX_M_LEN: 'lenmmax', // MINUTES
  MAX_S_LEN: 'lensmax', // SECONDS
  BPM_MIN: 'bpmmin',
  BPM_MAX: 'bpmmax',
  DIFF_MIN: 'diffmin',
  DIFF_MAX: 'diffmax',
  DT: 'dt',
  HD: 'hd',
  HR: 'hr',
  HT: 'ht',
  FL: 'fl',
  MODE: 'mode', // total or adjusted
};

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

export const languageMap = languageOptions.reduce(
  (map, option) => ({
    ...map,
    [option.value]: option.label,
  }),
  {}
);

export const genreMap = genreOptions.reduce(
  (map, option) => ({
    ...map,
    [option.value]: option.label,
  }),
  {}
);
