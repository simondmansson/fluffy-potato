# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Early stage: the repository currently contains only `README.md` (game design, written in Swedish). No source code, build tooling, or tests exist yet. Update this file once code and conventions are in place.

## Tech stack (from README)

- Plain HTML, JavaScript and CSS. No framework and no build step is planned.
- Runs directly in the browser.
- Game progress is persisted to `localStorage`.

To run the game, open `index.html` directly in the browser (`file://`). No local server is used. Code must work under `file://`, so avoid anything that needs an HTTP origin, such as ES module `import` across files or `fetch()` of local files. Load scripts with plain `<script src>` tags instead.

## Testing

Test the game in a browser with the Playwright MCP tools (`mcp__plugin_playwright_playwright__*`):

- Load the game with `browser_navigate` to `file:///home/kalk/repos/thunder-dragon/index.html`.
- Use `browser_snapshot` and `browser_take_screenshot` to check the page, `browser_click` and `browser_press_key` to play, and `browser_console_messages` to catch JS errors.
- Progress lives in `localStorage`. To test from a fresh start, clear it with `browser_evaluate` (`localStorage.clear()`) and reload the page.

## Game design summary

Thunder Dragon is a browser game. The README is the design source of truth; keep it in sync when the design changes.

- **Goal:** defeat the Thunder Dragon (åskdraken) at the top of Mount Thunder. Its stolen emeralds give it extra power.
- **Progression:** the player starts in the village at the foot of the mountain and visits four locations: the forest (skogen), the lake (sjön), the village (byn) and the cave in the mountain (grottan). At each one the player defeats a monster to earn a ruby.
- **Rubies** are turned into armor and weapons that can withstand the emeralds' power. Collecting them unlocks the path to the dragon. The term is always "rubiner" (rubies), never "nycklar" (keys).
- **Locations defined so far:** the forest is a dense mixed forest with thick fog, and its monster is a werewolf carrying the ruby on its belly. The other three locations are not designed yet.

## Language

The README and in-game story are written in Swedish. Keep player-facing text in Swedish unless told otherwise.
