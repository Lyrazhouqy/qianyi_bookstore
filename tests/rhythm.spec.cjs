const {test,expect}=require('@playwright/test');
const step=(page,value)=>expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step',value);
async function enter(page,{motion=false,url='/?v=0.14.0&playtest=rhythm'}={}){
 await page.emulateMedia({reducedMotion:motion?'no-preference':'reduce'});await page.goto(url);
}
async function pick(page,id){
 const book=page.locator('.spine[data-id="'+id+'"]');await book.scrollIntoViewIfNeeded();
 const target=await book.locator('.painted-title').count()&&await book.evaluate(el=>!!el.closest('.book-pile'))?book.locator('.painted-title'):book;
 const box=await target.boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await step(page,'held');
 await page.locator('.sid-cover').tap();await step(page,'open');
}
async function seek(page,kind){
 for(let i=0;await page.locator('.sid-page-prev').count()&&i<100;i++){await page.locator('.sid-page-prev').tap();await step(page,'open');}
 for(let i=0;i<100;i++){
  if(await page.locator('.siddhartha-room').getAttribute('data-artifact')===kind)return;
  if(!await page.locator('.sid-page-next').count())break;
  await page.locator('.sid-page-next').tap();await step(page,'open');
 }
 throw Error('Paper not reachable: '+kind);
}
async function back(page){await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(page.locator('.is-out,.sid-turning-leaf,.sid-opening-flap')).toHaveCount(0);}
async function unfold(page){while(await page.locator('.sid-unfold').count()){await page.locator('.sid-unfold').tap();await step(page,'letter');}}

test('S1 and S2: ordinary exploration, distinct postcard, flip, return and revisit without hiding old paper',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
 await pick(page,'garden');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact','note');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('照料它');await back(page);
 await pick(page,'night');await expect(page.locator('.siddhartha-room')).not.toHaveAttribute('data-artifact','postcard');
 expect((await page.evaluate(()=>BookRhythm.export())).filter(e=>e.event_type==='artifact_cue_seen')).toHaveLength(0);
 await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('有些风景');await page.locator('[data-sid="put"]').tap();await step(page,'open');
 await seek(page,'postcard');await expect.poll(async()=>page.evaluate(()=>BookRhythm.export().some(e=>e.event_type==='artifact_cue_seen'))).toBe(true);
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact-source','authored-playtest');await page.locator('.sid-letter-pick').tap();await step(page,'letter');
 await expect(page.locator('.sid-postcard-picture')).toBeVisible();await expect(page.locator('.sid-segment')).toContainText('原创演示');await expect(page.locator('.sid-segment')).not.toContainText('下一次出发');
 await page.locator('[data-sid="flip"]').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('下一次出发的自己');await expect(page.locator('.sid-postcard-picture')).toHaveCount(0);
 await page.locator('[data-sid="put"]').tap();await step(page,'open');await back(page);
 await page.reload();await pick(page,'night');await seek(page,'postcard');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-postcard-picture')).toBeVisible();await back(page);
 await pick(page,'kafka');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('不是所有道路');await back(page);
 await expect(page.locator('dialog[open]')).toHaveCount(0);expect(errors).toEqual([]);
});

test('event evidence is opt-in, bounded to enums/counts and never includes private text or names',async({page})=>{
 await enter(page,{url:'/?v=0.14.0'});await pick(page,'night');await seek(page,'postcard');await page.locator('.sid-letter-pick').tap();await step(page,'letter');expect(await page.evaluate(()=>BookRhythm.export())).toEqual([]);await back(page);
 await enter(page);await page.evaluate(()=>BookRhythm.record('artifact_open','night',{kind:'postcard',face:'front',text:'PRIVATE-TEXT',name:'PRIVATE-NAME',secret:'PRIVATE-SECRET',parts:'PRIVATE-COUNT'}));
 const events=await page.evaluate(()=>BookRhythm.finish());expect(events.map(e=>e.event_type)).toEqual(['session_start','artifact_open','session_end']);expect(events[1].detail).toEqual({kind:'postcard',face:'front'});expect(JSON.stringify(events)).not.toContain('PRIVATE');
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>/rhythm/.test(k)))).toEqual([]);
});

test('S3 and S4: voluntary relay, three folds, explicit pen, one save, quiet return and reload',async({page})=>{
 await enter(page);await pick(page,'siddhartha');await seek(page,'relay');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toHaveCount(1);await expect(page.locator('#sid-reply')).toHaveCount(0);
 await page.locator('.sid-unfold').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toHaveCount(2);await expect(page.locator('[data-sid="write"]')).toHaveCount(0);
 await page.locator('.sid-unfold').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toHaveCount(3);await expect(page.locator('#sid-reply')).toHaveCount(0);
 await page.locator('[data-sid="write"]').tap();await page.locator('#sid-reply').fill('节奏回归：<b>留在这里</b>');await page.locator('[data-sid="save"]').tap();await step(page,'letter');
 await expect(page.locator('.sid-segment').last()).toContainText('<b>留在这里</b>');await expect(page.locator('.sid-segment b')).toHaveCount(0);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).replies)).toEqual(['节奏回归：<b>留在这里</b>']);
 await page.locator('[data-sid="put"]').tap();await step(page,'open');await back(page);await expect(page.locator('dialog[open]')).toHaveCount(0);await expect(page.locator('#shop')).not.toHaveAttribute('inert','');
 const events=await page.evaluate(()=>BookRhythm.export());for(const name of ['relay_open','relay_unfold','relay_pen_click','relay_save','relay_return','book_return'])expect(events.some(e=>e.event_type===name)).toBe(true);expect(events.filter(e=>e.event_type==='relay_save')).toHaveLength(1);expect(JSON.stringify(events)).not.toContain('留在这里');
 await page.reload();await pick(page,'siddhartha');await seek(page,'relay');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await unfold(page);await expect(page.locator('.sid-segment').last()).toContainText('节奏回归');await back(page);
 // The short event works even when the long participation happened first.
 await pick(page,'night');await seek(page,'postcard');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await page.locator('[data-sid="flip"]').tap();await step(page,'letter');await back(page);
});

test('relay can be left without writing and a cancelled draft survives reload without an empty reply',async({page})=>{
 await enter(page);await pick(page,'siddhartha');await seek(page,'relay');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await page.locator('.sid-unfold').tap();await step(page,'letter');await back(page);
 await page.reload();await pick(page,'siddhartha');await seek(page,'relay');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toHaveCount(2);await unfold(page);
 await page.locator('[data-sid="write"]').tap();await page.locator('#sid-reply').fill('尚未写完的一句');await page.locator('[data-sid="cancel"]').tap();await back(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).replies)).toEqual([]);
 await page.reload();await pick(page,'siddhartha');await seek(page,'relay');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await unfold(page);await page.locator('[data-sid="write"]').tap();await expect(page.locator('#sid-reply')).toHaveValue('尚未写完的一句');
});

test('postcard extraction/flip/return and relay save reject rapid conflicting input',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page,{motion:true});await pick(page,'night');await seek(page,'postcard');
 const pickButton=page.locator('.sid-letter-pick');await pickButton.tap();await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await pick(page,'night');await seek(page,'postcard');await pickButton.tap();await step(page,'letter');
 await page.locator('[data-sid="flip"]').tap();await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await pick(page,'siddhartha');await seek(page,'relay');await pickButton.tap();await step(page,'letter');
 await page.locator('.sid-unfold').tap();await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await pick(page,'siddhartha');await seek(page,'relay');await pickButton.tap();await step(page,'letter');await unfold(page);await page.locator('[data-sid="write"]').tap();await page.locator('#sid-reply').fill('只保存一次');
 await page.locator('[data-sid="save"]').evaluate(el=>{el.click();el.click();});await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).replies)).toEqual(['只保存一次']);
 expect(await page.evaluate(()=>getSelection().toString())).toBe('');await expect(page.locator('.sid-opening-flap,.sid-turning-leaf,.sid-burying-paper,.is-out')).toHaveCount(0);expect(errors).toEqual([]);
});

test('rose prerequisite and old cross-book chain remain independent and repeatable',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('paperbook-v3'))localStorage.setItem('paperbook-v3',JSON.stringify({visits:3,seen:['ship'],found:[],replies:['旧续写不覆盖'],rose:false,stamp:false}));});
 await enter(page);await page.locator('#open-book-index').scrollIntoViewIfNeeded();await page.locator('#open-book-index').tap();await page.locator('[data-book="ship"]').tap();await step(page,'held');await page.locator('.sid-cover').tap();await step(page,'open');await seek(page,'rose');
 await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('另一朵玫瑰');await back(page);
 await pick(page,'prince');await seek(page,'envelope');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await page.locator('.sid-unfold').tap();await step(page,'letter');await expect(page.locator('.sid-segment').last()).toContainText('玫瑰邮票');await back(page);
 await page.reload();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')));expect(saved.stamp).toBe(true);expect(saved.rose).toBe(true);expect(saved.replies).toEqual(['旧续写不覆盖']);await pick(page,'prince');await seek(page,'envelope');await page.locator('.sid-letter-pick').tap();await step(page,'letter');await expect(page.locator('.sid-segment')).toContainText('玫瑰邮票');
});

test('restored physical books preserve old identities, own/other papers, drafts and discovery flags',async({page})=>{
 await page.addInitScript(()=>{
  const note=(id,author)=>({id,author,kind:'stack',stock:'cream',front:'旧便笺 '+id,replies:[]});
  localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{night:[note('mine','local'),...Array.from({length:41},(_,i)=>note('old-'+i,'N'))]}}));
  localStorage.setItem('paperbook-secret-drafts-v1',JSON.stringify({night:{kind:'stack',front:'原来的创作草稿'}}));
  localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{},baseline:{},changes:{},visit:{id:'old-full',seed:1,lastActive:1,draws:{night:null},found:3,explored:3,quiet:99,events:[]}}));
 });
 await enter(page);await pick(page,'night');const labels=[];
 while(await page.locator('.sid-page-prev').count()){await page.locator('.sid-page-prev').tap();await step(page,'open');}
 for(let i=0;i<100;i++){labels.push(await page.locator('.sid-letter-packet em').textContent());if(!await page.locator('.sid-page-next').count())break;await page.locator('.sid-page-next').tap();await step(page,'open');}
 expect(labels.filter(x=>x.includes('便笺')).length).toBeGreaterThanOrEqual(42);expect(labels).toContain('你夹的便笺');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-artifact-source','authored-playtest');
 await page.locator('.sid-create-pen').tap();await expect(page.locator('#secret-front')).toHaveValue('原来的创作草稿');await page.locator('.sid-desk-close').tap();await step(page,'open');await back(page);
 const saved=await page.evaluate(()=>({notes:JSON.parse(localStorage.getItem('paperbook-secrets-v1')),visit:JSON.parse(localStorage.getItem('paperbook-discovery-v1'))}));expect(saved.notes.books.night).toHaveLength(42);expect(saved.visit.visit.id).toBe('old-full');expect(saved.visit.visit.quiet).toBe(99);
 expect(saved.notes.books.night.some(n=>n.source==='authored-playtest'||n.kind==='postcard')).toBe(false);
});

test('the lower pickup edge belongs to loose paper, not the transparent page-corner hit area',async({page})=>{
 await enter(page);await pick(page,'naval');
 while(await page.locator('.sid-page-prev').count()){await page.locator('.sid-page-prev').tap();await step(page,'open');}
 await page.locator('.sid-page-next').tap();await step(page,'open');
 const label=await page.locator('.sid-letter-packet em').textContent(),number=await page.locator('.sid-page-number').textContent();
 const r=await page.locator('.sid-letter-pick').boundingBox();await page.touchscreen.tap(r.x+r.width*.5,r.y+r.height-4);await step(page,'letter');
 await expect(page.locator('.sid-create-pen')).toBeHidden();await expect(page.locator('.sid-paper-traces')).toBeHidden();await page.locator('[data-sid="put"]').tap();await step(page,'open');await expect(page.locator('.sid-letter-packet em')).toHaveText(label);await expect(page.locator('.sid-page-number')).toHaveText(number);
});

test('ordinary note reading has lower motion cost than opening a relay fold',async({page})=>{
 await enter(page,{motion:true});const times={};
 for(const id of ['garden','siddhartha']){await pick(page,id);if(id==='siddhartha')await seek(page,'relay');const before=Date.now();await page.locator('.sid-letter-pick').tap();await step(page,'letter');times[id]=Date.now()-before;await back(page);}
 test.info().annotations.push({type:'observed-ms',description:JSON.stringify(times)});expect(times.garden).toBeLessThan(times.siddhartha);
});

module.exports={enter,pick,seek,step,back,unfold};
