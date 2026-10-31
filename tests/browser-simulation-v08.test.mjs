import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {countPage} from '../engine.mjs';
import {Tiktoken} from '../vendor/js-tiktoken-core.mjs';
import ranks from '../vendor/o200k_base.mjs';
const contentJs=fs.readFileSync(new URL('../content.js',import.meta.url),'utf8');
const pagingJs=fs.readFileSync(new URL('../pagination.js',import.meta.url),'utf8');
const policyJs=fs.readFileSync(new URL('../alert-policy.js',import.meta.url),'utf8');
const enc=new Tiktoken(ranks);
const m=(id,role,text)=>({id,author:{role},content:{content_type:'text',parts:[text]},channel:role==='assistant'?'final':null,end_turn:role==='assistant'});
async function simulate(failOlder=false){
 const elements=new Map();const events=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',style:{},dataset:{},setAttribute(){},addEventListener(){}});return elements.get(id);};
 const panel={id:'',className:'',style:{},dataset:{},isConnected:false,classList:{contains(k){return k==='cg-minimized'&&this.minimized!==false;},minimized:true,toggle(k,force){this.minimized=typeof force==='boolean'?force:!this.minimized;return !this.minimized;},remove(k){if(k==='cg-minimized')this.minimized=false;}},querySelector(sel){return element(sel.slice(1));}};
 const document={cookie:'',body:{appendChild(p){p.isConnected=true;}},createElement(){return panel;},addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];}};
 const first={messages:[m('b','assistant','OK'),m('c','user','TEST123')],page_info:{start_cursor:'b',has_previous_page:true},default_model_slug:'gpt-6-thinking'};
 const older={messages:[m('a','user','ciao'),m('b','assistant','OK')],page_info:{start_cursor:'a',has_previous_page:false}};
 const fetch=async url=>{
   events.push(url);
   if(url==='/api/auth/session')return {ok:true,json:async()=>({accessToken:'fake-token'})};
   if(String(url).includes('/backend-api/conversations/') && failOlder)return {ok:false,status:429,statusText:'Too Many Requests'};
   return {ok:true,json:async()=>String(url).includes('/backend-api/conversations/')?older:first};
 };
 const chrome={storage:{local:{get:async()=>({enabled:true,deep:true})},onChanged:{addListener(){}}},runtime:{onMessage:{addListener(){}},sendMessage:async request=>({ok:true,result:countPage(request.page,enc)})}};
 const context={document,chrome,fetch,location:{pathname:'/c/test-id'},window:{location:{origin:'https://chatgpt.com'}},navigator:{language:'it'},AbortController,URLSearchParams,Set,Map,Date,Number,Math,String,Boolean,RegExp,Promise,Error,Intl,setTimeout:(f,ms)=>ms>=18000?-1:setTimeout(f,ms),clearTimeout:(id)=>id===-1?undefined:clearTimeout(id),setInterval(){},MutationObserver:class{observe(){}disconnect(){}},console};context.globalThis=context;
 vm.createContext(context);vm.runInContext(pagingJs,context);vm.runInContext(policyJs,context);vm.runInContext(contentJs,context);
 await new Promise(r=>setTimeout(r,120));
 return {elements,events,panel};
}
test('real content script simulation: 2 pages => 3 unique historical messages',async()=>{
 const {elements,events}=await simulate();
 assert.equal(elements.get('cg-total').textContent, String(enc.encode('OK').length+enc.encode('TEST123').length+enc.encode('ciao').length));
 assert.match(elements.get('cg-status').textContent,/Cronologia recuperata/);
 assert.equal(events.filter(x=>String(x).includes('backend-api')).length,2);
});
test('429 on older page retains partial tokens, does not claim completion',async()=>{
 const {elements}=await simulate(true);
 assert.match(elements.get('cg-status').textContent,/HTTP 429/);
 assert.equal(elements.get('cg-quality').textContent,'Parziale');
 assert.notEqual(elements.get('cg-total').textContent,'—');
});
