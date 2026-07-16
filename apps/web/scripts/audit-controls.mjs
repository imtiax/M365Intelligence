import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const password=process.env.AEGIS_SMOKE_PASSWORD;if(!password)throw new Error('AEGIS_SMOKE_PASSWORD is required.');
const debugPort=Number(process.env.AEGIS_CONTROL_AUDIT_DEBUG_PORT||9447);
const child=spawn(process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[`--remote-debugging-port=${debugPort}`,`--user-data-dir=${join(tmpdir(),`aegis-audit-${process.pid}-${randomUUID()}`)}`,'--headless=new','--disable-gpu','--no-first-run','--window-size=1600,1100','http://localhost:3008/login'],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function target(){for(let i=0;i<80;i++){try{const p=(await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r=>r.json())).find(x=>x.type==='page');if(p)return p}catch{}await delay(250)}throw new Error('Chrome did not start')}
const page=await target(),socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})});let id=0;const pending=new Map();socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}});const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}))});const evaluate=async expression=>(await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result.value;async function waitFor(expression){for(let i=0;i<60;i++){if(await evaluate(expression))return;await delay(150)}throw new Error(`Timeout: ${expression}`)}
try{
 await send('Runtime.enable');
 await waitFor("location.pathname==='/login'");
 const login=await evaluate(`fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin@apex.local',password:${JSON.stringify(password)}})}).then(r=>r.status)`);if(login!==200)throw new Error(`Login ${login}`);
 await evaluate("location.assign('/')");await waitFor("!!document.querySelector('h1')");await delay(1600);
 const labels=await evaluate("[...document.querySelectorAll('nav button')].map(x=>x.textContent.trim().replace(/\\s+/g,' '))");
 const inventory=[];
 for(const label of labels){
   await evaluate(`(()=>{const b=[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().replace(/\\s+/g,' ')===${JSON.stringify(label)});b.click();return true})()`);await delay(150);
   const controls=await evaluate(`(()=>{const visible=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};const name=e=>(e.getAttribute('aria-label')||e.getAttribute('title')||e.labels?.[0]?.textContent||e.closest('label')?.textContent||e.placeholder||e.name||'').trim().replace(/\\s+/g,' ');return {heading:document.querySelector('h1')?.textContent.trim(),buttons:[...document.querySelectorAll('main button')].filter(visible).map((b,i)=>({index:i,text:name(b)||(b.textContent||'').trim().replace(/\\s+/g,' '),className:b.className,disabled:b.disabled,busy:b.getAttribute('aria-busy')==='true'})),inputs:[...document.querySelectorAll('main input,main select,main textarea')].filter(visible).map(e=>({tag:e.tagName,type:e.type||'',name:name(e),placeholder:e.placeholder||'',value:e.value||'',disabled:e.disabled}))}})()`);
   inventory.push({navigation:label,...controls});
 }
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/control-inventory.json',JSON.stringify(inventory,null,2));
 const issues=inventory.flatMap(page=>[
   ...page.buttons.filter(button=>!button.text).map(button=>({page:page.navigation,type:'unlabeled-button',index:button.index})),
   ...page.buttons.filter(button=>button.disabled&&!button.busy).map(button=>({page:page.navigation,type:'disabled-button',index:button.index,text:button.text})),
   ...page.inputs.filter(input=>!input.name).map((input,index)=>({page:page.navigation,type:'unlabeled-input',index,tag:input.tag})),
 ]);
 const summary={pages:inventory.length,buttons:inventory.reduce((s,p)=>s+p.buttons.length,0),inputs:inventory.reduce((s,p)=>s+p.inputs.length,0),accessibilityIssues:issues.length,issues,perPage:inventory.map(p=>({page:p.navigation,buttons:p.buttons.length,inputs:p.inputs.length}))};
 console.log(JSON.stringify(summary,null,2));
 if(issues.length)throw new Error(`Control audit found ${issues.length} accessibility or disabled-control issues.`);
}finally{socket.close();child.kill()}
