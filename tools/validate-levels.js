#!/usr/bin/env node
// Validates every public/levels/levelNN.js headlessly. Usage: node tools/validate-levels.js [N ...]
// Legend: # @ = walls · . floor · S start · E exit · W water · T tuna · N Y P O ammo · cat letters · G ghost-in-wall · ? hidey-hole wall · $ secret floor · L locked door · K collar tag · ! litter box
const fs = require('fs'), path = require('path'), vm = require('vm');
const P = require(path.join(__dirname, '..', 'public', 'parse.js'));
const dir = path.join(__dirname, '..', 'public', 'levels');
const only = process.argv.slice(2).map(Number).filter(Boolean);
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^level\d\d\.js$/.test(f)).sort() : [];
let failed = 0, seen = new Set();
const KNOWN = ['tabby', 'void', 'tuxedo', 'kitten', 'chonk', 'hurler', 'sphynx', 'zoomie', 'ghost', 'wailer', 'matriarch', 'bastet'];

for (const f of files) {
  const defs = [];
  try { vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { CatDoom: { registerLevel: d => defs.push(d) }, console }, { filename: f }); }
  catch (e) { console.log('✗ ' + f + ': failed to execute: ' + e.message); failed++; continue; }
  if (defs.length !== 1) { console.log('✗ ' + f + ': expected exactly one CatDoom.registerLevel call, got ' + defs.length); failed++; continue; }
  const def = defs[0];
  if (only.length && !only.includes(def.n)) continue;
  const expectN = parseInt(f.slice(5, 7), 10);
  const errors = [];
  if (def.n !== expectN) errors.push('n is ' + def.n + ' but file name says ' + expectN);
  if (seen.has(def.n)) errors.push('duplicate level number ' + def.n); seen.add(def.n);
  const L = P.parseLevel(def);
  errors.push(...L.errors);
  if (!L.errors.length) {
    const R = P.reachability(L, { doorsOpen: true });
    if (!R.exitReachable) errors.push('exit is not reachable from start');
    for (const c of L.cats) if (c.type !== 'ghost' && !R.seen.has((c.x | 0) + ',' + (c.y | 0))) errors.push(c.type + ' at (' + (c.x | 0) + ',' + (c.y | 0) + ') is not reachable from start');
    for (const k of L.pickups) if (!R.seen.has((k.x | 0) + ',' + (k.y | 0))) errors.push(k.kind + ' at (' + (k.x | 0) + ',' + (k.y | 0) + ') is not reachable from start');
    for (const t of L.triggers) for (const s of t.spawn) if (s.type !== 'ghost' && !R.seen.has((s.x | 0) + ',' + (s.y | 0))) errors.push('trigger spawn ' + s.type + ' at (' + (s.x | 0) + ',' + (s.y | 0) + ') is not reachable from start');
    if (L.cats.length + L.triggers.reduce((a, t) => a + t.spawn.length, 0) === 0) errors.push('level has no cats');
    // hidey-holes: every $ must be reachable (secret walls count as passable) and sit behind at least one ? wall
    for (const [x, y] of L.secrets) { if (!R.seen.has(x + ',' + y)) errors.push('secret $ at (' + x + ',' + y + ') is not reachable'); if (L.wallAt(x, y)) errors.push('secret $ at (' + x + ',' + y + ') is inside a wall'); }
    const secretWalls = []; for (let y = 0; y < L.MH; y++) for (let x = 0; x < L.MW; x++) if (L.map[y * L.MW + x] === P.SECRET_WALL_ID) secretWalls.push([x, y]);
    if (L.secrets.length && !secretWalls.length) errors.push('level has $ secret cells but no ? hidey-hole wall to hide them');
    const Rplain = P.reachability(Object.assign({}, L, { map: L.map.map(w => w === P.SECRET_WALL_ID ? 1 : w) }), { doorsOpen: true });
    for (const [x, y] of L.secrets) if (Rplain.seen.has(x + ',' + y)) errors.push('secret $ at (' + x + ',' + y + ') is reachable without passing a ? wall (not secret)');
    // the collar tag and the cat flap: the tag must be reachable with doors shut; the exit must need the door (or the door guards something)
    if (L.doors.length) {
      const Rshut = P.reachability(L, { doorsOpen: false });
      const key = L.pickups.find(k => k.kind === 'key');
      if (key && !Rshut.seen.has((key.x | 0) + ',' + (key.y | 0))) errors.push('K collar tag at (' + (key.x | 0) + ',' + (key.y | 0) + ') is behind the door it opens');
      const Ropen = P.reachability(L, { doorsOpen: true });
      if (!Ropen.exitReachable) errors.push('exit is not reachable even with the door open');
      if (Rshut.exitReachable && Rshut.seen.size === Ropen.seen.size) errors.push('L door guards nothing (everything is reachable without it)');
    }
    // litter boxes are solid: with every box treated as a wall, the exit, the tag and every non-ghost cat must still be reachable
    if (L.barrels.length) {
      const solidMap = L.map.slice(); for (const b of L.barrels) solidMap[(b.y | 0) * L.MW + (b.x | 0)] = 1;
      const Rb = P.reachability(Object.assign({}, L, { map: solidMap }), { doorsOpen: true });
      if (!Rb.exitReachable) errors.push('a litter box walls off the exit');
      for (const c of L.cats) if (c.type !== 'ghost' && !Rb.seen.has((c.x | 0) + ',' + (c.y | 0))) errors.push('a litter box walls off the ' + c.type + ' at (' + (c.x | 0) + ',' + (c.y | 0) + ')');
      for (const k of L.pickups) if (!Rb.seen.has((k.x | 0) + ',' + (k.y | 0))) errors.push('a litter box walls off the ' + k.kind + ' at (' + (k.x | 0) + ',' + (k.y | 0) + ')');
    }
    for (const b of L.barrels) { if (L.wallAt(b.x, b.y)) errors.push('! litter box at (' + (b.x | 0) + ',' + (b.y | 0) + ') is inside a wall'); if (!R.seen.has((b.x | 0) + ',' + (b.y | 0))) errors.push('! litter box at (' + (b.x | 0) + ',' + (b.y | 0) + ') is not reachable'); if (Math.hypot(b.x - L.start[0] - 0.5, b.y - L.start[1] - 0.5) < 3) errors.push('! litter box at (' + (b.x | 0) + ',' + (b.y | 0) + ') is within 3 tiles of the start'); }
    const bosses = L.cats.filter(c => c.type === 'matriarch' || c.type === 'bastet');
    if (def.n === 11 && !bosses.some(c => c.type === 'matriarch')) errors.push('level 11 must contain M (the Matriarch)');
    if (def.n === 12 && !bosses.some(c => c.type === 'bastet')) errors.push('level 12 must contain B (Bastet)');
    if (def.n < 11 && bosses.length) errors.push('bosses only on levels 11 and 12');
  }
  const roster = {}; for (const c of L.cats) roster[c.type] = (roster[c.type] || 0) + 1;
  const spawnRoster = {}; for (const t of L.triggers) for (const s of t.spawn) spawnRoster[s.type] = (spawnRoster[s.type] || 0) + 1;
  const fmt = r => Object.entries(r).map(([k, v]) => v + ' ' + k).join(', ') || 'none';
  if (errors.length) { failed++; console.log('✗ ' + f + ' (' + (def.name || '?') + ')'); for (const e of errors) console.log('    - ' + e); }
  else {
    console.log('✓ ' + f + '  L' + def.n + ' "' + def.name + '"  ' + L.MW + 'x' + L.MH + '  fog ' + L.theme.fog + '  walls ' + L.theme.walls.join('/') + ' border ' + L.theme.border);
    console.log('    cats at start: ' + fmt(roster) + (L.triggers.length ? '   |   via triggers: ' + fmt(spawnRoster) + ' (' + L.triggers.map(t => t.when + (t.count ? '@' + t.count : '')).join(', ') + ')' : ''));
    console.log('    water ' + L.pickups.filter(k => k.kind === 'water').length + ', tuna ' + L.pickups.filter(k => k.kind === 'tuna').length + ', secrets ' + L.secrets.length + ', litter boxes ' + L.barrels.length + (L.doors.length ? ', ' + L.doors.length + ' door + tag' : '') + (L.par ? ', par ' + L.par + 's' : ', par (auto)') + '   start (' + L.start + ') exit (' + L.exit + ')');
  }
  if (process.env.SHOW_MAP || errors.length) for (const r of def.rows || []) console.log('      ' + r);
}
for (let n = 1; n <= 12; n++) if (!seen.has(n) && (!only.length || only.includes(n))) console.log('· level' + String(n).padStart(2, '0') + '.js missing (engine will use a procedural fallback)');
console.log(failed ? '\n' + failed + ' level file(s) FAILED' : '\nall present level files OK');
process.exit(failed ? 1 : 0);
