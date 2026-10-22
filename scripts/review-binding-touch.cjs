const {chromium,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const out=path.resolve('evidence/bookshop-v014-binding'),results=[];fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch();
 try{for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1,recordVideo:{dir:path.join(out,'native-video'),size:{width,height:844}}});
  const page=await context.newPage(),video=page.video(),cdp=await context.newCDPSession(page),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,radiusX:4,radiusY:4}]});
  async function tap(locator){await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();await touch('touchStart',r.x+r.width/2,r.y+r.height/2);await touch('touchEnd');}
  const step=s=>expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
  await page.goto('http://127.0.0.1:4173/?v=0.14.1&playtest=rhythm');
  await page.locator('.spine[data-id="tao"]').scrollIntoViewIfNeeded();await tap(page.locator('.spine[data-id="tao"]'));await step('held');
  await page.screenshot({path:path.join(out,'native-tao-'+width+'.png')});await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
  for(const id of ['japan','solitude','weeks']){
   const book=page.locator('.spine[data-id="'+id+'"]');await book.scrollIntoViewIfNeeded();
   await tap(book.locator('.painted-title'));await step('held');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book',id);
   await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-flight-model','rigid-flat');
   if(id==='japan')await page.screenshot({path:path.join(out,'native-stack-'+width+'.png')});
   await tap(page.locator('.sid-cover'));await step('open');
   await tap(page.locator('.sid-letter-pick'));await step('letter');await expect(page.locator('.sid-segment').first()).not.toBeEmpty();
   await tap(page.locator('[data-sid="put"]'));await step('open');
   // Close from the cover's top edge, outside its independently scrollable copy.
   const cover=await page.locator('.sid-cover').boundingBox();await touch('touchStart',cover.x+8,cover.y+12);await touch('touchEnd');await step('held');
   const held=await page.locator('.sid-cover').boundingBox(),x=held.x+held.width/2,y=held.y+held.height*.25;
   await touch('touchStart',x,y);for(let i=1;i<=12;i++){await touch('touchMove',x,y+i*18);await page.evaluate(()=>new Promise(requestAnimationFrame));}await touch('touchEnd');
   await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(page.locator('.is-out')).toHaveCount(0);
   expect(await page.locator('.pile-book').evaluateAll(es=>es.filter(e=>e.style.translate).length)).toBe(0);
  }
  expect(errors).toEqual([]);expect(await page.evaluate(()=>getSelection().toString())).toBe('');
  results.push({width,books:['tao','japan','solitude','weeks'],directSpineTouch:true,flatMotion:true,readAndReturn:true,dragToShelf:true,errors});
  await context.close();fs.copyFileSync(await video.path(),path.join(out,'native-motion-'+width+'.webm'));
 }}finally{await browser.close();}
 fs.writeFileSync(path.join(out,'native-touch.json'),JSON.stringify({scope:'Chromium CDP simulated native touch in isolated contexts; not physical iPhone or blind playtest',results},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
