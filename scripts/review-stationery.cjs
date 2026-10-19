const {chromium,webkit,devices}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const evidence=[];
 for(const [name,type,viewport] of [['webkit-566',webkit,{width:566,height:853}],['chromium-390',chromium,{width:390,height:844}],['webkit-320',webkit,{width:320,height:568}]]){
  const browser=await type.launch();const page=await browser.newPage({...devices['iPhone 13'],viewport,deviceScaleFactor:1});
  const assetResponses=[];page.on('response',response=>{if(response.url().includes('/assets/'))assetResponses.push({file:response.url().split('/assets/')[1],status:response.status()});});
  await page.goto('http://127.0.0.1:4173/?focus=siddhartha&v=0.4.4');
  const wait=value=>page.waitForFunction(v=>document.querySelector('.siddhartha-room')?.dataset.step===v,value);
  await page.locator('.spine[data-id="siddhartha"]').first().tap();await wait('held');await page.locator('.sid-cover').tap();await wait('open');
  await page.locator('.sid-letter-pick').tap();await wait('letter');
  const font=await page.evaluate(async()=>{await document.fonts.load('17px "PaperYozai"','书友在信上留下了一句话');await document.fonts.ready;const el=document.querySelector('.sid-segment');return{loaded:document.fonts.check('17px "PaperYozai"'),family:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize,background:getComputedStyle(el).backgroundImage};});
  const loadedImage=await page.evaluate(async()=>{const image=new Image();image.src='assets/paper/letter-paper-texture.png';await image.decode();return{width:image.naturalWidth,height:image.naturalHeight};});
  await page.screenshot({path:'evidence/siddhartha-v044/'+name+'-first-fold.png'});
  while(await page.locator('.sid-unfold').count()){await page.locator('.sid-unfold').tap();await wait('letter');}
  await page.locator('.sid-pen').scrollIntoViewIfNeeded();await page.screenshot({path:'evidence/siddhartha-v044/'+name+'-letter.png'});
  await page.getByRole('button',{name:'拿起笔续写'}).tap();await page.getByRole('textbox').fill('这些字，写在留给下一位读者的信上。');await page.screenshot({path:'evidence/siddhartha-v044/'+name+'-writing.png'});
  const typingFont=await page.getByRole('textbox').evaluate(el=>getComputedStyle(el).fontFamily);
  await page.getByRole('button',{name:'留在信上',exact:true}).tap();await wait('letter');
  await page.locator('.sid-return').tap();await page.waitForFunction(()=>document.body.dataset.phase==='idle');
  if(!font.loaded||!font.family.includes('PaperYozai')||!typingFont.includes('PaperYozai')||loadedImage.width!==1996||loadedImage.height!==998||assetResponses.some(response=>response.status!==200))throw Error('Font or paper did not load: '+name);
  evidence.push({name,viewport,font,image:loadedImage,typingFont,assetResponses});await browser.close();
 }
 fs.writeFileSync('evidence/siddhartha-v044/stationery-review.json',JSON.stringify(evidence,null,2)+'\n');console.log('Original font decoded and used in letter and typing; original paper decoded; 566/390/320px flows and screenshots complete.');
})();
