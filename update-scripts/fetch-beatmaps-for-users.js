'use strict';

const axios = require('./axios');
const oneLineLog = require('single-line-log').stdout;
const fs = require('fs');
const { ppBlockSize, ppBlockMapCount, DEBUG } = require('./constants');
const {
  uniq,
  truncateFloat,
  delay,
  files,
  simplifyMods,
  parallelRun,
  writeFileSync,
} = require('./utils');

const apikey = JSON.parse(fs.readFileSync('./config.json')).apikey;

const getUrl = (userId, modeId, limit) =>
  `https://osu.ppy.sh/api/get_user_best?k=${apikey}&u=${userId}&limit=${limit}&type=id&m=${modeId}`;
const getUniqueMapId = (score) => `${score.beatmap_id}_${score.enabled_mods}`;
const getMagnitudeByIndex = (x) => Math.pow(Math.pow(x - 100, 2) / 10000, 20); // ((x-100)^2/10000)^20

let maps = {};
let usersMaps = {};
let usersMapsDate = {};
let peoplePerPpBlocks = [];

const calculatePp99 = (map) => {
  const ppPerAccSum = map.pp.reduce((sum, pp, index) => {
    return sum + pp * map.acc[index];
  }, 0);
  map.pp99 = truncateFloat(ppPerAccSum / map.pp.length / 99);
  delete map.pp;
  delete map.acc;
};

const recordData = (data) => {
  const topMapsPpSum = data.slice(0, ppBlockMapCount).reduce((sum, map) => {
    return sum + parseFloat(map.pp);
  }, 0);
  const ppBlockValue = Math.floor(Math.round(topMapsPpSum / ppBlockMapCount) / ppBlockSize);
  peoplePerPpBlocks[ppBlockValue] = (peoplePerPpBlocks[ppBlockValue] || 0) + 1;

  data.forEach((score, index) => {
    Object.keys(score).forEach((key) => {
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

const fetchUserBeatmaps = (userId, modeId, scoresCount, retryCount = 0) => {
  if (retryCount > 3) {
    return Promise.reject(new Error('Too many retries'));
  }
  retryCount && oneLineLog(`Retry #${retryCount}`);
  return axios.get(getUrl(userId, modeId, scoresCount)).catch((err) => {
    console.log('Error:', err.message);
    return delay(5000).then(() => fetchUserBeatmaps(userId, modeId, scoresCount, retryCount + 1));
  });
};

const fetchUser = ({ userId, modeId, shouldRecordScores }) => {
  return fetchUserBeatmaps(userId, modeId, shouldRecordScores ? 100 : 20)
    .then(({ data }) => {
      if (shouldRecordScores) {
        // Recording as one string for compression sake
        usersMaps[userId] = data && data.map((d) => `${d.beatmap_id}_${d.enabled_mods}_${d.pp}`);
        usersMapsDate[userId] = Math.floor(Date.now() / 1000 / 60); // unix minutes
      }
      recordData(data, userId);
    })
    .catch((error) => {
      console.log('\x1b[33m%s\x1b[0m', error.message);
    });
};

module.exports = (mode) => {
  console.log(`1. FETCHING MAPS LIST - ${mode.text}`);
  maps = {};
  usersMaps = {};
  usersMapsDate = {};
  peoplePerPpBlocks = [];
  let fullUsersList = [];
  try {
    fullUsersList = JSON.parse(fs.readFileSync(files.userIdsList(mode))).sort(
      (a, b) => b.pp - a.pp
    );
  } catch (e) {
    console.log('Error parsing ' + files.userIdsList(mode));
  }
  const uniqueUsersList = uniq(fullUsersList, (user) => user.id);
  // const fetchPromises = [];
  const items = uniqueUsersList.slice(...(DEBUG ? [0, 100] : []));
  const parallelPromise = parallelRun({
    items,
    job: (user) => {
      const index = items.indexOf(user);
      oneLineLog(
        `Recording data for user #${index}/${uniqueUsersList.length} (${user.name}) (${mode.text})`
      );
      const shouldRecordScores = index < 11000;
      return fetchUser({
        userId: user.id,
        modeId: mode.id,
        shouldRecordScores,
      });
    },
  });
  return parallelPromise.then(() => {
    console.log();
    console.log(`${Object.keys(maps).length} unique maps found! Saving.`);
    Object.keys(maps).forEach((mapId) => {
      if (maps[mapId].pp99 === undefined) {
        calculatePp99(maps[mapId]);
      }
      maps[mapId].x = truncateFloat(maps[mapId].x);
      const ppBlockValue = Math.floor(Math.round(maps[mapId].pp99) / ppBlockSize);
      maps[mapId].adj = peoplePerPpBlocks[ppBlockValue] || 1;
    });
    const arrayMaps = Object.keys(maps).map((mapId) => maps[mapId]);
    writeFileSync(files.mapsList(mode), JSON.stringify(arrayMaps));
    console.log('Saving info about PP blocks too');
    writeFileSync(files.ppBlocks(mode), JSON.stringify(peoplePerPpBlocks));
    console.log('Saving users maps list');
    writeFileSync(files.userMapsList(mode), JSON.stringify(usersMaps));
    writeFileSync(files.userMapsDates(mode), JSON.stringify(usersMapsDate));
    console.log(`Done fetching list of beatmaps! (${mode.text})`);
    maps = {};
  });
};
