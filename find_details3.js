const fs = require('fs');
const b = fs.readFileSync('app/page.js');
console.log('file length:', b.length);
// Show the byte stream around offsets 197 and 10879 in hex+ascii
function hexDump(buf, off, len) {
  const end = Math.min(buf.length, off + len);
  for (let i = off; i < end; i++) {
    const c = b[i];
    const ch = c >= 32 && c < 127 ? String.fromCharCode(c) : '.';
    process.stdout.write(('0x' + c.toString(16).padStart(2,'0') + '(' + ch + ') ').padStart(20));
    if ((i - off + 1) % 8 === 0) process.stdout.write('  ');
    if ((i - off + 1) % 16 === 0) process.stdout.write('\n');
  }
  process.stdout.write('\n');
}
console.log('\n--- Hex dump around offset 197 (Ő in Összes) ---');
hexDump(b, 190, 30);
console.log('\n--- Hex dump around offset 10879 (corrupted Főldal) ---');
hexDump(b, 10874, 30);
console.log('\n--- Decoded window around offset 197 ---');
const w197 = b.slice(185, 210).toString('utf8');
console.log(JSON.stringify(w197));
console.log('\n--- Decoded window around offset 10879 ---');
const w10879 = b.slice(10874, 10899).toString('utf8');
console.log(JSON.stringify(w10879));
