const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function enter(page){await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/?v=0.14.8&playtest=rhythm');await page.locator('.spine[data-id="naval"]').tap();await step(page,'held');await page.locator('.sid-cover').tap();await step(page,'open');const button=page.locator('.sid-page-next'),r=await button.boundingBox();return {button,target:await button.getAttribute('data-paper-id'),x:r.x+r.width*.72,y:r.y+r.height*.72};}
async function press(p,a){await p.mouse.move(a.x,a.y);await p.mouse.down();await step(p,'page-drag');}
test('slow pull keeps the free edge near the finger; a short held pull rebounds without changing paper',async({page})=>{
 const a=await enter(page),right=await page.locator('.sid-page').evaluate(e=>e.getBoundingClientRect().right);await press(page,a);await page.mouse.move(a.x-44,a.y-3,{steps:6});const edge=await page.locator('.sid-turn-panel').last().evaluate(e=>e.getBoundingClientRect().right);expect(Math.abs(edge-(right-44))).toBeLessThan(16);await expect(page.locator('.sid-turn-preview-paper')).toHaveCount(1);await expect(page.locator('.sid-turn-under')).toHaveText('《纳瓦尔宝典》');await page.screenshot({path:test.info().outputPath('finger-tracking.png')});await page.waitForTimeout(120);await page.mouse.up();await step(page,'open');expect(await a.button.getAttribute('data-paper-id')).toBe(a.target);await expect(page.locator('.sid-turning-leaf,.sid-turn-under,.sid-turn-cast')).toHaveCount(0);
});
test('a short deliberate flick completes one page without needing a long drag',async({page})=>{
 const a=await enter(page);await press(page,a);await page.mouse.move(a.x-32,a.y-1,{steps:2});await page.mouse.up();await step(page,'open');expect(await page.locator('.sid-page-next').getAttribute('data-paper-id')).not.toBe(a.target);await expect(page.locator('.sid-turning-leaf,.sid-turn-under,.sid-turn-cast')).toHaveCount(0);
});
test('holding after the same short flick removes its momentum and leaves the paper in place',async({page})=>{
 const a=await enter(page);await press(page,a);await page.mouse.move(a.x-32,a.y-1,{steps:2});await page.waitForTimeout(130);await page.mouse.up();await step(page,'open');expect(await a.button.getAttribute('data-paper-id')).toBe(a.target);
});
test('bringing a committed-distance page back before releasing cancels the turn',async({page})=>{
 const a=await enter(page);await press(page,a);await page.mouse.move(a.x-150,a.y-4,{steps:8});await page.waitForTimeout(100);await page.mouse.move(a.x-110,a.y-3,{steps:3});await page.mouse.up();await step(page,'open');expect(await a.button.getAttribute('data-paper-id')).toBe(a.target);await expect(page.locator('.sid-turning-leaf,.sid-turn-under,.sid-turn-cast')).toHaveCount(0);
});
