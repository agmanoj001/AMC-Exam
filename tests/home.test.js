import { test } from 'node:test';
import assert from 'node:assert/strict';
import { practiceStreak, nextContest, pickNextActivity, parseLocalDate } from '../js/home.js';
import { addDays } from '../js/retry.js';
import { defaultPrefs, normalizePrefs, loadPrefs, savePrefs, applyTheme, PREFS_KEY } from '../js/prefs.js';
import { STORAGE_KEY } from '../js/storage.js';
import { icon, ICON_NAMES } from '../js/icons.js';

const NOW = new Date(2026, 9, 28, 16, 0).getTime();
const at = (daysAgo, hour = 10) => { const d = new Date(addDays(NOW, -daysAgo)); d.setHours(hour); return d.getTime(); };
const empty = () => ({ drills: [], attempts: [], errorLog: [], lessons: {} });

test('streak counts consecutive days ending today', () => {
  const s = empty();
  s.drills = [0, 1, 2].map((d) => ({ at: at(d), topic: 'algebra', correct: true }));
  s.drills.push({ at: at(4), topic: 'algebra', correct: true }); // gap on day 3
  assert.deepEqual(practiceStreak(s, NOW), { days: 3, practicedToday: true });
});

test('streak survives until the end of today if yesterday was practiced', () => {
  const s = empty();
  s.attempts = [{ finishedAt: at(1) }, { finishedAt: at(2) }];
  assert.deepEqual(practiceStreak(s, NOW), { days: 2, practicedToday: false });
  assert.equal(practiceStreak(empty(), NOW).days, 0);
});

test('streak counts retries and lessons too', () => {
  const s = empty();
  s.errorLog = [{ loggedAt: at(3), history: [{ at: at(0) }, { at: at(1) }] }];
  s.lessons = { substitution: { done: true, at: at(2) } };
  assert.equal(practiceStreak(s, NOW).days, 4);
});

test('nextContest picks the nearest date today or later', () => {
  assert.equal(nextContest({ AMC8: '', AMC10: '' }, NOW), null);
  assert.equal(nextContest({ AMC8: '2026-10-01' }, NOW), null, 'past dates ignored');
  const n = nextContest({ AMC8: '2027-01-22', AMC10: '2026-11-05' }, NOW);
  assert.equal(n.id, 'AMC10');
  assert.equal(n.days, 8);
  assert.equal(nextContest({ AMC10: '2026-10-28' }, NOW).days, 0);
  assert.equal(parseLocalDate('nope'), null);
});

test('today’s practice: due retries come first', () => {
  const s = empty();
  s.errorLog = [{ mastered: false, nextDue: at(1), history: [] }];
  const p = pickNextActivity(s, NOW);
  assert.equal(p.kind, 'retry');
  assert.equal(p.href, '#/errors');
});

test('today’s practice: otherwise the weakest topic, untried first', () => {
  const s = empty();
  const add = (topic, ok, n) => { for (let i = 0; i < n; i++) s.drills.push({ topic, correct: i < ok, at: at(0) }); };
  add('algebra', 4, 5); add('counting', 1, 4); add('number', 3, 3);
  assert.equal(pickNextActivity(s, NOW).topic, 'geometry', 'untried topic first');
  add('geometry', 3, 3);
  const p = pickNextActivity(s, NOW);
  assert.equal(p.topic, 'counting');
  assert.equal(p.href, '#/drills/counting');
});

test('prefs live under their own key and are validated', () => {
  assert.notEqual(PREFS_KEY, STORAGE_KEY);
  assert.deepEqual(normalizePrefs({ theme: 'neon', contestDates: { AMC8: '2027-01-22', AMC10: 'soon' } }),
    { theme: 'system', contestDates: { AMC8: '2027-01-22', AMC10: '' } });
  const m = new Map();
  const st = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.deepEqual(loadPrefs(st), defaultPrefs());
  savePrefs(st, { theme: 'dark', contestDates: { AMC8: '', AMC10: '2026-11-05' } });
  assert.equal(loadPrefs(st).theme, 'dark');
  assert.equal(loadPrefs(st).contestDates.AMC10, '2026-11-05');
  assert.deepEqual([...m.keys()], [PREFS_KEY]);
});

test('applyTheme sets or clears data-theme', () => {
  const attrs = {};
  const root = { setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; } };
  applyTheme(root, 'dark');
  assert.equal(attrs['data-theme'], 'dark');
  applyTheme(root, 'system');
  assert.equal(attrs['data-theme'], undefined);
});

test('icons render as decorative SVG unless labelled', () => {
  for (const n of ICON_NAMES) assert.match(icon(n), /^<svg[^>]+aria-hidden="true"/);
  assert.match(icon('settings', { label: 'Settings' }), /aria-label="Settings"/);
});
