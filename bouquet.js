'use strict';
(() => {
  const button=document.getElementById('touch-bouquet'),art=document.getElementById('bouquet-art'),pref=matchMedia('(prefers-reduced-motion: reduce)');
  const parts=[...art.querySelectorAll('.bouquet-part')].map((el,i)=>({el,angle:0,velocity:0,stiffness:[70,108,83][i],damping:[6.8,7.4,6.3][i],impulse:[42,31,37][i]}));
  const vase=document.getElementById('change-bouquet'),message=document.getElementById('bouquet-message');
  const choices=[{id:'original',name:'小白花',detail:'清清淡淡'},{id:'tulips',name:'粉色郁金香',detail:'温柔一束'},{id:'daisies',name:'暖黄小雏菊',detail:'一点晴天'}];
  const sheet=document.getElementById('bouquet-settings'),grid=document.getElementById('bouquet-choices');
  grid.innerHTML=choices.map(c=>'<button class="music-record bouquet-choice" data-bouquet-choice="'+c.id+'" aria-label="'+c.name+'" aria-pressed="false">'+(c.id==='original'?'<span class="bouquet-thumbnail bouquet-thumbnail-original" aria-hidden="true"></span>':'<span class="bouquet-thumbnail"><img src="assets/scene/bouquet-'+c.id+'-v0624.png" alt="" draggable="false" loading="lazy"></span>')+'<strong>'+c.name+'</strong><small>'+c.detail+'</small></button>').join('');
  const key='paperbook-bouquet-v1',loaded=new Map();
  let current='original',desired=current,revision=0;
  function renderChoices(){
    for(const card of grid.children){const id=card.dataset.bouquetChoice,choice=choices.find(c=>c.id===id),pending=desired!==current&&id===desired;card.setAttribute('aria-pressed',String(id===current));card.classList.toggle('is-preparing',pending);card.querySelector('small').textContent=(pending?'准备中 · ':id===current?'正在摆 · ':'')+choice.detail;}
  }
  function prepare(id){
    if(id==='original')return Promise.resolve();
    if(!loaded.has(id)){
      const img=new Image();img.src='assets/scene/bouquet-'+id+'-v0624.png';
      loaded.set(id,img.decode().then(()=>Promise.all([...art.querySelectorAll('image[data-bouquet-layer="'+id+'"]')].map(source=>new Promise((resolve,reject)=>{
        const clear=()=>{source.removeEventListener('load',ready);source.removeEventListener('error',failed);};
        function ready(){clear();requestAnimationFrame(()=>resolve());}
        function failed(){clear();source.removeAttribute('href');reject(new Error('Bouquet sprite unavailable'));}
        source.addEventListener('load',ready);source.addEventListener('error',failed);source.setAttribute('href',img.src);
      })))).catch(error=>{loaded.delete(id);throw error;}));
    }
    return loaded.get(id);
  }
  function render(id,initial=false){
    art.classList.toggle('is-initializing',initial);
    for(const layer of art.querySelectorAll('.bouquet-layer'))layer.style.opacity=layer.dataset.bouquetLayer===id?'1':'0';
    current=desired=id;art.dataset.bouquet=id;
    const name=choices.find(c=>c.id===id).name;vase.setAttribute('aria-label','花瓶，挑一束花，当前：'+name);button.setAttribute('aria-label','花束，挑一束花，当前：'+name);renderChoices();
    const thumbnail=grid.querySelector('[data-bouquet-choice="'+id+'"] img');if(thumbnail&&thumbnail.complete&&!thumbnail.naturalWidth)thumbnail.src=thumbnail.getAttribute('src');
    if(initial)requestAnimationFrame(()=>requestAnimationFrame(()=>art.classList.remove('is-initializing')));
  }
  async function change(id){
    if(document.body.dataset.phase!=='idle'||!sheet.open||!choices.some(c=>c.id===id))return;
    const request=++revision;desired=id;
    if(id===current){vase.removeAttribute('aria-busy');renderChoices();message.textContent='正在摆着'+choices.find(c=>c.id===id).name+'。';return;}
    vase.setAttribute('aria-busy','true');renderChoices();message.textContent='花束轻轻准备中……';
    try{
      await prepare(id);if(request!==revision)return;
      render(id);try{localStorage.setItem(key,id);}catch{}
      message.textContent='换成了'+choices.find(c=>c.id===id).name;vase.title='挑一束花';sway();
    }catch{
      if(request===revision){desired=current;renderChoices();message.textContent='这束花暂时没准备好，再点一次这束花试试。';}
    }finally{if(request===revision)vase.removeAttribute('aria-busy');}
  }
  function cancelChange(){revision++;desired=current;vase.removeAttribute('aria-busy');renderChoices();}
  grid.addEventListener('click',event=>{const card=event.target.closest('[data-bouquet-choice]');if(card)change(card.dataset.bouquetChoice);});
  sheet.addEventListener('sheetopened',()=>{renderChoices();message.textContent='挑一束花，陪你慢慢翻书。';});
  sheet.addEventListener('close',cancelChange);
  renderChoices();
  let frame=0,last=0;
  function reset(){cancelAnimationFrame(frame);frame=0;last=0;art.dataset.motion='rest';for(const p of parts){p.angle=0;p.velocity=0;p.el.setAttribute('transform','rotate(0 79 110)');}}
  function tick(now){
    const dt=Math.min(.024,(now-last)/1000);last=now;let moving=false;
    for(const p of parts){p.velocity+=(-p.stiffness*p.angle-p.damping*p.velocity)*dt;p.angle+=p.velocity*dt;p.el.setAttribute('transform',`rotate(${p.angle.toFixed(4)} 79 110)`);if(Math.abs(p.angle)>.025||Math.abs(p.velocity)>.08)moving=true;}
    if(moving){frame=requestAnimationFrame(tick);}else reset();
  }
  function sway(direction=1){
    if(document.body.dataset.phase!=='idle'||document.hidden||pref.matches)return;
    for(const p of parts)p.velocity=Math.max(-65,Math.min(65,p.velocity+direction*p.impulse));
    art.dataset.motion='swaying';if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}
  }
  function direction(event){const r=button.getBoundingClientRect();return event.clientX<r.x+r.width/2?1:-1;}
  button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&event.buttons===0)sway(direction(event));});
  let gesture=null,ignoreClickUntil=0;
  button.addEventListener('pointerdown',event=>{if(event.isPrimary&&event.button===0){gesture={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};ignoreClickUntil=0;sway(direction(event));}},{passive:true});
  button.addEventListener('pointermove',event=>{if(gesture?.id===event.pointerId&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>6)gesture.moved=true;},{passive:true});
  button.addEventListener('pointerup',()=>{if(gesture?.moved)ignoreClickUntil=performance.now()+350;gesture=null;},{passive:true});
  button.addEventListener('pointercancel',()=>{gesture=null;ignoreClickUntil=performance.now()+350;},{passive:true});
  // Guard before the shared sheet opener; scrolling must not become a selection.
  button.addEventListener('click',event=>{if(event.detail>0&&(gesture?.moved||performance.now()<ignoreClickUntil)){event.preventDefault();event.stopImmediatePropagation();return;}if(event.detail===0)sway();},{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  pref.addEventListener('change',()=>{if(pref.matches)reset();});
  new MutationObserver(()=>{if(document.body.dataset.phase!=='idle'){reset();cancelChange();}}).observe(document.body,{attributes:true,attributeFilter:['data-phase']});
  reset();
  try{
    const saved=localStorage.getItem(key);
    if(choices.some(c=>c.id===saved)&&saved!=='original'){
      const request=++revision;prepare(saved).then(()=>{if(request===revision)render(saved,true);}).catch(()=>{});
    }
  }catch{}
})();
