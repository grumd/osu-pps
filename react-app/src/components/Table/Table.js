import React, { PureComponent } from 'react';
import toBe from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import classNames from 'classnames';
import Select from 'react-select';

import {
  fetchMapsData,
  updateSearchKey,
  showMore,
  recalculateVisibleData,
  emptySearchKey,
} from 'reducers/mapsData';

import { FIELDS, languageOptions, languageMap, genreOptions, genreMap } from 'constants/mapsData';
import { COOKIE_SEARCH_KEY, modes } from 'constants/common';

import { overweightnessCalcFromMode } from 'utils/overweightness';

import './table.scss';

function truncateFloat(number) {
  return Math.round(number * 100) / 100;
}
function secondsToFormatted(length) {
  return `${Math.floor(length / 60)}:${('0' + (length % 60)).slice(-2)}`;
}

const okGlyph = <span className="glyphicon glyphicon-ok" />;
const htGlyph = <span className="glyphicon glyphicon-time" />;

const dataSelector = (state, props) => state.mapsData.dataByMode[props.match.params.mode];

const coefficientSelector = createSelector(
  [dataSelector, state => state.mapsData.searchKey[FIELDS.MODE]],
  (data, mode) => {
    const calc = overweightnessCalcFromMode[mode];
    const maxOverweightness = data.reduce((max, item) => {
      const current = calc(item);
      return current > max ? current : max;
    }, 0);
    return 10000 / maxOverweightness;
  }
);

const mapStateToProps = (state, props) => {
  return {
    hasData: !!dataSelector(state, props).length,
    visibleData: state.mapsData.visibleData,
    isShowMoreVisible: state.mapsData.visibleItemsCount < state.mapsData.filteredData.length,
    visibleItemsCount: state.mapsData.visibleItemsCount,
    searchKey: state.mapsData.searchKey,
    isLoading: state.mapsData.isLoading[props.match.params.mode],
    overweightnessCoefficient: coefficientSelector(state, props),
  };
};

const mapDispatchToProps = {
  updateSearchKey,
  showMore,
  recalculateVisibleData,
  fetchMapsData,
};

class TableBody extends PureComponent {
  static propTypes = {
    data: toBe.array.isRequired,
    overweightnessMode: toBe.string.isRequired,
    overweightnessCoefficient: toBe.number.isRequired,
    expandedView: toBe.bool,
  };

  render() {
    const { data, overweightnessMode, overweightnessCoefficient: coef, expandedView } = this.props;

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
                <img src={`https://b.ppy.sh/thumb/${item.s}.jpg`} alt="background" />
              </td>
              <td>
                <div>
                  <a href={mapLink}>{linkText}</a>
                </div>
                {expandedView && (
                  <div className="genre-language">
                    <span className="grey-title">language:</span>
                    <span> {languageMap[item.ln]}, </span>
                    <span className="grey-title">genre:</span>
                    <span> {genreMap[item.g]}</span>
                  </div>
                )}
              </td>
              <td className="text-center">{(+item.pp99).toFixed(0)}</td>
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
    console.log(props.searchKey);
    this.state = {
      expandedView: !!props.searchKey[FIELDS.GENRE].length || !!props.searchKey[FIELDS.LANG].length,
    };
  }

  componentDidMount() {
    const { isLoading, hasData, match } = this.props;
    if (!isLoading && !hasData) {
      this.props.fetchMapsData(match.params.mode);
    }
  }

  componentDidUpdate(prevProps) {
    const { match, isLoading, hasData } = this.props;
    if (!hasData && !isLoading) {
      this.props.fetchMapsData(match.params.mode);
    }
    if (prevProps.match.params.mode !== match.params.mode) {
      this.props.recalculateVisibleData(match.params.mode);
    }
  }

  onChangeExact(key, value) {
    document.cookie = `${COOKIE_SEARCH_KEY}${key}=${value}; path=/`;
    this.props.updateSearchKey(key, value);
  }

  onChangeMulti(key, array) {
    const cookieValue = array.map(option => option.value).join(',');
    document.cookie = `${COOKIE_SEARCH_KEY}${key}=${cookieValue}; path=/`;
    this.props.updateSearchKey(key, array);
  }

  onChange(key, e) {
    const value = e.target.value;
    document.cookie = `${COOKIE_SEARCH_KEY}${key}=${value}; path=/`;

    this.props.updateSearchKey(key, value);
  }

  onChangeNumber(key, e, trailZeros = false) {
    const value = e.target.value === '' ? null : parseFloat(e.target.value);
    document.cookie = `${COOKIE_SEARCH_KEY}${key}=${e.target.value}; path=/`;

    this.props.updateSearchKey(key, value);
  }

  toggleExpandView = () => {
    this.setState(state => ({ expandedView: !state.expandedView }));
  };

  renderHead() {
    const { searchKey, match } = this.props;
    const isMania = match.params.mode === modes.mania.text;

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
                  const value = Math.max(Math.min(99, numValue), 0);
                  this.onChangeExact(FIELDS.MIN_M_LEN, value);
                }}
                onChange={e => this.onChangeNumber(FIELDS.MIN_M_LEN, e)}
                value={searchKey[FIELDS.MIN_M_LEN]}
                type="number"
                max="99"
                min="0"
              />
              <div>:</div>
              <input
                className="second"
                onBlur={() => {
                  const numValue = searchKey[FIELDS.MIN_S_LEN];
                  const value = Math.max(Math.min(59, numValue), 0);
                  this.onChangeExact(FIELDS.MIN_S_LEN, ('00' + value).slice(-2));
                }}
                onChange={e => this.onChangeNumber(FIELDS.MIN_S_LEN, e)}
                value={searchKey[FIELDS.MIN_S_LEN]}
                type="number"
                max="59"
                min="0"
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
                  const value = Math.max(Math.min(99, numValue), 0);
                  this.onChangeExact(FIELDS.MAX_M_LEN, value);
                }}
                onChange={e => this.onChangeNumber(FIELDS.MAX_M_LEN, e)}
                value={searchKey[FIELDS.MAX_M_LEN]}
                type="number"
                max="99"
                min="0"
              />
              <div>:</div>
              <input
                className="second"
                onBlur={() => {
                  const numValue = searchKey[FIELDS.MAX_S_LEN];
                  const value = Math.max(Math.min(59, numValue), 0);
                  this.onChangeExact(FIELDS.MAX_S_LEN, ('00' + value).slice(-2));
                }}
                onChange={e => this.onChangeNumber(FIELDS.MAX_S_LEN, e)}
                value={searchKey[FIELDS.MAX_S_LEN]}
                type="number"
                max="59"
                min="0"
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
          <td className="ow-head">
            <button
              type="button"
              className="btn btn-sm btn-primary apply"
              onClick={() => this.props.recalculateVisibleData(match.params.mode)}
            >
              > apply filters
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
              </div>
            </td>
          </tr>
        )}
        <tr>
          <th />
          <th>map link</th>
          <th className="text-center">pp</th>
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
    const { visibleData, searchKey, overweightnessCoefficient } = this.props;

    return (
      <TableBody
        expandedView={this.state.expandedView}
        data={visibleData}
        overweightnessMode={searchKey[FIELDS.MODE]}
        overweightnessCoefficient={overweightnessCoefficient}
      />
    );
  }

  renderTable() {
    return (
      <table className="table">
        {this.renderHead()}
        {this.renderBody()}
      </table>
    );
  }

  renderFooter() {
    const { isShowMoreVisible, isLoading, visibleItemsCount } = this.props;

    if (isLoading && visibleItemsCount === 0) {
      return <div className="loading">loading...</div>;
    }

    return (
      isShowMoreVisible && (
        <div className="show-more-div" onClick={this.props.showMore}>
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Table);
