const { get } = require('../axios');
const fs = require('fs');
const { parallelRun } = require('../utils');

const apikey = JSON.parse(fs.readFileSync('../config.json')).apikey;
const gdList = fs.readFileSync('./gd-list.txt', 'utf8');

const MAPPER_ID = 530913; // sotarks
const MODE = 0; // osu

const urlBeatmapInfo = (diffId, modeId) =>
  `https://osu.ppy.sh/api/get_beatmaps?k=${apikey}&b=${diffId}&limit=1&m=${modeId}` +
  (modeId > 0 ? '&a=1' : '');

const getRankedMaps = async (from, count) => {
  const res = await get(
    `https://osu.ppy.sh/users/${MAPPER_ID}/beatmapsets/ranked_and_approved?offset=${from}&limit=${count}`
  );
  return res.data;
};

const calculate = async () => {
  let totalMaps = [];
  let offset = 0;
  const count = 50;
  do {
    const maps = await getRankedMaps(offset, count);
    totalMaps.push(...maps);
    offset += count;
  } while (totalMaps.length === offset);

  const totalPlayCount = totalMaps.reduce((sum, map) => {
    return sum + map.play_count;
  }, 0);
  console.log('Ranked maps playcount:', totalPlayCount); // for own ranked maps

  const gdIds = gdList.match(/\/b\/(\d+)/g).map((str) => str.slice(3));
  const gdMaps = [];
  await parallelRun({
    items: gdIds,
    job: (id) => {
      return get(urlBeatmapInfo(id, MODE)).then((res) => gdMaps.push(res.data[0]));
    },
  });

  const totalGdPlayCount = gdMaps.reduce((sum, map) => {
    return sum + parseInt(map.playcount, 10);
  }, 0);
  console.log('GD playcount:', totalGdPlayCount);
};

// const gdIds = gdList.match(/\/b\/(\d+)/g).map((str) => str.slice(3));

calculate();
