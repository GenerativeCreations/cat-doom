// CatDoom level parser — shared by the browser engine (window.CatDoomParse) and the node validator.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.CatDoomParse = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CAT_LETTERS = { t: 'tabby', v: 'void', x: 'tuxedo', k: 'kitten', c: 'chonk', h: 'hurler', s: 'sphynx', z: 'zoomie', g: 'ghost', w: 'wailer', M: 'matriarch', B: 'bastet' };
  const CAT_NAMES = new Set(Object.values(CAT_LETTERS));
  const WALL_CHARS = { '#': 1, '@': 2, '=': 3 };
  const AMMO_CHARS = { N: 'catnip', Y: 'yarn', P: 'bag', O: 'box' };   // tool ammo pickups (engine auto-places them if a level has none)
  const EXIT_ID = 4, BORDER_ID = 5, DOOR_ID = 6, SECRET_WALL_ID = 7;   // 6 = locked cat-flap door (opens with the collar tag), 7 = hidey-hole wall (looks solid, yields)
  const TEXTURES = ['brick', 'stone', 'wood', 'tile', 'wallpaper', 'metal', 'bone', 'gold'];

  function catType(t) { if (CAT_LETTERS[t]) return CAT_LETTERS[t]; if (CAT_NAMES.has(t)) return t; return null; }

  function parseLevel(def) {
    const errors = [];
    const rows = Array.isArray(def.rows) ? def.rows : [];
    const MH = rows.length, MW = MH ? rows[0].length : 0;
    if (MH < 5 || MW < 5) errors.push('map too small (need at least 5x5)');
    rows.forEach((r, y) => { if (typeof r !== 'string' || r.length !== MW) errors.push('row ' + y + ' has length ' + (r && r.length) + ', expected ' + MW); });
    const map = new Uint8Array(Math.max(0, MW * MH));
    let start = null, exit = null; const cats = [], pickups = [], secrets = [], barrels = [], doors = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const ch = (rows[y] || '')[x], i = y * MW + x, border = x === 0 || y === 0 || x === MW - 1 || y === MH - 1;
      if (ch === undefined) continue;
      if (ch === 'E') { if (exit) errors.push('duplicate E at (' + x + ',' + y + ')'); exit = [x, y]; map[i] = EXIT_ID; continue; }
      if (WALL_CHARS[ch]) { map[i] = border ? BORDER_ID : WALL_CHARS[ch]; continue; }
      if (ch === 'L') { if (border) errors.push('L door on the border at (' + x + ',' + y + ')'); map[i] = DOOR_ID; doors.push([x, y]); continue; }
      if (ch === '?') { if (border) errors.push('? secret wall on the border at (' + x + ',' + y + ')'); map[i] = SECRET_WALL_ID; continue; }
      if (ch === 'G') { map[i] = border ? BORDER_ID : 1; cats.push({ x: x + 0.5, y: y + 0.5, type: 'ghost', inWall: true }); continue; }
      if (border) { errors.push("border cell (" + x + ',' + y + ") is '" + ch + "', must be a wall"); continue; }
      if (ch === '.') continue;
      if (ch === 'S') { if (start) errors.push('duplicate S at (' + x + ',' + y + ')'); start = [x, y]; continue; }
      if (ch === 'W') { pickups.push({ x: x + 0.5, y: y + 0.5, kind: 'water' }); continue; }
      if (ch === 'T') { pickups.push({ x: x + 0.5, y: y + 0.5, kind: 'tuna' }); continue; }
      if (AMMO_CHARS[ch]) { pickups.push({ x: x + 0.5, y: y + 0.5, kind: AMMO_CHARS[ch] }); continue; }
      if (ch === '$') { secrets.push([x, y]); continue; }
      if (ch === 'K') { pickups.push({ x: x + 0.5, y: y + 0.5, kind: 'key' }); continue; }
      if (ch === '!') { barrels.push({ x: x + 0.5, y: y + 0.5 }); continue; }
      if (CAT_LETTERS[ch]) { cats.push({ x: x + 0.5, y: y + 0.5, type: CAT_LETTERS[ch] }); continue; }
      errors.push("bad char '" + ch + "' at (" + x + ',' + y + ')');
    }
    const keys = pickups.filter(k => k.kind === 'key').length;
    if (doors.length && keys !== 1) errors.push('level has ' + doors.length + ' L door(s) but ' + keys + ' K collar tag(s); needs exactly one K');
    if (keys && !doors.length) errors.push('K collar tag without any L door');
    if (def.par !== undefined && !(def.par > 0)) errors.push('par must be a positive number of seconds');
    if (!start) errors.push('missing S (start)');
    if (!exit) errors.push('missing E (exit)');
    const wallAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? BORDER_ID : map[(y | 0) * MW + (x | 0)];
    if (exit) {
      const ok = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = exit[0] + dx, ny = exit[1] + dy; return nx >= 0 && ny >= 0 && nx < MW && ny < MH && map[ny * MW + nx] === 0; });
      if (!ok) errors.push('E at (' + exit + ') has no floor neighbour');
    }
    const theme = Object.assign({ walls: ['brick', 'stone', 'wood'], border: 'stone', sky: '#2a2226', floor: '#4a3a2c', fog: 0 }, def.theme || {});
    for (const t of (theme.walls || []).concat([theme.border])) if (!TEXTURES.includes(t)) errors.push('unknown texture "' + t + '" (have ' + TEXTURES.join(', ') + ')');
    if (typeof theme.fog !== 'number' || theme.fog < 0 || theme.fog > 0.8) errors.push('theme.fog must be a number 0..0.8');
    // triggers
    const triggers = [];
    (def.triggers || []).forEach((t, i) => {
      const tag = 'trigger[' + i + ']';
      if (!['pickup', 'enter', 'kills'].includes(t.when)) { errors.push(tag + ' when must be pickup|enter|kills'); return; }
      const spawn = (t.spawn || []).map(s => {
        const type = catType(s.type);
        if (!type) errors.push(tag + " spawn has unknown cat type '" + s.type + "'");
        else if (type !== 'ghost' && wallAt(s.x, s.y)) errors.push(tag + ' spawn ' + type + ' at (' + s.x + ',' + s.y + ') is inside a wall');
        return { x: s.x + 0.5, y: s.y + 0.5, type: type || 'tabby' };
      });
      if (t.when === 'pickup') { if (!pickups.some(k => (k.x | 0) === t.x && (k.y | 0) === t.y)) errors.push(tag + ' pickup trigger at (' + t.x + ',' + t.y + ') has no W/T there'); }
      if (t.when === 'enter') { let any = false; for (let y = t.y; y < t.y + (t.h || 1); y++) for (let x = t.x; x < t.x + (t.w || 1); x++) if (!wallAt(x, y)) any = true; if (!any) errors.push(tag + ' enter area is entirely wall'); }
      if (t.when === 'kills' && !(t.count > 0)) errors.push(tag + ' kills trigger needs count > 0');
      triggers.push({ when: t.when, x: t.x, y: t.y, w: t.w || 1, h: t.h || 1, count: t.count, spawn, say: t.say || '', water: t.water || 0, fired: false });
    });
    // kills waves must be reachable: count <= cats available before that wave
    let avail = cats.length;
    triggers.filter(t => t.when !== 'kills').forEach(t => { avail += t.spawn.length; });
    triggers.filter(t => t.when === 'kills').sort((a, b) => a.count - b.count).forEach(t => { if (t.count > avail) errors.push('kills trigger count ' + t.count + ' exceeds the ' + avail + ' cats spawnable before it'); avail += t.spawn.length; });
    const awake = (def.awake || []).map(([x, y]) => x + ',' + y);
    const difficulty = Object.assign({ dmg: 1, speed: 1 }, def.difficulty || {});
    if (!(difficulty.dmg > 0 && difficulty.dmg <= 2) || !(difficulty.speed > 0 && difficulty.speed <= 2)) errors.push('difficulty.dmg / difficulty.speed must be in (0, 2]');
    return { n: def.n, name: def.name || ('Level ' + def.n), subtitle: def.subtitle || '', MW, MH, map, start, exit, cats, pickups, secrets, barrels, doors, par: def.par || null, triggers, awake, theme, difficulty, dir: (def.start && def.start.dir) || null, errors, wallAt };
  }

  // BFS over floor cells from start. Returns the set of reachable "x,y" keys; the exit is reachable if adjacent.
  function reachability(L, opts) {
    const doorsOpen = !!(opts && opts.doorsOpen);
    const seen = new Set(); let exitReachable = false;
    if (!L.start) return { seen, exitReachable };
    const q = [L.start]; seen.add(L.start.join(','));
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= L.MW || ny >= L.MH || seen.has(k)) continue;
        const w = L.map[ny * L.MW + nx];
        if (w === EXIT_ID) { exitReachable = true; continue; }
        if (w === SECRET_WALL_ID || (w === DOOR_ID && doorsOpen)) { seen.add(k); q.push([nx, ny]); continue; }
        if (w) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return { seen, exitReachable };
  }

  return { CAT_LETTERS, CAT_NAMES, AMMO_CHARS, TEXTURES, EXIT_ID, BORDER_ID, DOOR_ID, SECRET_WALL_ID, catType, parseLevel, reachability };
});
