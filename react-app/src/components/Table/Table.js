import React, { PureComponent } from 'react';
import toBe from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import classNames from 'classnames';
import Select from 'react-select';
import { FaRegClock, FaStar } from 'react-icons/fa';
import { GiFarmer } from 'react-icons/gi';
import ReactTimeAgo from 'react-time-ago';

import {
  fetchMapsData,
  updateSearchKey,
  showMore,
  recalculateVisibleData,
  emptySearchKey,
  resetSearchKey,
} from 'reducers/mapsData';

import CollapsibleBar from 'components/CollapsibleBar';

import {
  FIELDS,
  languageOptions,
  languageMap,
  genreOptions,
  genreMap,
  rankedDateOptions,
} from 'constants/mapsData';
import { getCookieSearchKey, modes } from 'constants/common';

import { overweightnessCalcFromMode } from 'utils/overweightness';
import { isMobile } from 'utils/browser';

import './table.scss';
import './cards-view.scss';

function truncateFloat(number) {
  return Math.round(number * 100) / 100;
}
function secondsToFormatted(length) {
  return `${Math.floor(length / 60)}:${('0' + (length % 60)).slice(-2)}`;
}

const okGlyph = <span className="glyphicon glyphicon-ok" />;
const htGlyph = <span className="glyphicon glyphicon-time" />;

const rootSelector = (state, props) => state.mapsData[props.match.params.mode];
const dataSelector = (state, props) => rootSelector(state, props).data;

const coefficientSelector = createSelector(
  [dataSelector, (state, props) => rootSelector(state, props).searchKey[FIELDS.MODE]],
  (data, owMode) => {
    const calc = overweightnessCalcFromMode[owMode];
    const maxOverweightness = data.reduce((max, item) => {
      const current = calc(item);
      return current > max ? current : max;
    }, 0);
    return 10000 / maxOverweightness;
  }
);

const mapStateToProps = (state, props) => {
  const mode = props.match.params.mode;
  const mapsData = rootSelector(state, props);
  return {
    mode,
    hasData: !!rootSelector(state, props).receivedAt,
    visibleData: mapsData.visibleData,
    isShowMoreVisible: mapsData.visibleItemsCount < mapsData.filteredData.length,
    visibleItemsCount: mapsData.visibleItemsCount,
    searchKey: mapsData.searchKey,
    isLoading: mapsData.isLoading,
    overweightnessCoefficient: coefficientSelector(state, props),
    lastUpdatedDate: state.metadata[mode].lastUpdatedDate,
  };
};

const mapDispatchToProps = {
  updateSearchKey,
  resetSearchKey,
  showMore,
  recalculateVisibleData,
  fetchMapsData,
};

const Card = React.memo(
  ({
    item,
    isMania,
    overweightnessCoefficient: coef,
    overweightnessMode,
    expandedView,
    lastUpdatedDate,
  }) => {
    var mods = {
      dt: (item.m & 64) === 64,
      hd: (item.m & 8) === 8,
      hr: (item.m & 16) === 16,
      fl: (item.m & 1024) === 1024,
      ht: (item.m & 256) === 256,
    };
    var mapLink = `http://osu.ppy.sh/b/${item.b}`;
    var linkText = item.art ? `${item.art} - ${item.t} [${item.v}]` : mapLink;

    var bpm = mods.dt ? (
      <span>
        <span className="bpm fast">{truncateFloat(item.bpm * 1.5)}</span>
        <span>({truncateFloat(item.bpm)})</span>
      </span>
    ) : mods.ht ? (
      <span>
        <span className="bpm slow">{truncateFloat(item.bpm * 0.75)}</span>
        <span>({truncateFloat(item.bpm)})</span>
      </span>
    ) : (
      truncateFloat(item.bpm)
    );
    const overweightnessRaw = overweightnessCalcFromMode[overweightnessMode](item);
    const overweightnessText = (overweightnessRaw * coef).toFixed(0);

    return (
      <div className="card">
        <div className="card-column song-image">
          <a href={mapLink} target="_blank" rel="noopener noreferrer">
            <img src={`https://b.ppy.sh/thumb/${item.s}.jpg`} alt="background" />
          </a>
          <div className="pp-value">
            {(+item.pp99).toFixed(0)}
            <span className="lbl">pp</span>
          </div>
        </div>
        <div className="card-column song-title">
          <div>
            <a href={mapLink} target="_blank" rel="noopener noreferrer">
              {linkText}
            </a>
          </div>
          <div className="mods">
            {isMania && (
              <div className={classNames('mod', { active: item.k })}>
                {item.k ? item.k + 'K' : '?'}
              </div>
            )}
            <div className={classNames('mod', { active: mods.dt, inverted: mods.ht })}>
              {mods.ht ? 'HT' : 'DT'}
            </div>
            <div className={classNames('mod', { active: mods.hd })}>HD</div>
            <div className={classNames('mod', { active: mods.hr })}>HR</div>
            <div className={classNames('mod', { active: mods.fl })}>FL</div>
          </div>
          <div className="props">
            <div className="prop-block time">
              <FaRegClock />
              <div>{secondsToFormatted(item.l)}</div>
            </div>
            <div className="prop-block bpm">
              <div className="icon-text">bpm</div>
              <div>{bpm}</div>
            </div>
            <div className="prop-block diff">
              <FaStar />
              <div>{item.d}</div>
            </div>
            <div className="prop-block ow">
              <GiFarmer />
              <div>{overweightnessText}</div>
            </div>
          </div>
          {expandedView && (
            <div className="genre-language">
              <span className="grey-title">language:</span>
              <span> {languageMap[item.ln]}, </span>
              <span className="grey-title">genre:</span>
              <span> {genreMap[item.g]}, </span>
              <span className="grey-title">ranked:</span>
              <span>
                {' '}
                <ReactTimeAgo date={new Date(item.appr_h * 60 * 60 * 1000)} />
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

class TableBody extends PureComponent {
  static propTypes = {
    data: toBe.array.isRequired,
    overweightnessMode: toBe.string.isRequired,
    overweightnessCoefficient: toBe.number.isRequired,
    expandedView: toBe.bool,
    isMania: toBe.bool,
  };

  static defaultProps = {
    isMania: false,
    expandedView: false,
  };

  render() {
    const {
      data,
      overweightnessMode,
      overweightnessCoefficient: coef,
      expandedView,
      isMania,
    } = this.props;

    return (
      <tbody>
        {data.map(item => {
          var mods = {
            dt: (item.m & 64) === 64,
            hd: (item.m & 8) === 8,
            hr: (item.m & 16) === 16,
            fl: (item.m & 1024) === 1024,
            ht: (item.m & 256) === 256,
          };
          var mapLink = `http://osu.ppy.sh/b/${item.b}`;
          var linkText = item.art ? `${item.art} - ${item.t} [${item.v}]` : mapLink;

          var bpm = mods.dt ? (
            <span>
              <span className="bpm fast">{truncateFloat(item.bpm * 1.5)}</span>
              <span>({truncateFloat(item.bpm)})</span>
            </span>
          ) : mods.ht ? (
            <span>
              <span className="bpm slow">{truncateFloat(item.bpm * 0.75)}</span>
              <span>({truncateFloat(item.bpm)})</span>
            </span>
          ) : (
            truncateFloat(item.bpm)
          );

          const overweightnessRaw = overweightnessCalcFromMode[overweightnessMode](item);
          const overweightnessText = (overweightnessRaw * coef).toFixed(0);

          return (
            <tr key={`${item.b}_${item.m}`}>
              <td className="img-td">
                <a href={mapLink} target="_blank" rel="noopener noreferrer">
                  <img src={`https://b.ppy.sh/thumb/${item.s}.jpg`} alt="background" />
                </a>
              </td>
              <td>
                <div>
                  <a href={mapLink} target="_blank" rel="noopener noreferrer">
                    {linkText}
                  </a>
                </div>
                {expandedView && (
                  <>
                    <div className="genre-language">
                      <span className="grey-title">language:</span>
                      <span> {languageMap[item.ln]}, </span>
                      <span className="grey-title">genre:</span>
                      <span> {genreMap[item.g]}</span>
                    </div>
                    <div className="genre-language">
                      <span className="grey-title">ranked:</span>
                      <span>
                        {' '}
                        <ReactTimeAgo date={new Date(item.appr_h * 60 * 60 * 1000)} />
                      </span>
                    </div>
                  </>
                )}
              </td>
              <td className="text-center">{(+item.pp99).toFixed(0)}</td>
              {isMania && <td className="text-center">{item.k ? item.k + 'K' : '?'}</td>}
              <td className="text-center">{mods.ht ? htGlyph : mods.dt ? okGlyph : null}</td>
              <td className="text-center">{mods.hd ? okGlyph : null}</td>
              <td className="text-center">{mods.hr ? okGlyph : null}</td>
              <td className="text-center">{mods.fl ? okGlyph : null}</td>
              <td className="text-center">{secondsToFormatted(item.l)}</td>
              <td className="text-center">{bpm}</td>
              <td className="text-center">{item.d}</td>
              <td className="text-center">{overweightnessText}</td>
            </tr>
          );
        })}
      </tbody>
    );
  }
}

class Table extends PureComponent {
  static propTypes = {
    hasData: toBe.bool.isRequired,
    isShowMoreVisible: toBe.bool.isRequired,
    visibleData: toBe.array.isRequired,
    visibleItemsCount: toBe.number.isRequired,
    searchKey: toBe.object.isRequired,
    isLoading: toBe.bool.isRequired,
    updateSearchKey: toBe.func.isRequired,
    showMore: toBe.func.isRequired,
    recalculateVisibleData: toBe.func.isRequired,
    overweightnessCoefficient: toBe.number.isRequired,
    fetchMapsData: toBe.func.isRequired,
  };

  constructor(props) {
    super();
    this.state = {
      expandedView: !!props.searchKey[FIELDS.GENRE].length || !!props.searchKey[FIELDS.LANG].length,
    };
  }

  componentDidMount() {
    const { isLoading, hasData, mode } = this.props;
    if (!isLoading && !hasData) {
      this.props.fetchMapsData(mode);
    }
  }

  componentDidUpdate(prevProps) {
    const { isLoading, hasData, mode } = this.props;
    if (!hasData && !isLoading) {
      this.props.fetchMapsData(mode);
    }
    // if (prevProps.mode !== mode) {
    // Do we need it?
    // this.props.recalculateVisibleData(mode);
    // }
  }

  onChangeExact(key, value) {
    const { mode } = this.props;
    document.cookie = `${getCookieSearchKey({ key, mode })}=${value}; path=/`;
    this.props.updateSearchKey(mode, key, value);
  }

  onChangeMulti(key, array) {
    const { mode } = this.props;
    const cookieValue = array.map(option => option.value).join(',');
    document.cookie = `${getCookieSearchKey({ key, mode })}=${cookieValue}; path=/`;
    this.props.updateSearchKey(mode, key, array);
  }

  onChange(key, e) {
    const { mode } = this.props;
    const value = e.target.value;
    document.cookie = `${getCookieSearchKey({ key, mode })}=${value}; path=/`;

    this.props.updateSearchKey(mode, key, value);
  }

  onChangeNumber(key, e, trailZeros = false) {
    const { mode } = this.props;
    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
    document.cookie = `${getCookieSearchKey({ key, mode })}=${e.target.value}; path=/`;

    this.props.updateSearchKey(mode, key, value);
  }

  toggleExpandView = () => {
    this.setState(state => ({ expandedView: !state.expandedView }));
  };

  renderHead() {
    const { searchKey, mode } = this.props;
    const isMania = mode === modes.mania.text;

    return (
      <thead>
        <tr>
          {/*<td className="img-td" />*/}
          <td className="img-td">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={this.toggleExpandView}
            >
              {this.state.expandedView ? 'less' : 'more'}
            </button>
          </td>
          <td>
            <div className="form-group search-control">
              <input
                onChange={e => this.onChange(FIELDS.TEXT, e)}
                value={searchKey[FIELDS.TEXT]}
                type="text"
                className={classNames('form-control input-sm', {
                  active: searchKey[FIELDS.TEXT] !== emptySearchKey[FIELDS.TEXT],
                })}
                placeholder="search..."
              />
            </div>
          </td>
          <td className="min-max-head">
            <input
              onChange={e => this.onChangeNumber(FIELDS.PP_MIN, e)}
              value={searchKey[FIELDS.PP_MIN]}
              type="number"
              className={classNames('form-control pp-input input-sm', {
                active: searchKey[FIELDS.PP_MIN] !== emptySearchKey[FIELDS.PP_MIN],
              })}
              placeholder="min"
            />
            <input
              onChange={e => this.onChangeNumber(FIELDS.PP_MAX, e)}
              value={searchKey[FIELDS.PP_MAX]}
              type="number"
              className={classNames('form-control pp-input input-sm', {
                active: searchKey[FIELDS.PP_MAX] !== emptySearchKey[FIELDS.PP_MAX],
              })}
              placeholder="max"
            />
          </td>
          {isMania && (
            <td className="mod-head">
              <select
                className={classNames('form-control input-sm', {
                  active: searchKey[FIELDS.MANIA_K] !== emptySearchKey[FIELDS.MANIA_K],
                })}
                onChange={e => this.onChangeNumber(FIELDS.MANIA_K, e)}
                value={searchKey[FIELDS.MANIA_K]}
              >
                <option value="-1">any</option>
                <option value="4">4k</option>
                <option value="5">5k</option>
                <option value="6">6k</option>
                <option value="7">7k</option>
                <option value="0">convert</option>
              </select>
            </td>
          )}
          <td className="mod-head">
            <select
              className={classNames('form-control input-sm', {
                active: searchKey[FIELDS.DT] !== emptySearchKey[FIELDS.DT],
              })}
              onChange={e => this.onChange(FIELDS.DT, e)}
              value={searchKey[FIELDS.DT]}
            >
              <option>any</option>
              <option>yes</option>
              <option>no</option>
              <option>ht</option>
            </select>
          </td>
          <td className="mod-head">
            <select
              id="hd"
              className={classNames('form-control input-sm', {
                active: searchKey[FIELDS.HD] !== emptySearchKey[FIELDS.HD],
              })}
              onChange={e => this.onChange(FIELDS.HD, e)}
              value={searchKey[FIELDS.HD]}
            >
              <option>any</option>
              <option>yes</option>
              <option>no</option>
            </select>
          </td>
          <td className="mod-head">
            <select
              id="hr"
              className={classNames('form-control input-sm', {
                active: searchKey[FIELDS.HR] !== emptySearchKey[FIELDS.HR],
              })}
              onChange={e => this.onChange(FIELDS.HR, e)}
              value={searchKey[FIELDS.HR]}
            >
              <option>any</option>
              <option>yes</option>
              <option>no</option>
            </select>
          </td>
          <td className="mod-head">
            <select
              id="fl"
              className={classNames('form-control input-sm', {
                active: searchKey[FIELDS.FL] !== emptySearchKey[FIELDS.FL],
              })}
              onChange={e => this.onChange(FIELDS.FL, e)}
              value={searchKey[FIELDS.FL]}
            >
              <option>any</option>
              <option>yes</option>
              <option>no</option>
            </select>
          </td>
          <td className="length-head">
            <div
              className={classNames('form-control time-pick', {
                /* eslint-disable eqeqeq */
                // Need this because these can be strings and numbers
                active:
                  searchKey[FIELDS.MIN_M_LEN] != emptySearchKey[FIELDS.MIN_M_LEN] ||
                  searchKey[FIELDS.MIN_S_LEN] != emptySearchKey[FIELDS.MIN_S_LEN],
                /* eslint-enable eqeqeq */
              })}
            >
              <input
                className="minute"
                onBlur={() => {
                  const numValue = searchKey[FIELDS.MIN_M_LEN];
                  const value = numValue === '' ? 0 : Math.max(Math.min(99, numValue), 0);
                  this.onChangeExact(FIELDS.MIN_M_LEN, value);
                }}
                onChange={e => this.onChangeNumber(FIELDS.MIN_M_LEN, e)}
                value={searchKey[FIELDS.MIN_M_LEN]}
                type="number"
              />
              <div>:</div>
              <input
                className="second"
                onBlur={() => {
                  const numValue = searchKey[FIELDS.MIN_S_LEN];
                  const value = numValue === '' ? 0 : Math.max(Math.min(59, numValue), 0);
                  this.onChangeExact(FIELDS.MIN_S_LEN, ('00' + value).slice(-2));
                }}
                onChange={e => this.onChangeNumber(FIELDS.MIN_S_LEN, e)}
                value={searchKey[FIELDS.MIN_S_LEN]}
                type="number"
              />
            </div>
            <div
              className={classNames('form-control time-pick', {
                /* eslint-disable eqeqeq */
                // Need this because these can be strings and numbers
                active:
                  searchKey[FIELDS.MAX_M_LEN] != emptySearchKey[FIELDS.MAX_M_LEN] ||
                  searchKey[FIELDS.MAX_S_LEN] != emptySearchKey[FIELDS.MAX_S_LEN],
                /* eslint-enable eqeqeq */
              })}
            >
              <input
                className="minute"
                onBlur={() => {
                  const numValue = searchKey[FIELDS.MAX_M_LEN];
                  const value = numValue === '' ? 99 : Math.max(Math.min(99, numValue), 0);
                  this.onChangeExact(FIELDS.MAX_M_LEN, value);
                }}
                onChange={e => this.onChangeNumber(FIELDS.MAX_M_LEN, e)}
                value={searchKey[FIELDS.MAX_M_LEN]}
                type="number"
              />
              <div>:</div>
              <input
                className="second"
                onBlur={() => {
                  const numValue = searchKey[FIELDS.MAX_S_LEN];
                  const value = numValue === '' ? 59 : Math.max(Math.min(59, numValue), 0);
                  this.onChangeExact(FIELDS.MAX_S_LEN, ('00' + value).slice(-2));
                }}
                onChange={e => this.onChangeNumber(FIELDS.MAX_S_LEN, e)}
                value={searchKey[FIELDS.MAX_S_LEN]}
                type="number"
              />
            </div>
          </td>
          <td className="min-max-head">
            <input
              className={classNames('form-control pp-input input-sm', {
                active: searchKey[FIELDS.BPM_MIN] !== emptySearchKey[FIELDS.BPM_MIN],
              })}
              onChange={e => this.onChangeNumber(FIELDS.BPM_MIN, e)}
              value={searchKey[FIELDS.BPM_MIN]}
              type="number"
              placeholder="min"
            />
            <input
              className={classNames('form-control pp-input input-sm', {
                active: searchKey[FIELDS.BPM_MAX] !== emptySearchKey[FIELDS.BPM_MAX],
              })}
              onChange={e => this.onChangeNumber(FIELDS.BPM_MAX, e)}
              value={searchKey[FIELDS.BPM_MAX]}
              type="number"
              placeholder="max"
            />
          </td>
          <td className="min-max-head">
            <input
              className={classNames('form-control pp-input input-sm', {
                active: searchKey[FIELDS.DIFF_MIN] !== emptySearchKey[FIELDS.DIFF_MIN],
              })}
              onChange={e => this.onChangeNumber(FIELDS.DIFF_MIN, e)}
              value={searchKey[FIELDS.DIFF_MIN]}
              type="number"
              placeholder="min"
            />
            <input
              className={classNames('form-control pp-input input-sm', {
                active: searchKey[FIELDS.DIFF_MAX] !== emptySearchKey[FIELDS.DIFF_MAX],
              })}
              onChange={e => this.onChangeNumber(FIELDS.DIFF_MAX, e)}
              value={searchKey[FIELDS.DIFF_MAX]}
              type="number"
              placeholder="max"
            />
          </td>
          <td className="ow-head with-buttons">
            <button
              type="button"
              className="btn btn-sm btn-primary apply"
              onClick={() => this.props.recalculateVisibleData(mode)}
            >
              {'>'} apply
            </button>
            <button
              type="button"
              className="btn btn-sm btn-reset"
              onClick={() => {
                if (window.confirm('Reset all filters?')) {
                  this.props.resetSearchKey(mode);
                }
              }}
            >
              reset
            </button>
          </td>
        </tr>
        {this.state.expandedView && (
          <tr>
            <td />
            <td colSpan="10">
              <div style={{ display: 'flex', flexFlow: 'row nowrap' }}>
                <Select
                  closeMenuOnSelect={false}
                  className="select genre"
                  classNamePrefix="select"
                  placeholder="genre (empty = any genre)"
                  isMulti
                  options={genreOptions}
                  value={searchKey[FIELDS.GENRE]}
                  onChange={value => this.onChangeMulti(FIELDS.GENRE, value)}
                />
                <Select
                  closeMenuOnSelect={false}
                  className="select"
                  classNamePrefix="select"
                  placeholder="language (empty = any language)"
                  isMulti
                  options={languageOptions}
                  value={searchKey[FIELDS.LANG]}
                  onChange={value => this.onChangeMulti(FIELDS.LANG, value)}
                />
                <Select
                  isClearable
                  className="select"
                  classNamePrefix="select"
                  placeholder="when song was ranked"
                  options={rankedDateOptions}
                  value={rankedDateOptions.find(opt => opt.value === searchKey[FIELDS.RANKED_DATE])}
                  onChange={option =>
                    this.onChangeExact(FIELDS.RANKED_DATE, option ? option.value : null)
                  }
                />
              </div>
            </td>
          </tr>
        )}
        <tr>
          <th />
          <th>map link</th>
          <th className="text-center">pp</th>
          {isMania && <th className="text-center">keys</th>}
          <th className="text-center">dt</th>
          <th className="text-center">hd</th>
          <th className="text-center">hr</th>
          <th className="text-center">fl</th>
          <th className="text-center">length</th>
          <th className="text-center">bpm</th>
          <th className="text-center">difficulty</th>
          <th className="text-center ow-head">
            <div>overweightness</div>
            <select
              onChange={e => this.onChange(FIELDS.MODE, e)}
              value={searchKey[FIELDS.MODE]}
              className="form-control input-sm"
            >
              <option value="total">total</option>
              <option value="adjusted">adjusted</option>
            </select>
          </th>
        </tr>
      </thead>
    );
  }

  renderBody() {
    const { visibleData, searchKey, overweightnessCoefficient, mode, lastUpdatedDate } = this.props;

    return (
      <TableBody
        isMania={mode === modes.mania.text}
        expandedView={this.state.expandedView}
        data={visibleData}
        overweightnessMode={searchKey[FIELDS.MODE]}
        overweightnessCoefficient={overweightnessCoefficient}
        lastUpdatedDate={lastUpdatedDate}
      />
    );
  }

  renderMobileFilters() {
    const { searchKey, mode } = this.props;
    const isMania = mode === modes.mania.text;
    return (
      <div className="mobile-filters-inside">
        <div className="top-filter">
          <div className="song-search">
            <span>song name:</span>
            <div className="form-group search-control">
              <input
                onChange={e => this.onChange(FIELDS.TEXT, e)}
                value={searchKey[FIELDS.TEXT]}
                type="text"
                className={classNames('form-control input-sm', {
                  active: searchKey[FIELDS.TEXT] !== emptySearchKey[FIELDS.TEXT],
                })}
                placeholder="search..."
              />
            </div>
          </div>
        </div>
        <div className="flexible-filters">
          <div className="filter-block">
            <div className="head-text">pp</div>
            <div className="inputs">
              <input
                onChange={e => this.onChangeNumber(FIELDS.PP_MIN, e)}
                value={searchKey[FIELDS.PP_MIN]}
                type="number"
                className={classNames('form-control pp-input input-sm', {
                  active: searchKey[FIELDS.PP_MIN] !== emptySearchKey[FIELDS.PP_MIN],
                })}
                placeholder="min"
              />
              <input
                onChange={e => this.onChangeNumber(FIELDS.PP_MAX, e)}
                value={searchKey[FIELDS.PP_MAX]}
                type="number"
                className={classNames('form-control pp-input input-sm', {
                  active: searchKey[FIELDS.PP_MAX] !== emptySearchKey[FIELDS.PP_MAX],
                })}
                placeholder="max"
              />
            </div>
          </div>
          <div className="filter-block">
            <div className="head-text">length</div>
            <div className="inputs">
              <div
                className={classNames('form-control time-pick', {
                  /* eslint-disable eqeqeq */
                  // Need this because these can be strings and numbers
                  active:
                    searchKey[FIELDS.MIN_M_LEN] != emptySearchKey[FIELDS.MIN_M_LEN] ||
                    searchKey[FIELDS.MIN_S_LEN] != emptySearchKey[FIELDS.MIN_S_LEN],
                  /* eslint-enable eqeqeq */
                })}
              >
                <input
                  className="minute"
                  onBlur={() => {
                    const numValue = searchKey[FIELDS.MIN_M_LEN];
                    const value = numValue === '' ? 0 : Math.max(Math.min(99, numValue), 0);
                    this.onChangeExact(FIELDS.MIN_M_LEN, value);
                  }}
                  onChange={e => this.onChangeNumber(FIELDS.MIN_M_LEN, e)}
                  value={searchKey[FIELDS.MIN_M_LEN]}
                  type="number"
                />
                <div>:</div>
                <input
                  className="second"
                  onBlur={() => {
                    const numValue = searchKey[FIELDS.MIN_S_LEN];
                    const value = numValue === '' ? 0 : Math.max(Math.min(59, numValue), 0);
                    this.onChangeExact(FIELDS.MIN_S_LEN, ('00' + value).slice(-2));
                  }}
                  onChange={e => this.onChangeNumber(FIELDS.MIN_S_LEN, e)}
                  value={searchKey[FIELDS.MIN_S_LEN]}
                  type="number"
                />
              </div>
              <div
                className={classNames('form-control time-pick', {
                  /* eslint-disable eqeqeq */
                  // Need this because these can be strings and numbers
                  active:
                    searchKey[FIELDS.MAX_M_LEN] != emptySearchKey[FIELDS.MAX_M_LEN] ||
                    searchKey[FIELDS.MAX_S_LEN] != emptySearchKey[FIELDS.MAX_S_LEN],
                  /* eslint-enable eqeqeq */
                })}
              >
                <input
                  className="minute"
                  onBlur={() => {
                    const numValue = searchKey[FIELDS.MAX_M_LEN];
                    const value = numValue === '' ? 99 : Math.max(Math.min(99, numValue), 0);
                    this.onChangeExact(FIELDS.MAX_M_LEN, value);
                  }}
                  onChange={e => this.onChangeNumber(FIELDS.MAX_M_LEN, e)}
                  value={searchKey[FIELDS.MAX_M_LEN]}
                  type="number"
                />
                <div>:</div>
                <input
                  className="second"
                  onBlur={() => {
                    const numValue = searchKey[FIELDS.MAX_S_LEN];
                    const value = numValue === '' ? 59 : Math.max(Math.min(59, numValue), 0);
                    this.onChangeExact(FIELDS.MAX_S_LEN, ('00' + value).slice(-2));
                  }}
                  onChange={e => this.onChangeNumber(FIELDS.MAX_S_LEN, e)}
                  value={searchKey[FIELDS.MAX_S_LEN]}
                  type="number"
                />
              </div>
            </div>
          </div>
          <div className="filter-block">
            <div className="head-text">bpm</div>
            <div className="inputs">
              <input
                className={classNames('form-control pp-input input-sm', {
                  active: searchKey[FIELDS.BPM_MIN] !== emptySearchKey[FIELDS.BPM_MIN],
                })}
                onChange={e => this.onChangeNumber(FIELDS.BPM_MIN, e)}
                value={searchKey[FIELDS.BPM_MIN]}
                type="number"
                placeholder="min"
              />
              <input
                className={classNames('form-control pp-input input-sm', {
                  active: searchKey[FIELDS.BPM_MAX] !== emptySearchKey[FIELDS.BPM_MAX],
                })}
                onChange={e => this.onChangeNumber(FIELDS.BPM_MAX, e)}
                value={searchKey[FIELDS.BPM_MAX]}
                type="number"
                placeholder="max"
              />
            </div>
          </div>
          <div className="filter-block">
            <div className="head-text">difficulty</div>
            <div className="inputs">
              <input
                className={classNames('form-control pp-input input-sm', {
                  active: searchKey[FIELDS.DIFF_MIN] !== emptySearchKey[FIELDS.DIFF_MIN],
                })}
                onChange={e => this.onChangeNumber(FIELDS.DIFF_MIN, e)}
                value={searchKey[FIELDS.DIFF_MIN]}
                type="number"
                placeholder="min"
              />
              <input
                className={classNames('form-control pp-input input-sm', {
                  active: searchKey[FIELDS.DIFF_MAX] !== emptySearchKey[FIELDS.DIFF_MAX],
                })}
                onChange={e => this.onChangeNumber(FIELDS.DIFF_MAX, e)}
                value={searchKey[FIELDS.DIFF_MAX]}
                type="number"
                placeholder="max"
              />
            </div>
          </div>
        </div>
        <div className="flexible-filters">
          {isMania && (
            <div className="filter-block">
              <div className="head-text">keys</div>
              <div className="select">
                <select
                  className={classNames('form-control input-sm', {
                    active: searchKey[FIELDS.MANIA_K] !== emptySearchKey[FIELDS.MANIA_K],
                  })}
                  onChange={e => this.onChangeNumber(FIELDS.MANIA_K, e)}
                  value={searchKey[FIELDS.MANIA_K]}
                >
                  <option value="-1">any</option>
                  <option value="4">4k</option>
                  <option value="5">5k</option>
                  <option value="6">6k</option>
                  <option value="7">7k</option>
                  <option value="0">convert</option>
                </select>
              </div>
            </div>
          )}
          <div className="filter-block">
            <div className="head-text">DT</div>
            <div className="select">
              <select
                className={classNames('form-control input-sm', {
                  active: searchKey[FIELDS.DT] !== emptySearchKey[FIELDS.DT],
                })}
                onChange={e => this.onChange(FIELDS.DT, e)}
                value={searchKey[FIELDS.DT]}
              >
                <option>any</option>
                <option>yes</option>
                <option>no</option>
                <option value="ht">HT</option>
              </select>
            </div>
          </div>
          <div className="filter-block">
            <div className="head-text">HD</div>
            <div className="select">
              <select
                id="hd"
                className={classNames('form-control input-sm', {
                  active: searchKey[FIELDS.HD] !== emptySearchKey[FIELDS.HD],
                })}
                onChange={e => this.onChange(FIELDS.HD, e)}
                value={searchKey[FIELDS.HD]}
              >
                <option>any</option>
                <option>yes</option>
                <option>no</option>
              </select>
            </div>
          </div>
          <div className="filter-block">
            <div className="head-text">HR</div>
            <div className="select">
              <select
                id="hr"
                className={classNames('form-control input-sm', {
                  active: searchKey[FIELDS.HR] !== emptySearchKey[FIELDS.HR],
                })}
                onChange={e => this.onChange(FIELDS.HR, e)}
                value={searchKey[FIELDS.HR]}
              >
                <option>any</option>
                <option>yes</option>
                <option>no</option>
              </select>
            </div>
          </div>
          <div className="filter-block">
            <div className="head-text">FL</div>
            <div className="select">
              <select
                id="fl"
                className={classNames('form-control input-sm', {
                  active: searchKey[FIELDS.FL] !== emptySearchKey[FIELDS.FL],
                })}
                onChange={e => this.onChange(FIELDS.FL, e)}
                value={searchKey[FIELDS.FL]}
              >
                <option>any</option>
                <option>yes</option>
                <option>no</option>
              </select>
            </div>
          </div>
        </div>
        {this.state.expandedView && (
          <div className="expanded-filter">
            <Select
              closeMenuOnSelect={false}
              className="select genre"
              classNamePrefix="select"
              placeholder="genre (empty = any genre)"
              isMulti
              options={genreOptions}
              value={searchKey[FIELDS.GENRE]}
              onChange={value => this.onChangeMulti(FIELDS.GENRE, value)}
            />
            <Select
              closeMenuOnSelect={false}
              className="select"
              classNamePrefix="select"
              placeholder="language (empty = any language)"
              isMulti
              options={languageOptions}
              value={searchKey[FIELDS.LANG]}
              onChange={value => this.onChangeMulti(FIELDS.LANG, value)}
            />
            <Select
              className="select"
              classNamePrefix="select"
              placeholder="when song was ranked"
              options={rankedDateOptions}
              value={rankedDateOptions.find(opt => opt.value === searchKey[FIELDS.RANKED_DATE])}
              onChange={option => this.onChangeExact(FIELDS.RANKED_DATE, option.value)}
            />
          </div>
        )}
        <div className="bottom-filter">
          <button type="button" className="btn btn-sm btn-primary" onClick={this.toggleExpandView}>
            {this.state.expandedView ? 'less' : 'more'}
          </button>
          <div className="spacer" />
          <button
            type="button"
            className="btn btn-sm btn-reset"
            onClick={() => {
              if (window.confirm('Reset all filters?')) {
                this.props.resetSearchKey(mode);
              }
            }}
          >
            reset
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary apply"
            onClick={() => this.props.recalculateVisibleData(mode)}
          >
            {'>'} apply
          </button>
        </div>
      </div>
    );
  }

  renderTable() {
    if (isMobile) {
      const {
        visibleData,
        searchKey,
        overweightnessCoefficient,
        mode,
        lastUpdatedDate,
      } = this.props;
      const isMania = mode === modes.mania.text;
      let count = 0;
      Object.keys(searchKey).forEach(key => {
        if (Array.isArray(searchKey[key])) {
          if (searchKey[key].length) count++;
          // eslint-disable-next-line eqeqeq
        } else if (searchKey[key] != emptySearchKey[key]) {
          count++;
        }
      });
      return (
        <>
          <div className="mobile-filters">
            <CollapsibleBar title={`filters ${count ? `(${count})` : ''}`}>
              {this.renderMobileFilters()}
            </CollapsibleBar>
          </div>
          <div className="cards-view">
            {visibleData.map(item => (
              <Card
                key={`${item.b}_${item.m}`}
                item={item}
                overweightnessCoefficient={overweightnessCoefficient}
                overweightnessMode={searchKey[FIELDS.MODE]}
                isMania={isMania}
                expandedView={this.state.expandedView}
                lastUpdatedDate={lastUpdatedDate}
              />
            ))}
          </div>
        </>
      );
    }

    return (
      <table className="table">
        {this.renderHead()}
        {this.renderBody()}
      </table>
    );
  }

  renderFooter() {
    const { isShowMoreVisible, isLoading, visibleItemsCount, mode } = this.props;

    if (isLoading && visibleItemsCount === 0) {
      return <div className="loading">loading...</div>;
    }

    return (
      isShowMoreVisible && (
        <div className="show-more-div" onClick={() => this.props.showMore(mode)}>
          <button className="btn btn-success show-more-btn">show more</button>
        </div>
      )
    );
  }

  render() {
    return (
      <>
        {this.renderTable()}
        {this.renderFooter()}
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Table);
