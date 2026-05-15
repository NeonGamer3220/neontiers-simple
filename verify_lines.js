const fs = require('fs');
const buf = fs.readFileSync('app/page.js');

// Check what's around the previously garbled lines after edits
const checkLines = [115, 179, 202, 274, 317, 354, 355, 373, 380, 381, 386, 468, 527, 572, 638, 669];
for (const ln of checkLines) {
  const line = buf.toString('utf8').split('\n')[ln - 1];
  if (line) {
    const isGarbled = /[\x80-\xFF]/.test(line) && !line.trimStart().startsWith('//');
    console.log(`Line ${ln}: ${line.trimStart().substring(0, 80)}${isGarbled ? ' [GARBLED]' : ''}`);
  }
}
