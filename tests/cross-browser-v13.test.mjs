import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const get=(browser)=>JSON.parse(fs.readFileSync(path.join(root,'packaging',`manifest.${browser}.json`),'utf8'));
test('all browser variants share identical tokenizer, content scripts, and permissions',()=>{
  const list=['chromium','firefox','safari'].map(get);
  for(const m of list){
    assert.equal(m.manifest_version,3); assert.equal(m.version,'1.3.0');
    assert.deepEqual(m.permissions,['storage','tabs']);
    assert.deepEqual(m.host_permissions,['https://chatgpt.com/*']);
    assert.deepEqual(m.content_scripts,list[0].content_scripts);
    assert.deepEqual(m.icons,list[0].icons);
  }
});
test('browser-specific backgrounds load same tokenizer entry',()=>{
 assert.deepEqual(get('chromium').background,{service_worker:'background.mjs',type:'module'});
 for(const b of ['firefox','safari']) assert.deepEqual(get(b).background,{scripts:['background.mjs'],type:'module'});
});
test('source supports browser.* and chrome.* without altering engine',()=>{
 for(const name of ['content.js','popup.js','background.mjs']) assert.match(fs.readFileSync(path.join(root,name),'utf8'),/globalThis\.browser \|\| globalThis\.chrome/);
 assert.match(fs.readFileSync(path.join(root,'engine.mjs'),'utf8'),/countPage/);
});
