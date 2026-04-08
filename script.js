let logs = JSON.parse(localStorage.getItem("logs")) || [];

function addLog() {
  const log = {
    date: document.getElementById("date").value,
    dur: +document.getElementById("duration").value,
    topic: document.getElementById("topic").value,
    quality: document.getElementById("quality").value,
    difficulty: document.getElementById("difficulty").value,
    output: document.getElementById("output").value
  };

  if (!log.date || !log.dur || !log.topic || !log.quality || !log.difficulty || !log.output) {
    alert("Fill all fields");
    return;
  }

  logs.push(log);
  localStorage.setItem("logs", JSON.stringify(logs));

  update();
}

function learningScore() {
  const q = { deep: 1, good: 0.7, distracted: 0.4 };
  const d = { hard: 1.2, medium: 1, easy: 0.7 };

  return logs.reduce((s, l) => {
    return s + (l.dur / 60) * q[l.quality] * d[l.difficulty];
  }, 0);
}

function buildRatio() {
  const build = logs
    .filter(l => l.output === "project" || l.output === "practice")
    .reduce((s, l) => s + l.dur, 0);

  const total = logs.reduce((s, l) => s + l.dur, 0);

  return total ? (build / total) * 100 : 0;
}

function insights() {
  const rec = [];

  if (buildRatio() < 30)
    rec.push("Increase project work");

  if (learningScore() < 5)
    rec.push("Low learning quality");

  const topics = {};
  logs.forEach(l => topics[l.topic] = (topics[l.topic] || 0) + 1);

  Object.entries(topics).forEach(([t, c]) => {
    if (c < 2) rec.push(`Low exposure: ${t}`);
  });

  return rec;
}

function update() {
  document.getElementById("score").innerText = learningScore().toFixed(1);
  document.getElementById("build").innerText = buildRatio().toFixed(0) + "%";
  document.getElementById("hours").innerText =
    (logs.reduce((s, l) => s + l.dur, 0) / 60).toFixed(1);

  document.getElementById("insights").innerHTML =
    insights().map(i => "• " + i).join("<br>");
}

update();