import { DEBUG } from '../config.ts';
import { DELAY_BETWEEN_FAVOURITE_PAGES_MS, DELAY_BETWEEN_RANKING_PAGES_MS } from '../timings.ts';
import type { Mode } from '../modes.ts';
import { delay } from '../utils/misc.ts';
import { osuApiGet, osuApiPost } from './http.ts';
import type {
  OsuApiBeatmap,
  OsuApiBeatmapAttributesResponse,
  OsuApiFavouriteBeatmapset,
  OsuApiRankingEntry,
  OsuApiRankingsResponse,
  OsuApiScore,
  OsuApiUser,
} from './types.ts';

/**
 * Fetches the performance ranking of one country, page by page.
 * Stops at the first page that contains a player below 1000pp
 * (or after the first page in debug mode).
 */
export async function fetchCountryRanking(
  mode: Mode,
  country: string
): Promise<OsuApiRankingEntry[]> {
  const ranking: OsuApiRankingEntry[] = [];
  let page: number | null = null;

  do {
    const response: OsuApiRankingsResponse = await osuApiGet(
      `/rankings/${mode.text}/performance`,
      { params: { country, ...(page ? { 'cursor[page]': page } : {}) } }
    );
    ranking.push(...response.ranking);

    const everyoneAbove1000pp = response.ranking.every((entry) => entry.pp > 1000);
    page = !DEBUG && everyoneAbove1000pp && response.cursor ? response.cursor.page : null;
    await delay(DELAY_BETWEEN_RANKING_PAGES_MS);
  } while (page);

  return ranking;
}

/** Fetches a user's best scores (includes lazer scores). */
export async function fetchUserBestScores(
  userId: number,
  mode: Mode,
  limit: number
): Promise<OsuApiScore[]> {
  return osuApiGet(`/users/${userId}/scores/best`, {
    params: { mode: mode.text, limit },
  });
}

/** Max number of beatmap ids per GET /beatmaps request. */
export const BEATMAP_BATCH_SIZE = 50;

/**
 * Fetches up to {@link BEATMAP_BATCH_SIZE} beatmaps at once, including their
 * `beatmapset` and `owners`. Deleted beatmaps are silently absent from the result.
 */
export async function fetchBeatmaps(beatmapIds: readonly number[]): Promise<OsuApiBeatmap[]> {
  if (beatmapIds.length > BEATMAP_BATCH_SIZE) {
    throw new Error(`Can only fetch up to ${BEATMAP_BATCH_SIZE} beatmaps at once`);
  }
  const response = await osuApiGet<{ beatmaps: OsuApiBeatmap[] }>('/beatmaps', {
    params: { 'ids[]': [...beatmapIds] },
  });
  return response.beatmaps;
}

/**
 * Fetches the star rating of a beatmap with the given mods (legacy bitmask), converted to
 * the given mode if it's a map from another ruleset. Throws a 404 error for deleted beatmaps.
 */
export async function fetchBeatmapStarRating(
  beatmapId: number,
  mods: number,
  mode: Mode
): Promise<number> {
  const response = await osuApiPost<OsuApiBeatmapAttributesResponse>(
    `/beatmaps/${beatmapId}/attributes`,
    { body: { mods, ruleset: mode.text } }
  );
  return response.attributes.star_rating;
}

export async function fetchUser(userId: number): Promise<OsuApiUser> {
  return osuApiGet(`/users/${userId}`);
}

/** Fetches all beatmapsets a user has favourited, paginating until the end. */
export async function fetchUserFavourites(userId: number): Promise<OsuApiFavouriteBeatmapset[]> {
  const pageSize = 100;
  const favourites: OsuApiFavouriteBeatmapset[] = [];
  let lastPageSize = 0;

  do {
    const page = await osuApiGet<OsuApiFavouriteBeatmapset[]>(
      `/users/${userId}/beatmapsets/favourite`,
      { params: { offset: favourites.length, limit: pageSize } }
    );
    favourites.push(...page);
    lastPageSize = page.length;
    await delay(DELAY_BETWEEN_FAVOURITE_PAGES_MS);
  } while (lastPageSize === pageSize);

  return favourites;
}
