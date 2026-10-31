import test from 'node:test';
import assert from 'node:assert/strict';
import {Tiktoken} from '../vendor/js-tiktoken-core.mjs';
import ranks from '../vendor/o200k_base.mjs';

test('Firefox browser-only namespace processes BPE counting in background module', async () => {
  let handler;
  const oldBrowser = globalThis.browser;
  const oldChrome = globalThis.chrome;
  globalThis.browser={runtime:{onMessage:{addListener(fn){handler=fn;}}}};
  delete globalThis.chrome;
  try {
    await import('../background.mjs?firefox-compat-test');
    assert.equal(typeof handler,'function');
    let actual;
    const page={messages:[{id:'u1',author:{role:'user'},content:{content_type:'text',parts:['Buongiorno!']}}]};
    handler({type:'CG_COUNT_PAGE',page}, {url:'https://chatgpt.com/c/123'}, v=>{actual=v;});
    const encoder=new Tiktoken(ranks);
    assert.equal(actual.ok,true);
    assert.equal(actual.result.records[0].tokens,encoder.encode('Buongiorno!').length);
    assert.equal(actual.result.records[0].role,'user');
    actual=undefined;
    handler({type:'CG_COUNT_PAGE',page}, {url:'https://untrusted.example/'}, v=>{actual=v;});
    assert.equal(actual,undefined, 'non-ChatGPT origins must not invoke counter');
  } finally {
    if(oldBrowser===undefined) delete globalThis.browser;else globalThis.browser=oldBrowser;
    if(oldChrome===undefined) delete globalThis.chrome;else globalThis.chrome=oldChrome;
  }
});
