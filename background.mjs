const chrome = globalThis.browser || globalThis.chrome; // Background: worker in Chromium, event page in Firefox/Safari
import { Tiktoken } from './vendor/js-tiktoken-core.mjs';
import ranks from './vendor/o200k_base.mjs';
import { countPage } from './engine.mjs';
let encoder;
chrome.runtime.onMessage.addListener((request,sender,respond)=>{
  if(request?.type!=='CG_COUNT_PAGE'|| !sender?.url?.startsWith('https://chatgpt.com/'))return false;
  try {
    if(!Array.isArray(request.page?.messages)||request.page.messages.length>2000)throw Error('Pagina non valida');
    encoder??=new Tiktoken(ranks);
    respond({ok:true,result:countPage(request.page,encoder)});
  }catch(e){respond({ok:false,error:String(e?.message||e)});}
  return false;
});
