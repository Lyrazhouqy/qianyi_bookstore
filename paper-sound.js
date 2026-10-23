'use strict';
// Paper friction, without downloads or coupling to the gramophone's media clock.
window.BookPaperSound = (() => {
  const key='paperbook-paper-sound-v1';
  const profiles={
    pickup:[.24,780,.23,.16], cover:[.34,1100,.22,.1],
    page:[.32,2100,.29,.015], unfold:[.39,2600,.23,.008],
    paper:[.23,2400,.23,.008], tuck:[.22,1700,.19,.035], place:[.16,650,.14,.22]
  };
  let enabled=true,context,master,epoch=0,resuming=null;
  const voices=new Set(),buffers=new Map(),last=new Map();
  try{enabled=localStorage.getItem(key)!=='off';}catch{}
  const button=document.createElement('button');button.id='paper-sound-toggle';button.className='paper-sound-toggle';button.type='button';button.setAttribute('aria-label','翻书纸声');button.setAttribute('aria-pressed',String(enabled));
  const row=document.createElement('div');row.className='paper-sound-setting';
  row.innerHTML='<span>翻书纸声<small>拿起书，听纸页轻响</small></span>';row.appendChild(button);
  document.querySelector('#music-settings')?.appendChild(row);
  function paint(){button.textContent=enabled?'开着':'关了';button.setAttribute('aria-pressed',String(enabled));}
  function stop(){epoch++;for(const voice of [...voices]){try{voice.stop();voice.disconnect();}catch{}}voices.clear();last.clear();}
  function unlock(event){
    if(!enabled||document.hidden||!event.isTrusted)return;
    if(event.type==='keydown'&&!['Enter',' ','Escape','ArrowLeft','ArrowRight'].includes(event.key))return;
    try{
      if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=new Audio();master=context.createGain();master.gain.value=.6;master.connect(context.destination);}
      if(context.state!=='running'&&!resuming){resuming=Promise.resolve(context.resume()).catch(()=>{}).finally(()=>{resuming=null;});}
    }catch{/* Sound never holds up a book or a saved draft. */}
  }
  // Coloured noise in several irregular brush strokes; no sharp oscillator/beep.
  function bufferFor(kind){
    if(buffers.has(kind))return buffers.get(kind);
    const [duration,cutoff,level,contact]=profiles[kind],rate=context.sampleRate;
    const buffer=context.createBuffer(1,Math.ceil(rate*duration),rate),out=buffer.getChannelData(0);
    let seed=kind.split('').reduce((n,c)=>n*31+c.charCodeAt(0),17)>>>0,low=0,slow=0,body=0;
    const alpha=1-Math.exp(-2*Math.PI*cutoff/rate),bass=1-Math.exp(-2*Math.PI*170/rate);
    for(let i=0;i<out.length;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1,t=i/rate,u=t/duration;
      low+=alpha*(noise-low);slow+=.018*(low-slow);body+=bass*(noise-body);
      const envelope=Math.pow(Math.sin(Math.PI*u),1.6);
      const brush=.3+.7*Math.pow(Math.sin(u*Math.PI*3.3+.4),2);
      const grain=(low-slow)*level*envelope*brush;
      const landing=body*contact*Math.min(1,t/.009)*Math.exp(-t/ .035)*3;
      out[i]=grain+landing;
    }
    buffers.set(kind,buffer);return buffer;
  }
  function play(kind){
    if(!profiles[kind]||!enabled||document.hidden||!context)return;
    const requested=performance.now(),ticket=epoch;
    function start(){
      // Never queue an old action behind permission prompts, tab changes or mute.
      if(!enabled||document.hidden||ticket!==epoch||context.state!=='running'||performance.now()-requested>120)return;
      const now=performance.now();if(now-(last.get(kind)??-Infinity)<75)return;last.set(kind,now);
      try{
        if(voices.size>=3){const oldest=voices.values().next().value;oldest.stop();oldest.disconnect();voices.delete(oldest);}
        const voice=context.createBufferSource();voice.buffer=bufferFor(kind);voice.playbackRate.value=.96+Math.random()*.08;
        voice.connect(master);voices.add(voice);voice.onended=()=>{voices.delete(voice);voice.disconnect();};voice.start();
      }catch{}
    }
    if(context.state==='running')start();
    else if(resuming)resuming.then(start).catch(()=>{});
  }
  button.addEventListener('click',event=>{enabled=!enabled;paint();try{localStorage.setItem(key,enabled?'on':'off');}catch{}if(!enabled)stop();else unlock(event);});
  document.addEventListener('pointerdown',unlock,true);
  document.addEventListener('click',unlock,true); // Keyboard/assistive activation.
  document.addEventListener('keydown',unlock,true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();try{context?.suspend().catch(()=>{});}catch{}}});
  window.addEventListener('pagehide',stop);paint();
  return Object.freeze({play});
})();
