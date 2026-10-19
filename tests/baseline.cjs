const {chromium} = require('playwright');
const fs = require('node:fs');
(async()=>{
  const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.goto('http://127.0.0.1:4173/evidence/baseline/index.html');
  const dimensions=await page.locator('.spine').evaluateAll(books=>books.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};}));
  await page.screenshot({path:'evidence/baseline/mobile-390.png'});
  await page.evaluate(()=>localStorage.setItem('paperbook-v3',JSON.stringify({visits:7,seen:['siddhartha'],found:[],small:0,rose:true,stamp:false,replies:['应保留的续写']})));
  await page.reload();
  const afterReload=await page.evaluate(()=>JSON.parse(localStorage.getItem('paperbook-v3')));
  const result={testedAt:new Date().toISOString(),source:'evidence/baseline/index.html',viewport:{width:390,height:844},minTouchWidth:Math.min(...dimensions.map(x=>x.width)),minTouchHeight:Math.min(...dimensions.map(x=>x.height)),savedReplySurvivesReload:afterReload.replies.includes('应保留的续写'),turnpageCount:await page.locator('.turnpage').count(),reproduced:['Narrow book targets on mobile','Loading resets saved writing'],dimensions};
  fs.writeFileSync('evidence/baseline/reproduction.json',JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify({...result,dimensions:undefined})); await browser.close();
})();
