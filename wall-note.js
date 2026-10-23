'use strict';
(() => {
  const button=document.querySelector('.wall-note'),paper=button?.querySelector('.wall-note-paper');
  if(!paper)return;
  const hover=matchMedia('(hover:hover) and (pointer:fine)'),motion=matchMedia('(prefers-reduced-motion:reduce)');
  let frame=0,angle=0,velocity=0,last=0,started=0,over=false;
  const pose=()=>paper.setAttribute('transform','rotate('+angle.toFixed(4)+' 207 615)');
  function reset(){cancelAnimationFrame(frame);frame=0;angle=velocity=0;over=false;button.classList.remove('is-swaying');pose();}
  function tick(now){
    const dt=Math.min(.032,(now-last)/1000);last=now;
    // A small nudge, then a damped pendulum about the stationary clip.
    velocity+=(-105*angle-(over?5.8:10)*velocity)*dt;angle+=velocity*dt;pose();
    if(now-started>1800||Math.abs(angle)<.015&&Math.abs(velocity)<.15){reset();return;}
    frame=requestAnimationFrame(tick);
  }
  function enter(event){
    if(event.pointerType!=='mouse'||!hover.matches||motion.matches||document.hidden||document.body.dataset.phase!=='idle'||document.querySelector('dialog[open]')||frame)return;
    over=true;velocity=19;last=started=performance.now();button.classList.add('is-swaying');frame=requestAnimationFrame(tick);
  }
  button.addEventListener('pointerenter',enter);
  button.addEventListener('pointerleave',()=>{over=false;});
  button.addEventListener('pointerdown',reset);
  button.addEventListener('click',reset);
  window.addEventListener('blur',reset);window.addEventListener('resize',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  hover.addEventListener('change',reset);motion.addEventListener('change',reset);
  new MutationObserver(()=>{if(document.body.dataset.phase!=='idle')reset();}).observe(document.body,{attributes:true,attributeFilter:['data-phase']});
  new MutationObserver(()=>{if(document.querySelector('dialog[open]'))reset();}).observe(document.querySelector('#shop'),{subtree:true,attributes:true,attributeFilter:['open']});
  pose();
})();
