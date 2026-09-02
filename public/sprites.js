// CatDoom cat sprites. Procedural pixel art, one 64x64 canvas per (type, mode, facing).
// modes: normal | hit | asleep.  facings: front (looking at the player) | left | right | back.
// The engine asks for a facing; get() falls back to 'front' for any facing that has no dedicated drawing yet.
(function () {
  'use strict';
  let CAT_TYPES = null, makeTex = null, TEX = 64, SPRITES = {};
  const FACINGS = ['front', 'left', 'right', 'back'];
  function drawCat(g, key, mode, facing) {
    const t = CAT_TYPES[key], S = TEX; g.clearRect(0, 0, S, S);
    const hit = mode === 'hit';
    const fur = hit ? '#ffffff' : t.fur, stripe = hit ? '#ffffff' : t.stripe, belly = hit ? '#ffffff' : t.belly;
    if (mode === 'asleep') {
      g.fillStyle = fur; g.beginPath(); g.ellipse(32, 50, 26, 12, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = stripe; g.beginPath(); g.ellipse(32, 46, 22, 5, 0, Math.PI, 0); g.fill();
      g.fillStyle = fur; g.beginPath(); g.arc(44, 42, 10, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(37, 36); g.lineTo(39, 26); g.lineTo(45, 34); g.fill(); g.beginPath(); g.moveTo(47, 34); g.lineTo(52, 26); g.lineTo(53, 36); g.fill();
      g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(40, 42); g.lineTo(44, 43); g.moveTo(47, 43); g.lineTo(51, 42); g.stroke();
      g.fillStyle = '#eee'; g.font = 'bold 10px monospace'; g.fillText('z', 54, 26); g.font = 'bold 8px monospace'; g.fillText('z', 58, 18);
      return;
    }
    if (facing === 'back') { drawBack(g, key, hit, fur, stripe); return; }
    if (facing === 'left' || facing === 'right') {
      // One profile is authored facing left; 'right' is the same drawing mirrored about the canvas centre.
      if (facing === 'right') { g.save(); g.translate(S, 0); g.scale(-1, 1); }
      drawSide(g, key, hit, fur, stripe, belly);
      if (facing === 'right') g.restore();
      return;
    }
    if (key === 'zoomie') { g.strokeStyle = hit ? '#fff' : '#9ad'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(2, 30 + i * 8); g.lineTo(14, 30 + i * 8); g.stroke(); } }
    g.fillStyle = fur; g.beginPath(); g.ellipse(32, 46, 16, 15, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = belly; g.beginPath(); g.ellipse(32, 50, 8, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = fur; g.fillRect(20, 52, 7, 11); g.fillRect(37, 52, 7, 11);
    g.strokeStyle = fur; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(46, 50); g.quadraticCurveTo(60, 44, 56, 30); g.stroke();
    const headR = key === 'kitten' ? 17 : 15;
    g.fillStyle = fur; g.beginPath(); g.arc(32, 24, headR, 0, Math.PI * 2); g.fill();
    const earH = key === 'sphynx' ? -4 : 2;
    g.beginPath(); g.moveTo(19, 16); g.lineTo(21, earH); g.lineTo(30, 11); g.fill(); g.beginPath(); g.moveTo(45, 16); g.lineTo(43, earH); g.lineTo(34, 11); g.fill();
    g.fillStyle = hit ? '#fff' : '#e58aa0'; g.beginPath(); g.moveTo(21, 14); g.lineTo(22, earH + 4); g.lineTo(27, 11); g.fill(); g.beginPath(); g.moveTo(43, 14); g.lineTo(42, earH + 4); g.lineTo(37, 11); g.fill();
    if (key === 'sphynx') { g.strokeStyle = hit ? '#fff' : stripe; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(22, 14 + i * 3); g.lineTo(42, 14 + i * 3); g.stroke(); } }
    else { g.fillStyle = stripe; g.fillRect(29, 10, 2, 6); g.fillRect(33, 10, 2, 6); g.fillRect(25, 12, 2, 5); g.fillRect(37, 12, 2, 5); g.beginPath(); g.ellipse(32, 38, 12, 3, 0, 0, Math.PI * 2); g.fill(); }
    // eyes
    const eyeR = key === 'kitten' ? 6 : (key === 'sphynx' ? 3 : 4);
    const eyeC = hit ? '#fff' : (key === 'bastet' ? '#6ff' : key === 'ghost' ? '#e0f0ff' : key === 'sphynx' ? '#ffd040' : key === 'void' ? '#ffdd44' : '#8cff3a');
    g.fillStyle = eyeC; g.beginPath(); g.ellipse(26, 25, eyeR, eyeR + 0.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(38, 25, eyeR, eyeR + 0.5, 0, 0, Math.PI * 2); g.fill();
    if (key === 'bastet' && !hit) { g.fillStyle = 'rgba(100,255,255,.35)'; g.beginPath(); g.arc(26, 25, 9, 0, 6.3); g.fill(); g.beginPath(); g.arc(38, 25, 9, 0, 6.3); g.fill(); }
    g.fillStyle = '#000'; g.fillRect(25, 21, 2, 8); g.fillRect(37, 21, 2, 8);
    if (key !== 'kitten') { g.strokeStyle = hit ? '#fff' : stripe; g.lineWidth = 2; g.beginPath(); g.moveTo(21, 19); g.lineTo(29, 22); g.moveTo(43, 19); g.lineTo(35, 22); g.stroke(); }
    // nose + mouth
    g.fillStyle = '#e58aa0'; g.beginPath(); g.moveTo(30, 29); g.lineTo(34, 29); g.lineTo(32, 32); g.fill();
    if (key === 'wailer' || key === 'bastet') { g.fillStyle = '#200'; g.beginPath(); g.ellipse(32, 37, 6, 5, 0, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(27, 33); g.lineTo(29, 39); g.lineTo(30, 33); g.fill(); g.beginPath(); g.moveTo(34, 33); g.lineTo(35, 39); g.lineTo(37, 33); g.fill(); }
    else {
      g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(32, 32); g.lineTo(32, 34); g.moveTo(28, 35); g.quadraticCurveTo(32, 38, 36, 35); g.stroke();
      if (key !== 'kitten') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(29, 35); g.lineTo(30, 39); g.lineTo(31, 35); g.fill(); g.beginPath(); g.moveTo(33, 35); g.lineTo(34, 39); g.lineTo(35, 35); g.fill(); }
    }
    if (key === 'hurler') { g.fillStyle = '#6a5040'; g.beginPath(); g.arc(32, 38, 6, 0, 6.3); g.fill(); g.fillStyle = '#8a7060'; g.fillRect(29, 36, 2, 2); g.fillRect(33, 39, 2, 2); }
    if (key !== 'sphynx') { g.strokeStyle = '#ddd'; g.lineWidth = 1; g.beginPath(); g.moveTo(18, 29); g.lineTo(27, 31); g.moveTo(18, 33); g.lineTo(27, 33); g.moveTo(46, 29); g.lineTo(37, 31); g.moveTo(46, 33); g.lineTo(37, 33); g.stroke(); }
    if (key === 'matriarch') { g.fillStyle = hit ? '#fff' : '#f0c020'; g.beginPath(); g.moveTo(22, 12); g.lineTo(24, 2); g.lineTo(28, 9); g.lineTo(32, 0); g.lineTo(36, 9); g.lineTo(40, 2); g.lineTo(42, 12); g.fill(); g.fillStyle = '#c33'; g.fillRect(31, 6, 2, 2); }
    if (key === 'bastet') { g.fillStyle = hit ? '#fff' : '#1a1a1a'; g.fillRect(20, 36, 24, 3); g.fillStyle = '#6ff'; g.fillRect(31, 35, 3, 5); }
  }
  // ---- back: the cat walking away. Rump + raised tail, ears from behind, no face, belly hidden.
  function drawBack(g, key, hit, fur, stripe) {
    const wide = key === 'chonk' ? 3 : 0;
    if (key === 'zoomie') {   // trail comes toward the viewer, so it flares out low on both sides
      g.strokeStyle = hit ? '#fff' : '#9ad'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const y = 48 + i * 6; g.beginPath(); g.moveTo(2, y + 2); g.lineTo(13, y); g.moveTo(62, y + 2); g.lineTo(51, y); g.stroke(); }
    }
    // tail, up and behind the rump (drawn first so its base tucks under the body)
    g.strokeStyle = fur; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(38, 48); g.quadraticCurveTo(55, 42, 47, 15); g.stroke();
    if (key !== 'sphynx') { g.fillStyle = stripe; g.fillRect(46, 19, 5, 2); g.fillRect(49, 27, 5, 2); }
    g.fillStyle = fur; g.beginPath(); g.ellipse(32, 46, 17 + wide, 15, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(20 - wide, 52, 7, 11); g.fillRect(37 + wide, 52, 7, 11);   // hind legs, same baseline as the front sprite
    if (key === 'sphynx') { g.strokeStyle = hit ? '#fff' : stripe; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(20, 38 + i * 4); g.lineTo(44, 38 + i * 4); g.stroke(); } }
    else { g.fillStyle = stripe; g.fillRect(30, 33, 3, 24); g.fillRect(18 - wide, 40, 28 + wide * 2, 3); g.fillRect(17 - wide, 48, 30 + wide * 2, 3); }
    const headR = key === 'kitten' ? 17 : 15;
    g.fillStyle = fur; g.beginPath(); g.arc(32, 24, headR, 0, Math.PI * 2); g.fill();
    const earH = key === 'sphynx' ? -4 : 2;
    g.beginPath(); g.moveTo(19, 16); g.lineTo(21, earH); g.lineTo(30, 11); g.fill(); g.beginPath(); g.moveTo(45, 16); g.lineTo(43, earH); g.lineTo(34, 11); g.fill();
    // backs of the ears: the pink inner face is turned away from us
    g.fillStyle = hit ? '#fff' : stripe; g.beginPath(); g.moveTo(21, 15); g.lineTo(22, earH + 4); g.lineTo(27, 12); g.fill(); g.beginPath(); g.moveTo(43, 15); g.lineTo(42, earH + 4); g.lineTo(37, 12); g.fill();
    if (key === 'sphynx') { g.strokeStyle = hit ? '#fff' : stripe; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(23, 18 + i * 3); g.lineTo(41, 18 + i * 3); g.stroke(); } }
    else { g.fillStyle = stripe; g.fillRect(29, 10, 2, 6); g.fillRect(33, 10, 2, 6); g.fillRect(25, 12, 2, 5); g.fillRect(37, 12, 2, 5); g.fillRect(24, 31, 16, 3); }
    if (key === 'hurler') { g.fillStyle = fur; g.beginPath(); g.arc(44, 31, 7, 0, 6.3); g.fill(); g.strokeStyle = hit ? '#fff' : stripe; g.lineWidth = 1; g.beginPath(); g.arc(44, 31, 7, 0, 6.3); g.stroke(); }
    if (key === 'bastet' && !hit) { g.fillStyle = 'rgba(100,255,255,.35)'; g.beginPath(); g.arc(19, 26, 7, 0, 6.3); g.fill(); g.beginPath(); g.arc(45, 26, 7, 0, 6.3); g.fill(); }
    if (key === 'matriarch') { g.fillStyle = hit ? '#fff' : '#f0c020'; g.beginPath(); g.moveTo(22, 12); g.lineTo(24, 2); g.lineTo(28, 9); g.lineTo(32, 0); g.lineTo(36, 9); g.lineTo(40, 2); g.lineTo(42, 12); g.fill(); }
    if (key === 'bastet') { g.fillStyle = hit ? '#fff' : '#1a1a1a'; g.fillRect(20, 36, 24, 3); g.fillStyle = '#d4a017'; g.fillRect(29, 35, 6, 4); }
  }
  // ---- side: authored facing LEFT (head at the leading edge, tail trailing right). 'right' mirrors it.
  function drawSide(g, key, hit, fur, stripe, belly) {
    const wide = key === 'chonk' ? 3 : 0;
    if (key === 'zoomie') { g.strokeStyle = hit ? '#fff' : '#9ad'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const y = 48 + i * 6; g.beginPath(); g.moveTo(63, y); g.lineTo(52, y); g.stroke(); } }
    g.strokeStyle = fur; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(47, 46); g.quadraticCurveTo(62, 45, 57, 24); g.stroke();
    if (key !== 'sphynx') { g.fillStyle = stripe; g.fillRect(56, 28, 5, 2); g.fillRect(58, 36, 5, 2); }
    g.fillStyle = fur; g.beginPath(); g.ellipse(34, 45, 20 + wide, 13 + wide, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = belly; g.beginPath(); g.ellipse(34, 52 + wide, 15, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = hit ? '#fff' : stripe; g.fillRect(26, 52, 5, 11); g.fillRect(45, 52, 5, 11);   // far legs, offset for the stride
    g.fillStyle = fur; g.fillRect(18, 52, 7, 11); g.fillRect(38, 52, 7, 11);                     // near legs
    const headR = key === 'kitten' ? 17 : 15;
    g.beginPath(); g.arc(19, 26, headR, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(9, 31, 7, 6, 0, 0, Math.PI * 2); g.fill();   // muzzle
    const earH = key === 'sphynx' ? -4 : 2;
    g.fillStyle = hit ? '#fff' : stripe; g.beginPath(); g.moveTo(24, 15); g.lineTo(27, earH + 3); g.lineTo(33, 13); g.fill();   // far ear
    g.fillStyle = fur; g.beginPath(); g.moveTo(10, 16); g.lineTo(14, earH); g.lineTo(24, 12); g.fill();                         // near ear
    g.fillStyle = hit ? '#fff' : '#e58aa0'; g.beginPath(); g.moveTo(13, 15); g.lineTo(15, earH + 4); g.lineTo(20, 13); g.fill();
    if (key === 'sphynx') { g.strokeStyle = hit ? '#fff' : stripe; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(21, 29 + i * 3); g.lineTo(33, 29 + i * 3); g.stroke(); g.beginPath(); g.moveTo(12, 21 + i * 3); g.lineTo(24, 21 + i * 3); g.stroke(); } }
    else { g.fillStyle = stripe; for (let i = 0; i < 4; i++) g.fillRect(24 + i * 7, 34 + (i % 2), 2, 9); g.fillRect(16, 13, 2, 6); g.fillRect(21, 15, 2, 5); }
    const eyeR = key === 'kitten' ? 6 : (key === 'sphynx' ? 3 : 4);
    const eyeC = hit ? '#fff' : (key === 'bastet' ? '#6ff' : key === 'ghost' ? '#e0f0ff' : key === 'sphynx' ? '#ffd040' : key === 'void' ? '#ffdd44' : '#8cff3a');
    g.fillStyle = eyeC; g.beginPath(); g.ellipse(14, 25, eyeR, eyeR + 0.5, 0, 0, Math.PI * 2); g.fill();
    if (key === 'bastet' && !hit) { g.fillStyle = 'rgba(100,255,255,.35)'; g.beginPath(); g.arc(14, 25, 9, 0, 6.3); g.fill(); }
    g.fillStyle = '#000'; g.fillRect(12, 21, 2, 8);
    g.fillStyle = '#e58aa0'; g.beginPath(); g.moveTo(2, 28); g.lineTo(6, 27); g.lineTo(5, 31); g.fill();   // nose
    if (key === 'wailer' || key === 'bastet') {
      g.fillStyle = '#200'; g.beginPath(); g.moveTo(3, 31); g.lineTo(14, 33); g.lineTo(5, 38); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(5, 31); g.lineTo(7, 36); g.lineTo(8, 32); g.fill(); g.beginPath(); g.moveTo(10, 33); g.lineTo(11, 37); g.lineTo(13, 33); g.fill();
    } else {
      g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(3, 33); g.lineTo(11, 34); g.stroke();
      if (key !== 'kitten') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(6, 34); g.lineTo(7, 38); g.lineTo(8, 34); g.fill(); }
    }
    if (key === 'hurler') { g.fillStyle = '#6a5040'; g.beginPath(); g.arc(7, 36, 6, 0, 6.3); g.fill(); g.fillStyle = '#8a7060'; g.fillRect(4, 34, 2, 2); g.fillRect(8, 38, 2, 2); }
    if (key !== 'sphynx') { g.strokeStyle = '#ddd'; g.lineWidth = 1; g.beginPath(); g.moveTo(8, 29); g.lineTo(1, 25); g.moveTo(8, 31); g.lineTo(1, 31); g.moveTo(8, 32); g.lineTo(2, 36); g.stroke(); }
    if (key === 'matriarch') { g.fillStyle = hit ? '#fff' : '#f0c020'; g.beginPath(); g.moveTo(8, 15); g.lineTo(10, 4); g.lineTo(15, 11); g.lineTo(19, 2); g.lineTo(23, 11); g.lineTo(27, 5); g.lineTo(29, 15); g.fill(); g.fillStyle = '#c33'; g.fillRect(17, 8, 2, 2); }
    if (key === 'bastet') { g.fillStyle = hit ? '#fff' : '#1a1a1a'; g.fillRect(22, 34, 12, 4); g.fillStyle = '#6ff'; g.fillRect(23, 33, 3, 6); }
  }
  function build(types, mk, tex) {
    CAT_TYPES = types; makeTex = mk; TEX = tex; SPRITES = {};
    for (const k in CAT_TYPES) {
      SPRITES[k] = {};
      for (const mode of ['normal', 'hit', 'asleep']) {
        SPRITES[k][mode] = {};
        for (const f of FACINGS) SPRITES[k][mode][f] = (mode === 'asleep' && f !== 'front') ? null : makeTex(g => drawCat(g, k, mode, f));
      }
    }
    return SPRITES;
  }
  // Returns a canvas for the requested facing, or the front-facing one if that facing has not been drawn.
  function get(type, mode, facing) { const m = SPRITES[type] && SPRITES[type][mode]; if (!m) return null; return m[facing] || m.front; }
  window.CatDoomSprites = { build, get, FACINGS, drawCat };
})();
