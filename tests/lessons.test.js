import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, panWeight, tiltDegrees } from '../js/lessons.js';

test('every lesson step balances, except steps marked as tipping', () => {
  for (const lesson of LESSONS) {
    for (const [i, step] of lesson.steps.entries()) {
      const tips = step.tips === true;
      const balanced = tiltDegrees(step, lesson.values) === 0;
      assert.equal(balanced, !tips, `${lesson.id} step ${i + 1}`);
    }
  }
});

test('lesson values solve their own equations', () => {
  const sub = LESSONS.find((l) => l.id === 'substitution').values;
  assert.equal(sub.x + sub.y, 10);
  assert.equal(sub.y, sub.x + 2);
  const el = LESSONS.find((l) => l.id === 'elimination').values;
  assert.equal(2 * el.x + el.y, 11);
  assert.equal(el.x + el.y, 7);
});

test('removed items do not count toward the weight', () => {
  assert.equal(panWeight(['x', { item: 'y', remove: true }, 2], { x: 4, y: 3 }), 6);
});

test('tilt direction and cap', () => {
  const v = { x: 4, y: 6 };
  assert.ok(tiltDegrees({ left: [1], right: [3] }, v) > 0, 'heavier right tips right');
  assert.ok(tiltDegrees({ left: [30], right: [1] }, v) === -12, 'capped');
});
