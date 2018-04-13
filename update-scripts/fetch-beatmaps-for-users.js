'use strict';

const axios = require('axios');
const fs = require('fs');
const { idsFileName, resultArrayJson } = require('./constants');
const { uniq, truncateFloat, delay } = require('./utils');

const apikey = JSON.parse(fs.readFileSync('./config.json')).apikey;

const url = (userId) => `https://osu.ppy.sh/api/get_user_best?k=${apikey}&u=${userId}&limit=100&type=id`;
const getUniqueMapId = (score) => `${score.beatmap_id}_${score.enabled_mods}`;
const getMagnitudeByIndex = (x) => Math.pow((Math.pow(x - 100, 2) / 10000), 20); // ((x-100)^2/10000)^20

let maps = {};

const calculatePp99 = (map) => {
  const ppPerAccSum = map.pp.reduce((sum, pp, index) => {
    return sum + pp / map.acc[index];
  }, 0);
  map.pp99 = truncateFloat(ppPerAccSum / map.pp.length * 99);
  delete map.pp;
  delete map.acc;
};

const simplifyMods = (mods) => {
  let mod = parseInt(mods, 10);
  const mapMods = {
    nf: (mod & 1) == 1,
    ez: (mod & 2) == 2,
    hd: (mod & 8) == 8,
    hr: (mod & 16) == 16,
    sd: (mod & 32) == 32,
    dt: (mod & 64) == 64,
    ht: (mod & 256) == 256,
    nc: (mod & 512) == 512,
    fl: (mod & 1024) == 1024,
    so: (mod & 4096) == 4096,
    pf: (mod & 16384) == 16384,
  };
  mod -= mapMods.nc ? 512 : 0; // NC can be removed, DT is till there
  mod -= mapMods.sd ? 32 : 0; // SD doesn't affect PP
  mod -= mapMods.nf ? 1 : 0; // remove NF
  mod -= mapMods.so ? 4096 : 0; // remove SO
  return mod;
};

const recordData = (data) => {
  data.slice(0, 20).forEach((score, index) => {
    Object.keys(score).forEach(key => {
      const parsed = parseFloat(score[key]);
      score[key] = isNaN(parsed) ? score[key] : parsed;
    });
    score.enabled_mods = simplifyMods(score.enabled_mods);
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

const fetchUser = (userId) => {
  axios.get(url(userId))
    .then(({ data }) => {
      recordData(data);
    });
}

module.exports = () => {
  maps = {};
  let usersList = [];
  try {
    usersList = JSON.parse(fs.readFileSync(idsFileName));
  } catch(e) {
    console.log('Error parsing ' + idsFileName);
  }
  const uniqueUsersList = uniq(usersList);
  return uniqueUsersList.reduce((promise, user, index) => {
    return promise.then(() => {
      index % 100 || console.log(`Recording data for user #${index}/${uniqueUsersList.length}`)
      return Promise.all([
        delay(100),
        fetchUser(user),
      ]);
    })
  }, Promise.resolve())
    .then(() => {
      console.log(`${Object.keys(maps).length} unique maps found! Saving.`);
      Object.keys(maps).forEach((mapId) => {
        if (maps[mapId].pp99 === undefined) {
          calculatePp99(maps[mapId]);
        }
        maps[mapId].x = truncateFloat(maps[mapId].x);
      });
      const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
      fs.writeFileSync(resultArrayJson, JSON.stringify(arrayMaps));
      console.log('Done!');
    });
};
