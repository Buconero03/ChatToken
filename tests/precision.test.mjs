import test from 'node:test';
import assert from 'node:assert/strict';
import {countHistory} from '../engine.mjs';
import {Tiktoken} from '../vendor/js-tiktoken-core.mjs';
import ranks from '../vendor/o200k_base.mjs';
const tokenizer = new Tiktoken(ranks);
function m(id,role,text){return {id,author:{role},content:{content_type:'text',parts:[text]},channel:role==='assistant'?'final':null,end_turn:role==='assistant'};}
test('BPE counts known symbols not characters / 4',()=>{
  const r=countHistory([{messages:[m('u','user','Ciao'),m('a','assistant','TEST123')],page_info:{has_previous_page:false}}],tokenizer);
  assert.equal(r.total,tokenizer.encode('Ciao').length+tokenizer.encode('TEST123').length);
  assert.equal(r.complete,true);
});
test('Incomplete pagination is never called complete',()=>{
  const r=countHistory([{messages:[m('u','user','Ciao')],page_info:{has_previous_page:true}}],tokenizer);
  assert.equal(r.complete,false);
});
