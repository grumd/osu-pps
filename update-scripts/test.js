// const { parallelRun, delay } = require('./utils');

const { fetchUserBestScores } = require('./apiv2');

const main = async () => {
  const data = await fetchUserBestScores(15225195, 'mania', 10);
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
