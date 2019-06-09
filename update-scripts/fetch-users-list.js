'use strict';

const cheerio = require('cheerio');
const oneLineLog = require('single-line-log').stdout;
const fs = require('fs');

const axios = require('./axios');
const { DEBUG } = require('./constants');
const { uniq, delay, files } = require('./utils');

const getCountriesListUrl = modeText => `https://osu.ppy.sh/rankings/${modeText}/country`;
const getUsersUrl = (modeText, page, country) =>
  `https://osu.ppy.sh/rankings/${modeText}/performance?page=${page}` +
  (country ? `&country=${country}` : '');
// const getIdList = text => text.match(/\/users\/[0-9]+/g).map(uLink => uLink.slice(7));
const getCountriesList = text => text.match(/\?country=[A-Z]{2}/g).map(cLink => cLink.slice(9));
const pageHas1000pp = text => /ranking-page-table__column--focused">\s*\d+,\d+\s*</g.test(text);

let idsList = [];

const saveIdsToFile = mode => {
  fs.writeFileSync(files.userIdsList(mode), JSON.stringify(idsList));
  fs.writeFileSync(files.userIdsDate(mode), JSON.stringify(new Date()));
};

const startFetchingPages = (modeText, page, country) => {
  oneLineLog(`Fetching page #${page} (${modeText})`);
  return axios
    .get(getUsersUrl(modeText, page)) // , country
    .catch(err => {
      console.log('Error:', err.message);
      console.log(err);
      return delay(10000).then(() => startFetchingPages(modeText, page, country));
    })
    .then(({ data }) => {
      oneLineLog(`Page #${page} fetched successfully!`);
      if (!pageHas1000pp(data)) {
        oneLineLog('Users with more than 999pp were not found on page ' + page);
        oneLineLog.clear();
        return Promise.resolve();
      }
      return savePage(modeText, data, page, country);
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
          tableRow
            .find('.ranking-page-table__column--focused')
            .text()
            .replace(/[,.]/g, '')
            .trim(),
          10
        ),
      };
    })
    .get();

  idsList = uniq(idsList.concat(users), user => user.id);
  // idsList = uniq(idsList.concat(getIdList(data)));
  // console.log(`Saved page #${page} for ${country}`);
  if (page >= 200 || DEBUG) {
    oneLineLog(DEBUG ? 'Parsed one page for debug' : '200 pages parsed');
    oneLineLog.clear();
    return Promise.resolve();
  }
  return delay(2000)
    .then(() => startFetchingPages(modeText, page + 1, country))
    .catch(err => {
      console.log('Error saving list:', err.message);
    });
};

module.exports = mode => {
  idsList = [];
  if (!DEBUG) {
    if (fs.existsSync(files.userIdsDate(mode))) {
      try {
        const lastUpdatedDate = JSON.parse(fs.readFileSync(files.userIdsDate(mode)));
        if (new Date() - new Date(lastUpdatedDate) < 14 * 24 * 60 * 60 * 1000) {
          idsList = JSON.parse(fs.readFileSync(files.userIdsList(mode)));
          console.log(
            `Last update for ${mode.text} was at ${lastUpdatedDate}, using cached list with ${
              idsList.length
            } user ids`
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
    fs.writeFileSync(files.userIdsList(mode), '[]');
  }
  return axios
    .get(getCountriesListUrl(mode.text))
    .then(({ data }) => {
      const countriesList = getCountriesList(data);

      return countriesList.slice(...(DEBUG ? [0, 1] : [])).reduce((prevProm, country) => {
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
      }, Promise.resolve());
    })
    .then(() => {
      saveIdsToFile(mode);
      console.log(`Done fetching list of users! (${mode.text})`);
    });
};
