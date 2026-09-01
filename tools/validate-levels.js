#!/usr/bin/env node
// Validates every public/levels/levelNN.js headlessly. Usage: node tools/validate-levels.js [N ...]
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
    const R = P.reachability(L);
    if (!R.exitReachable) errors.push('exit is not reachable from start');
    for (const c of L.cats) if (c.type !== 'ghost' && !R.seen.has((c.x | 0) + ',' + (c.y | 0))) errors.push(c.type + ' at (' + (c.x | 0) + ',' + (c.y | 0) + ') is not reachable from start');
    for (const k of L.pickups) if (!R.seen.has((k.x | 0) + ',' + (k.y | 0))) errors.push(k.kind + ' at (' + (k.x | 0) + ',' + (k.y | 0) + ') is not reachable from start');
    for (const t of L.triggers) for (const s of t.spawn) if (s.type !== 'ghost' && !R.seen.has((s.x | 0) + ',' + (s.y | 0))) errors.push('trigger spawn ' + s.type + ' at (' + (s.x | 0) + ',' + (s.y | 0) + ') is not reachable from start');
    if (L.cats.length + L.triggers.reduce((a, t) => a + t.spawn.length, 0) === 0) errors.push('level has no cats');
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
    console.log('    water ' + L.pickups.filter(k => k.kind === 'water').length + ', tuna ' + L.pickups.filter(k => k.kind === 'tuna').length + '   start (' + L.start + ') exit (' + L.exit + ')');
  }
  if (process.env.SHOW_MAP || errors.length) for (const r of def.rows || []) console.log('      ' + r);
}
for (let n = 1; n <= 12; n++) if (!seen.has(n) && (!only.length || only.includes(n))) console.log('· level' + String(n).padStart(2, '0') + '.js missing (engine will use a procedural fallback)');
console.log(failed ? '\n' + failed + ' level file(s) FAILED' : '\nall present level files OK');
process.exit(failed ? 1 : 0);
