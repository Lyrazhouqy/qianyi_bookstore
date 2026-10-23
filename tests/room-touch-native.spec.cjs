const {test,expect}=require('./helpers/quiet.cjs');
const readStep=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
const visual=e=>e.evaluate(el=>{const s=getComputedStyle(el);return {translate:s.translate,transform:s.transform,rotate:s.rotate};});
async function enter(page){await page.goto('/?playtest=rhythm&touch=feedback');await page.evaluate(()=>{window.touchErrors=[];addEventListener('error',e=>touchErrors.push(e.message));});}
async function target(page,selector){const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();const part=el.locator('.painted-title').first();const r=await (await part.count()?part:el).boundingBox();return {el,x:r.x+r.width/2,y:r.y+(selector==='#touch-bouquet'?Math.min(8,r.height*.12):r.height/2)};}
async function pointer(page,el,type,x,y){await el.dispatchEvent(type,{pointerType:'touch',pointerId:41,isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y,bubbles:true});}
test('native touch stream pan cancels press and leaves the scene available for the next tap',async({page,browserName})=>{
await enter(page);
 await page.setViewportSize({width:page.viewportSize().width,height:430});const {el,x,y}=await target(page,'#shelves .painted-standing');const cdp=await page.context().newCDPSession(page),camera=page.locator('#room-viewport'),before=await camera.evaluate(e=>e.scrollTop);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await expect(el).toHaveClass(/is-touch-press/);
 for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-12*i}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>camera.evaluate(e=>e.scrollTop)).toBeGreaterThan(before);await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(page.locator('.is-touch-press')).toHaveCount(0);await el.scrollIntoViewIfNeeded();{const t=await target(page,await el.evaluate(e=>e.matches('.spine')?'[data-id="'+e.dataset.id+'"]':e.id?'#'+e.id:'.wall-note'));await page.touchscreen.tap(t.x,t.y);}await readStep(page,'held');
});
