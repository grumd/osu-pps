'use strict';

const axios = require('axios');
const fs = require('fs');

const delay = ms => new Promise(r => setTimeout(r, ms));

const countriesListUrl = 'https://osu.ppy.sh/p/countryranking';
const getUsersUrl = (page, country) => `https://osu.ppy.sh/p/pp/?m=0&s=3&o=1&f=&page=${page}` + (country ? `&c=${country}` : '');
const getIdList = (text) => text.match(/\/u\/[0-9]+/g).map(uLink => uLink.slice(3));

const uniq = (a) => {
  const seen = {};
  return a.filter((item) => {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

const saveIds = (list, fileName = 'ids.json') => {
  if (fs.existsSync(fileName)) {
    const oldList = JSON.parse(fs.readFileSync(fileName));
    const newList = uniq(oldList.concat(list));
    fs.writeFileSync(fileName, JSON.stringify(newList));
  } else {
    fs.writeFileSync(fileName, JSON.stringify(list));
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
      const has1000pp = data.match(/\d+,\d+pp/g);
      if (!has1000pp) {
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
  return delay(300)
    .then(() => startFetchingPages(page + 1, country))
    .catch((err) => {
      console.log('Error saving list:', err.message);
    });
}

axios.get(countriesListUrl)
  .then(({ data }) => {
    const countriesList = data.match(/\?c=[A-Z]{2}/g).map(cLink => cLink.slice(3));

    return countriesList
      // .slice(8) // Pass first 7 countries
      .reduce((prevProm, country) => {
        return prevProm
          .then(() => {
            console.log(`Starting to fetch ${country}`);
          })
          .then(() => startFetchingPages(1, country))
          .then(() => {
            console.log(`Finished fetching ${country}. Will resume in 5 secs`);
            return delay(5000);
          })
      }, Promise.resolve());
  })
  .then(() => {
    console.log('Finished all countries!');
  });

