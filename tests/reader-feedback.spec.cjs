const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function pick(p,id){await p.locator('.spine[data-id="'+id+'"]').scrollIntoViewIfNeeded();await p.locator('.spine[data-id="'+id+'"]').click();await step(p,'held');await p.locator('.sid-cover').click();await step(p,'open');}
test('Stranger: corner click and upward pull take the note without closing the book',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('paperbook-v3',JSON.stringify({mode:'dense',seen:[],replies:[],found:[]})));await page.goto('/');
 for(const pull of [false,true]){
 await pick(page,'stranger');const r=await page.locator('.sid-letter-pick').boundingBox(),x=r.x+5,y=r.y+5;
 if(pull){await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-100,{steps:12});await step(page,'letter-drag');await page.mouse.up();await step(page,'packet');await page.locator('.sid-letter-pick').click();}else await page.mouse.click(x,y);
 await step(page,'letter');await expect(page.locator('.sid-cover')).toHaveAttribute('aria-expanded','true');await expect(page.locator('.sid-segment')).toContainText('悲伤');expect(await page.evaluate(()=>getSelection().toString())).toBe('');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 }
});
test('first cover press during pickup queues one opening and gives immediate feedback',async({page})=>{
 await page.goto('/');await page.locator('.spine[data-id="siddhartha"]').click();await page.evaluate(()=>document.querySelector('.sid-cover').click());await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-open-queued','true');await step(page,'open');await expect(page.locator('.sid-cover')).toHaveAttribute('aria-expanded','true');await page.locator('.sid-letter-pick').click();await step(page,'letter');
});
test('tap the next exposed spine during return is honored once without another click',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('paperbook-v3',JSON.stringify({mode:'dense',replies:[],found:[],seen:[]})));await page.goto('/');await pick(page,'stranger');await page.locator('.sid-letter-pick').click();await step(page,'letter');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='returning');
 const next=await page.evaluate(()=>{const book=document.querySelector('.sid-position').getBoundingClientRect(),paper=document.querySelector('.sid-letter').getBoundingClientRect(),vp=document.querySelector('#room-viewport').getBoundingClientRect();return [...document.querySelectorAll('.spine')].filter(el=>el.dataset.id!=='stranger').map(el=>{const r=el.getBoundingClientRect();return {id:el.dataset.id,x:r.left+r.width/2,y:r.top+r.height/2};}).find(p=>p.x>Math.max(4,vp.left)&&p.x<Math.min(innerWidth-4,vp.right)&&p.y>Math.max(4,vp.top)&&p.y<Math.min(innerHeight-4,vp.bottom)&&![book,paper].some(r=>p.x>=r.left-8&&p.x<=r.right+8&&p.y>=r.top-8&&p.y<=r.bottom+8));});expect(next).toBeTruthy();await page.mouse.click(next.x,next.y);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book',next.id);await step(page,'held');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).visits)).toBe(2);await expect(page.locator('.sid-next-target')).toHaveCount(0);
});
