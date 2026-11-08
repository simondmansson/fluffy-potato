# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech stack (from README)

- Plain HTML, JavaScript and CSS. No framework and no build step is planned.
- Runs directly in the browser.
- Game progress is persisted to `localStorage`.

To run the game, open `index.html` directly in the browser (`file://`). No local server is used. Code must work under `file://`, so avoid anything that needs an HTTP origin, such as ES module `import` across files or `fetch()` of local files. Load scripts with plain `<script src>` tags instead.

## Architecture

Scripts are classic `<script>` tags loaded in order by `index.html`, sharing globals: `js/state.js` → `js/art.js` → `js/scenes.js` → `js/forest.js` → `js/lake.js` → `js/cave.js` → `js/game.js`.

- **`state.js`**: the save object (`{ id, name, location, rubies: [], items: [], forest }`). Several heroes are saved under the localStorage key `thunder-dragon-saves` as `{ current, players: [state, ...] }` (at most `MAX_PLAYERS`; an old single save under `thunder-dragon-save` becomes the first hero). `loadState()` gives the current hero, `saveState(state)` saves that hero and makes it current, and `listPlayers()` / `loadPlayer(id)` / `hasSave()` serve the start screen and the hero menu. Storage access is wrapped in try/catch, so the game still runs when storage is blocked. Treat the save as untrusted (anyone can edit it, and in some browsers all `file://` pages share one localStorage): `cleanState()` keeps only known fields of the right type, player ids must match `PLAYER_ID`, and `normalizeName()` / `MAX_NAME_LENGTH` live here. Look up scene ids with `hasScene()` (own-property check, so `__proto__` etc. never count), and validate values against constant lists, never by indexing an object with them.
- **`art.js`**: helpers that return SVG markup strings (`pine`, `leafy`, `treeRow`, `house`, `smoke`, `signpost`, `signExit`, `fern`, `rock`, `stump`, `axeInStump`, `werewolf`, `werewolfCloseUp`, and for the lake `boathouse`, `rowboat`, `rodLeaning`, `harpoonLying`, `tentaclePeek`, `squidShadow`, `bobber`, `giantSquidCloseUp`, and for the cave `caveMouth`, `torch`, `torchOnWall`, `caveOpening`, `caveBack`, `stalactites`, `spiderWeb`, `cobweb`, `bones`, `cocoon`, `spider`, `rubyInSilk`, `giantSpiderCloseUp`). `treeRow` uses a seeded RNG so scenes look the same on every load. Text and attribute values placed into markup go through `escapeXml()`.
- **`scenes.js`**: the `SCENES` registry. Each scene is `{ name, narration, svg }`, where `svg` is a template string drawn in a `0 0 1600 900` viewBox. Any element with `data-goto="<sceneId>"` is an exit. Give exits `class="exit"`, `tabindex="0"`, `role="button"` and an `aria-label` for hover styling and keyboard use (`signExit()` does this for signposts).
- **`forest.js`**: the forest quest. It also adds the lumberjack (`lumberjack()` in `art.js`) to the town's `<g class="actors">` layer; when `game.js` starts a new game it sets `lumberjackIntro`, and he runs in and says the werewolf took his axe. It attaches an `enter` hook to the four forest scenes, rolls the random axe/werewolf screens into `state.forest` on first visit, puts the stump/axe and the running werewolf into the scene's `<g class="actors">` layer, and runs the ruby minigame in the `#minigame` overlay.
- **`lake.js`**: the lake quest, on the scenes `lake` (shore) and `lake-boat`. Adds the rod and harpoon pickups (items `rod`, `harpoon`), makes the rowboat an exit only once both are carried, runs the fishing (squid shadow, float, bite) and the harpoon minigame in `#minigame` (with class `lake`). It reuses helpers defined in `forest.js` (`randomBetween`, `hasItem`, `svgPoint`, `flashEffect`, `restartAnimation`). Pickups carry `data-item`, and each item has a matching `.inv-item[data-item]` icon in the HUD in `index.html`. The `hidden` attribute does not hide SVG elements; use `display="none"`.
- **`cave.js`**: the cave quest, on the scenes `cave` (the mouth) and the dark passages `cave-fork`, `cave-drip`, `cave-chasm`, `cave-bones`, `cave-webs`, `cave-nest`. Adds the torch pickup (item `torch`, via `placeTool()` from `lake.js`) and makes the way in an exit only once it is carried. Dark passages end with `caveDarkness()` (in `scenes.js`): a masked dark layer with a `.torch-light` circle that `lightTorch()` moves to the pointer. In the nest it adds the spider and runs the riddle minigame (sums with every number ≤ `RIDDLE_MAX`, answered with HTML buttons) in `#minigame` (with class `cave`). Also uses the `forest.js` helpers.
- **`game.js`**: renders a scene into `#scene`, updates the HUD (location name, ruby count, carried items, narration), saves the location, and handles exit clicks and Enter/Space with a fade transition. A scene may define `enter(svg)`, called after rendering. It can return a cleanup function that runs when the scene is left. `setNarration()`, `updateHud()` and `render()` are shared globals. On load it shows the `#start` screen (continue with a saved hero, or name a new one) and renders the first scene only once the player starts. The hero menu (`#hero-btn` / `#hero-list`, top right of the HUD) switches heroes with `switchHero()` or reopens the start screen for a new one; `useState()` replaces the shared `state` object in place and clears the quests' pending notices. Switching is refused while `#minigame` is open. The player's name is typed input: only ever insert it with `textContent`, never into `innerHTML` or SVG templates. Every click is logged to the console while `DEBUG_CLICKS` is true. It switches `preserveAspectRatio` between `slice` (wide screens) and `meet` (narrow screens), so keep important art and exits inside roughly x 80–1520.

To add a location: add an entry to `SCENES`, link it with a `data-goto` exit from another scene, and add a `#scene[data-scene="<id>"]` letterbox background in `css/style.css`. SVG `id`s (gradients, filters) are prefixed with the scene id. Animations are CSS classes in `style.css` and are disabled under `prefers-reduced-motion`. Decoration drawn on top of clickable things (fog, effects) needs `class="fog"` or `class="no-hit"` so it doesn't block clicks. CSS transforms override an SVG `transform` attribute, so animate an inner `<g>` inside a positioned outer `<g>`.

## Testing

Test the game in a browser with the Playwright MCP tools (`mcp__plugin_playwright_playwright__*`):

- Load the game with `browser_navigate` to `file:///home/kalk/repos/thunder-dragon/index.html`. Playwright MCP blocks `file:` URLs by default, so the server must be started with `--allow-unrestricted-file-access` for this to work.
- Use `browser_snapshot` and `browser_take_screenshot` to check the page, `browser_click` and `browser_press_key` to play, and `browser_console_messages` to catch JS errors.
- Progress lives in `localStorage`. To test from a fresh start, clear it with `browser_evaluate` (`localStorage.clear()`) and reload the page.

## Game design summary

Thunder Dragon is a browser game. The README is the design source of truth; keep it in sync when the design changes.


## Language

The README and in-game story are written in Swedish. Keep player-facing text in Swedish unless told otherwise.
