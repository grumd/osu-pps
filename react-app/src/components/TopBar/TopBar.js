import React, { useMemo } from 'react';
import toBe from 'prop-types';
import classNames from 'classnames';
import { NavLink, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Transition } from 'react-transition-group';
import { FaHeart } from 'react-icons/fa';

import './top-bar.scss';

import { modes } from 'constants/common';
import { routes } from 'constants/routes';

import ParamLink from 'components/ParamLink/ParamLink';
// import Overlay from 'components/Overlay/Overlay';

const mapStateToProps = (state, props) => {
  const withMode = props.match.path.includes(':mode');

  if (!withMode) {
    return { withMode };
  }

  const mode = props.match.params.mode;
  const withMapperType = props.match.path.includes(':mapperType');

  return {
    mode,
    withMode,
    withMapperType,
    lastUpdated: state.metadata[mode].lastUpdated,
    lastUpdatedTime: state.metadata[mode].lastUpdatedTime,
    isLoading: state.metadata[mode].isLoading,
    isLoadingData: state.mapsData[mode].isLoading,
    itemsCount: state.mapsData[mode].data.length,
  };
};

function TopBar({
  isLoading,
  isLoadingData,
  lastUpdated,
  lastUpdatedTime,
  itemsCount,
  match,
  location,
  withMode,
  withMapperType,
}) {
  const params = useMemo(() => {
    return {
      ...match.params,
      mode: match.params.mode || modes.osu.text,
    };
  }, [match.params]);

  return (
    <header className="top-bar">
      <div className="vertical-menus">
        <nav>
          <ul>
            <div className="pp-word">pp</div>
            <li>
              <NavLink to={routes.maps.path(params)}>maps</NavLink>
            </li>
            <li>
              <NavLink to={routes.mappers.path(params)}>mappers</NavLink>
            </li>
            <li>
              <NavLink to={routes.rankings.path(params)}>rankings</NavLink>
            </li>
            <li>
              <NavLink to={routes.faq.path()}>faq</NavLink>
            </li>
          </ul>
        </nav>
        {withMode && (
          <nav>
            <ul>
              <li>
                <ParamLink match={match} location={location} params={{ mode: 'osu' }}>
                  osu
                </ParamLink>
              </li>
              <li>
                <ParamLink match={match} location={location} params={{ mode: 'mania' }}>
                  mania
                </ParamLink>
              </li>
              <li>
                <ParamLink match={match} location={location} params={{ mode: 'taiko' }}>
                  taiko
                </ParamLink>
              </li>
              <li>
                <ParamLink match={match} location={location} params={{ mode: 'fruits' }}>
                  fruits
                </ParamLink>
              </li>
            </ul>
          </nav>
        )}
        {withMapperType && (
          <nav className="mapper-type">
            <ul>
              <li>
                <ParamLink match={match} location={location} params={{ mapperType: 'pp' }}>
                  pp mappers
                </ParamLink>
              </li>
              <li>
                <ParamLink match={match} location={location} params={{ mapperType: 'fav' }}>
                  quality mappers
                </ParamLink>
              </li>
            </ul>
          </nav>
        )}
      </div>
      <div className="spacer" />
      <div className="right-side-block">
        <Transition
          in={isLoadingData}
          timeout={{
            appear: 0,
            enter: 0,
            exit: 3000,
          }}
        >
          {state => (
            <div className={classNames('loader-text', state)}>
              {itemsCount > 0 ? `loaded ${itemsCount} maps` : 'loading...'}
            </div>
          )}
        </Transition>
        <div className="last-update-block">
          {withMode && (
            <div id="last-update" title={lastUpdatedTime || ''}>
              {isLoading ? 'loading...' : `last updated: ${lastUpdated}`}
            </div>
          )}
          <div className="author">
            <span>contact:</span>
            <a
              href="https://www.reddit.com/message/compose/?to=grumd"
              target="_blank"
              rel="noreferrer noopener"
            >
              <img src={process.env.PUBLIC_URL + '/reddit.svg'} alt="reddit" className="icon" />
            </a>
            <a href="https://twitter.com/grumd_osu" target="_blank" rel="noreferrer noopener">
              <img src={process.env.PUBLIC_URL + '/twitter.svg'} alt="twitter" className="icon" />
            </a>
            <a href="https://osu.ppy.sh/users/530913" target="_blank" rel="noreferrer noopener">
              <img
                src="https://osu.ppy.sh/images/layout/osu-logo-white.svg"
                alt="osu!"
                className="icon"
              />
            </a>
          </div>
          <div className="support">
            <a href="https://www.patreon.com/grumd" target="_blank" rel="noreferrer noopener">
              <span>support me</span>
              <FaHeart />
            </a>
            {/* <Overlay
              overlayClassName="support-overlay"
              placement="bottom"
              overlayItem={
                <button className="like-a-link">
                  <span>support me</span>
                  <FaHeart />
                </button>
              }
            >
              <div>
                <a href="https://www.patreon.com/grumd" target="_blank" rel="noreferrer noopener">
                  <span>patreon</span>
                  <FaHeart />
                </a>
                <a href="https://buymeacoffee.com/grumd" target="_blank" rel="noreferrer noopener">
                  <span>buy me a coffee</span>
                  <FaHeart />
                </a>
              </div>
            </Overlay> */}
          </div>
        </div>
      </div>
    </header>
  );
}

TopBar.propTypes = {
  lastUpdated: toBe.string,
  lastUpdatedTime: toBe.string,
  isLoading: toBe.bool.isRequired,
  isLoadingData: toBe.bool.isRequired,
  itemsCount: toBe.number.isRequired,
  match: toBe.object,
  location: toBe.object,
  mode: toBe.string,
  withMode: toBe.bool,
  withMapperType: toBe.bool,
};

export default withRouter(connect(mapStateToProps)(TopBar));
