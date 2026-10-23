const{test,expect}=require('@playwright/test');
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
async function enter(page,{trusted=false,mismatch=false,long=false}={}){
 // These marked fixtures exercise rendering; they are not quotations attributed to a real book.
 const fixture={text:long?'【测试专用长引文】'+('只用于检查纸面长文排版与滚动。'.repeat(50)):'【测试专用引文】这一段用于检查左页对应关系。',bookTitle:mismatch?'另一部测试书':'纳瓦尔宝典',source:'测试资料，第1段（非真实原著）',verified:trusted};
 await page.route('**/real-materials.js',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:await res.text()+`\nconst originalPool=window.BookRealMaterials;window.BookRealMaterials=()=>{const rows=originalPool();for(const note of rows.naval)delete note.quotation;rows.naval[0].quotation=${JSON.stringify(fixture)};return rows;};`});});
 await page.addInitScript(()=>{localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{naval:['qianyi-naval-18005','qianyi-naval-22185']},baseline:{},changes:{},visit:{id:'quotation-qa',seed:1,lastActive:Date.now(),draws:{naval:'qianyi-naval-18005'},explored:1,found:3,lastFound:1,dry:0,quiet:0,events:[]}}));localStorage.setItem('paperbook-secret-reading-v1',JSON.stringify({books:{naval:{last:'qianyi-naval-18005',items:{'qianyi-naval-18005':{front:false},'qianyi-naval-22185':{front:true}}}}}));});
 await page.goto('/?v=0.10.1');await page.locator('.spine[data-id="naval"]').click();await step(page,'held');await page.locator('.sid-cover').click();await step(page,'open');
}
test('the left excerpt follows the selected paper and falls back after turning to an unrelated paper',async({page})=>{
 await enter(page,{trusted:true});const copy=page.locator('.sid-inside-copy');await expect(copy).toHaveAttribute('data-kind','quotation');await expect(copy.locator('strong')).toHaveText('这段话的原文');await expect(copy.locator('.sid-synopsis')).toHaveText('【测试专用引文】这一段用于检查左页对应关系。');await expect(copy.locator('.sid-quotation-source')).toHaveText('—— 测试资料，第1段（非真实原著）');
 const x=await copy.boundingBox(),back=await page.locator('.sid-cover-back').boundingBox();expect(x.x).toBeGreaterThanOrEqual(back.x-1);expect(x.x+x.width).toBeLessThanOrEqual(back.x+back.width+1);
 await page.locator('.sid-page-next').click();await step(page,'open');await expect(copy).toHaveAttribute('data-kind','synopsis');await expect(copy.locator('strong')).toHaveText('关于这本书');await expect(copy.locator('.sid-quotation-source')).toBeHidden();await expect(copy.locator('.sid-synopsis')).toHaveText('有人一天读完，也有人想把它放在手边，反复重读。');
 for(let i=0;i<4&&await copy.getAttribute('data-kind')!=='quotation';i++){await page.locator('.sid-page-next').click();await step(page,'open');}await expect(copy).toHaveAttribute('data-kind','quotation');
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

test('the real paired passage survives an old save and never follows a different reader note',async({page})=>{
 const fs=require('node:fs'),vm=require('node:vm'),sandbox={window:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../real-materials.js'),'utf8'),sandbox);
 const notes=JSON.parse(JSON.stringify(sandbox.window.BookRealMaterials().naval));
 const paired=notes.find(n=>n.id==='qianyi-naval-22185'),quote=paired.quotation;
 expect(notes.filter(n=>n.quotation)).toHaveLength(1);
 // Simulate a pre-quotation save, including a response. Forged saved metadata must not win.
 for(const n of notes){n.quotation={verified:true,bookTitle:'纳瓦尔宝典',text:'伪造的存档原文',source:'未审阅存档'};}
 paired.replies=[{author:'local',text:'旧存档里已经写好的回应'}];
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(({notes,id})=>{
  localStorage.setItem('paperbook-secrets-v1',JSON.stringify({version:1,books:{naval:notes}}));
  localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{naval:notes.map(n=>n.id)},baseline:{},changes:{},visit:{id:'real-pair-qa',seed:1,lastActive:Date.now(),draws:{naval:id},explored:1,found:3,lastFound:1,dry:0,quiet:0,events:[]}}));
  localStorage.setItem('paperbook-secret-reading-v1',JSON.stringify({books:{naval:{last:id,items:{}}}}));
 },{notes,id:paired.id});
 await page.goto('/?v=0.14.0&playtest=rhythm');
 await page.locator('.spine[data-id="naval"]').click();await step(page,'held');
 await page.locator('.sid-cover').click();await step(page,'open');
 const copy=page.locator('.sid-inside-copy');
 await expect(copy).toHaveAttribute('data-kind','quotation');
 await expect(copy.locator('.sid-synopsis')).toHaveText(quote.text);
 await expect(copy.locator('.sid-quotation-source')).toHaveText('—— '+quote.source);
 await expect(page.locator('.sid-letter-packet em').first()).toHaveText('Vickyyy🌟的便笺');
 await page.screenshot({path:test.info().outputPath('real-pair-left.png'),animations:'disabled'});
 // The reader sorts pages by unread state and reverses insertion order.
 // Walk the actual page corners rather than assuming the pool's array order.
 let quotations=0;
 for(let i=0;i<notes.length;i++){
  const id=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secret-reading-v1')).books.naval.last);
  await expect(copy).toHaveAttribute('data-kind',id===paired.id?'quotation':'synopsis');
  await expect(copy).not.toContainText('伪造的存档原文');
  if(id===paired.id){quotations++;await expect(copy.locator('.sid-synopsis')).toHaveText(quote.text);}
  if(i<notes.length-1){await page.locator('.sid-page-next').click();await step(page,'open');}
 }
 expect(quotations).toBe(1);
 while(await copy.getAttribute('data-kind')!=='quotation'){
  await page.locator('.sid-page-next').click();await step(page,'open');
 }
 await page.locator('.sid-letter-pick').click();await step(page,'letter');
 await expect(page.locator('.sid-letter-reader')).toContainText(paired.front);
 const left=await copy.boundingBox(),right=await page.locator('.sid-letter-reader').boundingBox(),viewport=page.viewportSize();
 expect(right.x).toBeGreaterThan(left.x+left.width+4);
 expect(right.x+right.width).toBeLessThanOrEqual(viewport.width-4);
 expect(right.y).toBeGreaterThanOrEqual(12);expect(right.y+right.height).toBeLessThanOrEqual(viewport.height-12);
 await page.screenshot({path:test.info().outputPath('passage-left-note-right.png'),animations:'disabled'});
 await copy.click();await step(page,'letter');
 await page.locator('.sid-unfold').click();await step(page,'letter');
 await expect(page.locator('.sid-letter-reader')).toContainText('旧存档里已经写好的回应');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secrets-v1')));
 expect(saved.books.naval.find(n=>n.id===paired.id).replies[0].text).toBe('旧存档里已经写好的回应');
});

test('note extraction stays on the right through animation, response and return',async({page})=>{
 await enter(page,{trusted:true,long:true});
 const frames=await page.evaluate(async()=>{
  const room=document.querySelector('.siddhartha-room'),paper=room.querySelector('.sid-letter'),left=room.querySelector('.sid-inside-copy').getBoundingClientRect();
  room.querySelector('.sid-letter-pick').click();const frames=[];
  await new Promise(resolve=>{function sample(){const r=paper.getBoundingClientRect();frames.push({x:r.x,right:r.right,leftTextRight:left.right});if(room.dataset.step==='letter')resolve();else requestAnimationFrame(sample);}requestAnimationFrame(sample);});return frames;
 });
 expect(frames.length).toBeGreaterThan(4);
 for(const frame of frames){expect(frame.x).toBeGreaterThan(frame.leftTextRight);expect(frame.right).toBeLessThanOrEqual(page.viewportSize().width);}
 const copy=page.locator('.sid-inside-copy');await copy.evaluate(el=>el.scrollTop=100);expect(await copy.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await copy.click();await step(page,'letter');
 await page.locator('[data-sid="write"]').click();await page.locator('#sid-reply').fill('左右对照时也能回应');await page.locator('[data-sid="save"]').click();await step(page,'letter');
 await expect(page.locator('.sid-letter-reader')).toContainText('左右对照时也能回应');
 await page.locator('[data-sid="put"]').click();await step(page,'open');
 const packet=await page.locator('.sid-letter').boundingBox(),left=await copy.boundingBox();expect(packet.x).toBeGreaterThan(left.x+left.width);
 await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
});
