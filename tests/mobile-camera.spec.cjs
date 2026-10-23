const {test,expect}=require('./helpers/quiet.cjs');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function enter(page){await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?playtest=rhythm&camera=phone');await page.locator('.room-art').evaluate(e=>e.decode());await page.evaluate(()=>document.fonts.ready);}
async function titlePoint(page,id){
 const selector='.spine[data-id="'+id+'"]';
 const title=page.locator(selector+' .painted-title');
 const element=await title.count()?title:page.locator(selector+' .spine-face');
 await element.scrollIntoViewIfNeeded();const r=await element.boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2};
}
test('first view fits the entire room width and shows both shelves without a horizontal pan',async({page})=>{
 await enter(page);const size=page.viewportSize();test.skip(size.width>600,'Phone portrait composition');
 const world=await page.locator('.room-world').boundingBox();expect(world.x).toBeGreaterThanOrEqual(0);expect(world.x+world.width).toBeLessThanOrEqual(size.width);
 expect(await page.locator('#room-viewport').evaluate(e=>({left:e.scrollLeft,width:e.scrollWidth,client:e.clientWidth}))).toEqual({left:0,width:size.width,client:size.width});
 // Assert the visible objects themselves before any scrollIntoView helper.
 for(const s of ['.spine[data-id="siddhartha"] .spine-face','.spine[data-id="fiscal"] .spine-face','.spine[data-id="cat"] .spine-face','.spine[data-id="sentence"] .painted-title','.spine[data-id="seventh"] .spine-face'])await expect(page.locator(s)).toBeInViewport({ratio:.99});
 await expect(page.getByRole('button',{name:'靠近看书',exact:true})).toHaveCount(0);
 await page.screenshot({path:test.info().outputPath('initial-room.png'),animations:'disabled'});
});
test('each of 34 visible bindings opens that book, including overlapping phone hit targets',async({page})=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
 const ids=await page.locator('.spine').evaluateAll(es=>es.map(e=>e.dataset.id));expect(ids).toHaveLength(34);
 for(const id of ids){const point=await titlePoint(page,id);await page.touchscreen.tap(point.x,point.y);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book',id);await step(page,'held');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');}
 expect(errors).toEqual([]);
});
test('rotation keeps the same reader open and returns to a full-width room',async({page})=>{
 await enter(page);const point=await titlePoint(page,'tao');await page.touchscreen.tap(point.x,point.y);await step(page,'held');await page.locator('.sid-cover').tap();await step(page,'open');
 await page.setViewportSize({width:844,height:390});await step(page,'open');await expect(page.locator('.sid-page')).toBeInViewport({ratio:.99});
 await page.setViewportSize({width:390,height:844});await step(page,'open');await expect(page.locator('.sid-page')).toBeInViewport({ratio:.99});await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 expect(await page.locator('#room-viewport').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 const r=await page.locator('.room-world').boundingBox();expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(390);
 await page.screenshot({path:test.info().outputPath('restored-room.png'),animations:'disabled'});
});
test('safe-area insets fit horizontally and a short screen scrolls to lower books without opening by accident',async({page})=>{
 await enter(page);test.skip(page.viewportSize().width>600,'Phone safe areas');
 await page.evaluate(()=>{const s=document.documentElement.style;s.setProperty('--phone-safe-left','12px');s.setProperty('--phone-safe-right','12px');s.setProperty('--phone-safe-top','24px');s.setProperty('--phone-safe-bottom','20px');});
 // CSS inset changes do not have to resize the camera itself. Trigger a real phone resize.
 await page.setViewportSize({width:375,height:480});
 await expect.poll(async()=>{const r=await page.locator('.room-world').boundingBox();return r.x+r.width;}).toBeLessThanOrEqual(375-12);
 await page.locator('.spine[data-id="seventh"]').scrollIntoViewIfNeeded();await expect(page.locator('.spine[data-id="seventh"] .spine-face')).toBeInViewport({ratio:.99});await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 expect(await page.locator('#room-viewport').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);

});
