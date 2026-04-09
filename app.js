// ══════ DATA ══════
let allLogs = [];
const TOPICS = ['Math Foundations','Probability','Statistics','Time Series','Power BI','Excel','Python for DS','SQL','Machine Learning','Deep Learning','NLP','Computer Vision','Generative AI','AI Agents','RAG Systems'];
const CATS   = {'Math Foundations':'Math','Probability':'Math','Statistics':'Math','Time Series':'Data','Power BI':'Tools','Excel':'Tools','Python for DS':'Code','SQL':'Code','Machine Learning':'ML/AI','Deep Learning':'ML/AI','NLP':'ML/AI','Computer Vision':'ML/AI','Generative AI':'GenAI','AI Agents':'GenAI','RAG Systems':'GenAI'};
const CCOL   = {Math:'#6940c8',Data:'#1D9E75',Tools:'#EF9F27',Code:'#378ADD','ML/AI':'#E24B4A',GenAI:'#D4537E'};
const GC = 'rgba(0,0,0,0.05)', TC = '#9b9a97';
let charts = {};

// ══════ PERSIST ══════
function save() { try { localStorage.setItem('ds_logs_v2', JSON.stringify(allLogs)); } catch(e){} }
function load() { try { const d=localStorage.getItem('ds_logs_v2'); if(d) allLogs=JSON.parse(d); } catch(e){} }

// ══════ DATE UTILS ══════
function iso(d) { return d.toISOString().slice(0,10); }
function today() { return iso(new Date()); }
function weekStart(date) {
  const d = new Date(typeof date==='string' ? date+'T12:00:00' : date);
  const day = (d.getDay()+6)%7;
  d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d;
}
function weekDates() {
  const s = weekStart(new Date());
  return Array.from({length:7},(_,i)=>{ const d=new Date(s); d.setDate(d.getDate()+i); return iso(d); });
}
function weekLogs()  { const s=new Set(weekDates()); return allLogs.filter(l=>s.has(l.date)); }
function todayLogs() { const t=today(); return allLogs.filter(l=>l.date===t); }
function monthLogs() {
  const n=new Date();
  return allLogs.filter(l=>{ const d=new Date(l.date+'T12:00:00'); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); });
}
function calcStreak() {
  const dayTot={};
  allLogs.forEach(l=>{ dayTot[l.date]=(dayTot[l.date]||0)+l.dur; });
  const qual=[...Object.entries(dayTot)].filter(([,m])=>m>=540).map(([d])=>d).sort().reverse();
  if(!qual.length) return 0;
  let s=0, cur=new Date(); cur.setHours(0,0,0,0);
  for(const d of qual){
    const dd=new Date(d+'T12:00:00'); dd.setHours(0,0,0,0);
    const diff=Math.round((cur-dd)/86400000);
    if(diff===0||diff===1){s++;cur=dd;}else break;
  }
  return s;
}

// ══════ INIT CHARTS ══════
function initCharts() {
  const baseOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{legend:{display:false}},
    scales:{
      x:{ticks:{color:TC,font:{size:11}},grid:{display:false}},
      y:{ticks:{color:TC,font:{size:11}},grid:{color:GC},beginAtZero:true}
    }
  };

  charts.trend = new Chart(document.getElementById('c-trend'),{
    type:'line',
    data:{
      labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets:[
        {label:'Hours',data:[0,0,0,0,0,0,0],borderColor:'#1D9E75',backgroundColor:'rgba(29,158,117,0.07)',borderWidth:2,pointRadius:4,pointBackgroundColor:'#1D9E75',tension:.3,fill:true},
        {label:'Target',data:[9,9,9,9,9,9,9],borderColor:'#E24B4A',borderWidth:1.5,borderDash:[5,4],pointRadius:0,fill:false,tension:0}
      ]
    },
    options:{...baseOpts,scales:{...baseOpts.scales,y:{...baseOpts.scales.y,ticks:{...baseOpts.scales.y.ticks,callback:v=>v+'h'}}}}
  });

  charts.dist = new Chart(document.getElementById('c-dist'),{
    type:'bar',
    data:{
      labels:['< 30 min','30–60 min','60–90 min','90+ min'],
      datasets:[{label:'Sessions',data:[0,0,0,0],backgroundColor:['#AFA9EC','#6940c8','#378ADD','#1D9E75'],borderRadius:5}]
    },
    options:{...baseOpts,scales:{...baseOpts.scales,y:{...baseOpts.scales.y,ticks:{...baseOpts.scales.y.ticks,stepSize:1}}}}
  });

  charts.focus = new Chart(document.getElementById('c-focus'),{
    type:'doughnut',
    data:{labels:['Deep','Good','Distracted'],datasets:[{data:[0,0,0],backgroundColor:['#1D9E75','#378ADD','#E24B4A'],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{display:false}}}
  });

  charts.alloc = new Chart(document.getElementById('c-alloc'),{
    type:'bar',
    data:{
      labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets:[
        {label:'Learning',data:[0,0,0,0,0,0,0],backgroundColor:'#1D9E75'},
        {label:'Practice',data:[0,0,0,0,0,0,0],backgroundColor:'#378ADD'},
        {label:'Project', data:[0,0,0,0,0,0,0],backgroundColor:'#6940c8'}
      ]
    },
    options:{...baseOpts,scales:{x:{...baseOpts.scales.x,stacked:true},y:{...baseOpts.scales.y,stacked:true,ticks:{...baseOpts.scales.y.ticks,callback:v=>v+'h'}}}}
  });

  charts.weekly = new Chart(document.getElementById('c-weekly'),{
    type:'bar',
    data:{labels:['Week 1','Week 2','Week 3','Week 4'],datasets:[{label:'Hours',data:[0,0,0,0],backgroundColor:'#6940c8',borderRadius:6}]},
    options:{...baseOpts,scales:{...baseOpts.scales,y:{...baseOpts.scales.y,ticks:{...baseOpts.scales.y.ticks,callback:v=>v+'h'}}}}
  });
}

// ══════ ADD / DELETE LOG ══════
function addLog() {
  const date   = document.getElementById('f-date').value;
  const start  = document.getElementById('f-start').value;
  const end    = document.getElementById('f-end').value;
  const topic  = document.getElementById('f-topic').value;
  const energy = parseInt(document.getElementById('f-energy').value);
  const focus  = document.getElementById('f-focus').value;
  const diff   = document.getElementById('f-diff').value;
  const type   = document.getElementById('f-type').value;
  const output = document.getElementById('f-output').value.trim();
  const note   = document.getElementById('f-note').value.trim();

  if(!date||!topic||!focus||!energy||!type){
    alert('Please fill: Date, Topic, Focus, Energy, and Session Type'); return;
  }

  let dur = 0;
  if(start && end){
    const [sh,sm]=start.split(':').map(Number);
    const [eh,em]=end.split(':').map(Number);
    dur=(eh*60+em)-(sh*60+sm);
    if(dur<=0){alert('End time must be after start time');return;}
  } else {
    const m=prompt('No start/end time entered.\nEnter session duration in minutes:');
    dur=parseInt(m);
    if(!dur||dur<=0){alert('Please enter a valid duration in minutes');return;}
  }

  allLogs.push({id:Date.now(),date,start,end,dur,topic,energy,focus,diff,type,output,note});
  save();
  ['f-start','f-end','f-output','f-note'].forEach(id=>document.getElementById(id).value='');
  ['f-topic','f-energy','f-focus','f-diff','f-type'].forEach(id=>document.getElementById(id).value='');
  refreshAll();
}

function deleteLog(id){
  if(!confirm('Delete this session?')) return;
  allLogs=allLogs.filter(l=>l.id!==id);
  save(); refreshAll();
}

// ══════ REFRESH ══════
function refreshAll(){
  updateDashboard();
  updateLogBook();
  updateMonthly();
}

// ══════ DASHBOARD ══════
function updateDashboard(){
  const wl=weekLogs(), tl=todayLogs();
  const wd=weekDates();

  // KPI 1 — Daily
  const todayMin=tl.reduce((s,l)=>s+l.dur,0);
  const todayHrs=todayMin/60;
  document.getElementById('k-daily').textContent=todayHrs.toFixed(1)+'h';
  document.getElementById('k-daily-sub').textContent=Math.round((todayHrs/9)*100)+'% of 9h target';
  setBar('k-daily-bar',Math.min(100,(todayHrs/9)*100),todayHrs>=9?'fill-green':'fill-green');

  // KPI 2 — Deep work ratio
  const deepCount=wl.filter(l=>l.focus==='deep').length;
  const deepRatio=wl.length?Math.round((deepCount/wl.length)*100):0;
  document.getElementById('k-deep').textContent=deepRatio+'%';
  document.getElementById('k-deep-sub').textContent=deepRatio>=60?'On target — '+deepRatio+'%':''+deepRatio+'% · target 60%';
  setBar('k-deep-bar',Math.min(100,(deepRatio/60)*100),'fill-purple');

  // KPI 3 — Build ratio
  const totalMin=wl.reduce((s,l)=>s+l.dur,0);
  const buildMin=wl.filter(l=>l.type==='practice'||l.type==='project').reduce((s,l)=>s+l.dur,0);
  const buildRatio=totalMin?Math.round((buildMin/totalMin)*100):0;
  document.getElementById('k-build').textContent=buildRatio+'%';
  document.getElementById('k-build-sub').textContent=buildRatio>=35?'On target — '+buildRatio+'%':''+buildRatio+'% · target 35%';
  setBar('k-build-bar',Math.min(100,(buildRatio/35)*100),'fill-amber');

  // KPI 4 — Session efficiency
  let eff=0;
  const tlSorted=[...tl].sort((a,b)=>(a.start||'').localeCompare(b.start||''));
  if(tlSorted.length>=2&&tlSorted[0].start&&tlSorted[tlSorted.length-1].end){
    const [fh,fm]=tlSorted[0].start.split(':').map(Number);
    const [lh,lm]=tlSorted[tlSorted.length-1].end.split(':').map(Number);
    const clock=(lh*60+lm)-(fh*60+fm);
    const actual=tl.reduce((s,l)=>s+l.dur,0);
    eff=clock>0?Math.round((actual/clock)*100):0;
  } else if(tl.length===1) eff=100;
  document.getElementById('k-eff').textContent=eff+'%';
  document.getElementById('k-eff-sub').textContent=eff>=75?'On target — '+eff+'%':''+eff+'% · target 75%';
  setBar('k-eff-bar',Math.min(100,(eff/75)*100),'fill-blue');

  // KPI 5 — Weekly hours
  const weekHrs=totalMin/60;
  document.getElementById('k-weekly').textContent=weekHrs.toFixed(1)+'h';
  document.getElementById('k-weekly-sub').textContent=weekHrs>=55?'On target!':''+Math.round(55-weekHrs)+'h to reach 55h goal';
  setBar('k-weekly-bar',Math.min(100,(weekHrs/55)*100),'fill-green');

  // KPI 6 — Streak
  const streak=calcStreak();
  document.getElementById('k-streak').textContent=streak;
  document.getElementById('k-streak-sub').textContent=streak+' day'+(streak!==1?'s':'')+' with 9h logged';
  setBar('k-streak-bar',Math.min(100,streak*14),'fill-amber');

  // Charts
  const dayHrs=wd.map(date=>parseFloat((wl.filter(l=>l.date===date).reduce((s,l)=>s+l.dur,0)/60).toFixed(2)));
  charts.trend.data.datasets[0].data=dayHrs; charts.trend.update();

  const buckets=[0,0,0,0];
  wl.forEach(l=>{ if(l.dur<30)buckets[0]++; else if(l.dur<60)buckets[1]++; else if(l.dur<90)buckets[2]++; else buckets[3]++; });
  charts.dist.data.datasets[0].data=buckets; charts.dist.update();

  charts.focus.data.datasets[0].data=['deep','good','distracted'].map(q=>wl.filter(l=>l.focus===q).length);
  charts.focus.update();

  ['learning','practice','project'].forEach((type,ti)=>{
    charts.alloc.data.datasets[ti].data=wd.map(date=>parseFloat((wl.filter(l=>l.date===date&&l.type===type).reduce((s,l)=>s+l.dur,0)/60).toFixed(2)));
  });
  charts.alloc.update();

  // Topic prog
  const topicHrs={};
  allLogs.forEach(l=>{topicHrs[l.topic]=(topicHrs[l.topic]||0)+l.dur/60;});
  const box=document.getElementById('topic-prog');
  if(!Object.keys(topicHrs).length){ box.innerHTML='<p class="empty">Log sessions to see progress</p>'; return; }
  const max=Math.max(...Object.values(topicHrs));
  box.innerHTML=TOPICS.filter(t=>topicHrs[t]).map(t=>{
    const pct=Math.round((topicHrs[t]/max)*100);
    const col=CCOL[CATS[t]]||'#888';
    return `<div class="topic-row"><span class="topic-name">${t}</span><div class="tbar-bg"><div class="tbar-f" style="width:${pct}%;background:${col}"></div></div><span class="topic-hrs">${topicHrs[t].toFixed(1)}h</span></div>`;
  }).join('');
}

function setBar(id,pct,cls){
  const el=document.getElementById(id);
  if(!el) return;
  el.style.width=Math.round(pct)+'%';
  el.className='kpi-fill '+cls;
}

// ══════ LOG BOOK ══════
function updateLogBook(){
  const wl=weekLogs();
  const wd=weekDates();
  const t=today();
  const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // Week label
  const fmt=d=>new Date(d+'T12:00:00').toLocaleDateString('en',{month:'short',day:'numeric'});
  document.getElementById('week-label').textContent='Week of '+fmt(wd[0])+' – '+fmt(wd[6]);

  // Strip
  document.getElementById('week-strip').innerHTML=wd.map((date,i)=>{
    const dl=wl.filter(l=>l.date===date);
    const hrs=dl.reduce((s,l)=>s+l.dur,0)/60;
    const topics=[...new Set(dl.map(l=>l.topic.split(' ')[0]))].join(', ');
    const isToday=date===t;
    const hasData=dl.length>0;
    const dn=new Date(date+'T12:00:00').getDate();
    return`<div class="day-card${isToday?' today':hasData?' has-data':''}">
      <div class="day-num">${dn} ${DAYS[i]}</div>
      <div class="day-h">${hrs>0?hrs.toFixed(1)+'h':'—'}</div>
      <div class="day-topic">${topics||'—'}</div>
    </div>`;
  }).join('');

  // Count
  document.getElementById('week-count-lbl').textContent=wl.length+' session'+(wl.length!==1?'s':'');

  // Table
  const tbody=document.getElementById('log-tbody');
  if(!wl.length){
    tbody.innerHTML='<tr><td colspan="12" class="empty">No sessions logged this week — add one above</td></tr>';
  } else {
    const FP={deep:'pg',good:'pb',distracted:'pr'};
    const FL={deep:'Deep',good:'Good',distracted:'Distracted'};
    const DP={hard:'pr',medium:'pa',easy:'pg'};
    const TP={learning:'pp',practice:'pb',project:'pa'};
    tbody.innerHTML=[...wl].sort((a,b)=>b.date!==a.date?b.date.localeCompare(a.date):(b.start||'').localeCompare(a.start||'')).map(l=>{
      const ds=new Date(l.date+'T12:00:00').toLocaleDateString('en',{month:'short',day:'numeric'});
      const durStr=l.dur>=60?Math.floor(l.dur/60)+'h '+(l.dur%60>0?l.dur%60+'m':''):l.dur+'m';
      return`<tr>
        <td>${ds}</td>
        <td>${l.start||'—'}</td>
        <td>${l.end||'—'}</td>
        <td>${durStr.trim()}</td>
        <td style="font-weight:500">${l.topic}</td>
        <td>${l.energy}/5</td>
        <td><span class="pill ${FP[l.focus]||'pgr'}">${FL[l.focus]||l.focus}</span></td>
        <td>${l.diff?`<span class="pill ${DP[l.diff]||'pgr'}">${l.diff.charAt(0).toUpperCase()+l.diff.slice(1)}</span>`:'—'}</td>
        <td>${l.type?`<span class="pill ${TP[l.type]||'pgr'}">${l.type.charAt(0).toUpperCase()+l.type.slice(1)}</span>`:'—'}</td>
        <td style="max-width:160px;white-space:normal;font-size:11px;color:#6b6b69">${l.output||'—'}</td>
        <td style="max-width:140px;white-space:normal;font-size:11px;color:#6b6b69">${l.note||'—'}</td>
        <td><button class="del-btn" onclick="deleteLog(${l.id})">✕</button></td>
      </tr>`;
    }).join('');
  }
  document.getElementById('total-stored').textContent='Total stored: '+allLogs.length+' session'+(allLogs.length!==1?'s':'')+' across all weeks';
}

// ══════ MONTHLY ══════
function updateMonthly(){
  const ml=monthLogs();
  const now=new Date();
  document.getElementById('month-title').textContent=now.toLocaleDateString('en',{month:'long',year:'numeric'});

  const totalMin=ml.reduce((s,l)=>s+l.dur,0);
  const totalHrs=totalMin/60;
  document.getElementById('m-hrs').textContent=totalHrs.toFixed(1)+'h';
  setBar('m-hrs-bar',Math.min(100,(totalHrs/60)*100),'fill-green');

  const wkKeys=new Set(ml.map(l=>iso(weekStart(l.date))));
  const avgWk=wkKeys.size?totalHrs/wkKeys.size:0;
  document.getElementById('m-avg').textContent=avgWk.toFixed(1)+'h';
  setBar('m-avg-bar',Math.min(100,(avgWk/15)*100),'fill-purple');

  const deepPct=ml.length?Math.round((ml.filter(l=>l.focus==='deep').length/ml.length)*100):0;
  document.getElementById('m-deep').textContent=deepPct+'%';
  setBar('m-deep-bar',Math.min(100,(deepPct/70)*100),'fill-blue');

  document.getElementById('m-sess').textContent=ml.length;
  setBar('m-sess-bar',Math.min(100,(ml.length/20)*100),'fill-amber');

  // Weekly chart
  const wkHrs=[0,0,0,0];
  ml.forEach(l=>{ const d=new Date(l.date+'T12:00:00'); const wk=Math.min(3,Math.floor((d.getDate()-1)/7)); wkHrs[wk]+=l.dur/60; });
  charts.weekly.data.datasets[0].data=wkHrs.map(h=>parseFloat(h.toFixed(1)));
  charts.weekly.update();

  // Calendar
  buildCal(ml);

  // Topic table
  const topicStats={};
  allLogs.forEach(l=>{
    if(!topicStats[l.topic]) topicStats[l.topic]={hrs:0,sessions:0,totalEnergy:0};
    topicStats[l.topic].hrs+=l.dur/60;
    topicStats[l.topic].sessions++;
    topicStats[l.topic].totalEnergy+=l.energy;
  });
  const tbody=document.getElementById('topic-tbody');
  if(!Object.keys(topicStats).length){
    tbody.innerHTML='<tr><td colspan="6" class="empty">Log sessions to see topic data</td></tr>';
  } else {
    tbody.innerHTML=TOPICS.filter(t=>topicStats[t]).map(t=>{
      const s=topicStats[t];
      const avgE=(s.totalEnergy/s.sessions).toFixed(1);
      const cat=CATS[t]||'—';
      const col=CCOL[cat]||'#888';
      const status=s.hrs>=10?'<span class="pill pg">Active</span>':s.hrs>=3?'<span class="pill pb">Started</span>':'<span class="pill pgr">Early</span>';
      return`<tr>
        <td style="font-weight:500">${t}</td>
        <td><span class="pill" style="background:${col}22;color:${col}">${cat}</span></td>
        <td>${s.hrs.toFixed(1)}h</td>
        <td>${s.sessions}</td>
        <td>${avgE}/5</td>
        <td>${status}</td>
      </tr>`;
    }).join('');
  }
}

function buildCal(ml){
  const now=new Date();
  const year=now.getFullYear(), month=now.getMonth(), todayD=now.getDate();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const firstDay=(new Date(year,month,1).getDay()+6)%7;
  const studiedDays=new Set(ml.map(l=>new Date(l.date+'T12:00:00').getDate()));
  const DLBLS=['M','T','W','T','F','S','S'];
  let html=DLBLS.map(d=>`<div class="cal-lbl">${d}</div>`).join('');
  for(let i=0;i<firstDay;i++) html+=`<div class="cal-day cal-empty"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const studied=studiedDays.has(d);
    const isToday=d===todayD;
    const isFuture=d>todayD;
    let cls='cal-day ';
    if(studied) cls+='cal-studied'; else if(isFuture) cls+='cal-future'; else cls+='cal-rest';
    if(isToday) cls+=' cal-today';
    html+=`<div class="${cls}">${d}</div>`;
  }
  document.getElementById('month-cal').innerHTML=html;
}

// ══════ NAV ══════
function showPage(name, el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('show'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('show');
  el.classList.add('active');
}

// ══════ INIT ══════
window.addEventListener('load',()=>{
  const h=new Date().getHours();
  document.getElementById('greeting').textContent=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  document.getElementById('today-date').textContent=new Date().toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  document.getElementById('f-date').value=today();
  load();
  initCharts();
  refreshAll();
});