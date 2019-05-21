'use strict';

const axios = require('./axios');
const oneLineLog = require('single-line-log').stdout;
const fs = require('fs');
const { ppBlockSize, ppBlockMapCount, DEBUG } = require('./constants');
const { uniq, truncateFloat, delay, files } = require('./utils');

const apikey = JSON.parse(fs.readFileSync('./config.json')).apikey;

const getUrl = (userId, modeId) =>
  `https://osu.ppy.sh/api/get_user_best?k=${apikey}&u=${userId}&limit=20&type=id&m=${modeId}`;
const getUniqueMapId = score => `${score.beatmap_id}_${score.enabled_mods}`;
const getMagnitudeByIndex = x => Math.pow(Math.pow(x - 100, 2) / 10000, 20); // ((x-100)^2/10000)^20

let maps = {};
let peoplePerPpBlocks = [];

const calculatePp99 = map => {
  const ppPerAccSum = map.pp.reduce((sum, pp, index) => {
    return sum + pp * map.acc[index];
  }, 0);
  map.pp99 = truncateFloat(ppPerAccSum / map.pp.length / 99);
  delete map.pp;
  delete map.acc;
};

const simplifyMods = mods => {
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

const recordData = data => {
  const topMapsPpSum = data.slice(0, ppBlockMapCount).reduce((sum, map) => {
    return sum + parseFloat(map.pp);
  }, 0);
  const ppBlockValue = Math.floor(Math.round(topMapsPpSum / ppBlockMapCount) / ppBlockSize);
  peoplePerPpBlocks[ppBlockValue] = (peoplePerPpBlocks[ppBlockValue] || 0) + 1;

  data.forEach((score, index) => {
    Object.keys(score).forEach(key => {
      const parsed = Number(score[key]);
      score[key] = isNaN(parsed) ? score[key] : parsed;
    });
    score.enabled_mods = simplifyMods(score.enabled_mods);
    const mapId = getUniqueMapId(score);
    const acc =
      (100 * (score.count300 + score.count100 / 3 + score.count50 / 6)) /
      (score.countmiss + score.count50 + score.count100 + score.count300);
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

const fetchUser = (userId, modeId) => {
  return axios
    .get(getUrl(userId, modeId))
    .then(({ data }) => {
      recordData(data, userId);
    })
    .catch(error => {
      console.log('\x1b[33m%s\x1b[0m', error.message);
    });
};

module.exports = mode => {
  console.log(`1. FETCHING MAPS LIST - ${mode.text}`);
  maps = {};
  peoplePerPpBlocks = [];
  let usersList = [];
  try {
    usersList = JSON.parse(fs.readFileSync(files.userIdsList(mode)));
  } catch (e) {
    console.log('Error parsing ' + files.userIdsList(mode));
  }
  const uniqueUsersList = uniq(usersList);
  const fetchPromises = [];
  return uniqueUsersList
    .slice(...(DEBUG ? [0, 20] : []))
    .reduce((promise, user, index) => {
      return promise.then(() => {
        if (DEBUG && index > 5) {
          return Promise.resolve();
        }
        oneLineLog(`Recording data for user #${index}/${uniqueUsersList.length} (${mode.text})`);
        fetchPromises.push(fetchUser(user, mode.id));
        return delay(100);
      });
    }, Promise.resolve())
    .then(() => Promise.all(fetchPromises))
    .then(() => {
      console.log();
      console.log(`${Object.keys(maps).length} unique maps found! Saving.`);
      Object.keys(maps).forEach(mapId => {
        if (maps[mapId].pp99 === undefined) {
          calculatePp99(maps[mapId]);
        }
        maps[mapId].x = truncateFloat(maps[mapId].x);
        const ppBlockValue = Math.floor(Math.round(maps[mapId].pp99) / ppBlockSize);
        maps[mapId].adj = peoplePerPpBlocks[ppBlockValue] || 1;
      });
      const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
      fs.writeFileSync(files.mapsList(mode), JSON.stringify(arrayMaps));
      console.log('Saving info about PP blocks too');
      fs.writeFileSync(files.ppBlocks(mode), JSON.stringify(peoplePerPpBlocks));
      console.log(`Done fetching list of beatmaps! (${mode.text})`);
      maps = {};
    });
};
