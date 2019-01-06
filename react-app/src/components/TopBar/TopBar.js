import React, { Component } from 'react';
import toBe from 'prop-types';
import { NavLink, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import './top-bar.scss';

import { routes } from 'constants/routes';

const mapStateToProps = state => {
  return {
    lastUpdated: state.metadata.lastUpdated,
    isLoading: state.metadata.isLoading,
  };
};

class TopBar extends Component {
  static propTypes = {
    lastUpdated: toBe.string,
    isLoading: toBe.bool.isRequired,
  };

  render() {
    const { isLoading, lastUpdated } = this.props;

    return (
      <header className="top-bar">
        <nav>
          <ul>
            <div className="pp-word">pp</div>
            <li>
              <NavLink to={routes.maps.path}>maps</NavLink>
            </li>
            <li>
              <NavLink to={routes.mappers.path}>mappers</NavLink>
            </li>
            {/* <li>
              <NavLink to={routes.farmers.path}>farmers</NavLink>
            </li> */}
          </ul>
        </nav>
        <div className="spacer" />
        <div>
          <div id="last-update">{isLoading ? 'loading...' : `last updated: ${lastUpdated}`}</div>
          <div className="author">
            contact: <a href="https://www.reddit.com/message/compose/?to=grumd">/u/grumd</a>
          </div>
        </div>
      </header>
    );
  }
}

export default withRouter(connect(mapStateToProps)(TopBar));
