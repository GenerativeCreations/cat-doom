// Dev-only helpers for hands-on play-testing through the Browser pane. Load with:
// (0,eval)(await (await fetch('/tools/play-helpers.js?t='+Date.now())).text())
window.sleep = ms => new Promise(r => setTimeout(r, ms));
window.RO = () => {
  const p = CatDoom.player;
  const bear = c => { const vx = c.x - p.x, vy = c.y - p.y, d = Math.hypot(vx, vy) || 1; const dot = (vx * p.dirX + vy * p.dirY) / d, cr = p.dirX * vy - p.dirY * vx; return dot > 0.7 ? 'ahead' : dot < -0.7 ? 'behind' : cr > 0 ? 'right' : 'left'; };
  return JSON.stringify({ hp: p.hp, water: p.water, pos: [+p.x.toFixed(1), +p.y.toFixed(1)], dir: [+p.dirX.toFixed(2), +p.dirY.toFixed(2)], alive: CatDoom.cats.filter(c => c.alive).length, total: CatDoom.cats.length,
    near: CatDoom.cats.filter(c => c.alive).sort((a, b) => a.dist - b.dist).slice(0, 5).map(c => c.type + ' ' + c.dist.toFixed(1) + ' ' + bear(c) + (c.awake ? '*' : '') + (c.status ? ' ' + c.status.kind : '')),
    t: +CatDoom.runT.toFixed(1), cleared: CatDoom.cleared, tools: Object.entries(CatDoom.tools).filter(([k, v]) => v > 0).map(([k, v]) => k + v).join(' '), state: CatDoom.state, paused: CatDoom.paused });
};
// play([['fwd',1.2],['tr',0.3],['fire',0.5],['wait',0.4],['tool:yarn']]) — holds real input flags in real time, then pauses.
window.play = async steps => {
  if (CatDoom.state !== 'playing') return RO();
  CatDoom.pause(false);
  for (const [act, sec] of steps) {
    if (act === 'wait') await sleep(sec * 1000);
    else if (act.startsWith('tool:')) { CatDoom.useTool(act.slice(5)); await sleep(150); }
    else if (act === 'tap') { CatDoom.input.fire = true; await sleep(40); CatDoom.input.fire = false; await sleep((sec || 0.3) * 1000); }
    else { CatDoom.input[act] = true; await sleep(sec * 1000); CatDoom.input[act] = false; }
    if (CatDoom.state !== 'playing') break;
  }
  if (CatDoom.state === 'playing') CatDoom.pause(true);
  return RO();
};
window.begin = async level => { localStorage.removeItem('catdoom.progress.v1'); CatDoom.start(level); await sleep(150); CatDoom.pause(true); return RO(); };
