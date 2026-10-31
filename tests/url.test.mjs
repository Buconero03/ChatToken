import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const content=fs.readFileSync(new URL('../content.js',import.meta.url),'utf8');
const match=content.match(/function currentId\(\)\s*\{return location\.pathname\.match\((\/.*?\/i)\)\?\.\[1\]\?\?'';\}/);
assert.ok(match,'currentId regex present');
const matcher=new Function('path',`return path.match(${match[1]})?.[1]??''`);
test('regular chat',()=>assert.equal(matcher('/c/6ad6629c-6e44-83eb-902d-f31a6d3ec5a8'),'6ad6629c-6e44-83eb-902d-f31a6d3ec5a8'));
test('project chat',()=>assert.equal(matcher('/g/g-p-test/c/6ad6629c-6e44-83eb-902d-f31a6d3ec5a8'),'6ad6629c-6e44-83eb-902d-f31a6d3ec5a8'));
test('no chat id',()=>assert.equal(matcher('/'),'') );
