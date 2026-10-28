// All data lives in the browser's localStorage under one key. Export/import
// lets a parent keep a JSON backup or move to another device.

export const STORAGE_KEY = 'amcPrep.v1';
export const SCHEMA_VERSION = 1;

export function defaultState() {
  return {
    version: SCHEMA_VERSION,
    keys: [],        // { id, label, contest, key, link }
    attempts: [],    // finished mock contests
    inProgress: null,
    errorLog: [],
    drills: [],      // { problemId, topic, correct, seconds, at }
    lessons: {},     // { [lessonId]: { done: true, at } }
  };
}

/** Fill in any missing fields so older or partial data still loads. */
export function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const out = { ...base };
  for (const k of ['keys', 'attempts', 'errorLog', 'drills']) {
    out[k] = Array.isArray(raw[k]) ? raw[k] : [];
  }
  out.lessons = raw.lessons && typeof raw.lessons === 'object' && !Array.isArray(raw.lessons) ? raw.lessons : {};
  out.inProgress = raw.inProgress && typeof raw.inProgress === 'object' ? raw.inProgress : null;
  out.version = SCHEMA_VERSION;
  return out;
}

export function loadState(storage) {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    return text ? normalizeState(JSON.parse(text)) : defaultState();
  } catch {
    return defaultState();
  }
}

export function saveState(storage, state) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportJSON(state) {
  return JSON.stringify({ app: 'amc-prep', exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importJSON(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!raw || typeof raw !== 'object' || raw.app !== 'amc-prep') {
    return { ok: false, error: "That doesn't look like a backup from this app." };
  }
  const { app, exportedAt, ...rest } = raw;
  return { ok: true, state: normalizeState(rest) };
}

let counter = 0;
export function makeId(prefix = 'id') {
  counter = (counter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
