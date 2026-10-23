const p=require('@playwright/test');
const test=p.test.extend({page:async({page},use)=>{
 await page.addInitScript(()=>{
  const Audio=window.Audio;window.Audio=class extends Audio{constructor(...args){super(...args);this.muted=true;}};
  const Native=window.AudioContext||window.webkitAudioContext;
  if(Native)window.AudioContext=class extends Native{constructor(...args){super(...args);const gate=super.createGain();gate.gain.value=0;gate.connect(super.destination);this.quietDestination=gate;}get destination(){return this.quietDestination||super.destination;}};
 });
 await use(page);
}});
module.exports={...p,test};
