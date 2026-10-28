import { test } from 'node:test';
import assert from 'node:assert/strict';
import { switchQuestion, closeVisit, timePerQuestion, slowQuestions, timelineSegments, formatClock, SLOW_SECONDS } from '../js/pacing.js';

test('visits accumulate time per question', () => {
  let v = switchQuestion([], 0, 0);
  v = switchQuestion(v, 1, 100); // 100s on Q1
  v = switchQuestion(v, 0, 400); // 300s on Q2
  v = closeVisit(v, 450); // 50 more on Q1
  const t = timePerQuestion(v, 25);
  assert.equal(t[0], 150);
  assert.equal(t[1], 300);
  assert.equal(t[2], 0);
  assert.equal(t.length, 25);
});

test('open visit counts up to now', () => {
  const v = switchQuestion([], 3, 10);
  assert.equal(timePerQuestion(v, 25, 70)[3], 60);
  assert.equal(timePerQuestion(v, 25)[3], 0);
});

test('slow questions are those over 4 minutes', () => {
  assert.equal(SLOW_SECONDS, 240);
  const times = new Array(25).fill(60);
  times[4] = 240; // exactly 4:00 is not over
  times[7] = 241;
  times[20] = 600;
  assert.deepEqual(slowQuestions(times), [7, 20]);
});

test('timeline merges back-to-back visits and drops empty ones', () => {
  const visits = [
    { q: 0, start: 0, end: 50 },
    { q: 0, start: 50, end: 80 },
    { q: 1, start: 80, end: 80 },
    { q: 2, start: 80, end: 200 },
    { q: 0, start: 200, end: null },
  ];
  assert.deepEqual(timelineSegments(visits), [
    { q: 0, start: 0, end: 80 },
    { q: 2, start: 80, end: 200 },
  ]);
});

test('formatClock', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(65), '1:05');
  assert.equal(formatClock(4500), '75:00');
  assert.equal(formatClock(-3), '0:00');
});
