// Aggregations for the progress dashboard.
import { TOPICS } from './retry.js';

export function scoreSeries(attempts, contestId) {
  return attempts
    .filter((a) => a.contest === contestId && a.result)
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .map((a) => ({ at: a.finishedAt, score: a.result.score, max: a.result.max, label: a.label }));
}

export function topicAccuracy(drills) {
  return TOPICS.map((t) => {
    const rows = drills.filter((d) => d.topic === t.id);
    const correct = rows.filter((d) => d.correct).length;
    return { topic: t.id, name: t.name, attempted: rows.length, correct, accuracy: rows.length ? correct / rows.length : null };
  });
}

export function missedByTopic(errorLog) {
  return TOPICS.map((t) => ({ topic: t.id, name: t.name, count: errorLog.filter((e) => e.topic === t.id).length }));
}

/** Average seconds per question across finished mock contests (questions with time > 0). */
export function avgMockSeconds(attempts, contestId = null) {
  let total = 0;
  let n = 0;
  for (const a of attempts) {
    if (contestId && a.contest !== contestId) continue;
    for (const t of a.times ?? []) {
      if (t > 0) { total += t; n++; }
    }
  }
  return n ? total / n : null;
}

export function avgDrillSeconds(drills) {
  const rows = drills.filter((d) => typeof d.seconds === 'number');
  return rows.length ? rows.reduce((s, d) => s + d.seconds, 0) / rows.length : null;
}
