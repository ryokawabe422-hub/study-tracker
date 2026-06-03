const CONFIG = {
  startDate: "2026-06-09",
  endDate: "2026-07-31",
  initialHours: 100,
  goalHours: 300,
  weekdayTarget: 3,
  weekendTarget: 7,
  weekdaySoftMax: 3,
  weekendSoftMax: 8,
};

const subjects = [
  "企業経営理論",
  "財務・会計",
  "運営管理",
  "経済学",
  "経営法務",
  "経営情報",
  "中小企業政策",
];

const colors = ["#2f6fbd", "#167a55", "#147a86", "#9f5f22", "#7c5ab8", "#c2413b", "#4f6677"];
const storageKey = "diagnosis-study-tracker-v1";

const els = {
  form: document.querySelector("#studyForm"),
  date: document.querySelector("#dateInput"),
  hours: document.querySelector("#hoursInput"),
  subject: document.querySelector("#subjectInput"),
  material: document.querySelector("#materialInput"),
  questions: document.querySelector("#questionsInput"),
  correct: document.querySelector("#correctInput"),
  content: document.querySelector("#contentInput"),
  confidence: document.querySelector("#confidenceInput"),
  memo: document.querySelector("#memoInput"),
  todayTotal: document.querySelector("#todayTotal"),
  todayStatus: document.querySelector("#todayStatus"),
  totalHours: document.querySelector("#totalHours"),
  gapHours: document.querySelector("#gapHours"),
  gapCaption: document.querySelector("#gapCaption"),
  remainingHours: document.querySelector("#remainingHours"),
  dailyAverage: document.querySelector("#dailyAverage"),
  loggedSessions: document.querySelector("#loggedSessions"),
  todayTarget: document.querySelector("#todayTarget"),
  todayKind: document.querySelector("#todayKind"),
  progressFill: document.querySelector("#progressFill"),
  progressText: document.querySelector("#progressText"),
  weekdayAllocation: document.querySelector("#weekdayAllocation"),
  weekendAllocation: document.querySelector("#weekendAllocation"),
  weekdayCount: document.querySelector("#weekdayCount"),
  weekendCount: document.querySelector("#weekendCount"),
  strategyList: document.querySelector("#strategyList"),
  subjectBars: document.querySelector("#subjectBars"),
  materialBars: document.querySelector("#materialBars"),
  subjectQuestionStats: document.querySelector("#subjectQuestionStats"),
  logList: document.querySelector("#logList"),
  dailyList: document.querySelector("#dailyList"),
  dayDetail: document.querySelector("#dayDetail"),
  clearButton: document.querySelector("#clearButton"),
  seedButton: document.querySelector("#seedButton"),
};

let logs = loadLogs();
let selectedDate = CONFIG.startDate;

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? [];
  } catch {
    return [];
  }
}

function saveLogs() {
  localStorage.setItem(storageKey, JSON.stringify(logs));
}

function toDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatHours(value) {
  return `${value.toFixed(1)}h`;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(start, end) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((toDate(end) - toDate(start)) / ms) + 1);
}

function isWeekend(dateString) {
  const day = toDate(dateString).getDay();
  return day === 0 || day === 6;
}

function plannedAdditionalThrough(dateString) {
  const start = toDate(CONFIG.startDate);
  const current = toDate(dateString);
  if (current < start) return 0;
  const end = current > toDate(CONFIG.endDate) ? toDate(CONFIG.endDate) : current;
  let total = 0;
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    total += isWeekend(dateKey(date)) ? CONFIG.weekendTarget : CONFIG.weekdayTarget;
  }
  return total;
}

function countDaysByKind(startString, endString) {
  const counts = { weekdays: 0, weekends: 0 };
  const start = toDate(startString);
  const end = toDate(endString);
  if (start > end) return counts;

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    if (isWeekend(dateKey(date))) {
      counts.weekends += 1;
    } else {
      counts.weekdays += 1;
    }
  }
  return counts;
}

function targetForDate(dateString) {
  return isWeekend(dateString) ? CONFIG.weekendTarget : CONFIG.weekdayTarget;
}

function init() {
  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.textContent = subject;
    els.subject.appendChild(option);
  });

  const today = new Date();
  const todayString = dateKey(today);
  els.date.value = todayString < CONFIG.startDate ? CONFIG.startDate : todayString;

  els.form.addEventListener("submit", addLog);
  els.clearButton.addEventListener("click", clearLogs);
  els.seedButton.addEventListener("click", seedLogs);
  render();
}

function addLog(event) {
  event.preventDefault();
  logs.unshift({
    id: crypto.randomUUID(),
    date: els.date.value,
    hours: Number(els.hours.value),
    questions: Number(els.questions.value) || 0,
    correct: Math.min(Number(els.correct.value) || 0, Number(els.questions.value) || 0),
    subject: els.subject.value,
    material: els.material.value,
    content: els.content.value.trim(),
    confidence: els.confidence.value,
    memo: els.memo.value.trim(),
  });
  saveLogs();
  els.content.value = "";
  els.memo.value = "";
  els.questions.value = "0";
  els.correct.value = "0";
  render();
}

function clearLogs() {
  if (!logs.length) return;
  const ok = confirm("学習ログをすべて削除しますか？");
  if (!ok) return;
  logs = [];
  saveLogs();
  render();
}

function seedLogs() {
  const examples = [
    ["2026-06-09", 2.5, "企業経営理論", "スピ問", "組織論・マーケ基礎", "ok", 35, 24],
    ["2026-06-10", 3, "財務・会計", "過去問", "CVP・NPV", "weak", 28, 15],
    ["2026-06-11", 2, "運営管理", "スピ問", "生産管理 1周目", "good", 40, 31],
    ["2026-06-13", 5, "経済学", "過去問", "ミクロ頻出論点", "ok", 52, 35],
  ];
  logs = examples.map(([date, hours, subject, material, content, confidence, questions, correct]) => ({
    id: crypto.randomUUID(),
    date,
    hours,
    questions,
    correct,
    subject,
    material,
    content,
    confidence,
    memo: "",
  }));
  saveLogs();
  render();
}

function render() {
  const loggedHours = logs.reduce((sum, log) => sum + log.hours, 0);
  const total = CONFIG.initialHours + loggedHours;
  const today = dateKey(new Date());
  const todayLogged = totalForDate(today);
  const plannedTotal = CONFIG.initialHours + plannedAdditionalThrough(today);
  const scheduleGap = total - plannedTotal;
  const goalGap = total - CONFIG.goalHours;
  const remaining = Math.max(0, CONFIG.goalHours - total);
  const remainingStart = today > CONFIG.startDate ? today : CONFIG.startDate;
  const remainingDays = daysBetween(remainingStart, CONFIG.endDate);
  const remainingKinds = countDaysByKind(remainingStart, CONFIG.endDate);
  const dailyAverage = remainingDays ? remaining / remainingDays : 0;
  const allocation = calculateAllocation(remaining, remainingKinds);
  const todayTarget = targetForDate(today);
  const beforeStart = today < CONFIG.startDate;

  els.todayTotal.textContent = formatHours(todayLogged);
  els.todayStatus.textContent = beforeStart
    ? "開始前"
    : todayLogged >= todayTarget
      ? "達成"
      : `${formatHours(todayTarget - todayLogged)} 残り`;
  els.totalHours.textContent = formatHours(total);
  els.loggedSessions.textContent = `${logs.length}件の記録 / 追加 ${formatHours(loggedHours)}`;
  els.gapHours.textContent = `${goalGap >= 0 ? "+" : ""}${formatHours(goalGap)}`;
  els.gapHours.style.color = goalGap >= 0 ? "var(--green)" : "var(--red)";
  els.gapCaption.textContent = goalGap >= 0 ? "目標達成" : "追い上げ対象";
  els.remainingHours.textContent = formatHours(remaining);
  els.dailyAverage.textContent = formatHours(dailyAverage);
  els.todayTarget.textContent = beforeStart ? formatHours(CONFIG.weekdayTarget) : formatHours(todayTarget);
  els.todayKind.textContent = beforeStart ? "6/9初日の目安" : isWeekend(today) ? "休日ペース" : "平日ペース";

  const percent = Math.min(100, (total / CONFIG.goalHours) * 100);
  els.progressFill.style.width = `${percent}%`;
  els.progressText.textContent = `300時間に対して ${percent.toFixed(1)}% 進捗。残り${remainingDays}日、平均${formatHours(dailyAverage)}で到達。`;
  els.weekdayAllocation.textContent = formatHours(allocation.weekday);
  els.weekendAllocation.textContent = formatHours(allocation.weekend);
  els.weekdayCount.textContent = `平日 ${remainingKinds.weekdays}日 / ${allocation.note}`;
  els.weekendCount.textContent = `休日 ${remainingKinds.weekends}日 / ${allocation.note}`;

  renderStrategy(goalGap, scheduleGap, dailyAverage, loggedHours, beforeStart, allocation);
  renderBars(els.subjectBars, groupBy("subject"), subjects);
  renderBars(els.materialBars, groupBy("material"), ["スピ問", "過去問", "テキスト", "模試・答練", "復習ノート"]);
  renderSubjectQuestionStats();
  renderLogs();
  renderDailyList();
  renderDayDetail(selectedDate);
}

function calculateAllocation(remaining, counts) {
  const baseWeekday = CONFIG.weekdaySoftMax;
  const baseWeekend = CONFIG.weekendSoftMax;
  const baseCapacity = counts.weekdays * baseWeekday + counts.weekends * baseWeekend;
  if (remaining <= 0 || (!counts.weekdays && !counts.weekends)) {
    return { weekday: 0, weekend: 0, note: "達成済み" };
  }
  if (remaining <= baseCapacity) {
    const ratio = remaining / baseCapacity;
    return {
      weekday: baseWeekday * ratio,
      weekend: baseWeekend * ratio,
      note: "上限内",
    };
  }

  let weekday = baseWeekday;
  let weekend = baseWeekend;
  let capacity = baseCapacity;
  let turn = "weekday";
  while (capacity < remaining) {
    if (turn === "weekday" && counts.weekdays) {
      weekday += 0.5;
      capacity += counts.weekdays * 0.5;
    } else if (turn === "weekend" && counts.weekends) {
      weekend += 1;
      capacity += counts.weekends;
    }
    turn = turn === "weekday" ? "weekend" : "weekday";
    if ((!counts.weekdays && turn === "weekday") || (!counts.weekends && turn === "weekend")) {
      turn = counts.weekdays ? "weekday" : "weekend";
    }
  }

  return {
    weekday,
    weekend,
    note: "上限超え",
  };
}

function renderStrategy(goalGap, scheduleGap, dailyAverage, loggedHours, beforeStart, allocation) {
  const weakSubjects = subjects
    .map((subject) => ({ subject, hours: logs.filter((log) => log.subject === subject).reduce((sum, log) => sum + log.hours, 0) }))
    .sort((a, b) => a.hours - b.hours)
    .slice(0, 2)
    .map((item) => item.subject)
    .join("・");

  const materialCounts = groupBy("material");
  const speedQuestion = materialCounts["スピ問"] || 0;
  const pastQuestion = materialCounts["過去問"] || 0;
  const nextMaterial = speedQuestion <= pastQuestion ? "スピ問" : "過去問";

  const items = [
    beforeStart
      ? `開始は2026/06/09。初日は${formatHours(CONFIG.weekdayTarget)}、まず記録の型を作る。`
      : scheduleGap < 0
        ? `予定差は${formatHours(Math.abs(scheduleGap))}。今日の最低ラインは${formatHours(isWeekend(dateKey(new Date())) ? CONFIG.weekendTarget : CONFIG.weekdayTarget)}、余力があれば+30分。`
        : `日次計画には乗っている。今日は量を守りつつ、要復習ログを1つ潰す。`,
    loggedHours === 0
      ? "まずは1件記録。内容は細かすぎなくてOK、科目・教材・論点が残れば十分。"
      : `次は${nextMaterial}を優先して、時間記録を問題演習の回転に寄せる。`,
    weakSubjects ? `薄い科目は ${weakSubjects}。短時間でも触って忘却を止める。` : "全科目未着手。初週は7科目を一度なめて偏りを見える化。",
    goalGap < 0 && dailyAverage > CONFIG.weekdayTarget ? `300hまで${formatHours(Math.abs(goalGap))}。平日3h・休日8hまでは上限扱い、足りなければ平日+0.5h/休日+1hで交互に積む。` : "平日3hペースで射程内。休日は復習と過去問のまとまった時間に使える。",
  ];

  els.strategyList.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function totalForDate(dateString) {
  return logs
    .filter((log) => log.date === dateString)
    .reduce((sum, log) => sum + log.hours, 0);
}

function groupBy(key) {
  return logs.reduce((groups, log) => {
    groups[log[key]] = (groups[log[key]] || 0) + log.hours;
    return groups;
  }, {});
}

function renderBars(container, values, order) {
  const max = Math.max(1, ...Object.values(values));
  container.innerHTML = order
    .map((label, index) => {
      const hours = values[label] || 0;
      const width = Math.max(4, (hours / max) * 100);
      return `
        <div class="bar-row">
          <span class="bar-label">${escapeHtml(label)}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${width}%; background:${colors[index % colors.length]}"></span></span>
          <span class="bar-hours">${formatHours(hours)}</span>
        </div>
      `;
    })
    .join("");
}

function renderLogs() {
  if (!logs.length) {
    els.logList.innerHTML = `<div class="empty">まだ記録がありません。今日の1コマから入れていきましょう。</div>`;
    return;
  }

  els.logList.innerHTML = logs
    .slice(0, 12)
    .map(
      (log) => `
        <article class="log-item">
          <time>${escapeHtml(log.date)}</time>
          <div>
            <div class="log-title">
              ${escapeHtml(log.subject)}
              <span class="tag">${escapeHtml(log.material)}</span>
              <span class="tag ${log.confidence}">${confidenceLabel(log.confidence)}</span>
              ${Number(log.questions) ? `<span class="tag">${Number(log.correct) || 0}/${Number(log.questions)}問</span>` : ""}
            </div>
            <div class="log-meta">${escapeHtml(log.content)}${log.memo ? ` / ${escapeHtml(log.memo)}` : ""}</div>
          </div>
          <strong class="log-hours">${formatHours(log.hours)}</strong>
          <button class="delete-button" type="button" aria-label="削除" onclick="deleteLog('${log.id}')">×</button>
        </article>
      `
    )
    .join("");
}

function renderDailyList() {
  els.dailyList.innerHTML = renderCalendarMonth("2026-06") + renderCalendarMonth("2026-07");
}

function renderCalendarMonth(monthString) {
  const [year, month] = monthString.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const offset = first.getDay();
  const cells = [];
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  for (let i = 0; i < offset; i += 1) {
    cells.push(`<div class="calendar-cell muted-cell"></div>`);
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = dateKey(new Date(year, month - 1, day));
    const inRange = date >= CONFIG.startDate && date <= CONFIG.endDate;
    const logsForDate = logs.filter((log) => log.date === date);
    const hours = logsForDate.reduce((sum, log) => sum + log.hours, 0);
    const questions = logsForDate.reduce((sum, log) => sum + (Number(log.questions) || 0), 0);
    const correct = logsForDate.reduce((sum, log) => sum + (Number(log.correct) || 0), 0);
    const target = targetForDate(date);
    const rate = questions ? Math.round((correct / questions) * 100) : null;
    const status = !inRange ? "outside" : hours >= target ? "done" : hours > 0 ? "short" : "blank";
    cells.push(`
      <button class="calendar-cell ${status} ${selectedDate === date ? "selected" : ""} ${isWeekend(date) ? "weekend-cell" : ""}" type="button" onclick="selectDate('${date}')" aria-label="${date}の学習内容を見る">
        <div class="calendar-date">
          <strong>${day}</strong>
          <span>${inRange ? (isWeekend(date) ? "休日" : "平日") : "期間外"}</span>
        </div>
        <div class="calendar-hours">${inRange || hours ? formatHours(hours) : ""}</div>
        <div class="calendar-meta">${questions ? `${correct}/${questions}問 ${rate}%` : inRange ? "未記録" : ""}</div>
      </button>
    `);
  }

  return `
    <section class="calendar-month">
      <h3>${year}/${String(month).padStart(2, "0")}</h3>
      <div class="calendar-weekdays">${dayNames.map((name) => `<span>${name}</span>`).join("")}</div>
      <div class="calendar-days">${cells.join("")}</div>
    </section>
  `;
}

function selectDate(dateString) {
  selectedDate = dateString;
  renderDailyList();
  renderDayDetail(dateString);
  els.dayDetail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderDayDetail(dateString) {
  const dayLogs = logs.filter((log) => log.date === dateString);
  const hours = dayLogs.reduce((sum, log) => sum + log.hours, 0);
  const questions = dayLogs.reduce((sum, log) => sum + (Number(log.questions) || 0), 0);
  const correct = dayLogs.reduce((sum, log) => sum + (Number(log.correct) || 0), 0);
  const rate = questions ? Math.round((correct / questions) * 100) : 0;
  const target = targetForDate(dateString);
  const diff = hours - target;

  els.dayDetail.innerHTML = `
    <div class="section-heading day-detail-heading">
      <div>
        <h3>${escapeHtml(dateString)} の内容</h3>
        <span>${isWeekend(dateString) ? "休日" : "平日"} / 目標 ${formatHours(target)} / ${diff >= 0 ? "+" : ""}${formatHours(diff)}</span>
      </div>
      <button class="ghost-button" type="button" onclick="setLogDate('${dateString}')">この日に記録</button>
    </div>
    <div class="day-summary">
      <div><span>時間</span><strong>${formatHours(hours)}</strong></div>
      <div><span>問題</span><strong>${questions}問</strong></div>
      <div><span>正答</span><strong>${correct}問</strong></div>
      <div><span>正答率</span><strong>${rate}%</strong></div>
    </div>
    ${
      dayLogs.length
        ? `<div class="day-log-list">${dayLogs.map(renderDayLogItem).join("")}</div>`
        : `<div class="empty">この日のログはまだありません。</div>`
    }
  `;
}

function renderDayLogItem(log) {
  const questions = Number(log.questions) || 0;
  const correct = Number(log.correct) || 0;
  const rate = questions ? Math.round((correct / questions) * 100) : 0;
  return `
    <article class="day-log-item">
      <div>
        <div class="log-title">
          ${escapeHtml(log.subject)}
          <span class="tag">${escapeHtml(log.material)}</span>
          <span class="tag ${log.confidence}">${confidenceLabel(log.confidence)}</span>
        </div>
        <div class="log-meta">${escapeHtml(log.content)}${log.memo ? ` / ${escapeHtml(log.memo)}` : ""}</div>
      </div>
      <div class="day-log-numbers">
        <strong>${formatHours(log.hours)}</strong>
        <span>${questions ? `${correct}/${questions}問 ${rate}%` : "問題数なし"}</span>
      </div>
      <button class="delete-button" type="button" aria-label="削除" onclick="deleteLog('${log.id}')">×</button>
    </article>
  `;
}

function setLogDate(dateString) {
  els.date.value = dateString;
  els.content.focus();
}

function groupLogsByDate() {
  const groups = logs.reduce((items, log) => {
    if (!items[log.date]) items[log.date] = [];
    items[log.date].push(log);
    return items;
  }, {});

  return Object.entries(groups)
    .map(([date, items]) => ({
      date,
      logs: items,
      hours: items.reduce((sum, log) => sum + log.hours, 0),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderSubjectQuestionStats() {
  const stats = subjects.map((subject) => {
    const subjectLogs = logs.filter((log) => log.subject === subject);
    const hours = subjectLogs.reduce((sum, log) => sum + log.hours, 0);
    const questions = subjectLogs.reduce((sum, log) => sum + (Number(log.questions) || 0), 0);
    const correct = subjectLogs.reduce((sum, log) => sum + (Number(log.correct) || 0), 0);
    const weak = subjectLogs.filter((log) => log.confidence === "weak").length;
    return { subject, hours, questions, correct, weak };
  });
  const maxQuestions = Math.max(1, ...stats.map((item) => item.questions));

  els.subjectQuestionStats.innerHTML = stats
    .map((item, index) => {
      const rate = item.questions ? Math.round((item.correct / item.questions) * 100) : 0;
      const width = Math.max(4, (item.questions / maxQuestions) * 100);
      return `
        <article class="question-row">
          <div class="question-title">
            <strong>${escapeHtml(item.subject)}</strong>
            <span>${formatHours(item.hours)} / 要復習 ${item.weak}件</span>
          </div>
          <div class="question-bar">
            <span style="width:${width}%; background:${colors[index % colors.length]}"></span>
          </div>
          <div class="question-numbers">
            <strong>${item.questions}問</strong>
            <span>${item.correct}問正解 / ${rate}%</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function summarizeValues(items, key) {
  const values = items.reduce((result, item) => {
    result[item[key]] = (result[item[key]] || 0) + item.hours;
    return result;
  }, {});
  return Object.entries(values)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label, hours]) => `${label} ${formatHours(hours)}`)
    .join(" / ");
}

function deleteLog(id) {
  logs = logs.filter((log) => log.id !== id);
  saveLogs();
  render();
}

function confidenceLabel(value) {
  return { good: "できた", ok: "普通", weak: "要復習" }[value] || "普通";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
