/* Browser content-script helpers, intentionally independent of external extension. */
(() => {
  const BATCHES=[1000,100,20,10],PAGE_LIMIT=600;
  function clean(input,initial=false){
    const obj=input?.data?.conversation??input;
    const map=obj?.mapping;
    let messages=Array.isArray(obj?.messages)?obj.messages:Array.isArray(obj?.data?.messages)?obj.data.messages:null;
    if(!messages&&initial&&Array.isArray(obj?.linear_conversation))messages=obj.linear_conversation;
    let branchVerified=false;
    if(initial&&map&&obj.current_node){
      const stack=[],visited=new Set();let id=obj.current_node;
      while(id&&map[id]&&!visited.has(id)){visited.add(id);if(map[id].message)stack.push(map[id].message);id=map[id].parent;}
      branchVerified=!id;
      if(branchVerified||!messages)messages=stack.reverse();
    }
    if(!Array.isArray(messages))throw Error('La risposta non contiene un elenco di messaggi');
    const arr=messages.map(x=>x?.message??x).filter(x=>x&&typeof x==='object');
    const info=obj?.page_info??{};
    const cursor=info.start_cursor||arr.find(x=>typeof x.id==='string')?.id||null;
    const prev=typeof info.has_previous_page==='boolean'?info.has_previous_page:null;
    return {messages:arr,rawCount:arr.length,startCursor:cursor,
      hasPrevious:branchVerified?false:prev,branchVerified,
      model:obj?.default_model_slug??null,currentNode:obj?.current_node??null,
      context_window:obj?.context_window,model_context_window:obj?.model_context_window,
      context_metadata:obj?.context_metadata,conversation_metadata:obj?.conversation_metadata,
      truncationObserved:obj?.context_truncation_continuation!=null};
  }
  function next(pages,page,cursors){
    if(page.hasPrevious!==true)return {action:page.hasPrevious===false?'complete':'unknown'};
    if(!page.startCursor)return {action:'error',message:'Cursore mancante'};
    if(cursors.has(page.startCursor))return {action:'error',message:'Cursore ripetuto'};
    if(pages>=PAGE_LIMIT)return {action:'error',message:'Limite pagine raggiunto'};
    return {action:'next',before:page.startCursor};
  }
  function sum(map){let user=0,assistant=0;for(const x of map.values())if(x.role==='user')user+=x.tokens;else if(x.role==='assistant')assistant+=x.tokens;return {user,assistant,total:user+assistant,messageCount:map.size};}
  function merge(batch,map){for(const x of batch)if(typeof x?.id==='string')map.set(x.id,{role:x.role,tokens:x.tokens});}
  globalThis.CGPagination={clean,next,sum,merge,BATCHES,PAGE_LIMIT};
})();
