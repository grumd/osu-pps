const { axios } = require('./axios');
const config = require('./config');
const { DEBUG } = require('./constants');
const { delay } = require('./utils');

const baseURL = `https://osu.ppy.sh/api/v2/`;

const setupToken = async () => {
  if (!config.client_id || !config.client_secret) {
    throw new Error('API Tokens not found in config.json');
  }

  const { data } = await axios.post('https://osu.ppy.sh/oauth/token', {
    client_id: config.client_id,
    client_secret: config.client_secret,
    grant_type: 'client_credentials',
    scope: 'public',
  });

  const { expires_in, token_type, access_token } = data;

  axios.defaults.headers.common['Authorization'] = `${token_type} ${access_token}`;

  setTimeout(() => {
    axios.defaults.headers.common['Authorization'] = '';
  }, expires_in * 1000);
};

const fetchApi = async (url, params, retries = 2, wait429 = 10000) => {
  if (!axios.defaults.headers.common['Authorization']) {
    await setupToken();
  }
  try {
    console.log('Fetching', url, params);
    const response = await axios.get(url, { params, baseURL });
    return response;
  } catch (error) {
    if (error.response.status === 400) {
      console.error('Bad request:', url, {
        params,
        baseURL,
        authToken: axios.defaults.headers.common['Authorization'],
      });
      throw new Error(error.message);
    } else if (error.response.status === 401) {
      await setupToken();
      return fetchApi(url, params, retries);
    } else if (error.response.status === 429) {
      console.warn('429 - Too many requests, waiting for', wait429, 'ms');
      await delay(wait429);
      return fetchApi(url, params, retries, wait429 * 1.5);
    } else if (error.response.status === 404 || retries <= 1) {
      throw new Error(error.message);
    } else if (retries >= 2) {
      console.warn(error.message);
      console.warn(`Retrying ${retries - 1} times...`);
      await delay(5000);
      return fetchApi(url, params, retries - 1);
    }
  }
};

const fetchApiWithPages = async (url, { params = {}, append, condition } = {}) => {
  let nextPage;
  let accData;
  do {
    const { data } = await fetchApi(
      url,
      nextPage ? { ...params, 'cursor[page]': nextPage } : params
    );
    nextPage = data.cursor && condition(data) ? data.cursor.page : null;
    accData = accData ? append(accData, data) : data;
  } while (nextPage);

  return accData;
};

/*
{
  accuracy: 0.7612293144208038,
  best_id: 2325855839,
  created_at: '2017-06-29T21:41:17+00:00',
  id: 2325855839,
  max_combo: 134,
  mode: 'osu',
  mode_int: 0,
  mods: [],
  passed: true,
  perfect: false,
  pp: 5.43478,
  rank: 'C',
  replay: false,
  score: 232700,
  statistics: [Object],
  user_id: 421412,
  current_user_attributes: [Object],
  beatmap: [Object],
  beatmapset: [Object],
  user: [Object],
  weight: [Object]
}
*/
const fetchUserBestScores = async (userId, modeName, topScoresCount) => {
  return fetchApi(`/users/${userId}/scores/best`, { mode: modeName, limit: topScoresCount });
};

/*
  [{
    code: 'US',
    active_users: 3220977,
    play_count: 3367774382,
    ranked_score: 501285061245697,
    performance: 434224667,
    country: { code: 'US', name: 'United States' }
  }]
*/
const fetchCountriesList = async (modeName) => {
  return fetchApiWithPages(`/rankings/${modeName}/country`, {
    append: (acc, data) => ({
      ...data,
      ranking: [...acc.ranking, ...data.ranking],
    }),
    condition: (data) => data.cursor && data.cursor.page <= 3,
  });
};

const fetchCountryRanking = async (modeName, country) => {
  return fetchApiWithPages(`/rankings/${modeName}/performance`, {
    params: { country },
    append: (acc, data) => ({
      ...data,
      ranking: [...acc.ranking, ...data.ranking],
    }),
    condition: (data) => {
      if (DEBUG) {
        return false; // stop iterating pages for debug
      }
      return data.ranking.every((it) => it.pp > 1000);
    },
  });
};

const fetchBeatmap = async (beatmapId) => {
  return fetchApi(`/beatmaps/${beatmapId}`);
};

const fetchUserFavourites = async (userId) => {
  let favourites = [];
  let shouldContinue = true;
  let offset = 0;
  const limit = 100;
  do {
    const response = await fetchApi(`/users/${userId}/beatmapsets/favourite`, {
      offset,
      limit,
    });
    const { data: maps } = response;
    favourites.push(...maps);
    offset = favourites.length;
    await delay(1000);
    shouldContinue = maps && maps.length === limit;
  } while (shouldContinue);
  return favourites;
};

module.exports = {
  fetchUserFavourites,
  fetchBeatmap,
  fetchCountryRanking,
  fetchCountriesList,
  fetchUserBestScores,
};

// const main = async () => {
//   const data = await fetchUserFavourites(530913);
//   console.log(data[0]);
//   console.log('done');
// };

// main();
