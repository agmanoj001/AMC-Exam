import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAnswerKey, scoreAttempt, skipScenarios, guessExpectedValue, CONTESTS } from '../js/scoring.js';

const KEY = 'ABCDEABCDEABCDEABCDEABCDE';

test('contest rules', () => {
  assert.deepEqual(
    [CONTESTS.AMC10.questions, CONTESTS.AMC10.minutes, CONTESTS.AMC10.correct, CONTESTS.AMC10.blank, CONTESTS.AMC10.wrong],
    [25, 75, 6, 1.5, 0],
  );
  assert.deepEqual([CONTESTS.AMC8.questions, CONTESTS.AMC8.minutes, CONTESTS.AMC8.correct, CONTESTS.AMC8.blank], [25, 40, 1, 0]);
});

test('parseAnswerKey accepts several pasted formats', () => {
  assert.equal(parseAnswerKey(KEY).key, KEY);
  assert.equal(parseAnswerKey(KEY.toLowerCase()).key, KEY);
  const numbered = [...KEY].map((c, i) => `${i + 1}. ${c}`).join('\n');
  assert.equal(parseAnswerKey(numbered).key, KEY);
  assert.equal(parseAnswerKey(KEY.split('').join(', ')).key, KEY);
});

test('parseAnswerKey rejects bad keys kindly', () => {
  assert.equal(parseAnswerKey('ABC').ok, false);
  assert.match(parseAnswerKey('ABC').error, /25 letters/);
  assert.equal(parseAnswerKey(KEY.slice(0, 24) + 'F').ok, false);
  assert.equal(parseAnswerKey('').ok, false);
});

test('AMC 10 scoring: 6 / 1.5 / 0', () => {
  const answers = [...KEY];
  answers[0] = null; // blank
  answers[1] = null; // blank
  answers[2] = 'A'; // wrong (key C)
  const r = scoreAttempt('AMC10', answers, KEY);
  assert.equal(r.correct, 22);
  assert.equal(r.blank, 2);
  assert.equal(r.wrong, 1);
  assert.equal(r.score, 22 * 6 + 2 * 1.5);
  assert.equal(r.max, 150);
  assert.deepEqual(r.statuses.slice(0, 4), ['blank', 'blank', 'wrong', 'correct']);
});

test('AMC 10 all blank is 37.5, perfect is 150', () => {
  assert.equal(scoreAttempt('AMC10', new Array(25).fill(null), KEY).score, 37.5);
  assert.equal(scoreAttempt('AMC10', [...KEY], KEY).score, 150);
});

test('AMC 8 scoring: 1 per correct, nothing else', () => {
  const answers = [...KEY];
  answers[0] = null;
  answers[1] = 'E';
  const r = scoreAttempt('AMC8', answers, KEY);
  assert.equal(r.score, 23);
  assert.equal(r.max, 25);
});

test('guess expected values', () => {
  assert.equal(guessExpectedValue('AMC10', 0), 1.2);
  assert.equal(guessExpectedValue('AMC10', 1), 1.5);
  assert.equal(guessExpectedValue('AMC10', 2), 2);
  assert.equal(guessExpectedValue('AMC10', 3), 3);
  assert.equal(guessExpectedValue('AMC8', 0), 0.2);
  assert.throws(() => guessExpectedValue('AMC10', 5));
});

test('skip scenarios for AMC 10', () => {
  const r = { correct: 15, blank: 6, wrong: 4, score: 15 * 6 + 6 * 1.5 };
  const { scenarios, eliminationTable } = skipScenarios('AMC10', r);
  const byId = Object.fromEntries(scenarios.map((s) => [s.id, s.score]));
  assert.equal(byId.actual, 99);
  assert.equal(byId.blankWrong, 99 + 4 * 1.5);
  assert.ok(Math.abs(byId.guessBlanks - (99 - 6 * 0.3)) < 1e-9);
  assert.equal(byId.perfectSkip, 15 * 6 + 10 * 1.5);
  assert.deepEqual(eliminationTable.map((e) => e.vsBlank > 0), [false, false, true, true]);
  assert.ok(Math.abs(eliminationTable[1].vsBlank) < 1e-9, 'eliminating one choice is break-even');
});
