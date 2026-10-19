const {chromium}=require('playwright');
const fs=require('node:fs');
let reviewBrowser;
(async()=>{
 const browser=reviewBrowser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1}),page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/?focus=siddhartha&v=0.4.4');
 const cdp=await context.newCDPSession(page),wait=s=>page.waitForFunction(s=>document.querySelector('.siddhartha-room').dataset.step===s,s,{timeout:6000}).catch(async error=>{await page.screenshot({path:'evidence/siddhartha-v044/touch-failure.png'});fs.writeFileSync('evidence/siddhartha-v044/touch-failure.json',JSON.stringify(await page.evaluate(()=>({step:document.querySelector('.siddhartha-room').dataset.step,events:window.touchReview})),null,2));throw error;});
 await page.evaluate(()=>{window.touchReview=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','click'])document.addEventListener(type,e=>window.touchReview.push({type:e.type,pointerType:e.pointerType,target:e.target.className,x:e.clientX,y:e.clientY,step:document.querySelector('.siddhartha-room')?.dataset.step}),true);});
 async function swipe(x0,y0,x1,y1,pause=0){
  const point=(x,y)=>({x,y,id:1,radiusX:8,radiusY:8,force:1});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(x0,y0)]});
  for(let i=1;i<=14;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(x0+(x1-x0)*i/14,y0+(y1-y0)*i/14)]});await page.waitForTimeout(16);}
  if(pause)await page.waitForTimeout(pause);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 await page.locator('.spine[data-id="siddhartha"]').first().tap();await wait('held');let r=await page.locator('.sid-cover').boundingBox();
 await swipe(r.x+r.width*.85,r.y+r.height*.45,r.x+r.width*.2,r.y+r.height*.45);await wait('open');
 await page.screenshot({path:'evidence/siddhartha-v044/chromium-touch-open.png'});
 r=await page.locator('.sid-page').boundingBox();await swipe(r.x+50,r.y+130,r.x+82,r.y+130,160);await wait('open');
 await swipe(r.x+80,r.y+110,r.x+80,r.y+180);await wait('open');
 const packet=await page.locator('.sid-letter-pick').boundingBox();await swipe(packet.x+packet.width/2,packet.y+packet.height/2,packet.x+packet.width/2,packet.y-110);await wait('packet');
 await page.locator('.sid-letter-pick').tap();await wait('letter');while(await page.locator('.sid-unfold').count()){await page.locator('.sid-unfold').tap();await wait('letter');}
 await page.locator('[data-sid="put"]').tap();await wait('open');
 r=await page.locator('.sid-page').boundingBox();await swipe(r.x+30,r.y+140,r.x+r.width*.85,r.y+140);await wait('held');
 await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');
 const events=await page.evaluate(()=>window.touchReview);if(events.some(e=>e.type==='pointerdown'&&e.pointerType!=='touch'))throw Error('Unexpected non-touch path');
 fs.writeFileSync('evidence/siddhartha-v044/touch-review.json',JSON.stringify({engine:'Chromium',viewport:{width:390,height:844},input:'CDP native emulated touch; not physical iPhone',flows:['swipe open','short swipe settles open','vertical swipe does not close','drag letter','unfold and return','swipe close','return to shelf'],events},null,2)+'\n');
 await browser.close();console.log('Native emulated touch flow passed.');
})().catch(async error=>{console.error(error);await reviewBrowser?.close();process.exitCode=1;});
