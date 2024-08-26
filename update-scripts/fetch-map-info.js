'use strict';

const fs = require('fs');
const { delay, getDiffHours, files, writeJson, readJson, parallelRun } = require('./utils');
const { fetchBeatmap } = require('./apiv2');
const { modes } = require('./constants');

const getUniqueMapId = (map) => `${map.b}_${map.m}`;

const shouldUpdateCached = (cached) => {
  const cachedDate = cached.cache_date ? new Date(cached.cache_date) : null;
  const approvedDate = cached.beatmapset.ranked_date
    ? new Date(cached.beatmapset.ranked_date)
    : null;
  const wasCachedLongAgo =
    !approvedDate ||
    !cachedDate ||
    // Update map cache increasingly rarely (2x longer wait every update)
    Date.now() - cachedDate.getTime() > cachedDate.getTime() - approvedDate.getTime();
  const hasMapUpdatedAfterCached =
    cachedDate &&
    (new Date(cached.last_update) > cachedDate ||
      new Date(cached.beatmapset.ranked_date) > cachedDate ||
      new Date(cached.submit_date) > cachedDate);
  return wasCachedLongAgo || hasMapUpdatedAfterCached || cached.passcount < 1000;
};

module.exports = async (mode) => {
  console.log(`2. FETCHING MAP INFO - ${mode.text}`);
  const maps = {};
  let mapsCache = {};
  let mapsArray = [];
  if (fs.existsSync(files.mapInfoCache(mode))) {
    try {
      mapsCache = await readJson(files.mapInfoCache(mode));
      console.log('Loaded maps cache');
    } catch (e) {
      console.log('Error parsing ' + files.mapInfoCache(mode));
    }
  }
  try {
    mapsArray = await readJson(files.mapsList(mode));
    console.log('Loaded maps list');
  } catch (e) {
    console.log('Error parsing ' + files.mapsList(mode));
  }

  const addBeatmapInfo = (map, mode) => {
    const shouldFetchMapInfo = !mapsCache[map.b] || shouldUpdateCached(mapsCache[map.b]);

    const getPromise = !shouldFetchMapInfo
      ? Promise.resolve(mapsCache[map.b])
      : Promise.all([
          delay(300),
          fetchBeatmap(map.b).then(({ data }) => {
            mapsCache[map.b] = {
              ...data,
              cache_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
            };
            return data;
          }),
        ]).then((resolved) => {
          return resolved[1];
        });

    return getPromise
      .then((diff) => {
        if (diff) {
          map.art = diff.beatmapset.artist;
          map.t = diff.beatmapset.title;
          map.v = diff.version;
          map.s = diff.beatmapset_id;
          map.l = diff.hit_length;
          map.bpm = diff.bpm;
          map.d = diff.difficulty_rating;
          map.p = diff.passcount;
          map.h = getDiffHours(diff); // Hours since it was ranked
          map.appr_h = Math.floor(new Date(diff.beatmapset.ranked_date).getTime() / 1000 / 60 / 60); // Hours since 1970
          map.ar = diff.ar;
          map.accuracy = diff.accuracy; // od
          map.cs = diff.cs;
          map.drain = diff.drain; // hp
          map.mapper_id = diff.user_id;

          if (mode === modes.mania && diff.mode_int === modes.mania.id) {
            // Key count for mania
            map.k = diff.cs;
          }

          const mapId = getUniqueMapId(map);
          maps[mapId] = map;
        } else {
          console.log('No maps found :(');
        }
      })
      .catch((err) => {
        console.log('Error for /b/', map.b, err.message);
        return delay(1000).then(() => addBeatmapInfo(map, mode));
      });
  };

  console.log('Fetching detailed diff info about every beatmap...');
  await parallelRun({
    items: mapsArray,
    concurrentLimit: 1,
    job: async (map) => {
      const index = mapsArray.indexOf(map);
      await addBeatmapInfo(map, mode);
      if ((index + 1) % 5000 === 0) {
        const arrayMaps = Object.keys(maps)
          .map((mapId) => maps[mapId])
          .sort((a, b) => b.x - a.x);
        await writeJson(files.mapsDetailedList(mode), arrayMaps);
        await writeJson(files.mapInfoCache(mode), mapsCache);
      }
    },
  });

  const arrayMaps = Object.keys(maps)
    .map((mapId) => maps[mapId])
    .sort((a, b) => b.x - a.x);
  await writeJson(files.mapsDetailedList(mode), arrayMaps);
  await writeJson(files.mapInfoCache(mode), mapsCache);
  console.log(`${arrayMaps.length} maps saved. Done fetching detailed map info! (${mode.text})`);
};
