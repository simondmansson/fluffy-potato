// Scene registry. Each scene has a display name, narration text and an SVG.
// Elements with data-goto="<sceneId>" are exits the player can click.

const SCENES = {};

SCENES.town = {
  name: 'Byn',
  narration:
    'Du står i byn vid foten av Mount Thunder. Högst upp på berget mullrar åskan, där bor draken. ' +
    'Västerut ligger den dimmiga skogen, österut glittrar sjön, och vid bergets fot gapar en mörk grotta.',
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

  <!-- Cave at the foot of the mountain (exit) -->
  <g class="exit" data-goto="cave" tabindex="0" role="button" aria-label="Gå till grottan">
    <rect x="560" y="520" width="260" height="230" fill="transparent"/>
    <path fill="#8a7650" d="M560,760 C590,720 640,690 676,660 L708,660 C690,690 650,730 620,762 Z"/>
    ${caveMouth(692, 662)}
    ${signpost(760, 748, 'Grottan', { width: 140 })}
    <g class="exit-label">
      <rect x="592" y="490" width="200" height="40" rx="6" fill="rgba(14,16,32,0.8)" stroke="#e0b44a"/>
      <text x="692" y="517" font-size="22" text-anchor="middle" fill="#f3ecd8">Gå till grottan</text>
    </g>
  </g>

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

  <!-- Lake (exit) -->
  <g class="exit" data-goto="lake" tabindex="0" role="button" aria-label="Gå till sjön">
    <rect x="1200" y="700" width="420" height="200" fill="transparent"/>
    <path fill="#9b8458" d="M1150,812 C1300,826 1450,846 1640,852 L1640,880 C1450,880 1290,858 1140,826 Z"/>
    ${signpost(1420, 880, 'Sjön →', { width: 140 })}
    <g class="exit-label">
      <rect x="1280" y="690" width="200" height="40" rx="6" fill="rgba(14,16,32,0.8)" stroke="#e0b44a"/>
      <text x="1380" y="717" font-size="22" text-anchor="middle" fill="#f3ecd8">Gå till sjön</text>
    </g>
  </g>

  <!-- Small trees in the village -->
  ${leafy(820, 800, 90, '#3f6a35')}
  ${leafy(1180, 790, 70, '#467339')}
  ${pine(1520, 760, 110, '#2a4a2c')}

  <!-- The lumberjack is added here by forest.js -->
  <g class="actors"></g>
</svg>`,
};

SCENES.forest = {
  name: 'Skogsstigen',
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

  <!-- Way back to the village (exit) -->
  ${signExit('town', 250, 780, '← Till byn', 'Tillbaka till byn')}
  ${signExit('forest-spruce', 660, 590, 'Granskogen ↑', 'Gå in i granskogen', { width: 210 })}
  ${signExit('forest-brook', 1330, 780, 'Bäcken →', 'Gå till bäcken', { width: 180 })}

  <!-- Axe and werewolf are added here by forest.js -->
  <g class="actors"></g>

  <g class="fog slow" filter="url(#forest-blur)" fill="#dfe6e2" opacity="0.35">
    <ellipse cx="800" cy="860" rx="700" ry="60"/>
  </g>
</svg>`,
};

// Shared defs for the forest screens. Ids are prefixed with the scene id.
function forestDefs(id, sky0, sky1, ground0, ground1) {
  return `
  <defs>
    <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky0}"/>
      <stop offset="1" stop-color="${sky1}"/>
    </linearGradient>
    <linearGradient id="${id}-ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ground0}"/>
      <stop offset="1" stop-color="${ground1}"/>
    </linearGradient>
    <filter id="${id}-blur" x="-20%" y="-100%" width="140%" height="300%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>`;
}

// The forest is a 2x2 grid of screens:
//   Granskogen (NW)  –  Gläntan (NE)
//   Skogsstigen (SW) –  Bäcken (SE)

SCENES['forest-spruce'] = {
  name: 'Granskogen',
  narration:
    'Höga granar står tätt som väggar. Mellan stammarna är det nästan mörkt, och dimman ringlar längs marken.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Den mörka granskogen">
  ${forestDefs('forest-spruce', '#232d2a', '#55635d', '#46524a', '#141c16')}

  <rect width="1600" height="900" fill="url(#forest-spruce-sky)"/>
  <rect y="460" width="1600" height="440" fill="url(#forest-spruce-ground)"/>

  ${treeRow({ seed: 5, count: 52, x0: -40, x1: 1640, y0: 460, y1: 510, h0: 230, h1: 330, pineColor: '#66746e', leafColor: '#6c7a73', trunk: '#5e6a64', pineShare: 0.95 })}
  <g class="fog slow" filter="url(#forest-spruce-blur)" fill="#bfc9c4" opacity="0.5">
    <ellipse cx="500" cy="470" rx="560" ry="60"/>
    <ellipse cx="1250" cy="480" rx="520" ry="60"/>
  </g>

  ${treeRow({ seed: 17, count: 30, x0: -40, x1: 1640, y0: 580, y1: 640, h0: 380, h1: 500, pineColor: '#36463d', leafColor: '#3f5045', trunk: '#2e3a30', pineShare: 0.9 })}
  <g class="fog" filter="url(#forest-spruce-blur)" fill="#cdd6d2" opacity="0.45">
    <ellipse cx="350" cy="650" rx="460" ry="50"/>
    <ellipse cx="1150" cy="640" rx="500" ry="55"/>
  </g>

  ${fern(420, 790, 1.1, '#2f4a33')}
  ${fern(980, 760, 0.9, '#36523a')}
  ${fern(1180, 840, 1.3, '#2a432e')}
  ${rock(760, 700, 120, 60, '#4e5752')}

  <!-- Huge trunks in the foreground -->
  <rect x="20" y="0" width="100" height="900" fill="#1d1712"/>
  <path d="M0,900 Q60,850 70,800 Q80,850 150,900 Z" fill="#1d1712"/>
  <rect x="1490" y="0" width="120" height="900" fill="#1b1611"/>
  <path d="M1440,900 Q1500,860 1540,800 Q1560,860 1600,900 Z" fill="#1b1611"/>
  ${pine(1380, 930, 760, '#17241b', '#1b1611')}

  ${signExit('forest', 290, 820, '↓ Stigen', 'Tillbaka till stigen', { width: 170 })}
  ${signExit('forest-glade', 1300, 760, 'Gläntan →', 'Gå till gläntan', { width: 190 })}

  <g class="actors"></g>

  <g class="fog slow" filter="url(#forest-spruce-blur)" fill="#dfe6e2" opacity="0.3">
    <ellipse cx="800" cy="860" rx="700" ry="60"/>
  </g>
</svg>`,
};

SCENES['forest-glade'] = {
  name: 'Gläntan',
  narration:
    'En liten glänta öppnar sig mitt i skogen. Svagt ljus silar ner genom dimman över mossiga stenar och en omkullfallen stam.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="En glänta i skogen">
  ${forestDefs('forest-glade', '#4d5b55', '#a2ada6', '#6f7d5e', '#26331f')}

  <rect width="1600" height="900" fill="url(#forest-glade-sky)"/>
  <rect y="500" width="1600" height="400" fill="url(#forest-glade-ground)"/>

  ${treeRow({ seed: 29, count: 48, x0: -40, x1: 1640, y0: 490, y1: 530, h0: 170, h1: 260, pineColor: '#8b9891', leafColor: '#92a097', trunk: '#86928c' })}
  <g class="fog slow" filter="url(#forest-glade-blur)" fill="#d6ddd9" opacity="0.55">
    <ellipse cx="800" cy="500" rx="800" ry="60"/>
  </g>

  <!-- Light shafts -->
  <g fill="#f4f1dc" opacity="0.12">
    <polygon points="620,0 720,0 900,700 700,700"/>
    <polygon points="860,0 920,0 1080,680 960,680"/>
  </g>

  ${treeRow({ seed: 41, count: 9, x0: -40, x1: 380, y0: 600, y1: 650, h0: 300, h1: 420, pineColor: '#46594d', leafColor: '#526656', trunk: '#3b463c' })}
  ${treeRow({ seed: 43, count: 9, x0: 1220, x1: 1640, y0: 600, y1: 650, h0: 300, h1: 420, pineColor: '#46594d', leafColor: '#526656', trunk: '#3b463c' })}
  <g class="fog" filter="url(#forest-glade-blur)" fill="#dde3df" opacity="0.4">
    <ellipse cx="300" cy="650" rx="420" ry="50"/>
    <ellipse cx="1300" cy="650" rx="420" ry="50"/>
  </g>

  ${rock(1010, 720, 240, 150, '#636c66')}
  ${rock(1110, 735, 110, 60, '#58615b')}

  <!-- Fallen log -->
  <g>
    <rect x="300" y="700" width="290" height="46" rx="20" fill="#4d3a28" transform="rotate(-6 445 723)"/>
    <ellipse cx="584" cy="708" rx="16" ry="24" fill="#9a7650" transform="rotate(-6 584 708)"/>
    <ellipse cx="584" cy="708" rx="8" ry="13" fill="none" stroke="#6f5236" stroke-width="2" transform="rotate(-6 584 708)"/>
    <path d="M330,712 q40,-20 90,-8 q50,-14 90,-6" fill="none" stroke="#4f6b3a" stroke-width="10" stroke-linecap="round"/>
  </g>

  <!-- Mushrooms -->
  <g>
    <rect x="796" y="700" width="6" height="14" fill="#efe6d0"/><ellipse cx="799" cy="700" rx="13" ry="7" fill="#b8322e"/>
    <rect x="830" y="716" width="6" height="12" fill="#efe6d0"/><ellipse cx="833" cy="716" rx="11" ry="6" fill="#b8322e"/>
    <rect x="862" y="704" width="5" height="11" fill="#efe6d0"/><ellipse cx="864" cy="704" rx="10" ry="5" fill="#c23a32"/>
  </g>

  ${fern(200, 820, 1.2, '#36523a')}
  ${fern(1440, 860, 1.3, '#2f4a33')}
  ${leafy(-40, 920, 600, '#1d2b21', '#2a2219')}
  ${pine(1580, 930, 680, '#18261d', '#241d15')}

  ${signExit('forest-spruce', 280, 770, '← Granskogen', 'Tillbaka till granskogen', { width: 220 })}
  ${signExit('forest-brook', 1340, 830, '↓ Bäcken', 'Gå ner till bäcken', { width: 170 })}

  <g class="actors"></g>

  <g class="fog slow" filter="url(#forest-glade-blur)" fill="#e6ebe8" opacity="0.3">
    <ellipse cx="800" cy="870" rx="700" ry="55"/>
  </g>
</svg>`,
};

SCENES['forest-brook'] = {
  name: 'Bäcken',
  narration:
    'En kall bäck porlar fram mellan stenarna. En gammal spång leder över vattnet, och dimman ligger lågt över ytan.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bäcken i skogen">
  ${forestDefs('forest-brook', '#36433f', '#7a8882', '#56645a', '#1c271e')}

  <rect width="1600" height="900" fill="url(#forest-brook-sky)"/>
  <rect y="480" width="1600" height="420" fill="url(#forest-brook-ground)"/>

  ${treeRow({ seed: 53, count: 46, x0: -40, x1: 1640, y0: 470, y1: 520, h0: 170, h1: 250, pineColor: '#7e8c86', leafColor: '#86948d', trunk: '#78857f' })}
  <g class="fog slow" filter="url(#forest-brook-blur)" fill="#c9d2ce" opacity="0.55">
    <ellipse cx="500" cy="490" rx="560" ry="60"/>
    <ellipse cx="1250" cy="480" rx="520" ry="60"/>
  </g>

  <!-- The brook -->
  <path fill="#5d7a83" d="M790,520 C780,560 730,600 745,640 C770,700 600,770 540,900 L880,900 C900,800 960,720 920,650 C885,600 835,560 820,520 Z"/>
  <path fill="#7d9ba3" opacity="0.6" d="M800,540 C795,575 760,610 770,640 C790,690 660,770 620,900 L700,900 C730,790 830,700 810,640 C800,605 815,570 812,540 Z"/>
  <g class="ripples" stroke="#c8dde2" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7">
    <path d="M760,620 q20,-6 40,0"/>
    <path d="M700,740 q30,-8 60,0"/>
    <path d="M640,840 q40,-10 80,0"/>
  </g>

  ${treeRow({ seed: 61, count: 22, x0: -40, x1: 1640, y0: 600, y1: 650, h0: 280, h1: 400, pineColor: '#4a5d52', leafColor: '#56695b', trunk: '#3f4a40' })}
  <g class="fog" filter="url(#forest-brook-blur)" fill="#d4dcd8" opacity="0.45">
    <ellipse cx="300" cy="650" rx="460" ry="50"/>
    <ellipse cx="1200" cy="640" rx="480" ry="55"/>
  </g>

  <!-- Stones in and along the water -->
  <g fill="#6c7470">
    <ellipse cx="700" cy="800" rx="34" ry="14"/>
    <ellipse cx="850" cy="760" rx="26" ry="11"/>
    <ellipse cx="560" cy="870" rx="40" ry="16"/>
    <ellipse cx="930" cy="690" rx="22" ry="9"/>
  </g>

  <!-- Footbridge over the brook -->
  <g>
    <polygon points="650,690 990,676 994,702 652,718" fill="#6b4f33"/>
    <path d="M700,689 l2,26 M760,687 l2,26 M820,684 l2,25 M880,682 l2,25 M940,679 l2,25" stroke="#4a3522" stroke-width="3"/>
    <path d="M656,692 L654,652 M988,678 L986,638 M654,654 L986,640" stroke="#4a3522" stroke-width="6" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Reeds -->
  <g stroke="#3d5a35" stroke-width="4" stroke-linecap="round">
    <path d="M520,860 l-6,-60 M532,862 l2,-70 M544,860 l8,-56"/>
    <path d="M920,840 l-4,-58 M932,842 l4,-66 M944,840 l10,-52"/>
  </g>

  ${fern(1180, 820, 1.2, '#2f4a33')}
  ${pine(40, 930, 700, '#18261d', '#241d15')}
  ${leafy(1620, 900, 620, '#1d2b21', '#2a2219')}

  ${signExit('forest', 290, 770, '← Stigen', 'Tillbaka till stigen', { width: 170 })}
  ${signExit('forest-glade', 1080, 600, 'Gläntan ↑', 'Gå upp till gläntan', { width: 190 })}

  <g class="actors"></g>

  <g class="fog slow" filter="url(#forest-brook-blur)" fill="#dfe6e2" opacity="0.35">
    <ellipse cx="800" cy="860" rx="700" ry="60"/>
  </g>
</svg>`,
};

// ---------- The lake ----------

// Far shore seen across the lake: the range, Mount Thunder and the village.
// Drawn with the shoreline at y = 0 so it can be mirrored in the water.
function lakeFarShore() {
  return `
    <polygon fill="#4a4d6c" points="0,0 0,-60 120,-110 240,-70 380,-130 500,-84 620,-104 760,-70 1300,-80 1420,-120 1520,-90 1600,-110 1600,0"/>
    <polygon fill="#3a3d58" points="600,0 760,-110 860,-200 940,-284 1000,-330 1060,-276 1150,-186 1270,-92 1420,0"/>
    <polygon fill="#262839" opacity="0.6" points="1000,-330 1060,-276 1150,-186 1270,-92 1420,0 1110,0 1050,-170 1020,-280"/>
    <polygon fill="#e9ecf5" points="1000,-330 1030,-300 1052,-278 1036,-268 1020,-282 1006,-262 990,-282 970,-264 954,-276 976,-300"/>
    ${treeRow({ seed: 71, count: 70, x0: -40, x1: 1640, y0: -2, y1: 4, h0: 22, h1: 46, pineColor: '#1f2b30', leafColor: '#243237', trunk: '#1f2b30', pineShare: 0.7 })}
    ${house(330, 2, 40, 26, '#c9b48f', '#7a3b2e', { chimney: true })}
    ${house(390, 4, 34, 22, '#d8c7a3', '#5d3a2a')}
    <rect x="452" y="-36" width="34" height="40" fill="#e2d6bd"/>
    <polygon points="448,-36 469,-52 490,-36" fill="#4c3b4f"/>
    <rect x="462" y="-62" width="14" height="26" fill="#e2d6bd"/>
    <polygon points="460,-62 469,-84 478,-62" fill="#4c3b4f"/>
    <circle class="window" cx="469" cy="-48" r="3" fill="#ffd977"/>
    ${house(510, 3, 42, 28, '#bfa57d', '#6b2f2a', { chimney: true })}
    ${house(570, 4, 32, 22, '#cdb892', '#4f3324')}
    <rect x="0" y="0" width="1600" height="6" fill="#1b2229"/>`;
}

// Sky, far shore and mirror-still water down to the bottom of the screen.
// horizon is the screen y of the far shoreline.
function lakeBackdrop(id, horizon) {
  const rand = seededRandom(horizon);
  let shimmer = '';
  for (let i = 0; i < 40; i++) {
    const y = horizon + 14 + rand() * (900 - horizon);
    const len = 20 + rand() * 90 * ((y - horizon) / (900 - horizon) + 0.3);
    shimmer += `M${(rand() * 1600).toFixed(0)},${y.toFixed(0)} l${len.toFixed(0)},0 `;
  }
  return `
  <defs>
    <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#151832"/>
      <stop offset="0.6" stop-color="#3b3f6b"/>
      <stop offset="1" stop-color="#8a7fa8"/>
    </linearGradient>
    <linearGradient id="${id}-water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6d6894"/>
      <stop offset="0.35" stop-color="#3a4670"/>
      <stop offset="1" stop-color="#18233c"/>
    </linearGradient>
    <filter id="${id}-blur" x="-50%" y="-200%" width="200%" height="500%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id}-murk" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
    <clipPath id="${id}-above-water"><rect x="-200" y="-300" width="400" height="300"/></clipPath>
  </defs>

  <rect width="1600" height="900" fill="url(#${id}-sky)"/>
  <rect class="sky-flash" width="1600" height="900" fill="#e8e6ff"/>
  <g fill="#e8e6ff" opacity="0.7">
    <circle cx="140" cy="70" r="1.6"/><circle cx="330" cy="150" r="1.2"/><circle cx="520" cy="50" r="1.8"/>
    <circle cx="1280" cy="60" r="1.6"/><circle cx="1450" cy="150" r="1.2"/><circle cx="240" cy="250" r="1.4"/>
  </g>
  <g class="storm-clouds">
    <g filter="url(#${id}-blur)" fill="#262842">
      <ellipse cx="900" cy="${horizon - 330}" rx="190" ry="36"/>
      <ellipse cx="1120" cy="${horizon - 350}" rx="200" ry="40"/>
    </g>
  </g>
  <g class="bolt" filter="url(#${id}-glow)">
    <polyline points="1130,${horizon - 340} 1108,${horizon - 296} 1128,${horizon - 292} 1100,${horizon - 230}" fill="none" stroke="#fff6b0" stroke-width="4" stroke-linejoin="round"/>
  </g>
  <g transform="translate(0 ${horizon})">${lakeFarShore()}</g>

  <rect y="${horizon}" width="1600" height="${900 - horizon}" fill="url(#${id}-water)"/>
  <g transform="translate(0 ${horizon + 6}) scale(1 -1)" opacity="0.3">${lakeFarShore()}</g>
  <path class="ripples" d="${shimmer}" stroke="#b9c3e6" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>`;
}

SCENES.lake = {
  name: 'Sjön',
  narration:
    'Sjön ligger stor och spegelblank. På andra sidan vattnet syns byn och Mount Thunder, ' +
    'och vid bryggan guppar en roddbåt.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sjön, med byn och berget i bakgrunden">
  ${lakeBackdrop('lake', 470)}

  <!-- A tentacle far out on the lake is added here by lake.js -->
  <g class="lake-far no-hit"></g>

  <!-- The shore -->
  <defs>
    <linearGradient id="lake-shore" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a7b5a"/>
      <stop offset="0.25" stop-color="#4f6a3a"/>
      <stop offset="1" stop-color="#22351b"/>
    </linearGradient>
  </defs>
  <path fill="#b5a57d" d="M0,724 C200,712 420,732 620,770 C780,800 900,840 990,900 L0,900 Z"/>
  <path fill="url(#lake-shore)" d="M0,740 C200,728 400,748 590,786 C740,816 840,852 900,900 L0,900 Z"/>
  ${rock(700, 812, 70, 30, '#6c7470', '#5a7a44')}
  ${rock(620, 860, 110, 46, '#5f6763', '#4f6b3a')}
  <g stroke="#3d5a35" stroke-width="4" stroke-linecap="round">
    <path d="M760,820 l-6,-64 M772,822 l2,-76 M784,820 l8,-58 M796,824 l12,-50"/>
    <path d="M40,750 l-4,-50 M52,752 l4,-58 M64,750 l10,-44"/>
  </g>

  ${pine(1560, 640, 260, '#1c2a24', '#241d15')}
  ${boathouse(150, 750, 280, 170)}

  <!-- A note on the boathouse wall: how to catch the squid (lake.js) -->
  <g class="readable lake-note" tabindex="0" role="button" aria-label="Läs lappen på sjöboden">
    ${pinnedNote(188, 616)}
  </g>

  <!-- The dock -->
  <g>
    <rect x="1124" y="632" width="10" height="34" fill="#3a2a1c"/>
    <rect x="1228" y="632" width="10" height="34" fill="#3a2a1c"/>
    <polygon points="1120,630 1240,630 1450,900 1050,900" fill="#8a6a46"/>
    <polygon points="1120,630 1240,630 1240,640 1120,640" fill="#5e4630"/>
    <path d="M1112,670 L1270,670 M1102,712 L1302,712 M1090,764 L1342,764 M1074,828 L1392,828" stroke="#5e4630" stroke-width="4"/>
    <path d="M1150,630 L1130,900 M1180,630 L1200,900 M1210,630 L1290,900" stroke="#6e5238" stroke-width="2"/>
  </g>

  <!-- The rowboat (exit once the player has the rod and the harpoon, see lake.js) -->
  <g class="exit lake-boat-exit" tabindex="0" role="button" aria-label="Ro ut med båten">
    <rect x="800" y="630" width="320" height="110" fill="transparent"/>
    <path d="M1100,676 Q1112,690 1126,650" fill="none" stroke="#c9b48a" stroke-width="3"/>
    ${rowboat(960, 708)}
    <g class="exit-label">
      <rect x="830" y="580" width="260" height="40" rx="6" fill="rgba(14,16,32,0.8)" stroke="#e0b44a"/>
      <text x="960" y="607" font-size="22" text-anchor="middle" fill="#f3ecd8">Ro ut med båten</text>
    </g>
  </g>

  ${signExit('town', 600, 800, '← Till byn', 'Tillbaka till byn', { width: 170 })}

  <!-- The fishing rod and the harpoon are added here by lake.js -->
  <g class="actors"></g>
</svg>`,
};

SCENES['lake-boat'] = {
  name: 'Ute på sjön',
  narration:
    'Du ror ut på den spegelblanka sjön. Åran tar dig tillbaka till stranden.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ute på sjön i roddbåten">
  ${lakeBackdrop('lake-boat', 390)}

  <!-- The squid's shadow swims here (lake.js) -->
  <g class="lake-under no-hit"></g>

  <!-- Clicking the water casts the float -->
  <rect class="lake-cast" x="0" y="396" width="1600" height="504" fill="transparent"/>

  <!-- Float and fishing line (lake.js) -->
  <g class="actors"></g>

  <!-- The rod, held over the side of the boat -->
  <g class="no-hit">
    <polygon points="1478,930 1494,926 1234,328 1228,330" fill="#5b3d22"/>
    <circle cx="1432" cy="820" r="16" fill="#3e4a52" stroke="#1f262b" stroke-width="3"/>
  </g>

  <!-- The boat, seen from the stern -->
  <g class="no-hit">
    <path d="M150,900 C420,850 700,770 800,738 C900,770 1180,850 1450,900 Z" fill="#5a3e26"/>
    <path d="M330,900 C520,860 720,790 800,760 C880,790 1080,860 1270,900 Z" fill="#46301d"/>
    <path d="M520,900 C620,860 740,800 800,775 M1080,900 C980,860 860,800 800,775" stroke="#5a3e26" stroke-width="4" fill="none"/>
    <path d="M150,900 C420,850 700,770 800,738 C900,770 1180,850 1450,900" fill="none" stroke="#7a5232" stroke-width="20" stroke-linejoin="round"/>
    <path d="M160,892 C420,842 700,762 800,730 C900,762 1180,842 1440,892" fill="none" stroke="#a0754a" stroke-width="4"/>
    <polygon points="788,736 800,700 812,736" fill="#7a5232"/>
  </g>

  <!-- The oar: row back to the shore -->
  <g class="exit" data-goto="lake" tabindex="0" role="button" aria-label="Ro tillbaka till stranden">
    <polygon points="90,700 620,830 620,900 90,860" fill="transparent"/>
    <line x1="600" y1="872" x2="200" y2="782" stroke="#c39a66" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="160" cy="772" rx="70" ry="20" transform="rotate(13 160 772)" fill="#c39a66" stroke="#8a6a46" stroke-width="3"/>
    <rect x="356" y="822" width="16" height="30" fill="#3e4a52" transform="rotate(13 364 837)"/>
    <g class="exit-label">
      <rect x="170" y="680" width="300" height="40" rx="6" fill="rgba(14,16,32,0.8)" stroke="#e0b44a"/>
      <text x="320" y="707" font-size="22" text-anchor="middle" fill="#f3ecd8">Ro tillbaka till stranden</text>
    </g>
  </g>
</svg>`,
};

// ---------- The cave ----------
// The cave is a small maze of dark passages:
//   Grottans mynning – Vägskälet – (vänster) Droppstensgrottan – Benhålan
//                              – (rakt fram) Avgrunden (återvändsgränd)
//                              – (höger) Benhålan – Spindelgången – Spindelnästet
// Every screen but the mouth is pitch dark; cave.js lets the torch light it up around the pointer.

// Shared defs and back wall, walls and floor of a cave passage. Ids are prefixed with the scene id.
function caveBackdrop(id, seed, { rock0 = '#2b241e', rock1 = '#14100d', floor = '#3a3128' } = {}) {
  const rand = seededRandom(seed);
  let cracks = '';
  for (let i = 0; i < 18; i++) {
    const x = 120 + rand() * 1360;
    const y = 80 + rand() * 480;
    cracks += `M${x.toFixed(0)},${y.toFixed(0)} l${(rand() * 40 - 20).toFixed(0)},${(20 + rand() * 40).toFixed(0)} l${(rand() * 30 - 15).toFixed(0)},${(10 + rand() * 30).toFixed(0)} `;
  }
  return `
  <defs>
    <linearGradient id="${id}-rock" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${rock1}"/>
      <stop offset="0.55" stop-color="${rock0}"/>
      <stop offset="1" stop-color="${rock1}"/>
    </linearGradient>
    <linearGradient id="${id}-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${floor}"/>
      <stop offset="1" stop-color="#0f0c09"/>
    </linearGradient>
    <filter id="${id}-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect x="-800" width="3200" height="900" fill="url(#${id}-rock)"/>
  <path d="${cracks}" fill="none" stroke="#0c0907" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  <path d="M-800,640 C200,600 600,590 800,590 C1000,590 1400,600 2400,640 L2400,900 L-800,900 Z" fill="url(#${id}-floor)"/>
  <path d="M-800,0 L250,0 C190,200 150,420 130,620 C110,760 70,850 20,900 L-800,900 Z" fill="#110d0a"/>
  <path d="M2400,0 L1350,0 C1410,200 1450,420 1470,620 C1490,760 1530,850 1580,900 L2400,900 Z" fill="#110d0a"/>
  ${stalactites(seed + 1, '#18130f', { count: 16, h0: 40, h1: 160 })}`;
}

// The darkness over a cave passage. The torch (cave.js) lights a circle in it around the
// pointer; `glows` are fixed spots that light themselves, as [x, y, r].
function caveDarkness(id, glows = [], opacity = 0.97) {
  const holes = glows.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}-light)"/>`).join('');
  return `
  <defs>
    <radialGradient id="${id}-light">
      <stop offset="0" stop-color="#000"/>
      <stop offset="0.45" stop-color="#000"/>
      <stop offset="0.8" stop-color="#000" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-warm">
      <stop offset="0" stop-color="#ffb050" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#ffb050" stop-opacity="0"/>
    </radialGradient>
    <mask id="${id}-dark" maskUnits="userSpaceOnUse" x="-800" y="-100" width="3200" height="1100">
      <rect x="-800" y="-100" width="3200" height="1100" fill="#fff"/>
      ${holes}
      <g class="torch-light" transform="translate(800 640)"><g class="torch-flicker"><circle r="300" fill="url(#${id}-light)"/></g></g>
    </mask>
  </defs>
  <g class="cave-dark no-hit">
    <rect x="-800" y="-100" width="3200" height="1100" fill="#030204" opacity="${opacity}" mask="url(#${id}-dark)"/>
    <g class="torch-light" transform="translate(800 640)"><g class="torch-flicker"><circle r="300" fill="url(#${id}-warm)"/></g></g>
  </g>`;
}

SCENES.cave = {
  name: 'Grottans mynning',
  narration:
    'Du står precis innanför grottans mynning vid bergets fot. Dagsljuset når bara några steg in, ' +
    'sedan försvinner gången in i kolsvart mörker.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Grottans mynning">
  ${caveBackdrop('cave', 101, { rock0: '#4a4038', rock1: '#1e1915', floor: '#5a4c3e' })}
  <defs>
    <radialGradient id="cave-deep" cx="0.5" cy="0.6" r="0.5">
      <stop offset="0" stop-color="#000"/>
      <stop offset="0.6" stop-color="#000" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cave-daylight">
      <stop offset="0" stop-color="#cfd8f0" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#cfd8f0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cave-torchglow">
      <stop offset="0" stop-color="#ffb050" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#ffb050" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Daylight falling in from the mouth, behind the player on the left -->
  <ellipse cx="-60" cy="560" rx="760" ry="620" fill="url(#cave-daylight)" class="no-hit"/>
  <ellipse cx="860" cy="470" rx="340" ry="300" fill="url(#cave-deep)"/>

  <!-- The passage into the dark (exit once the player has the torch, see cave.js) -->
  <g class="exit cave-deeper" tabindex="0" role="button" aria-label="Gå in i mörkret">
    <path d="M700,640 C690,480 760,330 860,320 C960,330 1030,480 1020,640 Z" fill="#000"/>
    <g class="exit-label">
      <rect x="720" y="440" width="280" height="40" rx="6" fill="rgba(14,16,32,0.85)" stroke="#e0b44a"/>
      <text x="860" y="467" font-size="22" text-anchor="middle" fill="#f3ecd8">Gå in i mörkret</text>
    </g>
  </g>

  ${stalactites(103, '#3a322b', { count: 6, y: 900, h0: 40, h1: 110, up: true })}
  ${rock(420, 760, 180, 90, '#4f463d', '#3e4a33')}
  ${rock(1180, 720, 120, 60, '#463e36', '#3e4a33')}
  ${cobweb(1350, 0, 1.2, -1)}

  <!-- Way back out to the village -->
  ${signExit('town', 260, 820, '← Till byn', 'Ut till byn', { width: 170 })}

  <!-- The torch is added here by cave.js -->
  <g class="actors"></g>
</svg>`,
};

SCENES['cave-fork'] = {
  name: 'Vägskälet',
  narration: 'Gången delar sig i tre. Mörkret är tätt, och någonstans droppar vatten.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ett vägskäl i grottan">
  ${caveBackdrop('cave-fork', 111)}
  ${caveOpening('cave-drip', 380, 640, 210, 280, 'Den vänstra gången')}
  ${caveOpening('cave-chasm', 800, 600, 170, 230, 'Gången rakt fram')}
  ${caveOpening('cave-bones', 1220, 640, 210, 280, 'Den högra gången')}
  ${stalactites(113, '#211b16', { count: 5, y: 900, h0: 50, h1: 120, up: true })}
  ${rock(600, 760, 120, 50, '#3a322b', '#2e2a22')}
  ${caveBack('cave', 'Tillbaka mot mynningen')}
  ${caveDarkness('cave-fork')}
</svg>`,
};

SCENES['cave-drip'] = {
  name: 'Droppstensgrottan',
  narration: 'Droppstenar hänger från taket, och en liten svart sjö blänker i mörkret. Plopp… plopp…',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="En grotta med droppstenar och en underjordisk sjö">
  ${caveBackdrop('cave-drip', 121, { rock0: '#28282a', rock1: '#121214', floor: '#34332f' })}
  ${stalactites(123, '#2c2b2a', { count: 22, h0: 80, h1: 260 })}
  <ellipse cx="640" cy="720" rx="360" ry="70" fill="#0d1820"/>
  <ellipse cx="640" cy="712" rx="320" ry="52" fill="#16283a" opacity="0.8"/>
  <g class="drip-rings no-hit" fill="none" stroke="#7aa0c0" stroke-width="2">
    <ellipse cx="600" cy="712" rx="30" ry="6"/><ellipse cx="600" cy="712" rx="56" ry="11" opacity="0.6"/>
  </g>
  ${stalactites(125, '#2f2e2c', { count: 9, y: 900, h0: 60, h1: 200, up: true })}
  ${caveOpening('cave-bones', 1250, 630, 200, 270, 'En smal gång')}
  ${caveBack('cave-fork', 'Tillbaka till vägskälet')}
  ${caveDarkness('cave-drip')}
</svg>`,
};

SCENES['cave-chasm'] = {
  name: 'Avgrunden',
  narration:
    'Gången tar plötsligt slut vid en djup avgrund. Du sparkar ner en sten – du hör den aldrig slå i botten. ' +
    'Här kommer du inte vidare.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="En avgrund i grottan">
  ${caveBackdrop('cave-chasm', 131)}
  <path d="M-800,610 C200,600 600,640 800,650 C1000,640 1400,600 2400,610 L2400,780 C1400,740 1000,760 800,770 C600,760 200,740 -800,780 Z" fill="#000"/>
  <path d="M-800,780 C200,740 600,760 800,770 C1000,760 1400,740 2400,780 L2400,800 C1400,760 1000,782 800,790 C600,782 200,760 -800,800 Z" fill="#4a3e33"/>
  ${stalactites(133, '#1a1511', { count: 7, y: 610, h0: 30, h1: 90, up: true })}
  ${caveBack('cave-fork', 'Tillbaka till vägskälet')}
  ${caveDarkness('cave-chasm')}
</svg>`,
};

SCENES['cave-bones'] = {
  name: 'Benhålan',
  narration: 'Gamla ben ligger utspridda över golvet. Något stort har ätit här…',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="En grotta full av gamla ben">
  ${caveBackdrop('cave-bones', 141, { rock0: '#30261f', rock1: '#150f0c', floor: '#3e3228' })}
  ${caveOpening('cave-webs', 400, 630, 220, 290, 'Den vänstra gången')}
  ${spiderWeb(400, 450, 110, { spokes: 10, rings: 5, opacity: 0.35 })}
  ${caveOpening('cave-drip', 1220, 630, 190, 250, 'Den högra gången')}
  ${bones(760, 740)}
  ${bones(1080, 800, 0.8)}
  ${bones(330, 820, 0.9)}
  ${cobweb(250, 0, 1)}
  ${caveBack('cave-fork', 'Tillbaka till vägskälet')}
  ${caveDarkness('cave-bones')}
</svg>`,
};

SCENES['cave-webs'] = {
  name: 'Spindelgången',
  narration: 'Tjocka spindelnät hänger överallt och klibbar mot ansiktet. Längre in prasslar något.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="En gång full av spindelnät">
  ${caveBackdrop('cave-webs', 151, { rock0: '#2a2422', rock1: '#110d0c', floor: '#36302b' })}
  ${caveOpening('cave-nest', 800, 620, 240, 320, 'Gå längre in')}
  ${spiderWeb(330, 330, 200, { spokes: 12, rings: 7, opacity: 0.35 })}
  ${spiderWeb(1300, 380, 230, { spokes: 14, rings: 8, opacity: 0.35 })}
  ${cocoon(520, 300)}
  ${cocoon(1080, 250, 1.2)}
  ${cocoon(1180, 360, 0.8)}
  ${cobweb(250, 0, 1.3)}
  ${cobweb(1350, 0, 1.3, -1)}
  ${bones(1100, 800, 0.8)}
  ${caveBack('cave-bones', 'Tillbaka till benhålan')}
  ${caveDarkness('cave-webs')}
  <!-- Eyes glowing in the dark far inside -->
  <g class="eyes no-hit" fill="#ff5a3c">
    <circle cx="780" cy="420" r="4"/><circle cx="796" cy="420" r="4"/>
    <circle cx="770" cy="412" r="2.5"/><circle cx="806" cy="412" r="2.5"/>
  </g>
</svg>`,
};

SCENES['cave-nest'] = {
  name: 'Spindelnästet',
  narration: 'Du kommer in i en stor grottsal. Ett enormt spindelnät spänner från vägg till vägg.',
  svg: `
<svg viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Spindelns näste">
  ${caveBackdrop('cave-nest', 161, { rock0: '#2c2420', rock1: '#100c0a', floor: '#3a302a' })}
  ${spiderWeb(800, 380, 520, { spokes: 16, rings: 9, opacity: 0.4, cls: 'nest-web' })}
  ${cocoon(300, 420, 1.1)}
  ${cocoon(1320, 460)}
  ${bones(420, 790)}
  ${bones(1200, 760, 0.9)}

  <!-- The spider and the ruby are added here by cave.js -->
  <g class="actors"></g>

  ${caveBack('cave-webs', 'Tillbaka till spindelgången')}
  ${caveDarkness('cave-nest', [], 0.93)}
</svg>`,
};
