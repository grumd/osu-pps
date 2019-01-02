const axios = require('axios');
const instance = axios.create({
  timeout: 15000,
});
module.exports = instance;