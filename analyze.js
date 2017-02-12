'use strict';

const axios = require('axios');
const fs = require('fs');

const maps = JSON.parse(fs.readFileSync('result-array.json'));

const sorted = maps.sort((a, b) => b.x - a.x);

console.log(sorted.slice(0,2));
