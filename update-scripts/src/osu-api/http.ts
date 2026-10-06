import axios, { AxiosError } from 'axios';

import { config } from '../config.ts';
import {
  MIN_TIME_BETWEEN_REQUESTS_MS,
  NETWORK_ERROR_WAIT_MS,
  RATE_LIMIT_WAIT_MS,
  REQUEST_TIMEOUT_MS,
  RETRY_WAIT_MS,
} from '../timings.ts';
import { delay } from '../utils/misc.ts';

const OSU_API_BASE_URL = 'https://osu.ppy.sh/api/v2';
const OSU_TOKEN_URL = 'https://osu.ppy.sh/oauth/token';

/**
 * Opts into the current API response format; most importantly Score objects are returned
 * in the "solo score" format. See https://osu.ppy.sh/docs/index.html#api-versions
 */
const API_VERSION = '20220705';

const http = axios.create({
  baseURL: OSU_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'x-api-version': API_VERSION },
});

let accessToken: { value: string; expiresAtMs: number } | null = null;

let lastRequestStartMs = 0;
let lastRequestSlot: Promise<void> = Promise.resolve();

/**
 * Waits until at least {@link MIN_TIME_BETWEEN_REQUESTS_MS} has passed since the previous
 * request started. Concurrent callers queue up and start one by one.
 */
function waitForRequestSlot(): Promise<void> {
  lastRequestSlot = lastRequestSlot.then(async () => {
    const slotMs = lastRequestStartMs + MIN_TIME_BETWEEN_REQUESTS_MS;
    // timers can fire a millisecond early
    while (Date.now() < slotMs) {
      await delay(slotMs - Date.now());
    }
    lastRequestStartMs = Date.now();
  });
  return lastRequestSlot;
}

async function refreshToken(): Promise<void> {
  if (!config.client_id || !config.client_secret) {
    throw new Error('client_id/client_secret not found in config.json');
  }

  await waitForRequestSlot();
  const { data } = await axios.post<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>(OSU_TOKEN_URL, {
    client_id: config.client_id,
    client_secret: config.client_secret,
    grant_type: 'client_credentials',
    scope: 'public',
  });

  accessToken = {
    value: `${data.token_type} ${data.access_token}`,
    // refresh one minute before actual expiry
    expiresAtMs: Date.now() + (data.expires_in - 60) * 1000,
  };
}

export interface GetOptions {
  /** Query params. Arrays are serialized as repeated `key[]=` params. */
  params?: Record<string, string | number | (string | number)[] | undefined>;
  logRequests?: boolean;
}

export interface PostOptions extends GetOptions {
  /** JSON request body. */
  body?: unknown;
}

interface Request extends PostOptions {
  method: 'get' | 'post';
  url: string;
}

interface RetryState {
  rateLimitWaitMs: number;
  retriesLeft: number;
}

/**
 * GET an osu! API v2 endpoint with authentication and retries:
 * - refreshes the OAuth token when missing/expired/rejected (401),
 * - waits and retries on rate limits (429) with backoff,
 * - retries network errors indefinitely,
 * - throws on 400/404 and after running out of retries for other errors.
 */
export async function osuApiGet<T>(url: string, options: GetOptions = {}): Promise<T> {
  return osuApiRequest<T>({ ...options, method: 'get', url });
}

/** POST to an osu! API v2 endpoint, with the same authentication and retries as `osuApiGet`. */
export async function osuApiPost<T>(url: string, options: PostOptions = {}): Promise<T> {
  return osuApiRequest<T>({ ...options, method: 'post', url });
}

async function osuApiRequest<T>(request: Request): Promise<T> {
  return osuApiRequestWithRetries<T>(request, {
    rateLimitWaitMs: RATE_LIMIT_WAIT_MS,
    retriesLeft: 2,
  });
}

async function osuApiRequestWithRetries<T>(request: Request, retryState: RetryState): Promise<T> {
  const { method, url, params, body } = request;
  if (!accessToken || accessToken.expiresAtMs < Date.now()) {
    await refreshToken();
  }

  if (request.logRequests) {
    console.log('Fetching', url, params ?? '');
  }

  try {
    await waitForRequestSlot();
    const requestConfig = { params, headers: { Authorization: accessToken!.value } };
    const response =
      method === 'post'
        ? await http.post<T>(url, body, requestConfig)
        : await http.get<T>(url, requestConfig);
    return response.data;
  } catch (error) {
    if (!(error instanceof AxiosError) || !error.response) {
      // Most likely a network problem — retry until the connection comes back.
      const message = error instanceof Error ? error.message : String(error);
      console.warn('No response:', message);
      console.warn('Retrying...');
      await delay(NETWORK_ERROR_WAIT_MS);
      accessToken = null;
      return osuApiRequestWithRetries(request, retryState);
    }

    const { status } = error.response;
    if (status === 400) {
      console.error('400 Bad Request:', url, params, body);
      throw error;
    }
    if (status === 404) {
      // Expected for restricted users / deleted beatmaps — the caller decides what to do.
      throw error;
    }
    if (status === 401) {
      await refreshToken();
      return osuApiRequestWithRetries(request, retryState);
    }
    if (status === 429) {
      console.warn('429 Too Many Requests, waiting for', retryState.rateLimitWaitMs, 'ms');
      await delay(retryState.rateLimitWaitMs);
      return osuApiRequestWithRetries(request, {
        ...retryState,
        rateLimitWaitMs: retryState.rateLimitWaitMs * 2,
      });
    }
    if (retryState.retriesLeft >= 1) {
      console.warn(url, params, body);
      console.warn(error.message);
      console.warn(`Retrying ${retryState.retriesLeft - 1} more times after this...`);
      await delay(RETRY_WAIT_MS);
      return osuApiRequestWithRetries(request, {
        ...retryState,
        retriesLeft: retryState.retriesLeft - 1,
      });
    }
    throw error;
  }
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404;
}
