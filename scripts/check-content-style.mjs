import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const built = process.argv.includes('--dist');
const roots = built ? ['dist'] : ['src', 'public'];
const textExtensions = /\.(?:tsx?|css|html|json|md|txt)$/i;
const forbidden = String.fromCodePoint(0x2014);
const escaped = String.fromCharCode(92) + 'u2014';
const violations = [];
let checked = 0;

function scan(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (built ? file.endsWith('.html') : textExtensions.test(file)) {
      checked++;
      const text = readFileSync(file, 'utf8');
      const entity = file.endsWith('.html') && /&mdash;|&#0*8212;|&#x0*2014;/i.test(text);
      if (text.includes(forbidden) || text.toLowerCase().includes(escaped) || entity) violations.push(file);
    }
  }
}
roots.forEach(scan);
if (!built) {
  const template = readFileSync('index.html', 'utf8');
  if (template.includes(forbidden) || /&mdash;|&#0*8212;|&#x0*2014;/i.test(template)) violations.push('index.html');
}
if (violations.length) {
  console.error('Content style failed: U+2014 is forbidden in site text. Use ordinary punctuation or an ASCII hyphen.');
  violations.forEach(file => console.error(file));
  process.exit(1);
}
console.log(`Content style passed: ${checked} ${built ? 'built HTML' : 'source'} files checked.`);
