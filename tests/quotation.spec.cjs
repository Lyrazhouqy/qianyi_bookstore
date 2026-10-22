const{test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function enter(page,{trusted=false,mismatch=false,long=false}={}){
 // These marked fixtures exercise rendering; they are not quotations attributed to a real book.
 const fixture={text:long?'【测试专用长引文】'+('只用于检查纸面长文排版与滚动。'.repeat(50)):'【测试专用引文】这一段用于检查左页对应关系。',bookTitle:mismatch?'另一部测试书':'纳瓦尔宝典',source:'测试资料，第1段（非真实原著）',verified:trusted};
 await page.route('**/real-materials.js',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:await res.text()+`\nconst originalPool=window.BookRealMaterials;window.BookRealMaterials=()=>{const rows=originalPool();rows.naval[0].quotation=${JSON.stringify(fixture)};return rows;};`});});
 await page.addInitScript(()=>{localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{naval:['qianyi-naval-18005','qianyi-naval-22185']},baseline:{},changes:{},visit:{id:'quotation-qa',seed:1,lastActive:Date.now(),draws:{naval:'qianyi-naval-18005'},explored:1,found:3,lastFound:1,dry:0,quiet:0,events:[]}}));localStorage.setItem('paperbook-secret-reading-v1',JSON.stringify({books:{naval:{last:'qianyi-naval-18005',items:{'qianyi-naval-18005':{front:false},'qianyi-naval-22185':{front:true}}}}}));});
 await page.goto('/?v=0.10.1');await page.locator('.spine[data-id="naval"]').click();await step(page,'held');await page.locator('.sid-cover').click();await step(page,'open');
}
test('the left excerpt follows the selected paper and falls back after turning to an unrelated paper',async({page})=>{
 await enter(page,{trusted:true});const copy=page.locator('.sid-inside-copy');await expect(copy).toHaveAttribute('data-kind','quotation');await expect(copy.locator('strong')).toHaveText('这段话的原文');await expect(copy.locator('.sid-synopsis')).toHaveText('【测试专用引文】这一段用于检查左页对应关系。');await expect(copy.locator('.sid-quotation-source')).toHaveText('—— 测试资料，第1段（非真实原著）');
 const x=await copy.boundingBox(),back=await page.locator('.sid-cover-back').boundingBox();expect(x.x).toBeGreaterThanOrEqual(back.x-1);expect(x.x+x.width).toBeLessThanOrEqual(back.x+back.width+1);
 await page.locator('.sid-page-next').click();await step(page,'open');await expect(copy).toHaveAttribute('data-kind','synopsis');await expect(copy.locator('strong')).toHaveText('关于这本书');await expect(copy.locator('.sid-quotation-source')).toBeHidden();await expect(copy.locator('.sid-synopsis')).toHaveText('有人一天读完，也有人想把它放在手边，反复重读。');
 await page.locator('.sid-page-prev').click();await step(page,'open');await expect(copy).toHaveAttribute('data-kind','quotation');
});
test('an unverified quotation or a different book never replaces the synopsis',async({page})=>{
 await enter(page,{trusted:false});await expect(page.locator('.sid-inside-copy')).toHaveAttribute('data-kind','synopsis');await expect(page.locator('.sid-synopsis')).not.toContainText('测试专用');
});
test('a verified excerpt belonging to another book still falls back to the current synopsis',async({page})=>{
 await enter(page,{trusted:true,mismatch:true});await expect(page.locator('.sid-inside-copy')).toHaveAttribute('data-kind','synopsis');await expect(page.locator('.sid-quotation-source')).toBeHidden();
});

test('a long source excerpt stays within the left paper and can be read without closing the book',async({page})=>{
 await enter(page,{trusted:true,long:true});const copy=page.locator('.sid-inside-copy');await expect(copy).toHaveAttribute('data-kind','quotation');
 expect(await copy.evaluate(el=>el.scrollHeight>el.clientHeight+50)).toBe(true);
 await copy.evaluate(el=>{el.scrollTop=100;});expect(await copy.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','open');await expect(page.locator('.sid-page')).toBeVisible();
});
