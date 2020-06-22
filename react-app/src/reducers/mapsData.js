import storage from 'localforage';
import { combineReducers } from 'redux';

import { fetchCsv } from 'utils/fetch';

import { FIELDS, languageOptions, genreOptions } from 'constants/mapsData';
import { getCookieSearchKey, DEBUG_FETCH, API_PREFIX, modes } from 'constants/common';
import { getDataStorageKey, getDataDateStorageKey } from 'constants/storage';

import { fetchMetadata } from 'reducers/metadata';

import { overweightnessCalcFromMode } from 'utils/overweightness';

const getTypes = mode => ({
  LOADING: `${mode}/MAPS_DATA/LOADING`,
  SUCCESS: `${mode}/MAPS_DATA/SUCCESS`,
  ERROR: `${mode}/MAPS_DATA/ERROR`,
  SEARCH_KEY_CHANGE: `${mode}/MAPS_DATA/SEARCH_KEY_CHANGE`,
  SHOW_MORE: `${mode}/MAPS_DATA/SHOW_MORE`,
  RECALC: `${mode}/MAPS_DATA/RECALC`,
  PROGRESS: `${mode}/MAPS_DATA/PROGRESS`,
  RESET_SEARCH_KEY: `${mode}/MAPS_DATA/RESET_SEARCH_KEY`,
});

function formattedToSeconds(minutes, seconds) {
  return minutes * 60 + seconds;
}

function modAllowed(selectValue, hasMod) {
  return (
    (selectValue !== 'yes' && selectValue !== 'no') ||
    (selectValue === 'yes' && hasMod) ||
    (selectValue === 'no' && !hasMod)
  );
}

function matchesMaxMin(value, min, max) {
  return (!min || value >= min) && (!max || value <= max);
}

const filterLowPasscount = data => data.filter(map => map.p > 600);

const getVisibleItems = (state, mode) => {
  const { data, visibleItemsCount, searchKey } = state;

  const overweightnessCalc = overweightnessCalcFromMode[searchKey[FIELDS.MODE]];

  const length = {
    min: formattedToSeconds(
      parseInt(searchKey[FIELDS.MIN_M_LEN], 10),
      parseInt(searchKey[FIELDS.MIN_S_LEN], 10)
    ),
    max: formattedToSeconds(
      parseInt(searchKey[FIELDS.MAX_M_LEN], 10),
      parseInt(searchKey[FIELDS.MAX_S_LEN], 10)
    ),
  };
  const searchWords = searchKey[FIELDS.TEXT].toLowerCase().split(' ');
  const genreList = searchKey[FIELDS.GENRE].length
    ? searchKey[FIELDS.GENRE].map(option => option.value)
    : null;
  const langList = searchKey[FIELDS.LANG].length
    ? searchKey[FIELDS.LANG].map(option => option.value)
    : null;
  const maxDaysSinceRanked = searchKey[FIELDS.RANKED_DATE] || -1;
  // const start = Date.now();
  const filteredData = data
    .filter(map => {
      if (searchWords.length) {
        const linkText = `${map.art} - ${map.t} [${map.v}]`.toLowerCase();
        const mapLink = `http://osu.ppy.sh/b/${map.b}`;
        if (!searchWords.every(word => mapLink.indexOf(word) > -1 || linkText.indexOf(word) > -1)) {
          return false;
        }
      }

      const mapMods = {
        dt: (map.m & 64) === 64,
        hd: (map.m & 8) === 8,
        hr: (map.m & 16) === 16,
        fl: (map.m & 1024) === 1024,
        ht: (map.m & 256) === 256,
      };

      const realBpm = mapMods.dt ? map.bpm * 1.5 : mapMods.ht ? map.bpm * 0.75 : map.bpm;

      // console.log(maxDaysSinceRanked);
      const genreMatches = !genreList || genreList.includes(map.g);
      const languageMatches = !langList || langList.includes(map.ln);
      const rankedDateMatches =
        maxDaysSinceRanked === -1 ||
        (Date.now() / 1000 / 60 / 60 - map.appr_h) / 24 < maxDaysSinceRanked;

      const k = searchKey[FIELDS.MANIA_K];
      const maniaKeyMatches =
        mode !== modes.mania.text || k === -1 || (k === 0 && !map.k) || k === map.k;

      map.owCalc = overweightnessCalc(map);

      return (
        genreMatches &&
        languageMatches &&
        maniaKeyMatches &&
        rankedDateMatches &&
        matchesMaxMin(map.pp99, searchKey[FIELDS.PP_MIN], searchKey[FIELDS.PP_MAX]) &&
        matchesMaxMin(realBpm, searchKey[FIELDS.BPM_MIN], searchKey[FIELDS.BPM_MAX]) &&
        matchesMaxMin(map.d, searchKey[FIELDS.DIFF_MIN], searchKey[FIELDS.DIFF_MAX]) &&
        matchesMaxMin(map.l, length.min, length.max) &&
        modAllowed(searchKey[FIELDS.DT], mapMods.dt) &&
        modAllowed(searchKey[FIELDS.HD], mapMods.hd) &&
        modAllowed(searchKey[FIELDS.HR], mapMods.hr) &&
        modAllowed(searchKey[FIELDS.FL], mapMods.fl) &&
        (searchKey[FIELDS.DT] !== 'ht' || mapMods.ht)
      );
    })
    .sort((a, b) => b.owCalc - a.owCalc);
  const visibleData = filteredData.slice(0, visibleItemsCount);
  // console.log(`Elapsed: ${Date.now() - start}`);
  return { filteredData, visibleData };
};

export const emptySearchKey = {
  [FIELDS.LANG]: [],
  [FIELDS.GENRE]: [],
  [FIELDS.RANKED_DATE]: null,
  [FIELDS.TEXT]: '',
  [FIELDS.PP_MIN]: '',
  [FIELDS.PP_MAX]: '',
  [FIELDS.BPM_MIN]: '',
  [FIELDS.BPM_MAX]: '',
  [FIELDS.DIFF_MIN]: '',
  [FIELDS.DIFF_MAX]: '',
  [FIELDS.MAX_M_LEN]: '99',
  [FIELDS.MAX_S_LEN]: '59',
  [FIELDS.MIN_M_LEN]: '0',
  [FIELDS.MIN_S_LEN]: '00',
  [FIELDS.DT]: 'any',
  [FIELDS.HD]: 'any',
  [FIELDS.HR]: 'any',
  [FIELDS.FL]: 'any',
  [FIELDS.MANIA_K]: -1,
  [FIELDS.MODE]: 'adjusted',
};
const ARRAY_FIELDS = [FIELDS.LANG, FIELDS.GENRE];
const TEXT_FIELDS = [
  FIELDS.TEXT,
  FIELDS.MAX_S_LEN,
  FIELDS.MIN_S_LEN,
  FIELDS.MODE,
  FIELDS.DT,
  FIELDS.HD,
  FIELDS.HR,
  FIELDS.FL,
];

const getDefaultSearchKey = mode => {
  const defaultSearchKey = {};
  const cookies = document.cookie && document.cookie.split(';');
  Object.keys(emptySearchKey).forEach(key => {
    const cookie =
      cookies && cookies.find(cookie => cookie.indexOf(getCookieSearchKey({ key, mode })) > -1);

    if (cookie) {
      const value = cookie.split('=')[1];
      if (ARRAY_FIELDS.includes(key)) {
        const options = key === FIELDS.LANG ? languageOptions : genreOptions;
        defaultSearchKey[key] = value
          .split(',')
          .map(value => options.find(opt => opt.value === Number(value)))
          .filter(value => value);
      } else if (TEXT_FIELDS.includes(key)) {
        defaultSearchKey[key] = value;
      } else {
        const parsedNumber = parseFloat(value);
        defaultSearchKey[key] = isNaN(parsedNumber) ? value : parsedNumber;
      }
    } else {
      defaultSearchKey[key] = emptySearchKey[key];
    }
  });
  return defaultSearchKey;
};

const getInitialState = mode => {
  return {
    isLoading: false,
    data: [],
    visibleData: [],
    filteredData: [],
    searchKey: getDefaultSearchKey(mode),
    visibleItemsCount: 20,
    receivedAt: null,
  };
};

const getReducer = mode => {
  const {
    LOADING,
    SUCCESS,
    ERROR,
    SEARCH_KEY_CHANGE,
    RECALC,
    RESET_SEARCH_KEY,
    PROGRESS,
    SHOW_MORE,
  } = getTypes(mode);
  return function mapsDataReducer(state = getInitialState(mode), action) {
    switch (action.type) {
      case LOADING:
        return {
          ...state,
          isLoading: true,
        };
      case ERROR:
        return {
          ...state,
          isLoading: false,
          error: action.error,
          receivedAt: Date.now(),
        };
      case SUCCESS: {
        const newState = {
          ...state,
          isLoading: false,
          data: filterLowPasscount(action.data),
          visibleItemsCount: 20,
          receivedAt: Date.now(),
        };
        return {
          ...newState,
          ...getVisibleItems(newState, action.mode),
        };
      }
      case SEARCH_KEY_CHANGE: {
        const newState = {
          ...state,
          searchKey: {
            ...state.searchKey,
            [action.key]: action.value === null ? emptySearchKey[action.key] : action.value,
          },
        };
        let additionalState = {};
        if (action.key === FIELDS.MODE) {
          additionalState = getVisibleItems(newState, action.mode);
        }
        return {
          ...newState,
          ...additionalState,
        };
      }
      case SHOW_MORE: {
        const newState = {
          ...state,
          visibleItemsCount: state.visibleItemsCount + 20,
        };
        return {
          ...newState,
          ...getVisibleItems(newState, action.mode),
        };
      }
      case RECALC: {
        return {
          ...state,
          ...getVisibleItems(state, action.mode),
        };
      }
      case PROGRESS: {
        const newState = {
          ...state,
          data: filterLowPasscount(action.data),
        };
        let additionalState = {};
        if (state.visibleItemsCount > state.filteredData.length) {
          additionalState = getVisibleItems(newState, action.mode);
        }
        return {
          ...newState,
          ...additionalState,
        };
      }
      case RESET_SEARCH_KEY: {
        const newState = {
          ...state,
          searchKey: emptySearchKey,
        };
        Object.keys(emptySearchKey).forEach(key => {
          document.cookie = `${getCookieSearchKey({ key, mode: action.mode })}=${
            emptySearchKey[key]
          }; path=/`;
        });
        return {
          ...newState,
          ...getVisibleItems(newState, action.mode),
        };
      }
      default:
        return state;
    }
  };
};

export default combineReducers({
  osu: getReducer('osu'),
  taiko: getReducer('taiko'),
  mania: getReducer('mania'),
  fruits: getReducer('fruits'),
});

export const fetchMapsData = mode => {
  const { LOADING, SUCCESS, ERROR } = getTypes(mode);
  return async dispatch => {
    dispatch({ type: LOADING, mode });
    // Fetch metadata here so we can compare storage dates
    const metadata = await dispatch(fetchMetadata(mode));
    const lastUpdatedFromMetadata = new Date(metadata.lastUpdated).getTime();
    const lastUpdatedFromStorage = await storage.getItem(getDataDateStorageKey(mode));
    console.log(`Storage: ${lastUpdatedFromStorage}, metadata: ${lastUpdatedFromMetadata}`);
    if (lastUpdatedFromStorage >= lastUpdatedFromMetadata) {
      // Storage data is newer than database data
      console.log('Taking data from storage');
      const data = await storage.getItem(getDataStorageKey(mode));
      if (data && data.length && !DEBUG_FETCH) {
        dispatch({ type: SUCCESS, data, mode });
        return data;
      }
    }
    // If storage didn't work, fetch from server
    try {
      // console.log('fetching csv');
      const [mapsetsInfo, diffsInfo] = await Promise.all([
        fetchCsv({ url: `${API_PREFIX}/data/maps/${mode}/mapsets.csv` }),
        fetchCsv({ url: `${API_PREFIX}/data/maps/${mode}/diffs.csv` }),
      ]);
      // console.log(mapsetsInfo, diffsInfo);
      const mapsetsDict = mapsetsInfo.reduce((dict, item) => {
        dict[item.s] = item;
        return dict;
      }, {});
      const data = diffsInfo.map(item => {
        return {
          ...item,
          ...mapsetsDict[item.s],
        };
      });
      // console.log(mapsetsDict, data);
      dispatch({ type: SUCCESS, data, mode });
      if (!DEBUG_FETCH) {
        storage.setItem(getDataDateStorageKey(mode), new Date(metadata.lastUpdated).getTime());
        storage.setItem(getDataStorageKey(mode), data);
      }
      return data;
    } catch (error) {
      dispatch({ type: ERROR, error, mode });
    }
  };
};

export const updateSearchKey = (mode, key, value) => ({
  type: getTypes(mode).SEARCH_KEY_CHANGE,
  key,
  value,
  mode,
});

export const resetSearchKey = mode => ({
  type: getTypes(mode).RESET_SEARCH_KEY,
  mode,
});

export const showMore = mode => ({ mode, type: getTypes(mode).SHOW_MORE });

export const recalculateVisibleData = mode => ({ type: getTypes(mode).RECALC, mode });
