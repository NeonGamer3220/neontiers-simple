const fs = require('fs');
const p = 'app/page.js';
const buf = fs.readFileSync(p);

// Copyright symbol © = C2 A9
// Garbled version that's in the file now: 0xE2 0x94 0xAC 0xC4 0x99
const bad = Buffer.from([0xE2, 0x94, 0xAC, 0xC4, 0x99]);
const good = Buffer.from([0xC2, 0xA9]);
const arr = [];
let i = 0;
let count = 0;
while (i < buf.length) {
  if (i <= buf.length - bad.length && buf.slice(i, i + bad.length).compare(bad) === 0) {
    arr.push(Buffer.from(good));
    count++;
    i += bad.length;
  } else {
    arr.push(Buffer.from([buf[i]]));
    i++;
  }
}
const result = Buffer.concat(arr);
fs.writeFileSync(p, result, 'utf8');
console.log('Replaced', count, 'of corrupted © symbols');

// Verify no more bad bytes
let remaining = 0;
let j = 0;
while (j < result.length - bad.length + 1) {
  if (result.slice(j, j + bad.length).compare(bad) === 0) remaining++;
  j++;
}
console.log('Remaining bad ©:', remaining);
