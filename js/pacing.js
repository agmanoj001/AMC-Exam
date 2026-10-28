// Per-question timing for a mock contest. A "visit" is one continuous stretch
// spent looking at a question; time per question is the sum of its visits.

export const SLOW_SECONDS = 240; // 4 minutes

/** Close the open visit (if any) and open a new one on `nextQ`. Returns new visits array. */
export function switchQuestion(visits, nextQ, nowSec) {
  const out = closeVisit(visits, nowSec);
  if (nextQ !== null && nextQ !== undefined) out.push({ q: nextQ, start: nowSec, end: null });
  return out;
}

export function closeVisit(visits, nowSec) {
  return visits.map((v) => (v.end === null ? { ...v, end: Math.max(v.start, nowSec) } : { ...v }));
}

/** Seconds spent per question (0-based array of length n). Open visits count up to nowSec. */
export function timePerQuestion(visits, n, nowSec = null) {
  const times = new Array(n).fill(0);
  for (const v of visits) {
    const end = v.end ?? nowSec ?? v.start;
    if (v.q >= 0 && v.q < n) times[v.q] += Math.max(0, end - v.start);
  }
  return times;
}

export function slowQuestions(times, threshold = SLOW_SECONDS) {
  return times.map((t, i) => ({ q: i, t })).filter((x) => x.t > threshold).map((x) => x.q);
}

/** Merge back-to-back visits to the same question so the timeline stays readable. */
export function timelineSegments(visits) {
  const segs = [];
  for (const v of visits) {
    if (v.end === null || v.end <= v.start) continue;
    const last = segs[segs.length - 1];
    if (last && last.q === v.q && last.end === v.start) last.end = v.end;
    else segs.push({ q: v.q, start: v.start, end: v.end });
  }
  return segs;
}

export function formatClock(totalSec) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
