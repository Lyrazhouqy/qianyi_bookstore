const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function pick(p,id){const source=p.locator('.spine[data-id="'+id+'"]');await source.scrollIntoViewIfNeeded();await source.tap();await step(p,'held');return source;}
async function start(p,dy,dx=0){const b=await p.locator('.sid-cover').boundingBox(),x=b.x+b.width*.55,y=b.y+b.height*.3;await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dy,{steps:10});}
test('closed book follows downward drag, rebounds on short drag and flies back without a release jump',async({page})=>{
 await page.goto('/');for(const id of ['siddhartha','cat']){
 const source=page.locator('.spine[data-id="'+id+'"]');await source.scrollIntoViewIfNeeded();const original=await source.locator('.spine-face').boundingBox();await pick(page,id);
 const button=page.locator('.sid-return');expect(await button.evaluate(el=>{const r=el.getBoundingClientRect();return r.right<0||r.left>innerWidth||getComputedStyle(el.parentElement).clipPath==='inset(50%)';})).toBe(true);
 const before=await page.locator('.sid-carrier').boundingBox();await start(page,24,3);await step(page,'book-drag');const dragged=await page.locator('.sid-carrier').boundingBox();expect(dragged.y-before.y).toBeGreaterThan(16);await page.waitForTimeout(130);await page.mouse.up();await step(page,'held');const rebound=await page.locator('.sid-carrier').boundingBox();expect(Math.abs(rebound.y-before.y)).toBeLessThan(1);await expect(page.locator('.sid-cover')).toHaveAttribute('aria-expanded','false');
 await start(page,120,12);await step(page,'book-drag');await expect(source).toHaveClass(/sid-return-target/);
 const continuity=await page.evaluate(()=>{const el=document.querySelector('.sid-carrier'),r=el.getBoundingClientRect().toJSON();el.addEventListener('pointerup',()=>{window.releaseRect=document.querySelector('.sid-carrier').getBoundingClientRect().toJSON();},{once:true});return r;});
 await page.mouse.up();const release=await page.evaluate(()=>window.releaseRect);for(const k of ['x','y','width','height'])expect(Math.abs(release[k]-continuity[k])).toBeLessThan(1);
 await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(source).toBeFocused();const returned=await source.locator('.spine-face').boundingBox();for(const k of ['x','y','width','height'])expect(Math.abs(returned[k]-original[k])).toBeLessThan(1);await expect(page.locator('.is-out,.sid-return-target')).toHaveCount(0);
 }
});
test('cover turns stay horizontal; cancelled drag resets and empty scene folds the note and book away',async({page})=>{
 await page.goto('/');await pick(page,'siddhartha');await start(page,65);await page.locator('.sid-cover').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();await step(page,'held');
 const b=await page.locator('.sid-cover').boundingBox();await page.mouse.move(b.x+b.width*.85,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x-b.width*.4,b.y+b.height*.5,{steps:15});await page.mouse.up();await step(page,'open');await page.locator('.sid-letter-pick').tap();await step(page,'letter');
 expect(await page.locator('.sid-segment').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('PaperYozai');expect(await page.locator('.sid-letter-reader').evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('letter-paper-texture');
 await page.locator('.sid-stage').tap({position:{x:12,y:12}});await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await pick(page,'cat');await start(page,50);await page.setViewportSize({width:390,height:360});await page.mouse.up();await step(page,'held');await expect(page.locator('.sid-return-target')).toHaveCount(0);await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
});
test('writing survives a background tap; keyboard return queued during drag survives rotation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await pick(page,'siddhartha');await page.locator('.sid-cover').tap();await step(page,'open');await page.locator('.sid-letter-pick').tap();await step(page,'letter');while(await page.locator('.sid-unfold').count()){await page.locator('.sid-unfold').tap();await step(page,'letter');}
 await page.locator('.sid-pen').tap();await page.locator('textarea').fill('还没写完，请留在纸上');await page.locator('.sid-stage').tap({position:{x:12,y:12}});await step(page,'letter');await expect(page.locator('textarea')).toHaveValue('还没写完，请留在纸上');await page.locator('[data-sid="save"]').tap();await step(page,'letter');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await pick(page,'cat');await start(page,55);await step(page,'book-drag');await page.locator('.sid-cover').dispatchEvent('pointerdown',{pointerId:99,button:0,clientX:10,clientY:10});await page.locator('.sid-cover').dispatchEvent('pointerup',{pointerId:99,button:0});await step(page,'book-drag');await page.keyboard.press('Escape');await page.setViewportSize({width:500,height:360});await page.mouse.up();await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(page.locator('.is-out,.sid-return-target')).toHaveCount(0);expect(errors).toEqual([]);
});
