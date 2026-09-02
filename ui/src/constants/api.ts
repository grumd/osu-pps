export const DEBUG_FETCH = import.meta.env.VITE_LOCAL_FETCH === 'true';

/**
 * Base URL of the published data — the Cloudflare R2 bucket, publicly exposed
 * at data.osu-pps.com. The bucket root IS the data folder, so URLs append
 * paths directly (e.g. `${API_PREFIX}/metadata/osu/metadata.json`).
 * Override with VITE_DATA_URL at build time if the bucket moves.
 */
export const API_PREFIX = DEBUG_FETCH
  ? '/local-api'
  : (import.meta.env.VITE_DATA_URL ?? 'https://data.osu-pps.com');

export const QUERY_PERSISTENT_DATA_CONFIG = {
  staleTime: 60 * 60 * 1000, // 1 hour stale time for the react-query data
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  networkMode: DEBUG_FETCH ? 'always' : 'online',
} as const;
