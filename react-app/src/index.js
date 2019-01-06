import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import { fetchMappersData } from 'reducers/mappers';
import { fetchMapsData } from 'reducers/mapsData';
import { fetchMetadata } from 'reducers/metadata';

import './index.css';
import App from 'components/App';
import { store } from 'reducers';

store.dispatch(fetchMappersData());
store.dispatch(fetchMapsData());
store.dispatch(fetchMetadata());

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
);
