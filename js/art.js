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

// Wooden signpost. (x, groundY) is the foot of the post.
function signpost(x, groundY, text, { width = 170 } = {}) {
  const boardY = groundY - 120;
  return `
    <rect x="${x - 6}" y="${boardY}" width="12" height="120" fill="#5b3d22"/>
    <rect x="${x - width / 2}" y="${boardY}" width="${width}" height="46" rx="5" fill="#c9a46a" stroke="#5b3d22" stroke-width="4"/>
    <text class="sign-text" x="${x}" y="${boardY + 31}" font-size="26" text-anchor="middle">${text}</text>`;
}

// Clickable signpost exit with a hover label. (x, groundY) is the foot of the post.
function signExit(target, x, groundY, text, label, { width = 200 } = {}) {
  return `
  <g class="exit" data-goto="${target}" tabindex="0" role="button" aria-label="${label}">
    <rect x="${x - width / 2 - 20}" y="${groundY - 140}" width="${width + 40}" height="150" fill="transparent"/>
    ${signpost(x, groundY, text, { width })}
    <g class="exit-label">
      <rect x="${x - 130}" y="${groundY - 190}" width="260" height="40" rx="6" fill="rgba(14,16,32,0.8)" stroke="#e0b44a"/>
      <text x="${x}" y="${groundY - 163}" font-size="22" text-anchor="middle" fill="#f3ecd8">${label}</text>
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
