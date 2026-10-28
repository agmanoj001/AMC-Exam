// Small inline SVG icon set (24×24, stroked with currentColor). Drawn for this app.
const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  mock: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h6M9 19h3"/>',
  drills: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  lessons: '<path d="M12 4v16M8 20h8M4 7h16"/><path d="M4 7 1.5 13a2.5 2.5 0 0 0 5 0zM20 7l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
  errors: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 3v5h5M4 13a8 8 0 0 0 14.3 4.9L20 16M20 21v-5h-5"/>',
  progress: '<path d="M3 20h18M6 16v-4M11 16V8M16 16v-6M20 16V5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.5 1.4-4 2.5-5 .3 2 1.3 3 2.5 3 0-3-1-5 0-8.5z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  flag: '<path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M5 12.5 10 17l9-10"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  algebra: '<path d="M4 7h6M7 4v6M14 7h6M4 14l6 6M10 14l-6 6M14 15h6M14 19h6"/>',
  counting: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>',
  number: '<path d="M10 4 8 20M16 4l-2 16M5 9h15M4 15h15"/>',
  geometry: '<path d="M12 4 21 20H3z"/><path d="M7 20a5 5 0 0 0-1.6-3.2"/>',
  mixed: '<path d="M4 7h3l10 10h3M17 7h3M4 17h3l3-3M14 10l3-3M18 5l2 2-2 2M18 15l2 2-2 2"/>',
};

export function icon(name, { size = 24, label = '' } = {}) {
  const body = PATHS[name] ?? '';
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="icon icon-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`;
}

export const ICON_NAMES = Object.keys(PATHS);
