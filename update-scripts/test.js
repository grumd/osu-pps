// const { parallelRun, delay } = require('./utils');

const { fetchBeatmap } = require('./apiv2');

const main = async () => {
  const data = await fetchBeatmap(3996492);
  console.log(data.data);
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
