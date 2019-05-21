const cron = require('node-schedule');
const fs = require('fs');
const { runScript, files } = require('./utils');
const { modes, DEBUG } = require('./constants');

const fetchUsersList = require('./fetch-users-list');
const fetchMapsForUsers = require('./fetch-beatmaps-for-users');
const fetchMapInfo = require('./fetch-map-info');
const calculateTopMappers = require('./top-mappers');

let jobIsRunning = false;

const updateModeData = (mode = modes.osu) => {
  return Promise.resolve()
    .then(() => fetchUsersList(mode))
    .then(() => fetchMapsForUsers(mode))
    .then(() => fetchMapInfo(mode))
    .then(() => calculateTopMappers(mode))
    .then(() => {
      if (fs.existsSync(`./../data-${mode.text}.json`)) {
        fs.renameSync(`./../data-${mode.text}.json`, `./../data-${mode.text}-backup.json`);
      }
      fs.renameSync(files.mapsDetailedList(mode), `./../data-${mode.text}.json`);
      fs.renameSync(files.mappersList(mode), `./../data-${mode.text}-mappers.json`);
      fs.writeFileSync(
        `./../metadata-${mode.text}.json`,
        JSON.stringify({
          lastUpdated: new Date(),
        })
      );
      if (!DEBUG) {
        console.log('Saved all info, updating origin');
        return runScript('push.sh');
      } else {
        console.log('Saved all info, debug is on - not updating origin');
      }
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));
};

const job = () => {
  if (jobIsRunning) {
    console.log('Updater is already running');
    return;
  }

  jobIsRunning = true;
  return Promise.resolve()
    .then(() => updateModeData(modes.mania))
    .then(() => updateModeData(modes.osu))
    .then(() => updateModeData(modes.taiko))
    .then(() => updateModeData(modes.fruits))
    .then(() => {
      jobIsRunning = false;
    });
};

console.log('Starting scheduler');
cron.scheduleJob('0 3 * * *', job);
job();
