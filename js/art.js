// Small helpers that return SVG markup strings for scene art.
// All scenes use a 1600x900 coordinate space.

// Deterministic random numbers so scenes look the same on every load.
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Conifer. (x, y) is the base of the trunk, h the total height.
function pine(x, y, h, color, trunk = '#3b2a1e') {
  let svg = `<rect x="${x - h * 0.03}" y="${y - h * 0.14}" width="${h * 0.06}" height="${h * 0.14}" fill="${trunk}"/>`;
  for (let i = 0; i < 3; i++) {
    const top = y - h + i * h * 0.25;
    const base = top + h * 0.42;
    const half = h * (0.12 + i * 0.07);
    svg += `<polygon points="${x},${top} ${x - half},${base} ${x + half},${base}" fill="${color}"/>`;
  }
  return svg;
}

// Deciduous tree with a round crown.
function leafy(x, y, h, color, trunk = '#4a3322') {
  return `
    <rect x="${x - h * 0.035}" y="${y - h * 0.5}" width="${h * 0.07}" height="${h * 0.5}" fill="${trunk}"/>
    <circle cx="${x - h * 0.17}" cy="${y - h * 0.55}" r="${h * 0.2}" fill="${color}"/>
    <circle cx="${x + h * 0.17}" cy="${y - h * 0.55}" r="${h * 0.2}" fill="${color}"/>
    <circle cx="${x}" cy="${y - h * 0.72}" r="${h * 0.27}" fill="${color}"/>`;
}

// A row of mixed forest, drawn back-to-front.
function treeRow({ seed, count, x0, x1, y0, y1, h0, h1, pineColor, leafColor, trunk }) {
  const rand = seededRandom(seed);
  const trees = [];
  for (let i = 0; i < count; i++) {
    trees.push({
      x: x0 + rand() * (x1 - x0),
      y: y0 + rand() * (y1 - y0),
      h: h0 + rand() * (h1 - h0),
      isPine: rand() < 0.55,
    });
  }
  trees.sort((a, b) => a.y - b.y);
  return trees
    .map((t) => (t.isPine ? pine(t.x, t.y, t.h, pineColor, trunk) : leafy(t.x, t.y, t.h, leafColor, trunk)))
    .join('');
}

// Village house. (x, groundY) is the bottom-left corner.
function house(x, groundY, w, h, wall, roof, { chimney = false } = {}) {
  const top = groundY - h;
  const ridge = top - h * 0.7;
  let svg = '';
  if (chimney) {
    const cw = w * 0.12;
    const cx = x + w * 0.68;
    const cy = ridge + h * 0.08;
    svg += `<rect x="${cx}" y="${cy}" width="${cw}" height="${h * 0.5}" fill="#5a4a42"/>`;
    svg += smoke(cx + cw / 2, cy - 6);
  }
  svg += `
    <rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${wall}"/>
    <rect x="${x}" y="${top}" width="${w}" height="${h * 0.12}" fill="rgba(0,0,0,0.18)"/>
    <polygon points="${x - 12},${top} ${x + w / 2},${ridge} ${x + w + 12},${top}" fill="${roof}"/>
    <rect x="${x + w * 0.4}" y="${groundY - h * 0.55}" width="${w * 0.2}" height="${h * 0.55}" fill="#4a2f1c"/>
    <rect class="window" x="${x + w * 0.12}" y="${top + h * 0.3}" width="${w * 0.18}" height="${w * 0.18}" fill="#ffd977"/>
    <rect class="window" x="${x + w * 0.7}" y="${top + h * 0.3}" width="${w * 0.18}" height="${w * 0.18}" fill="#ffd977"/>`;
  return svg;
}

// Rising chimney smoke at (x, y).
function smoke(x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <g class="smoke" fill="#b9b4c4">
        <circle r="10"/><circle r="10"/><circle r="10"/>
      </g>
    </g>`;
}

// Wooden signpost. (x, groundY) is the foot of the post.
function signpost(x, groundY, text, { width = 170 } = {}) {
  const boardY = groundY - 120;
  return `
    <rect x="${x - 6}" y="${boardY}" width="12" height="120" fill="#5b3d22"/>
    <rect x="${x - width / 2}" y="${boardY}" width="${width}" height="46" rx="5" fill="#c9a46a" stroke="#5b3d22" stroke-width="4"/>
    <text class="sign-text" x="${x}" y="${boardY + 31}" font-size="26" text-anchor="middle">${text}</text>`;
}
