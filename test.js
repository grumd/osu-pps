const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data-mania.json'));
const set = {};
let a = 0,
  b = 0;
data.forEach(i => {
  if ((i.k * 10) % 10 !== 0) {
    console.log(i);
  }
});
// mania.forEach(i => {
//   if (set[i.k]) {
//     set[i.k] += 1;
//   } else {
//     set[i.k] = 1;
//   }
//   if ()
// });
console.log(a, b);
