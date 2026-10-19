const {webkit}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await webkit.launch(),views=[];
 for(const [width,height] of [[320,568],[390,844],[844,390]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});await p.goto('http://127.0.0.1:4173/?v=0.6.3');await p.locator('.room-art').evaluate(i=>i.decode());await p.evaluate(()=>document.fonts.ready);
  const geometry=await p.locator('.book-slot').evaluateAll(slots=>slots.map(el=>({key:el.dataset.slot,book:el.dataset.id||null,rect:el.getBoundingClientRect().toJSON(),empty:el.classList.contains('is-empty')})));
  assert.equal(geometry.length,13);assert.equal(geometry.filter(s=>s.empty).length,0);
  for(const r of geometry)assert(r.rect.width>=43.99);
  const stateBefore=await p.locator('body').getAttribute('data-phase');
  for(const slot of await p.locator('.book-slot.is-empty').all()){
   await slot.scrollIntoViewIfNeeded();const box=await slot.boundingBox();await p.touchscreen.tap(box.x+box.width/2,box.y+box.height*.6);assert.equal(await p.locator('body').getAttribute('data-phase'),stateBefore);
  }
  await p.reload();await p.locator('.room-art').evaluate(i=>i.decode());await p.screenshot({path:'evidence/bookshop-v064/scene-'+width+'.png'});views.push({width,height,geometry});await p.close();
 }
 await browser.close();fs.writeFileSync('evidence/bookshop-v064/slots-review.json',JSON.stringify(views,null,2)+'\n');console.log('13 playable bays and 44px bay widths checked in 3 views.');
})().catch(e=>{console.error(e);process.exitCode=1});
