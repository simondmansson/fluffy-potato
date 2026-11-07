// Game state and persistence to localStorage.

const SAVE_KEY = 'thunder-dragon-save';

function defaultState() {
  return {
    location: 'town',
    rubies: [], // ids of locations whose ruby has been won, e.g. 'forest'
    items: [], // items the player carries, e.g. 'axe'
    forest: null, // random layout of the forest quest, rolled on first visit (see forest.js)
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      return Object.assign(defaultState(), JSON.parse(raw));
    }
  } catch (e) {
    // Storage blocked or save corrupted: start a new game.
  }
  return defaultState();
}

function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage unavailable: the game still works, progress just isn't kept.
  }
}
