/* Pure pagination helpers: own implementation, no third-party app code. */
export const PAGE_BATCHES = Object.freeze([1000, 100, 20, 10]);
export const PAGE_LIMIT = 600;
export function cleanPage(input, {initial=false}={}) {
  const obj=input?.data?.conversation ?? input;
  const mapping=obj?.mapping;
  let branchVerified=false;
  let messages=Array.isArray(obj?.messages)?obj.messages:Array.isArray(obj?.data?.messages)?obj.data.messages:null;
  if(!messages&&initial&&Array.isArray(obj?.linear_conversation))messages=obj.linear_conversation;
  if (initial && mapping && obj.current_node){
    const chain=[],seen=new Set();let nodeId=obj.current_node;
    while(nodeId && mapping[nodeId] && !seen.has(nodeId)){
      seen.add(nodeId);
      if(mapping[nodeId].message)chain.push(mapping[nodeId].message);
      nodeId=mapping[nodeId].parent;
    }
    branchVerified=!nodeId;
    if(branchVerified||!messages)messages=chain.reverse();
  }
  if(!Array.isArray(messages))throw Error('La risposta non contiene un elenco di messaggi');
  const records=messages.map(x=>x?.message??x).filter(x=>x&&typeof x==='object');
  const cursors=obj?.page_info??{};
  const oldest=records.find(x=>typeof x.id==='string')?.id??null;
  const first= typeof cursors.start_cursor==='string' && cursors.start_cursor ? cursors.start_cursor:oldest;
  const prev= typeof cursors.has_previous_page==='boolean'? cursors.has_previous_page : null;
  return {messages:records, startCursor:first, hasPrevious:branchVerified?false:prev,
    branchVerified, rawCount:records.length, model:obj?.default_model_slug??null,
    currentNode:obj?.current_node??null, context_window:obj?.context_window,
    model_context_window:obj?.model_context_window, context_metadata:obj?.context_metadata,
    conversation_metadata:obj?.conversation_metadata};
}
export function advanceState(pages, page, seenCursors){
  if(page.hasPrevious!==true) return {action:page.hasPrevious===false?'complete':'unknown'};
  const cursor=page.startCursor;
  if(!cursor) return {action:'error',message:'Manca il cursore della pagina precedente'};
  if(seenCursors.has(cursor))return {action:'error',message:'Il server ha ripetuto il cursore: paginazione fermata'};
  if(pages>=PAGE_LIMIT)return {action:'error',message:`Oltre ${PAGE_LIMIT} pagine: limite di sicurezza`};
  return {action:'next',before:cursor};
}
export function addBatch(counted, map){
  let changed=0;
  for(const item of counted){
    if(!item || typeof item.id!=='string')continue;
    const old=map.get(item.id);
    if(!old||old.tokens!==item.tokens||old.role!==item.role){map.set(item.id,{role:item.role,tokens:item.tokens});changed++;}
  }
  return changed;
}
export function sumBatchMap(map){
  let user=0,assistant=0;
  for(const obj of map.values()){
    if(obj.role==='user')user+=obj.tokens;
    if(obj.role==='assistant')assistant+=obj.tokens;
  }
  return {total:user+assistant,user,assistant,messageCount:map.size};
}
