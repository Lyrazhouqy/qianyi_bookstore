'use strict';
// Touch has no hover: give immediate physical feedback without delaying native clicks.
(() => {
  const viewport=document.getElementById('room-viewport');
  if(!viewport)return;
  const motion=matchMedia('(prefers-reduced-motion:reduce)'),phone=matchMedia('(hover:none) and (pointer:coarse)');
  const selector='.spine,#change-window,.wall-note,#change-bouquet,#touch-bouquet,#lamp-pull,#shop-cat,.shop-globe';
  const visible=new Set(),seen=new Set(),touches=new Set();
  let gesture=null,blocked=null,cue=null,timer=0,ending=0,lastActivity=performance.now(),blurred=false;
  const idle=()=>document.body.dataset.phase==='idle'&&!document.hidden&&!blurred&&!document.querySelector('dialog[open]')&&!viewport.classList.contains('is-dragging');
  function buttonAt(event){
    const target=event.target.closest?.(selector);
    return target?.matches('.spine')?(window.BookArrangement.hitAt(event.clientX,event.clientY)||target):target;
  }
  function stopCue(){
    clearTimeout(ending);ending=0;
    if(cue){cue.classList.remove('is-touch-cue');cue.dispatchEvent(new Event('shop:cue-stop'));cue=null;}
  }
  function cancelPress(){gesture?.button?.classList.remove('is-touch-press');}
  function cancelMotion(){cancelPress();if(gesture?.button?.matches('.wall-note'))gesture.button.dispatchEvent(new Event('shop:cue-stop'));if(gesture?.button?.matches('#touch-bouquet,#change-bouquet'))gesture.button.dispatchEvent(new Event('shop:press-cancel'));}
  function plan(){
    clearTimeout(timer);timer=0;
    if(!phone.matches||motion.matches||!idle()||gesture||touches.size||cue||seen.size>=4)return;
    timer=setTimeout(discover,Math.max(350,1200-(performance.now()-lastActivity)));
  }
  function activity(){lastActivity=performance.now();stopCue();plan();}
  function discover(){
    timer=0;
    if(!phone.matches||motion.matches||!idle()||gesture||touches.size||cue)return;
    const next=[...visible].find(el=>!seen.has(el.dataset.touchCueKind)&&!el.classList.contains('is-out'));
    if(!next)return;
    seen.add(next.dataset.touchCueKind);cue=next;next.classList.add('is-touch-cue');next.dispatchEvent(new Event('shop:cue'));
    ending=setTimeout(()=>{stopCue();lastActivity=performance.now();plan();},1650);
  }
  function down(event){
    activity();
    if(event.pointerType!=='touch')return;
    touches.add(event.pointerId);
    if(!event.isPrimary){cancelMotion();if(gesture)blocked={button:gesture.button,origin:gesture.origin,until:performance.now()+650};gesture=null;return;}
    blocked=null;
    if(!idle())return;
    const button=buttonAt(event);if(!button)return;
    gesture={id:event.pointerId,button,origin:event.target.closest(selector),x:event.clientX,y:event.clientY,moved:false};
    button.classList.add('is-touch-press');
  }
  function move(event){
    if(!gesture||gesture.id!==event.pointerId)return;
    if(Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>9){gesture.moved=true;cancelMotion();stopCue();}
  }
  function finish(event,cancel=false){
    touches.delete(event.pointerId);
    if(gesture?.id!==event.pointerId){plan();return;}
    const old=gesture;if(cancel||old.moved)cancelMotion();else cancelPress();gesture=null;
    if(cancel||old.moved)blocked={button:old.button,origin:old.origin,until:performance.now()+650};
    lastActivity=performance.now();plan();
  }
  // No pointer capture, preventDefault or touch-action override: camera scrolling stays native.
  viewport.addEventListener('pointerdown',down,{capture:true,passive:true});
  window.addEventListener('pointermove',move,{capture:true,passive:true});
  window.addEventListener('pointerup',event=>finish(event),{capture:true,passive:true});
  window.addEventListener('pointercancel',event=>finish(event,true),{capture:true,passive:true});
  viewport.addEventListener('click',event=>{
    if(event.detail===0||!blocked||performance.now()>blocked.until)return;
    const target=event.target.closest?.(selector);if(target===blocked.button||target===blocked.origin){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  viewport.addEventListener('scroll',()=>{if(gesture){gesture.moved=true;cancelMotion();}activity();},{passive:true});
  function reset(){touches.clear();cancelMotion();if(gesture)blocked={button:gesture.button,origin:gesture.origin,until:performance.now()+650};gesture=null;stopCue();clearTimeout(timer);timer=0;lastActivity=performance.now();plan();}
  new MutationObserver(()=>{if(!idle())reset();else plan();}).observe(document.body,{attributes:true,attributeFilter:['data-phase']});
  new MutationObserver(()=>{if(!idle())reset();else plan();}).observe(document.getElementById('shop'),{subtree:true,attributes:true,attributeFilter:['open']});
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){if(entry.isIntersecting&&entry.intersectionRatio>=.6)visible.add(entry.target);else visible.delete(entry.target);}
    if(cue&&!visible.has(cue))stopCue();plan();
  },{root:viewport,threshold:[0,.6]});
  const targets=[...document.querySelectorAll('.spine'),document.getElementById('change-window'),document.getElementById('lamp-pull'),document.querySelector('.wall-note')];
  for(const el of targets.filter(Boolean)){el.dataset.touchCueKind=el.matches('.spine')?'book':el.id==='change-window'?'window':el.id==='lamp-pull'?'lamp':'wall';observer.observe(el);}
  window.addEventListener('blur',()=>{blurred=true;reset();});window.addEventListener('focus',()=>{blurred=false;reset();});window.addEventListener('resize',reset);document.addEventListener('visibilitychange',()=>{if(!document.hidden)blurred=false;reset();});window.addEventListener('pageshow',()=>{blurred=false;reset();});
  motion.addEventListener('change',reset);phone.addEventListener('change',reset);plan();
})();
