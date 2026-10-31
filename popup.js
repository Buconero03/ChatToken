'use strict';
const chrome = globalThis.browser || globalThis.chrome; // Cross-browser WebExtensions API
const $=id=>document.getElementById(id);
const format=n=>Number.isFinite(n)?String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):'—';
let updating=false;
const policy=globalThis.CGAlertPolicy;
function kind(s){if(s?.error&&!s?.stats?.messageCount)return 'error';if(s?.stats?.complete&&s.stats.messageCount)return 'complete';if(s?.stats?.messageCount)return 'partial';return 'loading';}
function paint(s){
  const st=s?.stats,has=st?.messageCount>0&&Number.isFinite(st.total),quality=kind(s);
  $('total').textContent=has?format(st.total):'—';
  $('userTokens').textContent=has?format(st.user):'—';
  $('assistantTokens').textContent=has?format(st.assistant):'—';
  $('state').dataset.kind=quality;
  $('state').textContent=quality==='complete'?'Cronologia letta':quality==='partial'?'Parziale':quality==='error'?'Errore':'Lettura';
  $('runBox').dataset.kind=quality;
  $('messageCount').textContent=has?format(st.messageCount):'—';
  $('pageCount').textContent=has?format(st.pages):'—';
  $('model').textContent=st?.model||'Non rilevato';
  $('branch').textContent=st?.branchVerified?'Verificato':'Non verificabile';
  $('truncation').textContent=st?.truncationObserved?'Metadato presente':'Nessun segnale osservato';
  $('runTitle').textContent=quality==='complete'?'Lettura della cronologia conclusa':quality==='partial'?'Conteggio ancora parziale':quality==='error'?'Recupero non riuscito':'Recupero in corso';
  $('detail').textContent=s?.status||'In attesa dei dati della chat.';
  $('coverage').textContent=has?`${format(st.messageCount)} messaggi · ${format(st.pages)} pagine · solo testo`: 'Nessun conteggio verificato';
  const risk=policy.evaluate(has?st.total:null,st?.complete);
  $('thresholdBox').hidden=!has;
  $('pdfCopy').hidden=!['warning','exceeded'].includes(risk.level);
  if(has){
    $('thresholdFill').style.width=(risk.ratio*100).toFixed(2)+'%';
    $('thresholdBox').dataset.level=risk.level;
    $('thresholdState').textContent=risk.level==='exceeded'?'Superata':risk.level==='warning'?'Attenzione':'Sotto soglia';
    $('thresholdText').textContent=risk.level==='exceeded'?
      `${format(risk.counted)} token storici: prepara un PDF di passaggio consegne.`:
      `${format(risk.remaining)} token storici alla soglia${st.complete?'':' · cronologia parziale'}.`;
  }
}
async function activeTab(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return tab?.id&&/^https:\/\/chatgpt\.com\//.test(tab.url||'')?tab:null;}
async function getState(){const tab=await activeTab();if(!tab)return {status:'Apri una conversazione ChatGPT',error:'no-tab'};try{return await chrome.tabs.sendMessage(tab.id,{type:'CG_GET_STATE'});}catch{return {status:'Estensione non collegata alla pagina: ricarica una volta ChatGPT dopo l’installazione.',error:'not-connected'};}}
async function update(){if(updating)return;updating=true;try{paint(await getState());}finally{updating=false;}}
$('pdfCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(policy.PDF_REQUEST);$('pdfStatus').textContent='Richiesta copiata: incollala nella chat.';}catch{$('pdfStatus').textContent='Copia non riuscita: apri l’avviso dentro la chat.';}});
$('refresh').addEventListener('click',async()=>{const tab=await activeTab();if(tab){try{await chrome.tabs.sendMessage(tab.id,{type:'CG_REFRESH'});$('detail').textContent='Aggiornamento richiesto…';}catch{paint({status:'Impossibile aggiornare: ricarica la scheda una volta dopo l’installazione.',error:'refresh'});}}else paint({status:'Apri una conversazione.',error:'tab'});});
$('settingsToggle').addEventListener('click',()=>{const open=$('settings').hidden;$('settings').hidden=!open;$('settingsToggle').setAttribute('aria-expanded',String(open));$('settingsToggle span').textContent=open?'⌃':'⌄';});
chrome.storage.local.get({enabled:true,deep:true,widgetVisible:true}).then(c=>{$('enabled').checked=c.enabled;$('deep').checked=c.deep;$('widgetVisible').checked=c.widgetVisible;});
$('save').addEventListener('click',async()=>{await chrome.storage.local.set({enabled:$('enabled').checked,deep:$('deep').checked,widgetVisible:$('widgetVisible').checked});$('saved').textContent='Impostazioni salvate';});
update();setInterval(update,2200);
