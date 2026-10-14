const STAT=['Registered','In transit','Arrived','Inspected','Delivered'];
const KEY='scacms-simple-v4';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=d=>new Date(d).toLocaleString('en-ZA',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
let S,session=null,tab='',loginTab='signin',trackCode='',cur=null,pending={},wf='all',wq='',wp='today';

/* ---------- first-page text (built-in defaults, replaced by the database when available) ---------- */
let PAGE={brand_name:'SCACMS',headline:'Register your shipment, follow it all the way, and know its condition on arrival.',tagline:'SCA Customs Management System demo.',point_1:'Register a shipment with a photo of your goods',point_2:'Field workers inspect and report on every container',point_3:'Clients are told straight away if goods are damaged or fine',footer:'Customs, containers and clients in one place'};
function applyPage(){
 const set=(sel,t)=>{const el=$(sel);if(el&&t)el.textContent=t};
 set('.hb',PAGE.brand_name);set('.hero h1',PAGE.headline);set('.hero p',PAGE.tagline);
 [PAGE.point_1,PAGE.point_2,PAGE.point_3].forEach((t,i)=>set(`.pts li:nth-child(${i+1})`,t));
 set('.hf',PAGE.footer);
}
async function loadPage(){
 try{
  const r=await fetch('api/login_page.php');
  if(!r.ok)return;
  PAGE=Object.assign(PAGE,await r.json());
  applyPage();
 }catch(e){/* keep the built-in text if the server cannot be reached */}
}

function samplePhoto(kind){
 const c=document.createElement('canvas');c.width=480;c.height=300;const x=c.getContext('2d');
 x.fillStyle='#2B3A4F';x.fillRect(0,0,480,300);
 if(kind==='goods'){
  for(let r=0;r<3;r++)for(let k=0;k<5;k++){x.fillStyle=(r+k)%2?'#B98B5A':'#A67848';x.fillRect(40+k*80,50+r*68,74,62);x.fillStyle='#D9C7A3';x.fillRect(74+k*80,50+r*68,6,62)}
  x.fillStyle='#E6ECF3';x.font='16px sans-serif';x.fillText('Sample product photo',150,278);
 }else{
  for(let i=0;i<8;i++){x.fillStyle=i%2?'#A8442F':'#C98A1B';x.fillRect(30+i*52,60+(i%3)*10,44,170-(i%3)*10)}
  if(kind==='bad'){x.strokeStyle='#F4D35E';x.lineWidth=4;x.beginPath();x.moveTo(150,70);x.lineTo(190,130);x.lineTo(160,190);x.stroke();x.fillStyle='#1B2433';x.fillRect(250,120,50,70)}
  x.fillStyle='#E6ECF3';x.font='16px sans-serif';x.fillText('Sample inspection photo',140,278);
 }
 return c.toDataURL('image/jpeg',.7);
}
function seed(){
 const d=n=>new Date(Date.now()-n*864e5).toISOString();
 const users=[
  {id:'a1',role:'admin',name:'Thandi Mokoena',email:'thandi@sca.demo',phone:'',pw:'scacms',active:true},
  {id:'w1',role:'worker',name:'Sipho Nkosi',email:'sipho@sca.demo',phone:'',pw:'scacms',active:true},
  {id:'w2',role:'worker',name:'Johan Botha',email:'johan@sca.demo',phone:'',pw:'scacms',active:true},
  {id:'k1',role:'client',ctype:'company',name:'Highveld Mining Supplies',contact:'Anele Zulu',reg:'2011/004512/07',email:'anele@client.demo',phone:'011 555 0142',pw:'scacms',active:true},
  {id:'k2',role:'client',ctype:'individual',name:'Marike Louw',contact:'',reg:'',email:'marike@client.demo',phone:'021 555 0198',pw:'scacms',active:true}];
 const ships=[
  {id:'s1',code:'SCA-10021',clientId:'k1',client:'Highveld Mining Supplies',goods:'Conveyor belt rollers',origin:'Shanghai, CN',dest:'Durban, ZA',container:'MSKU4829103',photo:samplePhoto('goods'),isNew:false,status:'Arrived',worker:null,report:null,updates:[{at:d(3),by:'Thandi Mokoena',text:'Your container has been loaded and is on its way.'},{at:d(0),by:'Thandi Mokoena',text:'Your container has arrived at the port. An inspector will check it shortly.'}]},
  {id:'s2',code:'SCA-10022',clientId:null,client:'Lowveld Citrus Co-op',goods:'Navel oranges, 20 pallets',origin:'Nelspruit, ZA',dest:'Rotterdam, NL',container:'TGHU6615207',photo:null,isNew:false,status:'Inspected',worker:'w2',report:{condition:'damaged',note:'Two pallets crushed at the door end. Cartons wet and some fruit spoiled.',photo:samplePhoto('bad'),by:'Johan Botha',at:d(0),handled:false},updates:[{at:d(0),by:'SCA (automatic)',text:'Your goods were inspected on arrival and damage was found. SCA is assessing the damage and will contact you with details and next steps.'},{at:d(2),by:'Thandi Mokoena',text:'Your container has arrived at the port.'}]},
  {id:'s3',code:'SCA-10023',clientId:null,client:'Durban Auto Parts',goods:'Brake assemblies',origin:'Frankfurt, DE',dest:'OR Tambo, ZA',container:'AWB 176-48210934',photo:null,isNew:false,status:'In transit',worker:null,report:null,updates:[{at:d(1),by:'Thandi Mokoena',text:'Your shipment has left Frankfurt.'}]},
  {id:'s4',code:'SCA-10024',clientId:'k2',client:'Marike Louw',goods:'Household furniture, 14 boxes',origin:'Cape Town, ZA',dest:'Felixstowe, GB',container:'CMAU7730412',photo:samplePhoto('goods'),isNew:false,status:'Inspected',worker:'w2',report:{condition:'good',note:'All boxes intact, seals unbroken.',photo:samplePhoto('good'),by:'Johan Botha',at:d(1),handled:true},updates:[{at:d(1),by:'SCA (automatic)',text:'Good news: your goods were inspected on arrival and are in good condition. SCA will arrange the next step.'},{at:d(3),by:'Thandi Mokoena',text:'Your container has arrived at the port.'}]},
  {id:'s5',code:'SCA-10025',clientId:'k1',client:'Highveld Mining Supplies',goods:'Steel reinforcing bar',origin:'Maputo, MZ',dest:'Lebombo Border, ZA',container:'TRLR 22918',photo:samplePhoto('goods'),isNew:false,status:'Arrived',worker:'w2',report:null,updates:[]}];
 const notes=[{id:'n1',to:'k2',at:d(1),ship:'s4',text:'SCA-10024: Good news: your goods were inspected on arrival and are in good condition. SCA will arrange the next step.',email:'marike@client.demo',seen:false}];

 const startDay=n=>{const t=new Date();t.setHours(0,0,0,0);t.setDate(t.getDate()-n);return t};
 const inspections=[];let k=1;
 const gen=(w,off,count,every)=>{for(let i=0;i<count;i++){let t;if(off===0){const a=startDay(0).getTime(),b=Date.now();t=new Date(a+(i+1)/(count+1)*(b-a))}else t=new Date(startDay(off).getTime()+(8*60+i*18)*6e4);inspections.push({id:'i'+k++,worker:w,at:t.toISOString(),ship:null,condition:every&&(i+1)%every===0?'damaged':'good'})}};
 gen('w2',0,20,9);[21,20,17,23,19,21].forEach((n,i)=>gen('w2',i+1,n,9));
 gen('w1',0,14,7);[19,21,16,18,20,15].forEach((n,i)=>gen('w1',i+1,n,7));
 inspections.push({id:'i'+k++,worker:'w2',at:d(0),ship:'s2',condition:'damaged'},{id:'i'+k++,worker:'w2',at:d(1),ship:'s4',condition:'good'});
 return{users,ships,notes,inspections,target:20};
}
function save(){try{localStorage.setItem(KEY,JSON.stringify({S,session}))}catch(e){}}
function load(){try{const r=localStorage.getItem(KEY);if(r){const o=JSON.parse(r);if(o&&o.S&&o.S.ships&&o.S.notes&&o.S.inspections){S=o.S;session=o.session;return}}}catch(e){}S=seed();session=null}
const ship=id=>S.ships.find(s=>s.id===id);
const wname=id=>{const u=S.users.find(x=>x.id===id);return u?u.name:'Unassigned'};
const sc=st=>({'Registered':'','In transit':'prog','Arrived':'money','Inspected':'prog','Delivered':'done'}[st]||'');
const pill=st=>`<span class="pill ${sc(st)}">${esc(st)}</span>`;
const cond=r=>r?`<span class="pill ${r.condition==='good'?'done':'bad'}">${r.condition==='good'?'Good':'Damaged'}</span>`:'<span class="sub">Not inspected</span>';
const ROLE={admin:'Admin',worker:'Field worker',client:'Client'};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),3200)}
function notifyClient(s,text){
 if(!s.clientId)return;
 const u=S.users.find(x=>x.id===s.clientId);
 S.notes.unshift({id:'n'+Date.now()+Math.random(),to:s.clientId,at:new Date().toISOString(),ship:s.id,text:`${s.code}: ${text}`,email:u?u.email:'',seen:false});
}
function openNotes(){
 const l=S.notes.filter(n=>n.to===session.id);l.forEach(n=>{n.seen=true});save();render();
 $('#dbody').innerHTML=`<div class="dh"><h2>Notifications</h2><button class="ghost" data-act="close">Close</button></div>${l.length?l.map(n=>`<div class="upd">${esc(n.text)}<div class="sub">${fmt(n.at)}. Email sent to ${esc(n.email)} (simulated)</div></div>`).join(''):'<div class="empty">No notifications yet. You will be told whenever your shipment status changes.</div>'}`;
 $('#dlg').showModal();
}
function inPeriod(iso,p){const sd=new Date();sd.setHours(0,0,0,0);const t=new Date(iso).getTime();return p==='today'?t>=sd.getTime():p==='week'?t>=sd.getTime()-6*864e5:true}
const inspCount=(w,p,dmg)=>S.inspections.filter(i=>i.worker===w&&inPeriod(i.at,p)&&(!dmg||i.condition==='damaged')).length;
function nextCode(){return 'SCA-'+(Math.max(10020,...S.ships.map(s=>Number(s.code.slice(4))||0))+1)}
function stepsHTML(s){const i=STAT.indexOf(s.status);return `<ol class="steps" aria-label="Shipment progress">${STAT.map((x,k)=>`<li class="${k<i?'done':k===i?'now':''}"><i></i>${x}</li>`).join('')}</ol>`}
function updatesHTML(s){return s.updates.length?s.updates.map(u=>`<div class="upd">${esc(u.text)}<div class="sub">${fmt(u.at)}</div></div>`).join(''):'<div class="sub">No updates yet. Check back soon.</div>'}

/* ---------- sign in, register, track ---------- */
function trackHTML(s){
 return `<div class="sec"><div class="ref">${esc(s.code)}</div><h2>${esc(s.goods)}</h2><div class="sub">${esc(s.origin)} to ${esc(s.dest)}, container ${esc(s.container||'to be confirmed')}</div>${stepsHTML(s)}<h3>Updates from SCA</h3>${updatesHTML(s)}</div>`;
}
function trackResult(){
 if(!trackCode)return '';
 const s=S.ships.find(x=>x.code===trackCode.trim().toUpperCase());
 return s?trackHTML(s):`<div class="err" role="alert">We could not find that code. Check it and try again.</div>`;
}
function loginHTML(){
 const quick=[['thandi@sca.demo','Admin'],['sipho@sca.demo','Worker (Sipho)'],['johan@sca.demo','Worker (Johan)'],['anele@client.demo','Client (company)'],['marike@client.demo','Client (individual)']];
 const signin=`<form id="lf" autocomplete="off"><h2 style="margin-bottom:4px">Sign in</h2><div class="sub">Staff and clients sign in here. Pick a demo account, then enter the password.</div>
 <div class="quick">${quick.map(q=>`<button type="button" data-act="fill" data-e="${q[0]}">${q[1]}</button>`).join('')}</div>
 <div class="fld"><label for="em">Email</label><input id="em" type="email" placeholder="name@example.com"></div>
 <div class="fld"><label for="pw">Password</label><input id="pw" type="password"></div>
 <div class="err" id="lerr" role="alert"></div><button class="btn" style="width:100%" type="submit">Sign in</button>
 <div class="note">Demo password for every demo account: <b>scacms</b>. New clients choose their own password under Create account.</div></form>`;
 const reg=`<form id="rf" autocomplete="off"><h2 style="margin-bottom:4px">Create your account</h2><div class="sub">Register as a company or an individual to book and track shipments.</div>
 <div class="type" style="margin-top:12px" role="radiogroup" aria-label="Account type"><label><input type="radio" name="ctype" value="company" checked> Company</label><label><input type="radio" name="ctype" value="individual"> Individual</label></div>
 <div id="g-co"><div class="fld"><label for="r1">Company name</label><input id="r1"></div><div class="fld"><label for="r2">Contact person</label><input id="r2"></div><div class="fld"><label for="r3">Registration number (optional)</label><input id="r3"></div></div>
 <div id="g-in" style="display:none"><div class="fld"><label for="r4">Full name</label><input id="r4"></div><div class="fld"><label for="r5">ID or passport number (optional)</label><input id="r5"></div></div>
 <div class="fld"><label for="r6">Email</label><input id="r6" type="email"></div><div class="fld"><label for="r7">Phone</label><input id="r7" type="tel"></div>
 <div class="f2"><div class="fld"><label for="r8">Password (8+ characters)</label><input id="r8" type="password"></div><div class="fld"><label for="r9">Confirm password</label><input id="r9" type="password"></div></div>
 <div class="err" id="rerr" role="alert"></div><button class="btn" style="width:100%" type="submit">Create account</button><div class="note">Demo only: passwords are kept in your browser. The real system stores them hashed.</div></form>`;
 const track=`<form id="tf" autocomplete="off"><h2 style="margin-bottom:4px">Track a shipment</h2><div class="sub">Enter the shipment code from SCA. No account needed.</div>
 <div class="fld" style="margin-top:12px"><label for="tc">Shipment code</label><input id="tc" placeholder="SCA-10021" value="${esc(trackCode)}"></div>
 <button class="btn" style="width:100%" type="submit">Track</button><div class="note">Try SCA-10021, SCA-10022 or SCA-10024.</div><div id="tres">${trackResult()}</div></form>`;
 const tabs=[['signin','Sign in'],['register','Create account'],['track','Track']];
 return `<div class="login"><div class="hero"><div class="hb">${esc(PAGE.brand_name)}</div><div><h1>${esc(PAGE.headline)}</h1><p>${esc(PAGE.tagline)}</p><ul class="pts"><li>${esc(PAGE.point_1)}</li><li>${esc(PAGE.point_2)}</li><li>${esc(PAGE.point_3)}</li></ul></div><div class="hf">${esc(PAGE.footer)}</div></div>
 <div class="lf"><div class="lbox"><div class="seg">${tabs.map(t=>`<button data-act="lt" data-t="${t[0]}" class="${loginTab===t[0]?'on':''}">${t[1]}</button>`).join('')}</div>${loginTab==='signin'?signin:loginTab==='register'?reg:track}</div></div></div>`;
}
function doLogin(){
 const em=$('#em').value.trim().toLowerCase(),pw=$('#pw').value,e=$('#lerr');
 const u=S.users.find(x=>x.email===em);
 if(!u){e.textContent='No account found for that email. Create an account if you are a new client.';return}
 if(!u.active){e.textContent='This account is deactivated. Contact SCA.';return}
 if(pw!==u.pw){e.textContent='Invalid password. Check it and try again.';return}
 session=u;tab='';save();render();
}
function doRegister(){
 const type=document.querySelector('input[name=ctype]:checked').value,v=id=>$('#'+id).value.trim(),e=$('#rerr');
 const name=type==='company'?v('r1'):v('r4'),email=v('r6').toLowerCase();
 if(!name)return e.textContent=type==='company'?'Enter your company name.':'Enter your full name.';
 if(type==='company'&&!v('r2'))return e.textContent='Enter a contact person.';
 if(!/^\S+@\S+\.\S+$/.test(email))return e.textContent='Enter a valid email address.';
 if(S.users.some(u=>u.email===email))return e.textContent='An account with that email already exists. Try signing in.';
 if(!v('r7'))return e.textContent='Enter a phone number.';
 if($('#r8').value.length<8)return e.textContent='Choose a password with at least 8 characters.';
 if($('#r8').value!==$('#r9').value)return e.textContent='The two passwords do not match.';
 const u={id:'k'+Date.now(),role:'client',ctype:type,name,contact:type==='company'?v('r2'):'',reg:type==='company'?v('r3'):v('r5'),email,phone:v('r7'),pw:$('#r8').value,active:true};
 S.users.push(u);session=u;tab='';save();render();toast('Account created. You can now register your first shipment.');
}

/* ---------- shell ---------- */
function navFor(r){return r==='admin'?[['ships','Shipments'],['reports','Reports'],['clients','Clients'],['workers','Workers']]:r==='worker'?[['work','Containers']]:[['cships','My shipments'],['cnew','Register a shipment']]}
function render(){
 const root=$('#root');
 if(!session){root.innerHTML=loginHTML();return}
 const nav=navFor(session.role);
 if(!nav.some(n=>n[0]===tab))tab=nav[0][0];
 const open=S.ships.filter(s=>s.report&&!s.report.handled).length,fresh=S.ships.filter(s=>s.isNew).length,unseen=S.notes.filter(n=>n.to===session.id&&!n.seen).length;
 root.innerHTML=`<header class="bar"><div class="brand">${esc(PAGE.brand_name)}</div><nav class="tabs">${nav.map(([k,l])=>`<button class="tab ${k===tab?'on':''}" data-act="tab" data-v="${k}">${l}${k==='reports'&&open?`<i class="badge">${open}</i>`:''}${k==='ships'&&fresh?`<i class="badge">${fresh}</i>`:''}</button>`).join('')}</nav>
 <div class="who">${session.role==='client'?`<button class="ghost" data-act="cnotes">Notifications${unseen?`<i class="badge">${unseen}</i>`:''}</button>`:''}<div><b>${esc(session.name)}</b> <span>${ROLE[session.role]}${session.ctype?', '+session.ctype:''}</span></div><button class="ghost" data-act="reset">Reset demo</button><button class="ghost" data-act="logout">Sign out</button></div></header><main>${VIEWS[tab]()}</main>`;
}
const VIEWS={
 ships(){
  const fresh=S.ships.filter(s=>s.isNew).length;
  return `<div class="head"><h1>Shipments</h1><button class="btn" data-act="newship">Register for a client</button></div>${fresh?`<div class="alert">${fresh} new shipment${fresh>1?'s':''} registered by clients. Open each one to confirm the container. Field workers can assign themselves to containers, or you can assign one here.</div>`:''}
  <div class="tw"><table><thead><tr><th>Code</th><th>Client</th><th>Goods and route</th><th>Status</th><th>Condition</th><th>Field worker</th></tr></thead><tbody>${S.ships.map(s=>`<tr class="row" data-act="open" data-id="${s.id}"><td class="ref">${esc(s.code)}${s.isNew?' <span class="pill new">New</span>':''}</td><td>${esc(s.client)}</td><td>${esc(s.goods)}<div class="sub">${esc(s.origin)} to ${esc(s.dest)}</div></td><td>${pill(s.status)}</td><td>${cond(s.report)}</td><td>${esc(wname(s.worker))}</td></tr>`).join('')}</tbody></table></div>`;
 },
 reports(){
  const list=S.ships.filter(s=>s.report).sort((a,b)=>(a.report.handled-b.report.handled)||(new Date(b.report.at)-new Date(a.report.at)));
  const open=list.filter(s=>!s.report.handled).length;
  return `<div class="head"><h1>Inspection reports</h1></div>${open?`<div class="alert">${open} damage report${open>1?'s need':' needs'} a follow-up message to the client.</div>`:''}
  ${list.length?`<div class="cards">${list.map(s=>`<div class="card click" data-act="open" data-id="${s.id}"><div style="display:flex;justify-content:space-between;gap:8px"><span class="ref">${esc(s.code)}</span>${cond(s.report)}</div><div style="margin-top:6px">${esc(s.client)}</div><div class="sub">${esc(s.goods)}, container ${esc(s.container||'-')}</div><img src="${s.report.photo}" alt="Inspection photo"><div class="sub">${esc(s.report.note||'No notes')}</div><div style="margin-top:8px"><span class="pill done">Client notified</span> ${s.report.condition==='damaged'?(s.report.handled?'<span class="pill done">Follow-up sent</span>':'<span class="pill money">Needs follow-up</span>'):''} <span class="sub">${esc(s.report.by)}, ${fmt(s.report.at)}</span></div></div>`).join('')}</div>`:'<div class="tw empty">No reports yet. Reports appear here when a field worker submits an inspection.</div>'}`;
 },
 clients(){
  const list=S.users.filter(u=>u.role==='client');
  return `<div class="head"><h1>Clients</h1></div><div class="tw"><table><thead><tr><th>Name</th><th>Type</th><th>Contact</th><th>Email and phone</th><th>Shipments</th></tr></thead><tbody>${list.length?list.map(u=>`<tr><td>${esc(u.name)}${u.reg?`<div class="sub">${u.ctype==='company'?'Reg':'ID'} ${esc(u.reg)}</div>`:''}</td><td>${u.ctype==='company'?'Company':'Individual'}</td><td>${esc(u.contact||'-')}</td><td>${esc(u.email)}<div class="sub">${esc(u.phone)}</div></td><td>${S.ships.filter(s=>s.clientId===u.id).length}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No clients have registered yet.</td></tr>'}</tbody></table></div>`;
 },
 workers(){
  const T=S.target,ws=S.users.filter(u=>u.role==='worker');
  const rows=ws.map(u=>({u,n:inspCount(u.id,wp),dmg:inspCount(u.id,wp,true),today:inspCount(u.id,'today')})).sort((a,b)=>b.n-a.n||a.u.name.localeCompare(b.u.name));
  const mx=Math.max(1,...rows.map(r=>r.n)),act=ws.filter(u=>u.active),met=act.filter(u=>inspCount(u.id,'today')>=T).length;
  const todayAll=ws.reduce((x,u)=>x+inspCount(u.id,'today'),0),top=rows[0]&&rows[0].n>0?rows[0]:null;
  const lbl={today:'today',week:'in the last 7 days',all:'in total'}[wp];
  const chips=[['today','Today'],['week','Last 7 days'],['all','All time']].map(([k,l])=>`<button class="chip ${wp===k?'on':''}" data-act="wp" data-v="${k}">${l}</button>`).join('');
  return `<div class="head"><h1>Field workers</h1><button class="btn" data-act="newworker">Add worker</button></div>
  <div class="kpis"><div class="kpi"><b>${met} of ${act.length}</b><span>Workers who met today's target of ${T}</span></div><div class="kpi"><b>${todayAll}</b><span>Inspections done today</span></div><div class="kpi"><b>${top?esc(top.u.name):'None yet'}</b><span>${top?`Most inspections ${lbl} (${top.n})`:'Most inspections'}</span></div></div>
  <div class="chips" role="group" aria-label="Time period">${chips}</div>
  <div class="tw"><table><thead><tr><th>Rank</th><th>Worker</th><th>Inspections ${lbl}</th><th>Damage found</th><th>Today vs target</th><th>Open containers</th><th>Status</th><th></th></tr></thead><tbody>${rows.map((r,k)=>`<tr><td>${k+1}</td><td>${esc(r.u.name)}${k===0&&r.n>0?' <span class="pill done">Most inspections</span>':''}<div class="sub">${esc(r.u.email)}</div></td><td><b>${r.n}</b><div class="rbar"><i style="width:${r.n/mx*100}%"></i></div></td><td>${r.dmg}</td><td>${r.today} of ${T} ${r.today>=T?'<span class="pill done">Met</span>':'<span class="pill money">Below</span>'}</td><td>${S.ships.filter(x=>x.worker===r.u.id&&!x.report).length}</td><td>${r.u.active?'<span class="pill done">Active</span>':'<span class="pill bad">Deactivated</span>'}</td><td><button class="ghost" data-act="toggleworker" data-id="${r.u.id}">${r.u.active?'Deactivate':'Reactivate'}</button></td></tr>`).join('')}</tbody></table></div>
  <div class="panel" style="margin-top:16px;max-width:360px"><div class="fld" style="margin:0"><label for="tg">Daily target per worker (containers)</label><input id="tg" type="number" min="1" value="${T}" data-change="target"></div><div class="sub" style="margin-top:6px">Default is 20. Lower it to see how a worker's "Target reached" state looks in the demo.</div></div>
  <div class="note">Workers are deactivated, never deleted, so their past reports and counts stay on record. New workers get the demo password <b>scacms</b>.</div>`;
 },
 work(){
  const all=S.ships.filter(x=>x.status!=='Delivered'||x.worker===session.id);
  const cnt={all:all.length,available:all.filter(x=>!x.worker).length,mine:all.filter(x=>x.worker===session.id).length};
  const chips=[['all','All'],['available','Available'],['mine','Mine']].map(([k,l])=>`<button class="chip ${wf===k?'on':''}" data-act="wf" data-v="${k}">${l} (${cnt[k]})</button>`).join('');
  const T=S.target,n=inspCount(session.id,'today'),pct=Math.min(100,n/T*100);
  return `<div class="head"><h1>Containers</h1></div>
  <div class="panel"><div class="ph"><div><div class="sub">Your inspections today</div><div class="big"><b>${n}</b> of ${T}</div></div>${n>=T?'<span class="pill done">Target reached</span>':`<span class="pill money">${T-n} to go</span>`}</div>
  <div class="meter ${n>=T?'ok':''}" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="${T}" aria-label="Daily inspection target"><i style="width:${pct}%"></i></div><div class="sub">Daily target: at least ${T} containers. Your last 7 days: ${inspCount(session.id,'week')} inspections.</div></div>
  <div class="srch"><label class="sub" for="wq">Find a container</label><input id="wq" type="search" placeholder="Search by container number, shipment code, client or goods" value="${esc(wq)}" autocomplete="off"></div>
  <div class="chips" role="group" aria-label="Filter containers">${chips}</div><div id="wcards">${workCardsHTML()}</div>`;
 },
 cships(){
  const mine=S.ships.filter(s=>s.clientId===session.id);
  if(!mine.length)return `<div class="head"><h1>My shipments</h1></div><div class="tw empty">You have not registered a shipment yet. Open "Register a shipment" to start.</div>`;
  return `<div class="head"><h1>My shipments</h1><button class="btn" data-act="tab" data-v="cnew">Register a shipment</button></div><div class="cards">${mine.map(s=>`<div class="card click" data-act="open" data-id="${s.id}"><div style="display:flex;justify-content:space-between;gap:8px"><span class="ref">${esc(s.code)}</span>${pill(s.status)}</div><div style="margin-top:6px">${esc(s.goods)}</div><div class="sub">${esc(s.origin)} to ${esc(s.dest)}</div>${s.photo?`<img class="thumb" src="${s.photo}" alt="Product photo">`:''}<div class="sub" style="margin-top:6px">${s.updates.length?esc(s.updates[0].text):'No updates yet.'}</div></div>`).join('')}</div>`;
 },
 cnew(){
  return `<div class="head"><h1>Register a shipment</h1></div><div class="card" style="max-width:640px">
  <div class="fld"><label for="g1">What are you sending?</label><input id="g1" placeholder="e.g. 20 pallets of navel oranges"></div>
  <div class="f2"><div class="fld"><label for="g2">Where will the goods be collected?</label><input id="g2" placeholder="City, country"></div><div class="fld"><label for="g3">Destination</label><input id="g3" placeholder="City, country"></div></div>
  <div class="fld"><label for="g4">Container or AWB number (optional)</label><input id="g4" placeholder="Leave blank if you do not have one yet"></div>
  <div class="fld"><label for="ph-new">Photo of the product being transported</label><input type="file" id="ph-new" accept="image/*" capture="environment" data-id="new"></div>
  <button class="ghost" type="button" data-act="sample" data-id="new">Use sample photo</button><img id="pv-new" alt="Photo preview" style="display:none;max-width:320px">
  <div class="note">This photo is kept as proof of the condition of your goods before transport.</div>
  <div class="err" id="ge" role="alert"></div><button class="btn" data-act="clientship">Register shipment</button></div>`;
 }
};

function workCardsHTML(){
 const all=S.ships.filter(x=>x.status!=='Delivered'||x.worker===session.id),q=wq.trim().toLowerCase();
 const list=all.filter(x=>(wf==='all'||(wf==='available'&&!x.worker)||(wf==='mine'&&x.worker===session.id))&&(!q||[x.container,x.code,x.client,x.goods,x.origin,x.dest].join(' ').toLowerCase().includes(q)));
 if(!list.length)return `<div class="tw empty">${q?`No containers match "${esc(wq)}". Check the number or clear the search.`:'Nothing here. Try another filter.'}</div>`;
 return `<div class="cards">${list.map(workCard).join('')}</div>`;
}
function workCard(s){
 const mine=s.worker===session.id,r=s.report,ready=mine&&s.status==='Arrived'&&!r;
 const who=!s.worker?'<span class="pill money">Available</span>':mine?'<span class="pill done">Assigned to you</span>':`<span class="pill">Assigned to ${esc(wname(s.worker))}</span>`;
 return `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="ref">${esc(s.container||'No container number yet')}</span>${pill(s.status)}</div>
 <div style="margin-top:6px">${esc(s.goods)}</div><div class="sub">${esc(s.code)}, ${esc(s.origin)} to ${esc(s.dest)}</div><div style="margin-top:6px">${who}</div>
 ${s.photo?`<div class="sub" style="margin-top:8px">Photo from client</div><img class="thumb" src="${s.photo}" alt="Product photo from the client">`:''}
 ${!s.worker?`<div class="acts"><button class="btn" data-act="take" data-id="${s.id}">Assign me to this container</button></div>`:''}
 ${r&&mine?`<img src="${r.photo}" alt="Your inspection photo"><div>${cond(r)} <span class="sub">Reported ${fmt(r.at)}. The client was notified automatically.</span></div><div class="sub" style="margin-top:4px">${esc(r.note||'')}</div>`
 :r?`<div style="margin-top:8px">${cond(r)}</div>`
 :ready?`<div class="sec"><h3>Report on this container</h3>
  <div class="fld"><label for="ph-${s.id}">Photo of the contents</label><input type="file" id="ph-${s.id}" accept="image/*" capture="environment" data-id="${s.id}"></div>
  <button class="ghost" type="button" data-act="sample" data-id="${s.id}">Use sample photo</button>
  <img id="pv-${s.id}" alt="Photo preview" ${pending[s.id]?`src="${pending[s.id]}"`:''} style="display:${pending[s.id]?'block':'none'}">
  <div class="rad" role="radiogroup" aria-label="Condition of goods"><label><input type="radio" name="cd-${s.id}" value="good" checked> Good condition</label><label><input type="radio" name="cd-${s.id}" value="damaged"> Damaged</label></div>
  <div class="fld"><label for="nt-${s.id}">Notes</label><textarea id="nt-${s.id}" rows="2" placeholder="What did you see inside?"></textarea></div>
  <div class="note">When you submit, the client is told automatically whether the goods are in good condition or damaged.</div>
  <div class="err" id="er-${s.id}" role="alert"></div><button class="btn" data-act="submit" data-id="${s.id}">Submit report</button></div>`
 :mine?`<div class="note">You can report once this container has arrived.</div>`:''}
 ${mine&&!r?`<div class="acts"><button class="ghost" data-act="giveback" data-id="${s.id}">Give this container back</button></div>`:''}</div>`;
}

/* ---------- admin: shipment detail and client update ---------- */
function openShip(id){cur=id;const s=ship(id);if(s.isNew){s.isNew=false;save();render()}drawShip('');$('#dlg').showModal()}
function drawShip(err){
 const s=ship(cur),r=s.report,k=s.clientId?S.users.find(u=>u.id===s.clientId):null;
 const pre=r&&!r.handled&&r.condition==='damaged'?'Update on the damage found: '+(r.note?r.note+' ':'')+'We are assessing the damage and will contact you about the next steps.':'';
 $('#dbody').innerHTML=`<div class="dh"><div><h2>${esc(s.client)}</h2><div class="sub">${esc(s.goods)}</div></div><div style="display:flex;gap:8px;align-items:center">${pill(s.status)}<button class="ghost" data-act="close">Close</button></div></div>
 <div class="code">Client tracking code: <b>${esc(s.code)}</b><div class="sub">The client sees it in their account. You can also give it to anyone who needs to track this shipment.</div></div>
 <div class="grid2"><div><span>Client</span>${k?`${esc(k.name)} (${k.ctype==='company'?'company':'individual'})<div class="sub">${esc(k.email)}, ${esc(k.phone)}${k.contact?', contact '+esc(k.contact):''}</div>`:'Registered by admin, no client account'}</div><div><span>Route</span>${esc(s.origin)} to ${esc(s.dest)}</div>
 <div class="fld" style="margin-top:8px"><label for="cn">Container number</label><input id="cn" value="${esc(s.container)}" placeholder="Not assigned yet" data-change="container"></div>
 <div class="fld" style="margin-top:8px"><label for="fw">Field worker</label><select id="fw" data-change="assign">${'<option value="">Unassigned</option>'+S.users.filter(u=>u.role==='worker'&&u.active).map(u=>`<option value="${u.id}" ${u.id===s.worker?'selected':''}>${esc(u.name)}</option>`).join('')}</select></div></div>
 ${s.photo?`<div class="sec"><h3>Product photo from the client</h3><img src="${s.photo}" alt="Product photo" style="max-width:340px"></div>`:''}
 ${r?`<div class="sec"><h3>Inspection report</h3><div>${cond(r)} <span class="sub">by ${esc(r.by)}, ${fmt(r.at)}</span></div><img src="${r.photo}" alt="Inspection photo" style="max-width:340px"><div>${esc(r.note||'No notes')}</div></div>`:''}
 <div class="sec"><h3>Message the client</h3>${r?`<div class="note">The client was notified automatically that the goods are ${r.condition==='good'?'in good condition':'damaged'}.${r.condition==='damaged'&&!r.handled?' Send a follow-up with details and next steps. The message below is a suggestion. Edit it before sending.':''}</div>`:''}
 <div class="fld"><label for="um">Message the client will see (they are also notified by email)</label><textarea id="um" rows="3">${esc(pre)}</textarea></div>
 <div class="fld"><label for="us">Shipment status</label><select id="us">${STAT.map(x=>`<option ${x===s.status?'selected':''}>${x}</option>`).join('')}</select></div>
 <div class="err" role="alert">${esc(err)}</div><button class="btn" data-act="sendupdate">Send message and update status</button></div>
 <div class="sec"><h3>What the client has been told</h3>${s.updates.length?s.updates.map(u=>`<div class="upd">${esc(u.text)}<div class="sub">${esc(u.by)}, ${fmt(u.at)}</div></div>`).join(''):'<div class="sub">Nothing sent yet.</div>'}</div>`;
}
function sendUpdate(){
 const s=ship(cur),msg=$('#um').value.trim(),st=$('#us').value;
 if(!msg){const v=$('#us').value;drawShip('Write a short message for the client.');$('#us').value=v;return}
 s.updates.unshift({at:new Date().toISOString(),by:session.name,text:msg});
 s.status=st;if(s.report)s.report.handled=true;
 notifyClient(s,msg);
 save();drawShip('');render();toast(s.clientId?'Client notified in their account and by email.':`Update saved. The client can see it with code ${s.code}.`);
}

/* ---------- client: shipment detail ---------- */
function openClientShip(id){
 const s=ship(id);if(!s||s.clientId!==session.id)return;
 $('#dbody').innerHTML=`<div class="dh"><div><h2>${esc(s.goods)}</h2><div class="sub">Tracking code <span class="ref">${esc(s.code)}</span></div></div><div style="display:flex;gap:8px;align-items:center">${pill(s.status)}<button class="ghost" data-act="close">Close</button></div></div>
 ${stepsHTML(s)}
 <div class="grid2"><div><span>Collected from</span>${esc(s.origin)}</div><div><span>Destination</span>${esc(s.dest)}</div><div style="margin-top:8px"><span>Container or AWB</span>${esc(s.container||'To be confirmed by SCA')}</div></div>
 ${s.photo?`<div class="sec"><h3>Your product photo</h3><img src="${s.photo}" alt="Product photo" style="max-width:340px"></div>`:''}
 <div class="sec"><h3>Updates from SCA</h3>${updatesHTML(s)}</div>`;
 $('#dlg').showModal();
}

/* ---------- forms ---------- */
function saveClientShip(){
 const v=k=>$('#'+k).value.trim(),e=$('#ge');
 if(!v('g1')||!v('g2')||!v('g3'))return e.textContent='Fill in what you are sending, where it is collected and the destination.';
 if(!pending.new)return e.textContent='Add a photo of the product being transported.';
 const s={id:'s'+Date.now(),code:nextCode(),clientId:session.id,client:session.name,goods:v('g1'),origin:v('g2'),dest:v('g3'),container:v('g4'),photo:pending.new,isNew:true,status:'Registered',worker:null,report:null,updates:[{at:new Date().toISOString(),by:'SCA',text:'We received your shipment details and photo. SCA will confirm and arrange a container shortly.'}]};
 delete pending.new;S.ships.unshift(s);tab='cships';save();render();openClientShip(s.id);toast(`Shipment registered. Your tracking code is ${s.code}.`);
}
function formShip(){
 $('#dbody').innerHTML=`<div class="dh"><h2>Register shipment for a client</h2><button class="ghost" data-act="close">Close</button></div>
 <div class="f2"><div class="fld"><label for="n1">Client name</label><input id="n1"></div><div class="fld"><label for="n2">Goods</label><input id="n2"></div>
 <div class="fld"><label for="n3">Origin</label><input id="n3" placeholder="City, country"></div><div class="fld"><label for="n4">Destination</label><input id="n4" placeholder="City, country"></div>
 <div class="fld"><label for="n5">Container or AWB number</label><input id="n5"></div>
 <div class="fld"><label for="n6">Field worker</label><select id="n6"><option value="">Unassigned</option>${S.users.filter(u=>u.role==='worker'&&u.active).map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></div></div>
 <div class="note">Use this for walk-in clients who have no account. Clients with an account register their own shipments.</div><div class="err" id="fe" role="alert"></div><button class="btn" data-act="saveship">Register shipment</button>`;
 $('#dlg').showModal();
}
function saveShip(){
 const v=k=>$('#'+k).value.trim();
 if(!v('n1')||!v('n2')||!v('n3')||!v('n4'))return $('#fe').textContent='Fill in the client, goods, origin and destination.';
 const s={id:'s'+Date.now(),code:nextCode(),clientId:null,client:v('n1'),goods:v('n2'),origin:v('n3'),dest:v('n4'),container:v('n5'),photo:null,isNew:false,status:'Registered',worker:v('n6')||null,report:null,updates:[]};
 S.ships.unshift(s);save();render();cur=s.id;drawShip('');toast('Shipment registered');
}
function formWorker(){
 $('#dbody').innerHTML=`<div class="dh"><h2>Add field worker</h2><button class="ghost" data-act="close">Close</button></div><div class="f2"><div class="fld"><label for="w1">Full name</label><input id="w1"></div><div class="fld"><label for="w2">Email</label><input id="w2" type="email"></div></div><div class="err" id="fe" role="alert"></div><button class="btn" data-act="saveworker">Add worker</button>`;$('#dlg').showModal();
}
function saveWorker(){
 const n=$('#w1').value.trim(),e=$('#w2').value.trim().toLowerCase();
 if(!n||!e)return $('#fe').textContent='Enter a name and an email.';
 if(S.users.some(u=>u.email===e))return $('#fe').textContent='A user with that email already exists.';
 S.users.push({id:'w'+Date.now(),role:'worker',name:n,email:e,phone:'',pw:'scacms',active:true});save();$('#dlg').close();render();toast('Worker added');
}

/* ---------- photos and worker report ---------- */
function shrink(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,640/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.7))};im.onerror=rej;im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}
function setPhoto(id,url){pending[id]=url;const p=$('#pv-'+id);if(p){p.src=url;p.style.display='block'}}
function submitReport(id){
 const s=ship(id),e=$('#er-'+id),c=document.querySelector(`input[name="cd-${id}"]:checked`).value,note=$('#nt-'+id).value.trim();
 if(!pending[id]){e.textContent='Add a photo of the container contents first.';return}
 if(c==='damaged'&&!note){e.textContent='Describe the damage in the notes.';return}
 s.report={condition:c,note,photo:pending[id],by:session.name,at:new Date().toISOString(),handled:c==='good'};delete pending[id];
 s.status='Inspected';
 S.inspections.unshift({id:'i'+Date.now(),worker:session.id,at:new Date().toISOString(),ship:s.id,condition:c});
 const msg=c==='good'?'Good news: your goods were inspected on arrival and are in good condition. SCA will arrange the next step.':'Your goods were inspected on arrival and damage was found. SCA is assessing the damage and will contact you with details and next steps.';
 s.updates.unshift({at:new Date().toISOString(),by:'SCA (automatic)',text:msg});
 notifyClient(s,msg);
 save();render();toast(s.clientId?'Report sent. The client was notified automatically.':'Report sent. The client can see the update with their tracking code.');
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-act]');if(!t)return;
 const a=t.dataset.act,id=t.dataset.id;
 if(a==='lt'){loginTab=t.dataset.t;render();return}
 if(a==='fill'){$('#em').value=t.dataset.e;$('#pw').focus();return}
 if(a==='tab'){tab=t.dataset.v;render();return}
 if(a==='logout'){session=null;loginTab='signin';save();render();return}
 if(a==='reset'){S=seed();session=null;pending={};trackCode='';save();render();toast('Demo data reset');return}
 if(a==='close'){$('#dlg').close();return}
 if(a==='open')return session.role==='admin'?openShip(id):openClientShip(id);
 if(a==='sendupdate')return sendUpdate();
 if(a==='clientship')return saveClientShip();
 if(a==='newship')return formShip();if(a==='saveship')return saveShip();
 if(a==='newworker')return formWorker();if(a==='saveworker')return saveWorker();
 if(a==='toggleworker'){const u=S.users.find(x=>x.id===id);u.active=!u.active;save();render();return}
 if(a==='sample'){const dm=document.querySelector(`input[name="cd-${id}"]:checked`);setPhoto(id,samplePhoto(id==='new'?'goods':(dm&&dm.value==='damaged')?'bad':'good'));return}
 if(a==='submit')return submitReport(id);
 if(a==='cnotes')return openNotes();
 if(a==='wp'){wp=t.dataset.v;render();return}
 if(a==='wf'){wf=t.dataset.v;render();return}
 if(a==='take'){const x=ship(id);if(x.worker&&x.worker!==session.id){toast('Another worker already took this container.');render();return}x.worker=session.id;save();render();toast('Assigned to you.');return}
 if(a==='giveback'){const x=ship(id);if(x.worker===session.id&&!x.report){x.worker=null;save();render();toast('Container returned to the available list.')}return}
});
document.addEventListener('change',async e=>{
 const t=e.target;
 if(t.name==='ctype'){$('#g-co').style.display=t.value==='company'?'':'none';$('#g-in').style.display=t.value==='company'?'none':'';return}
 if(t.type==='file'&&t.dataset.id){const f=t.files[0];if(f){try{setPhoto(t.dataset.id,await shrink(f))}catch(x){toast('That file could not be read as an image')}}return}
 if(t.dataset.change==='target'){const v=parseInt(t.value,10);if(v>=1){S.target=v;save();render();toast(`Daily target set to ${v}.`)}else{t.value=S.target;toast('Enter a target of 1 or more.')}return}
 if(t.dataset.change==='assign'){const s=ship(cur);s.worker=t.value||null;save();render();toast('Field worker updated')}
 if(t.dataset.change==='container'){const s=ship(cur);s.container=t.value.trim();save();render();toast('Container number saved')}
});
document.addEventListener('input',e=>{if(e.target.id==='wq'){wq=e.target.value;$('#wcards').innerHTML=workCardsHTML()}});
document.addEventListener('submit',e=>{
 e.preventDefault();
 if(e.target.id==='lf')doLogin();
 if(e.target.id==='rf')doRegister();
 if(e.target.id==='tf'){trackCode=$('#tc').value;$('#tres').innerHTML=trackResult()}
});
load();render();loadPage();