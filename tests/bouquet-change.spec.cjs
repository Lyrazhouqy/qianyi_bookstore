const {test,expect}=require('@playwright/test'),crypto=require('crypto');
const vase=p=>p.locator('#change-bouquet'),art=p=>p.locator('#bouquet-art');
async function start(p){await p.goto('/');await p.locator('.room-art').evaluate(e=>e.decode());await vase(p).scrollIntoViewIfNeeded();}
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
test('vase cycles three visibly different bouquets, retains selection and keeps vase/book targets fixed',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await start(page);const saved=await page.evaluate(()=>localStorage.getItem('paperbook-v3'));const box=await vase(page).boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
 const images=[];const core=await page.locator('.room-world').evaluate(e=>{const r=e.getBoundingClientRect(),s=r.width/940;return{x:r.x+716*s,y:r.y+1320*s,width:38*s,height:30*s};});const body=await page.screenshot({clip:core});
 for(const id of ['original','tulips','daisies','original']){
  if(images.length){await vase(page).tap();await expect(art(page)).toHaveAttribute('data-bouquet',id);}
  const photo=await art(page).screenshot();images.push(digest(photo));expect(digest(await page.screenshot({clip:core}))).toBe(digest(body));
 }
 expect(new Set(images.slice(0,3)).size).toBe(3);expect(images[0]).toBe(images[3]);expect(await page.evaluate(()=>localStorage.getItem('paperbook-v3'))).toBe(saved);
 await vase(page).tap();await expect(art(page)).toHaveAttribute('data-bouquet','tulips');await page.reload();await expect(art(page)).toHaveAttribute('data-bouquet','tulips');await vase(page).scrollIntoViewIfNeeded();await vase(page).focus();await page.keyboard.press('Space');await expect(art(page)).toHaveAttribute('data-bouquet','daisies');
 const cat=page.locator('.spine[data-id="cat"]');await cat.scrollIntoViewIfNeeded();const r=await cat.boundingBox();await page.touchscreen.tap(r.x+r.width-3,r.y+3);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
});
test('switch fades petals above a stationary vase, while camera drags do not change flowers',async({page})=>{
 await start(page);const saved=await page.evaluate(()=>localStorage.getItem('paperbook-v3')),r=await vase(page).boundingBox(),before=await art(page).getAttribute('data-bouquet');await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2-55,r.y+r.height/2-55,{steps:12});await page.mouse.up();await expect(art(page)).toHaveAttribute('data-bouquet',before);expect(await page.evaluate(()=>localStorage.getItem('paperbook-bouquet-v1'))).toBeNull();
 await vase(page).scrollIntoViewIfNeeded();const rim=await page.locator('#bouquet-vase-rim').boundingBox();await vase(page).tap();await expect(art(page)).toHaveAttribute('data-bouquet','tulips');await expect(art(page)).toHaveAttribute('data-motion','swaying');
 const opacity=await page.evaluate(()=>new Promise(resolve=>{const out=[],start=performance.now(),el=document.querySelector('[data-bouquet-layer="tulips"]');function frame(){out.push(parseFloat(getComputedStyle(el).opacity));if(performance.now()-start<360)requestAnimationFrame(frame);else resolve(out);}frame();}));expect(opacity.some(v=>v>0&&v<1)).toBe(true);expect(opacity.at(-1)).toBe(1);
 const after=await page.locator('#bouquet-vase-rim').boundingBox();for(const k of ['x','y','width','height'])expect(Math.abs(after[k]-rim[k])).toBeLessThan(.1);expect(await page.evaluate(()=>localStorage.getItem('paperbook-v3'))).toBe(saved);
});
test('failed loading can retry, and the latest rapid choice wins over an older image response',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/bouquet-tulips-v0624.png',r=>r.abort());await start(page);await vase(page).tap();await expect(page.locator('#bouquet-message')).toContainText('再试');await expect(art(page)).toHaveAttribute('data-bouquet','original');await expect(vase(page)).not.toHaveAttribute('aria-busy');await page.unroute('**/bouquet-tulips-v0624.png');
 let pending;await page.route('**/bouquet-tulips-v0624.png',r=>{pending=r;});await vase(page).tap();await expect.poll(()=>!!pending).toBe(true);await vase(page).tap();await expect(art(page)).toHaveAttribute('data-bouquet','daisies');await pending.continue();await page.waitForTimeout(150);await expect(art(page)).toHaveAttribute('data-bouquet','daisies');expect(await page.evaluate(()=>localStorage.getItem('paperbook-bouquet-v1'))).toBe('daisies');expect(errors).toEqual([]);
});
