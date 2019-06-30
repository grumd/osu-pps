import React, { Component } from 'react';
import toBe from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import ReactTable from 'react-table';
import classNames from 'classnames';
import Modal from 'react-modal';
import matchSorter from 'match-sorter';
import lodashFp from 'lodash/fp';
import ReactTimeAgo from 'react-time-ago';

import 'react-table/react-table.css';
import './rankings.scss';

// import CollapsibleBar from 'components/CollapsibleBar';
// import ParamLink from 'components/ParamLink/ParamLink';

import { fetchRankings } from 'reducers/rankings';

import { modsToString } from 'utils/common';

const _ = lodashFp.convert({ cap: false });

const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    maxHeight: '80%',
    background: '#2d2d2d',
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

const getScoresColumns = player => [
  {
    minWidth: 500,
    accessor: 'name',
    Header: () => (
      <span>
        last updated{' '}
        <ReactTimeAgo
          timeStyle={{ units: ['second', 'minute', 'hour'] }}
          date={player.updateDate}
        />
      </span>
    ),
    Cell: ({ original: item }) => (
      <span>
        <a href={`http://osu.ppy.sh/b/${item.b}`}>{item.name}</a>
        {item.m !== '0' && <span> +{modsToString(item.m)}</span>}
      </span>
    ),
  },
  {
    Header: 'original pp',
    minWidth: 120,
    accessor: 'pp1',
    Cell: ({ original: item }) => (
      <>
        <span className="old-pp">{item.pp1}pp</span>
        {item.pp1 < item.pp2 && <span className="added-pp"> +{item.pp2 - item.pp1} =</span>}
        {item.pp1 > item.pp2 && <span className="subtracted-pp"> -{item.pp1 - item.pp2} =</span>}
        {item.pp1 === item.pp2 && <span className="notchanged-pp"> +0 =</span>}
      </>
    ),
  },
  {
    Header: 'adjusted pp',
    accessor: 'pp2',
    Cell: ({ original: item }) => (
      <>
        <span className="new-pp">{item.pp2}</span>
        <span className="weighted-pp">pp</span>
      </>
    ),
  },
  {
    Header: 'weighted',
    accessor: 'ppAdj',
    minWidth: 115,
    Cell: ({ original: item }) => (
      <span className="weighted-pp">
        {Math.round(item.ppAdj)}pp ({Math.round((item.ppAdj / item.pp2) * 100)}%)
      </span>
    ),
  },
];

class ShowScoresCell extends React.Component {
  constructor() {
    super();
    this.state = {
      isModalOpen: false,
    };
  }

  render() {
    const { original } = this.props;
    const { isModalOpen } = this.state;
    return (
      <>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => this.setState({ isModalOpen: true })}
        >
          show scores
        </button>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => this.setState({ isModalOpen: false })}
          style={modalStyles}
          contentLabel="top 50 scores"
          ariaHideApp={false}
        >
          <ReactTable
            data={original.scores}
            player={original}
            columns={getScoresColumns(original)}
            showPagination={false}
            showPageSizeOptions={false}
            defaultPageSize={50}
            sortable={false}
            resizable={false}
            minRows={3}
          />
        </Modal>
      </>
    );
  }
}

const columns = [
  {
    minWidth: 35,
    maxWidth: 75,
    Cell: props => `#${props.original.rank2}`,
    accessor: 'rank2',
  },
  {
    minWidth: 35,
    maxWidth: 75,
    Cell: props => {
      const player = props.original;
      if (player.rank2 === player.rank1) {
        return (
          <div className="rank rank-same rank-small-change">
            <span>■</span>0
          </div>
        );
      }
      if (player.rank1 > player.rank2) {
        return (
          <div
            className={classNames('rank rank-up', {
              'rank-small-change': player.rank1 - player.rank2 < 8,
            })}
          >
            <span>▲</span>
            {player.rank1 - player.rank2}
          </div>
        );
      } else if (player.rank2 > player.rank1) {
        return (
          <div
            className={classNames('rank rank-down', {
              'rank-small-change': player.rank2 - player.rank1 < 8,
            })}
          >
            <span>▼</span>
            {player.rank2 - player.rank1}
          </div>
        );
      }
    },
    accessor: 'rank2',
  },
  {
    filterable: true,
    filterMethod: (filter, rows) => {
      return matchSorter(rows, filter.value, { keys: ['name'] });
    },
    filterAll: true,
    Cell: props => (
      <a href={`https://osu.ppy.sh/users/${props.original.name}`}>{props.original.name}</a>
    ),
    accessor: 'name',
  },
  {
    maxWidth: 300,
    Cell: ({ original }) => (
      <span className="updated-at">
        <span>scores updated</span>
        <ReactTimeAgo
          timeStyle={{ units: ['second', 'minute', 'hour'] }}
          date={original.updateDate}
        />
      </span>
    ),
    accessor: 'pp2',
  },
  {
    maxWidth: 170,
    Cell: ({ original }) => (
      <span>
        <span className="pp">{original.pp2}pp </span>
        <span className="pp-diff">
          {original.ppIncrement !== null ? `+${original.ppIncrement}` : ''}
        </span>
      </span>
    ),
    accessor: 'pp2',
  },
  {
    maxWidth: 170,
    Cell: ({ original }) => {
      const totalChange = original.ppDiff;
      return (
        <span>
          <span
            className={classNames('pp-change', {
              positive: totalChange > 0,
              negative: totalChange < 0,
            })}
          >
            {totalChange > 0 ? '+' : ''}
            {totalChange}pp
          </span>
        </span>
      );
    },
    accessor: 'pp2',
  },
  {
    width: 110,
    Cell: ShowScoresCell,
    accessor: 'scores',
  },
];

const dataSelector = createSelector(
  (state, props) => props.match.params.mode,
  state => state.rankings,
  (mode, rankings) => {
    const rawData = rankings[mode].data;
    return _.flow(
      // Get old rank from array ordering / order scores by new pp
      _.map((item, playerIndex) => ({
        name: item.n,
        ppDiff: item.ppDiff,
        updateDate: item.updateDate,
        rank1: playerIndex + 1,
        scores: _.orderBy(['p2'], ['desc'], _.compact(item.s)),
      })),
      // Get total new PP / calculate weighted new pp
      _.map(item => {
        const mappedScores = item.scores.map((score, index) => ({
          name: score.n,
          m: score.m,
          b: score.b,
          pp1: score.p1,
          pp2: score.p2,
          ppAdj: score.p2 * Math.pow(0.95, index),
        }));
        return {
          ...item,
          pp2: Math.round(mappedScores.reduce((sum, score, index) => sum + score.ppAdj, 0)),
          scores: mappedScores,
        };
      }),
      // Order by new pp and get new rank from array order
      _.orderBy(['pp2'], ['desc']),
      items =>
        _.map(
          (item, newIndex) => ({
            ...item,
            rank2: newIndex + 1,
            ppIncrement: items[newIndex + 1] ? item.pp2 - items[newIndex + 1].pp2 : 0,
          }),
          items
        )
    )(rawData);
  }
);

const mapStateToProps = (state, props) => {
  const mode = props.match.params.mode;
  const data = dataSelector(state, props);
  return {
    data: _.isEmpty(data) ? null : data,
    error: state.rankings[mode].error,
    isLoading: state.rankings[mode].isLoading,
  };
};

const mapDispatchToProps = {
  fetchRankings,
};

class TopMapper extends Component {
  static propTypes = {
    match: toBe.object,
    data: toBe.array,
    error: toBe.object,
    isLoading: toBe.bool.isRequired,
  };

  componentDidMount() {
    const { isLoading, data, match } = this.props;
    if (!isLoading && !data) {
      this.props.fetchRankings(match.params.mode);
    }
  }

  componentDidUpdate() {
    const { match, isLoading, data } = this.props;
    if (!data && !isLoading) {
      this.props.fetchRankings(match.params.mode);
    }
  }

  render() {
    const { isLoading, data, error } = this.props;
    return (
      <div className="rankings">
        <header>
          <p>
            osu! top 10k rankings, but adjusted for farm maps. overweighted maps are nerfed,
            underweighted are slightly buffed. as a result, rare plays give more pp, popular plays
            give less.
            <br /> - you won't be in this ranking if your official rank is lower than 11k.
            <br />
            - total pp for each player is lower than official because i only count top 50 plays (osu
            counts all of them) and i don't add bonus pp.
            <br />- this list is updated <b>only once a few days</b>, so it may not include latest
            recent scores
            <br />- this list can <b>not</b> replace the official rankings and can't even exist
            without them
          </p>
        </header>
        <div className="content">
          {isLoading && <div className="loading">loading...</div>}
          {error && error.message}
          <div className="top-list">
            <ReactTable
              data={data || []}
              columns={columns}
              showPaginationTop
              showPageSizeOptions={false}
              defaultPageSize={20}
              sortable={false}
              resizable={false}
              minRows={4}
              noDataText={isLoading ? 'loading...' : 'no data found'}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TopMapper);
