const fs = require('fs');
const lines = fs.readFileSync('app/page.js', 'utf8').split('\n');
const line115 = lines[114]; // 0-indexed
const bytes = Buffer.from(line115, 'utf8');
const expectedBytes = Buffer.from('  const [activeMode, setActiveMode] = useState("Összes");', 'utf8');

console.log('Actual line:  ' + line115.trimStart());
console.log('Expected line:  const [activeMode, setActiveMode] = useState("Összes");');
console.log('');
console.log('Actual hex:   ' + bytes.toString('hex').replace(/(..)/g,'$1 '));
console.log('Expected hex: ' + expectedBytes.toString('hex').replace(/(..)/g,'$1 '));
console.log('');
// Check for garbled prefix
const garbled = bytes.slice(bytes.indexOf(0x22) + 1).toString('hex').substring(0, 14);
console.log('Starting bytes after quote: ' + garbled);

// Also check what's now at the state position
if (bytes.includes(Buffer.from('Összes', 'utf8'))) {
  console.log('✅ Line 115 contains "Összes" correctly');
} else {
  console.log('❌ Line 115 does NOT contain correct "Összes"');
  // Find what's there
  const idx = line115.indexOf('"');
  if (idx >= 0) {
    const inner = line115.substring(idx+1, line115.lastIndexOf('"'));
    console.log('Actual content: ' + inner + ' (hex: ' + Buffer.from(inner).toString('hex') + ')');
  }
}
