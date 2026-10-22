'use strict';
// Opt-in, memory-only test evidence. No reading text, names or network requests.
window.BookRhythm=(()=>{
  const enabled=new URLSearchParams(location.search).get('playtest')==='rhythm';
  const start=performance.now(),events=[];
  const types=new Set(['session_start','session_end','book_open','book_return','page_turn','artifact_cue_seen','artifact_open','artifact_flip','artifact_return','relay_open','relay_unfold','relay_pen_click','relay_save','relay_return']);
  const ids=new Set(books.map(book=>book[0]));
  let ended=false;
  function record(event_type,book_id=null,detail={}){
    if(!enabled||ended||!types.has(event_type)||events.length>=2000)return;
    const safe={};
    for(const key of ['page','pages','parts'])if(Number.isSafeInteger(detail[key])&&detail[key]>=0)safe[key]=detail[key];
    if(['front','back'].includes(detail.face))safe.face=detail.face;
    if(['postcard','relay','note','stack','fold','rose','envelope','none'].includes(detail.kind))safe.kind=detail.kind;
    events.push({elapsed_ms:Math.round(performance.now()-start),book_id:ids.has(book_id)?book_id:null,event_type,detail:safe});
  }
  function finish(){if(!ended){record('session_end');ended=true;}return events.map(event=>({...event,detail:{...event.detail}}));}
  if(enabled){record('session_start');addEventListener('pagehide',finish);}
  return {enabled,record,export:()=>events.map(event=>({...event,detail:{...event.detail}})),finish};
})();
