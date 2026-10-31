import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const content=fs.readFileSync(new URL('../content.js',import.meta.url),'utf8');
const popup=fs.readFileSync(new URL('../popup.html',import.meta.url),'utf8');
const policy=fs.readFileSync(new URL('../alert-policy.js',import.meta.url),'utf8');
test('automatic warning and PDF handoff controls present',()=>{
 assert.match(content,/id="cg-alert"/);assert.match(content,/id="cg-pdf"/);
 assert.match(content,/id="cg-dismiss"/);assert.match(content,/cg_ack_/);
 assert.match(content,/updateAlert\(\)/);
 assert.match(policy,/PDF_REQUEST/);
});
test('popup exposes progress and handoff without a model ceiling',()=>{
 assert.match(popup,/id="thresholdBox"/);
 assert.match(popup,/id="pdfCopy"/);
 assert.doesNotMatch(popup,/limite effettivo del modello/i);
});
