export const DEBUG_FETCH = import.meta.env.VITE_LOCAL_FETCH === 'true';

export const API_PREFIX = DEBUG_FETCH
  ? 'http://localhost:5174'
  : 'https://raw.githubusercontent.com/grumd/osu-pps/data';

export const QUERY_PERSISTENT_DATA_CONFIG = {
  staleTime: 60 * 60 * 1000, // 1 hour stale time for the react-query data
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  networkMode: DEBUG_FETCH ? 'always' : 'online',
} as const;
