const {webkit,chromium}=require('playwright');
const fs=require('node:fs');
const dir='evidence/bookshop-v061/';
(async()=>{
 const results=[];
 for(const [name,engine,width,height] of [['phone',webkit,390,844],['small',webkit,320,568],['landscape',webkit,844,390],['panel',chromium,705,853],['desktop',chromium,1440,1000]]){
  const browser=await engine.launch(),page=await browser.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?v=0.6.1');await page.locator('.room-art').evaluate(img=>img.decode());await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:dir+name+'-home.png'});
  const books=await page.locator('.spine').evaluateAll(els=>els.map(el=>({id:el.dataset.id,hit:el.getBoundingClientRect().toJSON(),face:el.firstElementChild.getBoundingClientRect().toJSON()})));
  await page.locator('[data-id="siddhartha"]').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='held');await page.screenshot({path:dir+name+'-held.png'});
  await page.locator('.sid-cover').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='open');await page.screenshot({path:dir+name+'-open.png'});
  await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');
  await page.locator('.game-camera').evaluate(el=>el.scrollTop=el.scrollHeight);await page.screenshot({path:dir+name+'-lower-room.png'});
  results.push({name,width,height,books,errors});await browser.close();
 }
 fs.writeFileSync(dir+'visual-review.json',JSON.stringify(results,null,2)+'\n');console.log('Five viewport game scenes and book flow captured.');
})().catch(e=>{console.error(e);process.exitCode=1;});
