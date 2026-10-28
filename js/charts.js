// Small hand-rolled SVG charts. Each returns an HTML string. Marks carry a
// data-tip attribute; app.js shows it as a tooltip on hover or keyboard focus.
import { formatClock } from './pacing.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const fmtDate = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Single-series line chart of scores over time. points: [{at, score, label}] */
export function scoreLineChart({ points, yMax, title }) {
  if (!points.length) return `<p class="muted">No ${esc(title)} contests yet — your scores will show up here.</p>`;
  const W = 600, H = 240, L = 44, R = 16, T = 16, B = 34;
  const iw = W - L - R, ih = H - T - B;
  const x = (i) => L + (points.length === 1 ? iw / 2 : (i * iw) / (points.length - 1));
  const y = (v) => T + ih - (v / yMax) * ih;
  const ticks = [0, yMax / 2, yMax];
  const grid = ticks.map((t) => `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${L - 8}" y="${y(t) + 5}" text-anchor="end">${t}</text>`).join('');
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const every = Math.ceil(points.length / 6);
  const xl = points.map((p, i) => (i % every === 0 || i === points.length - 1 ? `<text class="axis" x="${x(i)}" y="${H - 10}" text-anchor="middle">${fmtDate(p.at)}</text>` : '')).join('');
  const dots = points.map((p, i) => `<circle class="dot" tabindex="0" cx="${x(i)}" cy="${y(p.score)}" r="6" data-tip="${esc(`${p.label} · ${fmtDate(p.at)} · ${p.score} / ${yMax}`)}"/>`).join('');
  const last = points[points.length - 1];
  const lastLabel = `<text class="value" x="${x(points.length - 1) - 10}" y="${y(last.score) - 12}" text-anchor="end">${last.score}</text>`;
  const rows = points.map((p) => `<tr><td>${fmtDate(p.at)}</td><td>${esc(p.label)}</td><td>${p.score}</td></tr>`).join('');
  return `<figure class="chart">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)} scores over time">${grid}<path class="line" d="${path}"/>${dots}${lastLabel}${xl}</svg>
    <details><summary>Show as a table</summary><table><thead><tr><th>Date</th><th>Contest</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table></details>
  </figure>`;
}

/** Horizontal bars. rows: [{label, value (0..max or null), display}] */
export function hBarChart({ rows, max, ariaLabel, emptyText = 'No data yet' }) {
  const W = 600, rowH = 44, L = 210, R = 70;
  const H = rows.length * rowH + 8;
  const iw = W - L - R;
  const bars = rows.map((r, i) => {
    const y0 = 4 + i * rowH;
    const label = `<text class="label" x="${L - 12}" y="${y0 + 27}" text-anchor="end">${esc(r.label)}</text>`;
    if (r.value === null || r.value === undefined) {
      return `${label}<text class="muted-text" x="${L}" y="${y0 + 27}">${esc(emptyText)}</text>`;
    }
    const w = Math.max(2, (r.value / max) * iw);
    return `${label}<rect class="track" x="${L}" y="${y0 + 10}" width="${iw}" height="22" rx="4"/>
      <rect class="bar" tabindex="0" x="${L}" y="${y0 + 10}" width="${w}" height="22" rx="4" data-tip="${esc(`${r.label}: ${r.display}`)}"/>
      <text class="value" x="${L + w + 8}" y="${y0 + 27}">${esc(r.display)}</text>`;
  }).join('');
  const table = rows.map((r) => `<tr><td>${esc(r.label)}</td><td>${r.value === null || r.value === undefined ? '—' : esc(r.display)}</td></tr>`).join('');
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}">${bars}</svg>
    <details><summary>Show as a table</summary><table><tbody>${table}</tbody></table></details></figure>`;
}

/** Vertical bar per question with a 4-minute reference line. */
export function pacingChart(times, threshold) {
  const n = times.length;
  const W = 640, H = 240, L = 40, R = 10, T = 14, B = 30;
  const iw = W - L - R, ih = H - T - B;
  const maxT = Math.max(threshold * 1.25, ...times);
  const yMaxMin = Math.ceil(maxT / 60);
  const yMax = yMaxMin * 60;
  const bw = iw / n;
  const y = (v) => T + ih - (v / yMax) * ih;
  const step = yMaxMin > 10 ? 5 : yMaxMin > 5 ? 2 : 1;
  let grid = '';
  for (let m = 0; m <= yMaxMin; m += step) {
    grid += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y(m * 60)}" y2="${y(m * 60)}"/><text class="axis" x="${L - 6}" y="${y(m * 60) + 5}" text-anchor="end">${m}m</text>`;
  }
  const bars = times.map((t, i) => {
    const slow = t > threshold;
    const h = Math.max(t > 0 ? 2 : 0, (t / yMax) * ih);
    const bx = L + i * bw + 2;
    const label = (i + 1) % 5 === 0 || i === 0 ? `<text class="axis" x="${bx + (bw - 4) / 2}" y="${H - 10}" text-anchor="middle">${i + 1}</text>` : '';
    const icon = slow ? `<text class="slow-icon" x="${bx + (bw - 4) / 2}" y="${y(t) - 6}" text-anchor="middle" aria-hidden="true">⏱</text>` : '';
    return `<rect class="${slow ? 'bar slow' : 'bar'}" tabindex="0" x="${bx}" y="${T + ih - h}" width="${bw - 4}" height="${h}" rx="3"
      data-tip="${esc(`Question ${i + 1}: ${formatClock(t)}${slow ? ' — over 4 minutes' : ''}`)}"/>${icon}${label}`;
  }).join('');
  const ref = `<line class="ref" x1="${L}" x2="${W - R}" y1="${y(threshold)}" y2="${y(threshold)}"/><text class="ref-label" x="${W - R}" y="${y(threshold) - 6}" text-anchor="end">4 min</text>`;
  const rows = times.map((t, i) => `<tr><td>${i + 1}</td><td>${formatClock(t)}</td><td>${t > threshold ? '⏱ over 4 min' : ''}</td></tr>`).join('');
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Time spent on each question">${grid}${bars}${ref}</svg>
    <details><summary>Show as a table</summary><table><thead><tr><th>Question</th><th>Time</th><th></th></tr></thead><tbody>${rows}</tbody></table></details></figure>`;
}

/** Timeline strip: the order questions were visited across the contest. */
export function timelineChart(segments, totalSec, threshold, times) {
  if (!segments.length) return '';
  const W = 640, H = 92, L = 4, R = 4;
  const iw = W - L - R;
  const x = (s) => L + (s / totalSec) * iw;
  const segs = segments.map((s) => {
    const w = Math.max(1, x(s.end) - x(s.start));
    const slow = times[s.q] > threshold;
    const txt = w > 22 ? `<text class="seg-label" x="${x(s.start) + w / 2}" y="44" text-anchor="middle">${s.q + 1}</text>` : '';
    return `<rect class="${slow ? 'seg slow' : 'seg'}" tabindex="0" x="${x(s.start)}" y="20" width="${w}" height="38" rx="3"
      data-tip="${esc(`Q${s.q + 1}: ${formatClock(s.start)} → ${formatClock(s.end)} (${formatClock(s.end - s.start)})`)}"/>${txt}`;
  }).join('');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => `<text class="axis" x="${x(f * totalSec)}" y="${H - 8}" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}">${formatClock(f * totalSec)}</text>`).join('');
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Timeline of which question you were on">${segs}${ticks}</svg></figure>`;
}
