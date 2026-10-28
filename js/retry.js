// Retry queue for missed questions: they come back 1, 3 and 7 days after
// being logged. A "still tricky" retry restarts the schedule from that day.

export const RETRY_DAYS = [1, 3, 7];
export const TOPICS = [
  { id: 'algebra', name: 'Algebra' },
  { id: 'counting', name: 'Counting & Probability' },
  { id: 'number', name: 'Number Theory' },
  { id: 'geometry', name: 'Geometry' },
];

export function topicName(id) {
  return TOPICS.find((t) => t.id === id)?.name ?? 'Other';
}

/** Local midnight for a timestamp (ms). */
export function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ms, days) {
  const d = new Date(startOfDay(ms));
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function newEntry({ id, attemptId, label, contest, q, topic, note, now }) {
  return {
    id, attemptId, label, contest, q, topic, note: note ?? '',
    loggedAt: now, baseDay: startOfDay(now), stage: 0,
    nextDue: addDays(now, RETRY_DAYS[0]), history: [], mastered: false,
  };
}

/** Record a retry. ok=true advances the schedule; ok=false restarts it from today. */
export function recordRetry(entry, ok, now) {
  const e = { ...entry, history: [...entry.history, { at: now, ok }] };
  if (ok) {
    e.stage = entry.stage + 1;
    if (e.stage >= RETRY_DAYS.length) {
      e.mastered = true;
      e.nextDue = null;
    } else {
      // Never schedule for today or earlier, even if a retry was done late.
      e.nextDue = Math.max(addDays(e.baseDay, RETRY_DAYS[e.stage]), addDays(now, 1));
    }
  } else {
    e.stage = 0;
    e.baseDay = startOfDay(now);
    e.nextDue = addDays(now, RETRY_DAYS[0]);
    e.mastered = false;
  }
  return e;
}

export function isDue(entry, now) {
  return !entry.mastered && entry.nextDue !== null && entry.nextDue <= now;
}

export function dueEntries(log, now) {
  return log.filter((e) => isDue(e, now)).sort((a, b) => a.nextDue - b.nextDue);
}
