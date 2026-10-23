const {chromium,expect}=require('@playwright/test'),fs=require('node:fs');
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
(async()=>{const browser=await chromium.launch(),results=[];try{for(const width of [320,390]){
 const folder=`evidence/authored-stories/native-${width}`;fs.mkdirSync(folder,{recursive:true});
 const context=await browser.newContext({viewport:{width,height:width===320?568:844},isMobile:true,hasTouch:true,recordVideo:{dir:folder}}),page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[],trail=[];
 page.on('pageerror',e=>errors.push(e.message));const step=s=>expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:['touchEnd','touchCancel'].includes(type)?[]:[{x,y,radiusX:3,radiusY:3}]});
 async function tap(selector){const e=page.locator(selector);await e.scrollIntoViewIfNeeded();const r=await e.boundingBox();await touch('touchStart',r.x+r.width/2,r.y+r.height/2);await touch('touchEnd');}
 async function open(book){await tap('#open-book-index');await tap(`[data-book="${book}"]`);await step('held');await tap('.sid-cover');await step('open');trail.push({action:'open',book,at:Date.now()});}
 await page.addInitScript(()=>{localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{},baseline:{},changes:{},visit:{id:'native-stories-qa',seed:1,lastActive:1,draws:{habits:'original-b-habits',sentence:'original-b-locksmith',weeks:'original-b-prep-3'},events:[]}}));});
 await page.goto(base+'/?playtest=rhythm&stories=humor-v1');
 await open('habits');await tap('.sid-letter-pick');await step('letter');await expect(page.locator('.sid-story-columns section')).toHaveCount(2);await page.screenshot({path:folder+'/checklist-front.png'});
 await tap('.sid-unfold');await step('letter');await expect(page.locator('.sid-segment').last()).toContainText('国际社会配合');trail.push({action:'unfold-ending',id:'original-b-habits',at:Date.now()});await page.screenshot({path:folder+'/checklist-ending.png'});
 // A real Chromium touch sequence; all source material remains loaded, storage is isolated.
 const corner=await page.locator('.sid-page-next').boundingBox(),before=await page.locator('.sid-page-number').innerText();await touch('touchStart',corner.x+corner.width*.8,corner.y+corner.height*.8);await touch('touchEnd');await step('open');expect(await page.locator('.sid-page-number').innerText()).not.toBe(before);trail.push({action:'open-paper-direct-next',at:Date.now()});
 await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await open('sentence');await tap('.sid-letter-pick');await step('letter');for(let i=0;i<2;i++){await tap('.sid-unfold');await step('letter');}await expect(page.locator('[data-sid="write"]')).toHaveAttribute('aria-label','接着写一句');trail.push({action:'long-three-folds',id:'original-b-locksmith',at:Date.now()});await page.screenshot({path:folder+'/long-ending.png'});
 await tap('.sid-page-next');await step('open');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
 await open('weeks');await tap('.sid-letter-pick');await step('letter');await tap('.sid-unfold');await step('letter');await expect(page.locator('.sid-segment').last()).toContainText('画成夫妻');trail.push({action:'cross-book-ending-first',id:'original-b-prep-3',at:Date.now()});await tap('.sid-page-next');await step('open');
 const curl=await page.locator('.sid-page-next').boundingBox(),beforeDrag=await page.locator('.sid-page-number').innerText(),x=curl.x+curl.width*.8,y=curl.y+curl.height*.8;
 await touch('touchStart',x,y);for(let i=1;i<=8;i++)await touch('touchMove',x-i*18,y-i*.3);await touch('touchEnd');await step('open');expect(await page.locator('.sid-page-number').innerText()).not.toBe(beforeDrag);trail.push({action:'corner-touch-drag',at:Date.now()});
 expect(errors).toEqual([]);const video=await page.video().path();await context.close();results.push({width,engine:'Chromium',input:'CDP native touch; keyboard Escape for shelf return; no real-device claim',source:'full real and authored pools, deterministic opening seed only',errors,trail,video});
 }}finally{await browser.close();}fs.writeFileSync('evidence/authored-stories/native-results.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
