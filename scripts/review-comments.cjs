const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const notes=[];
 for(const [name,type,width,height] of [['webkit-comment',webkit,566,853],['chromium-comment',chromium,566,853],['webkit-small',webkit,320,568]]){
  const browser=await type.launch(),page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/?focus=siddhartha&v=0.4.4');
  await page.locator('.spine[data-id="siddhartha"]').first().click();await page.waitForFunction(()=>document.querySelector('.siddhartha-room')?.dataset.step==='held');
  await page.locator('.sid-cover').click();await page.waitForFunction(()=>document.querySelector('.siddhartha-room')?.dataset.step==='open');
  await page.screenshot({path:'evidence/siddhartha-v044/'+name+'-intro.png'});
  const introBounds=await page.locator(width<=600?'.sid-mobile-intro':'.sid-inside-copy').evaluate(el=>({copy:el.getBoundingClientRect().toJSON(),leaf:(el.closest('.sid-page')||el.parentElement).getBoundingClientRect().toJSON(),text:el.textContent}));
  await page.locator('.sid-letter-pick').click();await page.waitForFunction(()=>document.querySelector('.siddhartha-room')?.dataset.step==='letter');
  const firstSegments=await page.locator('.sid-segment').count();
  while(await page.locator('.sid-unfold').count()){await page.locator('.sid-unfold').click();await page.waitForFunction(()=>document.querySelector('.siddhartha-room')?.dataset.step==='letter');}
  await page.locator('.sid-pen').scrollIntoViewIfNeeded();await page.screenshot({path:'evidence/siddhartha-v044/'+name+'-pen.png'});
  await page.locator('.sid-pen').hover();await page.screenshot({path:'evidence/siddhartha-v044/'+name+'-pen-hover.png'});
  await page.getByRole('button',{name:'拿起笔续写'}).click();await page.getByRole('textbox').fill('批注后的点笔交互检查。');
  await page.screenshot({path:'evidence/siddhartha-v044/'+name+'-writing.png'});
  notes.push({name,viewport:{width,height},firstSegmentsAfterOneClick:firstSegments,introBounds,writingFocused:await page.getByRole('textbox').evaluate(el=>document.activeElement===el),pageErrors:errors});
  if(firstSegments!==1||errors.length)throw Error('Comment flow failed: '+name);
  if(introBounds.copy.top<introBounds.leaf.top||introBounds.copy.bottom>introBounds.leaf.bottom)throw Error('Intro overflows leaf: '+name);
  await browser.close();
 }
 fs.writeFileSync('evidence/siddhartha-v044/browser-comments-review.json',JSON.stringify(notes,null,2)+'\n');
 console.log('Commented 566px viewport verified in both engines; 320px layout verified; screenshots saved.');
})();
