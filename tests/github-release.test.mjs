import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
test('README exposes single repo and three latest release links',()=>{
  const md=read('README.md');
  for(const b of ['CHROMIUM','FIREFOX','SAFARI']) assert.match(md,new RegExp(`releases/latest/download/Context_Guardian_v1\.3\.0_${b}\.zip`));
  assert.match(md,/__REPOSITORY__|[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/);
});
test('publisher uses GitHub releases and actual owner links',()=>{
  const ps=read('scripts/Publish-GitHub.ps1');
  assert.match(ps,/gh release create/);
  assert.match(ps,/gh release upload/);
  assert.match(ps,/__REPOSITORY__/);
  assert.match(ps,/gh repo create/);
});
