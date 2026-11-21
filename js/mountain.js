// The way up Mount Thunder, on the scenes mountain, mountain-ravine, mountain-snow,
// mountain-ridge and summit. The path from the village opens once the smith has forged the
// armour and the spear. Two zombies stand in the way; each is beaten in a spear minigame
// and stays beaten (state.zombies). At the top the thunder dragon sleeps.
// Reuses helpers from forest.js (randomBetween, hasItem, svgPoint, flashEffect,
// restartAnimation), onActivate() from cave.js and gearForged() / hasAllRubies() from forge.js.

// The zombies, by the scene they stand in.
const MOUNTAIN_ZOMBIES = {
  'mountain-ravine': {
    look: 'miner',
    spot: { x: 800, y: 790 },
    scale: 0.95,
    next: 'mountain-snow', // the way on that it blocks
    back: 'mountain', // where it pushes the player when it wins
    hits: 3, // spear hits it takes
    seconds: 9, // how long it takes to walk up to the player
    sky: ['#1e1c40', '#9a5a78'],
    meet:
      'Mitt på stigen står en zombie med gruvhjälm och en lampa som fladdrar. Den stönar och sträcker ut armarna mot dig. ' +
      'Den släpper inte förbi dig!',
  },
  'mountain-ridge': {
    look: 'warrior',
    spot: { x: 860, y: 720 },
    scale: 1.05,
    next: 'summit',
    back: 'mountain-snow',
    hits: 4,
    seconds: 8,
    sky: ['#060818', '#1e2448'],
    meet:
      'På bergskammen vaktar en stor zombie i en bucklig järnhjälm och en trasig röd mantel. ' +
      'Den vrålar och vinglar mot dig – du måste förbi den för att komma upp till toppen!',
  },
};

// Spear fight tuning.
const SPEAR_COOLDOWN = 0.55; // seconds before the spear can strike again; clicks in between are ignored
const ZOMBIE_KNOCKBACK = 0.28; // how far back a hit pushes the zombie (0..1 of the way)
const ZOMBIE_SPEEDUP = 1.15; // it walks faster after every hit

// Message shown instead of the scene narration on the next mountain render.
let mountainNotice = '';

function zombieBeaten(sceneId) {
  return state.zombies.includes(sceneId);
}

function mountainNarration(id, extra) {
  if (mountainNotice) {
    const text = mountainNotice;
    mountainNotice = '';
    return text;
  }
  return extra ? `${SCENES[id].narration} ${extra}` : SCENES[id].narration;
}

// ---------- The path in the village ----------

const forgeTownEnter = SCENES.town.enter; // from forge.js

SCENES.town.enter = (svg) => {
  const notice = churchNotice; // shown and used up by church.js
  const cleanup = forgeTownEnter(svg);
  const path = svg.querySelector('.mountain-path');
  if (gearForged()) {
    path.dataset.goto = 'mountain';
    path.setAttribute('aria-label', 'Gå upp mot toppen');
    if (!notice) {
      setNarration(
        `${SCENES.town.narration} I rustningen och med spjutet i handen är du redo – stigen upp till toppen väntar!`
      );
    }
  } else {
    // game.js follows data-goto; without it the path only tells why the player can't go.
    onActivate(path, () => {
      setNarration(
        'Stigen upp till toppen av Mount Thunder är lång och brant, och där uppe bor åskdraken. ' +
          'Utan rustning och vapen vågar du inte gå dit. ' +
          (hasAllRubies() ? 'Gå till smedjan med dina rubiner!' : 'Smeden i byn kan kanske hjälpa dig.')
      );
    });
  }
  return cleanup;
};

// ---------- The screens on the way up ----------

SCENES.mountain.enter = () => {
  setNarration(mountainNarration('mountain'));
};

SCENES['mountain-snow'].enter = () => {
  setNarration(mountainNarration('mountain-snow'));
};

function zombieScene(id, svg) {
  const z = MOUNTAIN_ZOMBIES[id];
  const actors = svg.querySelector('.actors');
  if (zombieBeaten(id)) {
    actors.insertAdjacentHTML('beforeend', zombieRemains(z.spot.x + 120, z.spot.y, z.look));
    setNarration(mountainNarration(id, 'Vid stigen ligger en hög med trasor – det är allt som är kvar av zombien.'));
    return null;
  }

  actors.insertAdjacentHTML(
    'beforeend',
    `<g class="zombie-target" tabindex="0" role="button" aria-label="Anfall zombien"
        transform="translate(${z.spot.x} ${z.spot.y}) scale(${z.scale})">
      <g class="zb-lurch">
        <rect x="-110" y="-300" width="220" height="310" fill="transparent"/>
        ${zombie(z.look)}
      </g>
    </g>`
  );
  onActivate(actors.querySelector('.zombie-target'), () => {
    if (hasItem('spear')) startZombieFight(id);
    else setNarration('Zombien stönar och sträcker sig efter dig. Utan vapen kan du inte göra något!');
  });

  // The way on is blocked while the zombie stands there.
  const way = svg.querySelector(`[data-goto="${z.next}"]`);
  delete way.dataset.goto;
  way.setAttribute('aria-label', 'Zombien står i vägen');
  way.querySelector('.exit-label text').textContent = 'Zombien står i vägen';
  onActivate(way, () => {
    setNarration('Zombien står mitt i vägen och släpper inte förbi dig. Klicka på den för att anfalla med spjutet!');
  });

  setNarration(mountainNarration(id, z.meet));
  return null;
}

Object.keys(MOUNTAIN_ZOMBIES).forEach((id) => {
  SCENES[id].enter = (svg) => zombieScene(id, svg);
});

// ---------- The summit: the sleeping dragon ----------

SCENES.summit.enter = (svg) => {
  setNarration(mountainNarration('summit'));
  const dragon = svg.querySelector('.dragon-target');
  const snore = dragon.querySelector('.dragon-snore');
  onActivate(dragon, () => {
    restartAnimation(snore, 'snoring');
    setNarration(
      'Du smyger närmare. Åskdraken andas tungt i sömnen, och gnistor knastrar mellan hans horn. ' +
        'De fyra smaragderna på ryggen skimrar gröna i mörkret. Snart vaknar han…'
    );
  });
  return null;
};

// ---------- Minigame: stab the zombie with the spear ----------

function startZombieFight(sceneId) {
  const z = MOUNTAIN_ZOMBIES[sceneId];
  const sceneEl = document.getElementById('scene');
  const overlay = document.getElementById('minigame');
  overlay.classList.add('mountain');
  overlay.innerHTML = `
    ${zombieCloseUp(z.look, z.sky[0], z.sky[1])}
    <div class="mg-panel hud-box">
      <div class="mg-row">
        <span>Avstånd</span>
        <div class="mg-bar"><div class="mg-fill"></div></div>
      </div>
      <div class="mg-row">
        <span>Stötar</span>
        <span class="mg-hits">${'<i class="mg-hit"></i>'.repeat(z.hits)}</span>
      </div>
    </div>`;
  overlay.hidden = false;
  sceneEl.inert = true;
  requestAnimationFrame(() => overlay.classList.add('open'));

  setNarration(
    `Zombien vinglar mot dig! Stöt spjutet i den ${z.hits} gånger innan den hinner fram. ` +
      'Varje stöt knuffar den bakåt.'
  );

  const svg = overlay.querySelector('svg');
  const walker = svg.querySelector('.mg-zombie');
  const body = svg.querySelector('.mg-zombie-body');
  const fx = svg.querySelector('.mg-fx');
  const fill = overlay.querySelector('.mg-fill');
  const hitMarks = overlay.querySelectorAll('.mg-hit');

  let dist = 0; // 0 far up the path, 1 right in front of the player
  let speed = 1 / z.seconds;
  let hits = 0;
  let t = randomBetween(0, 6); // phase of its swaying
  let stagger = 0; // seconds it stands still after a hit
  let over = false;
  let raf = 0;
  let last = performance.now();
  let readyAt = 0; // time (ms) the next strike is allowed

  function place() {
    const x = 800 + Math.sin(t * 1.3) * 170 * (1 - dist * 0.6);
    const y = 560 + dist * 330;
    const s = 0.9 + dist * 1.5;
    walker.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (stagger > 0) stagger -= dt;
    else {
      dist += dt * speed;
      t += dt;
    }
    fill.style.width = `${Math.max(0, 1 - dist) * 100}%`;
    fill.classList.toggle('low', dist > 0.7);
    place();
    if (dist >= 1) {
      finish(false);
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  svg.addEventListener('click', (e) => {
    if (over) return;
    // Still thrusting: ignore the click, so spam-clicking doesn't pile up hits.
    const now = performance.now();
    if (now < readyAt) return;
    readyAt = now + SPEAR_COOLDOWN * 1000;
    const p = svgPoint(svg, e);
    if (e.target.closest('.mg-zombie-target')) {
      hits++;
      hitMarks[hits - 1].classList.add('done');
      dist = Math.max(0, dist - ZOMBIE_KNOCKBACK);
      stagger = 0.4;
      speed *= ZOMBIE_SPEEDUP;
      restartAnimation(body, 'hurt');
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-spark"><path d="M0,-40 L0,-16 M0,16 L0,40 M-40,0 L-16,0 M16,0 L40,0 M-28,-28 L-12,-12 M12,12 L28,28 M28,-28 L12,-12 M-12,12 L-28,28" stroke="#ff8a9a" stroke-width="6" stroke-linecap="round"/></g>',
        500
      );
      if (hits >= z.hits) finish(true);
      else setNarration(`Pang! Zombien vinglar bakåt – ${z.hits - hits} stötar kvar!`);
    } else {
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-miss"><text font-size="40" text-anchor="middle" fill="#ffd977" stroke="#1a1208" stroke-width="2">Miss!</text></g>',
        700
      );
      setNarration('Miss! Zombien stönar och vinglar närmare – sikta på den!');
    }
  });

  function finish(won) {
    over = true;
    cancelAnimationFrame(raf);
    if (won) {
      body.classList.add('defeated');
      if (!zombieBeaten(sceneId)) state.zombies.push(sceneId);
      saveState(state);
      setNarration('Zombien faller ihop till en hög med trasor!');
      mountainNotice =
        z.next === 'summit'
          ? 'Zombien är besegrad, och vägen upp till toppen är fri. Ovanför dig mullrar åskan…'
          : 'Zombien är besegrad, och vägen uppåt är fri!';
      setTimeout(() => close(sceneId), 2200);
    } else {
      setNarration('Zombien får tag i dig!');
      mountainNotice =
        'Zombien knuffar dig nedför stigen, men tur nog tog rustningen smällen. ' +
        'Gå upp och försök igen – stöt spjutet i den innan den hinner fram!';
      setTimeout(() => close(z.back), 1600);
    }
  }

  function close(target) {
    sceneEl.inert = false;
    render(target);
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.hidden = true;
      overlay.innerHTML = '';
      overlay.classList.remove('mountain');
    }, 400);
  }

  place();
  raf = requestAnimationFrame(tick);
}
