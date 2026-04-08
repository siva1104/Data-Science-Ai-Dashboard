// --- CONSTANTS & CONFIG ---
const TOPICS = [
    { name: "Math Foundations", category: "Math", color: "var(--cat-math)", hex: "#6940c8" },
    { name: "Probability", category: "Math", color: "var(--cat-math)", hex: "#6940c8" },
    { name: "Statistics", category: "Math", color: "var(--cat-math)", hex: "#6940c8" },
    { name: "Time Series", category: "Data", color: "var(--cat-data)", hex: "#1D9E75" },
    { name: "Power BI", category: "Tools", color: "var(--cat-tools)", hex: "#EF9F27" },
    { name: "Excel", category: "Tools", color: "var(--cat-tools)", hex: "#EF9F27" },
    { name: "Python for DS", category: "Code", color: "var(--cat-code)", hex: "#378ADD" },
    { name: "SQL", category: "Code", color: "var(--cat-code)", hex: "#378ADD" },
    { name: "Machine Learning", category: "ML/AI", color: "var(--cat-mlai)", hex: "#E24B4A" },
    { name: "Deep Learning", category: "ML/AI", color: "var(--cat-mlai)", hex: "#E24B4A" },
    { name: "NLP", category: "ML/AI", color: "var(--cat-mlai)", hex: "#E24B4A" },
    { name: "Computer Vision", category: "ML/AI", color: "var(--cat-mlai)", hex: "#E24B4A" },
    { name: "Generative AI", category: "GenAI", color: "var(--cat-genai)", hex: "#D4537E" },
    { name: "AI Agents", category: "GenAI", color: "var(--cat-genai)", hex: "#D4537E" },
    { name: "RAG Systems", category: "GenAI", color: "var(--cat-genai)", hex: "#D4537E" }
];

const COLORS = { deep: "#1D9E75", good: "#378ADD", distracted: "#E24B4A" };

// --- STATE MANAGEMENT ---
let allLogs = JSON.parse(localStorage.getItem('ds_logs')) || [];

function saveLogs() { localStorage.setItem('ds_logs', JSON.stringify(allLogs)); }

// Optional dummy data
if (allLogs.length === 0) {
    const today = new Date();
    const dStr = today.toISOString().split('T')[0];
    allLogs = [
        { id: Date.now()-2000, date: dStr, start: "08:00", dur: 120, topic: "Python for DS", energy: 5, quality: "deep", note: "Initial setup" },
        { id: Date.now()-1000, date: dStr, start: "14:00", dur: 45, topic: "Statistics", energy: 3, quality: "distracted", note: "" }
    ];
    saveLogs();
}

// --- UTILS ---
const getTopicData = (name) => TOPICS.find(t => t.name === name) || TOPICS[0];

function getWeekBoundaries() {
    const d = new Date();
    const day = d.getDay() || 7;  
    d.setHours(0, 0, 0, 0);
    const monday = new Date(d);
    monday.setDate(monday.getDate() - (day - 1));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
}

function isDateInCurrentWeek(dateStr) {
    const d = new Date(dateStr);
    const { monday, sunday } = getWeekBoundaries();
    return d >= monday && d <= sunday;
}

function isDateInCurrentMonth(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

function calculateStreak() {
    if(!allLogs.length) return 0;
    const dates = [...new Set(allLogs.map(l => l.date))].sort().reverse();
    const todayStr = new Date().toISOString().split('T')[0];
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split('T')[0];
    
    if(dates[0] !== todayStr && dates[0] !== yestStr) return 0;
    
    let streak = 0;
    let curr = new Date(dates[0]);
    for(let dStr of dates) {
        if(dStr === curr.toISOString().split('T')[0]) {
            streak++;
            curr.setDate(curr.getDate() - 1);
        } else break;
    }
    return streak;
}

// --- ROUTING ---
document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden', 'active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.remove('hidden');
        document.getElementById(tab.dataset.target).classList.add('active');
    });
});

// App Init
function initApp() {
    const select = document.getElementById('input-topic');
    TOPICS.forEach(topic => { select.appendChild(new Option(topic.name, topic.name)); });
    
    const today = new Date();
    document.getElementById('today-date').textContent = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('input-date').value = today.toISOString().split('T')[0];
    document.getElementById('monthly-title').textContent = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const { monday, sunday } = getWeekBoundaries();
    const fmt = { month: 'short', day: 'numeric' };
    document.getElementById('week-subtitle').textContent = `Week of ${monday.toLocaleDateString('en-US', fmt)} - ${sunday.toLocaleDateString('en-US', fmt)}`;
    
    Chart.defaults.color = '#888780';
    Chart.defaults.font.family = 'Inter';
    refreshAll();
}

let chartInstances = [];

function refreshAll() {
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    
    updateDashboard(gridColor);
    updateLogBook();
    updateMonthly(gridColor);
}

// Add Log Form
document.getElementById('add-session-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('input-date').value;
    const start = document.getElementById('input-time').value;
    const dur = parseInt(document.getElementById('input-duration').value, 10);
    const topic = document.getElementById('input-topic').value;
    const energy = parseInt(document.getElementById('input-energy').value, 10);
    const focus = document.getElementById('input-focus').value;
    const note = document.getElementById('input-note').value;
    
    if(!date || !dur || !topic || !energy || !focus) {
        alert("Please fill: date, duration, topic, energy and focus quality"); return;
    }
    
    allLogs.unshift({ id: Date.now(), date, start, dur, topic, energy, quality: focus, note });
    allLogs.sort((a,b) => new Date(b.date) - new Date(a.date));
    saveLogs();
    document.getElementById('input-duration').value = '';
    document.getElementById('input-note').value = '';
    refreshAll();
});

window.deleteLog = function(id) {
    allLogs = allLogs.filter(l => l.id !== id);
    saveLogs();
    refreshAll();
};


// ---------------- DASHBOARD ----------------
function updateDashboard(gridColor) {
    const wLogs = allLogs.filter(l => isDateInCurrentWeek(l.date));
    const totalMins = wLogs.reduce((acc, l) => acc + l.dur, 0);
    const hours = (totalMins / 60).toFixed(1);
    
    // Cards
    document.getElementById('dash-hours-val').textContent = `${hours}h`;
    let hrPct = Math.min((hours / 15) * 100, 100);
    document.getElementById('dash-hours-bar').style.width = `${hrPct}%`;
    document.getElementById('dash-hours-sub').textContent = `${Math.round((hours/15)*100)}% of 15h goal`;
    
    const deepMs = wLogs.filter(l => l.quality === 'deep' && l.dur >= 90);
    const deepRate = wLogs.length ? Math.round((deepMs.length / wLogs.length) * 100) : 0;
    document.getElementById('dash-focus-val').textContent = `${deepRate}%`;
    document.getElementById('dash-focus-bar').style.width = `${deepRate}%`;
    document.getElementById('dash-focus-sub').textContent = `${deepMs.length} deep sessions (90m+)`;
    
    const streak = calculateStreak();
    document.getElementById('dash-streak-val').textContent = streak;
    document.getElementById('dash-streak-bar').style.width = `${Math.min(streak * 10, 100)}%`;
    document.getElementById('dash-streak-sub').textContent = `${new Set(allLogs.map(l=>l.date)).size} total days logged`;
    
    const activeTops = new Set(wLogs.map(l => l.topic)).size;
    document.getElementById('dash-topics-val').textContent = activeTops;
    document.getElementById('dash-topics-bar').style.width = `${Math.min((activeTops/4)*100, 100)}%`;
    document.getElementById('dash-topics-sub').textContent = `${activeTops} of 4 goal`;

    // Charts
    // A: Hours per day
    const wDays = [0,0,0,0,0,0,0]; // M T W T F S S
    wLogs.forEach(l => {
        let d = new Date(l.date).getDay();
        d = d === 0 ? 6 : d - 1; // M=0, S=6
        wDays[d] += l.dur / 60;
    });

    const ctxH = document.getElementById('chart-hours').getContext('2d');
    chartInstances.push(new Chart(ctxH, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: wDays, backgroundColor: '#1D9E75', borderRadius: 5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } }
        }
    }));

    // B: Topic Dist
    const topicMins = {};
    wLogs.forEach(l => { topicMins[l.topic] = (topicMins[l.topic]||0) + l.dur; });
    
    const legTop = document.getElementById('legend-topic-week');
    legTop.innerHTML = '';
    const topData=[], topCols=[], topLabels=[];
    Object.keys(topicMins).forEach(t => {
        const d = getTopicData(t);
        topLabels.push(t);
        topData.push(topicMins[t]);
        topCols.push(d.hex);
        legTop.innerHTML += `<div class="legend-item"><span class="legend-box" style="background:${d.hex}"></span>${t.split(' ')[0]}</div>`;
    });

    const ctxT = document.getElementById('chart-topic-week').getContext('2d');
    chartInstances.push(new Chart(ctxT, {
        type: 'doughnut',
        data: { labels: topLabels, datasets: [{ data: topData, backgroundColor: topCols, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { display:false } } }
    }));

    // C: Topics all time
    const allTopicMins = {};
    allLogs.forEach(l => { allTopicMins[l.topic] = (allTopicMins[l.topic]||0) + l.dur; });
    const sortedTopics = Object.keys(allTopicMins).sort((a,b) => allTopicMins[b] - allTopicMins[a]);
    const maxMins = sortedTopics.length > 0 ? allTopicMins[sortedTopics[0]] : 1;
    
    const tlContainer = document.getElementById('topic-completion-list');
    tlContainer.innerHTML = '';
    if(sortedTopics.length === 0) tlContainer.innerHTML = `<div class="empty-state">Log sessions to see progress</div>`;
    sortedTopics.forEach(t => {
        const d = getTopicData(t);
        const hrs = (allTopicMins[t]/60).toFixed(1);
        const pct = (allTopicMins[t]/maxMins)*100;
        tlContainer.innerHTML += `
            <div class="topic-row">
                <div class="topic-name">${t}</div>
                <div class="topic-bar-wrapper"><div class="topic-bar-fill" style="width:${pct}%; background:${d.hex}"></div></div>
                <div class="topic-hours">${hrs}h</div>
            </div>`;
    });

    // D: Focus Quality
    let fCount = { deep: 0, good: 0, distracted: 0 };
    wLogs.forEach(l => fCount[l.quality]++);
    document.getElementById('legend-focus-week').innerHTML = `
        <div class="legend-item"><span class="legend-box" style="background:#1D9E75"></span>Deep</div>
        <div class="legend-item"><span class="legend-box" style="background:#378ADD"></span>Good</div>
        <div class="legend-item"><span class="legend-box" style="background:#E24B4A"></span>Distracted</div>
    `;
    const ctxF = document.getElementById('chart-focus-week').getContext('2d');
    chartInstances.push(new Chart(ctxF, {
        type: 'doughnut',
        data: { labels: ['Deep', 'Good', 'Distracted'], datasets: [{ data: [fCount.deep, fCount.good, fCount.distracted], backgroundColor: ['#1D9E75', '#378ADD', '#E24B4A'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display:false } } }
    }));
}

// ---------------- LOG BOOK ----------------
function updateLogBook() {
    const wLogs = allLogs.filter(l => isDateInCurrentWeek(l.date));
    
    // Strip
    const strip = document.getElementById('week-strip');
    strip.innerHTML = '';
    const { monday } = getWeekBoundaries();
    const todayStr = new Date().toISOString().split('T')[0];
    
    for(let i=0; i<7; i++) {
        let d = new Date(monday);
        d.setDate(monday.getDate() + i);
        let dStr = d.toISOString().split('T')[0];
        let dayLogs = wLogs.filter(l => l.date === dStr);
        let hrs = dayLogs.reduce((sum, l) => sum + l.dur, 0) / 60;
        let tops = [...new Set(dayLogs.map(l => l.topic.split(' ')[0]))].join(', ');
        
        let cls = "day-box";
        if(dStr === todayStr) cls += " today";
        else if(dayLogs.length > 0) cls += " logged";
        
        strip.innerHTML += `
            <div class="${cls}">
                <div class="day-name">${d.toLocaleDateString('en-US', {weekday:'short', day:'numeric'})}</div>
                <div class="day-hours">${dayLogs.length ? (hrs%1===0 ? hrs : hrs.toFixed(1)) + 'h' : '—'}</div>
                <div class="day-topics">${tops || '—'}</div>
            </div>`;
    }

    // Table
    const tbody = document.getElementById('session-tbody');
    tbody.innerHTML = '';
    if(wLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No sessions logged this week. Enter one above!</td></tr>`;
    } else {
        wLogs.forEach(l => {
            let col = l.quality === 'deep' ? 'focus-deep' : (l.quality === 'distracted' ? 'focus-distracted' : 'focus-good');
            let qText = l.quality.charAt(0).toUpperCase() + l.quality.slice(1);
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(l.date).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</td>
                    <td>${l.start || '—'}</td>
                    <td>${l.dur} min</td>
                    <td>${l.topic}</td>
                    <td>${l.energy}/5</td>
                    <td><span class="pill pill-${col}">${qText}</span></td>
                    <td class="muted-text">${l.note || '—'}</td>
                    <td><button class="btn-delete" onclick="deleteLog(${l.id})">✕</button></td>
                </tr>`;
        });
    }
    
    document.getElementById('total-stored-text').textContent = `Total stored: ${allLogs.length} sessions across all weeks`;
}

// ---------------- MONTHLY ----------------
function updateMonthly(gridColor) {
    const mLogs = allLogs.filter(l => isDateInCurrentMonth(l.date));
    const totalMins = mLogs.reduce((acc, l) => acc + l.dur, 0);
    const hours = (totalMins / 60).toFixed(1);
    
    document.getElementById('month-hours-val').textContent = `${hours}h`;
    document.getElementById('month-hours-bar').style.width = `${Math.min((hours/60)*100, 100)}%`;
    
    const distinctWeeks = new Set(mLogs.map(l => {
        let d = new Date(l.date);
        d.setDate(d.getDate() - (d.getDay()||7) + 1);
        return d.toISOString().split('T')[0];
    })).size || 1;
    
    const avgHrs = (hours / distinctWeeks).toFixed(1);
    document.getElementById('month-avg-val').textContent = `${avgHrs}h`;
    document.getElementById('month-avg-bar').style.width = `${Math.min((avgHrs/15)*100, 100)}%`;
    
    document.getElementById('month-sessions-val').textContent = mLogs.length;
    document.getElementById('month-sessions-bar').style.width = `${Math.min((mLogs.length/20)*100, 100)}%`;
    
    const mDeep = mLogs.filter(l => l.quality==='deep').length;
    const mRate = mLogs.length ? Math.round((mDeep/mLogs.length)*100) : 0;
    document.getElementById('month-focus-val').textContent = `${mRate}%`;
    document.getElementById('month-focus-bar').style.width = `${Math.min((mRate/70)*100, 100)}%`;

    // Monthly Chart (Weekly Hours)
    const wData = [0,0,0,0];
    mLogs.forEach(l => {
        let day = new Date(l.date).getDate();
        let weekNo = (day <= 7) ? 0 : (day <= 14 ? 1 : (day <= 21 ? 2 : 3));
        wData[weekNo] += l.dur / 60;
    });

    const ctxHW = document.getElementById('chart-hours-monthly').getContext('2d');
    chartInstances.push(new Chart(ctxHW, {
        type: 'bar',
        data: { labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'], datasets: [{ data: wData, backgroundColor: '#6940c8', borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor } } } }
    }));

    // Calendar
    const cal = document.getElementById('calendar-grid');
    cal.innerHTML = '';
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0);
    
    let fDow = firstDay.getDay() || 7;
    for(let i=1; i<fDow; i++) cal.innerHTML += `<div></div>`; // pad
    
    const studiedDates = new Set(mLogs.map(l=>l.date));
    const todayStr = now.toISOString().split('T')[0];
    
    for(let d=1; d<=lastDay.getDate(); d++) {
        let dObj = new Date(now.getFullYear(), now.getMonth(), d);
        let dStr = dObj.toISOString().split('T')[0];
        
        let cls = "cal-day";
        if(studiedDates.has(dStr)) cls += " studied";
        else if(dObj < now && dStr !== todayStr) cls += " rest";
        else if(dObj > now) cls += " future";
        
        if(dStr === todayStr) cls += " today-border";
        
        cal.innerHTML += `<div class="${cls}">${d}</div>`;
    }

    // Topic Progress Table
    const tBody = document.getElementById('topic-progress-tbody');
    tBody.innerHTML = '';
    
    const aMins = {}; const aCount = {}; const aEnergy = {};
    allLogs.forEach(l => {
        aMins[l.topic] = (aMins[l.topic]||0) + l.dur;
        aCount[l.topic] = (aCount[l.topic]||0) + 1;
        aEnergy[l.topic] = (aEnergy[l.topic]||0) + l.energy;
    });
    
    const activeTopNames = Object.keys(aMins);
    if(activeTopNames.length === 0) {
        tBody.innerHTML = `<tr><td colspan="7" class="empty-state">Log sessions to see topic data</td></tr>`;
    } else {
        const maxM = Math.max(...Object.values(aMins));
        
        TOPICS.forEach(topic => {
            if(aMins[topic.name]) {
                const h = (aMins[topic.name]/60).toFixed(1);
                const sCount = aCount[topic.name];
                const ae = (aEnergy[topic.name]/sCount).toFixed(1);
                const pct = (aMins[topic.name]/maxM)*100;
                
                let pCls = "pill-status-early", pTxt = "Early";
                if(h >= 5) { pCls = "pill-status-active"; pTxt = "Active"; }
                else if(h >= 1) { pCls = "pill-status-started"; pTxt = "Started"; }
                
                tBody.innerHTML += `
                    <tr>
                        <td><strong>${topic.name}</strong></td>
                        <td><span class="pill" style="background:${topic.color}; color:white">${topic.category}</span></td>
                        <td>${h}h</td>
                        <td>${sCount} sessions</td>
                        <td style="width:150px">
                            <div style="display:flex; align-items:center; gap:8px">
                                <div class="kpi-progress-track" style="flex:1"><div class="kpi-progress-fill" style="width:${pct}%; background:${topic.color}"></div></div>
                                <span style="font-size:10px">${Math.round(pct)}%</span>
                            </div>
                        </td>
                        <td>${ae}/5</td>
                        <td><span class="pill ${pCls}">${pTxt}</span></td>
                    </tr>`;
            }
        });
    }

    // Stats
    const dowCounts = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
    mLogs.forEach(l => { let d = new Date(l.date).getDay(); dowCounts[d]++; });
    const maxDowCount = Math.max(...Object.values(dowCounts));
    const maxDow = Object.keys(dowCounts).find(k => dowCounts[k]===maxDowCount);
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    document.getElementById('stat-best-day').textContent = maxDowCount > 0 ? dayNames[maxDow] : '—';
    document.getElementById('stat-best-day-sub').textContent = maxDowCount > 0 ? `${maxDowCount} sessions on ${dayNames[maxDow]}s` : '0 sessions';
    
    const longest = mLogs.length ? Math.max(...mLogs.map(l=>l.dur)) : 0;
    document.getElementById('stat-longest-sess').textContent = `${longest} min`;
    document.getElementById('stat-longest-sess-sub').textContent = longest > 120 ? "Excellent deep work block" : (longest > 0 ? "Keep pushing for 120+ min blocks" : "—");
    
    const touchedTopics = new Set(mLogs.map(l=>l.topic)).size;
    document.getElementById('stat-topics-touched').textContent = touchedTopics;
}

document.addEventListener('DOMContentLoaded', initApp);
