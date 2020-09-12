import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// import prizeGold from './prize_gold.png';
// import prizeSilver from './prize_silver.png';
// import prizeBronze from './prize_bronze.png';
import './fav-mappers.scss';

// import CollapsibleBar from 'components/CollapsibleBar';
// import ParamLink from 'components/ParamLink/ParamLink';

import { fetchMappersFavData } from 'reducers/mappersFavs';

function FavMappers({ match }) {
  console.log(match);
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
    <div className="top-mappers">
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
        <table>
          <tbody>
            {data &&
              data.slice(0, count).map((item, index) => {
                const userLink = `https://osu.ppy.sh/users/${item.mapperId}`;
                return (
                  <tr
                    style={{
                      borderBottom: '1px solid #444',
                      fontSize: index < 3 ? '120%' : '100%',
                    }}
                    key={item.mapperId}
                  >
                    <td style={{ fontSize: '70%', paddingRight: '3px' }}>{`${index + 1}.`}</td>
                    <td style={{ padding: '5px 0' }}>
                      <div>
                        <a href={userLink} target="_blank" rel="noopener noreferrer">
                          {item.names.slice(0, 3).map(name => (
                            <div>{name}</div>
                          ))}
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: '5px 10px 5px 0', fontWeight: 'bold', fontSize: '120%' }}>
                      {item.count.toFixed(0)}
                    </td>
                    <td style={{ width: `100%` }}>
                      <div
                        style={{
                          background: ['#FFD700', 'silver', '#CD7F32'][index] || 'grey',
                          height: '1.2em',
                          width: `${((100 * item.count) / maxCount).toFixed(1)}%`,
                        }}
                      ></div>
                    </td>
                  </tr>
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
