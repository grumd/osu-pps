const fs = require('fs');
const data = JSON.parse(fs.readFileSync('../../data-osu-mappers-favs-top.json', 'utf8'));

const text = data
  .slice(0, 51)
  .map((item) => `${item.names.join('/')}\t${item.count}`)
  .join('\n');

fs.writeFileSync('./top-mappers-fav-by-mappers.txt', text);
