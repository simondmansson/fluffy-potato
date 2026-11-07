// Forest quest: find the axe, catch the werewolf by its tail and knock the
// ruby off its chest in a minigame. The axe and the werewolf are placed in
// random forest screens, rolled once per game and kept in the save.

const FOREST_SCENES = ['forest', 'forest-spruce', 'forest-glade', 'forest-brook'];

// Neighbouring screens, used for the "you hear footsteps nearby" hint.
const FOREST_LINKS = {
  forest: ['forest-spruce', 'forest-brook'],
  'forest-spruce': ['forest', 'forest-glade'],
  'forest-glade': ['forest-spruce', 'forest-brook'],
  'forest-brook': ['forest-glade', 'forest'],
};

// Where the axe stump can stand in each screen (bottom centre of the stump).
const AXE_SPOTS = {
  forest: [{ x: 540, y: 700 }, { x: 1080, y: 680 }],
  'forest-spruce': [{ x: 560, y: 740 }, { x: 1100, y: 690 }],
  'forest-glade': [{ x: 660, y: 690 }, { x: 1210, y: 700 }],
  'forest-brook': [{ x: 420, y: 670 }, { x: 1200, y: 720 }],
};

// Area the werewolf runs around in (feet position), and its size there.
const WOLF_AREA = { x0: 330, x1: 1270, y0: 670, y1: 790 };
const WOLF_SCALE = { far: 0.85, near: 1.15 };

// Ruby minigame tuning.
const RUBY_HITS = 3; // hits needed to knock the ruby off
const GRIP_SECONDS = 15; // how long the player can hold the tail
const MISS_PENALTY = 0.12; // grip lost per missed swing

// Message shown instead of the scene narration on the next forest render.
let forestNotice = '';

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function hasItem(id) {
  return state.items.includes(id);
}

function wolfDefeated() {
  return state.rubies.includes('forest');
}

// Rolls where the axe and werewolf are, on the first visit (or a broken save).
// They never start in the same screen, so the player has to explore.
function forestQuest() {
  const q = state.forest;
  const valid = q && AXE_SPOTS[q.axeScene] && AXE_SPOTS[q.axeScene][q.axeSpot] && AXE_SPOTS[q.wolfScene];
  if (!valid) {
    const axeScene = randomItem(FOREST_SCENES);
    state.forest = {
      axeScene,
      axeSpot: Math.floor(Math.random() * AXE_SPOTS[axeScene].length),
      wolfScene: randomItem(FOREST_SCENES.filter((id) => id !== axeScene)),
    };
    saveState(state);
  }
  return state.forest;
}

function forestNarration(id) {
  const q = forestQuest();
  const parts = [];
  if (forestNotice) {
    parts.push(forestNotice);
    forestNotice = '';
  } else {
    parts.push(SCENES[id].narration);
  }

  if (!wolfDefeated()) {
    if (q.wolfScene === id) {
      parts.push(
        hasItem('axe')
          ? 'Varulven rusar runt i dimman med rubinen glimmande på bröstet. Fånga den i svansen!'
          : 'Där är varulven, med rubinen glimmande på bröstet! Du behöver något att slå loss den med.'
      );
    } else if (FOREST_LINKS[id].includes(q.wolfScene)) {
      parts.push('Tunga steg och flämtande hörs någonstans i närheten…');
    }
  }
  if (!hasItem('axe') && q.axeScene === id) {
    parts.push('Något blänker till i dimman.');
  }
  return parts.join(' ');
}

function forestEnter(id, svg) {
  const q = forestQuest();
  setNarration(forestNarration(id));

  const actors = svg.querySelector('.actors');
  if (q.axeScene === id) placeAxe(actors, AXE_SPOTS[id][q.axeSpot]);

  let stopWolf = null;
  if (!wolfDefeated() && q.wolfScene === id) stopWolf = startWolf(actors);
  return () => {
    if (stopWolf) stopWolf();
  };
}

FOREST_SCENES.forEach((id) => {
  SCENES[id].enter = (svg) => forestEnter(id, svg);
});

// ---------- The axe ----------

function placeAxe(actors, spot) {
  actors.insertAdjacentHTML('beforeend', stump(spot.x, spot.y));
  if (hasItem('axe')) return;

  actors.insertAdjacentHTML(
    'beforeend',
    `<g class="pickup" tabindex="0" role="button" aria-label="Ta yxan">${axeInStump(spot.x, spot.y)}</g>`
  );
  const axe = actors.lastElementChild;

  const take = () => {
    if (hasItem('axe')) return;
    state.items.push('axe');
    saveState(state);
    updateHud();
    axe.classList.add('taken');
    setTimeout(() => axe.remove(), 500);
    setNarration(
      wolfDefeated() || state.forest.wolfScene !== state.location
        ? 'Du drar loss en yxa ur en gammal stubbe! Med den kan du slå loss rubinen från varulvens bröst.'
        : 'Du drar loss en yxa ur en gammal stubbe! Nu kan du ta dig an varulven – fånga den i svansen!'
    );
  };
  axe.addEventListener('click', take);
  axe.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      take();
    }
  });
}

// ---------- The werewolf running around ----------

// Adds the werewolf to the scene and runs it around until the returned stop
// function is called. Clicking its tail (with the axe) starts the minigame.
function startWolf(actors) {
  actors.insertAdjacentHTML('beforeend', `<g class="wolf running">${werewolf()}</g>`);
  const el = actors.lastElementChild;

  const wolf = {
    x: randomBetween(WOLF_AREA.x0, WOLF_AREA.x1),
    y: randomBetween(WOLF_AREA.y0, WOLF_AREA.y1),
    dir: Math.random() < 0.5 ? -1 : 1,
    tx: 0,
    ty: 0,
    speed: 0,
    pause: 0, // seconds left standing still
  };
  let raf = 0;
  let last = performance.now();
  let caught = false;

  // Run to a new spot well away from the current one.
  function runTo(fast) {
    do {
      wolf.tx = randomBetween(WOLF_AREA.x0, WOLF_AREA.x1);
    } while (Math.abs(wolf.tx - wolf.x) < 250);
    wolf.ty = randomBetween(WOLF_AREA.y0, WOLF_AREA.y1);
    wolf.speed = fast ? 800 : randomBetween(260, 400);
    wolf.pause = 0;
    el.classList.add('running');
  }

  function place() {
    const depth = (wolf.y - WOLF_AREA.y0) / (WOLF_AREA.y1 - WOLF_AREA.y0);
    const s = WOLF_SCALE.far + (WOLF_SCALE.near - WOLF_SCALE.far) * depth;
    el.setAttribute(
      'transform',
      `translate(${wolf.x.toFixed(1)} ${wolf.y.toFixed(1)}) scale(${(wolf.dir * s).toFixed(3)} ${s.toFixed(3)})`
    );
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (wolf.pause > 0) {
      wolf.pause -= dt;
      if (wolf.pause <= 0) runTo(false);
    } else {
      const dx = wolf.tx - wolf.x;
      const dy = wolf.ty - wolf.y;
      const dist = Math.hypot(dx, dy);
      const step = wolf.speed * dt;
      if (dist <= step) {
        wolf.x = wolf.tx;
        wolf.y = wolf.ty;
        // Sometimes stop to sniff the air: the best moment to grab the tail.
        if (Math.random() < 0.5) {
          wolf.pause = randomBetween(0.6, 1.4);
          el.classList.remove('running');
        } else {
          runTo(false);
        }
      } else {
        wolf.x += (dx / dist) * step;
        wolf.y += (dy / dist) * step;
        if (Math.abs(dx) > 1) wolf.dir = Math.sign(dx);
      }
    }

    place();
    raf = requestAnimationFrame(tick);
  }

  el.addEventListener('click', (e) => {
    if (caught) return;
    const part = e.target.closest('[data-part]');
    if (part && part.dataset.part === 'tail') {
      if (hasItem('axe')) {
        caught = true;
        cancelAnimationFrame(raf);
        el.classList.remove('running');
        el.classList.add('caught');
        setNarration('Du fick tag i svansen!');
        setTimeout(() => {
          if (el.isConnected) startRubyFight();
        }, 600);
      } else {
        setNarration(
          'Du får tag i svansen – men du har inget att slå med! Varulven sliter sig loss. Leta efter ett verktyg i skogen.'
        );
        runTo(true);
      }
    } else {
      setNarration('Varulven fräser och viker undan. Framifrån är den för stark – fånga den i svansen!');
      runTo(true);
    }
  });

  runTo(false);
  place();
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

// ---------- Minigame: knock the ruby off its chest ----------

function svgPoint(svg, e) {
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
}

// Short-lived effect at (x, y) in the minigame's fx layer.
function flashEffect(fx, x, y, markup, ms) {
  fx.insertAdjacentHTML('beforeend', `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${markup}</g>`);
  const el = fx.lastElementChild;
  setTimeout(() => el.remove(), ms);
}

function restartAnimation(el, cls) {
  el.classList.remove(cls);
  void el.getBoundingClientRect(); // force a reflow so the animation plays again
  el.classList.add(cls);
}

function startRubyFight() {
  const sceneEl = document.getElementById('scene');
  const overlay = document.getElementById('minigame');
  overlay.innerHTML = `
    ${werewolfCloseUp()}
    <div class="mg-panel hud-box">
      <div class="mg-row">
        <span>Grepp om svansen</span>
        <div class="mg-bar"><div class="mg-fill"></div></div>
      </div>
      <div class="mg-row">
        <span>Slag på rubinen</span>
        <span class="mg-hits">${'<i class="mg-hit"></i>'.repeat(RUBY_HITS)}</span>
      </div>
    </div>`;
  overlay.hidden = false;
  sceneEl.inert = true;
  requestAnimationFrame(() => overlay.classList.add('open'));

  setNarration(
    'Du håller varulven i svansen! Den vrider sig och fräser. ' +
      `Slå loss rubinen från bröstet med yxan – träffa den ${RUBY_HITS} gånger innan den sliter sig loss!`
  );

  const svg = overlay.querySelector('svg');
  const wolf = svg.querySelector('.mg-wolf');
  const body = svg.querySelector('.mg-wolf-body');
  const ruby = svg.querySelector('.mg-ruby');
  const cracks = svg.querySelectorAll('.mg-crack');
  const fx = svg.querySelector('.mg-fx');
  const fill = overlay.querySelector('.mg-fill');
  const hitMarks = overlay.querySelectorAll('.mg-hit');

  let grip = 1;
  let hits = 0;
  let t = Math.random() * 10; // phase of the thrashing motion
  let speed = 1.4; // how fast it thrashes; rises with every hit
  let flinch = 0; // seconds the wolf freezes after being hit
  let over = false;
  let raf = 0;
  let last = performance.now();

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (flinch > 0) flinch -= dt;
    else t += dt * speed;

    grip -= dt / GRIP_SECONDS;
    fill.style.width = `${Math.max(0, grip) * 100}%`;
    fill.classList.toggle('low', grip < 0.3);

    const dx = Math.sin(t) * 280 + Math.sin(t * 2.3 + 1) * 90;
    const dy = 90 + Math.sin(t * 1.7) * 30; // sits a bit low so the panel above doesn't cover its face
    const rot = Math.sin(t * 1.3) * 7;
    wolf.setAttribute('transform', `translate(${(800 + dx).toFixed(1)} ${dy.toFixed(1)}) rotate(${rot.toFixed(2)} 0 700)`);

    if (grip <= 0) {
      finish(false);
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  svg.addEventListener('click', (e) => {
    if (over) return;
    const p = svgPoint(svg, e);
    if (e.target.closest('.mg-ruby-target')) {
      hits++;
      hitMarks[hits - 1].classList.add('done');
      cracks[hits - 1].classList.add('show');
      flinch = 0.35;
      speed += 0.6;
      restartAnimation(body, 'hurt');
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-spark"><path d="M0,-40 L0,-16 M0,16 L0,40 M-40,0 L-16,0 M16,0 L40,0 M-28,-28 L-12,-12 M12,12 L28,28 M28,-28 L12,-12 M-12,12 L-28,28" stroke="#fff3b0" stroke-width="6" stroke-linecap="round"/></g>',
        500
      );
      if (hits >= RUBY_HITS) {
        finish(true);
      } else {
        setNarration(`Pang! Rubinen sitter allt lösare – ${RUBY_HITS - hits} slag kvar!`);
      }
    } else {
      grip -= MISS_PENALTY;
      restartAnimation(body, 'snarl');
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-miss"><text font-size="40" text-anchor="middle" fill="#ffd977" stroke="#1a1208" stroke-width="2">Miss!</text></g>',
        700
      );
      setNarration('Miss! Varulven sliter i svansen – sikta på rubinen!');
    }
  });

  function finish(won) {
    over = true;
    cancelAnimationFrame(raf);
    if (won) {
      ruby.classList.add('loose');
      body.classList.add('defeated');
      if (!wolfDefeated()) state.rubies.push('forest');
      saveState(state);
      updateHud();
      restartAnimation(document.getElementById('rubies'), 'gain');
      setNarration(
        'Rubinen lossnar och flyger iväg! Varulven ylar och sjunker ihop… ' +
          (state.name ? `Bra jobbat, ${state.name}! ` : '') +
          'Du har vunnit skogens rubin!'
      );
      forestNotice =
        'Varulven är besegrad! Utan rubinen förlorade den sin kraft och smög tyst bort in i dimman. Skogens rubin är din.';
      setTimeout(close, 2600);
    } else {
      body.classList.add('escape');
      // It flees to another forest screen; the player has to track it down again.
      state.forest.wolfScene = randomItem(FOREST_SCENES.filter((id) => id !== state.location));
      saveState(state);
      setNarration('Varulven slet sig loss och försvann in i dimman!');
      forestNotice = 'Varulven slet sig loss och sprang iväg in i dimman. Leta upp den igen – den kan inte ha kommit långt.';
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
    }, 400);
  }

  raf = requestAnimationFrame(tick);
}
