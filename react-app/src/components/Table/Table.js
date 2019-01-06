import React, { PureComponent } from 'react';
import toBe from 'prop-types';
import { connect } from 'react-redux';

import { updateSearchKey, showMore, recalculateVisibleData } from 'reducers/mapsData';

import { FIELDS } from 'constants/mapsData';
import { COOKIE_SEARCH_KEY } from 'constants/common';

import './table.scss';

function truncateFloat(number) {
  return Math.round(number * 100) / 100;
}
function secondsToFormatted(length) {
  return `${Math.floor(length / 60)}:${('0' + (length % 60)).slice(-2)}`;
}

const okGlyph = <span className="glyphicon glyphicon-ok" />;
const htGlyph = <span className="glyphicon glyphicon-time" />;

const mapStateToProps = state => {
  console.log(state.mapsData);
  return {
    visibleData: state.mapsData.visibleData,
    fullDataLength: state.mapsData.data.length,
    visibleItemsCount: state.mapsData.visibleItemsCount,
    searchKey: state.mapsData.searchKey,
    isLoading: state.mapsData.isLoading,
  };
};

const mapDispatchToProps = {
  updateSearchKey,
  showMore,
  recalculateVisibleData,
};

class TableBody extends PureComponent {
  static propTypes = {
    data: toBe.array.isRequired,
    overweightnessMode: toBe.string.isRequired,
  };

  render() {
    const { data, overweightnessMode } = this.props;
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

          const overweightnessValue = {
            age: ((+item.x / +item.h) * 20000).toFixed(0),
            total: (+item.x).toFixed(0),
            playcount: ((+item.x / +item.p) * 300000).toFixed(0),
          }[overweightnessMode];

          return (
            <tr key={`${item.b}_${item.m}`}>
              <td className="img-td">
                <img src={`https://b.ppy.sh/thumb/${item.s}.jpg`} alt="background" />
              </td>
              <td>
                <a href={mapLink}>{linkText}</a>
              </td>
              <td className="text-center">{(+item.pp99).toFixed(0)}</td>
              <td className="text-center">{mods.ht ? htGlyph : mods.dt ? okGlyph : null}</td>
              <td className="text-center">{mods.hd ? okGlyph : null}</td>
              <td className="text-center">{mods.hr ? okGlyph : null}</td>
              <td className="text-center">{mods.fl ? okGlyph : null}</td>
              <td className="text-center">{secondsToFormatted(item.l)}</td>
              <td className="text-center">{bpm}</td>
              <td className="text-center">{item.d}</td>
              <td className="text-center">{overweightnessValue}</td>
            </tr>
          );
        })}
      </tbody>
    );
  }
}

class Table extends PureComponent {
  static propTypes = {
    fullDataLength: toBe.number.isRequired,
    visibleData: toBe.array.isRequired,
    visibleItemsCount: toBe.number.isRequired,
    searchKey: toBe.object.isRequired,
    isLoading: toBe.bool.isRequired,
    updateSearchKey: toBe.func.isRequired,
    showMore: toBe.func.isRequired,
    recalculateVisibleData: toBe.func.isRequired,
  };

  onChange(key, e) {
    const value = e.target.value;
    document.cookie = `${COOKIE_SEARCH_KEY}${key}=${value}; path=/`;

    this.props.updateSearchKey(key, value);
  }

  onChangeNumber(key, e) {
    const value = e.target.value === '' ? null : parseFloat(e.target.value);
    document.cookie = `${COOKIE_SEARCH_KEY}${key}=${e.target.value}; path=/`;

    this.props.updateSearchKey(key, value);
  }

  renderHead() {
    const { isLoading, searchKey } = this.props;
    return (
      <thead>
        <tr>
          <td className="img-td" />
          <td>
            <div className="form-group search-control">
              <input
                onChange={e => this.onChange(FIELDS.TEXT, e)}
                value={searchKey[FIELDS.TEXT]}
                type="text"
                className="form-control input-sm"
                placeholder="search..."
              />
            </div>
          </td>
          <td className="min-max-head">
            <input
              onChange={e => this.onChangeNumber(FIELDS.PP_MIN, e)}
              value={searchKey[FIELDS.PP_MIN]}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="min"
            />
            <input
              onChange={e => this.onChangeNumber(FIELDS.PP_MAX, e)}
              value={searchKey[FIELDS.PP_MAX]}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="max"
            />
          </td>
          <td className="mod-head">
            <select
              className="form-control input-sm"
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
              className="form-control input-sm"
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
              className="form-control input-sm"
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
              className="form-control input-sm"
              onChange={e => this.onChange(FIELDS.FL, e)}
              value={searchKey[FIELDS.FL]}
            >
              <option>any</option>
              <option>yes</option>
              <option>no</option>
            </select>
          </td>
          <td className="length-head">
            <div className="form-control time-pick">
              <input
                onChange={e => this.onChangeNumber(FIELDS.MIN_M_LEN, e)}
                value={searchKey[FIELDS.MIN_M_LEN]}
                className="minute"
                type="number"
                max="99"
                min="0"
              />
              <div>:</div>
              <input
                onChange={e => this.onChangeNumber(FIELDS.MIN_S_LEN, e)}
                value={searchKey[FIELDS.MIN_S_LEN]}
                className="second"
                type="number"
                max="59"
                min="0"
              />
            </div>
            <div className="form-control time-pick">
              <input
                onChange={e => this.onChangeNumber(FIELDS.MAX_M_LEN, e)}
                value={searchKey[FIELDS.MAX_M_LEN]}
                className="minute"
                type="number"
                max="99"
                min="0"
              />
              <div>:</div>
              <input
                onChange={e => this.onChangeNumber(FIELDS.MAX_S_LEN, e)}
                value={searchKey[FIELDS.MAX_S_LEN]}
                className="second"
                type="number"
                max="59"
                min="0"
              />
            </div>
          </td>
          <td className="min-max-head">
            <input
              onChange={e => this.onChangeNumber(FIELDS.BPM_MIN, e)}
              value={searchKey[FIELDS.BPM_MIN]}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="min"
            />
            <input
              onChange={e => this.onChangeNumber(FIELDS.BPM_MAX, e)}
              value={searchKey[FIELDS.BPM_MAX]}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="max"
            />
          </td>
          <td className="min-max-head">
            <input
              onChange={e => this.onChangeNumber(FIELDS.DIFF_MIN, e)}
              value={searchKey[FIELDS.DIFF_MIN]}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="min"
            />
            <input
              onChange={e => this.onChangeNumber(FIELDS.DIFF_MAX, e)}
              value={searchKey[FIELDS.DIFF_MAX]}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="max"
            />
          </td>
          <td className="ow-head">
            <button
              type="button"
              className="btn btn-sm btn-primary apply"
              disabled={isLoading}
              onClick={this.props.recalculateVisibleData}
            >
              > apply filters
            </button>
          </td>
        </tr>
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
              <option value="age">/ map's age</option>
              <option value="playcount">/ map's playcount</option>
            </select>
          </th>
        </tr>
      </thead>
    );
  }

  renderBody() {
    const { visibleData, searchKey } = this.props;

    return <TableBody data={visibleData} overweightnessMode={searchKey[FIELDS.MODE]} />;
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
    const { fullDataLength, isLoading, visibleItemsCount } = this.props;

    if (isLoading) {
      return <div className="loading">loading...</div>;
    }

    return (
      visibleItemsCount < fullDataLength && (
        <div className="show-more-div" onClick={this.props.showMore}>
          <button className="btn btn-success show-more-btn">show more</button>
        </div>
      )
    );
  }

  render() {
    console.log(this.props);
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
