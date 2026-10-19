const {webkit}=require('playwright'),fs=require('node:fs');
(async()=>{const b=await webkit.launch();try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:1});await p.goto('http://127.0.0.1:4173/?v=0.6.4');await p.locator('.room-art').evaluate(i=>i.decode());await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'evidence/bookshop-v064/scene-390.png'});
 const wait=s=>p.waitForFunction(s=>document.querySelector('.siddhartha-room').dataset.step===s,s),paint=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 for(const id of ['rain','forest','station','slow']){
  await p.locator('.spine[data-id="'+id+'"]').tap();await wait('held');await paint();await p.screenshot({path:'evidence/bookshop-v064/'+id+'-cover.png'});
  await p.locator('.sid-cover').tap();await wait('open');await paint();await p.screenshot({path:'evidence/bookshop-v064/'+id+'-open.png'});
  await p.locator('.sid-letter-pick').tap();await wait('letter');await paint();await p.screenshot({path:'evidence/bookshop-v064/'+id+'-note.png'});
  await p.locator('.sid-return').tap();await p.waitForFunction(()=>document.body.dataset.phase==='idle');
 }
 console.log('Four new books captured with normal motion, original typography and paper.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
