'use strict';
(() => {
  const world=document.querySelector('.room-world'),button=document.getElementById('lamp-pull'),cord=document.getElementById('lamp-cord');
  const key='paperbook-lamp-v1',motion=matchMedia('(prefers-reduced-motion: reduce)'),hover=matchMedia('(hover: hover)'),reduced=()=>motion.matches;
  let lit=false,drag=null,frame=0,offset=0,side=0,suppressClickUntil=0;
  try {lit=localStorage.getItem(key)==='on';}catch{}
  function paint(){world.dataset.lamp=lit?'on':'off';button.setAttribute('aria-pressed',String(lit));button.setAttribute('aria-label',lit?'拉绳关灯':'拉绳开灯');}
  function toggle(){lit=!lit;paint();try{localStorage.setItem(key,lit?'on':'off');}catch{}}
  function pose(y,x=0){
    offset=y;side=x;const scale=world.getBoundingClientRect().width/940,dy=y/scale,dx=x/scale,anchor=parseFloat(getComputedStyle(world).getPropertyValue('--lamp-cord-x'));
    button.style.setProperty('--pull-y',y+'px');button.style.setProperty('--pull-x',x+'px');button.style.setProperty('--pull-angle',Math.atan2(x,102*scale)*180/Math.PI+'deg');
    cord.setAttribute('d',`M${anchor} 784 Q${anchor} ${820+dy*.2} ${anchor+dx} ${886+dy}`);
  }
  function rebound(){
    cancelAnimationFrame(frame);button.classList.remove('is-pulling','is-armed','is-hinting');
    if(reduced()){pose(0);return;}
    const y=offset,x=side,start=performance.now();
    function step(now){const t=now-start;if(t>=600){pose(0);frame=0;return;}const spring=Math.exp(-t/105)*Math.cos(t/75);pose(y*spring,x*spring);frame=requestAnimationFrame(step);}
    frame=requestAnimationFrame(step);
  }
  function hint(event){
    if((event?.pointerType&&event.pointerType!=='mouse')||!hover.matches||reduced()||drag||frame||document.hidden||document.body.dataset.phase!=='idle'||document.querySelector('dialog[open]'))return;
    const length=102*world.getBoundingClientRect().width/940,start=performance.now();
    button.classList.add('is-hinting');
    function sway(now){
      const t=now-start;
      if(t>=1600){pose(0);frame=0;button.classList.remove('is-hinting');return;}
      const x=3.4*Math.sin(t/1600*Math.PI*3)*(1-Math.exp(-t/65))*Math.exp(-t/720);
      pose(-x*x/(2*length),x);frame=requestAnimationFrame(sway);
    }
    frame=requestAnimationFrame(sway);
  }
  function stopHint(){if(button.classList.contains('is-hinting'))rebound();}
  function reset(){cancel();cancelAnimationFrame(frame);frame=0;button.classList.remove('is-hinting');pose(0);}
  button.addEventListener('pointerenter',hint);button.addEventListener('pointerleave',stopHint);
  button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))hint();});button.addEventListener('blur',stopHint);
  function cancel(){if(!drag)return;const id=drag.id;drag=null;suppressClickUntil=performance.now()+450;if(button.hasPointerCapture(id))button.releasePointerCapture(id);rebound();}
  button.addEventListener('pointerdown',event=>{
    event.stopPropagation();if(event.button!==0||!event.isPrimary||drag||document.body.dataset.phase!=='idle')return;
    cancelAnimationFrame(frame);frame=0;button.classList.remove('is-hinting');pose(0);drag={id:event.pointerId,x:event.clientX,y:event.clientY,distance:0,dy:0};
    button.classList.add('is-pulling');button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;event.stopPropagation();event.preventDefault();
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag.dy=Math.max(0,dy);drag.distance=Math.max(drag.distance,Math.hypot(dx,dy));
    const stretch=dy<=64?Math.max(0,dy):64+Math.min(16,(dy-64)*.2);pose(stretch,Math.max(-10,Math.min(10,dx*.18)));button.classList.toggle('is-armed',dy>=22);
  });
  button.addEventListener('pointerup',event=>{
    if(!drag||drag.id!==event.pointerId)return;event.stopPropagation();
    const pull=drag;drag=null;suppressClickUntil=performance.now()+450;
    if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);
    if(pull.dy>=22||pull.distance<5){toggle();if(pull.distance<5)pose(19);}
    rebound();
  });
  button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
  button.addEventListener('click',event=>{event.stopPropagation();if(event.detail>0&&performance.now()<suppressClickUntil){event.preventDefault();return;}if(document.body.dataset.phase!=='idle')return;toggle();cancelAnimationFrame(frame);pose(19);rebound();});
  window.addEventListener('resize',reset);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  motion.addEventListener('change',reset);hover.addEventListener('change',reset);
  new MutationObserver(()=>{if(document.body.dataset.phase!=='idle')reset();}).observe(document.body,{attributes:true,attributeFilter:['data-phase']});
  paint();pose(0);
})();
