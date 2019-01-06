const cron = require('node-schedule');
const fs = require('fs');
const { runScript } = require('./utils');

const fetchUsersList = require('./fetch-users-list');
const fetchMapsForUsers = require('./fetch-beatmaps-for-users');
const fetchMapInfo = require('./fetch-map-info');
const calculateTopMappers = require('./top-mappers');

let jobIsRunning = false;

const job = () => {
  if (jobIsRunning) {
    console.log('Updater is already running');
    return;
  }

  jobIsRunning = true;
  return (
    Promise.resolve()
      // return fetchUsersList()
      //   .then(fetchMapsForUsers)
      //   .then(fetchMapInfo)
      .then(calculateTopMappers)
      .then(() => {
        console.log('Saved all info, updating origin');
        // fs.renameSync('./../data.json', './../data-backup.json');
        // fs.renameSync('./result-array-with-info.json', './../data.json');
        fs.renameSync('./temp/data-mappers.json', './../data-mappers.json');
        fs.writeFileSync(
          './../metadata.json',
          JSON.stringify({
            lastUpdated: new Date(),
          })
        );
        return runScript('push.sh');
      })
      .then(text => console.log(text))
      .catch(err => console.error(err))
      .then(() => {
        jobIsRunning = false;
      })
  );
};

console.log('Starting scheduler');
cron.scheduleJob('0 3 * * *', job);
job();
