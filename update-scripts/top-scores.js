const fs = require('fs');

const { modes } = require('./constants');
const { levenshtein, getDiffHours, truncateFloat, files } = require('./utils');

module.exports = mode => {
  console.log('Recording best scores');
  const rankings = JSON.parse(fs.readFileSync(files.dataRankings(mode)));
  const scores = [];
  let minPP = 0,
    maxPP = Infinity;
  rankings.forEach(player => {
    player.s.forEach(score => {
      if (scores.length < 100 || score.p2 > minPP) {
        scores.push({
          mapName: score.n,
          b: score.b,
          m: score.m,
          pp1: score.p1,
          pp2: score.p2,
          playerName: player.n,
          uid: player.id,
        });
        if (maxPP < score.p2) maxPP = score.p2;
        if (minPP > score.p2) minPP = score.p2;
      }
    });
  });
  console.log(scores.length);
  const sortedScores = scores.sort((a, b) => b.pp2 - a.pp2).slice(0, 100);
  console.log(sortedScores);
};
module.exports(modes.osu);
