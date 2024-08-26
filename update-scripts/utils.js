const fs = require('fs');
const path = require('path');
const { spawn } = require('node:child_process');
const { stringifyStream, parseChunked } = require('@discoveryjs/json-ext');
const { execute } = require('many-promises');
const { modes, modCodes } = require('./constants');

const files = {
  countriesList: (mode) => `./countries-${mode.text}.json`,
  userIdsDate: (mode) => `./temp/${mode.text}/user-ids-date.json`,
  userIdsList: (mode) => `./temp/${mode.text}/user-ids.json`,
  userMapsList: (mode) => `./temp/${mode.text}/user-scores.json`,
  userMapsDates: (mode) => `./temp/${mode.text}/user-scores-dates.json`,
  mapInfoCache: (mode) => `./temp/${mode.text}/map-cache.json`,
  mapsList: (mode) => `./temp/${mode.text}/maps.json`,
  mapsDetailedList: (mode) => `./temp/${mode.text}/maps-detailed.json`,
  ppBlocks: (mode) => `./temp/${mode.text}/pp-blocks.json`,
  dataRankings: (mode) => `./temp/${mode.text}/data-rankings-full.json`,
  mappersPlaycountTxt: (mode) => `./temp/${mode.text}/mappers-playcount.txt`,
  mappersFavsTxt: (mode) => `./temp/${mode.text}/mappers-favs.txt`,
  tenMapsMappersTemp: (mode) => `./temp/${mode.text}/mappers-ten-maps.json`,
  // data folder
  mapsetsCsv: (mode) => `./../data/maps/${mode.text}/mapsets.csv`,
  diffsCsv: (mode) => `./../data/maps/${mode.text}/diffs.csv`,
  beatmapScores: (mode, mapModId) => `./../data/maps/${mode.text}/maps-scores/${mapModId}.json`,
  dataMappers: (mode) => `./../data/mappers/${mode.text}/pp-mappers.json`,
  mappersFavTop: (mode) => `./../data/mappers/${mode.text}/favored-mappers.json`,
  mappersFavTopDetails: (mode, mapperId) =>
    `./../data/mappers/${mode.text}/favored-mappers-maps/${mapperId}.json`,
  dataRankingsCompressed: (mode) => `./../data/ranking/${mode.text}/compressed.json`,
  dataRankingsInfo: (mode) => `./../data/ranking/${mode.text}/map-infos.json`,
  rankingsCsv: (mode) => `./../data/ranking/${mode.text}/players.csv`,
  rankingsPlayerScores: (mode, playerId) =>
    `./../data/ranking/${mode.text}/player-scores/${playerId}.json`,
  metadata: (mode) => `./../data/metadata/${mode.text}/metadata.json`,
};

const uniq = (array, getKey = (item) => item) => {
  const seen = {};
  return array.filter((item) => {
    return seen.hasOwnProperty(getKey(item)) ? false : (seen[getKey(item)] = true);
  });
};

const getDiffHours = (diff) =>
  Math.ceil((Date.now() - new Date(diff.last_updated).getTime()) / 1000 / 60 / 60);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const truncateFloat = (x, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.floor(x * factor) / factor;
};

const runScript = (fileName) => {
  return new Promise((res) => {
    const p = spawn('bash', [fileName], { stdio: 'inherit' });
    p.on('close', (code) => {
      console.log('Script exited with code', code);
      res(code);
    });
  });
};

const filterMods = (modsSum, allowedMods) => {
  const filteredMods = allowedMods.reduce((sum, allowedMod) => {
    return sum + ((modsSum & allowedMod) === allowedMod ? allowedMod : 0);
  }, 0);

  return filteredMods;
};

// Remove mods that don't affect PP
// Allowed mods:
// osu:    DT, HD, HR, FL, HT, EZ, (TouchDevice - not including it yet but it affects PP)
// mania:  EZ, DT, HT
// taiko:  DT, HD, HR, FL, HT, EZ
// fruits: DT, HD, HR, FL, HT, EZ
const simplifyMods = (mods, modeId) => {
  const modsSum = parseInt(mods, 10);
  const allowedMods =
    modeId === modes.mania.id
      ? [modCodes.dt, modCodes.ez, modCodes.ht]
      : [modCodes.dt, modCodes.hd, modCodes.hr, modCodes.fl, modCodes.ht, modCodes.ez];

  return filterMods(modsSum, allowedMods);
};

// Only keeping DT/HT to get overweightness of the base map
const trimModsForRankings = (mods) => {
  const modsSum = parseInt(mods, 10);
  const allowedMods = [modCodes.dt, modCodes.ht];
  return filterMods(modsSum, allowedMods);
};

const modsToString = (mods) => {
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
    .filter((key) => mapMods[key])
    .join('');
};

const modsArrayToBitmask = (mods) => {
  return mods.reduce((mask, mod) => {
    const code = mod === 'NC' ? modCodes.dt : modCodes[mod.toLowerCase()] ?? 0;
    return mask + code;
  }, 0);
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

const parallelRun = async ({
  items,
  job,
  concurrentLimit = 3,
  minRequestTime,
  progress = true,
  onProgress,
}) => {
  const startTime = Date.now();
  const logIndexes = Array(9)
    .fill()
    .map((_x, i) => Math.floor(((i + 1) / 10) * items.length));

  let currentIndex = 0;

  const timeoutId = setTimeout(() => {
    showProgress(currentIndex);
  }, 5000);

  const showProgress = (index) => {
    if (progress) {
      const left = ((Date.now() - startTime) / index) * (items.length - index);
      console.log(
        `${Math.floor((100 * index) / items.length)}% done - ETA ${Math.floor(left / 60000)
          .toString()
          .padStart(2, '0')}:${(Math.floor(left / 1000) % 60).toString().padStart(2, '0')}`
      );
      onProgress && onProgress(index);
    }
  };

  if (concurrentLimit === 1) {
    const results = [];
    for (let index = 0; index < items.length; index++) {
      currentIndex = index;
      const item = items[index];
      if (minRequestTime) {
        const [result] = await Promise.all([job(item), delay(minRequestTime)]);
        results.push(result);
      } else {
        const result = await job(item);
        results.push(result);
      }
      logIndexes.includes(currentIndex) && showProgress(currentIndex);
    }
    clearTimeout(timeoutId);
    return results;
  } else {
    const results = await execute({
      items,
      job: async (item) => {
        currentIndex = items.indexOf(item);
        const result = await job(item);
        logIndexes.includes(currentIndex) && showProgress(currentIndex);
        return result;
      },
      concurrentLimit,
      minJobTime: minRequestTime,
    });
    clearTimeout(timeoutId);
    return results;
  }
};

const writeFileSync = (filePath, ...rest) => {
  const folderPath = path.dirname(filePath);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  fs.writeFileSync(filePath, ...rest);
};

const writeJson = (filePath, data) => {
  const folderPath = path.dirname(filePath);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    stringifyStream(data)
      .pipe(fs.createWriteStream(filePath, 'utf8'))
      .on('finish', () => {
        resolve();
      })
      .on('error', (error) => {
        console.error('ERROR Piping a file', filePath, error);
        reject(error);
      });
  });
};

const readJson = (filePath) => {
  return parseChunked(fs.createReadStream(filePath)).then((res) => {
    return res;
  });
};

module.exports = {
  parallelRun,
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
  writeFileSync,
  writeJson,
  readJson,
  modsArrayToBitmask,
};
