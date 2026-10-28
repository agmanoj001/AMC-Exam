import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, loadState, saveState, exportJSON, importJSON, normalizeState, STORAGE_KEY, makeId } from '../js/storage.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}

test('load returns defaults when empty or corrupt', () => {
  const s = memoryStorage();
  assert.deepEqual(loadState(s), defaultState());
  s.setItem(STORAGE_KEY, '{not json');
  assert.deepEqual(loadState(s), defaultState());
});

test('save then load round-trips', () => {
  const s = memoryStorage();
  const st = defaultState();
  st.keys.push({ id: 'k1', label: 'Practice', contest: 'AMC10', key: 'A'.repeat(25) });
  st.drills.push({ problemId: 'alg-01', topic: 'algebra', correct: true, seconds: 30, at: 1 });
  assert.equal(saveState(s, st), true);
  assert.deepEqual(loadState(s), st);
});

test('save reports failure instead of throwing', () => {
  const bad = { setItem: () => { throw new Error('quota'); } };
  assert.equal(saveState(bad, defaultState()), false);
});

test('export / import round-trips', () => {
  const st = defaultState();
  st.errorLog.push({ id: 'e1', topic: 'geometry', note: 'forgot the hour hand moves' });
  const res = importJSON(exportJSON(st));
  assert.equal(res.ok, true);
  assert.deepEqual(res.state, st);
});

test('import rejects junk with a friendly message', () => {
  assert.equal(importJSON('nope').ok, false);
  assert.equal(importJSON('{"hello":1}').ok, false);
  assert.equal(importJSON('[]').ok, false);
});

test('normalizeState fills missing / wrong-typed fields', () => {
  const st = normalizeState({ keys: 'oops', attempts: [{ id: 1 }], lessons: [] });
  assert.deepEqual(st.keys, []);
  assert.equal(st.attempts.length, 1);
  assert.deepEqual(st.lessons, {});
  assert.equal(st.inProgress, null);
});

test('makeId is unique', () => {
  const ids = new Set(Array.from({ length: 500 }, () => makeId('x')));
  assert.equal(ids.size, 500);
});
