const { parallelRun, delay } = require('./utils');

const logMemory = () => {
  console.log(process.memoryUsage().heapUsed / 1024 / 1024, 'mb');
};

const main = async () => {
  const arr = Array(500)
    .fill(null)
    .map(() => ({ foo: 'foo' }));

  console.log('Initial');
  logMemory();

  const results = await parallelRun({
    items: arr,
    concurrentLimit: 1,
    minRequestTime: 0,
    job: () => Promise.resolve({ bar: 'bar' }),
    onProgress: () => {
      logMemory();
    },
  });

  console.log('Final');
  logMemory();
  // console.log(results);
  console.log(results.length, arr.length);
};

logMemory();
main();

setTimeout(() => {
  logMemory();
}, 15000);
