'use strict';
// Every paper stays in its book. Random selection only chooses the opening page.
(function(root){
  const defaults={};
  function create({key,storage=localStorage,now=()=>Date.now(),random=()=>Math.random()}){
    let state={version:1,known:{},baseline:{},changes:{},visit:null},lastWrite=0;
    try{const saved=JSON.parse(storage.getItem(key));if(saved?.version===1&&saved.known&&saved.baseline&&saved.changes)state=saved;}catch{}
    function save(){try{storage.setItem(key,JSON.stringify(state));return true;}catch{return false;}}
    function visit(){
      const at=now();
      if(!state.visit)state.visit={id:Math.floor(random()*0xffffffff).toString(36)+'-'+at,seed:Math.floor(random()*0xffffffff)||1,lastActive:at,draws:{},explored:0,found:0,lastFound:-100,dry:0,quiet:0,events:[]};
      state.visit.lastActive=at;return state.visit;
    }
    function roll(v){let x=v.seed;x^=x<<13;x^=x>>>17;x^=x<<5;v.seed=x>>>0;return v.seed/4294967296;}
    function touch(){visit();if(now()-lastWrite>15000){lastWrite=now();save();}}
    function sync(bookId,items,actor){
      const before=state.baseline[bookId],next={};
      for(const item of items){next[item.id]=item.replies?.length||0;if(before&&item.author!==actor&&(!Object.hasOwn(before,item.id)||next[item.id]>before[item.id]))state.changes[bookId]=true;}
      state.baseline[bookId]=next;save();
    }
    function available(bookId,items,actor){return items.slice();}
    function draw(bookId,candidates,{readIds,lastId}={}){
      const v=visit(),retry=!!v.ready?.[bookId],cached=v.draws[bookId];
      const read=new Set(readIds||state.known[bookId]||[]),eligible=candidates.filter(x=>!read.has(x.id));
      // Preserve a held/unread encounter across reopening and reload. Old saves
      // with a quota-blocked null offer may immediately surface existing paper.
      if(Object.hasOwn(v.draws,bookId)&&!retry&&(cached?candidates.some(x=>x.id===cached):!eligible.length)){save();return cached;}
      if(retry)delete v.ready[bookId];
      // Unread papers first. Within that pool prefer a different author, then a
      // different sheet. Once all are read, revisit them without sticking to one.
      const previous=candidates.find(x=>x.id===lastId)||candidates.find(x=>x.id===cached);
      let pool=eligible.length?eligible:candidates;
      const otherAuthors=previous?pool.filter(x=>x.author&&previous.author&&x.author!==previous.author):[];
      const otherDates=previous?pool.filter(x=>x.date&&previous.date&&x.date!==previous.date):[];
      const otherSheets=previous?pool.filter(x=>x.id!==previous.id):[];
      if(otherAuthors.length)pool=otherAuthors;else if(otherDates.length)pool=otherDates;else if(otherSheets.length)pool=otherSheets;
      v.explored++;const id=pool.length?pool[Math.floor(roll(v)*pool.length)].id:null;
      if(id&&!read.has(id)){v.found++;v.lastFound=v.explored;}
      v.draws[bookId]=id;v.events.push({at:now(),book:bookId,id,reason:id?'encounter':'empty',revisit:retry});save();return id;
    }
    function discover(bookId,id){visit();const ids=state.known[bookId]||=[];if(!ids.includes(id))ids.push(id);save();}
    function known(bookId,id){return !!state.known[bookId]?.includes(id);}
    function changed(bookId){return !!state.changes[bookId];}
    function acknowledge(bookId){delete state.changes[bookId];save();}
    function rest(){} // Retained reader hook; long exchanges no longer hide other paper.
    function returned(bookId){const v=visit();(v.ready||={})[bookId]=true;save();}
    return {sync,draw,available,discover,known,changed,acknowledge,rest,returned,touch,snapshot:()=>JSON.parse(JSON.stringify(state))};
  }
  root.BookDiscovery={create,defaults};
  if(typeof module!=='undefined')module.exports={create,defaults};
})(typeof window==='undefined'?globalThis:window);
