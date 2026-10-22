const {chromium,webkit,expect}=require('@playwright/test'),fs=require('node:fs');
(async()=>{const results=[];for(const engine of [chromium,webkit]){const browser=await engine.launch();try{for(const width of [320,390]){const page=await browser.newPage({viewport:{width,height:844}});await page.goto('http://127.0.0.1:4173/?v=0.12.0');const review=await page.evaluate(async()=>{
 const image=new Image();image.src='assets/scene/horizontal-books-v0120.png';await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,image.width,image.height).data;
 function solidRun(x,y,h){let start=null,best=null;for(let row=Math.floor(y);row<=Math.ceil(y+h);row++){if(row<y+h&&pixels[(row*image.width+Math.round(x))*4+3]>180){if(start===null)start=row;}else if(start!==null){if(!best||row-start>best.end-best.start)best={start,end:row-1};start=null;}}return best;}
 const world=document.querySelector('.room-world').getBoundingClientRect(),scale=world.width/940;
  function edge(button,fraction){const face=button.querySelector('.spine-face'),s=getComputedStyle(face),r=button.getBoundingClientRect(),size=s.backgroundSize.split(' ').map(parseFloat),pos=s.backgroundPosition.split(' ').map(parseFloat),sw=image.width/(size[0]/100),sh=image.height/(size[1]/100),sx=(image.width-sw)*pos[0]/100,sy=(image.height-sh)*pos[1]/100,run=solidRun(sx+fraction*sw,sy,sh);if(!run)throw Error('Missing opaque book column');const w=parseFloat(s.width),h=parseFloat(s.height),translateY=parseFloat(s.translate.split(' ')[1])||0,matrix=new DOMMatrix(s.transform),origin=s.transformOrigin.split(' ').map(parseFloat);const screenY=y=>r.top+face.offsetTop+translateY+origin[1]+matrix.b*(fraction*w-origin[0])+matrix.d*((y-sy)/sh*h-origin[1])+matrix.f;return{top:screenY(run.start),bottom:screenY(run.end)};}
 const piles=[...document.querySelectorAll('.book-pile')].map(group=>{
  const buttons=[...group.querySelectorAll('.pile-book')];const footY=world.top+Number(group.dataset.pileBase)*scale;

  const joins=buttons.slice(0,-1).flatMap((b,i)=>[.08,.2,.4,.6,.75,.9].map(x=>({upper:b.dataset.id,lower:buttons[i+1].dataset.id,x,gap:edge(buttons[i+1],x).top-edge(b,x).bottom})));
  const feet=[.15,.35,.6,.75].map(x=>({x,gap:footY-edge(buttons.at(-1),x).bottom}));return{id:group.dataset.pile,joins,feet};
 });
 const singles=[['weeks',1428],['seventh',1522]].map(([id,base])=>({id,feet:[.15,.35,.6,.75].map(x=>({x,gap:world.top+base*scale-edge(document.querySelector('.spine[data-id="'+id+'"]'),x).bottom}))}));
 return{image:[image.width,image.height],piles,singles};
 });
 expect(review.piles.flatMap(p=>p.joins).filter(j=>j.gap>.75)).toEqual([]);
 expect([...review.piles,...review.singles].flatMap(p=>p.feet).filter(j=>j.gap>1.5||j.gap< -2)).toEqual([]);
 results.push({engine:engine.name(),width,...review});await page.close();}}finally{await browser.close();}}
 fs.writeFileSync('evidence/bookshop-v0120/contact-review.json',JSON.stringify({scope:'alpha-contour support on thicker five-color binding atlas; longest opaque column avoids transparent padding/specks; browser phone viewports only',results},null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1;});
