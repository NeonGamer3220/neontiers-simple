const fs = require('fs');
const b = fs.readFileSync('app/page.js');
const interestOffsets = [0, 197, 10879, 10882, 12749, 15871, 25933, 32605];
const sorted = interestOffsets.sort((a,b)=>a-b);
for (const o of sorted) {
  if (o >= b.length) { console.log('offset '+o+' is out of bounds'); continue; }
  const start = Math.max(0, o-4);
  const end = Math.min(b.length, o+10);
  const ctx = b.slice(start, end).toString('utf8').replace(/\r?\n/g, '[LF]');
  console.log('--- offset ' + o + ' ---');
  console.log('  ctx: ' + JSON.stringify(ctx));
  for (let i = o; i < end;) {
    console.log('  [' + i + ']: 0x' + b[i].toString(16).padStart(2,'0'));
    if (b[i] <= 0x7F) i++; else if (b[i] <= 0xDF) i+=2; else if (b[i] <= 0xEF) i+=3; else if (b[i] <= 0xF7) i+=4; else i++;
  }
}
