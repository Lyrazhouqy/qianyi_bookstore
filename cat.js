'use strict';
(() => {
  const cat=document.getElementById('shop-cat'),art=cat.querySelector('.cat-body');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  // Six redrawn poses per action, grounded and registered at a fixed scale.
  // The source sheets stay intact; drawImage selects cels without deforming pixels.
  const clips={"tail":{"src":"assets/scene/calico-tail-low-cels-v01413.png","frames":[[58,170,493,434,434],[507,170,1016,434,434],[1035,170,1526,439,434],[82,586,493,851,850],[507,587,1016,851,851],[1094,586,1526,850,850]],"sequence":[[0,180],[1,150],[2,130],[3,150],[4,130],[2,130],[3,140],[5,380]]},"ears":{"src":"assets/scene/calico-ear-cels-v01413.png","frames":[[41,126,562,431,431],[611,123,1137,431,431],[1196,127,1712,430,430],[41,526,567,832,831],[613,528,1137,833,833],[1196,526,1718,832,830]],"sequence":[[0,200],[1,180],[2,110],[3,100],[2,90],[4,160],[5,380]]},"belly":{"src":"assets/scene/calico-belly-cels-v01413.png","frames":[[29,156,509,432,432],[545,156,1005,434,434],[1051,170,1522,447,447],[24,618,528,902,902],[538,566,1048,901,901],[1064,609,1525,899,899]],"sequence":[[0,160],[1,180],[2,150],[3,200],[4,260],[5,1100],[3,180],[2,180],[1,160],[0,280]]}};
  const canvas=document.createElement('canvas');canvas.className='cat-motion';canvas.setAttribute('aria-hidden','true');cat.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  let frame=0,active=false,revision=0,gesture=null,ignoreUntil=0;
  function load(clip){
    if(clip.image)return Promise.resolve(clip.image);
    if(clip.pending)return clip.pending;
    const image=new Image();image.src=clip.src;
    clip.pending=image.decode().then(()=>{clip.image=image;return image;}).finally(()=>{clip.pending=null;});
    return clip.pending;
  }
  for(const clip of Object.values(clips))load(clip).catch(()=>{});
  function sizeCanvas(){
    const width=Math.min(480,Math.max(160,Math.ceil(cat.clientWidth*1790/1342*Math.min(2,devicePixelRatio||1))));
    canvas.width=width;canvas.height=Math.round(width*1230/1790);
  }
  function draw(clip,index){
    const [l,t,r,b,ground]=clip.frames[index],scale=1317/(clip.frames[0][2]-clip.frames[0][0]+1);
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(canvas.width/1790,0,0,canvas.height/1230,240*canvas.width/1790,240*canvas.height/1230);
    const sx=Math.max(0,l-1),sy=Math.max(0,t-1),sw=Math.min(clip.image.width-sx,r-l+3),sh=Math.min(clip.image.height-sy,b-t+3);
    ctx.drawImage(clip.image,sx,sy,sw,sh,1380-(r-sx)*scale,977-(ground-sy)*scale,sw*scale,sh*scale);
  }
  function finish(){
    ++revision;cancelAnimationFrame(frame);frame=0;active=false;
    canvas.style.opacity='0';canvas.style.transform='';art.style.opacity='';
    cat.dataset.catAction='rest';cat.removeAttribute('aria-busy');
  }
  async function react(){
    if(active||document.hidden||document.body.dataset.phase!=='idle'||document.querySelector('dialog[open]'))return;
    const action=['tail','ears','belly'][Math.floor(Math.random()*3)],token=++revision;
    active=true;cat.setAttribute('aria-busy','true');
    let clip=clips[action];
    try{await load(clip);}catch{
      // A failed sheet never leaves a half-posed cat or an endless animation lock.
      if(token===revision)finish();return;
    }
    if(token!==revision||document.hidden)return;
    sizeCanvas();draw(clip,0);canvas.style.opacity='0';
    cat.dataset.catAction=action;
    canvas.style.transform=getComputedStyle(art).transform;
    const reduced=motion.matches;
    const sequence=reduced?[[0,130],[action==='belly'?3:1,520],[0,170]]:clip.sequence;
    const duration=sequence.reduce((sum,item)=>sum+item[1],0),edge=reduced?90:100,start=performance.now();
    let last=-1;
    function tick(now){
      if(token!==revision)return;
      const elapsed=Math.max(0,now-start),mix=Math.max(0,Math.min(1,elapsed/edge,(duration-elapsed)/edge));
      canvas.style.opacity=String(mix);art.style.opacity=String(1-mix);
      let at=0,index=sequence.at(-1)[0];
      for(const [pose,time] of sequence){at+=time;if(elapsed<at){index=pose;break;}}
      if(index!==last){draw(clip,index);last=index;}
      if(elapsed<duration)frame=requestAnimationFrame(tick);else finish();
    }
    frame=requestAnimationFrame(tick);
  }
  // Leave native touch panning and the existing mouse camera drag in charge.
  cat.addEventListener('pointerdown',e=>{gesture={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};},{passive:true});
  cat.addEventListener('pointermove',e=>{if(gesture?.id===e.pointerId&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture.moved=true;},{passive:true});
  cat.addEventListener('pointerup',()=>{if(gesture?.moved)ignoreUntil=performance.now()+350;gesture=null;},{passive:true});
  cat.addEventListener('pointercancel',()=>{gesture=null;ignoreUntil=performance.now()+350;},{passive:true});
  cat.addEventListener('click',e=>{e.stopPropagation();if(e.detail>0&&(gesture?.moved||performance.now()<ignoreUntil))return;react();});
  new MutationObserver(()=>{if(document.body.dataset.phase!=='idle')finish();}).observe(document.body,{attributes:true,attributeFilter:['data-phase']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
  motion.addEventListener('change',finish);window.addEventListener('pagehide',finish);window.addEventListener('resize',finish);
  finish();
})();
