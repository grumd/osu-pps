export const DEBUG_FETCH = import.meta.env.VITE_LOCAL_FETCH;

export const API_PREFIX =
  DEBUG_FETCH === 'true' ? '.' : 'https://raw.githubusercontent.com/grumd/osu-pps/data/';
