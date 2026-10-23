'use strict';
(() => {
  const sheet=document.getElementById('shop-journal');if(!sheet)return;
  // Original shopkeeper fiction. These never enter the real book-club note pool.
  const entries=[
    {id:'closing',title:'打烊了，店主还没走',text:'准备关灯，发现沙发上还摊着一本书。\n等了一会儿，才想起来是我自己看的。\n店主偶尔也会舍不得走。'},
    {id:'unfinished',title:'破折号后面，留个座',text:'收店时看到一张纸，写着：“其实我一直想说——”\n后面空着。\n先替他夹好。明天开门，还是这本书，这一页。'},
    {id:'habits',books:['habits'],title:'七个习惯，七个睡点',text:'本店的猫有七个固定睡觉的位置。\n我每天整理书架，它每天检查我有没有擅自改动其中一个。'},
    {id:'weeks',books:['weeks'],title:'认真发呆，也算日程',text:'今天读到人生只有四千周，决定不再浪费时间。\n于是坐在沙发上，很认真地发了一会儿呆。'},
    {id:'lychee',books:['lychee'],title:'本店暂不承诺次日达',text:'有人问，为什么不在店里卖荔枝。\n我说，读完这本书，你应该能理解本店对配送范围的谨慎。'},
    {id:'prince',books:['prince'],title:'先认出你，再问姓名',text:'今天有人在《小王子》里夹了一句话，没署名。\n我没有替他补上。有些人，大概想先被认出来，再介绍自己。'},
    {id:'tao',books:['tao'],title:'扶正三次，还是随它',text:'整理书架时，把《道德经》扶正了三次。\n它还是靠回旁边那本书。\n行吧，各有各的道。'},
    {id:'night',books:['night'],title:'人坐着，心已经起飞',text:'这本书今天被拿起来，又放回去。\n夹在里面的纸倒换了个位置。看来有人已经出发了，只是暂时还坐在沙发上。'},
    {id:'fiscal',books:['fiscal'],title:'今日盈利：三张便笺',text:'盘了一下本店的账：\n少了一支笔，多了三张便笺。\n钢笔后来在书里找到了。今天算盈利。'},
    {id:'neighbours',books:['gobi','altay'],title:'远方很远，茶还很热',text:'《走出戈壁》和《我的阿勒泰》又被放到了一起。\n一本走得很远，一本让我想住下来。\n茶还热着，我暂时哪儿也没去。'}
  ];
  const ids=entries.map(e=>e.id),byId=new Map(entries.map(e=>[e.id,e]));
  const key='paperbook-journal-v1'+(window.BookSecrets.gameKey==='paperbook-v3'?'':':'+window.BookSecrets.gameKey);
  let ledger={read:[],front:[]};
  const valid=list=>Array.isArray(list)?[...new Set(list.filter(id=>byId.has(id)))]:[];
  try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===1)ledger={read:valid(saved.read),front:valid(saved.front).slice(0,3)};}catch{}
  const leaf=sheet.querySelector('.journal-leaf'),older=sheet.querySelector('[data-journal-older]'),newer=sheet.querySelector('[data-journal-newer]'),reveal=sheet.querySelector('[data-journal-reveal]'),counter=sheet.querySelector('.journal-page-count');
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh',{granularity:'grapheme'}):null;
  const split=text=>segmenter?[...segmenter.segment(text)].map(x=>x.segment):Array.from(text);
  let order=[],page=0,jobs=[],job=0,timer=0,generation=0,following=true,turnAnimation=null;
  function persist(){try{localStorage.setItem(key,JSON.stringify({version:1,...ledger}));}catch{}}
  function clear(){clearTimeout(timer);timer=0;generation++;leaf.querySelectorAll('.is-writing').forEach(e=>e.classList.remove('is-writing'));}
  function read(id){if(!ledger.read.includes(id)){ledger.read.push(id);persist();}}
  function writing(){return job<jobs.length;}
  function controls(){
    older.disabled=(page+1)*3>=order.length;newer.disabled=page===0;reveal.hidden=!writing();
    counter.textContent='第 '+(page+1)+' 页 / '+Math.ceil(order.length/3)+' 页';
    sheet.dataset.journalTyping=String(writing());
  }
  function follow(ink){
    if(!following)return;const mark=ink.querySelector('.journal-cursor'),r=mark?.getBoundingClientRect(),bounds=leaf.getBoundingClientRect();
    if(r&&r.bottom>bounds.bottom-16)leaf.scrollTop+=r.bottom-bounds.bottom+16;
  }
  function tick(token=generation){
    if(token!==generation||!sheet.open||document.hidden||!writing())return;
    const current=jobs[job];current.article.classList.add('is-writing');
    const char=current.chars[current.index++];current.node.appendData(char);follow(current.ink);
    if(current.index===current.chars.length){read(current.id);current.article.classList.remove('is-writing');job++;controls();}
    if(writing())timer=setTimeout(()=>tick(token),/[，。？！：；…—]/.test(char)?110:char==='\n'?100:30);
    else leaf.querySelectorAll('.journal-cursor').forEach(e=>e.remove());
  }
  function fill(){
    if(!sheet.open)return;clear();
    for(;job<jobs.length;job++){const current=jobs[job];current.node.textContent=current.text;read(current.id);}
    leaf.querySelectorAll('.journal-cursor').forEach(e=>e.remove());controls();
  }
  function render(){
    clear();turnAnimation?.cancel();jobs=[];job=0;following=true;leaf.replaceChildren();leaf.scrollTop=0;
    for(const id of order.slice(page*3,page*3+3)){
      const entry=byId.get(id),article=document.createElement('article'),title=document.createElement('h3'),body=document.createElement('p'),reserve=document.createElement('span'),ink=document.createElement('span'),accessible=document.createElement('span');
      article.className='journal-entry';article.dataset.entry=id;title.textContent=entry.title;body.className='journal-entry-body';
      reserve.className='journal-reserve';reserve.setAttribute('aria-hidden','true');reserve.textContent=entry.text;
      ink.className='journal-ink';ink.setAttribute('aria-hidden','true');accessible.className='sr-only';accessible.textContent=entry.text;
      const node=document.createTextNode(ledger.read.includes(id)?entry.text:'');ink.appendChild(node);
      if(!ledger.read.includes(id)){const cursor=document.createElement('i');cursor.className='journal-cursor';cursor.setAttribute('aria-hidden','true');ink.appendChild(cursor);jobs.push({id,text:entry.text,chars:split(entry.text),index:0,node,ink,article});}
      body.append(reserve,ink,accessible);article.append(title,body);leaf.appendChild(article);
    }
    controls();if(motion.matches)fill();else tick();
  }
  function open(){
    // Keep an unfinished front page through close/reload. Once read, choose the next
    // unread batch, giving books already handled by this reader a little precedence.
    if(!ledger.front.length||ledger.front.every(id=>ledger.read.includes(id))){
      const unseen=ids.filter(id=>!ledger.read.includes(id)),seen=typeof state!=='undefined'&&Array.isArray(state.seen)?state.seen:[];
      const rank=id=>{const matches=(byId.get(id).books||[]).map(book=>seen.lastIndexOf(book)).filter(n=>n>=0);return matches.length?Math.max(...matches)+1:0;};
      unseen.sort((a,b)=>rank(b)-rank(a)||ids.indexOf(a)-ids.indexOf(b));
      if(unseen.length)ledger.front=[...unseen,...ledger.front,...ids].filter((id,i,list)=>list.indexOf(id)===i).slice(0,3);
      persist();
    }
    order=[...ledger.front,...ids.filter(id=>!ledger.front.includes(id))];page=0;render();
  }
  function turn(delta){
    const next=page+delta;if(next<0||next*3>=order.length)return;
    page=next;window.BookPaperSound?.play('page');render();
    if(!motion.matches)turnAnimation=leaf.animate([{opacity:.55,transform:'translateX('+(delta>0?-6:6)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:180,easing:'ease-out'});
  }
  sheet.addEventListener('sheetopened',open);sheet.addEventListener('close',()=>{if(!sheet.open){clear();turnAnimation?.cancel();}});
  reveal.addEventListener('click',fill);
  leaf.addEventListener('click',()=>{if(!window.getSelection()?.toString())fill();});
  older.addEventListener('click',()=>turn(1));newer.addEventListener('click',()=>turn(-1));
  for(const event of ['wheel','touchmove','pointerdown'])leaf.addEventListener(event,()=>{following=false;},{passive:true});
  sheet.addEventListener('keydown',event=>{
    if(event.target.closest('.journal-backmatter,button,input,textarea,select'))return;
    if(event.key==='Enter'||event.key===' '){event.preventDefault();if(writing())fill();else turn(1);}
    else if(event.key==='ArrowLeft'){event.preventDefault();turn(1);}
    else if(event.key==='ArrowRight'){event.preventDefault();turn(-1);}
  });
  document.addEventListener('visibilitychange',()=>{clearTimeout(timer);timer=0;if(!document.hidden&&sheet.open&&writing())tick();});
  motion.addEventListener('change',()=>{if(motion.matches&&sheet.open)fill();});
})();
