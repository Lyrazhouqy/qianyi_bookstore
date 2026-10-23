const {test,expect}=require('@playwright/test');
const step=(page,state)=>expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step',state);
async function open(page){await page.locator('[data-id="cat"]').scrollIntoViewIfNeeded();await page.locator('[data-id="cat"]').tap();await step(page,'held');await page.locator('.sid-cover').tap();await step(page,'open');}
async function turn(page){await page.getByRole('button',{name:'翻到下一页',exact:true}).tap();await step(page,'open');}
test('independent cover and three complete pictures turn as bound pages before the old note',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?playtest=rhythm&catbook=daily');
 await page.locator('[data-id="cat"]').scrollIntoViewIfNeeded();await page.locator('[data-id="cat"]').tap();await step(page,'held');
 const cover=await page.locator('.sid-cover-front').evaluate(e=>({image:getComputedStyle(e).backgroundImage,size:getComputedStyle(e).backgroundSize,position:getComputedStyle(e).backgroundPosition}));
 expect(cover.image).toContain('cat-letter-cover-v01416.png');expect(cover.size).toBe('100% 100%');expect(cover.position).toBe('50% 50%');
 await page.screenshot({path:testInfo.outputPath('cover.png')});await page.locator('.sid-cover').tap();await step(page,'open');
 for(const scene of ['tree','sofa','window']){
  await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact','illustration');const img=page.locator('.sid-album-page img');await expect(img).toHaveAttribute('src',new RegExp('cat-daily-'+scene));await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>500)).toBe(true);
  expect(await img.evaluate(e=>getComputedStyle(e).objectFit)).toBe('contain');await expect(page.locator('.sid-letter')).toBeHidden();
  const a=await img.boundingBox(),b=await page.locator('.sid-page').boundingBox(),corner=await page.locator('.sid-page-next').boundingBox();expect(a.x).toBeGreaterThanOrEqual(b.x);expect(a.y).toBeGreaterThanOrEqual(b.y);expect(a.x+a.width).toBeLessThanOrEqual(b.x+b.width+1);expect(a.y+a.height).toBeLessThan(corner.y+corner.height);
  await page.screenshot({path:testInfo.outputPath(scene+'.png')});await turn(page);
 }
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact','note');await expect(page.locator('.sid-synopsis')).toContainText('本店有位不打卡的店员');await expect(page.locator('.sid-synopsis')).toContainText('小鱼干另算');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('去年那个总来读书的人');
 await turn(page);await expect(page.locator('.sid-album-page img')).toHaveAttribute('src',/tree/);await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');expect(errors).toEqual([]);
});
test('legacy cat paper and reply stay readable beside the album',async({page})=>{
 const paper={id:'legacy-cat',kind:'stack',stock:'cream',author:'local',front:'以前留给小猫的话',back:'',authorName:'',replies:[{id:'cat-reply',author:'N',authorName:'书友N',text:'它今天也在窗边'}]};
 await page.addInitScript(p=>{localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{cat:[p]}}));},paper);
 await page.goto('/?playtest=rhythm');const before=await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'));await open(page);
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact','stack');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment').first()).toContainText('以前留给小猫的话');
 await page.getByRole('button',{name:'抽出下面的一张回应 ↗',exact:true}).tap();await expect(page.locator('.sid-segment').last()).toContainText('它今天也在窗边');
 for(let i=0;i<5&&await page.locator('.sid-album-page').count()===0;i++)await turn(page);
 await expect(page.locator('.sid-album-page img')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'))).toBe(before);
});
test('reopening and resizing keep pictures and the single corner reachable',async({page},testInfo)=>{
 await page.goto('/?playtest=rhythm');await open(page);await turn(page);await expect(page.locator('.sid-album-page img')).toHaveAttribute('src',/sofa/);
 await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await open(page);await expect(page.locator('.sid-album-page img')).toHaveAttribute('src',/sofa/);
 await page.setViewportSize({width:844,height:390});await expect(page.locator('.sid-page-next')).toBeInViewport();await turn(page);await expect(page.locator('.sid-album-page img')).toHaveAttribute('src',/window/);await page.screenshot({path:testInfo.outputPath('landscape.png')});
 await page.emulateMedia({reducedMotion:'reduce'});await turn(page);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact','note');
});
