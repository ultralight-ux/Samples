(() => {
  const DURATION = 20;
  const TAU = Math.PI * 2;
  const LOGICAL_W = 1920, LOGICAL_H = 1080;
  const { CAM, LAP } = ODTrack;

  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lin = (t, a, b) => clamp01((t - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const easeOut3 = (x) => 1 - Math.pow(1 - clamp01(x), 3);
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const backOut = (x, k = 1.7) => { x = clamp01(x) - 1; return 1 + (k + 1) * x * x * x + k * x * x; };
  const pulse = (t, t0, rise, decay) => { const d = t - t0; return d < 0 ? 0 : d < rise ? d / rise : Math.exp(-(d - rise) / decay); };
  function keys(t, k) {
    if (t <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return mix(k[i - 1][1], k[i][1], easeInOut(lin(t, k[i - 1][0], k[i][0])));
    return k[k.length - 1][1];
  }
  const wave = (t, hz, ph) => Math.sin(TAU * (hz * t + (ph || 0)));

  function css(el, prop, val) { const k = '_c_' + prop; if (el[k] !== val) { el[k] = val; el.style[prop] = val; } }
  function fade(el, a) { css(el, 'display', a > 0.001 ? '' : 'none'); css(el, 'opacity', a.toFixed(3)); }
  function text(el, s) { if (el._t !== s) { el._t = s; el.textContent = s; } }
  const $ = (id) => document.getElementById(id);

  const T = {
    c3: 0.8, c2: 1.6, c1: 2.4, go: 3.2,
    over1: 4.3, pads: [5.0, 5.25, 5.5], od: 5.75, over2: 7.1,
    exit: 8.2, line: 8.5, over3: 9.8, sting: 10.8, finish: 12.6,
    results: 13.3, resultsOut: 18.3, toGrid: 18.9,
  };

  const kmh = {
    A(t) {
      if (t < T.go) return 0;
      let v = 640 * easeOut3((t - T.go) / 2.1);
      for (const p of T.pads) v += 26 * expoOut((t - p) / 0.25) * (t > p ? 1 : 0);
      if (t > T.od) v += 240 * expoOut((t - T.od) / 0.35) - 110 * lin(t, 7.0, T.exit);
      return v;
    },
    B(t) { return 845 - 25 * lin(t, T.exit, 9.0) + 30 * lin(t, 9.2, 9.6) + 10 * wave(t, 0.4); },
    C(t) {
      if (t < T.finish) return 850 + 8 * wave(t, 0.5);
      return mix(850, 210, easeOut3((t - T.finish) / 2.2));
    },
    D() { return 0; },
  };
  const GRID_S = -40;
  const SEGS = [
    { t0: 0, t1: T.exit, v: kmh.A, anchor: [0, GRID_S] },
    { t0: T.exit, t1: T.sting, v: kmh.B, anchor: [T.line, 2 * LAP] },
    { t0: T.sting, t1: T.toGrid, v: kmh.C, anchor: [T.finish, 3 * LAP] },
    { t0: T.toGrid, t1: DURATION + 1, v: kmh.D, anchor: [T.toGrid, GRID_S] },
  ];
  const DT = 1 / 400;
  for (const sg of SEGS) {
    const n = Math.ceil((sg.t1 - sg.t0) / DT) + 2;
    sg.s = new Float64Array(n);
    let s = 0;
    for (let i = 0; i < n; i++) { sg.s[i] = s; s += (sg.v(sg.t0 + (i + 0.5) * DT) / 3.6) * DT; }
    const ia = (sg.anchor[0] - sg.t0) / DT, i0 = Math.floor(ia);
    const sa = mix(sg.s[i0], sg.s[Math.min(n - 1, i0 + 1)], ia - i0);
    const off = sg.anchor[1] - sa;
    for (let i = 0; i < n; i++) sg.s[i] += off;
  }
  function race(t) {
    let sg = SEGS[0];
    for (const g of SEGS) if (t >= g.t0) sg = g;
    const u = (t - sg.t0) / DT, i = Math.floor(u);
    return { seg: SEGS.indexOf(sg), s: mix(sg.s[i], sg.s[i + 1], u - i), kmh: sg.v(t) };
  }
  window.OD_DEBUG = { T, race };

  const odPunchAt = (t) => (t > T.od && t < T.exit ? expoOut((t - T.od) / 0.3) * (1 - lin(t, 7.2, T.exit) * 0.7) : 0);
  const odLightAt = (t) => (t > T.od && t < T.exit ? clamp01((t - T.od) / 0.06) * (1 - 0.35 * lin(t, 7.4, T.exit)) : 0);
  let P = { expo: 1, odexpo: 6 };
  const odAmount = (E) => Math.max(0, (E - P.expo) / (P.odexpo - P.expo));
  function exposureAt(t) {
    const E0 = P.expo, E1 = P.odexpo;
    if (!(t > T.od && t < T.exit)) return E0;
    const d = t - T.od;
    const up = d < 0.08 ? mix(E0, 1.42 * E1, easeOut3(d / 0.08)) : E1 * (1 + 0.42 * Math.exp(-(d - 0.08) / 0.15));
    return mix(up, mix(E0, E1, 0.2), easeInOut(lin(t, 7.5, T.exit)));
  }

  function playerX(t) {
    if (t < T.exit) return keys(t, [[T.go, -2.7], [4.6, -0.8], [6.3, 0.2], [6.8, 2.2], [7.6, 2.0], [T.exit, 0.4]]);
    if (t < T.sting) return keys(t, [[T.exit, 0.3], [9.2, 1.6], [10.2, 1.4], [T.sting, 0]]);
    if (t < T.toGrid) return keys(t, [[T.sting, 0.5], [T.finish, 0], [14.5, 1.2], [17, -0.8]]);
    return -2.7;
  }

  const RIVALS = [
    { code: 'TKN', livery: 'tkn', light: 'amber',
      gap: (t) => (t < T.exit ? keys(t, [[T.go, 8], [3.6, 8.5], [4.3, 0], [5.1, -26]]) : null),
      x: (t) => keys(t, [[T.go, 2.7], [4.6, 3.6]]) },
    { code: 'SLN', livery: 'sln', light: 'white',
      gap: (t) => (t < T.exit ? keys(t, [[T.go, 16], [4.4, 40], [T.od, 78], [6.4, 52], [T.over2, 0], [7.9, -36]]) : null),
      x: (t) => keys(t, [[T.go, -2.7], [4.6, -1.2], [6.2, -0.6], [6.8, -3.0], [7.8, -3.4]]) },
    { code: 'NVK', livery: 'nvk', light: 'argon',
      gap: (t) => (t < T.exit ? keys(t, [[T.go, 24], [4.8, 70], [T.od, 120], [7.2, 230]])
        : t < T.sting ? keys(t, [[T.exit, 95], [8.9, 70], [T.over3, 0], [10.6, -40]]) : null),
      x: (t) => (t < T.exit ? keys(t, [[T.go, 2.7], [5.0, 0.8]]) : keys(t, [[T.exit, -0.6], [9.3, -1.6], [9.8, -3.5], [10.6, -3.4]])) },
  ];

  const FIREWORKS = [
    [12.72, -0.32, 0.20, 0.10, 'n'], [12.95, 0.28, 0.26, 0.12, 'a'], [13.35, 0.02, 0.33, 0.14, 'n'],
    [13.8, -0.45, 0.24, 0.11, 'a'], [14.3, 0.4, 0.3, 0.12, 'n'], [15.0, -0.1, 0.28, 0.13, 'a'],
    [15.8, 0.25, 0.22, 0.10, 'n'], [16.6, -0.3, 0.3, 0.12, 'a'],
  ].map(([t, az, el, r, c]) => ({ t, az, el, r, col: c === 'n' ? ODTrack.NEON : ODTrack.ARGON }));

  let world, sky, skyFar, skyNear, player, craftMeta, skyPeriod;
  const craftImgs = {};
  const imgReady = [];
  for (const code of ['nvk', 'sln', 'tkn']) for (const v of ['far', 'side', 'near']) {
    const name = `rival-${code}-${v}`, img = new Image();
    imgReady.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
    img.src = `assets/${name}.png`;
    craftImgs[name] = img;
  }
  const loadCraft = (name) => craftImgs[name];

  function buildWorld(c) {
    const meta = c.craftJson;
    craftMeta = meta;
    const sprites = {};
    for (const code of ['nvk', 'sln', 'tkn']) {
      const mk = (v) => { const m = meta[`rival-${code}-${v}`]; return { img: loadCraft(`rival-${code}-${v}`), dist: m.depth, scale: m.scale, ax: m.ax, ay: m.ay, side: v !== 'far' }; };
      sprites[code] = { img: { complete: true }, far: mk('far'), side: mk('side'), near: mk('near') };
    }
    world = new ODTrack.World({ canvas: $('track'), sprites, font: "'OD Saira'", guard: c.params.guard });
    const W = c.width, H = c.height;
    const q = c.params.wq;
    world.resize(W, H, Math.min(2, (window.devicePixelRatio || 1) * q));

    sky = $('sky');
    const dpr = window.devicePixelRatio || 1;
    sky.width = Math.round(W * dpr * 0.5); sky.height = Math.round(H * dpr * 0.5);
    sky.style.width = W + 'px'; sky.style.height = H + 'px';
    const g = sky.getContext('2d');
    g.scale(sky.width / W, sky.height / H);
    const hz = world.horizon;
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#04060a');
    gr.addColorStop(hz / H * 0.55, '#090d17');
    gr.addColorStop(hz / H * 0.92, '#18202f');
    gr.addColorStop(hz / H, '#252e3e');
    gr.addColorStop(Math.min(1, hz / H + 0.06), '#111622');
    gr.addColorStop(1, '#06080d');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    const rnd = c.random;
    for (let i = 0; i < 140; i++) {
      const x = rnd() * W, y = rnd() * hz * 0.8, a = 0.15 + rnd() * 0.45;
      g.fillStyle = `rgba(222,230,255,${a * (1 - y / hz)})`;
      g.fillRect(x, y, rnd() < 0.1 ? 2 : 1, 1);
    }
    const glow = g.createRadialGradient(W * 0.5, hz, 0, W * 0.5, hz, W * 0.55);
    glow.addColorStop(0, 'rgba(255,176,120,0.13)'); glow.addColorStop(0.5, 'rgba(120,140,190,0.06)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);

    skyPeriod = Math.round((TAU * world.f) / 3);
    const mkSky = (el, base, below, seed, layer, k) => {
      const w = skyPeriod + W + 40, h = base + below;
      const r = ODTrack.skyline(w, h, k, skyPeriod, seed, layer, base);
      el.appendChild(r.canvas);
      r.canvas.style.width = w + 'px'; r.canvas.style.height = h + 'px';
      el.style.width = w + 'px'; el.style.height = h + 'px';
      el.style.top = (hz - r.base) + 'px';
      el._w = w;
    };
    skyFar = $('skyline-far'); skyNear = $('skyline-near');
    mkSky(skyFar, 310, 120, 11, 0, 0.5);
    mkSky(skyNear, 290, H - hz + 40, 29, 1, 0.5);

    player = $('player');
    const m = meta['craft-ktn'], k = H / 1080 / m.scale;
    for (const el of player.querySelectorAll('img')) { el.style.width = m.w * k + 'px'; el.style.height = m.h * k + 'px'; }
    player._ax = m.ax * k; player._ay = m.ay * k; player._k = k;
    const nzPos = [[m.ax - 194, m.ay + 234], [m.ax + 194, m.ay + 234]];
    player._halos = [...player.querySelectorAll('.nozzle')].map((el, i) => {
      const r = 120 * k, j = i % 2;
      Object.assign(el.style, { left: nzPos[j][0] * k - r + 'px', top: nzPos[j][1] * k - r * 0.8 + 'px', width: 2 * r + 'px', height: 1.6 * r + 'px' });
      return el;
    });
    player._plumes = [...player.querySelectorAll('.plume')];
    player._plumes.forEach((el, i) => {
      const w = 150 * k, h = 330 * k;
      Object.assign(el.style, { left: nzPos[i][0] * k - w / 2 + 'px', top: nzPos[i][1] * k - h * 0.12 + 'px', width: w + 'px', height: h + 'px' });
      el._n = el.querySelector('.pl-n'); el._a = el.querySelector('.pl-a');
    });
    player._od = [$('craft-od'), $('craft-glow-od')];
    const FW = 150, FH = 300, FY = 25;
    player._flames = [...player.querySelectorAll('.flame')].map((el, i) => {
      const cx = m.ax + (i ? 192 : -192), cy = m.ay + 248;
      Object.assign(el.style, { left: (cx - FW / 2) * k + 'px', top: (cy - FY) * k + 'px', width: FW * k + 'px', height: FH * k + 'px',
                                transformOrigin: `50% ${(FY / FH * 100).toFixed(2)}%` });
      el.innerHTML = flameSVG(i === 0);
      return el;
    });
    player._flares = [...player.querySelectorAll('.flare')];
    player._flares.forEach((el, i) => {
      const w = 900 * k;
      Object.assign(el.style, { left: nzPos[i][0] * k - w / 2 + 'px', top: nzPos[i][1] * k - 2 + 'px', width: w + 'px' });
    });
  }

  function flameSVG(withDefs) {
    const OUTER = 'M50 2C80 2 96 22 92 52C86 110 64 200 50 298C36 200 14 110 8 52C4 22 20 2 50 2Z';
    const MID = 'M50 8C70 8 80 26 76 56C70 110 58 180 50 240C42 180 30 110 24 56C20 26 30 8 50 8Z';
    const CORE = 'M50 14C62 14 66 30 63 56C60 96 54 140 50 180C46 140 40 96 37 56C34 30 38 14 50 14Z';
    const dia = (y, h, w, a) => `<path d="M50 ${y - h}L${50 + w} ${y}L50 ${y + h}L${50 - w} ${y}Z" fill="rgba(255,255,255,${a})"/>`;
    const grad = (id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
    const defs = withDefs ? `<defs>${grad('od-fl-out', [[0, 'rgba(150,166,255,.95)'], [0.25, 'rgba(98,112,255,.9)'], [0.6, 'rgba(90,74,240,.52)'], [1, 'rgba(80,60,224,0)']])}` +
      `${grad('od-fl-mid', [[0, 'rgba(240,244,255,.98)'], [0.3, 'rgba(160,178,255,.9)'], [0.7, 'rgba(118,136,255,.35)'], [1, 'rgba(110,128,255,0)']])}` +
      `${grad('od-fl-core', [[0, '#ffffff'], [0.35, 'rgba(244,247,255,.95)'], [0.75, 'rgba(196,210,255,.4)'], [1, 'rgba(190,205,255,0)']])}</defs>` : '';
    const box = 'viewBox="0 0 100 300" preserveAspectRatio="none"';
    return `<div class="fl-bloom"><svg ${box}>${defs}<path d="${OUTER}" fill="url(#od-fl-out)"/></svg></div>` +
      `<div class="fl-body"><svg ${box}><path d="${OUTER}" fill="url(#od-fl-out)"/><path d="${MID}" fill="url(#od-fl-mid)"/>` +
      `<path d="${CORE}" fill="url(#od-fl-core)"/>${dia(70, 9, 7, 0.85)}${dia(108, 7.5, 5.5, 0.62)}${dia(142, 6, 4, 0.4)}</svg></div>`;
  }

  function updateExhaust(t, v, od, tunnelK) {
    const ign = t > T.od && t < T.exit ? t - T.od : -1;
    const punch = ign < 0 ? 0 : 0.35 + 0.65 * backOut(ign / 0.18, 2.6);
    const flash = ign < 0 ? 0 : pulse(t, T.od, 0.02, 0.18);
    player._flames.forEach((el, i) => {
      const a = od;
      css(el, 'visibility', a > 0.002 ? 'visible' : 'hidden');
      if (a <= 0.002) return;
      const L = punch * (1 + 0.3 * clamp01((v - 190) / 75)) * (0.75 + 0.25 * od);
      const fy = 1 + 0.07 * wave(t, 17.3, 0.3 * i) + 0.05 * wave(t, 29.7, 0.4 + 0.2 * i) + 0.03 * wave(t, 43.1, 0.2);
      const fx = 1 + 0.04 * wave(t, 23.7, 0.3 + 0.5 * i) + 0.25 * flash;
      css(el, 'transform', `scale(${fx.toFixed(4)},${(L * fy).toFixed(4)})`);
      css(el, 'opacity', Math.min(1, a).toFixed(3));
    });
    const thrust = t < T.go ? 0.35 + 0.05 * wave(t, 7) : clamp01(v / 230);
    const flick = 1 + (0.08 + 0.04 * od) * wave(t, 13.3) + (0.05 + 0.03 * od) * wave(t, 29.7, 0.4) + 0.04 * od * wave(t, 53.1, 0.2);
    player._plumes.forEach((el, i) => {
      const fi = flick + 0.03 * od * wave(t, 41.3, 0.5 * i);
      const len = (0.35 + 0.65 * thrust + 1.35 * od * clamp01(v / 250)) * fi * (i ? 1.02 : 1);
      css(el, 'transform', `scale(${(0.8 + 0.25 * thrust + 0.22 * od).toFixed(4)},${len.toFixed(4)})`);
      css(el, 'opacity', (0.55 + 0.45 * thrust).toFixed(3));
      css(el._a, 'opacity', od.toFixed(3));
      css(el._n, 'opacity', (1 - od).toFixed(3));
    });
    player._halos.forEach((el, i) => {
      const a = i < 2 ? 1 - od : Math.min(1, od * (0.85 + 0.15 * flick) + 0.6 * flash);
      css(el, 'opacity', a.toFixed(3));
      css(el, 'visibility', a > 0.002 ? 'visible' : 'hidden');
      if (i >= 2) css(el, 'transform', `scale(${(1 + 0.7 * flash).toFixed(4)})`);
    });
    for (const el of player._od) {
      css(el, 'opacity', od.toFixed(3));
      css(el, 'visibility', od > 0.002 ? 'visible' : 'hidden');
    }
    player._flares.forEach((el, i) => {
      css(el, 'transform', `scaleX(${((0.4 + 0.6 * thrust + 0.5 * od) * (1 + 0.1 * wave(t, 9.1, i * 0.3))).toFixed(4)})`);
      css(el, 'opacity', (0.35 + 0.4 * thrust + 0.25 * od).toFixed(3));
      cls(el, 'od', od > 0.3);
    });
    css($('craft-t'), 'opacity', tunnelK.toFixed(3));
  }
  function cls(e, name, on) { const k = '_k_' + name; if (e[k] !== on) { e[k] = on; e.classList.toggle(name, on); } }

  const LIVE = !new URLSearchParams(location.search).has('t');
  let steerTarget = 0, steer = 0, steerVel = 0;
  if (LIVE) addEventListener('mousemove', (e) => { steerTarget = Math.max(-1, Math.min(1, (e.clientX / innerWidth - 0.5) * 2.2)); });

  function renderWorld(t, c) {
    window.OD_DEBUG.world = world;
    const r = race(t);
    const sP = r.s, v = r.kmh / 3.6;
    if (LIVE) { const prev = steer; steer += (steerTarget - steer) * 0.08; steerVel = steer - prev; }
    const racing = t > T.go && t < T.toGrid;
    const xP = playerX(t) + (racing ? 2.4 * steer : 0);
    world.lastXP = xP;
    const rivals = [];
    for (const rv of RIVALS) {
      const onGrid = t >= T.toGrid;
      const gp = onGrid ? rv.gap(0) : rv.gap(t);
      if (gp === null || gp === undefined) continue;
      rivals.push({ s: sP + gp, x: rv.x(onGrid ? 0 : t), livery: rv.livery, light: rv.light });
    }
    const lights = t < T.go || t >= T.toGrid
      ? { lit: t >= T.toGrid ? 0 : t >= T.c1 ? 5 : t >= T.c2 ? 3 : t >= T.c3 ? 1 : 0, go: 0 }
      : t < T.go + 1.5 ? { lit: 5, go: 1 - (t - T.go) / 1.5 } : { lit: 0, go: 0 };
    const odOn = t > T.od && t < T.exit;
    const odPunch = odPunchAt(t);
    world.frame({
      t, sP, xP, speed: v, rivals, startLights: lights,
      boostLight: odOn,
      odGlow: odAmount(exposureAt(t)),
      fovK: 1 - 0.09 * odPunch,
      speedLines: odOn ? clamp01((t - T.od) / 0.15) * (1 - lin(t, 7.6, T.exit)) : 0,
      sign: t >= T.sting && t < T.toGrid ? 'finish' : t >= T.exit && t < T.sting ? 'final' : 'round',
      fireworks: FIREWORKS,
      padFlash: (s) => { const d = sP - s; return d > -2 && d < 30 ? Math.exp(-Math.max(0, d) / 12) : 0; },
    });
    const head = world.v.head;
    for (const [el, par] of [[skyFar, 1], [skyNear, 1]]) {
      const off = ((head * world.f * par) % skyPeriod + skyPeriod) % skyPeriod;
      css(el, 'transform', `translate3d(${(-off - 20).toFixed(1)}px,0,0)`);
    }
    const k = ODTrack.curvature(sP + 8);
    const ctr = world.proj(world.v, sP, xP, CAM.hover);
    const bob = 2.5 * wave(t, 0.9) + 1.2 * wave(t, 2.3, 0.3);
    const bank = -k * 900 + (playerX(t) - playerX(t - 0.15)) * 6 + (racing ? steerVel * 260 : 0);
    if (ctr) {
      css(player, 'transform', `translate3d(${(ctr[0] - player._ax).toFixed(2)}px,${(ctr[1] - player._ay + bob).toFixed(2)}px,0) rotate(${bank.toFixed(3)}deg) scale(${(1 - 0.09 * odPunch).toFixed(4)})`);
      css(player, 'transformOrigin', `${player._ax.toFixed(1)}px ${player._ay.toFixed(1)}px`);
    }
    const u = ((sP % LAP) + LAP) % LAP, [ta, tb] = ODTrack.TUNNEL;
    const tunnelK = u > ta && u < tb ? clamp01(Math.min(u - ta, tb - u) / 25) : 0;
    updateExhaust(t, v, odLightAt(t), tunnelK);
    const roll = k * 380;
    const rumble = (t > T.go && t < T.go + 0.9 ? (1 - (t - T.go) / 0.9) * 3 : 0) + 6 * pulse(t, T.od, 0.02, 0.12) + 4 * pulse(t, T.finish, 0.02, 0.15);
    const sx = rumble * wave(t, 23), sy = rumble * wave(t, 31, 0.2);
    css($('cam'), 'transform', `translate3d(${sx.toFixed(2)}px,${sy.toFixed(2)}px,0) rotate(${roll.toFixed(3)}deg)`);

    fade($('tint'), odOn ? 0.5 * pulse(t, T.od, 0.03, 0.22) : 0);
    const fl = Math.max(0.35 * pulse(t, T.go, 0.02, 0.12), 0.22 * pulse(t, T.od, 0.02, 0.08), 0.95 * pulse(t, T.exit - 0.08, 0.08, 0.22),
      0.3 * pulse(t, T.finish, 0.02, 0.18));
    css($('flash'), 'opacity', fl.toFixed(3));
    {
      const E = exposureAt(t), b = c.params.boost * 0.75 * Math.min(1, odAmount(E)) * (E / P.odexpo);
      css($('boost'), 'visibility', b > 0.001 ? 'visible' : 'hidden');
      if (b > 0.001) css($('boost'), 'backgroundColor', `rgb(${(60 * b).toFixed(2)},${(64 * b).toFixed(2)},${(76 * b).toFixed(2)})`);
      fade($('haze'), Math.min(1, b / 0.75));
    }
    const menu = clamp01(lin(t, T.results - 0.2, T.results + 0.4) - lin(t, T.toGrid - 0.02, T.toGrid));
    css($('dim'), 'opacity', (0.42 * menu).toFixed(3));
    css($('cam'), 'filter', menu > 0.01 ? `blur(${(6 * menu).toFixed(2)}px)` : 'none');
  }

  const ORDERS = [
    [0, ['NVK', 'SLN', 'TKN', 'KTN', 'BRV']],
    [T.over1, ['NVK', 'SLN', 'KTN', 'TKN', 'BRV']],
    [T.over2, ['NVK', 'KTN', 'SLN', 'TKN', 'BRV']],
    [T.over3, ['KTN', 'NVK', 'SLN', 'TKN', 'BRV']],
    [T.toGrid, ['NVK', 'SLN', 'TKN', 'KTN', 'BRV']],
  ];
  const POS_CHANGES = [[0, 4], [T.over1, 3], [T.over2, 2], [T.over3, 1], [T.toGrid, 4]];
  function positionAt(t) {
    let i = 0;
    for (let k = 0; k < POS_CHANGES.length; k++) if (t >= POS_CHANGES[k][0]) i = k;
    return { n: POS_CHANGES[i][1], prev: i ? POS_CHANGES[i - 1][1] : null, impact: i && i < 4 ? t - POS_CHANGES[i][0] : 9 };
  }
  const BASE_INT = { NVK: 0.62, SLN: 0.41, TKN: 0.37, KTN: 0.48, BRV: 0.93 };
  function standings(t) {
    let oi = 0;
    for (let k = 0; k < ORDERS.length; k++) if (t >= ORDERS[k][0]) oi = k;
    const order = ORDERS[oi][1], prev = oi ? ORDERS[oi - 1][1] : order;
    const u = oi && oi < 4 ? easeInOut(lin(t, ORDERS[oi][0], ORDERS[oi][0] + 0.35)) : 1;
    const out = {};
    order.forEach((code, i) => {
      const j = prev.indexOf(code);
      const tq = Math.floor(t * 4) / 4;
      const gap = i === 0 ? 'LEAD' : t < T.go || t >= T.toGrid ? '-.--' : '+' + (BASE_INT[code] + 0.05 * wave(tq, 0.3, i * 0.17)).toFixed(2);
      out[code] = { p: i + 1, y: mix(j, i, u), x: code === 'KTN' ? -16 : 0, gap };
    });
    return out;
  }
  const LAP_TIMES = [28.03, 27.61, 27.18];
  const fmt = (sec) => { const m = Math.floor(sec / 60), s = sec - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); };
  function lapState(t) {
    if (t < T.go || t >= T.toGrid) return { n: 1, time: fmt(0), best: '-:--.--' };
    if (t < T.exit) return { n: 1, time: fmt(t - T.go), best: '-:--.--' };
    if (t < T.line) return { n: 2, time: fmt(LAP_TIMES[1] - (T.line - t)), best: fmt(LAP_TIMES[0]) };
    if (t < T.sting) return { n: 3, final: true, time: fmt(t - T.line), best: fmt(LAP_TIMES[1]) };
    return { n: 3, final: true, time: fmt(Math.min(LAP_TIMES[2], LAP_TIMES[2] - (T.finish - t))), best: fmt(LAP_TIMES[1]) };
  }
  function chargeAt(t) {
    if (t < T.pads[0]) return 0.45;
    if (t < T.od) {
      let c = 0.45;
      for (const p of T.pads) c += 0.85 * expoOut((t - p) / 0.3) * (t > p ? 1 : 0);
      return Math.min(3, c);
    }
    if (t < T.exit) return 3 * (1 - lin(t, T.od + 0.1, 8.1));
    if (t < T.sting) return keys(t, [[T.exit, 0.4], [9.3, 0.4], [9.45, 1.3], [9.65, 2.2]]);
    if (t < T.toGrid) return 2.2;
    return 0.45;
  }
  function moduleShow(t, i) {
    if (t < 13.0) return 1;
    if (t < T.toGrid + 0.05) return 1 - lin(t, 13.0 + i * 0.06, 13.28 + i * 0.06);
    return lin(t, T.toGrid + 0.1 + i * 0.07, T.toGrid + 0.4 + i * 0.07);
  }

  function renderHud(t) {
    const r = race(t);
    const pos = positionAt(t);
    const st = standings(t);
    const lap = lapState(t);
    const myS = r.s;
    const lapU = ((myS % LAP) + LAP) % LAP;
    const ahead = { 4: ['TKN', 0.37], 3: ['SLN', 0.41], 2: ['NVK', 0.62] }[pos.n];
    const tq = Math.floor(t * 4) / 4;
    const gapTxt = pos.n === 1 ? `LEAD +${(0.42 + 0.04 * wave(tq, 0.3)).toFixed(2)}` : t < T.go || t >= T.toGrid ? `GRID ${pos.n}` : `▲ ${(ahead[1] + 0.05 * wave(tq, 0.3)).toFixed(2)} ${ahead[0]}`;
    const ch = chargeAt(t);
    const odActive = t > T.od && t < T.exit;
    const ready = ch >= 2.99 && !odActive;
    let split = null;
    if (t > T.line && t < 10.2) split = { a: Math.min(lin(t, T.line, T.line + 0.15), 1 - lin(t, 9.9, 10.2)), v: '-0.42', k: 'PERSONAL BEST' };
    const rivalS = {};
    for (const rv of RIVALS) { const g = rv.gap(t); rivalS[rv.code] = myS + (g === null || g === undefined ? (rv.code === 'NVK' ? -30 : rv.code === 'SLN' ? -90 : -160) : g); }
    rivalS.BRV = myS - 420; rivalS.HXL = myS - 780; rivalS.PLX = myS - 1300;
    ODHud.hud.update({
      exposure: exposureAt(t),
      gain: { overlay: P.overlay, glow: t > T.od && t < T.exit ? P.odglow : P.glow, dodge: P.dodge },
      odIgn: odActive ? t - T.od : -1,
      show: { pos: moduleShow(t, 0), lap: moduleShow(t, 1), stand: moduleShow(t, 2), map: moduleShow(t, 3), speed: moduleShow(t, 4) },
      pos: { n: pos.n, prev: pos.prev, impact: pos.impact, gap: gapTxt },
      lap, split,
      stand: st,
      t,
      map: { me: myS, rivals: rivalS, progress: myS < 0 || t >= T.toGrid ? 0 : lapU / LAP, sector: 'SECTOR ' + (1 + Math.min(2, Math.floor((lapU / LAP) * 3))) },
      speed: {
        kmh: r.kmh + (r.kmh > 50 ? 4 * wave(t, 3.1) : 0), od: odActive,
        split: odActive ? Math.exp(-(t - T.od) / 0.18) : 0,
        cells: [0, 1, 2].map((i) => clamp01(ch - i)), ready, pulse: 0.5 + 0.5 * Math.sin(t * TAU * 4),
        state: odActive ? 'ACTIVE' : ready ? 'READY' : `CHARGE ${Math.round((ch / 3) * 100)}%`,
      },
    });
  }

  function setup(c) {
    const W = c.width, H = c.height;
    const s = Math.min(W / LOGICAL_W, H / LOGICAL_H);
    c.s = s; c.LW = W / s; c.LH = H / s;
    $('cam').style.transformOrigin = `${W / 2}px ${H / 2}px`;
    $('track').style.width = W + 'px'; $('track').style.height = H + 'px';
    buildWorld(c);
    if (!c.params.world) $('world').style.display = 'none';
    P = c.params;
    if (!c.params.hud) for (const id of ['hud-scrim', 'hud-dodge', 'hud-glow', 'hud', 'events-glow', 'events']) $(id).style.display = 'none';
    if (!c.params.bf) document.body.classList.add('no-bf');
    if (!c.params.bloom) document.body.classList.add('no-bloom');
    if (!c.params.text) document.body.classList.add('no-text');
    for (const id of ['hud-scrim', 'hud-dodge', 'hud-glow', 'hud', 'events-glow', 'events', 'overlay']) {
      const e = $(id);
      e.style.width = c.LW + 'px'; e.style.height = c.LH + 'px';
      e.style.transform = `scale(${s})`;
    }
    ODHud.hud.build($('hud'), $('hud-glow'), ODTrack, $('hud-scrim'), $('hud-dodge'));
    ODEvents.build($('events'), $('events-glow'));
  }

  function render(t, c) {
    t = ((t % DURATION) + DURATION) % DURATION;
    renderWorld(t, c);
    renderHud(t);
    ODEvents.update(t, T, c.LW, c.LH);
  }

  Promise.all([
    document.fonts.load("italic 800 40px 'OD Saira'"), document.fonts.load("600 20px 'OD Saira'"),
    document.fonts.load("italic 400 40px 'OD Saira'"), ...imgReady,
  ]).then(() => {
    scene.define({
      name: 'overdrive',
      controls: [[['Mouse move'], 'Steer left and right']],
      duration: DURATION,
      keyTimes: [0.4, 1.9, 3.35, 5.95, 7.0, 9.05, 12.75, 15.5],
      params: { world: 1, hud: 1, bf: 1, bloom: 1, wq: 1, text: 1, dodge: 1, glow: 0.6, odglow: 1, overlay: 1, expo: 1, odexpo: 6, boost: 1, guard: 0.1 },
      setup(c) { c.craftJson = window.OD_CRAFT; setup(c); },
      render,
    });
  });
})();
