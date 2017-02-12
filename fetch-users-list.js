'use strict';

const axios = require('axios');
const fs = require('fs');

const getUsersUrl = (page) => `https://osu.ppy.sh/p/pp/?m=0&s=3&o=1&f=&page=${page}`;
const getIdList = (text) => text.match(/\/u\/[0-9]+/g).map(uLink => uLink.slice(3));

const saveIds = (list, fileName = 'ids.json') => {
  if (fs.existsSync(fileName)) {
    const oldList = JSON.parse(fs.readFileSync(fileName));
    fs.writeFileSync(fileName, JSON.stringify(oldList.concat(list)));
  } else {
    fs.writeFileSync(fileName, JSON.stringify(list));
  }
}

const startFetchingPages = (page = 1) => {
  axios.get(getUsersUrl(page))
    .catch((err) => {
      console.log('Error:', err.message);
      setTimeout(() => {
        startFetchingPages(page);
      }, 5000);
    })
    .then(({ data }) => savePage(data, page));
};

const savePage = (data, page) => {
  return new Promise((res) => {
    saveIds(getIdList(data));
    console.log(`Saved page #${page}`);
    res();
  })
    .then(() => {
      setTimeout(() => {
        startFetchingPages(page + 1);
      }, 300);
    })
    .catch((err) => {
      console.log('Error saving list:', err.message);
    });
}

startFetchingPages();
