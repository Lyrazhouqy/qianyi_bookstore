const {test,expect}=require('@playwright/test');
test.use({isMobile:false,hasTouch:false,viewport:{width:1280,height:900}});
async function setup(page){await page.goto('/?playtest=rhythm');const globe=page.locator('#shop-globe');await expect(globe).toHaveAttribute('data-ready','true');await globe.scrollIntoViewIfNeeded();return globe;}
test('mouse hover drives anchored globe without clicking and leaving settles',async({page})=>{
 const globe=await setup(page),before=await globe.boundingBox();await globe.hover();await expect(globe).toHaveAttribute('data-motion','turning');await page.waitForTimeout(450);expect(Number(await globe.getAttribute('data-angle'))).toBeGreaterThan(.05);expect(await globe.boundingBox()).toEqual(before);
 await page.mouse.move(1,1);await expect(globe).toHaveAttribute('data-motion','still');const stopped=await globe.getAttribute('data-angle');await page.waitForTimeout(180);await expect(globe).toHaveAttribute('data-angle',stopped);
});
test('mouse click does not schedule a touch spin after leaving',async({page})=>{
 const globe=await setup(page);await globe.click();await expect(globe).toHaveAttribute('data-motion','turning');await page.mouse.move(1,1);await expect(globe).toHaveAttribute('data-motion','still');const stopped=await globe.getAttribute('data-angle');await page.waitForTimeout(180);await expect(globe).toHaveAttribute('data-angle',stopped);
});
test('offscreen cancels hover and returning needs a fresh hover',async({page})=>{
 await page.setViewportSize({width:1280,height:400});const globe=await setup(page);await globe.hover();await expect(globe).toHaveAttribute('data-motion','turning');await page.locator('#room-viewport').evaluate(e=>{e.scrollTop=e.scrollHeight;});await expect(globe).not.toBeInViewport();await expect(globe).toHaveAttribute('data-motion','still');await page.mouse.move(1,1);await globe.scrollIntoViewIfNeeded();await globe.hover();await expect(globe).toHaveAttribute('data-motion','turning');await page.emulateMedia({reducedMotion:'reduce'});await expect(globe).toHaveAttribute('data-motion','still');
});
