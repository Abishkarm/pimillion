'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {once}=require('node:events');
const TOTAL=1000000000,CHUNK=1000000;
const EXPECTED='ef0a513ee398d5dbe1ed6994c222e03a16fcfe91f5de685691953d35961798e5';
async function main(){
 const input=process.argv[2];if(!input||fs.statSync(input).size!==TOTAL)throw Error('Pass the complete 1,000,000,000-byte pi-1b.txt file.');
 const output=path.join(__dirname,'dist');fs.mkdirSync(path.join(output,'data'),{recursive:true});
 const fd=fs.openSync(input,'r'),hash=crypto.createHash('sha256'),hashes=[];let bytes=0;
 try{for(let index=0;index<TOTAL/CHUNK;index++){
   const block=Buffer.alloc(CHUNK);let offset=0;while(offset<CHUNK){const n=fs.readSync(fd,block,offset,CHUNK-offset,index*CHUNK+offset);if(!n)throw Error('Truncated digit file');offset+=n;}
   if(/[^0-9]/.test(block.toString('ascii')))throw Error('Non-digit content');hash.update(block);
   const compressed=zlib.gzipSync(block,{level:6});const name=String(index).padStart(4,'0')+'.bin';fs.writeFileSync(path.join(output,'data',name),compressed);bytes+=compressed.length;hashes.push(crypto.createHash('sha256').update(compressed).digest('hex'));
   if(index%100===99)console.log('Prepared '+(index+1)+' / 1000 sections');
 }}finally{fs.closeSync(fd);}
 if(hash.digest('hex')!==EXPECTED)throw Error('Source checksum mismatch; deployment must not proceed.');
 for(const name of ['index.html','app.js'])fs.copyFileSync(path.join(__dirname,name),path.join(output,name));
 fs.writeFileSync(path.join(output,'data','manifest.json'),JSON.stringify({total:TOTAL,chunkSize:CHUNK,sourceSha256:EXPECTED,hashes}));
 fs.writeFileSync(path.join(output,'.nojekyll'),'');
 console.log('Verified all billion digits. Compressed data: '+bytes+' bytes.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
