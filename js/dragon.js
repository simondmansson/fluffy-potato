// The fight with the thunder dragon on the summit, at night. The player stabs the four stolen
// emeralds off his back with the spear while he attacks:
// - Ringelattacken: he winds up in S-curves towards the player. A flash of lightning lights up his
//   head shortly before he strikes and shows the side he comes from; the player dodges by clicking
//   the other half of the picture. A dodge lets his flank glide past, with an emerald to stab.
// - Legendary Thunder (rarer): he rears up and charges a ball of lightning. The player clicks the
//   »Rubinskölden« button just before the bolt; blocked, it bounces back and stuns him, and an
//   emerald can be stabbed.
// The armour gives DRAGON_LIVES lives. Winning gives the item 'emeralds' and a party in the village.
// Reuses helpers from forest.js (randomBetween, hasItem, svgPoint, flashEffect, restartAnimation),
// onActivate() from cave.js, gearForged() from forge.js and mountainNarration() from mountain.js.

const DRAGON_LIVES = 5;
const DRAGON_EMERALDS = 4;

// The winding body: segments trailing the head along its path, and which carry the emeralds
// (the first emerald to be stabbed is the one nearest his head).
const SERPENT_SEGMENTS = 50;
const SEGMENT_GAP = 0.016; // how far behind the one in front each segment is, along the path
const EMERALD_SEGMENTS = [8, 18, 28, 38];

// Tuning, indexed by how many emeralds the player has already stabbed off.
const COIL_TIME = [5, 4.4, 3.8, 3.3]; // seconds for his whole approach: he gets faster
const WARN_AT = [0.6, 0.64, 0.68, 0.72]; // how far along the lightning shows his head: it comes later
const PASS_TIME = [1.7, 1.55, 1.4, 1.25]; // seconds his flank takes to glide past after a dodge
const STRIKE_AT = 0.95; // how far along he strikes
const CHARGE_TIME = 3.6; // seconds Legendary Thunder charges before the bolt
const RUBY_SHIELD_UP = 0.9; // seconds the ruby shield stays up after a click
const RUBY_SHIELD_REST = 0.3; // seconds before it can be raised again
const STUN_TIME = 2.6; // seconds he is stunned by his own bolt
const THUNDER_CHANCE = 0.25; // chance that an attack is Legendary Thunder (never twice in a row)
const STAB_COOLDOWN = 0.45; // seconds before the spear can strike again; clicks in between are ignored
const RETREAT_TIME = 1.4; // seconds of darkness between attacks

// Message shown instead of the scene narration on the next village render.
let dragonNotice = '';

function dragonDefeated() {
  return hasItem('emeralds');
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Where along his winding path (s from 0, far away, to 1, at the player) the dragon is, and how
// big he is there. side is -1 or 1: he swings out to that side before he strikes.
function serpentAt(s, side) {
  const wave = 320 * Math.sin(s * Math.PI * 4) * (1 - smoothstep(0.35, 0.7, s));
  const swing = side * 520 * smoothstep(0.4, 0.78, s) * (1 - smoothstep(0.84, 1, s));
  return { x: 800 + wave + swing, y: 300 + s * 560, k: 0.22 + s * 1.5 };
}

// ---------- The summit ----------

SCENES.summit.enter = (svg) => {
  const dragon = svg.querySelector('.dragon-target');
  if (dragonDefeated()) {
    dragon.remove();
    svg.querySelectorAll('.bolt, .sky-flash, .storm-clouds').forEach((el) => el.setAttribute('display', 'none'));
    setNarration(
      mountainNotice
        ? mountainNarration('summit')
        : 'Toppen av Mount Thunder är tyst och stilla. Åskmolnen är borta och stjärnorna lyser. Här bodde åskdraken en gång.'
    );
    return null;
  }

  setNarration(mountainNarration('summit', gearForged() ? 'Klicka på draken för att väcka honom och börja striden!' : ''));
  const snore = dragon.querySelector('.dragon-snore');
  onActivate(dragon, () => {
    if (gearForged()) {
      startDragonFight();
      return;
    }
    restartAnimation(snore, 'snoring');
    setNarration(
      'Du smyger närmare. Åskdraken andas tungt i sömnen, och gnistor knastrar mellan hans horn. ' +
        'Utan rustning och spjut har du ingen chans mot honom.'
    );
  });
  return null;
};

// ---------- The party in the village ----------

const mountainTownEnter = SCENES.town.enter; // from mountain.js

SCENES.town.enter = (svg) => {
  const notice = churchNotice; // shown and used up by church.js
  const cleanup = mountainTownEnter(svg);
  if (dragonDefeated()) {
    // The storm is over: no dragon circling the peak, no more lightning.
    svg.querySelectorAll('.dragon, .bolt, .sky-flash').forEach((el) => el.setAttribute('display', 'none'));
    svg.querySelector('.actors').insertAdjacentHTML('afterbegin', villageParty());
  }
  if (dragonNotice) {
    setNarration(dragonNotice);
    dragonNotice = '';
  } else if (dragonDefeated() && !notice) {
    setNarration(
      'Det är fest i byn! Flaggor hänger mellan husen, lyktorna lyser och fyrverkerier smäller över Mount Thunder. ' +
        (state.name ? `Alla firar ${state.name}, ` : 'Alla firar ') +
        'hjälten som besegrade åskdraken och tog tillbaka smaragderna!'
    );
  }
  return cleanup;
};

// ---------- Minigame: the fight ----------

function startDragonFight() {
  const sceneEl = document.getElementById('scene');
  const overlay = document.getElementById('minigame');
  overlay.classList.add('dragon-fight');
  overlay.innerHTML = `
    ${dragonArena()}
    <div class="mg-panel hud-box dragon-panel">
      <div class="mg-row">
        <span>Liv</span>
        <span class="mg-hits">${'<i class="mg-hit life"></i>'.repeat(DRAGON_LIVES)}</span>
      </div>
      <div class="mg-row">
        <span>Smaragder</span>
        <span class="mg-hits">${'<i class="mg-hit em"></i>'.repeat(DRAGON_EMERALDS)}</span>
      </div>
      <button type="button" class="shield-btn" hidden>Rubinskölden</button>
    </div>`;
  overlay.hidden = false;
  sceneEl.inert = true;
  requestAnimationFrame(() => overlay.classList.add('open'));

  setNarration(
    'Åskdraken slår upp ögonen och vrålar så att berget skakar! Han ringlar iväg ut i mörkret – ' +
      'bara de fyra smaragderna syns. Stöt loss dem med spjutet!'
  );

  const svg = overlay.querySelector('svg');
  const q = (sel) => svg.querySelector(sel);
  const serpent = q('.mg-serpent');
  const head = q('.mg-head');
  const headLitEl = q('.mg-head-lit');
  const rising = q('.mg-rising');
  const rise = q('.mg-rise');
  const risingLit = q('.mg-rising-lit');
  const ball = q('.mg-ball');
  const flank = q('.mg-flank');
  const flankEm = q('.mg-flank-em');
  const bolt = q('.mg-bolt');
  const bounce = q('.mg-bounce');
  const player = q('.mg-player');
  const pshield = q('.mg-pshield');
  const hints = q('.mg-hints');
  const legend = q('.mg-legend');
  const darkEl = q('.mg-dark');
  const flashEl = q('.mg-flash');
  const hurtEl = q('.mg-hurt');
  const fx = q('.mg-fx');
  const shieldBtn = overlay.querySelector('.shield-btn');
  const lifeMarks = overlay.querySelectorAll('.mg-hit.life');
  const emMarks = overlay.querySelectorAll('.mg-hit.em');
  lifeMarks.forEach((m) => m.classList.add('done'));

  // The winding body, tail first so the parts nearer the player are drawn on top.
  let segs = '';
  for (let i = SERPENT_SEGMENTS - 1; i >= 0; i--) {
    const em = EMERALD_SEGMENTS.indexOf(i);
    segs += `
      <g class="mg-seg" data-i="${i}" display="none">
        <path d="M-26,-34 L4,-76 L26,-34 Z" fill="#101024"/>
        <circle r="44" fill="#1a1a36"/>
        ${em >= 0 ? `<g class="mg-seg-em" data-em="${em}" transform="translate(0 -30) scale(1.2)">${emeraldGem('mgd-glow')}</g>` : ''}
      </g>`;
  }
  serpent.innerHTML = segs;
  const segEls = [];
  serpent.querySelectorAll('.mg-seg').forEach((el) => {
    segEls[Number(el.dataset.i)] = el;
  });

  let lives = DRAGON_LIVES;
  let stabbed = 0; // emeralds knocked off
  let phase = 'intro';
  let phaseT = 0; // seconds in the current phase
  let lastAttack = '';
  let thunderSeen = false;
  let over = false;
  let raf = 0;
  let last = performance.now();
  let readyAt = 0; // time (ms) the next spear stab is allowed

  // Ringelattacken
  let s = 0; // how far along his path the head is
  let side = 1; // the side he swings out to and comes from
  let sideNow = 1; // eases towards side, so a change of side is a smooth turn
  let playerSide = 0; // where the player stands: -1 left, 0 middle, 1 right
  let playerX = 800;
  let warned = false;

  // Legendary Thunder
  let shieldUntil = 0; // time (ms) the shield is up until
  let shieldReadyAt = 0;

  // Light
  let flash = 0; // lightning lighting up the sky, fades by itself
  let headLit = 0;
  let dark = 0; // darkness over the sky, target value
  let darkNow = 0;
  let hurt = 0;
  let ambient = randomBetween(2, 4); // seconds to the next flash of lightning in the distance

  function markEmeralds() {
    svg.querySelectorAll('.mg-seg-em, .mg-rem').forEach((el) => {
      el.setAttribute('display', Number(el.dataset.em) < stabbed ? 'none' : 'inline');
    });
    emMarks.forEach((m, i) => m.classList.toggle('done', i < stabbed));
  }

  function showSerpent(on) {
    serpent.setAttribute('display', on ? 'inline' : 'none');
    head.setAttribute('display', on ? 'inline' : 'none');
  }

  // Play one of the rearing dragon's animations (rising, stunned, flee).
  function riseAnim(cls) {
    rise.setAttribute('class', 'mg-rise');
    restartAnimation(rise, cls);
  }

  function setPhase(p) {
    phase = p;
    phaseT = 0;
  }

  function movePlayer(to) {
    playerSide = to;
    player.setAttribute('transform', `translate(${800 + to * 380} 840)`);
  }

  function nextAttack() {
    const thunder =
      stabbed > 0 &&
      lastAttack !== 'thunder' &&
      (Math.random() < THUNDER_CHANCE || (stabbed >= 2 && !thunderSeen));
    if (thunder) startThunder();
    else startCoil();
  }

  // ----- Ringelattacken -----

  function startCoil() {
    lastAttack = 'coil';
    side = Math.random() < 0.5 ? -1 : 1;
    sideNow = side;
    s = 0;
    warned = false;
    movePlayer(0);
    showSerpent(true);
    hints.setAttribute('opacity', '0.8');
    setPhase('coil');
    setNarration('Draken ringlar fram mot dig i mörkret – följ smaragderna! Väj när blixten lyser upp hans huvud.');
  }

  function placeSerpent() {
    for (let i = 0; i < SERPENT_SEGMENTS; i++) {
      const si = s - i * SEGMENT_GAP;
      const el = segEls[i];
      if (si < 0) {
        el.setAttribute('display', 'none');
        continue;
      }
      const p = serpentAt(si, sideNow);
      el.setAttribute('display', 'inline');
      el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.k.toFixed(3)})`);
    }
    const h = serpentAt(s, sideNow);
    head.setAttribute('transform', `translate(${h.x.toFixed(1)} ${(h.y + 10 * h.k).toFixed(1)}) scale(${(h.k * 1.1).toFixed(3)})`);
  }

  function tickCoil(dt) {
    s += dt / COIL_TIME[stabbed];
    sideNow += (side - sideNow) * Math.min(1, dt * 5);
    if (!warned && s >= WARN_AT[stabbed]) {
      warned = true;
      if (playerSide !== 0) {
        // Dodged too early: he turns after the player.
        side = playerSide;
        setNarration('För tidigt! Draken svänger efter dig – väj igen!');
      } else {
        setNarration(`Blixt! Han kommer från ${side < 0 ? 'vänster' : 'höger'} – väj åt andra hållet!`);
      }
      flash = 0.55;
      headLit = 1;
    }
    placeSerpent();
    if (s >= STRIKE_AT) {
      hints.setAttribute('opacity', '0');
      if (playerSide === -side) {
        showSerpent(false);
        startPass();
      } else {
        showSerpent(false);
        takeHit(1, 'Draken träffar dig med full kraft!');
        if (!over) startRetreat();
      }
    }
  }

  function startPass() {
    flank.setAttribute('display', 'inline');
    flankEm.setAttribute('display', 'inline');
    setPhase('pass');
    flash = 0.35;
    setNarration('Du väjer! Drakens rygg glider förbi tätt intill – stöt spjutet i smaragden!');
  }

  function tickPass() {
    const u = 1 - (2 * phaseT) / PASS_TIME[stabbed];
    // Slow in the middle, so there is time to aim.
    const x = 800 + side * 1500 * Math.sign(u) * Math.abs(u) ** 3;
    flank.setAttribute('transform', `translate(${x.toFixed(1)} 640)`);
    if (phaseT >= PASS_TIME[stabbed]) {
      flank.setAttribute('display', 'none');
      setNarration('Smaragden glider förbi i mörkret. Draken vänder…');
      startRetreat();
    }
  }

  // ----- Legendary Thunder -----

  function startThunder() {
    lastAttack = 'thunder';
    thunderSeen = true;
    movePlayer(0);
    dark = 0.85;
    rising.setAttribute('display', 'inline');
    risingLit.setAttribute('opacity', '0');
    riseAnim('rising');
    legend.setAttribute('display', 'inline');
    ball.setAttribute('transform', 'scale(0)');
    shieldBtn.hidden = false;
    shieldBtn.disabled = false;
    shieldUntil = 0;
    shieldReadyAt = 0;
    svg.querySelectorAll('.mg-rem').forEach((el) => el.classList.add('bright'));
    setPhase('charge');
    setNarration(
      'Himlen blir kolsvart och åskan mullrar. Draken reser sig, och ett klot av blixtar växer mellan hans horn: ' +
        'LEGENDARY THUNDER! Klicka på Rubinskölden precis innan blixten slår ner!'
    );
  }

  function raiseShield() {
    const now = performance.now();
    if (phase !== 'charge' || now < shieldReadyAt) return;
    shieldUntil = now + RUBY_SHIELD_UP * 1000;
    shieldReadyAt = now + (RUBY_SHIELD_UP + RUBY_SHIELD_REST) * 1000;
    shieldBtn.disabled = true;
    pshield.classList.add('up');
  }

  function tickCharge(dt) {
    const now = performance.now();
    const up = now < shieldUntil;
    pshield.classList.toggle('up', up);
    if (!up && now >= shieldReadyAt) shieldBtn.disabled = false;
    const grow = Math.min(1, phaseT / CHARGE_TIME);
    ball.setAttribute('transform', `scale(${(0.15 + grow * 1.1).toFixed(3)})`);
    if (Math.random() < dt * 3) flash = Math.max(flash, 0.15);
    if (phaseT < CHARGE_TIME) return;

    // The bolt strikes.
    legend.setAttribute('display', 'none');
    shieldBtn.hidden = true;
    ball.setAttribute('transform', 'scale(0)');
    bolt.setAttribute('display', 'inline');
    setTimeout(() => bolt.setAttribute('display', 'none'), 350);
    flash = 1;
    if (up) {
      bounce.setAttribute('display', 'inline');
      setTimeout(() => bounce.setAttribute('display', 'none'), 500);
      startStun();
    } else {
      pshield.classList.remove('up');
      svg.querySelectorAll('.mg-rem').forEach((el) => el.classList.remove('bright'));
      takeHit(2, shieldUntil ? 'För tidigt – skölden hann sjunka! Blixten träffar dig!' : 'Blixten träffar dig!');
      if (!over) startRetreat();
    }
  }

  function startStun() {
    setPhase('stun');
    dark = 0.3;
    risingLit.setAttribute('opacity', '0.8');
    riseAnim('stunned');
    const target = svg.querySelector(`.mg-rem[data-em="${stabbed}"]`);
    svg.querySelectorAll('.mg-rem').forEach((el) => el.classList.remove('bright'));
    target.classList.add('target');
    setTimeout(() => pshield.classList.remove('up'), 500);
    setNarration(
      'Blixten studsar mot rubinskölden och rakt tillbaka på draken! Han är bedövad – stöt spjutet i den lysande smaragden!'
    );
  }

  function endStun(text) {
    svg.querySelectorAll('.mg-rem').forEach((el) => el.classList.remove('target'));
    pshield.classList.remove('up');
    if (text) setNarration(text);
  }

  function tickStun() {
    if (phaseT >= STUN_TIME) {
      endStun('Draken skakar av sig bedövningen och ringlar iväg i mörkret…');
      startRetreat();
    }
  }

  // ----- Hits, emeralds and the end -----

  function takeHit(n, text) {
    lives = Math.max(0, lives - n);
    lifeMarks.forEach((m, i) => m.classList.toggle('done', i < lives));
    hurt = 0.6;
    restartAnimation(svg, 'shaken');
    if (lives <= 0) {
      finish(false);
      return;
    }
    setNarration(`${text} Du har ${lives} liv kvar.`);
  }

  function stabEmerald(p) {
    flashEffect(
      fx,
      p.x,
      p.y,
      '<g class="mg-spark"><path d="M0,-50 L0,-20 M0,20 L0,50 M-50,0 L-20,0 M20,0 L50,0 M-35,-35 L-14,-14 M14,14 L35,35 M35,-35 L14,-14 M-14,14 L-35,35" stroke="#a8ffd0" stroke-width="7" stroke-linecap="round"/></g>',
      500
    );
    stabbed++;
    markEmeralds();
    if (stabbed >= DRAGON_EMERALDS) {
      finish(true);
      return;
    }
    setNarration(`Pang! Smaragden lossnar och faller ner i snön! ${DRAGON_EMERALDS - stabbed} kvar. Draken vrålar av ilska…`);
    startRetreat();
  }

  function startRetreat() {
    showSerpent(false);
    flank.setAttribute('display', 'none');
    // The rearing dragon sinks back into the dark.
    if (rising.getAttribute('display') !== 'none') {
      riseAnim('sinking');
      setTimeout(() => {
        if (!over) rising.setAttribute('display', 'none');
      }, 700);
    }
    dark = 0;
    setPhase('retreat');
  }

  svg.addEventListener('click', (e) => {
    if (over) return;
    const p = svgPoint(svg, e);
    if (phase === 'coil') {
      movePlayer(p.x < 800 ? -1 : 1);
      return;
    }
    if (phase !== 'pass' && phase !== 'stun') return;
    // Still thrusting: ignore the click, so spam-clicking doesn't pile up stabs.
    const now = performance.now();
    if (now < readyAt) return;
    readyAt = now + STAB_COOLDOWN * 1000;
    const onTarget =
      phase === 'pass'
        ? e.target.closest('.mg-em-target')
        : e.target.closest(`.mg-rem[data-em="${stabbed}"] .mg-rem-target`);
    if (onTarget) {
      if (phase === 'pass') flankEm.setAttribute('display', 'none');
      else endStun('');
      stabEmerald(p);
    } else {
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-miss"><text font-size="40" text-anchor="middle" fill="#ffd977" stroke="#1a1208" stroke-width="2">Miss!</text></g>',
        700
      );
    }
  });

  onActivate(shieldBtn, raiseShield);

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    phaseT += dt;

    if (phase === 'intro' && phaseT > 2.2) nextAttack();
    else if (phase === 'coil') tickCoil(dt);
    else if (phase === 'pass') tickPass();
    else if (phase === 'charge') tickCharge(dt);
    else if (phase === 'stun') tickStun();
    else if (phase === 'retreat' && phaseT > RETREAT_TIME) nextAttack();
    if (over) return;

    // Lightning far away now and then shows his outline.
    ambient -= dt;
    if (ambient <= 0 && phase !== 'charge') {
      flash = Math.max(flash, 0.4);
      ambient = randomBetween(3, 6);
    }
    flash = Math.max(0, flash - dt * 2.2);
    headLit = Math.max(0, headLit - dt * 1.4);
    hurt = Math.max(0, hurt - dt * 1.5);
    darkNow += (dark - darkNow) * Math.min(1, dt * 3);
    flashEl.setAttribute('opacity', flash.toFixed(3));
    headLitEl.setAttribute('opacity', headLit.toFixed(3));
    hurtEl.setAttribute('opacity', hurt.toFixed(3));
    darkEl.setAttribute('opacity', darkNow.toFixed(3));
    raf = requestAnimationFrame(tick);
  }

  function finish(won) {
    over = true;
    phase = 'over';
    cancelAnimationFrame(raf);
    shieldBtn.hidden = true;
    hints.setAttribute('opacity', '0');
    legend.setAttribute('display', 'none');
    showSerpent(false);
    flank.setAttribute('display', 'none');
    hurtEl.setAttribute('opacity', '0');
    if (won) {
      // The storm is over: his outline in clear starlight as he shrinks and flies away.
      darkEl.setAttribute('opacity', '0');
      flashEl.setAttribute('opacity', '0');
      q('.mg-clouds').classList.add('clearing');
      rising.setAttribute('display', 'inline');
      risingLit.setAttribute('opacity', '0.8');
      ball.setAttribute('transform', 'scale(0)');
      riseAnim('flee');
      if (!dragonDefeated()) state.items.push('emeralds');
      saveState(state);
      updateHud();
      restartAnimation(document.getElementById('inventory'), 'gain');
      setNarration(
        'Den sista smaragden lossnar! Utan de stulna smaragderna tappar åskdraken all sin kraft. ' +
          'Han krymper, piper ilsket och flyger sin väg ut i natten. Åskmolnen skingras över Mount Thunder!'
      );
      dragonNotice =
        'Du kommer ner till byn med de fyra smaragderna, och alla kommer springande. Det blir fest! ' +
        'Flaggor hänger mellan husen, lyktorna lyser och fyrverkerier smäller över berget. ' +
        (state.name ? `»Leve ${state.name}!«, ropar skogshuggaren. ` : '»Leve hjälten!«, ropar skogshuggaren. ') +
        'Åskdraken är besegrad!';
      setTimeout(() => close(), 4200);
    } else {
      setNarration('Rustningen håller inte längre! Draken tar ett djupt andetag och blåser…');
      dragonNotice =
        'Puh! Draken blåste ner dig från berget, hela vägen till byn. Smeden har lagat din rustning – ' +
        'gå upp till toppen och försök igen!';
      setTimeout(() => close(), 2200);
    }
  }

  function close() {
    sceneEl.inert = false;
    render('town');
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.hidden = true;
      overlay.innerHTML = '';
      overlay.classList.remove('dragon-fight');
    }, 400);
  }

  markEmeralds();
  raf = requestAnimationFrame(tick);
}
