(() => {
  'use strict';
  const chrome = globalThis.browser || globalThis.chrome; // Shared WebExtensions adapter
  if (globalThis.__CONTEXT_GUARDIAN_120__) return;
  globalThis.__CONTEXT_GUARDIAN_120__ = true;
  const DEFAULTS={enabled:true,deep:true,widgetVisible:true};
  const REFRESH_MS=120_000, TIMEOUT_MS=180_000, SESSION_COOLDOWN=120_000;
  let config={...DEFAULTS},stats=null,status='Avvio…',lastError='';
  let activeId=currentId(),revision=0,controller=null,busy=false,lastRequest=0,domTimer=0, observed=null,lastDomSignature='',cooldownUntil=0;
  const pg=globalThis.CGPagination;
  const policy=globalThis.CGAlertPolicy;
  let alertAck=new Set(), alertShown=null, alertTimer=null;

  const CG_ICON_URL=(chrome.runtime && typeof chrome.runtime.getURL==='function')?chrome.runtime.getURL('icons/icon32.png'):'';
  const panel=document.createElement('aside');
  panel.id='cg07';panel.className='cg-minimized';
  panel.innerHTML=`<div class="cg-chip-row">
    <button type="button" class="cg-trigger" id="cg-toggle" aria-expanded="false" aria-controls="cg-card" title="Apri o chiudi i dettagli dei token">
      <img class="cg-emblem" src="${CG_ICON_URL}" alt="" aria-hidden="true">
      <span class="cg-compact-text"><strong>Token</strong><small id="cg-small-info">Lettura…</small></span>
      <strong class="cg-compact-number" id="cg-small-number">—</strong>
      <span class="cg-toggle-icon" aria-hidden="true">⌃</span>
    </button>
    <button type="button" class="cg-hide-widget" id="cg-hide-widget" title="Nascondi il mini-contatore (resta attivo)" aria-label="Nascondi il mini-contatore">×</button>
  </div>
  <section id="cg-card" class="cg-card" aria-label="Dettagli Context Guardian">
    <div class="cg-card-head"><img class="cg-brand-symbol" src="${CG_ICON_URL}" alt="" aria-hidden="true"><div class="cg-heading"><strong>Context Guardian</strong><small>Monitor della conversazione</small></div><button id="cg-close-panel" class="cg-icon-btn" type="button" aria-label="Chiudi dettagli">×</button></div>
    <div class="cg-card-body">
      <div class="cg-title-row"><span>Token del testo storico</span><span id="cg-quality" class="cg-quality">In lettura</span></div>
      <div id="cg-total" class="cg-big">—</div>
      <div class="cg-two"><div><small>Tuoi messaggi</small><strong id="cg-user">—</strong></div><div><small>Risposte ChatGPT</small><strong id="cg-assistant">—</strong></div></div>
      <div class="cg-threshold" id="cg-threshold" hidden>
        <div class="cg-threshold-row"><span>Soglia preventiva · storico</span><strong>250.000</strong></div>
        <div class="cg-meter" role="progressbar" aria-label="Token storici rispetto alla soglia" aria-valuemin="0" aria-valuemax="250000" aria-valuenow="0" id="cg-meter"><span id="cg-meter-fill"></span></div>
        <div class="cg-threshold-note" id="cg-threshold-note">—</div>
        <button type="button" id="cg-pdf-inline" class="cg-inline-pdf" hidden>↗ Copia richiesta per il PDF</button>
        <small id="cg-inline-copy-state" role="status" aria-live="polite"></small>
      </div>
      <details class="cg-details"><summary>Dettagli tecnici</summary>
        <div class="cg-pair"><span>Messaggi contati</span><strong id="cg-message-count">—</strong></div>
        <div class="cg-pair"><span>Pagine lette</span><strong id="cg-page-count">—</strong></div>
        <div class="cg-pair"><span>Modello rilevato</span><strong id="cg-model">—</strong></div>
      </details>
      <div class="cg-status" id="cg-status" role="status">Avvio…</div>
      <button id="cg-update" class="cg-action" type="button">↻ Aggiorna conteggio</button>
      <p class="cg-foot">Il totale è riferito al testo storico. Non misura il contesto attivo del modello.</p>
    </div>
  </section>
  <section class="cg-alert" id="cg-alert" role="status" aria-live="polite" aria-labelledby="cg-alert-title" hidden>
      <div class="cg-alert-top"><span class="cg-alert-bullet" aria-hidden="true">!</span><strong id="cg-alert-title">Promemoria progetto</strong><button id="cg-dismiss" type="button" aria-label="Chiudi avviso" title="Chiudi">×</button></div>
      <p id="cg-alert-body"></p>
      <div class="cg-alert-buttons"><button id="cg-pdf" type="button">Copia richiesta PDF</button><span id="cg-copy-state" role="status" aria-live="polite"></span></div>
  </section>`;
  const el=id=>panel.querySelector('#'+id);
  function currentId() {return location.pathname.match(/(?:^|\/)c\/([a-z0-9-]+)(?:\/|$)/i)?.[1]??'';}
  function fmt(n){return Number.isFinite(n)?String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):'—';}
  function mount(){if(document.body&&!panel.isConnected)document.body.appendChild(panel);}
  function quality(){if(lastError&&!stats?.messageCount)return 'error';if(stats?.complete&&stats?.messageCount)return 'complete';if(stats?.messageCount)return 'partial';return 'loading';}
  function snapshot(){return {ok:true,status,error:lastError,enabled:config.enabled,deep:config.deep,conversationId:currentId(),stats};}
  function render(){
    mount();panel.style.display=config.enabled&&config.widgetVisible?'':'none';if(!config.enabled)return;
    const valid=stats?.messageCount>0&&Number.isFinite(stats.total);
    const kind=quality();panel.dataset.kind=kind;
    el('cg-total').textContent=valid?fmt(stats.total):'—';
    el('cg-small-number').textContent=valid?fmt(stats.total):'—';
    el('cg-small-info').textContent=kind==='complete'?'Cronologia recuperata':kind==='partial'?'Conteggio parziale':kind==='error'?'Errore di lettura':'In lettura';
    el('cg-quality').textContent=kind==='complete'?'Completa':kind==='partial'?'Parziale':kind==='error'?'Errore':'In lettura';
    el('cg-user').textContent=valid?fmt(stats.user):'—';
    el('cg-assistant').textContent=valid?fmt(stats.assistant):'—';
    el('cg-model').textContent=stats?.model||'In rilevamento';
    el('cg-message-count').textContent=valid?fmt(stats.messageCount):'—';
    el('cg-page-count').textContent=valid?fmt(stats.pages):'—';
    el('cg-status').textContent=`${status}${valid?` · ${fmt(stats.messageCount)} messaggi / ${fmt(stats.pages)} pagine`:''}`;
    el('cg-status').title=lastError||'';
    renderThreshold(valid?stats.total:null,!!stats?.complete);
    updateAlert();
  }
  function renderThreshold(total,complete){
    const t=policy.evaluate(total,complete), has=t.counted!==null;
    el('cg-threshold').hidden=!has;
    if(!has)return;
    el('cg-meter').setAttribute('aria-valuenow',String(Math.min(t.counted,policy.LIMIT)));
    el('cg-meter-fill').style.width=(t.ratio*100).toFixed(2)+'%';
    el('cg-threshold').dataset.level=t.level;
    el('cg-pdf-inline').hidden=!['warning','exceeded'].includes(t.level);
    const missing=complete?'':' · recupero incompleto';
    el('cg-threshold-note').textContent=t.level==='exceeded'?
      `Soglia storica superata di ${fmt(t.counted-policy.LIMIT)} token${missing}`:
      `${fmt(t.remaining)} token alla soglia storica${missing}`;
  }
  function clearAlertTimer(){if(alertTimer){clearTimeout(alertTimer);alertTimer=null;}}
  function isPanelOpen(){return !panel.classList.contains('cg-minimized');}
  function updateAlert(){
    const t=policy.evaluate(stats?.messageCount?stats.total:null,!!stats?.complete);
    const id=currentId();
    panel.dataset.warning=['warning','exceeded'].includes(t.level)?t.level:'';
    if(!id||!['warning','exceeded'].includes(t.level)||!config.widgetVisible){
      el('cg-alert').hidden=true;clearAlertTimer();return;
    }
    const key=`${id}:${t.level}`;
    if(alertAck.has(key)||isPanelOpen()){el('cg-alert').hidden=true;return;}
    if(alertShown!==key){
      alertShown=key;
      clearAlertTimer();
      // Passive notification: no forced expansion, no focus stealing.
      alertTimer=setTimeout(()=>{acknowledge(key);},18000);
    }
    el('cg-alert').hidden=false;
    el('cg-alert').dataset.level=t.level;
    el('cg-alert-title').textContent=t.level==='exceeded'?'Soglia storica raggiunta':'Checkpoint consigliato';
    el('cg-alert-body').textContent=t.level==='exceeded'?
      `${fmt(t.counted)} token di testo storico. È consigliabile preparare un PDF per continuare in una nuova chat.`:
      `${fmt(t.counted)} token storici · ${fmt(t.remaining)} alla soglia di 250.000. Prepara un PDF di passaggio consegne.`;
  }
  async function acknowledge(explicitKey=null){
    const t=policy.evaluate(stats?.total,!!stats?.complete);
    const id=currentId();if(!id)return;
    el('cg-alert').hidden=true;clearAlertTimer();
    const key=explicitKey||(`${id}:${t.level}`);
    if(['warning','exceeded'].includes(key.split(':').at(-1))){
      alertAck.add(key);
      try{await chrome.storage.local.set({[`cg_ack_${key}`]:true});}catch{}
    }
  }
  async function copyPdf(target){
    try{await navigator.clipboard.writeText(policy.PDF_REQUEST);target.textContent='Copiato! Incolla il testo nella chat.';}
    catch{target.textContent='Apri il popup dell’estensione per copiare la richiesta.';}
  }
  el('cg-dismiss').addEventListener('click',()=>{acknowledge();});
  el('cg-pdf').addEventListener('click',()=>copyPdf(el('cg-copy-state')));
  el('cg-pdf-inline').addEventListener('click',()=>copyPdf(el('cg-inline-copy-state')));
  async function loadAcknowledgements(){
    try{
      const keys=Object.keys(await chrome.storage.local.get(null)).filter(k=>k.startsWith('cg_ack_'));
      alertAck=new Set(keys.map(k=>k.slice(7)));render();
    }catch{}
  }
  function setPanelOpen(open){
    panel.classList.toggle('cg-minimized',!open);
    el('cg-toggle').setAttribute('aria-expanded',String(open));
    if(open){if(!el('cg-alert').hidden)acknowledge();el('cg-alert').hidden=true;clearAlertTimer();}
    render();
  }
  el('cg-toggle').addEventListener('click',()=>setPanelOpen(isPanelOpen()?false:true));
  el('cg-close-panel').addEventListener('click',()=>setPanelOpen(false));
  el('cg-hide-widget').addEventListener('click',async()=>{
    config.widgetVisible=false;el('cg-alert').hidden=true;clearAlertTimer();render();
    try{await chrome.storage.local.set({widgetVisible:false});}catch{}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.isConnected){
    if(!el('cg-alert').hidden)acknowledge();else if(isPanelOpen())setPanelOpen(false);
  }});
  el('cg-update').addEventListener('click',()=>refresh(true));
  chrome.runtime.onMessage.addListener((request,sender,respond)=>{
    if(request?.type==='CG_GET_STATE'){respond(snapshot());return false;}
    if(request?.type==='CG_REFRESH'){refresh(true);respond({ok:true});return false;}
    return false;
  });
  function minimalCountingPage(page){
    const messages=(page.messages??[]).flatMap(item=>{
      const m=item?.message??item;
      const role=m?.author?.role;
      if(role!=='user'&&role!=='assistant')return [];
      const c=m?.content??{};
      const parts=(Array.isArray(c.parts)?c.parts:typeof c.text==='string'?[c.text]:[])
        .flatMap(p=>typeof p==='string'?[p]:(p&&typeof p.text==='string'&&(p.type==='text'||p.content_type==='text'))?[p.text]:[]);
      if(!parts.length)return [];
      return [{id:m.id,author:{role},content:{content_type:'text',parts},
         channel:m.channel,end_turn:m.end_turn,status:m.status,
         metadata:{is_visually_hidden_from_conversation:m.metadata?.is_visually_hidden_from_conversation,
          is_thinking_preamble_message:m.metadata?.is_thinking_preamble_message}}];
    });
    return {...page,messages};
  }
  async function countPage(page){
    const response=await chrome.runtime.sendMessage({type:'CG_COUNT_PAGE',page:minimalCountingPage(page)});
    if(!response?.ok)throw Error(response?.error||'Tokenizer non disponibile');return response.result;
  }
  function recompute(counter,pages,complete,modelInfo,note){return {...pg.sum(counter),pages,complete,rawRecords:counter.size,model:modelInfo?.model||'non rilevato',truncationObserved:!!modelInfo?.truncationObserved,kind:'historical-text-only',source:note};}
  function readDomMessages(){
    const items=[],seen=new Set();
    for(const elem of document.querySelectorAll('[data-message-author-role]')) {
      const role=elem.getAttribute('data-message-author-role');if(role!=='user'&&role!=='assistant')continue;
      const parent=elem.closest('[data-testid^="conversation-turn-"],[data-turn-id]');
      const id=parent?.getAttribute('data-turn-id')||parent?.getAttribute('data-testid')||'dom-'+items.length;
      const txt=elem.innerText?.trim()||'';if(!txt||seen.has(id))continue;
      seen.add(id);items.push({id,author:{role},content:{content_type:'text',parts:[txt]},channel:role==='assistant'?'final':null,end_turn:true,create_time:items.length});
    }
    return items;
  }
  async function domPreview(seq,force=false){
    if(stats?.complete&&!force)return;
    const messages=readDomMessages();if(!messages.length)return;
    const result=await countPage({messages,model:null});
    const store=new Map();pg.merge(result.records,store);
    if(seq===revision&&(!stats?.messageCount||force)){
      stats=recompute(store,1,false,result.modelInfo,'DOM visibile');
      status='Vista parziale: la pagina non contiene necessariamente tutti i messaggi';render();
    }
  }
  async function getJson(path,signal,headers={}){
    const res=await fetch(path,{credentials:'include',cache:'no-store',headers:{Accept:'application/json',...headers},signal});
    if(!res.ok){const err=Error(`HTTP ${res.status} (${path.split('?')[0]})`);err.http=res.status;throw err;}
    try{return await res.json();}catch{throw Error('La risposta del server non è JSON');}
  }
  function cookie(name){const s=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=document.cookie.match(new RegExp('(?:^|; )'+s+'=([^;]*)'));return match?decodeURIComponent(match[1]):'';}
  async function fetchPages(id,signal,onPage){
    const session=await getJson('/api/auth/session',signal);
    const token=session?.accessToken||session?.access_token;
    if(!token)throw Error('Sessione non disponibile: impossibile recuperare le pagine');
    const account=session?.account?.id||session?.accountId||session?.account_id||cookie('_account');
    const device=cookie('oai-did');
    const initialPath=`/backend-api/conversation/${encodeURIComponent(id)}`;
    const olderPath=`/backend-api/conversations/${encodeURIComponent(id)}/messages`;
    function headers(path,route){return {Authorization:`Bearer ${token}`,
      'OAI-Language':navigator.language||'it-IT',
      'x-openai-target-path':path,'x-openai-target-route':route,
      ...(account?{'chatgpt-account-id':account}:{}),...(device?{'oai-device-id':device}:{})};}
    async function getBatch(path,route,before){
      let last;
      for(const n of pg.BATCHES){
        const q=new URLSearchParams({num_turns:String(n),include_has_versions:'true'});
        if(before)q.set('before',before);
        try{return await getJson(`${path}?${q}`,signal,headers(path,route));}
        catch(e){last=e;if(![400,413,422].includes(e.http))throw e;}
      }
      throw last;
    }
    let pages=0,modelInfo=null,firstNode=null,branchVerified=false,truncationObserved=false;
    const cursors=new Set();
    const first=pg.clean(await getBatch(initialPath,'/backend-api/conversation/{conversation_id}',null),true);
    firstNode=first.currentNode;
    modelInfo={model:first.model||null,contextLimit:null,reportedRemaining:null,truncationObserved:!!first.truncationObserved};
    branchVerified=first.branchVerified;
    let current=first;
    while(true){
      if(signal.aborted)throw Error('Operazione annullata');
      pages++;
      modelInfo.truncationObserved ||= !!current.truncationObserved;
      await onPage(current,pages,modelInfo,branchVerified);
      const decision=pg.next(pages,current,cursors);
      if(decision.action==='complete')return {pages,complete:true,branchVerified,modelInfo,currentNode:firstNode};
      if(decision.action==='unknown')throw Error('Paginazione: il server non comunica se esistono pagine precedenti');
      if(decision.action==='error')throw Error('Paginazione: '+decision.message);
      cursors.add(decision.before);
      try{
        current=pg.clean(await getBatch(olderPath,'/backend-api/conversations/{conversation_id}/messages',decision.before));
      }catch(e){
        const code=e.http?`HTTP ${e.http}`:String(e.message||e);
        throw Error(`Pagina ${pages+1}, dopo ${pages} pagine: ${code}`);
      }
      if(!current.rawCount)throw Error(`Pagina ${pages+1}: il server ha restituito zero messaggi`);
    }
  }
  async function refresh(force=false){
    if(!config.enabled||busy)return;
    const id=currentId();if(!id){stats=null;status='Apri una conversazione ChatGPT';render();return;}
    const now=Date.now();
    if(now<cooldownUntil){status='Limite temporaneo del server; riprova più tardi';render();return;}
    if(!force&&now-lastRequest<REFRESH_MS)return;
    busy=true;lastRequest=now;const seq=++revision;
    controller?.abort();const ctrl=new AbortController();controller=ctrl;
    const timer=setTimeout(()=>ctrl.abort(),TIMEOUT_MS);
    lastError='';
    try {
      status='Lettura della conversazione…';render();
      await domPreview(seq);
      if(!config.deep){status=stats?.messageCount?'Solo messaggi visualizzati: parziale':'Nessun messaggio testuale visibile';return;}
      const counts=new Map();let currentModel=null;
      const summary=await fetchPages(id,ctrl.signal,async(page,nPages,modelInfo,branchVerified)=>{
        if(seq!==revision||currentId()!==id)throw Error('La conversazione è cambiata');
        // Never re-tokenize the entire history on each page: count only this page.
        const pageMessages = nPages===1 ? page.messages : page.messages.filter(x => !counts.has(x?.id));
        const counted=await countPage({messages:pageMessages,default_model_slug:page.model,
           context_window:page.context_window,model_context_window:page.model_context_window,
           context_metadata:page.context_metadata,conversation_metadata:page.conversation_metadata});
        pg.merge(counted.records,counts);
        if(nPages===1)currentModel=counted.modelInfo;
        if(currentModel)currentModel.truncationObserved ||= !!modelInfo?.truncationObserved;
        stats=recompute(counts,nPages,false,currentModel||modelInfo,'API interna (parziale)');
        stats.branchVerified=branchVerified;
        status=`Recuperate ${nPages} ${nPages===1?'pagina':'pagine'} · ${fmt(stats.messageCount)} messaggi · lettura in corso`;
        render();
      });
      if(seq!==revision||currentId()!==id)return;
      if(currentModel)currentModel.truncationObserved ||= !!summary.modelInfo?.truncationObserved;
      stats=recompute(counts,summary.pages,summary.complete,currentModel||summary.modelInfo,'API interna');
      stats.branchVerified=summary.branchVerified;
      status=summary.complete?'Cronologia recuperata; token del solo testo':'Cronologia incompleta';
    }catch(e){
      if(seq!==revision)return;
      lastError=ctrl.signal.aborted?'Timeout: recupero troppo lungo':String(e?.message||e);
      if(/HTTP 429/.test(lastError))cooldownUntil=Date.now()+SESSION_COOLDOWN;
      status=`${lastError}${stats?.messageCount?' · conteggio parziale disponibile':' · nessun conteggio verificato'}`;
      if(!stats?.messageCount)try{await domPreview(seq,true);}catch{}
    }finally{clearTimeout(timer);if(seq===revision){busy=false;render();}}
  }
  const observer=new MutationObserver(()=>{
    clearTimeout(domTimer);domTimer=setTimeout(async()=>{
      if(!config.enabled)return;
      if(!config.deep){
        const sig=readDomMessages().map(x=>x.id+':'+x.content.parts.join('').length).join('|');
        if(sig!==lastDomSignature){lastDomSignature=sig;await domPreview(revision,true);status='Solo messaggi visibili: conteggio parziale';render();}
      }else if(!busy)refresh();
    },1900);
  });
  function observeMain(){const root=document.querySelector('main');if(root!==observed){observed=root;observer.disconnect();if(root)observer.observe(root,{childList:true,subtree:true,characterData:true});}}
  chrome.storage.local.get(DEFAULTS).then(values=>{config={...DEFAULTS,...values};status='Pronto';render();loadAcknowledgements();refresh(true);}).catch(e=>{status='Errore impostazioni: '+e.message;render();});
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=='local'||!['enabled','deep','widgetVisible'].some(k=>k in changes))return;
    for(const key of Object.keys(DEFAULTS))if(changes[key])config[key]=changes[key].newValue;
    if(Object.keys(changes).every(key=>key==='widgetVisible')){render();return;}
    controller?.abort();revision++;busy=false;stats=null;lastRequest=0;render();refresh(true);
  });
  setInterval(()=>{
    mount();observeMain();const id=currentId();
    if(id!==activeId){activeId=id;controller?.abort();revision++;busy=false;stats=null;alertShown=null;clearAlertTimer();lastRequest=0;status=id?'Cambio conversazione…':'Apri una chat';render();refresh(true);}
    else if(config.deep&&!busy&&Date.now()-lastRequest>REFRESH_MS)refresh();
  },2500);
  observeMain();render();
})();
