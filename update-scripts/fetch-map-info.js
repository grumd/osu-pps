'use strict';

const axios = require('./axios');
const oneLineLog = require('single-line-log').stdout;
const fs = require('fs');
const { truncateFloat, delay, getDiffHours, files } = require('./utils');
const { modes } = require('./constants');

const apikey = JSON.parse(fs.readFileSync('./config.json')).apikey;

// a=1 - add converts to response
const urlBeatmapInfo = (diffId, modeId) =>
  `https://osu.ppy.sh/api/get_beatmaps?k=${apikey}&b=${diffId}&limit=1&m=${modeId}` +
  (modeId > 0 ? '&a=1' : '');
const getUniqueMapId = map => `${map.b}_${map.m}`;

let maps = {};
let mapsCache = {};

const addBeatmapInfo = (map, mode) => {
  const getPromise = mapsCache[map.b]
    ? Promise.resolve(mapsCache[map.b])
    : axios.get(urlBeatmapInfo(map.b, mode.id)).then(({ data }) => {
        if (data.length > 0) {
          const diff = data[0];
          Object.keys(diff).forEach(key => {
            const parsed = Number(diff[key]);
            diff[key] = isNaN(parsed) ? diff[key] : truncateFloat(parsed);
          });
          mapsCache[map.b] = diff;
          return diff;
        } else {
          console.log('No maps found :(');
        }
      });

  return getPromise
    .then(diff => {
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
        map.g = diff.genre_id;
        map.ln = diff.language_id;
        if (mode === modes.mania && diff.mode === modes.mania.id) {
          // Key count for mania
          map.k = diff.diff_size;
        }

        const mapId = getUniqueMapId(map);
        if (map.p > 1000) {
          // Ignore maps with low pass count
          maps[mapId] = map;
        }
      } else {
        console.log('No maps found :(');
      }
    })
    .catch(err => {
      console.log('Error for /b/', map.b, err.message);
      return delay(1000).then(() => addBeatmapInfo(map, mode));
    });
};

module.exports = mode => {
  console.log(`2. FETCHING MAP INFO - ${mode.text}`);
  maps = {};
  mapsCache = {};
  let mapsArray = [];
  if (fs.existsSync(files.mapInfoCache(mode))) {
    try {
      mapsCache = JSON.parse(fs.readFileSync(files.mapInfoCache(mode)));
      console.log('Loaded maps cache');
    } catch (e) {
      console.log('Error parsing ' + files.mapInfoCache(mode));
    }
  }
  try {
    mapsArray = JSON.parse(fs.readFileSync(files.mapsList(mode)));
    console.log('Loaded maps list');
  } catch (e) {
    console.log('Error parsing ' + files.mapsList(mode));
  }
  let lastSaveAt = null;
  return mapsArray
    .reduce((promise, map, index) => {
      return promise.then(() => {
        oneLineLog(
          `Loading map #${index + 1}/${mapsArray.length} (${mode.text})${
            lastSaveAt ? ' last saved at: ' + lastSaveAt : ''
          }`
        );
        return addBeatmapInfo(map, mode).then(() => {
          if ((index + 1) % 500 === 0) {
            const arrayMaps = Object.keys(maps)
              .map(mapId => maps[mapId])
              .sort((a, b) => b.x - a.x);
            lastSaveAt = index + 1;
            fs.writeFileSync(files.mapsDetailedList(mode), JSON.stringify(arrayMaps));
            fs.writeFileSync(files.mapInfoCache(mode), JSON.stringify(mapsCache));
          }
        });
      });
    }, Promise.resolve())
    .then(() => {
      console.log();
      const arrayMaps = Object.keys(maps)
        .map(mapId => maps[mapId])
        .sort((a, b) => b.x - a.x);
      fs.writeFileSync(files.mapsDetailedList(mode), JSON.stringify(arrayMaps));
      fs.writeFileSync(files.mapInfoCache(mode), JSON.stringify(mapsCache));
      console.log(
        `${arrayMaps.length} maps saved. Done fetching detailed map info! (${mode.text})`
      );
    });
};
