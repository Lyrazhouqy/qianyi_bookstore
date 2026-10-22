const{chromium,expect}=require('@playwright/test'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch(),results=[];try{for(const width of [320,390]){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 await context.addInitScript(()=>localStorage.setItem('paperbook-discovery-v1',JSON.stringify({version:1,known:{japan:['qianyi-japan-16893']},baseline:{},changes:{},visit:{id:'direct-pile-qa',seed:1,lastActive:Date.now(),draws:{japan:null},explored:1,found:3,lastFound:1,dry:0,quiet:0,events:[]}})));
 const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,radiusX:3,radiusY:3}]});
 async function tap(selector){const el=page.locator(selector);await el.scrollIntoViewIfNeeded();const r=await el.boundingBox();await touch('touchStart',r.x+r.width/2,r.y+r.height/2);await touch('touchEnd');}
 const step=s=>expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
 await page.goto('http://127.0.0.1:4173/?v=0.12.0');await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.book-pile-trigger')).toHaveCount(0);
 const picked=[];
 for(const id of ['habits','japan','tokyo','gobi','altay','weeks','seventh','siddhartha','questions','tao','courage','bondage','vegetarian','toad','otherlife','bigtech']){
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).visits);
  await tap('.spine[data-id="'+id+'"] .painted-title');await step('held');await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-reader-book',id);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')).visits)).toBe(before+1);
  const font=await page.locator('.sid-cover-title').evaluate(e=>getComputedStyle(e).fontFamily);
  expect(font).toBe(await page.locator('.spine[data-id="'+id+'"] .painted-title').evaluate(e=>getComputedStyle(e).fontFamily));
  if(id==='japan'){
   await page.screenshot({path:`evidence/bookshop-v0120/native-cover-${width}.png`});
   await tap('.sid-cover');await step('open');await tap('.sid-letter-pick');await step('letter');await expect(page.locator('.sid-segment')).toContainText('黄锦猫Daray');await page.screenshot({path:`evidence/bookshop-v0120/native-letter-${width}.png`});await tap('[data-sid="put"]');await step('open');
  }
  await touch('touchStart',8,90);await touch('touchEnd');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');picked.push(id);
 }
 expect(await page.evaluate(()=>getSelection().toString())).toBe('');expect(errors).toEqual([]);results.push({width,directSingleTap:picked,oneVisitPerPick:true,coverAndSpineFontMatch:true,noteAndReturn:true,errors});await context.close();
 }}finally{await browser.close();}fs.writeFileSync('evidence/bookshop-v0120/native-piles.json',JSON.stringify({scope:'Chromium CDP simulated native touch, isolated known-note QA fixture; not physical iPhone',results},null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1;});
