const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function enter(p,motion=false){await p.emulateMedia({reducedMotion:motion?'no-preference':'reduce'});await p.addInitScript(()=>localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{},baseline:{},changes:{tao:true,japan:true},visit:{id:'peek-qa',seed:1,lastActive:1,draws:{},events:[]}})));await p.goto('/?playtest=rhythm');}
async function pick(p,id){await p.locator('#open-book-index').tap();await p.locator('[data-book="'+id+'"]').tap();await step(p,'held');}
async function back(p){await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');}
test('paper is a small tucked corner inside the book face and leaves no tag on the empty shelf',async({page})=>{
 await enter(page);const source=page.locator('.spine[data-id="tao"]'),peek=source.locator('.spine-face > .book-paper-peek');await expect(source).toHaveClass(/has-new-paper/);await expect(peek).toBeVisible();
 const shape=await peek.evaluate(e=>{const r=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect(),s=getComputedStyle(e),ghost=getComputedStyle(e.closest('.spine'),'::after');return{width:r.width/b.width,height:r.height/b.height,pointer:s.pointerEvents,ghost:ghost.content};});
 expect(shape.width).toBeLessThan(.4);expect(shape.height).toBeLessThan(.15);expect(shape.pointer).toBe('none');expect(['none','normal']).toContain(shape.ghost);
 await page.screenshot({path:test.info().outputPath('shelf-corner.png'),animations:'disabled'});await pick(page,'tao');await expect(peek).toBeHidden();await expect(page.locator('.sid-carrier > .book-paper-peek')).toBeVisible();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-insert-peek','true');
 const paper=await page.locator('.sid-carrier > .book-paper-peek').boundingBox(),book=await page.locator('.sid-cover-front').boundingBox();expect(paper.x).toBeGreaterThan(book.x);expect(paper.x+paper.width).toBeLessThan(book.x+book.width);expect(paper.y).toBeLessThan(book.y+6);expect(paper.y+paper.height).toBeGreaterThan(book.y);
 await page.screenshot({path:test.info().outputPath('held-corner.png'),animations:'disabled'});await back(page);await expect(peek).toBeVisible();await expect(source).not.toHaveClass(/is-out/);
});
test('the corner travels with upright and stacked books and yields to the real loose paper on opening',async({page})=>{
 await enter(page,true);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const id of ['tao','japan']){
  await pick(page,id);const peek=page.locator('.sid-carrier > .book-paper-peek');await expect(peek).toBeVisible();
  const frames=await page.evaluate(async()=>{const carrier=document.querySelector('.sid-carrier'),peek=carrier.querySelector(':scope > .book-paper-peek'),frames=[];document.querySelector('.sid-cover').click();await new Promise(resolve=>{function sample(){frames.push({parent:peek.parentElement===carrier,opacity:Number(getComputedStyle(peek).opacity),step:document.querySelector('.siddhartha-room').dataset.step});if(frames.at(-1).step==='open')resolve();else requestAnimationFrame(sample);}requestAnimationFrame(sample);});return frames;});
  expect(frames.length).toBeGreaterThan(3);expect(frames.every(x=>x.parent)).toBe(true);expect(frames.at(-1).opacity).toBe(0);await expect(page.locator('.sid-letter-pick')).toBeVisible();await expect(page.locator('.sid-create-pen')).toBeVisible();await back(page);
  const source=page.locator('.spine[data-id="'+id+'"]');expect(await source.locator('.book-paper-peek').evaluate(e=>getComputedStyle(e).display==='block')).toBe(await source.evaluate(e=>e.classList.contains('has-new-paper')));
 }
 expect(errors).toEqual([]);
});
test('holding and opening does not mark paper read, and books without a cue inherit no leftover corner',async({page})=>{
 await enter(page);await pick(page,'tao');await page.locator('.sid-cover').tap();await step(page,'open');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secret-reading-v1'))?.books.tao?.items||{})).toEqual({});await back(page);
 await pick(page,'cat');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-insert-peek','false');await expect(page.locator('.sid-carrier > .book-paper-peek')).toBeHidden();await page.locator('.sid-cover').tap();await step(page,'open');await expect(page.locator('.sid-letter-pick')).toBeVisible();await back(page);
});
