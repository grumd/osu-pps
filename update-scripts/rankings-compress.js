const fs = require('fs');
const { files } = require('./utils');

module.exports = mode => {
  console.log('Compressing rankings data');
  const data = JSON.parse(fs.readFileSync(files.dataRankings(mode)));
  const diffInfoArray = [];

  const compressedData = data.map(player => {
    const scores = player.s.map(score => {
      const text = `${score.b} ${score.n}`;
      let index = diffInfoArray.indexOf(text);
      if (index === -1) {
        diffInfoArray.push(text);
        index = diffInfoArray.length - 1;
      }
      return `${index}_${score.m}_${score.p1}_${score.p2}`;
    });
    return [player.n, player.minuteUpdated, player.ppDiff, scores];
  });

  fs.writeFileSync(files.dataRankingsCompressed(mode), JSON.stringify(compressedData));
  fs.writeFileSync(files.dataRankingsInfo(mode), JSON.stringify(diffInfoArray));
  console.log('Finished compressing');
};
