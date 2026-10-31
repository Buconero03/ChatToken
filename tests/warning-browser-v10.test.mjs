import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const content=fs.readFileSync(new URL('../content.js',import.meta.url),'utf8');
const policy=fs.readFileSync(new URL('../alert-policy.js',import.meta.url),'utf8');
const paging=fs.readFileSync(new URL('../pagination.js',import.meta.url),'utf8');
async function bootstrap(initial){
 let amount=initial, copied='', saved={};
 const elements=new Map();
 function el(id){if(!elements.has(id))elements.set(id,{textContent:'',style:{},dataset:{},hidden:false,handlers:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,cb){this.handlers[k]=cb;}});return elements.get(id);}
 const panel={isConnected:false,className:'',style:{},dataset:{},classList:{minimized:true,contains(k){return k==='cg-minimized'&&this.minimized;},toggle(k,force){this.minimized=typeof force==='boolean'?force:!this.minimized;return !this.minimized;},remove(k){if(k==='cg-minimized')this.minimized=false;}},querySelector(q){return el(q.slice(1));}};
 const document={cookie:'',body:{appendChild(node){node.isConnected=true;}},createElement(){return panel;},addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
 const chrome={storage:{local:{get:async keys=>keys===null?saved:{enabled:true,deep:true},set:async changes=>{saved={...saved,...changes};}},onChanged:{addListener(){}}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true,result:{records:[{id:'one',role:'user',tokens:amount}],modelInfo:{model:'gpt-6-thinking'}}})}};
 const window={location:{origin:'https://chatgpt.com'},prompt:()=>null};
 const context={document,chrome,window,navigator:{language:'it',clipboard:{writeText:async txt=>{copied=txt;}}},location:{pathname:'/c/test-xxx'},fetch:async url=>({ok:true,json:async()=>String(url).includes('/api/auth/session')?{accessToken:'fake'}:{messages:[{id:'one',author:{role:'user'},content:{content_type:'text',parts:['hi']}}],page_info:{has_previous_page:false},default_model_slug:'gpt-6-thinking'}}),AbortController,URLSearchParams,Set,Map,Date,Number,Math,String,Boolean,RegExp,Promise,Error,Intl,setTimeout:(f,ms)=>ms>=18000?-1:setTimeout(f,ms),clearTimeout:(id)=>id===-1?undefined:clearTimeout(id),setInterval(){},MutationObserver:class{observe(){}disconnect(){}},console};
 context.globalThis=context;vm.createContext(context);for(const src of [paging,policy,content])vm.runInContext(src,context);
 const wait=()=>new Promise(resolve=>setTimeout(resolve,45));await wait();
 return {elements,el,panel,change:async value=>{amount=value;await el('cg-update').handlers.click();await wait();},copy:async()=>{await el('cg-pdf').handlers.click();},dismiss:async()=>{await el('cg-dismiss').handlers.click();},hide:async()=>{await el('cg-hide-widget').handlers.click();},toggle:()=>el('cg-toggle').handlers.click(),copied:()=>copied,saved:()=>saved};
}
test('content alert appears automatically at exactly 240k; stays hidden below',async()=>{
 const a=await bootstrap(239999);
 assert.equal(a.el('cg-alert').hidden,true);
 await a.change(240000);
 assert.equal(a.el('cg-alert').hidden,false);
 assert.match(a.el('cg-alert-title').textContent,/Checkpoint/i);
 assert.equal(a.panel.classList.minimized,true); // A warning must never expand the full panel
});
test('copy PDF handoff, dismiss near warning, and raise new warning over 250k',async()=>{
 const a=await bootstrap(240000);
 await a.copy();assert.match(a.copied(),/passaggio consegne/i);
 await a.dismiss();assert.equal(a.el('cg-alert').hidden,true);
 await a.change(245000);assert.equal(a.el('cg-alert').hidden,true);
 await a.change(250000);assert.equal(a.el('cg-alert').hidden,false);
 assert.match(a.el('cg-alert-title').textContent,/raggiunta/i);
 assert.ok(Object.keys(a.saved()).some(x=>x.startsWith('cg_ack_')));
});

test('warning remains passive: no forced panel opening and dismissible alert',async()=>{
 const a=await bootstrap(240000);
 assert.equal(a.panel.classList.minimized,true);
 assert.equal(a.el('cg-alert').hidden,false);
 await a.dismiss();
 assert.equal(a.el('cg-alert').hidden,true);
 a.toggle();
 assert.equal(a.panel.classList.minimized,false);
});
test('hiding the mini widget keeps monitoring enabled',async()=>{
 const a=await bootstrap(240000);
 await a.hide();
 assert.equal(a.panel.style.display,'none');
 assert.equal(a.saved().widgetVisible,false);
 assert.notEqual(a.saved().enabled,false);
});
