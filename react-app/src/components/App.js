import React, { useEffect } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';

import './App.scss';

import TopBar from 'components/TopBar/TopBar';
import Table from 'components/Table/Table';
import TopMappers from 'components/TopMappers/TopMappers';
import FavMappers from 'components/FavMappers/FavMappers';
import Rankings from 'components/Rankings/Rankings';
import Faq from 'components/Faq/Faq';

import { isMobile } from 'utils/browser';

import { fetchMetadata } from 'reducers/metadata';

function ModeComponent({ match }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMetadata(match.params.mode));
  }, []);

  return (
    <>
      <Route exact path={match.path} render={() => <Redirect to={`${match.url}/maps`} />} />
      <Route
        path={`${match.path}/maps`}
        render={({ match }) => (
          <>
            <TopBar match={match} />
            <Table match={match} />
          </>
        )}
      />
      <Route
        path={`${match.path}/mappers`}
        render={({ match }) => (
          <>
            <Route
              exact
              path={`${match.path}`}
              render={({ match }) => <Redirect to={`${match.url}/pp`} />}
            />
            <Route
              path={`${match.path}/:mapperType(pp|fav)`}
              render={({ match }) => (
                <>
                  <TopBar match={match} showMappersMenu />
                  {match.params.mapperType === 'pp' ? (
                    <TopMappers match={match} />
                  ) : (
                    <FavMappers match={match} />
                  )}
                </>
              )}
            />
          </>
        )}
      />
      <Route
        path={`${match.path}/rankings`}
        render={({ match }) => (
          <>
            <TopBar match={match} />
            <Rankings match={match} />
          </>
        )}
      />
    </>
  );
}

function App() {
  return (
    <div className={classNames('container', { mobile: isMobile })}>
      <Switch>
        <Route exact path="/" render={() => <Redirect to="/osu/maps" />} />
        <Route
          path="/faq"
          render={({ match }) => (
            <>
              <TopBar match={match} />
              <Faq />
            </>
          )}
        />
        <Route path="/:mode(osu|taiko|mania|fruits)" component={ModeComponent} />
        <Route render={() => <Redirect to="/osu/maps" />} />
      </Switch>
    </div>
  );
}

export default App;
