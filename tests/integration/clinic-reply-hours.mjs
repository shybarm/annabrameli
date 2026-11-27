import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA clinic_private; CREATE SCHEMA cron; CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$select null::uuid$$;
CREATE FUNCTION public.can_edit_appointments(uuid) RETURNS boolean LANGUAGE sql AS $$select true$$;
CREATE FUNCTION cron.schedule(text,text,text) RETURNS bigint LANGUAGE sql AS $$select 1::bigint$$;
CREATE TABLE public.whatsapp_conversations(id uuid primary key default gen_random_uuid(), phone text unique, name text default '',source text default 'incoming', bot_stage text default 'human', bot_started_at timestamptz, opted_out boolean default false, updated_at timestamptz default now(), unread boolean default true,whatsapp_consent_at timestamptz,whatsapp_consent_scope text,whatsapp_consent_withdrawn_at timestamptz);
CREATE TABLE public.whatsapp_messages(id uuid primary key default gen_random_uuid(), conversation_id uuid references whatsapp_conversations,provider_id text unique,direction text,body text,message_type text default 'text',status text,created_at timestamptz default now());
CREATE TABLE public.whatsapp_outbox(id uuid primary key default gen_random_uuid(), message_id uuid references whatsapp_messages,state text default 'pending');`);
const original=await readFile('supabase/migrations/20261121073256_waitlist_whatsapp_bot.sql','utf8');
const simplified=await readFile('supabase/migrations/20261121074657_simplify_waitlist_confirmation.sql','utf8');
for(const [src,name] of [[original,'queue_whatsapp_text'],[original,'staff_whatsapp_action'],[simplified,'receive_clinic_whatsapp']]) {
 const re=new RegExp(`CREATE (?:OR REPLACE )?FUNCTION public\\.${name}\\([\\s\\S]*?END \\$\\$;`);
 await db.exec(src.match(re)[0]);
}

await db.exec(`ALTER TABLE whatsapp_conversations ADD COLUMN clinic_id uuid;
ALTER TABLE whatsapp_outbox ADD COLUMN ordinal bigint GENERATED ALWAYS AS IDENTITY;
ALTER TABLE whatsapp_outbox ADD COLUMN updated_at timestamptz DEFAULT now();
CREATE TABLE clinic_private.sumit_whatsapp_jobs(id uuid,phone text,body text,state text,not_before timestamptz,updated_at timestamptz,invoice_id uuid);
CREATE TABLE public.sumit_documents(invoice_id uuid,delivery_state text,updated_at timestamptz);`);
const base=await readFile('supabase/migrations/20261121191100_sumit_delivery_channels.sql','utf8');
await db.exec(base.match(/CREATE OR REPLACE FUNCTION public.claim_clinic_whatsapp_outbox\(\)[\s\S]*?END \$function\$;/)[0]);
for(const file of (await readdir('supabase/migrations')).filter(f=>/^202611(24|25|27)/.test(f)).sort()) {
 console.log('Applying',file); await db.exec(await readFile('supabase/migrations/'+file,'utf8'));
}
const q=async(s,p=[]) => (await db.query(s,p)).rows;
await db.exec("update clinic_private.referral_settings set enabled=true,ai_enabled=true,test_mode=false,test_phone='972525916393'");
const phone='972525916393';
await q("select schedule_clinic_referral($1,'test','phone_ivr',$2)",[phone,'a'.repeat(64)]);
const before=(await q('select * from clinic_private.referral_flows'))[0];
assert.equal((await q("select schedule_clinic_referral($1,'test','phone_ivr',$2) result",[phone,'b'.repeat(64)]))[0].result,'duplicate');
assert.equal(new Date((await q('select due_at from clinic_private.referral_flows'))[0].due_at).toISOString(),new Date(before.due_at).toISOString());
await q("select receive_clinic_whatsapp($1,'first-test','היי','text',now(),false)",[phone]);
assert.equal((await q('select state from clinic_private.referral_flows'))[0].state,'scheduled');
await q("select receive_clinic_whatsapp($1,'first-test','היי','text',now(),false)",[phone]);
assert.equal((await q("select count(*)::int n from whatsapp_messages where provider_id='first-test'"))[0].n,1);
for(const [at,origin,expected] of [
 ['2026-11-26 22:53+02','2026-11-26 22:53+02','2026-11-27T06:30:00.000Z'],
 ['2026-11-27 08:30+02','2026-11-26 22:53+02','2026-11-27T06:30:00.000Z'],
 ['2026-11-27 10:00+02','2026-11-27 10:00+02','2026-11-29T06:30:00.000Z'],
 ['2026-11-28 10:00+02','2026-11-28 10:00+02','2026-11-29T06:30:00.000Z'],
 ['2026-11-25 20:30+02','2026-11-25 20:30+02','2026-11-26T06:30:00.000Z']
]) assert.equal(new Date((await q('select clinic_private.service_reply_time($1,$2) t',[at,origin]))[0].t).toISOString(),expected);
assert.equal((await q("select count(*)::int n from whatsapp_messages where body like '%באמצע%'"))[0].n,0);
await q("select receive_clinic_whatsapp($1,'stop-test','הסר','text',now(),false)",[phone]);
assert.equal((await q('select opted_out from whatsapp_conversations'))[0].opted_out,true);
console.log('Passed: repeated IVR, reply before welcome, webhook deduplication, Israel hours, Thursday/Friday/Saturday, opt-out.');

// Simulate the incident without a provider connection or any outbound requests.
await db.exec(`CREATE TABLE clinic_private.test_clock(t timestamptz);
INSERT INTO clinic_private.test_clock VALUES ('2026-11-26 22:53+02');
CREATE FUNCTION clinic_private.test_now() RETURNS timestamptz LANGUAGE sql AS $$SELECT t FROM clinic_private.test_clock$$;`);
for (const row of await q(`SELECT pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','clinic_private') AND p.prokind='f' AND p.proname<>'test_now'`)) {
 const patched=row.definition.replace(/\bclock_timestamp\(\)|\bnow\(\)/g,'clinic_private.test_now()');
 if(patched!==row.definition) await db.exec(patched);
}
await db.exec('ALTER TABLE whatsapp_outbox ALTER COLUMN not_before SET DEFAULT clinic_private.test_now(); ALTER TABLE whatsapp_messages ALTER COLUMN created_at SET DEFAULT clinic_private.test_now()');
await db.exec("UPDATE clinic_private.referral_settings SET public_started_at='2026-11-24 00:00+02'");
const reset=async()=>db.exec('TRUNCATE whatsapp_conversations CASCADE');
const setTime=async(t)=>q('UPDATE clinic_private.test_clock SET t=$1',[t]);
for(const source of ['phone_ivr','contact_form','whatsapp_inbound','waitlist_form']) {
 await reset(); await setTime('2026-11-26 22:53+02');
 if(source==='whatsapp_inbound') await q("SELECT receive_clinic_whatsapp($1,'hello','היי','text',clinic_private.test_now(),false)",[phone]);
 else if(source==='waitlist_form') await q("SELECT register_whatsapp_waitlist('Owner test',$1,NULL,true)",[phone]);
 else await q("SELECT schedule_clinic_referral($1,'Owner test',$2,'night')",[phone,source]);
 await q("SELECT receive_clinic_whatsapp($1,'hello-again','היי','text',clinic_private.test_now(),false)",[phone]);
 if(source==='whatsapp_inbound') {
  assert.equal((await q('SELECT state FROM clinic_private.referral_flows'))[0].state,'ai_pending');
  await q("SELECT queue_whatsapp_text(id,'למי התור, לילד/ה או למבוגר/ת?') FROM whatsapp_conversations");
 }
 assert.equal((await q("SELECT count(*)::int n FROM whatsapp_messages WHERE message_type='service_notice'"))[0].n,1,source+' one closure');
 const notice=(await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job;
 assert.equal(notice.body,'המרפאה סגורה כרגע. נחזור אלייך בהקדם.',source+' closure only');
 await q("UPDATE whatsapp_outbox SET state='accepted' WHERE id=$1",[notice.id]);
 assert.equal((await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job,null,source+' no night reply');
 await setTime('2026-11-27 08:30+02');
 await q('SELECT queue_due_clinic_referrals()');
 const morning=(await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job;
 if(!morning?.body) console.log(JSON.stringify({source,flows:await q('select * from clinic_private.referral_flows'),messages:await q('select body,status from whatsapp_messages'),outbox:await q('select * from whatsapp_outbox')}));
 assert.ok(morning?.body,source+' Friday resume');
 assert.ok(!morning.body.includes('באמצע'),source+' not returning');
 await q("UPDATE whatsapp_outbox SET state='accepted' WHERE id=$1",[morning.id]);
 assert.equal((await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job,null,source+' no duplicate');
}
console.log('Passed: all four entry paths send one closure at night and resume once on Friday morning. No external messages sent.');

for(const start of ['2026-11-27 10:00+02','2026-11-28 10:00+02']) {
 await reset(); await setTime(start);
 await q("SELECT schedule_clinic_referral($1,'Owner test','phone_ivr','weekend')",[phone]);
 assert.equal(new Date((await q('SELECT due_at FROM clinic_private.referral_flows'))[0].due_at).toISOString(),'2026-11-29T06:30:00.000Z');
 const closed=(await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job;
 assert.equal(closed.body,'המרפאה סגורה כרגע. נחזור אלייך בהקדם.');
 await q("UPDATE whatsapp_outbox SET state='accepted' WHERE id=$1",[closed.id]);
 await setTime('2026-11-29 08:29+02'); await q('SELECT queue_due_clinic_referrals()');
 assert.equal((await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job,null);
 await setTime('2026-11-29 08:30+02'); await q('SELECT queue_due_clinic_referrals()');
 assert.ok((await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job?.body);
}
// A queued daytime response must not slip through if the dispatcher runs late.
await reset(); await setTime('2026-11-26 20:29+02');
await q("INSERT INTO whatsapp_conversations(phone) VALUES($1)",[phone]);
await q("SELECT queue_whatsapp_text(id,'pending response') FROM whatsapp_conversations");
await setTime('2026-11-26 20:31+02');
const closed=(await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job;
assert.equal(closed.body,'המרפאה סגורה כרגע. נחזור אלייך בהקדם.');
await q("UPDATE whatsapp_outbox SET state='accepted' WHERE id=$1",[closed.id]);
assert.equal((await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job,null);
await setTime('2026-11-27 08:30+02');
assert.equal((await q('SELECT claim_clinic_whatsapp_outbox() job'))[0].job.body,'pending response');
console.log('Passed: new Friday/Saturday requests wait until Sunday; late dispatch cannot bypass quiet hours.');
await db.close();
