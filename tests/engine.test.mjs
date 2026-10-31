import test from 'node:test';
import assert from 'node:assert/strict';
import {collect,countHistory} from '../engine.mjs';
import {Tiktoken} from '../vendor/js-tiktoken-core.mjs';
import ranks from '../vendor/o200k_base.mjs';
const E = new Tiktoken(ranks);
const n=(id,role,text,ts, channel=role==='assistant'?'final':null)=>({id,author:{role},content:{content_type:'text',parts:[text]},create_time:ts,channel,end_turn:role==='assistant'});
test('pagination and unique message IDs',()=>{
 const pages=[{messages:[n('a','user','Ciao',1),n('b','assistant','OK',2)],page_info:{has_previous_page:true}}, {messages:[n('a','user','Ciao',1),n('c','user','prima',0)],page_info:{has_previous_page:false}}];
 const result=countHistory(pages,E);
 assert.equal(result.messageCount,3);assert.equal(result.complete,true);assert.equal(result.total,E.encode('Ciao').length+E.encode('OK').length+E.encode('prima').length);
});
test('ignore reasoning and tool messages',()=>{
 const page={messages:[n('u','user','Ciao',0),n('f','assistant','OK',1),n('t','tool','internal',1),n('r','assistant','thought',1,'analysis')],page_info:{has_previous_page:true}};
 const r=collect([page]);assert.equal(r.messages.length,2);assert.equal(r.complete,false);
});
