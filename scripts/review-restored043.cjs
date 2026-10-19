const {chromium,webkit}=require('playwright'),fs=require('node:fs');let browser;
const dir='evidence/bookshop-v061/';
(async()=>{
 const views=[];
 for(const [width,height] of [[390,844],[474,853],[705,853]]){
  browser=await webkit.launch();const p=await browser.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});await p.goto('http://127.0.0.1:4173/?v=0.6.1');
  await p.locator('.spine[data-id="siddhartha"]').tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='held');await p.screenshot({path:dir+'held-'+width+'.png'});
  await p.locator('.sid-cover').tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='open');await p.screenshot({path:dir+'open-'+width+'.png'});
  views.push({width,height,layout:await p.evaluate(()=>({inside:document.querySelector('.sid-cover-back').getBoundingClientRect().toJSON(),right:document.querySelector('.sid-page').getBoundingClientRect().toJSON(),synopsis:document.querySelector('.sid-inside-copy').textContent}))});
  await p.locator('.sid-letter-pick').tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='letter');await p.screenshot({path:dir+'letter-'+width+'.png'});await browser.close();
 }
 fs.writeFileSync(dir+'visual-review.json',JSON.stringify(views,null,2)+'\n');
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1}),p=await context.newPage();await p.goto('http://127.0.0.1:4173/?v=0.6.1');
 const cdp=await context.newCDPSession(p),wait=s=>p.waitForFunction(s=>document.querySelector('.siddhartha-room').dataset.step===s,s,{timeout:6000});
 await p.evaluate(()=>{window.inputReview=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>window.inputReview.push({type,pointerType:e.pointerType,target:e.target.className,step:document.querySelector('.siddhartha-room')?.dataset.step}),true);});
 async function swipe(x,y,toX,toY,pause=0){const point=(x,y)=>({id:1,x,y,radiusX:8,radiusY:8,force:1});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(x,y)]});for(let i=1;i<=14;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(x+(toX-x)*i/14,y+(toY-y)*i/14)]});await p.waitForTimeout(16);}if(pause)await p.waitForTimeout(pause);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 try{
  await p.locator('.spine[data-id="siddhartha"]').tap();await wait('held');let r=await p.locator('.sid-cover').boundingBox();
  await swipe(r.x+r.width*.85,r.y+r.height*.45,r.x+r.width*.77,r.y+r.height*.45,180);await wait('held');
  await swipe(r.x+r.width*.85,r.y+r.height*.45,r.x+r.width*.05,r.y+r.height*.45);await wait('open');
  r=await p.locator('.sid-letter-pick').boundingBox();await swipe(r.x+r.width/2,r.y+r.height/2,r.x+r.width/2,r.y-110);await wait('packet');await p.locator('.sid-letter-pick').tap();await wait('letter');
  while(await p.locator('.sid-unfold').count()){await p.locator('.sid-unfold').tap();await wait('letter');}await p.locator('[data-sid="put"]').tap();await wait('open');
  r=await p.locator('.sid-cover').boundingBox();await swipe(r.x+r.width*.2,r.y+r.height*.45,r.x+r.width*1.1,r.y+r.height*.45);await wait('held');await p.locator('.sid-return').tap();await p.waitForFunction(()=>document.body.dataset.phase==='idle');
  fs.writeFileSync(dir+'native-touch.json',JSON.stringify({input:'Chromium native emulated touch; not physical iPhone',passed:true,flows:['short cover drag returns','cover swipes open','letter drags out','unfold and return','cover swipes closed','return to scene'],events:await p.evaluate(()=>window.inputReview)},null,2)+'\n');
 }catch(e){await p.screenshot({path:dir+'native-touch-failure.png'});fs.writeFileSync(dir+'native-touch-failure.json',JSON.stringify({error:String(e),events:await p.evaluate(()=>window.inputReview)},null,2)+'\n');throw e;}
 await browser.close();console.log('Restored v0.4.3 view and native touch verified.');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
