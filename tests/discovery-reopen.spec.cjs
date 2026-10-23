const {test,expect}=require('@playwright/test');
const key='paperbook-discovery-visit-v1-A';
const step=(p,s)=>expect(p.locator('.siddhartha-room')).toHaveAttribute('data-step',s);
const snapshot=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function open(p){await p.locator('.spine[data-id="naval"]').click();await step(p,'held');await p.locator('.sid-cover').click();await step(p,'open');}
async function take(p){await p.locator('.sid-letter-pick').click();await step(p,'letter');}
async function back(p){await p.keyboard.press('Escape');await expect(p.locator('body')).toHaveAttribute('data-phase','idle');}
async function setup(p,{unfinished=false,ownReply=false}={}){
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.route('**/real-materials.js',r=>r.fulfill({contentType:'application/javascript',body:'window.BookRealMaterials=()=>({});'}));
 await p.addInitScript(({key,unfinished,ownReply})=>{
  if(localStorage.getItem('reopen-fixture'))return;localStorage.setItem('reopen-fixture','yes');
  const items=[{id:'old',kind:'stack',author:'N',authorName:'第一位',front:'第一次遇见的那张纸',stock:'cream',replies:unfinished?[{author:'B',text:'下面还有一句没有读完的话'}]:[]},{id:'next',kind:'stack',author:'B',authorName:'第二位',front:'再次拿起时的新便笺',stock:'cream',replies:[]},{id:'third',kind:'stack',author:'N',front:'第三张纸',stock:'cream',replies:[]}];
  if(ownReply)items.push({id:'mine',kind:'stack',author:'A',front:'我以前留下的话',stock:'cream',replies:[{author:'N',text:'有人接住了你的话'}]});
  localStorage.setItem('paperbook-discovery-notes-v1',JSON.stringify({version:1,books:{naval:items}}));
  localStorage.setItem(key,JSON.stringify({version:1,known:{naval:['old']},baseline:{},changes:{},visit:{id:'fixed',seed:1,lastActive:Date.now(),draws:{naval:'old'},explored:1,found:1,lastFound:1,dry:0,quiet:0,events:[],ready:ownReply?{naval:true}:{}}}));
  if(ownReply)localStorage.setItem('paperbook-discovery-reading-v1-A',JSON.stringify({books:{naval:{items:{mine:{front:true,replies:0}},last:'old'}}}));
 },{key,unfinished,ownReply});
 await p.goto('/?v=0.9.2&playtest=discovery&reader=A');
}
test('only a completed read and actual shelf return permits one new draw; cover and reload stay stable',async({page})=>{
 await setup(page);await open(page);await back(page);expect((await snapshot(page)).visit.ready?.naval).toBeFalsy();
 await page.reload();await open(page);expect((await snapshot(page)).visit.draws.naval).toBe('old');
 await take(page);await page.reload();await open(page);expect((await snapshot(page)).visit.draws.naval).toBe('old');
 await take(page);await back(page);expect((await snapshot(page)).visit.ready.naval).toBe(true);
 await page.reload();await open(page);let d=await snapshot(page);expect(d.visit.draws.naval).toBe('next');expect(d.visit.found).toBe(2);expect(d.known.naval).toEqual(expect.arrayContaining(['old','next']));
 await expect(page.locator('.sid-letter-packet em').first()).toHaveText('第二位的便笺');
 await page.locator('.sid-cover').click({position:{x:12,y:12}});await step(page,'held');await page.locator('.sid-cover').click();await step(page,'open');expect((await snapshot(page)).visit.draws.naval).toBe('next');
 await page.reload();await open(page);expect((await snapshot(page)).visit.draws.naval).toBe('next');await expect(page.locator('.sid-paper-traces button')).toHaveCount(1);
});
test('an unfinished exchange stays put until its remaining reply is read and the book returned',async({page})=>{
 await setup(page,{unfinished:true});await open(page);await take(page);await expect(page.locator('.sid-unfold')).toBeVisible();await back(page);
 expect((await snapshot(page)).visit.ready?.naval).toBeFalsy();await open(page);expect((await snapshot(page)).visit.draws.naval).toBe('old');await take(page);await page.locator('.sid-unfold').click();await step(page,'letter');await expect(page.locator('.sid-segment').last()).toContainText('没有读完');await back(page);
 expect((await snapshot(page)).visit.ready.naval).toBe(true);await open(page);expect((await snapshot(page)).visit.draws.naval).toBe('next');
});
test('new replies on own paper take priority without consuming the pending opening-page selection',async({page})=>{
 await setup(page,{ownReply:true});await open(page);await expect(page.locator('.sid-letter-packet em').first()).toHaveText('你的便笺与新回应');let d=await snapshot(page);expect(d.visit.found).toBe(1);expect(d.visit.ready.naval).toBe(true);
 await take(page);await page.locator('.sid-unfold').click();await step(page,'letter');await expect(page.locator('.sid-segment').last()).toContainText('接住了');await back(page);await open(page);d=await snapshot(page);expect(d.visit.draws.naval).toBe('next');expect(d.visit.found).toBe(2);
});
