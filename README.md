# CatDoom

Play it at **https://cat-doom.com**. Source is MIT-licensed; every sprite and texture is drawn in code, no assets.

Doom, but the demons are cats. A browser raycaster with all controls on screen (touch, mouse, keyboard),
twelve hand-authored levels, a spray bottle, and a toolbelt that grows every level.

## Security notes

`server.js` serves only `.html/.js/.css/.png/.ico/.txt` files, refuses dotfiles, `tools/`, and its own config, and sends a strict Content-Security-Policy (no inline scripts, no outbound connections). The game makes no network requests, sets no cookies, and stores nothing. Debug hooks on `window.CatDoom.cheat` exist for testing; there is no leaderboard, so they affect only your own session.

## Play locally

```bash
node server.js          # → http://localhost:5347   (or: python3 -m http.server 5347)
```

Deep-link to a level for testing: `http://localhost:5347/?level=7`.

## Deploy to Railway

The folder is a self-contained Node app with no dependencies.

1. Push this folder (or the repo with `demos/catdoom` as the service root) to GitHub.
2. Railway → New Project → Deploy from GitHub → set **Root Directory** to `demos/catdoom`.
3. Railway detects `package.json`, runs `node server.js`, and injects `PORT`. Done.

Edit the newsletter / stream plug on the title screen in `index.html` (`window.CATDOOM_PROMO`).

## Files

- `index.html` — shell: HUD, on-screen controls, tool row, title/game-over overlay.
- `engine.js` — raycaster, cats, tools, triggers, level flow.
- `parse.js` — level legend parser shared by the engine and the validator.
- `levels/levelNN.js` — one data file per level (see [docs/DESIGN.md](docs/DESIGN.md) for the design and schema).
- `tools/validate-levels.js` — `node tools/validate-levels.js [N ...]` checks every level headlessly.

## Controls

Left pad moves and strafes, right pad turns, SPRAY sprays. Drag the view to look. Keyboard: WASD / arrows,
Q/E turn, Space sprays, 1–4 use tools (catnip, yarn ball, plastic bag, cardboard box).
