const fs = require('fs');
const buf = fs.readFileSync('app/page.js');
const offset = 10879;
const ctx2 = buf.slice(offset - 5, offset + 15);
console.log('Offset 10879 ±5:');
console.log('hex: ', ctx2.toString('hex').replace(/(..)/g,'$1 '));
console.log('utf8:', ctx2.toString('utf8'));
console.log('');
// Check what actual bytes are there
for (let z = 0; z < ctx2.length; z++) {
  console.log('  byte[' + z + ']=', '0x' + ctx2[z].toString(16).toUpperCase().padStart(2, '0'), 'char:', ctx2[z]);
}
