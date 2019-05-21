const axios = require('axios');

const config = {
  timeout: 10000,
};

// const instance = axios.create(config);

const axiosGet = (url, options = {}) => {
  const abort = axios.CancelToken.source();
  const id = setTimeout(() => abort.cancel(`Timeout of ${config.timeout}ms.`), config.timeout);
  return axios.get(url, { cancelToken: abort.token, ...options }).then(response => {
    clearTimeout(id);
    return response;
  });
};

module.exports = { get: axiosGet };
