import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contestInfo, extractAnswerKey, mergeKeys, exportKeysJSON, parseKeysFile, EDITIONS } from '../js/keys.js';
import { exportJSON, defaultState } from '../js/storage.js';

// A made-up key used only for testing; it is not any real contest's answers.
const KEY = 'ABCDEEDCBAABCDEEDCBAABCDE';

test('contestInfo builds names and AoPS wiki links', () => {
  const a = contestInfo(2024, 'AMC8', 2026);
  assert.equal(a.label, '2024 AMC 8');
  assert.equal(a.contest, 'AMC8');
  assert.equal(a.problemsUrl, 'https://artofproblemsolving.com/wiki/index.php/2024_AMC_8_Problems');
  assert.equal(a.keyUrl, 'https://artofproblemsolving.com/wiki/index.php/2024_AMC_8_Answer_Key');
  const b = contestInfo(2019, 'AMC10B', 2026);
  assert.equal(b.label, '2019 AMC 10B');
  assert.equal(b.contest, 'AMC10');
  assert.match(b.keyUrl, /2019_AMC_10B_Answer_Key$/);
  const f = contestInfo(2021, 'FALL10A', 2026);
  assert.equal(f.label, '2021 Fall AMC 10A');
  assert.match(f.problemsUrl, /2021_Fall_AMC_10A_Problems$/);
  assert.equal(contestInfo(2001, 'AMC10', 2026).label, '2001 AMC 10');
});

test('contestInfo rejects years a contest did not run', () => {
  assert.equal(contestInfo(1998, 'AMC8', 2026).ok, false);
  assert.equal(contestInfo(2001, 'AMC10A', 2026).ok, false);
  assert.equal(contestInfo(2022, 'FALL10B', 2026).ok, false);
  assert.equal(contestInfo(2022, 'FALL10B', 2026).error, 'Fall AMC 10B only ran in 2021.');
  assert.equal(contestInfo(1990, 'AMC8', 2026).error, 'AMC 8 ran from 1999 to 2026.');
  assert.equal(contestInfo(2027, 'AMC8', 2026).ok, false, 'future');
  assert.equal(contestInfo(2024, 'nope', 2026).ok, false);
  assert.equal(EDITIONS.every((e) => e.contest === 'AMC8' || e.contest === 'AMC10'), true);
});

test('extractAnswerKey reads numbered answers out of a whole pasted page', () => {
  const page = `Log In  Wiki  Search\n2099 Example Answer Key\nContents\n1 Answers\n2 See also\n` +
    [...KEY].map((c, i) => `${i + 1}. ${c}`).join('\n') +
    `\nSee also\n2099 Example (Problems)\nPreceded by Problem 25 | Followed by 1\nThe problems on this page are copyrighted.`;
  assert.deepEqual(extractAnswerKey(page), { ok: true, key: KEY });
});

test('extractAnswerKey handles other numbering styles', () => {
  assert.equal(extractAnswerKey([...KEY].map((c, i) => `${i + 1}) (${c})`).join('  ')).key, KEY);
  assert.equal(extractAnswerKey([...KEY].map((c, i) => `${i + 1}: ${c}`).join(', ')).key, KEY);
  assert.equal(extractAnswerKey([...KEY].map((c, i) => `${i + 1}.${c}`).join(' ')).key, KEY, 'no space');
});

test('extractAnswerKey reads a list copied without numbers', () => {
  const page = `2099 Example Answer Key\nAnswers\n${[...KEY].join('\n')}\nSee also\nProblems`;
  assert.equal(extractAnswerKey(page).key, KEY);
});

test('extractAnswerKey accepts a plain key and rejects junk', () => {
  assert.equal(extractAnswerKey(KEY.toLowerCase()).key, KEY);
  assert.equal(extractAnswerKey('Hello there, nothing useful').ok, false);
  assert.equal(extractAnswerKey([...KEY.slice(0, 24)].map((c, i) => `${i + 1}. ${c}`).join('\n')).ok, false, 'only 24');
});

test('extractAnswerKey does not stitch together a broken sequence', () => {
  const broken = [...KEY].map((c, i) => `${i === 12 ? 99 : i + 1}. ${c}`).join('\n');
  assert.equal(extractAnswerKey(broken).ok, false);
});

test('mergeKeys adds new keys, skips names already saved, keeps everything else', () => {
  let n = 0;
  const id = () => `id${++n}`;
  const existing = [{ id: 'x', label: '2024 AMC 8', contest: 'AMC8', key: KEY, link: '' }];
  const incoming = [
    { label: '2024 amc 8', contest: 'AMC8', key: KEY, link: '' },
    { label: '2023 AMC 8', contest: 'AMC8', key: KEY, link: '' },
    { label: '2023 AMC 8', contest: 'AMC8', key: KEY, link: '' },
  ];
  const r = mergeKeys(existing, incoming, id);
  assert.equal(r.added, 1);
  assert.equal(r.skipped, 2);
  assert.deepEqual(r.keys.map((k) => k.label), ['2024 AMC 8', '2023 AMC 8']);
  assert.equal(r.keys[0].id, 'x');
  assert.equal(r.keys[1].id, 'id1');
});

test('keys export round-trips, and full backups can be read for keys too', () => {
  const keys = [{ id: 'a', label: 'Set 1', contest: 'AMC10', key: KEY, link: 'https://example.org/p' }];
  const r = parseKeysFile(exportKeysJSON(keys));
  assert.equal(r.ok, true);
  assert.deepEqual(r.keys, [{ label: 'Set 1', contest: 'AMC10', key: KEY, link: 'https://example.org/p' }]);
  const st = defaultState();
  st.keys = keys;
  assert.equal(parseKeysFile(exportJSON(st)).keys.length, 1);
});

test('parseKeysFile drops invalid entries and unsafe links', () => {
  const text = JSON.stringify({ app: 'amc-prep-keys', keys: [
    { label: 'ok', contest: 'AMC8', key: KEY, link: 'javascript:alert(1)' },
    { label: 'short', contest: 'AMC8', key: 'ABC' },
    { label: 'bad contest', contest: 'AMC12', key: KEY },
    { contest: 'AMC8', key: KEY },
  ] });
  const r = parseKeysFile(text);
  assert.equal(r.keys.length, 1);
  assert.equal(r.keys[0].link, '');
  assert.equal(r.invalid, 3);
  assert.equal(parseKeysFile('nope').ok, false);
  assert.equal(parseKeysFile('{"app":"other","keys":[]}').ok, false);
});
