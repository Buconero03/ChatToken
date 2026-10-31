import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir=new URL('../',import.meta.url);
const read=(name)=>fs.readFileSync(new URL(name,dir),'utf8');
test('notification is a status, not a modal, and never forces opening',()=>{
 const js=read('content.js');
 assert.match(js,/role=\"status\" aria-live=\"polite\"/);
 assert.doesNotMatch(js,/role=\"alertdialog\"/);
 assert.doesNotMatch(js,/panel\.classList\.remove\('cg-minimized'\)/);
 assert.match(js,/setTimeout\(\(\)=>\{acknowledge\(key\);\},18000\)/);
});
test('popup exposes a widget visibility preference',()=>{
 assert.match(read('popup.html'),/id=\"widgetVisible\"/);
 assert.match(read('popup.js'),/widgetVisible:\$\('widgetVisible'\)\.checked/);
 assert.match(read('content.js'),/config\.widgetVisible/);
});
test('badge compact, floating card, and threshold remain in UI CSS',()=>{
 const css=read('content.css');
 assert.match(css,/\.cg-chip-row/);
 assert.match(css,/\.cg-card\{/);
 assert.match(css,/\.cg-alert\{/);
 assert.match(css,/prefers-reduced-motion/);
});
