import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const built = process.argv.includes('--dist');
const roots = built ? ['dist'] : ['src', 'public'];
const textExtensions = /\.(?:tsx?|css|html|json|md|txt)$/i;
const forbidden = new RegExp(`[${String.fromCodePoint(0x2013)}${String.fromCodePoint(0x2014)}]`);
const escaped = new RegExp(String.fromCharCode(92).repeat(2) + 'u201[34]', 'i');
const violations = [];
let checked = 0;

function scan(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (built ? file.endsWith('.html') : textExtensions.test(file)) {
      checked++;
      const text = readFileSync(file, 'utf8');
      const entity = file.endsWith('.html') && /&[mn]dash;|&#0*821[12];|&#x0*201[34];/i.test(text);
      if (forbidden.test(text) || escaped.test(text) || entity) violations.push(file);
    }
  }
}
roots.forEach(scan);
if (!built) {
  const template = readFileSync('index.html', 'utf8');
  if (forbidden.test(template) || /&[mn]dash;|&#0*821[12];|&#x0*201[34];/i.test(template)) violations.push('index.html');
}
if (violations.length) {
  console.error('Content style failed: U+2013 and U+2014 are forbidden in site text. Use ordinary punctuation or an ASCII hyphen.');
  violations.forEach(file => console.error(file));
  process.exit(1);
}
console.log(`Content style passed: ${checked} ${built ? 'built HTML' : 'source'} files checked.`);
