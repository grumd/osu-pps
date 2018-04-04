const exec = require('child_process').exec;

const uniq = (a) => {
  const seen = {};
  return a.filter((item) => {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

const truncateFloat = (x) => Math.floor(x * 100) / 100;

const runScript = (fileName, cb) => {
  return new Promise((res, rej) => {
    exec(`bash ${fileName}`, (err, stdout, stderr) => {
        if (err) {
          rej(new Error(err));
        } else if (typeof stderr !== "string") {
          rej(new Error(stderr));
        } else {
          res(stdout);
        }
    });
  });
}

module.exports = {
  delay,
  uniq,
  truncateFloat,
  runScript,
};
