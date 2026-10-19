const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');let browser;
(async()=>{
 browser=await chromium.launch();const evidence=[];
 const phoneOnly=process.argv.includes('--phone-only');
 for(const viewport of (phoneOnly?[{width:390,height:844}]:[{width:320,height:568},{width:390,height:844},{width:844,height:390}])){
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:1}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173/?v=0.6.7');const session=await context.newCDPSession(p),wait=s=>p.waitForFunction(s=>document.querySelector('.siddhartha-room').dataset.step===s,s);
 const point=(x,y)=>({id:1,x,y,radiusX:7,radiusY:7,force:1});
 async function drag(dx,dy,{release=true,delay=16}={}){const r=await p.locator('.sid-cover').boundingBox(),x=r.x+r.width*.55,y=r.y+r.height*.35;await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(x,y)]});for(let i=1;i<=16;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(x+dx*i/16,y+dy*i/16)]});await p.waitForTimeout(delay);}if(release)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 for(const id of ['cat','siddhartha']){
 const source=p.locator('.spine[data-id="'+id+'"]');await source.scrollIntoViewIfNeeded();const origin=await source.locator('.spine-face').boundingBox();await source.tap();await wait('held');
 if(id==='cat')await p.screenshot({path:'evidence/bookshop-v067/held-'+viewport.width+'.png'});
 const before=await p.locator('.sid-carrier').boundingBox();await drag(2,22,{release:false});await wait('book-drag');await p.waitForTimeout(150);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('held');let b=await p.locator('.sid-carrier').boundingBox();assert(Math.abs(b.y-before.y)<1);
 // Cover swipe and immediate note tap retain the earlier v0.4.3 effect.
 let r=await p.locator('.sid-cover').boundingBox();await drag(-r.width*1.05,0);await wait('open');await p.locator('.sid-letter-pick').tap();await wait('letter');while(await p.locator('.sid-unfold').count()){await p.locator('.sid-unfold').tap();await wait('letter');}
 if(id==='siddhartha'&&viewport.width===390)await p.screenshot({path:'evidence/bookshop-v067/original-stationery.png'});
 await p.locator('[data-sid="put"]').tap();await wait('open');r=await p.locator('.sid-cover').boundingBox();await drag(r.width*1.3,0);await wait('held');
 await drag(10,118,{release:false});await wait('book-drag');if(id==='cat')await p.screenshot({path:'evidence/bookshop-v067/drag-'+viewport.width+'.png'});
 const released=await p.locator('.sid-carrier').boundingBox();await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>document.body.dataset.phase==='idle');const final=await source.locator('.spine-face').boundingBox();for(const k of ['x','y','width','height'])assert(Math.abs(final[k]-origin[k])<1);
 evidence.push({viewport,id,shortDragRebounds:true,horizontalTurnAndImmediateNoteTap:true,originalNoteFold:true,downDragReturnsToExactSource:true,released});
 }
 assert.equal(errors.length,0);await context.close();
 }
 fs.writeFileSync('evidence/bookshop-v067/'+(phoneOnly?'native-touch-final.json':'native-touch.json'),JSON.stringify({passed:true,input:'Chromium native simulated touch; not a physical iPhone',evidence},null,2)+'\n');await browser.close();console.log('Native touch: '+evidence.length+' complete book / letter / drag-return flows passed.');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
