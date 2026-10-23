const {test,expect}=require('@playwright/test');
const fs=require('fs'),vm=require('vm');const scope={window:{}};vm.createContext(scope);vm.runInContext(fs.readFileSync(require.resolve('../real-materials.js'),'utf8'),scope);const real=scope.window.BookRealMaterials().naval.find(x=>x.id==='qianyi-naval-22185');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function open(p){await p.locator('.spine[data-id="naval"]').tap();await step(p,'held');await p.locator('.sid-cover').tap();await step(p,'open');}
async function take(p){await p.locator('.sid-letter-pick').tap();await step(p,'letter');}
async function back(p){await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');}
async function setup(p,items,{realSource=false}={}){
 await p.emulateMedia({reducedMotion:'reduce'});
 if(!realSource)await p.route('**/real-materials.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BookRealMaterials=()=>({});'}));
 await p.addInitScript(items=>{if(localStorage.getItem('dates-fixture'))return;localStorage.setItem('dates-fixture','yes');localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{naval:items}}));localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{naval:[items[0].id]},baseline:{},changes:{},visit:{id:'legacy',seed:1,lastActive:0,draws:{naval:items[0].id},found:3,explored:3,events:[]}}));},items);
 await p.goto('/?v=0.14.4&playtest=rhythm');
}
const n=(id,author,date)=>({id,kind:'stack',author,authorName:author,front:'隔离测试文字 '+id,stock:'cream',replies:[],...(date?{date}:{})});
test('historical dates come from reviewed source even with an older or forged saved date',async({page})=>{
 const old={...real,date:'2099-01-01',replies:[{author:'N',text:'以前的回应，没有留下日期'}]};
 await setup(page,[old],{realSource:true});const before=await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'));
 await open(page);await take(page);await expect(page.locator('.sid-note-signature time').first()).toHaveAttribute('datetime',real.date);
 await expect(page.locator('.sid-note-signature').first()).toContainText(real.authorName);
 await expect(page.locator('.sid-synopsis')).toContainText(real.quotation.text);
 await expect(page.locator('.sid-note-signature time').first()).toBeInViewport();
 await page.screenshot({path:test.info().outputPath('dated-real-note.png'),animations:'disabled'});
 await page.locator('.sid-unfold').tap();await step(page,'letter');await expect(page.locator('.sid-segment').last().locator('time')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'))).toBe(before);
});
test('read and return switches authors, drains unread papers, then rotates old sheets while reload stays stable',async({page})=>{
 const items=[n('a1','A','2024-01-01'),n('a2','A','2025-02-02'),n('b1','B','2025-03-03')];await setup(page,items);
 const sequence=[];for(let i=0;i<4;i++){await open(page);await take(page);sequence.push((await page.locator('.sid-segment').first().innerText()).match(/隔离测试文字 (\w+)/)[1]);await back(page);}
 expect(sequence).toEqual(['a1','b1','a2','b1']);
 await open(page);const label=await page.locator('.sid-letter-packet em').innerText();const draw=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-discovery-v1')).visit.draws.naval);await back(page);await page.reload();await open(page);expect(await page.locator('.sid-letter-packet em').innerText()).toBe(label);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-discovery-v1')).visit.draws.naval)).toBe(draw);
});
test('legacy undated paper stays undated; new reply and own paper retain their local dates after reload',async({page})=>{
 await setup(page,[n('legacy','N')]);await open(page);await take(page);await expect(page.locator('.sid-note-signature time')).toHaveCount(0);
 const day=await page.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');});
 await page.getByRole('button',{name:'回应这张便笺',exact:true}).tap();await page.locator('#sid-reply').fill('今天新留下的回应');await page.locator('[data-sid="save"]').tap();await step(page,'letter');await expect(page.locator('.sid-segment').last().locator('time')).toHaveAttribute('datetime',day);
 await page.locator('[data-sid="put"]').tap();await step(page,'open');await page.locator('.sid-create-pen').tap();await page.locator('#secret-front').fill('今天夹入的新便笺');await page.locator('.sid-bury').tap();await step(page,'open');await take(page);await expect(page.locator('.sid-note-signature time')).toHaveAttribute('datetime',day);await back(page);await page.reload();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secrets-v1')).books.naval);expect(saved.find(x=>x.id==='legacy').date).toBeUndefined();expect(saved.find(x=>x.id==='legacy').replies[0].date).toBe(day);expect(saved.find(x=>x.author==='local').date).toBe(day);
 await open(page);if(await page.locator('.siddhartha-room').getAttribute('data-paper-owner')!=='own'){await page.locator('.sid-page-next,.sid-page-prev').first().tap();await step(page,'open');}await take(page);const segments=await page.locator('.sid-segment').first().innerText();expect(segments).toContain('今天夹入的新便笺');await expect(page.locator('.sid-note-signature time')).toHaveAttribute('datetime',day);
});

test('another unread date is preferred when all paper belongs to the same author',async({page})=>{
 await setup(page,[n('old','A','2024-01-01'),n('same-day','A','2024-01-01'),n('later','A','2025-02-02')]);
 await open(page);await take(page);await back(page);await open(page);await take(page);
 await expect(page.locator('.sid-segment').first()).toContainText('隔离测试文字 later');
 await expect(page.locator('.sid-note-signature time')).toHaveAttribute('datetime','2025-02-02');
});
