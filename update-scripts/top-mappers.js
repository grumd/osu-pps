const fs = require('fs');
const oneLineLog = require('single-line-log').stdout;

const { mapInfoCacheFileName, resultArrayJson, topMappersResultJson } = require('./constants');
const { levenshtein, getDiffHours, truncateFloat } = require('./utils');

module.exports = () => {
  console.log('Calculating TOP 20 pp mappers');
  const mapCache = JSON.parse(fs.readFileSync(mapInfoCacheFileName));
  const sortedResults = JSON.parse(fs.readFileSync(resultArrayJson)).sort((a, b) => b.x - a.x);

  const mapperNames = [];
  Object.keys(mapCache).forEach(mapId => {
    const map = mapCache[mapId];
    if (typeof map.tags === 'string' && typeof map.version === 'string') {
      map.tagsLC = map.tags.toLowerCase();
      map.versionLC = map.version.toLowerCase();
    }
    const mapperName = mapperNames.find(name => name.name === map.creator);
    if (!mapperName) {
      mapperNames.push({
        name: map.creator,
        nameLC: typeof map.creator === 'string' ? map.creator.toLowerCase() : null,
        id: map.creator_id,
      });
    }
  });

  const mappers = [];
  sortedResults.forEach((res, index) => {
    !(index % 500) && oneLineLog(`${index}/${sortedResults.length}`);
    const map = mapCache[res.b];
    if (!map) {
      console.log('\nMap cache not found');
      return;
    }
    const guestMapper = mapperNames.find(mapper => {
      if (!map.versionLC || !map.tagsLC || !mapper.nameLC) {
        return false;
      }
      const mapperName = mapper.nameLC;
      const mapperNameWithUnderscores = mapperName.replace(/ /g, '_');
      const mapTags = map.tagsLC;
      const isInTags =
        mapTags.includes(' ' + mapperNameWithUnderscores + ' ') ||
        mapTags.endsWith(' ' + mapperNameWithUnderscores) ||
        mapTags.startsWith(mapperNameWithUnderscores + ' ');
      if (!isInTags) return false;
      const mapVersion = map.versionLC;
      const hasFullMapperName = mapVersion.includes(mapperName);
      if (hasFullMapperName) return true;
      const indexOfS = mapVersion.indexOf("'s ");
      if (indexOfS < 0) return false;
      const usernamePart = mapVersion.slice(0, indexOfS);
      const isPartOfUsername = mapperName.includes(usernamePart);
      if (isPartOfUsername) return true;
      if (mapTags.includes(usernamePart)) return false;
      const levelshteinPoints = levenshtein(mapperName, usernamePart);
      const levenshteinSaidOkay = levelshteinPoints < mapperName.length / 2;
      return levenshteinSaidOkay;
    });
    if (guestMapper) {
      map.creator_id = guestMapper.id;
      map.creator = guestMapper.name;
    }

    const mapper = mappers.find(mapper => mapper.id === map.creator_id);
    map.h = getDiffHours(map);
    if (!mapper) {
      mappers.push({
        name: map.creator,
        id: map.creator_id,
        mapsRecorded: [
          {
            id: map.beatmap_id,
            pp: res.pp99,
            x: +res.x,
            xAge: (+res.x / +map.h) * 10000,
            xPC: (+res.x / +map.playcount) * 100000,
            m: res.m,
          },
        ],
        points: +res.x,
        pointsAge: (+res.x / +map.h) * 10000,
        pointsPC: (+res.x / +map.playcount) * 100000,
      });
    } else {
      const mapRecorded = mapper.mapsRecorded.find(m => m.id === map.beatmap_id);
      if (!mapRecorded) {
        mapper.mapsRecorded.push({
          id: map.beatmap_id,
          pp: res.pp99,
          x: +res.x,
          xAge: (+res.x / +map.h) * 10000,
          // xPC: (+res.x / +map.playcount) * 100000,
          m: res.m,
        });
        mapper.points += +res.x;
        mapper.pointsAge += (+res.x / +map.h) * 10000;
        // mapper.pointsPC += (+res.x / +map.playcount) * 100000;
      }
    }
  });
  console.log();

  // const topMappers = mappers.sort((a, b) => b.points - a.points).slice(0, 20);
  // const topMappersAge = mappers.sort((a, b) => b.pointsAge - a.pointsAge).slice(0, 10);
  // const topMappersPC = mappers.sort((a, b) => b.pointsPC - a.pointsPC).slice(0, 10);
  // const topMappersPerMap = mappers
  //   .map(m => ({ ...m, pointsPerMap: m.points / m.mapsRecorded.length }))
  //   .sort((a, b) => b.pointsPerMap - a.pointsPerMap)
  //   .slice(0, 10);

  const transformMapList = (usingAge = false) => mapper => {
    return {
      name: mapper.name,
      id: mapper.id,
      points: usingAge ? truncateFloat(mapper.pointsAge) : truncateFloat(mapper.points),
      mapsRecorded: mapper.mapsRecorded
        .sort((a, b) => (usingAge ? b.xAge : b.x) - (usingAge ? a.xAge : a.x))
        .slice(0, 20)
        .map(map => ({
          id: map.id,
          text: `${mapCache[map.id].artist} - ${mapCache[map.id].title} [${
            mapCache[map.id].version
          }]`,
          ow: truncateFloat(usingAge ? map.xAge : map.x),
          pp: map.pp,
          m: map.m,
        })),
    };
  };

  const resultingObject = {
    top20: mappers
      .sort((a, b) => b.points - a.points)
      .slice(0, 20)
      .map(transformMapList(false)),
    top20age: mappers
      .sort((a, b) => b.pointsAge - a.pointsAge)
      .slice(0, 20)
      .map(transformMapList(true)),
    // top20pc: mappers
    //   .sort((a, b) => b.pointsPC - a.pointsPC)
    //   .slice(0, 20)
    //   .map(transformMapList),
  };

  fs.writeFileSync(topMappersResultJson, JSON.stringify(resultingObject));
  console.log('Finished calculating TOP 20 mappers!');
};

//module.exports();
