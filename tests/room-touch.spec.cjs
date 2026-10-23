const {test,expect}=require('./helpers/quiet.cjs');
const readStep=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
const visual=e=>e.evaluate(el=>{const s=getComputedStyle(el);return {translate:s.translate,transform:s.transform,rotate:s.rotate};});
async function enter(page){await page.goto('/?playtest=rhythm&touch=feedback');await page.evaluate(()=>{window.touchErrors=[];addEventListener('error',e=>touchErrors.push(e.message));});}
async function target(page,selector){const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();const part=el.locator('.painted-title').first();const r=await (await part.count()?part:el).boundingBox();return {el,x:r.x+r.width/2,y:r.y+(selector==='#touch-bouquet'?Math.min(8,r.height*.12):r.height/2)};}
async function pointer(page,el,type,x,y){await el.dispatchEvent(type,{pointerType:'touch',pointerId:41,isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y,bubbles:true});}
test('press moves the visible book without moving its target; cancelling or dragging never opens it',async({page},info)=>{
 await enter(page);const {el,x,y}=await target(page,'#shelves .painted-standing');const face=el.locator('.spine-face'),rect=await el.boundingBox(),base=await visual(face);
 await pointer(page,el,'pointerdown',x,y);await expect(el).toHaveClass(/is-touch-press/);await expect.poll(()=>visual(face)).not.toEqual(base);expect(await el.boundingBox()).toEqual(rect);await page.screenshot({path:info.outputPath('book-pressed.png')});
 await pointer(page,el,'pointermove',x,y+35);await expect(el).not.toHaveClass(/is-touch-press/);await pointer(page,el,'pointerup',x,y+35);await el.dispatchEvent('click',{detail:1,clientX:x,clientY:y+35});await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await pointer(page,el,'pointerdown',x,y);await pointer(page,el,'pointercancel',x,y);await el.dispatchEvent('click',{detail:1,clientX:x,clientY:y});await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 {const t=await target(page,await el.evaluate(e=>e.matches('.spine')?'[data-id="'+e.dataset.id+'"]':e.id?'#'+e.id:'.wall-note'));await page.touchscreen.tap(t.x,t.y);}await readStep(page,'held');expect(await page.evaluate(()=>touchErrors)).toEqual([]);
});
test('a single real tap still opens windows, wall diary and both flower entries',async({page})=>{
 await enter(page);
 for(const [selector,sheet] of [['#change-window','#window-settings'],['.wall-note','#shop-journal'],['#touch-bouquet','#bouquet-settings'],['#change-bouquet','#bouquet-settings']]){
  const {el,x,y}=await target(page,selector);await pointer(page,el,'pointerdown',x,y);
  if(selector==='#change-window')await expect.poll(()=>el.locator('.window-latch-lever').evaluate(e=>getComputedStyle(e).rotate)).not.toBe('none');
  if(selector==='.wall-note')await expect.poll(()=>el.locator('.wall-note-paper').getAttribute('transform')).not.toBe('rotate(0.0000 207 615)');
  await pointer(page,el,'pointercancel',x,y);{const t=await target(page,await el.evaluate(e=>e.matches('.spine')?'[data-id="'+e.dataset.id+'"]':e.id?'#'+e.id:'.wall-note'));await page.touchscreen.tap(t.x,t.y);}await expect(page.locator(sheet)).toBeVisible();await expect(page.locator('.is-touch-press,.is-touch-cue')).toHaveCount(0);await page.locator(sheet+' [data-close-sheet]').tap();await expect(page.locator(sheet)).toBeHidden();
 }
});
test('discovery cues are visible, staggered, once per family and paused during reading',async({page},info)=>{
 await enter(page);await page.bringToFront();await page.evaluate(()=>{
  window.cueLog=[];const states=new WeakMap();new MutationObserver(ms=>{for(const m of ms){const e=m.target;const playing=e.classList.contains('is-touch-cue');if(playing&&!states.get(e))cueLog.push({kind:e.dataset.touchCueKind,at:performance.now(),active:document.querySelectorAll('.is-touch-cue').length});states.set(e,playing);}}).observe(document.querySelector('.room-world'),{subtree:true,attributes:true,attributeFilter:['class']});
 });const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 await expect.poll(()=>page.locator('.is-touch-cue').count(),{timeout:7000}).toBe(1);const cue=page.locator('.is-touch-cue');const kind=await cue.getAttribute('data-touch-cue-kind');expect(['book','window','lamp','wall']).toContain(kind);
 await expect.poll(()=>cue.locator('.spine-face').evaluateAll(es=>es.some(e=>getComputedStyle(e).animationName!=='none'))).toBe(true);await page.screenshot({path:info.outputPath('discovery.png')});
 await expect.poll(()=>page.evaluate(()=>new Set(cueLog.map(x=>x.kind)).size),{timeout:24000}).toBe(4);
 const log=await page.evaluate(()=>cueLog);expect(log.every(x=>x.active===1)).toBe(true);expect(new Set(log.map(x=>x.kind)).size).toBe(4);expect(log.length).toBe(4);expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(before);
 const {el}=await target(page,'#shelves .painted-standing');{const t=await target(page,await el.evaluate(e=>e.matches('.spine')?'[data-id="'+e.dataset.id+'"]':e.id?'#'+e.id:'.wall-note'));await page.touchscreen.tap(t.x,t.y);}await readStep(page,'held');await expect(page.locator('.is-touch-cue')).toHaveCount(0);await page.waitForTimeout(1800);await expect(page.locator('.is-touch-cue')).toHaveCount(0);
});
test('reduced motion gives no discovery loop or object displacement; lamp tap still switches once',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await enter(page);await page.waitForTimeout(1700);await expect(page.locator('.is-touch-cue')).toHaveCount(0);
 const {el,x,y}=await target(page,'#shelves .painted-standing');const base=await el.locator('.spine-face').boundingBox();await pointer(page,el,'pointerdown',x,y);expect(await el.locator('.spine-face').boundingBox()).toEqual(base);await pointer(page,el,'pointercancel',x,y);
 const lamp=page.locator('#lamp-pull'),value=await lamp.getAttribute('aria-pressed');await lamp.tap();await expect(lamp).toHaveAttribute('aria-pressed',value==='true'?'false':'true');
});
