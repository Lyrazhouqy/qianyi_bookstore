'use strict';
(() => {
  const button=document.getElementById('touch-bouquet'),art=document.getElementById('bouquet-art'),pref=matchMedia('(prefers-reduced-motion: reduce)');
  const parts=[...art.querySelectorAll('.bouquet-part')].map((el,i)=>({el,angle:0,velocity:0,stiffness:[70,108,83][i],damping:[6.8,7.4,6.3][i],impulse:[42,31,37][i]}));
  const vase=document.getElementById('change-bouquet'),message=document.getElementById('bouquet-message');
  const choices=[{id:'original',name:'小白花'},{id:'tulips',name:'粉色郁金香'},{id:'daisies',name:'暖黄小雏菊'}];
  const key='paperbook-bouquet-v1',loaded=new Map();
  let current='original',desired=current,revision=0;
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
    vase.setAttribute('aria-label','换一束花，当前：'+choices.find(c=>c.id===id).name);
    if(initial)requestAnimationFrame(()=>requestAnimationFrame(()=>art.classList.remove('is-initializing')));
  }
  async function change(){
    if(document.body.dataset.phase!=='idle')return;
    const id=choices[(choices.findIndex(c=>c.id===desired)+1)%choices.length].id,request=++revision;
    desired=id;vase.setAttribute('aria-busy','true');message.textContent='';
    try{
      await prepare(id);if(request!==revision)return;
      render(id);try{localStorage.setItem(key,id);}catch{}
      message.textContent='换成了'+choices.find(c=>c.id===id).name;vase.title='换一束花';sway();
    }catch{
      if(request===revision){desired=current;message.textContent='这束花暂时没准备好，轻点花瓶再试一次。';vase.title='轻点重试换花';}
    }finally{if(request===revision)vase.removeAttribute('aria-busy');}
  }
  function cancelChange(){revision++;desired=current;vase.removeAttribute('aria-busy');}
  vase.addEventListener('click',event=>{event.stopPropagation();change();});
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
  button.addEventListener('pointerdown',event=>{event.stopPropagation();if(event.isPrimary&&event.button===0)sway(direction(event));});
  button.addEventListener('click',event=>{event.stopPropagation();if(event.detail===0)sway();});
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
