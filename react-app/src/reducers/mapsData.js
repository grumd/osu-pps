import { fetchJson } from 'utils/fetch';

import { FIELDS } from 'constants/mapsData';
import { COOKIE_SEARCH_KEY } from 'constants/common';

const LOADING = 'MAPS_DATA/LOADING';
const SUCCESS = 'MAPS_DATA/SUCCESS';
const ERROR = 'MAPS_DATA/ERROR';
const SEARCH_KEY_CHANGE = 'MAPS_DATA/SEARCH_KEY';
const SHOW_MORE = 'MAPS_DATA/SHOW_MORE';
const RECALC = 'MAPS_DATA/RECALC';

function formattedToSeconds(minutes, seconds) {
  return minutes * 60 + seconds;
}

function modAllowed(selectValue, hasMod) {
  return (
    !['yes', 'no'].includes(selectValue) ||
    (selectValue === 'yes' && hasMod) ||
    (selectValue === 'no' && !hasMod)
  );
}

function matchesMaxMin(value, min, max) {
  return (!min || value >= min) && (!max || value <= max);
}

const getVisibleItems = state => {
  const { data, visibleItemsCount, searchKey } = state;

  const overweightnessGetter = {
    age: item => +item.x / +item.h,
    total: item => +item.x,
    playcount: item => +item.x / +item.p,
  }[searchKey[FIELDS.MODE]];

  const length = {
    min: formattedToSeconds(
      parseFloat(searchKey[FIELDS.MIN_M_LEN]),
      parseFloat(searchKey[FIELDS.MIN_S_LEN])
    ),
    max: formattedToSeconds(
      parseFloat(searchKey[FIELDS.MAX_M_LEN]),
      parseFloat(searchKey[FIELDS.MAX_S_LEN])
    ),
  };
  const searchWords = searchKey[FIELDS.TEXT].toLowerCase().split(' ');

  const newData = data
    .sort((a, b) => overweightnessGetter(b) - overweightnessGetter(a))
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
        word => mapLink.includes(word) || linkText.includes(word)
      );

      return (
        searchMatches &&
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
    .slice(0, visibleItemsCount);
  return newData;
};

const emptySearchKey = {
  [FIELDS.TEXT]: '',
  [FIELDS.PP_MIN]: '',
  [FIELDS.PP_MAX]: '',
  [FIELDS.LEN_MIN]: '',
  [FIELDS.LEN_MAX]: '',
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
  [FIELDS.HT]: 'any',
  [FIELDS.MODE]: 'age',
};
const defaultSearchKey = {};

const cookies = document.cookie.split(';');
Object.keys(emptySearchKey).forEach(key => {
  const cookie = cookies.find(cookie => cookie.includes(COOKIE_SEARCH_KEY + key));

  if (cookie) {
    const value = cookie.split('=')[1];
    const parsedNumber = parseFloat(value);
    defaultSearchKey[key] = isNaN(parsedNumber) ? value : parsedNumber;
  } else {
    defaultSearchKey[key] = emptySearchKey[key];
  }
});

const initialState = {
  isLoading: false,
  data: [],
  visibleData: [],
  searchKey: defaultSearchKey,
  visibleItemsCount: 20,
};

export default function mapsDataReducer(state = initialState, action) {
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
      };
    case SUCCESS: {
      const newState = {
        ...state,
        isLoading: false,
        data: action.data,
        visibleItemsCount: 20,
      };
      return {
        ...newState,
        visibleData: getVisibleItems(newState),
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
      let visibleData = state.visibleData;
      if (action.key === FIELDS.MODE) {
        visibleData = getVisibleItems(newState);
      }
      return {
        ...newState,
        visibleData,
      };
    }
    case SHOW_MORE: {
      const newState = {
        ...state,
        visibleItemsCount: state.visibleItemsCount + 20,
      };
      return {
        ...newState,
        visibleData: getVisibleItems(newState),
      };
    }
    case RECALC: {
      return {
        ...state,
        visibleData: getVisibleItems(state),
      };
    }
    default:
      return state;
  }
}

export const fetchMapsData = () => {
  return async dispatch => {
    dispatch({ type: LOADING });
    try {
      const data = await fetchJson({
        url: 'https://raw.githubusercontent.com/grumd/osu-pps/master/data.json',
      });
      dispatch({ type: SUCCESS, data });
      return data;
    } catch (error) {
      dispatch({ type: ERROR, error });
    }
  };
};

export const updateSearchKey = (key, value) => ({
  type: SEARCH_KEY_CHANGE,
  key,
  value,
});

export const showMore = () => ({ type: SHOW_MORE });

export const recalculateVisibleData = () => ({ type: RECALC });
