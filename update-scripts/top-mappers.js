const fs = require('fs');
const _ = require('lodash/fp');
const oneLineLog = require('single-line-log').stdout;

const { DEBUG } = require('./constants');
const { get } = require('./axios');
// const { modes } = require('./constants');
const {
  levenshtein,
  getDiffHours,
  truncateFloat,
  files,
  parallelRun,
  delay,
  writeFileSync,
} = require('./utils');

const getFavs = async (id, from, count) => {
  try {
    const res = await get(
      `https://osu.ppy.sh/users/${id}/beatmapsets/favourite?offset=${from}&limit=${count}`
    );
    return res.data;
  } catch (e) {
    console.log('Error', e && e.response && e.response.status, id);
    // console.log(e);
    return [];
  }
};

const getAdjustedX = (x, adj, h) => +x / Math.pow(adj || 1, 0.65) / Math.pow(+h || 1, 0.35);

module.exports = async (mode) => {
  console.log(`Calculating TOP 20 pp mappers for ${mode.text}`);

  const mapCache = JSON.parse(fs.readFileSync(files.mapInfoCache(mode)));
  const sortedResults = JSON.parse(fs.readFileSync(files.mapsList(mode))).sort((a, b) => b.x - a.x);

  const mapperNames = [];
  Object.keys(mapCache).forEach((mapId) => {
    const map = mapCache[mapId];

    if (typeof map.tags === 'string' && typeof map.version === 'string') {
      map.tagsLC = map.tags.toLowerCase();
      map.versionLC = map.version.toLowerCase();
    }
    const mapperName = mapperNames.find((name) => name.name === map.creator);
    if (!mapperName) {
      mapperNames.push({
        name: map.creator,
        nameLC: typeof map.creator === 'string' ? map.creator.toLowerCase() : null,
        id: map.creator_id,
      });
    }
  });

  console.log('Recognizing guest mappers');

  Object.keys(mapCache).forEach((mapId) => {
    const map = mapCache[mapId];

    const guestMapper = mapperNames.find((mapper) => {
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
      map.isGD = true;
    }
  });

  console.log('Calculating pp mappers list');

  const mappers = [];
  sortedResults.forEach((res) => {
    const map = mapCache[res.b];
    if (!map) {
      console.log('\nMap cache not found', res);
      return;
    }

    const mapper = mappers.find((mapper) => mapper.id === map.creator_id);
    map.h = getDiffHours(map);

    const x = +res.x;
    const xAge = (+res.x / +map.h) * 10000;
    const xAdj = getAdjustedX(res.x, res.adj, map.h);

    const newMapRecord = {
      id: map.beatmap_id,
      pp: res.pp99,
      x,
      xAge,
      xAdj,
      m: res.m,
    };
    if (!mapper) {
      mappers.push({
        name: map.creator,
        id: map.creator_id,
        mapsRecorded: [newMapRecord],
        points: x,
        pointsAge: xAge,
        pointsAdj: xAdj,
      });
    } else {
      const mapRecorded = mapper.mapsRecorded.find((m) => m.id === map.beatmap_id);
      if (!mapRecorded) {
        mapper.mapsRecorded.push(newMapRecord);
        mapper.points += x;
        mapper.pointsAge += xAge;
        mapper.pointsAdj += xAdj;
      }
    }
  });

  console.log('Calculating favs, playcount, mapper fav');

  const mapsPerMapper = _.groupBy('creator_id', _.values(mapCache));
  const mapperStats = _.mapValues((mapsArrayRaw) => {
    const mapsArray = mapsArrayRaw.filter((m) => m.mode == mode.id);
    const names = _.uniqBy('creator', mapsArray).map((m) => m.creator);
    if (!mapsArray.length) {
      return { names, playcount: 0, favs: 0, count: 0, mapsets: 0 };
    }
    const playcount = _.sumBy('playcount', mapsArray);

    const mapsets = _.uniqBy('beatmapset_id', mapsArray);
    const favs = _.sumBy('favourite_count', mapsets);

    return {
      userId: mapsArray[0].creator_id,
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
  writeFileSync(
    files.mappersPlaycountTxt(mode),
    byPlaycount.map((x) => `${x.names.join('/')}\t${(x.playcount / 1000000).toFixed(0)}`).join('\n')
  );
  writeFileSync(
    files.mappersFavsTxt(mode),
    byFavs.map((x) => `${x.names.join('/')}\t${x.favs.toFixed(0)}`).join('\n')
  );

  const mappersWithTenMaps = _.flow(
    _.filter((mapper) => mapper.mapsets >= 3),
    DEBUG ? (items) => items.slice(0, 5) : _.identity
  )(list);

  console.log('Mappers with 3+ maps ranked:', mappersWithTenMaps.length);

  await parallelRun({
    items: mappersWithTenMaps,
    concurrentLimit: 1,
    minRequestTime: 1500,
    job: async (mapper) => {
      oneLineLog(`Fetching ${mappersWithTenMaps.indexOf(mapper)}/${mappersWithTenMaps.length}`);
      const id = mapper.userId;

      let favourites = [];
      let offset = 0;
      const count = 50;
      do {
        const maps = await getFavs(id, offset, count);
        favourites.push(...maps);
        offset += count;
        await delay(500);
      } while (favourites.length === offset);
      mapper.favourites = favourites;
    },
  });
  console.log();
  console.log('Recording temp data');
  writeFileSync(files.tenMapsMappersTemp(mode), JSON.stringify(mappersWithTenMaps));
  // const mappersWithTenMaps = JSON.parse(fs.readFileSync(files.tenMapsMappersTemp(mode), 'utf8'));
  const favsPerMapper = {};
  mappersWithTenMaps.forEach((mapper) => {
    mapper.favourites &&
      mapper.favourites.forEach((fav) => {
        const mapperId = fav.user_id;
        if (mapper.userId == mapperId) {
          return;
        }

        // Weight of the mapper's vote:
        // -- 3 maps ranked -> 0.3 votes
        // -- 10+ maps ranked -> 1 vote (maximum)
        const weight = Math.min(1, (mapper.mapsets) / 10);

        const mapEntry = {
          count: weight,
          cover: _.get('covers.list', fav),
          ..._.pick(['id', 'artist', 'title', 'ranked_date'], fav),
        };

        if (!favsPerMapper[mapperId]) {
          favsPerMapper[mapperId] = {
            count: weight,
            ppCount: weight,
            mapsCount: 1,
            mapperId,
            namesDict: { [fav.creator]: weight },
            mapsDict: {
              [fav.id]: mapEntry,
            },
          };
        } else {
          favsPerMapper[mapperId].mapsCount += 1;
          favsPerMapper[mapperId].count += weight;
          favsPerMapper[mapperId].ppCount +=
            weight * 0.95 ** (favsPerMapper[mapperId].mapsCount - 1);
          favsPerMapper[mapperId].namesDict[fav.creator] =
            (favsPerMapper[mapperId].namesDict[fav.creator] || 0) + weight;
          if (!favsPerMapper[mapperId].mapsDict[fav.id]) {
            favsPerMapper[mapperId].mapsDict[fav.id] = mapEntry;
          } else {
            favsPerMapper[mapperId].mapsDict[fav.id].count += weight;
          }
        }
      });
  });

  Object.keys(favsPerMapper).forEach((mapperId) => {
    favsPerMapper[mapperId].names = Object.keys(favsPerMapper[mapperId].namesDict).sort(
      (a, b) => favsPerMapper[mapperId].namesDict[b] - favsPerMapper[mapperId].namesDict[a]
    );
    const mapsSorted = _.orderBy(['count'], ['desc'], _.values(favsPerMapper[mapperId].mapsDict));
    writeFileSync(files.mappersFavTopDetails(mode, mapperId), JSON.stringify(mapsSorted));
    delete favsPerMapper[mapperId].namesDict;
    delete favsPerMapper[mapperId].mapsDict;
  });

  console.log('Recorded top of mappers by mapper favs');
  writeFileSync(
    files.mappersFavTop(mode),
    JSON.stringify(_.orderBy(['count'], ['desc'], _.values(favsPerMapper)))
  );

  const transformMapList = (pointsKey = 'points', xKey = 'x', shouldTruncateFloat = true) => (
    mapper
  ) => {
    return {
      name: mapper.name,
      id: mapper.id,
      points: shouldTruncateFloat ? truncateFloat(mapper[pointsKey]) : mapper[pointsKey],
      mapsRecorded: mapper.mapsRecorded
        .sort((a, b) => b[xKey] - a[xKey])
        .slice(0, 20)
        .map((map) => ({
          id: map.id,
          text: `${mapCache[map.id].artist} - ${mapCache[map.id].title} [${
            mapCache[map.id].version
          }]`,
          ow: shouldTruncateFloat ? truncateFloat(map[xKey]) : map[xKey],
          pp: map.pp,
          m: map.m,
        })),
    };
  };

  const resultingObject = {
    top20: mappers
      .sort((a, b) => b.points - a.points)
      .slice(0, 20)
      .map(transformMapList('points', 'x')),
    top20age: mappers
      .sort((a, b) => b.pointsAge - a.pointsAge)
      .slice(0, 20)
      .map(transformMapList('pointsAge', 'xAge')),
    top20adj: mappers
      .sort((a, b) => b.pointsAdj - a.pointsAdj)
      .slice(0, 20)
      .map(transformMapList('pointsAdj', 'xAdj', false)),
  };

  writeFileSync(files.dataMappers(mode), JSON.stringify(resultingObject));
  console.log('Finished calculating TOP 20 mappers!');
};

// module.exports(modes.osu);
