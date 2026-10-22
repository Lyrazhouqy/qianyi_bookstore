const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);

test('cloth fronts do not stretch side-view sprites or leave clipped corners',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?v=0.14.0&playtest=rhythm');
 for(const id of ['tao','questions','naval','bigtech','japan']){
  const button=page.locator('.spine[data-id="'+id+'"]');await button.scrollIntoViewIfNeeded();
  await button.press('Enter');await step(page,'held');
  const face=page.locator('.sid-cover-front');
  const result=await face.evaluate(el=>{const s=getComputedStyle(el),title=el.querySelector('.sid-cover-title').getBoundingClientRect(),mark=el.querySelector('.sid-cover-mark').getBoundingClientRect(),r=el.getBoundingClientRect();return {clip:s.clipPath,background:s.backgroundImage,material:el.closest('.siddhartha-room').dataset.coverMaterial,font:getComputedStyle(el.querySelector('.sid-cover-title')).fontFamily,mark:mark.toJSON(),title:title.toJSON(),face:r.toJSON()};});
  expect(result.material).toBe('cloth');expect(result.clip).toBe('none');
  expect(result.background).not.toMatch(/spine|book-arrangement/);
  expect(result.font).toContain('BookTitleSerif');
  expect(Math.abs(result.mark.width-result.mark.height)).toBeLessThan(1);
  expect(result.title.bottom).toBeLessThan(result.mark.top);
  for(const part of [result.title,result.mark]){expect(part.left).toBeGreaterThan(result.face.left+5);expect(part.right).toBeLessThan(result.face.right-5);}
  if(id==='tao')await page.screenshot({path:test.info().outputPath('tao-front.png'),animations:'disabled'});
  await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 }
 // The actual full-front illustrations are still the original assets.
 await page.locator('.spine[data-id="prince"]').scrollIntoViewIfNeeded();await page.locator('.spine[data-id="prince"]').press('Enter');await step(page,'held');
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-cover-art','true');
 expect(await page.locator('.sid-cover-front').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('simple-book-icons-v0118.png');
});

async function captureFlight(page,id,returning=false){
 return page.evaluate(async({id,returning})=>{
  const source=document.querySelector('.spine[data-id="'+id+'"]'),origin=source.querySelector('.spine-face').getBoundingClientRect().toJSON();
  if(returning)document.querySelector('.sid-return').click();else source.click();
  const room=document.querySelector('.siddhartha-room'),carrier=room.querySelector('.sid-carrier'),frames=[];
  function sample(){const m=new DOMMatrix(getComputedStyle(carrier).transform),r=room.querySelector('.sid-cover-front').getBoundingClientRect();frames.push({at:performance.now(),step:room.dataset.step,model:room.dataset.flightModel,scales:[Math.hypot(m.m11,m.m12,m.m13),Math.hypot(m.m21,m.m22,m.m23),Math.hypot(m.m31,m.m32,m.m33)],xAxisAngle:Math.atan2(m.m12,m.m11)*180/Math.PI,rect:r.toJSON()});}
  sample();await new Promise(resolve=>{function tick(){sample();if(returning?room.hidden:room.dataset.step==='held')resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
  return {origin,frames};
 },{id,returning});
}

test('horizontal books pull clear and rotate as rigid bindings, with the pile settling and lifting on return',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?v=0.14.0&playtest=rhythm');
 for(const id of ['japan','solitude','weeks','altay']){
  const button=page.locator('.spine[data-id="'+id+'"]');await button.scrollIntoViewIfNeeded();
  const upper=button.locator('..').locator('.pile-book').first();const piled=await button.evaluate(e=>e.classList.contains('pile-book'));
  const oldUpper=piled?(await upper.boundingBox()).y:null;
  const pickup=await captureFlight(page,id);await step(page,'held');
  const first=pickup.frames[0];expect(first.model).toBe('rigid-flat');
  for(const key of ['x','y','width','height'])expect(Math.abs(first.rect[key]-pickup.origin[key])).toBeLessThan(5);
  expect(Math.abs(first.xAxisAngle+90)).toBeLessThan(1);
  const pickupFrames=pickup.frames.filter(f=>f.step==='picking');expect(pickupFrames.length).toBeGreaterThan(8);
  for(const f of pickupFrames){expect(Math.max(...f.scales)-Math.min(...f.scales)).toBeLessThan(.0001);}
  expect(pickupFrames.some(f=>f.xAxisAngle>-65&&f.xAxisAngle<-20)).toBe(true);
  if(piled)expect((await upper.boundingBox()).y-oldUpper).toBeGreaterThan(4);
  if(id==='japan')await page.screenshot({path:test.info().outputPath('stack-held.png')});
  const returning=await captureFlight(page,id,true);await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
  const returnFrames=returning.frames.filter(f=>f.step==='returning');expect(returnFrames.length).toBeGreaterThan(8);
  for(const f of returnFrames)expect(Math.max(...f.scales)-Math.min(...f.scales)).toBeLessThan(.0001);
  const last=returnFrames.at(-1);for(const key of ['x','y','width','height'])expect(Math.abs(last.rect[key]-pickup.origin[key])).toBeLessThan(5);
  if(piled)expect(Math.abs((await upper.boundingBox()).y-oldUpper)).toBeLessThan(1);
  await expect(button).not.toHaveClass(/is-out/);
  await test.info().attach(id+'-rigid-frames',{body:JSON.stringify({pickup,returning}),contentType:'application/json'});
 }
 expect(errors).toEqual([]);
});

test('reduced motion and rotation during flat pickup leave a usable book and no pile offset',async({page})=>{
 await page.goto('/');const button=page.locator('.spine[data-id="japan"]');await button.scrollIntoViewIfNeeded();
 await button.press('Enter');await page.setViewportSize({width:844,height:390});await step(page,'held');
 await page.locator('.sid-cover').click();await step(page,'open');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await expect(page.locator('.is-out')).toHaveCount(0);
 expect(await page.locator('.pile-book').evaluateAll(es=>es.filter(e=>e.style.translate).length)).toBe(0);
 await page.emulateMedia({reducedMotion:'reduce'});await button.press('Enter');await step(page,'held');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
});
