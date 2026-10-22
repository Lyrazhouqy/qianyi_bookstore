const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const dir='evidence/bookshop-v073';
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch();const results=[];
 try{for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{if(!localStorage.getItem('paperbook-v3'))localStorage.setItem('paperbook-v3',JSON.stringify({mode:'dense',replies:[],found:[],seen:[]}));});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173/');
  const cdp=await context.newCDPSession(p);
  const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,radiusX:3,radiusY:3}]});
  const tap=async selector=>{const el=p.locator(selector);await el.scrollIntoViewIfNeeded();const b=await el.boundingBox();await touch('touchStart',b.x+b.width/2,b.y+b.height/2);await touch('touchEnd',0,0);};
  const step=async s=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
  await tap('.spine[data-id="stranger"]');await step('held');await tap('.sid-cover');await step('open');
  let b=await p.locator('.sid-letter-pick').boundingBox();await touch('touchStart',b.x+5,b.y+5);await touch('touchEnd',0,0);await step('letter');await expect(p.locator('.sid-cover')).toHaveAttribute('aria-expanded','true');expect(await p.evaluate(()=>getSelection().toString())).toBe('');
  await tap('[data-sid="put"]');await step('open');b=await p.locator('.sid-letter-pick').boundingBox();const x=b.x+b.width*.6,y=b.y+b.height*.6;await touch('touchStart',x,y);for(let i=1;i<=10;i++){await touch('touchMove',x,y-i*11);await p.evaluate(()=>new Promise(requestAnimationFrame));}await touch('touchEnd',0,0);await step('packet');await tap('.sid-letter-pick');await step('letter');await tap('[data-sid="put"]');await step('open');
  const saved=await p.evaluate(()=>localStorage.getItem('paperbook-v3'));await tap('.sid-create-pen');await step('composing');await p.screenshot({path:`${dir}/phone-${width}-stationery.png`});await p.locator('#secret-front').fill('等雨停了，再来翻这一页。');await tap('.sid-bury');await step('open');expect(await p.evaluate(()=>localStorage.getItem('paperbook-v3'))).toBe(saved);await tap('.sid-letter-pick');await step('letter');await expect(p.locator('.sid-segment')).toContainText('等雨停了');await p.screenshot({path:`${dir}/phone-${width}-back.png`});
  await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');await p.reload();await tap('.spine[data-id="stranger"]');await step('held');await tap('.sid-cover');await step('open');await tap('.sid-paper-tab:last-child');await tap('.sid-letter-pick');await step('letter');await expect(p.locator('.sid-segment')).toContainText('等雨停了');expect(errors).toEqual([]);
  results.push({width,passed:['native corner tap does not close cover','native upward extraction','no selected text','write one note/insert/read','original progress unchanged by creation','reload and rediscover'],errors});await context.close();
 }
 fs.writeFileSync(`${dir}/native-touch.json`,JSON.stringify({at:new Date().toISOString(),results,limitation:'Chromium native simulated touch; not physical iPhone acceptance'},null,2)+'\n');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
