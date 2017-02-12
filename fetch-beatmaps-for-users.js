'use strict';

const axios = require('axios');
const fs = require('fs');

const idsFileName = 'ids.json';
const usersList = JSON.parse(fs.readFileSync(idsFileName));
const uniqueUsersList = usersList.filter((user, index) => usersList.indexOf(user) === index);

const apikey = JSON.parse(fs.readFileSync('config.json')).apikey;

const url = (userId) => `https://osu.ppy.sh/api/get_user_best?k=${apikey}&u=${userId}&limit=100&type=id`;
const getUniqueMapId = (score) => `${score.beatmap_id}_${score.enabled_mods}`;
const getMagnitudeByIndex = (x) => Math.pow((Math.pow(x - 100, 2) / 10000), 20); // ((x-100)^2/10000)^20

const maps = {};

const recordData = (data) => {
  data.forEach((score, index) => {
    const mapId = getUniqueMapId(score);
    const acc = 100 * (score.count300 + score.count100 / 3 + score.count50 / 6) / (score.countmiss + score.count50 + score.count100 + score.count300);
    if (!maps[mapId]) {
      maps[mapId] = {
        m: score.enabled_mods,
        b: score.beatmap_id,
        pp: [score.pp],
        acc: [parseFloat(acc.toFixed(2))],
        x: getMagnitudeByIndex(index),
      };
    } else {
      maps[mapId].x += getMagnitudeByIndex(index);
      maps[mapId].pp.push(score.pp);
      maps[mapId].acc.push(parseFloat(acc.toFixed(2)));
    }
  });
};

const timeout = (ms) => new Promise(res => setTimeout(res, ms));
const fetchUser = (userId) => {
  axios.get(url(userId))
    .then(({ data }) => {
      recordData(data);
    });
}

uniqueUsersList.reduce((promise, user, index) => {
  return promise.then(() => {
    console.log(`Recording data for user #${index}`)
    return Promise.all([
      timeout(100),
      fetchUser(user),
    ]);
  })
}, Promise.resolve())
  .then(() => {
    fs.writeFileSync('result.json', JSON.stringify(maps));
    const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
    fs.writeFileSync('result-array.json', JSON.stringify(arrayMaps));
    console.log('Done!');
  });
