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

module.exports={enter,pick,seek,step,back,unfold};
