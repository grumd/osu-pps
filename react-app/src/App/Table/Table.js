import React, { Component, PureComponent } from "react";
import toBe from "prop-types";

import "./table.scss";
// import data from "../data.json";

function truncateFloat(number) {
  return Math.round(number * 100) / 100;
}
function secondsToFormatted(length) {
  return `${Math.floor(length / 60)}:${("0" + (length % 60)).slice(-2)}`;
}
function formattedToSeconds(minutes, seconds) {
  return minutes * 60 + seconds;
}
function modAllowed(selectValue, hasMod) {
  return (
    !["yes", "no"].includes(selectValue) ||
    (selectValue === "yes" && hasMod) ||
    (selectValue === "no" && !hasMod)
  );
}
function matchesMaxMin(value, min, max) {
  return (min === null || value >= min) && (max === null || value <= max);
}

const okGlyph = <span className="glyphicon glyphicon-ok" />;
const htGlyph = <span className="glyphicon glyphicon-time" />;

const FIELDS = {
  TEXT: "text",
  PP_MIN: "ppmin",
  PP_MAX: "ppmax",
  LEN_MIN: "lenmin",
  LEN_MAX: "lenmax",
  BPM_MIN: "bpmmin",
  BPM_MAX: "bpmmax",
  DIFF_MIN: "diffmin",
  DIFF_MAX: "diffmax",
  DT: "dt",
  HD: "hd",
  HR: "hr",
  HT: "ht",
  MODE: "mode"
};

class TableBody extends PureComponent {
  static propTypes = {
    data: toBe.array.isRequired,
    overweightnessMode: toBe.string.isRequired
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
            ht: (item.m & 256) === 256
          };
          var mapLink = `http://osu.ppy.sh/b/${item.b}`;
          var linkText = item.art
            ? `${item.art} - ${item.t} [${item.v}]`
            : mapLink;

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
            playcount: ((+item.x / +item.p) * 300000).toFixed(0)
          }[overweightnessMode];

          return (
            <tr key={`${item.b}_${item.m}`}>
              <td className="img-td">
                <img
                  src={`https://b.ppy.sh/thumb/${item.s}.jpg`}
                  alt="background"
                />
              </td>
              <td>
                <a href={mapLink}>{linkText}</a>
              </td>
              <td className="text-center">{(+item.pp99).toFixed(0)}</td>
              <td className="text-center">
                {mods.ht ? htGlyph : mods.dt ? okGlyph : null}
              </td>
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

export default class Table extends Component {
  constructor() {
    super();

    this.minLenRefs = {
      minute: React.createRef(),
      second: React.createRef()
    };
    this.maxLenRefs = {
      minute: React.createRef(),
      second: React.createRef()
    };

    this.state = {
      data: [],
      visibleData: [],
      isLoading: true,
      searchKey: {
        [FIELDS.TEXT]: "",
        [FIELDS.PP_MIN]: null,
        [FIELDS.PP_MAX]: null,
        [FIELDS.LEN_MIN]: null,
        [FIELDS.LEN_MAX]: null,
        [FIELDS.BPM_MIN]: null,
        [FIELDS.BPM_MAX]: null,
        [FIELDS.DIFF_MIN]: null,
        [FIELDS.DIFF_MAX]: null,
        [FIELDS.DT]: "any",
        [FIELDS.HD]: "any",
        [FIELDS.HR]: "any",
        [FIELDS.HT]: "any",
        [FIELDS.MODE]: "age"
      },
      visibleItemsCount: 20
    };
    this.onShowMore = this.onShowMore.bind(this);
  }

  async componentDidMount() {
    const response = await fetch(
      "https://raw.githubusercontent.com/grumd/osu-pps/release/data.json"
    );
    const data = await response.json();
    this.setState(
      {
        data,
        isLoading: false
      },
      () => this.recalculateVisibleData()
    );
  }

  onChange(key, e) {
    const value = e.target.value;
    this.setState(
      {
        searchKey: {
          ...this.state.searchKey,
          [key]: value
        }
      },
      () => {
        if (key === FIELDS.MODE) {
          this.recalculateVisibleData();
        }
      }
    );
  }

  onChangeNumber(key, e) {
    const value = e.target.value === "" ? null : parseFloat(e.target.value);
    this.setState({
      searchKey: {
        ...this.state.searchKey,
        [key]: value
      }
    });
  }

  onShowMore() {
    this.setState(
      state => ({
        visibleItemsCount: state.visibleItemsCount + 20
      }),
      () => this.recalculateVisibleData()
    );
  }

  recalculateVisibleData() {
    const { data, visibleItemsCount, searchKey } = this.state;

    const overweightnessGetter = {
      age: item => +item.x / +item.h,
      total: item => +item.x,
      playcount: item => +item.x / +item.p
    }[searchKey[FIELDS.MODE]];

    const length = {
      min: formattedToSeconds(
        parseFloat(this.minLenRefs.minute.current.value),
        parseFloat(this.minLenRefs.second.current.value)
      ),
      max: formattedToSeconds(
        parseFloat(this.maxLenRefs.minute.current.value),
        parseFloat(this.maxLenRefs.second.current.value)
      )
    };

    const newData = data
      .sort((a, b) => overweightnessGetter(b) - overweightnessGetter(a))
      .filter((map, index) => {
        const mapMods = {
          dt: (map.m & 64) === 64,
          hd: (map.m & 8) === 8,
          hr: (map.m & 16) === 16,
          fl: (map.m & 1024) === 1024,
          ht: (map.m & 256) === 256
        };

        const realBpm = mapMods.dt
          ? map.bpm * 1.5
          : mapMods.ht
          ? map.bpm * 0.75
          : map.bpm;

        const mapLink = `http://osu.ppy.sh/b/${map.b}`;
        const linkText = `${map.art} - ${map.t} [${map.v}]`.toLowerCase();
        const searchWords = searchKey[FIELDS.TEXT].toLowerCase().split(" ");
        const searchMatches = searchWords.every(
          word => mapLink.includes(word) || linkText.includes(word)
        );

        return (
          searchMatches &&
          matchesMaxMin(
            map.pp99,
            searchKey[FIELDS.PP_MIN],
            searchKey[FIELDS.PP_MAX]
          ) &&
          matchesMaxMin(
            realBpm,
            searchKey[FIELDS.BPM_MIN],
            searchKey[FIELDS.BPM_MAX]
          ) &&
          matchesMaxMin(
            map.d,
            searchKey[FIELDS.DIFF_MIN],
            searchKey[FIELDS.DIFF_MAX]
          ) &&
          matchesMaxMin(map.l, length.min, length.max) &&
          modAllowed(searchKey[FIELDS.DT], mapMods.dt) &&
          modAllowed(searchKey[FIELDS.HD], mapMods.hd) &&
          modAllowed(searchKey[FIELDS.HR], mapMods.hr) &&
          modAllowed(searchKey[FIELDS.FL], mapMods.fl) &&
          (searchKey[FIELDS.DT] !== "ht" || mapMods.ht)
        );
      })
      .slice(0, visibleItemsCount);

    this.setState({ visibleData: newData });
  }

  renderHead() {
    const { isLoading } = this.state;
    return (
      <thead>
        <tr>
          <td className="img-td" />
          <td>
            <div className="form-group search-control">
              <input
                onChange={e => this.onChange(FIELDS.TEXT, e)}
                type="text"
                className="form-control input-sm"
                placeholder="search..."
              />
            </div>
          </td>
          <td className="min-max-head">
            <input
              onChange={e => this.onChangeNumber(FIELDS.PP_MIN, e)}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="min"
            />
            <input
              onChange={e => this.onChangeNumber(FIELDS.PP_MAX, e)}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="max"
            />
          </td>
          <td className="mod-head">
            <select
              className="form-control input-sm"
              onChange={e => this.onChange(FIELDS.DT, e)}
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
            >
              <option>any</option>
              <option>yes</option>
              <option>no</option>
            </select>
          </td>
          <td className="length-head">
            <div className="form-control time-pick">
              <input
                ref={this.minLenRefs.minute}
                className="minute"
                type="number"
                max="99"
                min="0"
                defaultValue="0"
              />
              <div>:</div>
              <input
                ref={this.minLenRefs.second}
                className="second"
                type="number"
                max="59"
                min="0"
                defaultValue="00"
              />
            </div>
            <div className="form-control time-pick">
              <input
                ref={this.maxLenRefs.minute}
                className="minute"
                type="number"
                max="99"
                min="0"
                defaultValue="99"
              />
              <div>:</div>
              <input
                ref={this.maxLenRefs.second}
                className="second"
                type="number"
                max="59"
                min="0"
                defaultValue="59"
              />
            </div>
          </td>
          <td className="min-max-head">
            <input
              onChange={e => this.onChangeNumber(FIELDS.BPM_MIN, e)}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="min"
            />
            <input
              onChange={e => this.onChangeNumber(FIELDS.BPM_MAX, e)}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="max"
            />
          </td>
          <td className="min-max-head">
            <input
              onChange={e => this.onChangeNumber(FIELDS.DIFF_MIN, e)}
              type="number"
              className="form-control pp-input input-sm"
              placeholder="min"
            />
            <input
              onChange={e => this.onChangeNumber(FIELDS.DIFF_MAX, e)}
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
              onClick={() => this.recalculateVisibleData()}
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
              className="form-control input-sm"
            >
              <option value="total">total</option>
              <option value="age" selected>
                / map's age
              </option>
              <option value="playcount">/ map's playcount</option>
            </select>
          </th>
        </tr>
      </thead>
    );
  }

  renderBody() {
    const { visibleData, data, searchKey } = this.state;
    console.log(visibleData, data);

    return (
      <TableBody
        data={visibleData}
        overweightnessMode={searchKey[FIELDS.MODE]}
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
    const { data, isLoading, visibleItemsCount } = this.state;

    if (isLoading) {
      return <div className="loading">loading...</div>;
    }

    return (
      visibleItemsCount < data.length && (
        <div className="show-more-div" onClick={this.onShowMore}>
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
