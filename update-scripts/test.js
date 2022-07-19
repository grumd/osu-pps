const { files, readJson, writeJson } = require('./utils');
const { modes } = require('./constants');
const fs = require('fs');

const main = async () => {
  if (fs.existsSync(files.ppBlocks(modes.mania))) {
    try {
      console.log('READ START');
      await readJson(files.ppBlocks(modes.mania));
      console.log('READ END');
    } catch (e) {
      console.log('Error parsing ' + files.ppBlocks(modes.mania));
    }
  }

  console.log('WRITE START');
  await writeJson('./temp/sss/www/test.json', 'test');
  console.log('WRITE END');
};

main();
