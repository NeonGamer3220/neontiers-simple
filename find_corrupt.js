const fs = require('fs');
const buf = fs.readFileSync('app/page.js');
const corruptionMap = new Map();

// Collect all E2 94 XX sequences
const sections = [];
for (let i = 0; i < buf.length - 2; i++) {
  if (buf[i] === 0xE2 && buf[i + 1] === 0x94) {
    const seq = Buffer.from([buf[i], buf[i + 1], buf[i + 2]]);
    const key = seq.toString('hex');
    if (!corruptionMap.has(key)) {
      corruptionMap.set(key, []);
    }
    corruptionMap.get(key).push(i);
  }
}
console.log('All 0xE2 0x94 XX sequences:');
for (const [key, offsets] of corruptionMap) {
  console.log(`  0x${key}: ${offsets.length} occurrences at offsets ${offsets.join(', ')}`);
  if (offsets.length > 0) {
    const o = offsets[0];
    const ctx = buf.slice(Math.max(0, o - 15), Math.min(buf.length, o + 15));
    console.log('    context:', ctx.toString('utf8').replace(/\r?\n/g, '[LF]'));
  }
}
