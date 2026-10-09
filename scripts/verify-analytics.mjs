import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const calls = [];
const source = ts.transpileModule(readFileSync(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function loadTsModule(path) {
  const filename = new URL(path, import.meta.url);
  const module = { exports: {} };
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(output, { exports: module.exports, require: (specifier) => {
    if (specifier === './blog-articles') return loadTsModule('../src/data/blog-articles.ts');
    throw new Error(`Unexpected test dependency: ${specifier}`);
  } });
  return module.exports;
}
const context = vm.createContext({ exports: {}, URL, URLSearchParams,
  document: { referrer: 'https://example.com/private?email=patient@example.com' },
  sessionStorage: { getItem: () => null, setItem: () => {} },
  require: (specifier) => {
    assert.equal(specifier, '@/data/public-routes');
    return loadTsModule('../src/data/public-routes.ts');
  }, window: {
  location: { origin: 'https://ihaveallergy.com', pathname: '/about', search: '' },
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
const { trackPhoneClick, trackEvent, sanitizeAttribution } = context.exports;
trackPhoneClick('article', '+972525916393');
assert.equal(calls.at(-1)[1], 'phone_click');
assert.ok(!calls.some(call => /qualified|call_completed|appointment_confirmed/.test(call[1])));
assert.ok(!JSON.stringify(calls).includes('patient@example.com'));
const countBeforePrivate = calls.length;
context.window.location.pathname = '/admin/patients/123';
trackPhoneClick('admin', '+972500000000');
trackEvent('contact_form_submitted');
assert.equal(calls.length, countBeforePrivate);
context.window.location.pathname = '/about';
const safe = sanitizeAttribution({ utm_source: 'google', utm_campaign: 'patient@example.com', landing_page: '/about?email=patient@example.com', referrer: 'https://example.com/private?email=patient@example.com' });
assert.equal(safe.utm_source, 'google');
assert.equal(safe.utm_campaign, undefined);
assert.equal(safe.landing_page, '/about');
assert.equal(safe.referrer, 'https://example.com');
delete context.window.gtag;
assert.doesNotThrow(() => trackPageView('/contact'));
delete context.window;
assert.doesNotThrow(() => trackPageView('/'));
console.log('Analytics checks passed: explicit events, clean URLs, private routes, booking, missing tag and SSR.');
