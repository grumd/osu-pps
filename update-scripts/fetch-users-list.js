'use strict';

const cheerio = require('cheerio');
const oneLineLog = require('single-line-log').stdout;
const fs = require('fs');

const axios = require('./axios');
const { DEBUG } = require('./constants');
const { uniq, delay, files, writeFileSync } = require('./utils');

const getUsersUrl = (modeText, page, country) =>
  `https://osu.ppy.sh/rankings/${modeText}/performance?page=${page}` +
  (country && !DEBUG ? `&country=${country}` : '');

let idsList = [];
let countriesList = [];

const saveIdsToFile = (mode) => {
  writeFileSync(files.userIdsList(mode), JSON.stringify(idsList));
  writeFileSync(files.userIdsDate(mode), JSON.stringify(new Date()));
};

const fetchCountryPage = (modeText, page, country, retryCount = 0) => {
  if (retryCount > 3) {
    console.log('\nToo many retries, going forward');
    return Promise.reject();
  }
  oneLineLog(`Fetching page #${page} (${modeText})` + (retryCount ? ` Retry #${retryCount}` : ''));
  return axios.get(getUsersUrl(modeText, page, country)).catch((err) => {
    console.log('Error:', err.message);
    console.log(err);
    return delay(10000).then(() => fetchCountryPage(modeText, page, country, retryCount + 1));
  });
};

const startFetchingPages = (modeText, page, country) => {
  return fetchCountryPage(modeText, page, country)
    .then(({ data }) => {
      oneLineLog(`Page #${page} fetched successfully!`);
      return savePage(modeText, data, page, country);
    })
    .catch(() => {
      console.log(`Fetching page #${page} unsuccessful`);
    });
};

const savePage = (modeText, data, page, country) => {
  const $ = cheerio.load(data);
  const users = $('.ranking-page-table__row')
    .map((index, element) => {
      const tableRow = $(element);
      const userLink = tableRow.find('.ranking-page-table__user-link-text');
      return {
        name: userLink.text().trim(),
        id: userLink.attr('data-user-id'),
        pp: parseInt(
          tableRow.find('.ranking-page-table__column--focused').text().replace(/[,.]/g, '').trim(),
          10
        ),
      };
    })
    .get();
  const filteredUsers =
    countriesList.indexOf(country) > 50
      ? users.filter((user) => user.pp > 6000) // for bottom 100 countries we only get top 12k rank people (>6000pp)
      : users.filter((user) => user.pp > 1000); // for top 50 countries we get >1000pp people

  if (!filteredUsers.length) {
    oneLineLog('Didnt find users with enough total pp');
    console.log();
    return Promise.resolve();
  }
  oneLineLog(`Found ${filteredUsers.length} users on page ${page}`);

  idsList = uniq(idsList.concat(filteredUsers), (user) => user.id);
  // idsList = uniq(idsList.concat(getIdList(data)));
  // console.log(`Saved page #${page} for ${country}`);
  if (page >= 200 || DEBUG) {
    oneLineLog(DEBUG ? 'Parsed one page for debug' : '200 pages parsed');
    oneLineLog.clear();
    return Promise.resolve();
  }
  return delay(2000)
    .then(() => startFetchingPages(modeText, page + 1, country))
    .catch((err) => {
      console.log('Error saving list:', err.message);
    });
};

module.exports = (mode) => {
  idsList = [];
  if (!DEBUG) {
    if (fs.existsSync(files.userIdsDate(mode))) {
      try {
        const lastUpdatedDate = JSON.parse(fs.readFileSync(files.userIdsDate(mode)));
        if (new Date() - new Date(lastUpdatedDate) < 14 * 24 * 60 * 60 * 1000) {
          idsList = JSON.parse(fs.readFileSync(files.userIdsList(mode)));
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
    writeFileSync(files.userIdsList(mode), '[]');
  }
  countriesList = JSON.parse(fs.readFileSync(files.countriesList(mode)));
  return countriesList
    .slice(...(DEBUG ? [0, 1] : []))
    .reduce((prevProm, country) => {
      return prevProm
        .then(() => {
          console.log(`Starting to fetch ${country} (${mode.text})`);
        })
        .then(() => startFetchingPages(mode.text, 1, country))
        .then(() => {
          console.log(`\nFinished fetching ${country}`);
          console.log(`Found ${idsList.length} unique users`);
          return delay(5000);
        });
    }, Promise.resolve())
    .then(() => {
      saveIdsToFile(mode);
      console.log(`Done fetching list of users! (${mode.text})`);
    });
};
