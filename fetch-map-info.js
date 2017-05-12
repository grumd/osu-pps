'use strict';

const axios = require('axios');
const fs = require('fs');


const apikey = JSON.parse(fs.readFileSync('config.json')).apikey;

const truncateFloat = (x) => Math.floor(x * 100) / 100;
const urlBeatmapInfo = (diffId) => `https://osu.ppy.sh/api/get_beatmaps?k=${apikey}&b=${diffId}&limit=1`;
const getUniqueMapId = (map) => `${map.b}_${map.m}`;

const maps = {};

const addBeatmapInfo = (map) => {
  axios.get(urlBeatmapInfo(map.b))
    .then(({ data }) => {
      if (data.length > 0) {
        const diff = data[0];
        Object.keys(diff).forEach(key => {
          const parsed = parseFloat(diff[key]);
          diff[key] = isNaN(parsed) ? diff[key] : truncateFloat(parsed);
        });
        map.art = diff.artist;
        map.t = diff.title;
        map.v = diff.version;
        map.s = diff.beatmapset_id;
        map.l = diff.hit_length;
        map.bpm = diff.bpm;
        map.d = diff.difficultyrating;

        const mapId = getUniqueMapId(map);
        maps[mapId] = map;
      } else {
        console.log('No maps found :(');
      }
    })
    .catch((err) => {
      console.log('Error for /b/', map.b, err.message);
      setTimeout(() => {
        addBeatmapInfo(map);
      }, 1000);
    });
};

const timeout = (ms) => new Promise(res => setTimeout(res, ms));

const mapsArray = JSON.parse(fs.readFileSync('result-array.json'));
mapsArray.reduce((promise, map, index) => {
  return promise.then(() => {
    console.log(`Loading map #${index}/${mapsArray.length}`)
    return Promise.all([
      timeout(75),
      addBeatmapInfo(map),
    ]).then(() => {
      if (index % 100 === 0) {
        console.log(`${Object.keys(maps).length} maps saved.`);
        fs.writeFileSync('result-with-info.json', JSON.stringify(maps));
        const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
        fs.writeFileSync('result-array-with-info.json', JSON.stringify(arrayMaps));
      }
    });
  })
}, Promise.resolve())
  .then(() => {
    setTimeout(() => {
      fs.writeFileSync('result-with-info.json', JSON.stringify(maps));
      const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
      fs.writeFileSync('result-array-with-info.json', JSON.stringify(arrayMaps));
      console.log('Done!');
    }, 5000);
  });
