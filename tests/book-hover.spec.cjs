const {test,expect}=require('@playwright/test');
async function start(page){await page.goto('/');await page.mouse.move(0,0);}
async function pointAt(page,el){await el.scrollIntoViewIfNeeded();const r=await el.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);}
async function style(el){return el.evaluate(e=>{const s=getComputedStyle(e);return {translate:s.translate,transform:s.transform,filter:s.filter};});}
test('standing book eases outward, hit area stays fixed and leaving returns to rest',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);const book=page.locator('#shelves .painted-standing').first(),face=book.locator('.spine-face');await book.scrollIntoViewIfNeeded();await page.mouse.move(0,0);const box=await book.boundingBox(),before=await style(face);await pointAt(page,face);await expect(book).toHaveClass(/is-book-hover/);await expect.poll(async()=> (await style(face)).translate).toBe('0px -5px');expect(await book.boundingBox()).toEqual(box);expect((await style(face)).filter).toContain('drop-shadow');await page.mouse.move(0,0);await expect(book).not.toHaveClass(/is-book-hover/);await expect.poll(()=>style(face)).toEqual(before);expect(errors).toEqual([]);
});
test('each visible spine in wall and table piles pulls only itself and still opens the selected book',async({page})=>{
 await start(page);
 for(const pile of ['wall-middle','front-left','front-lower','coffee']){
  const group=page.locator('.book-pile[data-pile="'+pile+'"]'),books=group.locator('.pile-book');
  for(const book of await books.all()){
   await group.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForTimeout(260);const face=book.locator('.spine-face'),before=await style(face);await pointAt(page,book.locator('.painted-title'));await expect(page.locator('.is-book-hover')).toHaveCount(1);await expect(book).toHaveClass(/is-book-hover/);await expect.poll(async()=>parseFloat((await style(face)).translate)).toBe(-6);expect((await style(face)).transform).toBe(before.transform);await page.mouse.move(0,0);await expect.poll(()=>style(face)).toEqual(before);
  }
 }
 const chosen=page.locator('.book-pile[data-pile="front-left"] .pile-book').nth(1),id=await chosen.getAttribute('data-id');await pointAt(page,chosen.locator('.painted-title'));await expect(chosen).toHaveClass(/is-book-hover/);const r=await chosen.locator('.painted-title').boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height/2);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book',id);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');await expect(page.locator('.is-book-hover')).toHaveCount(0);
});
test('dragging and reduced motion clear the pull without changing the previous upright cover hover',async({page})=>{
 await start(page);const book=page.locator('#shelves .painted-standing').first();await pointAt(page,book.locator('.spine-face'));await expect(book).toHaveClass(/is-book-hover/);await page.mouse.down();await expect(page.locator('.is-book-hover')).toHaveCount(0);await page.mouse.move(20,60,{steps:6});await page.mouse.up();await page.emulateMedia({reducedMotion:'reduce'});await pointAt(page,book.locator('.spine-face'));await expect(page.locator('.is-book-hover')).toHaveCount(0);expect(await book.locator('.spine-face').evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0s');await page.emulateMedia({reducedMotion:'no-preference'});const cover=page.locator('#display-books [data-id="prince"]');await pointAt(page,cover);await expect.poll(async()=>cover.locator('.spine-face').evaluate(e=>getComputedStyle(e).transform)).toMatch(/, -4\)$/);
});
