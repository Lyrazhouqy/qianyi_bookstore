const {test,expect}=require('@playwright/test');
const key='paperbook-discovery-visit-v1-B';
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function enter(p,{reply=false,reduced=false}={}){
 await p.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
 await p.route('**/real-materials.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BookRealMaterials=()=>({});'}));
 await p.addInitScript(({key,reply})=>{if(localStorage.getItem(key))return;
  localStorage.setItem('paperbook-discovery-notes-v1',JSON.stringify({version:1,books:{naval:[{id:'mine',author:'B',kind:'stack',stock:'cream',front:'我在原书留下的旧便笺',replies:reply?[{author:'N',text:'这是给你的新回应'}]:[]}]}}));
  localStorage.setItem(key,JSON.stringify({version:1,known:{},baseline:{},changes:{},visit:{id:'one-known',seed:1,lastActive:Date.now(),draws:{naval:null},explored:1,found:3,lastFound:1,dry:0,quiet:0,events:[]}}));
  localStorage.setItem('paperbook-discovery-reading-v1-B',JSON.stringify({books:{naval:{items:{mine:{front:true,replies:0}},last:'mine'}}}));
 },{key,reply});await p.goto('/?v=0.10.0&playtest=discovery&reader=B');await p.locator('.spine[data-id="naval"]').click();await step(p,'held');await p.locator('.sid-cover').click();await step(p,'open');
}
async function rightCorner(p,selector){await expect.poll(()=>p.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),page=document.querySelector('.sid-page').getBoundingClientRect(),fold=el.querySelector('i').getBoundingClientRect();return Math.abs(r.right-page.right)<2&&r.x+r.width/2>=page.left+page.width/2&&fold.width>=58&&fold.height>=58&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);}
async function start(p,dx,selector='.sid-page-next'){await rightCorner(p,selector);const r=await p.locator(selector).boundingBox(),x=r.x+r.width*.65,y=r.y+r.height*.65;await p.mouse.move(x,y);await p.mouse.down();await step(p,'page-drag');await p.mouse.move(x+dx,y-3,{steps:6});}
test('own-only discovery has an intro and an actual curled corner; short drag rebounds and long drag turns once',async({page})=>{
 await enter(page);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-paper-owner','intro');await expect(page.locator('.sid-stage > .sid-letter')).toBeHidden();await expect(page.locator('.sid-page-next')).toBeVisible();await expect(page.locator('.sid-page-next')).toHaveText('');
 const before=await page.evaluate(key=>localStorage.getItem(key),key),notes=await page.evaluate(()=>localStorage.getItem('paperbook-discovery-notes-v1'));
 await start(page,-12);expect(await page.locator('.sid-turning-leaf').evaluate(el=>el.style.transform)).not.toBe('rotateY(0deg)');await page.mouse.up();await step(page,'open');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-paper-owner','intro');await expect(page.locator('.sid-turning-leaf')).toHaveCount(0);
 await start(page,-95);await page.mouse.up();await step(page,'open');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-paper-owner','own');await expect(page.locator('.sid-letter-packet em')).toHaveText('你夹的便笺');await expect(page.locator('.sid-page-next')).toHaveCount(0);await expect(page.locator('.sid-page-prev')).toBeVisible();
 const a=JSON.parse(before),b=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(b.visit.found).toBe(a.visit.found);expect(b.visit.draws).toEqual(a.visit.draws);expect(b.known.naval).not.toContain('hidden');expect(await page.evaluate(()=>localStorage.getItem('paperbook-discovery-notes-v1'))).toBe(notes);
 await start(page,-95,'.sid-page-prev');await page.mouse.up();await step(page,'open');await expect(page.locator('.sid-stage > .sid-letter')).toBeHidden();
});
test('reduced motion and a keyboard corner tap work; new replies still open the own page first',async({page})=>{
 await enter(page,{reply:true,reduced:true});await expect(page.locator('.sid-letter-packet em')).toHaveText('你的便笺与新回应');await expect(page.locator('.sid-page-prev')).toBeVisible();expect(await page.locator('.sid-page-prev i').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.locator('.sid-page-prev').focus();await page.keyboard.press('Enter');await step(page,'open');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-paper-owner','intro');await page.locator('.sid-page-next').focus();await page.keyboard.press('Enter');await step(page,'open');await expect(page.locator('.sid-letter-packet em')).toHaveText('你的便笺与新回应');
 await page.locator('.sid-letter-pick').click();await step(page,'letter');await expect(page.locator('.sid-paper-traces')).toBeHidden();await page.locator('.sid-unfold').click();await step(page,'letter');await expect(page.locator('.sid-segment').last()).toContainText('给你的新回应');
});
test('rotation or pointer cancellation during a corner drag restores the old page and leaves keyboard access usable',async({page})=>{
 await enter(page);await start(page,-30);await page.setViewportSize({width:667,height:320});await page.mouse.up();await step(page,'open');await expect(page.locator('.sid-turning-leaf')).toHaveCount(0);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-paper-owner','intro');
 await expect.poll(()=>page.locator('.sid-page-next').evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})).toBe(true);
 await page.locator('.sid-page-next').focus();await page.keyboard.press('Enter');await step(page,'open');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-paper-owner','own');await expect(page.locator('.sid-turning-leaf')).toHaveCount(0);
});

test('middle pages keep both physical corners on the right and neither steals the note pickup',async({page})=>{
 await enter(page);await page.locator('.sid-page-next').click();await step(page,'open');
 await page.locator('.sid-create-pen').click();await page.locator('#secret-front').fill('另留一张，测试右页前后翻动');await page.locator('.sid-bury').click();await step(page,'open');
 await rightCorner(page,'.sid-page-prev');await rightCorner(page,'.sid-page-next');
 const boxes=await page.locator('.sid-paper-tab').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));expect(boxes[0].bottom).toBeLessThan(boxes[1].top);
 await page.locator('.sid-letter-pick').click();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('另留一张，测试右页前后翻动');await page.locator('[data-sid="put"]').click();await step(page,'open');
 await start(page,-95,'.sid-page-prev');await page.mouse.up();await step(page,'open');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-paper-owner','intro');
});
