// Dev-only: headless lab for the toolbelt. Load in the page: (0,eval)(await (await fetch('/tools/lab-tools.js?t='+Date.now())).text())
(async () => {
  document.getElementById('startbtn').click(); await new Promise(r => setTimeout(r, 120));
  const T = CatDoom.cheat.tick, p = CatDoom.player, out = {}; for (let i = 0; i < 5; i++) T(1 / 60);
  out.level = { n: CatDoom.level, name: CatDoom.levelName, procedural: CatDoom.procedural, tools: { ...CatDoom.tools } };
  const face = (dx, dy) => { p.dirX = dx; p.dirY = dy; p.planeX = -dy * 0.66; p.planeY = dx * 0.66; };
  out.toolRow = { hidden: document.getElementById('tools').hidden, visible: [...document.querySelectorAll('.tool')].filter(b => !b.hidden).map(b => b.dataset.tool + '=' + b.querySelector('.cnt').textContent) };
  for (const c of CatDoom.cats) c.alive = false;
  let lab = null; for (let y = 1; y < 30 && !lab; y++) for (let x = 1; x < 30 && !lab; x++) { let ok = true; for (let k = 0; k < 6; k++) if (CatDoom.wall(x + k, y)) ok = false; if (ok) lab = [x, y]; }
  out.lab = lab; p.x = lab[0] + 0.5; p.y = lab[1] + 0.5; face(1, 0);
  const sp = CatDoom.cheat.spawn;
  // catnip
  let a = sp('tabby', lab[0] + 4.5, lab[1] + 0.5, true); CatDoom.useTool('catnip'); for (let i = 0; i < 70; i++) T(1 / 60);
  out.catnip = { ammo: CatDoom.tools.catnip, items: CatDoom.items.map(i => i.kind + '/' + i.sub), lured: !!a.lure, status: a.status && a.status.kind, dist: +a.dist.toFixed(2) };
  for (let i = 0; i < 120; i++) T(1 / 60); out.catnip.after2s = { status: a.status && a.status.kind, hp: p.hp }; a.alive = false; CatDoom.items.length = 0;
  // yarn
  let b1 = sp('tabby', lab[0] + 4.5, lab[1] + 0.5, true), b2 = sp('void', lab[0] + 5.5, lab[1] + 0.5, true); CatDoom.useTool('yarn'); for (let i = 0; i < 70; i++) T(1 / 60);
  out.yarn = { ammo: CatDoom.tools.yarn, b1: { hp: b1.hp, status: b1.status && b1.status.kind }, b2: { hp: b2.hp, status: b2.status && b2.status.kind } }; b1.alive = false; b2.alive = false; CatDoom.items.length = 0;
  // bag
  p.hp = 100; let c1 = sp('tabby', lab[0] + 4.5, lab[1] + 0.5, true); CatDoom.useTool('bag'); for (let i = 0; i < 150; i++) T(1 / 60);
  out.bag = { ammo: CatDoom.tools.bag, status: c1.status && c1.status.kind, hp: p.hp, dist: +c1.dist.toFixed(2) }; const hp0 = c1.hp; face((c1.x - p.x) / c1.dist, (c1.y - p.y) / c1.dist); CatDoom.fire(); out.bag.sprayDamageWhileBagged = hp0 - c1.hp; c1.alive = false; CatDoom.items.length = 0;
  // box
  face(1, 0); let d1 = sp('tabby', lab[0] + 4.5, lab[1] + 0.5, true), d2 = sp('tabby', lab[0] + 5.5, lab[1] + 0.5, true); CatDoom.useTool('box'); for (let i = 0; i < 200; i++) T(1 / 60);
  out.box = { ammo: CatDoom.tools.box, items: CatDoom.items.map(i => i.kind + ' slots ' + i.slots), d1: d1.status && d1.status.kind, d2: d2.status && d2.status.kind, hp: p.hp };
  out.hud = [...document.querySelectorAll('.tool')].filter(b => !b.hidden).map(b => b.dataset.tool + '=' + b.querySelector('.cnt').textContent);
  // snapshot with a boxed cat + lure in view
  const cv = document.getElementById('view'); try { out.snap = (await fetch('http://127.0.0.1:5231/snap', { method: 'POST', body: JSON.stringify({ name: 'tools-lab.png', data: cv.toDataURL('image/png') }) })).status; } catch (e) { out.snap = 'ERR'; }
  return JSON.stringify(out);
})();
