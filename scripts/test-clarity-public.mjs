import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(fs.readFileSync('src/lib/clarity-public.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(path='/', search='') {
 const calls=[]; const listeners={};
 const window={location:{pathname:path,search,hash:''},addEventListener:(key,fn)=>listeners[key]=fn,history:{pushState(){calls.push('navigate')},replaceState(){calls.push('replace')}}};
 const document={referrer:'https://example.com/?private=secret',addEventListener:(key,fn)=>listeners[key]=fn};
 const context={exports:{},URL,window,document,Element:class {},require:()=>({clarity:{start:config=>calls.push(config),stop:()=>calls.push('stop')}})};
 vm.runInNewContext(source,context);
 return {api:context.exports,window,calls,listeners};
}
for(const path of ['/book','/admin','/portal','/contact','/blog']){const f=fixture(path);assert.equal(await f.api.startPublicClarity(),false);assert.equal(f.calls.length,0)}
const query=fixture('/','?token=secret'); assert.equal(await query.api.startPublicClarity(),false);
const race=fixture();const pending=race.api.startPublicClarity();race.window.location.pathname='/portal';assert.equal(await pending,false);assert.equal(race.calls.length,0);
const f=fixture();assert.equal(f.calls.length,0,'import alone never starts recording');assert.equal(await f.api.startPublicClarity(),true);
assert.equal(f.calls[0].content,false);assert.equal(f.calls[0].track,false);assert(f.calls[0].mask.includes('html'));assert(f.calls[0].drop.includes('private'));
f.window.history.pushState({},'', '/portal');assert.deepEqual(f.calls.slice(1),['stop','navigate'],'stop precedes route change');assert.equal(await f.api.startPublicClarity(),false,'cannot restart in same document');
console.log('Clarity public route, late-load, explicit-start and stop-before-navigation checks passed.');
