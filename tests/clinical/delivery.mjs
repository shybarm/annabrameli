import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import assert from 'node:assert/strict';
let handler,user=true,ready=true,provider='accepted',calls=0,claimed=false;let state;
const db={
 auth:{getUser:async()=>({data:{user:user?{id:'doctor'}:null}})},
 rpc:async(name)=>{if(name==='clinical_signing_ready')return {data:ready};if(claimed)return {error:{message:'ALREADY'}};claimed=true;return {data:{phone:'972500000000'}};},
 from:()=>({update:(s)=>{state=s.state;return {eq:()=>({eq:async()=>({error:null})})};}})
};
const source=readFileSync(new URL('../../supabase/functions/send-clinical-document/index.ts',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
vm.runInNewContext(code,{createClient:()=>db,Deno:{env:{get:()=> 'configured'},serve:h=>handler=h},Request,Response,FormData,File,AbortSignal,fetch:async(url,opts)=>{calls++;assert(url.includes('/sendFileByUpload/'));assert.equal(opts.body.get('file').type,'application/pdf');assert.equal(opts.body.get('chatId'),'972500000000@c.us');if(provider==='timeout')throw Error('timeout');return new Response(JSON.stringify({idMessage:'synthetic'}),{status:200})}});
const request=(pdf=true)=>{const form=new FormData();form.set('document_id','synthetic');form.set('kind','summary');form.set('phone','972500000000');form.set('file',new File([pdf?'%PDF-test':'not pdf'],'summary.pdf',{type:'application/pdf'}));return new Request('https://example.test',{method:'POST',body:form,headers:{authorization:'Bearer synthetic'}})};
user=false;assert.equal((await handler(request())).status,401);user=true;ready=false;assert.equal((await handler(request())).status,403);ready=true;assert.equal((await handler(request(false))).status,400);assert.equal(calls,0);
assert.equal((await handler(request())).status,200);assert.equal(state,'accepted');assert.equal(calls,1);assert.equal((await handler(request())).status,409);assert.equal(calls,1);
claimed=false;provider='timeout';assert.equal((await handler(request())).status,202);assert.equal(state,'uncertain');assert.equal(calls,2);
console.log('PASS: unauthenticated/other roles/invalid PDF blocked; PDF multipart upload; duplicate blocked; uncertain outcome not retried');
