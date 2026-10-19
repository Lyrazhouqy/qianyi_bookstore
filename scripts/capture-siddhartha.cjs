const {webkit,devices}=require('playwright');
(async()=>{
 const browser=await webkit.launch();
 const ctx=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1,recordVideo:{dir:'evidence/siddhartha-v044/video',size:{width:390,height:844}}});
 const page=await ctx.newPage();await page.goto('http://127.0.0.1:4173/?focus=siddhartha');
 const wait=step=>page.waitForFunction(value=>document.querySelector('.siddhartha-room')?.dataset.step===value,step);
 await page.locator('.spine[data-id="siddhartha"]').first().tap();await wait('held');await page.screenshot({path:'evidence/siddhartha-v044/held-390.png'});
 await page.locator('.sid-cover').tap();await wait('open');await page.screenshot({path:'evidence/siddhartha-v044/open-390.png'});
 await page.locator('.sid-letter-pick').tap();await wait('letter');for(let i=0;i<2;i++){await page.locator('.sid-unfold').tap();await wait('letter');}
 await page.screenshot({path:'evidence/siddhartha-v044/letter-390.png'});
 await page.locator('[data-sid="put"]').tap();await wait('open');await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');
 await ctx.close();await browser.close();
})();
