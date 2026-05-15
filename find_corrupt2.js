const fs = require('fs');
const buf = fs.readFileSync('app/page.js');

// The garbled sequences we found:
// 1. At original 6 positions: E2 94 9C C4 BE → C3 96 (Ö) [already fixed]
// 2. At offset 10879: E2 94 BC C4 B9 → ??? (should be ő = C5 91)
// 3. At offset 32605: E2 94 AC C4 99 → ??? (should be © = C2 A9)

// Let's scan what chars got corrupted by looking at context
const all3Byte = [];
for (let i = 0; i < buf.length - 2; i++) {
  if (buf[i] === 0xE2 && buf[i + 1] === 0x94) {
    const seq = Buffer.from([buf[i], buf[i + 1], buf[i + 2]]);
    const start = Math.max(0, i - 5);
    const end = Math.min(buf.length, i + 10);
    const ctx = buf.slice(start, end).toString('utf8').replace(/\r?\n/g, '[LF]');
    all3Byte.push({ offset: i, prefix: i > 0 ? buf[i-1] : 0, seq: seq.toString('hex'), ctx, nextByte: buf[i+3] });
  }
}
console.log('All E2 94 XX sequences:');
for (const e of all3Byte) {
  console.log(`  offset ${e.offset}: hex=${e.seq} prefix_byte=0x${e.prefix.toString(16)} next=0x${(e.nextByte||0).toString(16)} ctx="${e.ctx}"`);
}
