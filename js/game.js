// Main loop: renders the current scene and handles moving between scenes.

const state = loadState();

const sceneEl = document.getElementById('scene');
const locationNameEl = document.getElementById('location-name');
const narrationEl = document.getElementById('narration');
const rubyCountEl = document.getElementById('ruby-count');
const inventoryEl = document.getElementById('inventory');

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
}

function updateHud() {
  rubyCountEl.textContent = state.rubies.length;
  const hasAxe = state.items.includes('axe');
  inventoryEl.hidden = !hasAxe;
  // The cursor turns into an axe once the player carries one.
  document.body.classList.toggle('has-axe', hasAxe);
}

// Scenes may define enter(svg) to add interactive content after rendering.
// It can return a cleanup function that runs when the scene is left.
function render(sceneId) {
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
  if (transitioning || !SCENES[sceneId]) return;
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
  if (el.closest('.pickup')) return 'axe';
  if (el.closest('.mg-ruby-target')) return 'ruby';
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

render(SCENES[state.location] ? state.location : 'town');
