'use strict';
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'paperbook-v3';
const colors = ['#738676', '#b17b64', '#778d9c'];
const freshState = () => ({visits:0, seen:[], found:[], small:0, rose:false, stamp:false, replies:[], mode:'natural'});
const esc = value => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return freshState();
    const next = freshState();
    for (const key of ['seen','found']) next[key] = Array.isArray(saved[key]) ? saved[key].filter(id => books.some(book => book[0] === id)) : [];
    next.replies = Array.isArray(saved.replies) ? saved.replies.filter(value => typeof value === 'string') : [];
    next.visits = Number.isSafeInteger(saved.visits) && saved.visits >= 0 ? saved.visits : 0;
    next.small = next.found.length;
    next.stamp = saved.stamp === true;
    next.rose = saved.rose === true || next.stamp;
    next.mode = saved.mode === 'dense' ? 'dense' : 'natural';
    return next;
  } catch { return freshState(); }
}
let state = load();
let selected = null, source = null, unfolded = 1, writing = false, draft = '', phase = 'idle', closeRequested = false;
const animations = new Set();
function setPhase(value) {
  phase = value;
  document.body.dataset.phase = value;
  $('paper').setAttribute('aria-busy', String(value !== 'reading' && value !== 'idle'));
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $('save-warning').hidden = true;
    return true;
  } catch {
    $('save-warning').hidden = false;
    $('save-warning').textContent = '浏览器暂时无法保存。本次续写仍在，关闭或刷新页面后可能丢失。';
    return false;
  }
}
function status() {
  $('status').textContent = '翻书 ' + state.visits + ' 次 · 小发现 ' + state.small + ' 次 · ' + (state.stamp ? '🌹 邮票已获得' : state.rose ? '玫瑰线索进行中' : '自由探索');
  for (const id of ['natural','dense']) $(id).setAttribute('aria-pressed', String(state.mode === id));
  save();
}
function updateViewport() {
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty('--view-height', (viewport?.height || innerHeight) + 'px');
  document.documentElement.style.setProperty('--view-top', (viewport?.offsetTop || 0) + 'px');
}
function settleAnimations() {
  for (const animation of animations) { try { animation.finish(); } catch { animation.cancel(); } }
}
async function motion(element, frames, duration) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !element.animate || document.hidden) return;
  let animation;
  try {
    animation = element.animate(frames, {duration, easing:'cubic-bezier(.22,.75,.27,1)', fill:'none'});
    animations.add(animation);
    await animation.finished;
  } catch { /* Cancellation still proceeds to a stable, interactive state. */ }
  finally { if (animation) { animations.delete(animation); animation.cancel(); } }
}
function shelves() {
  // Thirteen physical bays: five / three / five. The middle-right globe stays in place.
  // A 94-unit bay is at least 44 CSS px at the smallest (440-unit) scene scale.
  const rows = [
    {y:261,h:159,slots:[['ship',93,'#7ca6ad'],['prince',90,'#d47757'],['rain',78,'#91a7ae'],['stranger',92,'#e8dfbe'],['forest',84,'#a6b17f']]},
    {y:464,h:159,slots:[['siddhartha',95,'#e9c776'],['station',80,'#c99c83'],['garden',93,'#8e9c70']]},
    {y:650,h:178,slots:[['night',88,'#dfbd65'],['kafka',96,'#e9dfbb'],['letters',90,'#c87a59'],['other',90,'#749ba2'],['slow',86,'#e0c58a']]}
  ];
  $('shelves').innerHTML='<div class="shelf">'+rows.map((row,r)=>'<div class="tier tier-'+r+'" style="top:'+row.y/1672*100+'%;height:'+row.h/1672*100+'%">'+row.slots.map((slot,column)=>{
    const placement='left:'+(238+column*94)/940*100+'%;width:'+94/940*100+'%;';
    const rest='<span class="book-slot-rest" aria-hidden="true" style="'+placement+'"></span>';
    if (!slot) return '<span class="book-slot is-empty" aria-hidden="true" data-slot="'+r+'-'+column+'" style="'+placement+'"></span>'+rest;
    const [id,height,color]=slot,book=books.find(item=>item[0]===id);
    return rest+'<button class="book-slot spine" data-slot="'+r+'-'+column+'" data-id="'+id+'" aria-label="抽出《'+book[1]+'》" style="'+placement+'--book-height:'+height+'%;--book-color:'+color+'"><span class="spine-face">'+book[1]+'</span></button>';
  }).join('')+'</div>').join('')+'</div>';
}

function renderDisplayBooks() {
  $('display-books').innerHTML=tableBooks.map(art=>{
    const book=books.find(item=>item[0]===art.id),pad=10;
    const style='left:'+(art.x-pad)/940*100+'%;top:'+(art.y-pad)/1672*100+'%;width:'+(art.width+pad*2)/940*100+'%;height:'+(art.height+pad*2)/1672*100+'%;--book-color:'+art.color+';--cover-art-size:'+940/art.width*100+'% '+1673/art.height*100+'%;--cover-art-position:'+art.x/(940-art.width)*100+'% '+art.y/(1673-art.height)*100+'%;--cover-art-clip:'+art.clip+';';
    return '<button class="spine display-book" data-id="'+art.id+'" aria-label="抽出《'+book[1]+'》" title="'+book[1]+'" style="'+style+'"><span class="spine-face" aria-hidden="true"></span></button>';
  }).join('');
}

function show(html, {keepScroll = false} = {}) {
  const scrollTop = $('paper-scroll').scrollTop;
  $('contents').innerHTML = html;
  const heading = $('contents').querySelector('h2');
  if (heading) heading.id = 'book-title';
  $('paper-scroll').scrollTop = keepScroll ? scrollTop : 0;
  status();
}
function intro() {
  const book = books.find(item => item[0] === selected);
  let extra = '';
  if (selected === 'ship' && (state.rose || state.mode === 'dense' || state.visits >= 3)) {
    extra = '<button class="btn primary" data-action="rose">🥀 查看夹页中的干玫瑰</button>';
  } else if (selected === 'prince' && state.rose) {
    extra = '<button class="btn primary" data-action="envelope">' + (state.stamp ? '🌹 重看玫瑰邮票' : '✉ 查看不显眼的信封') + '</button>';
  } else if (selected === 'siddhartha') {
    extra = '<button class="btn primary" data-action="letter">✉ 取出接力信</button>';
  } else {
    let found = state.found.includes(selected);
    if (notes[selected] && !found && (state.mode === 'dense' || state.visits % 3 === 2)) {
      state.found.push(selected); state.small = state.found.length; found = true;
    }
    extra = found ? '<button class="btn" data-action="note">↗ 展开书友便笺</button>' : '<p class="note">这次没有遇见新的阅读痕迹。</p>';
  }
  show('<h2>《' + esc(book[1]) + '》</h2><div class="intro">' + esc(book[2]) + '</div><div class="row">' + extra + '</div>');
}
function sourceTransform() {
  const rect = (source?.querySelector('.spine-face') || source)?.getBoundingClientRect();
  const panel = $('paper').getBoundingClientRect();
  if (!rect || !rect.width || !rect.height) return 'translateY(20px) scale(.9)';
  return 'translate(' + (rect.left + rect.width/2 - panel.left - panel.width/2) + 'px,' + (rect.top + rect.height/2 - panel.top - panel.height/2) + 'px) scale(' + rect.width/panel.width + ',' + rect.height/panel.height + ')';
}
function readingArtifact(id) {
  if (id === 'siddhartha') return {kind:'relay', label:'留给下一位读者', pickLabel:'从夹页抽出接力信', title:'一封留给下一位读者的信', detail:'沿折痕展开，读到末尾后可以续写'};
  if (id === 'ship' && (state.rose || state.mode === 'dense' || state.visits >= 3)) return {
    kind:'rose', label:'干玫瑰与纸条', pickLabel:'查看夹页中的干玫瑰', title:'干枯的玫瑰', detail:'纸条上，留着通往另一本书的线索',
    parts:[['干枯的玫瑰','🥀\n\n一张纸条：另一朵玫瑰守着一个小惊喜。也许你知道去哪里找。']],
    onRead:()=>{state.rose=true;status();}
  };
  if (id === 'prince' && state.rose) return {
    kind:'envelope', label:state.stamp?'玫瑰邮票':'一只旧信封', pickLabel:state.stamp?'重看玫瑰邮票':'查看不显眼的信封', title:state.stamp?'玫瑰邮票':'一只旧信封', detail:'读完后，可以折好放回原来的夹页', unfoldLabel:'拆开信封 →',
    parts:state.stamp ? [['玫瑰邮票','🌹\n\n这段跨书寻宝到这里结束了。']] : [['一只旧信封','书页间有一只不显眼的信封，封口上压着玫瑰印记。'],['玫瑰邮票','🌹\n\n这段跨书寻宝到这里结束了。']],
    onUnfold:()=>{state.stamp=true;status();}
  };
  if (notes[id] && !state.found.includes(id) && (firstVisitNotes.has(id) || state.mode === 'dense' || state.visits % 3 === 2)) {
    state.found.push(id);state.small=state.found.length;
  }
  if (notes[id] && state.found.includes(id)) return {kind:'note',label:'一张书友便笺',pickLabel:'展开书友便笺',title:'一张书友便笺',detail:'读完后，可以折好放回原来的夹页',parts:[['书友留下的便笺',notes[id]]]};
  return null;
}
async function openBook(id, button) {
  if (phase !== 'idle') return;
  setPhase('siddhartha');
  state.visits++;
  if (!state.seen.includes(id)) state.seen.push(id);
  const artifact=readingArtifact(id);
  status();
  window.BookReader.open(button, {
    book:books.find(book=>book[0]===id), artifact, coverArt:tableBooks.find(book=>book.id===id) || null,
    replies:()=>state.replies,
    write:text=>{state.replies.push(text);status();},
    close:()=>setPhase('idle')
  });
}
async function closeBook() {
  if (phase === 'idle' || phase === 'closing' || phase === 'returning') return;
  if (phase !== 'reading') { closeRequested = true; return; }
  setPhase('closing'); closeRequested = false;
  if ($('reply')) draft = $('reply').value;
  document.activeElement?.blur();
  // Restore the viewport after keyboard dismissal before measuring the return path.
  updateViewport();
  $('book-cover').hidden = false;
  await motion($('book-cover'), [{transform:'rotateY(-155deg)',opacity:0}, {offset:.15,opacity:1}, {transform:'rotateY(0deg)',opacity:1}], 300);
  setPhase('returning');
  await motion($('paper'), [{transform:'none'}, {transform:sourceTransform()}], 380);
  $('shade').hidden = true;
  $('book-cover').hidden = true;
  source?.classList.remove('is-out');
  $('shop').inert = false;
  document.documentElement.classList.remove('reader-open');
  setPhase('idle');
  source?.focus({preventScroll:true});
}
async function turnPage(render) {
  if (phase !== 'reading') return;
  setPhase('turning');
  const sheet = document.createElement('div');
  sheet.className = 'page-turn'; sheet.setAttribute('aria-hidden','true'); sheet.inert = true;
  sheet.innerHTML = $('contents').innerHTML;
  sheet.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  $('paper').appendChild(sheet);
  render();
  await motion(sheet, [{transform:'rotateY(0deg)',opacity:1}, {offset:.6,opacity:.95}, {transform:'rotateY(-115deg)',opacity:0}], 330);
  sheet.remove();
  setPhase('reading');
  $('close').focus({preventScroll:true});
  if (closeRequested) closeBook();
}
function rose() {
  state.rose = true;
  show('<h2>干枯的玫瑰</h2><div class="artifact" style="text-align:center;font-size:66px">🥀</div><div class="artifact">一张纸条：另一朵玫瑰守着一个小惊喜。也许你知道去哪里找。</div><button class="btn" data-action="back">← 返回简介</button>');
}
function envelope() {
  show(state.stamp ? '<h2>玫瑰邮票</h2><div class="stamp">🌹</div><p>这段跨书寻宝到这里结束了。</p><button class="btn" data-action="back">返回简介</button>' : '<h2>一只旧信封</h2><div class="artifact">书页间有一只不显眼的信封，封口上压着玫瑰印记。</div><button class="btn primary" data-action="stamp">拆开信封 →</button>');
}
function showLetter(animateNew = false) {
  const all = letter.concat(state.replies.map((reply,i) => ['你的续写 ' + (i+1),reply]));
  let html = '<h2>一封被续写的信</h2><p class="note">沿折痕逐段展开，末尾点击笔才续写。</p><div class="parts">';
  all.slice(0,unfolded).forEach(([name,text],i) => { html += '<div class="part' + (animateNew && i === unfolded-1 ? ' new-part' : '') + '"><small>' + esc(name) + '</small>' + esc(text) + '</div>'; });
  html += '</div>';
  if (unfolded < all.length) html += '<button class="unfold" data-action="unfold">⌄ 沿折痕继续展开</button>';
  else if (writing) html += '<label for="reply">在信的末尾续写</label><textarea id="reply" placeholder="写在信的末尾……" maxlength="3000">' + esc(draft) + '</textarea><div class="row"><button class="btn" data-action="cancel">放下笔</button><button class="btn primary" data-action="save">写在信上</button></div><p class="note" id="write-message" role="status"></p>';
  else html += '<div class="artifact"><button class="pen" data-action="write" aria-label="拿起笔续写">✎</button></div>';
  show(html + '<div class="row"><button class="btn" data-action="back">← 返回简介</button></div>', {keepScroll:animateNew || writing});
}
$('contents').addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action || phase !== 'reading') return;
  if (action === 'unfold') {
    unfolded++; showLetter(true);
    $('contents').querySelector('.new-part')?.scrollIntoView({block:'nearest'});
  } else if (action === 'write') {
    writing = true; showLetter(); $('reply').focus();
    $('reply').scrollIntoView({block:'nearest'});
  } else if (action === 'cancel') {
    draft = $('reply').value; writing = false; showLetter();
  } else if (action === 'save') {
    const value = $('reply').value.trim();
    if (!value) { $('write-message').textContent = '先写一点什么，再留在信上。'; $('reply').focus(); return; }
    state.replies.push(value); draft = ''; writing = false;
    unfolded = letter.length + state.replies.length;
    showLetter(true);
    $('contents').querySelector('.new-part')?.scrollIntoView({block:'nearest'});
  } else if (action === 'letter') {
    unfolded = 1; writing = false; turnPage(() => showLetter());
  } else if (action === 'rose') turnPage(rose);
  else if (action === 'envelope') turnPage(envelope);
  else if (action === 'stamp') turnPage(() => { state.stamp = true; envelope(); });
  else if (action === 'back') { if ($('reply')) draft = $('reply').value; turnPage(intro); }
  else if (action === 'note') turnPage(() => show('<h2>一张书友便笺</h2><div class="artifact">' + esc(notes[selected]) + '</div><button class="btn" data-action="back">← 回到简介</button>'));
});
$('contents').addEventListener('input', event => { if (event.target.id === 'reply') draft = event.target.value; });
$('room-viewport').addEventListener('click', event => { const button = event.target.closest('.spine'); if (button) openBook(button.dataset.id,button); });
$('close').addEventListener('click',closeBook);
$('shade').addEventListener('click',event => { if (event.target === $('shade')) closeBook(); });
$('restart').addEventListener('click',() => { if (phase !== 'idle') return; state.visits = 0; state.seen = []; status(); });
for (const id of ['natural','dense']) $(id).addEventListener('click',() => { state.mode = id; status(); });
document.addEventListener('keydown',event => {
  if (phase === 'idle' || phase === 'siddhartha') return;
  if (event.key === 'Escape') { event.preventDefault(); closeBook(); }
  if (event.key === 'Tab') {
    const controls = [...$('paper').querySelectorAll('button,textarea,[tabindex="0"]')].filter(element => !element.closest('[hidden]') && !element.closest('[inert]'));
    const first = controls[0], last = controls[controls.length-1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === $('paper'))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
});
window.addEventListener('resize',() => { updateViewport(); settleAnimations(); });
window.visualViewport?.addEventListener('resize',updateViewport);
window.visualViewport?.addEventListener('scroll',updateViewport);
document.addEventListener('visibilitychange',() => { if (document.hidden) settleAnimations(); });
window.addEventListener('pagehide',save);
window.addEventListener('pageshow',updateViewport);
shelves(); renderDisplayBooks(); updateViewport(); status();

if (new URLSearchParams(location.search).get('focus') === 'siddhartha') {
  const book = $('shelves').querySelector('[data-id="siddhartha"]');
  $('shelves').scrollLeft = book.closest('.shelf').offsetLeft;
  book.classList.add('focus-book');
  document.querySelector('.tip').textContent = '《悉达多》· 轻触书脊，拿到面前';
}
