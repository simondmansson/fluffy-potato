// The forge in the village. With all four rubies the smith forges them into armour and a
// spear that stand up to the thunder dragon's emeralds, in a minigame: the ruby glows up
// and fades again, and the player strikes with the hammer when it glows the most.
// Reuses helpers from forest.js (hasItem, svgPoint, flashEffect, restartAnimation)
// and onActivate() from cave.js.

// The rubies the smith needs: one from every place.
const FORGE_NEEDS = ['forest', 'lake', 'cave', 'town'];

// What each ruby becomes, in order. The last one is the spear.
const FORGE_PIECES = [
  { shape: 'helmet', name: 'hjälmen', done: 'Hjälmen är klar!' },
  { shape: 'breastplate', name: 'bröstplåten', done: 'Bröstplåten är klar!' },
  { shape: 'shield', name: 'skölden', done: 'Skölden är klar!' },
  { shape: 'spear', name: 'spjutet', done: 'Spjutet är klart!' },
];

// Forging minigame tuning.
const FORGE_STRIKES = 3; // good strikes needed for each piece
const HAMMER_COOLDOWN = 0.5; // seconds before the hammer can strike again; clicks in between are ignored
const GLOW_PERIOD = [1.9, 1.7, 1.5, 1.3]; // seconds from cold to glowing and back, per piece
const HOT_ZONE = [0.8, 0.83, 0.86, 0.88]; // how hot the ruby must glow to be struck, per piece
const COOL_PAUSE = 0.8; // seconds the ruby stays cold after a strike at the wrong time

// Where the smith stands in the forge (his feet).
const SMITH_SPOT = { x: 1110, y: 800 };

// Message shown instead of the scene narration on the next forge render.
let forgeNotice = '';

function hasAllRubies() {
  return FORGE_NEEDS.every((id) => state.rubies.includes(id));
}

function gearForged() {
  return hasItem('armor') && hasItem('spear');
}

function smithLine() {
  if (gearForged()) {
    return (
      '»Rustningen sitter som gjuten!«, säger smeden. »Rubinerna i den står emot kraften från drakens smaragder. ' +
      'Åskdraken visar sig på toppen av Mount Thunder när natten faller – akta dig för hans smaragder!«'
    );
  }
  if (hasAllRubies()) return null; // he gets to work
  const rubies = state.rubies.filter((id) => FORGE_NEEDS.includes(id)).length;
  return (
    '»Kom tillbaka när du har alla fyra rubinerna«, säger smeden och torkar svetten ur pannan. ' +
    '»Av dem kan jag smida en rustning och ett spjut som står emot åskdrakens smaragder.« ' +
    `Du har ${rubies} av 4.`
  );
}

// ---------- The smithy in the village ----------

const churchTownEnter = SCENES.town.enter; // from church.js

SCENES.town.enter = (svg) => {
  const notice = churchNotice; // church.js shows it, and then it is used up
  const cleanup = churchTownEnter(svg);
  if (!notice && hasAllRubies() && !gearForged()) {
    setNarration(
      `${SCENES.town.narration} Från smedjan hörs hammarslag – smeden kan smida om dina rubiner till rustning och vapen!`
    );
  }
  return cleanup;
};

// ---------- Inside the forge ----------

SCENES.forge.enter = (svg) => {
  const actors = svg.querySelector('.actors');
  actors.insertAdjacentHTML(
    'beforeend',
    `<g class="npc smith-target" tabindex="0" role="button" aria-label="Prata med smeden"
        transform="translate(${SMITH_SPOT.x} ${SMITH_SPOT.y})">
      <rect x="-80" y="-280" width="150" height="290" fill="transparent"/>
      ${smith()}
    </g>`
  );
  onActivate(actors.querySelector('.smith-target'), () => {
    const line = smithLine();
    if (line) setNarration(line);
    else startForging();
  });

  if (forgeNotice) {
    setNarration(forgeNotice);
    forgeNotice = '';
  } else if (hasAllRubies() && !gearForged()) {
    setNarration(
      `${SCENES.forge.narration} Smeden får syn på dina fyra rubiner och spärrar upp ögonen. ` +
        '»Äntligen! Av dem kan jag smida en rustning och ett spjut. Säg till när du är redo!«'
    );
  }
  return null;
};

// ---------- Minigame: forge the rubies ----------

function startForging() {
  const sceneEl = document.getElementById('scene');
  const overlay = document.getElementById('minigame');
  overlay.classList.add('forge');
  overlay.innerHTML = `
    ${forgeCloseUp()}
    <div class="mg-panel hud-box">
      <div class="mg-row">
        <span>Glöd</span>
        <div class="mg-bar mg-glow-bar"><div class="mg-fill"></div><i class="mg-zone"></i></div>
      </div>
      <div class="mg-row">
        <span>Slag</span>
        <span class="mg-hits mg-strikes">${'<i class="mg-hit"></i>'.repeat(FORGE_STRIKES)}</span>
      </div>
      <div class="mg-row">
        <span>Smitt</span>
        <span class="mg-hits mg-pieces">${'<i class="mg-hit"></i>'.repeat(FORGE_PIECES.length)}</span>
      </div>
    </div>`;
  overlay.hidden = false;
  sceneEl.inert = true;
  requestAnimationFrame(() => overlay.classList.add('open'));

  setNarration(
    '»Nu smider vi!«, säger smeden och lägger den första rubinen på städet. Rubinen glöder upp och slocknar ' +
      'om och om igen – slå med hammaren när den glöder som starkast! Först blir det en hjälm.'
  );

  const svg = overlay.querySelector('svg');
  const heat = svg.querySelector('.mg-heat');
  const work = svg.querySelector('.mg-work');
  const lump = svg.querySelector('.mg-lump');
  const hammer = svg.querySelector('.mg-hammer');
  const fx = svg.querySelector('.mg-fx');
  const fill = overlay.querySelector('.mg-fill');
  const zone = overlay.querySelector('.mg-zone');
  const strikeMarks = overlay.querySelectorAll('.mg-strikes .mg-hit');
  const pieceMarks = overlay.querySelectorAll('.mg-pieces .mg-hit');

  let piece = 0; // index into FORGE_PIECES
  let strikes = 0; // good strikes on the current piece
  let phase = 0; // 0..1 through one glow, starting cold
  let cold = 0; // seconds the ruby stays cold after a bad strike
  let glow = 0;
  let over = false;
  let raf = 0;
  let last = performance.now();
  let readyAt = 0; // time (ms) the next strike is allowed

  function showPiece() {
    const shape = FORGE_PIECES[piece].shape;
    svg.querySelectorAll('.mg-shape').forEach((el) => {
      el.setAttribute('opacity', el.dataset.shape === shape ? (strikes / FORGE_STRIKES).toFixed(2) : '0');
    });
    const s = 1 - (strikes / FORGE_STRIKES) * 0.8;
    lump.setAttribute('transform', `scale(${s.toFixed(2)})`);
    lump.setAttribute('opacity', strikes >= FORGE_STRIKES ? '0' : '1');
    strikeMarks.forEach((m, i) => m.classList.toggle('done', i < strikes));
    zone.style.left = `${HOT_ZONE[piece] * 100}%`;
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (cold > 0) {
      cold -= dt;
      phase = 0;
    } else {
      phase = (phase + dt / GLOW_PERIOD[piece]) % 1;
    }
    glow = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
    heat.setAttribute('opacity', glow.toFixed(3));
    fill.style.width = `${(glow * 100).toFixed(1)}%`;
    fill.classList.toggle('hot', glow >= HOT_ZONE[piece]);
    raf = requestAnimationFrame(tick);
  }

  svg.addEventListener('click', (e) => {
    if (over) return;
    // Still swinging: ignore the click, so spam-clicking doesn't pile up strikes.
    const now = performance.now();
    if (now < readyAt) return;
    readyAt = now + HAMMER_COOLDOWN * 1000;
    restartAnimation(hammer, 'strike');

    if (glow >= HOT_ZONE[piece]) {
      strikes++;
      restartAnimation(work, 'struck');
      flashEffect(
        fx,
        860,
        446,
        '<g class="mg-spark"><path d="M0,-70 L0,-30 M0,30 L0,70 M-70,0 L-30,0 M30,0 L70,0 M-50,-50 L-22,-22 M22,22 L50,50 M50,-50 L22,-22 M-22,22 L-50,50" stroke="#ffd977" stroke-width="8" stroke-linecap="round"/></g>',
        500
      );
      showPiece();
      if (strikes < FORGE_STRIKES) {
        setNarration(`Pang! Gnistorna yr – ${FORGE_STRIKES - strikes} slag kvar på ${FORGE_PIECES[piece].name}.`);
        return;
      }
      pieceMarks[piece].classList.add('done');
      if (piece === FORGE_PIECES.length - 1) {
        finish();
        return;
      }
      const done = FORGE_PIECES[piece].done;
      piece++;
      strikes = 0;
      cold = COOL_PAUSE;
      readyAt = now + COOL_PAUSE * 1000;
      setNarration(
        `${done} Smeden lägger den på bänken och tar fram nästa rubin. Nu blir det ${FORGE_PIECES[piece].name}!`
      );
      setTimeout(() => {
        if (!over) showPiece();
      }, 500);
    } else {
      cold = COOL_PAUSE;
      const p = svgPoint(svg, e);
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-miss"><text font-size="40" text-anchor="middle" fill="#ffd977" stroke="#1a1208" stroke-width="2">Klonk!</text></g>',
        700
      );
      setNarration(
        glow < 0.4
          ? 'Klonk! Rubinen är kall och hård. Vänta tills den glöder som starkast!'
          : 'Klonk! Inte riktigt varm nog – rubinen svalnar. Vänta tills den glöder som starkast!'
      );
    }
  });

  function finish() {
    over = true;
    cancelAnimationFrame(raf);
    ['armor', 'spear'].forEach((id) => {
      if (!hasItem(id)) state.items.push(id);
    });
    saveState(state);
    updateHud();
    restartAnimation(document.getElementById('inventory'), 'gain');
    setNarration(
      'Smeden doppar spjutet i vattentunnan – pssss! ' +
        (state.name ? `»Färdigt, ${state.name}!«` : '»Färdigt!«') +
        ' Du har en rubinröd rustning med hjälm, bröstplåt och sköld, och ett spjut med en spets av rubin.'
    );
    forgeNotice =
      'Du sätter på dig rustningen. Den är lätt och varm, och rubinerna i den glöder svagt. ' +
      '»Den står emot kraften från drakens smaragder«, säger smeden. »Åskdraken visar sig på toppen av Mount Thunder när natten faller. Lycka till!«';
    setTimeout(close, 2800);
  }

  function close() {
    sceneEl.inert = false;
    render('forge');
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.hidden = true;
      overlay.innerHTML = '';
      overlay.classList.remove('forge');
    }, 400);
  }

  showPiece();
  raf = requestAnimationFrame(tick);
}
