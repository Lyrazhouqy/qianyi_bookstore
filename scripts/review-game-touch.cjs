const {chromium}=require('playwright'),fs=require('node:fs');let browser;
(async()=>{
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,isMobile:true,deviceScaleFactor:1}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173');const cdp=await context.newCDPSession(page),camera=page.locator('.game-camera');
 const sid=page.locator('.spine[data-id="siddhartha"]'),r=await sid.boundingBox(),point=(x,y)=>({id:1,x,y,radiusX:8,radiusY:8,force:1});
 const before=await camera.evaluate(el=>el.scrollTop);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(r.x+r.width/2,r.y+r.height/2)]});
 for(let i=1;i<=14;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(r.x+r.width/2,r.y+r.height/2-i*10)]});await page.waitForTimeout(16);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(180);
 const after=await camera.evaluate(el=>el.scrollTop);if(after-before<60||await page.locator('body').getAttribute('data-phase')!=='idle')throw Error('Camera drag misfired or failed to scroll');
 await sid.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));const hit=await sid.boundingBox();await page.touchscreen.tap(hit.x+3,hit.y+4);await page.waitForFunction(()=>document.querySelector('.siddhartha-room')?.dataset.step==='held');
 await page.locator('.sid-cover').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='open');await page.locator('.sid-letter-pick').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='letter');
 await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');if(await page.locator('.is-out').count()||errors.length)throw Error('Return or script error');
 // A desktop drag across a book must also move the camera without picking up the book.
 await sid.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));const m=await sid.boundingBox();await page.mouse.move(m.x+m.width/2,m.y+m.height/2);await page.mouse.down();await page.mouse.move(m.x+m.width/2,m.y-100,{steps:14});await page.mouse.up();
 if(await page.locator('body').getAttribute('data-phase')!=='idle')throw Error('Mouse camera drag picked a book');
 fs.writeFileSync('evidence/bookshop-v061/camera-native-touch.json',JSON.stringify({input:'Chromium native emulated touch; not physical iPhone',viewport:{width:320,height:568},cameraScroll:{before,after},flows:['drag over spine pans camera without pickup','corner tap picks book','open cover and take letter','return restores source slot','mouse drag does not trigger book'],errors},null,2)+'\n');await browser.close();console.log('Camera touch, book edge and return passed.');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
