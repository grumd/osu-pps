const config = require('./config');

module.exports = {
  DEBUG: config.debug || process.argv.includes('--debug') || false,
  ppBlockSize: 5,
  ppBlockMapCount: 10,
  modes: {
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
  },
  modCodes: {
    nf: 1,
    ez: 2,
    touch: 4,
    hd: 8,
    hr: 16,
    sd: 32,
    dt: 64,
    relax: 128,
    ht: 256,
    nc: 512,
    fl: 1024,
    autoplay: 2048,
    so: 4096,
    autopilot: 8192,
    pf: 16384,
    key4: 32768,
    key5: 65536,
    key6: 131072,
    key7: 262144,
    key8: 524288,
    fadeIn: 1048576,
    random: 2097152,
    cinema: 4194304,
    target: 8388608,
    key9: 16777216,
    keyCoop: 33554432,
    key1: 67108864,
    key3: 134217728,
    key2: 268435456,
    scoreV2: 536870912,
    lastMod: 1073741824, // Mirror
  },
};
