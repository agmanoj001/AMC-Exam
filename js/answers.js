// Comparing typed drill answers: "3/10", "0.3" and " 3 / 10 " are all equal.

function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Parse an integer, decimal or fraction into a reduced [num, den] of BigInts, or null. */
export function parseRational(text) {
  const s = String(text ?? '').trim().replace(/[\s,$°]/g, '').replace(/[−–]/g, '-');
  if (s === '') return null;
  let m = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (m) {
    let num = BigInt(m[1]);
    let den = BigInt(m[2]);
    if (den === 0n) return null;
    if (den < 0n) { num = -num; den = -den; }
    const g = gcd(num, den) || 1n;
    return [num / g, den / g];
  }
  m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (m && (m[2] !== '' || m[3])) {
    const frac = m[3] ?? '';
    let num = BigInt((m[2] || '0') + frac);
    const den = 10n ** BigInt(frac.length);
    if (m[1] === '-') num = -num;
    const g = gcd(num, den) || 1n;
    return [num / g, den / g];
  }
  return null;
}

export function answersMatch(typed, expected) {
  const a = parseRational(typed);
  const b = parseRational(expected);
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
}
