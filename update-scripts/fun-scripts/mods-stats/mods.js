const fs = require('fs');
const _ = require('lodash/fp');
const { modCodes } = require('../../constants');

const mapsFile = './osu.json';

// Results, meaninful mods per mode:
// osu:    DT, HD, HR, FL, HT, EZ, TouchDevice
// mania:  EZ, DT, HT, (?K - not sure)
// taiko:  DT, HD, HR, FL, HT, EZ
// fruits: DT, HD, HR, FL, HT, EZ

const getModsArray = (mod) => {
  const mods = Object.entries(modCodes).map(([m, code]) => [m, (mod & code) == code]);

  return mods.filter(([key, value]) => value).map(([key]) => key);
};

const getModsText = (mod) => {
  return getModsArray(mod).join('-');
};

const data = JSON.parse(fs.readFileSync(mapsFile)).map((d) => ({
  ...d,
  modsText: getModsText(d.m),
  mods: getModsArray(d.m),
}));

const grouped = Object.entries(_.groupBy('b', data))
  .filter(([key, value]) => value.length > 1)
  .map(([, value]) => value);

const mainMods = ['dt', 'hd', 'hr', 'fl', 'ht', 'ez'];

// QUESTION 1: What other mods are used?
const newMods = {};
grouped.forEach((maps) => {
  maps.forEach((map) => {
    map.mods.forEach((mod) => {
      if (!mainMods.includes(mod)) {
        newMods[mod] = (newMods[mod] || 0) + 1;
      }
    });
  });
});
console.log(newMods);

// QUESTION 2: How mods affect pp?

const checkMod = (modName) => {
  let ppDeltas = [];
  grouped.forEach((maps) => {
    const hdMap = maps.find((m) => m.modsText === modName);
    const nomod = maps.find((m) => m.modsText === '');
    if (hdMap?.ppAvg && nomod?.ppAvg) {
      ppDeltas.push(hdMap.ppAvg / nomod.ppAvg);
    }
  });
  console.log(modName, ppDeltas.length ? _.sum(ppDeltas) / ppDeltas.length : '--');
};

console.log('-- Main mods');
mainMods.forEach((mod) => {
  checkMod(mod);
});
console.log('-- New mods');
Object.keys(newMods).forEach((mod) => {
  checkMod(mod);
});
