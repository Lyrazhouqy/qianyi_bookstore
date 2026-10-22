const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const dir='evidence/bookshop-v080';
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch(),results=[];
 try{for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(p),touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,radiusX:3,radiusY:3}]});
  async function tap(selector){const el=p.locator(selector);await el.scrollIntoViewIfNeeded();const r=await el.boundingBox();await touch('touchStart',r.x+r.width/2,r.y+r.height/2);await touch('touchEnd',0,0);}
  const step=s=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
  const painted=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  async function pick(){await tap('.spine[data-id="night"]');await step('held');await tap('.sid-cover');await step('open');await expect.poll(()=>p.locator('.sid-create-pen').evaluate(el=>{const r=el.getBoundingClientRect(),q=document.querySelector('.sid-page').getBoundingClientRect();return Math.abs(r.x+r.width/2-q.x-q.width/2);})).toBeLessThan(1);}
  await p.goto('http://127.0.0.1:4173/?playtest=revisit&reader=B');await pick();await painted();await p.screenshot({path:`${dir}/B-book-${width}.png`});
  await tap('.sid-paper-traces button');await step('open');await tap('.sid-letter-pick');await step('letter');await expect(p.locator('.sid-segment')).toContainText('今年却开始喜欢回家的路');await expect(p.locator('.sid-segment')).toHaveCount(1);await tap('[data-sid="put"]');await step('open');
  for(let i=0;i<3&&await p.locator('.sid-letter-packet em').first().textContent()!=='书友 N的便笺';i++){await tap('.sid-paper-traces button');await step('open');}
  await expect(p.locator('.sid-letter-packet em').first()).toHaveText('书友 N的便笺');const r=await p.locator('.sid-letter-pick').boundingBox(),x=r.x+r.width*.55,y=r.y+r.height*.6;
  await touch('touchStart',x,y);for(let i=1;i<=10;i++){await touch('touchMove',x,y-i*11);await painted();}await touch('touchEnd',0,0);await step('packet');await tap('.sid-letter-pick');await step('letter');await expect(p.locator('.sid-segment')).toContainText('暂时不出发也没关系');await painted();await p.screenshot({path:`${dir}/B-read-${width}.png`});
  await tap('.sid-stack-pen');await p.locator('#sid-reply').fill('等下次起飞，也记得看看回家的路。');await tap('[data-sid="save"]');await step('letter');await expect(p.locator('.sid-segment').last()).toContainText('回家的路');expect(await p.evaluate(()=>getSelection().toString())).toBe('');
  await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');await p.goto('http://127.0.0.1:4173/?playtest=revisit&reader=N');await pick();await tap('.sid-letter-pick');await step('letter');await tap('.sid-unfold');await step('letter');await expect(p.locator('.sid-segment').last()).toContainText('书友 B的回应');await painted();await p.screenshot({path:`${dir}/N-reply-${width}.png`});expect(errors).toEqual([]);
  results.push({width,passed:['native tap own old paper does not close book or take N paper','native upward extraction then unfold','response pen tap and insert','N receives actual B reply','no selected text or page errors'],errors});await context.close();
 }}finally{await browser.close();}
 fs.writeFileSync(`${dir}/native-touch.json`,JSON.stringify({at:new Date().toISOString(),results,limitation:'Chromium native simulated touch, automated text filling; not physical iPhone acceptance'},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
