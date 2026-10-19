const {test,expect}=require('@playwright/test');
const additions=[['rain','雨天来信','雨停之后'],['forest','森林散步','苔藓'],['station','旧站台','车票'],['slow','慢慢生活','一碗面']];
const step=(p,value)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',value);
test('four new books open their own covers and notes, return, and preserve old progress on reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(!localStorage.getItem('paperbook-v3'))localStorage.setItem('paperbook-v3',JSON.stringify({visits:7,seen:['siddhartha'],found:['garden'],rose:true,stamp:true,replies:['原来留下的续写'],mode:'natural'}));});
 await page.goto('/');await expect(page.locator('.spine')).toHaveCount(16);await expect(page.locator('.book-slot.is-empty')).toHaveCount(0);
 for(const [id,title,note] of additions){
  const source=page.locator('.spine[data-id="'+id+'"]');await source.scrollIntoViewIfNeeded();await source.tap();await step(page,'held');
  await expect(page.locator('.sid-cover-title')).toHaveText(title);await expect(page.locator('.sid-cover')).toHaveAttribute('aria-expanded','false');await expect(source).toHaveClass(/is-out/);
  await page.locator('.sid-cover').tap();await step(page,'open');await expect(page.locator('.sid-page h2')).toHaveText('《'+title+'》');await expect(page.locator('.sid-synopsis')).toContainText('虚构藏书');
  const dock=await page.locator('.sid-letter').boundingBox();await page.getByRole('button',{name:'展开书友便笺',exact:true}).tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText(note);await expect(page.locator('.sid-pen')).toHaveCount(0);
  expect(await page.locator('.sid-segment').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('PaperYozai');
  await page.locator('[data-sid="put"]').tap();await step(page,'open');const returned=await page.locator('.sid-letter').boundingBox();for(const key of ['x','y','width','height'])expect(Math.abs(returned[key]-dock[key])).toBeLessThan(1);
  await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(source).not.toHaveClass(/is-out/);await expect(source).toBeFocused();
 }
 await page.reload();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')));expect(saved.replies).toEqual(['原来留下的续写']);expect(saved.stamp).toBe(true);expect(saved.rose).toBe(true);expect(saved.found).toEqual(expect.arrayContaining(['garden',...additions.map(b=>b[0])]));expect(saved.seen).toEqual(expect.arrayContaining(['siddhartha',...additions.map(b=>b[0])]));expect(saved.visits).toBe(11);
 await page.locator('#open-book-index').tap();await expect(page.locator('.catalogue-book')).toHaveCount(16);await page.locator('.catalogue-book[data-book="rain"]').tap();await step(page,'held');await page.locator('.sid-cover').tap();await step(page,'open');await page.getByRole('button',{name:'展开书友便笺',exact:true}).tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('雨停之后');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');expect(errors).toEqual([]);
});
