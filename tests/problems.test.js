// Every problem's answer is recomputed here, independently of the solution text.
// Where possible the check is brute force (enumerate, simulate, count) rather
// than re-applying the same formula. A problem with no verifier fails the suite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEMS } from '../js/problems.js';
import { parseRational } from '../js/answers.js';

// ---- small exact-arithmetic helpers ----
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const frac = (n, d) => {
  const g = gcd(n, d) * (d < 0 ? -1 : 1);
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const isPrime = (n) => n > 1 && range(2, Math.floor(Math.sqrt(n))).every((d) => n % d !== 0);
const permutations = (arr) =>
  arr.length <= 1 ? [arr] : arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
/** Search integer pairs (x, y) in a box for those satisfying pred. */
const solvePairs = (pred, lo = -100, hi = 100) => {
  const out = [];
  for (let x = lo; x <= hi; x++) for (let y = lo; y <= hi; y++) if (pred(x, y)) out.push([x, y]);
  return out;
};
const unique = (sols) => {
  assert.equal(sols.length, 1, `expected exactly one solution, got ${JSON.stringify(sols)}`);
  return sols[0];
};

const VERIFY = {
  'alg-01': () => String(unique(range(-100, 100).filter((n) => 3 * n + 7 === 31))),
  'alg-02': () => String(6 * 13 - 5 * 12),
  'alg-03': () => String(unique(range(0, 200).filter((p) => p + (p + 120) === 200))),
  'alg-04': () => String(4 * unique(range(-100, 100).filter((x) => 2 * x - 5 === x + 9))),
  'alg-05': () => String((75 / (180 / 3)) * 60),
  'alg-06': () => String(unique(range(-100, 100).filter((n) => n + n + 1 + n + 2 + n + 3 === 74)) + 3),
  'alg-07': () => {
    // pick concrete values: c = 20, b = 8, a = 6 satisfy a/b = 3/4, b/c = 2/5
    const c = 20, b = (2 * c) / 5, a = (3 * b) / 4;
    return frac(a, c);
  },
  'alg-08': () => String(range(1, 100).reduce((s, k) => s + (k % 2 ? k : -k), 0)),
  'alg-09': () => {
    const w = unique(range(1, 100).filter((w) => 2 * (w + 2 * w + 3) === 48));
    return String(w * (2 * w + 3));
  },
  'alg-10': () => {
    const [b] = unique(solvePairs((b, m) => m === 4 * b && m + 6 === 2 * (b + 6), 0, 100));
    return String(4 * b);
  },

  'cnt-01': () => String(range(1, 99).filter((n) => n % 3 === 0 || n % 5 === 0).length),
  'cnt-02': () => String(permutations([1, 2, 3, 4]).length),
  'cnt-03': () => {
    let hits = 0;
    for (let m = 0; m < 8; m++) if ([0, 1, 2].filter((i) => (m >> i) & 1).length === 2) hits++;
    return frac(hits, 8);
  },
  'cnt-04': () => {
    let hits = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === 7) hits++;
    return frac(hits, 36);
  },
  'cnt-05': () => String(range(100, 999).filter((n) => [...String(n)].every((d) => Number(d) % 2 === 1)).length),
  'cnt-06': () => {
    let n = 0;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) n++;
    return String(n);
  },
  'cnt-07': () => {
    // a segment between two vertices of an octagon is a diagonal unless they are adjacent
    let n = 0;
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if ((j - i) % 8 !== 1 && (j - i) % 8 !== 7) n++;
    return String(n);
  },
  'cnt-08': () => String(new Set(permutations([...'LEVEL']).map((p) => p.join(''))).size),
  'cnt-09': () => {
    const bag = ['R', 'R', 'R', 'B', 'B', 'B', 'B', 'B'];
    let hits = 0, total = 0;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      if (i === j) continue;
      total++;
      if (bag[i] === 'R' && bag[j] === 'R') hits++;
    }
    return frac(hits, total);
  },
  'cnt-10': () => {
    const paths = (x, y) => (x === 0 || y === 0 ? 1 : paths(x - 1, y) + paths(x, y - 1));
    return String(paths(4, 3));
  },

  'num-01': () => String(2 ** 10 % 7),
  'num-02': () => String(range(1, 72).filter((d) => 72 % d === 0).length),
  'num-03': () => String(Math.max(...range(1, 84).filter((d) => 84 % d === 0 && 126 % d === 0))),
  'num-04': () => String(range(1, 10000).find((n) => n % 12 === 0 && n % 18 === 0 && n % 30 === 0)),
  'num-05': () => {
    let d = 1;
    for (let i = 0; i < 2026; i++) d = (d * 7) % 10;
    return String(d);
  },
  'num-06': () => String(range(2, 29).filter(isPrime).reduce((a, b) => a + b, 0)),
  'num-07': () => {
    const sq = (n) => Number.isInteger(Math.round(Math.sqrt(n))) && Math.round(Math.sqrt(n)) ** 2 === n;
    const cu = (n) => Math.round(Math.cbrt(n)) ** 3 === n;
    return String(range(1, 100).filter((n) => sq(n) || cu(n)).length);
  },
  'num-08': () => String(range(2, 10000).find((n) => [2, 3, 4, 5, 6].every((d) => n % d === 1))),
  'num-09': () => {
    let f = 1n;
    for (let i = 1n; i <= 25n; i++) f *= i;
    return String(String(f).match(/0*$/)[0].length);
  },
  'num-10': () => String(Math.max(...range(2, 1001).filter((d) => 1001 % d === 0 && isPrime(d)))),

  'geo-01': () => String(unique(range(1, 100).filter((c) => c * c === 6 * 6 + 8 * 8))),
  'geo-02': () => {
    const k = unique(range(1, 180).filter((k) => 2 * k + 3 * k + 4 * k === 180));
    return String(4 * k);
  },
  'geo-03': () => String(((6 - 2) * 180) / 6),
  'geo-04': () => {
    // area of a square from its diagonal: side² where 2·side² = d²
    const d = 10;
    return String((d * d) / 2);
  },
  'geo-05': () => String(unique(range(1, 100).filter((c) => c * c === 8 * 8 + 15 * 15))),
  'geo-06': () => {
    const r = unique(range(1, 100).filter((r) => r * r === 36));
    return String(2 * r);
  },
  'geo-07': () => {
    // shoelace formula
    const P = [[0, 0], [6, 0], [2, 5]];
    let s = 0;
    for (let i = 0; i < 3; i++) {
      const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % 3];
      s += x1 * y2 - x2 * y1;
    }
    return String(Math.abs(s) / 2);
  },
  'geo-08': () => String(unique(range(1, 100).filter((s) => 6 * s * s === 150)) ** 3),
  'geo-09': () => {
    const h = 3, m = 30;
    const hourDeg = (h % 12) * 30 + m * 0.5;
    const minDeg = m * 6;
    const diff = Math.abs(hourDeg - minDeg);
    return String(Math.min(diff, 360 - diff));
  },
  'geo-10': () => {
    // put the right angle at the origin: legs along axes to (3,0) and (0,4);
    // distance from origin to the line 4x + 3y = 12 is |−12| / √(4² + 3²)
    const num = 12, den2 = 4 * 4 + 3 * 3;
    const den = Math.sqrt(den2);
    assert.ok(Number.isInteger(den));
    return frac(num, den);
  },

  'sys-01': () => String(unique(solvePairs((x, y) => x + y === 20 && x - y === 6))[0]),
  'sys-02': () => String(unique(solvePairs((a, b) => 2 * a + b === 80 && a + b === 50))[0]),
  'sys-03': () => String(unique(solvePairs((x, y) => x + y === 9 && y === 2 * x))[0]),
  'sys-04': () => {
    const [x, y] = unique(solvePairs((x, y) => 3 * x + 2 * y === 16 && x + 2 * y === 8));
    return String(x + y);
  },
  'sys-05': () => String(unique(solvePairs((h, c) => h + c === 12 && 2 * h + 4 * c === 32, 0, 12))[1]),
  'sys-06': () => String(unique(solvePairs((a, k) => a + k === 10 && 5 * a + 3 * k === 38, 0, 10))[0]),
  'sys-07': () => {
    const [x, y] = unique(solvePairs((x, y) => 2 * x + 3 * y === 13 && 4 * x - y === 5));
    return String(x * y);
  },
  'sys-08': () => {
    const [p, e] = unique(solvePairs((p, e) => 2 * p + 3 * e === 95 && 3 * p + 2 * e === 105, 0, 200));
    return String(p + e);
  },
};

test('every problem has an independent verifier', () => {
  const missing = PROBLEMS.filter((p) => !VERIFY[p.id]).map((p) => p.id);
  assert.deepEqual(missing, [], `problems without a verifier: ${missing.join(', ')}`);
});

test('no verifier refers to a problem that does not exist', () => {
  const ids = new Set(PROBLEMS.map((p) => p.id));
  assert.deepEqual(Object.keys(VERIFY).filter((id) => !ids.has(id)), []);
});

for (const p of PROBLEMS) {
  test(`${p.id}: stored answer matches computed answer`, () => {
    const computed = VERIFY[p.id]?.();
    assert.ok(computed !== undefined, 'missing verifier');
    assert.equal(p.answer, computed);
  });
}

test('problem ids are unique and fields are complete', () => {
  const ids = PROBLEMS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of PROBLEMS) {
    assert.ok(['algebra', 'counting', 'number', 'geometry'].includes(p.topic), p.id);
    assert.ok(['drill', 'systems'].includes(p.set), p.id);
    assert.ok(p.prompt.length > 10, p.id);
    assert.ok(Array.isArray(p.solution) && p.solution.length > 0, `${p.id} needs a worked solution`);
    assert.ok(p.hint, `${p.id} needs a hint`);
    assert.ok(parseRational(p.answer), `${p.id} answer must be a number or fraction`);
  }
});

test('every drill topic has at least 8 problems', () => {
  for (const t of ['algebra', 'counting', 'number', 'geometry']) {
    assert.ok(PROBLEMS.filter((p) => p.topic === t && p.set === 'drill').length >= 8, t);
  }
});
