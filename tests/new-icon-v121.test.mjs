import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(new URL('../manifest.json',import.meta.url)));
function pngDimensions(data) {return [data.readUInt32BE(16),data.readUInt32BE(20)]}
test('new conversation-progress icons are present and valid PNG dimensions',()=>{
 for (const size of [16,32,48,128,256,512]) {
  const b=fs.readFileSync(path.join(root,'icons',`icon${size}.png`));
  assert.equal(b.subarray(1,4).toString(),'PNG');
  assert.deepEqual(pngDimensions(b),[size,size]);
 }
});
