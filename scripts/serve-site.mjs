import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const port=4173;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};

http.createServer((req,res)=>{
  const urlPath=decodeURIComponent((req.url||'/').split('?')[0]);
  const requested=urlPath==='/'?'index.html':urlPath.replace(/^\/+/, '');
  const file=path.resolve(root,requested);
  if(!file.startsWith(root)){res.writeHead(403);res.end('Forbidden');return}
  fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(404);res.end('Not found');return}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
}).listen(port,'127.0.0.1',()=>console.log('Static QA server: http://127.0.0.1:'+port));
