import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
const source=await readFile('supabase/functions/clinic-whatsapp-bot/referral-ai.ts','utf8');
let env={LOVABLE_API_KEY:'fake-key'},urls=[];
let jobs=[],results=[],requests=[],modelAction='known',fail=false,truncated=false;
const context=vm.createContext({exports:{},AbortSignal,console,Deno:{env:{get:(name)=>env[name]}},fetch:async(url,opts)=>{
 urls.push(url);requests.push(JSON.parse(opts.body));if(fail)throw Error('fake outage');
 return {ok:true,json:async()=>({choices:[{finish_reason:truncated?'length':'stop',message:{content:JSON.stringify({action:modelAction})}}]})};
}});
vm.runInContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,context);
const client={rpc:async(name,args)=> name==='claim_clinic_referral_ai'?{data:jobs.shift()??null,error:null}:(results.push(args),{error:null})};
const job=(asked=[])=>({conversation_id:'fake-id',claim:'fake-claim',asked,messages:[{role:'user',content:'ילד, אלרגיה למזון. מספר בדיקה 0500000001 test@example.com'}]});
jobs=[job()];await context.exports.processReferralAi(client);assert.equal(results.at(-1).p_action,'known');assert.equal(results.at(-1).p_origin,'model');
assert.doesNotMatch(JSON.stringify(requests),/0500000001|test@example.com/);
jobs=[job(['known','age'])];const count=requests.length;await context.exports.processReferralAi(client);assert.equal(results.at(-1).p_action,'finish');assert.equal(requests.length,count);
modelAction='give_medical_advice';jobs=[job()];await context.exports.processReferralAi(client);assert.equal(results.at(-1).p_action,'finish');
fail=true;jobs=[job()];await context.exports.processReferralAi(client);assert.equal(results.at(-1).p_origin,'fallback');
const urgent=job(['known','age']);urgent.messages=[{role:'user',content:'יש קושי לנשום עכשיו'}];jobs=[urgent];await context.exports.processReferralAi(client);assert.equal(results.at(-1).p_action,'human');
console.log('PASS: bounded AI actions, server fallback, identifier redaction, no free-text clinical output, urgent message avoids routine referral even at turn limit. Network fully mocked.');

fail=false;truncated=true;modelAction='known';jobs=[job()];await context.exports.processReferralAi(client);assert.equal(results.at(-1).p_origin,'fallback');assert.equal(results.at(-1).p_action,'finish');assert.ok(requests.at(-1).max_tokens>=2048);
console.log('PASS: truncated model output cannot become a valid decision; adequate reasoning/output budget.');

fail=false;truncated=false;modelAction='reason';
env={GEMINI_API_KEY:'fake-google-key',CLINIC_AI_PROVIDER:'google'};
const remembered=job(['phone_opening']);remembered.history=[{role:'user',content:'test@example.com 0500000001 ילד'}];
jobs=[remembered];await context.exports.processReferralAi(client);
assert.equal(urls.at(-1),'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
assert.equal(requests.at(-1).model,'gemini-2.5-flash-lite');
assert.equal(requests.at(-1).reasoning_effort,'none');
let payload=JSON.parse(requests.at(-1).messages[1].content);
assert.equal(payload.previous_conversation.length,1);
assert.doesNotMatch(JSON.stringify(payload),/0500000001|test@example.com/);
assert.match(requests.at(-1).messages[0].content,/Never infer current consent from history/);
remembered.asked=['consent_reply'];modelAction='consent_yes';jobs=[remembered];await context.exports.processReferralAi(client);
payload=JSON.parse(requests.at(-1).messages[1].content);assert.deepEqual(payload.previous_conversation,[]);
assert.equal(results.at(-1).p_action,'consent_yes');
// Missing paid-provider credentials must not leak the request to another provider.
env={CLINIC_AI_PROVIDER:'google',LOVABLE_API_KEY:'fake-old-key'};
const before=urls.length;jobs=[remembered];await context.exports.processReferralAi(client);
assert.equal(urls.length,before);assert.equal(results.at(-1).p_action,'consent_clarify');
console.log('PASS: Google endpoint/model, explicit activation, separate redacted history, historical consent exclusion, no silent provider fallback.');
