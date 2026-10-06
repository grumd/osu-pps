export const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Minimum time between the starts of any two requests to osu.ppy.sh (API calls, retries
 * and token refreshes alike), i.e. at most 2 requests per second across the whole process.
 */
export const MIN_TIME_BETWEEN_REQUESTS_MS = 500;

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

/**
 * Max time spent fetching mod star ratings per mode per update. The initial fill (and the refill
 * after a star rating algorithm change) takes over a day, so it's spread across several updates.
 */
export const MOD_STAR_RATINGS_TIME_BUDGET_MS = 3 * 60 * 60 * 1000;
