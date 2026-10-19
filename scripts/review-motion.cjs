const {webkit,chromium}=require('playwright');
const fs=require('node:fs');
const out='evidence/siddhartha-v044';
(async()=>{
 const results=[];
 for(const [engine,type,width,height] of [['webkit',webkit,390,844],['webkit',webkit,320,568],['webkit',webkit,375,667],['webkit',webkit,430,932],['webkit',webkit,844,390],['chromium',chromium,566,853],['chromium',chromium,900,900]]){
  const browser=await type.launch();
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,recordVideo:{dir:out+'/video',size:{width,height}}});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?focus=siddhartha&v=0.4.4');await page.evaluate(()=>document.fonts.load('17px PaperYozai'));
  const wait=s=>page.waitForFunction(s=>document.querySelector('.siddhartha-room')?.dataset.step===s,s);
  const shot=n=>page.screenshot({path:`${out}/${engine}-${width}-${n}.png`});
  await page.locator('.spine[data-id="siddhartha"]').first().tap();await wait('held');await shot('held');
  await page.locator('.sid-cover').tap();await page.waitForTimeout(260);await shot('opening');await wait('open');await shot('open');
  const bounds=await page.locator(width<=600||width<=950&&height<=500?'.sid-page':'.sid-cover-back').boundingBox();
  if(bounds.x<0||bounds.x+bounds.width>width)throw Error('Open book clips viewport '+width);
  await page.locator('.sid-letter-pick').tap();await page.waitForTimeout(730);await shot('first-unfolding');await wait('letter');await shot('first');
  while(await page.locator('.sid-unfold').count()){await page.locator('.sid-unfold').tap();await wait('letter');}
  await shot('letter');await page.locator('[data-sid="put"]').tap();await wait('open');await shot('put');
  await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');
  results.push({engine,width,height,visibleBookBounds:bounds,errors});
  if(errors.length)throw Error(errors.join('\n'));
  await ctx.close();await browser.close();
 }
 fs.writeFileSync(out+'/motion-review.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results));
})();
