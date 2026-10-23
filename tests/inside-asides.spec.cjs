const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function open(p,id='fiscal'){await p.locator('#open-book-index').tap();await p.locator('[data-book="'+id+'"]').tap();await step(p,'held');await p.locator('.sid-cover').tap();await step(p,'open');await expect(p.locator('.sid-inside-copy')).toBeVisible();}
async function back(p){await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');}
async function labels(p){return [await p.locator('.sid-book-aside').textContent(),await p.locator('.sid-inside-copy strong').textContent()];}
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?playtest=rhythm');});
test('Fiscal has four genuine notes and no paired original passage; random titles never become fake quotations',async({page})=>{
 const source=await page.evaluate(()=>window.BookRealMaterials().fiscal);expect(source).toHaveLength(4);expect(source.every(x=>!x.quotation)).toBe(true);await open(page);const wording=await labels(page),summary=await page.locator('.sid-synopsis').textContent(),ids=[];
 expect(wording[0]).not.toBe('此书留在这里');expect(wording[1]).not.toBe('关于这本书');expect(summary).toBe('从读几页就困，到清早专门找个地方读，书友留下了不同的尝试。');
 for(let i=0;i<4;i++){
  ids.push(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secret-reading-v1')).books.fiscal.last));await expect(page.locator('.sid-inside-copy')).toHaveAttribute('data-kind','synopsis');await expect(page.locator('.sid-synopsis')).toHaveText(summary);await expect(page.locator('.sid-quotation-source')).toBeHidden();expect(await labels(page)).toEqual(wording);
  await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment').first()).toContainText(source.find(x=>x.id===ids.at(-1)).front);await page.locator('.sid-page-next').tap();await step(page,'open');
 }
 expect(new Set(ids).size).toBe(4);await page.screenshot({path:test.info().outputPath('fiscal-aside.png'),animations:'disabled'});
});
test('asides change on each pickup and stay stable during page turns and layout; saves and drafts stay untouched',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{night:[{id:'old',author:'local',kind:'stack',front:'旧便笺',replies:['旧回应']}]}}));localStorage.setItem('paperbook-secret-drafts-v1',JSON.stringify({night:{kind:'stack',front:'旧草稿'}}));});
 const saved=await page.evaluate(()=>[localStorage.getItem('paperbook-secrets-v1'),localStorage.getItem('paperbook-secret-drafts-v1')]);let previous;
 for(let i=0;i<4;i++){
  await open(page);const current=await labels(page);if(previous)expect(current).not.toEqual(previous);previous=current;
  await page.locator('.sid-page-next').tap();await step(page,'open');expect(await labels(page)).toEqual(current);await page.setViewportSize(page.viewportSize());expect(await labels(page)).toEqual(current);
  for(const selector of ['.sid-book-aside','.sid-inside-copy strong'])expect(await page.locator(selector).evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('.sid-cover-back').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&el.scrollWidth<=el.clientWidth+1;})).toBe(true);
  await back(page);
 }
 expect(await page.evaluate(()=>[localStorage.getItem('paperbook-secrets-v1'),localStorage.getItem('paperbook-secret-drafts-v1')])).toEqual(saved);
 await page.reload();await open(page);await expect(page.locator('.sid-book-aside')).not.toBeEmpty();expect(await page.evaluate(()=>Object.keys(localStorage).some(k=>/aside|mood/.test(k)))).toBe(false);
});
