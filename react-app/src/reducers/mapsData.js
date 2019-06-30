import storage from 'localforage';

import { fetchJsonPartial } from 'utils/fetch';

import { FIELDS, languageOptions, genreOptions } from 'constants/mapsData';
import { COOKIE_SEARCH_KEY, DEBUG_FETCH, modes } from 'constants/common';
import { getDataStorageKey, getDataDateStorageKey } from 'constants/storage';

import { fetchMetadata } from 'reducers/metadata';

import { overweightnessCalcFromMode } from 'utils/overweightness';

const LOADING = 'MAPS_DATA/LOADING';
const SUCCESS = 'MAPS_DATA/SUCCESS';
const ERROR = 'MAPS_DATA/ERROR';
const SEARCH_KEY_CHANGE = 'MAPS_DATA/SEARCH_KEY';
const SHOW_MORE = 'MAPS_DATA/SHOW_MORE';
const RECALC = 'MAPS_DATA/RECALC';
const PROGRESS = 'MAPS_DATA/PROGRESS';

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
  const { dataByMode, visibleItemsCount, searchKey } = state;
  const data = dataByMode[mode] || [];

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

  const filteredData = data
    .sort((a, b) => overweightnessCalc(b) - overweightnessCalc(a))
    .filter((map, index) => {
      const mapMods = {
        dt: (map.m & 64) === 64,
        hd: (map.m & 8) === 8,
        hr: (map.m & 16) === 16,
        fl: (map.m & 1024) === 1024,
        ht: (map.m & 256) === 256,
      };

      const realBpm = mapMods.dt ? map.bpm * 1.5 : mapMods.ht ? map.bpm * 0.75 : map.bpm;

      const mapLink = `http://osu.ppy.sh/b/${map.b}`;
      const linkText = `${map.art} - ${map.t} [${map.v}]`.toLowerCase();
      const searchMatches = searchWords.every(
        word => mapLink.indexOf(word) > -1 || linkText.indexOf(word) > -1
      );
      const genreMatches = !genreList || genreList.includes(map.g);
      const languageMatches = !langList || langList.includes(map.ln);

      const k = searchKey[FIELDS.MANIA_K];
      const maniaKeyMatches =
        mode !== modes.mania.text || k === -1 || (k === 0 && !map.k) || k === map.k;

      return (
        searchMatches &&
        matchesMaxMin(map.pp99, searchKey[FIELDS.PP_MIN], searchKey[FIELDS.PP_MAX]) &&
        matchesMaxMin(realBpm, searchKey[FIELDS.BPM_MIN], searchKey[FIELDS.BPM_MAX]) &&
        matchesMaxMin(map.d, searchKey[FIELDS.DIFF_MIN], searchKey[FIELDS.DIFF_MAX]) &&
        matchesMaxMin(map.l, length.min, length.max) &&
        genreMatches &&
        languageMatches &&
        maniaKeyMatches &&
        modAllowed(searchKey[FIELDS.DT], mapMods.dt) &&
        modAllowed(searchKey[FIELDS.HD], mapMods.hd) &&
        modAllowed(searchKey[FIELDS.HR], mapMods.hr) &&
        modAllowed(searchKey[FIELDS.FL], mapMods.fl) &&
        (searchKey[FIELDS.DT] !== 'ht' || mapMods.ht)
      );
    });
  const visibleData = filteredData.slice(0, visibleItemsCount);
  return { filteredData, visibleData };
};

export const emptySearchKey = {
  [FIELDS.LANG]: [],
  [FIELDS.GENRE]: [],
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
const defaultSearchKey = {};
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

const cookies = document.cookie && document.cookie.split(';');
Object.keys(emptySearchKey).forEach(key => {
  const cookie = cookies && cookies.find(cookie => cookie.indexOf(COOKIE_SEARCH_KEY + key) > -1);

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

const initialState = {
  isLoading: { osu: false, mania: false, taiko: false, fruits: false },
  dataByMode: { osu: [], mania: [], taiko: [], fruits: [] },
  visibleData: [],
  filteredData: [],
  searchKey: defaultSearchKey,
  visibleItemsCount: 20,
  lastMode: 'osu',
};

export default function mapsDataReducer(state = initialState, action) {
  switch (action.type) {
    case LOADING:
      return {
        ...state,
        isLoading: { ...state.isLoading, [action.mode]: true },
      };
    case ERROR:
      return {
        ...state,
        isLoading: { ...state.isLoading, [action.mode]: false },
        error: action.error,
      };
    case SUCCESS: {
      const newState = {
        ...state,
        isLoading: { ...state.isLoading, [action.mode]: false },
        dataByMode: { ...state.dataByMode, [action.mode]: filterLowPasscount(action.data) },
        visibleItemsCount: 20,
      };
      return {
        ...newState,
        lastMode: action.mode,
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
        additionalState = getVisibleItems(newState, state.lastMode);
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
        ...getVisibleItems(newState, state.lastMode),
      };
    }
    case RECALC: {
      return {
        ...state,
        lastMode: action.mode,
        ...getVisibleItems(state, action.mode),
      };
    }
    case PROGRESS: {
      const newState = {
        ...state,
        dataByMode: { ...state.dataByMode, [action.mode]: filterLowPasscount(action.data) },
      };
      let additionalState = {};
      if (state.visibleItemsCount > state.filteredData.length) {
        additionalState = getVisibleItems(newState, action.mode);
      }
      return {
        ...newState,
        lastMode: action.mode,
        ...additionalState,
      };
    }
    default:
      return state;
  }
}

export const fetchMapsData = mode => {
  return async dispatch => {
    dispatch({ type: LOADING, mode });
    // Fetch metadata here so we can compare storage dates
    const metadata = await dispatch(fetchMetadata(mode));
    const lastUpdatedFromMetadata = new Date(metadata.lastUpdated).getTime();
    const lastUpdatedFromStorage = await storage.getItem(getDataDateStorageKey(mode));
    if (lastUpdatedFromStorage > lastUpdatedFromMetadata) {
      // Storage data is newer than database data
      const data = await storage.getItem(getDataStorageKey(mode));
      if (data && data.length && !DEBUG_FETCH) {
        dispatch({ type: SUCCESS, data, mode });
        return data;
      }
    }
    // If storage didn't work, fetch from server
    try {
      const data = await fetchJsonPartial({
        url: DEBUG_FETCH
          ? `/data-${mode}.json`
          : `https://raw.githubusercontent.com/grumd/osu-pps/master/data-${mode}.json`,
        onIntermediateDataReceived: data => dispatch({ type: PROGRESS, data, mode }),
      });
      dispatch({ type: SUCCESS, data, mode });
      if (!DEBUG_FETCH) {
        storage.setItem(getDataDateStorageKey(mode), Date.now());
        storage.setItem(getDataStorageKey(mode), data);
      }
      return data;
    } catch (error) {
      dispatch({ type: ERROR, error, mode });
    }
  };
};

export const updateSearchKey = (key, value) => ({
  type: SEARCH_KEY_CHANGE,
  key,
  value,
});

export const showMore = () => ({ type: SHOW_MORE });

export const recalculateVisibleData = mode => ({ type: RECALC, mode });
