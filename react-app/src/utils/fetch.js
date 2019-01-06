export const fetchJson = async ({ url }) => {
  try {
    const response = await fetch(url);
    if (response.status >= 200 && response.status < 300) {
      const data = await response.json();
      return data;
    } else {
      throw Error('HTTP Status ' + response.status);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};
