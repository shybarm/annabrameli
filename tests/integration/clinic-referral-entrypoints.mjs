// Executes the committed handlers with fake providers; never opens a network connection.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHmac, webcrypto } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

async function handler(path, extras) {
  let serve;
  const source=(await readFile(path,'utf8')).replace(/^import .*;\n/gm,'');
  const context=vm.createContext({Request,Response,URL,URLSearchParams,TextEncoder,AbortSignal,
    crypto:webcrypto,btoa,console:{info(){},warn(){},error(){}},
    Deno:{env:{get:key=>({ZADARMA_API_SECRET:'fake-test-secret',GREEN_API_TOKEN:'fake-token'}[key])},serve:fn=>{serve=fn;}},
    serve:fn=>{serve=fn;}, fetch:()=>{throw Error('Unexpected network call');},...extras});
  vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText,context);
  return req=>serve(req);
}
let scheduled='scheduled', rpcError=null, calls=[], sends=[];
const table={insert:async()=>({error:null}),update:()=>({eq:async()=>({error:null})})};
const phoneHandler=await handler('supabase/functions/clinic-call-whatsapp/index.ts',{
  createClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:scheduled,error:rpcError};},from:()=>table}),
  fetch:async(url,options)=>{sends.push(JSON.parse(options.body));return Response.json({idMessage:'fake-message-id'});}
});
async function call(overrides={}, signatureValid=true) {
  const body={caller_id:'0500000001',called_did:'972555070399',call_start:'2026-11-24 10:00:00',event:'NOTIFY_IVR','wait_dtmf[name]':'clinic_menu','wait_dtmf[digits]':'1',...overrides};
  const signature=btoa(createHmac('sha1','fake-test-secret').update(body.caller_id+body.called_did+body.call_start).digest('hex'));
  return phoneHandler(new Request('https://example.test/ivr',{method:'POST',body:new URLSearchParams(body),headers:{Signature:signatureValid?signature:'bad'}}));
}
assert.equal((await call({},false)).status,403);assert.equal(calls.length,0);
assert.deepEqual(await (await call({'wait_dtmf[digits]':'0'})).json(),{redirect:'100'});assert.equal(calls.length,0);
assert.deepEqual(await (await call({called_did:'972500000002'})).json(),{});assert.equal(calls.length,0);
assert.equal((await (await call()).json()).wait_dtmf.name,'clinic_done');
assert.equal(calls[0].name,'schedule_clinic_referral');assert.equal(calls[0].args.p_phone,'972500000001');assert.equal(calls[0].args.p_source,'phone_ivr');assert.equal(sends.length,0);
for(const state of ['duplicate','suppressed']) {scheduled=state;assert.equal((await call()).status,200);assert.equal(sends.length,0);}
rpcError={code:'XX000'};assert.equal((await call()).status,503);assert.equal(sends.length,0);
rpcError=null;scheduled='disabled';assert.equal((await call()).status,200);assert.equal(sends.length,1); // Existing fallback stays available.
const count=calls.length;await call({event:'NOTIFY_INTERNAL',internal:'101'});assert.equal(calls.length,count);assert.equal(sends.length,2);

let contactCalls=[], emails=0, mailError=null;
const contactTable={select(){return this;},eq(){return this;},limit(){return this;},async maybeSingle(){return {data:null};}};
const contactHandler=await handler('supabase/functions/notify-contact/index.ts',{
  readLeadAttribution:()=>({source:'contact_form',labels:{},referrer:''}),
  Resend:class {emails={send:async()=>{emails++;return {error:mailError};}};},
  createClient:()=>({from:()=>contactTable,rpc:async(name,args)=>{contactCalls.push({name,args});return {data:true,error:null};}})
});
const contact=async(consent)=>contactHandler(new Request('https://example.test/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'בדיקה',phone:'0500000001',whatsappServiceConsent:consent})}));
assert.equal((await contact(false)).status,200);assert.equal(contactCalls.filter(c=>c.name==='schedule_clinic_referral').length,0);
assert.equal((await contact(true)).status,200);assert.equal(contactCalls.filter(c=>c.name==='schedule_clinic_referral').length,1);assert.equal(contactCalls.at(-1).args.p_source,'contact_form');
mailError={message:'test failure'};assert.equal((await contact(true)).status,502);assert.equal(contactCalls.filter(c=>c.name==='schedule_clinic_referral').length,1);
assert.equal(emails,3);
console.log('PASS: real handler authentication, key 0, key 1, DID, phone normalization, delayed scheduling without immediate send, error handling, legacy fallback, website opt-in and failed-email suppression. All providers mocked.');
