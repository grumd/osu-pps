import React, { Component } from 'react';
import toBe from 'prop-types';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import classNames from 'classnames';

import prizeGold from './prize_gold.png';
import prizeSilver from './prize_silver.png';
import prizeBronze from './prize_bronze.png';
import './top-mappers.scss';

import { routes } from 'constants/routes';

import CollapsibleBar from 'components/CollapsibleBar';

const mapStateToProps = state => {
  return {
    data: state.mappers.data,
    error: state.mappers.error,
    isLoading: state.metadata.isLoading,
  };
};

class TopMapper extends Component {
  static propTypes = {
    match: toBe.object,
    data: toBe.object,
    error: toBe.object,
    isLoading: toBe.bool.isRequired,
  };

  render() {
    const { isLoading, data, error, match } = this.props;

    const dataUsed = match.params.sort === 'total' ? data.top20 : data.top20age;

    let maxOw = 0;
    dataUsed.forEach(mapper => {
      mapper.mapsRecorded.forEach(map => {
        if (map.ow > maxOw) {
          maxOw = map.ow;
        }
      });
    });

    return (
      <div className="top-mappers">
        <header>
          {isLoading && <div className="loading">loading...</div>}
          {error && error.message}
          {!isLoading && !error && (
            <>
              <p>
                this is the list of mappers who take advantage of current pp system the most
                <br /> it tries its best at detecting guest diffs, but it's not easy with all the
                custom diff names
                <br /> congratulations to our winners! 🏆
              </p>
              <p>
                you can either look at top 20 sorted by{' '}
                <NavLink to={routes.mappers.path + '/total'}>total overweightness points</NavLink>
                <br /> or adjusted for{' '}
                <NavLink to={routes.mappers.path + '/by-age'}>
                  date when the maps were ranked
                </NavLink>
              </p>
            </>
          )}
        </header>
        <div className="content">
          <div className="top-list">
            <ul>
              {dataUsed.map((mapper, mapperIndex) => {
                return (
                  <CollapsibleBar
                    key={mapper.id}
                    className={classNames({ top: mapperIndex < 3 })}
                    title={
                      <>
                        <span>
                          <span className="place-number">{mapperIndex + 1}.</span> {mapper.name}
                        </span>
                        {mapperIndex < 3 && (
                          <img src={[prizeGold, prizeSilver, prizeBronze][mapperIndex]} alt=" " />
                        )}
                      </>
                    }
                  >
                    <div className="map-row header-row" key="header">
                      <div className="text">
                        <a href={`https://osu.ppy.sh/users/${mapper.id}`}>
                          Link to mapper's profile
                        </a>
                      </div>
                      <div className="pp" />
                      <div className="overweightness">overweightness - {mapper.points} total</div>
                    </div>
                    {mapper.mapsRecorded.map(map => {
                      return (
                        <div className="map-row" key={map.id}>
                          <div className="text">
                            <a href={`https://osu.ppy.sh/beatmaps/${map.id}`}>{map.text}</a>
                          </div>
                          <div className="pp">{Math.round(map.pp)}pp</div>
                          <div className="overweightness">{Math.round(map.ow)}</div>
                          <div className="graph">
                            <div
                              style={{ width: `${Math.round((map.ow / maxOw) * 10000) / 100}%` }}
                              className="inner-graph"
                            />
                          </div>
                        </div>
                      );
                    })}
                    {mapper.mapsRecorded.length === 20 && (
                      <div className="map-row footer-row" key="footer">
                        <div className="text">
                          <i>only showing first 20 maps</i>
                        </div>
                      </div>
                    )}
                  </CollapsibleBar>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(TopMapper);
