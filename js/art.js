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
function treeRow({ seed, count, x0, x1, y0, y1, h0, h1, pineColor, leafColor, trunk, pineShare = 0.55 }) {
  const rand = seededRandom(seed);
  const trees = [];
  for (let i = 0; i < count; i++) {
    trees.push({
      x: x0 + rand() * (x1 - x0),
      y: y0 + rand() * (y1 - y0),
      h: h0 + rand() * (h1 - h0),
      isPine: rand() < pineShare,
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

// Escape text for use inside SVG markup (element text or attribute values).
function escapeXml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Wooden signpost. (x, groundY) is the foot of the post.
function signpost(x, groundY, text, { width = 170 } = {}) {
  const boardY = groundY - 120;
  return `
    <rect x="${x - 6}" y="${boardY}" width="12" height="120" fill="#5b3d22"/>
    <rect x="${x - width / 2}" y="${boardY}" width="${width}" height="46" rx="5" fill="#c9a46a" stroke="#5b3d22" stroke-width="4"/>
    <text class="sign-text" x="${x}" y="${boardY + 31}" font-size="26" text-anchor="middle">${escapeXml(text)}</text>`;
}

// Clickable signpost exit with a hover label. (x, groundY) is the foot of the post.
function signExit(target, x, groundY, text, label, { width = 200 } = {}) {
  return `
  <g class="exit" data-goto="${escapeXml(target)}" tabindex="0" role="button" aria-label="${escapeXml(label)}">
    <rect x="${x - width / 2 - 20}" y="${groundY - 140}" width="${width + 40}" height="150" fill="transparent"/>
    ${signpost(x, groundY, text, { width })}
    <g class="exit-label">
      <rect x="${x - 130}" y="${groundY - 190}" width="260" height="40" rx="6" fill="rgba(14,16,32,0.8)" stroke="#e0b44a"/>
      <text x="${x}" y="${groundY - 163}" font-size="22" text-anchor="middle" fill="#f3ecd8">${escapeXml(label)}</text>
    </g>
  </g>`;
}

// Fern fronds fanning out from (x, y).
function fern(x, y, s, color) {
  let d = '';
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.36;
    const ex = x + Math.sin(a) * 70 * s;
    const ey = y - Math.cos(a) * 60 * s;
    d += `M${x},${y} Q${x + Math.sin(a) * 25 * s},${y - 55 * s} ${ex.toFixed(1)},${ey.toFixed(1)} `;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${(7 * s).toFixed(1)}" stroke-linecap="round"/>`;
}

// Mossy boulder. (x, y) is the bottom centre.
function rock(x, y, w, h, color, moss = '#4f6b3a') {
  return `
    <ellipse cx="${x}" cy="${y}" rx="${w * 0.55}" ry="${h * 0.12}" fill="rgba(0,0,0,0.3)"/>
    <path d="M${x - w / 2},${y} C${x - w / 2},${y - h * 0.7} ${x - w * 0.2},${y - h} ${x + w * 0.05},${y - h}
             C${x + w * 0.35},${y - h} ${x + w / 2},${y - h * 0.6} ${x + w / 2},${y} Z" fill="${color}"/>
    <path d="M${x - w * 0.3},${y - h * 0.82} C${x - w * 0.1},${y - h * 1.02} ${x + w * 0.2},${y - h * 1.02} ${x + w * 0.36},${y - h * 0.75}
             C${x + w * 0.1},${y - h * 0.85} ${x - w * 0.1},${y - h * 0.8} ${x - w * 0.3},${y - h * 0.82} Z" fill="${moss}"/>`;
}

// Tree stump. (x, y) is the bottom centre.
function stump(x, y) {
  return `
    <ellipse cx="${x}" cy="${y + 4}" rx="62" ry="12" fill="rgba(0,0,0,0.3)"/>
    <path d="M${x - 40},${y - 52} L${x - 44},${y - 6} Q${x - 52},${y + 2} ${x - 60},${y + 6} L${x + 60},${y + 6}
             Q${x + 52},${y + 2} ${x + 44},${y - 6} L${x + 40},${y - 52} Z" fill="#5a4330"/>
    <path d="M${x - 20},${y - 46} L${x - 22},${y} M${x + 14},${y - 44} L${x + 16},${y - 2}" stroke="#46331f" stroke-width="4"/>
    <ellipse cx="${x}" cy="${y - 52}" rx="40" ry="12" fill="#a07c55"/>
    <ellipse cx="${x}" cy="${y - 52}" rx="26" ry="7" fill="none" stroke="#7d5d3c" stroke-width="2"/>
    <ellipse cx="${x}" cy="${y - 52}" rx="11" ry="3" fill="none" stroke="#7d5d3c" stroke-width="2"/>
    <path d="M${x - 46},${y + 4} q8,-18 22,-8 q8,-12 20,-2 l2,12 Z" fill="#4f6b3a"/>`;
}

// Axe with its blade buried in the top of a stump standing at (x, y).
function axeInStump(x, y) {
  return `
    <rect x="${x - 50}" y="${y - 160}" width="130" height="170" fill="transparent"/>
    <line x1="${x + 2}" y1="${y - 66}" x2="${x + 64}" y2="${y - 152}" stroke="#7a5230" stroke-width="9" stroke-linecap="round"/>
    <line x1="${x + 6}" y1="${y - 72}" x2="${x + 60}" y2="${y - 146}" stroke="#a0754a" stroke-width="2.5" stroke-linecap="round"/>
    <polygon points="${x - 26},${y - 50} ${x + 18},${y - 52} ${x + 16},${y - 76} ${x - 4},${y - 84} ${x - 30},${y - 70}"
             fill="#aab4bc" stroke="#4a4f55" stroke-width="2" stroke-linejoin="round"/>
    <path d="M${x - 28},${y - 54} L${x - 30},${y - 68}" stroke="#eef3f6" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(${x - 26} ${y - 72})">
      <g class="glint"><path d="M0,-14 L2.5,-2.5 L14,0 L2.5,2.5 L0,14 L-2.5,2.5 L-14,0 L-2.5,-2.5 Z" fill="#fff"/></g>
    </g>`;
}

// Werewolf in side view, facing right, feet at (0, 0), about 260 units tall.
// Parts carry data-part="tail" or data-part="body" so clicks can tell them apart.
// Limbs are inner <g>s positioned by an outer <g> so CSS can swing them.
function werewolf() {
  const fur = '#3d342e';
  const dark = '#29221e';
  const light = '#7a6a5c';
  const limb = (x, y, cls, d, color, w) => `
      <g transform="translate(${x} ${y})"><g class="${cls}">
        <path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
      </g></g>`;
  return `
  <g class="wolf-body">
    <g transform="translate(-28 -108)">
      <g class="wolf-tail" data-part="tail">
        <ellipse cx="-72" cy="6" rx="88" ry="46" fill="transparent"/>
        <path d="M0,-10 C-42,-34 -92,-34 -140,-4 C-118,-4 -104,2 -96,8 C-116,16 -126,28 -134,44 C-92,28 -52,16 -2,12 Z" fill="${fur}"/>
        <path d="M-140,-4 C-118,-4 -104,2 -96,8 C-116,16 -126,28 -134,44 C-124,24 -126,8 -140,-4 Z" fill="${light}"/>
      </g>
    </g>
    <g data-part="body">
      ${limb(-6, -105, 'wolf-leg back', 'M0,0 L14,45 L-6,85 L18,105', dark, 20)}
      ${limb(10, -186, 'wolf-arm back', 'M0,0 L16,44 L44,64', dark, 15)}
      <ellipse cx="12" cy="-150" rx="46" ry="64" transform="rotate(25 12 -150)" fill="${fur}"/>
      <polygon fill="${dark}" points="-24,-170 -40,-186 -18,-190 -30,-212 -4,-206 -8,-232 14,-216 18,-242 32,-218 44,-236 46,-212 30,-190"/>
      <polygon fill="${fur}" points="46,-226 42,-260 60,-232"/>
      <polygon fill="${fur}" points="54,-230 58,-264 72,-230"/>
      <polygon fill="#6a4a44" points="57,-234 59,-254 66,-232"/>
      <ellipse cx="60" cy="-214" rx="28" ry="22" fill="${fur}"/>
      <polygon fill="${fur}" points="74,-228 122,-215 119,-204 78,-198"/>
      <polygon fill="#6a1c1c" points="80,-202 116,-206 112,-198 82,-195"/>
      <polygon fill="#f1ead8" points="92,-204 95,-197 98,-205 104,-205 106,-199 109,-206"/>
      <polygon fill="${dark}" points="80,-196 112,-198 104,-188 82,-187"/>
      <circle cx="120" cy="-211" r="4.5" fill="#0d0b0a"/>
      <ellipse class="wolf-eye" cx="76" cy="-220" rx="5" ry="2.8" fill="#ffcf4a"/>
      <g class="wolf-ruby">
        <polygon points="54,-172 64,-160 54,-148 44,-160" fill="#d8283f"/>
        <polygon points="54,-172 64,-160 54,-160" fill="#ff7084"/>
      </g>
      ${limb(6, -105, 'wolf-leg', 'M0,0 L14,45 L-6,85 L18,105', fur, 22)}
      ${limb(22, -184, 'wolf-arm', 'M0,0 L16,44 L44,64', fur, 16)}
      <polygon fill="#e9e1cc" points="64,-124 76,-114 66,-118 70,-108 62,-116"/>
    </g>
  </g>`;
}

// Front-facing close-up of the werewolf for the ruby minigame.
// The ruby (.mg-ruby-target) is what the player must hit.
function werewolfCloseUp() {
  const fur = '#3d342e';
  const dark = '#29221e';
  const light = '#5e5047';
  const arm = `
        <path d="M0,0 C-60,40 -100,130 -110,240 L-70,246 C-58,150 -28,80 24,40 Z" fill="${fur}"/>
        <polygon fill="#e9e1cc" points="-112,236 -124,276 -102,246 -96,242 -100,282 -86,248 -80,244 -76,280 -70,246"/>`;
  const crack = (d) => `<path class="mg-crack" d="${d}" fill="none" stroke="#fff4f4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Varulven på nära håll">
  <defs>
    <filter id="mg-blur" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="20"/></filter>
    <filter id="mg-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <g class="no-hit">
    <rect x="120" y="0" width="70" height="900" fill="#1a231e"/>
    <rect x="340" y="0" width="40" height="900" fill="#222d27"/>
    <rect x="1250" y="0" width="50" height="900" fill="#222d27"/>
    <rect x="1420" y="0" width="80" height="900" fill="#1a231e"/>
    <g filter="url(#mg-blur)" fill="#c9d2ce" opacity="0.25">
      <ellipse cx="400" cy="760" rx="500" ry="70"/>
      <ellipse cx="1200" cy="720" rx="520" ry="80"/>
    </g>
  </g>

  <g class="mg-wolf" transform="translate(800 90)">
    <g class="mg-wolf-body">
      <g transform="translate(-150 350)"><g class="mg-arm">${arm}</g></g>
      <g transform="translate(150 350) scale(-1 1)"><g class="mg-arm right">${arm}</g></g>

      <path fill="${fur}" d="M-160,330 C-210,520 -160,720 -120,900 L120,900 C160,720 210,520 160,330 C90,295 -90,295 -160,330 Z"/>
      <polygon fill="${fur}" points="-150,320 -196,316 -168,346 -206,362 -170,380"/>
      <polygon fill="${fur}" points="150,320 196,316 168,346 206,362 170,380"/>
      <path fill="${light}" d="M-90,350 C-40,330 40,330 90,350 C95,480 55,580 0,630 C-55,580 -95,480 -90,350 Z"/>
      <path d="M-60,560 l-12,30 M-30,600 l-6,28 M30,600 l6,28 M60,560 l12,30" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>
      <polygon fill="${fur}" points="-72,250 72,250 114,340 -114,340"/>

      <polygon fill="${fur}" points="-102,172 -72,36 -24,128"/>
      <polygon fill="${fur}" points="102,172 72,36 24,128"/>
      <polygon fill="#6a4a44" points="-86,150 -70,72 -42,134"/>
      <polygon fill="#6a4a44" points="86,150 70,72 42,134"/>
      <ellipse cx="0" cy="196" rx="108" ry="92" fill="${fur}"/>
      <polygon fill="${fur}" points="-104,200 -142,238 -102,236 -124,272 -78,256"/>
      <polygon fill="${fur}" points="104,200 142,238 102,236 124,272 78,256"/>
      <polygon fill="${dark}" points="-78,146 -14,170 -18,182 -80,160"/>
      <polygon fill="${dark}" points="78,146 14,170 18,182 80,160"/>
      <g class="mg-eyes" filter="url(#mg-glow)">
        <ellipse cx="-46" cy="182" rx="18" ry="10" fill="#ffcf4a"/>
        <ellipse cx="46" cy="182" rx="18" ry="10" fill="#ffcf4a"/>
      </g>
      <ellipse cx="-46" cy="182" rx="3" ry="9" fill="#1a1208"/>
      <ellipse cx="46" cy="182" rx="3" ry="9" fill="#1a1208"/>
      <ellipse cx="0" cy="250" rx="56" ry="44" fill="${light}"/>
      <ellipse cx="0" cy="222" rx="20" ry="13" fill="#111"/>
      <path d="M-44,262 Q0,312 44,262 Q0,284 -44,262 Z" fill="#4a1414"/>
      <polygon fill="#f1ead8" points="-36,266 -29,288 -22,271 22,271 29,288 36,266"/>

      <g transform="translate(0 460)">
        <g class="mg-ruby">
          <circle r="58" fill="#2a211c" stroke="#b39a5e" stroke-width="6"/>
          <g filter="url(#mg-glow)">
            <polygon points="0,-48 40,0 0,48 -40,0" fill="#d8283f"/>
          </g>
          <polygon points="0,-48 40,0 0,0" fill="#ff7084"/>
          <polygon points="0,0 0,48 -40,0" fill="#8e1426"/>
          <polygon points="-8,-30 -20,-12 -12,-12" fill="#ffd6dc"/>
          ${crack('M-4,-40 L4,-18 L-8,-4 L2,12')}
          ${crack('M30,-6 L12,4 L18,20 L4,34')}
          ${crack('M-30,4 L-12,10 L-18,26 L-2,40')}
          <circle class="mg-ruby-target" r="74" fill="transparent"/>
        </g>
      </g>
    </g>
  </g>

  <g class="mg-fx no-hit"></g>
</svg>`;
}

// ---------- The lake ----------

// Red boathouse with its gable facing the viewer. (x, groundY) is the bottom-left corner.
function boathouse(x, groundY, w, h) {
  const top = groundY - h;
  const ridge = top - h * 0.55;
  let boards = '';
  for (let i = 1; i < 10; i++) boards += `M${x + (w * i) / 10},${top} L${x + (w * i) / 10},${groundY} `;
  const dw = w * 0.5;
  const dx = x + (w - dw) / 2;
  const dh = h * 0.72;
  return `
    <rect x="${x}" y="${top}" width="${w}" height="${h}" fill="#9b2f24"/>
    <path d="${boards}" stroke="#7e2219" stroke-width="3"/>
    <polygon points="${x},${top} ${x + w / 2},${ridge} ${x + w},${top}" fill="#9b2f24"/>
    <rect x="${x + w / 2 - 18}" y="${ridge + h * 0.2}" width="36" height="30" fill="#26303a" stroke="#efe9dc" stroke-width="5"/>
    <polyline points="${x - 16},${top + 6} ${x + w / 2},${ridge - 6} ${x + w + 16},${top + 6}" fill="none" stroke="#3a3436" stroke-width="18" stroke-linejoin="round"/>
    <polyline points="${x - 4},${top + 6} ${x + w / 2},${ridge + 6} ${x + w + 4},${top + 6}" fill="none" stroke="#efe9dc" stroke-width="5"/>
    <rect x="${x}" y="${top}" width="8" height="${h}" fill="#efe9dc"/>
    <rect x="${x + w - 8}" y="${top}" width="8" height="${h}" fill="#efe9dc"/>
    <rect x="${dx}" y="${groundY - dh}" width="${dw}" height="${dh}" fill="#7e2219" stroke="#efe9dc" stroke-width="5"/>
    <path d="M${dx + dw / 2},${groundY - dh} L${dx + dw / 2},${groundY}
             M${dx},${groundY - dh} L${dx + dw / 2},${groundY} L${dx + dw},${groundY - dh}" stroke="#efe9dc" stroke-width="4" fill="none"/>
    <rect x="${x - 6}" y="${groundY - 6}" width="${w + 12}" height="10" fill="#4a3a2c"/>`;
}

// Paper note nailed to a wall, with scribbles and a little squid doodle.
// (x, y) is the nail at the top centre.
function pinnedNote(x, y) {
  return `
    <rect x="${x - 34}" y="${y - 14}" width="68" height="90" fill="transparent"/>
    <g transform="rotate(-5 ${x} ${y})">
      <path d="M${x - 24},${y - 4} L${x + 24},${y - 4} L${x + 24},${y + 52} L${x + 16},${y + 62} L${x - 24},${y + 62} Z" fill="#efe6cf" stroke="#b9a986" stroke-width="1.5"/>
      <path d="M${x + 24},${y + 52} L${x + 16},${y + 52} L${x + 16},${y + 62} Z" fill="#cfc2a2"/>
      <path d="M${x - 17},${y + 8} l30,0 M${x - 17},${y + 15} l24,0 M${x - 17},${y + 22} l32,0 M${x - 17},${y + 29} l20,0"
            stroke="#5a4a3a" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="${x - 6}" cy="${y + 41}" rx="7" ry="5" fill="none" stroke="#7a3b3b" stroke-width="1.8"/>
      <path d="M${x - 11},${y + 45} l-2,8 M${x - 7},${y + 46} l0,8 M${x - 3},${y + 46} l1,8 M${x + 1},${y + 44} l3,7"
            stroke="#7a3b3b" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M${x - 6},${y + 37} l-2.5,3 l2.5,3 l2.5,-3 Z" fill="#d8283f"/>
    </g>
    <circle cx="${x}" cy="${y}" r="3" fill="#4a4f55"/>`;
}

// Rowboat in side view, bow to the right. (x, y) is the middle of the waterline.
function rowboat(x, y) {
  const hull = 'M-140,-36 L140,-36 C132,-14 120,0 106,4 L-106,4 C-122,0 -134,-14 -140,-36 Z';
  return `
  <g transform="translate(${x} ${y})">
    <g transform="translate(0 8) scale(1 -1)" opacity="0.25"><path d="${hull}" fill="#7a5232"/></g>
    <line x1="-30" y1="-46" x2="-120" y2="10" stroke="#b08a5a" stroke-width="6" stroke-linecap="round"/>
    <path d="${hull}" fill="#7a5232"/>
    <path d="M-140,-36 L140,-36 L136,-27 L-136,-27 Z" fill="#e8e0cc"/>
    <path d="M-126,-12 L128,-12" stroke="#5e3d22" stroke-width="3"/>
    <path d="M140,-36 L150,-50" stroke="#5e3d22" stroke-width="6" stroke-linecap="round"/>
    <line x1="30" y1="-46" x2="120" y2="12" stroke="#c39a66" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="124" cy="14" rx="18" ry="6" fill="#c39a66" transform="rotate(32 124 14)"/>
  </g>`;
}

// Fishing rod leaning against a wall. (x, y) is the butt of the rod on the ground.
function rodLeaning(x, y) {
  return `
    <rect x="${x - 30}" y="${y - 240}" width="110" height="250" fill="transparent"/>
    <line x1="${x}" y1="${y}" x2="${x + 46}" y2="${y - 228}" stroke="#5b3d22" stroke-width="7" stroke-linecap="round"/>
    <line x1="${x + 24}" y1="${y - 110}" x2="${x + 46}" y2="${y - 228}" stroke="#a0754a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${x + 9}" cy="${y - 46}" r="11" fill="#3e4a52" stroke="#1f262b" stroke-width="2"/>
    <path d="M${x + 46},${y - 228} Q${x + 58},${y - 170} ${x + 60},${y - 120}" fill="none" stroke="#e8e8e8" stroke-width="1.5" opacity="0.8"/>
    <path d="M${x + 52},${y - 128} a8,8 0 0 0 16,0 Z" fill="#f4f1e8"/>
    <path d="M${x + 52},${y - 128} a8,8 0 0 1 16,0 Z" fill="#d8283f"/>
    <path d="M${x + 60},${y - 120} l0,14 q0,8 -7,6" fill="none" stroke="#cfd6dc" stroke-width="2.5" stroke-linecap="round"/>`;
}

// Harpoon lying on the dock with a coil of rope. (x, y) is the middle of the shaft.
function harpoonLying(x, y) {
  return `
    <rect x="${x - 120}" y="${y - 50}" width="240" height="90" fill="transparent"/>
    <ellipse cx="${x - 70}" cy="${y + 14}" rx="34" ry="12" fill="none" stroke="#c9b48a" stroke-width="6"/>
    <ellipse cx="${x - 70}" cy="${y + 12}" rx="22" ry="7" fill="none" stroke="#b39d72" stroke-width="5"/>
    <line x1="${x - 100}" y1="${y + 14}" x2="${x + 70}" y2="${y - 16}" stroke="#7a5230" stroke-width="8" stroke-linecap="round"/>
    <line x1="${x - 96}" y1="${y + 11}" x2="${x + 66}" y2="${y - 18}" stroke="#a0754a" stroke-width="2.5" stroke-linecap="round"/>
    <g transform="translate(${x + 70} ${y - 16}) rotate(-10)">
      <polygon points="0,-4 34,-3 56,0 34,3 0,4" fill="#aab4bc" stroke="#4a4f55" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="30,-3 18,-14 24,-3" fill="#aab4bc" stroke="#4a4f55" stroke-width="1.5"/>
      <polygon points="30,3 18,14 24,3" fill="#aab4bc" stroke="#4a4f55" stroke-width="1.5"/>
      <g transform="translate(46 0)"><g class="glint"><path d="M0,-12 L2.2,-2.2 L12,0 L2.2,2.2 L0,12 L-2.2,2.2 L-12,0 L-2.2,-2.2 Z" fill="#fff"/></g></g>
    </g>`;
}

// A tentacle that now and then curls up out of the water far out on the lake.
// Needs a clipPath with id="<clipId>" that hides everything below y = 0.
function tentaclePeek(x, y, clipId) {
  return `
  <g transform="translate(${x} ${y})">
    <g clip-path="url(#${clipId})">
      <g class="tentacle-peek">
        <path d="M-10,10 C-14,-20 -6,-50 12,-62 C26,-70 34,-56 26,-48 C18,-42 12,-50 16,-54 C4,-46 4,-20 10,10 Z" fill="#4a2f4c"/>
      </g>
    </g>
    <g class="peek-rings" fill="none" stroke="#c8d3ea" stroke-width="2">
      <ellipse rx="26" ry="5"/><ellipse rx="44" ry="8" opacity="0.6"/>
    </g>
  </g>`;
}

// The giant squid seen from above as a shadow under the water, swimming towards +x.
// (0, 0) is its middle. Needs the blur filter with id="<filterId>".
function squidShadow(filterId) {
  let arms = '';
  for (let i = 0; i < 8; i++) {
    const spread = (i - 3.5) * 9;
    arms += `<path d="M-40,${spread * 0.4} C-80,${spread * 0.9} -120,${spread * 1.4} -${150 + (i % 3) * 18},${spread * 1.7}"/>`;
  }
  return `
  <g filter="url(#${filterId})">
    <g class="squid-arms" fill="none" stroke="#0b1521" stroke-width="9" stroke-linecap="round">${arms}</g>
    <ellipse cx="-30" cy="0" rx="26" ry="22" fill="#0b1521"/>
    <ellipse cx="50" cy="0" rx="80" ry="28" fill="#0b1521"/>
    <polygon points="110,0 140,-26 150,0 140,26" fill="#0b1521"/>
  </g>
  <circle class="squid-glow" cx="-28" cy="0" r="7" fill="#ff3a55"/>`;
}

// Red and white fishing float. (0, 0) is the waterline.
function bobber() {
  return `
    <g class="bobber-ring" fill="none" stroke="#d7e3ee" stroke-width="2"><ellipse rx="24" ry="6"/></g>
    <g class="bobber-float">
      <path d="M-11,-2 a11,11 0 0 0 22,0 Z" fill="#f4f1e8"/>
      <path d="M-11,-2 a11,11 0 0 1 22,0 Z" fill="#d8283f"/>
      <line x1="0" y1="-13" x2="0" y2="-28" stroke="#222" stroke-width="2.5"/>
    </g>`;
}

// The giant squid rising out of the lake, for the harpoon minigame.
// The squid (.mg-squid) is moved by lake.js; (0, 0) is its middle at the waterline.
// The ruby (.mg-ruby-target) is what the player must hit, and the water in
// front (.mg-water) catches throws that miss.
function giantSquidCloseUp() {
  const skin = '#7a4b78';
  const dark = '#55304f';
  const light = '#a87aa0';
  const arm = (d, w) => `<path d="${d}" fill="none" stroke="${skin}" stroke-width="${w}" stroke-linecap="round"/>`;
  const tentacle = `
        <path d="M0,0 C-60,-40 -120,-140 -190,-210" fill="none" stroke="${skin}" stroke-width="22" stroke-linecap="round"/>
        <ellipse cx="-206" cy="-226" rx="34" ry="20" transform="rotate(-48 -206 -226)" fill="${skin}"/>
        <g fill="${light}"><circle cx="-198" cy="-214" r="5"/><circle cx="-214" cy="-232" r="5"/><circle cx="-226" cy="-246" r="4"/></g>`;
  const crack = (d) => `<path class="mg-crack" d="${d}" fill="none" stroke="#fff4f4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  let shimmer = '';
  const rand = seededRandom(77);
  for (let i = 0; i < 26; i++) {
    const sx = rand() * 1600;
    const sy = 640 + rand() * 250;
    const len = 30 + rand() * 70;
    shimmer += `M${sx.toFixed(0)},${sy.toFixed(0)} l${len.toFixed(0)},0 `;
  }
  return `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jättebläckfisken på nära håll">
  <defs>
    <linearGradient id="mgl-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a1d3a"/>
      <stop offset="1" stop-color="#8a7fa8"/>
    </linearGradient>
    <linearGradient id="mgl-water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3f5f86"/>
      <stop offset="1" stop-color="#14243a"/>
    </linearGradient>
    <filter id="mgl-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <g class="no-hit">
    <rect width="1600" height="640" fill="url(#mgl-sky)"/>
    <polygon fill="#4a4d6c" points="0,640 0,580 200,540 380,590 560,560 760,600 1000,550 1200,590 1400,540 1600,580 1600,640"/>
    <polygon fill="#3a3d58" points="1060,640 1200,520 1270,470 1340,520 1480,640"/>
    <polygon fill="#e9ecf5" points="1270,470 1300,496 1286,504 1272,494 1258,506 1244,496"/>
  </g>

  <g class="mg-squid" transform="translate(800 980)">
    <g class="mg-squid-body">
      <g transform="translate(-90 -120)"><g class="mg-tentacle">${tentacle}</g></g>
      <g transform="translate(90 -120) scale(-1 1)"><g class="mg-tentacle right">${tentacle}</g></g>

      ${arm('M-90,-110 C-140,-40 -170,60 -150,200', 30)}
      ${arm('M-50,-100 C-80,-20 -90,90 -70,240', 30)}
      ${arm('M50,-100 C80,-20 90,90 70,240', 30)}
      ${arm('M90,-110 C140,-40 170,60 150,200', 30)}
      ${arm('M-20,-100 C-30,0 -20,120 -10,250', 26)}
      ${arm('M20,-100 C30,0 20,120 10,250', 26)}

      <path fill="${dark}" d="M0,-520 L-130,-420 L-80,-400 L0,-450 L80,-400 L130,-420 Z"/>
      <path fill="${skin}" d="M0,-500 C-64,-500 -100,-420 -104,-330 C-108,-260 -112,-220 -118,-180 L118,-180 C112,-220 108,-260 104,-330 C100,-420 64,-500 0,-500 Z"/>
      <g fill="${dark}" opacity="0.6">
        <ellipse cx="-50" cy="-420" rx="10" ry="7"/><ellipse cx="40" cy="-440" rx="8" ry="6"/>
        <ellipse cx="60" cy="-360" rx="12" ry="8"/><ellipse cx="-70" cy="-340" rx="9" ry="6"/>
        <ellipse cx="10" cy="-390" rx="7" ry="5"/>
      </g>
      <ellipse cx="0" cy="-160" rx="134" ry="74" fill="${skin}"/>
      <path d="M-90,-120 Q0,-80 90,-120" fill="none" stroke="${dark}" stroke-width="5" opacity="0.6"/>
      <g class="mg-eyes" filter="url(#mgl-glow)">
        <circle cx="-84" cy="-170" r="30" fill="#f2e6a0"/>
        <circle cx="84" cy="-170" r="30" fill="#f2e6a0"/>
      </g>
      <rect x="-104" y="-176" width="40" height="12" rx="6" fill="#1a1208"/>
      <rect x="64" y="-176" width="40" height="12" rx="6" fill="#1a1208"/>

      <g transform="translate(0 -262)">
        <g class="mg-ruby">
          <circle r="54" fill="#2a1f2a" stroke="#b39a5e" stroke-width="6"/>
          <g filter="url(#mgl-glow)">
            <polygon points="0,-44 36,0 0,44 -36,0" fill="#d8283f"/>
          </g>
          <polygon points="0,-44 36,0 0,0" fill="#ff7084"/>
          <polygon points="0,0 0,44 -36,0" fill="#8e1426"/>
          <polygon points="-8,-28 -18,-11 -11,-11" fill="#ffd6dc"/>
          ${crack('M-4,-36 L4,-16 L-8,-4 L2,10')}
          ${crack('M28,-6 L11,4 L17,18 L4,30')}
          ${crack('M-28,4 L-11,9 L-17,24 L-2,36')}
          <circle class="mg-ruby-target" r="70" fill="transparent"/>
        </g>
      </g>
    </g>
  </g>

  <g class="mg-water">
    <path d="M0,640 Q50,630 100,640 T200,640 T300,640 T400,640 T500,640 T600,640 T700,640 T800,640 T900,640 T1000,640 T1100,640 T1200,640 T1300,640 T1400,640 T1500,640 T1600,640 L1600,900 L0,900 Z" fill="url(#mgl-water)" opacity="0.9"/>
    <path class="ripples no-hit" d="${shimmer}" stroke="#a9bfdc" stroke-width="3" stroke-linecap="round" opacity="0.35"/>
  </g>

  <path class="mg-line no-hit" d="" fill="none" stroke="#e8e8e8" stroke-width="2" opacity="0.8"/>
  <g class="mg-fx no-hit"></g>
</svg>`;
}

// ---------- The cave ----------

// Cave mouth in the side of the mountain, seen from the village. (x, y) is the bottom centre.
function caveMouth(x, y) {
  return `
    <path d="M${x - 92},${y + 6} C${x - 96},${y - 50} ${x - 70},${y - 104} ${x - 10},${y - 110}
             C${x + 50},${y - 112} ${x + 92},${y - 60} ${x + 96},${y + 6} Z" fill="#3c3d52"/>
    <path d="M${x - 64},${y + 4} C${x - 66},${y - 40} ${x - 44},${y - 80} ${x - 6},${y - 84}
             C${x + 36},${y - 86} ${x + 64},${y - 44} ${x + 66},${y + 4} Z" fill="#07060c"/>
    <path d="M${x - 40},${y + 4} C${x - 38},${y - 30} ${x - 20},${y - 52} ${x},${y - 54}
             C${x + 22},${y - 54} ${x + 40},${y - 28} ${x + 42},${y + 4} Z" fill="#000"/>
    <path d="M${x - 46},${y - 66} l8,20 l6,-16 M${x + 20},${y - 80} l6,22 l7,-18" fill="#3c3d52"/>
    ${rock(x - 104, y + 14, 70, 40, '#4a4c62', '#3e5a33')}
    ${rock(x + 112, y + 16, 84, 46, '#44465c', '#3e5a33')}`;
}

// Burning torch, upright. (0, 0) is the bottom of the handle; the flame tip is near (0, -150).
function torch() {
  return `
    <rect x="-7" y="-96" width="14" height="96" rx="4" fill="#6b4626"/>
    <rect x="-7" y="-96" width="4" height="96" fill="#8a5e36"/>
    <rect x="-11" y="-106" width="22" height="18" rx="3" fill="#4a3a2a"/>
    <path d="M-11,-100 l22,0 M-11,-94 l22,0" stroke="#2a2018" stroke-width="2"/>
    <g transform="translate(0 -106)">
      <g class="flame">
        <path d="M0,-50 C-8,-34 -22,-24 -20,-8 C-18,4 -8,8 0,8 C8,8 18,4 20,-8 C22,-24 8,-30 4,-40 C2,-30 -4,-28 0,-50 Z" fill="#f07a1a"/>
        <path d="M0,-30 C-6,-20 -12,-14 -10,-4 C-8,4 -4,6 0,6 C4,6 8,4 10,-4 C12,-14 4,-20 0,-30 Z" fill="#ffc94a"/>
        <ellipse cx="0" cy="0" rx="5" ry="6" fill="#fff3c0"/>
      </g>
    </g>`;
}

// Torch in an iron bracket on the cave wall. (x, y) is where the bracket is fixed.
function torchOnWall(x, y) {
  return `
    <rect x="${x - 50}" y="${y - 190}" width="100" height="230" fill="transparent"/>
    <circle cx="${x}" cy="${y - 150}" r="120" fill="url(#cave-torchglow)" class="no-hit"/>
    <path d="M${x - 16},${y + 20} L${x + 16},${y + 20} M${x},${y + 20} L${x},${y - 30} M${x - 14},${y - 30} L${x + 14},${y - 30}"
          stroke="#2b2a2e" stroke-width="7" stroke-linecap="round"/>
    <g transform="translate(${x} ${y + 6})">${torch()}</g>`;
}

// Opening into another passage, drawn as a dark arch. (x, y) is the bottom centre.
// It is an exit to `target`; the hover label sits inside the opening, where the torch lights it.
function caveOpening(target, x, y, w, h, label) {
  const l = x - w / 2;
  const r = x + w / 2;
  return `
  <g class="exit" data-goto="${escapeXml(target)}" tabindex="0" role="button" aria-label="${escapeXml(label)}">
    <path d="M${l - 26},${y + 8} C${l - 34},${y - h * 0.6} ${x - w * 0.3},${y - h - 30} ${x},${y - h - 26}
             C${x + w * 0.3},${y - h - 30} ${r + 34},${y - h * 0.6} ${r + 26},${y + 8} Z" fill="#4a4036"/>
    <path d="M${l},${y} C${l - 6},${y - h * 0.6} ${x - w * 0.3},${y - h} ${x},${y - h}
             C${x + w * 0.3},${y - h} ${r + 6},${y - h * 0.6} ${r},${y} Z" fill="#0a0806"/>
    <path d="M${l + w * 0.2},${y} C${l + w * 0.18},${y - h * 0.5} ${x - w * 0.12},${y - h * 0.75} ${x},${y - h * 0.75}
             C${x + w * 0.12},${y - h * 0.75} ${r - w * 0.18},${y - h * 0.5} ${r - w * 0.2},${y} Z" fill="#000"/>
    <g class="exit-label">
      <rect x="${x - 140}" y="${y - h / 2 - 22}" width="280" height="40" rx="6" fill="rgba(14,16,32,0.85)" stroke="#e0b44a"/>
      <text x="${x}" y="${y - h / 2 + 5}" font-size="22" text-anchor="middle" fill="#f3ecd8">${escapeXml(label)}</text>
    </g>
  </g>`;
}

// The way back: a chalk arrow and the word »Tillbaka« on the left wall, which the player drew
// on the way in. Drawn above the darkness so it can always be seen, and kept clear of the
// narration box at the bottom of the screen.
function caveBack(target, label) {
  return `
  <g class="exit cave-back" data-goto="${escapeXml(target)}" tabindex="0" role="button" aria-label="${escapeXml(label)}">
    <rect x="100" y="652" width="300" height="160" fill="transparent"/>
    <g fill="none" stroke="#e6e0d2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.75">
      <path d="M360,706 L150,706 M192,668 L150,706 L192,744"/>
    </g>
    <text class="chalk" x="252" y="790" font-size="36" text-anchor="middle" fill="#e6e0d2" opacity="0.75">Tillbaka</text>
    <g class="exit-label">
      <rect x="110" y="606" width="300" height="40" rx="6" fill="rgba(14,16,32,0.85)" stroke="#e0b44a"/>
      <text x="260" y="633" font-size="22" text-anchor="middle" fill="#f3ecd8">${escapeXml(label)}</text>
    </g>
  </g>`;
}

// Stalactites hanging from the ceiling and stalagmites rising from the floor.
function stalactites(seed, color, { count = 14, y = 0, h0 = 40, h1 = 150, up = false } = {}) {
  const rand = seededRandom(seed);
  let svg = '';
  for (let i = 0; i < count; i++) {
    const x = rand() * 1600;
    const w = 14 + rand() * 30;
    const h = h0 + rand() * (h1 - h0);
    const tip = up ? y - h : y + h;
    svg += `<polygon points="${(x - w).toFixed(0)},${y} ${(x + w).toFixed(0)},${y} ${(x + w * 0.2).toFixed(0)},${tip.toFixed(0)}" fill="${color}"/>`;
  }
  return svg;
}

// A spider web centred at (x, y) with radius r.
function spiderWeb(x, y, r, { spokes = 12, rings = 6, opacity = 0.4, cls = '' } = {}) {
  let d = '';
  const pts = [];
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 + 0.2;
    const k = 0.85 + ((i * 37) % 10) / 33; // uneven spokes
    pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k]);
    d += `M${x},${y} L${(x + pts[i][0]).toFixed(1)},${(y + pts[i][1]).toFixed(1)} `;
  }
  for (let j = 1; j <= rings; j++) {
    const f = j / (rings + 0.5);
    d += 'M';
    for (let i = 0; i <= spokes; i++) {
      const p = pts[i % spokes];
      const sag = i % 2 ? 0.94 : 1;
      d += `${(x + p[0] * f * sag).toFixed(1)},${(y + p[1] * f * sag).toFixed(1)} `;
    }
  }
  return `<path class="${cls}" d="${d}" fill="none" stroke="#e8e4dc" stroke-width="2" opacity="${opacity}"/>`;
}

// Corner cobweb in the top-left corner at (x, y), mirrored with flip = -1.
function cobweb(x, y, s, flip = 1) {
  let d = '';
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    d += `M${x},${y} l${(Math.cos(a) * 160 * s * flip).toFixed(1)},${(Math.sin(a) * 160 * s).toFixed(1)} `;
  }
  for (let j = 1; j <= 4; j++) {
    const r = j * 36 * s;
    d += `M${x + r * flip},${y} Q${x + r * 0.62 * flip},${y + r * 0.38} ${x + r * 0.707 * flip},${y + r * 0.707} `;
    d += `Q${x + r * 0.38 * flip},${y + r * 0.62} ${x},${y + r} `;
  }
  return `<path d="${d}" fill="none" stroke="#e8e4dc" stroke-width="2" opacity="0.4"/>`;
}

// Old bones on the cave floor around (x, y).
function bones(x, y, s = 1) {
  const bone = (bx, by, len, rot) => `
    <g transform="translate(${bx} ${by}) rotate(${rot}) scale(${s})">
      <rect x="${-len / 2}" y="-4" width="${len}" height="8" rx="3" fill="#d9d0bc"/>
      <circle cx="${-len / 2}" cy="-5" r="6" fill="#d9d0bc"/><circle cx="${-len / 2}" cy="5" r="6" fill="#d9d0bc"/>
      <circle cx="${len / 2}" cy="-5" r="6" fill="#d9d0bc"/><circle cx="${len / 2}" cy="5" r="6" fill="#d9d0bc"/>
    </g>`;
  return `
    ${bone(x - 50, y, 70, 12)}
    ${bone(x + 40, y + 14, 56, -30)}
    <g transform="translate(${x + 10} ${y - 18}) scale(${s})">
      <path d="M-26,0 C-28,-30 28,-30 26,0 L18,14 L-18,14 Z" fill="#e2dac6"/>
      <ellipse cx="-10" cy="-4" rx="7" ry="8" fill="#1a1410"/>
      <ellipse cx="10" cy="-4" rx="7" ry="8" fill="#1a1410"/>
      <path d="M-10,14 l0,6 M0,14 l0,6 M10,14 l0,6" stroke="#1a1410" stroke-width="3"/>
    </g>`;
}

// Silk cocoon hanging from a thread at (x, y).
function cocoon(x, y, s = 1) {
  return `
    <line x1="${x}" y1="0" x2="${x}" y2="${y - 40 * s}" stroke="#e8e4dc" stroke-width="2" opacity="0.5"/>
    <ellipse cx="${x}" cy="${y}" rx="${18 * s}" ry="${42 * s}" fill="#cfc8b8" opacity="0.85"/>
    <path d="M${x - 16 * s},${y - 20 * s} l${32 * s},${10 * s} M${x - 18 * s},${y} l${36 * s},${8 * s} M${x - 15 * s},${y + 20 * s} l${30 * s},${8 * s}"
          stroke="#a69f90" stroke-width="2"/>`;
}

// The giant spider, seen from the front, head down. (0, 0) is the middle of its head;
// the legs reach about 190 out to the sides. Legs are inner <g>s so CSS can twitch them.
function spider() {
  const body = '#2a1f2a';
  const legs = [
    'M-22,40 L-80,30 L-112,140',
    'M-30,28 L-122,-10 L-182,70',
    'M-30,16 L-122,-62 L-186,-12',
    'M-24,4 L-90,-112 L-150,-124',
  ];
  const side = (flip) =>
    legs
      .map(
        (d, i) => `<g class="spider-leg leg-${i}"><path d="${d}" transform="scale(${flip} 1)" fill="none" stroke="${body}" stroke-width="10"
             stroke-linecap="round" stroke-linejoin="round"/></g>`
      )
      .join('');
  return `
    <g class="spider-legs">${side(1)}${side(-1)}</g>
    <ellipse cx="0" cy="-58" rx="62" ry="70" fill="${body}"/>
    <path d="M-24,-96 L0,-80 L24,-96 M-30,-66 L0,-48 L30,-66 M-22,-38 L0,-24 L22,-38" fill="none" stroke="#8e1426" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="0" cy="24" rx="40" ry="34" fill="${body}"/>
    <path d="M-12,52 q-4,16 6,22 M12,52 q4,16 -6,22" fill="none" stroke="#c9c0a8" stroke-width="5" stroke-linecap="round"/>
    <g class="spider-eyes" fill="#ff5a3c">
      <circle cx="-11" cy="22" r="7.5"/><circle cx="11" cy="22" r="7.5"/>
      <circle cx="-26" cy="12" r="4.5"/><circle cx="26" cy="12" r="4.5"/>
      <circle cx="-8" cy="6" r="4"/><circle cx="8" cy="6" r="4"/>
      <circle cx="-22" cy="30" r="3.5"/><circle cx="22" cy="30" r="3.5"/>
    </g>
    <g fill="#ffe0d0"><circle cx="-13" cy="19" r="2.2"/><circle cx="9" cy="19" r="2.2"/></g>`;
}

// The ruby wrapped in silk, hanging from threads. (0, 0) is the middle of the ruby.
// The threads (.mg-thread) are listed from (x, y) points relative to the ruby.
function rubyInSilk(anchors, glowFilter) {
  const threads = anchors
    .map(([ax, ay]) => `<line class="mg-thread" x1="0" y1="0" x2="${ax}" y2="${ay}" stroke="#eee8dc" stroke-width="3" opacity="0.75"/>`)
    .join('');
  return `
    ${threads}
    <g class="mg-ruby">
      <g filter="url(#${glowFilter})"><polygon points="0,-40 32,0 0,40 -32,0" fill="#d8283f"/></g>
      <polygon points="0,-40 32,0 0,0" fill="#ff7084"/>
      <polygon points="0,0 0,40 -32,0" fill="#8e1426"/>
      <polygon points="-7,-26 -16,-10 -10,-10" fill="#ffd6dc"/>
      <path d="M-30,-6 L30,10 M-26,14 L24,-16 M-14,-30 L18,32" stroke="#eee8dc" stroke-width="2.5" opacity="0.6"/>
    </g>`;
}

// The spider in its web, close up, for the riddle minigame. The spider (.mg-spider)
// sways in its web; the ruby (.mg-ruby) hangs from threads (.mg-thread) beside it.
function giantSpiderCloseUp() {
  return `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jättespindeln i sitt nät">
  <defs>
    <radialGradient id="mgc-bg" cx="0.5" cy="0.55" r="0.65">
      <stop offset="0" stop-color="#3a2c22"/>
      <stop offset="0.6" stop-color="#16100c"/>
      <stop offset="1" stop-color="#050404"/>
    </radialGradient>
    <filter id="mgc-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g class="no-hit">
    <rect x="-800" width="3200" height="900" fill="url(#mgc-bg)"/>
    ${stalactites(91, '#0e0a08', { count: 18, h0: 60, h1: 200 })}
    ${spiderWeb(800, 480, 620, { spokes: 16, rings: 9, opacity: 0.3 })}
  </g>
  <g transform="translate(800 520)">
    <g class="mg-spider">
      <line x1="0" y1="-120" x2="0" y2="-700" stroke="#eee8dc" stroke-width="3" opacity="0.6"/>
      <g transform="scale(2.1)"><g class="mg-spider-body">${spider()}</g></g>
    </g>
  </g>
  <g transform="translate(1250 600)">
    ${rubyInSilk([[-140, -180], [60, -230], [170, -60], [120, 150], [-150, 90]], 'mgc-glow')}
  </g>
  <g class="mg-fx no-hit"></g>
</svg>`;
}

// ---------- The village ----------

// The lumberjack, facing right, feet at (0, 0), about 175 units tall.
// Legs and the waving arm are inner <g>s so CSS can swing them.
function lumberjack() {
  const pants = '#3b4a6a';
  const shirt = '#b8322e';
  const check = '#5a1614';
  const skin = '#e6b48c';
  const beard = '#7a4a26';
  const leg = (x, cls) => `
    <g transform="translate(${x} -78)"><g class="${cls}">
      <rect x="-9" y="0" width="18" height="66" rx="6" fill="${pants}"/>
      <path d="M-11,62 L12,62 Q22,62 22,72 L22,78 L-11,78 Z" fill="#2a1d14"/>
    </g></g>`;
  return `
    <ellipse cx="0" cy="2" rx="40" ry="7" fill="rgba(0,0,0,0.3)"/>
    ${leg(-10, 'lj-leg back')}
    <g transform="translate(-16 -146)"><g class="lj-arm back">
      <rect x="-8" y="0" width="16" height="58" rx="7" fill="${check}"/>
    </g></g>
    <path d="M-34,-150 Q0,-164 34,-150 L30,-76 L-30,-76 Z" fill="${shirt}"/>
    <path d="M-30,-130 L30,-130 M-31,-106 L31,-106 M-14,-156 L-12,-76 M12,-156 L12,-76" stroke="${check}" stroke-width="5"/>
    <rect x="-32" y="-84" width="64" height="10" fill="#3a2a1c"/>
    <rect x="-6" y="-84" width="12" height="10" fill="#c9a46a"/>
    ${leg(10, 'lj-leg')}
    <rect x="-8" y="-164" width="16" height="12" fill="${skin}"/>
    <circle cx="2" cy="-180" r="20" fill="${skin}"/>
    <path d="M-14,-176 Q-16,-148 4,-144 Q26,-146 22,-176 Q12,-166 2,-168 Q-6,-166 -14,-176 Z" fill="${beard}"/>
    <circle cx="10" cy="-184" r="2.6" fill="#1a1208"/>
    <path d="M4,-192 l10,-2" stroke="${beard}" stroke-width="3" stroke-linecap="round"/>
    <path d="M-20,-188 Q-20,-212 2,-212 Q24,-212 22,-188 Z" fill="#c9302c"/>
    <rect x="-22" y="-192" width="46" height="8" rx="3" fill="#8e1e1c"/>
    <circle cx="0" cy="-214" r="6" fill="#efe6d0"/>
    <g transform="translate(18 -146)"><g class="lj-arm wave">
      <rect x="-8" y="0" width="16" height="58" rx="7" fill="${shirt}"/>
      <circle cx="0" cy="60" r="9" fill="${skin}"/>
    </g></g>`;
}

// ---------- The church ----------

// Tall arched stained-glass window. (x, top) is the top of the arch, w and h its size.
function stainedWindow(x, top, w, h, seed) {
  const rand = seededRandom(seed);
  const colors = ['#c23a4a', '#3a6ac2', '#e0b44a', '#3f9a5a', '#8a4ac2', '#e07a3a'];
  const x0 = x - w / 2;
  const r = w / 2;
  let panes = '';
  const rows = 6;
  const cols = 3;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = x0 + (col * w) / cols;
      const py = top + r + (row * (h - r)) / rows;
      panes += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(w / cols).toFixed(1)}" height="${((h - r) / rows).toFixed(1)}" fill="${colors[Math.floor(rand() * colors.length)]}"/>`;
    }
  }
  return `
    <path d="M${x0 - 10},${top + h + 10} L${x0 - 10},${top + r} A${r + 10},${r + 10} 0 0 1 ${x0 + w + 10},${top + r} L${x0 + w + 10},${top + h + 10} Z" fill="#3a3040"/>
    <path d="M${x0},${top + r} A${r},${r} 0 0 1 ${x0 + w},${top + r} Z" fill="${colors[Math.floor(rand() * colors.length)]}"/>
    <circle cx="${x}" cy="${top + r * 0.7}" r="${r * 0.3}" fill="#ffe9a0"/>
    ${panes}
    <g stroke="#2a2230" stroke-width="4" fill="none">
      <path d="M${x0},${top + r} A${r},${r} 0 0 1 ${x0 + w},${top + r} L${x0 + w},${top + h} L${x0},${top + h} Z"/>
      <path d="M${x0 + w / 3},${top + r * 0.3} L${x0 + w / 3},${top + h} M${x0 + (2 * w) / 3},${top + r * 0.3} L${x0 + (2 * w) / 3},${top + h}"/>
      <path d="M${x0},${top + r + (h - r) / 2} L${x0 + w},${top + r + (h - r) / 2}"/>
    </g>`;
}

// Church pew seen from behind, from x0 to x1, with its back's top edge at y.
function pew(x0, x1, y) {
  return `
    <rect x="${x0}" y="${y}" width="${x1 - x0}" height="70" rx="6" fill="#6b4626"/>
    <rect x="${x0}" y="${y}" width="${x1 - x0}" height="12" rx="6" fill="#8a5e36"/>
    <rect x="${x0 + 10}" y="${y + 70}" width="16" height="40" fill="#4a3018"/>
    <rect x="${x1 - 26}" y="${y + 70}" width="16" height="40" fill="#4a3018"/>`;
}

// A lit candle standing on (x, y), h tall.
function candle(x, y, h = 50) {
  return `
    <rect x="${x - 7}" y="${y - h}" width="14" height="${h}" rx="3" fill="#f3ecd8"/>
    <rect x="${x - 7}" y="${y - h}" width="4" height="${h}" fill="#fffaf0"/>
    <g transform="translate(${x} ${y - h - 2}) scale(0.32)"><g class="flame">
      <path d="M0,-50 C-8,-34 -22,-24 -20,-8 C-18,4 -8,8 0,8 C8,8 18,4 20,-8 C22,-24 8,-30 4,-40 C2,-30 -4,-28 0,-50 Z" fill="#f07a1a"/>
      <path d="M0,-30 C-6,-20 -12,-14 -10,-4 C-8,4 -4,6 0,6 C4,6 8,4 10,-4 C12,-14 4,-20 0,-30 Z" fill="#ffc94a"/>
    </g></g>`;
}

// The wizard's suitcase, covered in travel stickers. (x, y) is the bottom centre.
function suitcase(x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <path d="M-22,-86 L-22,-100 Q-22,-108 -14,-108 L14,-108 Q22,-108 22,-100 L22,-86" fill="none" stroke="#3a2414" stroke-width="7"/>
      <rect x="-70" y="-88" width="140" height="88" rx="10" fill="#b8742e"/>
      <rect x="-70" y="-88" width="140" height="88" rx="10" fill="none" stroke="#6b3e18" stroke-width="4"/>
      <path d="M-40,-88 L-40,0 M40,-88 L40,0" stroke="#6b3e18" stroke-width="6"/>
      <circle cx="-14" cy="-56" r="16" fill="#3a8ac2"/>
      <path d="M-24,-52 Q-14,-60 -4,-52" fill="none" stroke="#e0b44a" stroke-width="4"/>
      <rect x="2" y="-36" width="30" height="22" rx="3" fill="#e0b44a" transform="rotate(-12 17 -25)"/>
      <path d="M-58,-24 L-50,-44 L-46,-30 Z" fill="#3f9a5a"/>
      <circle cx="58" cy="-70" r="7" fill="#ffd977"/>
    </g>`;
}

// Gem on top of the wizard's staff (scene size), centred on (0, 0).
function staffRuby(glowFilter) {
  return `
    <g filter="url(#${glowFilter})"><polygon points="0,-22 17,0 0,22 -17,0" fill="#d8283f"/></g>
    <polygon points="0,-22 17,0 0,0" fill="#ff7084"/>
    <polygon points="0,0 0,22 -17,0" fill="#8e1426"/>`;
}

// The wizard, back from his holiday: purple robe with stars, pointed hat with sunglasses
// pushed up on it, and a staff with the ruby at its top. Feet at (0, 0), about 360 units tall.
// `ruby` is false once the ruby has been knocked off.
function wizard(glowFilter, ruby = true) {
  const robe = '#4b2f7a';
  const dark = '#36205a';
  const gold = '#e0b44a';
  const skin = '#e6b48c';
  const beard = '#eeeae0';
  const star = (x, y, s) =>
    `<path d="M${x},${y - s} L${x + s * 0.3},${y - s * 0.3} L${x + s},${y} L${x + s * 0.3},${y + s * 0.3} L${x},${y + s} L${x - s * 0.3},${y + s * 0.3} L${x - s},${y} L${x - s * 0.3},${y - s * 0.3} Z" fill="${gold}"/>`;
  return `
    <ellipse cx="0" cy="2" rx="80" ry="11" fill="rgba(0,0,0,0.3)"/>
    <g class="wiz-staff">
      <rect x="-91" y="-300" width="12" height="302" rx="5" fill="#6b4a2a"/>
      <path d="M-85,-300 C-112,-306 -112,-340 -96,-352 M-85,-300 C-58,-306 -58,-340 -74,-352" fill="none" stroke="#6b4a2a" stroke-width="8" stroke-linecap="round"/>
      ${ruby ? `<g transform="translate(-85 -326)">${staffRuby(glowFilter)}</g>` : ''}
    </g>
    <path d="M-44,-210 Q0,-224 44,-210 L78,0 L-78,0 Z" fill="${robe}"/>
    <path d="M0,-214 L6,0 L-6,0 Z" fill="${dark}"/>
    <rect x="-78" y="-12" width="156" height="12" fill="${gold}"/>
    ${star(-40, -120, 10)}${star(36, -80, 12)}${star(-20, -40, 8)}${star(50, -170, 7)}${star(-56, -60, 6)}
    <path d="M-40,-200 Q-70,-190 -88,-176 L-80,-160 Q-60,-170 -32,-176 Z" fill="${dark}"/>
    <circle cx="-85" cy="-168" r="12" fill="${skin}"/>
    <path d="M40,-200 Q66,-160 64,-112 L46,-112 Q46,-156 30,-180 Z" fill="${dark}"/>
    <circle cx="56" cy="-106" r="11" fill="${skin}"/>
    <circle cx="0" cy="-232" r="28" fill="${skin}"/>
    <path d="M-26,-226 Q-30,-170 0,-120 Q30,-170 26,-226 Q14,-212 0,-214 Q-14,-212 -26,-226 Z" fill="${beard}"/>
    <path d="M-12,-210 Q0,-202 12,-210" fill="none" stroke="#c9c2b0" stroke-width="3"/>
    <circle cx="-10" cy="-238" r="3" fill="#1a1208"/>
    <circle cx="10" cy="-238" r="3" fill="#1a1208"/>
    <path d="M-20,-248 l14,3 M20,-248 l-14,3" stroke="${beard}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="0" cy="-226" rx="5" ry="7" fill="#d89a74"/>
    <path d="M-38,-256 C-20,-300 0,-340 30,-372 C34,-376 40,-372 36,-366 C20,-330 26,-290 38,-256 Z" fill="${robe}"/>
    ${star(4, -300, 9)}${star(22, -340, 6)}
    <ellipse cx="0" cy="-256" rx="58" ry="12" fill="${dark}"/>
    <g fill="#1a1a24" stroke="#c9a46a" stroke-width="2">
      <circle cx="-14" cy="-270" r="10"/><circle cx="14" cy="-270" r="10"/>
    </g>
    <path d="M-4,-272 L4,-272" stroke="#c9a46a" stroke-width="3"/>`;
}

// The magic sword lying flat, glowing blue. (x, y) is the middle of the blade.
function magicSword(x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <ellipse cx="0" cy="0" rx="190" ry="44" fill="url(#church-crypt-swordglow)" class="no-hit sword-aura"/>
      <rect x="-170" y="-40" width="340" height="80" fill="transparent"/>
      <polygon points="-110,-9 120,-9 150,0 120,9 -110,9" fill="#dfe8f2" stroke="#7a8ea6" stroke-width="2"/>
      <path d="M-104,0 L128,0" stroke="#9ab4d8" stroke-width="3"/>
      <g class="sword-runes" fill="#7fd8ff">
        <rect x="-70" y="-3" width="8" height="6"/><rect x="-40" y="-3" width="6" height="6"/>
        <rect x="-12" y="-3" width="9" height="6"/><rect x="20" y="-3" width="6" height="6"/>
        <rect x="50" y="-3" width="8" height="6"/>
      </g>
      <rect x="-122" y="-34" width="14" height="68" rx="5" fill="#c9a46a" stroke="#7a5a2a" stroke-width="2"/>
      <rect x="-166" y="-7" width="46" height="14" rx="5" fill="#4a2f6a"/>
      <circle cx="-172" cy="0" r="11" fill="#c9a46a" stroke="#7a5a2a" stroke-width="2"/>
      <circle cx="-172" cy="0" r="5" fill="#7fd8ff"/>
    </g>`;
}

// Stone coffin of an old knight with a carved shield. (x, y) is the bottom centre.
function sarcophagus(x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <ellipse cx="0" cy="6" rx="300" ry="22" fill="rgba(0,0,0,0.35)"/>
      <rect x="-260" y="-150" width="520" height="150" fill="#6f6a72"/>
      <rect x="-260" y="-150" width="520" height="150" fill="none" stroke="#4a464e" stroke-width="4"/>
      <polygon points="-286,-150 286,-150 270,-186 -270,-186" fill="#8a8590"/>
      <rect x="-286" y="-150" width="572" height="12" fill="#5c5860"/>
      <g fill="none" stroke="#4a464e" stroke-width="4">
        <rect x="-230" y="-122" width="140" height="94" rx="6"/>
        <rect x="90" y="-122" width="140" height="94" rx="6"/>
      </g>
      <path d="M-38,-124 L38,-124 L38,-82 Q38,-40 0,-24 Q-38,-40 -38,-82 Z" fill="#5c5860" stroke="#4a464e" stroke-width="4"/>
      <path d="M0,-116 L0,-36 M-28,-94 L28,-94" stroke="#8a8590" stroke-width="6"/>
    </g>`;
}

// The wizard close up for the duel. The staff (.mg-staff, rotated by church.js) holds
// the ruby (.mg-ruby-target); a shield (.mg-shield) can close around it.
function wizardCloseUp() {
  const robe = '#4b2f7a';
  const dark = '#36205a';
  const gold = '#e0b44a';
  const skin = '#e6b48c';
  const beard = '#eeeae0';
  const crack = (d) => `<path class="mg-crack" d="${d}" fill="none" stroke="#fff4f4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const star = (x, y, s) =>
    `<path d="M${x},${y - s} L${x + s * 0.3},${y - s * 0.3} L${x + s},${y} L${x + s * 0.3},${y + s * 0.3} L${x},${y + s} L${x - s * 0.3},${y + s * 0.3} L${x - s},${y} L${x - s * 0.3},${y - s * 0.3} Z" fill="${gold}"/>`;
  return `
<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Trollkarlen på nära håll">
  <defs>
    <radialGradient id="mgw-bg" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0" stop-color="#4a3a6a"/>
      <stop offset="0.6" stop-color="#22183a"/>
      <stop offset="1" stop-color="#0c0814"/>
    </radialGradient>
    <radialGradient id="mgw-shield">
      <stop offset="0" stop-color="#9adcff" stop-opacity="0.25"/>
      <stop offset="0.7" stop-color="#9adcff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#e6f6ff" stop-opacity="0.95"/>
    </radialGradient>
    <filter id="mgw-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g class="no-hit">
    <rect x="-800" width="3200" height="900" fill="url(#mgw-bg)"/>
    <g opacity="0.35">
      ${stainedWindow(220, 120, 120, 420, 41)}
      ${stainedWindow(1380, 120, 120, 420, 43)}
    </g>
    <rect x="-800" y="760" width="3200" height="140" fill="#1a1222"/>
  </g>

  <g class="mg-wizard" transform="translate(800 0)">
    <g class="mg-wizard-body">
      <path d="M-150,500 Q0,460 150,500 L250,900 L-250,900 Z" fill="${robe}"/>
      <path d="M0,480 L14,900 L-14,900 Z" fill="${dark}"/>
      ${star(-90, 640, 22)}${star(110, 720, 26)}${star(-40, 820, 18)}${star(150, 560, 14)}${star(-170, 760, 14)}
      <path d="M130,510 Q230,470 290,380 L320,410 Q260,520 160,580 Z" fill="${dark}"/>
      <circle cx="305" cy="392" r="28" fill="${skin}"/>
      <g class="no-hit" transform="translate(305 380)"><g class="mg-spell">
        ${star(0, -20, 26)}${star(-40, -60, 14)}${star(36, -70, 12)}
      </g></g>
      <circle cx="0" cy="410" r="78" fill="${skin}"/>
      <path d="M-72,420 Q-84,600 0,740 Q84,600 72,420 Q40,460 0,456 Q-40,460 -72,420 Z" fill="${beard}"/>
      <path d="M-34,476 Q0,500 34,476" fill="none" stroke="#c9c2b0" stroke-width="7"/>
      <g class="mg-eyes">
        <circle cx="-28" cy="396" r="9" fill="#1a1208"/>
        <circle cx="28" cy="396" r="9" fill="#1a1208"/>
      </g>
      <path d="M-58,368 l40,10 M58,368 l-40,10" stroke="${beard}" stroke-width="13" stroke-linecap="round"/>
      <ellipse cx="0" cy="430" rx="14" ry="20" fill="#d89a74"/>
      <path d="M-110,346 C-60,230 0,140 90,60 C100,50 116,60 106,76 C60,160 70,250 110,346 Z" fill="${robe}"/>
      ${star(10, 250, 20)}${star(56, 150, 13)}
      <ellipse cx="0" cy="346" rx="170" ry="32" fill="${dark}"/>
      <g fill="#1a1a24" stroke="#c9a46a" stroke-width="4">
        <circle cx="-40" cy="306" r="28"/><circle cx="40" cy="306" r="28"/>
      </g>
      <path d="M-12,302 L12,302" stroke="#c9a46a" stroke-width="6"/>
      <path d="M-130,510 Q-200,560 -230,640 L-190,670 Q-170,600 -110,570 Z" fill="${dark}"/>
    </g>
  </g>

  <g class="mg-staff" transform="translate(570 660)">
    <rect x="-14" y="-380" width="28" height="560" rx="12" fill="#6b4a2a"/>
    <rect x="-14" y="-380" width="8" height="560" fill="#8a6a42"/>
    <path d="M0,-370 C-60,-384 -64,-450 -30,-480 M0,-370 C60,-384 64,-450 30,-480" fill="none" stroke="#6b4a2a" stroke-width="18" stroke-linecap="round"/>
    <g transform="translate(0 -420)">
      <g class="mg-ruby">
        <g filter="url(#mgw-glow)"><polygon points="0,-48 40,0 0,48 -40,0" fill="#d8283f"/></g>
        <polygon points="0,-48 40,0 0,0" fill="#ff7084"/>
        <polygon points="0,0 0,48 -40,0" fill="#8e1426"/>
        <polygon points="-8,-30 -20,-12 -12,-12" fill="#ffd6dc"/>
        ${crack('M-4,-40 L4,-18 L-8,-4 L2,12')}
        ${crack('M30,-6 L12,4 L18,20 L4,34')}
        ${crack('M-30,4 L-12,10 L-18,26 L-2,40')}
        <circle class="mg-ruby-target" r="72" fill="transparent"/>
      </g>
      <g class="no-hit"><g class="mg-shield">
        <circle r="100" fill="url(#mgw-shield)" stroke="#e6f6ff" stroke-width="8" filter="url(#mgw-glow)"/>
        <path d="M-60,-50 Q-40,-80 0,-86" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
      </g></g>
    </g>
    <circle cx="0" cy="0" r="34" fill="${skin}"/>
    <path d="M-30,-14 Q0,-30 30,-14" fill="none" stroke="#d89a74" stroke-width="6"/>
  </g>

  <g class="mg-fx no-hit"></g>
</svg>`;
}
