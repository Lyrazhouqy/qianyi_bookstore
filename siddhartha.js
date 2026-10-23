'use strict';
window.Siddhartha = (() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  const escapeHTML = value => String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // Square flat marks stay square on a full cover; side-view sprites are never stretched.
  const coverMarks={
    leaf:'<path d="M17 65C10 33 32 14 70 12c-1 38-19 59-53 53Z"/>',
    mountain:'<path d="M5 65 27 27l15 21 13-33 24 50Z"/>',
    stone:'<ellipse cx="40" cy="32" rx="17" ry="13"/><path d="M7 59q16-12 33 0t33 0" fill="none" stroke="currentColor" stroke-width="6"/>',
    bird:'<path d="M6 46c17 4 20-5 18-24l22 15 25-7-13 16c-5 18-27 23-41 13l13-4Z"/>',
    links:'<g fill="none" stroke="currentColor" stroke-width="8"><rect x="12" y="16" width="29" height="40" rx="14" transform="rotate(35 26 36)"/><rect x="38" y="31" width="29" height="40" rx="14" transform="rotate(35 52 51)"/></g>',
    pond:'<path d="M12 57c-6-16 3-25 9-25V19h13v11h12V19h13v13c17 5 18 33 1 33H25Z"/>',
    flower:'<path d="M40 14c20-20 40 12 20 24 28 10 7 40-13 27-4 28-38 17-32-7-26-6-13-38 9-29-3-10 5-19 16-15Z"/><circle cx="39" cy="44" r="11" fill="var(--reader-cover)"/>',
    factory:'<path d="M9 68V43l19-14v14l18-14v14h13V15h11v53Z"/>',
    sail:'<path d="M35 11v42H9Zm7 9 29 33H42ZM5 58h70L63 70H18Z"/>',
    key:'<path d="M29 11a17 17 0 1 0 0 34v25h9v-9h11v-9H38V43a17 17 0 0 0-9-32Zm0 9a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z"/>',
    temple:'<path d="m5 27 35-17 35 17v7H5Zm8 12h9v23h-9Zm22 0h10v23H35Zm23 0h9v23h-9ZM7 67h66v7H7Z"/>',
    sun:'<path d="M13 65a27 27 0 0 1 54 0Z"/><path d="M40 8v12M10 23l8 8M70 23l-8 8M3 48h11m63 0H66" fill="none" stroke="currentColor" stroke-width="5"/>'
  };
  let room,stage,position,carrier,cover,dock,paper,reader,hint,returnButton;
  let source,callbacks,book,artifact,step='idle',busy=false,progress=0,extraction=0,sheetSpread=0,visibleParts=1,writing=false,draft='',ignoreClick=0,ignoreClickKind=null,gesture=null,returnPending=false,returnInProgress=false;
  let secretDesk,openOnArrival=false,queuedBook=null,cueSeen=false;
  let heldDrag={x:0,y:0,scale:1,tilt:0,amount:0};
  const running = new Set();
  const query = selector => room.querySelector(selector);
  function setStep(value) { step=value; room.dataset.step=value;cover?.setAttribute('aria-busy',String(!['held','open','letter','packet','idle'].includes(value)));if(value==='open')requestAnimationFrame(()=>{placeLetter();checkCue();}); }
  const record=(type,detail={})=>window.BookRhythm.record(type,book?.[0],detail);
  function checkCue(){
    if(cueSeen||room.hidden||step!=='open'||artifact?.kind!=='postcard'||paper.hidden)return;
    const r=paper.getBoundingClientRect(),s=getComputedStyle(paper);
    if(s.visibility==='hidden'||r.width<=0||r.height<=0||r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight)return;
    cueSeen=true;record('artifact_cue_seen',{kind:'postcard'});
  }
  function guidance(text,detail='') { hint.innerHTML=text+(detail?'<small>'+detail+'</small>':''); }
  const smooth = t => t*t*t*(t*(t*6-15)+10);
  const glide = t => 1-Math.pow(1-t,3);
  function tween(duration,update,ease=smooth) {
    duration *= callbacks?.revisit && !['rose','envelope'].includes(artifact?.kind) ? .78 : 1;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) { update(1); return Promise.resolve(); }
    update(0);
    return new Promise(resolve=>{
      let frame,start;
      const finish=()=>{cancelAnimationFrame(frame);update(1);running.delete(finish);resolve();};
      running.add(finish);
      function tick(time) { start??=time; const t=clamp((time-start)/duration); update(ease(t)); if(t===1){running.delete(finish);resolve();}else frame=requestAnimationFrame(tick); }
      frame=requestAnimationFrame(tick);
    });
  }
  function settle() { for(const finish of [...running])finish(); }
  function placeLetter() {
    if (!room || room.hidden) return;
    const target=dock.getBoundingClientRect(), bounds=stage.getBoundingClientRect();
    const paired=room.dataset.readingLayout==='paired',page=query('.sid-page').getBoundingClientRect();
    const width=paired?Math.max(100,page.width-16):Math.min(368,bounds.width-32);
    const x0=paired?page.left-bounds.left+(page.width-target.width)/2:target.left-bounds.left+4,y0=target.top-bounds.top;
    const x1=paired?page.left-bounds.left+8:(bounds.width-width)/2;
    const dockWidth=Math.max(90,target.width),shownWidth=(1-extraction)*dockWidth+extraction*width;
    paper.style.width=shownWidth+'px';
    paper.style.setProperty('--packet-zoom',String(shownWidth/dockWidth));
    paper.style.setProperty('--packet-height',(88*shownWidth/dockWidth)+'px');
    paper.style.left=(x0+(x1-x0)*extraction)+'px';
    // Keep the lifted sheet over the book, including while each fold changes
    // its height. Clamp only when a short viewport needs reading space.
    const sheetHeight=paper.classList.contains('is-reading')?reader.getBoundingClientRect().height:88*shownWidth/dockWidth;
    const bookCenter=position.offsetTop;
    const y1=Math.max(16,Math.min(bounds.height-sheetHeight-16,bookCenter-sheetHeight/2));
    paper.style.top=(y0+(y1-y0)*extraction)+'px';
    paper.style.transform='rotate('+(-7*(1-extraction))+'deg)';
    paper.hidden=!artifact || progress<.83;
    paper.inert=progress<.98 || busy && !['pulling-letter','putting-letter','unfolding'].includes(step);
  }
  function pose(value) {
    progress=clamp(value);
    // Recenter only as the cover actually crosses the spine. The hinge does not
    // drift sideways while the cover is still over the right-hand page.
    const angle=174*progress,leftExtent=Math.max(0,-Math.cos(angle*Math.PI/180));
    position.style.transform='translate('+(-50+leftExtent*50)+'%,-50%)';
    carrier.style.transform='rotateZ('+(-.8*(1-progress))+'deg)';
    cover.style.transform='rotateY('+(-angle)+'deg)';
    query('.sid-cover-front').style.visibility=angle<90?'visible':'hidden';
    query('.sid-cover-back').style.visibility=angle>=90?'visible':'hidden';
    query('.sid-page').style.setProperty('--cover-shade',String(.26*Math.sin(progress*Math.PI)));
    cover.setAttribute('aria-expanded',String(progress>.9));
    cover.setAttribute('aria-label',(progress>.5?'合上《':'翻开《')+book[1]+'》');
    placeLetter();
  }
  async function hinge(target) {
    if (busy) return;
    if(secretDesk?.editing())return;
    if(target===1)secretDesk?.opening?.();
    if(target===0 && extraction>0) await putLetter();
    if (busy) return;
    const releasedDrag=step==='cover-drag';
    busy=true;setStep(target?'opening':'closing');
    const from=progress;
    await tween(Math.max(240,(returnInProgress?360:680)*Math.abs(target-from)),t=>pose(from+(target-from)*t),releasedDrag?glide:smooth);
    busy=false;delete room.dataset.openQueued;pose(target);setStep(target?'open':'held');if(target)artifact?.onReveal?.();
    guidance(target?(artifact?(artifact.kind==='relay'?'书页间，露出一角折信':'书页间，藏着'+artifact.label):'翻过的书页，也记得来过的人'):'轻点封面，或向左拖开',target?(artifact?'轻点纸角直接展开，也可以向上抽出':'这次没有遇见新的阅读痕迹。'):'也可以随时放回原来的书位');
    returnButton.textContent='收起手中的书';
    if(returnPending) returnToShelf();
  }
  function allParts() { if(artifact.getParts)return artifact.getParts();return artifact.kind==='relay' ? letter.concat(callbacks.replies().map((text,index)=>['你的续写 '+(index+1),text])) : artifact.parts; }
  function insideCopy(){
    room.dataset.readingLayout=['stack','note','fold'].includes(artifact?.kind)?'paired':'centered';
    room.dataset.artifactPicture=String(!!artifact?.picture);
    const candidate=artifact?.quotation;
    const quoted=candidate?.verified===true&&candidate.bookTitle===book[1]&&typeof candidate.text==='string'&&candidate.text.trim()&&typeof candidate.source==='string'&&candidate.source.trim();
    const copy=query('.sid-inside-copy');copy.dataset.kind=quoted?'quotation':'synopsis';room.dataset.leftContent=copy.dataset.kind;copy.scrollTop=0;
    copy.querySelector('strong').textContent=quoted?'这段话的原文':'关于这本书';
    query('.sid-synopsis').textContent=quoted?candidate.text:book[2];
    const source=query('.sid-quotation-source');source.hidden=!quoted;source.textContent=quoted?'—— '+candidate.source:'';
  }
  function chooseArtifact(next){
    artifact=next;cueSeen=false;insideCopy();room.dataset.stock=next?.stock||'cream';room.dataset.artifact=next?.kind||'none';room.dataset.artifactSource=next?.source||'';
    room.setAttribute('aria-label',book[1]+(next?'，书与'+next.label:'，书籍阅读'));
    paper.querySelector('.sid-letter-packet em').textContent=next?.label||'';paper.querySelector('.sid-letter-packet i').textContent=next?.kind==='rose'?'🥀':next?.kind==='envelope'?'✉':'⌁';paper.querySelector('.sid-letter-pick').setAttribute('aria-label',next?.pickLabel||'取出夹页');query('.sid-discovery-hint').textContent=next?'……好像有人在这里留下了什么。':'也可以在这页夹一点什么。';placeLetter();
  }
  function startPageTurn(direction,drag=false){
    if(busy||gesture||extraction>0||step!=='open')return false;
    busy=true;setStep(drag?'page-drag':'page-turn');
    const page=query('.sid-page'),leaf=page.cloneNode(true),target=page.getBoundingClientRect(),bounds=stage.getBoundingClientRect();
    leaf.classList.add('sid-turning-leaf');leaf.setAttribute('aria-hidden','true');leaf.inert=true;
    if(artifact){const oldPaper=paper.cloneNode(true);oldPaper.hidden=false;oldPaper.inert=true;oldPaper.querySelector('.sid-letter-reader')?.remove();
    oldPaper.style.left=(parseFloat(paper.style.left)-(target.left-bounds.left))+'px';oldPaper.style.top=(parseFloat(paper.style.top)-(target.top-bounds.top))+'px';leaf.appendChild(oldPaper);}
    carrier.appendChild(leaf);paper.style.visibility='hidden';
    let progress=0,finished=false;
    function move(value){progress=clamp(value);leaf.style.transform='rotateY('+(-direction*172*progress)+'deg)';leaf.style.filter='brightness('+(1-.16*Math.sin(progress*Math.PI))+')';}
    move(0);
    return {move,async finish(next,commit,cancel=false){
      if(finished)return false;finished=true;setStep(cancel?'page-rebound':'page-turn');const from=progress;
      try{
        await tween(Math.max(160,(cancel?280:460)*Math.abs((cancel?0:1)-from)),t=>move(from+((cancel?0:1)-from)*t),glide);
        if(!cancel){chooseArtifact(next);commit();artifact?.onReveal?.();}
      }finally{leaf.remove();paper.style.visibility='';busy=false;setStep('open');placeLetter();}
      guidance(artifact?.label||'翻到另一页','每一页，留着一位书友的话');if(returnPending)returnToShelf();return !cancel;
    }};
  }
  async function turnPaperPage(next,direction,commit){
    const turn=startPageTurn(direction);return turn?turn.finish(next,commit):false;
  }
  function segmentHTML(part,index) {
    const picture=artifact.kind==='postcard'&&index===0?(artifact.picture?'<img class="sid-postcard-picture" src="'+escapeHTML(artifact.picture.src)+'" alt="'+escapeHTML(artifact.picture.alt)+'" draggable="false">':'<svg class="sid-postcard-picture" viewBox="0 0 320 150" aria-hidden="true"><rect width="320" height="150" fill="#a6b9ac"/><circle cx="245" cy="38" r="23" fill="#e9c477"/><path d="M0 116L85 39 183 126 245 81 320 128V150H0Z" fill="#718c7b"/><path d="M0 139Q96 93 181 135T320 133V150H0Z" fill="#d3bc8c"/><path d="M126 44l21 9 26-14 8 3-19 17 18 10-5 5-27-6-13 11-5-2 6-15-17-12z" fill="#f7edd4"/></svg>'):'';
    const signature=part[2],date=signature?.date;
    const signed=signature?'<footer class="sid-note-signature"><span>—— '+escapeHTML(signature.author)+'</span>'+(date?'<time datetime="'+escapeHTML(date)+'">'+escapeHTML(date.replace(/^(\d{4})-(\d{2})-(\d{2})$/,(_,y,m,d)=>y+'年'+Number(m)+'月'+Number(d)+'日'))+'</time>':'')+'</footer>':'';
    return '<div class="sid-segment" data-segment="'+index+'"><small>'+escapeHTML(part[0])+'</small>'+picture+(artifact.picture&&index===0?'<span class="sid-postcard-caption">'+escapeHTML(part[1])+'</span>':escapeHTML(part[1]))+signed+'</div>';
  }
  function letterControls() {
    query('.sid-unfold')?.remove();query('.sid-letter-actions')?.remove();query('.sid-write')?.remove();
    const all=allParts();
    if(visibleParts<all.length && !['fold','postcard'].includes(artifact.kind)) reader.insertAdjacentHTML('beforeend','<button class="sid-unfold">'+escapeHTML(artifact.unfoldLabel || '沿折痕展开下一段 ⌄')+'</button>');
    if(['fold','postcard'].includes(artifact.kind)) reader.insertAdjacentHTML('beforeend','<button class="sid-flip" data-sid="flip">'+(visibleParts===1?'翻到背面 ↻':'翻回正面 ↺')+'</button>');
    if(writing) reader.insertAdjacentHTML('beforeend','<div class="sid-write"><label for="sid-reply"><span class="sid-writing-pen" aria-hidden="true">✎</span> '+(artifact.kind==='stack'?escapeHTML(artifact.writeLabel||'回应这张便笺'):'在信的末尾续写')+'</label><textarea id="sid-reply" maxlength="'+(artifact.kind==='stack'?600:3000)+'" placeholder="'+escapeHTML(artifact.writePlaceholder||'写给留下这张纸的人……')+'">'+escapeHTML(draft)+'</textarea><div class="sid-write-actions"><button class="sid-put" data-sid="cancel">放下笔</button><button class="btn" data-sid="save">'+(artifact.kind==='stack'?'夹在便笺下面':'留在信上')+'</button></div><p class="sid-message" role="status"></p></div>');
    reader.insertAdjacentHTML('beforeend','<div class="sid-letter-actions"><button class="sid-put" data-sid="put">'+(artifact.kind==='postcard'?'放回夹页 ↘':'折好，放回夹页 ↘')+'</button>'+((artifact.kind==='relay'||artifact.kind==='stack')&&visibleParts===all.length&&!writing?'<button class="sid-pen sid-stack-pen'+(artifact.invite?' is-inviting':'')+'" aria-label="'+(artifact.kind==='stack'?escapeHTML(artifact.writeLabel||'回应这张便笺'):'拿起笔续写')+'" data-sid="write"><img src="assets/scene/fountain-pen-burgundy-v075.png" alt="" draggable="false"><span class="sid-pen-caption" aria-hidden="true">'+(artifact.kind==='stack'?escapeHTML(artifact.writeLabel||'回应这张便笺'):'拿起笔')+'</span></button>':'')+'</div>');
  }
  function buildLetter() { const all=allParts();visibleParts=Math.max(1,Math.min(all.length,artifact.initialParts?.()||1));reader.innerHTML=all.slice(0,visibleParts).map(segmentHTML).join('');writing=false;letterControls(); }
  async function takeLetter({unfoldOnArrival=false} = {}) {
    if(!artifact || busy || progress<.98 || ['packet','letter'].includes(step))return;
    busy=true;setStep('pulling-letter');const from=extraction;
    const ordinary=['note','stack'].includes(artifact.kind);
    await tween(ordinary?(unfoldOnArrival?240:320):(unfoldOnArrival?480:620),t=>{extraction=from+(1-from)*t;placeLetter();});
    extraction=1;room.classList.add('sid-room-reading');
    busy=false;placeLetter();setStep('packet');
    query('.sid-letter-pick').setAttribute('aria-label',artifact.kind==='relay'?'展开折信':'展开'+artifact.label);
    if(returnPending){returnToShelf();return;}
    if(unfoldOnArrival){await openLetter();return;}
    guidance(artifact.kind==='relay'?'信还折着，轻点打开最外层':'轻点展开'+artifact.label,artifact.kind==='relay'?'读完一段，再沿下一条折痕展开':'读完后，还可以放回原处');
    query('.sid-letter-pick').focus({preventScroll:true});
  }
  async function openLetter() {
    if(busy || extraction!==1 || paper.classList.contains('is-reading'))return;
    busy=true;setStep('unfolding');paper.classList.add('is-reading');buildLetter();
    if(artifact.kind==='postcard'){
      await tween(240,t=>{reader.style.opacity=String(t);placeLetter();});reader.style.opacity='';busy=false;setStep('letter');placeLetter();artifact.onRead?.();record('artifact_open',{kind:'postcard',face:'front'});guidance(artifact.title,artifact.detail);if(returnPending)returnToShelf();return;
    }
    const face=reader.querySelector('.sid-segment'),height=Math.min(reader.scrollHeight,parseFloat(getComputedStyle(reader).maxHeight));
    const flap=query('.sid-letter-packet').cloneNode(true);flap.classList.add('sid-opening-flap');flap.setAttribute('aria-hidden','true');paper.appendChild(flap);
    reader.classList.add('sid-folding');
    const foldedHeight=parseFloat(getComputedStyle(paper).getPropertyValue('--packet-height'));
    await tween(['note','stack'].includes(artifact.kind)?260:620,t=>{sheetSpread=t;reader.style.height=(foldedHeight+(height-foldedHeight)*t)+'px';face.style.transform='rotateX('+(-88*(1-t))+'deg)';face.style.filter='brightness('+(.8+.2*t)+')';flap.style.transform='rotateX('+(175*t)+'deg)';flap.style.opacity=String(1-clamp((t-.55)/.35));reader.style.setProperty('--controls-opacity',String(clamp((t-.65)/.35)));placeLetter();});
    flap.remove();reader.classList.remove('sid-folding');reader.style.height='';face.style.transform='';face.style.filter='';busy=false;setStep('letter');
    placeLetter();artifact.onRead?.();if(artifact.kind==='relay')record('relay_open',{parts:visibleParts});guidance(artifact.title,artifact.detail);artifact.invite=false;
    if(returnPending)returnToShelf();
  }
  async function unfoldNext() {
    const all=allParts();if(busy || visibleParts>=all.length)return;
    busy=true;setStep('unfolding');
    const beforeHeight=reader.getBoundingClientRect().height;
    query('.sid-unfold')?.remove();query('.sid-letter-actions')?.remove();
    const leaf=document.createElement('div');leaf.className='sid-leaf';leaf.innerHTML='<div class="sid-leaf-face">'+segmentHTML(all[visibleParts],visibleParts)+'</div>';reader.appendChild(leaf);
    const face=leaf.firstElementChild,height=face.getBoundingClientRect().height;
    visibleParts++;artifact.onUnfold?.(visibleParts);letterControls();
    const afterHeight=Math.min(reader.scrollHeight,parseFloat(getComputedStyle(reader).maxHeight));
    reader.classList.add('sid-folding');
    await tween(artifact.kind==='stack'?340:480,t=>{
      reader.style.height=(beforeHeight+(afterHeight-beforeHeight)*t)+'px';
      leaf.style.height=(height*Math.sin(t*Math.PI/2))+'px';
      face.style.transform=artifact.kind==='stack'?'translate('+((1-t)*45)+'px,'+(-(1-t)*12)+'px) rotate('+((1-t)*4)+'deg)':'rotateX('+(-90*(1-t))+'deg)';face.style.filter='brightness('+(0.8+.2*t)+')';
      reader.style.setProperty('--controls-opacity',String(clamp((t-.65)/.35)));placeLetter();
    });
    leaf.style.height='';face.style.transform='';face.style.filter='';reader.style.height='';reader.classList.remove('sid-folding');
    placeLetter();busy=false;setStep('letter');if(artifact.kind==='relay')record('relay_unfold',{parts:visibleParts});
    // Move only the paper's scroll surface, never the stage or the surrounding book.
    reader.scrollTo({top:Math.max(0,leaf.offsetTop+leaf.offsetHeight-reader.clientHeight),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    if(returnPending)returnToShelf();
  }
  async function flipPaper(){
    if(busy||!['fold','postcard'].includes(artifact.kind))return;
    busy=true;setStep('flipping');
    await tween(160,t=>{reader.style.transform='perspective(900px) rotateY('+(t*90)+'deg)';});
    visibleParts=visibleParts===1?2:1;reader.innerHTML=segmentHTML(allParts()[visibleParts-1],visibleParts-1);letterControls();placeLetter();
    await tween(180,t=>{reader.style.transform='perspective(900px) rotateY('+(-90*(1-t))+'deg)';});
    reader.style.transform='';busy=false;setStep('letter');placeLetter();if(artifact.kind==='postcard'){const face=visibleParts===1?'front':'back';artifact.onFlip?.(face);record('artifact_flip',{kind:'postcard',face});}if(returnPending)returnToShelf();
  }
  async function putLetter() {
    if(busy || extraction===0)return;
    const returnedParts=paper.classList.contains('is-reading')?visibleParts:0,ordinary=['note','stack'].includes(artifact.kind);
    busy=true;setStep('putting-letter');writing=false;document.activeElement?.blur();
    const scrollFrom=reader.scrollTop;
    if(scrollFrom){if(returnInProgress)reader.scrollTop=0;else await tween(180,t=>{reader.scrollTop=scrollFrom*(1-t);});}
    reader.classList.add('sid-folding');reader.style.setProperty('--controls-opacity','0');
    const leaves=[...reader.querySelectorAll('.sid-leaf')].reverse();
    const folding=leaves.map(leaf=>({leaf,face:leaf.firstElementChild,height:leaf.getBoundingClientRect().height}));
    if(folding.length)await tween(returnInProgress?180:300,t=>{for(const {leaf,face,height} of folding){leaf.style.height=(height*Math.cos(t*Math.PI/2))+'px';face.style.transform='rotateX('+(-90*t)+'deg)';}placeLetter();});
    for(const {leaf} of folding)leaf.remove();
    if(paper.classList.contains('is-reading')&&artifact.kind!=='postcard') {
      const face=reader.querySelector('.sid-segment'),height=reader.getBoundingClientRect().height;
      const flap=query('.sid-letter-packet').cloneNode(true);flap.classList.add('sid-opening-flap');flap.setAttribute('aria-hidden','true');paper.appendChild(flap);
      const foldedHeight=parseFloat(getComputedStyle(paper).getPropertyValue('--packet-height'));
      await tween(ordinary?220:returnInProgress?220:420,t=>{sheetSpread=1-t;reader.style.height=(height+(foldedHeight-height)*t)+'px';flap.style.transform='rotateX('+(175*(1-t))+'deg)';flap.style.opacity=String(clamp((t-.2)/.4));if(face){face.style.transformOrigin='top';face.style.transform='rotateX('+(-88*t)+'deg)';}placeLetter();});
      flap.remove();
      reader.style.height='';if(face)face.style.transform='';
    }
    reader.classList.remove('sid-folding');reader.innerHTML='';sheetSpread=0;paper.classList.remove('is-reading');room.classList.remove('sid-room-reading');
    query('.sid-letter-pick').setAttribute('aria-label',artifact?.pickLabel || '从夹页抽出接力信');
    const from=extraction;
    await tween(ordinary?220:returnInProgress?240:480,t=>{extraction=from*(1-t);placeLetter();});
    extraction=0;busy=false;placeLetter();setStep('open');
    if(artifact.kind==='postcard')record('artifact_return',{kind:'postcard'});
    if(artifact.kind==='relay')record('relay_return',{parts:returnedParts});
    guidance(artifact.kind==='relay'?'信已经回到原来的夹页':artifact.label+'已经回到原来的夹页','可以再取出来，或合书放回');
    if(returnPending)returnToShelf();
  }
  async function returnToShelf() {
    if(returnInProgress || room.hidden)return;
    if(secretDesk?.editing()){secretDesk.dismiss();return;}
    if(busy || gesture) {returnPending=true;return;}
    returnPending=false;returnInProgress=true;
    if(extraction>0) await putLetter();
    if(progress>0) await hinge(0);
    busy=true;setStep('returning');paper.hidden=true;
    await flyBook(false);
    secretDesk?.returned?.();record('book_return');
    room.hidden=true;room.style.backgroundColor='';source.classList.remove('is-out','sid-return-target');$('shop').inert=false;document.documentElement.classList.remove('reader-open');busy=false;returnInProgress=false;setStep('idle');source.focus({preventScroll:true});const next=queuedBook;queuedBook=null;next?.classList.remove('sid-next-target');callbacks.close(next);
  }
  async function flyBook(picking) {
    // Both directions share the same measured path. Orthographic projection
    // during flight lets the closed book meet the actual spine width and height.
    stage.classList.add('sid-in-flight');carrier.style.transform='none';
    const origin=source.querySelector('.spine-face').getBoundingClientRect(),rect=carrier.getBoundingClientRect();
    const dx=origin.left+origin.width/2-rect.left-rect.width/2,dy=origin.top+origin.height/2-rect.top-rect.height/2;
    const front=query('.sid-cover-front'),scale=origin.height/front.offsetHeight;
    if(source.matches('.pile-book,.painted-flat')){
      // Keep a rigid, sideways binding: one scale, with rotation and foreshortening.
      const flatScale=origin.width/front.offsetHeight;
      const tilt=Math.acos(clamp(origin.height/(front.offsetWidth*flatScale)))*180/Math.PI;
      const start=picking?{x:0,y:0,scale:1,tilt:0,amount:0}:{...heldDrag};
      const upper=source.closest('.book-pile')?[...source.parentElement.querySelectorAll('.pile-book')].filter(el=>Number(el.style.getPropertyValue('--pile-index'))<Number(source.style.getPropertyValue('--pile-index'))):[];
      room.dataset.flightModel='rigid-flat';
      await tween(picking?760:540,t=>{
        const u=picking?t:1-t,lift=smooth(clamp(u/.22)),turn=smooth(clamp((u-.22)/.78));
        const s=flatScale*(1+.05*lift)*(1-turn)+start.scale*turn;
        const x=(dx+14*lift)*(1-turn)+start.x*turn;
        const y=(dy-7*lift)*(1-turn)+start.y*turn-Math.sin(turn*Math.PI)*16;
        carrier.style.transform='translate('+x+'px,'+y+'px) scale3d('+s+','+s+','+s+') rotateZ('+(-90*(1-turn)+(-.8+start.tilt)*turn)+'deg) rotateY('+(-tilt*(1-turn))+'deg)';
        const gap=smooth(clamp((u-.22)/.28));
        for(const el of upper)el.style.translate='0 calc(var(--scene-scale) * var(--pile-step) * '+gap+')';
        room.style.backgroundColor='rgba(37,30,23,'+(.62*turn*(1-.65*start.amount))+')';
        stage.style.setProperty('--book-presence',String(turn*(1-.6*start.amount)));
        document.documentElement.style.setProperty('--sid-backdrop-blur',(1.5*turn*(1-start.amount))+'px');
      },t=>t);
      if(!picking)for(const el of upper)el.style.removeProperty('translate');
      stage.classList.remove('sid-in-flight');return;
    }
    room.dataset.flightModel='upright';
    const widthRatio=origin.width/(front.offsetWidth*scale),angle=Math.acos(clamp(widthRatio))*180/Math.PI;
    // The shelf uses a generous visible spine on short rows. Match that face
    // before revealing the full cover, rather than jumping to a thinner shape.
    const stretch=Math.max(1,widthRatio),start=picking?{x:0,y:0,scale:1,tilt:0,amount:0}:{...heldDrag};
    await tween(picking?720:500,t=>{
      const p=picking?t:1-t,s=scale+(start.scale-scale)*p;
      carrier.style.transform='translate('+(dx*(1-p)+start.x*p)+'px,'+(dy*(1-p)+start.y*p-Math.sin(p*Math.PI)*12)+'px) scale('+s*(stretch+(1-stretch)*p)+','+s+') rotateY('+(-angle*(1-p))+'deg) rotateZ('+((-.8+start.tilt)*p)+'deg)';
      room.style.backgroundColor='rgba(37,30,23,'+(.62*p*(1-.65*start.amount))+')';
      stage.style.setProperty('--book-presence',String(p*(1-.6*start.amount)));
      document.documentElement.style.setProperty('--sid-backdrop-blur',(1.5*p*(1-start.amount))+'px');
    });
    stage.classList.remove('sid-in-flight');
  }
  function moveHeld(x,y) {
    const amount=clamp(Math.max(0,y)/Math.min(220,stage.clientHeight*.38));
    heldDrag={x,y,amount,scale:1-.14*amount,tilt:Math.max(-6,Math.min(6,x*.06))};
    stage.classList.add('sid-in-flight');
    carrier.style.transform='translate('+x+'px,'+y+'px) scale('+heldDrag.scale+') rotateZ('+(-.8+heldDrag.tilt)+'deg)';
    room.style.backgroundColor='rgba(37,30,23,'+(.62*(1-.65*amount))+')';
    document.documentElement.style.setProperty('--sid-backdrop-blur',(1.5*(1-amount))+'px');
    stage.style.setProperty('--book-presence',String(1-.6*amount));
    source.classList.toggle('sid-return-target',amount>.16);
  }
  async function reboundHeld() {
    busy=true;setStep('settling');const from={...heldDrag};
    await tween(380,t=>moveHeld(from.x*(1-t),from.y*(1-t)),glide);
    heldDrag={x:0,y:0,scale:1,tilt:0,amount:0};stage.classList.remove('sid-in-flight');
    source.classList.remove('sid-return-target');busy=false;pose(0);setStep('held');
    if(returnPending)returnToShelf();
  }
  function nearPaper(event){
    if(!artifact||progress<.98||extraction>0||secretDesk?.editing())return false;
    const r=paper.getBoundingClientRect();return event.clientX>=r.left-10&&event.clientX<=r.right+10&&event.clientY>=r.top-10&&event.clientY<=r.bottom+10;
  }
  function bindDrag(element,kind,cornerZone=false) {
    element.addEventListener('pointerdown',event=>{
      if(kind==='cover'&&progress>.98&&event.target.closest('.sid-inside-copy')&&(room.dataset.readingLayout==='paired'||room.dataset.leftContent==='quotation'))return;
      if(cornerZone&&(event.target.closest('.sid-paper-traces')||!nearPaper(event)||paper.contains(event.target)))return;
      if(busy || gesture || event.button!==0 || kind==='cover'&&extraction>0 || kind==='letter'&&(progress<.98||extraction===1))return;
      gesture={kind,owner:element,id:event.pointerId,x:event.clientX,y:event.clientY,at:performance.now(),from:kind==='cover'?progress:extraction,moved:false,axis:null,viewportW:innerWidth,viewportH:innerHeight,lastY:event.clientY,lastAt:performance.now(),velocityY:0};
      ignoreClick=0;ignoreClickKind=null;
      element.setPointerCapture(event.pointerId);
    },cornerZone);
    element.addEventListener('pointermove',event=>{
      if(!gesture || gesture.owner!==element || gesture.id!==event.pointerId)return;
      const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y,now=performance.now();
      if(!gesture.axis && Math.max(Math.abs(dx),Math.abs(dy))>7)gesture.axis=kind==='cover'&&gesture.from<.02&&Math.abs(dy)>Math.abs(dx)*1.2?'return':'turn';
      gesture.velocityY=(event.clientY-gesture.lastY)/Math.max(1,now-gesture.lastAt);gesture.lastY=event.clientY;gesture.lastAt=now;
      const delta=kind==='cover'?-dx:-dy;
      if(gesture.axis)gesture.moved=true;
      if(!gesture.moved)return;
      if(kind==='cover'&&gesture.axis==='turn'&&gesture.from<.02)secretDesk?.opening?.();
      event.preventDefault();
      if(gesture.axis==='return'){setStep('book-drag');moveHeld(dx*.55,dy>0?dy:dy*.22);return;}
      if(kind==='cover'){setStep('cover-drag');pose(gesture.from+delta/(position.offsetWidth*1.15));}
      else{setStep('letter-drag');extraction=clamp(gesture.from+delta/145);placeLetter();}
    });
    function release(event,cancel=false) {
      if(!gesture||gesture.owner!==element||gesture.id!==event.pointerId)return;
      const current=gesture;gesture=null;
      // WebKit may deliver resize after pointerup. Compare dimensions at release
      // as well, so rotation cannot turn a cancelled hold into a flick return.
      cancel ||= current.viewportW!==innerWidth || current.viewportH!==innerHeight;
      if(!current.moved){if(returnPending)returnToShelf();return;}
      ignoreClick=performance.now()+350;ignoreClickKind=kind;
      if(current.axis==='return'){
        const threshold=Math.min(96,stage.clientHeight*.18),recent=performance.now()-current.lastAt<90;
        if(!cancel && (heldDrag.y>threshold || heldDrag.y>32&&recent&&current.velocityY>.65))returnToShelf();
        else reboundHeld();
      }else if(kind==='cover'){
        const velocity=(current.x-event.clientX)/Math.max(1,performance.now()-current.at);
        hinge(cancel?current.from:velocity>.45?1:velocity<-.45?0:progress>.45?1:0);
      }else if(!cancel && extraction>.25)takeLetter();
      else {const from=extraction;busy=true;tween(320,t=>{extraction=from*(1-t);placeLetter();}).then(()=>{busy=false;setStep('open');if(returnPending)returnToShelf();});}
    }
    element.addEventListener('pointerup',event=>release(event));
    element.addEventListener('pointercancel',event=>release(event,true));
    element.addEventListener('lostpointercapture',event=>release(event,true));
  }
  function create() {
    room=document.createElement('div');room.className='siddhartha-room';room.hidden=true;
    room.setAttribute('role','dialog');room.setAttribute('aria-modal','true');room.setAttribute('aria-label','悉达多，书与一封接力信');
    room.innerHTML='<div class="sid-toolbar"><span>纸间 · 悉达多</span><button class="sid-return">收起手中的书</button></div><div class="sid-stage"><div class="sid-position"><div class="sid-carrier"><div class="sid-backboard"></div><div class="sid-page-stack"></div><div class="sid-binding" aria-hidden="true"><span></span></div><div class="sid-foreedge" aria-hidden="true"></div><div class="sid-headedge" aria-hidden="true"></div><div class="sid-footedge" aria-hidden="true"></div><div class="sid-page"><span class="sid-page-kicker">纸 间 藏 书</span><h2>《悉达多》</h2><div class="sid-dock"></div><span class="sid-page-number">· 夹页 ·</span></div><button class="sid-cover" aria-label="翻开《悉达多》" aria-expanded="false"><span class="sid-cover-front"><span class="sid-cover-edition">纸 间 藏 书</span><span class="sid-cover-title">悉达多</span><span class="sid-cover-leaf">❧</span><span class="sid-cover-mark" aria-hidden="true"></span></span><span class="sid-cover-back"><small>此书留在这里</small><span class="sid-inside-copy"><strong>关于这本书</strong><span class="sid-synopsis">一个人经历修行和世俗生活，寻找属于自己的智慧。</span><span class="sid-quotation-source" hidden></span><span class="sid-discovery-hint">……好像有人在这里留下了什么。</span></span><small>纸间书店</small></span></button></div></div><div class="sid-letter" hidden><button class="sid-letter-pick" aria-label="从夹页抽出接力信"><span class="sid-letter-packet"><em>留给下一位读者</em><i>⌁</i></span></button><div class="sid-letter-reader" hidden></div></div></div><div class="sid-hint" id="sid-guidance" role="status"></div>';
    room.addEventListener('pointerdown',()=>{room.classList.remove('sid-keyboard');if(ignoreClickKind==='page'){ignoreClick=0;ignoreClickKind=null;}},true);
    room.addEventListener('click',event=>{
      if(event.target.closest('.sid-paper-traces'))return;
      if(!returnInProgress&&performance.now()>=ignoreClick&&step==='open'&&nearPaper(event)&&!paper.contains(event.target)){event.stopPropagation();takeLetter({unfoldOnArrival:true});return;}
      if(!returnInProgress||event.target.closest('.sid-letter,.sid-secret-tools,.sid-secret-editor'))return;
      const viewport=$('room-viewport').getBoundingClientRect();
      if(event.clientX<viewport.left||event.clientX>viewport.right||event.clientY<viewport.top||event.clientY>viewport.bottom)return;
      const target=window.BookArrangement.hitAt(event.clientX,event.clientY);
      if(!target||target===source)return;queuedBook?.classList.remove('sid-next-target');queuedBook=target;target.classList.add('sid-next-target');guidance('接着拿起'+target.getAttribute('aria-label').replace('抽出',''));
    },true);

    document.body.appendChild(room);stage=query('.sid-stage');position=query('.sid-position');carrier=query('.sid-carrier');cover=query('.sid-cover');dock=query('.sid-dock');paper=query('.sid-letter');reader=query('.sid-letter-reader');reader.hidden=false;hint=query('.sid-hint');returnButton=query('.sid-return');
    new IntersectionObserver(checkCue,{threshold:1}).observe(paper);
    secretDesk=window.BookSecrets.mount(room,{
      choose:(next,{duringCover=false}={})=>{if(busy||gesture&&(!duringCover||gesture.kind!=='cover')||extraction>0)return false;chooseArtifact(next);return true;},
      turnPage:turnPaperPage,
      startPageTurn,
      suppressPageRelease:()=>{ignoreClick=performance.now()+500;ignoreClickKind='page';},
      composing:active=>{position.inert=active;paper.inert=active;setStep(active?'composing':'open');if(!active)pose(progress);},
      layout:()=>placeLetter(),
      dock:()=>dock.getBoundingClientRect(),partsCount:()=>allParts().length
    });
    cover.setAttribute('aria-description','轻点或左右拖动翻书。合上后向下拖动收起，也可轻点场景空白处。');
    stage.addEventListener('click',event=>{if((event.target===stage || event.target===position || event.target===room) && !busy && !gesture && performance.now()>=ignoreClick){if(writing||secretDesk?.editing())room.querySelector('textarea:focus')?.blur();else returnToShelf();}});
    bindDrag(cover,'cover');bindDrag(query('.sid-letter-pick'),'letter');bindDrag(room,'letter',true);
    cover.addEventListener('click',event=>{if(progress>.98&&event.target.closest('.sid-inside-copy')&&(room.dataset.readingLayout==='paired'||room.dataset.leftContent==='quotation'))return;if(busy&&step==='picking'){openOnArrival=true;room.dataset.openQueued='true';return;}if(performance.now()<ignoreClick)return;
      const r=paper.getBoundingClientRect();
      if(event.detail&&artifact&&progress>.98&&extraction===0&&event.clientX>=r.left-10&&event.clientX<=r.right+10&&event.clientY>=r.top-10&&event.clientY<=r.bottom+10){takeLetter({unfoldOnArrival:true});return;}
      hinge(progress>.5?0:1);});
    query('.sid-letter-pick').addEventListener('click',()=>{if(ignoreClickKind!=='letter'||performance.now()>=ignoreClick){if(extraction===1)openLetter();else takeLetter({unfoldOnArrival:true});}});
    returnButton.addEventListener('click',returnToShelf);
    reader.addEventListener('input',event=>{if(event.target.id==='sid-reply'){draft=event.target.value;secretDesk.saveReplyDraft(artifact.localId||'preset',draft);}});
    reader.addEventListener('click',event=>{
      if(busy)return;
      if(event.target.closest('[data-sid="flip"]')){flipPaper();return;}
      if(event.target.closest('.sid-unfold')) {unfoldNext();return;}
      const action=event.target.closest('[data-sid]')?.dataset.sid;
      if(action==='put')putLetter();
      else if(action==='write' && (artifact.kind==='relay'||artifact.kind==='stack')){draft=secretDesk.replyDraft(artifact.localId||'preset');writing=true;if(artifact.kind==='relay')record('relay_pen_click');letterControls();query('textarea').focus();query('textarea').scrollIntoView({block:'nearest'});}
      else if(action==='cancel'){writing=false;letterControls();}
      else if(action==='save' && writing && (artifact.kind==='relay'||artifact.kind==='stack')){
        const text=query('textarea').value.trim();if(!text){query('.sid-message').textContent='写一点什么，再留给下一位读者。';return;}
        if(artifact.write){const result=artifact.write(text);if(!result.ok){query('.sid-message').textContent=result.message;return;}}else callbacks.write(text);secretDesk.saveReplyDraft(artifact.localId||'preset','');if(artifact.kind==='relay')record('relay_save',{parts:allParts().length});draft='';writing=false;letterControls();unfoldNext();
      }
    });
    document.addEventListener('keydown',event=>{
      if(room.hidden)return;
      if(['Tab','Enter',' '].includes(event.key))room.classList.add('sid-keyboard');
      if(event.key==='Escape'){event.preventDefault();returnToShelf();}
      if(event.key==='Tab'){
        const items=[...room.querySelectorAll('button,textarea,input')].filter(el=>el.getClientRects().length && getComputedStyle(el).visibility!=='hidden' && !el.closest('[hidden]') && !el.closest('[inert]'));
        const first=items[0],last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    });
    window.addEventListener('resize',()=>{if(!room.hidden){settle();if(gesture){if(gesture.kind==='letter')extraction=0;const wasReturn=gesture.axis==='return';ignoreClick=performance.now()+500;ignoreClickKind=gesture.kind;gesture=null;if(wasReturn){moveHeld(0,0);stage.classList.remove('sid-in-flight');source.classList.remove('sid-return-target');}pose(progress>.5?1:0);setStep(progress>.5?'open':'held');}placeLetter();if(returnPending)returnToShelf();}});
    new ResizeObserver(()=>{if(!room.hidden && extraction>0)placeLetter();}).observe(reader);
    window.visualViewport?.addEventListener('resize',()=>{if(!room.hidden)placeLetter();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
  }
  async function open(button,handlers) {
    if(!room)create();if(!room.hidden)return;
    source=button;callbacks=handlers;book=handlers.book;artifact=handlers.artifact;openOnArrival=false;busy=true;progress=0;extraction=0;sheetSpread=0;draft='';returnPending=false;heldDrag={x:0,y:0,scale:1,tilt:0,amount:0};gesture=null;ignoreClick=0;ignoreClickKind=null;
    secretDesk.reset(book,artifact);
    artifact=secretDesk.initialArtifact();
    queuedBook=null;delete room.dataset.openQueued;room.dataset.readerBook=book[0];
    room.style.setProperty('--title-length',String(book[1].length));
    cueSeen=false;room.dataset.artifact=artifact?.kind || 'none';room.dataset.artifactSource=artifact?.source||'';room.dataset.stock=artifact?.stock||'cream';
    room.setAttribute('aria-label',book[1]+(artifact?'，书与'+artifact.label:'，书籍阅读'));
    query('.sid-toolbar > span').textContent='纸间 · '+book[1];
    query('.sid-page h2').textContent='《'+book[1]+'》';
    query('.sid-cover-title').textContent=book[1];
    insideCopy();
    query('.sid-discovery-hint').textContent=artifact?'……好像有人在这里留下了什么。':'这次没有遇见新的阅读痕迹。';
    query('.sid-letter-packet em').textContent=artifact?.label || '';
    query('.sid-letter-packet i').textContent=artifact?.kind==='rose'?'🥀':artifact?.kind==='envelope'?'✉':'⌁';
    room.style.setProperty('--reader-cover',getComputedStyle(button).getPropertyValue('--book-color'));
    room.dataset.coverMaterial=handlers.coverArt?.material||'illustrated';
    room.dataset.coverArt=String(!!handlers.coverArt&&handlers.coverArt.material!=='cloth');
    query('.sid-binding span').textContent=book[1];
    query('.sid-cover-mark').innerHTML=handlers.coverArt?.material==='cloth'?'<svg viewBox="0 0 80 80" focusable="false">'+(coverMarks[handlers.coverArt.mark]||coverMarks.leaf)+'</svg>':'';
    for(const property of ['--cover-art-size','--cover-art-position','--cover-art-clip','--cover-art-image']) {
      if(handlers.coverArt)room.style.setProperty(property,getComputedStyle(button).getPropertyValue(property));
      else room.style.removeProperty(property);
    }
    room.hidden=false;paper.classList.remove('is-reading');room.classList.remove('sid-room-reading');reader.innerHTML='';query('.sid-letter-pick').setAttribute('aria-label',artifact?.pickLabel || '从夹页抽出接力信');setStep('picking');
    $('shop').inert=true;document.documentElement.classList.add('reader-open');pose(0);
    button.classList.add('is-out');guidance('');
    await flyBook(true);
    busy=false;pose(0);setStep('held');record('book_open');guidance('轻点或左右拖动翻书','合上后向下拖动收起，或轻点场景空白处');returnButton.textContent='收起手中的书';cover.focus({preventScroll:true});
    if(returnPending)returnToShelf();else if(openOnArrival)hinge(1);
  }
  return {open};
})();

// All shelves share the v0.4.3 motion model; content and clues are supplied by the game.
window.BookReader = window.Siddhartha;
