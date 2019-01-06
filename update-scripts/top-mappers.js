const fs = require("fs");
const oneLineLog = require("single-line-log").stdout;

const {
  mapInfoCacheFileName,
  resultArrayJson,
  topMappersResultJson
} = require("./constants");
const { levenshtein, getDiffHours } = require("./utils");

module.exports = () => {
  const mapCache = JSON.parse(fs.readFileSync(mapInfoCacheFileName));
  const sortedResults = JSON.parse(fs.readFileSync(resultArrayJson)).sort(
    (a, b) => b.x - a.x
  );

  const mapperNames = [];
  Object.keys(mapCache).forEach(mapId => {
    const map = mapCache[mapId];
    if (typeof map.tags === "string" && typeof map.version === "string") {
      map.tagsLC = map.tags.toLowerCase();
      map.versionLC = map.version.toLowerCase();
    }
    const mapperName = mapperNames.find(name => name.name === map.creator);
    if (!mapperName) {
      mapperNames.push({
        name: map.creator,
        nameLC:
          typeof map.creator === "string" ? map.creator.toLowerCase() : null,
        id: map.creator_id
      });
    }
  });

  const mappers = [];
  sortedResults.forEach((res, index) => {
    !(index % 500) && oneLineLog(`${index}/${sortedResults.length}`);
    const map = mapCache[res.b];
    if (!map) {
      console.log("\nMap cache not found");
      return;
    }
    const guestMapper = mapperNames.find(mapper => {
      if (!map.versionLC || !map.tagsLC || !mapper.nameLC) {
        return false;
      }
      const mapperName = mapper.nameLC;
      const mapTags = map.tagsLC;
      const isInTags =
        mapTags.includes(" " + mapperName + " ") ||
        mapTags.endsWith(" " + mapperName) ||
        mapTags.startsWith(mapperName + " ");
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
        mapsRecorded: [map.beatmap_id],
        points: res.x,
        pointsAge: (+res.x / +map.h) * 20000,
        pointsPC: (+res.x / +map.playcount) * 300000
      });
    } else if (!mapper.mapsRecorded.includes(map.beatmap_id)) {
      mapper.mapsRecorded.push(map.beatmap_id);
      mapper.points += res.x;
      mapper.pointsAge += (+res.x / +map.h) * 20000;
      mapper.pointsPC += (+res.x / +map.playcount) * 300000;
    }
  });
  oneLineLog.clear();

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

  console.log(topMappers.map(a => `${a.name} - ${a.points}`));
  console.log(topMappersAge.map(a => `${a.name} - ${a.pointsAge}`));
  console.log(topMappersPC.map(a => `${a.name} - ${a.pointsPC}`));
  // console.log(topMappersPerMap);

  // topMapper.mapsRecorded.forEach(mapId => {
  //   console.log(
  //     topMapper.mapsRecorded.indexOf(mapId) + 1 + ". ",
  //     `${mapCache[mapId].title} [${mapCache[mapId].version}]`
  //   );
  // });
};

module.exports();
