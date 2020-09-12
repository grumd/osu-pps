import React, { Component } from 'react';
import toBe from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';

import prizeGold from './prize_gold.png';
import prizeSilver from './prize_silver.png';
import prizeBronze from './prize_bronze.png';
import './top-mappers.scss';

import CollapsibleBar from 'components/CollapsibleBar';
// import ParamLink from 'components/ParamLink/ParamLink';

import { fetchMappersData } from 'reducers/mappers';

const mapStateToProps = (state, props) => {
  const mode = props.match.params.mode;
  return {
    data: state.mappers[mode].data,
    error: state.mappers[mode].error,
    isLoading: state.mappers[mode].isLoading,
  };
};

const mapDispatchToProps = {
  fetchMappersData,
};

class TopMapper extends Component {
  static propTypes = {
    match: toBe.object,
    location: toBe.object,
    data: toBe.object,
    error: toBe.object,
    isLoading: toBe.bool.isRequired,
  };

  componentDidMount() {
    const { isLoading, data, match } = this.props;
    if (!isLoading && !data) {
      this.props.fetchMappersData(match.params.mode);
    }
  }

  componentDidUpdate() {
    const { match, isLoading, data } = this.props;
    if (!data && !isLoading) {
      this.props.fetchMappersData(match.params.mode);
    }
  }

  render() {
    const { isLoading, data, error } = this.props;

    // const dataUsed = !data ? [] : match.params.sort === 'total' ? data.top20 : data.top20age;
    const dataUsed = !data ? [] : data.top20age;

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
                This is the list of ppest pp mappers according to my calculations.
                <br /> See faq for more info
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TopMapper));
