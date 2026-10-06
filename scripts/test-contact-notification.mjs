import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";

const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const parserContext = { exports: {}, URL };
vm.runInNewContext(compile(readFileSync("supabase/functions/notify-contact/attribution.ts", "utf8")), parserContext);
let handler;
let permitted = true;
let deliveryError = null;
const sent = [];
const client = {
  rpc: async () => ({ data: permitted }),
  from(table) {
    const query = { select: () => query, eq: () => query, limit: () => query, maybeSingle: async () => ({ data: table === "clinic_settings" ? { value: "test-clinic@example.com" } : { email: "test-clinic@example.com", name: "Test clinic" } }) };
    return query;
  },
};
class FakeResend { emails = { send: async payload => { sent.push(payload); return { data: deliveryError ? null : { id: "mock-id" }, error: deliveryError }; } }; }
const source = readFileSync("supabase/functions/notify-contact/index.ts", "utf8").replace(/^import.*;\n/gm, "");
vm.runInNewContext(compile(source), { serve: fn => { handler = fn; }, createClient: () => client, Resend: FakeResend, readLeadAttribution: parserContext.exports.readLeadAttribution, Deno: { env: { get: () => "mock-configuration" } }, Request, Response, crypto: webcrypto, URL, console: { error() {} } });
const request = body => new Request("https://test.invalid/notify-contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
let response = await handler(new Request("https://test.invalid/notify-contact"));
assert.equal(response.status, 200); assert.equal((await response.json()).version, "2026-10-06-attribution-v1"); assert.equal(sent.length, 0, "health read sends no email");
response = await handler(request({})); assert.equal(response.status, 400); assert.equal(sent.length, 0);
const body = { name: "<Patient fixture>", phone: "mock-phone", email: "fixture@example.com", message: "<Medical fixture>", source: "allergist_private_landing", attribution: { utm_source: "google", utm_medium: "organic", utm_campaign: "gbp", utm_content: "website", referrer: "https://google.com/search?q=private-query", token: "PRIVATE_TOKEN" } };
permitted = false; response = await handler(request(body)); assert.equal(response.status, 429); assert.equal(sent.length, 0);
permitted = true; response = await handler(request(body)); assert.equal(response.status, 200);
const result = await response.json(); assert.equal(result.success, true); assert.match(result.inquiry_reference, /^[0-9a-f-]{36}$/);
assert.equal(sent.length, 1); assert(sent[0].html.includes("&lt;Patient fixture&gt;")); assert(sent[0].html.includes("&lt;Medical fixture&gt;"));
assert(sent[0].html.includes(result.inquiry_reference)); assert(sent[0].html.includes("gbp")); assert(sent[0].html.includes("allergist_private_landing"));
assert(!sent[0].html.includes("PRIVATE_TOKEN")); assert(!sent[0].html.includes("private-query"));
assert.equal(sent[0].to.join(","), "test-clinic@example.com,shy@createit.tv", "existing recipient routing is preserved");
deliveryError = { message: "Mock send failure" }; response = await handler(request(body)); assert.equal(response.status, 502); assert.equal((await response.json()).success, undefined);
response = await handler(new Request("https://test.invalid/notify-contact", { method: "PUT" })); assert.equal(response.status, 405);
console.log("Contact notification contract checks passed: validation, throttling, delivery failure, HTML escaping, source labels, reference and unchanged recipient routing. All services were mocked; no external requests or emails sent.");
