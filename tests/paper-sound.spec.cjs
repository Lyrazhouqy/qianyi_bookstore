const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function instrument(page,{unsupported=false,reject=false,storage=false}={}){
 await page.addInitScript(({unsupported,reject,storage})=>{
  window.soundProbe={contexts:0,starts:[],active:0,max:0,energy:0,resumes:0};
  if(storage){Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};}
  if(unsupported){window.AudioContext=undefined;window.webkitAudioContext=undefined;return;}
  const Native=window.AudioContext||window.webkitAudioContext;
  window.AudioContext=class extends Native{
   constructor(...args){super(...args);soundProbe.contexts++;window.soundContext=this;
    const analyser=this.createAnalyser();analyser.fftSize=256;analyser.connect(this.destination);this.probe=analyser;
    const sample=()=>{const d=new Float32Array(256);analyser.getFloatTimeDomainData(d);soundProbe.energy=Math.max(soundProbe.energy,...d.map(Math.abs));requestAnimationFrame(sample);};sample();
   }
   get state(){return reject&&soundProbe.resumes<2?'suspended':super.state;}
   resume(){soundProbe.resumes++;if(reject&&soundProbe.resumes===1)return Promise.reject(Error('test gesture denial'));return super.resume();}
   createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source),stop=source.stop.bind(source),connect=source.connect.bind(source);let active=false;const end=()=>{if(active){active=false;soundProbe.active--;}};source.stop=(...args)=>{end();return stop(...args);};
    source.connect=(destination,...rest)=>{connect(this.probe);return connect(destination,...rest);};
    source.start=(...args)=>{const data=source.buffer.getChannelData(0);soundProbe.starts.push({length:data.length,rate:source.buffer.sampleRate,peak:Math.max(...data.map(Math.abs)),samples:Array.from(data)});active=true;soundProbe.active++;soundProbe.max=Math.max(soundProbe.max,soundProbe.active);source.addEventListener('ended',end,{once:true});return start(...args);};return source;
   }
  };
 },{unsupported,reject,storage});
}
async function fixture(page,options={}){
 await instrument(page,options);await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/stories.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BookAuthoredStories={items:[],get:()=>null,seed:()=>({})};'}));
 await page.route('**/real-materials.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BookRealMaterials=()=>({});'}));
 await page.addInitScript(()=>{try{if(localStorage.getItem('sound-fixture'))return;localStorage.setItem('sound-fixture','yes');localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{naval:[{id:'sound-a',author:'N',kind:'stack',front:'隔离测试：第一页',replies:[]},{id:'sound-b',author:'M',kind:'stack',front:'隔离测试：第二页',replies:[]}]}}));}catch{}});
 await page.goto('/?playtest=rhythm');
}
async function book(page){await page.locator('.spine[data-id="naval"]').tap();await step(page,'held');await page.locator('.sid-cover').tap();await step(page,'open');}
async function settings(page){await page.locator('#open-music').scrollIntoViewIfNeeded();await page.locator('#open-music').tap();await expect(page.locator('#paper-sound-toggle')).toBeInViewport();}
const count=page=>page.evaluate(()=>soundProbe.starts.length);
test('real Web Audio renders paper; guarded book and note actions sound once, BGM keeps playing',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
 expect(await page.evaluate(()=>soundProbe.contexts)).toBe(0);expect(await count(page)).toBe(0);
 await book(page);expect(await count(page)).toBe(2);
 await page.locator('.sid-letter-pick').tap();await step(page,'letter');expect(await count(page)).toBe(3);
 await page.locator('.sid-paper-return').tap();await step(page,'open');expect(await count(page)).toBe(4);
 // Let the previous physical action finish sounding, then exercise a rapid duplicate request.
 await page.waitForTimeout(120);await page.evaluate(()=>{const e=document.querySelector('.sid-page-next');e.click();e.click();e.click();});await step(page,'open');expect(await count(page)).toBe(5);
 await page.waitForFunction(()=>soundProbe.energy>.0001);
 const probe=await page.evaluate(()=>({energy:soundProbe.energy,max:soundProbe.max,starts:soundProbe.starts.map(({samples,...rest})=>rest)}));expect(probe.max).toBeLessThanOrEqual(3);expect(probe.starts.every(x=>x.peak>0&&x.peak<.5)).toBe(true);
 await info.attach('actual-audio-signal.json',{body:JSON.stringify(probe,null,2),contentType:'application/json'});
 const audio=page.locator('[data-bookshop-music]').last();await expect.poll(()=>audio.evaluate(a=>a.paused)).toBe(false);const before=await audio.evaluate(a=>a.currentTime);
 await page.waitForTimeout(130);await page.locator('.sid-page-next').tap();await step(page,'open');await page.waitForTimeout(200);expect(await audio.evaluate(a=>a.currentTime)).toBeGreaterThan(before+.1);
 await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');expect(errors).toEqual([]);
 await settings(page);await page.screenshot({path:info.outputPath('paper-sound-setting.png')});
 // Export the actual synthesized page buffer as a playable reference (not a listening verdict).
 const sample=await page.evaluate(()=>soundProbe.starts[4]);const pcm=Buffer.alloc(sample.samples.length*2);sample.samples.forEach((v,i)=>pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v*.6))*32767),i*2));const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(sample.rate,24);header.writeUInt32LE(sample.rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);await info.attach('page-sound.wav',{body:Buffer.concat([header,pcm]),contentType:'audio/wav'});
});
test('independent paper mute persists, stops live voices, and fits the music sheet',async({page})=>{
 await fixture(page);await settings(page);const toggle=page.locator('#paper-sound-toggle');await expect(toggle).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>BookPaperSound.play('unfold'));await toggle.tap();await expect(toggle).toHaveAttribute('aria-pressed','false');await expect.poll(()=>page.evaluate(()=>soundProbe.active)).toBe(0);
 const before=await count(page);await page.getByRole('button',{name:'收起唱片纸页'}).tap();await book(page);await page.locator('.sid-page-next').tap();await step(page,'open');expect(await count(page)).toBe(before);
 await page.reload();expect(await page.evaluate(()=>soundProbe.contexts)).toBe(0);await settings(page);await expect(toggle).toHaveAttribute('aria-pressed','false');await toggle.tap();await expect(toggle).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'收起唱片纸页'}).tap();await book(page);expect(await count(page)).toBe(2);
});
test('failed resume is retried by the next gesture without a delayed action',async({page})=>{
 await fixture(page,{reject:true});await book(page);expect(await page.evaluate(()=>soundProbe.resumes)).toBeGreaterThanOrEqual(2);expect(await count(page)).toBeGreaterThanOrEqual(1);
 await page.locator('.sid-page-next').tap();await step(page,'open');
});
test('missing Web Audio API is a silent fallback',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page,{unsupported:true});await book(page);await page.locator('.sid-letter-pick').tap();await step(page,'letter');expect(await count(page)).toBe(0);expect(errors).toEqual([]);});

test('storage denial preserves book controls and in-memory paper mute',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page,{storage:true});await settings(page);await page.locator('#paper-sound-toggle').tap();await page.getByRole('button',{name:'收起唱片纸页'}).tap();await book(page);expect(await count(page)).toBe(0);expect(errors).toEqual([]);});

test('background cancels sound, next trusted gesture resumes without replay; burst stays bounded',async({page})=>{await fixture(page);await book(page);await page.evaluate(()=>{for(const kind of ['page','unfold','paper','tuck','place'])BookPaperSound.play(kind);});expect(await page.evaluate(()=>soundProbe.max)).toBeLessThanOrEqual(3);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));BookPaperSound.play('page');});await expect.poll(()=>page.evaluate(()=>soundProbe.active)).toBe(0);const before=await count(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));BookPaperSound.play('page');});await page.waitForTimeout(160);expect(await count(page)).toBe(before);await page.locator('.sid-page-next').tap();await step(page,'open');expect(await count(page)).toBe(before+1);});

test('cancelled corner drag stays quiet; a completed drag makes one page sound',async({page})=>{
 await fixture(page);await book(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(400);
 const corner=page.locator('.sid-page-next'),r=await corner.boundingBox(),x=r.x+r.width*.72,y=r.y+r.height*.72,before=await count(page),target=await corner.getAttribute('data-paper-id');
 await page.mouse.move(x,y);await page.mouse.down();await step(page,'page-drag');await page.mouse.move(x-8,y,{steps:3});await page.waitForTimeout(150);await page.mouse.up();await step(page,'open');expect(await count(page)).toBe(before);expect(await corner.getAttribute('data-paper-id')).toBe(target);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const nextBox=await corner.boundingBox(),nx=nextBox.x+nextBox.width*.72,ny=nextBox.y+nextBox.height*.72;await page.mouse.move(nx,ny);await page.mouse.down();await step(page,'page-drag');await page.mouse.move(nx-135,ny-8,{steps:9});await page.mouse.up();await step(page,'open');expect(await count(page)).toBe(before+1);expect(await corner.getAttribute('data-paper-id')).not.toBe(target);
});
test('keyboard can mute the paper sound without pausing the record',async({page})=>{
 await fixture(page);await settings(page);const toggle=page.locator('#paper-sound-toggle');await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-pressed','false');await expect(page.locator('html')).toHaveAttribute('data-music-state','playing');await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Escape');await book(page);expect(await count(page)).toBe(2);
});
