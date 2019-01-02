const fs = require("fs");
const {
  mapInfoCacheFileName,
  resultArrayJson,
  topMappersResultJson
} = require("./constants");
const { levenshtein } = require("./utils");

module.exports = () => {
  const mapCache = JSON.parse(fs.readFileSync(mapInfoCacheFileName));
  const sortedResults = JSON.parse(fs.readFileSync(resultArrayJson)).sort(
    (a, b) => b.x - a.x
  );

  const mapperNames = [];
  Object.keys(mapCache).forEach(mapId => {
    const map = mapCache[mapId];
    const mapperName = mapperNames.find(name => name.name === map.creator);
    if (!mapperName) {
      mapperNames.push({ name: map.creator, id: map.creator_id });
    }
  });

  const mappers = [];
  sortedResults.forEach(res => {
    const index = sortedResults.indexOf(res);
    !(index % 500) && console.log(`${index}/${sortedResults.length}`);
    const map = mapCache[res.b];
    if (!map) {
      console.log("Map cache not found");
      return;
    }
    const guestMapper = mapperNames.find(mapper => {
      if (
        typeof map.version !== "string" ||
        typeof map.tags !== "string" ||
        typeof mapper.name !== "string"
      ) {
        return false;
      }
      const mapperName = mapper.name.toLowerCase();
      const mapTags = map.tags.toLowerCase();
      const isInTags =
        mapTags.includes(" " + mapperName + " ") ||
        mapTags.endsWith(" " + mapperName) ||
        mapTags.startsWith(mapperName + " ");
      if (!isInTags) return false;
      const mapVersion = map.version.toLowerCase();
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
    if (!mapper) {
      mappers.push({
        name: map.creator,
        id: map.creator_id,
        mapsRecorded: [map.beatmap_id],
        points: res.x,
        pointsAge: (+res.x / +map.h) * 20000,
        pointsPC: (+res.x / +map.p) * 300000
        // age: (+value.x/+value.h*20000).toFixed(0),
        // total: (+value.x).toFixed(0),
        // playcount: (+value.x/+value.p*300000).toFixed(0),
      });
    } else if (!mapper.mapsRecorded.includes(map.beatmap_id)) {
      mapper.mapsRecorded.push(map.beatmap_id);
      mapper.points += res.x;
      mapper.pointsAge += (+res.x / +map.h) * 20000;
      mapper.pointsPC += (+res.x / +map.p) * 300000;
    }
  });

  const topMappers = mappers.sort((a, b) => b.points - a.points).slice(0, 10);
  const topMappersAge = mappers
    .sort((a, b) => b.pointsAge - a.pointsAge)
    .slice(0, 10);
  const topMappersPC = mappers
    .sort((a, b) => b.pointsPC - a.pointsPC)
    .slice(0, 10);
  const topMappersPerMap = mappers
    .map(m => ({ ...m, pointsPerMap: m.points / m.mapsRecorded.length }))
    .sort((a, b) => b.pointsPerMap - a.pointsPerMap)
    .slice(0, 10);

  console.log(topMappers);
  console.log(topMappersAge);
  console.log(topMappersPC);
  // console.log(topMappersPerMap);

  // topMapper.mapsRecorded.forEach(mapId => {
  //   console.log(
  //     topMapper.mapsRecorded.indexOf(mapId) + 1 + ". ",
  //     `${mapCache[mapId].title} [${mapCache[mapId].version}]`
  //   );
  // });
};

module.exports();
