// Public production smoke in isolated, silent browser contexts.
const {chromium,webkit,expect}=require('@playwright/test');
expect.configure({timeout:30000});
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const version=require('../package.json').version,url=process.env.BASE_URL||'https://paper-bookshop-playtest.vercel.app/v'+version+'/',out=path.join('evidence','deployment-v'+version.replaceAll('.',''));
fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({proxy:{server:'http://127.0.0.1:7890'}});
 try{for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   const Audio=window.Audio;window.Audio=class extends Audio{constructor(...a){super(...a);this.muted=true;}};
   const Native=window.AudioContext||window.webkitAudioContext;
   if(Native)window.AudioContext=class extends Native{constructor(...a){super(...a);const gate=super.createGain();gate.gain.value=0;gate.connect(super.destination);this.quietDestination=gate;}get destination(){return this.quietDestination||super.destination;}};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response.status(),200);await expect(page.locator('html')).toHaveAttribute('data-build','paper-bookshop-game-v'+version);await page.locator('.room-art').evaluate(e=>e.decode());await expect(page.locator('.spine')).toHaveCount(34);
  assert.equal(await page.locator('#room-zoom').count(),0);
  const framing=await page.evaluate(()=>{const e=document.querySelector('#room-viewport'),r=document.querySelector('.room-world').getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,scrollLeft:e.scrollLeft,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};});
  assert(framing.left>=0&&framing.right<=width&&framing.scrollLeft===0&&framing.scrollWidth===framing.clientWidth);
  await page.screenshot({path:path.join(out,`${name}-${width}-online-room.png`)});
  const tap=async s=>{await page.locator(s).scrollIntoViewIfNeeded();await page.locator(s).tap();};const step=s=>expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
  await tap('#change-window');assert.deepEqual(await page.locator('[data-window-scene]').evaluateAll(es=>es.map(e=>e.dataset.windowScene)),['original','rain','nightSnow','custom']);await tap('[data-window-scene="nightSnow"]');await expect(page.locator('#change-window')).toHaveAttribute('data-scenery','nightSnow');await tap('#window-settings [data-close-sheet]');
  await tap('.wall-note');await expect(page.locator('#shop-journal')).toBeVisible();assert((await page.locator('.journal-entry h3').allTextContents()).every(t=>!t.startsWith('关于')));assert.equal(await page.locator('.journal-entry-body').first().evaluate(e=>getComputedStyle(e).fontSize),'16px');await tap('#shop-journal [data-close-sheet]');
  await tap('#open-book-index');await tap('[data-book="naval"]');await step('held');await tap('.sid-cover');await step('open');await tap('.sid-letter-pick');await step('letter');await expect(page.locator('.sid-inside-copy')).toBeVisible();await expect(page.locator('.sid-letter-reader')).toBeVisible();await page.screenshot({path:path.join(out,`${name}-${width}-online-letter.png`)});await tap('.sid-page-next');await step('open');
  await tap('.sid-create-pen');await step('composing');await page.locator('#secret-front').fill('【线上隔离验收】手机打开，留下一张纸。');await tap('.sid-bury');await step('open');assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-secrets-v1')).books.naval)).some(n=>n.front==='【线上隔离验收】手机打开，留下一张纸。'));await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
  await tap('.spine[data-id="cat"]');await step('held');await tap('.sid-cover');await step('open');await page.locator('.sid-album-page img').evaluate(e=>e.decode());await expect(page.locator('.sid-album-page img')).toHaveAttribute('src',/cat-daily-tree-v01416/);await page.screenshot({path:path.join(out,`${name}-${width}-online-album.png`)});assert.deepEqual(errors,[]);
  results.push({engine:name,width,passed:['initial full-width room without zoom button','public access','version','34 books','three scenery choices and blank upload','new diary titles and smaller text','cover and note','paired reading','next page','create local note','cat album'],audioOutput:'muted; no listening verdict',errors});fs.writeFileSync(path.join(out,'online-smoke.json'),JSON.stringify({version,url,at:new Date().toISOString(),boundary:'isolated phone browser emulation, not physical phone acceptance',results},null,2)+'\n');console.log(name,width,'passed');await context.close();
 }}finally{await browser.close();}
}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
