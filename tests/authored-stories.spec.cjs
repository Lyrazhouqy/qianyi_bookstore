const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),vm=require('node:vm');
const scope={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../stories.js'),'utf8'),scope);
const stories=JSON.parse(JSON.stringify(scope.window.BookAuthoredStories.items));
const ids=[...new Set(stories.map(x=>x.book))];
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
const last=(p,book)=>p.evaluate(book=>JSON.parse(localStorage.getItem('paperbook-secret-reading-v1'))?.books[book]?.last,book);
async function open(p,book){await p.locator('#open-book-index').tap();await p.locator('[data-book="'+book+'"]').tap();await step(p,'held');await p.locator('.sid-cover').tap();await step(p,'open');}
async function take(p){await p.locator('.sid-letter-pick').tap();await step(p,'letter');}
async function next(p){await p.locator('.sid-page-next').tap();await step(p,'open');}
async function back(p){await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');}
async function seek(p,book,id){for(let i=0;i<25;i++){if(await last(p,book)===id)return;await next(p);}throw Error('paper not reachable: '+id);}
async function unfold(p){await p.locator('.sid-unfold').tap();await step(p,'letter');}
async function setup(p,{draw,old=false}={}){
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.addInitScript(({draw,old})=>{
  if(localStorage.getItem('stories-fixture'))return;localStorage.setItem('stories-fixture','1');
  if(draw)localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{},baseline:{},changes:{},visit:{id:'stories-qa',seed:1,lastActive:1,draws:draw,events:[]}}));
  if(old){localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{tokyo:[{id:'legacy-own',kind:'stack',author:'local',front:'原来的便笺',stock:'cream',replies:[{author:'N',text:'原来的回应'}]}]}}));localStorage.setItem('paperbook-secret-drafts-v1',JSON.stringify({tokyo:{kind:'stack',front:'原来的草稿'}}));}
 },{draw,old});
 await p.goto('/?playtest=rhythm&stories=humor-v1');
}
test('the two approved batches have 14 groups, 18 papers and no changes to the 44 real notes',async({page})=>{
 await setup(page);const data=await page.evaluate(()=>({stories:window.BookAuthoredStories.items,real:window.BookRealMaterials()}));
 expect(data.stories).toHaveLength(18);expect(new Set(data.stories.map(x=>x.id)).size).toBe(18);expect(new Set(data.stories.map(x=>x.storyId)).size).toBe(14);expect(new Set(data.stories.map(x=>x.book)).size).toBe(11);
 expect(data.stories.some(x=>x.book==='cat'||x.quotation||x.date)).toBe(false);
 expect(Object.values(data.real).flat()).toHaveLength(44);
 const raw=await page.request.get('/real-materials.js');expect(await raw.text()).toBe(fs.readFileSync(require.resolve('../real-materials.js'),'utf8'));
 for(const trail of ['lychee-time','dessert-listener','reading-preparation']){const chain=data.stories.filter(x=>x.trail===trail).sort((a,b)=>a.chapter-b.chapter);expect(chain.map(x=>x.chapter)).toEqual(chain.map((_,i)=>i+1));for(let i=0;i<chain.length-1;i++)expect(chain[i].targetBook).toBe(chain[i+1].book);}
});
test('all 18 papers are reachable by the single corner and their folds reveal the actual ending',async({page})=>{
 test.setTimeout(180000);await setup(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));const found=[];
 for(const book of ids){
  await open(page,book);const first=await last(page,book);
  for(let i=0;i<30;i++){
   const id=await last(page,book),story=stories.find(x=>x.id===id);
   if(story){
    found.push(id);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact-source','authored-story');await expect(page.locator('.sid-inside-copy')).toHaveAttribute('data-kind','synopsis');
    await take(page);await expect(page.locator('.sid-segment').first()).toContainText('纸间小故事 · '+(story.caption||story.title));await expect(page.locator('.sid-note-signature time')).toHaveCount(0);
    for(let n=1;n<story.parts.length;n++){await expect(page.locator('[data-sid="write"]')).toHaveCount(0);await unfold(page);}
    await expect(page.locator('.sid-segment').last()).toContainText(story.parts.at(-1));await expect(page.locator('.sid-note-signature').last()).toHaveText('—— 纸间书店 · 原创');
    await expect(page.locator('[data-sid="write"]')).toHaveAttribute('aria-label','接着写一句');
    if(story.columns){await expect(page.locator('.sid-story-columns section')).toHaveCount(2);expect(await page.locator('.sid-letter-reader').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);}
    if(['original-b-habits','original-b-locksmith','original-b-prep-3'].includes(id))await page.screenshot({path:test.info().outputPath(id+'.png'),animations:'disabled'});
   }
   await expect(page.locator('.sid-page-next')).toHaveCount(1);await next(page);if(await last(page,book)===first)break;
  }
  await back(page);
 }
 expect(found.sort()).toEqual(stories.map(x=>x.id).sort());expect(errors).toEqual([]);
});
test('unfinished body folds survive return and reload without counting as reader replies or changing the encounter',async({page})=>{
 const id='original-b-locksmith';await setup(page,{draw:{sentence:id}});await open(page,'sentence');await take(page);await unfold(page);await expect(page.locator('.sid-segment')).toHaveCount(2);await back(page);
 let saved=await page.evaluate(()=>({read:JSON.parse(localStorage.getItem('paperbook-secret-reading-v1')),visit:JSON.parse(localStorage.getItem('paperbook-discovery-v1'))}));
 expect(saved.read.books.sentence.items[id]).toEqual({front:true,replies:0,storyParts:2});expect(saved.visit.visit.ready?.sentence).toBeFalsy();
 await page.reload();await open(page,'sentence');expect(await last(page,'sentence')).toBe(id);await take(page);await expect(page.locator('.sid-segment')).toHaveCount(2);await unfold(page);await back(page);
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-discovery-v1')));expect(saved.visit.ready.sentence).toBe(true);await open(page,'sentence');expect(await last(page,'sentence')).not.toBe(id);
});
test('story replies and direct-next drafts persist while legacy note, draft and preset relay stay intact',async({page})=>{
 const id='original-b-chair';await setup(page,{draw:{tokyo:id},old:true});const before=await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'));
 await open(page,'tokyo');await seek(page,'tokyo',id);await take(page);await unfold(page);await unfold(page);expect(await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'))).toBe(before);
 await page.locator('[data-sid="write"]').tap();await page.locator('#sid-reply').fill('给来吃饭的人留个位置');await next(page);await seek(page,'tokyo',id);await take(page);await page.locator('[data-sid="write"]').tap();await expect(page.locator('#sid-reply')).toHaveValue('给来吃饭的人留个位置');
 await page.locator('[data-sid="save"]').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toHaveCount(4);await expect(page.locator('.sid-segment').last()).toContainText('给来吃饭的人留个位置');await expect(page.locator('.sid-segment').last().locator('time')).toHaveCount(1);await back(page);await page.reload();
 const saved=await page.evaluate(()=>({notes:JSON.parse(localStorage.getItem('paperbook-secrets-v1')),drafts:JSON.parse(localStorage.getItem('paperbook-secret-drafts-v1')),game:JSON.parse(localStorage.getItem('paperbook-v3'))}));
 expect(saved.notes.books.tokyo.find(x=>x.id===id).replies).toHaveLength(1);expect(saved.notes.books.tokyo.find(x=>x.id==='legacy-own')).toMatchObject({front:'原来的便笺',replies:[{text:'原来的回应'}]});expect(saved.drafts.tokyo.front).toBe('原来的草稿');expect(saved.game.replies).toEqual([]);
 expect(saved.notes.books.tokyo.filter(x=>x.id.startsWith('original-'))).toHaveLength(2);await open(page,'tokyo');await seek(page,'tokyo',id);await take(page);await expect(page.locator('.sid-segment')).toHaveCount(4);
});
test('cross-book endings can be discovered first and never lock or force the next book',async({page})=>{
 await setup(page,{draw:{weeks:'original-b-prep-3',notetaking:'original-b-prep-2',solitude:'original-b-prep-1'}});
 for(const [book,id] of [['weeks','original-b-prep-3'],['notetaking','original-b-prep-2'],['solitude','original-b-prep-1']]){await open(page,book);await seek(page,book,id);await take(page);while(await page.locator('.sid-unfold').count())await unfold(page);await expect(page.locator('.sid-segment').first()).toContainText(stories.find(x=>x.id===id).parts[0]);await back(page);}
 await page.screenshot({path:test.info().outputPath('free-exploration-after-chain.png'),animations:'disabled'});
});
test('named discovery readers share story papers but retain their own unfolding progress',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{for(const actor of ['A','B']){const key='paperbook-discovery-visit-v1-'+actor;if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,known:{},baseline:{},changes:{},visit:{id:'actor-story-'+actor,seed:1,lastActive:1,draws:{tao:'original-b-tao'},events:[]}}));}});
 await page.goto('/?playtest=discovery&reader=A');await open(page,'tao');await take(page);await unfold(page);await expect(page.locator('.sid-segment')).toHaveCount(2);await back(page);
 await page.goto('/?playtest=discovery&reader=B');await open(page,'tao');await take(page);await expect(page.locator('.sid-segment')).toHaveCount(1);await expect(page.locator('.sid-unfold')).toBeVisible();
 const reading=await page.evaluate(()=>['A','B'].map(a=>JSON.parse(localStorage.getItem('paperbook-discovery-reading-v1-'+a)).books.tao.items['original-b-tao'].storyParts));expect(reading).toEqual([2,1]);
});
