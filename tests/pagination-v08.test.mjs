import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPage, advanceState, addBatch, sumBatchMap, PAGE_BATCHES } from '../pagination.mjs';
import { countPage } from '../engine.mjs';
import { Tiktoken } from '../vendor/js-tiktoken-core.mjs';
import ranks from '../vendor/o200k_base.mjs';
const enc=new Tiktoken(ranks);
const m=(id,role,txt)=>({id,author:{role},content:{content_type:'text',parts:[txt]},channel:role==='assistant'?'final':null,end_turn:role==='assistant'});
test('paginazione reale: usa start_cursor prima di altri IDs',()=>{
 const j={messages:[m('older','user','prima'),m('newer','assistant','dopo')],page_info:{start_cursor:'cursor-opaque',has_previous_page:true,has_next_page:false}};
 const p=cleanPage(j,{initial:true});assert.equal(p.startCursor,'cursor-opaque');
 assert.deepEqual(advanceState(1,p,new Set()),{action:'next',before:'cursor-opaque'});
});
test('paginazione: terminale affidabile oppure sconosciuto, non presume completa',()=>{
 assert.equal(advanceState(3,{hasPrevious:false},new Set()).action,'complete');
 assert.equal(advanceState(3,{hasPrevious:null},new Set()).action,'unknown');
 assert.equal(advanceState(3,{hasPrevious:true,startCursor:'a'},new Set(['a'])).action,'error');
});
test('mapping con ramo attivo completo non deve caricare il passato',()=>{
 const data={current_node:'c',mapping:{a:{parent:null,message:m('u','user','A')},b:{parent:'a',message:m('x','assistant','ramo non attivo')},c:{parent:'a',message:m('v','assistant','ramo attivo')}}};
 const p=cleanPage(data,{initial:true});assert.equal(p.branchVerified,true);assert.equal(p.hasPrevious,false);
 assert.deepEqual(p.messages.map(x=>x.id),['u','v']);
});
test('due pagine, overlap, niente doppio conteggio né tool, solo testo BPE',()=>{
 const older=cleanPage({messages:[m('a','user','ciao'),m('b','assistant','ok')],page_info:{start_cursor:'a',has_previous_page:false}});
 const recent=cleanPage({messages:[m('b','assistant','ok'),m('c','user','TEST123'),m('tool','tool','segreto')],page_info:{start_cursor:'b',has_previous_page:true}});
 const totals=new Map();let calls=0;
 const proxy={encode(s){calls++;return enc.encode(s);}};
 for(const page of [recent,older])addBatch(countPage(page,proxy).records,totals);
 const got=sumBatchMap(totals);
 assert.equal(got.messageCount,3);assert.equal(got.total,enc.encode('ciao').length+enc.encode('ok').length+enc.encode('TEST123').length);
 assert.equal(calls,4); // each recovered page counted ONCE, even if message spans both pages
});
test('fallback adattivo da 1000 a 100, 20 e 10',()=>assert.deepEqual(PAGE_BATCHES,[1000,100,20,10]));
test('countPage avoids duplicate ids in one response',()=>{
 const p={messages:[m('a','user','Hello'),m('a','user','Hello'),m('b','assistant','World')]};
 const result=countPage(p,enc);assert.equal(result.records.length,2);
});
