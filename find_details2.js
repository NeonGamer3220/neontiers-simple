const fs = require('fs');
const b = fs.readFileSync('app/page.js');
// Collect ALL positions where a >0x7F byte appears, grouped by contiguous non-ASCII runs
let i = 0;
const runs = [];
while (i < b.length) {
  if (b[i] <= 0x7F) { i++; continue; }
  const runStart = i;
  while (i < b.length && b[i] > 0x7F) i++;
  const runEnd = i;
  const raw = b.slice(runStart, runEnd);
  const decoded = raw.toString('utf8');
  const hex = [];
  for (let j = runStart; j < runEnd; j++) hex.push('0x' + b[j].toString(16).padStart(2,'0'));
  const ctxStart = Math.max(0, runStart - 10);
  const ctxEnd = Math.min(b.length, runEnd + 10);
  const ctxRaw = b.slice(ctxStart, ctxEnd).toString('utf8').replace(/\r?\n/g, '[LF]');
  const ctxJSON = JSON.stringify(b.slice(runStart, Math.min(b.length, runStart+1)).toString('utf8'));
  runs.push({ runStart, runEnd, decoded, hex: hex.join(' '), ctxStart, ctxJSON, ctx: ctxRaw });
}
// Deduplicate identical payloads, keep unique key by runStart
const seen = new Set();
let firstBoxDraw = null;
for (const r of runs) {
  if (r.decoded === '\uFEFF' || r.decoded === '—' || r.decoded === '•') continue;
  const key = r.runStart;
  if (seen.has(key)) continue;
  seen.add(key);
  const hi = r.hex.indexOf('e2'); 
  if (!firstBoxDraw && hi >= 0 && r.hex.charAt(hi+1)&& r.hex.split(' ')[hi+1]==='0x94') {
    firstBoxDraw = r.runStart;
  }
}
// Now print only box-drawing (E2 94xx) and any non-standard multi-byte looks
console.log('=== ALL non-ASCII multi-byte runs ===\n');
for (const r of runs) {
  const key = r.runStart;
  if (seen.has(key) && runs.indexOf(r) < runs.length && r.hex.startsWith('0xe2')) {
    console.log('Offset ' + r.runStart + ':');
    console.log('  decoded: ' + JSON.stringify(r.decoded));
    console.log('  hex:     ' + r.hex);
    console.log('  context: ' + r.ctx);
    console.log();
  }
}
console.log('\n=== Checking for 0xC0-0xC1 (invalid lead bytes) ===\n');
for (let j = 0; j < b.length; j++) {
  if (b[j] >= 0xC0 && b[j] <= 0xC1) {
    console.log('INVALID LEAD BYTE at offset ' + j + ': 0x' + b[j].toString(16));
  }
}
