import test from 'node:test';import assert from 'node:assert/strict';import {resolveModel,countHistory,collect,extractText} from '../engine.mjs';
const m=(id,role,content,create_time)=>({id,author:{role},content,channel:role==='assistant'?'final':null,end_turn:true,create_time});
const page={default_model_slug:'gpt-6-thinking',messages:[m('a','user',{content_type:'text',parts:['Ciao']},1)],page_info:{has_previous_page:false}};
test('GPT-6 chat has no guessed API-derived capacity',()=>{
 const info=resolveModel([page]);assert.equal(info.model,'gpt-6-thinking');assert.equal(info.contextLimit,null);assert.equal(info.reportedRemaining,null);assert.equal(info.reference,undefined);
});
test('genuine explicit chat metadata can report capacity',()=>{
 const info=resolveModel([{...page,context_metadata:{context_window:100000,remaining_tokens:0}}]);
 // An explicitly named contextual field is accepted; API rate limits are never substituted.
 assert.equal(info.contextLimit,100000);assert.equal(info.reportedRemaining,0);
});
test('explicit top-level window accepted only in reasonable range',()=>{
 assert.equal(resolveModel([{...page,context_window:128000}]).contextLimit,128000);
 assert.equal(resolveModel([{...page,context_window:5}]).contextLimit,null);
});
test('rate limit percentage is never context window',()=>{
 const info=resolveModel([{...page,model_limits:[{used_percent:98}],limits_progress:99,rate_limit:{primary_window:{used_percent:100}}}]);
 assert.equal(info.contextLimit,null);assert.equal(info.reportedRemaining,null);
});
test('multimodal text counts textual parts, not attached images',()=>{
 assert.equal(extractText(m('i','user',{content_type:'multimodal_text',parts:['hello',{content_type:'image_asset_pointer',asset_pointer:'SECRET'}]},1)),'hello');
});
