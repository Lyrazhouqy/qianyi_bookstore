const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname==='/'?'/index.html':pathname));
  const relative = path.relative(root,file);
  if (relative.startsWith('..') || relative.split(path.sep).some(part=>part.startsWith('.')) || relative.startsWith('node_modules')) {res.writeHead(403);return res.end();}
  fs.readFile(file,(error,body)=>{
    if(error){res.writeHead(404);return res.end('Not found');}
    const headers={'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store','accept-ranges':'bytes'};
    let start=0,end=body.length-1,status=200;
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match||!match[1]&&!match[2]){res.writeHead(416,{'content-range':'bytes */'+body.length});return res.end();}
      start=match[1]?Number(match[1]):Math.max(0,body.length-Number(match[2]));
      end=match[1]&&match[2]?Math.min(Number(match[2]),body.length-1):body.length-1;
      if(start>=body.length||start>end){res.writeHead(416,{'content-range':'bytes */'+body.length});return res.end();}
      status=206;headers['content-range']='bytes '+start+'-'+end+'/'+body.length;
    }
    headers['content-length']=String(end-start+1);res.writeHead(status,headers);
    res.end(req.method==='HEAD'?undefined:body.subarray(start,end+1));
  });
}).listen(Number(process.env.PORT||4173),process.env.HOST||'127.0.0.1',()=>console.log('Paper bookshop: http://127.0.0.1:'+(process.env.PORT||4173)));
