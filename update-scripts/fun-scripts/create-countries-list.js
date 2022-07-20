'use strict';
const fs = require('fs');
const axios = require('./axios');

const getCountriesListUrl = (modeText, page) =>
  `https://osu.ppy.sh/rankings/${modeText}/country?page=` + page;
const getCountriesList = text => text.match(/\?country=[A-Z]{2}/g).map(cLink => cLink.slice(9));

let list = [];

[1, 2, 3].reduce(async (prom, page) => {
  await prom;
  await axios.get(getCountriesListUrl('mania', page)).then(({ data }) => {
    const countriesList = getCountriesList(data);
    list = list.concat(countriesList);
    fs.writeFileSync('./countries-mania.json', JSON.stringify(list));
    console.log(countriesList[0], list.length);
  });
}, Promise.resolve());
