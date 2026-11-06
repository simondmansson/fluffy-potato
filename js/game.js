// Main loop: renders the current scene and handles moving between scenes.

const state = loadState();

const sceneEl = document.getElementById('scene');
const locationNameEl = document.getElementById('location-name');
const narrationEl = document.getElementById('narration');
const rubyCountEl = document.getElementById('ruby-count');

const FADE_MS = 400;
let transitioning = false;

// Fill the screen on landscape displays; fit the whole scene on narrow ones
// so exits near the edges are never cropped away.
function fitScene() {
  const svg = sceneEl.querySelector('svg');
  if (!svg) return;
  const wide = window.innerWidth / window.innerHeight >= 1.4;
  svg.setAttribute('preserveAspectRatio', wide ? 'xMidYMid slice' : 'xMidYMid meet');
}

function render(sceneId) {
  const scene = SCENES[sceneId];
  sceneEl.innerHTML = scene.svg;
  sceneEl.dataset.scene = sceneId;
  fitScene();

  locationNameEl.textContent = scene.name;
  narrationEl.textContent = scene.narration;
  rubyCountEl.textContent = state.rubies.length;
  document.title = `${scene.name} – Thunder Dragon`;

  state.location = sceneId;
  saveState(state);
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

render(SCENES[state.location] ? state.location : 'town');
