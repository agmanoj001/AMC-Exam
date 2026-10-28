// Mini-lessons on two equations with two unknowns, told with a balance scale.
// Each step lists what sits on the left and right pans. Items: 'x' (circle),
// 'y' (square), or a number (a weight). Items marked { remove: true } fade out.
// A step with tips: true is deliberately unbalanced to show a mistake.

export const LESSONS = [
  {
    id: 'substitution',
    title: 'Substitution: swap one thing for another',
    values: { x: 4, y: 6 },
    steps: [
      { left: [5], right: [2, 3], eq: ['5 = 2 + 3'],
        text: 'A balance scale stays level when both sides weigh the same. That is exactly what an equals sign means!' },
      { left: ['x', 'y'], right: [10], eq: ['x + y = 10'],
        text: 'Now some weights are mysteries. A circle weighs x and a square weighs y. This scale says x + y = 10.' },
      { left: ['y'], right: ['x', 2], eq: ['x + y = 10', 'y = x + 2'],
        text: 'A second scale gives a clue: one square balances one circle plus 2. So y = x + 2.' },
      { left: ['x', 'x', 2], right: [10], eq: ['x + (x + 2) = 10'],
        text: 'Substitution means swapping. The square weighs the same as "circle + 2", so on the first scale we swap the square for a circle and a 2. Still level!' },
      { left: ['x', 'x'], right: [10], eq: ['2x ≠ 10 ?'], tips: true,
        text: 'Watch out: what if we take the 2 off only the left side? The scale tips! Whatever you do to one side, you must do to the other.' },
      { left: ['x', 'x'], right: [8], eq: ['2x = 8'],
        text: 'Let’s do it right: take 2 off BOTH sides. 10 − 2 = 8, and the scale is level again.' },
      { left: ['x'], right: [4], eq: ['x = 4'],
        text: 'Two circles weigh 8, so cut both sides in half: one circle weighs 4. We found x = 4!' },
      { left: [4, 6], right: [10], eq: ['x = 4', 'y = x + 2 = 6', 'Check: 4 + 6 = 10 ✓'],
        text: 'Now use the clue y = x + 2 to get y = 6. Always check in the first equation: 4 + 6 = 10. It balances!' },
      { left: [4, 6], right: [10], eq: ['1. Get one letter alone', '2. Swap it into the other equation', '3. Solve for the letter that’s left', '4. Plug back in', '5. Check!'],
        text: 'The substitution recipe. It works best when one equation already says "y = …" or "x = …".' },
    ],
  },
  {
    id: 'elimination',
    title: 'Elimination: take away matching pieces',
    values: { x: 4, y: 3 },
    steps: [
      { left: ['x', 'x', 'y'], right: [11], eq: ['Scale A: 2x + y = 11'],
        text: 'Scale A: two circles and a square balance 11. So 2x + y = 11.' },
      { left: ['x', 'y'], right: [7], eq: ['Scale A: 2x + y = 11', 'Scale B: x + y = 7'],
        text: 'Scale B: one circle and one square balance 7. So x + y = 7.' },
      { left: ['x', { item: 'x', remove: true }, { item: 'y', remove: true }], right: [4, { item: 7, remove: true }], eq: ['2x + y = 11', '− (x + y = 7)'],
        text: 'Big idea: Scale B tells us "circle + square" weighs exactly 7. So from Scale A we can take away a circle and a square on the left, and 7 on the right (think of the 11 as 4 + 7). Same weight off both sides!' },
      { left: ['x'], right: [4], eq: ['(2x + y) − (x + y) = 11 − 7', 'x = 4'],
        text: 'The square is eliminated — it’s gone! What’s left: one circle balances 4. That’s elimination: subtract one equation from the other.' },
      { left: ['y'], right: [3], eq: ['x = 4', '4 + y = 7, so y = 3'],
        text: 'Put x = 4 into Scale B: 4 + y = 7, so y = 3. Check Scale A: 4 + 4 + 3 = 11 ✓' },
      { left: ['x', 'x', 'y', 'y'], right: [14], eq: ['x + y = 7', '× 2: 2x + 2y = 14'],
        text: 'Sometimes the pieces don’t match yet. Then copy a whole scale: two copies of Scale B still balance, so 2x + 2y = 14. Multiply EVERY part of the equation.' },
      { left: ['x', 'y'], right: [7], eq: ['1. Line up the equations', '2. Make one letter match (multiply if needed)', '3. Subtract (or add) to make it vanish', '4. Solve, plug back in', '5. Check!'],
        text: 'The elimination recipe. It shines when both equations have the same amount of one letter.' },
    ],
  },
];

export function getLesson(id) {
  return LESSONS.find((l) => l.id === id) ?? null;
}

const norm = (it) => (typeof it === 'object' && it !== null ? it : { item: it, remove: false });

/** Weight of a pan, counting only items that are not being removed. */
export function panWeight(items, values) {
  return items.map(norm).filter((i) => !i.remove).reduce((s, i) => s + (typeof i.item === 'number' ? i.item : values[i.item]), 0);
}

/** Beam angle in degrees: positive = right side down. Capped so it stays readable. */
export function tiltDegrees(step, values) {
  const diff = panWeight(step.right, values) - panWeight(step.left, values);
  return Math.max(-12, Math.min(12, diff * 3));
}

// ---------- SVG rendering (browser only) ----------
const PIVOT = { x: 260, y: 90 };
const ARM = 170;

function itemSVG(it, i, count) {
  const { item, remove } = norm(it);
  const perRow = 4;
  const row = Math.floor(i / perRow);
  const inRow = Math.min(perRow, count - row * perRow);
  const col = i % perRow;
  const size = 40;
  const cx = (col - (inRow - 1) / 2) * (size + 6);
  const cy = -24 - row * (size + 4);
  const cls = `scale-item${remove ? ' leaving' : ''}`;
  if (item === 'x') {
    return `<g class="${cls}"><circle class="shape-x" cx="${cx}" cy="${cy}" r="${size / 2}"/><text class="item-label" x="${cx}" y="${cy + 7}" text-anchor="middle">x</text></g>`;
  }
  if (item === 'y') {
    return `<g class="${cls}"><rect class="shape-y" x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" rx="6"/><text class="item-label" x="${cx}" y="${cy + 7}" text-anchor="middle">y</text></g>`;
  }
  return `<g class="${cls}"><path class="shape-w" d="M${cx - 16},${cy + 20} L${cx + 16},${cy + 20} L${cx + 12},${cy - 16} L${cx - 12},${cy - 16} Z"/><text class="item-label weight" x="${cx}" y="${cy + 10}" text-anchor="middle">${item}</text></g>`;
}

export function panItemsSVG(items) {
  return items.map((it, i) => itemSVG(it, i, items.length)).join('');
}

export function scaleSkeletonSVG() {
  const { x, y } = PIVOT;
  const pan = (side) => {
    const px = side === 'left' ? x - ARM : x + ARM;
    return `<g class="pan" data-pan="${side}"><g transform="translate(${px},${y})">
      <line class="string" x1="0" y1="0" x2="-62" y2="70"/><line class="string" x1="0" y1="0" x2="62" y2="70"/>
      <path class="pan-dish" d="M-74,70 L74,70 L58,84 L-58,84 Z"/>
      <g class="pan-items" transform="translate(0,70)"></g></g></g>`;
  };
  return `<svg class="scale" viewBox="0 0 520 300" role="img" aria-label="Balance scale">
    <path class="stand" d="M${x - 70},290 L${x + 70},290 L${x + 12},${y + 6} L${x - 12},${y + 6} Z"/>
    <g class="beam"><rect class="beam-bar" x="${x - ARM - 8}" y="${y - 6}" width="${2 * ARM + 16}" height="12" rx="6"/></g>
    <circle class="pivot" cx="${x}" cy="${y}" r="10"/>
    ${pan('left')}${pan('right')}
    <text class="tilt-note" x="${x}" y="30" text-anchor="middle"></text>
  </svg>`;
}

/** Update an already-rendered scale so CSS transitions animate the change. */
export function applyStep(svg, step, values) {
  const deg = tiltDegrees(step, values);
  const dy = ARM * Math.sin((deg * Math.PI) / 180);
  svg.querySelector('.beam').style.transform = `rotate(${deg}deg)`;
  svg.querySelector('[data-pan="left"]').style.transform = `translateY(${-dy}px)`;
  svg.querySelector('[data-pan="right"]').style.transform = `translateY(${dy}px)`;
  svg.querySelector('[data-pan="left"] .pan-items').innerHTML = panItemsSVG(step.left);
  svg.querySelector('[data-pan="right"] .pan-items').innerHTML = panItemsSVG(step.right);
  svg.querySelector('.tilt-note').textContent = deg === 0 ? 'Balanced ✓' : 'Tipping!';
  svg.classList.toggle('tipping', deg !== 0);
}
