import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(new URL('../manifest.json', import.meta.url)));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf-8'));
test('custom Chrome icon references include all required PNG sizes',()=>{
  assert.equal(manifest.version,'1.3.0');
  for(const size of [16,32,48,128]){
    assert.equal(manifest.icons[String(size)],`icons/icon${size}.png`);
    assert.equal(manifest.action.default_icon[String(size)],`icons/icon${size}.png`);
    const bytes=fs.readFileSync(path.join(root,`icons/icon${size}.png`));
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
  }
});
test('brand image is used in popup and floating widget',()=>{
  const popup=fs.readFileSync(path.join(root,'popup.html'),'utf8');
  const content=fs.readFileSync(path.join(root,'content.js'),'utf8');
  assert.match(popup,/icons\/icon48\.png/);
  assert.match(content,/CG_ICON_URL/);
  assert.match(content,/icons\/icon32\.png/);
});
test('repo publisher defaults private and requires explicit public confirmation',()=>{
  const pub=fs.readFileSync(path.join(root,'scripts/Publish-GitHub.ps1'),'utf8');
  assert.match(pub,/\$Visibility\s*=\s*'private'/);
  assert.match(pub,/Read-Host "To confirm, type PUBLIC"/);
  assert.match(pub,/gh repo create/);
  assert.match(pub,/git push -u origin main/);
});
