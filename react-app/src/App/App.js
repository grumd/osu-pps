import React, { Component } from "react";
import { Route, Redirect } from "react-router-dom";

import "./App.scss";

import TopBar from "./TopBar/TopBar";
import Table from "./Table/Table";

import { routes } from "./constants";

class App extends Component {
  render() {
    return (
      <div className="container">
        <TopBar />
        <Route
          exact
          path="/"
          render={() => <Redirect to={routes.maps.path} />}
        />
        <Route path={routes.maps.path} component={Table} />
        <Route
          path={routes.mappers.path}
          component={() => "under construction..."}
        />
      </div>
    );
  }
}

export default App;
