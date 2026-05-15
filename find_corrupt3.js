const fs = require('fs');
const buf = fs.readFileSync('app/page.js');
for (let i = 0; i < buf.length - 2; i++) {
  if (buf[i] === 0xE2 && buf[i+1] === 0x94) {
    const start = Math.max(0, i-5);
    const end = Math.min(buf.length, i+10);
    const ctx = buf.slice(start, end).toString('utf8').replace(/\r?\n/g, '[LF]');
    console.log(`Offset ${i}: 0x${buf[i].toString(16)} 0x${buf[i+1].toString(16)} 0x${buf[i+2].toString(16)}  -> "${ctx}"`);
  }
}
