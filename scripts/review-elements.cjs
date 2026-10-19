const {chromium,webkit}=require('playwright');const fs=require('node:fs');
(async()=>{
 const rows=[];
 for(const [name,type,width,height] of [['phone',webkit,390,844],['small',webkit,320,568],['SE',chromium,375,667],['desktop',chromium,1440,1000]]){
  const browser=await type.launch(),page=await browser.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?v=0.5.2');await page.locator('.room-world img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await page.screenshot({path:'evidence/bookshop-v052/'+name+'-home.png',fullPage:true});
  const books=await page.locator('.spine').evaluateAll(els=>els.map(el=>({id:el.dataset.id,hit:el.getBoundingClientRect().toJSON(),face:el.firstElementChild.getBoundingClientRect().toJSON(),font:getComputedStyle(el.firstElementChild).fontSize,opacity:getComputedStyle(el.firstElementChild).opacity})));
  await page.locator('[data-id="siddhartha"]').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room')?.dataset.step==='held');await page.locator('.sid-cover').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='open');await page.screenshot({path:'evidence/bookshop-v052/'+name+'-reading.png'});await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');
  rows.push({name,width,height,books,errors});await browser.close();
 }
 fs.writeFileSync('evidence/bookshop-v052/visual-review.json',JSON.stringify(rows,null,2)+'\n');console.log('Four viewports reviewed; geometry saved.');
})();
