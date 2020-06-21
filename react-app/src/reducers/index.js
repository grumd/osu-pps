import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import _ from 'lodash/fp';

import mapsData from 'reducers/mapsData';
import metadata from 'reducers/metadata';
import mappers from 'reducers/mappers';
import rankings from 'reducers/rankings';

import { modes } from 'constants/common';

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
              ..._.mapValues(({ text }) => {
                return {
                  ...state.mapsData[text],
                  data: `Big array, length: ${state.mapsData[text].data.length}`,
                };
              }, modes),
            },
          }),
        })
      )
    : applyMiddleware(thunk)
);
