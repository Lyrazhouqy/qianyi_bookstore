const {test,expect}=require('@playwright/test');
test('dragging across the open page does not select labels; writing still permits text selection',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?playtest=discovery&reader=A');
 await page.locator('.spine[data-id="kafka"]').click();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');await page.locator('.sid-cover').click();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','open');
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const title=await page.locator('.sid-page h2').boundingBox();
 await page.mouse.move(title.x+4,title.y+title.height/3);await page.mouse.down();await page.mouse.move(title.x+title.width-4,title.y+title.height/3,{steps:18});await page.mouse.up();
 expect(await page.evaluate(()=>getSelection().toString())).toBe('');
 await page.locator('.sid-create-pen').click();const input=page.locator('#secret-front');await input.fill('仍然可以选中并修改自己的文字');await input.press('ControlOrMeta+A');
 expect(await input.evaluate(el=>el.selectionEnd-el.selectionStart)).toBeGreaterThan(0);await input.press('Backspace');await expect(input).toHaveValue('');
});
