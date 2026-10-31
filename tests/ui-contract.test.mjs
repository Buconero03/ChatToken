import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const url=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('popup.html',url),'utf8');
const script=fs.readFileSync(new URL('popup.js',url),'utf8');
const content=fs.readFileSync(new URL('content.js',url),'utf8');
const alertPolicy=fs.readFileSync(new URL('alert-policy.js',url),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',url),'utf8'));
test('counter-first UI: no model limits, API reference or fake remaining percentage',()=>{
 const ids=new Set([...html.matchAll(/\bid="([A-Za-z0-9]+)"/g)].map(m=>m[1]));
 for(const [,id] of script.matchAll(/\$\('([A-Za-z0-9]+)'\)/g))assert.ok(ids.has(id),`missing ${id}`);
 for(const id of ['total','userTokens','assistantTokens','model','messageCount','pageCount','refresh'])assert.ok(ids.has(id));
 for(const id of ['contextLimit','remaining','apiContext','apiSource','healthState'])assert.ok(!ids.has(id));
 assert.doesNotMatch(html,/1050000|128000|256000|1\.050\.000/);
 assert.doesNotMatch(content,/cg-api-context|cg-capacity|cg-remaining|CGModelRegistry/);
 assert.ok(!manifest.content_scripts[0].js.includes('model-registry.js'));
});
test('popup renders reliable counts without model ceilings',async()=>{
 const elements=new Map();
 function get(id){if(!elements.has(id))elements.set(id,{textContent:'',dataset:{},style:{},hidden:false,checked:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(){}});return elements.get(id);}
 const state={ok:true,status:'Cronologia recuperata',stats:{total:215074,user:40266,assistant:174808,complete:true,messageCount:252,pages:3,model:'gpt-6-thinking',branchVerified:false,truncationObserved:false}};
 const sandbox={document:{getElementById:get},chrome:{tabs:{query:async()=>[{id:8,url:'https://chatgpt.com/c/test'}],sendMessage:async()=>state},storage:{local:{get:async()=>({enabled:true,deep:true}),set:async()=>{}}}},Number,Math,setInterval:()=>{},console};
 sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(alertPolicy,sandbox);vm.runInContext(script,sandbox);await new Promise(r=>setTimeout(r,30));
 assert.equal(get('total').textContent,'215.074');
 assert.equal(get('userTokens').textContent,'40.266');
 assert.equal(get('assistantTokens').textContent,'174.808');
 assert.equal(get('pageCount').textContent,'3');
 assert.equal(get('model').textContent,'gpt-6-thinking');
 assert.equal(get('state').textContent,'Cronologia letta');
 vm.runInContext(`paint({status:'Pagina 1 di 2',stats:{total:700,user:400,assistant:300,complete:false,messageCount:2,pages:1,model:'gpt-6-thinking'}})`,sandbox);
 assert.equal(get('state').textContent,'Parziale');
});
