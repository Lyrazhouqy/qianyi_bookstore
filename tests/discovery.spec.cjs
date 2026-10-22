const {test,expect}=require('@playwright/test');
const directorKey='paperbook-discovery-visit-v1-A',notesKey='paperbook-discovery-notes-v1';
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),directorKey);
async function open(p,id='naval'){await p.locator('.spine[data-id="'+id+'"]').click();await step(p,'held');await p.locator('.sid-cover').click();await step(p,'open');}
async function back(p){await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');}
const note=(id,author='N',replies=[])=>({id,author,authorName:author==='A'?'':'书友'+id,kind:'stack',stock:'cream',front:'便笺正文'+id,replies});
async function setup(p,books,{draws={},known={},reading={books:{}}}={}){
 await p.emulateMedia({reducedMotion:'reduce'});await p.route('**/real-materials.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BookRealMaterials=()=>({});'}));
 await p.addInitScript(({books,draws,known,reading,directorKey,notesKey})=>{if(localStorage.getItem('open-pool-fixture'))return;localStorage.setItem('open-pool-fixture','yes');localStorage.setItem(notesKey,JSON.stringify({version:1,books}));localStorage.setItem('paperbook-discovery-reading-v1-A',JSON.stringify(reading));localStorage.setItem(directorKey,JSON.stringify({version:1,known,baseline:{},changes:{},visit:{id:'legacy-exhausted',seed:1,lastActive:Date.now()-2*24*60*60*1000,draws,found:3,explored:8,lastFound:8,quiet:99,dry:0,events:[]}}));},{books,draws,known,reading,directorKey,notesKey});await p.goto('/?v=0.13.0&playtest=discovery&reader=A');
}
test('all40 other papers and own paper are separate reachable pages; writing beyond12 and24 preserves everything',async({page})=>{
 const papers=[note('mine','A'),...Array.from({length:40},(_,i)=>note('n'+i))];await setup(page,{naval:papers},{draws:{naval:'n39'},reading:{books:{naval:{items:{mine:{front:true,replies:0}},last:'mine'}}}});await open(page);
 const labels=[];for(let i=0;i<41;i++){await expect(page.locator('.sid-letter-packet em')).toHaveCount(1);labels.push(await page.locator('.sid-letter-packet em').textContent());if(i<40){await page.locator('.sid-page-next').click();await step(page,'open');}}
 expect(new Set(labels).size).toBe(41);expect(labels).toContain('你夹的便笺');expect(labels).toContain('书友n0的便笺');expect(labels).toContain('书友n39的便笺');await expect(page.locator('.sid-page-next')).toHaveCount(0);
 await page.locator('.sid-create-pen').click();await page.locator('#secret-front').fill('第四十二张新便笺');await page.locator('.sid-bury').click();await step(page,'open');const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).books.naval,notesKey);expect(saved).toHaveLength(42);expect(saved.some(x=>x.id==='n0')).toBe(true);expect(saved.some(x=>x.id==='n39')).toBe(true);await page.reload();await open(page);expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).books.naval.length,notesKey)).toBe(42);
});
test('old exhausted quota and long inactivity cannot hide papers across books',async({page})=>{
 const ids=['naval','questions','tao','courage','bigtech'];await setup(page,Object.fromEntries(ids.map(id=>[id,[note(id)]])),{draws:{naval:null}});
 for(const id of ids){await open(page,id);await expect(page.locator('.sid-letter-packet em')).toHaveText('书友'+id+'的便笺');await back(page);}const before=await state(page);expect(before.visit.found).toBe(8);expect(before.visit.id).toBe('legacy-exhausted');
 await page.reload();for(const id of ids){await open(page,id);await back(page);}const after=await state(page);expect(after.visit.draws).toEqual(before.visit.draws);expect(after.visit.found).toBe(8);expect(after.visit.id).toBe(before.visit.id);
});
test('new reply on own paper is first while another author remains reachable on another page',async({page})=>{
 await setup(page,{naval:[note('mine','A',[{author:'N',text:'给你的新回应'}]),note('other')]},{draws:{naval:null},reading:{books:{naval:{items:{mine:{front:true,replies:0}},last:'mine'}}}});await open(page);await expect(page.locator('.sid-letter-packet em')).toHaveText('你的便笺与新回应');expect((await state(page)).visit.found).toBe(3);await page.locator('.sid-letter-pick').click();await step(page,'letter');await page.locator('.sid-unfold').click();await step(page,'letter');await expect(page.locator('.sid-segment').last()).toContainText('给你的新回应');await page.locator('[data-sid="put"]').click();await step(page,'open');await page.locator('.sid-page-next').click();await step(page,'open');await expect(page.locator('.sid-letter-packet em')).toHaveText('书友other的便笺');await expect(page.locator('.sid-letter-packet em')).toHaveCount(1);
});
test('plain own paper cannot block another author, even with a legacy null draw and full old quota',async({page})=>{
 await setup(page,{naval:[note('mine','A'),note('other')]},{draws:{naval:null},reading:{books:{naval:{items:{mine:{front:true,replies:0}},last:'mine'}}}});await open(page);await expect(page.locator('.sid-letter-packet em')).toHaveText('书友other的便笺');await back(page);await page.reload();await open(page);await expect(page.locator('.sid-letter-packet em')).toHaveText('书友other的便笺');await page.locator('.sid-page-next').click();await step(page,'open');await expect(page.locator('.sid-letter-packet em')).toHaveText('你夹的便笺');
});
