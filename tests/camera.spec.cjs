const {test,expect}=require('@playwright/test');
const position=p=>p.locator('#room-viewport').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));
test('croppable room margins keep all scene controls reachable without document overflow',async({page})=>{
 await page.goto('/');await page.locator('.room-art').evaluate(e=>e.decode());
 const before=await page.evaluate(()=>localStorage.getItem('paperbook-v3'));
 const dimensions=await page.locator('.room-canvas').evaluate(e=>{const w=e.querySelector('.room-world');return{canvas:e.getBoundingClientRect().toJSON(),world:w.getBoundingClientRect().toJSON(),pageOverflow:document.documentElement.scrollWidth-innerWidth};});
 expect(dimensions.canvas.width-dimensions.world.width).toBeGreaterThanOrEqual(35);expect(dimensions.pageOverflow).toBe(0);
 for(const selector of ['#change-window','#lamp-pull','#open-music','#touch-bouquet', '.spine[data-id="siddhartha"]','.spine[data-id="cat"]']){
  const target=page.locator(selector);await target.evaluate(e=>e.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
  const box=await target.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width+.1);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height+.1);
  expect(await target.evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height*.65)?.closest('button')===e;})).toBe(true);
 }
 expect(await page.evaluate(()=>localStorage.getItem('paperbook-v3'))).toBe(before);
});
test('two-axis camera dragging cancels source clicks and keeps the viewed place on resize',async({page})=>{
 await page.goto('/');await page.locator('.room-art').evaluate(e=>e.decode());
 const camera=page.locator('#room-viewport');await camera.evaluate(e=>e.scrollTo({left:0,top:0}));
 // Background above the shelf: drag both axes, never picking up a book on release.
 const before=await position(page);await page.mouse.move(130,42);await page.mouse.down();await page.mouse.move(45,15,{steps:10});await page.mouse.up();
 const after=await position(page);if(page.viewportSize().width<500)expect(after.x-before.x).toBeGreaterThan(40);if(page.viewportSize().height<820)expect(after.y-before.y).toBeGreaterThan(15);
 await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(page.locator('dialog[open]')).toHaveCount(0);
 const center=()=>camera.evaluate(e=>{const w=e.querySelector('.room-world'),r=w.getBoundingClientRect(),s=r.width/940;return{x:(innerWidth/2-r.x)/s,y:(innerHeight/2-r.y)/s};});
 await camera.evaluate(e=>e.scrollTo({left:(e.scrollWidth-e.clientWidth)/2,top:(e.scrollHeight-e.clientHeight)/2}));const old=await center();
 // Similar-sized resize has enough crop room to preserve the world coordinate.
 const v=page.viewportSize();await page.setViewportSize({width:v.width+8,height:v.height+8});await page.waitForTimeout(80);const next=await center();
 expect(Math.abs(next.x-old.x)).toBeLessThan(14);expect(Math.abs(next.y-old.y)).toBeLessThan(14);
 await page.setViewportSize({width:390,height:844});await page.locator('#lamp-pull').scrollIntoViewIfNeeded();await page.locator('#lamp-pull').tap();await expect(page.locator('#lamp-pull')).toHaveAttribute('aria-pressed','true');
});
