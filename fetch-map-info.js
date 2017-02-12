'use strict';

const axios = require('axios');
const fs = require('fs');

const apikey = JSON.parse(fs.readFileSync('config.json')).apikey;

const urlBeatmapInfo = (diffId) => `https://osu.ppy.sh/api/get_beatmaps?k=${apikey}&b=${diffId}&limit=1`;
const getUniqueMapId = (map) => `${map.b}_${map.m}`;

const maps = {};

const addBeatmapInfo = (map) => {
  axios.get(urlBeatmapInfo(map.b))
    .then(({ data }) => {
      if (data.length > 0) {
        const diff = data[0];
        const mapId = getUniqueMapId(map);
        maps[mapId] = map;
        maps[mapId].art = diff.artist;
        maps[mapId].t = diff.title;
        maps[mapId].v = diff.version;
      } else {
        console.log('No maps found :(');
      }
    })
    .catch((err) => {
      console.log('bid:', map.b, err.message);
      setTimeout(() => {
        addBeatmapInfo(map);
      }, 600);
    });
};

const timeout = (ms) => new Promise(res => setTimeout(res, ms));

const mapsArray = JSON.parse(fs.readFileSync('result-array.json'));
mapsArray.reduce((promise, map, index) => {
  return promise.then(() => {
    console.log(`Loading map #${index}/${mapsArray.length}`)
    return Promise.all([
      timeout(60),
      addBeatmapInfo(map),
    ]);
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
