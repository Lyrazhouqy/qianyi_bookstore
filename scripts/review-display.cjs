const {webkit}=require('playwright'),fs=require('node:fs');let b;
(async()=>{b=await webkit.launch();const views=[];
 for(const [width,height] of [[320,568],[390,844],[844,390]]){
  const p=await b.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});await p.goto('http://127.0.0.1:4173/?v=0.6.6');await p.locator('.room-art').evaluate(i=>i.decode());await p.evaluate(()=>document.fonts.ready);
  await p.locator('#display-books').evaluate(el=>el.scrollIntoView({block:'end',behavior:'instant'}));await p.locator('.display-book').first().scrollIntoViewIfNeeded();await p.screenshot({path:'evidence/bookshop-v066/display-'+width+'.png'});
  for(const id of ['leaves','clouds','cat']){
   const book=p.locator('.display-book[data-id="'+id+'"]');await book.scrollIntoViewIfNeeded();await book.tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='held');await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   if(width===390)await p.screenshot({path:'evidence/bookshop-v066/'+id+'-held.png'});
   await p.locator('.sid-cover').tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='open');await p.locator('.sid-letter-pick').tap();await p.waitForFunction(()=>document.querySelector('.siddhartha-room').dataset.step==='letter');
   if(width===390)await p.screenshot({path:'evidence/bookshop-v066/'+id+'-note.png'});
   await p.locator('.sid-return').tap();await p.waitForFunction(()=>document.body.dataset.phase==='idle');
  }
  views.push({width,height,books:await p.locator('.display-book').evaluateAll(nodes=>nodes.map(el=>({id:el.dataset.id,hit:el.getBoundingClientRect().toJSON(),face:el.querySelector('.spine-face').getBoundingClientRect().toJSON()})))});await p.close();
 }
 fs.writeFileSync('evidence/bookshop-v066/display-visual.json',JSON.stringify(views,null,2)+'\n');await b.close();console.log('Three display covers and notes reviewed in three viewports.');
})().catch(async e=>{console.error(e);await b?.close();process.exitCode=1;});
