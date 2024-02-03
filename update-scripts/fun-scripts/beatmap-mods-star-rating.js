const { parallelRun, delay } = require('../utils');

const { fetchBeatmapAttributes } = require('../apiv2');

const main = async () => {
  let data = await fetchBeatmapAttributes(1857434, { rulesetId: 0 });
  console.log(data.data);

  await delay(300);

  data = await fetchBeatmapAttributes(1857434, { mods: ['HD'], rulesetId: 0 });
  console.log(data.data);

  // await delay(300);

  // data = await fetchBeatmapAttributes(1857434, { mods: ['HR'], rulesetId: 0 });
  // console.log(data.data);

  // await delay(300);

  // data = await fetchBeatmapAttributes(1857434, { mods: ['DT', 'HR'], rulesetId: 0 });
  // console.log(data.data);

  // await delay(300);

  // data = await fetchBeatmapAttributes(1857434, { mods: ['DT', 'HR'], rulesetId: 0 });
  // console.log(data.data);

  // const arr = Array(500)
  //   .fill(null)
  //   .map(() => ({ foo: 'foo' }));

  // console.log('Initial');
  // logMemory();

  // const results = await parallelRun({
  //   items: arr,
  //   concurrentLimit: 1,
  //   minRequestTime: 0,
  //   job: () => Promise.resolve({ bar: 'bar' }),
  //   onProgress: () => {
  //     logMemory();
  //   },
  // });

  // console.log('Final');
  // logMemory();
  // // console.log(results);
  // console.log(results.length, arr.length);
};

main();
