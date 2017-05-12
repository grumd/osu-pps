'use strict';

const fs = require('fs');

const getMods = (mod) => {
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
  return mapMods;
}

const simplifyMods = (mods) => {
  let mod = parseInt(mods, 10);
  const mapMods = getMods(mod);
  mod -= mapMods.nc ? 512 : 0; // NC can be removed, DT is till there
  mod -= mapMods.sd ? 32 : 0; // SD doesn't affect PP
  mod -= mapMods.nf ? 1 : 0; // remove NF
  mod -= mapMods.pf ? 16384 : 0; // remove NF
  mod -= mapMods.so ? 4096 : 0; // remove SO
  mod -= mapMods.ez ? 2 : 0; // remove EZ
  return mod;
};

const getUniqueMapId = (b, m) => `${b}_${m}`;

const maps = JSON.parse(fs.readFileSync('result-with-info.json'));
const keys = Object.keys(maps);
for (let i = 0; i < keys.length; i++) {
  const map = maps[keys[i]];
  const mods = getMods(map.m);
  if (mods.ez) {
    delete maps[keys[i]];
    continue;
  }
  const newMods = simplifyMods(map.m);
  const newKey = getUniqueMapId(map.b, newMods);
  if (newMods !== map.m && maps[newKey]) {
    maps[newKey].x += map.x;
    delete maps[keys[i]];
  }
}

const arrayMaps = Object.keys(maps).map(mapId => maps[mapId]);
fs.writeFileSync('result-array-merged.json', JSON.stringify(arrayMaps));