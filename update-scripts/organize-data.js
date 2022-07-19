const _ = require('lodash/fp');
const Papa = require('papaparse');

const { files, writeFileSync, writeJson, readJson } = require('./utils');
const { modes } = require('./constants');

module.exports = async (mode) => {
  console.log('Organizing data');
  console.log('Compressing rankings');

  const data = await readJson(files.dataRankings(mode));
  const diffInfoArray = [];

  const compressedData = data.map((player) => {
    const scores = player.s.map((score) => {
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

  await writeJson(files.dataRankingsCompressed(mode), compressedData);
  await writeJson(files.dataRankingsInfo(mode), diffInfoArray);

  console.log('Compressing maps data to csv');
  const mapsData = await readJson(files.mapsDetailedList(mode));

  const mapsetInfos = _.flow(
    _.map(_.pick(['art', 't', 'bpm', 'g', 'ln', 's'])),
    _.uniqBy('s')
  )(mapsData);
  const trimmedDiffData = _.map(_.omit(['art', 't', 'bpm', 'g', 'ln']), mapsData);

  writeFileSync(files.mapsetsCsv(mode), Papa.unparse(mapsetInfos));
  writeFileSync(files.diffsCsv(mode), Papa.unparse(trimmedDiffData));

  console.log('Creating metadata');
  await writeJson(files.metadata(mode), { lastUpdated: new Date() });

  console.log('Finished organizing data');
};

const argIndex = process.argv.indexOf('-run');
if (argIndex > -1 && modes[process.argv[argIndex + 1]]) {
  module.exports(modes[process.argv[argIndex + 1]]);
}
