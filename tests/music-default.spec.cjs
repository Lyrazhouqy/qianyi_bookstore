const {test,expect}=require('@playwright/test');
// Force only the policy rejection. Successful playback still uses the real MP3
// decoder and media clock; this is not a physical Safari permission test.
async function blocked(page){
 await page.addInitScript(()=>{
  const original=HTMLMediaElement.prototype.play;
  window.musicAttempts=0;let activated=false;
  for(const type of ['click','keydown'])document.addEventListener(type,event=>{if(event.isTrusted)activated=true;},true);
  HTMLMediaElement.prototype.play=function(){window.musicAttempts++;return activated?original.call(this):Promise.reject(new DOMException('Gesture required','NotAllowedError'));};
 });
 await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-music-state','ready');
 await expect(page.locator('[data-bookshop-music]')).toHaveCount(0);
 expect(await page.evaluate(()=>musicAttempts)).toBe(1);
}
async function audible(page,track='water-sound'){
 await expect(page.locator('html')).toHaveAttribute('data-music-state','playing');
 await expect(page.locator('html')).toHaveAttribute('data-music-track',track);
 await page.waitForFunction(()=>{const a=document.querySelector('[data-bookshop-music]');return a&&!a.paused&&a.currentTime>.08&&a.volume>.1;});
 await expect(page.locator('[data-bookshop-music]')).toHaveCount(1);
}
test('default attempt falls back to the first shop touch, remembers selection and respects pause',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await blocked(page);
 await page.locator('#change-bouquet').scrollIntoViewIfNeeded();await page.locator('#change-bouquet').tap();
 await expect(page.locator('#bouquet-settings')).toBeVisible();await audible(page);
 expect(await page.evaluate(()=>musicAttempts)).toBe(2);
 await page.keyboard.press('Escape');await page.locator('#open-music').tap();
 await page.locator('[data-track="slow-coffee"]').tap();await audible(page,'slow-coffee');
 await page.getByRole('button',{name:'暂停音乐',exact:true}).tap();await page.keyboard.press('Escape');
 await page.locator('#change-bouquet').tap();await expect(page.locator('html')).toHaveAttribute('data-music-state','paused');await page.keyboard.press('Escape');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-music-state','ready');await expect(page.locator('html')).toHaveAttribute('data-music-track','slow-coffee');
 await page.locator('#open-music').tap();await audible(page,'slow-coffee');expect(errors).toEqual([]);
});
test('first explicit play and keyboard unlock do not create duplicate voices',async({page})=>{
 await blocked(page);
 // Show the existing dialog without a gesture, then use its own play control.
 await page.evaluate(()=>document.querySelector('#music-settings').showModal());
 await page.getByRole('button',{name:'播放音乐',exact:true}).tap();await audible(page);expect(await page.evaluate(()=>musicAttempts)).toBe(2);
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-music-state','ready');
 await page.locator('#open-music').focus();await page.keyboard.press('Enter');await audible(page);expect(await page.evaluate(()=>musicAttempts)).toBe(2);
});
