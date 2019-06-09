const fs = require('fs');
const oneLineLog = require('single-line-log').stdout;

const { simplifyMods, files, truncateFloat } = require('./utils');

module.exports = mode => {
  console.log('3. CALCULATING RANKINGS');
  const players = JSON.parse(fs.readFileSync(files.userIdsList(mode)));
  const scores = JSON.parse(fs.readFileSync(files.userMapsList(mode)));
  const mapsData = JSON.parse(fs.readFileSync(files.mapsDetailedList(mode)));

  // Calculate maximum and average Overweightness
  let maxOW = 0;
  let sum = 0;
  const mapsDataWithAdjValue = mapsData
    .map(item => {
      const x =
        +item.x / Math.pow(item.adj || 1, 0.65) / Math.pow(+item.p, 0.2) / Math.pow(+item.h, 0.5);
      maxOW = maxOW < x ? x : maxOW;
      sum += x;
      return {
        ...item,
        x,
      };
    })
    .sort((a, b) => b.x - a.x);
  const averageOW = sum / mapsData.length;
  console.log('Max/Avg overweightness: ', maxOW, averageOW);

  const getFarmValue = (player, playerIndex) => {
    oneLineLog(`Getting values for player ${player.name} #${playerIndex + 1}`);
    let x = 0; // overweightness value for player
    const playerScores = scores[player.id];
    if (playerScores) {
      // no scores - no player in rankings
      let newScores = [];
      playerScores.forEach(score => {
        const allMaps = mapsDataWithAdjValue.filter(map => map.b === score.beatmap_id);
        if (allMaps.length) {
          const thisMap = allMaps.find(map => map.m === simplifyMods(score.enabled_mods));
          const thisMapX = thisMap ? thisMap.x : 0;
          const maxLocal = allMaps.reduce((acc, map) => (acc > map.x ? acc : map.x), 0);
          const adjustedX = (maxLocal + thisMapX) / 2;
          x += adjustedX;
          const adjust =
            adjustedX > averageOW
              ? Math.sqrt((adjustedX - averageOW) / (maxOW - averageOW))
              : adjustedX / averageOW - 1;
          let pp = score.pp;
          pp *= 1 - adjust * (adjustedX > averageOW ? 0.4 : 0.1);
          // Maximum bonus for underweighted maps - 10%
          // Maximum nerf for overweighted maps - 40%
          newScores.push({
            map: `${allMaps[0].art} - ${allMaps[0].t} [${allMaps[0].v}]`,
            b: allMaps[0].b,
            pp1: Math.round(score.pp),
            pp2: Math.round(pp),
            x: truncateFloat(thisMapX),
            ax: truncateFloat(adjustedX),
          });
        }
      });
      newScores = newScores.sort((a, b) => b.pp2 - a.pp2);
      newScores = newScores.map((score, index) => ({
        ...score,
        ppAdj: Math.round(score.pp2 * Math.pow(0.95, index)),
      }));
      const ppTotal = newScores.reduce((acc, score) => acc + score.ppAdj, 0);
      return {
        name: player.name,
        x: truncateFloat(x),
        rank1: playerIndex + 1,
        pp1: player.pp,
        pp2: Math.round(ppTotal),
        scores: newScores,
      };
    }
  };

  const rankings = players
    .sort((a, b) => b.pp - a.pp) // original pp values, to get rank1 value
    .map(getFarmValue)
    .filter(a => a); // filter out no scores players
  console.log();
  rankings
    .sort((a, b) => b.pp2 - a.pp2)
    .map((ranking, index) => ({ ...ranking, rank2: index + 1 })); // to get rank2 value
  fs.writeFileSync(files.dataRankings(mode), JSON.stringify(rankings));
  console.log('Finished calculating rankings!');
};
