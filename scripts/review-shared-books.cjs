const {chromium,webkit}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='evidence/bookshop-v062/';let browser;
(async()=>{
 const views=[];
 browser=await webkit.launch();
 for(const [width,height] of [[320,568],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('paperbook-v3',JSON.stringify({visits:0,mode:'dense',replies:[],found:[],seen:[]})));
  const p=await context.newPage();await p.goto('http://127.0.0.1:4173/?v=0.6.2');await p.evaluate(()=>document.fonts.ready);
  for(const id of ['ship','prince','stranger','siddhartha','garden','night','kafka','letters','other']){
   await p.locator('.spine[data-id="'+id+'"]').tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='held');await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const geometry=await p.evaluate(()=>{
    const title=document.querySelector('.sid-cover-title'),front=document.querySelector('.sid-cover-front'),range=document.createRange();range.selectNodeContents(title);
    return {title:title.textContent,text:range.getBoundingClientRect().toJSON(),cover:front.getBoundingClientRect().toJSON()};
   });
   assert(geometry.text.y>=geometry.cover.y-1,geometry.title+' cover title top');assert(geometry.text.bottom<=geometry.cover.bottom+1,geometry.title+' cover title bottom');
   if(width===390&&['ship','kafka'].includes(id))await p.screenshot({path:dir+id+'-held-'+width+'.png'});
   await p.locator('.sid-cover').tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='open');await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const {page,heading}=await p.evaluate(()=>({page:document.querySelector('.sid-page').getBoundingClientRect().toJSON(),heading:document.querySelector('.sid-page h2').getBoundingClientRect().toJSON()}));assert(heading.x+heading.width<=page.x+page.width+1,JSON.stringify({title:geometry.title,width,page,heading}));
   if(['ship','kafka'].includes(id))await p.screenshot({path:dir+id+'-open-'+width+'.png'});
   if(await p.locator('.sid-letter-pick').isVisible()){
    await p.locator('.sid-letter-pick').tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='letter');await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    if(id!=='siddhartha')assert.equal(await p.locator('.sid-pen').count(),0);
    if(width===390&&['ship','kafka'].includes(id))await p.screenshot({path:dir+id+'-clue-'+width+'.png'});
   }
   views.push({width,height,id,...geometry});await p.locator('.sid-return').tap();await p.waitForFunction(()=>document.body.dataset.phase==='idle');
  }
  await context.close();
 }
 // Capture deliverable views with normal motion, after the compositor has painted the final pose.
 const normal=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:1});
 await normal.addInitScript(()=>localStorage.setItem('paperbook-v3',JSON.stringify({visits:0,mode:'dense',replies:[],found:[],seen:[]})));
 const visual=await normal.newPage();await visual.goto('http://127.0.0.1:4173/?v=0.6.2');await visual.evaluate(()=>document.fonts.ready);
 for(const id of ['ship','kafka']){
  for(const [action,state,label] of [['.spine[data-id="'+id+'"]','held','held'],['.sid-cover','open','open'],['.sid-letter-pick','letter','clue']]){
   await visual.locator(action).tap();await visual.waitForFunction(s=>document.querySelector('.siddhartha-room').dataset.step===s,state);
   await visual.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await visual.screenshot({path:dir+id+'-'+label+'-390.png'});
  }
  await visual.locator('.sid-return').tap();await visual.waitForFunction(()=>document.body.dataset.phase==='idle');
 }
 await normal.close();
 await browser.close();fs.writeFileSync(dir+'shared-visual.json',JSON.stringify(views,null,2)+'\n');
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 await context.addInitScript(()=>localStorage.setItem('paperbook-v3',JSON.stringify({visits:0,mode:'dense',replies:[],found:[],seen:[]})));
 const p=await context.newPage();await p.goto('http://127.0.0.1:4173/?v=0.6.2');const cdp=await context.newCDPSession(p),wait=s=>p.waitForFunction(s=>document.querySelector('.siddhartha-room').dataset.step===s,s);
 async function swipe(x,y,toX,toY,pause=0){const point=(x,y)=>({id:1,x,y,radiusX:8,radiusY:8,force:1});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(x,y)]});for(let i=1;i<=14;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(x+(toX-x)*i/14,y+(toY-y)*i/14)]});await p.waitForTimeout(16);}if(pause)await p.waitForTimeout(pause);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await p.locator('.spine[data-id="ship"]').tap();await wait('held');let r=await p.locator('.sid-cover').boundingBox();
 await swipe(r.x+r.width*.85,r.y+r.height*.45,r.x+r.width*.77,r.y+r.height*.45,180);await wait('held');
 await swipe(r.x+r.width*.85,r.y+r.height*.45,r.x+r.width*.05,r.y+r.height*.45);await wait('open');
 const original=await p.locator('.sid-letter').boundingBox();r=await p.locator('.sid-letter-pick').boundingBox();await swipe(r.x+r.width/2,r.y+r.height/2,r.x+r.width/2,r.y-110);await wait('packet');await p.locator('.sid-letter-pick').tap();await wait('letter');
 assert.equal(await p.locator('.sid-pen').count(),0);assert((await p.locator('.sid-segment').innerText()).includes('另一朵玫瑰'));assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).rose));
 await p.locator('[data-sid="put"]').tap();await wait('open');const returned=await p.locator('.sid-letter').boundingBox();for(const key of ['x','y','width','height'])assert(Math.abs(returned[key]-original[key])<1);
 r=await p.locator('.sid-cover').boundingBox();await swipe(r.x+r.width*.2,r.y+r.height*.45,r.x+r.width*1.1,r.y+r.height*.45);await wait('held');await p.locator('.sid-return').tap();await p.waitForFunction(()=>document.body.dataset.phase==='idle');
 fs.writeFileSync(dir+'native-touch.json',JSON.stringify({passed:true,input:'Chromium native emulated touch; not physical iPhone',book:'ship',flows:['short drag rebounds','swipe cover open','drag clue from page','unfold own rose clue','clue persists','fold to exact dock','swipe cover shut','return to source shelf']},null,2)+'\n');
 await browser.close();console.log('27 book/viewport visual checks and native non-Siddhartha touch flow passed.');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
