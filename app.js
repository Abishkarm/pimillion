'use strict';
const $=id=>document.getElementById(id);
const TOTAL=1000000000, BLOCK=1000000;
let digits='',total=TOTAL,pageSize=1000,start=1,page='',ready=false,manifest=null;
let wins=0,plays=0,heads=0,tails=0,renderToken=0,searchController=null,lastQuery='',match=-1,lastBounds='';
const cache=new Map();
const colors=['#9caeff','#69d7d0','#e5b968','#cda1ef','#8bc6f7','#ed9dac','#94d0a1','#eab589','#a7b8da','#d9c5a3'];
function integer(id,max){const n=Number($(id).value);if(!Number.isInteger(n)||n<1||n>max)throw Error(`Enter a whole number between 1 and ${max.toLocaleString()}.`);return n;}
function randomInt(n){const a=new Uint32Array(1),limit=4294967296-4294967296%n;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%n;}
async function loadChunk(index,signal){
  signal?.throwIfAborted();
  if(cache.has(index))return cache.get(index);
  const expectedHash=manifest.hashes[index];
  const response=await fetch('data/'+String(index).padStart(4,'0')+'.bin?v='+expectedHash.slice(0,16),{signal:signal||AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Could not load this digit section. Please try again.');
  const compressed=await response.arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',compressed);
  const actualHash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(actualHash!==expectedHash)throw Error('Digit section failed verification. Refresh and try again.');
  const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  const text=await new Response(stream).text();
  signal?.throwIfAborted();
  if(text.length!==BLOCK||!/^\d+$/.test(text))throw Error('Invalid digit section.');
  if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(index,text);return text;
}
async function read(pos,length,signal){
  if(!manifest)throw Error('The digit library is still connecting.');
  if(!Number.isInteger(pos)||!Number.isInteger(length)||pos<1||length<1||pos+length-1>total)throw Error('That range is outside the active digit library.');
  let offset=pos-1,remaining=length,result='';
  while(remaining){const index=Math.floor(offset/BLOCK),within=offset%BLOCK,n=Math.min(remaining,BLOCK-within);const text=await loadChunk(index,signal);result+=text.slice(within,within+n);offset+=n;remaining-=n;}
  return result;
}
function act(id,out,fn){$(id).onclick=async()=>{const button=$(id);button.disabled=true;try{await fn();}catch(e){if(e.name!=='AbortError')$(out).textContent=e.message;}finally{button.disabled=false;if(ready){$('prev').disabled=start===1;$('next').disabled=start+page.length-1===total;}} };}
async function render(pos){
  const token=++renderToken,end=Math.min(pos+pageSize-1,total);$('range').textContent='Loading decimal positions '+pos.toLocaleString()+'–'+end.toLocaleString()+'…';
  const text=await read(pos,end-pos+1);if(token!==renderToken)return;
  start=pos;page=text;$('position').value=pos;$('range').textContent=`Decimal positions ${pos.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`;
  const f=document.createDocumentFragment();for(let i=0;i<text.length;i++){const b=document.createElement('button');b.textContent=text[i];if($('colorize').checked)b.style.color=colors[Number(text[i])];b.setAttribute('aria-label',`Digit ${text[i]} at decimal position ${pos+i}`);b.onclick=()=>{document.querySelectorAll('#pi-digits .active').forEach(el=>el.classList.remove('active'));b.classList.add('active');$('selected').textContent=`Digit ${text[i]} · decimal position ${(pos+i).toLocaleString()}`;};f.append(b);}
  $('pi-digits').replaceChildren(f);$('prev').disabled=pos===1;$('next').disabled=end===total;
}
act('go','selected',()=>render(integer('position',total)));
act('prev','selected',()=>render(Math.max(1,start-pageSize)));
act('next','selected',()=>render(Math.min(total,start+pageSize)));
async function search(next){
  if(searchController)return;
  const q=$('query').value;if(!/^\d{1,30}$/.test(q))throw Error('Enter 1 to 30 digits, without spaces.');
  const from=integer('search-from',total),to=integer('search-to',total);if(to<from)throw Error('Search through must be at or after Search from.');
  const bounds=from+':'+to;let pos=next&&q===lastQuery&&bounds===lastBounds?(match<0?to+1:match+2):from;
  lastQuery=q;lastBounds=bounds;match=-1;
  const controller=new AbortController();searchController=controller;$('cancel-search').disabled=false;let tail='';
  try{
    while(pos<=to){controller.signal.throwIfAborted();const length=Math.min(BLOCK,to-pos+1);$('found').textContent=`Searching positions ${pos.toLocaleString()}–${(pos+length-1).toLocaleString()} · ${Math.floor((pos-from)/(to-from+1)*100)}%`;
      const text=tail+await read(pos,length,controller.signal),index=text.indexOf(q);
      if(index>=0){match=pos-tail.length+index-1;await render(match+1);[...$('pi-digits').children].slice(0,q.length).forEach(b=>b.classList.add('active'));$('found').textContent=`“${q}” begins at decimal position ${(match+1).toLocaleString()}.`;return;}
      tail=q.length>1?text.slice(-(q.length-1)):'';pos+=length;await new Promise(resolve=>setTimeout(resolve,0));
    }
    $('found').textContent=`No further match within positions ${from.toLocaleString()}–${to.toLocaleString()}.`;
  }catch(e){if(e.name==='AbortError')$('found').textContent='Search stopped. Narrow the range or start again.';else throw e;}
  finally{searchController=null;$('cancel-search').disabled=true;}
}
act('search','found',()=>search(false));act('again','found',()=>search(true));
$('cancel-search').onclick=()=>searchController?.abort();
act('random','random-result',async()=>{const n=integer('length',30),pos=randomInt(total-n+1)+1,text=await read(pos,n);$('random-result').textContent=`${text} · decimal positions ${pos.toLocaleString()}–${(pos+n-1).toLocaleString()}`;await render(pos);});
function score(){$('score').textContent=`${wins} wins / ${plays} plays · Heads ${heads} · Tails ${tails}`;}
async function flip(guess){if(flip.busy)return;flip.busy=true;$('heads').disabled=$('tails').disabled=$('reset').disabled=true;$('coin').textContent='Loading a random digit from one billion positions…';try{const pos=randomInt(total)+1,d=Number(await read(pos,1)),result=d%2?'tails':'heads';$('coin-art').classList.remove('flipping');void $('coin-art').offsetWidth;$('coin-art').classList.add('flipping');$('coin-art').textContent=result==='heads'?'H':'T';plays++;if(result===guess)wins++;if(result==='heads')heads++;else tails++;$('coin').textContent=`${result.toUpperCase()} — ${result===guess?'You won!':'Try again!'} Digit ${d} at decimal position ${pos.toLocaleString()}.`;score();}finally{flip.busy=false;$('heads').disabled=$('tails').disabled=$('reset').disabled=false;}}
act('heads','coin',()=>flip('heads'));act('tails','coin',()=>flip('tails'));
act('reset','coin',()=>{wins=plays=heads=tails=0;score();$('coin-art').textContent='π';$('coin').textContent='Ready to flip';});
$('theme').onclick=()=>{document.body.classList.toggle('light');try{localStorage.setItem('pimillion-theme',document.body.classList.contains('light')?'light':'dark');}catch{}};
try{if(localStorage.getItem('pimillion-theme')==='light')document.body.classList.add('light');}catch{}
$('page-size').onchange=()=>{pageSize=Number($('page-size').value);if(ready)render(start).catch(e=>$('selected').textContent=e.message);};
$('colorize').onchange=()=>{if(ready)render(start).catch(e=>$('selected').textContent=e.message);};
act('copy','selected',async()=>{try{await navigator.clipboard.writeText(page);$('selected').textContent='Page copied to clipboard.';}catch{$('selected').textContent='Clipboard unavailable. Select digits to copy manually.';}});
$('position').onkeydown=e=>{if(e.key==='Enter'&&ready)$('go').click();};$('query').onkeydown=e=>{if(e.key==='Enter'&&ready)$('search').click();};
act('memory-check','memory-result',async()=>{const v=$('memory-input').value;if(!/^\d{1,10000}$/.test(v))throw Error('Type 1 to 10,000 decimal digits, starting with 14159.');const expected=await read(1,v.length);let n=0;while(n<v.length&&v[n]===expected[n])n++;$('memory-result').textContent=n===v.length?'Perfect! '+n+' correct digits. Keep going!':n+' correct digits. Position '+(n+1)+' should be '+expected[n]+'. Try again!';});
function drawBars(){const counts=Array(10).fill(0);for(const d of digits)counts[Number(d)]++;const max=Math.max(...counts);$('bars').replaceChildren();counts.forEach((n,i)=>{const item=document.createElement('div');item.className='bar-item';const label=document.createElement('small');label.textContent=(n/10000).toFixed(2)+'%';const bar=document.createElement('div');bar.className='bar';bar.style.height=(n/max*120)+'px';bar.title=n.toLocaleString()+' occurrences of '+i;const digit=document.createElement('b');digit.textContent=i;item.append(label,bar,digit);$('bars').append(item);});}
const dataButtons=[...document.querySelectorAll('button')].filter(b=>!['theme','cancel-search','retry'].includes(b.id));dataButtons.forEach(b=>b.disabled=true);
$('retry').onclick=()=>location.reload();
(async()=>{try{
  if(typeof DecompressionStream==='undefined')throw Error('Please use a current browser that supports compressed digit sections.');
  const response=await fetch('data/manifest.json',{cache:'no-store',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Could not connect to the digit library.');
  manifest=await response.json();
  if(manifest.total!==TOTAL||manifest.chunkSize!==BLOCK||manifest.hashes?.length!==1000||!manifest.hashes.every(h=>/^[a-f0-9]{64}$/.test(h)))throw Error('Invalid digit library manifest.');
  digits=await read(1,BLOCK);if(!digits.startsWith('14159265358979323846'))throw Error('Digit library prefix failed verification.');
  drawBars();ready=true;dataButtons.forEach(b=>b.disabled=false);await render(1);$('status').textContent='1,000,000,000 decimal digits ready · sections load automatically as you explore.';
}catch(e){$('status').textContent=e.message+' Refresh to retry.';}})();
