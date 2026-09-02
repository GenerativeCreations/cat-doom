// Edit this for the newsletter / stream plug. Leave href empty for plain text. Loaded before the engine.
window.CATDOOM_PROMO = { text: 'A Generative Creations toy \u00b7 fan parody, not affiliated with id Software', href: '' };
(function () {
  const p = window.CATDOOM_PROMO; if (!p || !p.text) return;
  const el = document.getElementById('promo'); if (!el) return;
  if (p.href && /^https:\/\//.test(p.href)) { const a = document.createElement('a'); a.href = p.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = p.text; el.appendChild(a); }
  else el.textContent = p.text;
})();
