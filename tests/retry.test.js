import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newEntry, recordRetry, dueEntries, isDue, addDays, startOfDay, RETRY_DAYS } from '../js/retry.js';

const DAY0 = new Date(2026, 0, 10, 15, 30).getTime(); // a Saturday afternoon, local time
const at = (days, hour = 9) => {
  const d = new Date(addDays(DAY0, days));
  d.setHours(hour);
  return d.getTime();
};

test('schedule is 1, 3, 7 days', () => assert.deepEqual(RETRY_DAYS, [1, 3, 7]));

test('a missed question comes back after 1, 3 and 7 days, then is mastered', () => {
  let e = newEntry({ id: 'e1', attemptId: 'a', label: 'Test', contest: 'AMC10', q: 4, topic: 'geometry', note: '', now: DAY0 });
  assert.equal(e.nextDue, addDays(DAY0, 1));
  assert.equal(isDue(e, DAY0), false);
  assert.equal(isDue(e, at(1)), true);

  e = recordRetry(e, true, at(1));
  assert.equal(e.nextDue, addDays(DAY0, 3));
  assert.equal(isDue(e, at(2)), false);

  e = recordRetry(e, true, at(3));
  assert.equal(e.nextDue, addDays(DAY0, 7));

  e = recordRetry(e, true, at(7));
  assert.equal(e.mastered, true);
  assert.equal(e.nextDue, null);
  assert.equal(isDue(e, at(30)), false);
  assert.equal(e.history.length, 3);
});

test('"still tricky" restarts the schedule from that day', () => {
  let e = newEntry({ id: 'e1', attemptId: 'a', label: 'T', contest: 'AMC8', q: 0, topic: 'number', now: DAY0 });
  e = recordRetry(e, true, at(1));
  e = recordRetry(e, false, at(3));
  assert.equal(e.stage, 0);
  assert.equal(e.baseDay, startOfDay(at(3)));
  assert.equal(e.nextDue, addDays(at(3), 1));
});

test('a late retry is never scheduled for today or the past', () => {
  let e = newEntry({ id: 'e1', attemptId: 'a', label: 'T', contest: 'AMC8', q: 0, topic: 'number', now: DAY0 });
  e = recordRetry(e, true, at(5)); // day-3 slot already passed
  assert.equal(e.nextDue, addDays(at(5), 1));
});

test('dueEntries filters and sorts', () => {
  const a = { ...newEntry({ id: 'a', q: 0, now: DAY0 }), nextDue: at(2) };
  const b = { ...newEntry({ id: 'b', q: 1, now: DAY0 }), nextDue: at(1) };
  const c = { ...newEntry({ id: 'c', q: 2, now: DAY0 }), nextDue: at(9) };
  const d = { ...newEntry({ id: 'd', q: 3, now: DAY0 }), mastered: true, nextDue: null };
  assert.deepEqual(dueEntries([a, b, c, d], at(3)).map((e) => e.id), ['b', 'a']);
});
