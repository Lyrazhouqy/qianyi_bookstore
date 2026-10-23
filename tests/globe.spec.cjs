const {test,expect}=require('@playwright/test');
async function setup(page){
 await page.goto('/?playtest=rhythm');const globe=page.locator('#shop-globe');await expect(globe).toHaveAttribute('data-ready','true');await globe.scrollIntoViewIfNeeded();return globe;
}
test('long hold drives globe and release stops; sphere and spindle stay anchored',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const globe=await setup(page);
 await expect(globe).toHaveAttribute('data-map','natural-earth-110m');await page.waitForTimeout(220);await expect(globe).toHaveAttribute('data-angle','0.00000');
 const before=await globe.boundingBox(),center={x:before.x+before.width/2,y:before.y+before.height/2};
 expect(await globe.evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e;})).toBe(true);
 await page.screenshot({path:test.info().outputPath('before.png')});
 await page.mouse.move(center.x,center.y);await page.mouse.down();await expect(globe).toHaveAttribute('data-motion','turning');await page.waitForTimeout(1800);
 const angle=Number(await globe.getAttribute('data-angle'));expect(angle).toBeGreaterThan(.4);expect(angle).toBeLessThan(.85);
 const after=await globe.boundingBox();for(const key of ['x','y','width','height'])expect(after[key]).toBeCloseTo(before[key],2);
 expect(await globe.evaluate(e=>getComputedStyle(e).transform)).toBe('none');
 await page.screenshot({path:test.info().outputPath('holding.png')});
 await page.mouse.up();await expect(globe).toHaveAttribute('data-motion','still');const stopped=await globe.getAttribute('data-angle');await page.waitForTimeout(240);await expect(globe).toHaveAttribute('data-angle',stopped);
 expect(errors).toEqual([]);
});
test('drag cancels the hold; nearby book still opens and keyboard hold releases',async({page})=>{
 const globe=await setup(page),r=await globe.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await expect(globe).toHaveAttribute('data-motion','turning');await page.mouse.move(r.x+r.width/2-18,r.y+r.height/2);await expect(globe).toHaveAttribute('data-motion','still');await page.mouse.up();
 await globe.focus();await page.keyboard.down('Space');await expect(globe).toHaveAttribute('data-motion','turning');await page.waitForTimeout(350);await page.keyboard.up('Space');await expect(globe).toHaveAttribute('data-motion','still');
 const title=page.locator('.spine[data-id="night"] .painted-title');await title.scrollIntoViewIfNeeded();const t=await title.boundingBox();await page.touchscreen.tap(t.x+t.width/2,t.y+t.height/2);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book','night');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');await expect(globe).toHaveAttribute('data-motion','still');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
});
test('reduced motion and offscreen release never leave a spinning globe',async({page})=>{
 const globe=await setup(page);await page.emulateMedia({reducedMotion:'reduce'});await globe.focus();await page.keyboard.down('Space');await page.waitForTimeout(150);await expect(globe).toHaveAttribute('data-motion','still');await expect(globe).toHaveAttribute('data-angle','0.00000');await page.keyboard.up('Space');
 await page.emulateMedia({reducedMotion:'no-preference'});await globe.focus();await page.keyboard.down('Space');await expect(globe).toHaveAttribute('data-motion','turning');await page.setViewportSize({...page.viewportSize(),height:240});await page.locator('#room-viewport').evaluate(e=>{e.scrollLeft=0;e.scrollTop=e.scrollHeight;});await expect(globe).not.toBeInViewport();await expect(globe).toHaveAttribute('data-motion','still');await page.keyboard.up('Space');
});
test('unavailable map leaves the original globe intact without a dead touch target',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/globe-land-natural-earth-110m.json',route=>route.fulfill({status:503,body:'Unavailable'}));await page.goto('/?playtest=rhythm');await expect(page.locator('#shop-globe')).toHaveCount(0);await expect(page.locator('.room-art')).toBeVisible();expect(errors).toEqual([]);
});
test('one touch tap spins longer, repeat taps extend once, and then stays still',async({page})=>{
 const globe=await setup(page);await globe.tap();await expect(globe).toHaveAttribute('data-motion','turning');await page.waitForTimeout(800);const angle=Number(await globe.getAttribute('data-angle'));expect(angle).toBeGreaterThan(.15);
 await globe.tap();await expect(globe).toHaveAttribute('data-motion','turning');await page.waitForTimeout(3500);await expect(globe).toHaveAttribute('data-motion','turning');await expect(globe).toHaveAttribute('data-motion','still',{timeout:6000});const stopped=await globe.getAttribute('data-angle');await page.waitForTimeout(300);await expect(globe).toHaveAttribute('data-angle',stopped);
});
test('tap spin cancels when leaving view and never resumes after returning',async({page})=>{
 const globe=await setup(page);await globe.tap();await expect(globe).toHaveAttribute('data-motion','turning');await page.setViewportSize({...page.viewportSize(),height:240});await page.locator('#room-viewport').evaluate(e=>{e.scrollLeft=0;e.scrollTop=e.scrollHeight;});await expect(globe).not.toBeInViewport();await expect(globe).toHaveAttribute('data-motion','still');const stopped=await globe.getAttribute('data-angle');await globe.scrollIntoViewIfNeeded();await page.waitForTimeout(200);await expect(globe).toHaveAttribute('data-angle',stopped);
 await globe.focus();await page.keyboard.press('Enter');await expect(globe).toHaveAttribute('data-motion','turning');await page.emulateMedia({reducedMotion:'reduce'});await expect(globe).toHaveAttribute('data-motion','still');
});
