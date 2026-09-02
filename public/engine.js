// CatDoom engine — raycaster, cats, levels. Levels are data files in ./levels/ (see prds/catdoom-levels.md).
(() => {
'use strict';
const P = window.CatDoomParse;
const W = 320, H = 200, TEX = 64, FOV_PLANE = 0.66, LAST_LEVEL = 12;
const EXIT_ID = P.EXIT_ID, BORDER_ID = P.BORDER_ID, DOOR_ID = P.DOOR_ID, SECRET_ID = P.SECRET_WALL_ID;
// pain chance (%): how often a spray hit makes a cat flinch (stops moving and attacking for a beat, resets its swipe)
const PAIN = { kitten: 90, zoomie: 80, tabby: 70, void: 60, hurler: 60, sphynx: 50, ghost: 50, tuxedo: 40, wailer: 35, chonk: 15, matriarch: 8, bastet: 5 };
const SKILLS = { kitten: { label: 'KITTEN', dmg: 0.6, speed: 1, water: 90, grace: true, blurb: 'soft paws' }, cat: { label: 'CAT', dmg: 1, speed: 1, water: 60, grace: true, blurb: 'as designed' }, lion: { label: 'LION', dmg: 1.4, speed: 1.15, water: 60, grace: false, blurb: 'no mercy' } };
const $ = id => document.getElementById(id);

// ---------- cat types ----------
const CAT_TYPES = {
  tabby:     { hp: 60,   speed: 1.6,  dmg: 8,  scale: 0.62, fur: '#d9903f', stripe: '#8a5220', belly: '#f6dfb8', name: 'tabby' },
  void:      { hp: 90,   speed: 1.9,  dmg: 10, scale: 0.62, fur: '#2a2430', stripe: '#1a151d', belly: '#3d3547', name: 'void cat' },
  tuxedo:    { hp: 120,  speed: 1.1,  dmg: 12, scale: 0.68, fur: '#1c1c22', stripe: '#111115', belly: '#f4f4f4', name: 'tuxedo' },
  kitten:    { hp: 20,   speed: 2.4,  dmg: 4,  scale: 0.38, fur: '#e8b98a', stripe: '#b07a4a', belly: '#fff2e0', name: 'kitten' },
  chonk:     { hp: 240,  speed: 0.75, dmg: 20, scale: 0.90, fur: '#a9a3a6', stripe: '#6f676b', belly: '#e8e2e4', name: 'THE CHONK' },
  hurler:    { hp: 70,   speed: 1.2,  dmg: 6,  scale: 0.62, fur: '#7a6a5a', stripe: '#4a3f34', belly: '#c9bca8', name: 'hairball hurler', ranged: true },
  sphynx:    { hp: 110,  speed: 2.2,  dmg: 15, scale: 0.62, fur: '#d9a08e', stripe: '#b07a6a', belly: '#f0c8b8', name: 'sphynx', silent: true },
  zoomie:    { hp: 50,   speed: 2.6,  dmg: 8,  scale: 0.55, fur: '#c8c8c8', stripe: '#8a8a8a', belly: '#ffffff', name: 'zoomie' },
  ghost:     { hp: 100,  speed: 1.0,  dmg: 12, scale: 0.62, fur: '#cfd8e8', stripe: '#9fb0c8', belly: '#eef3fa', name: 'ghost cat', silent: true, phasing: true, alpha: 0.55 },
  wailer:    { hp: 130,  speed: 1.3,  dmg: 12, scale: 0.70, fur: '#5a4a6a', stripe: '#3a2f48', belly: '#c8b8d8', name: 'caterwauler' },
  matriarch: { hp: 600,  speed: 0.9,  dmg: 22, scale: 1.25, fur: '#8a6a4a', stripe: '#5a4028', belly: '#e8d8c0', name: 'THE MATRIARCH', boss: true },
  bastet:    { hp: 1400, speed: 1.4,  dmg: 30, scale: 1.40, fur: '#d4a017', stripe: '#1a1a1a', belly: '#f4d97a', name: 'BASTET', boss: true, ranged: true },
};

// ---------- textures ----------
function makeTex(draw) { const c = document.createElement('canvas'); c.width = c.height = TEX; draw(c.getContext('2d')); return c; }
const TEXTURES = {
  brick: makeTex(g => {
    g.fillStyle = '#5a2a22'; g.fillRect(0, 0, TEX, TEX);
    for (let row = 0; row < 8; row++) { const off = (row % 2) * 8; for (let col = -1; col < 5; col++) { const x = col * 16 + off, y = row * 8; g.fillStyle = ((row * 7 + col * 13) % 3 === 0) ? '#9c4a3a' : '#8a3f31'; g.fillRect(x + 1, y + 1, 14, 6); g.fillStyle = '#b25a47'; g.fillRect(x + 1, y + 1, 14, 1); } }
  }),
  stone: makeTex(g => {
    g.fillStyle = '#3d4450'; g.fillRect(0, 0, TEX, TEX);
    for (let i = 0; i < 120; i++) { g.fillStyle = (i % 2) ? '#4d5563' : '#333a45'; g.fillRect((i * 37) % TEX, (i * 53) % TEX, 3 + (i % 5), 2 + (i % 4)); }
    g.strokeStyle = '#242a33'; g.lineWidth = 2;
    for (let y = 0; y < TEX; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(TEX, y); g.stroke(); const o = (y / 16 % 2) * 16; for (let x = o; x < TEX; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
  }),
  wood: makeTex(g => {
    g.fillStyle = '#6b4424'; g.fillRect(0, 0, TEX, TEX);
    for (let x = 0; x < TEX; x += 8) { g.fillStyle = (x / 8 % 2) ? '#7a4f2b' : '#5e3b1f'; g.fillRect(x, 0, 8, TEX); g.fillStyle = '#3f2613'; g.fillRect(x, 0, 1, TEX); }
    g.fillStyle = '#8f6035'; for (let i = 0; i < 40; i++) g.fillRect((i * 29) % TEX, (i * 41) % TEX, 2, 1 + (i % 3));
    g.strokeStyle = '#3a2211'; g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(20 + i * 6, 14); g.lineTo(26 + i * 6, 44); g.stroke(); }
  }),
  tile: makeTex(g => {
    g.fillStyle = '#b8c4c8'; g.fillRect(0, 0, TEX, TEX);
    for (let y = 0; y < TEX; y += 16) for (let x = 0; x < TEX; x += 16) { g.fillStyle = ((x + y) / 16 % 2) ? '#e8f0f2' : '#dfe8ea'; g.fillRect(x + 1, y + 1, 14, 14); g.fillStyle = '#ffffff'; g.fillRect(x + 2, y + 2, 12, 2); }
    g.fillStyle = '#8a6a5a'; g.fillRect(40, 30, 3, 2); g.fillRect(44, 34, 2, 2);   // a paw print
  }),
  wallpaper: makeTex(g => {
    g.fillStyle = '#b8a888'; g.fillRect(0, 0, TEX, TEX);
    for (let x = 0; x < TEX; x += 16) { g.fillStyle = '#a89878'; g.fillRect(x, 0, 6, TEX); }
    for (let y = 8; y < TEX; y += 16) for (let x = 10; x < TEX; x += 16) { g.fillStyle = '#7a4a5a'; g.beginPath(); g.arc(x, y, 3, 0, 6.3); g.fill(); g.fillStyle = '#5a7a4a'; g.fillRect(x - 1, y + 3, 2, 4); }
    g.fillStyle = '#6a5a48'; g.fillRect(0, 60, TEX, 4);
  }),
  metal: makeTex(g => {
    g.fillStyle = '#5a6068'; g.fillRect(0, 0, TEX, TEX);
    for (let y = 0; y < TEX; y += 32) for (let x = 0; x < TEX; x += 32) { g.fillStyle = '#6a7078'; g.fillRect(x + 2, y + 2, 28, 28); g.fillStyle = '#3a3f46'; g.fillRect(x + 2, y + 29, 28, 1); g.fillRect(x + 29, y + 2, 1, 28); g.fillStyle = '#8a9098'; for (const [rx, ry] of [[5, 5], [25, 5], [5, 25], [25, 25]]) g.fillRect(x + rx, y + ry, 2, 2); }
    g.fillStyle = '#c8a020'; g.fillRect(8, 40, 14, 2); g.fillRect(8, 44, 14, 2);   // hazard stripe
  }),
  bone: makeTex(g => {
    g.fillStyle = '#c8bca0'; g.fillRect(0, 0, TEX, TEX);
    for (let i = 0; i < 60; i++) { g.fillStyle = (i % 3) ? '#d8ccb0' : '#b0a488'; g.fillRect((i * 23) % TEX, (i * 47) % TEX, 4 + (i % 6), 2 + (i % 3)); }
    g.strokeStyle = '#6a5a48'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo((i * 13) % TEX, (i * 29) % TEX); g.lineTo((i * 13 + 10) % TEX, (i * 29 + 18) % TEX); g.stroke(); }
    g.fillStyle = '#efe6d0'; g.beginPath(); g.arc(44, 20, 8, 0, 6.3); g.fill(); g.fillStyle = '#2a2420'; g.fillRect(40, 18, 3, 3); g.fillRect(46, 18, 3, 3); g.fillRect(43, 24, 3, 2);   // tiny cat skull
  }),
  gold: makeTex(g => {
    g.fillStyle = '#a07818'; g.fillRect(0, 0, TEX, TEX);
    for (let y = 0; y < TEX; y += 16) for (let x = 0; x < TEX; x += 16) { g.fillStyle = ((x + y) / 16 % 2) ? '#d4a017' : '#c09014'; g.fillRect(x + 1, y + 1, 14, 14); g.fillStyle = '#f0d060'; g.fillRect(x + 2, y + 2, 12, 1); }
    g.fillStyle = '#3a2a10'; g.beginPath(); g.moveTo(32, 20); g.lineTo(22, 44); g.lineTo(42, 44); g.fill(); g.fillStyle = '#f0d060'; g.beginPath(); g.moveTo(32, 26); g.lineTo(26, 40); g.lineTo(38, 40); g.fill();   // eye-of-cat ornament
  }),
};
const texExit = makeTex(g => {
  g.fillStyle = '#2b2b30'; g.fillRect(0, 0, TEX, TEX); g.fillStyle = '#5a4630'; g.fillRect(6, 4, 52, 60); g.fillStyle = '#3d2f20'; g.fillRect(10, 8, 44, 52);
  g.fillStyle = '#7a1a1a'; g.fillRect(14, 12, 36, 14); g.fillStyle = '#ffd7d7'; g.font = 'bold 12px monospace'; g.fillText('EXIT', 18, 23);
  g.fillStyle = '#c9a227'; g.fillRect(44, 36, 6, 6); g.fillStyle = '#888'; g.fillRect(26, 30, 12, 16); g.fillStyle = '#222'; g.fillRect(30, 34, 4, 8);
});
const texExitOpen = makeTex(g => {
  g.fillStyle = '#0d2a12'; g.fillRect(0, 0, TEX, TEX); g.fillStyle = '#1e7a2e'; g.fillRect(6, 4, 52, 60); g.fillStyle = '#4dff6a'; g.fillRect(10, 8, 44, 52); g.fillStyle = '#b8ffc4'; g.fillRect(16, 14, 32, 40);
  g.fillStyle = '#0a4a14'; g.font = 'bold 12px monospace'; g.fillText('EXIT', 18, 38); g.fillRect(28, 44, 8, 3); g.fillRect(31, 40, 2, 10);
});
const texSplash = makeTex(g => { g.clearRect(0, 0, TEX, TEX); for (let i = 0; i < 16; i++) { const a = i * 0.4, r = 10 + (i * 7) % 14; g.fillStyle = i % 3 ? '#8fd4ff' : '#ffffff'; g.beginPath(); g.arc(32 + Math.cos(a) * r, 30 + Math.sin(a) * r * 0.8, 2 + (i % 2), 0, 6.3); g.fill(); } });
const texDoor = makeTex(g => { g.fillStyle = '#5a4630'; g.fillRect(0, 0, TEX, TEX); g.fillStyle = '#3d2f20'; g.fillRect(6, 4, 52, 60); g.fillStyle = '#2a2018'; g.fillRect(22, 40, 20, 20); g.strokeStyle = '#8a7a60'; g.lineWidth = 2; g.strokeRect(22, 40, 20, 20); g.fillStyle = '#c9a227'; g.fillRect(28, 20, 8, 10); g.fillStyle = '#222'; g.fillRect(31, 24, 2, 4); g.strokeStyle = '#c9a227'; g.beginPath(); g.arc(32, 20, 4, Math.PI, 0); g.stroke(); g.fillStyle = '#ffd7d7'; g.font = 'bold 7px monospace'; g.fillText('CATS ONLY', 12, 14); });
const texDoorOpen = makeTex(g => { g.fillStyle = '#5a4630'; g.fillRect(0, 0, TEX, TEX); g.fillStyle = '#3d2f20'; g.fillRect(6, 4, 52, 60); g.fillStyle = '#000'; g.fillRect(22, 40, 20, 20); g.fillStyle = '#8a7a60'; g.beginPath(); g.moveTo(22, 40); g.lineTo(42, 40); g.lineTo(38, 52); g.lineTo(26, 52); g.fill(); g.fillStyle = '#4dff6a'; g.fillRect(28, 22, 8, 6); g.fillStyle = '#b8ffc4'; g.font = 'bold 7px monospace'; g.fillText('CATS ONLY', 12, 14); });
const texKey = makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.strokeStyle = '#c8303a'; g.lineWidth = 6; g.beginPath(); g.arc(32, 40, 14, 0, 6.3); g.stroke(); g.fillStyle = '#e8c040'; g.beginPath(); g.arc(32, 54, 7, 0, 6.3); g.fill(); g.fillStyle = '#7a5a10'; g.font = 'bold 7px monospace'; g.fillText('TAG', 25, 57); g.fillStyle = '#fff'; g.fillRect(31, 24, 2, 2); });
const texBarrel = makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#6a7a8a'; g.fillRect(8, 30, 48, 30); g.fillStyle = '#8a9aaa'; g.fillRect(8, 30, 48, 4); g.fillStyle = '#d8c8a0'; g.fillRect(12, 34, 40, 10); g.fillStyle = '#b8a880'; for (let i = 0; i < 12; i++) g.fillRect(14 + (i * 7) % 36, 35 + (i * 3) % 8, 2, 2); g.fillStyle = '#4a4a2a'; g.fillRect(20, 36, 5, 3); g.fillRect(36, 38, 6, 3); g.fillStyle = '#fff'; g.font = 'bold 7px monospace'; g.fillText('LITTER', 14, 54); g.fillStyle = '#ffd166'; g.fillText('FULL', 20, 28); });
const texDust = makeTex(g => { g.clearRect(0, 0, TEX, TEX); for (let i = 0; i < 18; i++) { const a = i * 0.7, r = 8 + (i * 5) % 16; g.fillStyle = i % 2 ? 'rgba(216,200,160,.9)' : 'rgba(180,164,128,.8)'; g.beginPath(); g.arc(32 + Math.cos(a) * r * 0.8, 34 + Math.sin(a) * r * 0.6, 7 + (i % 3) * 2, 0, 6.3); g.fill(); } });
let texSecret = null;   // per level: wall A with a faint claw scratch
function makeSecretTex(base) { return makeTex(g => { g.drawImage(base, 0, 0); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(36 + i * 5, 22); g.lineTo(40 + i * 5, 46); g.stroke(); } g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(37, 22); g.lineTo(41, 46); g.stroke(); }); }
const texHairball = makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#6a5040'; for (let i = 0; i < 40; i++) { const a = i * 0.9, r = 14 + (i % 5) * 2; g.beginPath(); g.arc(32 + Math.cos(a) * r * 0.5, 32 + Math.sin(a) * r * 0.5, 6, 0, 6.3); g.fill(); } g.fillStyle = '#8a7060'; for (let i = 0; i < 12; i++) g.fillRect(24 + (i * 7) % 16, 24 + (i * 11) % 16, 2, 2); });

// ---------- cat sprites (public/sprites.js) ----------
const CAT_SPRITES = window.CatDoomSprites.build(CAT_TYPES, makeTex, TEX);
const PICK_SPRITES = {
  water: makeTex(g => { g.fillStyle = '#7aa4c8'; g.beginPath(); g.ellipse(32, 52, 20, 8, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3ab0ff'; g.beginPath(); g.ellipse(32, 50, 15, 5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#cfe8ff'; g.beginPath(); g.ellipse(27, 49, 4, 1.5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#eee'; g.font = 'bold 9px monospace'; g.fillText('H2O', 23, 44); }),
  tuna:  makeTex(g => { g.fillStyle = '#9aa0a6'; g.beginPath(); g.ellipse(32, 52, 18, 7, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#d7dadd'; g.beginPath(); g.ellipse(32, 50, 15, 5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e99a7a'; g.beginPath(); g.ellipse(32, 49, 11, 3, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#eee'; g.font = 'bold 9px monospace'; g.fillText('TUNA', 20, 42); }),
};

// ---------- the toolbelt ----------
const TOOLS = {
  catnip: { unlock: 2, grant: 3, cap: 6, pickup: 2, drops: 2, key: 'Digit1', label: 'CATNIP', icon: '\u{1F33F}', blurb: 'NEW TOOL: CATNIP (1). Throw it. Cats nearby stop caring about you for a while.' },
  yarn:   { unlock: 3, grant: 3, cap: 6, pickup: 2, drops: 2, key: 'Digit2', label: 'YARN',   icon: '\u{1F9F6}', blurb: 'NEW TOOL: YARN BALL (2). Throw it. Cats near where it lands get tangled and take a hit.' },
  bag:    { unlock: 4, grant: 2, cap: 5, pickup: 1, drops: 2, key: 'Digit3', label: 'BAG',    icon: '\u{1F6CD}\uFE0F', blurb: "NEW TOOL: PLASTIC BAG (3). They can't resist. The first cat in gets its head stuck and panics." },
  box:    { unlock: 5, grant: 2, cap: 4, pickup: 1, drops: 1, key: 'Digit4', label: 'BOX',    icon: '\u{1F4E6}', blurb: 'NEW TOOL: CARDBOARD BOX (4). Drop it. If they fits, they sits. Holds three.' },
  laser:  { unlock: 6, grant: 3, cap: 6, pickup: 2, drops: 2, key: 'Digit5', label: 'LASER',  icon: '\u{1F534}', blurb: 'NEW TOOL: LASER POINTER (5). Paint a wall. The dot is not negotiable — they all come to sit on it.' },
  vacuum: { unlock: 8, grant: 2, cap: 4, pickup: 1, drops: 2, key: 'Digit6', label: 'VACUUM', icon: '\u{1F32A}️', blurb: 'NEW TOOL: VACUUM (6). Switch it on. Everything with ears runs for four seconds. Ghosts have no ears.' },
  treats: { unlock: 10, grant: 2, cap: 5, pickup: 1, drops: 2, key: 'Digit7', label: 'TREATS', icon: '\u{1F41F}', blurb: 'NEW TOOL: TREATS (7). Throw them. A cat that eats forgets you were ever here.' },
};
const TOOL_SPRITES = {
  catnip: makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#3f8a2f'; for (let i = 0; i < 7; i++) { const a = i * 0.9; g.beginPath(); g.ellipse(32 + Math.cos(a) * 9, 52 + Math.sin(a) * 4, 9, 4, a, 0, 6.3); g.fill(); } g.fillStyle = '#9fe36a'; for (let i = 0; i < 10; i++) g.fillRect(18 + (i * 5) % 28, 36 + (i * 7) % 16, 2, 2); g.fillStyle = '#e8ffd0'; g.font = 'bold 8px monospace'; g.fillText('NIP', 24, 34); }),
  yarn:   makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#c8303a'; g.beginPath(); g.arc(32, 46, 15, 0, 6.3); g.fill(); g.strokeStyle = '#8a1a22'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(32, 46, 15, 0.4 + i * 0.7, 1.6 + i * 0.7); g.stroke(); } g.beginPath(); g.moveTo(44, 52); g.quadraticCurveTo(56, 56, 58, 62); g.stroke(); }),
  bag:    makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#e8eef4'; g.beginPath(); g.moveTo(16, 30); g.lineTo(48, 28); g.lineTo(52, 62); g.lineTo(12, 62); g.fill(); g.strokeStyle = '#b8c4d0'; g.lineWidth = 2; g.beginPath(); g.moveTo(22, 30); g.quadraticCurveTo(24, 18, 32, 18); g.quadraticCurveTo(40, 18, 42, 28); g.stroke(); g.fillStyle = '#c8d4e0'; g.fillRect(20, 40, 3, 14); g.fillRect(36, 36, 3, 18); g.fillStyle = '#3a6fa8'; g.font = 'bold 7px monospace'; g.fillText('THANK', 20, 50); g.fillText('YOU', 24, 58); }),
  laser:  makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#2a2a30'; g.fillRect(20, 34, 24, 8); g.fillStyle = '#4a4a55'; g.fillRect(20, 34, 24, 2); g.fillStyle = '#c8303a'; g.fillRect(44, 35, 5, 6); g.fillStyle = '#ff4040'; g.beginPath(); g.arc(54, 38, 3, 0, 6.3); g.fill(); g.fillStyle = '#ffb0b0'; g.fillRect(24, 37, 6, 2); }),
  laserdot: makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = 'rgba(255,40,40,.28)'; g.beginPath(); g.ellipse(32, 44, 13, 5, 0, 0, 6.3); g.fill(); g.fillStyle = '#ff1a1a'; g.beginPath(); g.ellipse(32, 44, 7, 3, 0, 0, 6.3); g.fill(); g.fillStyle = '#ffd0d0'; g.beginPath(); g.ellipse(31, 43, 2.5, 1.2, 0, 0, 6.3); g.fill(); }),
  vacuum: makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#7a2a8a'; g.fillRect(16, 30, 26, 26); g.fillStyle = '#9a4aaa'; g.fillRect(16, 30, 26, 4); g.fillStyle = '#2a2a30'; g.fillRect(14, 54, 32, 6); g.fillStyle = '#c8c8d0'; g.beginPath(); g.arc(29, 42, 7, 0, 6.3); g.fill(); g.fillStyle = '#3a3a45'; g.beginPath(); g.arc(29, 42, 4, 0, 6.3); g.fill(); g.strokeStyle = '#4a4a55'; g.lineWidth = 3; g.beginPath(); g.moveTo(42, 34); g.quadraticCurveTo(56, 26, 50, 14); g.stroke(); }),
  treats: makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#c87a3a'; for (let i = 0; i < 9; i++) { const a = i * 1.4; g.beginPath(); g.ellipse(32 + Math.cos(a) * 10, 50 + Math.sin(a) * 5, 4.5, 3, a, 0, 6.3); g.fill(); } g.fillStyle = '#e8a05a'; for (let i = 0; i < 9; i++) { const a = i * 1.4 + 0.3; g.fillRect(30 + Math.cos(a) * 10, 47 + Math.sin(a) * 5, 2, 2); } g.fillStyle = '#ffe0b0'; g.font = 'bold 8px monospace'; g.fillText('YUM', 22, 38); }),
  box:    makeTex(g => { g.clearRect(0, 0, TEX, TEX); g.fillStyle = '#b8874a'; g.fillRect(10, 26, 44, 36); g.fillStyle = '#9a6e3a'; g.fillRect(10, 26, 44, 4); g.fillRect(31, 26, 2, 36); g.fillStyle = '#d0a060'; g.beginPath(); g.moveTo(10, 26); g.lineTo(4, 14); g.lineTo(30, 16); g.lineTo(32, 26); g.fill(); g.beginPath(); g.moveTo(54, 26); g.lineTo(60, 14); g.lineTo(34, 16); g.lineTo(32, 26); g.fill(); g.fillStyle = '#5a3a1a'; g.font = 'bold 6px monospace'; g.fillText('THIS SIDE', 14, 44); g.fillText('UP', 26, 52); }),
};

// ---------- audio ----------
let actx = null, muted = false;
function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } if (actx && actx.state === 'suspended') actx.resume(); return actx; }
function noise(dur, freq, q, gain) {
  const a = audio(); if (!a || muted) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(); src.buffer = buf; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); g.gain.setValueAtTime(gain, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  src.connect(f).connect(g).connect(a.destination); src.start();
}
function tone(type, f0, f1, dur, gain) {
  const a = audio(); if (!a || muted) return;
  const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, a.currentTime); o.frequency.exponentialRampToValueAtTime(f1, a.currentTime + dur);
  const g = a.createGain(); g.gain.setValueAtTime(gain, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
}
const SFX = {
  toss: () => tone('triangle', 500, 300, 0.12, 0.12), rustle: () => noise(0.25, 2500, 0.8, 0.18), thud: () => tone('sine', 120, 60, 0.15, 0.25), purr: () => tone('sawtooth', 80, 70, 0.5, 0.08),
  spray: () => noise(0.12, 3800, 1.2, 0.25), hiss: () => noise(0.35, 6000, 0.6, 0.35), meow: () => tone('sawtooth', 700, 380, 0.3, 0.12), mew: () => tone('sine', 1200, 900, 0.12, 0.1),
  hurt: () => tone('square', 160, 60, 0.25, 0.2), pickup: () => tone('triangle', 500, 1000, 0.15, 0.2), nap: () => tone('sine', 400, 120, 0.4, 0.2), spit: () => noise(0.08, 900, 2, 0.2),
  wail: () => { tone('sawtooth', 300, 900, 0.9, 0.18); setTimeout(() => tone('sawtooth', 900, 250, 0.7, 0.15), 300); }, roar: () => { tone('square', 120, 40, 0.8, 0.25); noise(0.6, 400, 0.5, 0.3); },
  win: () => { tone('square', 440, 880, 0.5, 0.15); setTimeout(() => tone('square', 660, 1320, 0.6, 0.15), 200); }, slam: () => tone('square', 90, 40, 0.3, 0.3),
  laser: () => { tone('square', 1800, 2600, 0.06, 0.08); setTimeout(() => tone('square', 2400, 1600, 0.05, 0.06), 60); },
  vacuum: () => { noise(0.9, 300, 0.4, 0.34); noise(0.9, 1400, 0.9, 0.16); tone('sawtooth', 90, 220, 0.9, 0.14); },   // the loud one
  crunch: () => { noise(0.18, 1800, 1.4, 0.16); setTimeout(() => noise(0.14, 1200, 1.6, 0.12), 120); },
};

// ---------- state ----------
const LEVELS = {};
function newBelt() { const b = {}; for (const k in TOOLS) b[k] = 0; return b; }
const input = { fwd: false, back: false, sl: false, sr: false, tl: false, tr: false, fire: false };
const tapLeft = { fwd: 0, back: 0, sl: 0, sr: 0, tl: 0, tr: 0, fire: 0 };
const on = act => input[act] || tapLeft[act] > 0;
let MW = 20, MH = 20, MAP = new Uint8Array(0), WALLTEX = [null, TEXTURES.brick, TEXTURES.stone, TEXTURES.wood, texExit, TEXTURES.stone];
const G = { state: 'title', t: 0, level: 1, levelName: '', subtitle: '', cleared: false, exit: null, player: null, cats: [], pickups: [], shots: [], triggers: [], fog: 0, sky: '#2a2226', floor: '#4a3a2c',
  tools: newBelt(), throws: [], items: [], hitMark: 0, reducedFx: false, paused: false, dmgMul: 1, speedMul: 1, secrets: [], secretsFound: 0, barrels: [], doors: [], hasKey: false, doorMsgT: 0, par: 0, skill: 'cat', bowlsTotal: 0, bowlsTaken: 0, fightMsgT: 0, dist: null, distT: 0, distCell: -1, zbuf: new Float32Array(W), fireCooldown: 0, recoil: 0, sprayFx: 0, hurtFlash: 0, walkBob: 0, showMap: true, msgTimer: 0, startedAt: 0, finishedAt: 0, kills: 0, totalKills: 0, levelFlash: 0, introT: 0, wailT: 0, procedural: false,
  shake: 0, runT: 0, levelT: 0, levelWater: 0, levelDmg: 0, lastCard: '' };
const wallAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? BORDER_ID : MAP[(y | 0) * MW + (x | 0)];
const solidAt = (x, y) => { const w = wallAt(x, y); return w === EXIT_ID ? !G.cleared : w === DOOR_ID ? !G.hasKey : w === SECRET_ID ? false : w !== 0; };
const barrelBlocks = (x, y, r) => { for (const b of G.barrels) if (b.alive && Math.abs(b.x - x) < r + 0.3 && Math.abs(b.y - y) < r + 0.3) return true; return false; };
const msgEl = $('msg');
const SAVE_KEY = 'catdoom.progress.v1';
function loadProgress() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } }
function saveProgress(patch) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(loadProgress(), patch))); } catch (e) {} }
const DEBUG = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || new URLSearchParams(location.search).has('debug');
const AUD = () => window.CatDoomAudio;
function say(text, ms = 1800) { msgEl.textContent = text; msgEl.classList.add('show'); G.msgTimer = ms / 1000; }

// ---------- procedural fallback (for levels without a file) ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function proceduralDef(n) {
  const rnd = mulberry32(1337 + n * 7919), S = 21 + Math.min(6, (n >> 1) * 2);
  const g = Array.from({ length: S }, () => Array(S).fill('#'));
  const stack = [[1, 1]]; g[1][1] = '.';
  while (stack.length) { const [x, y] = stack[stack.length - 1]; const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx > 0 && ny > 0 && nx < S - 1 && ny < S - 1 && g[ny][nx] === '#'; }); if (!dirs.length) { stack.pop(); continue; } const [dx, dy] = dirs[(rnd() * dirs.length) | 0]; g[y + dy / 2][x + dx / 2] = '.'; g[y + dy][x + dx] = '.'; stack.push([x + dx, y + dy]); }
  for (let i = 0; i < 3 + Math.min(5, n); i++) { const w = 3 + ((rnd() * 3) | 0), h = 3 + ((rnd() * 3) | 0), rx = 1 + ((rnd() * (S - 2 - w)) | 0), ry = 1 + ((rnd() * (S - 2 - h)) | 0); for (let y = ry; y < ry + h; y++) for (let x = rx; x < rx + w; x++) g[y][x] = '.'; }
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) if (g[y][x] === '#' && rnd() < 0.14) { const h = g[y][x - 1] === '.' && g[y][x + 1] === '.', v = g[y - 1][x] === '.' && g[y + 1][x] === '.'; if (h || v) g[y][x] = '.'; }
  const floors = []; for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (g[y][x] === '.') floors.push([x, y]);
  const start = floors[(rnd() * floors.length) | 0]; g[start[1]][start[0]] = 'S';
  const dist = new Map([[start.join(','), 0]]); const q = [start];
  for (let i = 0; i < q.length; i++) { const [x, y] = q[i], d = dist.get(x + ',' + y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (g[ny] && (g[ny][nx] === '.') && !dist.has(k)) { dist.set(k, d + 1); q.push([nx, ny]); } } }
  const far = floors.filter(f => dist.has(f.join(','))).sort((a, b) => dist.get(b.join(',')) - dist.get(a.join(',')));
  let ex = null; for (const [x, y] of far) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g[y + dy] && g[y + dy][x + dx] === '#' && x + dx > 0 && y + dy > 0 && x + dx < S - 1 && y + dy < S - 1) { ex = [x + dx, y + dy]; break; } if (ex) break; }
  if (ex) g[ex[1]][ex[0]] = 'E';
  const count = Math.min(40, 12 + 4 * (n - 1)), pool = far.filter(f => dist.get(f.join(',')) >= 6);
  const w = { tabby: Math.max(1, 7 - n), void: 2 + n * 0.6, tuxedo: 1 + n * 0.5, chonk: 0.4 + n * 0.35 }, tot = w.tabby + w.void + w.tuxedo + w.chonk, roster = [];
  for (const k of ['chonk', 'tuxedo', 'void']) { const qn = Math.round(count * w[k] / tot); for (let i = 0; i < qn; i++) roster.push(k); }
  while (roster.length < count) roster.push('tabby'); roster.length = count;
  for (let i = roster.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [roster[i], roster[j]] = [roster[j], roster[i]]; }
  const letter = { tabby: 't', void: 'v', tuxedo: 'x', chonk: 'c' };
  for (let i = 0; i < count && pool.length; i++) { const [x, y] = pool.splice((rnd() * pool.length) | 0, 1)[0]; g[y][x] = letter[roster[i]]; }
  const free = floors.filter(([x, y]) => g[y][x] === '.' && dist.get(x + ',' + y) >= 2); const nW = 3 + (n >> 1), nT = 2 + (n / 3 | 0);
  for (let i = 0; i < nW + nT && free.length; i++) { const [x, y] = free.splice((rnd() * free.length) | 0, 1)[0]; g[y][x] = i < nW ? 'W' : 'T'; }
  const themes = [['brick', 'wood', 'stone'], ['wood', 'brick', 'stone'], ['brick', 'stone', 'wood'], ['stone', 'wood', 'brick']];
  return { n, name: 'Procedural Wing ' + n, subtitle: '(no level file yet — generated)', rows: g.map(r => r.join('')), theme: { walls: themes[n % 4], border: 'stone', fog: Math.min(0.5, 0.05 * n) } };
}

// ---------- level loading ----------
function registerLevel(def) { LEVELS[def.n] = def; }
function spawnCat(type, x, y, awake, owner) {
  const t = CAT_TYPES[type] || CAT_TYPES.tabby;
  if (!t.phasing) { // find a free cell if the requested one is solid
    if (solidAt(x, y)) { let found = null; for (let r = 1; r <= 3 && !found; r++) for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r && !found; dx++) if (!solidAt(x + dx, y + dy)) found = [x + dx, y + dy]; if (found) { x = found[0]; y = found[1]; } }
  }
  const c = { x, y, type, t, speed: t.speed * (G.speedMul || 1), hp: t.hp, maxHp: t.hp, awake: !!awake || !!t.boss, alive: true, hit: 0, attackT: 0, phase: Math.random() * 6.28, dist: 0, fireT: 1 + Math.random(), strafeT: 0, strafeDir: 1, wailT: 4, spawnT: type === 'bastet' ? 14 : type === 'matriarch' ? 12 : 5, owner: owner || null, enraged: false };
  G.cats.push(c); return c;
}
function loadLevel(n) {
  G.level = n; G.cleared = false; G.kills = 0; G.fireCooldown = 0; G.recoil = 0; G.sprayFx = 0; G.hurtFlash = 0; G.levelFlash = 1; G.introT = 3.2; G.wailT = 0; G.huntCalled = false; G.exitMsgT = 0; G.shake = 0; G.levelT = 0; G.levelWater = 0; G.levelDmg = 0; G.shots = []; G.throws = []; G.items = []; G.cats = []; G.pickups = []; G.triggers = [];
  let def = LEVELS[n]; G.procedural = !def;
  if (!def) def = proceduralDef(n);
  let L = P.parseLevel(def);
  if (L.errors.length) { console.error('CatDoom level ' + n + ' has errors, using procedural fallback:\n' + L.errors.join('\n')); G.procedural = true; L = P.parseLevel(proceduralDef(n)); }
  MW = L.MW; MH = L.MH; MAP = L.map; G.exit = L.exit; G.levelName = L.name; G.subtitle = L.subtitle;
  const th = L.theme; G.fog = th.fog || 0; G.sky = th.sky; G.floor = th.floor;
  const SK = SKILLS[G.skill] || SKILLS.cat;
  G.dmgMul = ((L.difficulty && L.difficulty.dmg) || 1) * SK.dmg; G.speedMul = ((L.difficulty && L.difficulty.speed) || 1) * SK.speed;
  G.secrets = (L.secrets || []).map(([x, y]) => ({ x, y, found: false })); G.secretsFound = 0; G.barrels = (L.barrels || []).map(b => ({ x: b.x, y: b.y, hp: 40, alive: true, fuse: 0 })); G.doors = L.doors || []; G.hasKey = false; G.doorMsgT = 0; G.fightMsgT = 0;
  G.par = L.par || Math.round(45 + 9 * L.cats.length + 6 * (L.triggers || []).reduce((a, t) => a + t.spawn.length, 0));
  WALLTEX = [null, TEXTURES[th.walls[0]] || TEXTURES.brick, TEXTURES[th.walls[1]] || TEXTURES.stone, TEXTURES[th.walls[2]] || TEXTURES.wood, texExit, TEXTURES[th.border] || TEXTURES.stone, texDoor, null];
  texSecret = makeSecretTex(WALLTEX[1]); WALLTEX[7] = texSecret;
  const p = G.player; p.x = L.start[0] + 0.5; p.y = L.start[1] + 0.5;
  const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
  let dir = L.dir && DIRS[L.dir];
  if (!dir) { dir = [1, 0]; for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) if (!wallAt(L.start[0] + dx, L.start[1] + dy)) { dir = [dx, dy]; break; } }
  p.dirX = dir[0]; p.dirY = dir[1]; p.planeX = -dir[1] * FOV_PLANE; p.planeY = dir[0] * FOV_PLANE;
  const awake = new Set(L.awake);
  for (const c of L.cats) spawnCat(c.type, c.x, c.y, awake.has((c.x | 0) + ',' + (c.y | 0)));
  G.pickups = L.pickups.map(k => ({ x: k.x, y: k.y, kind: k.kind, taken: false, dist: 0 }));
  G.bowlsTotal = G.pickups.filter(k => k.kind === 'water').length; G.bowlsTaken = 0;
  G.triggers = L.triggers.map(t => Object.assign({}, t, { fired: false }));
  // toolbelt: unlock + grant, and make sure the level has ammo drops for every unlocked tool
  const R = P.reachability(L), rnd = mulberry32(777 + n * 131), used = new Set(G.cats.map(c => (c.x | 0) + ',' + (c.y | 0)).concat(G.pickups.map(k => (k.x | 0) + ',' + (k.y | 0))));
  const cells = [...R.seen].map(k => k.split(',').map(Number)).filter(([x, y]) => !used.has(x + ',' + y) && Math.abs(x - L.start[0]) + Math.abs(y - L.start[1]) >= 4);
  let newTool = null;
  for (const k in TOOLS) {
    const t = TOOLS[k]; if (n < t.unlock) continue;
    G.tools[k] = Math.min(t.cap, G.tools[k] + t.grant); if (n === t.unlock) newTool = k;
    let have = G.pickups.filter(p => p.kind === k).length;
    while (have < t.drops && cells.length) { const [x, y] = cells.splice((rnd() * cells.length) | 0, 1)[0]; G.pickups.push({ x: x + 0.5, y: y + 0.5, kind: k, taken: false, dist: 0 }); have++; }
  }
  if (newTool) setTimeout(() => { if (G.state === 'playing' && G.level === n) say(TOOLS[newTool].blurb, 5000); }, 2600);
  if (!(loadProgress().best >= n)) saveProgress({ best: n });
  G.dist = null; G.distCell = -1; G.distT = 0;
  if (AUD()) try { AUD().setTheme({ level: n, name: G.levelName, walls: th.walls, fog: G.fog, boss: G.cats.some(c => c.t.boss) }); } catch (e) { console.warn(e); }
  renderHud();
}
function useTool(k) {
  const p = G.player, t = TOOLS[k];
  if (G.state !== 'playing' || !t || G.level < t.unlock) return false;
  if (G.tools[k] <= 0) { say('NO ' + t.label + ' LEFT', 800); return false; }
  G.tools[k]--;
  if (k === 'box') { let x = p.x + p.dirX * 1.1, y = p.y + p.dirY * 1.1; if (!canStand(x, y, 0.2)) { x = p.x; y = p.y; } G.items.push({ kind: 'box', x, y, t: 25, slots: 3 }); SFX.thud(); say('IF THEY FITS, THEY SITS', 1200); return true; }
  if (k === 'laser') { pointLaser(); return true; }
  if (k === 'vacuum') { runVacuum(); return true; }
  G.throws.push({ kind: k, x: p.x, y: p.y, vx: p.dirX * 6, vy: p.dirY * 6, life: 0.85, total: 0.85 }); G.recoil = 0.6; SFX.toss();
  return true;
}
// Laser pointer: march the aim ray out to 8 tiles, drop the dot on the floor just short of the wall.
// Every cat that can see the dot must go and sit on it — even the ones that were minding their own business.
function pointLaser() {
  const p = G.player; let dx = p.x, dy = p.y;
  for (let d = 0.15; d <= 8; d += 0.15) { const nx = p.x + p.dirX * d, ny = p.y + p.dirY * d; if (wallAt(nx, ny)) break; dx = nx; dy = ny; }
  const it = { kind: 'lure', sub: 'laserdot', x: dx, y: dy, t: 6, speedK: 1.3 };
  G.items.push(it); G.recoil = 0.3; SFX.laser();
  let n = 0;
  for (const c of G.cats) if (c.alive && !c.t.boss && !c.status && Math.hypot(c.x - dx, c.y - dy) < 7 && (c.t.phasing || lineOfSight(c.x, c.y, dx, dy))) { c.lure = it; c.awake = true; n++; }   // a cat already tangled/bagged/boxed stays where you put it
  say(n ? n + (n === 1 ? ' CAT SEES' : ' CATS SEE') + ' THE DOT' : 'THE DOT SITS THERE, UNSEEN', 1200);
}
// Vacuum: no projectile, just the worst noise in the world. Ghosts have no ears; bosses have no shame.
function runVacuum() {
  const p = G.player; let n = 0;
  for (const c of G.cats) if (c.alive && !c.t.boss && !c.t.phasing && !c.status && Math.hypot(c.x - p.x, c.y - p.y) < 4 && lineOfSight(p.x, p.y, c.x, c.y)) { setStatus(c, 'scared', 4); c.awake = true; n++; }   // never scares a cat out of a box you just got it into
  SFX.vacuum(); if (!G.reducedFx) G.shake = 0.4;
  say(n ? n + (n === 1 ? ' CAT BOLTS' : ' CATS BOLT') : 'NOTHING WITH EARS IS LISTENING', 1400);
}
function landThrow(s) {
  const at = { x: s.x, y: s.y };
  if (wallAt(at.x, at.y)) { at.x -= s.vx * 0.05; at.y -= s.vy * 0.05; if (wallAt(at.x, at.y)) { at.x = s.x - s.vx * 0.1; at.y = s.y - s.vy * 0.1; } }
  if (s.kind === 'catnip') { const it = { kind: 'lure', sub: 'catnip', x: at.x, y: at.y, t: 8 }; G.items.push(it); let n = 0; for (const c of G.cats) if (c.alive && !c.t.boss && Math.hypot(c.x - at.x, c.y - at.y) < 6) { c.lure = it; c.awake = true; n++; } SFX.purr(); if (n) say(n + (n === 1 ? ' CAT SMELLS' : ' CATS SMELL') + ' THE CATNIP', 1200); }
  else if (s.kind === 'yarn') { let n = 0; for (const c of G.cats) if (c.alive && Math.hypot(c.x - at.x, c.y - at.y) < 2.2) { if (!c.t.boss) setStatus(c, 'tangled', 5); damageCat(c, 30); n++; } G.items.push({ kind: 'floor', sub: 'yarn', x: at.x, y: at.y, t: 5 }); SFX.thud(); if (n) say(n + ' TANGLED', 1000); }
  else if (s.kind === 'bag') { const it = { kind: 'lure', sub: 'bag', x: at.x, y: at.y, t: 10, single: true }; G.items.push(it); for (const c of G.cats) if (c.alive && !c.t.boss && Math.hypot(c.x - at.x, c.y - at.y) < 5) { c.lure = it; c.awake = true; } SFX.rustle(); }
  else if (s.kind === 'treats') { const it = { kind: 'lure', sub: 'treats', x: at.x, y: at.y, t: 8 }; G.items.push(it); let n = 0; for (const c of G.cats) if (c.alive && !c.t.boss && Math.hypot(c.x - at.x, c.y - at.y) < 3) { c.lure = it; c.awake = true; n++; } SFX.crunch(); if (n) say(n + (n === 1 ? ' CAT HEARS' : ' CATS HEAR') + ' THE BAG OPEN', 1200); }
}
function setStatus(c, kind, t) { if (c.t.boss) return; if ((kind === 'boxed' || kind === 'scared') && c.t.phasing) return; c.status = { kind, t }; c.lure = null; }
function damageCat(c, dmg) {
  if (!c.alive) return;
  if (c.status && (c.status.kind === 'bagged' || c.status.kind === 'boxed' || c.status.kind === 'eating')) dmg *= 2;
  c.hp -= dmg; c.hit = 0.15; c.awake = true;
  if (c.hp > 0 && Math.random() * 100 < (PAIN[c.type] || 50)) { c.flinch = 0.35; c.hit = 0.35; c.attackT = Math.max(c.attackT, 0.8); }
  if (c.hp <= 0) { c.alive = false; c.status = null; c.lure = null; G.kills++; G.totalKills++; SFX.nap(); say(c.t.name.toUpperCase() + (c.t.boss ? ' SLEEPS' : ' IS NAPPING'), c.t.boss ? 2500 : 1200); if (c.type === 'bastet') say('BASTET SLEEPS. THE HOUSE IS YOURS. FIND THE EXIT.', 4000); }
  else { SFX.hiss(); if (c.type === 'bastet' && !c.enraged && c.hp < c.maxHp / 2) { c.enraged = true; c.speed = 2.0; say('BASTET IS ANGRY', 2500); SFX.roar(); } }
}
// ---------- cat fights, litter boxes, hidey-holes ----------
function attackCat(victim, attacker, dmg) {
  if (!victim || !victim.alive) return;
  damageCat(victim, dmg);
  if (!victim.alive || !attacker || !attacker.alive || attacker === victim || victim.t.boss) return;
  if (victim.owner === attacker || attacker.owner === victim || (victim.owner && victim.owner === attacker.owner)) return;   // a boss's summons never turn on their boss or each other
  victim.target = attacker; victim.targetT = 8; victim.awake = true;
  if (G.fightMsgT <= 0) { say('CAT FIGHT!', 1200); G.fightMsgT = 3; SFX.hiss(); }
}
function explodeBarrel(b, byCat) {
  if (!b.alive) return; b.alive = false;
  G.items.push({ kind: 'dust', x: b.x, y: b.y, t: 1.2 }); SFX.roar(); if (!G.reducedFx) G.shake = Math.max(G.shake || 0, 0.35);
  const p = G.player;
  for (const c of G.cats) if (c.alive && Math.hypot(c.x - b.x, c.y - b.y) < 2.2) { if (byCat) attackCat(c, byCat, 70); else damageCat(c, 70); if (c.alive && !c.t.boss) setStatus(c, 'dazed', 2); }
  if (Math.hypot(p.x - b.x, p.y - b.y) < 2.2) hurtPlayer(15);
  for (const o of G.barrels) if (o.alive && o !== b && !o.fuse && Math.hypot(o.x - b.x, o.y - b.y) < 2.2) o.fuse = 0.25;
  say('THE LITTER BOX GOES UP', 1200);
}
function reset(level) {
  const SKw = (SKILLS[G.skill] || SKILLS.cat).water;
  G.player = { x: 1.5, y: 1.5, dirX: 1, dirY: 0, planeX: 0, planeY: FOV_PLANE, hp: 100, water: SKw, maxWater: SKw };
  G.totalKills = 0; G.startedAt = performance.now(); G.tools = newBelt();
  G.runT = 0; G.lastCard = '';
  loadLevel(level || 1);
}
function nextLevel() {
  const p = G.player; p.water = Math.min(p.maxWater, p.water + 25); p.hp = Math.min(100, p.hp + 10);
  G.lastCard = levelCard(); recordLevel();
  loadLevel(G.level + 1); SFX.pickup();
}
const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
// The one-line scorecard for the room you just walked out of; drawn under the next room's intro card.
function levelGrade() {
  const cats = G.cats.length ? G.kills / G.cats.length : 1, sec = G.secrets.length ? G.secretsFound / G.secrets.length : 1, underPar = G.levelT <= G.par;
  if (cats >= 1 && sec >= 1 && underPar) return 'S'; if (underPar || sec >= 1) return 'A'; if (cats >= 1) return 'B'; return 'C';
}
function levelCard() {
  const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
  return 'CATS ' + pct(G.kills, G.cats.length) + ' · BOWLS ' + G.bowlsTaken + '/' + G.bowlsTotal + (G.secrets.length ? ' · SECRETS ' + G.secretsFound + '/' + G.secrets.length : '') + ' · ' + mmss(G.levelT) + ' (PAR ' + mmss(G.par) + ') · GRADE ' + levelGrade();
}
function recordLevel() {
  const prog = loadProgress(), levels = prog.levels || {}, prev = levels[G.level] || {};
  const g = levelGrade(), order = 'CBAS';
  levels[G.level] = { time: prev.time ? Math.min(prev.time, Math.round(G.levelT)) : Math.round(G.levelT), secrets: Math.max(prev.secrets || 0, G.secretsFound), secretsTotal: G.secrets.length, grade: order.indexOf(g) > order.indexOf(prev.grade || 'C') ? g : (prev.grade || g) };
  saveProgress({ levels });
}
function shareText() {
  const t = mmss(G.runT);
  return G.state === 'won'
    ? 'CatDoom: cleared all ' + LAST_LEVEL + ' rooms in ' + t + ', ' + G.totalKills + ' cats napping. cat-doom.com'
    : 'CatDoom: reached Level ' + G.level + ' (' + G.levelName + ') in ' + t + ', ' + G.totalKills + ' cats napping. cat-doom.com';
}
function fireTrigger(t) {
  t.fired = true;
  for (const s of t.spawn) spawnCat(s.type, s.x, s.y, true);
  if (t.water) G.player.water = Math.min(G.player.maxWater, G.player.water + t.water);
  if (t.say) say(t.say, 2400);
  if (t.spawn.length) { SFX.roar(); }
}

// ---------- helpers ----------
function canStand(x, y, r = 0.25) { return !solidAt(x - r, y - r) && !solidAt(x + r, y - r) && !solidAt(x - r, y + r) && !solidAt(x + r, y + r) && !barrelBlocks(x, y, r); }
function moveWithSlide(o, dx, dy, r) { if (canStand(o.x + dx, o.y, r)) o.x += dx; if (canStand(o.x, o.y + dy, r)) o.y += dy; }
function lineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy), n = Math.ceil(d / 0.08);
  for (let i = 1; i < n; i++) { const t = i / n; if (wallAt(x0 + dx * t, y0 + dy * t)) return false; }
  return true;
}
function rotate(p, a) { const c = Math.cos(a), s = Math.sin(a); const dx = p.dirX * c - p.dirY * s, dy = p.dirX * s + p.dirY * c; p.dirX = dx; p.dirY = dy; p.planeX = -dy * FOV_PLANE; p.planeY = dx * FOV_PLANE; }
function hurtPlayer(dmg) { const p = G.player; p.hp -= dmg; G.levelDmg += dmg; G.hurtFlash = 1; SFX.hurt(); if (p.hp <= 0) { p.hp = 0; endGame(); return true; } return false; }

// ---------- update ----------
function fire() {
  const p = G.player;
  if (G.fireCooldown > 0) return false;
  G.fireCooldown = 0.34; G.recoil = 1; G.sprayFx = 1;
  if (p.water <= 0) { say('OUT OF WATER — find a bowl', 900); tone('square', 200, 150, 0.08, 0.1); return false; }
  p.water--; G.levelWater++; SFX.spray();
  if (!G.dist) computeDist();
  for (const c of G.cats) { if (!c.alive || c.awake) continue; if (c.t.phasing) { if (c.dist < 9) c.awake = true; continue; } const dd = G.dist[(c.y | 0) * MW + (c.x | 0)]; if (dd >= 0 && dd <= 9) c.awake = true; }   // they hear the bottle through open space, not through walls
  let best = null, bestD = 7;
  for (const c of G.cats) {
    if (!c.alive) continue;
    const vx = c.x - p.x, vy = c.y - p.y, d = Math.hypot(vx, vy); if (d > bestD || d < 0.05) continue;
    const forward = (vx * p.dirX + vy * p.dirY) / d; if (forward <= 0) continue;
    // It is a spray bottle, not a rifle: anything within ±26° of the aim line (or overlapping the mist at point-blank) gets wet. Nearest cat wins.
    const side = Math.abs(vx * p.dirY - vy * p.dirX), inCone = side / d <= 0.44 || side <= 0.45 * c.t.scale + (d < 1.3 ? 0.4 : 0);
    if (inCone && (c.t.phasing || lineOfSight(p.x, p.y, c.x, c.y))) { best = c; bestD = d; }
  }
  let bestB = null;
  for (const b of G.barrels) { if (!b.alive) continue; const vx = b.x - p.x, vy = b.y - p.y, d = Math.hypot(vx, vy); if (d > bestD || d < 0.05) continue; const forward = (vx * p.dirX + vy * p.dirY) / d; if (forward <= 0) continue; const side = Math.abs(vx * p.dirY - vy * p.dirX); if ((side / d <= 0.3 || side <= 0.35) && lineOfSight(p.x, p.y, b.x, b.y)) { bestB = b; bestD = d; best = null; } }
  if (bestB) { bestB.hp -= 40; G.hitMark = 0.18; SFX.thud(); if (bestB.hp <= 0) explodeBarrel(bestB, null); }
  if (best) {
    if (!best.t.boss && !(best.status && best.status.kind === 'boxed')) { const kx = best.x - p.x, ky = best.y - p.y, kd = Math.hypot(kx, ky) || 1; if (best.t.phasing) { best.x += kx / kd * 0.25; best.y += ky / kd * 0.25; } else moveWithSlide(best, kx / kd * 0.25, ky / kd * 0.25, 0.2); }
    damageCat(best, bestD < 2.5 ? 40 : 28); best.splash = 0.3; G.hitMark = 0.18;
  }
  return true;
}
// BFS distance from the player over walkable cells, refreshed when the player changes cell (or every 0.3 s)
function computeDist() {
  const p = G.player, n = MW * MH, D = new Int16Array(n).fill(-1), q = new Int32Array(n); let h = 0, t = 0;
  const s = (p.y | 0) * MW + (p.x | 0); D[s] = 0; q[t++] = s;
  while (h < t) { const i = q[h++], x = i % MW, y = (i / MW) | 0, d = D[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const j = ny * MW + nx; if (D[j] >= 0 || solidAt(nx, ny)) continue; D[j] = d + 1; q[t++] = j; } }
  G.dist = D;
}
function chase(c, dt, speed, toward = 1, target) {
  const p0x = c.x, p0y = c.y;
  chaseInner(c, dt, speed, toward, target);
  if (toward > 0 && !target && !c.t.phasing) { if (Math.hypot(c.x - p0x, c.y - p0y) < 0.004) { c.stuckT = (c.stuckT || 0) + dt; if (c.stuckT > 0.4) { const a = c.phase + G.t; for (const [dx, dy] of [[Math.cos(a), Math.sin(a)], [-Math.sin(a), Math.cos(a)], [-Math.cos(a), -Math.sin(a)]]) if (canStand(c.x + dx * 0.35, c.y + dy * 0.35, 0.2)) { c.x += dx * speed * dt * 1.5; c.y += dy * speed * dt * 1.5; break; } } } else c.stuckT = 0; }
}
function chaseInner(c, dt, speed, toward = 1, target) {
  const p = target || G.player, dd = target ? (Math.hypot(p.x - c.x, p.y - c.y) || 1) : c.dist, vx = (p.x - c.x) / dd * toward, vy = (p.y - c.y) / dd * toward;
  let sx = vx, sy = vy;
  if (c.t.phasing) { c.x = Math.max(0.5, Math.min(MW - 0.5, c.x + sx * speed * dt)); c.y = Math.max(0.5, Math.min(MH - 0.5, c.y + sy * speed * dt)); return; }
  if (toward > 0 && !target && !lineOfSight(c.x, c.y, p.x, p.y)) {
    // no line of sight: follow the distance field downhill toward the player
    let best = null, bestD = G.dist ? G.dist[(c.y | 0) * MW + (c.x | 0)] : -1; if (bestD < 0) bestD = 1e9;
    if (G.dist) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = (c.x | 0) + dx, ny = (c.y | 0) + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const d = G.dist[ny * MW + nx]; if (d >= 0 && d < bestD) { bestD = d; best = [nx + 0.5, ny + 0.5]; } }
    if (best) { sx = best[0] - c.x; sy = best[1] - c.y; const l = Math.hypot(sx, sy) || 1; sx /= l; sy /= l; }
    else if (canStand(c.x + Math.sign(vx) * 0.4, c.y, 0.2)) { sx = Math.sign(vx); sy = 0; } else { sx = 0; sy = Math.sign(vy); }
  }
  if (c.type === 'zoomie') { sx += -vy * c.strafeDir * 0.9; sy += vx * c.strafeDir * 0.9; }
  for (const o of G.cats) { if (o === c || !o.alive) continue; const ox = c.x - o.x, oy = c.y - o.y, od = Math.hypot(ox, oy); if (od < 0.6 && od > 0.001) { sx += ox / od * 0.8; sy += oy / od * 0.8; } }
  const sl = Math.hypot(sx, sy) || 1;
  moveWithSlide(c, sx / sl * speed * dt, sy / sl * speed * dt, 0.2);
}
// Which way is the cat facing relative to the player? Uses the heading it moved last.
// a panicking cat that crashes into another cat starts a fight
function bump(c, dt) { c.bumpT = (c.bumpT || 0) - dt; if (c.bumpT > 0) return; for (const o of G.cats) { if (o === c || !o.alive) continue; if (Math.hypot(o.x - c.x, o.y - c.y) < 0.55) { c.bumpT = 0.8; attackCat(o, c, 6); break; } } }
function catFacing(c) {
  const hx = c.hx || 0, hy = c.hy || 0; if (Math.hypot(hx, hy) < 0.02) return 'front';
  const p = G.player, tx = p.x - c.x, ty = p.y - c.y, d = Math.hypot(tx, ty) || 1;
  const dot = (hx * tx + hy * ty) / d, cross = hx * ty - hy * tx;
  if (dot > 0.5) return 'front'; if (dot < -0.5) return 'back'; return cross > 0 ? 'right' : 'left';
}
function spit(c) {
  const p = G.player, dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
  G.shots.push({ x: c.x, y: c.y, vx: dx / d * 4.5, vy: dy / d * 4.5, life: 4, from: c, age: 0 }); SFX.spit();
}
function updateCat(c, dt) {
  const p = G.player;
  c.dist = Math.hypot(c.x - p.x, c.y - p.y);
  if (!c.alive) return;
  if (c.hit > 0) c.hit -= dt; if (c.splash > 0) c.splash -= dt;
  c.hx = c.x - (c.px === undefined ? c.x : c.px); c.hy = c.y - (c.py === undefined ? c.y : c.py); c.px = c.x; c.py = c.y;
  { const cand = catFacing(c); if (cand === c.facing) c.facingT = 0; else { c.facingT = (c.facingT || 0) + dt; if (c.facingT > 0.12 || !c.facing) { c.facing = cand; c.facingT = 0; } } }
  if (G.introT > 0.4 && (SKILLS[G.skill] || SKILLS.cat).grace) return;   // grace: nothing moves while the level card is up (not on LION)
  if (!c.awake && c.dist < 7 && (c.t.phasing || lineOfSight(p.x, p.y, c.x, c.y))) { c.awake = true; if (!c.t.silent) SFX.meow(); }
  if (!c.awake) return;
  const speed = c.speed * (G.wailT > 0 ? 1.5 : 1);
  if (c.flinch > 0) { c.flinch -= dt; return; }   // pain state: a flinching cat does nothing for a beat
  if (c.target) {
    if (!c.target.alive || (c.targetT -= dt) <= 0) { c.target = null; }
    else if (!c.status) { const td = Math.hypot(c.target.x - c.x, c.target.y - c.y); if (td > 0.75) { chase(c, dt, speed, 1, c.target); return; } c.attackT -= dt; if (c.attackT <= 0) { c.attackT = 1.1; attackCat(c.target, c, c.t.dmg); } return; }
  }
  if (c.status) {
    c.status.t -= dt;
    if (c.status.t <= 0) { const was = c.status.kind; c.status = null; if (was === 'eating') { c.awake = false; c.attackT = 0.9; SFX.purr(); return; } }   // a fed cat is a calm cat: it forgets you until it sees you again
    else if (c.status.kind === 'scared') { chase(c, dt, speed * 1.5, -1); bump(c, dt); return; }   // runs straight away from you, cannot attack
    else if (c.status.kind === 'bagged') { c.strafeT -= dt; if (c.strafeT <= 0) { c.strafeT = 0.4 + Math.random() * 0.4; const a = Math.random() * 6.28; c.panic = [Math.cos(a), Math.sin(a)]; } if (c.panic) moveWithSlide(c, c.panic[0] * speed * 1.3 * dt, c.panic[1] * speed * 1.3 * dt, 0.2); bump(c, dt); return; }
    else return;   // dazed / tangled / boxed: sits there
  }
  if (c.lure) {
    if (c.lure.t <= 0 || (c.lure.single && c.lure.used)) c.lure = null;
    else {
      const ld = Math.hypot(c.lure.x - c.x, c.lure.y - c.y);
      if (ld > 0.6) { chase(c, dt, speed * (c.lure.speedK || 1), 1, c.lure); return; }
      if (c.lure.sub === 'bag') { c.lure.used = true; c.lure.t = 0; setStatus(c, 'bagged', 8); say('BAGGED', 900); SFX.rustle(); }
      else if (c.lure.sub === 'treats') { setStatus(c, 'eating', 6); c.lure = null; SFX.crunch(); }
      else { setStatus(c, 'dazed', c.lure.t); c.lure = null; }   // catnip and the laser dot: sit there for as long as it lasts
      return;
    }
  }
  const melee = c.dist <= 0.75;
  switch (c.type) {
    case 'sphynx': {
      const vx = c.x - p.x, vy = c.y - p.y, forward = (vx * p.dirX + vy * p.dirY) / (c.dist || 1);
      const inView = forward > 0.72 && lineOfSight(p.x, p.y, c.x, c.y);
      if (!inView && !melee) chase(c, dt, speed);
      break;
    }
    case 'hurler': {
      if (c.dist < 3) chase(c, dt, speed, -1); else if (c.dist > 6) chase(c, dt, speed);
      c.fireT -= dt; if (c.fireT <= 0 && c.dist < 9 && lineOfSight(c.x, c.y, p.x, p.y)) { spit(c); c.fireT = 2.2; }
      break;
    }
    case 'zoomie': { c.strafeT -= dt; if (c.strafeT <= 0) { c.strafeDir = Math.random() < 0.5 ? -1 : 1; c.strafeT = 0.35 + Math.random() * 0.5; } if (!melee) chase(c, dt, speed); break; }
    case 'wailer': {
      if (!melee) chase(c, dt, speed);
      c.wailT -= dt; if (c.wailT <= 0 && c.dist < 10) { c.wailT = 7; G.wailT = 4; for (const o of G.cats) if (o.alive) o.awake = true; say('A CATERWAUL ECHOES THROUGH THE HOUSE', 2000); SFX.wail(); }
      break;
    }
    case 'matriarch': {
      if (!melee) chase(c, dt, speed);
      c.spawnT -= dt; if (c.spawnT <= 0) { c.spawnT = 8; if (G.cats.filter(o => o.alive && o.owner === c).length < 8) { for (let i = 0; i < 2; i++) spawnCat('kitten', c.x + (i ? 0.8 : -0.8), c.y + 0.6, true, c); say('THE MATRIARCH CALLS HER KITTENS', 1800); SFX.mew(); } }
      break;
    }
    case 'bastet': {
      if (!melee && c.dist > 2.2) chase(c, dt, speed); else if (c.dist < 1.6 && !melee) chase(c, dt, speed * 0.6, -1);
      c.fireT -= dt; if (c.fireT <= 0 && c.dist < 10 && lineOfSight(c.x, c.y, p.x, p.y)) { spit(c); c.fireT = c.enraged ? 1.8 : 3; }
      c.spawnT -= dt; if (c.spawnT <= 0) { c.spawnT = 12; if (G.cats.filter(o => o.alive && o.owner === c).length < 6) { for (let i = 0; i < 2; i++) spawnCat(Math.random() < 0.5 ? 'void' : 'zoomie', c.x + (i ? 1 : -1), c.y - 0.8, true, c); say('BASTET SUMMONS HER FAITHFUL', 1800); SFX.roar(); } }
      break;
    }
    default: if (!melee) chase(c, dt, speed);
  }
  if (melee) { c.attackT -= dt; if (c.attackT <= 0) { c.attackT = 1.1; if (Math.random() < 0.5) SFX.hiss(); if (hurtPlayer(Math.max(1, Math.round(c.t.dmg * G.dmgMul)))) return; } }
  else c.attackT = Math.max(c.attackT, 0.8);
}
function update(dt) {
  const p = G.player;
  if (G.msgTimer > 0) { G.msgTimer -= dt; if (G.msgTimer <= 0) msgEl.classList.remove('show'); }
  if (G.state !== 'playing' || G.paused) return;
  G.t += dt; G.runT += dt; G.levelT += dt;   // run/level clocks only tick while playing — the title and the overlays are free
  const turn = ((on('tr') ? 1 : 0) - (on('tl') ? 1 : 0)) * 2.4 * dt + dragTurn; dragTurn = 0;
  if (turn) rotate(p, turn);
  const spd = 3.2 * dt; let mx = 0, my = 0;
  if (on('fwd')) { mx += p.dirX * spd; my += p.dirY * spd; }
  if (on('back')) { mx -= p.dirX * spd; my -= p.dirY * spd; }
  if (on('sr')) { mx += p.planeX / FOV_PLANE * spd; my += p.planeY / FOV_PLANE * spd; }
  if (on('sl')) { mx -= p.planeX / FOV_PLANE * spd; my -= p.planeY / FOV_PLANE * spd; }
  if (mx || my) { moveWithSlide(p, mx, my, 0.25); G.walkBob += dt * 9; }
  G.distT -= dt; { const cell = (p.y | 0) * MW + (p.x | 0); if (!G.dist || cell !== G.distCell || G.distT <= 0) { computeDist(); G.distCell = cell; G.distT = 0.3; } }
  if (G.fireCooldown > 0) G.fireCooldown -= dt;
  if (input.fire) fire();
  for (const k in tapLeft) if (tapLeft[k] > 0) tapLeft[k] -= dt;
  G.hitMark = Math.max(0, G.hitMark - dt); G.recoil = Math.max(0, G.recoil - dt * 6); G.sprayFx = Math.max(0, G.sprayFx - dt * 5); G.hurtFlash = Math.max(0, G.hurtFlash - dt * 3); G.wailT = Math.max(0, G.wailT - dt);
  G.levelFlash = Math.max(0, G.levelFlash - dt * 1.5); G.introT = Math.max(0, G.introT - dt); G.shake = Math.max(0, G.shake - dt);
  for (const c of G.cats.slice()) { updateCat(c, dt); if (G.state !== 'playing') return; }
  // projectiles
  for (const s of G.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (wallAt(s.x, s.y)) s.life = 0;
    else if (Math.hypot(s.x - p.x, s.y - p.y) < 0.45) { s.life = 0; if (hurtPlayer(10)) return; }
    else { s.age = (s.age || 0) + dt; if (s.age > 0.25) { const v = G.cats.find(c => c.alive && c !== s.from && Math.hypot(c.x - s.x, c.y - s.y) < 0.45); if (v) { s.life = 0; attackCat(v, s.from, 10); } else { const b = G.barrels.find(b => b.alive && Math.hypot(b.x - s.x, b.y - s.y) < 0.5); if (b) { s.life = 0; b.hp -= 20; if (b.hp <= 0) explodeBarrel(b, s.from); } } } }
  }
  for (const b of G.barrels) if (b.alive && b.fuse) { b.fuse -= dt; if (b.fuse <= 0) { b.fuse = 0; explodeBarrel(b, null); } }
  G.fightMsgT = Math.max(0, G.fightMsgT - dt);
  G.shots = G.shots.filter(s => s.life > 0);
  for (const s of G.throws) { const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt; s.life -= dt; if (wallAt(nx, ny)) s.life = 0; else { s.x = nx; s.y = ny; } if (s.kind === 'yarn' && s.life > 0 && G.cats.some(c => c.alive && Math.hypot(c.x - s.x, c.y - s.y) < 0.6)) s.life = 0; if (s.life <= 0) landThrow(s); }
  G.throws = G.throws.filter(s => s.life > 0);
  for (const it of G.items) {
    it.t -= dt;
    if (it.kind === 'box' && it.slots > 0) for (const c of G.cats) if (c.alive && !c.status && !c.t.boss && !c.t.phasing && Math.hypot(c.x - it.x, c.y - it.y) < 0.9) { setStatus(c, 'boxed', 10); c.x = it.x; c.y = it.y; it.slots--; say(c.t.name.toUpperCase() + ' FITS. ' + c.t.name.toUpperCase() + ' SITS.', 1200); SFX.purr(); if (it.slots <= 0) it.t = Math.min(it.t, 10); }
  }
  G.items = G.items.filter(it => it.t > 0);
  // pickups
  for (const k of G.pickups) {
    k.dist = Math.hypot(k.x - p.x, k.y - p.y);
    if (k.taken || k.dist > 0.55) continue;
    const trig = G.triggers.some(t => !t.fired && t.when === 'pickup' && t.x === (k.x | 0) && t.y === (k.y | 0));
    if (k.kind === 'water') { if (p.water >= p.maxWater && !trig) continue; p.water = Math.min(p.maxWater, p.water + 30); say('+30 WATER', 900); }
    else if (k.kind === 'tuna') { if (p.hp >= 100 && !trig) continue; p.hp = Math.min(100, p.hp + 35); say('+35 HP (tuna)', 900); }
    else if (k.kind === 'key') { G.hasKey = true; say('THE COLLAR TAG. SOMEWHERE THERE IS A CAT FLAP IT FITS.', 2600); SFX.win(); }
    else if (TOOLS[k.kind]) { const t = TOOLS[k.kind]; if (G.tools[k.kind] >= t.cap && !trig) continue; G.tools[k.kind] = Math.min(t.cap, G.tools[k.kind] + t.pickup); say('+' + t.pickup + ' ' + t.label, 900); }
    if (k.kind === 'water') G.bowlsTaken++;
    k.taken = true; SFX.pickup();
    for (const t of G.triggers) if (!t.fired && t.when === 'pickup' && t.x === (k.x | 0) && t.y === (k.y | 0)) fireTrigger(t);
  }
  // hidey-holes and the cat flap
  for (const sc of G.secrets) if (!sc.found && (p.x | 0) === sc.x && (p.y | 0) === sc.y) { sc.found = true; G.secretsFound++; say('SECRET FOUND (' + G.secretsFound + '/' + G.secrets.length + ')', 1600); SFX.win(); }
  G.doorMsgT -= dt; if (!G.hasKey && G.doorMsgT <= 0) for (const [dx, dy] of G.doors) if (Math.hypot(dx + 0.5 - p.x, dy + 0.5 - p.y) < 1.4) { G.doorMsgT = 3; say('LOCKED. THE CAT FLAP WANTS A COLLAR TAG.', 2200); SFX.slam(); break; }
  // triggers
  for (const t of G.triggers) {
    if (t.fired) continue;
    if (t.when === 'enter' && p.x >= t.x && p.x < t.x + t.w && p.y >= t.y && p.y < t.y + t.h) fireTrigger(t);
    else if (t.when === 'kills' && G.kills >= t.count) fireTrigger(t);
  }
  // the hunt: when only the last couple of cats remain, they come to you instead of hiding
  const aliveCount = G.cats.filter(c => c.alive).length;
  if (!G.huntCalled && G.cats.length >= 6 && aliveCount > 0 && aliveCount <= 2 && !G.triggers.some(t => !t.fired && t.spawn.length)) { G.huntCalled = true; for (const c of G.cats) if (c.alive) c.awake = true; say('THE LAST ' + (aliveCount === 1 ? 'CAT IS' : 'CATS ARE') + ' COMING FOR YOU', 2400); SFX.meow(); }
  // locked-door feedback
  if (!G.cleared && G.exit && Math.hypot(G.exit[0] + 0.5 - p.x, G.exit[1] + 0.5 - p.y) < 1.6) { G.exitMsgT -= dt; if (G.exitMsgT <= 0) { G.exitMsgT = 3; say('EXIT LOCKED — ' + aliveCount + (aliveCount === 1 ? ' CAT' : ' CATS') + ' STILL AWAKE. CHECK THE MAP.', 2600); SFX.slam(); } }
  // cleared?
  const alive = aliveCount > 0;
  if (!alive) { const next = G.triggers.find(t => !t.fired && t.spawn.length); if (next) { fireTrigger(next); if (!next.say) say('THE REST OF THEM COME OUT TO PLAY', 2000); } }
  const pendingWaves = G.triggers.some(t => !t.fired && t.spawn.length);
  const now = !alive && !pendingWaves && G.cats.length > 0;
  if (now && !G.cleared) { G.cleared = true; SFX.win(); say(G.level >= LAST_LEVEL ? 'THE LAST DOOR IS OPEN' : 'LEVEL CLEAR — FIND THE GREEN EXIT DOOR', 3200); }
  else if (!now && G.cleared) { G.cleared = false; SFX.slam(); say('THE EXIT SLAMS SHUT', 1800); }
  if (G.cleared && wallAt(p.x, p.y) === EXIT_ID) { if (G.level >= LAST_LEVEL) victory(); else nextLevel(); }
}
function showOverlay(kind) {
  const best = Math.min(LAST_LEVEL, loadProgress().best || 1), died = G.level;
  $('overlay').hidden = false;
  const cont = kind === 'title' ? (best > 1 ? best : 0) : (kind === 'lost' && died > 1 ? died : 0);
  $('contbtn').hidden = !cont; if (cont) { $('contbtn').innerHTML = 'CONTINUE<small>(Level ' + cont + ')</small>'; $('contbtn').dataset.level = cont; }
  $('startbtn').textContent = kind === 'title' ? (cont ? 'NEW GAME' : 'START') : (cont ? 'START OVER' : 'PLAY AGAIN');
  $('ovtext').hidden = kind === 'title'; if (kind === 'title') $('ovsub').textContent = 'Doom, but the demons are cats.';
  buildLevelSelect(kind === 'title' ? best : 0);
  document.body.classList.toggle('title', kind === 'title');
  $('skillwrap').hidden = kind !== 'title'; for (const b of document.querySelectorAll('#skillsel button')) b.classList.toggle('on', b.dataset.skill === G.skill);
  $('roomwrap').hidden = !(kind === 'title' && best > 1); $('levelsel').hidden = true; $('roomtoggle').classList.remove('open'); $('roomtoggle').textContent = 'START FROM AN EARLIER ROOM ▾';
  const copy = $('copybtn'); copy.hidden = kind === 'title'; copy.textContent = 'COPY RESULT'; copy.disabled = false;
  if (AUD()) try { AUD().stop(); } catch (e) {}
}
// Level select: one small button per room you have reached. Title screen only — CONTINUE stays the one-tap path.
function buildLevelSelect(best) {
  const row = $('levelsel'); row.textContent = '';
  if (!(best > 1)) return;
  const lv = loadProgress().levels || {};
  for (let n = 1; n <= best; n++) { const b = document.createElement('button'); b.className = 'lvl'; const r = lv[n]; b.textContent = n; b.title = 'Start at room ' + n + (r ? ' — best ' + mmss(r.time) + ', grade ' + r.grade + (r.secretsTotal ? ', secrets ' + r.secrets + '/' + r.secretsTotal : '') : ''); b.addEventListener('click', () => start(n)); row.appendChild(b); }
}
function copyResult() {
  const text = shareText(), btn = $('copybtn');
  const done = () => { btn.textContent = 'COPIED'; setTimeout(() => { btn.textContent = 'COPY RESULT'; }, 1500); };
  const fallback = () => { const ta = $('copysink'); ta.value = text; ta.select(); ta.setSelectionRange(0, text.length); try { document.execCommand('copy'); } catch (e) {} done(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
  else fallback();
}
function endGame() {
  G.state = 'lost'; G.finishedAt = performance.now();
  const secs = G.runT.toFixed(0);
  showOverlay('lost');
  $('ovsub').textContent = 'YOU HAVE BEEN CUDDLED TO DEATH';
  $('ovtext').textContent = 'You reached LEVEL ' + G.level + ' (' + G.levelName + ') and put ' + G.totalKills + ' cats to sleep in ' + secs + ' seconds before the fur took you. Keep your distance and back up while you spray.';
}
function victory() {
  recordLevel();
  G.state = 'won'; G.finishedAt = performance.now();
  const secs = G.runT.toFixed(0);
  showOverlay('won');
  $('ovsub').textContent = 'THE HOUSE IS QUIET';
  $('ovtext').textContent = 'Twelve rooms, ' + G.totalKills + ' cats napping, ' + secs + ' seconds. Bastet sleeps. Somewhere a food bowl is empty, and they will all wake up hungry.';
  SFX.win();
}

// ---------- render ----------
const STATUS_ICON = { tangled: 'yarn', bagged: 'bag', boxed: 'box', dazed: 'catnip', eating: 'treats' };   // 'scared' draws nothing — the cat running is the tell
const cv = $('view'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const sbuf = document.createElement('canvas'); sbuf.width = W; sbuf.height = H; const sctx = sbuf.getContext('2d'); sctx.imageSmoothingEnabled = false;
function render() {
  const p = G.player, fogK = 13 * (1 - 0.85 * G.fog), lamp = G.fog >= 0.3 ? 0.6 : 0.2;
  // vacuum kick: shove the whole frame ±2 px for 0.4 s (never when reduced flash is on — G.shake is only ever set then)
  const shaking = G.shake > 0 && !G.reducedFx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (shaking) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.setTransform(1, 0, 0, 1, Math.round(Math.sin(G.shake * 90) * 2), Math.round(Math.cos(G.shake * 71) * 2)); }
  let gr = ctx.createLinearGradient(0, 0, 0, H / 2); gr.addColorStop(0, G.sky); gr.addColorStop(1, '#0d0a0c'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H / 2);
  gr = ctx.createLinearGradient(0, H / 2, 0, H); gr.addColorStop(0, '#141012'); gr.addColorStop(1, G.floor); ctx.fillStyle = gr; ctx.fillRect(0, H / 2, W, H / 2);
  const zb = G.zbuf;
  for (let x = 0; x < W; x++) {
    const camX = 2 * x / W - 1, rdx = p.dirX + p.planeX * camX, rdy = p.dirY + p.planeY * camX;
    let mapX = p.x | 0, mapY = p.y | 0;
    const dX = rdx === 0 ? 1e30 : Math.abs(1 / rdx), dY = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
    let stepX, stepY, sdX, sdY;
    if (rdx < 0) { stepX = -1; sdX = (p.x - mapX) * dX; } else { stepX = 1; sdX = (mapX + 1 - p.x) * dX; }
    if (rdy < 0) { stepY = -1; sdY = (p.y - mapY) * dY; } else { stepY = 1; sdY = (mapY + 1 - p.y) * dY; }
    let side = 0, hit = 0, guard = 0;
    while (!hit && guard++ < 128) { if (sdX < sdY) { sdX += dX; mapX += stepX; side = 0; } else { sdY += dY; mapY += stepY; side = 1; } hit = wallAt(mapX, mapY); }
    const perp = side === 0 ? sdX - dX : sdY - dY;
    zb[x] = perp;
    const lineH = H / perp, top = H / 2 - lineH / 2;
    let wallX = side === 0 ? p.y + perp * rdy : p.x + perp * rdx; wallX -= Math.floor(wallX);
    let texX = (wallX * TEX) | 0; if ((side === 0 && rdx < 0) || (side === 1 && rdy > 0)) texX = TEX - 1 - texX;
    ctx.drawImage(hit === EXIT_ID ? (G.cleared ? texExitOpen : texExit) : hit === DOOR_ID ? (G.hasKey ? texDoorOpen : texDoor) : (WALLTEX[hit] || TEXTURES.stone), texX, 0, 1, TEX, x, top, 1, lineH);
    const beam = 1 - lamp * Math.max(0, 1 - Math.abs(camX) * 1.5);   // flashlight: the centre of the view stays brighter in dark levels
    const dark = (hit === EXIT_ID && G.cleared) ? Math.min(0.4, perp / 30) : Math.min(0.92, (perp / fogK) * beam + (side ? 0.18 : 0));
    if (dark > 0.02) { ctx.fillStyle = 'rgba(0,0,0,' + dark.toFixed(2) + ')'; ctx.fillRect(x, top, 1, lineH); }
  }
  const sprites = [];
  for (const c of G.cats) sprites.push({ x: c.x, y: c.y, d: c.dist, img: window.CatDoomSprites.get(c.type, c.alive ? (c.hit > 0 ? 'hit' : 'normal') : 'asleep', c.alive ? (c.facing || 'front') : 'front'), scale: c.alive ? c.t.scale : c.t.scale * 0.9, bob: c.alive && c.awake ? Math.abs(Math.sin(G.t * 10 + c.phase)) * 2 : 0, z: 0, alpha: c.t.alpha || 1 });
  for (const k of G.pickups) if (!k.taken && PICK_SPRITES[k.kind]) sprites.push({ x: k.x, y: k.y, d: k.dist, img: PICK_SPRITES[k.kind], scale: 0.4, bob: Math.sin(G.t * 3 + k.x) * 1.5, z: 0, alpha: 1 });
  for (const s of G.shots) sprites.push({ x: s.x, y: s.y, d: Math.hypot(s.x - p.x, s.y - p.y), img: texHairball, scale: 0.22, bob: 0, z: 0.35, alpha: 1 });
  for (const s of G.throws) { const f = 1 - s.life / s.total; sprites.push({ x: s.x, y: s.y, d: Math.hypot(s.x - p.x, s.y - p.y), img: TOOL_SPRITES[s.kind], scale: 0.3, bob: 0, z: 0.2 + Math.sin(f * Math.PI) * 0.45, alpha: 1 }); }
  for (const it of G.items) if (it.kind === 'dust') sprites.push({ x: it.x, y: it.y, d: Math.hypot(it.x - p.x, it.y - p.y), img: texDust, scale: 1.2 + (1.2 - it.t), bob: 0, z: 0.1, alpha: Math.min(1, it.t) });
  for (const it of G.items) { if (it.kind === 'dust') continue; const dot = it.sub === 'laserdot'; sprites.push({ x: it.x, y: it.y, d: Math.hypot(it.x - p.x, it.y - p.y), img: TOOL_SPRITES[it.sub || it.kind], scale: dot ? 0.2 : it.kind === 'box' ? 0.7 : 0.35, bob: dot ? 0 : it.kind === 'lure' ? Math.sin(G.t * 5) * 1.5 : 0, z: 0, alpha: dot ? Math.min(0.95, it.t) : it.t < 1 ? it.t : 1 }); }
  for (const c of G.cats) if (c.alive && c.splash > 0) sprites.push({ x: c.x, y: c.y, d: c.dist - 0.02, img: texSplash, scale: c.t.scale * 0.7, bob: 0, z: c.t.scale * 0.25, alpha: Math.min(1, c.splash * 4) });
  for (const c of G.cats) if (c.alive && c.status) { const k = c.status.kind, img = TOOL_SPRITES[STATUS_ICON[k]]; if (!img) continue; sprites.push({ x: c.x, y: c.y, d: c.dist - 0.01, img, scale: k === 'boxed' ? c.t.scale * 1.1 : k === 'bagged' ? 0.3 : 0.32, bob: k === 'dazed' ? Math.sin(G.t * 4 + c.phase) * 2 : 0, z: k === 'bagged' ? c.t.scale * 0.55 : k === 'dazed' ? c.t.scale * 0.9 : k === 'tangled' ? 0.05 : k === 'eating' ? 0.02 : 0, alpha: 1 }); }
  for (const k of G.pickups) if (!k.taken && k.kind === 'key') sprites.push({ x: k.x, y: k.y, d: k.dist, img: texKey, scale: 0.4, bob: Math.sin(G.t * 4) * 2, z: 0.1, alpha: 1 });
  for (const b of G.barrels) if (b.alive) sprites.push({ x: b.x, y: b.y, d: Math.hypot(b.x - p.x, b.y - p.y), img: texBarrel, scale: 0.6, bob: 0, z: 0, alpha: 1 });
  for (const k of G.pickups) if (!k.taken && TOOLS[k.kind]) sprites.push({ x: k.x, y: k.y, d: k.dist, img: TOOL_SPRITES[k.kind], scale: 0.35, bob: Math.sin(G.t * 3 + k.y) * 1.5, z: 0, alpha: 1 });
  sprites.sort((a, b) => b.d - a.d);
  const invDet = 1 / (p.planeX * p.dirY - p.dirX * p.planeY);
  for (const s of sprites) {
    const sx = s.x - p.x, sy = s.y - p.y;
    const tx = invDet * (p.dirY * sx - p.dirX * sy), ty = invDet * (-p.planeY * sx + p.planeX * sy);
    if (ty <= 0.15) continue;
    const screenX = (W / 2) * (1 + tx / ty), fullH = H / ty, sh = fullH * s.scale, sw = sh;
    const top = H / 2 + fullH / 2 - sh - s.bob - s.z * fullH;
    const x0 = Math.floor(screenX - sw / 2), x1 = Math.ceil(screenX + sw / 2);
    if (x1 < 0 || x0 >= W) continue;
    // Draw the visible columns into a scratch buffer, shade only those pixels, then composite. Shading on the
    // main canvas would darken the wall inside the sprite's box too and reveal cats behind walls.
    const rx0 = Math.max(0, x0), rx1 = Math.min(W, x1), ry0 = Math.max(0, Math.floor(top)), ry1 = Math.min(H, Math.ceil(top + sh));
    if (rx1 <= rx0 || ry1 <= ry0) continue;
    sctx.clearRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
    let drew = false;
    for (let x = rx0; x < rx1; x++) { if (ty >= zb[x]) continue; const texX = Math.min(TEX - 1, ((x - x0) / sw * TEX) | 0); sctx.drawImage(s.img, texX, 0, 1, TEX, x, top, 1, sh); drew = true; }
    if (!drew) continue;
    const dark = Math.min(0.85, (ty / fogK) * (1 - lamp * Math.max(0, 1 - Math.abs(tx / ty) * 1.5)));
    if (dark > 0.05) { sctx.save(); sctx.globalCompositeOperation = 'source-atop'; sctx.fillStyle = 'rgba(0,0,0,' + dark.toFixed(2) + ')'; sctx.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0); sctx.restore(); }
    if (s.alpha < 1) ctx.globalAlpha = s.alpha * (0.7 + 0.3 * Math.sin(G.t * 6 + s.x));
    ctx.drawImage(sbuf, rx0, ry0, rx1 - rx0, ry1 - ry0, rx0, ry0, rx1 - rx0, ry1 - ry0);
    ctx.globalAlpha = 1;
  }
  // weapon
  const bobX = Math.sin(G.walkBob) * 5, bobY = Math.abs(Math.cos(G.walkBob)) * 4 + G.recoil * 14;
  const bx = W / 2 + 40 + bobX, by = H - 4 + bobY;
  ctx.save(); ctx.translate(bx, by);
  ctx.fillStyle = '#e8eef2'; ctx.fillRect(-16, -48, 32, 56); ctx.fillStyle = '#3ab0ff'; ctx.fillRect(-13, -30, 26, 34);
  ctx.fillStyle = '#9fdcff'; ctx.fillRect(-13, -30 + (34 - 34 * (p.water / p.maxWater)), 26, 2);
  ctx.fillStyle = '#c33'; ctx.fillRect(-10, -66, 20, 20); ctx.fillRect(-10, -62, 30, 7); ctx.fillStyle = '#a22'; ctx.fillRect(-14, -50, 12, 16);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 7px monospace'; ctx.fillText('NO', -8, -18); ctx.fillText('CAT', -10, -10);
  ctx.restore();
  if (G.sprayFx > 0) { ctx.fillStyle = 'rgba(120,200,255,' + (0.9 * G.sprayFx).toFixed(2) + ')'; for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 - 0.5 + i * 0.075, r = 20 + (1 - G.sprayFx) * 70 + (i * 7) % 20; ctx.fillRect(W / 2 + 20 + Math.cos(a) * r * 0.5 + bobX, by - 60 + Math.sin(a) * r * 0.9, 2, 2); } }
  ctx.fillStyle = G.hitMark > 0 ? 'rgba(120,230,255,1)' : 'rgba(255,255,255,.7)'; if (G.hitMark > 0) { ctx.fillRect(W / 2 - 7, H / 2 - 1, 3, 3); ctx.fillRect(W / 2 + 5, H / 2 - 1, 3, 3); }
  ctx.fillRect(W / 2 - 4, H / 2, 3, 1); ctx.fillRect(W / 2 + 2, H / 2, 3, 1); ctx.fillRect(W / 2, H / 2 - 4, 1, 3); ctx.fillRect(W / 2, H / 2 + 2, 1, 3);
  if (G.hurtFlash > 0) {
    if (G.reducedFx) { ctx.fillStyle = 'rgba(220,30,30,' + (0.6 * G.hurtFlash).toFixed(2) + ')'; ctx.fillRect(0, 0, W, 6); ctx.fillRect(0, H - 6, W, 6); ctx.fillRect(0, 0, 6, H); ctx.fillRect(W - 6, 0, 6, H); }
    else { ctx.fillStyle = 'rgba(220,30,30,' + (0.45 * G.hurtFlash).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  }
  if (G.wailT > 0 && !G.reducedFx) { ctx.fillStyle = 'rgba(160,60,220,' + (0.12 * Math.min(1, G.wailT)).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  // exit guidance once the level is clear: a green marker over the door when it is in view, an edge arrow when it is not
  if (G.cleared && G.exit) {
    const ex = G.exit[0] + 0.5 - p.x, ey = G.exit[1] + 0.5 - p.y;
    const etx = invDet * (p.dirY * ex - p.dirX * ey), ety = invDet * (-p.planeY * ex + p.planeX * ey);
    const pulse = 0.6 + 0.4 * Math.sin(G.t * 6); ctx.fillStyle = 'rgba(77,255,106,' + pulse.toFixed(2) + ')';
    if (ety > 0.1 && Math.abs(etx / ety) < 1) { const sx = (W / 2) * (1 + etx / ety); ctx.beginPath(); ctx.moveTo(sx, 48); ctx.lineTo(sx - 6, 36); ctx.lineTo(sx + 6, 36); ctx.fill(); ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center'; ctx.fillText('EXIT', sx, 33); ctx.textAlign = 'left'; }
    else { const right = etx > 0, x = right ? W - 6 : 6, y = H / 2 - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (right ? -12 : 12), y - 8); ctx.lineTo(x + (right ? -12 : 12), y + 8); ctx.fill(); ctx.font = 'bold 7px monospace'; ctx.textAlign = right ? 'right' : 'left'; ctx.fillText('EXIT', x + (right ? -14 : 14), y + 3); ctx.textAlign = 'left'; }
  }
  // boss bar
  const boss = G.state === 'playing' && G.cats.find(c => c.t.boss && c.alive && c.awake);
  if (boss) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(60, 6, 200, 10); ctx.fillStyle = boss.enraged ? '#ff3030' : '#d4a017'; ctx.fillRect(62, 8, 196 * Math.max(0, boss.hp / boss.maxHp), 6); ctx.fillStyle = '#fff'; ctx.font = 'bold 7px monospace'; ctx.fillText(boss.t.name, 62, 24); }
  if (G.levelFlash > 0) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, G.levelFlash).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  if (G.paused) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', W / 2, H / 2 - 4); ctx.font = '8px monospace'; ctx.fillText('P / ESC or the PAUSE button to resume', W / 2, H / 2 + 12); ctx.textAlign = 'left'; }
  if (G.introT > 0 && G.state === 'playing') {
    const a = Math.min(1, G.introT); ctx.fillStyle = 'rgba(0,0,0,' + (0.7 * a).toFixed(2) + ')'; ctx.fillRect(0, 60, W, G.lastCard ? 88 : 74);
    ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.fillStyle = '#ff5a2b'; ctx.font = 'bold 10px monospace'; ctx.fillText('LEVEL ' + G.level, W / 2, 76);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace'; ctx.fillText(G.levelName.toUpperCase(), W / 2, 98);
    ctx.fillStyle = '#ddd'; ctx.font = '9px monospace';
    const lines = [], words = G.subtitle.split(' '); let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > W - 16 && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    const shown = lines.slice(0, 2); shown.forEach((l, i) => ctx.fillText(l, W / 2, 114 + i * 11));
    if (G.lastCard) { ctx.fillStyle = '#ffd166'; ctx.font = 'bold 9px monospace'; ctx.fillText(G.lastCard, W / 2, 114 + Math.max(1, shown.length) * 11 + 3); }
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }
  if (G.showMap && G.state === 'playing') {
    const cs = MW > 22 ? 2 : 3, ox = W - MW * cs - 4, oy = 4;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(ox - 2, oy - 2, MW * cs + 4, MH * cs + 4);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const w = MAP[y * MW + x]; if (!w) continue; ctx.fillStyle = w === EXIT_ID ? (G.cleared ? '#4dff6a' : '#c33') : w === DOOR_ID ? (G.hasKey ? '#4dff6a' : '#ffd166') : '#8a7a70'; ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs); }
    for (const b of G.barrels) if (b.alive) { ctx.fillStyle = '#d8c8a0'; ctx.fillRect(ox + b.x * cs - 1, oy + b.y * cs - 1, 2, 2); }
    for (const sc of G.secrets) if (sc.found) { ctx.fillStyle = '#ffd166'; ctx.fillRect(ox + sc.x * cs, oy + sc.y * cs, cs, cs); }
    for (const c of G.cats) { ctx.fillStyle = c.alive ? (c.awake ? '#ff4040' : '#ffa040') : '#5aa'; const big = c.alive && G.huntCalled && Math.sin(G.t * 8) > 0; ctx.fillRect(ox + c.x * cs - (big ? 2 : 1), oy + c.y * cs - (big ? 2 : 1), big ? 4 : 2, big ? 4 : 2); }
    for (const k of G.pickups) if (!k.taken) { ctx.fillStyle = k.kind === 'water' ? '#3ab0ff' : k.kind === 'tuna' ? '#f7b' : '#ffd166'; ctx.fillRect(ox + k.x * cs - 1.5, oy + k.y * cs - 0.5, 3, 1); ctx.fillRect(ox + k.x * cs - 0.5, oy + k.y * cs - 1.5, 1, 3); }
    ctx.fillStyle = '#8f8'; ctx.fillRect(ox + p.x * cs - 1, oy + p.y * cs - 1, 3, 3);
    ctx.strokeStyle = '#8f8'; ctx.beginPath(); ctx.moveTo(ox + p.x * cs, oy + p.y * cs); ctx.lineTo(ox + (p.x + p.dirX * 2) * cs, oy + (p.y + p.dirY * 2) * cs); ctx.stroke();
  }
}
function renderHud() {
  const p = G.player;
  $('hpbar').firstElementChild.style.width = p.hp + '%'; $('hpnum').textContent = p.hp | 0;
  $('waterbar').firstElementChild.style.width = (p.water / p.maxWater * 100) + '%'; $('waternum').textContent = p.water;
  $('cats').textContent = G.kills + '/' + G.cats.length; $('level').textContent = G.level + (G.procedural ? '*' : '');
  for (const k in TOOLS) { const b = TOOL_BTN[k]; const on = G.level >= TOOLS[k].unlock && G.state !== 'title'; b.hidden = !on; if (on) { b.querySelector('.cnt').textContent = G.tools[k]; b.classList.toggle('empty', G.tools[k] <= 0); } }
  $('tools').hidden = !Object.keys(TOOLS).some(k => G.level >= TOOLS[k].unlock && G.state !== 'title');
}
const TOOL_BTN = {};
for (const k in TOOLS) {
  const t = TOOLS[k], b = document.createElement('button'); b.className = 'tool'; b.dataset.tool = k; b.hidden = true;
  b.innerHTML = '<span class="ico">' + t.icon + '</span><span class="lbl">' + t.label + '</span><span class="cnt">0</span><span class="key">' + t.key.replace('Digit', '') + '</span>';
  b.addEventListener('pointerdown', e => { e.preventDefault(); audio(); useTool(k); b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 120); });
  b.addEventListener('contextmenu', e => e.preventDefault());
  $('tools').appendChild(b); TOOL_BTN[k] = b;
}

// ---------- input ----------
let dragTurn = 0;
function bindButton(b) {
  const act = b.dataset.act; let downAt = 0;
  const press = e => { e.preventDefault(); audio(); input[act] = true; b.classList.add('pressed'); downAt = G.t; try { b.setPointerCapture(e.pointerId); } catch (_) {} if (act === 'fire' && G.state === 'playing') fire(); };
  const release = () => { if (!b.classList.contains('pressed')) return; b.classList.remove('pressed'); input[act] = false; if (act !== 'fire') { const held = G.t - downAt; if (held < 0.15) tapLeft[act] = Math.min(0.6, tapLeft[act] + 0.15 - held); } };
  b.addEventListener('pointerdown', press); b.addEventListener('pointerup', release); b.addEventListener('pointercancel', release); b.addEventListener('lostpointercapture', release);
  b.addEventListener('contextmenu', e => e.preventDefault());
}
document.querySelectorAll('.btn').forEach(bindButton);
// WASD and the arrow keys are interchangeable: W/Up forward, S/Down back, A/Left turn, D/Right turn.
// Strafe with Q/E, or hold Shift with a turn key. Space / F / Ctrl spray. 1–4 use tools.
// Like 1993: W/S and Up/Down move, A/D and Left/Right TURN (there is no mouse-look, so turning lives on the easy keys). Q/E strafe, or Shift + a turn key. Space / F / Ctrl spray. 1–7 tools.
const KEYS = { KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'tl', KeyD: 'tr', ArrowLeft: 'tl', ArrowRight: 'tr', KeyQ: 'sl', KeyE: 'sr', Space: 'fire', ControlLeft: 'fire', ControlRight: 'fire', KeyF: 'fire' };
const STRAFE_OF = { tl: 'sl', tr: 'sr' }, heldKeys = {}, keyDownAt = {};
const KEY_BY_KEY = { p: 'KeyP', Escape: 'Escape', w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', q: 'KeyQ', e: 'KeyE', f: 'KeyF', ' ': 'Space', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Enter: 'Enter', '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4', '5': 'Digit5', '6': 'Digit6', '7': 'Digit7' };
const keyCode = e => e.code || KEY_BY_KEY[e.key] || KEY_BY_KEY[(e.key || '').toLowerCase()] || '';
window.addEventListener('keydown', e => {
  const code = keyCode(e); let a = KEYS[code];
  if (a) { if (e.shiftKey && STRAFE_OF[a]) a = STRAFE_OF[a]; if (heldKeys[code] && heldKeys[code] !== a) input[heldKeys[code]] = false; if (!heldKeys[code]) keyDownAt[code] = G.t; heldKeys[code] = a; input[a] = true; if (a === 'fire' && !e.repeat && G.state === 'playing') fire(); e.preventDefault(); }
  for (const k in TOOLS) if (code === TOOLS[k].key && !e.repeat) useTool(k);
  if (code === 'Enter' && G.state !== 'playing') start(startLevel);
  if ((code === 'KeyP' || code === 'Escape') && !e.repeat && G.state === 'playing') togglePause();
});
window.addEventListener('keyup', e => { const code = keyCode(e), a = heldKeys[code] || KEYS[code]; if (a) { input[a] = false; if (a !== 'fire') { const held = G.t - (keyDownAt[code] || G.t); if (held < 0.15) tapLeft[a] = Math.min(0.6, tapLeft[a] + 0.15 - held); } delete heldKeys[code]; e.preventDefault(); } });
let dragging = false, lastX = 0;
$('stage').addEventListener('pointerdown', e => { if (e.target.closest('#overlay')) return; dragging = true; lastX = e.clientX; audio(); });
window.addEventListener('pointermove', e => { if (!dragging) return; dragTurn += (e.clientX - lastX) * 0.006; lastX = e.clientX; });
window.addEventListener('pointerup', () => dragging = false); window.addEventListener('pointercancel', () => dragging = false);
function togglePause(force) { G.paused = force === undefined ? !G.paused : !!force; $('pausebtn').classList.toggle('on', G.paused); $('pausebtn').textContent = G.paused ? 'RESUME' : 'PAUSE'; for (const k in input) input[k] = false; if (AUD()) try { AUD().setMuted(muted || G.paused); } catch (e) {} }
$('pausebtn').addEventListener('click', () => { if (G.state === 'playing') togglePause(); });
$('mapbtn').addEventListener('click', () => { G.showMap = !G.showMap; $('mapbtn').classList.toggle('on', G.showMap); }); $('mapbtn').classList.add('on');
$('mutebtn').addEventListener('click', () => { muted = !muted; $('mutebtn').classList.toggle('on', !muted); $('mutebtn').textContent = muted ? 'MUTED' : 'SOUND'; if (AUD()) try { AUD().setMuted(muted); } catch (e) {} }); $('mutebtn').classList.add('on');
const startLevel = Math.max(1, Math.min(LAST_LEVEL, parseInt(new URLSearchParams(location.search).get('level') || '1', 10) || 1));
function start(level) { document.body.classList.remove('title'); reset(level || startLevel); G.paused = false; $('pausebtn').classList.remove('on'); $('pausebtn').textContent = 'PAUSE'; G.state = 'playing'; $('overlay').hidden = true; const a = audio(); if (AUD()) try { AUD().start(a, muted); } catch (e) { console.warn(e); } }
$('startbtn').addEventListener('click', () => start(startLevel));
$('contbtn').addEventListener('click', () => start(parseInt($('contbtn').dataset.level, 10) || 1));
$('copybtn').addEventListener('click', copyResult);
try { G.skill = SKILLS[localStorage.getItem('catdoom.skill')] ? localStorage.getItem('catdoom.skill') : 'cat'; } catch (e) {}
for (const k in SKILLS) { const b = document.createElement('button'); b.dataset.skill = k; b.innerHTML = SKILLS[k].label + '<small>' + SKILLS[k].blurb + '</small>'; b.addEventListener('click', () => { G.skill = k; try { localStorage.setItem('catdoom.skill', k); } catch (e) {} for (const o of document.querySelectorAll('#skillsel button')) o.classList.toggle('on', o.dataset.skill === k); }); $('skillsel').appendChild(b); }
$('roomtoggle').addEventListener('click', () => { const open = $('levelsel').hidden; $('levelsel').hidden = !open; $('roomtoggle').classList.toggle('open', open); $('roomtoggle').textContent = open ? 'START FROM AN EARLIER ROOM ▴' : 'START FROM AN EARLIER ROOM ▾'; });
showOverlay('title');
// reduced-flash option (accessibility): vignette instead of full-screen flashes
try { G.reducedFx = localStorage.getItem('catdoom.reducedFx') === '1'; } catch (e) {}
$('fxbtn').classList.toggle('on', !G.reducedFx); $('fxbtn').textContent = G.reducedFx ? 'FLASH OFF' : 'FLASH';
$('fxbtn').addEventListener('click', () => { G.reducedFx = !G.reducedFx; try { localStorage.setItem('catdoom.reducedFx', G.reducedFx ? '1' : '0'); } catch (e) {} $('fxbtn').classList.toggle('on', !G.reducedFx); $('fxbtn').textContent = G.reducedFx ? 'FLASH OFF' : 'FLASH'; });
window.addEventListener('blur', () => { for (const k in input) input[k] = false; });

// ---------- loop ----------
let last = performance.now(), frames = 0, fps = 0, fpsT = 0;
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); render(); renderHud(); frames++; fpsT += dt; if (fpsT >= 1) { fps = frames; frames = 0; fpsT = 0; } requestAnimationFrame(loop); }
window.addEventListener('load', () => { reset(startLevel); requestAnimationFrame(loop); });

// The public surface level files need. Everything else is the debug seam below, which the publish script strips from the public build.
window.CatDoom = { registerLevel, LEVELS, CAT_TYPES, LAST_LEVEL };
})();
