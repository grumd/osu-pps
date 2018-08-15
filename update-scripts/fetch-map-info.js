'use strict';

const axios = require('axios');
const fs = require('fs');
const { truncateFloat, delay } = require('./utils');
const { mapInfoCacheFileName, resultArrayJson } = require('./constants');

const apikey = JSON.parse(fs.readFileSync('config.json')).apikey;

const urlBeatmapInfo = (diffId) => `https://osu.ppy.sh/api/get_beatmaps?k=${apikey}&b=${diffId}&limit=1`;
const getUniqueMapId = (map) => `${map.b}_${map.m}`;

let maps = {};
let mapsCache = {};

const addBeatmapInfo = (map) => {
  const getPromise = mapsCache[map.b]
    ? Promise.resolve(mapsCache[map.b])
    : axios.get(urlBeatmapInfo(map.b)).then(({ data }) => {
        if (data.length > 0) {
          const diff = data[0];
          Object.keys(diff).forEach(key => {
            const parsed = parseFloat(diff[key]);
            diff[key] = (isNaN(parsed) || 'last_update' === key) ? diff[key] : truncateFloat(parsed);
          });
          mapsCache[map.b] = diff;
          return diff;
        } else {
          console.log('No maps found :(');
        }
    })

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
        map.h = Math.ceil((Date.now() - new Date(diff.last_update).getTime()) / 1000 / 60 / 60); // hours since ranked

        const mapId = getUniqueMapId(map);
        maps[mapId] = map;
      } else {
        console.log('No maps found :(');
      }
    })
    .catch((err) => {
      console.log('Error for /b/', map.b, err.message);
      return delay(1000)
        .then(() => addBeatmapInfo(map));
    });
};

module.exports = () => {
  maps = {};
  mapsCache = {};
  let mapsArray = [];
  if (fs.existsSync(mapInfoCacheFileName)) {
    try {
      mapsCache = JSON.parse(fs.readFileSync(mapInfoCacheFileName));
    } catch (e) {
      console.log('Error parsing ' + mapInfoCacheFileName);
    }
  }
  try {
    mapsArray = JSON.parse(fs.readFileSync(resultArrayJson));
  } catch (e) {
    console.log('Error parsing ' + resultArrayJson);
  }
  return mapsArray.reduce((promise, map, index) => {
    return promise.then(() => {
      index % 100 || console.log(`Loading map #${index + 1}/${mapsArray.length}`)
      return addBeatmapInfo(map).then(() => {
        if (index % 500 === 0) {
          console.log(`${Object.keys(maps).length} maps saved.`);
          const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
          fs.writeFileSync('result-array-with-info.json', JSON.stringify(arrayMaps));
          fs.writeFileSync(mapInfoCacheFileName, JSON.stringify(mapsCache));
        }
      });
    })
  }, Promise.resolve())
    .then(() => {
      const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
      fs.writeFileSync('result-array-with-info.json', JSON.stringify(arrayMaps));
      fs.writeFileSync(mapInfoCacheFileName, JSON.stringify(mapsCache));
      console.log('Done!');
    });
};
