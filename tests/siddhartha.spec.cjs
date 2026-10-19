const {test,expect} = require('@playwright/test');
const room = page=>page.locator('.siddhartha-room');
const step = (page,value)=>expect(room(page)).toHaveAttribute('data-step',value);
async function pick(page) {await page.locator('.spine[data-id="siddhartha"]').first().tap();await step(page,'held');}
async function openCover(page) {await page.getByRole('button',{name:'翻开《悉达多》',exact:true}).tap();await step(page,'open');}
async function take(page) {await page.getByRole('button',{name:'从夹页抽出接力信'}).tap();await step(page,'letter');}
async function unfoldFirst(page) {await page.getByRole('button',{name:'展开折信',exact:true}).tap();await step(page,'letter');}
async function all(page) {while(await page.locator('.sid-unfold').count()){await page.locator('.sid-unfold').tap();await step(page,'letter');}}
async function put(page) {await page.getByRole('button',{name:'折好，放回夹页'}).tap();await step(page,'open');}
async function back(page) {await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(room(page)).toBeHidden();await expect(page.locator('.is-out')).toHaveCount(0);}
const errors=new WeakMap();
test.beforeEach(async({page})=>{const list=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));await page.goto('/?focus=siddhartha');await expect(page.locator('.spine')).toHaveCount(16);});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
test('one tap extracts and opens the letter, then unfolds and returns',async({page})=>{
 await pick(page);await expect(page.locator('.sid-cover')).toHaveAttribute('aria-expanded','false');await expect(page.locator('.sid-letter')).toBeHidden();await expect(page.locator('.sid-cover-front')).toBeVisible();await expect(page.locator('.sid-cover-back')).toBeHidden();
 await openCover(page);await expect(page.locator('.sid-cover-back')).toBeVisible();await expect(page.locator('.sid-letter-pick')).toBeVisible();await expect(page.locator('.sid-letter-reader')).toBeHidden();
 await take(page);await expect(page.locator('.sid-letter-reader')).toBeVisible();await expect(page.locator('.sid-segment')).toHaveCount(1);
 await page.locator('.sid-unfold').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toHaveCount(2);await all(page);await expect(page.locator('.sid-segment')).toHaveCount(3);
 await put(page);await expect(page.locator('.sid-letter')).not.toHaveClass(/is-reading/);await back(page);
});
test('cover follows drag immediately and supports drag in both directions',async({page})=>{
 await pick(page);const cover=page.locator('.sid-cover'),box=await cover.boundingBox();
 await page.mouse.move(box.x+box.width*.8,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x-box.width*.55,box.y+box.height*.5,{steps:12});
 await step(page,'cover-drag');const transform=await cover.evaluate(el=>getComputedStyle(el).transform);expect(transform.startsWith('matrix3d')).toBe(true);
 await page.mouse.up();await step(page,'open');
 const bounds=await cover.boundingBox();await page.mouse.move(bounds.x+bounds.width*.2,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*1.7,bounds.y+bounds.height*.5,{steps:12});await page.mouse.up();await step(page,'held');
 await back(page);
});
test('letter tracks extraction drag and returns to the same dock',async({page})=>{
 await pick(page);await openCover(page);const button=page.locator('.sid-letter-pick'),box=await button.boundingBox(),original=await page.locator('.sid-letter').boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y-150,{steps:12});await step(page,'letter-drag');await page.mouse.up();await step(page,'packet');
 await unfoldFirst(page);await all(page);await put(page);
 const returned=await page.locator('.sid-letter').boundingBox();for(const key of ['x','y','width','height'])expect(Math.abs(returned[key]-original[key])).toBeLessThan(1);
 await back(page);
});
test('write only after unfolding, preserve real text across reload and revisit',async({page})=>{
 await pick(page);await openCover(page);await take(page);await expect(page.locator('.sid-pen')).toHaveCount(0);await all(page);
 await page.getByRole('button',{name:'拿起笔续写'}).tap();await page.getByRole('textbox').fill('留给后来的人：<b>愿你安心</b>');await page.getByRole('button',{name:'留在信上',exact:true}).tap();await step(page,'letter');
 await expect(page.locator('.sid-segment').last()).toContainText('留给后来的人：<b>愿你安心</b>');await expect(page.locator('.sid-segment b')).toHaveCount(0);
 await back(page);await page.reload();await pick(page);await openCover(page);await take(page);await all(page);await expect(page.locator('.sid-segment').last()).toContainText('留给后来的人：<b>愿你安心</b>');await back(page);
});
test('return during motion, repeated input and viewport rotation remain usable',async({page})=>{
 await page.locator('.spine[data-id="siddhartha"]').first().tap();await page.keyboard.press('Escape');await expect(room(page)).toBeHidden();
 await pick(page);await openCover(page);await take(page);await page.locator('.sid-unfold').tap();await page.keyboard.press('Escape');await expect(room(page)).toBeHidden();
 await pick(page);await openCover(page);await page.setViewportSize({width:844,height:390});await take(page);await all(page);await page.getByRole('button',{name:'拿起笔续写'}).tap();await page.setViewportSize({width:390,height:360});await page.getByRole('textbox').fill('旋转和短视口之后仍能续写');await page.getByRole('button',{name:'留在信上',exact:true}).tap();await step(page,'letter');await expect(page.locator('.sid-segment').last()).toContainText('旋转和短视口之后仍能续写');await back(page);
});
test('reduced motion, blocked storage, keyboard and bounds',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Unavailable','QuotaExceededError');};});await page.reload();
 await pick(page);await page.keyboard.press('Enter');await step(page,'open');await take(page);await all(page);
 await page.getByRole('button',{name:'拿起笔续写'}).tap();await page.getByRole('textbox').fill('无法持久保存时仍可操作');await page.getByRole('button',{name:'留在信上',exact:true}).tap();await step(page,'letter');
 const rect=await room(page).boundingBox();expect(rect.x).toBe(0);expect(rect.width).toBeLessThanOrEqual(page.viewportSize().width);await page.keyboard.press('Escape');await expect(room(page)).toBeHidden();await expect(page.locator('#save-warning')).toBeVisible();
});
