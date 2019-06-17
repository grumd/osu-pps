/* eslint-disable eqeqeq */
export const modsToString = mods => {
  const mod = parseInt(mods, 10);
  const mapMods = {
    EZ: (mod & 2) == 2,
    NF: (mod & 1) == 1,
    HD: (mod & 8) == 8,
    DT: (mod & 64) == 64 && (mod & 512) != 512, // Remove DT if NC is on (keep NC)
    NC: (mod & 512) == 512,
    HT: (mod & 256) == 256,
    HR: (mod & 16) == 16,
    FL: (mod & 1024) == 1024,
    SD: (mod & 32) == 32,
    SO: (mod & 4096) == 4096,
    PF: (mod & 16384) == 16384,
  };
  return Object.keys(mapMods)
    .filter(key => mapMods[key])
    .join('');
};
