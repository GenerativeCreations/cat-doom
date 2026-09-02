// CatDoom ambient audio. The engine calls: start(audioContext, muted), stop(), setMuted(bool), setTheme({level, name, walls, fog, boss}).
// Everything is procedural WebAudio (no asset files, no network). Every call is safe in any order and never throws:
// if the audio graph dies the game keeps running in silence.
//
// Graph: [theme layer bus] -> muteGain -> masterGain (0.12) -> destination.
// One layer per theme; changing level builds a new layer and crossfades the two busses over ~2 s.
// Beds are LFO-driven (no per-frame JS); sparse events (pings, creaks, gongs, heartbeat, boss thump)
// are scheduled with self-rescheduling timers, never faster than 250 ms.
(function () {
  'use strict';

  var MASTER = 0.12;   // everything sits well under the SFX in engine.js (0.08–0.35 per hit)
  var ATTACK = 3.0;    // long fade-in on start
  var XFADE = 2.0;     // theme crossfade
  var RELEASE = 1.2;   // fade on stop (< 1.5 s budget)

  var ctx = null, muted = false, theme = null, playing = false;
  var master = null, muteGain = null, layers = [], noiseBuf = null, stopT = null;

  function warn(e) { try { if (window.console && window.console.warn) window.console.warn('[CatDoomAudio]', e && e.message || e); } catch (_) {} }
  function T() { var t = ctx && ctx.currentTime; return typeof t === 'number' ? t : 0; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ---------- AudioParam helpers (tolerant of partial implementations) ----------
  function setP(p, v, t) { if (!p) return; try { if (p.setValueAtTime) p.setValueAtTime(v, t); else p.value = v; } catch (_) {} }
  function ramp(p, v, t) { if (!p) return; try { if (p.linearRampToValueAtTime) p.linearRampToValueAtTime(v, t); else p.value = v; } catch (_) {} }
  function decay(p, t, dur) { if (!p) return; try { if (p.exponentialRampToValueAtTime) p.exponentialRampToValueAtTime(0.0001, t + dur); else p.value = 0; } catch (_) {} }
  function glide(p, v, t, dur) { if (!p) return; try { if (p.exponentialRampToValueAtTime) p.exponentialRampToValueAtTime(Math.max(v, 0.0001), t + dur); else p.value = v; } catch (_) {} }
  function rampTo(p, v, dur) {
    if (!p) return;
    var t = T(), cur = (typeof p.value === 'number') ? p.value : 0;
    try {
      if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);
      else if (p.cancelScheduledValues) { p.cancelScheduledValues(t); setP(p, cur, t); }
      else setP(p, cur, t);
    } catch (_) {}
    ramp(p, v, t + dur);
  }
  function conn(a, b) { try { if (a && b) a.connect(b); } catch (e) { warn(e); } }
  function kill(n) { try { if (n && n.stop) n.stop(); } catch (_) {} try { if (n && n.disconnect) n.disconnect(); } catch (_) {} }

  function noise() {
    if (noiseBuf) return noiseBuf;
    var sr = (ctx && ctx.sampleRate) || 44100;
    var buf = ctx.createBuffer(1, Math.floor(sr * 2), sr);
    var d = buf && buf.getChannelData && buf.getChannelData(0);
    if (d) { var last = 0; for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } }
    noiseBuf = buf;
    return buf;
  }

  // ---------- theme resolution ----------
  function has(a, v) { return !!a && a.indexOf && a.indexOf(v) >= 0; }
  function kindOf(t) {
    t = t || {};
    var lvl = +t.level || 0;
    var walls = (Object.prototype.toString.call(t.walls) === '[object Array]') ? t.walls : (t.walls ? [t.walls] : []);
    var w0 = String(walls[0] || '').toLowerCase();
    var fog = (typeof t.fog === 'number') ? t.fog : 0;
    var name = String(t.name || '').toLowerCase();
    if (lvl === 12 || has(walls, 'gold') || name.indexOf('shrine') >= 0 || name.indexOf('bastet') >= 0) return 'shrine';
    if (lvl === 11 || name.indexOf('cathedral') >= 0 || (w0 === 'stone' && has(walls, 'bone'))) return 'cathedral';
    if (lvl === 10 || name.indexOf('cat tree') >= 0) return 'arena';
    if (lvl === 8 || name.indexOf('attic') >= 0 || (w0 === 'wood' && fog >= 0.25 && fog < 0.5)) return 'attic';
    if (w0 === 'tile' || name.indexOf('kitchen') >= 0) return 'kitchen';
    if (w0 === 'stone' || w0 === 'metal' || w0 === 'bone' || fog >= 0.5) return 'deep';
    return 'house';
  }

  // ---------- layer ----------
  function Layer(kind, boss) {
    this.kind = kind; this.boss = !!boss; this.dead = false;
    this.nodes = []; this.timers = []; this.vol = 1;
    this.bus = ctx.createGain(); this.nodes.push(this.bus);
    setP(this.bus.gain, 0, T());
    conn(this.bus, muteGain);
  }
  Layer.prototype.keep = function (n) { if (n) this.nodes.push(n); return n; };
  Layer.prototype.osc = function (type, freq, det) {
    var o = ctx.createOscillator(), t = T();
    try { o.type = type; } catch (_) {}
    setP(o.frequency, freq, t); if (det) setP(o.detune, det, t);
    this.starts = this.starts || []; this.starts.push(o);
    return this.keep(o);
  };
  Layer.prototype.gain = function (v) { var g = ctx.createGain(); setP(g.gain, v, T()); return this.keep(g); };
  Layer.prototype.filt = function (type, f, q) {
    var b = ctx.createBiquadFilter(), t = T();
    try { b.type = type; } catch (_) {}
    setP(b.frequency, f, t); if (q != null) setP(b.Q, q, t);
    return this.keep(b);
  };
  Layer.prototype.noise = function () {
    var s = ctx.createBufferSource();
    try { s.buffer = noise(); s.loop = true; } catch (e) { warn(e); }
    this.starts = this.starts || []; this.starts.push(s);
    return this.keep(s);
  };
  // Slow modulation without any per-frame JS: osc -> gain -> param, around a base value.
  Layer.prototype.lfo = function (rate, depth, param, base) {
    setP(param, base, T());
    var o = this.osc('sine', rate), g = this.gain(depth);
    conn(o, g); conn(g, param);
    return o;
  };
  // Sparse randomised event: reschedules itself, never faster than 250 ms.
  Layer.prototype.every = function (minS, maxS, fn) {
    var self = this;
    var go = function () {
      if (self.dead) return;
      if (!muted) { try { fn(); } catch (e) { warn(e); } }
      self.timers.push(setTimeout(go, Math.max(250, rnd(minS, maxS) * 1000)));
    };
    self.timers.push(setTimeout(go, Math.max(250, rnd(minS * 0.4, maxS * 0.7) * 1000)));
  };
  // Steady pulse (bpm), same rules.
  Layer.prototype.pulse = function (bpm, fn) {
    var self = this, ms = Math.max(250, 60000 / bpm);
    var go = function () {
      if (self.dead) return;
      if (!muted) { try { fn(); } catch (e) { warn(e); } }
      self.timers.push(setTimeout(go, ms));
    };
    self.timers.push(setTimeout(go, ms));
  };
  Layer.prototype.startAll = function () {
    var s = this.starts || [], t = T();
    for (var i = 0; i < s.length; i++) { try { s[i].start(t); } catch (e) { warn(e); } }
    this.starts = null;
  };
  Layer.prototype.destroy = function () {
    if (this.dead) return;
    this.dead = true;
    for (var i = 0; i < this.timers.length; i++) clearTimeout(this.timers[i]);
    this.timers.length = 0;
    for (var j = 0; j < this.nodes.length; j++) kill(this.nodes[j]);
    this.nodes.length = 0;
    var k = layers.indexOf(this); if (k >= 0) layers.splice(k, 1);
  };

  // ---------- one-shot voices (transient; they hang off the layer bus and self-stop) ----------
  // Not tracked for teardown: destroying a layer disconnects its bus, so anything ringing goes silent.
  function ping(L) {                                     // basement/garage: distant metal
    var t = T(), f = rnd(520, 1500);
    var g = ctx.createGain(); setP(g.gain, 0.0001, t); ramp(g.gain, 0.05, t + 0.01); decay(g.gain, t + 0.01, 3.2);
    var o1 = ctx.createOscillator(); try { o1.type = 'sine'; } catch (_) {} setP(o1.frequency, f, t);
    var o2 = ctx.createOscillator(); try { o2.type = 'sine'; } catch (_) {} setP(o2.frequency, f * 2.76, t);
    var g2 = ctx.createGain(); setP(g2.gain, 0.3, t);
    conn(o1, g); conn(o2, g2); conn(g2, g); conn(g, L.bus);
    try { o1.start(t); o2.start(t); o1.stop(t + 3.6); o2.stop(t + 3.6); } catch (e) { warn(e); }
  }
  function creak(L) {                                    // attic: a beam settling
    var t = T(), dur = rnd(0.5, 1.3), f = rnd(210, 330);
    var s = ctx.createBufferSource();
    try { s.buffer = noise(); s.loop = true; } catch (e) { warn(e); }
    var b = ctx.createBiquadFilter(); try { b.type = 'bandpass'; } catch (_) {}
    setP(b.frequency, f, t); glide(b.frequency, f * 0.55, t, dur); setP(b.Q, 14, t);
    var g = ctx.createGain(); setP(g.gain, 0.0001, t); ramp(g.gain, 0.09, t + 0.08); decay(g.gain, t + 0.08, dur);
    conn(s, b); conn(b, g); conn(g, L.bus);
    try { s.start(t, rnd(0, 1.5)); s.stop(t + dur + 0.2); } catch (e) { warn(e); }
  }
  function gong(L) {                                     // shrine: struck bronze
    var t = T(), f = rnd(72, 112);
    var g = ctx.createGain(); setP(g.gain, 0.0001, t); ramp(g.gain, 0.07, t + 0.03); decay(g.gain, t + 0.03, 5);
    conn(g, L.bus);
    var parts = [[1, 1], [2.71, 0.4], [5.09, 0.16]];
    for (var i = 0; i < parts.length; i++) {
      var o = ctx.createOscillator(); try { o.type = 'sine'; } catch (_) {} setP(o.frequency, f * parts[i][0], t);
      var pg = ctx.createGain(); setP(pg.gain, parts[i][1], t);
      conn(o, pg); conn(pg, g);
      try { o.start(t); o.stop(t + 5.4); } catch (e) { warn(e); }
    }
  }
  function thump(L, f0, f1, peak, dur, at) {             // boss pulse / heartbeat
    var t = T() + (at || 0);
    var o = ctx.createOscillator(); try { o.type = 'sine'; } catch (_) {} setP(o.frequency, f0, t); glide(o.frequency, f1, t, dur * 0.6);
    var g = ctx.createGain(); setP(g.gain, 0.0001, t); ramp(g.gain, peak, t + 0.02); decay(g.gain, t + 0.02, dur);
    conn(o, g); conn(g, L.bus);
    try { o.start(t); o.stop(t + dur + 0.1); } catch (e) { warn(e); }
  }

  // ---------- the beds ----------
  var BEDS = {
    // brick / wood / wallpaper: soft detuned drone under a very slow filter sweep. 6 nodes.
    house: function (L) {
      var f = L.filt('lowpass', 260, 5);
      conn(L.osc('sawtooth', 55, -7), f); conn(L.osc('sawtooth', 55, 8), f); conn(f, L.bus);
      L.lfo(0.035, 150, f.frequency, 260);
      L.vol = 0.85;
    },
    // tile: brighter mains-ish hum plus a fridge compressor throbbing at 50 Hz. 8 nodes.
    kitchen: function (L) {
      var f = L.filt('lowpass', 1150, 0.9);
      conn(L.osc('sawtooth', 120, -4), f); conn(L.osc('sawtooth', 120, 5), f); conn(f, L.bus);
      var fridge = L.osc('sine', 50), fg = L.gain(0.45);
      conn(fridge, fg); conn(fg, L.bus);
      L.lfo(0.85, 0.32, fg.gain, 0.45);
      L.vol = 0.5;
    },
    // stone / metal / bone or heavy fog: sub drone, swelling wind, sparse metallic pings. 8 nodes.
    deep: function (L) {
      var sub = L.osc('sine', 36), sg = L.gain(0.8);
      conn(sub, sg); conn(sg, L.bus);
      var n = L.noise(), lp = L.filt('lowpass', 420, 0.7), wg = L.gain(0.13);
      conn(n, lp); conn(lp, wg); conn(wg, L.bus);
      L.lfo(0.045, 0.09, wg.gain, 0.13);
      L.every(7, 16, function () { ping(L); });
      L.vol = 1;
    },
    // wood + fog 0.3: low bed, dusty room tone, creaks every 6-12 s. 7 nodes.
    attic: function (L) {
      conn(L.osc('sine', 41.2), L.bus);
      var b = L.osc('triangle', 61.8), bg = L.gain(0.22);
      conn(b, bg); conn(bg, L.bus);
      var n = L.noise(), lp = L.filt('lowpass', 320, 0.6), ng = L.gain(0.05);
      conn(n, lp); conn(lp, ng); conn(ng, L.bus);
      L.every(6, 12, function () { creak(L); });
      L.vol = 0.95;
    },
    // Cat Tree: arena. The whole bed breathes on a slow 30 bpm pulse. 7 nodes.
    arena: function (L) {
      var f = L.filt('lowpass', 300, 3), pg = L.gain(0.5);
      conn(L.osc('sawtooth', 44, -5), f); conn(L.osc('sine', 66), f); conn(f, pg); conn(pg, L.bus);
      L.lfo(0.5, 0.45, pg.gain, 0.5);
      L.vol = 0.8;
    },
    // stone + bone, level 11: organ-like stacked fifths, very slow drift. 7 nodes.
    cathedral: function (L) {
      var f = L.filt('lowpass', 600, 0.9);
      conn(L.osc('sine', 55), f); conn(L.osc('sine', 82.5), f); conn(L.osc('triangle', 110), f); conn(f, L.bus);
      L.lfo(0.02, 250, f.frequency, 620);
      L.vol = 0.5;
    },
    // gold, level 12: dark bed, gong-like decaying tones, and a heartbeat at ~39 bpm. 7 nodes.
    shrine: function (L) {
      var f = L.filt('lowpass', 700, 0.8);
      conn(L.osc('sine', 43.65), f);
      var b = L.osc('triangle', 130.95), bg = L.gain(0.16);
      conn(b, bg); conn(bg, f); conn(f, L.bus);
      L.lfo(0.025, 200, f.frequency, 700);
      L.every(11, 21, function () { gong(L); });
      L.pulse(39, function () { thump(L, 52, 30, 0.09, 0.22, 0); thump(L, 46, 26, 0.06, 0.26, 0.23); });
      L.vol = 0.9;
    },
  };

  function build(desc) {
    var kind = kindOf(desc), boss = !!(desc && desc.boss);
    var L = new Layer(kind, boss);
    (BEDS[kind] || BEDS.house)(L);
    // Boss levels get a slow low pulse under the bed. The shrine's heartbeat already is one.
    if (boss && kind !== 'shrine') L.pulse(55, function () { thump(L, 42, 24, 0.085, 0.5, 0); });
    L.startAll();
    return L;
  }

  // ---------- graph lifecycle ----------
  function ensureMaster() {
    if (master) return true;
    master = ctx.createGain(); setP(master.gain, 0.0001, T());
    muteGain = ctx.createGain(); setP(muteGain.gain, muted ? 0 : 1, T());
    conn(muteGain, master); conn(master, ctx.destination);
    return true;
  }
  function teardown() {
    if (stopT) { clearTimeout(stopT); stopT = null; }
    for (var i = layers.length - 1; i >= 0; i--) layers[i].destroy();
    layers.length = 0;
    kill(muteGain); kill(master);
    master = muteGain = null; noiseBuf = null; playing = false;
  }
  function swapTo(desc, fade) {
    var next = build(desc);
    layers.push(next);
    rampTo(next.bus.gain, next.vol, fade);
    for (var i = layers.length - 2; i >= 0; i--) {
      var old = layers[i];
      rampTo(old.bus.gain, 0, fade);
      (function (l) { l.timers.push(setTimeout(function () { l.destroy(); }, fade * 1000 + 250)); })(old);
    }
    // Speed-running levels must not stack layers: keep at most one fading layer alive.
    while (layers.length > 2) layers[0].destroy();
  }

  // ---------- public API ----------
  var api = {
    start: function (audioContext, isMuted) {
      try {
        if (arguments.length > 1) muted = !!isMuted;
        var next = audioContext || null;
        if (!next) { ctx = null; return; }
        if (playing && ctx === next) { if (muteGain) rampTo(muteGain.gain, muted ? 0 : 1, 0.08); return; } // idempotent
        if (master) teardown();                       // new context, or a pending stop-fade: start clean
        ctx = next;
        try { if (ctx.state === 'suspended' && ctx.resume) ctx.resume(); } catch (_) {}
        ensureMaster();
        setP(muteGain.gain, muted ? 0 : 1, T());
        setP(master.gain, 0.0001, T()); ramp(master.gain, MASTER, T() + ATTACK);
        playing = true;
        swapTo(theme || { level: 1 }, XFADE);
      } catch (e) { warn(e); }
    },
    stop: function () {
      try {
        if (stopT) return;                            // a fade-out is already running: let it finish
        if (!playing || !master) { teardown(); return; }
        playing = false;
        rampTo(master.gain, 0.0001, RELEASE);
        for (var i = 0; i < layers.length; i++) { var l = layers[i]; for (var j = 0; j < l.timers.length; j++) clearTimeout(l.timers[j]); l.timers.length = 0; }
        if (stopT) clearTimeout(stopT);
        stopT = setTimeout(function () { stopT = null; teardown(); }, RELEASE * 1000 + 200);
      } catch (e) { warn(e); try { teardown(); } catch (_) {} }
    },
    setMuted: function (m) {
      try {
        muted = !!m;
        if (muteGain) rampTo(muteGain.gain, muted ? 0 : 1, 0.08);
      } catch (e) { warn(e); }
    },
    setTheme: function (t) {
      try {
        theme = t || null;
        if (!playing || !ctx || !master) return;                     // will be built by start()
        var live = layers[layers.length - 1];
        var kind = kindOf(theme), boss = !!(theme && theme.boss);
        if (live && !live.dead && live.kind === kind && live.boss === boss) return;  // same bed: let it ride
        swapTo(theme, XFADE);
      } catch (e) { warn(e); }
    },
    get theme() { return theme; },
    get kind() { return kindOf(theme); },      // debug aid
  };

  try { window.CatDoomAudio = api; } catch (e) { warn(e); }
})();
