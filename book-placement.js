'use strict';
// Painted objects from the approved concept; content/save identities stay in content.js.
window.BookArrangement=(()=>{
 const atlas='assets/scene/book-arrangement-v0110.png',W=942,H=1669;
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const skins={
  siddhartha:[329,57,49,178,'#6b9295'],questions:[373,75,62,162,'#d6b46b'],tao:[434,77,63,160,'#a4ad7e'],diamond:[656,69,66,166,'#b97c66'],presence:[728,53,64,183,'#dbcca7'],naval:[789,80,47,157,'#d3c7a5'],fiscal:[847,74,56,164,'#e3d6b8'],
  courage:[329,303,55,171,'#759896'],red:[387,320,66,152,'#bf856b'],solitude:[447,303,67,172,'#a9b58c'],bondage:[654,305,58,168,'#c58f78'],vegetarian:[711,317,51,157,'#e4d5b3'],
  toad:[331,551,53,199,'#658d91'],otherlife:[377,573,59,178,'#c5a66a'],bigtech:[429,552,58,199,'#a0aa81'],notetaking:[630,554,54,194,'#b57b61'],drive:[682,550,60,201,'#d8c49a'],symposium:[775,550,58,201,'#e6d8bb'],tendays:[845,560,58,190,'#dfcfad'],
  flatCloud:[505,169,144,29,'#8daeb1'],flatNight:[501,200,155,34,'#587a8a'],flatHill:[519,401,131,33,'#b9c587'],flatSea:[511,438,153,35,'#5e8c9a'],flatField:[504,661,129,34,'#acb985'],flatRose:[510,699,149,47,'#ad7159'],
  prince:[316,1353,123,166,'#a0b196'],lychee:[450,1365,127,156,'#bf976b'],
  gobi:[275,1117,171,65,'#a1ae88'],altay:[270,1162,184,54,'#c8a17b']
 };
 const simpleAtlas='assets/scene/simple-book-icons-v0118.png',simpleSize=1254;
 const quietAtlas='assets/scene/quiet-spine-icons-v0119.png';
 const quietSkins={
  siddhartha:[322,34,148,410,'#72999c'],questions:[552,34,148,410,'#d6b46b'],tao:[784,34,148,410,'#a4ad7e'],
  courage:[322,456,148,389,'#72999c'],bondage:[552,456,148,389,'#bb846c'],vegetarian:[784,456,148,389,'#e4d5b3'],
  toad:[322,857,148,365,'#72999c'],otherlife:[552,857,148,365,'#d6b46b'],bigtech:[784,857,148,365,'#a4ad7e']
 };
 const simpleSkins={
  ...quietSkins,
  prince:[200,55,380,590,'#a4ad7e'],lychee:[680,55,380,590,'#d6b46b'],
  naval:[195,685,150,520,'#72999c'],fiscal:[435,685,145,520,'#d6b46b'],
  symposium:[675,685,145,520,'#a4ad7e'],tendays:[910,685,150,520,'#bb846c']
 };
 const plainSpineSkins={
  '#72999c':[55,95,225,970],'#d6b46b':[325,95,220,970],
  '#a4ad7e':[588,95,215,970],'#bb846c':[843,95,232,970],'#e4d5b3':[1113,95,223,970]
 };
 const plainSpineStyle=id=>{const color=simpleSkins[id][4],[x,y,w,h]=plainSpineSkins[color];return `--book-color:${color};--painted-ink:#242b21;--art-image:url(assets/scene/blank-spines-v0120.png);--art-size:${1388/w*100}% ${1133/h*100}%;--art-position:${x/(1388-w)*100}% ${y/(1133-h)*100}%;`;};
 const simpleStyle=id=>{const[x,y,w,h,color]=simpleSkins[id],image=quietSkins[id]?quietAtlas:simpleAtlas;return `--book-color:${color};--painted-ink:#242b21;--art-image:url(${image});--art-size:${simpleSize/w*100}% ${simpleSize/h*100}%;--art-position:${x/(simpleSize-w)*100}% ${y/(simpleSize-h)*100}%;`;};
 const artStyle=skin=>{const[x,y,w,h,color]=skin;const rgb=color.slice(1).match(/../g).map(n=>parseInt(n,16));const ink=rgb.reduce((a,b)=>a+b,0)<390?'#f5ecd5':'#473f2c';return `--book-color:${color};--painted-ink:${ink};--art-size:${W/w*100}% ${H/h*100}%;--art-position:${x/(W-w)*100}% ${y/(H-h)*100}%;`;};
 // Atlas rows keep one color across cover and binding. The rendered binding
 // is taller, with its sloped source foot leveled and anchored to the support.
 const horizontalSkins={
  flatNight:[10,94,890,290,'#72999c',366,16/450],
  flatCloud:[10,94,890,290,'#72999c',366,16/450],
  flatSea:[10,94,890,290,'#72999c',366,16/450],
  flatOchre:[10,400,890,295,'#d6b46b',676,12/450],
  flatHill:[10,707,890,307,'#a4ad7e',994,17/450],
  flatField:[10,707,890,307,'#a4ad7e',994,17/450],
  flatRose:[10,1025,890,313,'#bb846c',1320,17/450],
  flatIvory:[10,1352,890,317,'#e4d5b3',1650,16/450]
 };
 const horizontalStyle=(key,width)=>{const[x,y,w,h,color,foot,slope]=horizontalSkins[key],angle=-Math.atan(slope*400/h),atCenter=(foot-y)*400/h,pad=400-(Math.sin(angle)*(-5)+Math.cos(angle)*(atCenter-400)+400);return `--book-color:${color};--painted-ink:#242b21;--art-image:url(assets/scene/horizontal-books-v0120.png);--art-size:${906/w*100}% ${1735/h*100}%;--art-position:${x/(906-w)*100}% ${y/(1735-h)*100}%;--sprite-ratio:890/400;--binding-angle:${angle*180/Math.PI}deg;--binding-foot-pad:${width*pad/890}px;`;};
 const cleanPlate=(name,x,y,w,h)=>`<div class="stack-clean ${name}" aria-hidden="true" style="left:${x/940*100}%;top:${y/1672*100}%;width:${w/940*100}%;height:${h/1672*100}%;background-size:${940/w*100}% ${1673/h*100}%;background-position:${x/(940-w)*100}% ${y/(1673-h)*100}%"></div>`;
 const title=id=>books.find(b=>b[0]===id)[1];
 const clip='polygon(5% 0,94% 0,100% 5%,98% 98%,6% 100%,0 95%,0 5%)';
 function book(id,x,y,w,h,skin,kind='',label=false){
  const simple=!!simpleSkins[id],quiet=!!quietSkins[id],displayTitle=({habits:'七个习惯',toad:'蛤蟆先生'})[id]||title(id);label=label||simple;
  return `<button class="spine painted-book ${kind} ${simple?'painted-simple':''} ${quiet?'painted-quiet':''}" data-id="${id}" aria-label="抽出《${esc(title(id))}》" style="left:${x/940*100}%;top:${y/1672*100}%;width:${w/940*100}%;height:${h/1672*100}%;${kind==='painted-flat'?horizontalStyle(skin===skins.flatRose?'flatRose':'flatHill',w):simple?(kind==='painted-standing'?plainSpineStyle(id):simpleStyle(id)):artStyle(skin)}--sprite-ratio:${kind==='painted-flat'?890/400:simple?(kind==='painted-cover'?380/590:67/190):skin[2]/skin[3]};--standing-title-size:${Math.min(22,h*.96*.72/(displayTitle.length*1.12))}px;--art-clip:${clip}"><span class="spine-face">${label?`<span class="painted-title"><span class="painted-title-letters">${esc(displayTitle)}</span></span>`:''}</span></button>`;
 }
 function standing(id,x,y,w,h){return book(id,x,y,w,h,skins[id],'painted-standing');}
 function pile(id,items,x,base,w){
  // A thicker visible binding also separates neighboring pointer targets.
  // Each atlas row carries its own alpha-foot compensation.
  const step=w*186/890,height=w*400/890+step*(items.length-1),y=base-height;
  return `<div class="book-pile" data-pile="${id}" data-pile-base="${base}" style="left:${x/940*100}%;top:${y/1672*100}%;width:${w/940*100}%;height:${height/1672*100}%;--pile-crop-top:${id==='front-lower'?Math.max(0,1452-y):0}px;--pile-count:${items.length};--pile-step:${step}px;--pile-type-size:${w*98/890}px;--pile-book-height:${w*400/890}px">${items.map(([bookId,skin],i)=>`<button class="spine painted-book pile-book" data-id="${bookId}" aria-label="抽出《${esc(title(bookId))}》" style="--pile-index:${i};${horizontalStyle(skin,w)}--art-clip:none"><span class="spine-face"><span class="painted-title"><span class="painted-title-letters">${esc(({habits:'七个习惯'})[bookId]||title(bookId))}</span></span></span></button>`).join('')}</div>`;
 }
 // Thin spines share enlarged transparent hit areas. Resolve a pointer to the
 // nearest visible spine, so an upper book's larger area cannot steal a lower one.
 function hitAt(x,y){
  for(const group of document.querySelectorAll('.book-pile')){
   const choices=[...group.querySelectorAll('.pile-book')];
   if(!choices.some(el=>{const r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;}))continue;
   return choices.reduce((best,el)=>{const r=el.querySelector('.painted-title').getBoundingClientRect(),d=Math.abs(y-(r.top+r.height/2));return !best||d<best.d?{el,d}:best;},null)?.el;
  }
  return [...document.querySelectorAll('.spine:not(.pile-book)')].find(el=>{const r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;})||null;
 }
 function targetFor(event){const button=event.target.closest('.spine');return !button?null:event.detail===0||!button.closest('.book-pile')?button:hitAt(event.clientX,event.clientY)||button;}
 function renderWall(root){
  const row1=[['siddhartha',238,261,67,159],['questions',305,261,67,159],['tao',372,261,67,159],['naval',573,261,67,159],['fiscal',640,261,67,159]];
  const row2=[['courage',238,464,67,159],['bondage',305,464,67,159],['vegetarian',372,464,67,159]];
  const row3=[['toad',238,650,67,178],['otherlife',305,650,67,178],['bigtech',372,650,67,178],['symposium',573,650,67,178],['tendays',640,650,67,178]];
  root.innerHTML=`<div class="wall-clean top" aria-hidden="true"></div><div class="wall-clean middle" aria-hidden="true"></div><div class="wall-clean bottom" aria-hidden="true"></div>`+[...row1,...row2,...row3].map(args=>standing(...args)).join('')+pile('wall-top',[['diamond','flatOchre'],['presence','flatIvory']],439,420,134)+pile('wall-middle',[['red','flatRose'],['solitude','flatSea']],439,623,120)+pile('wall-bottom',[['notetaking','flatCloud'],['drive','flatOchre']],439,828,134);

 }
 function renderTables(front,coffee){
  const art=tableBooks[0],pad=10;
  const old=`left:${(art.x-pad)/940*100}%;top:${(art.y-pad)/1672*100}%;width:${(art.width+pad*2)/940*100}%;height:${(art.height+pad*2)/1672*100}%;--book-color:${art.color};--cover-art-size:${940/art.width*100}% ${1673/art.height*100}%;--cover-art-position:${art.x/(940-art.width)*100}% ${art.y/(1673-art.height)*100}%;--cover-art-clip:${art.clip};`;
  front.innerHTML=cleanPlate('front-left-clean',185,1254,160,184)+cleanPlate('front-right-clean',697,1360,91,76)+cleanPlate('front-lower-clean',180,1451,217,79)+cleanPlate('front-lower-right-clean',665,1452,115,80)+`<button class="spine display-book" data-id="cat" aria-label="抽出《猫的来信》" style="${old}"><span class="spine-face" aria-hidden="true"></span></button>`+book('prince',354,1300,96,124,skins.prince,'painted-cover')+book('lychee',466,1293,96,131,skins.lychee,'painted-cover')+pile('front-left',[['habits','flatNight'],['japan','flatOchre'],['tokyo','flatIvory']],193,1424,150)+book('weeks',674,1428-96,132,96,skins.flatField,'painted-flat',true)+pile('front-lower',[['sentence','flatIvory'],['submarine','flatSea']],186,1522,162)+book('seventh',642,1522-96,156,96,skins.flatRose,'painted-flat',true);
  coffee.innerHTML=cleanPlate('coffee-clean',334,1102,138,96)+pile('coffee',[['gobi','flatHill'],['altay','flatRose']],350,1186,145);
  for(const id of Object.keys(simpleSkins)){const b=document.querySelector(`.spine[data-id="${id}"]`),[x,y,w,h]=simpleSkins[id],image=quietSkins[id]?quietAtlas:simpleAtlas;b.style.setProperty('--cover-art-image',`url("${image}")`);b.style.setProperty('--cover-art-size',`${simpleSize/w*100}% ${simpleSize/h*100}%`);b.style.setProperty('--cover-art-position',`${x/(simpleSize-w)*100}% ${y/(simpleSize-h)*100}%`);b.style.setProperty('--cover-art-clip',clip);}
 }
 return{renderWall,renderTables,hitAt,targetFor,coverArt:id=>simpleSkins[id]?{painted:true}:null};
})();
