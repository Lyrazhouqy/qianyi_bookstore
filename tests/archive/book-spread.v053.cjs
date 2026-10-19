const {test,expect}=require('@playwright/test');

for(const width of [566,705]) test(`restored ${width}px spread shows the inside cover, synopsis and letter together`,async({page})=>{
 await page.setViewportSize({width,height:853});await page.goto('/?focus=siddhartha');
 await page.locator('.spine[data-id="siddhartha"]').tap();
 await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');
 await expect(page.locator('.sid-cover-front')).toBeVisible();
 await page.locator('.sid-cover').tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','open');
 await expect(page.locator('.sid-inside-motto')).toHaveText('翻过的书页记得来过的人');
 await expect(page.locator('.sid-mobile-intro')).toContainText('一个人经历修行和世俗生活');
 const g=await page.evaluate(()=>{
  const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON(),intro=document.querySelector('.sid-mobile-intro');
  return {inside:rect('.sid-cover-back'),right:rect('.sid-page'),intro:rect('.sid-mobile-intro'),dock:rect('.sid-dock'),visible:getComputedStyle(intro).display,scroll:intro.scrollHeight,height:intro.clientHeight};
 });
 expect(g.visible).not.toBe('none');expect(g.scroll).toBeLessThanOrEqual(g.height+1);
 expect(g.inside.right).toBeLessThan(g.right.x+8);expect(g.inside.x).toBeGreaterThanOrEqual(16);expect(g.right.right).toBeLessThanOrEqual(width-16);
 expect(g.intro.bottom).toBeLessThan(g.dock.top);await expect(page.locator('.sid-letter-pick')).toBeVisible();
 await page.locator('.sid-letter-pick').tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');
 await expect(page.locator('.sid-segment')).toContainText('我曾以为寻找答案');
 await page.locator('[data-sid="put"]').tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','open');
 await page.locator('.sid-return').tap();await expect(page.locator('body')).toHaveAttribute('data-phase','idle');
});
