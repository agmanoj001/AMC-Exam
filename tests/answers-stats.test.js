import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRational, answersMatch } from '../js/answers.js';
import { scoreSeries, topicAccuracy, avgMockSeconds, avgDrillSeconds, missedByTopic } from '../js/stats.js';

test('answersMatch accepts equivalent forms', () => {
  assert.ok(answersMatch('3/10', '3/10'));
  assert.ok(answersMatch('0.3', '3/10'));
  assert.ok(answersMatch(' 6 / 20 ', '3/10'));
  assert.ok(answersMatch('-50', '-50'));
  assert.ok(answersMatch('−50', '-50'), 'unicode minus');
  assert.ok(answersMatch('2.4', '12/5'));
  assert.ok(answersMatch('$40', '40'));
  assert.ok(answersMatch('75°', '75'));
  assert.ok(answersMatch('1,000', '1000'));
  assert.ok(answersMatch('.5', '1/2'));
});

test('answersMatch rejects wrong or unreadable answers', () => {
  assert.equal(answersMatch('3/11', '3/10'), false);
  assert.equal(answersMatch('', '3'), false);
  assert.equal(answersMatch('abc', '3'), false);
  assert.equal(answersMatch('1/0', '3'), false);
  assert.equal(parseRational('-'), null);
});

test('scoreSeries sorts by time and filters contest', () => {
  const attempts = [
    { contest: 'AMC10', finishedAt: 2, result: { score: 90, max: 150 }, label: 'b' },
    { contest: 'AMC8', finishedAt: 1, result: { score: 20, max: 25 }, label: 'x' },
    { contest: 'AMC10', finishedAt: 1, result: { score: 80, max: 150 }, label: 'a' },
  ];
  assert.deepEqual(scoreSeries(attempts, 'AMC10').map((p) => p.score), [80, 90]);
});

test('topicAccuracy and averages', () => {
  const drills = [
    { topic: 'algebra', correct: true, seconds: 30 },
    { topic: 'algebra', correct: false, seconds: 90 },
    { topic: 'geometry', correct: true, seconds: 60 },
  ];
  const acc = Object.fromEntries(topicAccuracy(drills).map((t) => [t.topic, t.accuracy]));
  assert.equal(acc.algebra, 0.5);
  assert.equal(acc.geometry, 1);
  assert.equal(acc.counting, null);
  assert.equal(avgDrillSeconds(drills), 60);
  assert.equal(avgMockSeconds([{ contest: 'AMC10', times: [60, 0, 120] }]), 90);
  assert.equal(avgMockSeconds([]), null);
  assert.equal(missedByTopic([{ topic: 'number' }, { topic: 'number' }]).find((t) => t.topic === 'number').count, 2);
});
