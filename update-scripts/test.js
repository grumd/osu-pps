// const { parallelRun, delay } = require('./utils');

const { fetchBeatmap } = require('./apiv2');

const logMemory = () => {
  console.log(process.memoryUsage().heapUsed / 1024 / 1024, 'mb');
};

const main = async () => {
  const data = await fetchBeatmap(1988753);

  console.log(data.data.beatmapset.covers);
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
