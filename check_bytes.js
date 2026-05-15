const fs = require('fs');
const buf = fs.readFileSync('app/page.js');
const ctx = buf.slice(32605 - 10, 32605 + 15);
console.log('hex: ', ctx.toString('hex').replace(/(..)/g,'$1 '));
console.log('utf8:', ctx.toString('utf8'));
console.log('© hex:', Buffer.from('©').toString('hex').replace(/(..)/g,'$1 '));

// Fix: replace garbled versions with proper UTF-8
// The original copyright: "NeonTiers © {new Date().getFullYear()}"
// But what's in the file is garbled

// Check exact bytes of the garbled sequence
const garbledSeq = buf.slice(32603, 32610);
console.log('\nGarbled footer (bytes):', garbledSeq.toString('hex').replace(/(..)/g,'$1 '));
console.log('Garbled footer (utf8):', garbledSeq.toString('utf8'));
console.log('Garbled footer (latin1):', garbledSeq.toString('latin1'));
