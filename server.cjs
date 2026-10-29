'use strict';
// Local preview of exactly the static files published to GitHub Pages.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'dist');
if(!fs.existsSync(path.join(root,'data','manifest.json')))throw Error('Build first: node build-pages.cjs /path/to/pi-1b.txt');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const name=pathname==='/'?'index.html':pathname.slice(1);
  if(req.method!=='GET'||!(/^(index\.html|app\.js|data\/manifest\.json|data\/\d{4}\.bin)$/.test(name))){res.writeHead(404);return res.end('Not found');}
  const target=path.join(root,name);if(!fs.existsSync(target)){res.writeHead(404);return res.end('Not found');}
  const type=name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'application/javascript; charset=utf-8':name.endsWith('.json')?'application/json':'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});fs.createReadStream(target).pipe(res);
});
server.listen(Number(process.env.PORT)||12021,'127.0.0.1',()=>console.log('Pi Billion static preview: http://127.0.0.1:'+server.address().port));
