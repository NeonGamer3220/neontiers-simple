const fs = require('fs');
const buf = fs.readFileSync('app/page.js');
// F┼Ĺoldal → Főoldal : 5 bytes E2 94 BC C4 B9 → C5 91
const bad = Buffer.from([0xE2, 0x94, 0xBC, 0xC4, 0xB9]);
const good = Buffer.from([0xC5, 0x91]);
const arr = [];
let i = 0, count = 0;
while (i < buf.length) {
  if (i <= buf.length - bad.length && buf.slice(i, i + bad.length).compare(bad) === 0) {
    arr.push(Buffer.from(good));
    count++; i += bad.length;
  } else {
    arr.push(Buffer.from([buf[i]]));
    i++;
  }
}
fs.writeFileSync('app/page.js', Buffer.concat(arr), 'utf8');
console.log('Fixed', count, 'garbled "ő" → "ő" (Fő)');
