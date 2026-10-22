const {chromium,expect}=require('@playwright/test');const fs=require('node:fs');
const dir='evidence/bookshop-v092',key='paperbook-discovery-visit-v1-A';fs.mkdirSync(dir,{recursive:true});
(async()=>{const browser=await chromium.launch(),results=[];try{for(const width of [320,390]){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await context.addInitScript(key=>{if(localStorage.getItem(key))return;localStorage.setItem(key,JSON.stringify({version:1,known:{stranger:['pool-stranger-0']},baseline:{},changes:{},visit:{id:'touch-fixture',seed:1,lastActive:Date.now(),draws:{stranger:'pool-stranger-0'},explored:1,found:1,lastFound:1,dry:0,quiet:0,events:[]}}));},key);
 const p=await context.newPage(),cdp=await context.newCDPSession(p),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const frames=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 async function point(x,y){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,radiusX:3,radiusY:3}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 async function tap(selector){const loc=p.locator(selector);await expect(loc).toBeVisible();await loc.scrollIntoViewIfNeeded();await frames();const r=await loc.boundingBox();await point(r.x+r.width/2,r.y+r.height/2);}
 const step=s=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s),state=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 async function open(){await tap('.spine[data-id="stranger"]');await step('held');await tap('.sid-cover');await step('open');}
 await p.goto('http://127.0.0.1:4173/?v=0.9.2&playtest=discovery&reader=A');await open();const first=await p.locator('.sid-letter-packet em').first().textContent();
 await tap('.sid-letter-pick');await step('letter');await frames();await p.screenshot({path:`${dir}/first-read-${width}.png`});
 await tap('[data-sid="put"]');await step('open');await tap('.sid-cover');await step('held');await tap('.sid-cover');await step('open');expect((await state()).visit.draws.stranger).toBe('pool-stranger-0');
 const stage=await p.locator('.sid-stage').boundingBox();await point(stage.x+12,stage.y+12);await expect(p.locator('body')).toHaveAttribute('data-phase','idle');expect((await state()).visit.ready.stranger).toBe(true);
 await p.reload();await open();const next=(await state()).visit.draws.stranger;expect(next).toBe('pool-stranger-1');const second=await p.locator('.sid-letter-packet em').first().textContent();expect(second).not.toBe(first);await expect(p.locator('.sid-paper-traces button')).toBeVisible();await frames();await p.screenshot({path:`${dir}/reopened-book-${width}.png`});
 await tap('.sid-letter-pick');await step('letter');await frames();await p.screenshot({path:`${dir}/second-read-${width}.png`});expect(await p.locator('.sid-segment').first().evaluate(el=>getComputedStyle(el).fontFamily)).toContain('PaperYozai');expect(await p.locator('.sid-letter-reader').evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('letter-paper-texture');expect(await p.evaluate(()=>getSelection().toString())).toBe('');expect(errors).toEqual([]);
 results.push({width,first,second,next,checks:['native touch read and shelf return','cover-only reopen stable','pending chance survives reload','new paper and retained old paper edge','font and paper texture retained'],errors});await context.close();
 }}finally{await browser.close();}fs.writeFileSync(`${dir}/native-reopen.json`,JSON.stringify({at:new Date().toISOString(),scope:'Chromium CDP simulated touch with controlled QA state, not blind playtest or physical iPhone',results},null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1;});
