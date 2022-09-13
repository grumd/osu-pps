'use strict';

const axios = require('./axios');
const fs = require('fs');
const {
  truncateFloat,
  delay,
  getDiffHours,
  files,
  writeJson,
  readJson,
  parallelRun,
} = require('./utils');
const { modes } = require('./constants');

const apikey = JSON.parse(fs.readFileSync('./config.json')).apikey;

// a=1 - add converts to response
const urlBeatmapInfo = (diffId, modeId) =>
  `https://osu.ppy.sh/api/get_beatmaps?k=${apikey}&b=${diffId}&limit=1&m=${modeId}` +
  (modeId > 0 ? '&a=1' : '');
const getUniqueMapId = (map) => `${map.b}_${map.m}`;

const shouldUpdateCached = (cached) => {
  const cachedDate = cached.cache_date ? new Date(cached.cache_date) : null;
  const approvedDate = cached.approved_date ? new Date(cached.approved_date) : null;
  const wasCachedLongAgo =
    !approvedDate ||
    !cachedDate ||
    // Update map cache increasingly rarely (2x longer wait every update)
    Date.now() - cachedDate.getTime() > cachedDate.getTime() - approvedDate.getTime();
  const hasMapUpdatedAfterCached =
    cachedDate &&
    (new Date(cached.last_update) > cachedDate ||
      new Date(cached.approved_date) > cachedDate ||
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
          axios.get(urlBeatmapInfo(map.b, mode.id)).then(({ data }) => {
            if (data.length > 0) {
              const diff = data[0];
              Object.keys(diff).forEach((key) => {
                const parsed = Number(diff[key]);
                diff[key] = isNaN(parsed) ? diff[key] : truncateFloat(parsed);
              });
              mapsCache[map.b] = {
                ...diff,
                cache_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
              };
              return diff;
            } else {
              console.log('No maps found :(');
            }
          }),
        ]).then((resolved) => resolved[1]);

    return getPromise
      .then((diff) => {
        if (diff) {
          map.art = diff.artist;
          map.t = diff.title;
          map.v = diff.version;
          map.s = diff.beatmapset_id;
          map.l = diff.hit_length;
          map.bpm = diff.bpm;
          map.d = diff.difficultyrating;
          map.p = diff.passcount;
          map.h = getDiffHours(diff); // Hours since it was ranked
          map.appr_h = Math.floor(new Date(diff.approved_date).getTime() / 1000 / 60 / 60); // Hours since 1970
          map.g = diff.genre_id;
          map.ln = diff.language_id;
          if (mode === modes.mania && diff.mode === modes.mania.id) {
            // Key count for mania
            map.k = diff.diff_size;
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
