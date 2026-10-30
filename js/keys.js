// Helpers for adding answer keys quickly. Nothing here contains contest content:
// it only builds links to the AoPS wiki and reads text a parent pastes in.
import { CONTESTS, parseAnswerKey } from './scoring.js';

const WIKI = 'https://artofproblemsolving.com/wiki/index.php/';

// Contest editions as the AoPS wiki names its pages.
export const EDITIONS = [
  { id: 'AMC8', label: 'AMC 8', contest: 'AMC8', slug: 'AMC_8', from: 1999 },
  { id: 'AMC10A', label: 'AMC 10A', contest: 'AMC10', slug: 'AMC_10A', from: 2002 },
  { id: 'AMC10B', label: 'AMC 10B', contest: 'AMC10', slug: 'AMC_10B', from: 2002 },
  { id: 'FALL10A', label: 'Fall AMC 10A (2021 only)', contest: 'AMC10', slug: 'Fall_AMC_10A', from: 2021, to: 2021 },
  { id: 'FALL10B', label: 'Fall AMC 10B (2021 only)', contest: 'AMC10', slug: 'Fall_AMC_10B', from: 2021, to: 2021 },
  { id: 'AMC10', label: 'AMC 10 (2000–2001)', contest: 'AMC10', slug: 'AMC_10', from: 2000, to: 2001 },
];

export function getEdition(id) {
  return EDITIONS.find((e) => e.id === id) ?? null;
}

/** Name and AoPS links for one contest, or an error if that year/edition never ran. */
export function contestInfo(year, editionId, maxYear = new Date().getFullYear()) {
  const e = getEdition(editionId);
  const y = Number(year);
  if (!e) return { ok: false, error: 'Pick a contest.' };
  if (!Number.isInteger(y) || y < e.from || y > Math.min(e.to ?? maxYear, maxYear)) {
    const last = Math.min(e.to ?? maxYear, maxYear);
    const name = e.label.replace(/ \(.*\)$/, '');
    return { ok: false, error: last === e.from ? `${name} only ran in ${e.from}.` : `${name} ran from ${e.from} to ${last}.` };
  }
  const page = `${y}_${e.slug}`;
  const name = e.id.startsWith('FALL') ? `${y} Fall ${e.label.replace(/^Fall /, '').replace(/ \(.*\)$/, '')}` : `${y} ${e.label.replace(/ \(.*\)$/, '')}`;
  return {
    ok: true,
    label: name,
    contest: e.contest,
    problemsUrl: `${WIKI}${page}_Problems`,
    keyUrl: `${WIKI}${page}_Answer_Key`,
  };
}

/**
 * Find a 25-answer key inside messy pasted text, such as a whole copied web page.
 * Tries, in order: numbered answers ("1. B", "2) D", "3: (A)") running 1..25,
 * a run of 25 lines that are each a single letter A–E, then a plain key ("BDACE…")
 * if the text has no numbers at all.
 */
export function extractAnswerKey(text, n = 25) {
  const s = String(text ?? '');

  // 1) Numbered answers in order 1..n.
  const re = /(?<!\d)(\d{1,2})[ \t]*[.):\-]?[ \t]*\(?[ \t]*([A-E])\)?(?![A-Za-z])/g;
  let run = [];
  for (const m of s.matchAll(re)) {
    const num = Number(m[1]);
    if (num === run.length + 1) run.push(m[2]);
    else if (num === 1) run = [m[2]];
    if (run.length === n) return { ok: true, key: run.join('') };
  }

  // 2) n consecutive lines that are a single letter (how numbered lists often copy).
  const lines = s.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
  let letters = [];
  for (const l of lines) {
    const m = /^\(?([A-E])\)?\.?$/.exec(l);
    if (m) {
      letters.push(m[1]);
      if (letters.length === n) return { ok: true, key: letters.join('') };
    } else {
      letters = [];
    }
  }

  // 3) A plain key — only when there are no numbers, so a numbered list with a
  //    gap or typo is never quietly stitched together.
  if (!/\d/.test(s)) {
    const plain = parseAnswerKey(s, n);
    if (plain.ok) return plain;
  }
  return { ok: false, error: 'Couldn’t find 25 answers in that text. Try copying just the list of answers.' };
}

/** Add keys that aren't already saved (same name, ignoring case). Never removes anything. */
export function mergeKeys(existing, incoming, makeId) {
  const seen = new Set(existing.map((k) => k.label.trim().toLowerCase()));
  const keys = [...existing];
  let added = 0;
  let skipped = 0;
  for (const k of incoming) {
    const name = k.label.trim().toLowerCase();
    if (seen.has(name)) { skipped++; continue; }
    seen.add(name);
    keys.push({ ...k, id: makeId() });
    added++;
  }
  return { keys, added, skipped };
}

export function exportKeysJSON(keys) {
  return JSON.stringify({
    app: 'amc-prep-keys',
    exportedAt: new Date().toISOString(),
    keys: keys.map(({ label, contest, key, link }) => ({ label, contest, key, link: link ?? '' })),
  }, null, 2);
}

/** Read keys from a keys file or from a full backup. Invalid entries are dropped and counted. */
export function parseKeysFile(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!raw || typeof raw !== 'object' || !['amc-prep-keys', 'amc-prep'].includes(raw.app) || !Array.isArray(raw.keys)) {
    return { ok: false, error: "That doesn't look like an answer-key file or backup from this app." };
  }
  const keys = [];
  let invalid = 0;
  for (const k of raw.keys) {
    const parsed = parseAnswerKey(k?.key);
    const label = typeof k?.label === 'string' ? k.label.trim().slice(0, 60) : '';
    if (!parsed.ok || !label || !CONTESTS[k?.contest]) { invalid++; continue; }
    const link = typeof k.link === 'string' && /^https?:\/\//i.test(k.link) ? k.link : '';
    keys.push({ label, contest: k.contest, key: parsed.key, link });
  }
  return { ok: true, keys, invalid };
}
