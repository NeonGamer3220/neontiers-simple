const fs = require('fs');
const b = fs.readFileSync('app/page.js');
let i = 0;
let idx = 0;
const seen = new Set();
console.log('All non-ASCII multi-byte UTF-8 runs with character identity:\n');
while (i < b.length) {
  if (b[i] <= 0x7F) { i++; continue; }
  const start = i;
  // skip expected leading bytes
  while (i < b.length && b[i] > 0x7F) i++;
  const end = i;
  const key = start;
  if (seen.has(key)) continue;
  seen.add(key);
  const bytes = [];
  for (let j = start; j < end; j++) bytes.push('0x' + b[j].toString(16).padStart(2,'0'));
  const decoded = b.slice(start, end).toString('utf8');
  // compute context
  const s = Math.max(0, start - 12);
  const e = Math.min(b.length, end + 6);
  const ctx = b.slice(s, e).toString('utf8').replace(/\r?\n/g, '↵').replace(/\t/g, '→');
  const box = decoded === '─' || decoded === '│' || decoded === '┼' || decoded === '├' || decoded === '┤' || decoded === '┬' || decoded === '┴' || decoded === '┼' || decoded === '╭' || decoded === '╮' || decoded === '╯' || decoded === '╰' || decoded.charCodeAt(0) >= 0x2500 && decoded.charCodeAt(0) <= 0x257F;
  if (decoded === '\uFEFF') continue; // BOM
  if (start === 197 || start === 10879) {
    console.log('*** KNOWN HIT ***');
  }
  console.log('Offset ' + start + ':');
  console.log('  decoded char: U+' + decoded.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0') + ' "' + decoded + '"');
  console.log('  bytes:        ' + bytes.join(' '));
  console.log('  context:      ' + JSON.stringify(ctx));
  if (box) console.log('  !!! BOX-DRAWING CHARACTER !!!');
  console.log();
}
console.log('\nTotal runs found: ' + seen.size);
