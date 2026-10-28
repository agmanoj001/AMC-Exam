// Display preferences (theme, contest dates). Kept under their own key so the
// study data in amcPrep.v1 and its export format stay exactly as they were.

export const PREFS_KEY = 'amcPrep.ui';
export const THEMES = ['system', 'light', 'dark'];

export function defaultPrefs() {
  return { theme: 'system', contestDates: { AMC8: '', AMC10: '' } };
}

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function normalizePrefs(raw) {
  const p = defaultPrefs();
  if (!raw || typeof raw !== 'object') return p;
  if (THEMES.includes(raw.theme)) p.theme = raw.theme;
  for (const c of ['AMC8', 'AMC10']) {
    const d = raw.contestDates?.[c];
    if (isDate(d)) p.contestDates[c] = d;
  }
  return p;
}

export function loadPrefs(storage) {
  try {
    return normalizePrefs(JSON.parse(storage?.getItem(PREFS_KEY) ?? 'null'));
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(storage, prefs) {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(normalizePrefs(prefs)));
    return true;
  } catch {
    return false;
  }
}

/** Apply a theme to <html>: 'system' removes the override so prefers-color-scheme decides. */
export function applyTheme(root, theme) {
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
}
