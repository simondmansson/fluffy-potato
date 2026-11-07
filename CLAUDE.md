# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech stack (from README)

- Plain HTML, JavaScript and CSS. No framework and no build step is planned.
- Runs directly in the browser.
- Game progress is persisted to `localStorage`.

To run the game, open `index.html` directly in the browser (`file://`). No local server is used. Code must work under `file://`, so avoid anything that needs an HTTP origin, such as ES module `import` across files or `fetch()` of local files. Load scripts with plain `<script src>` tags instead.

## Architecture

Scripts are classic `<script>` tags loaded in order by `index.html`, sharing globals: `js/state.js` → `js/art.js` → `js/scenes.js` → `js/forest.js` → `js/game.js`.

- **`state.js`**: the save object (`{ name, location, rubies: [], items: [], forest }`) and `loadState()` / `saveState()` / `hasSave()` under the localStorage key `thunder-dragon-save`. Storage access is wrapped in try/catch, so the game still runs when storage is blocked.
- **`art.js`**: helpers that return SVG markup strings (`pine`, `leafy`, `treeRow`, `house`, `smoke`, `signpost`, `signExit`, `fern`, `rock`, `stump`, `axeInStump`, `werewolf`, `werewolfCloseUp`). `treeRow` uses a seeded RNG so scenes look the same on every load.
- **`scenes.js`**: the `SCENES` registry. Each scene is `{ name, narration, svg }`, where `svg` is a template string drawn in a `0 0 1600 900` viewBox. Any element with `data-goto="<sceneId>"` is an exit. Give exits `class="exit"`, `tabindex="0"`, `role="button"` and an `aria-label` for hover styling and keyboard use (`signExit()` does this for signposts).
- **`forest.js`**: the forest quest. It attaches an `enter` hook to the four forest scenes, rolls the random axe/werewolf screens into `state.forest` on first visit, puts the stump/axe and the running werewolf into the scene's `<g class="actors">` layer, and runs the ruby minigame in the `#minigame` overlay.
- **`game.js`**: renders a scene into `#scene`, updates the HUD (location name, ruby count, axe in inventory, narration), saves the location, and handles exit clicks and Enter/Space with a fade transition. A scene may define `enter(svg)`, called after rendering. It can return a cleanup function that runs when the scene is left. `setNarration()`, `updateHud()` and `render()` are shared globals. On load it shows the `#start` screen (name entry, or continue an existing save) and renders the first scene only once the player starts. The player's name is typed input: only ever insert it with `textContent`, never into `innerHTML` or SVG templates. Every click is logged to the console while `DEBUG_CLICKS` is true. It switches `preserveAspectRatio` between `slice` (wide screens) and `meet` (narrow screens), so keep important art and exits inside roughly x 80–1520.

To add a location: add an entry to `SCENES`, link it with a `data-goto` exit from another scene, and add a `#scene[data-scene="<id>"]` letterbox background in `css/style.css`. SVG `id`s (gradients, filters) are prefixed with the scene id. Animations are CSS classes in `style.css` and are disabled under `prefers-reduced-motion`. Decoration drawn on top of clickable things (fog, effects) needs `class="fog"` or `class="no-hit"` so it doesn't block clicks. CSS transforms override an SVG `transform` attribute, so animate an inner `<g>` inside a positioned outer `<g>`.

## Testing

Test the game in a browser with the Playwright MCP tools (`mcp__plugin_playwright_playwright__*`):

- Load the game with `browser_navigate` to `file:///home/kalk/repos/thunder-dragon/index.html`. Playwright MCP blocks `file:` URLs by default, so the server must be started with `--allow-unrestricted-file-access` for this to work.
- Use `browser_snapshot` and `browser_take_screenshot` to check the page, `browser_click` and `browser_press_key` to play, and `browser_console_messages` to catch JS errors.
- Progress lives in `localStorage`. To test from a fresh start, clear it with `browser_evaluate` (`localStorage.clear()`) and reload the page.

## Game design summary

Thunder Dragon is a browser game. The README is the design source of truth; keep it in sync when the design changes.

- **Goal:** defeat the Thunder Dragon (åskdraken) at the top of Mount Thunder. Its stolen emeralds give it extra power.
- **Progression:** the player starts in the village at the foot of the mountain and visits four locations: the forest (skogen), the lake (sjön), the village (byn) and the cave in the mountain (grottan). At each one the player defeats a monster to earn a ruby.
- **Rubies** are turned into armor and weapons that can withstand the emeralds' power. Collecting them unlocks the path to the dragon. The term is always "rubiner" (rubies), never "nycklar" (keys).
- **Locations defined so far:** the forest is a dense mixed forest with thick fog, and its monster is a werewolf carrying the ruby on its chest. The other three locations are not designed yet.
- **Implemented:** a start screen where the player names their character (shown in the HUD and greetings), the town scene (Mount Thunder in the background) and the forest quest. The forest is four screens in a ring (`forest` Skogsstigen ↔ `forest-spruce` Granskogen ↔ `forest-glade` Gläntan ↔ `forest-brook` Bäcken ↔ back). The axe and the werewolf start in random, different screens. You catch the werewolf by its tail with the axe, then hit the swaying ruby 3 times before your grip runs out. If you fail, the werewolf flees to another screen. If you win, you get the forest ruby. Everything is mouse-driven.

## Language

The README and in-game story are written in Swedish. Keep player-facing text in Swedish unless told otherwise.
