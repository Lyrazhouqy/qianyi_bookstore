const {test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function enter(p,actor='A'){await p.goto('/?playtest=revisit&reader='+actor);}
async function book(p){await p.locator('.spine[data-id="night"]').click();await step(p,'held');await p.locator('.sid-cover').click();await step(p,'open');}
async function take(p){await p.locator('.sid-letter-pick').click();await step(p,'letter');}
async function back(p){await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');}
async function reply(p,text){await p.getByRole('button',{name:'回应这张便笺',exact:true}).click();await p.locator('#sid-reply').fill(text);await p.locator('[data-sid="save"]').click();await step(p,'letter');}
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});
test('A sees N first, reads without obligation, and a quiet revisit remembers the same paper',async({page})=>{
 await enter(page);await expect(page.locator('[data-id="night"]')).toHaveClass(/has-new-paper/);await book(page);
 await expect(page.locator('.sid-letter-packet em').first()).toHaveText('书友 N的便笺');await expect(page.locator('.sid-paper-traces')).not.toContainText('书友 B的便笺');await expect(page.locator('.sid-page-next')).toBeVisible();
 await take(page);await expect(page.locator('.sid-segment')).toContainText('暂时不出发也没关系');await expect(page.locator('.sid-stack-pen img')).toBeVisible();
 await expect(page.locator('.sid-stack-pen')).toHaveClass(/is-inviting/);await back(page);await expect(page.locator('[data-id="night"]')).not.toHaveClass(/has-new-paper/);
 await book(page);await expect(page.locator('.sid-letter-packet em').first()).toHaveText('书友 N的便笺');await take(page);await expect(page.locator('.sid-stack-pen')).not.toHaveClass(/is-inviting/);expect(await page.evaluate(()=>localStorage.getItem('paperbook-revisit-notes-v1'))).toBeNull();
});
test('B turns to a separate page for their own old note; it never sits beside N’s paper',async({page})=>{
 await enter(page,'B');await book(page);await expect(page.locator('.sid-letter-packet')).toHaveCount(1);await expect(page.locator('.sid-letter-packet em')).toHaveText('书友 N的便笺');await expect(page.getByRole('button',{name:'抽出你留下的便笺',exact:true})).toHaveCount(0);
 const next=page.locator('.sid-page-next');await expect.poll(()=>next.evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
 await next.click();await step(page,'open');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-paper-owner','own');await expect(page.locator('.sid-letter-packet em')).toHaveText('你夹的便笺');await take(page);await expect(page.locator('.sid-segment')).toHaveCount(1);await expect(page.locator('.sid-segment')).toContainText('今年却开始喜欢回家的路');await expect(page.locator('.sid-unfold')).toHaveCount(0);await expect(page.getByRole('button',{name:'给自己补一句',exact:true})).toBeVisible();
 await page.locator('[data-sid="put"]').click();await step(page,'open');await page.locator('.sid-page-prev').click();await step(page,'open');await expect(page.locator('.sid-letter-packet em')).toHaveText('书友 N的便笺');
});
test('an actual A reply belongs to N, reaches N on revisit, and does not become B’s reply',async({page})=>{
 await enter(page,'A');await book(page);await take(page);await reply(page,'也许回家的路，就是今天的远方。');await expect(page.locator('.sid-segment').last()).toContainText('你的回应');await back(page);
 await enter(page,'N');await expect(page.locator('[data-id="night"]')).toHaveClass(/has-new-paper/);await book(page);await expect(page.locator('.sid-letter-packet em').first()).toHaveText('你的便笺与新回应');await take(page);await page.locator('.sid-unfold').click();await step(page,'letter');await expect(page.locator('.sid-segment').last()).toContainText('书友 A的回应');await expect(page.locator('.sid-segment').last()).toContainText('今天的远方');await back(page);await expect(page.locator('[data-id="night"]')).not.toHaveClass(/has-new-paper/);
 const notes=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-revisit-notes-v1')).books.night);expect(notes.find(x=>x.id==='revisit-B').replies).toEqual([]);expect(notes.find(x=>x.id==='revisit-N').replies).toHaveLength(1);
});
test('N can really leave a new note, A discovers it next, and original saves stay untouched',async({page})=>{
 await enter(page,'N');const original={version:1,books:{night:[{id:'real-note',kind:'stack',front:'原存档，不动它',back:'',stock:'cream',replies:[]}]}};await page.evaluate(x=>{localStorage.setItem('paperbook-secrets-v1',JSON.stringify(x));localStorage.setItem('paperbook-v3','{"visits":77}');},original);
 await book(page);await page.locator('.sid-create-pen').click();await page.locator('#secret-front').fill('N亲手夹入的第三张纸 <script>');await page.locator('.sid-bury').click();await step(page,'open');await back(page);
 await enter(page,'A');await book(page);await take(page);await expect(page.locator('.sid-segment')).toContainText('N亲手夹入的第三张纸 <script>');await expect(page.locator('.sid-segment script')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('paperbook-secrets-v1'))).toBe(JSON.stringify(original));expect(await page.evaluate(()=>localStorage.getItem('paperbook-v3'))).toBe('{"visits":77}');
});
test('opening the cover does not mark a note read; failed reply save keeps the writing',async({page})=>{
 await enter(page);await book(page);await back(page);await book(page);await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-fresh-paper','true');await take(page);await page.locator('.sid-stack-pen').click();await page.locator('#sid-reply').fill('尚未保存的回应');
 await page.evaluate(()=>{window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='paperbook-revisit-notes-v1')throw new DOMException('full','QuotaExceededError');return window.realSet.call(this,k,v);};});await page.locator('[data-sid="save"]').click();await expect(page.locator('.sid-message')).toContainText('这张纸还没夹稳');await expect(page.locator('#sid-reply')).toHaveValue('尚未保存的回应');
 await page.evaluate(()=>Storage.prototype.setItem=window.realSet);await page.locator('[data-sid="save"]').click();await step(page,'letter');const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-revisit-notes-v1')).books.night.find(x=>x.id==='revisit-N').replies.length);expect(count).toBe(1);
});
test('page corners reach every known sheet without a second paper preview and stay tappable after rotation',async({page})=>{
 await enter(page,'B');await book(page);await page.setViewportSize({width:667,height:320});await expect.poll(()=>page.locator('.sid-paper-traces').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
 const labels=new Set();for(let i=0;i<3;i++){labels.add(await page.locator('.sid-letter-packet em').first().textContent());if(await page.locator('.sid-page-next').count()){await page.locator('.sid-page-next').click();await step(page,'open');}}
 expect(labels.size).toBe(3);await page.locator('.sid-page-prev').click();await step(page,'open');await take(page);await expect(page.locator('.sid-stack-pen')).toBeVisible();await page.locator('.sid-stack-pen').click();await expect(page.locator('#sid-reply')).toBeVisible();
});
test('animated page turn conceals the next paper until the leaf settles and honors a queued return',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await enter(page,'B');await book(page);await page.locator('.sid-page-next').click();await step(page,'page-turn');
 const during=await page.evaluate(()=>({hidden:document.querySelector('.sid-stage > .sid-letter').style.visibility,leaves:document.querySelectorAll('.sid-turning-leaf').length,nav:getComputedStyle(document.querySelector('.sid-paper-traces')).visibility}));expect(during).toEqual({hidden:'hidden',leaves:1,nav:'hidden'});
 await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');await expect(page.locator('.sid-turning-leaf')).toHaveCount(0);await book(page);await expect(page.locator('.sid-letter-packet')).toHaveCount(1);
});
