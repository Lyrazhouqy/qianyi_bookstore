const {test,expect}=require('@playwright/test');
const wait=(page,s)=>expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function pick(page){await page.goto('/?focus=siddhartha');await page.locator('.spine[data-id="siddhartha"]').first().tap();await wait(page,'held');}
test('phone page is large, synopsis is readable and never shares space with the letter',async({page})=>{
 await pick(page);const closed=await page.locator('.sid-cover-front').boundingBox();expect(closed.width).toBeGreaterThan(page.viewportSize().width*(page.viewportSize().width>600?.72:.82));
 await page.locator('.sid-cover').tap();await wait(page,'open');
 const geometry=await page.evaluate(()=>{const read=s=>document.querySelector(s).getBoundingClientRect().toJSON(),intro=document.querySelector('.sid-mobile-intro');return {page:read('.sid-page'),intro:read('.sid-mobile-intro'),dock:read('.sid-dock'),toolbar:read('.sid-toolbar'),hint:read('.sid-hint'),font:parseFloat(getComputedStyle(intro.querySelector('.sid-synopsis')).fontSize),scroll:intro.scrollHeight,height:intro.clientHeight};});
 expect(geometry.font).toBeGreaterThanOrEqual(18);expect(geometry.scroll).toBeLessThanOrEqual(geometry.height+1);
 expect(geometry.intro.y).toBeGreaterThan(geometry.page.y);if(page.viewportSize().width>600)expect(geometry.intro.right).toBeLessThan(geometry.dock.x);else expect(geometry.intro.bottom).toBeLessThan(geometry.dock.y);
 expect(geometry.page.x).toBeGreaterThanOrEqual(16);expect(geometry.page.right).toBeLessThanOrEqual(page.viewportSize().width-16);
 expect(geometry.page.y).toBeGreaterThanOrEqual(geometry.toolbar.bottom-6);expect(geometry.page.bottom).toBeLessThanOrEqual(geometry.hint.y+6);
 await expect(page.locator('.sid-close-cover')).toBeVisible();await page.locator('.sid-close-cover').tap();await wait(page,'held');
 await page.locator('.sid-return').tap();await expect(page.locator('.siddhartha-room')).toBeHidden();
});
test('thumb-length opening, short-drag cancellation and immediate letter tap stay usable',async({page})=>{
 await pick(page);let r=await page.locator('.sid-cover').boundingBox();
 await page.mouse.move(r.x+r.width*.85,r.y+r.height*.45);await page.mouse.down();await page.mouse.move(r.x+r.width*.2,r.y+r.height*.45,{steps:10});await page.mouse.up();await wait(page,'open');
 r=await page.locator('.sid-page').boundingBox();await page.mouse.move(r.x+30,r.y+140);await page.mouse.down();await page.mouse.move(r.x+65,r.y+140,{steps:8});await page.waitForTimeout(150);await page.mouse.up();await wait(page,'open');
 await page.locator('.sid-letter-pick').tap();await wait(page,'letter');await expect(page.locator('.sid-close-cover')).toBeHidden();
 await page.locator('[data-sid="put"]').tap();await wait(page,'open');
 r=await page.locator('.sid-page').boundingBox();await page.mouse.move(r.x+25,r.y+130);await page.mouse.down();await page.mouse.move(r.x+r.width*.85,r.y+130,{steps:10});await page.mouse.up();await wait(page,'held');
 await page.locator('.sid-return').tap();await expect(page.locator('.siddhartha-room')).toBeHidden();
});
