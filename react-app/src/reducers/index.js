import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import mapsData from 'reducers/mapsData';
import metadata from 'reducers/metadata';
import mappers from 'reducers/mappers';
import rankings from 'reducers/rankings';

const rootReducer = combineReducers({
  mapsData,
  metadata,
  mappers,
  rankings,
});

export const store = createStore(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__
    ? compose(
        applyMiddleware(thunk),
        window.__REDUX_DEVTOOLS_EXTENSION__({
          stateSanitizer: state => ({
            ...state,
            mapsData: {
              ...state.mapsData,
              dataByMode: Object.keys(state.mapsData.dataByMode).reduce((acc, key) => ({
                ...acc,
                [key]: state.mapsData.dataByMode[key].length,
              })),
            },
          }),
        })
      )
    : applyMiddleware(thunk)
);
