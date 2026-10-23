'use strict';
// Local stationery is separate from the original reading/rose save. Nothing here publishes it.
window.BookSecrets=(()=>{
  const params=new URLSearchParams(location.search),discoveryDemo=params.get('playtest')==='discovery',demo=discoveryDemo||params.get('playtest')==='revisit',discoveryEnabled=params.get('playtest')!=='revisit';
  const actor=demo&&['A','B','N'].includes(params.get('reader'))?params.get('reader'):demo?'A':'local';
  const prefix=discoveryDemo?'paperbook-discovery':demo?'paperbook-revisit':null;
  const KEY=prefix?prefix+'-notes-v1':'paperbook-secrets-v1';
  const DRAFTS=prefix?prefix+'-drafts-v1-'+actor:'paperbook-secret-drafts-v1';
  const READS=prefix?prefix+'-reading-v1-'+actor:'paperbook-secret-reading-v1';
  const gameKey=prefix?prefix+'-game-v1-'+actor:'paperbook-v3';
  const directorKey=discoveryDemo?'paperbook-discovery-visit-v1-'+actor:'paperbook-discovery-v1';
  const director=discoveryEnabled?window.BookDiscovery.create({key:directorKey}):null;
  const authorName=id=>id===actor?'你':id==='local'?'书友':'书友 '+id;
  const seed=()=>({version:1,books:{night:[
    {id:'revisit-B',kind:'stack',author:'B',front:'去年总想着远方，今年却开始喜欢回家的路。等下一次出发时，我想慢一点。',back:'',stock:'cream',replies:[]},
    {id:'revisit-N',kind:'stack',author:'N',front:'今天回家时，抬头看见一架飞机。忽然觉得，暂时不出发也没关系，想去的地方还在那里。',back:'',stock:'cream',replies:[]}
  ]}});
  let reading=demo&&!discoveryDemo?{books:{night:{items:{'revisit-B':{front:true,replies:0}},last:actor==='N'?'revisit-N':'revisit-B'}}}:{books:{}};
  try{const saved=JSON.parse(localStorage.getItem(READS));if(saved?.books&&typeof saved.books==='object'&&!Array.isArray(saved.books))reading=saved;}catch{}
  function seen(bookId,item){return reading.books[bookId]?.items?.[item.id]||{};}
  function unread(bookId,item){
    const mark=seen(bookId,item),own=item.author===actor;
    if(!own&&!mark.front)return 2;
    return item.replies.some((reply,i)=>i>=(mark.replies||0)&&typeof reply==='object'&&reply.author!==actor)?(own?3:1):0;
  }
  function keepSelection(bookId,id){const entry=reading.books[bookId]||={items:{}};entry.last=id;try{localStorage.setItem(READS,JSON.stringify(reading));}catch{}}
  function remember(bookId,item,count=0){
    const book=reading.books[bookId]||={items:{}};book.items||={};
    const old=book.items[item.id]||{};book.items[item.id]={front:true,replies:Math.max(old.replies||0,count)};book.last=item.id;
    try{localStorage.setItem(READS,JSON.stringify(reading));}catch{}
    director?.discover(bookId,item.id);decorate();
  }
  function decorate(){
    const data=read();
    for(const spine of document.querySelectorAll('.spine[data-id]')){
      const all=data.books[spine.dataset.id]||[];
      const visible=director?director.available(spine.dataset.id,all,actor):all;
      const fresh=visible.some(item=>director?unread(spine.dataset.id,item)===3||unread(spine.dataset.id,item)===1:unread(spine.dataset.id,item)>0)||!!director?.changed(spine.dataset.id);
      spine.classList.toggle('has-new-paper',fresh);
      spine.setAttribute('aria-description',fresh?'书页边多露出了一点纸角':'');
    }
  }
  const kinds={fold:'双面折纸',stack:'便笺',relay:'接力信'},stocks={cream:'原色纸',rose:'浅粉纸',sage:'灰绿纸'};
  const esc=value=>String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const text=value=>typeof value==='string'?value.slice(0,1202):'';
  function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value?value:'';}
  const dateFields=value=>validDate(value)?{date:validDate(value)}:{};
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const realSeed=demo&&!discoveryDemo?{}:window.BookRealMaterials();
  let memory=discoveryDemo?window.BookDiscoveryPool():demo?seed():{version:1,books:{}},draftMemory={};
  memory.books={...memory.books,...realSeed};
  function read(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY));
      if(raw?.version!==1||!raw.books||typeof raw.books!=='object')return memory;
      const clean={version:1,books:{}};
      for(const id of new Set([...books.map(book=>book[0]),...Object.keys(raw.books)])){
        clean.books[id]=(Array.isArray(raw.books[id])?raw.books[id]:[]).filter(x=>x&&typeof x.id==='string'&&Object.hasOwn(kinds,x.kind)&&text(x.front).trim()&&(x.kind!=='fold'||text(x.back).trim())).map(x=>({id:x.id.slice(0,80),kind:x.kind,...dateFields(x.date),front:text(x.front),back:text(x.back),stock:Object.hasOwn(stocks,x.stock)?x.stock:'cream',author:typeof x.author==='string'?x.author.slice(0,40):'local',authorName:text(x.authorName).slice(0,30),replies:(Array.isArray(x.replies)?x.replies:[]).filter(y=>typeof y==='string'||y&&typeof y==='object'&&text(y.text).trim()).slice(0,60).map(y=>typeof y==='string'?text(y):{id:typeof y.id==='string'?y.id.slice(0,80):'',author:typeof y.author==='string'?y.author.slice(0,40):'local',authorName:text(y.authorName).slice(0,30),...dateFields(y.date),text:text(y.text)})}));
      }
      // Merge new source paper by stable identity; preserve old notes and their replies.
      for(const [id,items] of Object.entries(realSeed)){
        const saved=clean.books[id]||[];
        clean.books[id]=[...items.filter(item=>!saved.some(old=>old.id===item.id)),...saved];
      }
      memory=clean;
    }catch{}
    return memory;
  }
  function commit(change){
    const next=JSON.parse(JSON.stringify(read()));const error=change(next);if(error)return {ok:false,message:error};
    try{localStorage.setItem(KEY,JSON.stringify(next));memory=next;return {ok:true};}
    catch{return {ok:false,message:'这张纸还没夹稳，字还在，再试一次。'};}
  }
  function drafts(){try{const raw=JSON.parse(localStorage.getItem(DRAFTS));if(raw&&typeof raw==='object'&&!Array.isArray(raw))draftMemory=raw;}catch{}return draftMemory;}
  function draftFor(id){
    const d=drafts()[id]||{};
    // Combine valid old front/back drafts into one visible sheet without rewriting the saved original on entry.
    const front=d.kind==='fold'?[text(d.front).slice(0,600),text(d.back).slice(0,600)].filter(Boolean).join('\n\n'):text(d.front);
    return {kind:'stack',stock:'cream',front,back:''};
  }
  function saveDraft(id,value){const next={...drafts()};if(value)next[id]=value;else delete next[id];draftMemory=next;try{localStorage.setItem(DRAFTS,JSON.stringify(next));return true;}catch{return false;}}
  function artifactFor(bookId,item,onChange=()=>{}){
    const get=()=>read().books[bookId]?.find(x=>x.id===item.id)||item;
    const own=item.author===actor,replyNew=unread(bookId,item)===3;
    const name=own?'你':item.authorName||authorName(item.author);
    return {kind:item.kind,localId:item.id,stock:item.stock,
      // Quotes come only from reviewed source material, never arbitrary saved player text.
      quotation:realSeed[bookId]?.find(note=>note.id===item.id)?.quotation||null,
      label:item.kind==='fold'?'一张双面折纸':item.kind==='relay'?'一封接力信':replyNew?'你的便笺与新回应':own?'你夹的便笺':name+'的便笺',
      pickLabel:'取出'+(own?'你夹入的':name+'留下的')+kinds[item.kind],title:replyNew?'你的便笺下面，多了一张回应':own?'你留在这里的便笺':name+'留在这里的便笺',detail:'读完可以回应，也可以收好离开',
      writeLabel:own?'给自己补一句':'回应这张便笺',
      writePlaceholder:own?'留给下次翻到这页的自己……':'写给留下这张纸的人……',
      initialParts:()=>1+Math.min(seen(bookId,get()).replies||0,get().replies.length),
      fresh:!own&&!seen(bookId,item).front,invite:!!unread(bookId,item),unfoldLabel:'抽出下面的一张回应 ↗',
      getParts:()=>{const x=get(),signature={author:name,date:validDate(realSeed[bookId]?.find(note=>note.id===x.id)?.date)||validDate(x.date)};return x.kind==='fold'?[['纸条正面',x.front,signature],['纸条背面',x.back,signature]]:[[name+'留下的'+(x.kind==='relay'?'开头':'便笺'),x.front,signature],...x.replies.map((reply,i)=>{const writer=typeof reply==='string'?'':reply.author===actor?'你':reply.authorName||authorName(reply.author);return [typeof reply==='string'?'留在纸上的回应 '+(i+1):writer+'的回应',typeof reply==='string'?reply:reply.text,typeof reply==='string'?null:{author:writer,date:validDate(reply.date)}];})];},
      onReveal:()=>{director?.discover(bookId,item.id);keepSelection(bookId,item.id);},
      onRead:()=>{remember(bookId,get());onChange();},
      onUnfold:count=>{remember(bookId,get(),count-1);if(count>=4)director?.rest();onChange();},
      write:value=>{
        const result=commit(next=>{const x=next.books[bookId]?.find(x=>x.id===item.id);if(!x)return '找不到这张纸，请重新打开这本书。';if(x.replies.length>=60)return '这叠纸已满，换一张纸继续吧。';if(value.length>600)return '一张纸最多写600字，请稍微缩短。';x.replies.push({id:crypto.randomUUID(),author:actor,date:today(),text:value});});
        if(result.ok){remember(bookId,get(),get().replies.length);onChange();}return result;
      }
    };
  }
  function mount(room,host){
    const tools=document.createElement('div');tools.className='sid-secret-tools';tools.innerHTML='<div class="sid-paper-tabs" aria-label="书中夹页"></div><button class="sid-create-pen" aria-label="拿起笔，在这本书里留张便笺"><span aria-hidden="true">✎</span><small>留一点什么</small></button>';
    const stage=room.querySelector('.sid-stage'),pen=tools.querySelector('.sid-create-pen');
    pen.innerHTML='<span class="sid-pencil-art" aria-hidden="true"><img src="assets/scene/fountain-pen-burgundy-v075.png" alt="" draggable="false"></span><small>拿起笔 · 留张便笺</small>';
    stage.append(tools,pen);
    const traces=document.createElement('div');traces.className='sid-paper-traces';stage.appendChild(traces);
    function placePen(){
      if(room.hidden)return;
      host.layout();
      const page=room.querySelector('.sid-page').getBoundingClientRect(),bounds=stage.getBoundingClientRect();
      const width=pen.offsetWidth,height=pen.offsetHeight;
      // Keep the pen above the center of the right-hand page, within the viewport.
      pen.style.left=Math.max(10,Math.min(bounds.width-width-10,page.left-bounds.left+page.width/2-width/2))+'px';
      pen.style.top=Math.max(10,Math.min(bounds.height-height-10,page.top-bounds.top-height+22))+'px';
      pen.dataset.placement='above-right-page';
      if(book)renderTabs();
    }
    // Let the recentered cover transform paint before measuring paper and pen anchors.
    let layoutFrame;
    const scheduleLayout=()=>{cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{layoutFrame=requestAnimationFrame(placePen);});};
    new MutationObserver(scheduleLayout).observe(room,{attributes:true,attributeFilter:['data-step']});
    const penLayout=new ResizeObserver(scheduleLayout);penLayout.observe(stage);penLayout.observe(room.querySelector('.sid-position'));

    const editor=document.createElement('section');editor.className='sid-secret-editor';editor.hidden=true;editor.setAttribute('aria-label','在书中夹入一张纸');room.querySelector('.sid-stage').appendChild(editor);
    let book,preset,current=null,form=null,saving=false,order=[],offered=null,prepared=false,readHere=new Set(),cornerDrag=null,ignorePageClick=0,navigationMarkup=null;
    const list=()=>read().books[book[0]]||[];
    const asArtifact=item=>artifactFor(book[0],item,()=>{readHere.add(item.id);renderTabs();});
    function presetArtifact(){if(!preset)return null;return {...preset,onReveal:()=>{director?.discover(book[0],'preset');keepSelection(book[0],'preset');},initialParts:()=>preset.kind==='relay'?1+(reading.books[book[0]]?.presetParts||0):1,onRead:()=>{readHere.add('preset');director?.discover(book[0],'preset');preset.onRead?.();},onUnfold:count=>{readHere.add('preset');const record=reading.books[book[0]]||={items:{}};record.presetParts=Math.max(record.presetParts||0,count-1);try{localStorage.setItem(READS,JSON.stringify(reading));}catch{}if(count>=4||preset.kind==='envelope')director?.rest();preset.onUnfold?.(count);}};}
    function visibleList(){return director?director.available(book[0],list(),actor):list();}
    const keepsake=()=>authoredKeepsakes[book[0]];
    function keepsakeArtifact(){
      const item=keepsake();if(!item)return null;
      return {...item,localId:item.id,onReveal:()=>keepSelection(book[0],item.id),
        onRead:()=>{readHere.add(item.id);remember(book[0],{...item,replies:[]});},
        onFlip:face=>{remember(book[0],{...item,replies:[]},face==='back'?1:0);}};
    }
    function artifactAt(id){return id==='preset'?presetArtifact():id===keepsake()?.id?keepsakeArtifact():asCurrentItem(id);}
    function asCurrentItem(id){const item=visibleList().find(x=>x.id===id);return item?asArtifact(item):null;}
    const replyKey=id=>'reply:'+book[0]+':'+id;
    function replyDraft(id){const value=drafts()[replyKey(id)]?.text;return typeof value==='string'?value.slice(0,3000):'';}
    function saveReplyDraft(id,value){return saveDraft(replyKey(id),value?{kind:'reply',text:value.slice(0,3000)}:null);}
    function pageCommitted(id){current=id;keepSelection(book[0],id);renderTabs();window.BookRhythm.record('page_turn',book[0],{page:order.indexOf(current)+1,pages:order.length});}
    function arrange(allowDraw=false){
      const all=list();
      if(director){
        director.sync(book[0],all,actor);
        for(const item of all)if(seen(book[0],item).front)director.discover(book[0],item.id);
        if(preset&&(!preset.discoveryManaged||preset.alreadyKnown))director.discover(book[0],'preset');
        const candidates=[...all.filter(x=>x.author!==actor),...(preset&&preset.discoveryManaged?[{id:'preset'}]:[])];
        const readIds=all.filter(x=>seen(book[0],x).front&&(seen(book[0],x).replies||0)>=x.replies.length).map(x=>x.id);
        if(director.known(book[0],'preset'))readIds.push('preset');
        offered=allowDraw?director.draw(book[0],candidates,{lastId:reading.books[book[0]]?.last,readIds}):director.snapshot().visit?.draws[book[0]]||null;
      }
      const items=visibleList().slice().reverse().sort((a,b)=>unread(book[0],b)-unread(book[0],a));
      order=[...items.map(x=>x.id),...(preset?['preset']:[]),...(keepsake()?[keepsake().id]:[])];
      if(items.length&&items.every(x=>x.author===actor)&&!order.includes('preset'))order.unshift('book-intro');
    }
    function chooseInitial(){
      const available=visibleList(),offeredItem=available.find(x=>x.id===offered),reply=available.find(x=>unread(book[0],x)===3),fresh=available.slice().reverse().find(x=>unread(book[0],x)>0),last=reading.books[book[0]]?.last;
      current=reply?.id||offeredItem?.id||fresh?.id||(order.includes('book-intro')?'book-intro':offered==='preset'&&!director?.known(book[0],'preset')?'preset':order.includes(last)?last:available.find(x=>x.author===actor)?.id||order[0]||null);
    }
    function opening(){
      if(!director||prepared)return;
      arrange();const ownReply=visibleList().some(item=>unread(book[0],item)===3);
      if(!ownReply)arrange(true);
      chooseInitial();prepared=host.choose(artifactAt(current),{duringCover:true});director.acknowledge(book[0]);renderTabs();
    }
    function returned(){
      if(!director||!readHere.has(current))return;
      const count=current==='preset'?reading.books[book[0]]?.presetParts||0:seen(book[0],visibleList().find(x=>x.id===current)||{}).replies||0;
      if(count+1>=host.partsCount())director.returned(book[0]);
    }
    function renderTabs(){
      tools.querySelector('.sid-paper-tabs').hidden=true;
      if(!book||cornerDrag)return;
      const items=visibleList(),index=order.indexOf(current);
      const next=order[(index+1)%order.length];
      const navigation=order.length>1?'<button class="sid-paper-tab sid-page-next" data-paper-id="'+esc(next)+'" data-direction="1" aria-label="翻到下一页" title="轻点右下角翻下一页"><i aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false"><defs><linearGradient id="sid-corner-face" x1=".1" y1=".1" x2=".9" y2=".9"><stop offset="0" stop-color="#bda77f"/><stop offset=".27" stop-color="#f4e9ce"/><stop offset=".52" stop-color="#fff8e6"/><stop offset=".8" stop-color="#ead9b6"/><stop offset="1" stop-color="#cfba92"/></linearGradient><linearGradient id="sid-corner-under" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c8b58c"/><stop offset=".54" stop-color="#e2d3b0"/><stop offset="1" stop-color="#eee3c5"/></linearGradient></defs><path class="sid-corner-under" d="M4 63 C23 55 47 30 63 4 L63 62 Q63 63 62 63Z"/><path class="sid-corner-shadow" d="M4 63 C23 55 47 30 63 4 C59 31 43 54 4 63Z"/><path class="sid-corner-face" d="M4 63 C23 55 47 30 63 4 C59 31 43 54 4 63Z"/><path class="sid-corner-rim" d="M5 62 C24 54 47 29 62 5"/><path class="sid-corner-roll" d="M9 61 C31 56 53 36 61 11"/><path class="sid-corner-fiber" d="M30 49l5-4 M39 40l4-5 M47 30l2-4"/></svg></i></button>':'';
      // Repositioning the book must not replace a focused corner between keydown and click.
      if(navigationMarkup!==navigation){traces.innerHTML=navigation;navigationMarkup=navigation;}
      const active=items.find(x=>x.id===current);room.dataset.freshPaper=String(!!active&&unread(book[0],active)>0);
      room.dataset.paperOwner=active?.author===actor?'own':active?'other':current==='book-intro'?'intro':current===keepsake()?.id?'authored-playtest':'original';
      room.dataset.hasPageTurn=String(order.length>1);
      // Set the physical dock before measuring it, including a newly buried first note.
      room.querySelector('.sid-dock').style.bottom=order.length>1?'78px':'';
      room.querySelector('.sid-page-kicker').textContent=active?.author===actor?'你 留 下 的 一 页':'纸 间 藏 书';
      room.querySelector('.sid-page-number').textContent=order.length>1?'· '+(index+1)+' ·':'· 夹页 ·';
      const target=room.querySelector('.sid-page').getBoundingClientRect(),bounds=stage.getBoundingClientRect();
      traces.style.left=(target.right-bounds.left-76)+'px';traces.style.top=(target.top-bounds.top)+'px';traces.style.width='76px';traces.style.height=target.height+'px';
      host.layout();decorate();
    }
    async function selectPaper(id,direction){
      if(!['open','letter'].includes(room.dataset.step))return;
      if(!order.includes(id))return;
      await host.turnPage(artifactAt(id),1,()=>pageCommitted(id));
    }
    function beginCorner(event){
      const button=event.target.closest('[data-paper-id]');if(!button||cornerDrag||event.button!==0||room.dataset.step!=='open')return;
      event.preventDefault();cornerDrag={button,id:button.dataset.paperId,direction:Number(button.dataset.direction),pointer:event.pointerId,x:event.clientX,y:event.clientY,at:performance.now(),width:room.querySelector('.sid-page').getBoundingClientRect().width,viewportW:innerWidth,viewportH:innerHeight,dx:0,dy:0,samples:[{x:event.clientX,at:event.timeStamp}]};
      const turn=host.startPageTurn(1,true,artifactAt(button.dataset.paperId));if(!turn){cornerDrag=null;return;}
      cornerDrag.turn=turn;traces.classList.add('is-turning');button.setPointerCapture(event.pointerId);
    }
    function moveCorner(event){
      if(!cornerDrag||cornerDrag.pointer!==event.pointerId)return;event.preventDefault();cornerDrag.dx=event.clientX-cornerDrag.x;cornerDrag.dy=event.clientY-cornerDrag.y;
      const now=event.timeStamp;cornerDrag.samples.push({x:event.clientX,at:now});while(cornerDrag.samples.length>2&&cornerDrag.samples[1].at<now-80)cornerDrag.samples.shift();
      const pull=Math.max(0,Math.min(2,-cornerDrag.dx/cornerDrag.width));
      cornerDrag.turn.move(Math.acos(1-pull)/Math.PI);
    }
    async function finishCorner(event,cancel=false){
      if(!cornerDrag||event&&event.pointerId!==cornerDrag.pointer)return;
      const drag=cornerDrag;cornerDrag=null;ignorePageClick=performance.now()+500;host.suppressPageRelease();
      if(drag.button.hasPointerCapture(drag.pointer))drag.button.releasePointerCapture(drag.pointer);
      const moved=Math.max(Math.abs(drag.dx),Math.abs(drag.dy))>7,distance=-drag.dx,first=drag.samples[0],last=drag.samples.at(-1);
      const velocity=(event?.timeStamp??performance.now())-last.at<90?(last.x-first.x)/Math.max(12,last.at-first.at):0;
      const projected=distance+Math.max(0,-velocity)*95,reversing=velocity>.18&&distance<drag.width*1.65;
      cancel ||= drag.viewportW!==innerWidth||drag.viewportH!==innerHeight||moved&&(Math.abs(drag.dy)>Math.abs(drag.dx)*1.3||reversing||distance<18||projected<drag.width*.52);
      try{await drag.turn.finish(artifactAt(drag.id),()=>pageCommitted(drag.id),cancel,{velocity,dragged:moved});}finally{traces.classList.remove('is-turning');renderTabs();}
    }
    function stash(){if(!form)return true;form.front=editor.querySelector('[name="front"]').value;const ok=saveDraft(book[0],form);editor.querySelector('.sid-secret-message').textContent=ok?'':'这张纸还没收稳，先别离开。';return ok;}
    function drawEditor(){
      editor.dataset.stock='cream';
      editor.innerHTML='<header><span class="sid-writing-pen" aria-hidden="true">✎</span><h2>留在《'+esc(book[1])+'》里</h2><button class="sid-desk-close" aria-label="收好草稿，放下笔">×</button></header><label for="secret-front">留一句想说的话</label><textarea id="secret-front" name="front" maxlength="'+Math.max(600,form.front.length)+'" placeholder="可以是一句话，也可以是今天的一件小事……">'+esc(form.front)+'</textarea><footer><button class="sid-bury">夹进书里 ↘</button></footer><p class="sid-secret-message" role="status"></p>';
    }
    function begin(){if(room.dataset.step!=='open'||saving)return;form=draftFor(book[0]);editor.hidden=false;room.classList.add('sid-composing');host.composing(true);drawEditor();editor.querySelector('textarea').focus({preventScroll:true});}
    function dismiss(){if(editor.hidden||saving)return;stash();editor.hidden=true;room.classList.remove('sid-composing');host.composing(false);pen.focus({preventScroll:true});}
    async function bury(){
      if(saving)return;stash();const front=form.front.trim(),message=editor.querySelector('.sid-secret-message');
      if(!front){message.textContent='写一点什么，再夹进书里。';return;}
      const item={id:crypto.randomUUID(),kind:'stack',author:actor,date:today(),front,back:'',stock:'cream',replies:[]};
      const result=commit(next=>{const items=next.books[book[0]]||=[];items.push(item);});
      if(!result.ok){message.textContent=result.message;return;}
      saveDraft(book[0],null);saving=true;editor.inert=true;
      remember(book[0],item);arrange();current=item.id;await host.choose(asArtifact(item));renderTabs();
      const from=editor.getBoundingClientRect(),to=host.dock(),ghost=document.createElement('div');ghost.className='sid-burying-paper';ghost.dataset.stock=item.stock;ghost.textContent='留给翻到这一页的人';document.body.appendChild(ghost);
      const width=Math.min(240,from.width),height=104;ghost.style.cssText='position:fixed;z-index:150;left:'+(from.x+(from.width-width)/2)+'px;top:'+(from.y+from.height/2-height/2)+'px;width:'+width+'px;height:'+height+'px;';
      editor.hidden=true;
      try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)await ghost.animate([{transform:'translate(0,0) rotate(2deg)',opacity:1},{transform:'translate('+(to.x+to.width/2-from.x-from.width/2)+'px,'+(to.y+44-from.y-from.height/2)+'px) scale('+(to.width/width)+') rotate(-7deg)',opacity:.95}],{duration:480,easing:'cubic-bezier(.22,.7,.2,1)',fill:'forwards'}).finished;}catch{}finally{ghost.remove();editor.inert=false;saving=false;form=null;saveDraft(book[0],null);room.classList.remove('sid-composing');host.composing(false);room.querySelector('.sid-letter-pick').focus({preventScroll:true});}
    }
    pen.addEventListener('click',begin);
    room.addEventListener('pointerdown',()=>{if(!cornerDrag)ignorePageClick=0;},true);
    room.addEventListener('click',event=>{
      if(event.detail&&performance.now()<ignorePageClick){event.preventDefault();event.stopImmediatePropagation();ignorePageClick=0;}
    },true);
    traces.addEventListener('pointerdown',beginCorner);
    traces.addEventListener('pointermove',moveCorner);
    traces.addEventListener('pointerup',event=>finishCorner(event));
    traces.addEventListener('pointercancel',event=>finishCorner(event,true));
    traces.addEventListener('lostpointercapture',event=>{if(event.target===cornerDrag?.button)finishCorner(event,true);});
    traces.addEventListener('click',event=>{if(event.detail&&performance.now()<ignorePageClick)return;const button=event.target.closest('[data-paper-id]');if(button)selectPaper(button.dataset.paperId,Number(button.dataset.direction));});
    window.addEventListener('resize',()=>finishCorner(null,true));
    editor.addEventListener('input',stash);
    editor.addEventListener('click',event=>{
      if(saving)return;
      if(event.target.closest('.sid-desk-close'))dismiss();else if(event.target.closest('.sid-bury'))bury();
    });
    return {reset(next,original){book=next;preset=original;form=null;saving=false;prepared=false;readHere=new Set();editor.hidden=true;room.classList.remove('sid-composing');arrange();chooseInitial();renderTabs();},opening,returned,replyDraft,saveReplyDraft,initialArtifact(){return artifactAt(current);},editing:()=>!editor.hidden||saving,dismiss};
  }
  function mountPlaytest(){
    if(director){const data=read();for(const [id] of books)director.sync(id,data.books[id]||[],actor);}
    decorate();if(!demo)return;
    const ticket=document.createElement('aside');ticket.className='revisit-ticket';ticket.setAttribute('aria-label','本机重访试玩');
    ticket.innerHTML='<button class="revisit-toggle" aria-expanded="false">'+(discoveryDemo?'发现试玩':'本机试玩')+' · '+actor+' ↗</button><div class="revisit-choices" hidden><small>同一浏览器模拟三位书友</small>'+['A','B','N'].map(id=>'<a href="?v=0.14.0&playtest='+(discoveryDemo?'discovery':'revisit')+'&reader='+id+'" '+(id===actor?'aria-current="page"':'')+'>'+id+' · '+({A:'没有自己的留言',B:'有自己的旧便笺',N:'新便笺的主人'}[id])+'</a>').join('')+'<button class="revisit-reset">重演这次相遇</button><a href="?v=0.14.0">回到原存档</a></div>';
    document.body.appendChild(ticket);const toggle=ticket.querySelector('.revisit-toggle'),choices=ticket.querySelector('.revisit-choices');
    toggle.addEventListener('click',()=>{choices.hidden=!choices.hidden;toggle.setAttribute('aria-expanded',String(!choices.hidden));});
    ticket.querySelector('.revisit-reset').addEventListener('click',()=>{for(const key of [KEY,...['A','B','N'].flatMap(id=>[prefix+'-reading-v1-'+id,prefix+'-drafts-v1-'+id,prefix+'-game-v1-'+id,...(discoveryDemo?['paperbook-discovery-visit-v1-'+id]:[])])])localStorage.removeItem(key);location.reload();});
  }
  document.addEventListener('pointerdown',()=>director?.touch(),{passive:true});
  return {mount,demo,discoveryDemo,discoveryEnabled,actor,gameKey,mountPlaytest};
})();
