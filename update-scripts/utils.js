const exec = require('child_process').exec;

const files = {
  userIdsDate: mode => `./temp/${mode.text}/user-ids-date.json`,
  userIdsList: mode => `./temp/${mode.text}/user-ids.json`,
  userMapsList: mode => `./temp/${mode.text}/user-scores.json`,
  mapInfoCache: mode => `./temp/${mode.text}/map-cache.json`,
  mapsList: mode => `./temp/${mode.text}/maps.json`,
  mapsDetailedList: mode => `./temp/${mode.text}/maps-detailed.json`,
  mappersList: mode => `./temp/${mode.text}/mappers.json`,
  ppBlocks: mode => `./temp/${mode.text}/pp-blocks.json`,
  data: mode => `./../data-${mode.text}.json`,
  metadata: mode => `./../metadata-${mode.text}.json`,
  dataBackup: mode => `./../data-${mode.text}-backup.json`,
  dataMappers: mode => `./../data-${mode.text}-mappers.json`,
  dataRankings: mode => `./../data-${mode.text}-rankings.json`,
};

const uniq = (array, getKey = item => item) => {
  const seen = {};
  return array.filter(item => {
    return seen.hasOwnProperty(getKey(item)) ? false : (seen[getKey(item)] = true);
  });
};

const getDiffHours = diff =>
  Math.ceil((Date.now() - new Date(diff.last_update).getTime()) / 1000 / 60 / 60);

const delay = ms => new Promise(r => setTimeout(r, ms));

const truncateFloat = x => Math.floor(x * 100) / 100;

const runScript = fileName => {
  return new Promise((res, rej) => {
    exec(`bash ${fileName}`, (err, stdout, stderr) => {
      if (err) {
        rej(new Error(err));
      } else if (typeof stderr !== 'string') {
        rej(new Error(stderr));
      } else {
        res(stdout);
      }
    });
  });
};

const simplifyMods = (mods, { show } = {}) => {
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
  if (show) {
    console.log(mapMods);
  }
  mod -= mapMods.nc ? 512 : 0; // NC can be removed, DT is till there
  mod -= mapMods.sd ? 32 : 0; // SD doesn't affect PP
  mod -= mapMods.nf ? 1 : 0; // remove NF
  mod -= mapMods.so ? 4096 : 0; // remove SO
  return mod;
};

const trimModsForRankings = (mods, { show } = {}) => {
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
  if (show) {
    console.log(mapMods);
  }
  mod -= mapMods.nc ? 512 : 0; // NC can be removed, DT is till there
  mod -= mapMods.sd ? 32 : 0; // SD doesn't affect PP
  mod -= mapMods.nf ? 1 : 0; // remove NF
  mod -= mapMods.so ? 4096 : 0; // remove SO
  mod -= mapMods.hd ? 8 : 0;
  mod -= mapMods.hr ? 16 : 0;
  mod -= mapMods.pf ? 16384 : 0;
  // ONLY LEAVING EZ / DT / FL / HT mods
  return mod;
};

const modsToString = mods => {
  const mod = parseInt(mods, 10);
  const mapMods = {
    EZ: (mod & 2) == 2,
    NF: (mod & 1) == 1,
    HD: (mod & 8) == 8,
    DT: (mod & 64) == 64 && (mod & 512) != 512, // Remove DT if NC is on (keep NC)
    NC: (mod & 512) == 512,
    HT: (mod & 256) == 256,
    HR: (mod & 16) == 16,
    FL: (mod & 1024) == 1024,
    SD: (mod & 32) == 32,
    SO: (mod & 4096) == 4096,
    PF: (mod & 16384) == 16384,
  };
  return Object.keys(mapMods)
    .filter(key => mapMods[key])
    .join('');
};

var prevRow = [],
  str2Char = [];
const levenshtein = (str1, str2) => {
  var str1Len = str1.length,
    str2Len = str2.length;

  // base cases
  if (str1Len === 0) return str2Len;
  if (str2Len === 0) return str1Len;

  // two rows
  var curCol, nextCol, i, j, tmp;

  // initialise previous row
  for (i = 0; i < str2Len; ++i) {
    prevRow[i] = i;
    str2Char[i] = str2.charCodeAt(i);
  }
  prevRow[str2Len] = str2Len;

  var strCmp;
  for (i = 0; i < str1Len; ++i) {
    nextCol = i + 1;

    for (j = 0; j < str2Len; ++j) {
      curCol = nextCol;

      // substution
      strCmp = str1.charCodeAt(i) === str2Char[j];

      nextCol = prevRow[j] + (strCmp ? 0 : 1);

      // insertion
      tmp = curCol + 1;
      if (nextCol > tmp) {
        nextCol = tmp;
      }
      // deletion
      tmp = prevRow[j + 1] + 1;
      if (nextCol > tmp) {
        nextCol = tmp;
      }

      // copy current col value into previous (in preparation for next iteration)
      prevRow[j] = curCol;
    }

    // copy last col value into previous (in preparation for next iteration)
    prevRow[j] = nextCol;
  }

  return nextCol;
};

module.exports = {
  delay,
  uniq,
  truncateFloat,
  runScript,
  getDiffHours,
  levenshtein,
  files,
  simplifyMods,
  trimModsForRankings,
  modsToString,
};
