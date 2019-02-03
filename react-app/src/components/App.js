import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';

import './App.scss';

import TopBar from 'components/TopBar/TopBar';
import Table from 'components/Table/Table';
import TopMappers from 'components/TopMappers/TopMappers';

import { routes } from 'constants/routes';

class App extends Component {
  render() {
    return (
      <div className="container">
        <TopBar />
        <Route exact path="/" render={() => <Redirect to={routes.maps.path} />} />
        <Route path={routes.maps.path} component={Table} />
        <Route path={routes.mappers.path + '/:sort(total|by-age)'} component={TopMappers} />
        <Route
          exact
          path={routes.mappers.path}
          component={() => <Redirect to={routes.mappers.path + '/by-age'} />}
        />
        <Route path={routes.farmers.path} component={() => <div>under construction...</div>} />
      </div>
    );
  }
}

export default App;
