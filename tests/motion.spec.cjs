const {test,expect}=require('@playwright/test');
test('pickup meets the spine and letter unfolding keeps its center and width',async({page})=>{
 await page.goto('/?focus=siddhartha');
 const start=await page.evaluate(()=>{
  const button=document.querySelector('.spine[data-id="siddhartha"]'),origin=button.querySelector('.spine-face').getBoundingClientRect().toJSON();
  button.click();return {origin,book:document.querySelector('.sid-cover-front').getBoundingClientRect().toJSON()};
 });
 expect(Math.abs(start.origin.width-start.book.width)).toBeLessThan(5);
 expect(Math.abs(start.origin.height-start.book.height)).toBeLessThan(5);
 expect(Math.abs(start.origin.x-start.book.x)).toBeLessThan(5);
 expect(Math.abs(start.origin.y-start.book.y)).toBeLessThan(5);
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');
 await page.locator('.sid-cover').tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','open');
 const samples=await page.evaluate(async()=>{
  const paper=document.querySelector('.sid-letter'),room=document.querySelector('.siddhartha-room');
  document.querySelector('.sid-letter-pick').click();const result=[];
  await new Promise(resolve=>{function frame(){if(room.dataset.step==='unfolding'||room.dataset.step==='letter'){const r=paper.getBoundingClientRect();result.push({x:r.x,centerY:r.y+r.height/2,width:r.width});}if(room.dataset.step==='letter')resolve();else requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  return result;
 });
 expect(samples.length).toBeGreaterThan(4);
 for(const key of ['x','centerY','width'])expect(Math.max(...samples.map(r=>r[key]))-Math.min(...samples.map(r=>r[key]))).toBeLessThan(1);
});
