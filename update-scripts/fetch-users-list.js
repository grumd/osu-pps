'use strict';

const axios = require('axios');
const fs = require('fs');
const { idsFileName } = require('./constants');
const { uniq, delay } = require('./utils');

const countriesListUrl = 'https://osu.ppy.sh/rankings/osu/country';
const getUsersUrl = (page, country) => `https://osu.ppy.sh/rankings/osu/performance?page=${page}` + (country ? `&country=${country}` : '');
const getIdList = (text) => text.match(/\/users\/[0-9]+/g).map(uLink => uLink.slice(7));
const getCountriesList = (text) => text.match(/\?country=[A-Z]{2}/g).map(cLink => cLink.slice(9));
const pageHas1000pp = (text) => /ranking-page-table__column--focused">\s*\d+,\d+\s*</g.test(text);

const saveIds = (list) => {
  if (fs.existsSync(idsFileName)) {
    const oldList = JSON.parse(fs.readFileSync(idsFileName));
    const newList = uniq(oldList.concat(list));
    fs.writeFileSync(idsFileName, JSON.stringify(newList));
  } else {
    fs.writeFileSync(idsFileName, JSON.stringify(list));
  }
}

const startFetchingPages = (page, country) => {
  return axios.get(getUsersUrl(page, country))
    .catch((err) => {
      console.log('Error:', err.message);
      console.log(err);
      return delay(5000)
        .then(() => startFetchingPages(page, country));
    })
    .then(({ data }) => {
      if (!pageHas1000pp(data)) {
        console.log('Users with more than 999pp were not found on this page');
        return Promise.resolve();
      }
      return savePage(data, page, country);
    });
};

const savePage = (data, page, country) => {
  saveIds(getIdList(data));
  console.log(`Saved page #${page} for ${country}`);
  if (page >= 200) {
    return Promise.resolve();
  }
  return delay(500)
    .then(() => startFetchingPages(page + 1, country))
    .catch((err) => {
      console.log('Error saving list:', err.message);
    });
}

module.exports = () => {
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
              console.log(`Finished fetching ${country}`);
              return delay(1000);
            })
        }, Promise.resolve());
    })
    .then(() => {
      console.log('Finished all countries!');
    });
}
