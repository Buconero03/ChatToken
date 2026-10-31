import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../alert-policy.js',import.meta.url),'utf8');
const scope={};scope.globalThis=scope;vm.runInNewContext(source,scope);
const p=scope.CGAlertPolicy;
test('operational limit and prewarning precisely 10,000 tokens before',()=>{
 assert.equal(p.LIMIT,250000);assert.equal(p.WARNING,240000);assert.equal(p.ALERT_BEFORE,10000);
});
test('transition boundaries and no fabricated negative remainder',()=>{
 for(const [tokens,level,remaining] of [[0,'normal',250000],[239999,'normal',10001],[240000,'warning',10000],[249999,'warning',1],[250000,'exceeded',0],[250001,'exceeded',0]]){
   const r=p.evaluate(tokens,true);assert.equal(r.level,level);assert.equal(r.remaining,remaining);
 }
});
test('unknown and incomplete are distinguished from real active context',()=>{
 assert.equal(p.evaluate(null,false).level,'unknown');
 assert.equal(p.evaluate(NaN,false).level,'unknown');
 assert.equal(p.evaluate(240100,false).level,'warning');
 assert.equal(p.evaluate(240100,false).complete,false);
});
test('handoff prompt is substantive but does not claim extension creates PDF',()=>{
 assert.match(p.PDF_REQUEST,/PDF/i);assert.match(p.PDF_REQUEST,/test/i);
 assert.match(p.PDF_REQUEST,/non inventare/i);
 assert.match(p.PDF_REQUEST,/nuova chat/i);
});
test('manifest loads policy before content and popup; no notification permission',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));
 const files=manifest.content_scripts[0].js;
 assert.ok(files.indexOf('alert-policy.js')<files.indexOf('content.js'));
 assert.ok(!manifest.permissions.includes('notifications'));
 const popup=fs.readFileSync(new URL('../popup.html',import.meta.url),'utf8');
 assert.ok(popup.indexOf('alert-policy.js')<popup.indexOf('popup.js'));
});
