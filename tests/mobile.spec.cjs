const {test,expect} = require('@playwright/test');
const fs = require('node:fs');
const phase = (page,value) => expect(page.locator('body')).toHaveAttribute('data-phase',value);
async function open(page,id) {
  const book = page.locator('.spine[data-id="'+id+'"]').first();
  await book.scrollIntoViewIfNeeded();
  await book.tap();
  await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');
  await expect(page.locator('.sid-cover-title')).toHaveText(await book.locator('.spine-face').textContent());
  await expect(page.locator('.sid-cover')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#shade')).toBeHidden();
  await page.locator('.sid-cover').tap();
  await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','open');
  return book;
}
async function close(page) {
  if(await page.locator('.siddhartha-room:visible').count())await page.keyboard.press('Escape');
  else await page.getByRole('button',{name:'合书并放回书架'}).tap();
  await phase(page,'idle');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.is-out')).toHaveCount(0);
}
async function unfoldAll(page) {
  const button = page.getByRole('button',{name:'沿折痕继续展开'});
  while (await button.count()) await button.tap();
}
const errors = new WeakMap();
test.beforeEach(async ({page})=>{
  const list=[]; errors.set(page,list); page.on('pageerror',error=>list.push(error.message));
  await page.goto('/'); await expect(page.locator('.spine')).toHaveCount(16);
});
test.afterEach(async ({page})=>{expect(errors.get(page)).toEqual([]);});

test('shelf bounds, real touch targets, and all nine books reachable',async ({page},info)=>{
  const geometry = await page.locator('.spine').evaluateAll(buttons=>buttons.map(button=>{
    const hit=button.getBoundingClientRect(),face=button.firstElementChild.getBoundingClientRect(),tier=button.parentElement.getBoundingClientRect();
    return {width:hit.width,height:hit.height,top:face.top-tier.top,bottom:tier.bottom-face.bottom};
  }));
  for(const book of geometry) {expect(book.width).toBeGreaterThanOrEqual(43.9);expect(book.height).toBeGreaterThanOrEqual(43.9);expect(book.top).toBeGreaterThanOrEqual(0);expect(book.bottom).toBeGreaterThanOrEqual(-.1);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  for(const [id,title] of [['ship','忒修斯之船'],['prince','小王子'],['stranger','局外人'],['siddhartha','悉达多'],['garden','秘密花园'],['night','夜航西飞'],['kafka','海边的卡夫卡'],['letters','山茶文具店'],['other','海边的房间']]) {
    await open(page,id); await expect(page.getByRole('heading',{name:'《'+title+'》'})).toBeVisible(); await close(page);
  }
  await expect(page.locator('[data-visit-label]')).toHaveText('翻过 9 次旧书');
  await info.attach('geometry',{body:Buffer.from(JSON.stringify(geometry)),contentType:'application/json'});
});

test('rose clue, envelope, stamp, reload and rediscovery',async ({page})=>{
  await page.getByRole('button',{name:'书店手记',exact:true}).tap();await page.getByRole('button',{name:'密集对照'}).tap();await page.getByRole('button',{name:'收起书店手记'}).tap();
  await open(page,'ship'); await page.getByRole('button',{name:'查看夹页中的干玫瑰'}).tap(); await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');
  await expect(page.locator('.sid-segment small').filter({hasText:'干枯的玫瑰'})).toBeVisible(); await close(page);
  await open(page,'prince'); await page.getByRole('button',{name:'查看不显眼的信封'}).tap(); await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');
  await page.getByRole('button',{name:'拆开信封'}).tap(); await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');
  await expect(page.locator('.sid-segment').filter({hasText:'🌹'})).toBeVisible(); await close(page); await page.reload();
  await expect(page.locator('#status')).toContainText('邮票已获得');
  await open(page,'ship'); await page.getByRole('button',{name:'查看夹页中的干玫瑰'}).tap(); await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');
  await expect(page.locator('.sid-segment small').filter({hasText:'干枯的玫瑰'})).toBeVisible();
});


test('other book shares cover drag, clue folding and exact return dock',async({page})=>{
  await page.getByRole('button',{name:'书店手记',exact:true}).tap();await page.getByRole('button',{name:'密集对照'}).tap();await page.getByRole('button',{name:'收起书店手记'}).tap();
  await open(page,'ship');await expect(page.locator('#shade')).toBeHidden();
  const original=await page.locator('.sid-letter').boundingBox();
  await page.getByRole('button',{name:'查看夹页中的干玫瑰'}).tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');
  await expect(page.locator('.sid-segment small').filter({hasText:'干枯的玫瑰'})).toBeVisible();
  await expect(page.locator('.sid-pen')).toHaveCount(0);
  await page.locator('[data-sid=put]').tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','open');
  const returned=await page.locator('.sid-letter').boundingBox();for(const key of ['x','y','width','height'])expect(Math.abs(returned[key]-original[key])).toBeLessThan(1);
  const cover=page.locator('.sid-cover'),b=await cover.boundingBox();await page.mouse.move(b.x+b.width*.2,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*1.7,b.y+b.height*.5,{steps:12});await page.mouse.up();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','held');
  await close(page);
});


for(const [label,group] of [
  ['first notes',[['stranger','不表现悲伤'],['garden','秘密花园'],['night','风景']]],
  ['later notes',[['kafka','地图'],['letters','没写出来'],['other','窗户']]]
]) test('distinct '+label+' persist and never leak into the relay letter',async({page})=>{
  await open(page,'prince');await expect(page.locator('.sid-letter')).toBeHidden();await expect(page.locator('.sid-synopsis')).toContainText('玫瑰与狐狸');await close(page);
  await page.getByRole('button',{name:'书店手记',exact:true}).tap();await page.getByRole('button',{name:'密集对照'}).tap();await page.getByRole('button',{name:'收起书店手记'}).tap();
  for(const [id,text] of group) {
    await open(page,id);await page.getByRole('button',{name:'展开书友便笺',exact:true}).tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');
    await expect(page.locator('.sid-segment')).toContainText(text);await expect(page.locator('.sid-pen')).toHaveCount(0);await expect(page.locator('.sid-unfold')).toHaveCount(0);await close(page);
  }
  const [id,text]=group.at(-1);
  await page.reload();await open(page,id);await page.getByRole('button',{name:'展开书友便笺',exact:true}).tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');await expect(page.locator('.sid-segment')).toContainText(text);await close(page);
  await open(page,'siddhartha');await page.getByRole('button',{name:'从夹页抽出接力信'}).tap();await expect(page.locator('.siddhartha-room')).toHaveAttribute('data-step','letter');
  await expect(page.locator('.sid-segment')).toContainText('我曾以为寻找答案');await expect(page.locator('.sid-segment')).not.toContainText(text);await close(page);
});
