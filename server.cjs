'use strict';
const http=require('node:http');
const https=require('node:https');
const fs=require('node:fs');
const path=require('node:path');
const SOURCE='https://github.com/Abishkarm/pimillion/releases/download/pi-digits-1b/pi-1b.txt';
const TOTAL=1000000000;
const cache=new Map();
const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js'};
function allowed(url){return url.protocol==='https:'&&['github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(url.hostname);}
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  if(url.pathname==='/api/pi'){
    const start=Number(url.searchParams.get('start')),length=Number(url.searchParams.get('length'));
    if(!url.searchParams.has('start')||!Number.isInteger(start)||!Number.isInteger(length)||start<1||length<1||length>1000000||start+length-1>TOTAL){res.writeHead(400);return res.end('Invalid decimal range');}
    const key=start+':'+length;
    const send=text=>{res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Content-Length':Buffer.byteLength(text),'Cache-Control':'public, max-age=86400'});res.end(text);};
    if(cache.has(key))return send(cache.get(key));
    let active;
    const fail=()=>{if(!res.destroyed&&!res.writableEnded){res.writeHead(502);res.end('GitHub digit source unavailable. Try again.');}};
    function load(address,redirects=0){
      const target=new URL(address);if(!allowed(target)||redirects>5)return fail();
      active=https.get(target,{headers:{Range:`bytes=${start-1}-${start+length-2}`,'Accept-Encoding':'identity','User-Agent':'Pimillion'}},upstream=>{
        if([301,302,303,307,308].includes(upstream.statusCode)&&upstream.headers.location){upstream.resume();return load(new URL(upstream.headers.location,target).href,redirects+1);}
        if(upstream.statusCode!==206||upstream.headers['content-range']!==`bytes ${start-1}-${start+length-2}/${TOTAL}`){upstream.destroy();return fail();}
        let bytes=0;const chunks=[];
        upstream.on('data',chunk=>{bytes+=chunk.length;if(bytes>length){upstream.destroy();fail();}else chunks.push(chunk);});
        upstream.on('error',fail);
        upstream.on('end',()=>{const text=Buffer.concat(chunks).toString('ascii');if(bytes!==length||!/^[0-9]+$/.test(text))return fail();if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(key,text);if(!res.destroyed)send(text);});
      });
      active.setTimeout(20000,()=>active.destroy(new Error('Source timeout')));active.on('error',fail);
    }
    res.on('close',()=>active?.destroy());load(SOURCE);return;
  }
  const file=files[url.pathname];if(!file){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'application/javascript; charset=utf-8','Cache-Control':'no-cache'});
  fs.createReadStream(path.join(__dirname,file)).pipe(res);
});
server.listen(Number(process.env.PORT)||12021,process.env.HOST||'127.0.0.1',()=>console.log(`Pimillion: http://127.0.0.1:${server.address().port}`));
