const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function open(p){await p.locator('.spine[data-id="prince"]').click();await step(p,'held');await p.locator('.sid-cover').tap();await step(p,'open');}
async function seek(p,kind){
 while(await p.locator('.sid-page-prev').count()){await p.locator('.sid-page-prev').tap();await step(p,'open');}
 for(let i=0;i<12;i++){
  if(await p.locator('.siddhartha-room').getAttribute('data-artifact')===kind)return;
  if(!await p.locator('.sid-page-next').count())break;
  await p.locator('.sid-page-next').tap();await step(p,'open');
 }
 throw new Error('Missing '+kind+' page');
}
test('Little Prince postcard frames the supplied portrait with a romantic caption, flips and returns without losing old notes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  if(localStorage.getItem('prince-postcard-qa'))return;
  localStorage.setItem('prince-postcard-qa','yes');
  localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{prince:[{id:'old-prince-qa',kind:'stack',author:'local',front:'以前留在这本书中的话',back:'',stock:'cream',replies:[{author:'N',text:'以前收到的回应'}]}]}}));
 });
 await page.goto('/?v=0.14.3&playtest=rhythm');const original=await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'));
 await open(page);await seek(page,'postcard');
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact-source','user-supplied-image');
 await page.locator('.sid-letter-pick').tap();await step(page,'letter');
 const image=page.locator('img.sid-postcard-picture');await expect(image).toBeVisible();
 expect(await image.evaluate(async e=>{await e.decode();return [e.naturalWidth,e.naturalHeight];})).toEqual([1152,2048]);
 const box=await image.boundingBox(),v=page.viewportSize();
 expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(12);
 expect(box.x+box.width).toBeLessThanOrEqual(v.width);expect(box.y+box.height).toBeLessThanOrEqual(v.height-12);
 // The shorter display frame crops sky/grass, never stretches the original image.
 expect(box.height).toBeLessThanOrEqual(321);
 expect(box.width/box.height).toBeGreaterThan(.8);
 await expect(image).toHaveCSS('object-fit','cover');
 const caption=page.locator('.sid-postcard-caption');
 await expect(caption).toHaveText('你望向星星时，\n我就在其中一颗上想你。');
 await expect(caption).toBeInViewport();
 const card=await page.locator('.sid-letter-reader').boundingBox();
 expect(card.height).toBeLessThanOrEqual(Math.min(610,v.height-64));
 await expect(page.locator('[data-sid="put"]')).toBeInViewport();
 await expect(page.locator('[data-sid="flip"]')).toBeInViewport();
 await page.screenshot({path:test.info().outputPath('prince-postcard-front.png'),animations:'disabled'});
 await page.locator('[data-sid="flip"]').tap();await step(page,'letter');await expect(image).toHaveCount(0);
 await expect(page.locator('.sid-segment')).toContainText('收件人：下一位读者');
 await page.locator('[data-sid="flip"]').tap();await step(page,'letter');await expect(image).toBeVisible();
 await page.locator('[data-sid="put"]').tap();await step(page,'open');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await page.reload();await open(page);await seek(page,'postcard');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(image).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'))).toBe(original);expect(errors).toEqual([]);
});
test('the postcard remains a separate page beside the existing rose envelope',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('paperbook-v3',JSON.stringify({visits:3,seen:['ship'],found:[],replies:[],rose:true,stamp:false,mode:'natural'})));
 await page.goto('/?v=0.14.3');await open(page);await seek(page,'envelope');
 await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('信封');
 await page.locator('.sid-unfold').tap();await step(page,'letter');await expect(page.locator('.sid-segment').last()).toContainText('玫瑰邮票');
 await page.locator('[data-sid="put"]').tap();await step(page,'open');await seek(page,'postcard');
 await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('img.sid-postcard-picture')).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).stamp)).toBe(true);
});
