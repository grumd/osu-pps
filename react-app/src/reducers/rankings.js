import storage from 'localforage';
import { combineReducers } from 'redux';
import _ from 'lodash/fp';

import { fetchJson, fetchJsonPartial } from 'utils/fetch';

import { API_PREFIX, DEBUG_FETCH } from 'constants/common';
import { getRankingsStorageKey, getRankingsDateStorageKey } from 'constants/storage';

import { fetchMetadata } from 'reducers/metadata';

const decompressData = (dataCompressed, diffInfoArrayTransformed) => {
  return _.map(
    (dataCompEntry = []) => ({
      n: dataCompEntry[0],
      updateDate: new Date(dataCompEntry[1] * 1000 * 60),
      ppDiff: dataCompEntry[2],
      s: _.map((shortText = '') => {
        const args = shortText.split('_');
        const diffInfo = diffInfoArrayTransformed[args[0]];
        return (
          diffInfo &&
          args && {
            n: diffInfo.n,
            b: diffInfo.b,
            m: args[1],
            p1: Number(args[2]),
            p2: Number(args[3]),
          }
        );
      }, dataCompEntry[3]),
    }),
    dataCompressed
  );
};

const getTypes = mode => ({
  LOADING: `${mode}/RANKINGS/LOADING`,
  SUCCESS: `${mode}/RANKINGS/SUCCESS`,
  ERROR: `${mode}/RANKINGS/ERROR`,
  PROGRESS: `${mode}/RANKINGS/PROGRESS`,
});

const initialState = {
  isLoading: false,
  data: null,
};

const getReducer = mode => {
  const { LOADING, SUCCESS, ERROR, PROGRESS } = getTypes(mode);
  return function rankingsDataReducer(state = initialState, action) {
    switch (action.type) {
      case LOADING:
        return {
          ...state,
          isLoading: true,
          data: [],
        };
      case SUCCESS:
        return {
          ...state,
          isLoading: false,
          data: [
            ...state.data,
            ...decompressData(action.data.slice(_.size(state.data)), action.info),
          ],
        };
      case PROGRESS:
        return {
          ...state,
          isLoading: true,
          data: [
            ...state.data,
            ...decompressData(action.data.slice(_.size(state.data)), action.info),
          ],
        };
      case ERROR:
        return {
          ...state,
          isLoading: false,
          error: action.error,
        };
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

export const fetchRankings = mode => {
  const { LOADING, SUCCESS, ERROR, PROGRESS } = getTypes(mode);
  return async (dispatch, getState) => {
    dispatch({ type: LOADING });
    // Fetch metadata here so we can compare storage dates
    const metadata = await dispatch(fetchMetadata(mode));
    const lastUpdatedFromMetadata = new Date(metadata.lastUpdated).getTime();
    const lastUpdatedFromStorage = await storage.getItem(getRankingsDateStorageKey(mode));
    try {
      const diffInfoArray = await fetchJson({
        url: `${API_PREFIX}/data/ranking/${mode}/map-infos.json`,
      });
      const diffInfoArrayTransformed = diffInfoArray.map(infoItem => {
        const spacePosition = infoItem.indexOf(' ');
        const b = infoItem.slice(0, spacePosition);
        const n = infoItem.slice(spacePosition + 1);
        return { b, n };
      });
      if (lastUpdatedFromStorage > lastUpdatedFromMetadata) {
        // Storage data is newer than database data
        const data = await storage.getItem(getRankingsStorageKey(mode));
        if (data && data.length && !DEBUG_FETCH) {
          dispatch({ type: SUCCESS, data, info: diffInfoArrayTransformed });
          return data;
        }
      }
      const dataCompressed = await fetchJsonPartial({
        url: `${API_PREFIX}/data/ranking/${mode}/compressed.json`,
        intermediateIntervalBytes: 500000,
        onIntermediateDataReceived: data => {
          if (!_.isEmpty(data)) {
            dispatch({ type: PROGRESS, data, info: diffInfoArrayTransformed });
          }
        },
        truncateFunction: r => r.slice(0, r.lastIndexOf(']],')) + ']]]',
      });
      dispatch({ type: SUCCESS, data: dataCompressed, info: diffInfoArrayTransformed });
      if (!DEBUG_FETCH) {
        storage.setItem(getRankingsDateStorageKey(mode), Date.now());
        storage.setItem(getRankingsStorageKey(mode), dataCompressed);
      }
      const decompressedData = getState().rankings[mode].data;
      return decompressedData;
    } catch (error) {
      dispatch({ type: ERROR, error });
    }
  };
};
