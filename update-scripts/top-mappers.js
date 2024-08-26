const _ = require('lodash/fp');

const { DEBUG } = require('./constants');
const { fetchUserFavourites, fetchUserInfo } = require('./apiv2');
const {
  getDiffHours,
  truncateFloat,
  files,
  parallelRun,
  writeFileSync,
  readJson,
  writeJson,
  delay,
} = require('./utils');

const getAdjustedX = (x, adj, h) => +x / Math.pow(adj || 1, 0.65) / Math.pow(+h || 1, 0.35);

module.exports = async (mode) => {
  console.log(`Calculating TOP 20 pp mappers for ${mode.text}`);

  const mapCache = await readJson(files.mapInfoCache(mode));
  const sortedResults = (await readJson(files.mapsList(mode))).sort((a, b) => b.x - a.x);

  const mapIds = Object.keys(mapCache);

  let mapperNames = [];
  mapIds.forEach((mapId) => {
    const map = mapCache[mapId];
    const mapperName = mapperNames.find((name) => name.name === map.beatmapset.creator);
    if (!mapperName) {
      mapperNames.push({
        name: map.beatmapset.creator,
        id: map.beatmapset.user_id,
      });
    }
  });

  console.log('Fetch guest mapper names');

  for (const mapId of mapIds) {
    const map = mapCache[mapId];
    if (map.user_id !== map.beatmapset.user_id) {
      map.isGD = true;
      const mapperName = mapperNames.find((name) => name.id === map.user_id);
      if (!mapperName) {
        try {
          const [{ username }] = await Promise.all([fetchUserInfo(map.user_id), delay(300)]);
          mapperNames.push({ name: username, id: map.user_id });
          map.creator = username;
        } catch (error) {
          console.error(
            `Fetching guest mapper of mapset ${map.beatmapset_id}, beatmap ${map.id}. Error:`,
            error.message
          );
          map.creator = map.beatmapset.creator;
        }
      } else {
        map.creator = mapperName.name;
      }
    } else {
      map.creator = map.beatmapset.creator;
    }
  }

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
      id: map.id,
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
      const mapRecorded = mapper.mapsRecorded.find((m) => m.id === map.id);
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
    const mapsArray = mapsArrayRaw.filter((m) => m.mode_int == mode.id);
    const names = _.uniqBy('creator', mapsArray).map((m) => m.creator);
    if (!mapsArray.length) {
      return { names, playcount: 0, favs: 0, count: 0, mapsets: 0 };
    }
    const playcount = _.sumBy('playcount', mapsArray);

    const mapsets = _.uniqBy('beatmapset_id', mapsArray);
    const favs = _.sumBy('beatmapset.favourite_count', mapsets);

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
  console.log('Fetching their favourite maps...');

  await parallelRun({
    items: mappersWithTenMaps,
    concurrentLimit: 1,
    minRequestTime: 500,
    job: async (mapper) => {
      const id = mapper.userId;
      try {
        const data = await fetchUserFavourites(id);
        mapper.favourites = data.map((d) => ({
          ..._.pick(['user_id', 'creator', 'id', 'artist', 'title', 'ranked_date'], d),
          covers: { list: d.covers && d.covers.list },
        }));
      } catch (error) {
        console.error(`User ${mapper.userId} (${mapper.names[0]}) error:`, error.message);
      }
    },
  });

  console.log('Finished fetching favourites');

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
        const weight = Math.min(1, mapper.mapsets / 10);

        const mapEntry = {
          count: weight,
          cover: _.get('covers.list', fav),
          ..._.pick(['id', 'artist', 'title', 'ranked_date'], fav),
        };

        if (!favsPerMapper[mapperId]) {
          favsPerMapper[mapperId] = {
            count: weight,
            mapperId,
            namesDict: { [fav.creator]: weight },
            mapsDict: {
              [fav.id]: mapEntry,
            },
          };
        } else {
          favsPerMapper[mapperId].count += weight;
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

  const mapperIds = Object.keys(favsPerMapper);
  for (const mapperId of mapperIds) {
    favsPerMapper[mapperId].names = Object.keys(favsPerMapper[mapperId].namesDict).sort(
      (a, b) => favsPerMapper[mapperId].namesDict[b] - favsPerMapper[mapperId].namesDict[a]
    );
    const mapsSorted = _.orderBy(['count'], ['desc'], _.values(favsPerMapper[mapperId].mapsDict));
    await writeJson(files.mappersFavTopDetails(mode, mapperId), mapsSorted);
    delete favsPerMapper[mapperId].namesDict;
    delete favsPerMapper[mapperId].mapsDict;
  }

  console.log('Recorded top of mappers by mapper favs');
  await writeJson(
    files.mappersFavTop(mode),
    _.orderBy(['count'], ['desc'], _.values(favsPerMapper))
  );

  const transformMapList =
    (pointsKey = 'points', xKey = 'x', shouldTruncateFloat = true) =>
    (mapper) => {
      return {
        name: mapper.name,
        id: mapper.id,
        points: shouldTruncateFloat ? truncateFloat(mapper[pointsKey]) : mapper[pointsKey],
        mapsRecorded: mapper.mapsRecorded
          .sort((a, b) => b[xKey] - a[xKey])
          .slice(0, 20)
          .map((map) => ({
            id: map.id,
            text: `${mapCache[map.id].beatmapset.artist} - ${mapCache[map.id].beatmapset.title} [${
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

  await writeJson(files.dataMappers(mode), resultingObject);
  console.log('Finished calculating TOP 20 mappers!');
};

// module.exports(modes.osu);
