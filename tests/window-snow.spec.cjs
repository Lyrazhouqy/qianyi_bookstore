const {test,expect}=require('@playwright/test');
const selectNight=async page=>{
  await page.getByRole('button',{name:'更换窗外风景',exact:true}).scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'更换窗外风景',exact:true}).tap();
  await page.getByRole('button',{name:'雪夜',exact:true}).tap();
  await expect(page.locator('#change-window')).toHaveAttribute('data-scenery','nightSnow');
  await page.getByRole('button',{name:'收起窗外风景',exact:true}).tap();
};
const flakeState=page=>page.locator('.window-snowflake').first().evaluate(e=>({
  transform:getComputedStyle(e).transform,play:getComputedStyle(e).animationPlayState,
  animation:getComputedStyle(e).animationName
}));
test.beforeEach(async({page})=>{await page.goto('/?playtest=rhythm');await page.locator('.room-art').evaluate(e=>e.decode());});

test('night snow visibly moves inside the glass, stops off camera and while reading, and resumes on return',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  const progress=await page.evaluate(()=>localStorage.getItem('paperbook-v3'));
  await selectNight(page);
  await expect(page.locator('#change-window')).toHaveAttribute('data-snow-visible','true');
  const first=await flakeState(page);expect(first.play).toBe('running');
  await expect.poll(async()=>(await flakeState(page)).transform).not.toBe(first.transform);
  expect(await page.locator('.window-snowflake').count()).toBe(22);
  expect(await page.locator('.window-snowfall').evaluate(e=>e.parentElement.getAttribute('clip-path'))).toBe('url(#window-glass)');
  expect(await page.locator('#window-picture').getAttribute('href')).toContain('window-night-snow-flat-v01415.png');
  expect(await page.evaluate(()=>localStorage.getItem('paperbook-v3'))).toBe(progress);
  await page.screenshot({path:test.info().outputPath('snow-night-room.png'),animations:'allow'});
  await page.locator('#change-window').screenshot({path:test.info().outputPath('snow-night-frame-a.png'),animations:'allow'});
  await expect.poll(async()=>(await flakeState(page)).transform).not.toBe(first.transform);
  await page.waitForTimeout(1200); // Capture a second actual animation frame, not a simulated clock.
  await page.locator('#change-window').screenshot({path:test.info().outputPath('snow-night-frame-b.png'),animations:'allow'});

  // On a tall phone, bringing a lower book into view can leave part of the
  // window visible. Move the actual camera fully to its lower/right boundary.
  await page.locator('#room-viewport').evaluate(e=>e.scrollTo({left:e.scrollWidth,top:e.scrollHeight,behavior:'instant'}));
  await expect(page.locator('#change-window')).toHaveAttribute('data-snow-visible','false');
  expect((await flakeState(page)).play).toBe('paused');
  await page.locator('#change-window').scrollIntoViewIfNeeded();
  await expect(page.locator('#change-window')).toHaveAttribute('data-snow-visible','true');
  expect((await flakeState(page)).play).toBe('running');
  await page.locator('#open-book-index').tap();await page.locator('[data-book="naval"]').tap();
  await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');
  expect((await flakeState(page)).play).toBe('paused');
  await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
  await page.locator('#change-window').scrollIntoViewIfNeeded();
  await expect.poll(async()=>(await flakeState(page)).play).toBe('running');
  await page.getByRole('button',{name:'更换窗外风景',exact:true}).tap();
  await page.getByRole('button',{name:'雨后山色',exact:true}).tap();
  await expect(page.locator('#change-window')).toHaveAttribute('data-scenery','rain');
  await expect(page.locator('.window-snowfall')).toHaveCSS('opacity','0');
  expect((await flakeState(page)).play).toBe('paused');
});

test('reduced motion keeps a still snowy view; visibility lifecycle pauses and resumes without changing saved scenery',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await selectNight(page);
  const still=await flakeState(page);expect(still.animation).toBe('none');
  await page.waitForTimeout(250);expect((await flakeState(page)).transform).toBe(still.transform);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(async()=>(await flakeState(page)).play).toBe('running');
  const saved=await page.evaluate(()=>localStorage.getItem('paperbook-window-v1'));
  // Synthetic visibility event: this is lifecycle coverage, not a claim of OS background testing.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('#change-window')).toHaveAttribute('data-snow-suspended','true');
  const paused=await flakeState(page);expect(paused.play).toBe('paused');
  await page.waitForTimeout(250);expect((await flakeState(page)).transform).toBe(paused.transform);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('#change-window')).toHaveAttribute('data-snow-suspended','false');
  await expect.poll(async()=>(await flakeState(page)).play).toBe('running');
  expect(await page.evaluate(()=>localStorage.getItem('paperbook-window-v1'))).toBe(saved);
});
