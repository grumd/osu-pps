const fs = require('fs');
const _ = require('lodash/fp');

const mapsDict = JSON.parse(fs.readFileSync('./map-cache.json', 'utf8'));
const mode = 0;

const calculate = async () => {
  const mapsPerMapper = _.groupBy('creator_id', _.values(mapsDict));
  const mapperStats = _.mapValues((mapsArrayRaw) => {
    const mapsArray = mapsArrayRaw.filter((m) => m.mode === mode);
    const names = _.uniqBy('creator', mapsArray).map((m) => m.creator);
    if (!mapsArray.length) {
      return { names, playcount: 0, favs: 0, count: 0, mapsets: 0 };
    }
    const playcount = _.sumBy('playcount', mapsArray);

    const mapsets = _.uniqBy('beatmapset_id', mapsArray);
    const favs = _.sumBy('favourite_count', mapsets);

    return {
      names,
      playcount,
      favs,
      count: mapsArray.length,
      mapsets: mapsets.length,
    };
  }, mapsPerMapper);

  const list = _.values(mapperStats);

  const byPlaycount = _.orderBy(['playcount'], ['desc'], list).slice(0, 51);
  const byFavs = _.orderBy(['favs'], ['desc'], list).slice(0, 51);

  fs.writeFileSync(
    './playcount.txt',
    byPlaycount.map((x) => `${x.names.join('/')}\t${(x.playcount / 10000).toFixed(0)}`).join('\n')
  );
  fs.writeFileSync(
    './favs.txt',
    byFavs.map((x) => `${x.names.join('/')}\t${x.favs.toFixed(0)}`).join('\n')
  );
};

calculate();
