const {test,expect}=require('./helpers/quiet.cjs');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function open(p){await p.locator('#open-book-index').click();await p.locator('[data-book="naval"]').click();await step(p,'held');await p.locator('.sid-cover').click();await step(p,'open');}
async function enter(p){
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.addInitScript(()=>{if(localStorage.getItem('mobile-fit-seeded'))return;localStorage.setItem('mobile-fit-seeded','1');localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{},baseline:{},changes:{},visit:{id:'mobile-fit-qa',seed:1,lastActive:1,draws:{naval:'qianyi-naval-22185'},events:[]}}));});
 await p.goto('/?playtest=rhythm&layout=mobile-fit-v1');await p.evaluate(()=>document.fonts.ready);
}
async function bounds(p,selector){const r=await p.locator(selector).boundingBox();expect(r).not.toBeNull();const v=await p.evaluate(()=>({w:innerWidth,h:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--view-height')),top:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--view-top'))}));expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(v.w+1);expect(r.y).toBeGreaterThanOrEqual(v.top-1);expect(r.y+r.height).toBeLessThanOrEqual(v.top+v.h+1);return r;}
async function mockKeyboard(p,height){await p.evaluate(height=>{Object.defineProperty(window,'visualViewport',{configurable:true,value:{height,offsetTop:0}});window.dispatchEvent(new Event('resize'));},height);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
test('cropping stays in the camera; scene objects and every dialog remain reachable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);await page.locator('.room-art').evaluate(e=>e.decode());
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await bounds(page,'#room-viewport');
 for(const selector of ['#change-window','#open-music','#change-bouquet','#lamp-pull','.spine[data-id="siddhartha"]','.spine[data-id="cat"]']){await page.locator(selector).scrollIntoViewIfNeeded();await bounds(page,selector);expect(await page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height*.65,hit=document.elementFromPoint(x,y);return e.matches('.spine')?window.BookArrangement.targetFor({target:hit,detail:1,clientX:x,clientY:y})===e:e.contains(hit);})).toBe(true);}
 for(const [opener,sheet] of [['#open-book-index','#book-index'],['#open-music','#music-settings'],['#change-window','#window-settings'],['#change-bouquet','#bouquet-settings']]){await page.locator(opener).click();await expect(page.locator(sheet)).toBeVisible();await bounds(page,sheet);await expect(page.locator(sheet+' [data-close-sheet]')).toBeInViewport();expect(await page.locator(sheet).evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.locator(sheet+' [data-close-sheet]').click();}
 expect(errors).toEqual([]);await page.screenshot({path:test.info().outputPath('room.png'),animations:'disabled'});
});
test('paired reading fits the phone, keeps the passage visible and exposes one usable next corner',async({page})=>{
 await enter(page);await open(page);await bounds(page,'.sid-page');await bounds(page,'.sid-cover-back');await bounds(page,'.sid-create-pen');
 await page.locator('.sid-letter-pick').click();await step(page,'letter');await expect(page.locator('.sid-create-pen')).toBeHidden();
 const left=await bounds(page,'.sid-inside-copy'),right=await bounds(page,'.sid-letter-reader'),corner=await bounds(page,'.sid-page-next');expect(right.x).toBeGreaterThan(left.x+left.width+2);expect(right.y+right.height).toBeLessThanOrEqual(corner.y-8);
 await expect(page.locator('.sid-inside-copy')).toHaveAttribute('data-kind','quotation');expect(await page.locator('.sid-segment').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(15);
 expect(await page.locator('.sid-letter-reader').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);expect(corner.width).toBeGreaterThanOrEqual(44);expect(corner.height).toBeGreaterThanOrEqual(44);
 if(page.viewportSize().width>600&&page.viewportSize().height<600)expect(right.width).toBeGreaterThan(180);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:test.info().outputPath('paired-reading.png'),animations:'disabled'});
 const next=await page.locator('.sid-page-next').getAttribute('data-paper-id');await page.locator('.sid-page-next').click();await step(page,'open');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secret-reading-v1')).books.naval.last)).toBe(next);
});
test('notch insets and a visual-only keyboard keep a reply and its save action visible; drafts survive rotation',async({page})=>{
 await enter(page);await page.evaluate(()=>{const s=document.documentElement.style;s.setProperty('--phone-safe-top','24px');s.setProperty('--phone-safe-bottom','20px');s.setProperty('--phone-safe-left','12px');s.setProperty('--phone-safe-right','12px');});
 await open(page);await page.locator('.sid-letter-pick').click();await step(page,'letter');await page.locator('[data-sid="write"]').click();await page.locator('#sid-reply').fill('适配检查：换个屏幕，接着写。');
 await mockKeyboard(page,320);await expect(page.locator('.siddhartha-room')).toHaveCSS('height','320px');await page.locator('.sid-write').evaluate(e=>e.parentElement.scrollTop=e.parentElement.scrollHeight);
 await expect(page.locator('#sid-reply')).toBeInViewport({ratio:.95});await expect(page.locator('[data-sid="save"]')).toBeInViewport({ratio:.95});await bounds(page,'.sid-letter-reader');
 expect(await page.locator('#sid-reply').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);await page.screenshot({path:test.info().outputPath('keyboard-simulation.png'),animations:'disabled'});
 await mockKeyboard(page,page.viewportSize().height);await page.setViewportSize({width:667,height:375});await mockKeyboard(page,375);await expect(page.locator('#sid-reply')).toHaveValue('适配检查：换个屏幕，接着写。');await page.locator('.sid-page-next').click();await step(page,'open');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secret-drafts-v1'))['reply:naval:qianyi-naval-22185'].text)).toBe('适配检查：换个屏幕，接着写。');
});
test('new-note editor fits a short visual viewport without losing its text',async({page})=>{
 await enter(page);await open(page);await page.locator('.sid-create-pen').click();await step(page,'composing');await page.locator('#secret-front').fill('小屏上的草稿也要留好。');await mockKeyboard(page,300);await bounds(page,'.sid-secret-editor');await expect(page.locator('#secret-front')).toBeInViewport({ratio:.95});await expect(page.locator('.sid-bury')).toBeInViewport({ratio:.95});await page.locator('.sid-desk-close').click();await step(page,'open');await mockKeyboard(page,page.viewportSize().height);await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await page.reload();await open(page);await page.locator('.sid-create-pen').click();await expect(page.locator('#secret-front')).toHaveValue('小屏上的草稿也要留好。');
});
