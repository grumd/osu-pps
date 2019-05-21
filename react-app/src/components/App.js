import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';

import './App.scss';

import TopBar from 'components/TopBar/TopBar';
import Table from 'components/Table/Table';
import TopMappers from 'components/TopMappers/TopMappers';

class App extends Component {
  render() {
    return (
      <div className="container">
        <Route exact path="/" render={() => <Redirect to="/osu/maps" />} />
        <Route
          path="/:mode(osu|taiko|mania|fruits)"
          render={({ match, location }) => (
            <React.Fragment>
              <TopBar match={match} location={location} />
              <Route path={`${match.path}/maps`} component={Table} />
              <Route path={`${match.path}/mappers/:sort(total|by-age)`} component={TopMappers} />
              <Route
                path={`${match.path}/farmers`}
                component={() => <div>under construction...</div>}
              />
              <Route
                exact
                path={`${match.path}/mappers`}
                render={() => <Redirect to={`${match.url}/mappers/by-age`} />}
              />
            </React.Fragment>
          )}
        />
      </div>
    );
  }
}

export default App;
