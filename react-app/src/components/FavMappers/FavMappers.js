import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash/fp';
import classNames from 'classnames';

import { API_PREFIX } from 'constants/common';

import Loader from 'components/Loader';

import { fetchJson } from 'utils/fetch';
import { isMobile } from 'utils/browser';

import './fav-mappers.scss';

import { fetchMappersFavData } from 'reducers/mappersFavs';

function MapperRow({ item, index, maxCount, mode }) {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (expanded && !details && !isLoading) {
      setLoading(true);
      fetchJson({
        url: `${API_PREFIX}/data/mappers/${mode}/favored-mappers-maps/${item.mapperId}.json`,
      })
        .then(data => {
          setLoading(false);
          setDetails(data);
        })
        .catch(setError);
    }
    if (!expanded && error) {
      setError(null);
    }
  }, [expanded, details, isLoading]);

  const maxSongCount = useMemo(() => {
    return Array.isArray(details) ? _.get('count', _.maxBy('count', details)) : 0;
  }, [details]);
  const medianPoints = useMemo(() => {
    if (Array.isArray(details)) {
      const numbers = _.map('count', details);
      return numbers.reduce((a, b) => a + b) / numbers.length;
    }
    return 0;
  }, [details]);

  const userLink = `https://osu.ppy.sh/users/${item.mapperId}`;

  return (
    <>
      <tr
        style={{
          fontSize: index < 3 ? '120%' : '100%',
        }}
        key={item.mapperId}
      >
        <td className="index">{`${index + 1}.`}</td>
        <td className="names">
          <div>
            <a href={userLink} target="_blank" rel="noopener noreferrer">
              {item.names.slice(0, 4).map(name => (
                <div key="name">{name}</div>
              ))}
              {item.names[4] && <div key="name">.....</div>}
            </a>
          </div>
        </td>
        <td className="count" onClick={() => setExpanded(!expanded)}>
          {item.count.toFixed(0)}
        </td>
        <td className="expand" onClick={() => setExpanded(!expanded)}>
          <button className="btn">{expanded ? '-' : '+'}</button>
        </td>
        <td className="line" onClick={() => setExpanded(!expanded)}>
          <div
            style={{
              background: ['#FFD700', 'silver', '#CD7F32'][index] || 'grey',
              height: '1.2em',
              width: `${((100 * item.count) / maxCount).toFixed(1)}%`,
            }}
          ></div>
        </td>
      </tr>
      {expanded && error}
      {expanded && !error && (
        <tr className="sub-tr">
          <td colSpan={5}>
            {error}
            {!error && isLoading && (
              <div className="loader-row">
                <Loader />
              </div>
            )}
            {!error && !isLoading && (
              <div className={classNames('sub-table', { mobile: isMobile })}>
                <table>
                  <tbody>
                    {details && (
                      <tr>
                        <td className="song-name"></td>
                        <td className="count">
                          <div className="count-container">
                            {details.length} maps; average points per map: {medianPoints.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    )}
                    {details &&
                      details.map(song => {
                        const mapLink = `https://osu.ppy.sh/beatmapsets/${song.id}`;
                        return (
                          <tr key={song.id}>
                            <td className="song-name">
                              <a href={mapLink} target="_blank" rel="noopener noreferrer">
                                {song.artist} - {song.title}
                              </a>
                            </td>
                            <td className="count">
                              <div className="count-container">
                                <div
                                  className="count-line"
                                  style={{
                                    width: `${((100 * song.count) / maxSongCount).toFixed(1)}%`,
                                  }}
                                >
                                  {song.count}
                                </div>
                                {song.ranked_date && (
                                  <div className="count-ranked-date">
                                    ranked: {new Date(song.ranked_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function FavMappers({ match }) {
  const dispatch = useDispatch();
  const [count, setCount] = useState(20);

  useEffect(() => {
    dispatch(fetchMappersFavData(match.params.mode));
  }, [match.params.mode]);

  const mappersData = useSelector(state => state.mappersFavs[match.params.mode]);

  if (!mappersData) {
    return null;
  }

  const { isLoading, data, error } = mappersData;

  const maxCount = data && data[0] && data[0].count;

  return (
    <div className="fav-mappers">
      <header>
        {isLoading && <div className="loading">loading...</div>}
        {error && error.message}
        {!isLoading && !error && (
          <p>
            This is the list of best mappers according to other mappers' favorites.
            <br /> See faq for more info
          </p>
        )}
      </header>
      <div className="content">
        <table className="main-table">
          <tbody>
            {data &&
              data.slice(0, count).map((item, index) => {
                return (
                  <MapperRow
                    mode={match.params.mode}
                    item={item}
                    index={index}
                    maxCount={maxCount}
                    key={item.mapperId}
                  />
                );
              })}
          </tbody>
        </table>
        {data && data.length && (
          <div
            className="show-more-div"
            onClick={() => setCount(Math.min(count + 20, data.length))}
          >
            <button className="btn btn-success show-more-btn">show more</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FavMappers;
