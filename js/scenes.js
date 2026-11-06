// Scene registry. Each scene has a display name, narration text and an SVG.
// Elements with data-goto="<sceneId>" are exits the player can click.

const SCENES = {};

SCENES.town = {
  name: 'Byn',
  narration:
    'Du står i byn vid foten av Mount Thunder. Högst upp på berget mullrar åskan, där bor draken. ' +
    'Västerut ligger den dimmiga skogen.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Byn vid foten av Mount Thunder">
  <defs>
    <linearGradient id="town-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#151832"/>
      <stop offset="0.55" stop-color="#3b3f6b"/>
      <stop offset="1" stop-color="#8a7fa8"/>
    </linearGradient>
    <linearGradient id="town-mtn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#565b78"/>
      <stop offset="1" stop-color="#2b2e42"/>
    </linearGradient>
    <linearGradient id="town-ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4f7a3a"/>
      <stop offset="1" stop-color="#22391b"/>
    </linearGradient>
    <filter id="town-blur" x="-50%" y="-200%" width="200%" height="500%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
    <filter id="town-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Sky -->
  <rect width="1600" height="900" fill="url(#town-sky)"/>
  <rect class="sky-flash" width="1600" height="900" fill="#e8e6ff"/>
  <g fill="#e8e6ff" opacity="0.7">
    <circle cx="120" cy="60" r="1.6"/><circle cx="260" cy="130" r="1.2"/><circle cx="410" cy="40" r="1.8"/>
    <circle cx="560" cy="110" r="1.2"/><circle cx="1260" cy="50" r="1.6"/><circle cx="1400" cy="140" r="1.2"/>
    <circle cx="1520" cy="70" r="1.8"/><circle cx="1340" cy="230" r="1.2"/><circle cx="200" cy="230" r="1.4"/>
  </g>

  <!-- Distant range -->
  <polygon fill="#4a4d6c" points="0,540 140,440 260,500 400,400 520,470 640,430 700,460 1180,450 1300,400 1420,470 1520,430 1600,470 1600,900 0,900"/>

  <!-- Storm clouds behind the peak -->
  <g class="storm-clouds">
    <g filter="url(#town-blur)" fill="#262842">
      <ellipse cx="760" cy="120" rx="170" ry="38"/>
      <ellipse cx="1050" cy="105" rx="190" ry="42"/>
      <ellipse cx="900" cy="80" rx="220" ry="40"/>
      <ellipse cx="640" cy="160" rx="110" ry="24"/>
      <ellipse cx="1190" cy="150" rx="120" ry="26"/>
    </g>
  </g>

  <!-- Mount Thunder -->
  <polygon fill="url(#town-mtn)" points="330,680 560,470 700,350 820,200 900,110 980,210 1100,340 1240,470 1420,620 1520,680"/>
  <polygon fill="#262839" opacity="0.6" points="900,110 980,210 1100,340 1240,470 1420,620 1520,680 1060,680 990,470 940,280"/>
  <polygon fill="#e9ecf5" points="900,110 945,165 980,210 955,225 932,200 912,232 890,205 862,232 845,215 870,175"/>
  <polygon fill="#b9bfd3" points="900,110 945,165 980,210 955,225 932,200 912,232 920,180"/>

  <!-- Lightning -->
  <g class="bolt" filter="url(#town-glow)">
    <polyline points="1060,130 1032,190 1058,196 1022,280" fill="none" stroke="#fff6b0" stroke-width="5" stroke-linejoin="round"/>
    <polyline points="740,140 758,185 736,191 752,240" fill="none" stroke="#fff6b0" stroke-width="3" stroke-linejoin="round"/>
  </g>

  <!-- Cloud band drifting across the summit -->
  <g class="storm-clouds">
    <g filter="url(#town-blur)" fill="#3a3c5c" opacity="0.75">
      <ellipse cx="830" cy="245" rx="160" ry="20"/>
      <ellipse cx="1010" cy="265" rx="140" ry="18"/>
    </g>
  </g>

  <!-- The dragon circling the summit -->
  <g transform="translate(905 175) scale(0.9)">
    <g class="dragon" fill="#120f1c">
      <path d="M-40,4 Q-20,0 0,-2 Q18,-4 30,-10 L40,-8 L33,-2 Q16,6 -2,6 Q-20,8 -40,4 Z"/>
      <path d="M-6,-1 L-30,-36 L-10,-24 L0,-44 L10,-22 L14,-2 Z"/>
      <path d="M-40,4 Q-58,2 -68,-10" fill="none" stroke="#120f1c" stroke-width="3"/>
    </g>
  </g>

  <!-- Hills -->
  <path fill="#3a5a30" d="M0,650 Q300,590 600,645 T1200,630 T1600,615 L1600,900 L0,900 Z"/>
  <path fill="url(#town-ground)" d="M0,730 Q400,690 800,715 T1600,705 L1600,900 L0,900 Z"/>

  <!-- Road from the village to the forest -->
  <path fill="#9b8458" d="M860,900 C820,830 650,785 470,758 C430,752 395,748 360,746 L355,760 C400,765 560,800 720,900 Z"/>

  <!-- Forest (exit) -->
  <g class="exit" data-goto="forest" tabindex="0" role="button" aria-label="Gå till skogen">
    <rect x="30" y="480" width="440" height="300" fill="transparent"/>
    ${treeRow({ seed: 7, count: 18, x0: 50, x1: 440, y0: 600, y1: 650, h0: 110, h1: 160, pineColor: '#2f4d33', leafColor: '#3a5e3a' })}
    ${treeRow({ seed: 21, count: 14, x0: 40, x1: 420, y0: 680, y1: 750, h0: 150, h1: 210, pineColor: '#1f3a26', leafColor: '#2c4f2e' })}
    <g filter="url(#town-blur)" fill="#d8dde6" opacity="0.35">
      <ellipse cx="240" cy="650" rx="230" ry="40"/>
      <ellipse cx="200" cy="720" rx="200" ry="30"/>
    </g>
    ${signpost(420, 770, 'Skogen', { width: 140 })}
    <g class="exit-label">
      <rect x="140" y="460" width="200" height="40" rx="6" fill="rgba(14,16,32,0.8)" stroke="#e0b44a"/>
      <text x="240" y="487" font-size="22" text-anchor="middle" fill="#f3ecd8">Gå till skogen</text>
    </g>
  </g>

  <!-- Village -->
  ${house(160, 885, 150, 100, '#c9b48f', '#7a3b2e', { chimney: true })}

  ${house(870, 790, 120, 85, '#d8c7a3', '#5d3a2a', { chimney: true })}

  <!-- Church -->
  <rect x="1030" y="670" width="120" height="110" fill="#e2d6bd"/>
  <polygon points="1020,670 1090,620 1160,670" fill="#4c3b4f"/>
  <rect x="1065" y="590" width="50" height="80" fill="#e2d6bd"/>
  <polygon points="1058,590 1090,520 1122,590" fill="#4c3b4f"/>
  <rect x="1087" y="495" width="6" height="30" fill="#c9a46a"/>
  <rect x="1078" y="503" width="24" height="6" fill="#c9a46a"/>
  <circle class="window" cx="1090" cy="620" r="10" fill="#ffd977"/>
  <path d="M1075,780 L1075,735 Q1090,715 1105,735 L1105,780 Z" fill="#4a2f1c"/>

  ${house(1200, 805, 140, 95, '#bfa57d', '#6b2f2a', { chimney: true })}
  ${house(1380, 775, 115, 82, '#cdb892', '#4f3324')}
  ${house(1480, 835, 110, 80, '#d3c09a', '#713a2b')}

  <!-- Small trees in the village -->
  ${leafy(820, 800, 90, '#3f6a35')}
  ${leafy(1180, 790, 70, '#467339')}
  ${pine(1520, 760, 110, '#2a4a2c')}
</svg>`,
};

SCENES.forest = {
  name: 'Skogen',
  narration:
    'Dimman ligger tjock mellan granarna och björkarna. Det är svårt att se längre än några steg. ' +
    'Någonstans i dimman hörs ett ylande…',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Den dimmiga skogen">
  <defs>
    <linearGradient id="forest-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#36443f"/>
      <stop offset="1" stop-color="#76857e"/>
    </linearGradient>
    <linearGradient id="forest-ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#55635a"/>
      <stop offset="0.4" stop-color="#34433a"/>
      <stop offset="1" stop-color="#1b251d"/>
    </linearGradient>
    <linearGradient id="forest-path" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7d7a68"/>
      <stop offset="1" stop-color="#5b5140"/>
    </linearGradient>
    <filter id="forest-blur" x="-20%" y="-100%" width="140%" height="300%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <filter id="forest-glow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="1600" height="900" fill="url(#forest-sky)"/>
  <rect y="470" width="1600" height="430" fill="url(#forest-ground)"/>

  <!-- Far trees, almost lost in the fog -->
  ${treeRow({ seed: 3, count: 46, x0: -40, x1: 1640, y0: 470, y1: 520, h0: 160, h1: 250, pineColor: '#808e88', leafColor: '#87958e', trunk: '#7b8781' })}
  <g class="fog slow" filter="url(#forest-blur)" fill="#c9d2ce" opacity="0.55">
    <ellipse cx="400" cy="480" rx="520" ry="60"/>
    <ellipse cx="1200" cy="470" rx="560" ry="70"/>
  </g>

  <!-- Path into the forest -->
  <polygon fill="url(#forest-path)" points="780,520 820,520 980,900 620,900"/>

  <!-- Eyes watching from the fog -->
  <g class="eyes" filter="url(#forest-glow)" fill="#ffcf4a">
    <ellipse cx="1046" cy="582" rx="5" ry="3"/>
    <ellipse cx="1066" cy="582" rx="5" ry="3"/>
  </g>

  <!-- Middle trees -->
  ${treeRow({ seed: 11, count: 26, x0: -40, x1: 1640, y0: 600, y1: 660, h0: 280, h1: 400, pineColor: '#4a5d52', leafColor: '#56695b', trunk: '#3f4a40' })}
  <g class="fog" filter="url(#forest-blur)" fill="#d4dcd8" opacity="0.5">
    <ellipse cx="300" cy="640" rx="480" ry="55"/>
    <ellipse cx="1150" cy="630" rx="520" ry="60"/>
    <ellipse cx="800" cy="700" rx="420" ry="45"/>
  </g>

  <!-- Near trees framing the view -->
  ${leafy(-30, 910, 640, '#1f2e24', '#2a2219')}
  ${pine(1450, 920, 720, '#18261d', '#241d15')}
  ${leafy(1620, 900, 600, '#1d2b21', '#2a2219')}
  ${pine(1270, 890, 480, '#223228', '#241d15')}

  <g class="fog slow" filter="url(#forest-blur)" fill="#dfe6e2" opacity="0.35">
    <ellipse cx="800" cy="860" rx="700" ry="60"/>
  </g>

  <!-- Way back to the village (exit) -->
  <g class="exit" data-goto="town" tabindex="0" role="button" aria-label="Gå tillbaka till byn">
    <rect x="120" y="580" width="260" height="200" fill="transparent"/>
    ${signpost(250, 780, '← Till byn', { width: 200 })}
    <g class="exit-label">
      <rect x="130" y="600" width="240" height="40" rx="6" fill="rgba(14,16,32,0.8)" stroke="#e0b44a"/>
      <text x="250" y="627" font-size="22" text-anchor="middle" fill="#f3ecd8">Tillbaka till byn</text>
    </g>
  </g>
</svg>`,
};
