const {test,expect}=require('@playwright/test');
test('game scene has sixteen reachable, separate touch targets and no page chrome',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('.room-art').evaluate(img=>img.decode());await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.spine')).toHaveCount(16);const headingBox=await page.getByRole('heading',{name:'纸间书店'}).locator('..').boundingBox();expect(headingBox.width).toBeLessThanOrEqual(1);expect(headingBox.height).toBeLessThanOrEqual(1);await expect(page.locator('.room-dock,.shop-header,.shelf-heading')).toHaveCount(0);
 const data=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,bodyScroll:scrollY,camera:document.querySelector('.game-camera').getBoundingClientRect().toJSON(),books:[...document.querySelectorAll('.spine')].map(el=>{const face=el.firstElementChild,r=el.getBoundingClientRect(),f=face.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(face);const text=range.getBoundingClientRect();return {display:el.classList.contains('display-book'),id:el.dataset.id,row:el.parentElement.className,r:r.toJSON(),cssWidth:parseFloat(getComputedStyle(el).width),font:parseFloat(getComputedStyle(face).fontSize),textInside:text.top>=f.top&&text.bottom<=f.bottom,textColumns:text.width/parseFloat(getComputedStyle(face).fontSize)};})}));
 expect(data.overflow).toBeLessThanOrEqual(1);expect(data.bodyScroll).toBe(0);expect(Math.round(data.camera.height)).toBe(page.viewportSize().height);expect(new Set(data.books.map(b=>b.id)).size).toBe(16);
 for(const b of data.books){expect(b.cssWidth).toBeGreaterThanOrEqual(44);expect(Math.round(b.r.width*1000)/1000).toBeGreaterThanOrEqual(44);expect(b.r.height).toBeGreaterThanOrEqual(44);if(!b.display){expect(b.font).toBeGreaterThanOrEqual(12);expect(b.textInside).toBe(true);expect(b.textColumns).toBeLessThan(1.5);}expect(b.r.x).toBeGreaterThanOrEqual(0);expect(b.r.right).toBeLessThanOrEqual(page.viewportSize().width);}
 for(let i=0;i<data.books.length;i++)for(let j=i+1;j<data.books.length;j++){const a=data.books[i],b=data.books[j];if(a.row===b.row)expect(Math.min(a.r.right,b.r.right)-Math.max(a.r.x,b.r.x)).toBeLessThanOrEqual(.1);}
 for(const book of await page.locator('.spine').all()){
  await book.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  expect(await book.evaluate(el=>{const r=el.getBoundingClientRect();return [[r.left+2,r.top+3],[r.right-2,r.top+r.height/2],[r.left+r.width/2,r.bottom-3]].every(([x,y])=>document.elementFromPoint(x,y)?.closest('.spine')===el);})).toBe(true);
 }
 expect(errors).toEqual([]);
});
test('scene objects keep catalogue, real records and saved clue mode connected',async({page})=>{
 await page.goto('/');const sid=page.locator('.spine[data-id="siddhartha"]');let r=await sid.boundingBox();await page.touchscreen.tap(r.x+3,r.y+4);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await page.locator('#open-book-index').tap();await expect(page.locator('.catalogue-book')).toHaveCount(16);await page.keyboard.press('Escape');await expect(page.locator('#open-book-index')).toBeFocused();
 await page.locator('#open-book-index').tap();await page.locator('[data-book="siddhartha"]').tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(page.locator('.is-out')).toHaveCount(0);
 await page.getByRole('button',{name:'书店手记',exact:true}).tap();await expect(page.locator('#journal-summary')).toContainText('2 次旧书');await page.getByRole('button',{name:'密集对照'}).tap();await page.getByRole('button',{name:'收起书店手记'}).tap();
 await page.reload();await page.getByRole('button',{name:'书店手记',exact:true}).tap();await expect(page.getByRole('button',{name:'密集对照'})).toHaveAttribute('aria-pressed','true');
});
