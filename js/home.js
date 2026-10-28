// Home-screen helpers: practice streak, contest countdown and the
// "Start today's practice" recommendation. Pure functions over saved state.
import { startOfDay, addDays, dueEntries } from './retry.js';
import { topicAccuracy } from './stats.js';
import { CONTESTS } from './scoring.js';

/** Timestamps of everything the student did. */
function activityTimes(state) {
  const times = [];
  for (const d of state.drills ?? []) times.push(d.at);
  for (const a of state.attempts ?? []) times.push(a.finishedAt);
  for (const e of state.errorLog ?? []) {
    times.push(e.loggedAt);
    for (const h of e.history ?? []) times.push(h.at);
  }
  for (const l of Object.values(state.lessons ?? {})) times.push(l?.at);
  return times.filter((t) => typeof t === 'number' && Number.isFinite(t));
}

/**
 * Consecutive days with any practice, ending today. If nothing has happened
 * yet today, a streak that ran through yesterday still counts.
 */
export function practiceStreak(state, now) {
  const days = new Set(activityTimes(state).map(startOfDay));
  let day = startOfDay(now);
  if (!days.has(day)) day = addDays(day, -1);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return { days: streak, practicedToday: days.has(startOfDay(now)) };
}

/** Parse 'YYYY-MM-DD' as a local date (not UTC). */
export function parseLocalDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : null;
}

/** The nearest contest date that is today or later, or null. */
export function nextContest(contestDates, now) {
  const today = startOfDay(now);
  const upcoming = Object.entries(contestDates ?? {})
    .map(([id, s]) => ({ id, name: CONTESTS[id]?.name ?? id, at: parseLocalDate(s) }))
    .filter((c) => c.at !== null && c.at >= today)
    .map((c) => ({ ...c, days: Math.round((c.at - today) / 86400000) }))
    .sort((a, b) => a.at - b.at);
  return upcoming[0] ?? null;
}

/**
 * What to do next: due retries first, then a drill on the weakest topic
 * (a topic not tried yet counts as weakest; ties go to the fewest attempts).
 */
export function pickNextActivity(state, now) {
  const due = dueEntries(state.errorLog ?? [], now).length;
  if (due > 0) {
    return { kind: 'retry', href: '#/errors', reason: `${due} missed question${due === 1 ? ' is' : 's are'} ready for a retry` };
  }
  const acc = topicAccuracy(state.drills ?? []);
  const ranked = [...acc].sort((a, b) => {
    const av = a.accuracy ?? -1;
    const bv = b.accuracy ?? -1;
    return av - bv || a.attempted - b.attempted;
  });
  const t = ranked[0];
  const reason = t.accuracy === null ? `You haven’t tried ${t.name} yet` : `${t.name} is your trickiest topic right now`;
  return { kind: 'drill', topic: t.topic, href: `#/drills/${t.topic}`, reason };
}
