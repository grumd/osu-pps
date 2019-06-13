import { combineReducers } from 'redux';
import { fetchJson } from 'utils/fetch';
import { DEBUG_FETCH } from 'constants/common';

const getTypes = mode => ({
  LOADING: `${mode}/RANKINGS/LOADING`,
  SUCCESS: `${mode}/RANKINGS/SUCCESS`,
  ERROR: `${mode}/RANKINGS/ERROR`,
});

const initialState = {
  isLoading: false,
  data: null,
};

const getReducer = mode => {
  const { LOADING, SUCCESS, ERROR } = getTypes(mode);
  return function rankingsDataReducer(state = initialState, action) {
    switch (action.type) {
      case LOADING:
        return {
          ...state,
          isLoading: true,
        };
      case SUCCESS:
        return {
          ...state,
          isLoading: false,
          data: action.data,
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
  const { LOADING, SUCCESS, ERROR } = getTypes(mode);
  return async dispatch => {
    dispatch({ type: LOADING });
    try {
      const data = await fetchJson({
        url: DEBUG_FETCH
          ? `/data-${mode}-rankings.json`
          : `https://raw.githubusercontent.com/grumd/osu-pps/master/data-${mode}-rankings.json`,
      });
      dispatch({ type: SUCCESS, data });
      return data;
    } catch (error) {
      dispatch({ type: ERROR, error });
    }
  };
};
