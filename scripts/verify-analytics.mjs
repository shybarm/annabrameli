import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const calls = [];
const source = ts.transpileModule(readFileSync(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = vm.createContext({ exports: {}, URL, window: {
  location: { origin: 'https://ihaveallergy.com' },
  gtag: (...args) => calls.push(args),
} });
vm.runInContext(source, context);
const { trackPageView } = context.exports;
trackPageView('/about?email=private@example.com#secret');
assert.equal(calls.length, 1);
assert.equal(calls[0][0], 'event');
assert.equal(calls[0][1], 'page_view');
assert.equal(calls[0][2].page_location, 'https://ihaveallergy.com/about');
assert.equal(calls[0][2].send_to, 'G-671NNHCM9J');
assert.ok(!JSON.stringify(calls).includes('private@example.com'));
for (const path of ['/admin/patients/123', '/intake/secret', '/auth', '/reset-password', '/verify-booking', '/verify-email', '/magic', '/join/code', '/patient-invite/code', '/portal', '/.lovable/oauth/consent', 'https://example.com/']) {
  trackPageView(path);
}
assert.equal(calls.length, 1, 'Private and external routes must be excluded');
trackPageView('/book');
trackPageView('/book/success');
assert.equal(calls.length, 3, 'Public booking views remain measurable');
delete context.window.gtag;
assert.doesNotThrow(() => trackPageView('/contact'));
delete context.window;
assert.doesNotThrow(() => trackPageView('/'));
console.log('Analytics checks passed: explicit events, clean URLs, private routes, booking, missing tag and SSR.');
