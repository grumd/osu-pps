const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json'));
module.exports = config;
