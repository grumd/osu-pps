export const REQUEST_TIMEOUT_MS = 30_000;

/** Initial wait after a 429 response; doubled on every consecutive 429. */
export const RATE_LIMIT_WAIT_MS = 10_000;
/** Wait between retries when there is no HTTP response (connection problems). */
export const NETWORK_ERROR_WAIT_MS = 3_000;
/** Wait between retries of other failed requests. */
export const RETRY_WAIT_MS = 5_000;

export const DELAY_BETWEEN_RANKING_PAGES_MS = 500;
export const DELAY_BETWEEN_USERS_MS = 500;
export const DELAY_BETWEEN_MAP_BATCHES_MS = 500;
export const DELAY_BETWEEN_MAPPER_NAME_FETCHES_MS = 500;
export const DELAY_BETWEEN_MAPPERS_MS = 500;
export const DELAY_BETWEEN_FAVOURITE_PAGES_MS = 500;
