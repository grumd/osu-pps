const fs = require('fs');
const oneLineLog = require('single-line-log').stdout;

const { simplifyMods, trimModsForRankings, files } = require('./utils');
// const { modes } = require('./constants');

module.exports = mode => {
  console.log('3. CALCULATING RANKINGS');
  const players = JSON.parse(fs.readFileSync(files.userIdsList(mode)));
  const scores = JSON.parse(fs.readFileSync(files.userMapsList(mode)));
  const mapsData = JSON.parse(fs.readFileSync(files.mapsDetailedList(mode)));

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

  const getFarmValue = (player, playerIndex) => {
    oneLineLog(`// Getting values for player ${player.name} #${playerIndex + 1}`);
    const playerScores = scores[player.id];
    if (playerScores) {
      // no scores - no player in rankings
      let newScores = [];
      playerScores.forEach(score => {
        const allMaps = mapsDataWithAdjValue.filter(map => map.b == score.b);
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
          pp *= 1 - adjust * (adjustedX > averageOW ? 0.25 : 0.15);
          // Maximum bonus for underweighted maps - 15%
          // Maximum nerf for overweighted maps - 25%
          newScores.push({
            n: `${allMaps[0].art} - ${allMaps[0].t} [${allMaps[0].v}]`, // map name
            // m: modsToString(score.m), // mods string (HDHR)
            m: score.m, // mods number
            b: allMaps[0].b, // beatmap id
            p1: Math.round(score.pp), // previous PP
            p2: Math.round(pp), // new PP
          });
        } else {
          console.log();
          console.log(player.name, '- not found any maps -', score);
        }
      });
      newScores = newScores.sort((a, b) => b.p2 - a.p2);
      return {
        n: player.name,
        s: newScores, // list of recalculated scores
      };
    }
  };

  let rankings = players
    .sort((a, b) => b.pp - a.pp) // original pp values, to get rank1 value
    .map(getFarmValue)
    .filter(a => a); // filter out no scores players
  fs.writeFileSync(files.dataRankings(mode), JSON.stringify(rankings));
  console.log();
  console.log('Finished calculating rankings!');
};

// module.exports(modes.osu);
// fs.copyFileSync(files.dataRankings(modes.osu), '../react-app/public/data-osu-rankings.json');
