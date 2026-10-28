// UI for the AMC practice app: hash routing, views and event handling.
// Logic lives in the other modules; this file wires it to the page.
import { CONTESTS, CHOICES, getContest, parseAnswerKey, scoreAttempt, skipScenarios } from './scoring.js';
import { switchQuestion, closeVisit, timePerQuestion, slowQuestions, timelineSegments, formatClock, SLOW_SECONDS } from './pacing.js';
import { TOPICS, topicName, newEntry, recordRetry, dueEntries, RETRY_DAYS } from './retry.js';
import { loadState, saveState, exportJSON, importJSON, makeId, defaultState } from './storage.js';
import { PROBLEMS, problemsByTopic, problemsBySet, getProblem } from './problems.js';
import { answersMatch } from './answers.js';
import { LESSONS, getLesson, scaleSkeletonSVG, applyStep } from './lessons.js';
import { scoreSeries, topicAccuracy, missedByTopic, avgMockSeconds, avgDrillSeconds } from './stats.js';
import { esc, scoreLineChart, hBarChart, pacingChart, timelineChart, setChartWidth } from './charts.js';
import { icon } from './icons.js';
import { loadPrefs, savePrefs, applyTheme, THEMES } from './prefs.js';
import { practiceStreak, nextContest, pickNextActivity } from './home.js';

const main = document.getElementById('main');
const live = document.getElementById('live');
let state = loadState(window.localStorage);
let timerHandle = null;
let ui = {}; // per-view transient state (not saved)
let prefs = loadPrefs(window.localStorage);
applyTheme(document.documentElement, prefs.theme);
document.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon); });

function save() {
  if (!saveState(window.localStorage, state)) {
    toast('Hmm, your browser didn’t let us save. Try exporting a backup from Settings.');
  }
}

function toast(msg) {
  live.textContent = '';
  live.textContent = msg;
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => { t.hidden = true; }, 3500);
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const CHEERS = ['Nice work!', 'You got it!', 'Brilliant!', 'Yes — exactly right!', 'Great thinking!'];
const NOT_YET = ['Not quite yet — give it another go.', 'Close! Take another look.', 'Not yet. Mistakes are how brains grow!'];
const fmtDate = (ms) => new Date(ms).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const pct = (x) => `${Math.round(x * 100)}%`;
const keyById = (id) => state.keys.find((k) => k.id === id);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// ---------------- routing ----------------
function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
  return { name: parts[0], arg: parts[1] ?? null };
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

const VIEWS = {
  home: viewHome,
  mock: viewMockSetup,
  exam: viewExam,
  results: viewResults,
  drills: viewDrills,
  lessons: viewLessons,
  errors: viewErrors,
  progress: viewProgress,
  settings: viewSettings,
};

function render() {
  clearInterval(timerHandle);
  timerHandle = null;
  const r = route();
  // An unfinished contest always takes you back to it.
  if (state.inProgress && r.name !== 'exam' && r.name !== 'settings') {
    if (r.name === 'mock') return go('#/exam');
  }
  const view = VIEWS[r.name] ?? viewHome;
  const section = { exam: 'mock', results: 'mock' }[r.name] ?? (VIEWS[r.name] ? r.name : 'home');
  document.querySelectorAll('[data-route]').forEach((a) => {
    if (a.dataset.route === section) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.body.classList.toggle('exam-mode', r.name === 'exam' && !!state.inProgress);
  const sameView = ui.lastRoute === location.hash;
  const refocus = sameView ? focusSelector(document.activeElement) : null;
  ui.lastRoute = location.hash;
  ui.chartWidth = setChartWidth(chartContentWidth());
  main.innerHTML = view(r.arg);
  view.mount?.(r.arg);
  const target = refocus && main.querySelector(refocus);
  if (target) target.focus({ preventScroll: true });
  else if (!ui.keepFocus) main.focus({ preventScroll: true });
  ui.keepFocus = false;
  if (!sameView) window.scrollTo(0, 0);
}

/** Width available inside a card on the current screen. */
function chartContentWidth() {
  const cs = getComputedStyle(main);
  const inner = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  return inner - (window.innerWidth <= 760 ? 34 : 50);
}

/** A selector that finds "the same" control after a re-render, so keyboard focus isn't lost. */
function focusSelector(el) {
  if (!el || !main.contains(el) || !el.dataset?.action) return null;
  if (el.dataset.nav) return `[data-nav="${CSS.escape(el.dataset.nav)}"]`;
  const attrs = ['action', 'choice', 'q', 'd', 'id'].filter((k) => el.dataset[k] !== undefined);
  return attrs.map((k) => `[data-${k}="${CSS.escape(el.dataset[k])}"]`).join('');
}

// ---------------- home ----------------
function viewHome() {
  const now = Date.now();
  const due = dueEntries(state.errorLog, now).length;
  const streak = practiceStreak(state, now);
  const next = nextContest(prefs.contestDates, now);
  const finished = state.attempts.filter((a) => a.result).sort((a, b) => b.finishedAt - a.finishedAt);
  const last = finished[0];
  const solved = new Set(state.drills.filter((d) => d.correct).map((d) => d.problemId));
  const drillPoolAll = PROBLEMS.filter((p) => p.set === 'drill');
  const lessonsDone = LESSONS.filter((l) => state.lessons[l.id]?.done).length;
  const avg = avgMockSeconds(finished);

  const countdown = next
    ? `<span class="today-num">${next.days === 0 ? 'Today!' : next.days}</span>
       <span class="today-label">${next.days === 0 ? `${esc(next.name)} is today — you’ve got this` : `day${next.days === 1 ? '' : 's'} until the ${esc(next.name)}`}</span>`
    : `<span class="today-num">—</span><span class="today-label"><a href="#/settings">Set contest dates</a></span>`;
  const streakText = streak.days
    ? `<span class="today-num">${streak.days}</span><span class="today-label">day streak${streak.practicedToday ? '' : ' — practice today to keep it going'}</span>`
    : '<span class="today-num">0</span><span class="today-label">day streak — today is a great day to start</span>';

  let cta;
  if (state.inProgress) {
    cta = `<a class="btn primary xl" href="#/exam">${icon('play')} Jump back into your contest</a>
      <p class="cta-reason">${esc(state.inProgress.label)} — the clock is still running.</p>`;
  } else {
    const nextUp = pickNextActivity(state, now);
    cta = `<a class="btn primary xl" href="${nextUp.href}">Start today’s practice ${icon('arrow')}</a>
      <p class="cta-reason">${esc(nextUp.reason)}.</p>`;
  }

  const card = (href, ic, title, desc, stat) => `<a class="card link tool" href="${href}">
      <span class="tool-icon">${icon(ic)}</span>
      <span class="tool-title">${title}</span>
      <span class="tool-desc">${desc}</span>
      <span class="tool-stat">${stat}</span>
    </a>`;

  const tips = [
    'On the AMC 10, a blank is worth 1.5 points. Guess only when you can rule out at least two choices.',
    'On the AMC 8 there’s no penalty for guessing, so never leave a bubble empty.',
    'Stuck for more than 4 minutes? Flag it, move on, and come back later. Fresh eyes help!',
    'Read the last sentence of a problem twice — make sure you answer what it actually asks.',
    'Drawing a picture is never a waste of time, especially in geometry.',
  ];
  return `<section class="stack">
    <h1 class="page-title">Ready to practice?</h1>
    <div class="today card">
      <div class="today-stats">
        <div class="today-stat"><span class="today-icon">${icon('calendar')}</span><div>${countdown}</div></div>
        <div class="today-stat"><span class="today-icon">${icon('flame')}</span><div>${streakText}</div></div>
      </div>
      <div class="today-cta">${cta}</div>
    </div>
    <h2 class="section-title">Study tools</h2>
    <div class="grid cards">
      ${card('#/mock', 'mock', 'Mock contest', 'Full AMC 10 or AMC 8 with a real timer.', last ? `Last mock: ${last.result.score} / ${last.result.max}` : 'No mocks yet')}
      ${card('#/errors', 'errors', 'Retry queue', 'Missed questions come back to try again.', due ? `${plural(due, 'item')} due for retry` : 'All caught up')}
      ${card('#/drills', 'drills', 'Practice drills', 'Short problems by topic, with solutions.', `${solved.size} of ${drillPoolAll.length} solved`)}
      ${card('#/lessons', 'lessons', 'Mini-lessons', 'Two equations, two unknowns on a balance scale.', `${lessonsDone} of ${LESSONS.length} finished`)}
      ${card('#/progress', 'progress', 'Progress', 'Scores, accuracy and pacing over time.', avg === null ? 'Take a mock to see pacing' : `Avg ${formatClock(avg)} per question`)}
    </div>
    <p class="tip"><strong>Tip:</strong> ${esc(pick(tips))}</p>
  </section>`;
}

// ---------------- mock contest: setup ----------------
function viewMockSetup() {
  const contest = ui.setupContest ?? 'AMC10';
  const keys = state.keys.filter((k) => k.contest === contest);
  const c = getContest(contest);
  const rules = contest === 'AMC10'
    ? '25 questions · 75 minutes · 6 points correct, 1.5 points blank, 0 points wrong'
    : '25 questions · 40 minutes · 1 point per correct answer, no penalty for guessing';
  const keyPicker = keys.length
    ? `<label for="keySel">Which practice set?</label>
       <select id="keySel">${keys.map((k) => `<option value="${esc(k.id)}">${esc(k.label)}</option>`).join('')}</select>`
    : `<div class="card soft"><p>No ${c.name} answer keys saved yet. Ask a parent to add one in <a href="#/settings">Settings</a> — it takes a minute.</p></div>`;
  return `<section class="stack narrow">
    <h1>Mock contest</h1>
    <fieldset class="segmented" role="radiogroup" aria-label="Contest">
      ${Object.values(CONTESTS).map((x) => `<button type="button" class="seg-btn" role="radio" aria-checked="${x.id === contest}" data-action="setup-contest" data-id="${x.id}">${x.name}</button>`).join('')}
    </fieldset>
    <p class="rules">${rules}</p>
    ${keyPicker}
    <div class="card soft">
      <h2>How it works</h2>
      <ol>
        <li>Open the problems in another tab (for example on the AoPS wiki).</li>
        <li>Bubble your answers here. The timer starts when you press Start.</li>
        <li>Keyboard: <kbd>A</kbd>–<kbd>E</kbd> choose, <kbd>0</kbd> blank, <kbd>F</kbd> flag, <kbd>←</kbd> <kbd>→</kbd> move.</li>
      </ol>
    </div>
    <button class="btn primary big" data-action="start-exam" ${keys.length ? '' : 'disabled'}>Start ${c.name} (${c.minutes} min)</button>
  </section>`;
}

// ---------------- mock contest: exam ----------------
const nowSec = (ip) => Math.min((Date.now() - ip.startedAt) / 1000, ip.durationSec);

function startExam() {
  const sel = document.getElementById('keySel');
  const k = keyById(sel?.value);
  if (!k) return;
  const c = getContest(k.contest);
  state.inProgress = {
    id: makeId('att'), contest: k.contest, keyId: k.id, label: k.label, link: k.link ?? '',
    startedAt: Date.now(), durationSec: c.minutes * 60,
    answers: new Array(c.questions).fill(null), flags: new Array(c.questions).fill(false),
    visits: switchQuestion([], 0, 0), current: 0, confirming: false,
  };
  save();
  go('#/exam');
}

function viewExam() {
  const ip = state.inProgress;
  if (!ip) return `<section class="stack narrow"><h1>No contest running</h1><p>Start one from <a href="#/mock">Mock contest</a>.</p></section>`;
  const c = getContest(ip.contest);
  const q = ip.current;
  const ans = ip.answers[q];
  const answered = ip.answers.filter((a) => a !== null).length;
  const bubbles = CHOICES.map((ch) => `<button class="choice" data-action="answer" data-choice="${ch}" aria-pressed="${ans === ch}" aria-label="Answer ${ch}">${ch}</button>`).join('');
  const nav = ip.answers.map((a, i) => {
    const st = ip.flags[i] ? 'flagged' : a ? 'answered' : 'blank';
    const lbl = `Question ${i + 1}${a ? `, answered ${a}` : ', blank'}${ip.flags[i] ? ', flagged' : ''}`;
    return `<button class="pill ${st}" data-action="goto" data-q="${i}" aria-label="${lbl}"${i === q ? ' aria-current="step"' : ''}>
      <span class="pill-num">${i + 1}</span>${ip.flags[i] ? icon('flag', { size: 14 }) : ''}${a ? `<span class="pill-ans">${a}</span>` : ''}</button>`;
  }).join('');
  const link = ip.link ? `<a class="btn ghost" href="${esc(ip.link)}" target="_blank" rel="noopener noreferrer">Open problems ↗</a>` : '';
  const confirm = ip.confirming ? `<div class="card highlight" role="dialog" aria-labelledby="cf-h">
      <h2 id="cf-h">All done?</h2>
      <p>You’ve answered ${answered} of ${c.questions}.${ip.flags.some(Boolean) ? ` ${plural(ip.flags.filter(Boolean).length, 'question')} still flagged.` : ''}
      ${ip.contest === 'AMC8' && answered < c.questions ? ' Remember: on the AMC 8, a guess can only help!' : ''}</p>
      <div class="row"><button class="btn primary" data-action="finish-exam">Yes, score it</button><button class="btn" data-action="cancel-finish">Keep working</button></div>
    </div>` : '';
  return `<section class="exam">
    <div class="exam-bar">
      <span class="exam-title">${esc(c.name)}<span class="exam-sub">${esc(ip.label)}</span></span>
      <span class="timer" id="timer" role="timer" aria-live="off">${icon('clock', { size: 20 })}<span id="timer-text">--:--</span></span>
      <button class="btn" data-action="ask-finish">Finish</button>
    </div>
    ${confirm}
    <div class="qcard">
      <div class="qhead">
        <h1>Question ${q + 1} <span class="of">of ${c.questions}</span></h1>
        <span class="qtime" id="qtime" aria-label="Time on this question"></span>
      </div>
      <p class="muted">Read question ${q + 1} in your other tab, then choose below.</p>
      <div class="choices" role="group" aria-label="Answer choices">${bubbles}</div>
      <div class="row">
        <button class="btn" data-action="answer" data-choice="" aria-pressed="${ans === null}">Leave blank</button>
        <button class="btn flag-btn" data-action="flag" aria-pressed="${ip.flags[q]}">${icon('flag', { size: 18 })} ${ip.flags[q] ? 'Flagged' : 'Flag for review'}</button>
        ${link}
      </div>
      <div class="row spread">
        <button class="btn" data-action="goto" data-nav="prev" data-q="${q - 1}" ${q === 0 ? 'disabled' : ''}>← Previous</button>
        <button class="btn primary" data-action="goto" data-nav="next" data-q="${q + 1}" ${q === c.questions - 1 ? 'disabled' : ''}>Next →</button>
      </div>
    </div>
    <h2 class="sr-only">All questions</h2>
    <div class="pills">${nav}</div>
    <ul class="pill-legend" aria-label="Legend">
      <li><span class="pill answered sample" aria-hidden="true">B</span> Answered</li>
      <li><span class="pill flagged sample" aria-hidden="true">${icon('flag', { size: 14 })}</span> Flagged</li>
      <li><span class="pill blank sample" aria-hidden="true"></span> Blank</li>
    </ul>
    <p class="muted small kbd-hint">Keyboard: <kbd>A</kbd>–<kbd>E</kbd> choose · <kbd>0</kbd> blank · <kbd>F</kbd> flag · <kbd>←</kbd> <kbd>→</kbd> move</p>
  </section>`;
}

viewExam.mount = () => {
  if (!state.inProgress) return;
  const tick = () => {
    const ip = state.inProgress;
    if (!ip) return;
    const t = nowSec(ip);
    const left = ip.durationSec - t;
    const el = document.getElementById('timer');
    if (el) {
      document.getElementById('timer-text').textContent = formatClock(left);
      // Amber at 10 minutes left, red at 5.
      el.classList.toggle('warn', left <= 600 && left > 300);
      el.classList.toggle('danger', left <= 300);
    }
    const qt = document.getElementById('qtime');
    if (qt) {
      const spent = timePerQuestion(ip.visits, ip.answers.length, t)[ip.current];
      qt.textContent = `This question ${formatClock(spent)}`;
      qt.classList.toggle('slow', spent > SLOW_SECONDS);
    }
    if (left <= 0) finishExam(true);
  };
  tick();
  timerHandle = setInterval(tick, 1000);
};

function gotoQuestion(q) {
  const ip = state.inProgress;
  if (!ip || q < 0 || q >= ip.answers.length || q === ip.current) return;
  ip.visits = switchQuestion(ip.visits, q, nowSec(ip));
  ip.current = q;
  save();
  render();
}

function setAnswer(choice) {
  const ip = state.inProgress;
  ip.answers[ip.current] = choice || null;
  save();
  render();
}

function finishExam(timedOut = false) {
  const ip = state.inProgress;
  if (!ip) return;
  const end = nowSec(ip);
  const visits = closeVisit(ip.visits, end);
  const times = timePerQuestion(visits, ip.answers.length);
  const key = keyById(ip.keyId)?.key ?? null;
  const attempt = {
    id: ip.id, contest: ip.contest, keyId: ip.keyId, label: ip.label, link: ip.link,
    startedAt: ip.startedAt, finishedAt: Date.now(), durationSec: ip.durationSec, usedSec: end, timedOut,
    answers: ip.answers, flags: ip.flags, visits, times,
    keySnapshot: key, result: key ? scoreAttempt(ip.contest, ip.answers, key) : null,
  };
  state.attempts.push(attempt);
  state.inProgress = null;
  save();
  if (timedOut) toast('Time’s up! You worked right to the end — let’s see how it went.');
  go(`#/results/${attempt.id}`);
}

// ---------------- results ----------------
function resultsHeadline(a) {
  const r = a.result;
  const frac = r.score / r.max;
  if (frac >= 0.8) return 'Amazing work! 🎉';
  if (frac >= 0.6) return 'Great job! 🌟';
  if (frac >= 0.4) return 'Solid effort! 💪';
  return 'You finished a whole contest — that’s a big deal! 🌱';
}

function viewResults(id) {
  const a = state.attempts.find((x) => x.id === id);
  if (!a) return `<section class="stack"><h1>Hmm, can’t find that one</h1><p><a href="#/progress">See all your results</a></p></section>`;
  const c = getContest(a.contest);
  if (!a.result) {
    return `<section class="stack narrow"><h1>Answers saved</h1><p>The answer key for “${esc(a.label)}” isn’t available, so we can’t score this yet.</p></section>`;
  }
  const r = a.result;
  const slow = slowQuestions(a.times);
  const logged = new Set(state.errorLog.filter((e) => e.attemptId === a.id).map((e) => e.q));

  const tiles = `<div class="grid tiles">
    <div class="tile"><span class="tile-num">${r.score}</span><span class="tile-label">points out of ${r.max}</span></div>
    <div class="tile"><span class="tile-num">${r.correct}</span><span class="tile-label">✓ correct</span></div>
    <div class="tile"><span class="tile-num">${r.blank}</span><span class="tile-label">○ left blank</span></div>
    <div class="tile"><span class="tile-num">${r.wrong}</span><span class="tile-label">↻ to learn from</span></div>
  </div>`;

  const slowMsg = slow.length
    ? `<p><span aria-hidden="true">⏱</span> ${slow.length === 1 ? 'Question' : 'Questions'} <strong>${slow.map((q) => q + 1).join(', ')}</strong> took more than 4 minutes. That’s totally normal for hard ones — on contest day, try flagging and coming back so easier points don’t slip away.</p>`
    : '<p>🏃 Great pacing — no question took more than 4 minutes!</p>';

  let coach;
  if (a.contest === 'AMC10') {
    const { scenarios, eliminationTable } = skipScenarios('AMC10', r);
    const best = Math.max(...scenarios.map((s) => s.score));
    coach = `<h2>Skip-strategy coach</h2>
      <p>On the AMC 10 a blank earns 1.5 points and a wrong answer earns 0. Here’s how other choices would have played out:</p>
      <table class="coach"><thead><tr><th>If you had…</th><th>Score</th></tr></thead><tbody>
      ${scenarios.map((s) => `<tr${s.score === best ? ' class="best"' : ''}><td>${esc(s.label)}</td><td>${+s.score.toFixed(1)}</td></tr>`).join('')}
      </tbody></table>
      <p>When is a guess worth it? A random guess is worth, on average:</p>
      <table class="coach"><thead><tr><th>Choices ruled out</th><th>Guess is worth</th><th>vs. blank (1.5)</th></tr></thead><tbody>
      ${eliminationTable.map((e) => `<tr><td>${e.eliminated}</td><td>${e.ev.toFixed(2)}</td><td>${e.vsBlank > 0.001 ? '👍 guess' : e.vsBlank < -0.001 ? 'leave blank' : 'tie'}</td></tr>`).join('')}
      </tbody></table>
      <p class="tip">Rule of thumb: if you can cross out <strong>two or more</strong> choices, guess. Otherwise a blank is the smarter play.</p>`;
  } else {
    coach = `<h2>AMC 8 reminder</h2>
      <p class="tip big-tip">🫧 <strong>Never leave a blank on the AMC 8!</strong> There’s no penalty for guessing, so every bubble you fill can only help.
      ${r.blank ? `You left ${plural(r.blank, 'blank')} — random guesses would have added about ${(r.blank / 5).toFixed(1)} points on average.` : 'You filled every bubble. Perfect strategy!'}</p>`;
  }

  const rows = a.answers.map((ans, i) => {
    const st = r.statuses[i];
    const icon = st === 'correct' ? '✓' : st === 'blank' ? '○' : '↻';
    const word = st === 'correct' ? 'Got it' : st === 'blank' ? 'Blank' : 'Learn from it';
    let log = '';
    if (st !== 'correct') {
      log = logged.has(i)
        ? '<span class="muted">In error log ✓</span>'
        : `<details class="logform"><summary>Add to error log</summary>
            <form data-form="log" data-attempt="${esc(a.id)}" data-q="${i}">
              <label for="t-${i}">Topic</label>
              <select id="t-${i}" name="topic">${TOPICS.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
              <label for="n-${i}">Note (what tripped you up?)</label>
              <input id="n-${i}" name="note" maxlength="300" autocomplete="off">
              <button class="btn primary">Save</button>
            </form></details>`;
    }
    return `<tr class="st-${st}"><td>${i + 1}${a.flags[i] ? ' ⚑' : ''}</td><td>${ans ?? '—'}</td><td>${a.keySnapshot[i]}</td>
      <td><span aria-hidden="true">${icon}</span> ${word}</td><td>${formatClock(a.times[i])}${a.times[i] > SLOW_SECONDS ? ' ⏱' : ''}</td><td>${log}</td></tr>`;
  }).join('');

  return `<section class="stack">
    <h1>${resultsHeadline(a)}</h1>
    <p class="muted">${esc(c.name)} · ${esc(a.label)} · ${fmtDate(a.finishedAt)} · used ${formatClock(a.usedSec)} of ${formatClock(a.durationSec)}</p>
    ${tiles}
    <div class="card"><h2>Pacing</h2>${slowMsg}
      ${pacingChart(a.times, SLOW_SECONDS)}
      <h3>Timeline</h3><p class="muted small">Each block is a stretch of time on one question, in order. Orange blocks are questions that took over 4 minutes in total.</p>
      ${timelineChart(timelineSegments(a.visits), a.usedSec || a.durationSec, SLOW_SECONDS, a.times)}
    </div>
    <div class="card">${coach}</div>
    <div class="card"><h2>Question by question</h2>
      <p>Add the ones you missed to your error log — they’ll come back for a retry after ${RETRY_DAYS.join(', ')} days.</p>
      <div class="table-wrap"><table class="review"><thead><tr><th>#</th><th>You</th><th>Key</th><th>Result</th><th>Time</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>
  </section>`;
}

// ---------------- drills ----------------
function drillPool(arg) {
  if (arg === 'systems') return problemsBySet('systems');
  if (arg === 'mixed') return PROBLEMS.filter((p) => p.set === 'drill');
  return problemsByTopic(arg, 'drill');
}

function nextProblem(pool) {
  const solved = new Set(state.drills.filter((d) => d.correct).map((d) => d.problemId));
  const fresh = pool.filter((p) => !solved.has(p.id) && p.id !== ui.drill?.id);
  const from = fresh.length ? fresh : pool.filter((p) => p.id !== ui.drill?.id);
  return pick(from.length ? from : pool);
}

function viewDrills(arg) {
  if (!arg) {
    const solved = new Set(state.drills.filter((d) => d.correct).map((d) => d.problemId));
    const card = (id, name, pool, ic) => {
      const done = pool.filter((p) => solved.has(p.id)).length;
      return `<a class="card link tool" href="#/drills/${id}"><span class="tool-icon">${icon(ic)}</span><span class="tool-title">${esc(name)}</span>
        <span class="tool-stat">${done} of ${pool.length} solved</span><span class="meter" aria-hidden="true"><span style="width:${(100 * done) / pool.length}%"></span></span></a>`;
    };
    const topicIcons = { algebra: 'algebra', counting: 'counting', number: 'number', geometry: 'geometry' };
    return `<section class="stack"><h1>Practice drills</h1>
      <p>Pick a topic. Every problem has a hint and a full worked solution.</p>
      <div class="grid cards">
        ${TOPICS.map((t) => card(t.id, t.name, problemsByTopic(t.id), topicIcons[t.id])).join('')}
        ${card('mixed', 'Mixed bag', PROBLEMS.filter((p) => p.set === 'drill'), 'mixed')}
        ${card('systems', 'Two equations, two unknowns', problemsBySet('systems'), 'lessons')}
      </div></section>`;
  }
  const pool = drillPool(arg);
  if (!pool.length) return `<section class="stack"><h1>Unknown topic</h1><a href="#/drills">Back to drills</a></section>`;
  if (!ui.drill || ui.drillTopic !== arg || !pool.some((p) => p.id === ui.drill.id)) {
    ui.drillTopic = arg;
    ui.drill = nextProblem(pool);
    ui.drillState = { shownAt: Date.now(), tries: 0, recorded: false, solved: false, hint: false, solution: false, feedback: '' };
  }
  const p = ui.drill;
  const s = ui.drillState;
  const title = arg === 'systems' ? 'Two equations, two unknowns' : arg === 'mixed' ? 'Mixed bag' : topicName(arg);
  return `<section class="stack narrow">
    <p><a href="#/drills">← All topics</a></p>
    <h1>${esc(title)}</h1>
    <div class="card problem">
      <p class="prompt">${esc(p.prompt)}</p>
      <form data-form="drill" class="answer-row" autocomplete="off">
        <label for="drill-ans" class="sr-only">Your answer</label>
        <input id="drill-ans" name="ans" inputmode="text" placeholder="Your answer" ${s.solved ? 'disabled' : ''} required>
        <button class="btn primary" ${s.solved ? 'disabled' : ''}>Check</button>
      </form>
      <p class="feedback ${s.solved ? 'good' : ''}" role="status">${esc(s.feedback)}</p>
      <div class="row">
        ${s.hint || s.solved ? '' : '<button class="btn" data-action="drill-hint">💡 Hint</button>'}
        ${s.solution ? '' : '<button class="btn" data-action="drill-solution">Show solution</button>'}
        <button class="btn ${s.solved || s.solution ? 'primary' : 'ghost'}" data-action="drill-next">Next problem →</button>
      </div>
      ${s.hint && !s.solution ? `<p class="hint">💡 ${esc(p.hint)}</p>` : ''}
      ${s.solution ? `<div class="solution"><h2>Worked solution</h2><ol>${p.solution.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p><strong>Answer: ${esc(p.answer)}</strong></p></div>` : ''}
    </div>
    <p class="muted small">Fractions are fine: type 3/8. Decimals work too.</p>
  </section>`;
}

viewDrills.mount = (arg) => {
  if (arg && !ui.drillState?.solved) document.getElementById('drill-ans')?.focus();
};

function recordDrill(correct) {
  const s = ui.drillState;
  if (s.recorded) return;
  s.recorded = true;
  state.drills.push({ problemId: ui.drill.id, topic: ui.drill.topic, correct, seconds: Math.round((Date.now() - s.shownAt) / 1000), at: Date.now() });
  save();
}

function checkDrill(value) {
  const s = ui.drillState;
  s.tries++;
  if (answersMatch(value, ui.drill.answer)) {
    // Only a first-try answer (before peeking at the solution) counts as correct for stats.
    recordDrill(s.tries === 1 && !s.solution);
    s.solved = true;
    s.solution = true;
    s.feedback = `${pick(CHEERS)} The answer is ${ui.drill.answer}.`;
  } else {
    recordDrill(false);
    s.feedback = s.tries >= 2 ? `${pick(NOT_YET)} A hint or the solution might help.` : pick(NOT_YET);
  }
  ui.keepFocus = true;
  render();
  if (!s.solved) {
    const inp = document.getElementById('drill-ans');
    inp.value = value;
    inp.select();
  }
}

// ---------------- lessons ----------------
function viewLessons(id) {
  if (!id) {
    return `<section class="stack"><h1>Mini-lessons</h1>
      <p>Two equations, two unknowns — sounds scary, but it’s just a balance scale! Start with lesson 1.</p>
      <div class="grid cards">
        ${LESSONS.map((l, i) => `<a class="card link tool" href="#/lessons/${l.id}"><span class="tool-icon">${icon('lessons')}</span>
          <span class="tool-title">Lesson ${i + 1}</span><span class="tool-desc">${esc(l.title)}</span>
          <span class="tool-stat">${state.lessons[l.id]?.done ? `${icon('check', { size: 16 })} Finished` : 'Not started'}</span></a>`).join('')}
        <a class="card link tool" href="#/drills/systems"><span class="tool-icon">${icon('drills')}</span><span class="tool-title">Practice</span>
          <span class="tool-desc">Original problems with worked solutions.</span><span class="tool-stat">${problemsBySet('systems').length} problems</span></a>
      </div></section>`;
  }
  const l = getLesson(id);
  if (!l) return `<section class="stack"><h1>Lesson not found</h1><a href="#/lessons">All lessons</a></section>`;
  const i = ui.lessonId === id ? ui.lessonStep : 0;
  ui.lessonId = id;
  ui.lessonStep = i;
  const last = i === l.steps.length - 1;
  return `<section class="stack lesson">
    <p><a href="#/lessons">← All lessons</a></p>
    <h1>${esc(l.title)}</h1>
    <div class="lesson-body">
      <div class="scale-wrap">${scaleSkeletonSVG()}
        <p class="legend"><span class="key-x" aria-hidden="true"></span> circle = x &nbsp; <span class="key-y" aria-hidden="true"></span> square = y &nbsp; <span class="key-w" aria-hidden="true"></span> weight</p>
      </div>
      <div class="lesson-text">
        <p class="step-count">Step ${i + 1} of ${l.steps.length}</p>
        <p class="lesson-caption" aria-live="polite" id="lesson-caption"></p>
        <div class="equations" id="lesson-eq"></div>
        <div class="row spread">
          <button class="btn" data-action="lesson-step" data-d="-1" ${i === 0 ? 'disabled' : ''}>← Back</button>
          ${last ? '<a class="btn primary" href="#/drills/systems" data-action="lesson-done">Try practice problems →</a>' : '<button class="btn primary" data-action="lesson-step" data-d="1">Next →</button>'}
        </div>
        <p class="muted small">Tip: use the ← → arrow keys.</p>
      </div>
    </div>
  </section>`;
}

viewLessons.mount = (id) => {
  const l = id && getLesson(id);
  if (!l) return;
  const svg = main.querySelector('svg.scale');
  const step = l.steps[ui.lessonStep];
  // Draw the previous step first (no transition), then the current one, so it animates.
  const prev = l.steps[ui.lessonPrevStep ?? ui.lessonStep] ?? step;
  svg.classList.add('no-anim');
  applyStep(svg, prev, l.values);
  svg.getBoundingClientRect();
  svg.classList.remove('no-anim');
  requestAnimationFrame(() => applyStep(svg, step, l.values));
  document.getElementById('lesson-caption').textContent = step.text;
  document.getElementById('lesson-eq').innerHTML = step.eq.map((e) => `<div>${esc(e)}</div>`).join('');
  ui.lessonPrevStep = null;
};

function lessonStep(d) {
  const l = getLesson(ui.lessonId);
  const n = Math.max(0, Math.min(l.steps.length - 1, ui.lessonStep + d));
  if (n === ui.lessonStep) return;
  ui.lessonPrevStep = ui.lessonStep;
  ui.lessonStep = n;
  render();
}

// ---------------- error log & retry queue ----------------
function viewErrors() {
  const now = Date.now();
  const due = dueEntries(state.errorLog, now);
  const upcoming = state.errorLog.filter((e) => !e.mastered && e.nextDue > now).sort((a, b) => a.nextDue - b.nextDue);
  const mastered = state.errorLog.filter((e) => e.mastered);
  const attemptOf = (e) => state.attempts.find((a) => a.id === e.attemptId);
  const feedback = ui.retryFeedback ?? {};

  const dueCards = due.map((e) => {
    const a = attemptOf(e);
    const link = a?.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">Open problems ↗</a>` : '';
    return `<div class="card retry">
      <h3>${esc(e.label)} · Question ${e.q + 1}</h3>
      <p class="muted">${esc(topicName(e.topic))} · retry ${e.stage + 1} of ${RETRY_DAYS.length} ${link}</p>
      ${e.note ? `<p class="note">“${esc(e.note)}”</p>` : ''}
      <p>Solve it again from scratch, then pick your answer:</p>
      <div class="bubbles small" role="group" aria-label="Retry answer">
        ${CHOICES.map((ch) => `<button class="bubble" data-action="retry" data-id="${esc(e.id)}" data-choice="${ch}" aria-label="Answer ${ch}">${ch}</button>`).join('')}
      </div>
      ${a?.keySnapshot ? '' : `<div class="row"><button class="btn" data-action="retry-self" data-id="${esc(e.id)}" data-ok="1">I solved it</button><button class="btn" data-action="retry-self" data-id="${esc(e.id)}" data-ok="0">Still tricky</button></div>`}
    </div>`;
  }).join('');

  const fb = Object.entries(feedback).map(([, msg]) => `<p class="feedback good" role="status">${esc(msg)}</p>`).join('');
  const row = (e) => `<tr><td>${esc(e.label)} #${e.q + 1}</td><td>${esc(topicName(e.topic))}</td><td>${esc(e.note)}</td>
    <td>${e.mastered ? '⭐ Mastered' : fmtDate(e.nextDue)}</td>
    <td><button class="btn ghost small" data-action="del-error" data-id="${esc(e.id)}" aria-label="Remove ${esc(e.label)} question ${e.q + 1} from error log">Remove</button></td></tr>`;

  return `<section class="stack">
    <h1>Error log &amp; retry queue</h1>
    <p>Missed questions come back after ${RETRY_DAYS.join(', ')} days. Get one right three times and it’s mastered ⭐</p>
    ${fb}
    <h2>Ready today (${due.length})</h2>
    ${due.length ? `<div class="grid cards">${dueCards}</div>` : '<p class="card soft">Nothing to retry today. Enjoy! 🌈</p>'}
    <h2>Coming up (${upcoming.length})</h2>
    ${upcoming.length ? `<div class="table-wrap"><table><thead><tr><th>Question</th><th>Topic</th><th>Note</th><th>Next retry</th><th></th></tr></thead><tbody>${upcoming.map(row).join('')}</tbody></table></div>` : '<p class="muted">Add missed questions from a mock contest’s results page.</p>'}
    ${mastered.length ? `<h2>Mastered (${mastered.length}) ⭐</h2><div class="table-wrap"><table><tbody>${mastered.map(row).join('')}</tbody></table></div>` : ''}
  </section>`;
}

function doRetry(id, ok) {
  const i = state.errorLog.findIndex((e) => e.id === id);
  if (i < 0) return;
  const e = recordRetry(state.errorLog[i], ok, Date.now());
  state.errorLog[i] = e;
  save();
  let msg;
  if (e.mastered) msg = `⭐ ${e.label} #${e.q + 1} is mastered! Fantastic.`;
  else if (ok) msg = `${pick(CHEERS)} ${e.label} #${e.q + 1} will check in again on ${fmtDate(e.nextDue)}.`;
  else msg = `Not yet — that’s okay! ${e.label} #${e.q + 1} will come back tomorrow. Try reading the AoPS solution first.`;
  ui.retryFeedback = { [id]: msg };
  render();
  ui.retryFeedback = null;
}

// ---------------- progress ----------------
function viewProgress() {
  const finished = state.attempts.filter((a) => a.result);
  const avgMock = avgMockSeconds(finished);
  const avgDrill = avgDrillSeconds(state.drills);
  const acc = topicAccuracy(state.drills);
  const missed = missedByTopic(state.errorLog);
  const maxMissed = Math.max(1, ...missed.map((m) => m.count));
  const recent = [...finished].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 10);
  return `<section class="stack">
    <h1>Your progress</h1>
    <div class="grid tiles">
      <div class="tile"><span class="tile-num">${finished.length}</span><span class="tile-label">mock contests</span></div>
      <div class="tile"><span class="tile-num">${state.drills.filter((d) => d.correct).length}</span><span class="tile-label">drills solved first try</span></div>
      <div class="tile"><span class="tile-num">${avgMock === null ? '—' : formatClock(avgMock)}</span><span class="tile-label">avg time / contest question</span></div>
      <div class="tile"><span class="tile-num">${avgDrill === null ? '—' : formatClock(avgDrill)}</span><span class="tile-label">avg time / drill</span></div>
    </div>
    <div class="card"><h2>AMC 10 scores</h2>${scoreLineChart({ points: scoreSeries(finished, 'AMC10'), yMax: 150, title: 'AMC 10' })}</div>
    <div class="card"><h2>AMC 8 scores</h2>${scoreLineChart({ points: scoreSeries(finished, 'AMC8'), yMax: 25, title: 'AMC 8' })}</div>
    <div class="card"><h2>Drill accuracy by topic</h2><p class="muted small">First-try answers in practice drills.</p>
      ${hBarChart({ rows: acc.map((t) => ({ label: t.name, value: t.accuracy, display: t.accuracy === null ? '' : `${pct(t.accuracy)} (${t.correct}/${t.attempted})` })), max: 1, ariaLabel: 'Accuracy by topic', emptyText: 'Not started yet' })}
    </div>
    <div class="card"><h2>Error log by topic</h2><p class="muted small">Where the missed contest questions came from.</p>
      ${hBarChart({ rows: missed.map((m) => ({ label: m.name, value: m.count, display: String(m.count) })), max: maxMissed, ariaLabel: 'Missed questions by topic' })}
    </div>
    ${recent.length ? `<div class="card"><h2>Recent contests</h2><ul class="plain">${recent.map((a) => `<li><a href="#/results/${esc(a.id)}">${esc(getContest(a.contest).name)} · ${esc(a.label)} — ${a.result.score} / ${a.result.max}</a> <span class="muted">${fmtDate(a.finishedAt)}</span></li>`).join('')}</ul></div>` : ''}
  </section>`;
}

// ---------------- settings ----------------
function viewSettings() {
  const keys = state.keys.map((k) => `<tr><td>${esc(k.label)}</td><td>${esc(getContest(k.contest).name)}</td>
    <td><code>${ui.revealKey === k.id ? esc(k.key) : '•'.repeat(25)}</code></td>
    <td><button class="btn ghost small" data-action="reveal-key" data-id="${esc(k.id)}">${ui.revealKey === k.id ? 'Hide' : 'Show'}</button>
    <button class="btn ghost small" data-action="del-key" data-id="${esc(k.id)}" aria-label="Delete key ${esc(k.label)}">Delete</button></td></tr>`).join('');
  return `<section class="stack narrow">
    <h1>Settings</h1>
    <div class="card">
      <h2>Appearance</h2>
      <div class="segmented" role="radiogroup" aria-label="Theme">
        ${THEMES.map((t) => `<button type="button" class="seg-btn" role="radio" aria-checked="${prefs.theme === t}" data-action="set-theme" data-id="${t}">${{ system: 'Match device', light: 'Light', dark: 'Dark' }[t]}</button>`).join('')}
      </div>
    </div>
    <div class="card">
      <h2>Contest dates</h2>
      <p class="muted small">Used for the countdown on the home screen.</p>
      <form data-form="dates" class="date-grid">
        <div><label for="d-AMC10">AMC 10</label><input id="d-AMC10" name="AMC10" type="date" value="${esc(prefs.contestDates.AMC10)}"></div>
        <div><label for="d-AMC8">AMC 8</label><input id="d-AMC8" name="AMC8" type="date" value="${esc(prefs.contestDates.AMC8)}"></div>
        <button class="btn primary">Save dates</button>
      </form>
    </div>
    <h2 class="section-title">For parents</h2>
    <div class="card">
      <h2>Answer keys</h2>
      <p class="muted small">Keys are stored only in this browser. They are never part of the app’s code or sent anywhere.</p>
      ${state.keys.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Contest</th><th>Key</th><th></th></tr></thead><tbody>${keys}</tbody></table></div>` : ''}
      <form data-form="key" class="form" autocomplete="off">
        <label for="k-label">Name (e.g. “Practice set 1”)</label>
        <input id="k-label" name="label" required maxlength="60">
        <label for="k-contest">Contest</label>
        <select id="k-contest" name="contest">${Object.values(CONTESTS).map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
        <label for="k-key">Answer key — 25 letters, e.g. BDACE… (numbers and spaces are ignored)</label>
        <textarea id="k-key" name="key" rows="2" required spellcheck="false"></textarea>
        <label for="k-link">Link to the problems page (optional)</label>
        <input id="k-link" name="link" type="url" placeholder="https://…">
        <p class="feedback" id="key-msg" role="status"></p>
        <button class="btn primary">Save key</button>
      </form>
    </div>
    <div class="card">
      <h2>Backup</h2>
      <p>Everything lives in this browser’s storage. Export a backup now and then — clearing browser data erases it.</p>
      <div class="row">
        <button class="btn primary" data-action="export">Export backup (.json)</button>
        <label class="btn" for="import-file">Import backup…</label>
        <input id="import-file" type="file" accept="application/json,.json" class="sr-only" data-action="import">
      </div>
    </div>
    <div class="card">
      <h2>Start fresh</h2>
      <p>Erase all contests, drills, error log and keys from this browser.</p>
      <button class="btn danger" data-action="reset">Erase everything…</button>
    </div>
  </section>`;
}

function saveKey(form) {
  const fd = new FormData(form);
  const msg = document.getElementById('key-msg');
  const parsed = parseAnswerKey(fd.get('key'));
  if (!parsed.ok) {
    msg.textContent = parsed.error;
    msg.className = 'feedback';
    return;
  }
  let link = String(fd.get('link') ?? '').trim();
  if (link && !/^https?:\/\//i.test(link)) link = '';
  state.keys.push({ id: makeId('key'), label: String(fd.get('label')).trim() || 'Practice set', contest: fd.get('contest'), key: parsed.key, link });
  save();
  toast('Key saved.');
  render();
}

function doExport() {
  const blob = new Blob([exportJSON(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `amc-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function doImport(input) {
  const file = input.files?.[0];
  if (!file) return;
  const res = importJSON(await file.text());
  input.value = '';
  if (!res.ok) return toast(res.error);
  if (!confirm('Replace everything in this browser with the backup?')) return;
  state = res.state;
  save();
  toast('Backup restored!');
  render();
}

// ---------------- events ----------------
const ACTIONS = {
  'setup-contest': (el) => { ui.setupContest = el.dataset.id; render(); },
  'start-exam': startExam,
  answer: (el) => setAnswer(el.dataset.choice),
  flag: () => { const ip = state.inProgress; ip.flags[ip.current] = !ip.flags[ip.current]; save(); render(); },
  goto: (el) => gotoQuestion(Number(el.dataset.q)),
  'ask-finish': () => { state.inProgress.confirming = true; render(); },
  'cancel-finish': () => { state.inProgress.confirming = false; render(); },
  'finish-exam': () => finishExam(false),
  'drill-hint': () => { ui.drillState.hint = true; ui.keepFocus = true; render(); },
  'drill-solution': () => { ui.drillState.solution = true; recordDrill(false); ui.keepFocus = true; render(); },
  'drill-next': () => {
    ui.drill = nextProblem(drillPool(ui.drillTopic));
    ui.drillState = { shownAt: Date.now(), tries: 0, recorded: false, solved: false, hint: false, solution: false, feedback: '' };
    render();
  },
  'lesson-step': (el) => lessonStep(Number(el.dataset.d)),
  'lesson-done': () => { state.lessons[ui.lessonId] = { done: true, at: Date.now() }; save(); return true; },
  retry: (el) => {
    const e = state.errorLog.find((x) => x.id === el.dataset.id);
    const a = state.attempts.find((x) => x.id === e?.attemptId);
    if (e && a?.keySnapshot) doRetry(e.id, a.keySnapshot[e.q] === el.dataset.choice);
  },
  'retry-self': (el) => doRetry(el.dataset.id, el.dataset.ok === '1'),
  'del-error': (el) => { state.errorLog = state.errorLog.filter((e) => e.id !== el.dataset.id); save(); render(); },
  'reveal-key': (el) => { ui.revealKey = ui.revealKey === el.dataset.id ? null : el.dataset.id; render(); },
  'del-key': (el) => {
    if (!confirm('Delete this answer key? Past results stay saved.')) return;
    state.keys = state.keys.filter((k) => k.id !== el.dataset.id);
    save();
    render();
  },
  'set-theme': (el) => {
    prefs.theme = el.dataset.id;
    savePrefs(window.localStorage, prefs);
    applyTheme(document.documentElement, prefs.theme);
    render();
  },
  export: doExport,
  reset: () => {
    if (!confirm('Really erase everything? Consider exporting a backup first.')) return;
    state = defaultState();
    save();
    toast('All cleared. Fresh start!');
    go('#/home');
  },
};

main.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el || el.disabled || el.type === 'file') return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  const allowDefault = fn(el) === true;
  if (!allowDefault && el.tagName !== 'INPUT') ev.preventDefault();
});

main.addEventListener('change', (ev) => {
  if (ev.target.dataset.action === 'import') doImport(ev.target);
});

main.addEventListener('submit', (ev) => {
  const form = ev.target;
  ev.preventDefault();
  if (form.dataset.form === 'drill') checkDrill(new FormData(form).get('ans'));
  else if (form.dataset.form === 'key') saveKey(form);
  else if (form.dataset.form === 'dates') {
    const fd = new FormData(form);
    prefs.contestDates = { AMC8: String(fd.get('AMC8') ?? ''), AMC10: String(fd.get('AMC10') ?? '') };
    savePrefs(window.localStorage, prefs);
    prefs = loadPrefs(window.localStorage);
    toast('Contest dates saved.');
  }
  else if (form.dataset.form === 'log') {
    const fd = new FormData(form);
    const a = state.attempts.find((x) => x.id === form.dataset.attempt);
    if (!a) return;
    state.errorLog.push(newEntry({
      id: makeId('err'), attemptId: a.id, label: a.label, contest: a.contest,
      q: Number(form.dataset.q), topic: fd.get('topic'), note: String(fd.get('note') ?? '').trim(), now: Date.now(),
    }));
    save();
    toast(`Logged question ${Number(form.dataset.q) + 1}. It’ll come back tomorrow.`);
    render();
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const tag = ev.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const r = route();
  if (r.name === 'exam' && state.inProgress) {
    const k = ev.key.toUpperCase();
    if (CHOICES.includes(k)) setAnswer(k);
    else if (k === '0' || k === 'DELETE' || k === 'BACKSPACE') setAnswer('');
    else if (k === 'F') ACTIONS.flag();
    else if (ev.key === 'ArrowRight' || k === 'N') gotoQuestion(state.inProgress.current + 1);
    else if (ev.key === 'ArrowLeft' || k === 'P') gotoQuestion(state.inProgress.current - 1);
    else return;
    ev.preventDefault();
  } else if (r.name === 'lessons' && r.arg) {
    if (ev.key === 'ArrowRight') lessonStep(1);
    else if (ev.key === 'ArrowLeft') lessonStep(-1);
    else return;
    ev.preventDefault();
  }
});

// Tooltips for chart marks (hover and keyboard focus).
const tip = document.getElementById('tooltip');
function showTip(el) {
  const text = el?.dataset?.tip;
  if (!text) return;
  tip.textContent = text;
  tip.hidden = false;
  const r = el.getBoundingClientRect();
  const tw = tip.offsetWidth;
  const left = Math.min(window.innerWidth - tw - 8, Math.max(8, r.left + r.width / 2 - tw / 2));
  tip.style.left = `${left + window.scrollX}px`;
  tip.style.top = `${r.top + window.scrollY - tip.offsetHeight - 10}px`;
}
const hideTip = () => { tip.hidden = true; };
main.addEventListener('mouseover', (e) => (e.target.dataset?.tip ? showTip(e.target) : hideTip()));
main.addEventListener('focusin', (e) => (e.target.dataset?.tip ? showTip(e.target) : hideTip()));
main.addEventListener('focusout', hideTip);
main.addEventListener('mouseleave', hideTip);

window.addEventListener('hashchange', render);
// Redraw charts when the width changes enough to matter (e.g. rotating a tablet).
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const r = route().name;
    if (['progress', 'results'].includes(r) && Math.abs(setChartWidth(chartContentWidth()) - ui.chartWidth) > 24) render();
  }, 200);
});
// Keep the in-progress contest in sync if another tab changed storage.
window.addEventListener('storage', () => { state = loadState(window.localStorage); render(); });
render();
