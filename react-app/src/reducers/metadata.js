import { fetchJson } from 'utils/fetch';

const LOADING = 'METADATA/LOADING';
const SUCCESS = 'METADATA/SUCCESS';
const ERROR = 'METADATA/ERROR';

const initialState = {
  isLoading: false,
  lastUpdated: null,
};

export default function metadataReducer(state = initialState, action) {
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
    case SUCCESS:
      return {
        ...state,
        isLoading: false,
        lastUpdated: new Date(action.data.lastUpdated).toLocaleDateString(),
      };
    default:
      return state;
  }
}

export const fetchMetadata = () => {
  return async dispatch => {
    dispatch({ type: LOADING });
    try {
      const data = await fetchJson({
        url: 'https://raw.githubusercontent.com/grumd/osu-pps/master/metadata.json',
      });
      dispatch({ type: SUCCESS, data });
      return data;
    } catch (error) {
      dispatch({ type: ERROR, error });
    }
  };
};
