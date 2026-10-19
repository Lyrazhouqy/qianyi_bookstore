'use strict';
(() => {
  const records=[
    ['water-sound','小水声','水珠轻响'],['slow-coffee','慢咖啡','咖啡慢晃'],['star-lamp','星星灯','小灯亮着'],['spacing-out','放空中','云在旁边'],['tap-wood','敲木头','木块轻敲'],['wind-passing','风吹过','窗帘动了'],['bamboo-leaves','竹叶响','叶子沙沙']
  ];
  const key='paperbook-music-v1',sheet=document.getElementById('music-settings'),grid=document.getElementById('music-records'),toggle=document.getElementById('music-toggle'),status=document.getElementById('music-status'),opener=document.getElementById('open-music');
  let selected=records[0][0],current=null,revision=0,frame=0,started=false,mode='idle',resumePoint=null;
  const voices=new Set();
  try {const saved=JSON.parse(localStorage.getItem(key));if(records.some(r=>r[0]===saved?.track))selected=saved.track;}catch{}
  grid.innerHTML=records.map(([id,title,note])=>'<button class="music-record" data-track="'+id+'" aria-pressed="false"><img src="assets/music/'+id+'.png" alt="" loading="lazy" draggable="false"><strong>'+title+'</strong><small>'+note+'</small></button>').join('');
  const record=()=>records.find(r=>r[0]===selected);
  function render(){
    document.documentElement.dataset.musicState=mode;document.documentElement.dataset.musicTrack=selected;
    for(const button of grid.children){const chosen=button.dataset.track===selected,playing=chosen&&mode==='playing';button.setAttribute('aria-pressed',String(chosen));button.classList.toggle('is-playing',playing);button.querySelector('small').textContent=(playing?'正在放 · ':chosen&&mode==='loading'?'唱针落下 · ':'')+records.find(r=>r[0]===button.dataset.track)[2];}
    const playing=mode==='playing'||mode==='loading';toggle.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');toggle.querySelector('span').textContent=playing?'Ⅱ':'▷';toggle.querySelector('.music-toggle-label').textContent=playing?'停一会儿':started?'继续播放':'放张唱片';
    opener.setAttribute('aria-label','留声机，挑一张唱片');opener.title=mode==='playing'?'正在播放《'+record()[1]+'》':'挑一张唱片';
    status.textContent=mode==='playing'?'《'+record()[1]+'》 · 陪你慢慢翻书':mode==='loading'?'唱针轻轻落下……':mode==='error'?'这张唱片暂时没响，再点一次试试。':mode==='paused'?'唱针歇一会儿。':'挑一张唱片，陪你慢慢翻书。';
  }
  function retire(audio){audio.pause();audio.removeAttribute('src');audio.load();audio.remove();voices.delete(audio);}
  function fade(next,token){
    cancelAnimationFrame(frame);const from=[...voices].map(audio=>[audio,audio.volume]),start=performance.now();
    function tick(now){if(token!==revision)return;const t=Math.min(1,(now-start)/480),ease=t*t*(3-2*t);for(const [audio,volume] of from)audio.volume=audio===next?volume+(.42-volume)*ease:volume*(1-ease);if(t<1)frame=requestAnimationFrame(tick);else for(const [audio] of from)if(audio!==next)retire(audio);}
    frame=requestAnimationFrame(tick);
  }
  function play(id=selected){
    if(id===selected&&current&&!current.paused&&mode==='playing')return;
    const resumeAt=mode==='paused'&&resumePoint?.track===id?resumePoint.time:0;resumePoint=null;
    selected=id;started=true;const token=++revision;cancelAnimationFrame(frame);
    const previous=[...voices].sort((a,b)=>b.volume-a.volume)[0];
    for(const voice of [...voices])if(voice!==previous||voice.paused)retire(voice);
    try{localStorage.setItem(key,JSON.stringify({track:selected}));}catch{}
    const audio=new Audio('assets/music/'+selected+'.mp3');audio.loop=true;audio.preload='auto';audio.volume=0;audio.setAttribute('data-bookshop-music','');document.body.appendChild(audio);voices.add(audio);current=audio;mode='loading';render();
    // play() happens synchronously in the click gesture so iPhone Safari can unlock sound.
    if(resumeAt>0)audio.addEventListener('loadedmetadata',()=>{if(token===revision)try{audio.currentTime=resumeAt;}catch{}},{once:true});
    audio.addEventListener('playing',()=>{if(token!==revision)return;mode='playing';render();fade(audio,token);});
    audio.addEventListener('pause',()=>{if(token===revision&&current===audio)pause();});
    audio.addEventListener('waiting',()=>{if(token===revision&&mode==='playing'){mode='loading';render();}});
    const failed=()=>{if(token!==revision)return;++revision;cancelAnimationFrame(frame);for(const voice of [...voices]){retire(voice);voice.remove();}current=null;mode='error';render();};
    audio.addEventListener('error',failed,{once:true});
    audio.play()?.catch(failed);
    // At most two voices are needed for a switch. Rapid taps retire stale choices.
    for(const voice of [...voices])if(voice!==audio&&voice.paused){retire(voice);voice.remove();}
  }
  function pause(){resumePoint=current?{track:selected,time:current.currentTime}:resumePoint;++revision;cancelAnimationFrame(frame);for(const audio of [...voices]){retire(audio);audio.remove();}current=null;mode='paused';render();}
  sheet.addEventListener('sheetopened',()=>{if(!started)play();});
  grid.addEventListener('click',event=>{const choice=event.target.closest('[data-track]');if(choice)play(choice.dataset.track);});
  toggle.addEventListener('click',()=>mode==='playing'||mode==='loading'?pause():play());
  window.addEventListener('pagehide',pause);render();
})();
