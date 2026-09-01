// Dev-only: full 12-level integration run inside the page. Load: (0,eval)(await (await fetch('/tools/integrate-check.js?t='+Date.now())).text())
(async () => {
// Runs inside the CatDoom page via javascript_tool. For each level: load, sanity, AI soak, clear, exit → next.
const T = CatDoom.cheat.tick, cv = document.getElementById('view'); let p;
const post = async name => { try { const r = await fetch('http://127.0.0.1:5231/snap', { method: 'POST', body: JSON.stringify({ name, data: cv.toDataURL('image/png') }) }); return r.status; } catch (e) { return 'ERR'; } };
const ev = (el, t) => el.dispatchEvent(new PointerEvent(t, { pointerId: 1, bubbles: true, isPrimary: true, pointerType: 'touch' }));
const fwd = document.querySelector('.btn.fwd');
const face = (dx, dy) => { p.dirX = dx; p.dirY = dy; p.planeX = -dy * 0.66; p.planeY = dx * 0.66; };
const results = [];
document.getElementById('startbtn').click(); await new Promise(r => setTimeout(r, 120)); p = CatDoom.player;
for (let L = 1; L <= 12; L++) {
  if (CatDoom.level !== L) CatDoom.cheat.warp(L);
  const r = { L, name: CatDoom.levelName, procedural: CatDoom.procedural, cats: CatDoom.cats.length, triggers: CatDoom.triggers.length, exit: CatDoom.exit, start: [p.x, p.y] };
  p.hp = 100; p.water = 60;
  for (let i = 0; i < 40; i++) T(1 / 60);                     // intro card visible
  r.intro = await post('L' + String(L).padStart(2, '0') + '-intro.png');
  // AI soak: wake everything and let them come for 12 s; player stands still. Catch exceptions.
  try { for (const c of CatDoom.cats) c.awake = true; for (let i = 0; i < 720; i++) { T(1 / 60); if (CatDoom.state !== 'playing') break; } r.soak = { state: CatDoom.state, hp: p.hp, nearest: +Math.min(...CatDoom.cats.filter(c => c.alive).map(c => c.dist)).toFixed(2), shots: CatDoom.shots.length, cats: CatDoom.cats.length }; } catch (e) { r.soak = 'EXC ' + e.message; }
  if (CatDoom.state !== 'playing') { document.getElementById('startbtn').click(); await new Promise(res => setTimeout(res, 120)); p = CatDoom.player; CatDoom.cheat.warp(L); p.hp = 100; }
  p.hp = 100; p.water = 60; for (const c of CatDoom.cats) c.alive = false;   // heal + silence BEFORE any await: the live rAF loop runs during awaits when the pane is visible
  T(1 / 60); r.snap = await post('L' + String(L).padStart(2, '0') + '-soak.png'); p.hp = 100;
  // fire kills-triggers by napping in order, then everything
  let guard = 0; while (guard++ < 12) { CatDoom.cheat.napAll(); T(1 / 60); if (!CatDoom.triggers.some(t => !t.fired && t.spawn.length)) break; }
  for (const t of CatDoom.triggers) if (!t.fired && t.when !== 'kills') { /* enter/pickup triggers may legitimately stay unfired */ }
  CatDoom.cheat.napAll(); for (let i = 0; i < 3; i++) T(1 / 60);
  r.cleared = CatDoom.cleared; r.totalCatsAfterWaves = CatDoom.cats.length; r.unfired = CatDoom.triggers.filter(t => !t.fired).map(t => t.when);
  // walk into the exit from its floor neighbour using the real forward button
  const [ex, ey] = CatDoom.exit; let nb = null;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!CatDoom.wall(ex + dx, ey + dy)) { nb = [dx, dy]; break; }
  if (nb) { p.x = ex + nb[0] + 0.5; p.y = ey + nb[1] + 0.5; face(-nb[0], -nb[1]); p.hp = 100; T(1 / 60); r.exitSnap = await post('L' + String(L).padStart(2, '0') + '-exit.png'); ev(fwd, 'pointerdown'); let n = 0; while (CatDoom.level === L && CatDoom.state === 'playing' && n++ < 300) T(1 / 60); ev(fwd, 'pointerup'); r.after = { level: CatDoom.level, state: CatDoom.state, ticks: n }; }
  else r.after = 'NO EXIT NEIGHBOUR';
  results.push(r);
  if (CatDoom.state !== 'playing') break;
}
return JSON.stringify(results);
})();
