// Village quest: the wizard in the church. He is on holiday (a note on the door) until
// the player has won the other three rubies. Then he is back, with the fourth ruby on
// top of his staff. Only a magic sword, found in the crypt under the church, can knock
// it off, in a duel minigame. Reuses helpers from forest.js (randomBetween, hasItem,
// svgPoint, flashEffect, restartAnimation), placeTool() from lake.js and onActivate()
// from cave.js.

// The rubies the player must have won before the wizard comes home.
const WIZARD_NEEDS = ['forest', 'lake', 'cave'];

// Duel minigame tuning.
const STAFF_HITS = 3; // hits needed to knock the ruby off the staff
const COURAGE_SECONDS = 18; // how long the player's courage lasts
const SWORD_MISS = 0.1; // courage lost per missed swing
const SHIELD_BOUNCE = 0.15; // courage lost when the sword hits the magic shield
const SWORD_COOLDOWN = 0.6; // seconds before the sword can swing again; clicks in between are ignored
const SHIELD_UP = 1.3; // seconds the shield stays up
const SHIELD_WARN = 0.6; // seconds the ruby glows before the shield goes up

// Where the wizard stands in the church (his feet).
const WIZARD_SPOT = { x: 1010, y: 716 };

// Message shown instead of the scene narration on the next church or village render.
let churchNotice = '';

const CHURCH_NOTE =
  'På kyrkdörren sitter en lapp: »Stängt! Är på semester. Kommer hem när det blir lite mer spännande i trakten. ' +
  '/Trollkarlen« Dörren är låst.';

const CHURCH_NOTE_AGAIN =
  'På kyrkdörren sitter en ny lapp: »På semester igen! Rör inte mitt svärd. /Trollkarlen« Dörren är låst.';

function wizardHome() {
  return WIZARD_NEEDS.every((id) => state.rubies.includes(id));
}

function wizardDefeated() {
  return state.rubies.includes('town');
}

// The church is open while the wizard is home and still has the ruby.
function churchOpen() {
  return wizardHome() && !wizardDefeated();
}

function churchNarration(id, extra) {
  if (churchNotice) {
    const text = churchNotice;
    churchNotice = '';
    return text;
  }
  return extra ? `${SCENES[id].narration} ${extra}` : SCENES[id].narration;
}

// ---------- The church door in the village ----------

const lumberjackTownEnter = SCENES.town.enter; // from forest.js

SCENES.town.enter = (svg) => {
  const cleanup = lumberjackTownEnter(svg);
  const door = svg.querySelector('.church-door');
  const label = door.querySelector('.exit-label text');
  const open = churchOpen();

  door.querySelector('.church-closed').setAttribute('display', open ? 'none' : 'inline');
  door.querySelector('.church-open').setAttribute('display', open ? 'inline' : 'none');
  if (open) {
    door.dataset.goto = 'church';
    door.setAttribute('aria-label', 'Gå in i kyrkan');
    label.textContent = 'Gå in i kyrkan';
    door.querySelector('.church-window').setAttribute('fill', '#c9a0ff');
  } else {
    // game.js follows data-goto; without it the door only shows the note.
    onActivate(door, () => {
      const rubies = state.rubies.filter((id) => WIZARD_NEEDS.includes(id)).length;
      setNarration(
        wizardDefeated()
          ? CHURCH_NOTE_AGAIN
          : `${CHURCH_NOTE} Kanske kommer han hem när du har samlat fler rubiner – du har ${rubies} av 4.`
      );
    });
  }

  if (churchNotice) setNarration(churchNarration('town'));
  else if (open) {
    setNarration(
      `${SCENES.town.narration} Kyrkans fönster lyser lila och dörren står på glänt – trollkarlen är hemma från semestern!`
    );
  }
  return cleanup;
};

// ---------- Inside the church ----------

SCENES.church.enter = (svg) => {
  const actors = svg.querySelector('.actors');
  if (!hasItem('sword')) svg.querySelector('.crypt-glow').classList.add('pulse');
  else svg.querySelector('.crypt-glow').remove();

  if (!churchOpen()) {
    // Only reachable through an edited save: the wizard isn't here.
    setNarration(churchNarration('church', 'Kyrkan är tom. Trollkarlen är inte hemma.'));
    return null;
  }

  actors.insertAdjacentHTML('beforeend', suitcase(WIZARD_SPOT.x + 130, WIZARD_SPOT.y));
  actors.insertAdjacentHTML(
    'beforeend',
    `<g class="wizard-target" tabindex="0" role="button" aria-label="Utmana trollkarlen"
        transform="translate(${WIZARD_SPOT.x} ${WIZARD_SPOT.y}) scale(1.1)">
      <g class="wiz-sway">
        <rect x="-110" y="-380" width="200" height="380" fill="transparent"/>
        ${wizard('church-glow')}
      </g>
    </g>`
  );

  onActivate(actors.querySelector('.wizard-target'), () => {
    if (hasItem('sword')) {
      startDuel();
      return;
    }
    setNarration(
      'Trollkarlen skrattar så att skägget fladdrar. »Vill du ha min rubin? Ingen vanlig klinga biter på min stav, ' +
        'den skyddas av mäktig magi! Bara ett magiskt svärd kan slå loss den – och ett sådant har du inte.«'
    );
  });

  let hint;
  if (hasItem('sword')) {
    hint =
      'Trollkarlen står vid altaret med sin stav, och rubinen högst upp gnistrar. Svärdet surrar i din hand – klicka på trollkarlen för att utmana honom!';
  } else {
    hint =
      'Vid altaret står trollkarlen, solbränd efter semestern, med en rubin högst upp på sin stav. ' +
      '»Välkommen!«, säger han. »Rubinen? Den är min.« Ett blått sken lyser upp trappan ner till kryptan.';
  }
  setNarration(churchNarration('church', hint));
  return null;
};

// ---------- The crypt: the magic sword ----------

SCENES['church-crypt'].enter = (svg) => {
  let hint = '';
  if (!hasItem('sword')) {
    placeTool(svg.querySelector('.actors'), 'sword', magicSword(800, 596), 'Ta det magiska svärdet', () => {
      setNarration(
        'Du lyfter svärdet från stenkistan. Det är lätt som en fjäder, och runorna längs bladet lyser blått. ' +
          (churchOpen()
            ? 'Med det här kan du slå loss rubinen från trollkarlens stav!'
            : 'Det här svärdet biter nog på det mesta.')
      );
    });
    hint = 'På locket ligger ett svärd med blått lysande runor längs bladet.';
  }
  setNarration(churchNarration('church-crypt', hint));
};

// ---------- Minigame: knock the ruby off the staff ----------

function startDuel() {
  const sceneEl = document.getElementById('scene');
  const overlay = document.getElementById('minigame');
  overlay.classList.add('church');
  overlay.innerHTML = `
    ${wizardCloseUp()}
    <div class="mg-panel hud-box">
      <div class="mg-row">
        <span>Ditt mod</span>
        <div class="mg-bar"><div class="mg-fill"></div></div>
      </div>
      <div class="mg-row">
        <span>Slag på rubinen</span>
        <span class="mg-hits">${'<i class="mg-hit"></i>'.repeat(STAFF_HITS)}</span>
      </div>
    </div>`;
  overlay.hidden = false;
  sceneEl.inert = true;
  requestAnimationFrame(() => overlay.classList.add('open'));

  setNarration(
    '»Ett magiskt svärd? Var har du fått tag i det?«, ropar trollkarlen och svänger sin stav. ' +
      `Slå loss rubinen högst upp på staven – träffa den ${STAFF_HITS} gånger! Men akta dig: när rubinen lyser upp ` +
      'sluter sig en magisk sköld runt den.'
  );

  const svg = overlay.querySelector('svg');
  const wizardEl = svg.querySelector('.mg-wizard');
  const body = svg.querySelector('.mg-wizard-body');
  const staff = svg.querySelector('.mg-staff');
  const ruby = svg.querySelector('.mg-ruby');
  const shield = svg.querySelector('.mg-shield');
  const spell = svg.querySelector('.mg-spell');
  const cracks = svg.querySelectorAll('.mg-crack');
  const fx = svg.querySelector('.mg-fx');
  const fill = overlay.querySelector('.mg-fill');
  const hitMarks = overlay.querySelectorAll('.mg-hit');

  let courage = 1;
  let hits = 0;
  let t = Math.random() * 10; // phase of the staff's swinging
  let speed = 1.2; // how fast he swings; rises with every hit
  let flinch = 0; // seconds he freezes after being hit
  let shieldUp = false;
  let shieldTimer = randomBetween(2.2, 3.2); // seconds until the shield changes
  let over = false;
  let raf = 0;
  let last = performance.now();
  let readyAt = 0; // time (ms) the next swing is allowed

  function shieldPause() {
    // The shield comes back sooner the more hits he has taken.
    return randomBetween(1.8, 3) - hits * 0.4;
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (flinch > 0) flinch -= dt;
    else t += dt * speed;

    courage -= dt / COURAGE_SECONDS;
    fill.style.width = `${Math.max(0, courage) * 100}%`;
    fill.classList.toggle('low', courage < 0.3);

    shieldTimer -= dt;
    if (shieldUp && shieldTimer <= 0) {
      shieldUp = false;
      shield.classList.remove('up');
      shieldTimer = shieldPause();
    } else if (!shieldUp) {
      ruby.classList.toggle('charging', shieldTimer <= SHIELD_WARN);
      if (shieldTimer <= 0) {
        shieldUp = true;
        shield.classList.add('up');
        ruby.classList.remove('charging');
        restartAnimation(spell, 'cast');
        shieldTimer = SHIELD_UP;
      }
    }

    const dx = Math.sin(t * 0.7) * 120;
    const angle = Math.sin(t) * 38 + Math.sin(t * 2.1 + 1) * 10;
    wizardEl.setAttribute('transform', `translate(${(800 + dx).toFixed(1)} 0)`);
    staff.setAttribute('transform', `translate(${(570 + dx).toFixed(1)} 660) rotate(${angle.toFixed(2)})`);

    if (courage <= 0) {
      finish(false);
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  svg.addEventListener('click', (e) => {
    if (over) return;
    // Still swinging: ignore the click, so spam-clicking doesn't pile up hits.
    const now = performance.now();
    if (now < readyAt) return;
    readyAt = now + SWORD_COOLDOWN * 1000;
    const p = svgPoint(svg, e);
    if (e.target.closest('.mg-ruby-target') && shieldUp) {
      courage -= SHIELD_BOUNCE;
      restartAnimation(body, 'snarl');
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-miss"><text font-size="40" text-anchor="middle" fill="#bfeaff" stroke="#10182a" stroke-width="2">Pling!</text></g>',
        700
      );
      setNarration('Pling! Svärdet studsar mot den magiska skölden. Vänta tills den släpper!');
    } else if (e.target.closest('.mg-ruby-target')) {
      hits++;
      hitMarks[hits - 1].classList.add('done');
      cracks[hits - 1].classList.add('show');
      flinch = 0.35;
      speed += 0.5;
      restartAnimation(body, 'hurt');
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-spark"><path d="M0,-40 L0,-16 M0,16 L0,40 M-40,0 L-16,0 M16,0 L40,0 M-28,-28 L-12,-12 M12,12 L28,28 M28,-28 L12,-12 M-12,12 L-28,28" stroke="#bfeaff" stroke-width="6" stroke-linecap="round"/></g>',
        500
      );
      if (hits >= STAFF_HITS) {
        finish(true);
      } else {
        setNarration(`Kling! Rubinen sitter allt lösare på staven – ${STAFF_HITS - hits} slag kvar!`);
      }
    } else {
      courage -= SWORD_MISS;
      restartAnimation(body, 'snarl');
      flashEffect(
        fx,
        p.x,
        p.y,
        '<g class="mg-miss"><text font-size="40" text-anchor="middle" fill="#ffd977" stroke="#1a1208" stroke-width="2">Miss!</text></g>',
        700
      );
      setNarration('Miss! Trollkarlen fnissar och svänger staven – sikta på rubinen!');
    }
  });

  function finish(won) {
    over = true;
    cancelAnimationFrame(raf);
    shield.classList.remove('up');
    ruby.classList.remove('charging');
    if (won) {
      ruby.classList.add('loose');
      body.classList.add('defeated');
      if (!wizardDefeated()) state.rubies.push('town');
      saveState(state);
      updateHud();
      restartAnimation(document.getElementById('rubies'), 'gain');
      setNarration(
        'Rubinen flyger av staven! »Nej, nej, nej!«, ropar trollkarlen. ' +
          (state.name ? `Bra kämpat, ${state.name}! ` : '') +
          'Du har vunnit byns rubin!'
      );
      churchNotice =
        '»Nåja«, suckar trollkarlen, »då åker jag på semester igen.« Han tar sin resväska och försvinner i ett lila moln. ' +
        'Nu har du alla fyra rubinerna! De glöder varmt – med dem kan du smida rustning och vapen som står emot åskdraken på toppen av Mount Thunder.';
      setTimeout(() => close('town'), 2800);
    } else {
      restartAnimation(spell, 'cast');
      body.classList.add('zap');
      setNarration('Modet tryter! »Hokus pokus!«, ropar trollkarlen och viftar med staven…');
      churchNotice =
        'Puff! I ett lila moln trollar trollkarlen ut dig ur kyrkan, och du landar på rumpan mitt i byn. ' +
        'Kyrkdörren står fortfarande på glänt – gå in och försök igen!';
      setTimeout(() => close('town'), 2000);
    }
  }

  function close(sceneId) {
    sceneEl.inert = false;
    render(sceneId);
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.hidden = true;
      overlay.innerHTML = '';
      overlay.classList.remove('church');
    }, 400);
  }

  raf = requestAnimationFrame(tick);
}
