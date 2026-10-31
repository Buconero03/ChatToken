/* Independent, local BPE engine. Counts recoverable historical text only. */
export function extractText(node) {
  const c = node?.content;
  if (!c || typeof c !== 'object') return '';
  if (Array.isArray(c.parts)) return c.parts.map(p => typeof p === 'string' ? p :
    (p && typeof p === 'object' && (p.content_type === 'text' || p.type === 'text') && typeof p.text === 'string' ? p.text : '')).filter(Boolean).join('\n');
  if (typeof c.text === 'string' && ['text','multimodal_text'].includes(c.content_type)) return c.text;
  return '';
}
export function isCountable(node) {
  const role = node?.author?.role;
  if (role !== 'user' && role !== 'assistant') return false;
  const m = node?.metadata ?? {};
  if (m.is_visually_hidden_from_conversation || m.is_thinking_preamble_message) return false;
  if (node?.status === 'failed') return false;
  if (role === 'assistant' && node.channel !== 'final' && !(node.channel == null && node.end_turn === true)) return false;
  return Boolean(extractText(node).trim());
}
const validLimit = n => Number.isSafeInteger(n) && n >= 8192 && n <= 2097152;
function explicitMetric(pages, paths) {
  for (const page of pages) {
    for (const path of paths) {
      let o=page;
      for (const k of path) o=o && typeof o === 'object' ? o[k] : undefined;
      if (validLimit(o)) return o;
    }
  }
  return null;
}
export function resolveModel(pages) {
  const front=pages[0] ?? {};
  const model=front.default_model_slug || pages.flatMap(p => p.messages || []).find(m => m?.metadata?.model_slug)?.metadata?.model_slug || 'non rilevato';
  // Only explicitly contextual metrics originating in the ChatGPT conversation
  // payload qualify. An API-model maximum is NOT ChatGPT's session limit.
  const contextLimit=explicitMetric(pages,[['context_window'],['model_context_window'],['context_metadata','context_window'],['conversation_metadata','context_window']]);
  const activeInputTokens=explicitMetric(pages,[['context_metadata','active_input_tokens'],['context_metadata','input_tokens']]);
  const remainingCandidate=pages.map(p=>p?.context_metadata?.remaining_tokens).find(x=>Number.isSafeInteger(x)&&x>=0&&x<=2097152);
  const reportedRemaining=remainingCandidate??null;
  return {model, contextLimit, activeInputTokens, reportedRemaining,
    limitSource:contextLimit != null ? 'Metadati espliciti della conversazione' : null};
}
export function collect(pages) {
  const byId=new Map();
  for(const page of pages){
    for(const entry of (Array.isArray(page?.messages)?page.messages:[])) {
      const n=entry?.message || entry;
      if(typeof n?.id === 'string' && !byId.has(n.id)) byId.set(n.id,n);
    }
  }
  const earliest=pages.at(-1), complete=earliest?.page_info?.has_previous_page === false;
  const sorted=[...byId.values()].filter(isCountable).sort((a,b) => (a.create_time ?? 0)-(b.create_time ?? 0));
  let attachments=0;
  for(const node of byId.values()) {
    const content=node?.content;
    if(content?.content_type === 'multimodal_text' || (Array.isArray(content?.parts) && content.parts.some(p => p && typeof p !== 'string' && !(p.content_type === 'text' || p.type === 'text')))) attachments++;
  }
  return {messages:sorted.map(n=>({id:n.id,role:n.author.role,text:extractText(n)})),
    pages:pages.length, rawRecords:byId.size, complete, nonTextMessages:attachments,
    branchVerified:false, // Flat/paginated message arrays do not guarantee parent-branch ancestry.
    notes: [...(!complete?['Cronologia precedente non interamente recuperata.']:[]),
      'Conteggio storico del testo; non equivale al contesto attivo o al consumo cumulativo API.',
      'Rami alternativi non garantiti nei dati a lista; nessuna pretesa di precisione del contesto server.']};
}
export function countHistory(pages, encoder) {
  const data=collect(pages);
  let user=0, assistant=0;
  const byMessage=[];
  for(const item of data.messages) {
    const n=encoder.encode(item.text).length;
    if(item.role==='user') user+=n; else assistant+=n;
    byMessage.push({id:item.id,role:item.role,tokens:n});
  }
  const modelInfo=resolveModel(pages);
  const lastTurn=byMessage.at(-1)?.tokens ?? null;
  return {...modelInfo, pages:data.pages, rawRecords:data.rawRecords,
    complete:data.complete, nonTextMessages:data.nonTextMessages,
    branchVerified:data.branchVerified, notes:data.notes,
    user,assistant,total:user+assistant,messageCount:data.messages.length,lastTurn,
    encoding:'o200k_base', kind:'historical-text-only'};
}

/** Single-page counting avoids O(n^2) repeated tokenization during history loading. */
export function countPage(page,encoder){
  const seen=new Set(),records=[];
  for(const entry of (page?.messages??[])){
    const message=entry?.message??entry;
    if(typeof message?.id!=='string'||seen.has(message.id))continue;
    seen.add(message.id);
    if(!isCountable(message))continue;
    records.push({id:message.id,role:message.author.role,tokens:encoder.encode(extractText(message)).length});
  }
  return {records,rawCount:Array.isArray(page?.messages)?page.messages.length:0,
    modelInfo:resolveModel([page])};
}
