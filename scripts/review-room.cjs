const {chromium,webkit}=require('playwright');const fs=require('node:fs');
(async()=>{
 const rows=[];
 for(const [name,type,width,height] of [['desktop',chromium,1440,1080],['phone',webkit,390,844],['small',webkit,320,568]]){
  const browser=await type.launch(),page=await browser.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?v=0.5.0');await page.locator('.room-art').evaluate(img=>img.decode());await page.waitForTimeout(150);
  await page.screenshot({path:'evidence/bookshop-v05/'+name+'-room.png',fullPage:true});
  const geometry=await page.locator('#room-viewport').evaluate(el=>({width:el.clientWidth,height:el.clientHeight,worldWidth:el.scrollWidth,worldHeight:el.scrollHeight,left:el.scrollLeft,top:el.scrollTop}));
  await page.locator('#open-book-index').tap();await page.screenshot({path:'evidence/bookshop-v05/'+name+'-catalogue.png'});
  await page.locator('[data-book="siddhartha"]').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room')?.dataset.step==='held');await page.locator('.sid-cover').tap();await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='open');
  await page.screenshot({path:'evidence/bookshop-v05/'+name+'-reading.png'});await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');
  rows.push({name,width,height,geometry,errors});if(errors.length)throw Error(errors.join('\n'));await browser.close();
 }
 fs.writeFileSync('evidence/bookshop-v05/visual-review.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows));
})();
