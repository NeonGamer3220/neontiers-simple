const fs = require('fs');
const buf = fs.readFileSync('app/page.js');

// ─────────── helpers ────────────
function scanAndFix(prefix, replacement) {
  const bad = Buffer.from(prefix);
  const good = Buffer.from(replacement);
  let count = 0;
  const arr = [];
  let i = 0;
  while (i < buf.length) {
    if (i <= buf.length - bad.length && buf.slice(i, i + bad.length).compare(bad) === 0) {
      arr.push(Buffer.from(good));
      count++;
      i += bad.length;
    } else {
      arr.push(Buffer.from([buf[i]]));
      i++;
    }
  }
  return { result: Buffer.concat(arr), count };
}

// ─────────── scan all 3-byte ├ sequences ────────────
const threeByteGarbled = [];
for (let i = 0; i < buf.length - 2; i++) {
  if (buf[i] === 0xE2 && buf[i + 1] === 0x94 && buf[i + 2] === 0x9C) {
    threeByteGarbled.push(i);
  }
}
console.log('3-byte ├ box-drawing prefixes found at offsets:', threeByteGarbled.length);

// ─────────── scan all 5-byte ├Ö patterns ────────────
const bad = Buffer.from([0xE2, 0x94, 0x9C, 0xC4, 0xBE]); // "├Ö"
const good = Buffer.from([0xC3, 0x96]); // "Ö"
let totalReplaced = 0;

function replaceBuffer(original, pattern, replacement) {
  const out = [];
  let i = 0;
  while (i < original.length) {
    if (i <= original.length - pattern.length &&
        original.slice(i, i + pattern.length).compare(pattern) === 0) {
      out.push(Buffer.from(replacement));
      i += pattern.length;
    } else {
      out.push(Buffer.from([original[i]]));
      i++;
    }
  }
  return Buffer.concat(out);
}

let result = buf;
const garbledPatterns = [
  // "├Ö" → "Ö"  (C4 BE = mangled Ö)
  [Buffer.from([0xE2, 0x94, 0x9C, 0xC4, 0xBE]), Buffer.from([0xC3, 0x96])],
  // "├í" → "í"  (C3 AD = í)
  [Buffer.from([0xE2, 0x94, 0x9C, 0xC3, 0xAD]), Buffer.from([0xC3, 0xAD])],
  // "├Â" → "Â" ... actually this might not need replacing, let's see
];

for (const [pat, rep] of garbledPatterns) {
  const idx = result.indexOf(pat);
  if (idx >= 0) {
    result = replaceBuffer(result, pat, rep);
    totalReplaced++;
    console.log(`  replaced pattern at offset ${idx}`);
  }
}

// Also look for any remaining 3-byte 0xE2 0x94 0x9C sequences
const remainingGarbled = [];
for (let i = 0; i < result.length - 2; i++) {
  if (result[i] === 0xE2 && result[i + 1] === 0x94 && result[i + 2] === 0x9C) {
    remainingGarbled.push(i);
  }
}
if (remainingGarbled.length > 0) {
  console.log('Still have ├ prefix at:', remainingGarbled);
  for (const offset of remainingGarbled) {
    const snippet = result.slice(offset, Math.min(offset + 12, result.length));
    console.log(`  offset ${offset}: ${snippet.toString('hex')}`);
  }
} else {
  console.log('No remaining ├ prefixes');
}

fs.writeFileSync('app/page.js', result, 'utf8');
console.log('Done. Total patterns replaced:', totalReplaced);
