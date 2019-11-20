import React, { Component } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import classNames from 'classnames';

import './App.scss';

import TopBar from 'components/TopBar/TopBar';
import Table from 'components/Table/Table';
import TopMappers from 'components/TopMappers/TopMappers';
import Rankings from 'components/Rankings/Rankings';

import { isMobile } from 'utils/browser';

class App extends Component {
  render() {
    return (
      <div className={classNames('container', { mobile: isMobile })}>
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/osu/maps" />} />
          <Route
            path="/:mode(osu|taiko|mania|fruits)"
            render={({ match, location }) => (
              <React.Fragment>
                <TopBar match={match} location={location} />
                <Switch>
                  <Route path={`${match.path}/maps`} component={Table} />
                  <Route
                    path={`${match.path}/mappers/:sort(total|by-age)`}
                    component={TopMappers}
                  />
                  <Route
                    path={`${match.path}/farmers`}
                    component={() => <div>under construction...</div>}
                  />
                  <Route path={`${match.path}/rankings`} component={Rankings} />
                  <Route
                    exact
                    path={`${match.path}/mappers`}
                    render={() => <Redirect to={`${match.url}/mappers/by-age`} />}
                  />
                  <Route render={() => <Redirect to={`${match.url}/maps`} />} />
                </Switch>
              </React.Fragment>
            )}
          />
          <Route render={() => <Redirect to="/osu/maps" />} />
        </Switch>
      </div>
    );
  }
}

export default App;
