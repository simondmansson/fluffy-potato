// Game state and persistence to localStorage.
// Several heroes (players) can be saved; one of them is the current one.

const SAVE_KEY = 'thunder-dragon-saves';
const OLD_SAVE_KEY = 'thunder-dragon-save'; // single save from before there were several heroes
const MAX_PLAYERS = 8;

function defaultState() {
  return {
    id: '', // which saved hero this is, see newPlayerId()
    name: '', // the player's character name, chosen on the start screen
    location: 'town',
    rubies: [], // ids of locations whose ruby has been won, e.g. 'forest'
    items: [], // items the player carries, e.g. 'axe'
    forest: null, // random layout of the forest quest, rolled on first visit (see forest.js)
  };
}

const MAX_NAME_LENGTH = 20;
const PLAYER_ID = /^[a-z0-9]{1,24}$/;

// Collapse whitespace and cap the length of a character name.
function normalizeName(name) {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
}

function newPlayerId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((x) => typeof x === 'string') : [];
}

// The save may be edited or replaced by anyone (in some browsers every file:// page
// shares one localStorage), so only known fields of the right type are kept.
// Scene ids and the forest layout are checked against the game data where they
// are used (hasScene() in game.js, forestQuest() in forest.js).
function cleanState(saved) {
  const state = defaultState();
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return state;
  if (typeof saved.id === 'string' && PLAYER_ID.test(saved.id)) state.id = saved.id;
  if (typeof saved.name === 'string') state.name = normalizeName(saved.name);
  if (typeof saved.location === 'string') state.location = saved.location;
  state.rubies = stringList(saved.rubies);
  state.items = stringList(saved.items);
  const f = saved.forest;
  if (f && typeof f === 'object') {
    state.forest = { axeScene: f.axeScene, axeSpot: f.axeSpot, wolfScene: f.wolfScene };
  }
  return state;
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return null; // storage blocked or save corrupted
  }
}

// All saved heroes: { current, players: [state, ...] }. Players keep a unique id, at most
// MAX_PLAYERS of them, and `current` is the id of one of them (or '' when there are none).
function loadSaves() {
  let saved = readJson(SAVE_KEY);
  if (!saved || typeof saved !== 'object') {
    // An old single save becomes the first hero.
    const old = readJson(OLD_SAVE_KEY);
    saved = old && typeof old === 'object' ? { players: [old] } : {};
  }
  const players = [];
  if (Array.isArray(saved.players)) {
    for (const p of saved.players) {
      if (players.length >= MAX_PLAYERS) break;
      const s = cleanState(p);
      if (!s.id || players.some((other) => other.id === s.id)) s.id = newPlayerId();
      players.push(s);
    }
  }
  const current = players.some((p) => p.id === saved.current) ? saved.current : players.length ? players[0].id : '';
  return { current, players };
}

function writeSaves(saves) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
  } catch (e) {
    // Storage unavailable: the game still works, progress just isn't kept.
  }
}

// The current hero's game, or a fresh one if nothing is saved.
function loadState() {
  const saves = loadSaves();
  return saves.players.find((p) => p.id === saves.current) || defaultState();
}

// The saved game of the hero with this id, or null.
function loadPlayer(id) {
  return loadSaves().players.find((p) => p.id === id) || null;
}

// Name, id and ruby count of every saved hero, for the start screen and the hero menu.
function listPlayers() {
  return loadSaves().players.map((p) => ({ id: p.id, name: p.name, rubies: p.rubies.length }));
}

// True if a saved game exists (so the start screen can offer "continue").
function hasSave() {
  return loadSaves().players.length > 0;
}

// Saves this hero's game and makes it the current one. A hero without an id gets one.
function saveState(state) {
  if (!state.id) state.id = newPlayerId();
  const saves = loadSaves();
  const i = saves.players.findIndex((p) => p.id === state.id);
  if (i >= 0) saves.players[i] = state;
  else if (saves.players.length < MAX_PLAYERS) saves.players.push(state);
  else return; // full: the start screen doesn't offer new heroes then
  saves.current = state.id;
  writeSaves(saves);
}
