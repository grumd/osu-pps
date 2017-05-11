'use strict';

const axios = require('axios');
const fs = require('fs');

const truncateFloat = (x) => Math.floor(x * 100) / 100;

const uniq = (a) => {
  const seen = {};
  return a.filter((item) => {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

const idsFileName = 'ids.json';
const usersList = JSON.parse(fs.readFileSync(idsFileName));
const uniqueUsersList = uniq(usersList);

const apikey = JSON.parse(fs.readFileSync('config.json')).apikey;

const url = (userId) => `https://osu.ppy.sh/api/get_user_best?k=${apikey}&u=${userId}&limit=100&type=id`;
const getUniqueMapId = (score) => `${score.beatmap_id}_${score.enabled_mods}`;
const getMagnitudeByIndex = (x) => truncateFloat(Math.pow((Math.pow(x - 100, 2) / 10000), 20)); // ((x-100)^2/10000)^20

const maps = {};

const calculatePp99 = (map) => {
  const ppPerAccSum = map.pp.reduce((sum, pp, index) => {
    return sum + pp / map.acc[index];
  }, 0);
  map.pp99 = truncateFloat(ppPerAccSum / map.pp.length * 99);
  delete map.pp;
  delete map.acc;
};

const recordData = (data) => {
  data.slice(0, 20).forEach((score, index) => {
    Object.keys(score).forEach(key => {
      const parsed = parseFloat(score[key]);
      score[key] = isNaN(parsed) ? score[key] : parsed;
    });
    const mapId = getUniqueMapId(score);
    const acc = 100 * (score.count300 + score.count100 / 3 + score.count50 / 6) / (score.countmiss + score.count50 + score.count100 + score.count300);
    if (!maps[mapId]) {
      maps[mapId] = {
        m: score.enabled_mods,
        b: score.beatmap_id,
        pp: [score.pp],
        acc: [truncateFloat(acc)],
        x: getMagnitudeByIndex(index),
      };
    } else {
      const currentMap = maps[mapId];
      currentMap.x += getMagnitudeByIndex(index);
      if (currentMap.pp99 === undefined) {
        currentMap.pp.push(score.pp);
        currentMap.acc.push(truncateFloat(acc));
        if (currentMap.pp.length === 10) {
          calculatePp99(currentMap);
        }
      }
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
    console.log(`Recording data for user #${index}/${uniqueUsersList.length}`)
    return Promise.all([
      timeout(100),
      fetchUser(user),
    ]).then(() => {
      if (index % 100 === 0) {
        console.log(`${Object.keys(maps).length} unique maps found! Saved.`);
        fs.writeFileSync('result.json', JSON.stringify(maps));
        const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
        fs.writeFileSync('result-array.json', JSON.stringify(arrayMaps));
      }
    });
  })
}, Promise.resolve())
  .then(() => {
    console.log(`${Object.keys(maps).length} unique maps found! Saved.`);
    Object.keys(maps).forEach((mapId) => {
      if (maps[mapId].pp99 === undefined) {
        calculatePp99(maps[mapId]);
      }
    })
    fs.writeFileSync('result.json', JSON.stringify(maps));
    const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
    fs.writeFileSync('result-array.json', JSON.stringify(arrayMaps));
    console.log('Done!');
  });
