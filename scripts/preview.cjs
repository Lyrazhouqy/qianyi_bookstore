'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const runtime = path.join(root, '.preview');
const label = 'dev.paper-bookshop.preview-4173';
const action = process.argv[2] || 'start';
const url = 'http://127.0.0.1:4173/';
function launchctl(args) { return spawnSync('/bin/launchctl', args, {encoding:'utf8'}); }
async function reachable() {
  try {
    const response = await fetch(url, {signal:AbortSignal.timeout(1500)});
    return response.ok && (await response.text()).includes('<h1>纸间书店</h1>');
  } catch { return false; }
}
(async () => {
  if (process.platform !== 'darwin') throw Error('This preview launcher uses macOS launchd. Use npm run dev on other systems.');
  if (action === 'stop') {
    const listed = launchctl(['list',label]);
    if (listed.status !== 0) { console.log('Preview is already stopped.'); return; }
    const stopped = launchctl(['remove',label]);
    if (stopped.status !== 0) throw Error(stopped.stderr || 'Could not stop preview.');
    console.log('Preview stopped.'); return;
  }
  if (action === 'status') {
    const ok = await reachable(); console.log(ok ? 'Preview ready: ' + url : 'Preview is unavailable.');
    process.exitCode = ok ? 0 : 1; return;
  }
  if (action !== 'start') throw Error('Usage: node scripts/preview.cjs [start|status|stop]');
  if (launchctl(['list',label]).status !== 0) {
    fs.mkdirSync(runtime,{recursive:true});
    const submitted = launchctl(['submit','-l',label,'-o',path.join(runtime,'stdout.log'),'-e',path.join(runtime,'stderr.log'),'--','/usr/bin/env','HOST=127.0.0.1','PORT=4173',process.execPath,path.join(root,'scripts/serve.cjs')]);
    if (submitted.status !== 0) throw Error(submitted.stderr || 'Could not start preview.');
  }
  for (let attempt=0;attempt<20;attempt++) {
    if (await reachable()) { console.log('Preview ready: ' + url); console.log('Runs independently of the chat. Stop with npm run preview -- stop.'); return; }
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw Error('Preview did not become reachable. Inspect ' + path.join(runtime,'stderr.log'));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
