const fs=require('fs');
const N=1000000, D=N+30;
function bs(a,b){if(b-a===1){if(a===0)return [1n,1n,13591409n];let k=BigInt(a),p=(6n*k-5n)*(2n*k-1n)*(6n*k-1n),q=k*k*k*10939058860032000n,t=p*(13591409n+545140134n*k);return[p,q,a%2?-t:t]}let m=(a+b)>>1,[p,q,t]=bs(a,m),[r,s,u]=bs(m,b);return[p*r,q*s,t*s+p*u]}
function sqrt(n){let x=1n<<BigInt(Math.ceil(n.toString(2).length/2));for(;;){let y=(x+n/x)>>1n;if(y>=x)return x;x=y}}
let [p,q,t]=bs(0,Math.ceil(D/14.181647462)+1),scale=10n**BigInt(D);let raw=(q*426880n*sqrt(10005n*scale*scale)/t).toString();fs.writeFileSync(require('path').join(__dirname,'pibillion.txt'),raw.slice(1,N+1));console.log('Generated',N,'decimal digits; last digit',raw[N]);

