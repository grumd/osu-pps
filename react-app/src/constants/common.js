export const getCookieSearchKey = ({ key, mode }) => `osupps_1.3_key_${key}_mode_${mode}`;
export const modes = {
  osu: {
    text: 'osu',
    id: 0,
  },
  taiko: {
    text: 'taiko',
    id: 1,
  },
  fruits: {
    text: 'fruits',
    id: 2,
  },
  mania: {
    text: 'mania',
    id: 3,
  },
};
export const DEBUG_FETCH = false;
export const API_PREFIX = DEBUG_FETCH
  ? './'
  : 'https://raw.githubusercontent.com/grumd/osu-pps/data/';
