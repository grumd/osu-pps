import { fetchJson } from 'utils/fetch';

const LOADING = 'MAPPERS/LOADING';
const SUCCESS = 'MAPPERS/SUCCESS';
const ERROR = 'MAPPERS/ERROR';

const initialState = {
  isLoading: false,
  data: null,
};

export default function mappersDataReducer(state = initialState, action) {
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
}

export const fetchMappersData = () => {
  return async dispatch => {
    dispatch({ type: LOADING });
    try {
      const data = await fetchJson({
        url: 'https://raw.githubusercontent.com/grumd/osu-pps/master/data-mappers.json',
      });
      dispatch({ type: SUCCESS, data });
      return data;
    } catch (error) {
      dispatch({ type: ERROR, error });
    }
  };
};
