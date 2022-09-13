'use strict';

const fs = require('fs');

const { fetchCountryRanking } = require('./apiv2');
const { DEBUG } = require('./constants');
const { uniq, delay, files, writeJson, readJson } = require('./utils');

module.exports = async (mode) => {
  let idsList = [];
  let countriesList = [];

  const fetchCountry = async (modeText, country) => {
    const data = await fetchCountryRanking(modeText, country);
    idsList = uniq(
      idsList.concat(data.ranking.map((d) => ({ name: d.user.username, id: d.user.id, pp: d.pp }))),
      (user) => user.id
    );
  };

  const saveIdsToFile = async (mode) => {
    await writeJson(files.userIdsList(mode), idsList);
    await writeJson(files.userIdsDate(mode), new Date());
  };

  if (!DEBUG) {
    if (fs.existsSync(files.userIdsDate(mode))) {
      try {
        const lastUpdatedDate = await readJson(files.userIdsDate(mode));
        if (new Date() - new Date(lastUpdatedDate) < 14 * 24 * 60 * 60 * 1000) {
          idsList = await readJson(files.userIdsList(mode));
          console.log(
            `Last update for ${mode.text} was at ${lastUpdatedDate}, using cached list with ${idsList.length} user ids`
          );
          return Promise.resolve();
        }
        console.log(`Last update was at ${lastUpdatedDate}`);
      } catch (e) {
        console.log('Error checking ids date', e);
      }
    } else {
      console.log(`Ids backup not found`);
    }
    console.log(`Clearing old user IDs list`);
    await writeJson(files.userIdsList(mode), []);
  }
  countriesList = await readJson(files.countriesList(mode));
  console.log(`Fetching countries for ${mode.text}...`);
  await countriesList.slice(...(DEBUG ? [0, 1] : [0, 60])).reduce(async (prevProm, country) => {
    await prevProm;
    await fetchCountry(mode.text, country);
    console.log(`Found ${idsList.length} unique users in ${country}`);
    await delay(5000);
  }, Promise.resolve());

  await saveIdsToFile(mode);
  console.log(`Done fetching list of users! (${mode.text})`);
};
