// Main loop: renders the current scene and handles moving between scenes.

const state = loadState();

const sceneEl = document.getElementById('scene');
const locationNameEl = document.getElementById('location-name');
const narrationEl = document.getElementById('narration');
const rubyCountEl = document.getElementById('ruby-count');
const inventoryEl = document.getElementById('inventory');
const playerNameEl = document.getElementById('player-name');

const FADE_MS = 400;
let transitioning = false;
// Cleanup returned by the current scene's enter() hook (stops animations etc.).
let leaveScene = null;

// Fill the screen on landscape displays; fit the whole scene on narrow ones
// so exits near the edges are never cropped away.
function fitScene() {
  const svg = sceneEl.querySelector('svg');
  if (!svg) return;
  const wide = window.innerWidth / window.innerHeight >= 1.4;
  svg.setAttribute('preserveAspectRatio', wide ? 'xMidYMid slice' : 'xMidYMid meet');
}

function setNarration(text) {
  narrationEl.textContent = text;
  narrationEl.classList.remove('collapsed'); // new text is always shown in full
}

// Tapping the narration folds it down to one line, so it doesn't hide the scene
// on small screens. Tapping again (or any new text) shows all of it.
narrationEl.addEventListener('click', () => narrationEl.classList.toggle('collapsed'));

function updateHud() {
  // textContent only: the name is typed by the player and must never be parsed as markup.
  playerNameEl.textContent = state.name;
  playerNameEl.hidden = !state.name;
  rubyCountEl.textContent = state.rubies.length;
  let carrying = false;
  inventoryEl.querySelectorAll('.inv-item').forEach((el) => {
    el.hidden = !state.items.includes(el.dataset.item);
    if (!el.hidden) carrying = true;
  });
  inventoryEl.hidden = !carrying;
  const hasAxe = state.items.includes('axe');
  // The cursor turns into an axe once the player carries one.
  document.body.classList.toggle('has-axe', hasAxe);
  // In the cave the cursor is the torch instead, and in the church the magic sword.
  document.body.classList.toggle('has-torch', state.items.includes('torch'));
  document.body.classList.toggle('has-sword', state.items.includes('sword'));
}

// Scenes may define enter(svg) to add interactive content after rendering.
// It can return a cleanup function that runs when the scene is left.
// Own-property check, so ids like "__proto__" or "constructor" from a save don't count.
function hasScene(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SCENES, id);
}

function render(sceneId) {
  if (!hasScene(sceneId)) sceneId = 'town';
  if (leaveScene) {
    leaveScene();
    leaveScene = null;
  }

  const scene = SCENES[sceneId];
  sceneEl.innerHTML = scene.svg;
  sceneEl.dataset.scene = sceneId;
  fitScene();

  locationNameEl.textContent = scene.name;
  setNarration(scene.narration);
  updateHud();
  document.title = `${scene.name} – Thunder Dragon`;

  state.location = sceneId;
  saveState(state);

  if (scene.enter) leaveScene = scene.enter(sceneEl.querySelector('svg')) || null;
}

function goTo(sceneId) {
  if (transitioning || !hasScene(sceneId)) return;
  transitioning = true;
  sceneEl.classList.add('fading');
  setTimeout(() => {
    render(sceneId);
    sceneEl.classList.remove('fading');
    transitioning = false;
  }, FADE_MS);
}

sceneEl.addEventListener('click', (e) => {
  const exit = e.target.closest('[data-goto]');
  if (exit) goTo(exit.dataset.goto);
});

sceneEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const exit = e.target.closest('[data-goto]');
  if (exit) {
    e.preventDefault();
    goTo(exit.dataset.goto);
  }
});

window.addEventListener('resize', fitScene);

// ---------- Debug: log every mouse click ----------

const DEBUG_CLICKS = true;

// Short name for what was clicked, using the game's own markers.
function describeClickTarget(target) {
  const el = target instanceof Element ? target : null;
  if (!el) return 'nothing';
  const exit = el.closest('[data-goto]');
  if (exit) return `exit → ${exit.dataset.goto}`;
  const part = el.closest('[data-part]');
  if (part) return `werewolf ${part.dataset.part}`;
  const pickup = el.closest('.pickup');
  if (pickup) return `pickup ${pickup.dataset.item}`;
  if (el.closest('.mg-ruby-target')) return 'ruby';
  if (el.closest('.bobber')) return 'float';
  if (el.closest('.readable')) return 'note';
  if (el.closest('.spider-target')) return 'spider';
  if (el.closest('.wizard-target')) return 'wizard';
  if (el.closest('.smith-target')) return 'smith';
  if (el.closest('.mg-anvil-target')) return 'anvil';
  if (el.closest('.church-door')) return 'church door';
  if (el.closest('.npc')) return 'lumberjack';
  if (el.closest('.riddle-choice')) return `answer ${el.closest('.riddle-choice').textContent}`;
  if (el.closest('.lake-cast, .mg-water')) return 'water';
  const cls = el.getAttribute('class');
  return cls ? `<${el.tagName.toLowerCase()} class="${cls}">` : `<${el.tagName.toLowerCase()}>`;
}

if (DEBUG_CLICKS) {
  // Capture phase, so the click is logged before any handler re-renders the scene.
  document.addEventListener(
    'click',
    (e) => {
      const minigame = document.getElementById('minigame');
      const inMinigame = !minigame.hidden;
      const svg = (inMinigame ? minigame : sceneEl).querySelector('svg');
      let scenePoint = null;
      if (svg && svg.getScreenCTM()) {
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
        scenePoint = { x: Math.round(p.x), y: Math.round(p.y) };
      }
      console.log('[click]', describeClickTarget(e.target), {
        scene: state.location,
        minigame: inMinigame,
        screen: { x: e.clientX, y: e.clientY },
        svg: scenePoint,
        button: e.button,
        target: e.target,
      });
    },
    true
  );
}

// ---------- Heroes: start screen and switching ----------

const startEl = document.getElementById('start');
const startForm = document.getElementById('new-game-form');
const nameInput = document.getElementById('name-input');
const startPlayersEl = document.getElementById('start-players');
const startCancel = document.getElementById('start-cancel');
const heroBtn = document.getElementById('hero-btn');
const heroList = document.getElementById('hero-list');
const heroPlayersEl = document.getElementById('hero-players');
const minigameEl = document.getElementById('minigame');

// Replace the current state with another hero's (or a fresh) game.
function useState(next) {
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, next);
  // Messages left for the next render belong to the previous hero.
  forestNotice = '';
  lakeNotice = '';
  caveNotice = '';
  churchNotice = '';
  forgeNotice = '';
  nestFreed = false;
  lumberjackIntro = false;
}

// Start a fresh game for a new character, saved next to the other heroes.
function newGame(name) {
  useState({ ...defaultState(), id: newPlayerId(), name });
  saveState(state);
  lumberjackIntro = true; // the lumberjack runs in and tells his story (forest.js)
}

function welcomeBack(name) {
  return name ? `Välkommen tillbaka, ${name}!` : 'Välkommen tillbaka!';
}

function rubyText(n) {
  return `${n}/4 rubiner`;
}

// A button for one saved hero. The name is typed by a player: textContent only.
function heroButton(p, className) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  const name = document.createElement('span');
  name.className = 'hero-name';
  name.textContent = p.name || 'Namnlös hjälte';
  const rubies = document.createElement('span');
  rubies.className = 'hero-rubies';
  rubies.textContent = rubyText(p.rubies);
  btn.append(name, rubies);
  return btn;
}

let started = false;

function closeStartScreen(sceneId, greeting) {
  if (started) return;
  started = true;
  startEl.classList.add('closing');
  render(sceneId);
  setNarration(`${greeting} ${narrationEl.textContent}`);
  setTimeout(() => {
    startEl.hidden = true;
    startEl.querySelector('.start-bg').innerHTML = ''; // drop the duplicate town SVG ids
  }, FADE_MS);
}

// Shows the start screen: continue with a saved hero, or name a new one.
// `inGame` is true when it is opened from the hero menu while playing.
function openStartScreen(inGame) {
  started = false;
  startEl.hidden = false;
  startEl.classList.remove('closing');
  // The town, dimmed, as a backdrop. Its markup is a static template from scenes.js.
  const bg = startEl.querySelector('.start-bg');
  bg.innerHTML = SCENES.town.svg;
  bg.querySelector('svg').setAttribute('preserveAspectRatio', 'xMidYMid slice');

  // The hero played last comes first.
  const players = listPlayers().sort((a, b) => (b.id === state.id) - (a.id === state.id));
  startPlayersEl.innerHTML = '';
  players.forEach((p) => {
    const btn = heroButton(p, 'start-btn start-hero');
    btn.addEventListener('click', () => {
      if (p.id !== state.id) {
        const saved = loadPlayer(p.id);
        if (!saved) return;
        useState(saved);
        saveState(state); // now the current hero
      }
      closeStartScreen(hasScene(state.location) ? state.location : 'town', welcomeBack(state.name));
    });
    startPlayersEl.appendChild(btn);
  });
  document.getElementById('start-continue').hidden = players.length === 0;
  const full = players.length >= MAX_PLAYERS;
  startForm.hidden = full;
  document.getElementById('full-note').hidden = !full;
  document.getElementById('new-game-btn').textContent = players.length ? 'Ny hjälte' : 'Starta spelet';
  startCancel.hidden = !inGame;
  nameInput.value = '';

  if (inGame && !full) nameInput.focus();
  else if (players.length) startPlayersEl.firstElementChild.focus();
  else nameInput.focus();
}

startForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = normalizeName(nameInput.value);
  if (!name) {
    nameInput.value = '';
    nameInput.focus();
    return;
  }
  newGame(name);
  closeStartScreen('town', `Välkommen, ${name}!`);
});

// Back to the game from the start screen opened in the hero menu, without switching.
startCancel.addEventListener('click', () => {
  if (started) return;
  started = true;
  startEl.classList.add('closing');
  setTimeout(() => {
    startEl.hidden = true;
    startEl.querySelector('.start-bg').innerHTML = '';
  }, FADE_MS);
});

// ---------- Hero menu (top right) ----------

function closeHeroMenu() {
  heroList.hidden = true;
  heroBtn.setAttribute('aria-expanded', 'false');
}

function openHeroMenu() {
  heroPlayersEl.innerHTML = '';
  listPlayers().forEach((p) => {
    const li = document.createElement('li');
    const btn = heroButton(p, 'hero-player');
    if (p.id === state.id) {
      btn.classList.add('current');
      btn.setAttribute('aria-current', 'true');
    }
    btn.addEventListener('click', () => switchHero(p.id));
    li.appendChild(btn);
    heroPlayersEl.appendChild(li);
  });
  heroList.hidden = false;
  heroBtn.setAttribute('aria-expanded', 'true');
  heroPlayersEl.querySelector('button').focus();
}

// Leave the current hero's game (it is already saved) and continue another hero's.
function switchHero(id) {
  closeHeroMenu();
  if (id === state.id || transitioning || !minigameEl.hidden) return;
  const saved = loadPlayer(id);
  if (!saved) return;
  transitioning = true;
  sceneEl.classList.add('fading');
  setTimeout(() => {
    useState(saved);
    saveState(state); // now the current hero
    render(state.location);
    setNarration(`${welcomeBack(state.name)} ${narrationEl.textContent}`);
    sceneEl.classList.remove('fading');
    transitioning = false;
  }, FADE_MS);
}

heroBtn.addEventListener('click', () => {
  // Not in the middle of a minigame: it runs on the current hero's game.
  if (!minigameEl.hidden) {
    setNarration('Du kan inte byta hjälte mitt i en strid!');
    return;
  }
  if (heroList.hidden) openHeroMenu();
  else closeHeroMenu();
});

document.getElementById('hero-new').addEventListener('click', () => {
  closeHeroMenu();
  openStartScreen(true);
});

document.addEventListener('click', (e) => {
  if (!heroList.hidden && !e.target.closest('.hero-menu')) closeHeroMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !heroList.hidden) {
    closeHeroMenu();
    heroBtn.focus();
  }
});

openStartScreen(false);
