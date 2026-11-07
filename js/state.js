// Game state and persistence to localStorage.

const SAVE_KEY = 'thunder-dragon-save';

function defaultState() {
  return {
    name: '', // the player's character name, chosen on the start screen
    location: 'town',
    rubies: [], // ids of locations whose ruby has been won, e.g. 'forest'
    items: [], // items the player carries, e.g. 'axe'
    forest: null, // random layout of the forest quest, rolled on first visit (see forest.js)
  };
}

const MAX_NAME_LENGTH = 20;

// Collapse whitespace and cap the length of a character name.
function normalizeName(name) {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((x) => typeof x === 'string') : [];
}

// The save may be edited or replaced by anyone (in some browsers every file:// page
// shares one localStorage), so only known fields of the right type are kept.
// Scene ids and the forest layout are checked against the game data where they
// are used (hasScene() in game.js, forestQuest() in forest.js).
function loadState() {
  const state = defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      if (typeof saved.name === 'string') state.name = normalizeName(saved.name);
      if (typeof saved.location === 'string') state.location = saved.location;
      state.rubies = stringList(saved.rubies);
      state.items = stringList(saved.items);
      const f = saved.forest;
      if (f && typeof f === 'object') {
        state.forest = { axeScene: f.axeScene, axeSpot: f.axeSpot, wolfScene: f.wolfScene };
      }
    }
  } catch (e) {
    // Storage blocked or save corrupted: start a new game.
  }
  return state;
}

// True if a saved game exists (so the start screen can offer "continue").
function hasSave() {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch (e) {
    return false;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage unavailable: the game still works, progress just isn't kept.
  }
}
