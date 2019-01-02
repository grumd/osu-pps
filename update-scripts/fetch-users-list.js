'use strict';

const axios = require('./axios');
const oneLineLog = require('single-line-log').stdout;
const fs = require('fs');
const { idsFileName, idsDateFileName } = require('./constants');
const { uniq, delay } = require('./utils');

const countriesListUrl = 'https://osu.ppy.sh/rankings/osu/country';
const getUsersUrl = (page, country) => `https://osu.ppy.sh/rankings/osu/performance?page=${page}` + (country ? `&country=${country}` : '');
const getIdList = (text) => text.match(/\/users\/[0-9]+/g).map(uLink => uLink.slice(7));
const getCountriesList = (text) => text.match(/\?country=[A-Z]{2}/g).map(cLink => cLink.slice(9));
const pageHas1000pp = (text) => /ranking-page-table__column--focused">\s*\d+,\d+\s*</g.test(text);

let idsList = [];

const saveIdsToFile = () => {
  fs.writeFileSync(idsFileName, JSON.stringify(idsList));
  fs.writeFileSync(idsDateFileName, JSON.stringify(new Date()));
}

const addIdsToList = (list) => {
  idsList = uniq(idsList.concat(list));
}

const startFetchingPages = (page, country) => {
  oneLineLog(`Fetching page #${page}`);
  return axios.get(getUsersUrl(page, country))
    .catch((err) => {
      console.log('Error:', err.message);
      console.log(err);
      return delay(10000)
        .then(() => startFetchingPages(page, country));
    })
    .then(({ data }) => {
      oneLineLog(`Page #${page} fetched successfully!`);
      if (!pageHas1000pp(data)) {
        oneLineLog('Users with more than 999pp were not found on page ' + page);
        oneLineLog.clear();
        return Promise.resolve();
      }
      return savePage(data, page, country);
    });
};

const savePage = (data, page, country) => {
  addIdsToList(getIdList(data));
  // console.log(`Saved page #${page} for ${country}`);
  if (page >= 200) {
    oneLineLog('200 pages parsed');
    oneLineLog.clear();
    return Promise.resolve();
  }
  return delay(2000)
    .then(() => startFetchingPages(page + 1, country))
    .catch((err) => {
      console.log('Error saving list:', err.message);
    });
}

module.exports = () => {
  idsList = [];
  if (fs.existsSync(idsDateFileName)) {
    try {
      const lastUpdatedDate = JSON.parse(fs.readFileSync(idsDateFileName));
      if (new Date() - new Date(lastUpdatedDate) < 14 * 24 * 60 * 60 * 1000) {
        idsList = JSON.parse(fs.readFileSync(idsFileName));
        console.log(`Last update was at ${lastUpdatedDate}, using cached list with ${idsList.length} user ids`);
        return Promise.resolve();
      }
      console.log(`Last update was at ${lastUpdatedDate}`);
    } catch(e) {
      console.log('Error checking ids date', e);
    }
  } else {
    console.log(`Ids backup not found`);
  }
  console.log(`Clearing old user IDs list`);
  fs.writeFileSync(idsFileName, '[]');
  return axios.get(countriesListUrl)
    .then(({ data }) => {
      const countriesList = getCountriesList(data);

      return countriesList
        // .slice(0, 1)
        .reduce((prevProm, country) => {
          return prevProm
            .then(() => {
              console.log(`Starting to fetch ${country}`);
            })
            .then(() => startFetchingPages(1, country))
            .then(() => {
              console.log(`\nFinished fetching ${country}`);
              console.log(`Found ${idsList.length} unique users`);
              return delay(5000);
            })
        }, Promise.resolve());
    })
    .then(() => {
      saveIdsToFile();
      console.log('Finished all countries!');
    });
}
