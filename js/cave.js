// Cave quest: take the torch at the mouth of the cave, find the way through the
// dark passages to the spider's nest and trick the ruby out of its web by
// answering the spider's sums. Reuses helpers from forest.js (randomBetween,
// randomItem, hasItem, svgPoint, flashEffect, restartAnimation) and placeTool()
// from lake.js.

// Passages that are pitch dark: the torch lights them up around the pointer.
const CAVE_DARK_SCENES = ['cave-fork', 'cave-drip', 'cave-chasm', 'cave-bones', 'cave-webs', 'cave-nest'];

// Riddle minigame tuning.
const RIDDLES_TO_WIN = 5; // right answers needed to get the ruby
const RIDDLE_MISTAKES = 3; // wrong answers before the spider loses patience
const RIDDLE_MAX = 100; // no number in a question or answer is bigger than this
const RIDDLE_CHOICES = 4; // answers to choose from
const RIDDLE_PAUSE = 1.3; // seconds the result is shown before the next question

// Where the spider and the ruby hang in the nest.
const NEST_SPIDER = { x: 800, y: 380 };
const NEST_RUBY = { x: 1010, y: 520 };

// Message shown instead of the scene narration on the next cave render.
let caveNotice = '';

// Set when the spider gives up on the player: the next time the nest is drawn the web has
// let go. Otherwise the player gets caught in the web on entering the nest.
let nestFreed = false;

const WEB_CAUGHT =
  'Du tar ett steg in i salen – och fastnar! Klibbiga trådar lindar sig kring armar och ben, ' +
  'och ju mer du sliter, desto hårdare sitter du fast. Nätet darrar, och uppifrån mörkret firar sig ' +
  'en jättespindel sakta ner mot dig. Bredvid henne glimmar rubinen, invirad i silke. ' +
  '»Sssså, något har fastnat i mitt nät«, väser hon. Klicka på spindeln för att prata med henne.';

const WEB_STUCK =
  'Du sliter och drar, men trådarna sitter som lim – du kommer inte loss! ' +
  'Spindeln fnissar: »Ingen lämnar mitt näste förrän mina räknegåtor är besvarade.«';

function spiderDefeated() {
  return state.rubies.includes('cave');
}

// The scene's narration and a hint, or the notice left by the minigame instead of both.
function caveNarration(id, extra) {
  if (caveNotice) {
    const text = caveNotice;
    caveNotice = '';
    return text;
  }
  return extra ? `${SCENES[id].narration} ${extra}` : SCENES[id].narration;
}

function onActivate(el, fn) {
  el.addEventListener('click', fn);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn(e);
    }
  });
}

// ---------- The mouth of the cave ----------

SCENES.cave.enter = (svg) => {
  const deeper = svg.querySelector('.cave-deeper');
  const updateDeeper = () => {
    if (hasItem('torch')) deeper.dataset.goto = 'cave-fork';
  };

  if (!hasItem('torch')) {
    placeTool(svg.querySelector('.actors'), 'torch', torchOnWall(1240, 470), 'Ta facklan', () => {
      updateDeeper();
      setNarration('Du tar facklan från väggen. Den sprakar och lyser upp grottan – nu kan du gå in i mörkret!');
    });
  }
  updateDeeper();

  // Without the torch the passage is too dark to enter (game.js follows data-goto once it is set).
  const refuse = (e) => {
    if (deeper.dataset.goto) return;
    if (e.type === 'keydown') {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
    }
    setNarration('Det är kolsvart därinne, du ser inte handen framför dig. Du behöver ljus – facklan på väggen!');
  };
  deeper.addEventListener('click', refuse);
  deeper.addEventListener('keydown', refuse);

  let hint = '';
  if (!spiderDefeated()) {
    hint = hasItem('torch')
      ? 'Facklan sprakar i din hand. Långt där inne sägs en jättespindel vakta en rubin.'
      : 'På väggen sitter en fackla i en järnhållare.';
  }
  setNarration(caveNarration('cave', hint));
};

// ---------- Dark passages: the torch follows the pointer ----------

function lightTorch(svg) {
  const lights = svg.querySelectorAll('.torch-light');
  const carrying = hasItem('torch');
  const move = (x, y) => {
    // Without a torch (an edited save) there is only a faint glimmer.
    const t = `translate(${x.toFixed(1)} ${y.toFixed(1)})${carrying ? '' : ' scale(0.35)'}`;
    lights.forEach((el) => el.setAttribute('transform', t));
  };
  move(800, 640);
  if (!carrying) return;
  svg.addEventListener('pointermove', (e) => {
    const p = svgPoint(svg, e);
    move(p.x, p.y);
  });
  svg.addEventListener('pointerdown', (e) => {
    const p = svgPoint(svg, e);
    move(p.x, p.y);
  });
  // Keyboard players: light up whatever has focus.
  svg.addEventListener('focusin', (e) => {
    const target = e.target.closest('.exit, .spider-target');
    if (!target) return;
    const box = target.getBBox();
    move(box.x + box.width / 2, box.y + box.height / 2);
  });
}

// Narration hints per passage while the spider still has the ruby.
const CAVE_HINTS = {
  'cave-fork': 'Från den högra gången hörs ett svagt prasslande.',
  'cave-drip': 'Här verkar ingen ha varit på länge.',
  'cave-bones': 'Spindelväv hänger i den vänstra gången.',
  'cave-webs': 'Två röda ögon glimmar längst in i mörkret…',
};

CAVE_DARK_SCENES.forEach((id) => {
  if (id === 'cave-nest') return;
  SCENES[id].enter = (svg) => {
    lightTorch(svg);
    if (id === 'cave-webs' && spiderDefeated()) svg.querySelector('.eyes').remove();
    let hint = spiderDefeated() ? '' : CAVE_HINTS[id] || '';
    if (!hasItem('torch')) hint = 'Det är nästan helt mörkt. Du borde hämta facklan vid grottans mynning.';
    setNarration(caveNarration(id, hint));
  };
});

// ---------- The spider's nest ----------

SCENES['cave-nest'].enter = (svg) => {
  const actors = svg.querySelector('.actors');
  const mask = svg.querySelector('mask');
  const glow = (x, y, r) =>
    mask.insertAdjacentHTML('beforeend', `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#cave-nest-light)"/>`);

  if (spiderDefeated()) {
    lightTorch(svg);
    setNarration(
      caveNarration('cave-nest', 'Nätet hänger tomt. Spindeln har gömt sig högt uppe i taket och surar – rubinen är din.')
    );
    return null;
  }

  actors.insertAdjacentHTML(
    'beforeend',
    `<g class="spider-target" tabindex="0" role="button" aria-label="Prata med spindeln">
      <line x1="${NEST_SPIDER.x}" y1="0" x2="${NEST_SPIDER.x}" y2="${NEST_SPIDER.y - 120}" stroke="#eee8dc" stroke-width="2" opacity="0.5"/>
      <g transform="translate(${NEST_SPIDER.x} ${NEST_SPIDER.y})"><g class="nest-spider">${spider()}</g></g>
      <g transform="translate(${NEST_RUBY.x} ${NEST_RUBY.y}) scale(0.7)">
        ${rubyInSilk([[-120, -170], [90, -200], [170, -20], [80, 160], [-170, 70]], 'cave-nest-glow')}
      </g>
      <rect x="${NEST_SPIDER.x - 200}" y="${NEST_SPIDER.y - 140}" width="${NEST_RUBY.x - NEST_SPIDER.x + 290}" height="320" fill="transparent"/>
    </g>`
  );
  // The ruby and the spider's eyes give off a faint light of their own.
  glow(NEST_RUBY.x, NEST_RUBY.y, 150);
  glow(NEST_SPIDER.x, NEST_SPIDER.y, 170);
  lightTorch(svg);

  onActivate(actors.querySelector('.spider-target'), () => startRiddles());

  const freed = nestFreed;
  nestFreed = false;
  if (freed) {
    setNarration(caveNarration('cave-nest', 'Spindeln hänger i nätet och väntar. Klicka på henne för att försöka igen.'));
    return null;
  }

  // Caught in the web: the way back doesn't work until the spider has been dealt with.
  const back = svg.querySelector('.cave-back');
  delete back.dataset.goto;
  back.setAttribute('aria-label', 'Försök slita dig loss');
  back.querySelector('.exit-label text').textContent = 'Du sitter fast i nätet!';
  onActivate(back, () => setNarration(WEB_STUCK));
  svg.querySelector('.nest-web').classList.add('caught');

  setNarration(caveNotice ? caveNarration('cave-nest') : WEB_CAUGHT);
  return null;
};

// ---------- Minigame: the spider's sums ----------

function randomInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// A sum for question number `round` (0-based); later questions are harder.
// Every number in it, the answer included, is between 0 and RIDDLE_MAX.
function makeRiddle(round) {
  let a;
  let b;
  let op;
  if (round === 0) {
    [a, b, op] = [randomInt(1, 10), randomInt(1, 10), '+'];
  } else if (round === 1) {
    a = randomInt(6, 20);
    [b, op] = [randomInt(1, a - 1), '−'];
  } else if (round === 2) {
    a = randomInt(10, 60);
    [b, op] = [randomInt(5, Math.min(39, RIDDLE_MAX - a)), '+'];
  } else if (round === 3) {
    a = randomInt(30, RIDDLE_MAX);
    [b, op] = [randomInt(5, a - 5), '−'];
  } else if (Math.random() < 0.5) {
    [a, b, op] = [randomInt(2, 10), randomInt(2, 10), '·'];
  } else {
    a = randomInt(20, 80);
    [b, op] = [randomInt(10, RIDDLE_MAX - a), '+'];
  }
  const answer = op === '+' ? a + b : op === '−' ? a - b : a * b;

  // Wrong answers close to the right one, so guessing doesn't help.
  const near = op === '·' ? [a, -a, b, -b, 1, -1] : [1, -1, 2, -2, 10, -10, 3, -3];
  const wrong = shuffle(near.map((d) => answer + d).filter((n) => n >= 0 && n <= RIDDLE_MAX && n !== answer));
  const choices = [answer];
  for (const n of wrong) {
    if (choices.length >= RIDDLE_CHOICES) break;
    if (!choices.includes(n)) choices.push(n);
  }
  while (choices.length < RIDDLE_CHOICES) {
    const n = randomInt(0, Math.min(RIDDLE_MAX, answer + 20));
    if (!choices.includes(n)) choices.push(n);
  }
  return { text: `${a} ${op} ${b}`, answer, choices: shuffle(choices) };
}

function startRiddles() {
  const sceneEl = document.getElementById('scene');
  const overlay = document.getElementById('minigame');
  overlay.classList.add('cave');
  overlay.innerHTML = `
    ${giantSpiderCloseUp()}
    <div class="mg-panel hud-box riddle-panel">
      <p class="riddle-question"></p>
      <div class="riddle-choices"></div>
      <div class="mg-row">
        <span>Rätta svar</span>
        <span class="mg-hits">${'<i class="mg-hit"></i>'.repeat(RIDDLES_TO_WIN)}</span>
      </div>
      <div class="mg-row">
        <span>Spindelns tålamod</span>
        <span class="mg-hits riddle-patience">${'<i class="mg-hit patience"></i>'.repeat(RIDDLE_MISTAKES)}</span>
      </div>
    </div>`;
  overlay.hidden = false;
  sceneEl.inert = true;
  requestAnimationFrame(() => overlay.classList.add('open'));

  const svg = overlay.querySelector('svg');
  const body = svg.querySelector('.mg-spider-body');
  const ruby = svg.querySelector('.mg-ruby');
  const threads = svg.querySelectorAll('.mg-thread');
  const fx = svg.querySelector('.mg-fx');
  const questionEl = overlay.querySelector('.riddle-question');
  const choicesEl = overlay.querySelector('.riddle-choices');
  const hitMarks = overlay.querySelectorAll('.mg-hit:not(.patience)');
  const patienceMarks = overlay.querySelectorAll('.mg-hit.patience');
  patienceMarks.forEach((m) => m.classList.add('done'));

  let right = 0;
  let mistakes = 0;
  let riddle = null;
  let over = false;

  setNarration(
    '»Sssså, en liten människa i mitt näste«, väser spindeln. »Ingen lurar mig – jag räknar på alla åtta benen! ' +
      `Svara rätt på ${RIDDLES_TO_WIN} av mina räknegåtor, så ska rubinen bli din. Men svarar du fel för många gånger…«`
  );

  function ask() {
    riddle = makeRiddle(right);
    questionEl.textContent = `Hur mycket är ${riddle.text}?`;
    choicesEl.innerHTML = '';
    riddle.choices.forEach((n) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'riddle-choice';
      btn.textContent = String(n);
      btn.addEventListener('click', () => answer(n, btn));
      choicesEl.appendChild(btn);
    });
    choicesEl.firstElementChild.focus();
  }

  function answer(n, btn) {
    if (over || !riddle) return;
    const { answer: correct, text } = riddle;
    riddle = null; // one answer per question; clicks until the next one are ignored
    choicesEl.querySelectorAll('button').forEach((b) => {
      b.disabled = true;
      if (Number(b.textContent) === correct) b.classList.add('right');
    });

    if (n === correct) {
      right++;
      hitMarks[right - 1].classList.add('done');
      threads[right - 1].classList.add('snapped');
      restartAnimation(body, 'confused');
      flashEffect(
        fx,
        1250,
        600,
        '<g class="mg-spark"><path d="M0,-50 L0,-20 M0,20 L0,50 M-50,0 L-20,0 M20,0 L50,0" stroke="#fff3b0" stroke-width="6" stroke-linecap="round"/></g>',
        500
      );
      if (right >= RIDDLES_TO_WIN) {
        finish(true);
        return;
      }
      setNarration(
        `Rätt, ${text} = ${correct}! Spindeln räknar på benen och trasslar in sig – en tråd runt rubinen går av. ` +
          `${RIDDLES_TO_WIN - right} kvar!`
      );
    } else {
      mistakes++;
      btn.classList.add('wrong');
      patienceMarks[RIDDLE_MISTAKES - mistakes].classList.remove('done');
      restartAnimation(body, 'hiss');
      if (mistakes >= RIDDLE_MISTAKES) {
        finish(false, `${text} = ${correct}`);
        return;
      }
      setNarration(`Fel! ${text} är ${correct}. Spindeln skrattar och gnider sina ben. »Försök igen, lilla människa!«`);
    }
    setTimeout(ask, RIDDLE_PAUSE * 1000);
  }

  function finish(won, lastSum) {
    over = true;
    if (won) {
      ruby.classList.add('fall');
      if (!spiderDefeated()) state.rubies.push('cave');
      saveState(state);
      updateHud();
      restartAnimation(document.getElementById('rubies'), 'gain');
      setNarration(
        'Spindeln räknar och räknar tills hon har knutit ihop alla åtta benen! Den sista tråden går av och rubinen faller ' +
          'rakt ner i dina händer. ' +
          (state.name ? `Bra räknat, ${state.name}! ` : '') +
          'Du har vunnit grottans rubin!'
      );
      // Done with the cave: the player walks back out to the village.
      setTimeout(() => {
        close('town');
        setNarration(
          'Du lurade spindeln och tog dig ut ur grottan med facklan högt. Nu är du tillbaka i byn med grottans rubin!'
        );
      }, 2800);
    } else {
      body.classList.add('angry');
      setNarration(`Fel igen – ${lastSum}! Spindeln fräser och klättrar upp i mörkret.`);
      caveNotice =
        'Spindeln tappade tålamodet och kröp upp i taket. Nätet slaknar, och till slut sliter du dig loss! ' +
        'Nu kan du gå tillbaka – eller klicka på spindeln, som redan kommit ner igen, för att försöka en gång till.';
      nestFreed = true;
      setTimeout(close, 2200);
    }
  }

  function close(sceneId = state.location) {
    sceneEl.inert = false;
    render(sceneId);
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.hidden = true;
      overlay.innerHTML = '';
      overlay.classList.remove('cave');
    }, 400);
  }

  setTimeout(() => {
    if (!over) ask();
  }, 600);
}
