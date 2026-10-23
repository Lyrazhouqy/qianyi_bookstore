const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const scenes=[['original','树影','.window-leaf','.window-tree-breeze'],['rain','雨后山色','.window-ripple','.window-river-ripples'],['nightSnow','雪夜','.window-snowflake','.window-snowfall']];
async function choose(page,name,id){
 await page.locator('#change-window').scrollIntoViewIfNeeded();await page.getByRole('button',{name:'更换窗外风景',exact:true}).tap();
 await page.getByRole('button',{name,exact:true}).tap();await expect(page.locator('#change-window')).toHaveAttribute('data-scenery',id);
 await page.getByRole('button',{name:'收起窗外风景',exact:true}).tap();
}
const motion=(page,selector)=>page.locator(selector).first().evaluate(e=>({transform:getComputedStyle(e).transform,play:getComputedStyle(e).animationPlayState,name:getComputedStyle(e).animationName}));
test.beforeEach(async({page})=>{await page.goto('/?playtest=rhythm&window=quiet-v2');await page.locator('.room-art').evaluate(e=>e.decode());});
test('each remaining scene has gentle movement, pauses offscreen and while reading, and stays inside the glass',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});const progress=await page.evaluate(()=>localStorage.getItem('paperbook-v3'));
 for(const [id,name,selector,layer] of scenes){
  await choose(page,name,id);await expect(page.locator('#change-window')).toHaveAttribute('data-snow-visible','true');
  const first=await motion(page,selector);expect(first.play).toBe('running');
  await expect.poll(async()=>(await motion(page,selector)).transform).not.toBe(first.transform);
  expect(await page.locator(layer).evaluate(e=>e.parentElement.getAttribute('clip-path'))).toBe('url(#window-glass)');
  for(const [otherId,,otherSelector,otherLayer] of scenes)if(otherId!==id){expect((await motion(page,otherSelector)).play).toBe('paused');await expect(page.locator(otherLayer)).toHaveCSS('opacity','0');}
  await page.locator('#change-window').screenshot({path:test.info().outputPath(id+'-moving.png'),animations:'allow'});
  const originalViewport=page.viewportSize();
  // Overview fits the room on tall phones. Use a genuinely short camera to test leaving view.
  await page.setViewportSize({...originalViewport,height:240});
  await page.locator('#room-viewport').evaluate(e=>e.scrollTo({left:e.scrollWidth,top:e.scrollHeight,behavior:'instant'}));
  await expect(page.locator('#change-window')).toHaveAttribute('data-snow-visible','false');const paused=await motion(page,selector);expect(paused.play).toBe('paused');
  await page.waitForTimeout(120);expect((await motion(page,selector)).transform).toBe(paused.transform);
  await page.setViewportSize(originalViewport);
  await page.locator('#change-window').scrollIntoViewIfNeeded();await expect.poll(async()=>(await motion(page,selector)).play).toBe('running');
 }
 expect(await page.evaluate(()=>localStorage.getItem('paperbook-v3'))).toBe(progress);
 await choose(page,'树影','original');await page.locator('#open-book-index').tap();await page.locator('[data-book="naval"]').tap();
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');expect((await motion(page,'.window-leaf')).play).toBe('paused');
 await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await choose(page,'雨后山色','rain');await page.locator('#open-book-index').tap();await page.locator('[data-book="naval"]').tap();
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');expect((await motion(page,'.window-ripple')).play).toBe('paused');
});
test('only three presets and upload remain; reduced motion is static and custom photos receive no ambient overlay',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [id,name,selector] of scenes){await choose(page,name,id);expect((await motion(page,selector)).name).toBe('none');const still=(await motion(page,selector)).transform;await page.waitForTimeout(100);expect((await motion(page,selector)).transform).toBe(still);}
 await page.getByRole('button',{name:'更换窗外风景',exact:true}).tap();
 expect(await page.locator('[data-window-scene]').evaluateAll(es=>es.map(e=>e.dataset.windowScene))).toEqual(['original','rain','nightSnow','custom']);
 for(const name of ['晚霞','海风','初雪'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
 await page.screenshot({path:test.info().outputPath('three-choices.png'),animations:'disabled'});
 await page.locator('#window-file').setInputFiles('assets/scene/window-original-flat-v01415.png');await expect(page.locator('#change-window')).toHaveAttribute('data-scenery','custom');
 // With animation:none, the shorthand resets computed play-state to running
 // even though nothing animates. Check inactive playback in normal motion.
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(const [,,selector,layer] of scenes){expect((await motion(page,selector)).play).toBe('paused');await expect(page.locator(layer)).toHaveCSS('opacity','0');}
});
test('retired scenery migrates without losing a saved photo or changing reading progress',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const photo='data:image/png;base64,'+fs.readFileSync('assets/scene/window-original-flat-v01415.png').toString('base64');
 const progress=await page.evaluate(()=>localStorage.getItem('paperbook-v3'));
 for(const scene of ['seaside','sunset','snow']){
  await page.evaluate(({scene,photo})=>localStorage.setItem('paperbook-window-v1',JSON.stringify({scene,custom:photo})),{scene,photo});await page.reload();
  await expect(page.locator('#change-window')).toHaveAttribute('data-scenery',/^(original|rain|nightSnow|custom)$/);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-window-v1')).custom)).toBe(photo);
  expect(await page.evaluate(()=>localStorage.getItem('paperbook-v3'))).toBe(progress);
 }
});
