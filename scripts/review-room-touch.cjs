const {chromium}=require('playwright'),fs=require('node:fs');
let browser;
(async()=>{
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/?v=0.5.0');await page.locator('.room-art').evaluate(img=>img.decode());await page.waitForTimeout(100);
 const camera=page.locator('#room-viewport'),r=await camera.boundingBox(),before=await camera.evaluate(el=>({x:el.scrollLeft,y:el.scrollTop})),cdp=await context.newCDPSession(page);
 const point=(x,y)=>({x,y,id:1,radiusX:8,radiusY:8,force:1});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(r.x+170,r.y+r.height-80)]});
 for(let i=1;i<=14;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(r.x+170-i*8,r.y+r.height-80-i*3)]});await page.waitForTimeout(16);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
 const after=await camera.evaluate(el=>({x:el.scrollLeft,y:el.scrollTop}));if(after.x-before.x<40)throw Error('Native touch did not pan the room');
 await page.screenshot({path:'evidence/bookshop-v05/phone-touch-pan.png'});
 await page.locator('#open-book-index').tap();await page.locator('[data-book="siddhartha"]').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room')?.dataset.step==='held');
 await page.locator('.sid-cover').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='open');await page.locator('.sid-letter-pick').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='letter');
 await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');
 await page.getByRole('button',{name:'书店手记',exact:true}).tap();const summary=await page.locator('#journal-summary').textContent();if(!summary.includes('1 次旧书')||errors.length)throw Error('Journal or page errors');
 fs.writeFileSync('evidence/bookshop-v05/native-touch.json',JSON.stringify({engine:'Chromium',input:'native emulated touch; not a physical phone',before,after,flows:['pan illustrated room','choose Siddhartha','pick up','open cover','take letter','return to source','journal actual count'],summary,errors},null,2)+'\n');
 await browser.close();console.log('Native emulated touch: room pan, catalogue, letter and return passed.');
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1;});
