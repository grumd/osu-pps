const cron = require('node-schedule');
const fs = require('fs');
const { runScript } = require('./utils');

const fetchUsersList = require('./fetch-users-list');
const fetchMapsForUsers = require('./fetch-beatmaps-for-users');
const fetchMapInfo = require('./fetch-map-info');
const calculateTopMappers = require('./top-mappers');
const { modeNames } = require('./constants');

const config = JSON.parse(fs.readFileSync("config.json"));
const mode = config.mode || 0;
const generateOnly = config.generateOnly || false;

let jobIsRunning = false;

const job = () => {
  if (jobIsRunning) {
    console.log('Updater is already running');
    return;
  }

  jobIsRunning = true;
  return Promise.resolve()
    .then(fetchUsersList)
    .then(fetchMapsForUsers)
    .then(fetchMapInfo)
    .then(calculateTopMappers)
    .then(() => {
      console.log('Saved all info, updating origin');

      const suffix = mode ? '-' + modeNames[mode] : '';

      if (fs.existsSync(`./../data${suffix}.json`))
        fs.renameSync(`./../data${suffix}.json`, `./../data-backup${suffix}.json`);

      fs.renameSync('./result-array-with-info.json', `./../data${suffix}.json`);
      fs.renameSync('./temp/data-mappers.json', `./../data-mappers${suffix}.json`);
      fs.writeFileSync(
        `./../metadata${suffix}.json`,
        JSON.stringify({
          lastUpdated: new Date(),
        })
      );

      if (!generateOnly)
        return runScript('push.sh');
    })
    .then(text => console.log(text))
    .catch(err => console.error(err))
    .then(() => {
      jobIsRunning = false;
    });
};

console.log('Starting scheduler');
if (!generateOnly)
  cron.scheduleJob('0 3 * * *', job);

job();
