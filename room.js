'use strict';
(() => {
  const viewport=document.getElementById('room-viewport');
  const catalogue=document.getElementById('book-index'),journal=document.getElementById('shop-journal'),windowSheet=document.getElementById('window-settings');
  const musicSheet=document.getElementById('music-settings'),bouquetSheet=document.getElementById('bouquet-settings');
  const sheets=[catalogue,journal,windowSheet,musicSheet,bouquetSheet];
  const sheetOpeners=new WeakMap(),pickingBook=new WeakSet();
  const palette=['#7b9499','#b48460','#6e8587','#778967','#bdac78','#82969c','#d2af64','#7f8f71','#bd8d73','#91a7ae','#a6b17f','#c99c83','#e0c58a','#eee3c8','#6f969e','#e6b852'];
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function updateJournal(){
    document.querySelector('[data-visit-label]').textContent=state.visits?'翻过 '+state.visits+' 次旧书':'书店很安静';
    document.getElementById('journal-summary').textContent=state.visits?'你翻过 '+state.visits+' 次旧书，遇见 '+state.small+' 处阅读痕迹。':'还没翻开今天的第一本书。随手看看，故事就藏在书页间。';
    document.getElementById('book-catalogue').innerHTML=[...sceneBookIds.map(id=>books.find(book=>book[0]===id)),...books.filter(book=>!sceneBookIds.includes(book[0])&&(state.seen.includes(book[0])||book[0]==='ship'))].map((book,i)=>'<button class="catalogue-book" data-book="'+book[0]+'" style="--catalogue-color:'+palette[i%palette.length]+'"><span><strong>'+esc(book[1])+'</strong><small>'+ (!sceneBookIds.includes(book[0])?'抽屉里留着的旧书':state.seen.includes(book[0])?'来过的书页':'翻开看看')+'</small></span></button>').join('');
  }
  function showSheet(sheet,opener){
    if(document.body.dataset.phase!=='idle')return;
    updateJournal();for(const other of sheets)if(other.open)other.close();
    sheetOpeners.set(sheet,opener||document.activeElement);sheet.showModal();
    const heading=sheet.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});sheet.dispatchEvent(new Event('sheetopened'));
  }
  document.getElementById('open-music').addEventListener('click',event=>showSheet(musicSheet,event.currentTarget));
  for(const id of ['change-bouquet','touch-bouquet'])document.getElementById(id).addEventListener('click',event=>{event.stopPropagation();showSheet(bouquetSheet,event.currentTarget);});
  document.querySelectorAll('[data-journal]').forEach(button=>button.addEventListener('click',()=>showSheet(journal,button)));
  document.getElementById('open-book-index').addEventListener('click',event=>showSheet(catalogue,event.currentTarget));
  for(const sheet of sheets){
    sheet.querySelector('[data-close-sheet]').addEventListener('click',()=>sheet.close());
    sheet.addEventListener('close',()=>{if(pickingBook.has(sheet)){pickingBook.delete(sheet);return;}sheetOpeners.get(sheet)?.focus({preventScroll:true});});
    sheet.addEventListener('click',event=>{if(event.target===sheet){const r=sheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sheet.close();}});
  }
  document.getElementById('book-catalogue').addEventListener('click',event=>{
    const choice=event.target.closest('[data-book]');if(!choice)return;
    pickingBook.add(catalogue);catalogue.close();const book=document.querySelector('.spine[data-id="'+choice.dataset.book+'"]');
    if(book){book.scrollIntoView({block:'center',inline:'center',behavior:'instant'});book.focus({preventScroll:true});book.click();}
    else{const drawer=document.getElementById('open-book-index');drawer.scrollIntoView({block:'center',inline:'center',behavior:'instant'});openBook(choice.dataset.book,drawer);}
  });
  const windowScenes={original:null,seaside:'assets/scene/window-seaside-v065.png',rain:'assets/scene/window-rain-v0611.png',sunset:'assets/scene/window-sunset-v0611.png',snow:'assets/scene/window-snow-v0611.png'};
  const windowKey='paperbook-window-v1',windowMessage=document.getElementById('window-message');
  const windowView=document.getElementById('window-view'),windowPicture=document.getElementById('window-picture'),windowNext=document.getElementById('window-picture-next');
  let windowState={scene:'original',custom:null},windowRevision=0,uploadRevision=0,finishSceneryFade=null,hasSavedWindow=false;
  const safePicture=value=>typeof value==='string' && value.length<5700000 && /^data:image\/(png|jpeg|webp|avif);base64,/.test(value);
  try {
    const saved=JSON.parse(localStorage.getItem(windowKey));
    if(saved && ([...Object.keys(windowScenes),'custom']).includes(saved.scene)){windowState={scene:saved.scene,custom:safePicture(saved.custom)?saved.custom:null};hasSavedWindow=true;}
    if(windowState.scene==='custom'&&!windowState.custom)windowState.scene='original';
  } catch { /* Missing storage leaves the illustrated views available. */ }
  function randomScene(exclude=windowState.scene){
    const pool=[...Object.keys(windowScenes),...(windowState.custom?['custom']:[])].filter(scene=>scene!==exclude);
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function fadeScenery(source,scene){
    finishSceneryFade?.();
    return new Promise(resolve=>{
      let frame,start;
      const finish=()=>{
        cancelAnimationFrame(frame);
        if(source){windowPicture.setAttribute('href',source);windowView.removeAttribute('hidden');}
        else{windowView.setAttribute('hidden','');windowPicture.removeAttribute('href');}
        windowPicture.style.opacity='1';windowNext.style.opacity='0';windowNext.removeAttribute('href');
        document.getElementById('change-window').dataset.scenery=scene;
        if(finishSceneryFade===finish)finishSceneryFade=null;resolve();
      };
      finishSceneryFade=finish;
      if(reduced() || document.hidden){finish();return;}
      if(source)windowNext.setAttribute('href',source);
      windowNext.style.opacity='0';windowView.removeAttribute('hidden');
      function tick(time){start??=time;const t=Math.min(1,(time-start)/1200),ease=t*t*(3-2*t);windowPicture.style.opacity=source?'1':String(1-ease);windowNext.style.opacity=String(ease);if(t===1)finish();else frame=requestAnimationFrame(tick);}
      frame=requestAnimationFrame(tick);
    });
  }
  async function changeScenery(next,persist=true,initial=false){
    const revision=++windowRevision;finishSceneryFade?.();
    const source=next.scene==='custom'?next.custom:windowScenes[next.scene];
    if(source){
      try {const img=new Image();img.src=source;await img.decode();}
      catch {if(revision===windowRevision){if(!persist||initial)await changeScenery({...windowState,scene:'original'},persist);else{windowMessage.textContent='这张图片暂时打不开，请换一张试试。';}}return;}
    }
    if(revision!==windowRevision)return;
    windowState=next;
    document.querySelectorAll('[data-window-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.windowScene===next.scene)));
    const preview=document.getElementById('window-custom-preview');preview.hidden=!next.custom;
    if(next.custom)preview.src=next.custom;
    document.querySelector('.photo-placeholder').toggleAttribute('hidden',!!next.custom);
    document.querySelector('.photo-add-badge').hidden=!next.custom;
    document.getElementById('window-photo-hint').textContent=next.custom?'点击更换':'点此上传';
    windowMessage.textContent='';
    if(persist)try{localStorage.setItem(windowKey,JSON.stringify(next));}catch{windowMessage.textContent='风景已换好；浏览器暂时无法保存，刷新后可能恢复原景。';}
    await fadeScenery(source,next.scene);
  }
  document.getElementById('change-window').addEventListener('click',event=>showSheet(windowSheet,event.currentTarget));
  windowSheet.addEventListener('click',event=>{
    const choice=event.target.closest('[data-window-scene]');if(!choice)return;
    if(choice.dataset.windowScene==='custom'){const input=document.getElementById('window-file');input.value='';input.click();return;}
    uploadRevision++;
    changeScenery({...windowState,scene:choice.dataset.windowScene});
  });
  document.getElementById('window-file').addEventListener('change',async event=>{
    const input=event.currentTarget,file=input.files?.[0];input.value='';if(!file)return;
    const upload=++uploadRevision;windowRevision++;finishSceneryFade?.();
    if(!['image/png','image/jpeg','image/webp','image/avif'].includes(file.type)){windowMessage.textContent='请选择 PNG、JPG、WebP 或 AVIF 图片。';return;}
    if(file.size>4*1024*1024){windowMessage.textContent='图片有点大，请选择4MB以内的一张。';return;}
    windowMessage.textContent='把风景放进窗里……';
    try {
      const picture=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      if(upload!==uploadRevision)return;
      if(!safePicture(picture))throw new Error('Unsupported image');
      await changeScenery({scene:'custom',custom:picture});
    }catch{if(upload===uploadRevision)windowMessage.textContent='这张图片暂时打不开，请换一张试试。';}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finishSceneryFade?.();});
  window.addEventListener('pagehide',()=>finishSceneryFade?.());
  // Choose once per page load; manual choices then stay put for this visit.
  changeScenery({...windowState,scene:randomScene(hasSavedWindow?windowState.scene:null)},true,true);
  const world=viewport.querySelector('.room-world');
  // One quiet resting place for the whole visit, independent of reading progress.
  const cat=document.getElementById('shop-cat');
  const resting=Math.random()<.5?'sofa':'stool';
  cat.dataset.resting=resting;
  cat.setAttribute('aria-label','轻碰趴在'+(resting==='sofa'?'沙发':'凳子')+'上的三花小猫');
  let sceneScale=1,ready=false,drag=null,dragFinishedAt=-Infinity,lastWidth=0,lastHeight=0;
  function goToShelf(animate=true){
    viewport.scrollTo({top:Math.max(0,world.offsetTop+556*sceneScale-viewport.clientHeight/2),behavior:animate&&!reduced()?'smooth':'instant'});
  }
  function endDrag(event){
    if(!drag || (event && drag.id!==event.pointerId))return;
    const id=drag.id;
    if(drag.moved)dragFinishedAt=performance.now();
    drag=null;viewport.classList.remove('is-dragging');
    if(viewport.hasPointerCapture(id))viewport.releasePointerCapture(id);
  }
  function sizeScene(){
    const width=Math.max(620,Math.min(viewport.clientWidth*1.12,viewport.clientHeight*940/1672));
    const centerX=(viewport.scrollLeft+lastWidth/2-world.offsetLeft)/sceneScale;
    const centerY=(viewport.scrollTop+lastHeight/2-world.offsetTop)/sceneScale;
    endDrag();
    sceneScale=width/940;
    document.documentElement.style.setProperty('--scene-width',width+'px');
    document.documentElement.style.setProperty('--scene-scale',String(sceneScale));
    if(!ready){
      ready=true;
      // Small phones start at the readable bookcase; the window and room edges remain pannable.
      viewport.scrollLeft=world.offsetLeft+(viewport.clientWidth<=600?610:520)*sceneScale-viewport.clientWidth/2;
      if(viewport.clientHeight<500)goToShelf(false);
    } else if(document.body.dataset.phase!=='idle'){
      document.querySelector('.spine.is-out')?.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
    } else {
      viewport.scrollLeft=world.offsetLeft+centerX*sceneScale-viewport.clientWidth/2;
      viewport.scrollTop=world.offsetTop+centerY*sceneScale-viewport.clientHeight/2;
    }
    lastWidth=viewport.clientWidth;lastHeight=viewport.clientHeight;
  }
  viewport.addEventListener('pointerdown',event=>{
    // A fresh gesture must not inherit suppression from the previous drag's trailing click.
    dragFinishedAt=-Infinity;
    if(event.pointerType!=='mouse'||event.button!==0||document.body.dataset.phase!=='idle')return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false};
  });
  viewport.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>6){drag.moved=true;viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');}
    if(drag.moved){event.preventDefault();viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;}
  });
  viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);
  window.addEventListener('blur',()=>endDrag());
  viewport.addEventListener('click',event=>{if(event.detail>0&&performance.now()-dragFinishedAt<250){event.preventDefault();event.stopPropagation();}},true);
  new ResizeObserver(sizeScene).observe(viewport);sizeScene();
  document.getElementById('goto-shelves').addEventListener('click',()=>goToShelf());
  new MutationObserver(updateJournal).observe(document.getElementById('status'),{childList:true});
  updateJournal();
  if(new URLSearchParams(location.search).get('focus')==='siddhartha')requestAnimationFrame(()=>goToShelf(false));
})();
