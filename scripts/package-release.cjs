// Package only the reviewed static allowlist; keep the last production version intact.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'))),version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid release version');
const folder='release-v'+version.replaceAll('.',''),dest=path.join(root,'.preview',folder),evidence=path.join(root,'evidence','deployment-v'+version.replaceAll('.',''));
const current=[...new Set(manifest.staticFiles)],allowed=new Set(current),rows=[];
const safe=file=>typeof file==='string'&&!file.startsWith('/')&&!file.split('/').some(p=>p==='..'||p.startsWith('.'));
for(const file of current){
 if(!safe(file)||!fs.statSync(path.join(root,file)).isFile())throw Error('Unsafe/missing static asset: '+file);
 if(/\.(html|css|js)$/.test(file)){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const references=[...source.matchAll(/["'(](assets\/[\w./-]+\.(?:png|woff2|mp3|json|txt))["')]/g)].map(m=>m[1]);
  if(file==='index.html')references.push(...[...source.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)].map(m=>m[1]));
  for(const reference of references)if(!allowed.has(reference))throw Error(file+' references an asset outside the allowlist: '+reference);
 }
}
function put(file,bytes,origin){
 if(!safe(file))throw Error('Unsafe output: '+file);
 const output=path.join(dest,file);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,bytes);
 rows.push({file,size:bytes.length,sha:crypto.createHash('sha1').update(bytes).digest('hex'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),origin});
}
for(const file of current){const bytes=fs.readFileSync(path.join(root,file));put(file,bytes,'current');put('v'+version+'/'+file,bytes,'current-version');}
const previous=manifest.deployment;
const history=[previous,...(manifest.deploymentHistory||[])].filter((d,i,a)=>d&&d.version!==version&&a.findIndex(x=>x?.version===d.version)===i);
for(const previous of history){
 for(const old of previous.files){
  if(!safe(old.file))throw Error('Unsafe historical path');
  const bytes=cp.execFileSync('git',['show',previous.sourceCommit+':'+old.file],{cwd:root,maxBuffer:30*1024*1024});
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==old.sha256)throw Error('Historical asset mismatch: '+old.file);
  put('v'+previous.version+'/'+old.file,bytes,'previous-production');
 }
}
const config={version:2,cleanUrls:false,headers:[{source:'/',headers:[{key:'Cache-Control',value:'no-cache'}]},{source:'/index.html',headers:[{key:'Cache-Control',value:'no-cache'}]},{source:'/v'+version+'/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},...history.map(previous=>({source:'/v'+previous.version+'/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}))]};
put('vercel.json',Buffer.from(JSON.stringify(config,null,2)+'\n'),'deployment-config');
fs.mkdirSync(evidence,{recursive:true});
const result={version,build:manifest.build,projectId:manifest.projectId,teamId:manifest.teamId,folder:dest,previousDeployment:previous?.deploymentId,previousVersion:previous?.version,files:rows};
fs.writeFileSync(path.join(evidence,'upload-manifest.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({version,files:rows.length,uniqueBlobs:new Set(rows.map(r=>r.sha)).size,folder:dest,evidence}));
