const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function setup(p,{motion=true,long=false}={}){
 await p.emulateMedia({reducedMotion:motion?'no-preference':'reduce'});
 await p.route('**/real-materials.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BookRealMaterials=()=>({});'}));
 await p.addInitScript(long=>{if(localStorage.getItem('feel-fixture'))return;localStorage.setItem('feel-fixture','yes');localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{naval:[{id:'feel-note',kind:'stack',author:'N',authorName:'测试书友',date:'2025-02-27',front:long?'【隔离测试】这是一张长便笺，用来检查上下阅读不会误触收回。'.repeat(34):'【隔离测试】今天在书店，遇见一张意外留下的纸。',stock:'cream',replies:[]}]}}));},long);
 await p.goto('/?v=0.14.5&playtest=rhythm');
}
async function open(p,id='naval'){await p.locator('.spine[data-id="'+id+'"]').tap();await step(p,'held');await p.locator('.sid-cover').tap();await step(p,'open');}
async function take(p){await p.locator('.sid-letter-pick').tap();await step(p,'letter');}
async function swipe(p,dx,dy=0){const r=await p.locator('.sid-letter-reader').boundingBox(),x=r.x+Math.min(28,r.width*.2),y=r.y+Math.min(83,r.height*.35);await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dy,{steps:8});await p.mouse.up();}
test('a first discovery visibly lifts and unfolds; one paper corner tucks it back in a single short transition',async({page})=>{
 await setup(page);await open(page);
 const trace=await page.evaluate(async()=>{const room=document.querySelector('.siddhartha-room'),paper=document.querySelector('.sid-letter'),start=performance.now(),frames=[];document.querySelector('.sid-letter-pick').click();await new Promise(resolve=>{function frame(){frames.push({at:performance.now()-start,step:room.dataset.step,discovering:paper.classList.contains('sid-discovering'),flap:!!paper.querySelector('.sid-opening-flap'),width:paper.getBoundingClientRect().width});if(room.dataset.step==='letter')resolve();else requestAnimationFrame(frame);}requestAnimationFrame(frame);});return {elapsed:performance.now()-start,frames};});
 expect(trace.frames.some(x=>x.step==='pulling-letter'&&x.discovering)).toBe(true);expect(trace.frames.some(x=>x.step==='unfolding'&&x.flap)).toBe(true);expect(trace.elapsed).toBeLessThan(1000);
 const unfolding=trace.frames.filter(x=>x.step==='unfolding');expect(Math.max(...unfolding.map(x=>x.width))-Math.min(...unfolding.map(x=>x.width))).toBeLessThan(1);
 const corner=page.locator('.sid-paper-return');await expect(corner).toBeInViewport();const b=await corner.boundingBox();expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);await expect(page.locator('.sid-letter-reader')).not.toContainText('折好，放回夹页');
 await page.screenshot({path:test.info().outputPath('paper-corner.png'),animations:'disabled'});
 const elapsed=await page.evaluate(async()=>{const start=performance.now(),room=document.querySelector('.siddhartha-room');document.querySelector('.sid-paper-return').click();await new Promise(resolve=>{const o=new MutationObserver(()=>{if(room.dataset.step==='open'){o.disconnect();resolve();}});o.observe(room,{attributes:true,attributeFilter:['data-step']});});return performance.now()-start;});expect(elapsed).toBeLessThan(450);await expect(page.locator('.sid-returning-sheet')).toHaveCount(0);await expect(page.locator('.sid-letter-pick')).toBeVisible();
 test.info().annotations.push({type:'motion-ms',description:JSON.stringify({open:Math.round(trace.elapsed),return:Math.round(elapsed)})});
});
test('right swipe returns the paper; short or vertical movements leave it readable without selecting text',async({page})=>{
 await setup(page);await open(page);await take(page);await swipe(page,14);await step(page,'letter');await expect(page.locator('.sid-letter')).not.toHaveClass(/sid-sheet-dragging/);
 await swipe(page,7,48);await step(page,'letter');await swipe(page,80);await step(page,'open');expect(await page.evaluate(()=>getSelection().toString())).toBe('');await expect(page.locator('.sid-returning-sheet')).toHaveCount(0);
});
test('reply corner and swipe preserve a draft, never publish it, and restore it on the next pickup',async({page})=>{
 await setup(page,{motion:false});await open(page);await take(page);
 for(const mode of ['corner','swipe','corner-drag']){await page.locator('[data-sid="write"]').tap();await page.locator('#sid-reply').fill('尚未寄出的草稿 '+mode);await expect(page.locator('[data-sid="save"]')).toBeInViewport({ratio:.95});await expect(page.locator('.sid-paper-return')).toHaveAttribute('aria-label','收起草稿');if(mode==='corner')await page.locator('.sid-paper-return').tap();else if(mode==='corner-drag'){const b=await page.locator('.sid-paper-return').boundingBox();await page.mouse.move(b.x+25,b.y+17);await page.mouse.down();await page.mouse.move(b.x-25,b.y+42,{steps:8});await page.mouse.up();}else await swipe(page,80);await step(page,'open');
 const state=await page.evaluate(()=>({draft:JSON.parse(localStorage.getItem('paperbook-secret-drafts-v1'))['reply:naval:feel-note'].text,replies:JSON.parse(localStorage.getItem('paperbook-secrets-v1')).books.naval[0].replies}));expect(state.draft).toBe('尚未寄出的草稿 '+mode);expect(state.replies).toEqual([]);await take(page);await page.locator('[data-sid="write"]').tap();await expect(page.locator('#sid-reply')).toHaveValue('尚未寄出的草稿 '+mode);await page.locator('[data-sid="cancel"]').tap();}
 await page.reload();await open(page);await take(page);await page.locator('[data-sid="write"]').tap();await expect(page.locator('#sid-reply')).toHaveValue('尚未寄出的草稿 corner-drag');
 await page.screenshot({path:test.info().outputPath('reply-corner.png'),animations:'disabled'});
});
test('a long note scrolls independently and its return corner stays accessible',async({page})=>{
 await setup(page,{long:true,motion:false});await open(page);await take(page);const reader=page.locator('.sid-letter-reader');expect(await reader.evaluate(e=>e.scrollHeight>e.clientHeight+50)).toBe(true);await reader.evaluate(e=>{e.scrollTop=140;});expect(await reader.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await expect(page.locator('.sid-paper-return')).toBeInViewport();await page.locator('.sid-paper-return').tap();await step(page,'open');
});
test('postcard swipes follow the card, flip left, tuck right, and a cancelled hold restores the surface',async({page})=>{
 await setup(page);await open(page,'prince');await take(page);await expect(page.locator('.sid-postcard-picture')).toBeVisible();await swipe(page,-90);await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('收件人：下一位读者');
 await swipe(page,90);await step(page,'open');await take(page);const r=await page.locator('.sid-letter-reader').boundingBox();await page.mouse.move(r.x+30,r.y+82);await page.mouse.down();await page.mouse.move(r.x+75,r.y+82,{steps:5});await page.locator('.sid-letter').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',clientX:r.x+75,clientY:r.y+82});await page.mouse.up();await step(page,'letter');await expect(page.locator('.sid-letter')).not.toHaveClass(/sid-sheet-dragging/);expect(await page.locator('.sid-letter').evaluate(e=>e.style.translate)).toBe('');await page.locator('.sid-paper-return').tap();await step(page,'open');
});
test('a descendant losing implicit pointer capture does not cancel the sheet handoff',async({page})=>{
 await setup(page);await open(page);await take(page);const r=await page.locator('.sid-letter-reader').boundingBox();
 await page.mouse.move(r.x+25,r.y+75);await page.mouse.down();await page.mouse.move(r.x+45,r.y+75,{steps:3});
 await page.locator('.sid-segment small').first().dispatchEvent('lostpointercapture',{pointerId:1,pointerType:'touch',bubbles:true});
 await page.mouse.move(r.x+108,r.y+75,{steps:6});await page.mouse.up();await step(page,'open');
});
