const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function directPick(page,id){
 const book=page.locator('.spine[data-id="'+id+'"]');await book.scrollIntoViewIfNeeded();
 if(await book.locator('.painted-title').count()&&await book.evaluate(e=>!!e.closest('.book-pile'))){const r=await book.locator('.painted-title').boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height/2);}else await book.click();
}

test('all 34 physical books have separate usable touch centers and open the matching cover',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?v=0.10.0');
 expect(await page.evaluate(async()=>{const image=new Image();image.src='assets/scene/book-arrangement-v0110.png';await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([942,1669]);
 await expect(page.locator('.spine')).toHaveCount(34);await expect(page.locator('#shelves .spine')).toHaveCount(20);await expect(page.locator('#display-books .spine')).toHaveCount(10);await expect(page.locator('#coffee-books .spine')).toHaveCount(4);
 const ids=await page.locator('.spine').evaluateAll(els=>els.map(el=>el.dataset.id));expect(new Set(ids).size).toBe(34);
 expect(await page.locator('.placed-title,.spine-title').evaluateAll(els=>els.filter(el=>el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1).map(el=>el.textContent))).toEqual([]);
 for(const id of ids){
  const book=page.locator('.spine[data-id="'+id+'"]');await book.scrollIntoViewIfNeeded();
  expect(await book.evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=43.9&&r.height>=43.9;})).toBe(true);
  await directPick(page,id);await step(page,'held');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book',id);
  await page.locator('.sid-cover').click();await step(page,'open');
  await expect(page.locator('.sid-page')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(book).not.toHaveClass(/is-out/);
 }
 expect(errors).toEqual([]);
});
test('real paper keeps the exported nickname, stable selection and old saved replies when writing',async({page})=>{
 const legacy={id:'old-night',kind:'stack',stock:'cream',author:'local',front:'以前留在原书的纸',back:'',authorName:'',replies:[{id:'old-reply',author:'N',authorName:'',text:'以前的回应'}]};
 await page.addInitScript(({legacy})=>{localStorage.setItem('paperbook-v3',JSON.stringify({visits:1,seen:['night'],found:[],replies:[]}));localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{night:[legacy]}}));localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{naval:['qianyi-naval-18005']},baseline:{},changes:{},visit:{id:'stable-test',seed:1,lastActive:Date.now(),draws:{naval:'qianyi-naval-18005'},explored:1,found:3,lastFound:1,dry:0,quiet:0,events:[]}}));},{legacy});
 await page.goto('/?v=0.10.0');await page.locator('.spine[data-id="naval"]').click();await step(page,'held');await page.locator('.sid-cover').click();await step(page,'open');
 const packet=await page.locator('.sid-letter-packet em').textContent();await page.locator('.sid-letter-pick').click();await step(page,'letter');await expect(page.locator('.sid-segment').first()).toContainText('peter_47');await expect(page.locator('.sid-segment').first()).toContainText('朋友笔记提示最多');
 await page.getByRole('button',{name:'回应这张便笺',exact:true}).click();await page.locator('#sid-reply').fill('留给下一位翻到这里的书友');await page.locator('[data-sid="save"]').click();await step(page,'letter');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secrets-v1')));expect(saved.books.night).toEqual([legacy]);expect(saved.books.naval.find(x=>x.id==='qianyi-naval-18005').replies.at(-1).text).toBe('留给下一位翻到这里的书友');expect(Object.keys(saved.books).filter(id=>saved.books[id].some(x=>x.id.startsWith('qianyi-')))).toHaveLength(30);
 await page.locator('[data-sid="put"]').click();await step(page,'open');await expect(page.locator('.sid-letter-packet em')).toHaveText(packet);
 await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await page.locator('#open-book-index').click();await page.locator('[data-book="night"]').click();await step(page,'held');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book','night');await page.locator('.sid-cover').click();await step(page,'open');await expect(page.locator('.sid-letter-packet em')).toHaveText('你的便笺与新回应');
 expect(await page.evaluate(()=>getSelection().toString())).toBe('');
});
test('cat retains its position and authored note after the picture pages',async({page})=>{
 await page.goto('/?playtest=revisit&reader=A');
 const art=await page.evaluate(()=>tableBooks);expect(art).toEqual([{id:'cat',x:596,y:1319,width:79,height:105,color:'#e6b852',image:'assets/scene/cat-letter-cover-v01416.png',clip:'polygon(3% 0,96% 0,100% 4%,100% 99%,1% 100%,0 5%)'}]);
 expect(await page.evaluate(()=>notes.cat)).toBe('如果你又遇见窗边那只猫，请替我和它打声招呼。它大概还记得，去年那个总来读书的人。');
 await page.locator('.spine[data-id="cat"]').click();await step(page,'held');await page.locator('.sid-cover').click();await step(page,'open');for(let i=0;i<3;i++){await page.getByRole('button',{name:'翻到下一页',exact:true}).click();await step(page,'open');} await page.locator('.sid-letter-pick').click();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('去年那个总来读书的人');
});

test('tap a compact middle spine directly picks that book once and uses the shelf title font',async({page})=>{
 await page.goto('/?v=0.11.2');await expect(page.locator('.book-pile-trigger')).toHaveCount(0);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).visits);
 await directPick(page,'japan');await step(page,'held');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book','japan');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).visits)).toBe(before+1);
 expect(await page.locator('.sid-cover-title').evaluate(e=>getComputedStyle(e).fontFamily)).toBe(await page.locator('[data-id="japan"] .painted-title').evaluate(e=>getComputedStyle(e).fontFamily));
 await expect(page.locator('.sid-cover-title')).toHaveText('以日为鉴');await page.locator('.sid-cover').click();await step(page,'open');
 await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(page.locator('.is-spread')).toHaveCount(0);
});
test('each compact pile book is directly keyboard reachable without a group chooser',async({page})=>{
 await page.goto('/?v=0.11.2');const book=page.locator('.spine[data-id="presence"]');await book.focus();await page.keyboard.press('Enter');await step(page,'held');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book','presence');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(book).toBeFocused();
});
test('direct spine picking still targets the right book after phone rotation',async({page})=>{
 await page.goto('/?v=0.11.2');await page.locator('[data-pile="front-left"]').scrollIntoViewIfNeeded();await page.setViewportSize({width:844,height:390});await directPick(page,'tokyo');await step(page,'held');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book','tokyo');
});

test('a visible neighboring book tap during return queues the matching next book once',async({page})=>{
 await page.goto('/?v=0.11.2');await page.locator('[data-pile="front-left"]').scrollIntoViewIfNeeded();await directPick(page,'cat');await step(page,'held');await page.locator('.sid-cover').click();await step(page,'open');await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='returning');
 const point=await page.waitForFunction(()=>{const e=document.querySelector('[data-id="lychee"] .painted-title'),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return document.querySelector('.siddhartha-room').dataset.step==='returning'&&!document.elementFromPoint(x,y)?.closest('.sid-carrier,.sid-letter')?{x,y}:false;},{},{polling:'raf'});const {x,y}=await point.jsonValue();expect(y).toBeLessThan(page.viewportSize().height);await page.mouse.click(x,y);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book','lychee');await step(page,'held');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).visits)).toBe(2);
});
