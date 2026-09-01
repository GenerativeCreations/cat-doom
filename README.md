# CatDoom

Play it at **https://cat-doom.com**. Source is MIT-licensed; every sprite and texture is drawn in code, no assets.

Doom, but the demons are cats. A browser raycaster with all controls on screen (touch, mouse, keyboard),
twelve hand-authored levels, a spray bottle, and a toolbelt that grows every level.

## Security notes

`server.js` serves only `.html/.js/.css/.png/.ico/.txt` files, refuses dotfiles, `tools/`, and its own config, and sends a strict Content-Security-Policy (no inline scripts, no outbound connections). The game makes no network requests, sets no cookies, and stores nothing. Debug hooks on `window.CatDoom.cheat` exist for testing; there is no leaderboard, so they affect only your own session.

## Play locally

```bash
node server.js          # → http://localhost:5347 (serves ./public, loopback only)
```

Deep-link to a level for testing: `http://localhost:5347/?level=7`.

## Deploy

The game is static: everything that ships lives in **`public/`** (`_headers` and `_redirects` carry the
security headers and the www → apex redirect).

**Cloudflare (production, cat-doom.com).** Workers & Pages → Create → connect `GenerativeCreations/cat-doom`,
no build command, output directory `public`. `wrangler.jsonc` is included so `npx wrangler deploy` works too.
Attach the custom domain in the project's settings; the zone is already on Cloudflare.

**Railway (fallback, or when a backend arrives).** `server.js` serves `public/` with the same headers and a
`/healthz` endpoint; `railway.json` configures the healthcheck. Set root directory to the repo root.

Edit the newsletter / stream plug on the title screen in `public/promo.js`.

## Security notes

`server.js` serves only `.html/.js/.css/.png/.ico/.txt` files from `public/`, refuses dotfiles and the
Cloudflare config files, and sends a strict Content-Security-Policy (no inline scripts, no outbound
connections). `_headers` sends the same policy on Cloudflare. The game makes no network requests, sets no
cookies, and stores nothing. Debug hooks on `window.CatDoom.cheat` exist for testing; there is no
leaderboard, so they affect only your own session.

## Files

- `public/index.html` — shell: HUD, on-screen controls, tool row, title/game-over overlay.
- `public/engine.js` — raycaster, cats, tools, triggers, level flow.
- `public/parse.js` — level legend parser shared by the engine and the validator.
- `public/levels/levelNN.js` — one data file per level (see [docs/DESIGN.md](docs/DESIGN.md) for the design and schema).
- `tools/validate-levels.js` — `node tools/validate-levels.js [N ...]` checks every level headlessly.
- `server.js`, `railway.json`, `wrangler.jsonc` — hosting.

## Controls

Left pad moves and strafes, right pad turns, SPRAY sprays. Drag the view to look. Keyboard: WASD / arrows,
Q/E turn, Space sprays, 1–4 use tools (catnip, yarn ball, plastic bag, cardboard box).
