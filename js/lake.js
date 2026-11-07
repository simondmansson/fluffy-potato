// Lake quest: take the fishing rod and the harpoon at the shore, row out,
// hook the giant squid and knock the ruby out of its forehead with the harpoon.
// Shared helpers (randomBetween, hasItem, svgPoint, flashEffect, restartAnimation)
// come from forest.js.

const LAKE_TOOLS = ['rod', 'harpoon'];

// Area the squid's shadow swims around in, and its size there.
const SQUID_AREA = { x0: 260, x1: 1340, y0: 450, y1: 690 };
const SQUID_SCALE = { far: 0.55, near: 1 };
const ROD_TIP = { x: 1231, y: 329 };

// Fishing tuning.
const LURE_RADIUS = 300; // the squid notices a float this close to it
const BITE_WINDOW = 1.1; // seconds the player has to strike once it bites

// Harpoon minigame tuning.
const HARPOON_HITS = 3; // hits needed to knock the ruby loose
const LINE_SECONDS = 18; // how long the fishing line holds
const LINE_MISS_PENALTY = 0.1; // line strength lost per missed throw
const SQUID_DIVE_DEPTH = 360; // how far it sinks when it dives

// Message shown instead of the scene narration on the next lake render.
let lakeNotice = '';

function squidDefeated() {
  return state.rubies.includes('lake');
}

function hasLakeTools() {
  return LAKE_TOOLS.every(hasItem);
}

function takeNotice(fallback) {
  const text = lakeNotice || fallback;
  lakeNotice = '';
  return text;
}

// ---------- The shore ----------

function missingToolsText() {
  if (!hasItem('rod') && !hasItem('harpoon')) {
    return 'Du behöver fiskespöt och harpunen innan du ror ut – de ligger här vid sjökanten.';
  }
  return hasItem('rod')
    ? 'Du behöver harpunen innan du ror ut. Den ligger ute på bryggan.'
    : 'Du behöver fiskespöt innan du ror ut. Det står lutat mot sjöboden.';
}

function lakeShoreNarration() {
  const parts = [takeNotice(SCENES.lake.narration)];
  if (!squidDefeated()) {
    parts.push('Långt ute bryter något stort vattenytan.');
    if (hasLakeTools()) parts.push('Du har fiskespöt och harpunen – ro ut med båten!');
    else if (!hasItem('rod') && !hasItem('harpoon')) parts.push('Vid sjöboden står ett fiskespö, och på bryggan ligger en harpun.');
    else parts.push(missingToolsText());
  }
  return parts.join(' ');
}

// A tool the player can pick up. Taking it adds `item` to the inventory.
function placeTool(actors, item, markup, label, onTake) {
  actors.insertAdjacentHTML(
    'beforeend',
    `<g class="pickup" data-item="${item}" tabindex="0" role="button" aria-label="${label}">${markup}</g>`
  );
  const el = actors.lastElementChild;
  const take = () => {
    if (hasItem(item)) return;
    state.items.push(item);
    saveState(state);
    updateHud();
    el.classList.add('taken');
    setTimeout(() => el.remove(), 500);
    onTake();
  };
  el.addEventListener('click', take);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      take();
    }
  });
}

SCENES.lake.enter = (svg) => {
  const actors = svg.querySelector('.actors');
  const boat = svg.querySelector('.lake-boat-exit');

  // The boat only becomes an exit once both tools are carried.
  const updateBoat = () => {
    if (hasLakeTools()) boat.dataset.goto = 'lake-boat';
  };
  const readyText = () => (hasLakeTools() ? ' Nu kan du ro ut med båten!' : '');

  if (!hasItem('rod')) {
    placeTool(actors, 'rod', rodLeaning(440, 748), 'Ta fiskespöt', () => {
      updateBoat();
      setNarration(
        'Du tar fiskespöt. Det har ett rött flöte och en rejäl krok – perfekt för något riktigt stort.' +
          (readyText() || ' Men hur ska du få loss rubinen? Kanske finns något på bryggan.')
      );
    });
  }
  if (!hasItem('harpoon')) {
    placeTool(actors, 'harpoon', harpoonLying(1290, 730), 'Ta harpunen', () => {
      updateBoat();
      setNarration(
        'Du tar harpunen från bryggan. Med den kan du få loss rubinen ur bläckfiskens panna!' +
          (readyText() || ' Men först måste den nappa – du behöver ett fiskespö.')
      );
    });
  }
  if (!squidDefeated()) {
    svg.querySelector('.lake-far').insertAdjacentHTML('beforeend', tentaclePeek(660, 556, 'lake-above-water'));
  }

  updateBoat();
  const refuse = (e) => {
    if (boat.dataset.goto) return; // game.js rows out
    if (e.type === 'keydown') {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
    }
    setNarration(missingToolsText());
  };
  boat.addEventListener('click', refuse);
  boat.addEventListener('keydown', refuse);

  setNarration(lakeShoreNarration());
};

// ---------- Out on the lake: fishing ----------

function depthScale(y) {
  const depth = (y - SQUID_AREA.y0) / (SQUID_AREA.y1 - SQUID_AREA.y0);
  return SQUID_SCALE.far + (SQUID_SCALE.near - SQUID_SCALE.far) * Math.min(1, Math.max(0, depth));
}

SCENES['lake-boat'].enter = (svg) => {
  const base = SCENES['lake-boat'].narration;
  if (squidDefeated()) {
    setNarration(takeNotice(`${base} Sjön ligger stilla nu – bläckfisken är borta.`));
  } else if (!hasItem('rod')) {
    setNarration(takeNotice(`${base} Under ytan glider en enorm skugga, men du har inget fiskespö att fiska med.`));
  } else {
    setNarration(
      takeNotice(`${base} En enorm skugga glider under ytan – klicka på vattnet för att kasta ut flötet nära den.`)
    );
  }

  const actors = svg.querySelector('.actors');
  actors.insertAdjacentHTML(
    'beforeend',
    `<path class="fishing-line no-hit" fill="none" stroke="#e8e8e8" stroke-width="1.6" opacity="0.75"/>
     <g class="bobber" display="none"><g class="bobber-pos">${bobber()}</g></g>`
  );
  const line = actors.querySelector('.fishing-line');
  const bob = actors.querySelector('.bobber');
  const bobPos = actors.querySelector('.bobber-pos');
  let float = null; // where the float lies, or null when it isn't cast

  function drawLine() {
    const t = ROD_TIP;
    if (!float) {
      line.setAttribute('d', `M${t.x},${t.y} L${t.x + 2},${t.y + 130}`);
      return;
    }
    const s = depthScale(float.y);
    const fy = float.y - 26 * s; // tip of the float's antenna
    const cx = (t.x + float.x) / 2;
    const cy = Math.max(t.y, fy) + 50;
    line.setAttribute('d', `M${t.x},${t.y} Q${cx.toFixed(1)},${cy.toFixed(1)} ${float.x.toFixed(1)},${fy.toFixed(1)}`);
  }

  function setFloat(p) {
    float = p;
    bob.setAttribute('display', p ? 'inline' : 'none'); // the hidden attribute doesn't hide SVG
    bob.classList.remove('nibble', 'bite');
    if (p) {
      bobPos.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(depthScale(p.y) * 1.3).toFixed(3)})`);
      restartAnimation(bob, 'cast');
    }
    drawLine();
  }
  drawLine();

  const squid = squidDefeated() ? null : startSquid(svg.querySelector('.lake-under'), () => float, bob);

  svg.addEventListener('click', (e) => {
    if (e.target.closest('[data-goto]')) return;
    if (!hasItem('rod')) {
      if (e.target.closest('.lake-cast')) setNarration('Du har inget fiskespö att fiska med. Det står vid sjöboden på stranden.');
      return;
    }
    if (squid && squid.mode() === 'bite') {
      squid.strike();
      return;
    }
    if (squid && squid.mode() === 'nibble') {
      setNarration('För tidigt! Bläckfisken skrämdes iväg. Vänta tills flötet dras under ordentligt.');
      squid.scare();
      return;
    }
    if (!e.target.closest('.lake-cast, .bobber')) return;

    const p = svgPoint(svg, e);
    const spot = {
      x: Math.min(SQUID_AREA.x1 + 60, Math.max(SQUID_AREA.x0 - 60, p.x)),
      y: Math.min(SQUID_AREA.y1 + 10, Math.max(SQUID_AREA.y0 - 20, p.y)),
    };
    setFloat(spot);
    if (!squid) {
      setNarration('Plopp! Flötet guppar på vattnet. Sjön är stilla nu – inget nappar här längre.');
    } else if (squid.near(spot)) {
      setNarration('Plopp! Flötet landar på vattnet. Den stora skuggan vänder sig långsamt mot det…');
    } else {
      setNarration('Plopp! Flötet guppar på vattnet, men ingenting händer. Kasta närmare skuggan!');
    }
  });

  return () => {
    if (squid) squid.stop();
  };

  // The squid's shadow under the surface. It roams around, swims up to a
  // float that lands close to it, nibbles a few times and then bites.
  function startSquid(layer, getFloat, bobEl) {
    layer.insertAdjacentHTML('beforeend', `<g class="squid-shadow"><g class="squid-swim">${squidShadow('lake-boat-murk')}</g></g>`);
    const el = layer.lastElementChild;
    const sq = {
      x: randomBetween(SQUID_AREA.x0, SQUID_AREA.x1),
      y: randomBetween(SQUID_AREA.y0, SQUID_AREA.y1),
      angle: 0,
      tx: 0,
      ty: 0,
      speed: 0,
      mode: 'roam', // roam | approach | nibble | bite | flee | hooked
      timer: 0,
      nibbles: 0,
    };
    let raf = 0;
    let last = performance.now();

    function newTarget(awayFrom) {
      do {
        sq.tx = randomBetween(SQUID_AREA.x0, SQUID_AREA.x1);
        sq.ty = randomBetween(SQUID_AREA.y0, SQUID_AREA.y1);
      } while (awayFrom && Math.hypot(sq.tx - awayFrom.x, sq.ty - awayFrom.y) < 450);
    }

    function flee() {
      const f = getFloat();
      sq.mode = 'flee';
      sq.timer = 3;
      sq.speed = 260;
      newTarget(f || sq);
      bobEl.classList.remove('nibble', 'bite');
    }

    function near(p) {
      return Math.hypot(p.x - sq.x, p.y - sq.y) < LURE_RADIUS;
    }

    // Move towards (tx, ty); true once there.
    function swim(dt) {
      const dx = sq.tx - sq.x;
      const dy = sq.ty - sq.y;
      const dist = Math.hypot(dx, dy);
      const step = sq.speed * dt * depthScale(sq.y);
      if (dist <= step) {
        sq.x = sq.tx;
        sq.y = sq.ty;
        return true;
      }
      sq.x += (dx / dist) * step;
      sq.y += (dy / dist) * step;
      // Turn smoothly to face where it swims.
      const want = Math.atan2(dy, dx);
      let diff = want - sq.angle;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      sq.angle = (sq.angle + diff * Math.min(1, dt * 3)) % (2 * Math.PI);
      return false;
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const f = getFloat();

      if (sq.mode === 'roam') {
        sq.speed = 110;
        if (swim(dt)) newTarget();
        if (f && near(f)) sq.mode = 'approach';
      } else if (sq.mode === 'approach') {
        if (!f) {
          sq.mode = 'roam';
        } else {
          sq.tx = f.x;
          sq.ty = f.y;
          sq.speed = 90;
          if (swim(dt)) {
            sq.mode = 'nibble';
            sq.nibbles = 2 + Math.floor(Math.random() * 3);
            sq.timer = randomBetween(0.5, 1.1);
            setNarration('Flötet rycker till… och igen. Vänta på ett riktigt napp!');
          }
        }
      } else if (sq.mode === 'nibble') {
        sq.timer -= dt;
        if (sq.timer <= 0) {
          sq.nibbles--;
          if (sq.nibbles > 0) {
            restartAnimation(bobEl, 'nibble');
            sq.timer = randomBetween(0.6, 1.4);
          } else {
            sq.mode = 'bite';
            sq.timer = BITE_WINDOW;
            bobEl.classList.remove('nibble');
            bobEl.classList.add('bite');
            setNarration('NAPP! Flötet dras under – klicka för att dra till!');
          }
        }
      } else if (sq.mode === 'bite') {
        sq.timer -= dt;
        if (sq.timer <= 0) {
          setNarration('För sent! Bläckfisken slet av betet och dök undan. Kasta ut igen.');
          setFloat(null);
          flee();
        }
      } else if (sq.mode === 'flee') {
        sq.timer -= dt;
        if (swim(dt) || sq.timer <= 0) {
          sq.mode = 'roam';
          newTarget();
        }
      }

      const s = depthScale(sq.y);
      el.setAttribute(
        'transform',
        `translate(${sq.x.toFixed(1)} ${sq.y.toFixed(1)}) rotate(${((sq.angle * 180) / Math.PI).toFixed(1)}) scale(${s.toFixed(3)} ${(s * 0.6).toFixed(3)})`
      );
      raf = requestAnimationFrame(tick);
    }

    newTarget();
    raf = requestAnimationFrame(tick);

    return {
      mode: () => sq.mode,
      near,
      scare: flee,
      stop: () => cancelAnimationFrame(raf),
      strike() {
        sq.mode = 'hooked';
        cancelAnimationFrame(raf);
        el.classList.add('hooked');
        bobEl.classList.remove('bite');
        bobEl.classList.add('hooked');
        setNarration('Du drar till – den sitter på kroken! Vattnet börjar bubbla…');
        setTimeout(() => {
          if (el.isConnected) startHarpoonFight();
        }, 900);
      },
    };
  }
};

// ---------- Minigame: harpoon the ruby out of its forehead ----------

// How far under water the squid is (0 = risen, 1 = dived) at a point of its dive cycle.
function diveDepth(p) {
  const smooth = (u) => u * u * (3 - 2 * u);
  if (p < 0.6) return 0;
  if (p < 0.7) return smooth((p - 0.6) / 0.1);
  if (p < 0.85) return 1;
  return 1 - smooth((p - 0.85) / 0.15);
}

function startHarpoonFight() {
  const sceneEl = document.getElementById('scene');
  const overlay = document.getElementById('minigame');
  overlay.classList.add('lake');
  overlay.innerHTML = `
    ${giantSquidCloseUp()}
    <div class="mg-panel hud-box">
      <div class="mg-row">
        <span>Linan håller</span>
        <div class="mg-bar"><div class="mg-fill"></div></div>
      </div>
      <div class="mg-row">
        <span>Träffar på rubinen</span>
        <span class="mg-hits">${'<i class="mg-hit"></i>'.repeat(HARPOON_HITS)}</span>
      </div>
    </div>`;
  overlay.hidden = false;
  sceneEl.inert = true;
  requestAnimationFrame(() => overlay.classList.add('open'));

  setNarration(
    'Jättebläckfisken stiger upp ur sjön med rubinen glimmande i pannan! ' +
      `Kasta harpunen mot rubinen – träffa den ${HARPOON_HITS} gånger innan linan brister. Akta, den dyker!`
  );

  const svg = overlay.querySelector('svg');
  const squid = svg.querySelector('.mg-squid');
  const body = svg.querySelector('.mg-squid-body');
  const ruby = svg.querySelector('.mg-ruby');
  const cracks = svg.querySelectorAll('.mg-crack');
  const lineEl = svg.querySelector('.mg-line');
  const fx = svg.querySelector('.mg-fx');
  const fill = overlay.querySelector('.mg-fill');
  const hitMarks = overlay.querySelectorAll('.mg-hit');

  const SCALE = 0.85;
  const WATER_Y = 640;
  let strength = 1;
  let hits = 0;
  let t = Math.random() * 10; // phase of the swaying motion
  let sway = 1; // how fast it sways; rises with every hit
  let phase = 0.86; // position in the dive cycle: starts under water and rises
  let diveRate = 0.2; // dive cycles per second; rises with every hit
  let flinch = 0; // seconds it freezes after being hit
  let over = false;
  let raf = 0;
  let last = performance.now();

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (flinch > 0) {
      flinch -= dt;
    } else {
      t += dt * sway;
      phase = (phase + dt * diveRate) % 1;
    }

    strength -= dt / LINE_SECONDS;
    fill.style.width = `${Math.max(0, strength) * 100}%`;
    fill.classList.toggle('low', strength < 0.3);

    const x = 800 + Math.sin(t * 0.8) * 300 + Math.sin(t * 1.9 + 1) * 80;
    const y = WATER_Y + diveDepth(phase) * SQUID_DIVE_DEPTH + Math.sin(t * 2.2) * 12;
    const rot = Math.sin(t * 1.1) * 5;
    squid.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${SCALE})`);
    // The fishing line runs from the rod to the hook in its arms.
    const hy = Math.max(WATER_Y + 4, y - 40);
    lineEl.setAttribute('d', `M1560,900 Q${((1560 + x) / 2).toFixed(1)},${(hy - 60).toFixed(1)} ${x.toFixed(1)},${hy.toFixed(1)}`);

    if (strength <= 0) {
      finish(false);
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  // The harpoon flies from the boat to where the player clicked.
  function throwHarpoon(p) {
    const angle = (Math.atan2(p.y - 900, p.x - 800) * 180) / Math.PI;
    fx.insertAdjacentHTML(
      'beforeend',
      `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})"><g class="mg-throw">
        <line x1="-170" y1="0" x2="-6" y2="0" stroke="#a0754a" stroke-width="7" stroke-linecap="round"/>
        <polygon points="-12,-6 14,0 -12,6" fill="#cfd6dc" stroke="#4a4f55" stroke-width="2"/>
      </g></g>`
    );
    const el = fx.lastElementChild;
    setTimeout(() => el.remove(), 350);
  }

  svg.addEventListener('click', (e) => {
    if (over) return;
    const p = svgPoint(svg, e);
    throwHarpoon(p);
    if (e.target.closest('.mg-ruby-target')) {
      hits++;
      hitMarks[hits - 1].classList.add('done');
      cracks[hits - 1].classList.add('show');
      flinch = 0.35;
      sway += 0.35;
      diveRate += 0.07;
      restartAnimation(body, 'hurt');
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-spark"><path d="M0,-40 L0,-16 M0,16 L0,40 M-40,0 L-16,0 M16,0 L40,0 M-28,-28 L-12,-12 M12,12 L28,28 M28,-28 L12,-12 M-12,12 L-28,28" stroke="#fff3b0" stroke-width="6" stroke-linecap="round"/></g>',
        500
      );
      if (hits >= HARPOON_HITS) {
        finish(true);
      } else {
        setNarration(`Klonk! Rubinen sitter allt lösare – ${HARPOON_HITS - hits} träffar kvar!`);
      }
    } else {
      strength -= LINE_MISS_PENALTY;
      const inWater = Boolean(e.target.closest('.mg-water'));
      flashEffect(
        fx,
        p.x,
        p.y,
        `<g class="mg-miss"><text font-size="40" text-anchor="middle" fill="#ffd977" stroke="#1a1208" stroke-width="2">${inWater ? 'Plask!' : 'Miss!'}</text></g>`,
        700
      );
      setNarration(
        inWater
          ? 'Plask! Harpunen slog i vattnet och bläckfisken sliter i linan. Vänta tills rubinen är ovanför ytan!'
          : 'Miss! Bläckfisken sliter i linan – sikta på rubinen i pannan!'
      );
    }
  });

  function finish(won) {
    over = true;
    cancelAnimationFrame(raf);
    if (won) {
      ruby.classList.add('loose');
      body.classList.add('defeated');
      lineEl.remove();
      if (!squidDefeated()) state.rubies.push('lake');
      saveState(state);
      updateHud();
      restartAnimation(document.getElementById('rubies'), 'gain');
      setNarration(
        'Rubinen lossnar och flyger upp ur pannan! Bläckfisken sjunker sakta ner i djupet… ' +
          (state.name ? `Bra jobbat, ${state.name}! ` : '') +
          'Du har vunnit sjöns rubin!'
      );
      lakeNotice =
        'Bläckfisken är besegrad! Utan rubinen sjönk den ner i djupet och sjön ligger stilla igen. Sjöns rubin är din.';
      setTimeout(close, 2600);
    } else {
      body.classList.add('escape');
      lineEl.remove();
      setNarration('Linan brast! Bläckfisken dök ner i djupet.');
      lakeNotice = 'Linan brast och bläckfisken dök undan! Den simmar fortfarande därnere – kasta ut flötet igen.';
      setTimeout(close, 1800);
    }
  }

  function close() {
    sceneEl.inert = false;
    render(state.location);
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.hidden = true;
      overlay.innerHTML = '';
      overlay.classList.remove('lake');
    }, 400);
  }

  raf = requestAnimationFrame(tick);
}
