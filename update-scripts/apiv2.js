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

const fetchApi = async (url, options = {}) => {
  const { params, wait429 = 10000, retries = 2, disableLogs = false, method = 'get' } = options;

  const body = Object.fromEntries(
    Object.entries(options.body).filter(([_, value]) => value != null)
  );

  if (!axios.defaults.headers.common['Authorization']) {
    await setupToken();
  }

  try {
    if (!disableLogs) {
      console.log('Fetching', url, ...[params, body].filter(Boolean));
    }
    const response = await axios({
      method,
      url,
      params,
      baseURL,
      data: body,
    });
    return response;
  } catch (error) {
    if (!error.response) {
      // This probably only happens when your internet is out
      console.warn('No response:', error.message);
      console.warn(`Retrying...`);
      await delay(3000);
      await setupToken();
      return fetchApi(url, options);
    } else if (error.response.status === 400) {
      // Probably my mistake
      console.error('400 Bad Request:', url, {
        params,
        baseURL,
        authToken: axios.defaults.headers.common['Authorization'],
      });
      throw new Error(error.message);
    } else if (error.response.status === 404) {
      // Probably restricted user
      console.warn('404 Not Found:', url, params);
      throw new Error(error.message);
    } else if (error.response.status === 401) {
      // Probably API v2 token is expired
      await setupToken();
      return fetchApi(url, options);
    } else if (error.response.status === 429) {
      // Probably need to fetch less often
      console.warn('429 Too many requests, waiting for', wait429, 'ms');
      await delay(wait429);
      return fetchApi(url, { ...options, wait429: wait429 * 1.5 });
    } else if (retries >= 1) {
      // Retrying a few times in case of unstable connection
      console.warn(url, params);
      console.warn(error.message);
      console.warn(`Retrying ${retries - 1} times...`);
      await delay(5000);
      return fetchApi(url, { ...options, retries: retries - 1 });
    } else {
      throw error;
    }
  }
};

const fetchApiWithPages = async (
  url,
  { params = {}, append, condition, disableLogs = false } = {}
) => {
  let nextPage;
  let accData;
  do {
    const { data } = await fetchApi(url, {
      disableLogs,
      params: nextPage ? { ...params, 'cursor[page]': nextPage } : params,
    });
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
  return fetchApi(`/users/${userId}/scores/best`, {
    disableLogs: true,
    params: { mode: modeName, limit: topScoresCount },
  });
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
    disableLogs: true,
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
    disableLogs: true,
  });
};

const fetchBeatmap = async (beatmapId) => {
  return fetchApi(`/beatmaps/${beatmapId}`);
};

const fetchBeatmapAttributes = async (beatmapId, { mods, ruleset, rulesetId }) => {
  return fetchApi(`/beatmaps/${beatmapId}/attributes`, {
    method: 'post',
    body: {
      mods,
      ruleset,
      ruleset_id: rulesetId,
    },
  });
};

const fetchUserFavourites = async (userId) => {
  let favourites = [];
  let shouldContinue = true;
  let offset = 0;
  const limit = 100;
  do {
    const response = await fetchApi(`/users/${userId}/beatmapsets/favourite`, {
      params: {
        offset,
        limit,
      },
      disableLogs: true,
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
  fetchBeatmapAttributes,
};

// const main = async () => {
//   const data = await fetchUserFavourites(530913);
//   console.log(data[0]);
//   console.log('done');
// };

// main();
