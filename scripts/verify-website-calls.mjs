import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { Window } from 'happy-dom';
const window = new Window({ url: 'https://ihaveallergy.com/contact?gclid=TEST_click-123&email=secret@example.com' });
window.document.body.innerHTML = '<a href="tel:+972525916393">052-5916393</a><a href="https://wa.me/972525916393">WhatsApp</a><a href="tel:100">other</a>';
const calls = [];
window.gtag = (...args) => calls.push(args);
const context = vm.createContext({ exports: {}, URL, URLSearchParams, window, document: window.document, NodeFilter: window.NodeFilter, MutationObserver: window.MutationObserver, require: () => ({
  publicPath: p => ['/contact', '/about'].includes(p) ? p : undefined,
  sanitizeAttribution: () => ({}),
}) });
vm.runInContext(ts.transpileModule(readFileSync('src/lib/website-call-tracking.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const start = context.exports.startWebsiteCallTracking;
const cleanup = start();
assert.equal(calls.length, 2);
assert.equal(calls[1][2].page_location, 'https://ihaveallergy.com/contact?gclid=TEST_click-123');
assert.ok(!JSON.stringify(calls).includes('secret@example.com'));
assert.equal(calls[1][1], 'AW-18186381713/CyUZCMS40ZYdEJHT-N9D');
const callback = calls[1][2].phone_conversion_callback;
callback('03-5550000', '+97235550000');
assert.equal(window.document.querySelector('a').getAttribute('href'), 'tel:+97235550000');
assert.equal(window.document.querySelector('a').textContent, '03-5550000');
assert.equal(window.document.querySelectorAll('a')[1].getAttribute('href'), 'https://wa.me/972525916393');
assert.equal(window.document.querySelectorAll('a')[2].getAttribute('href'), 'tel:100');
const extra = window.document.createElement('a'); extra.href = 'tel:0525916393'; extra.textContent = '052-5916393'; window.document.body.append(extra);
await window.happyDOM.waitUntilComplete();
assert.equal(extra.getAttribute('href'), 'tel:+97235550000');
cleanup();
assert.equal(window.document.querySelector('a').getAttribute('href'), 'tel:+972525916393');
assert.equal(extra.getAttribute('href'), 'tel:0525916393');
window.location.href = 'https://ihaveallergy.com/admin/patients';
assert.equal(start(), undefined);
assert.equal(calls.length, 2);
callback('03-5550001', '+97235550001');
assert.equal(extra.getAttribute('href'), 'tel:0525916393');
await window.happyDOM.abort();
console.log('Website calls passed: clean URLs, exact tag, dial/display replacement, SPA insertion, cleanup, private routes, untouched WhatsApp.');
