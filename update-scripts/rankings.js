const fs = require('fs');
const oneLineLog = require('single-line-log').stdout;
// const axios = require('./axios');

// const { modes } = require('./constants');
const {
  simplifyMods,
  trimModsForRankings,
  files,
  // parallelRun,
  // delay,
  writeFileSync,
} = require('./utils');
// const apikey = JSON.parse(fs.readFileSync('./config.json')).apikey;

// const getUrl = (userId, modeId) =>
//   `https://osu.ppy.sh/api/get_user?k=${apikey}&u=${userId}&type=id&m=${modeId}`;

// const fetchUser = (userId, modeId, retryCount = 0) => {
//   if (retryCount > 3) {
//     return Promise.reject(new Error('Too many retries'));
//   }
//   retryCount && oneLineLog(`Retry #${retryCount}`);
//   return axios.get(getUrl(userId, modeId)).catch(err => {
//     console.log('Error:', err.message);
//     return delay(5000).then(() => fetchUser(userId, modeId, retryCount + 1));
//   });
// };

// const fetchUserRank = ({ userId, modeId }) => {
//   return fetchUser(userId, modeId)
//     .then(({ data }) => {
//       return data[0].pp_rank;
//     })
//     .catch(error => {
//       console.log('\x1b[33m%s\x1b[0m', error.message);
//     });
// };

module.exports = mode => {
  console.log('3. CALCULATING RANKINGS');
  let players = JSON.parse(fs.readFileSync(files.userIdsList(mode)));
  players.sort((a, b) => b.pp - a.pp); // to get rank #
  players.forEach((pl, index) => {
    pl.rank1 = index + 1;
  });
  const scores = JSON.parse(fs.readFileSync(files.userMapsList(mode)));
  const updateDatePerUser = JSON.parse(fs.readFileSync(files.userMapsDates(mode)));
  const mapsData = JSON.parse(fs.readFileSync(files.mapsDetailedList(mode)));
  console.log('Calculating overweightness for every map');
  // Calculate maximum and average Overweightness
  let maxOW = 0;
  let sum = 0;
  let count = 0;
  const mapsDataWithAdjValue = mapsData
    .map(item => {
      const x = +item.x / Math.pow(item.adj || 1, 0.65) / Math.pow(+item.h || 1, 0.35);
      maxOW = maxOW < x ? x : maxOW;
      if (x > 0.00005) {
        sum += x;
        count++;
      }
      return {
        ...item,
        x,
      };
    })
    .sort((a, b) => b.x - a.x);

  const averageOW = sum / count;
  console.log('Max OW:', maxOW, 'Avg OW:', averageOW);

  console.log('Creating a maps dictionary');
  const mapsDictionary = mapsDataWithAdjValue.reduce((dict, map) => {
    if (dict[map.b]) {
      dict[map.b].push(map);
    } else {
      dict[map.b] = [map];
    }
    return dict;
  }, {});

  const getFarmValue = (player, index, array) => {
    const playerScores = scores[player.id];
    if (playerScores) {
      index % 100 === 0 &&
        oneLineLog(`// Getting values for player #${index}/${array.length} - ${player.name}`);
      // no scores - no player in rankings
      let newScores = [];
      playerScores.forEach(scoreString => {
        const scoreArray = scoreString.split('_');
        const score = {
          b: scoreArray[0],
          m: scoreArray[1],
          pp: scoreArray[2],
        };
        const allMaps = mapsDictionary[score.b];
        const nomodOrDtMaps = allMaps.filter(map => map.m == trimModsForRankings(score.m));
        if (allMaps.length) {
          const thisMap = allMaps.find(map => map.m == simplifyMods(score.m));
          const thisMapX = thisMap ? thisMap.x : 0;
          const maxLocal = allMaps.reduce((acc, map) => (acc > map.x ? acc : map.x), 0);
          const maxLocalNomodOrDt = nomodOrDtMaps.reduce(
            (acc, map) => (acc > map.x ? acc : map.x),
            0
          );
          const adjustedX = (maxLocal + maxLocalNomodOrDt + 3 * thisMapX) / 5;
          const adjust =
            adjustedX > averageOW
              ? Math.sqrt((adjustedX - averageOW) / (maxOW - averageOW))
              : Math.sqrt(adjustedX / averageOW) - 1;

          let pp = score.pp;
          pp *= 1 - adjust * (adjustedX > averageOW ? 0.2 : 0.125);
          newScores.push({
            n: `${allMaps[0].art} - ${allMaps[0].t} [${allMaps[0].v}]`, // map name
            m: score.m, // mods number
            b: allMaps[0].b, // beatmap id
            p1: Math.round(score.pp), // previous PP
            p2: Math.round(pp), // new PP
          });
        } else {
          console.log();
          console.log(player.name, '- not found any maps -', score);
          newScores.push({
            n: score.b, // map name
            m: score.m, // mods number
            b: score.b, // beatmap id
            p1: Math.round(score.pp), // previous PP
            p2: Math.round(score.pp), // new PP
          });
        }
      });
      newScores = newScores.sort((a, b) => b.p2 - a.p2);
      const ppDiff = newScores.reduce((ppDiffSum, score) => ppDiffSum + score.p2 - score.p1, 0);
      const minuteUpdated = updateDatePerUser[player.id];
      return {
        n: player.name,
        id: player.id,
        ppDiff,
        minuteUpdated,
        s: newScores.slice(0, 50), // list of recalculated scores - only keep top 50 now!
      };
    }
  };

  const rankings = players.map(getFarmValue).filter(a => a && a.s && a.s.length); // filter out no scores players
  writeFileSync(files.dataRankings(mode), JSON.stringify(rankings));
  console.log();
  console.log('Finished calculating rankings!');
  /*
  return parallelRun({
    items: rankings,
    job: player => {
      return fetchUserRank({ userId: player.id, modeId: mode.id })
        .then(rank => {
          oneLineLog(
            `Fetched #${rank} for (${rankings.indexOf(player)}/${rankings.length}) - ${player.n}`
          );
          player.rank1 = rank;
        })
        .catch(e => {
          console.log();
          console.log(`Couldnt get rank for ${player.n}`);
          console.log(e.message);
        });
    },
  }).then(() => {
    rankings = rankings.filter(player => player.rank1);
    rankings = rankings.sort((a, b) => a.rank1 - b.rank1);
    writeFileSync(files.dataRankings(mode), JSON.stringify(rankings));
    console.log();
    console.log('Finished calculating rankings!');
  });
  */
};

// module.exports(modes.osu);
