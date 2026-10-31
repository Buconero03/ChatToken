import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../content.js',import.meta.url),'utf8');
const popup=fs.readFileSync(new URL('../popup.html',import.meta.url),'utf8');
test('floating widget shows totals and count coverage, not synthetic limits',()=>{
 for(const id of ['cg-total','cg-user','cg-assistant','cg-message-count','cg-page-count','cg-status'])assert.ok(src.includes(id));
 for(const id of ['cg-capacity','cg-remaining','cg-api-source','cg-health-status'])assert.ok(!src.includes(id));
 assert.ok(!popup.includes('Riferimento ufficiale API'));
});
test('automatic counting engine and refresh are retained',()=>{
 assert.match(src,/pg\.merge\(counted\.records,counts\)/);
 assert.match(src,/await fetchPages\(/);
 assert.match(src,/REFRESH_MS/);
});
