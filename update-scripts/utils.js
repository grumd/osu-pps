const exec = require('child_process').exec;

const files = {
  userIdsList: mode => `./temp/${mode.text}/user-ids.json`,
  userIdsDate: mode => `./temp/${mode.text}/user-ids-date.json`,
  mapInfoCache: mode => `./temp/${mode.text}/map-cache.json`,
  mapsList: mode => `./temp/${mode.text}/maps.json`,
  mapsDetailedList: mode => `./temp/${mode.text}/maps-detailed.json`,
  mappersList: mode => `./temp/${mode.text}/mappers.json`,
  ppBlocks: mode => `./temp/${mode.text}/pp-blocks.json`,
};

const uniq = a => {
  const seen = {};
  return a.filter(item => {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
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
};
