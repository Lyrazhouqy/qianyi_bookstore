'use strict';
(() => {
  const world=document.querySelector('.room-world'),viewport=document.getElementById('room-viewport');
  if(!world||!viewport)return;
  const steam=document.createElementNS('http://www.w3.org/2000/svg','svg');
  steam.id='cup-steam';steam.classList.add('cup-steam');steam.setAttribute('viewBox','0 0 64 84');steam.setAttribute('aria-hidden','true');steam.setAttribute('focusable','false');
  steam.innerHTML='<path d="M24 82 C15 73 34 66 25 55 S25 39 28 32" style="--steam-duration:5.4s;--steam-delay:-1.4s;--steam-drift:-4px"/><path d="M34 82 C43 72 24 66 33 55 S35 38 32 28" style="--steam-duration:6.2s;--steam-delay:-3.5s;--steam-drift:4px"/><path d="M43 81 C35 74 49 65 43 58 S41 45 44 40" style="--steam-duration:5.8s;--steam-delay:-4.7s;--steam-drift:6px"/>';
  world.append(steam);
  const suspend=()=>{steam.dataset.suspended=String(document.hidden);};suspend();
  document.addEventListener('visibilitychange',suspend);
  new IntersectionObserver(entries=>{steam.dataset.visible=String(entries[0].isIntersecting);},{root:viewport}).observe(steam);
})();
