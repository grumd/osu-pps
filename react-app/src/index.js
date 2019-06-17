import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';
import 'utils/polyfills';

import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import './index.css';
import App from 'components/App';
import { store } from 'reducers';

ReactDOM.render(
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>,
  document.getElementById('root')
);
