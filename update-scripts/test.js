const { files, writeFileSync } = require('./utils');
const { modes } = require('./constants');
const fs = require('fs');

let mapsCache = {};
let mapsArray = [];
if (fs.existsSync(files.mapInfoCache(modes.osu))) {
  try {
    mapsCache = JSON.parse(fs.readFileSync(files.mapInfoCache(modes.osu)));
    console.log('Loaded maps cache');
  } catch (e) {
    console.log('Error parsing ' + files.mapInfoCache(modes.osu));
  }
}

writeFileSync(files.mapInfoCache(modes.osu), 'test');
writeFileSync(files.mapInfoCache(modes.osu), 'tes2t');
writeFileSync(files.mapInfoCache(modes.osu), 'test2');
writeFileSync(files.mapInfoCache(modes.osu), 'test3');
writeFileSync(files.mapInfoCache(modes.osu), '{"a":4}');
