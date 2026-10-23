'use strict';
(() => {
  const world=document.querySelector('.room-world'),art=world?.querySelector('.room-art');
  if(!art)return;
  const button=document.createElement('button');
  button.type='button';button.id='shop-globe';button.className='shop-globe';
  button.setAttribute('aria-label','鼠标悬浮转动；触屏轻点转一会儿，按住持续转动');
  button.dataset.motion='still';
  const canvas=document.createElement('canvas');canvas.width=216;canvas.height=210;canvas.setAttribute('aria-hidden','true');
  button.append(canvas);art.after(button);
  const ctx=canvas.getContext('2d'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  if(!ctx)return;
  let source,output,points=[],held=null,frame=0,last=0,paintedAt=0,angle=0,speed=0,visible=true,autoUntil=0,suppressClickUntil=0,hovered=false;
  const mouseHover=event=>event.pointerType==='mouse'&&matchMedia('(any-hover: hover)').matches;
  // Axis follows the existing spindle: upper-right pin (782,478) to lower-left
  // bearing (722,588). Rotate sphere coordinates, never the element or its rim.
  const ax=60/Math.hypot(60,110),ay=110/Math.hypot(60,110),turnSpeed=2*Math.PI/18;
  const mapWidth=720,mapHeight=360;
  function paint(){
    const offset=angle/(2*Math.PI)*mapWidth,target=output.data;
    for(const p of points){
      const u=((p.u+offset)%mapWidth+mapWidth)%mapWidth;
      const ix=Math.floor(u),fx=u-ix,a=(p.row*mapWidth+ix)*4,b=(p.row*mapWidth+(ix+1)%mapWidth)*4,d=a+mapWidth*4,e=b+mapWidth*4;
      for(let channel=0;channel<3;channel++)target[p.i+channel]=((source[a+channel]*(1-fx)+source[b+channel]*fx)*(1-p.fy)+(source[d+channel]*(1-fx)+source[e+channel]*fx)*p.fy)*p.light;
      target[p.i+3]=p.alpha;
    }
    ctx.putImageData(output,0,0);
    button.dataset.angle=angle.toFixed(5);
  }
  function stop(){
    const previous=held;held=null;autoUntil=0;
    if(previous?.id!==undefined&&button.hasPointerCapture(previous.id))button.releasePointerCapture(previous.id);
  }
  function hardStop(){hovered=false;stop();cancelAnimationFrame(frame);frame=0;last=0;speed=0;button.dataset.motion='still';}
  function tick(now){
    frame=0;
    if(document.hidden||!visible||motion.matches||document.body.dataset.phase!=='idle'){hardStop();return;}
    const dt=Math.min(.05,(now-last)/1000);last=now;
    const driving=hovered||!!held||now<autoUntil;
    speed+=(driving?1:-1)*dt/(driving ? .25 : .32);speed=Math.max(0,Math.min(1,speed));
    angle=(angle+turnSpeed*speed*dt)%(Math.PI*2);
    if(now-paintedAt>=1000/24){paint();paintedAt=now;}
    if(driving||speed>0){button.dataset.motion=driving?'turning':'settling';frame=requestAnimationFrame(tick);}
    else{paint();button.dataset.motion='still';}
  }
  function start(){if(!source||motion.matches||document.hidden||!visible||document.body.dataset.phase!=='idle')return false;if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}return true;}
  // A tap refreshes a single short spin; repeated taps never queue animations.
  function pulse(){if(start())autoUntil=performance.now()+8000;}
  button.addEventListener('pointerenter',event=>{if(mouseHover(event)){hovered=true;autoUntil=0;start();}});
  button.addEventListener('pointerleave',event=>{if(mouseHover(event)){hovered=false;autoUntil=0;}});
  button.addEventListener('pointerdown',event=>{
    if(mouseHover(event)){event.stopPropagation();suppressClickUntil=performance.now()+450;return;}
    if(event.button!==0||!event.isPrimary||held||!start())return;
    event.stopPropagation();autoUntil=0;suppressClickUntil=performance.now()+450;held={id:event.pointerId,x:event.clientX,y:event.clientY,at:performance.now()};button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove',event=>{if(held?.id===event.pointerId&&Math.hypot(event.clientX-held.x,event.clientY-held.y)>9)stop();});
  button.addEventListener('pointerup',event=>{if(held?.id!==event.pointerId)return;const tap=performance.now()-held.at<=280&&Math.hypot(event.clientX-held.x,event.clientY-held.y)<=9;stop();suppressClickUntil=performance.now()+450;if(tap)pulse();});
  for(const name of ['pointercancel','lostpointercapture'])button.addEventListener(name,event=>{if(held?.id===event.pointerId)stop();});
  button.addEventListener('keydown',event=>{if(![' ','Enter'].includes(event.key))return;event.preventDefault();if(!held&&start()){autoUntil=0;held={key:event.key,at:performance.now()};}});
  button.addEventListener('keyup',event=>{if(held?.key===event.key){event.preventDefault();const tap=performance.now()-held.at<=280;stop();suppressClickUntil=performance.now()+450;if(tap)pulse();}});
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(event.detail===0&&performance.now()>suppressClickUntil)pulse();});
  button.addEventListener('contextmenu',event=>event.preventDefault());button.addEventListener('blur',stop);
  window.addEventListener('blur',hardStop);document.addEventListener('visibilitychange',()=>{if(document.hidden)hardStop();});motion.addEventListener('change',hardStop);
  new MutationObserver(()=>{if(document.body.dataset.phase!=='idle')hardStop();}).observe(document.body,{attributes:true,attributeFilter:['data-phase']});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)hardStop();},{root:document.getElementById('room-viewport')}).observe(button);
  Promise.all([art.decode(),fetch('assets/scene/globe-land-natural-earth-110m.json').then(response=>{if(!response.ok)throw new Error('Map unavailable');return response.json();})]).then(([,land])=>{
    const sample=document.createElement('canvas');sample.width=mapWidth;sample.height=mapHeight;
    const sampling=sample.getContext('2d',{willReadFrequently:true});
    sampling.fillStyle='#78b7bf';sampling.fillRect(0,0,mapWidth,mapHeight);
    sampling.fillStyle='#b4c18c';sampling.strokeStyle='#9fad7e';sampling.lineWidth=.65;sampling.lineJoin='round';
    // Use actual longitude/latitude coastline rings, without national borders.
    for(const polygon of land.coordinates){
      sampling.beginPath();
      for(const ring of polygon){ring.forEach(([longitude,latitude],i)=>{const x=(longitude+180)/360*mapWidth,y=(90-latitude)/180*mapHeight;i?sampling.lineTo(x,y):sampling.moveTo(x,y);});sampling.closePath();}
      sampling.fill('evenodd');sampling.stroke();
    }
    source=sampling.getImageData(0,0,mapWidth,mapHeight).data;output=ctx.createImageData(216,210);
    for(let y=0;y<210;y++)for(let x=0;x<216;x++){
      const nx=((x+.5)/2-53.5)/52.5,ny=-((y+.5)/2-52.5)/51.5,r=Math.hypot(nx,ny);
      if(r>=1)continue;
      const z=Math.sqrt(1-r*r),north=Math.max(-1,Math.min(1,ax*nx+ay*ny)),east=ay*nx-ax*ny;
      const u=(Math.atan2(east,z)+Math.PI+35*Math.PI/180)/(2*Math.PI)*mapWidth,v=Math.min(mapHeight-1.001,Math.acos(north)/Math.PI*(mapHeight-1));
      points.push({u,row:Math.floor(v),fy:v-Math.floor(v),i:(y*216+x)*4,light:.88+.12*z+.035*(ny-nx),alpha:Math.round(Math.min(1,(1-r)*70)*255)});
    }
    paint();button.dataset.map='natural-earth-110m';button.dataset.ready='true';if(hovered)start();
  }).catch(()=>{button.remove();});
})();
