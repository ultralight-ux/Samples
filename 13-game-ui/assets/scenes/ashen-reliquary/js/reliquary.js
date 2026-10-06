(() => {
  const {
    TAU, DUR, clamp01, lin, mix, f2, E, env, spring, shake, per, flicker,
    set, attr, text, op, tf, h, s, svg, rng, fmt, qb,
  } = AR;
  const A = AR.art;
  const PANELS = window.PANELS;
  const IMG = 'assets/items/';

  const T = {
    spark: 0.5, impact: 0.72, label: 1.0, sweep: 1.6,
    pickup: 3.15, open: 3.35, land: 4.15,
    hover: 4.65, tip: 5.35, cmp: 5.55, deltas: 6.35, shimmer: 7.0,
    fold: 8.1, gemPick: 8.55, rise: 8.6, gemFly: 9.35, set: 9.95, runes: 10.05, runeGap: 0.1,
    caption: 10.95, lower: 12.0, equip: 12.65, stats: 12.85,
    oath: 14.4, close: 17.55, closed: 18.7,
  };

  const LEDGER = { x: 60, y: 150, w: 540, h: 840 };
  const NICHE = { x: 640, y: 70, w: 640, h: 940 };
  const CHEST = { x: 1320, y: 150, w: 540, h: 840 };
  const CELL = 60, GX = CHEST.x + 30, GY = CHEST.y + 96;
  const DROP = { x: 900, y: 806 };
  const ROSE = { x: 320, y: 236, r: 150 };
  const EFFIGY = { cx: 320, bottom: 848, h: 560 };
  const SWORD_AR = 368 / 1250;
  const SOCKET_U = [0.515, 0.338];
  const SWORD_UP = { cx: 323, top: 52, h: 800 };
  const SWORD_EQ = { cx: 320, top: 446, h: 440 };
  const BLADE_X = 0.527;
  const RUNE_Y = [0.49, 0.54, 0.59, 0.64, 0.69, 0.74, 0.79, 0.84, 0.89];

  const INV = [
    ['saint-breaker', 0, 0, 2, 4, 'legendary'],
    ['pilgrims-oath', 0, 0, 1, 4, 'rare'],
    ['deaths-head', 2, 0, 2, 2, 'rare'],
    ['black-gauntlet', 4, 0, 2, 2, 'magic'],
    ['rondache', 6, 0, 2, 2, 'rare'],
    ['flanged-mace', 2, 2, 1, 3, 'common'],
    ['parrying-dagger', 3, 2, 1, 3, 'magic'],
    ['gospel-reliquary', 4, 2, 2, 2, 'relic'],
    ['chalice', 6, 2, 1, 2, 'magic'],
    ['ember-flask', 7, 2, 1, 2, 'common', 3],
    ['garnet-brooch', 0, 4, 1, 1, 'rare'],
    ['phylactery', 1, 4, 1, 2, 'magic'],
    ['enamel-ring', 4, 4, 1, 1, 'rare'],
    ['double-cross', 6, 4, 1, 2, 'common'],
    ['beast-key', 7, 4, 1, 2, 'relic'],
    ['gem:ember', 2, 5, 1, 1, 'gem'],
    ['gem:grave', 3, 5, 1, 1, 'gem'],
    ['gem:saint', 4, 5, 1, 1, 'gem'],
    ['ampulla', 0, 6, 1, 2, 'magic'],
    ['greave', 1, 6, 1, 2, 'common'],
    ['war-axe', 2, 6, 2, 1, 'rare'],
    ['censer-cup', 2, 7, 1, 1, 'relic'],
  ];
  const SLOTS = {
    helm: ['fluted-helm', 62, 440, 78, 78, 'rare'],
    chest: ['gothic-breastplate', 62, 528, 78, 78, 'rare'],
    gloves: ['mitten-gauntlet', 62, 616, 78, 78, 'magic'],
    main: ['pilgrims-oath', 62, 704, 78, 140, 'rare'],
    amulet: ['tear-pendant', 500, 440, 78, 78, 'rare'],
    ring1: ['signet-ring', 500, 528, 78, 78, 'magic'],
    ring2: ['emerald-ring', 500, 616, 78, 78, 'rare'],
    off: ['round-shield', 500, 704, 78, 140, 'magic'],
  };
  const cellCenter = (c, r, w, hh) => [GX + (c + w / 2) * CELL, GY + (r + hh / 2) * CELL];
  const LEG_C = cellCenter(0, 0, 2, 4);
  const GEM_C = cellCenter(2, 5, 1, 1);
  const SOCKET = [NICHE.x + SWORD_UP.cx - SWORD_UP.h * SWORD_AR / 2 + SOCKET_U[0] * SWORD_UP.h * SWORD_AR,
    NICHE.y + SWORD_UP.top + SOCKET_U[1] * SWORD_UP.h];
  const MAIN_C = [NICHE.x + 62 + 39, NICHE.y + 704 + 70];

  const STATS = {
    damage: [1104, 1612], armor: [2860, 2860], life: [9412, 9412],
    strength: [412, 496], faith: [186, 186], wrath: [240, 240], fortitude: [301, 301],
    crit: [12.0, 18.5], speed: [1.10, 0.95], fire: [0, 22], undying: [12, 43],
  };

  const el = {};
  let built = false;
  const lone = (s) => (/^\d$/.test(s) ? s + '\u2060' : s);
  const UIPAD = 12;
  function ui(parent, name, x, y, w, hh) {
    const im = h('img', '', parent, `left:${x - UIPAD}px;top:${y - UIPAD}px;width:${w + 2 * UIPAD}px;height:${hh + 2 * UIPAD}px`);
    im.src = 'assets/ui/' + name;
    return im;
  }

  function clipPath(d) { return `path('${d}')`; }
  function panelShadow(parent, w, hh, d) {
    const s0 = h('div', '', parent, `left:10px;top:15px;width:${w}px;height:${hh}px;filter:blur(12px);opacity:.55`);
    h('div', '', s0, `left:0;top:0;width:${w}px;height:${hh}px;background:#000;clip-path:path('${d}')`);
    return s0;
  }
  function bakeDiv(parent, img, w, hh, d) {
    if (d) panelShadow(parent, w, hh, d);
    const b = h('div', 'bake', parent, `width:${w}px;height:${hh}px;background-image:url(assets/${img})`);
    if (d) { b.style.clipPath = clipPath(d); b.style.webkitClipPath = clipPath(d); }
    return b;
  }

  function buildDefs() {
    document.getElementById('art-defs').innerHTML = A.defs + `
      <filter id="f-blur4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="f-blur10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="f-ripple" color-interpolation-filters="sRGB">
        <feTurbulence type="turbulence" baseFrequency="0.045" numOctaves="1" seed="5" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  }

  const wholeCycles = (p) => DUR / Math.max(1, Math.round(DUR / p));
  function buildWorld(R) {
    el.cam = document.getElementById('cam');
    el.wPlay = document.getElementById('w-play');
    el.wMenu = document.getElementById('w-menu');
    el.dim = document.getElementById('dim');
    const tor = document.getElementById('torches');
    el.torches = [[70, 520], [1880, 470]].map(([x, y], i) => {
      const g = h('div', 'torch', tor, `left:${x}px;top:${y}px`);
      const c = h('div', 'torch-core', tor, `left:${x}px;top:${y - 40}px`);
      return { g, c, seed: 1.3 + i * 2.1 };
    });
    const fog = document.getElementById('fog');
    el.fog = [870, 990].map((y) => h('div', 'fogband', fog, `top:${y - 130}px`));
    const fg = document.getElementById('fg');
    el.fgL = svg(fg, 420, 1440, `
      <path d="M40 0 L250 0 L250 1440 L40 1440 Z" fill="#070403"/>
      <path d="M250 0 L300 0 L300 1440 L250 1440 Z" fill="#120a06"/>
      <path d="M0 520 L330 520 L340 560 L0 560 Z M0 980 L340 980 L330 1020 L0 1020 Z" fill="#0b0604"/>`,
    'left:-60px;top:0;filter:blur(14px)');
    el.fgR = svg(fg, 260, 900, `
      <g fill="none" stroke="#0a0604" stroke-width="16">
        ${Array.from({ length: 14 }, (_, i) => `<ellipse cx="130" cy="${30 + i * 52}" rx="${i % 2 ? 10 : 22}" ry="30"/>`).join('')}
      </g>
      <path d="M90 760 L170 760 L190 820 L130 880 L70 820 Z" fill="#0a0604"/>`,
    'left:2330px;top:150px;filter:blur(9px)');
    const em = document.getElementById('embers');
    el.embers = [];
    for (let i = 0; i < 46; i++) {
      const depth = i < 6 ? 2 : i < 18 ? 1 : 0;
      const size = depth === 2 ? 46 + R() * 50 : depth === 1 ? 10 + R() * 6 : 4 + R() * 4;
      const d = h('div', depth === 2 ? 'bokeh' : 'ember', em,
        `width:${f2(size)}px;height:${f2(size)}px;margin:${f2(-size / 2)}px 0 0 ${f2(-size / 2)}px`);
      if (depth === 2) d.style.filter = 'blur(6px)';
      el.embers.push({
        d, depth, x0: -100 + R() * 2120, period: wholeCycles([11, 8, 13][depth] * (0.8 + R() * 0.5)),
        ph: R(), sway: 20 + R() * 60, swayK: 1 + Math.floor(R() * 3), a: 0.35 + R() * 0.65,
      });
    }
  }

  function buildDrop(R) {
    const d = document.getElementById('drop');
    el.pool = h('div', 'pool', d, `left:${DROP.x}px;top:${DROP.y}px`);
    el.ring = h('div', 'ring', d, `left:${DROP.x}px;top:${DROP.y}px`);
    el.dropStreak = h('div', '', d, `left:${DROP.x}px;top:${DROP.y - 30}px;width:760px;height:18px;margin:-9px 0 0 -380px;border-radius:50%;background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(255,236,200,.95),rgba(255,160,70,.35) 35%,rgba(255,120,40,0) 70%);mix-blend-mode:screen;opacity:0`);
    el.beamGlow = h('div', 'beam-glow', d, `left:${DROP.x}px;top:${DROP.y - 1500}px`);
    el.beamBlur = h('div', 'beam-core beam-sheath', d, `left:${DROP.x}px;top:${DROP.y - 1500}px`);
    el.beamCore = h('div', 'beam-core', d, `left:${DROP.x}px;top:${DROP.y - 1500}px`);
    el.lie = h('div', '', d, `left:${DROP.x}px;top:${DROP.y}px;width:0;height:0`);
    const lh = 560, lw = lh * SWORD_AR;
    el.lieInner = h('div', '', el.lie, `left:0;top:0;width:0;height:0`);
    el.lieGlow = h('img', '', el.lieInner, `left:${f2(-lw / 2)}px;top:${-lh / 2}px;width:${f2(lw)}px;height:${lh}px;filter:blur(6px);mix-blend-mode:screen`);
    el.lieGlow.src = IMG + 'saint-breaker-glow.webp';
    el.lieImg = h('img', '', el.lieInner, `left:${f2(-lw / 2)}px;top:${-lh / 2}px;width:${f2(lw)}px;height:${lh}px`);
    el.lieImg.src = IMG + 'saint-breaker-large.webp';
    el.motes = [];
    for (let i = 0; i < 14; i++) {
      el.motes.push({ d: h('div', 'ember', d, ''), x: (R() - 0.5) * 40, ph: R(), sp: 0.6 + R() * 0.8, sz: 0.6 + R() });
    }
    el.sparks = [];
    for (let i = 0; i < 34; i++) {
      const a = -Math.PI / 2 + (R() - 0.5) * 2.6;
      const v = 380 + R() * 620;
      el.sparks.push({ d: h('div', 'spark', d, ''), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.9, life: 0.5 + R() * 0.7 });
    }
    const LW = 470, LH = 92;
    el.label = h('div', '', d, `left:${DROP.x - LW / 2}px;top:${DROP.y - 268}px;width:${LW}px;height:${LH + 40}px`);
    const plate = `M18 0 L${LW - 18} 0 L${LW} ${LH / 2} L${LW - 18} ${LH} L18 ${LH} L0 ${LH / 2} Z`;
    el.labelBg = svg(el.label, LW, LH, `
      <defs><linearGradient id="lp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b211c"/><stop offset=".5" stop-color="#140e0b"/><stop offset="1" stop-color="#0a0706"/></linearGradient></defs>
      <path d="${plate}" fill="url(#lp)" fill-opacity=".92"/>
      <path d="M24 6 L${LW - 24} 6 L${LW - 8} ${LH / 2} L${LW - 24} ${LH - 6} L24 ${LH - 6} L8 ${LH / 2} Z" fill="none" stroke="url(#g-gold-h)" stroke-width="1.5"/>
      <path d="${plate}" fill="none" stroke="#ff8a3a" stroke-opacity=".55" stroke-width="2"/>
      <path d="M${LW / 2 - 70} ${LH - 6} L${LW / 2 + 70} ${LH - 6}" stroke="#ffb46a" stroke-width="2" stroke-opacity=".8"/>`, 'left:0;top:0');
    const nm = 'Saint-Breaker';
    el.labelBloom = h('div', 'title bloom-ember', el.label, `left:0;width:${LW}px;top:8px;text-align:center;font-size:54px`, nm);
    el.labelText = h('div', 'title molten', el.label, `left:0;width:${LW}px;top:8px;text-align:center;font-size:54px`, nm);
    h('div', 'label', el.label, `left:0;width:${LW}px;top:64px;text-align:center;color:#ffb070;font-size:17px;letter-spacing:2px`, 'Legendary Flamberge');
    el.labelSweep = h('div', '', el.label, `left:0;top:0;width:${LW}px;height:${LH}px;clip-path:path('${plate}');-webkit-clip-path:path('${plate}');overflow:hidden`);
    el.labelSweepBar = h('div', '', el.labelSweep, `left:0;top:-40px;width:90px;height:${LH + 80}px;transform-origin:50% 50%;
      background:linear-gradient(90deg,rgba(255,230,180,0),rgba(255,240,210,.55),rgba(255,230,180,0));mix-blend-mode:screen`);
    el.tether = svg(d, 20, 120, `<path d="M10 0 L10 104" stroke="url(#g-gold)" stroke-width="1.5"/><path d="M10 104 L15 110 L10 116 L5 110 Z" fill="#ffb46a"/>`,
      `left:${DROP.x - 10}px;top:${DROP.y - 176}px`);
  }

  const ORB_Y = 928;
  function buildHud() {
    const hud = document.getElementById('hud');
    el.hud = hud;
    hud.style.cssText = 'left:0;top:0;width:1920px;height:1080px';
    const PX = 680, PW = 560, PY = 960;
    ui(hud, 'arm-l.webp', 535, PY - 6, 135, 60);
    ui(hud, 'arm-r.webp', PX + PW + 10, PY - 6, 135, 60);
    ui(hud, 'skill-plate.webp', PX - 40, PY - 30, PW + 80, 120);
    ui(hud, 'plate-crest.webp', 840, PY - 56, 240, 44);
    el.xp = h('div', '', hud, `left:${PX + 4}px;top:${PY - 10}px;width:${f2((PW - 8) * 0.64)}px;height:4px;border-radius:2px;background:linear-gradient(90deg,#8a2a06,#ff8a2a 85%,#ffe2a6)`);
    h('div', '', hud, `left:${PX + 4}px;top:${PY - 14}px;width:${f2((PW - 8) * 0.64)}px;height:12px;border-radius:6px;opacity:.5;mix-blend-mode:screen;background:radial-gradient(ellipse 50% 50% at 92% 50%,rgba(255,150,60,.8),rgba(255,110,30,0)),linear-gradient(180deg,rgba(255,110,30,0),rgba(255,110,30,.35) 50%,rgba(255,110,30,0))`);
    const skills = ['1', '2', '3', '4', 'R'];
    el.skills = skills.map((key, i) => {
      const g = h('div', '', hud, `left:${PX + 30 + i * 88}px;top:${PY + 12}px;width:72px;height:72px`);
      if (i === 1) {
        h('div', '', g, 'left:5px;top:5px;width:62px;height:62px;border-radius:6px;mix-blend-mode:screen;' +
          'background:radial-gradient(circle at 50% 55%,rgba(255,150,60,.55),rgba(255,90,20,.2) 45%,rgba(255,70,10,0) 75%);' +
          'box-shadow:inset 0 0 0 1px rgba(255,150,70,.55),inset 0 0 12px rgba(255,110,40,.45)');
      }
      h('div', 'keycap', g, 'left:-6px;top:52px;min-width:26px;height:26px;line-height:26px;font-size:16px', lone(key));
      return g;
    });
    el.cool = h('div', '', el.skills[0], 'left:6px;top:6px;width:60px;height:60px;background:rgba(0,0,0,.6)');
    el.skills[0].insertBefore(el.cool, el.skills[0].querySelector('.keycap'));
    const fl = h('div', '', hud, `left:${PX + PW - 84}px;top:${PY + 4}px;width:60px;height:88px`);
    h('img', 'item', fl, 'left:4px;top:6px;width:52px;height:76px').src = IMG + 'ember-flask.webp';
    h('div', 'count', fl, 'right:4px;bottom:10px', lone('3'));    el.orbs = [AR.orbs.build(hud, 440, ORB_Y, 'life'), AR.orbs.build(hud, 1480, ORB_Y, 'wrath')];
    ui(hud, 'bracket-l.webp', 532, PY - 13, 56, 76);
    ui(hud, 'bracket-r.webp', 1332, PY - 13, 56, 76);
  }
  function rHud(t) {
    const k = 1 - env(t, T.open - 0.15, T.open + 0.2, T.closed - 0.35, T.closed + 0.1);
    op(el.hud, k);
    if (k <= 0) return;
    const [sx, sy] = shake(t, T.impact, 6, 9, 2);
    tf(el.hud, `translate(${f2(sx)}px,${f2(sy + 30 * (1 - k))}px)`);
    el.orbs.forEach((o) => AR.orbs.render(o, t));
    const cu = (t % 5) / 5;
    tf(el.cool, `scaleY(${f2(1 - cu)})`);
    set(el.cool, 'transform-origin', '50% 100%');
  }

  function sectionHead(parent, y, label) {
    h('div', 'label', parent, `left:0;width:540px;top:${y}px;text-align:center;color:#d2b47a;font-size:18px;letter-spacing:3px`, label);
    svg(parent, 420, 14, A.flourish(420, '#8a6a3a').replace(/#d8c39a/g, '#2a140c'), `left:60px;top:${y + 24}px;overflow:visible`, '-210 -7 420 14');
  }
  function buildLedger() {
    const p = document.getElementById('ledger');
    el.ledger = p;
    p.style.cssText = `left:${LEDGER.x}px;top:${LEDGER.y}px;width:${LEDGER.w}px;height:${LEDGER.h}px`;
    bakeDiv(p, 'panel-ledger.jpg', LEDGER.w, LEDGER.h, PANELS.ledger.outer);
    cartouche(p, LEDGER.w / 2, -14, 'Ledger');
    el.roundels = {};
    [['damage', 110, 'Damage'], ['armor', 270, 'Armor'], ['life', 430, 'Life']].forEach(([k, cx, lbl]) => {
      const g = h('div', '', p, `left:${cx - 70}px;top:${108}px;width:140px;height:170px`);
      ui(g, `medal-${k}.webp`, 0, 0, 140, 140);
      const glow = h('div', 'num', g, `left:0;width:140px;top:58px;text-align:center;font-size:34px;color:#ff8a2a;filter:blur(7px);opacity:0`, '');
      const n = h('div', 'num', g, `left:0;width:140px;top:58px;text-align:center;font-size:34px`, '');
      h('div', 'label', g, `left:0;width:140px;top:146px;text-align:center;font-size:18px;color:#c9ad80;letter-spacing:1px`, lbl);
      el.roundels[k] = { n, glow, g };
    });
    sectionHead(p, 300, 'Attributes');
    el.rows = {};
    const rows = (y0, list) => list.forEach(([k, lbl, ic], i) => {
      const r = h('div', 'statrow', p, `left:64px;width:412px;top:${y0 + i * 38}px`);
      h('img', '', r, 'left:0;top:6px;width:22px;height:22px').src = `assets/ui/tool-${ic}.webp`;
      h('div', 'label', r, 'left:32px;top:8px', lbl);
      h('div', 'lead', r, 'left:32px;right:70px;top:27px');
      const glow = h('div', 'num', r, 'right:0;top:4px;font-size:24px;color:#ff8a2a;filter:blur(6px);opacity:0', '');
      const n = h('div', 'num', r, 'right:0;top:4px;font-size:24px', '');
      const delta = h('div', 'label', r, 'left:418px;top:9px;font-size:17px;color:#8fe08a;font-weight:700;opacity:0', '');
      el.rows[k] = { n, glow, delta, r };
    });
    rows(340, [['strength', 'Strength', 'strength'], ['faith', 'Faith', 'faith'], ['wrath', 'Wrath', 'wrath'], ['fortitude', 'Fortitude', 'fortitude']]);
    sectionHead(p, 506, 'Offense');
    rows(546, [['crit', 'Critical Strike', 'crit'], ['speed', 'Attacks per Second', 'speed'], ['fire', 'Fire Damage', 'fire'], ['undying', 'Damage to the Undying', 'undying']]);
    sectionHead(p, 712, 'Resistances');
    [['fire', 38], ['frost', 52], ['blight', 24], ['shadow', 31], ['holy', 60]].forEach(([k, v], i) => {
      const x = 92 + i * 80;
      const g = h('div', '', p, `left:${x - 26}px;top:752px;width:52px;height:70px`);
      ui(g, `shield-${k}.webp`, 0, 0, 52, 58);
      h('div', 'num', g, 'left:0;width:52px;top:60px;text-align:center;font-size:18px', v + '%');
    });
    el.ledgerDim = h('div', '', p, `left:0;top:0;width:${LEDGER.w}px;height:${LEDGER.h}px;background:#050302;opacity:0;clip-path:path('${PANELS.ledger.outer}')`);
  }

  function cartouche(parent, cx, y, label) {
    const W = 250, H = 58;
    const g = h('div', '', parent, `left:${cx - W / 2}px;top:${y}px;width:${W}px;height:${H}px`);
    ui(g, 'cartouche.webp', 0, 0, W, H);
    h('div', 'title gilt', g, `left:0;width:${W}px;top:9px;text-align:center;font-size:36px`, label);
    return g;
  }

  const RP = (r, deg) => {
    const a = deg * Math.PI / 180;
    return [ROSE.r * r * Math.sin(a), -ROSE.r * r * Math.cos(a)];
  };
  const OATH_OLD = [[0, 0], RP(0.25, 30), RP(0.6, 30), RP(0.86, 45)];
  const OATH_NEW = [[0, 0], RP(0.25, 330), RP(0.6, 0), RP(0.86, 345)];
  function buildOath(RS, rcss, vb) {
    const seg = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
    const line = ([a, b]) => `M${f2(a[0])} ${f2(a[1])} L${f2(b[0])} ${f2(b[1])}`;
    const groove = [...seg(OATH_OLD), ...seg(OATH_NEW)].map(line).join(' ');
    const nodes = (pts, col, r0) => pts.map((p, i) => `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${i === 0 ? r0 + 4 : r0}" fill="#120a06" stroke="${col}" stroke-width="2.4"/>`).join('');
    el.oathBase = svg(el.recess, RS, RS, `
      <path d="${groove}" stroke="#000" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>
      <path d="${seg(OATH_OLD).map(line).join(' ')}" stroke="url(#g-gold)" stroke-width="2.6" stroke-linecap="round"/>
      ${nodes(OATH_OLD, 'url(#g-gold)', 7)}
      ${nodes(OATH_NEW.slice(1), '#5a4a3a', 7)}`, rcss + ';opacity:0', vb);
    el.oathSegs = seg(OATH_NEW).map((s0) => {
      const len = Math.hypot(s0[1][0] - s0[0][0], s0[1][1] - s0[0][1]);
      return { d: line(s0), len };
    });
    const segMarkup = (w, col) => el.oathSegs.map((sg, i) => `<path id="os${w}-${i}" d="${sg.d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${f2(sg.len)} ${f2(sg.len + 2)}" stroke-dashoffset="${f2(sg.len)}"/>`).join('');
    el.oathGlow = svg(el.recess, RS, RS, segMarkup(9, '#ff6a12'), rcss + ';filter:blur(5px);mix-blend-mode:screen;opacity:0', vb);
    el.oathCore = svg(el.recess, RS, RS, segMarkup(3, '#ffe2a6'), rcss + ';opacity:0', vb);
    el.oathSegEls = el.oathSegs.map((_, i) => [el.oathGlow.querySelector(`#os9-${i}`), el.oathCore.querySelector(`#os3-${i}`)]);
    el.oathNodes = OATH_NEW.slice(1).map((p, i) => {
      const last = i === OATH_NEW.length - 2;
      const size = last ? 120 : 64;
      const n = h('div', '', el.recess, `left:${f2(ROSE.x + p[0] - size / 2)}px;top:${f2(ROSE.y + p[1] - size / 2)}px;width:${size}px;height:${size}px;border-radius:50%;
        background:radial-gradient(circle,rgba(255,240,200,.95),rgba(255,140,40,.6) 22%,rgba(255,90,20,0) 62%);mix-blend-mode:screen;opacity:0`);
      return { n, last };
    });
    el.oathStarGlow = h('div', '', el.recess, `left:${f2(ROSE.x + OATH_NEW[3][0] - 60)}px;top:${f2(ROSE.y + OATH_NEW[3][1] - 60)}px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(255,200,120,.9),rgba(255,110,30,.35) 30%,rgba(255,80,20,0) 65%);mix-blend-mode:screen;opacity:0`);
    el.oathStar = svg(el.recess, 90, 90, A.sparkle(26, '#ffe2b0'), `left:${f2(ROSE.x + OATH_NEW[3][0] - 45)}px;top:${f2(ROSE.y + OATH_NEW[3][1] - 45)}px;opacity:0`, '-45 -45 90 90');
  }

  function buildNiche() {
    const p = document.getElementById('niche');
    el.niche = p;
    p.style.cssText = `left:${NICHE.x}px;top:${NICHE.y}px;width:${NICHE.w}px;height:${NICHE.h}px`;
    bakeDiv(p, 'panel-niche.jpg', NICHE.w, NICHE.h, PANELS.niche.outer);
    el.recess = h('div', '', p, `left:0;top:0;width:${NICHE.w}px;height:${NICHE.h}px;clip-path:path('${PANELS.niche.inner}');-webkit-clip-path:path('${PANELS.niche.inner}')`);
    const rose = A.roseWindow(ROSE.r);
    const RS = ROSE.r * 2 + 20;
    const vb = `${-RS / 2} ${-RS / 2} ${RS} ${RS}`;
    const rcss = `left:${ROSE.x - RS / 2}px;top:${ROSE.y - RS / 2}px`;
    el.roseHalo = h('div', '', el.recess, `left:${ROSE.x - 260}px;top:${ROSE.y - 260}px;width:520px;height:520px;border-radius:50%;
      background:radial-gradient(circle,rgba(140,170,230,.30),rgba(90,110,180,.10) 45%,rgba(60,70,120,0) 70%);mix-blend-mode:screen`);
    el.roseGlass = svg(el.recess, RS, RS, `<g opacity=".55">${rose.glass}</g>`, rcss, vb);
    el.roseGlass.insertAdjacentHTML('afterbegin', rose.base);
    el.roseLit = svg(el.recess, RS, RS, rose.glass, rcss + ';mix-blend-mode:screen;opacity:0', vb);
    el.roseBloom = svg(el.recess, RS, RS, rose.glass, rcss + ';mix-blend-mode:screen;opacity:0;filter:blur(12px)', vb);
    h('div', '', el.recess, `left:${ROSE.x - ROSE.r}px;top:${ROSE.y - ROSE.r}px;width:${ROSE.r * 2}px;height:${ROSE.r * 2}px;border-radius:50%;` +
      'background:url(assets/grime.jpg) 0 0/260px 260px;mix-blend-mode:multiply;opacity:.85');
    svg(el.recess, RS, RS, rose.lead + rose.stone, rcss, vb);
    buildOath(RS, rcss, vb);
    el.shaft = h('div', '', el.recess, 'left:150px;top:200px;width:340px;height:700px;mix-blend-mode:screen;filter:blur(10px)');
    h('div', '', el.shaft, 'left:0;top:0;width:340px;height:700px;background:linear-gradient(180deg,rgba(150,180,235,.16),rgba(150,180,235,0) 90%);clip-path:polygon(32% 0,68% 0,100% 100%,0 100%)');
    el.ringWrap = h('div', '', el.recess, `left:${EFFIGY.cx - 170}px;top:${EFFIGY.bottom - 170}px;width:340px;height:340px;transform:scaleY(.26)`);
    let ringRunes = '';
    for (let i = 0; i < 18; i++) ringRunes += `<path transform="rotate(${i * 20}) translate(0 -142)" d="${A.runePath(i, 16)}"/>`;
    el.ringSvg = svg(el.ringWrap, 340, 340, `
      <circle r="160" fill="none" stroke="#ff8a3a" stroke-width="2.5"/>
      <circle r="124" fill="none" stroke="#ff8a3a" stroke-width="1.5"/>
      <g fill="none" stroke="#ffb46a" stroke-width="2.2" stroke-linecap="square">${ringRunes}</g>`, 'left:0;top:0;mix-blend-mode:screen;opacity:0', '-170 -170 340 340');
    el.ringBloom = h('div', '', el.ringWrap, `left:0;top:0;width:340px;height:340px;border-radius:50%;
      background:radial-gradient(circle,rgba(255,120,40,.0) 30%,rgba(255,130,50,.45) 48%,rgba(255,110,30,0) 62%);mix-blend-mode:screen;opacity:0`);
    const ew = EFFIGY.h * 715 / 1561;
    el.effigy = h('img', '', el.recess, `left:${f2(EFFIGY.cx - ew / 2)}px;top:${EFFIGY.bottom - EFFIGY.h}px;width:${f2(ew)}px;height:${EFFIGY.h}px`);
    el.effigy.src = IMG + 'effigy.webp';
    el.sword = h('div', '', el.recess, 'left:0;top:0;width:0;height:0');
    const sw = 1000 * SWORD_AR;
    el.swordScale = h('div', '', el.sword, `left:0;top:0;width:${f2(sw)}px;height:1000px;transform-origin:0 0`);
    el.swordHalo = h('div', '', el.swordScale, `left:-80px;top:-60px;width:${f2(sw + 160)}px;height:1120px;overflow:hidden`);
    const haloImg = h('img', '', el.swordHalo, `left:80px;top:60px;width:${f2(sw)}px;height:1000px;filter:blur(8px)`);
    haloImg.src = IMG + 'saint-breaker-glow.webp';
    el.swordImg = h('img', '', el.swordScale, `left:0;top:0;width:${f2(sw)}px;height:1000px`);
    el.swordImg.src = IMG + 'saint-breaker-large.webp';
    el.swordHot = h('div', '', el.swordScale, `left:0;top:0;width:${f2(sw)}px;height:1000px;overflow:hidden`);
    h('img', '', el.swordHot, `left:0;top:0;width:${f2(sw)}px;height:1000px`).src = IMG + 'saint-breaker-hot.webp';
    el.runes = RUNE_Y.map((v, i) => {
      const x = BLADE_X * sw, y = v * 1000;
      const box = h('div', '', el.swordScale, `left:${f2(x - 40)}px;top:${f2(y - 40)}px;width:80px;height:80px`);
      const pd = A.runePath(i, 30);
      const eng = svg(box, 80, 80, `<path d="${pd}" fill="none" stroke="#1a0f0a" stroke-width="4" stroke-linecap="square"/>
        <path d="${pd}" transform="translate(1 1)" fill="none" stroke="#c9c2b8" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="square"/>`, 'left:0;top:0', '-40 -40 80 80');
      const glow = svg(box, 80, 80, `<path d="${pd}" fill="none" stroke="#ff6a12" stroke-width="11" stroke-linecap="round"/>`, 'left:0;top:0;filter:blur(8px);mix-blend-mode:screen;opacity:0', '-40 -40 80 80');
      const core = svg(box, 80, 80, `<path d="${pd}" fill="none" stroke="#ffe7b0" stroke-width="5" stroke-linecap="square"/>
        <path d="${pd}" fill="none" stroke="#fffaf0" stroke-width="2" stroke-linecap="square"/>`, 'left:0;top:0;opacity:0', '-40 -40 80 80');
      return { box, eng, glow, core };
    });
    const sx = SOCKET_U[0] * sw, sy = SOCKET_U[1] * 1000;
    el.socketRing = ui(el.swordScale, 'socket.webp', f2(sx - 19), f2(sy - 19), 38, 38);
    el.socketGem = svg(el.swordScale, 60, 60, A.gem('ember', 13), `left:${f2(sx - 30)}px;top:${f2(sy - 30)}px;opacity:0`, '-30 -30 60 60');
    el.socketGlow = h('div', '', el.swordScale, `left:${f2(sx - 60)}px;top:${f2(sy - 60)}px;width:120px;height:120px;border-radius:50%;
      background:radial-gradient(circle,rgba(255,90,50,.9),rgba(255,60,30,.3) 35%,rgba(255,40,20,0) 70%);mix-blend-mode:screen;opacity:0`);
    svg(p, NICHE.w, NICHE.h, `<path d="${PANELS.niche.molding}" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="5"/>
      <path d="${PANELS.niche.molding}" fill="none" stroke="url(#g-gold-h)" stroke-width="2.4"/>`, 'left:0;top:0');
    el.slots = {};
    for (const k in SLOTS) {
      const [key, x, y, w, hh, rar] = SLOTS[k];
      const sl = h('div', '', p, `left:${x}px;top:${y}px;width:${w}px;height:${hh}px`);
      const arch = `M0 ${hh} L0 16 Q0 0 ${w / 2} 0 Q${w} 0 ${w} 16 L${w} ${hh} Z`;
      svg(sl, w, hh, `<path d="${arch}" fill="#0b0806" fill-opacity=".86"/>`, 'left:0;top:0');
      const back = h('div', 'rarity r-' + rar, sl, `left:3px;top:3px;width:${w - 6}px;height:${hh - 6}px;border-radius:${w / 2 - 3}px ${w / 2 - 3}px 3px 3px`);
      const im = h('img', 'item', sl, `left:4px;top:4px;width:${w - 8}px;height:${hh - 8}px;object-fit:contain`);
      im.src = IMG + key + '.webp';
      ui(sl, `slot-${w}x${hh}.webp`, 0, 0, w, hh);
      el.slots[k] = { sl, back, im };
    }
    const ms = el.slots.main;
    ms.newBack = h('div', 'rarity r-legendary', ms.sl, `left:3px;top:3px;width:72px;height:134px;border-radius:36px 36px 3px 3px;opacity:0`);
    ms.newIm = h('img', 'item', ms.sl, `left:4px;top:4px;width:70px;height:132px;opacity:0`);
    ms.newIm.src = IMG + 'saint-breaker.webp';
    ms.sl.appendChild(ms.sl.children[3]);
    el.nameplate = h('div', '', p, `left:0;top:860px;width:${NICHE.w}px;height:70px`);
    h('div', 'title gilt', el.nameplate, `left:0;width:${NICHE.w}px;top:6px;text-align:center;font-size:36px`, 'Odran Vael');
    h('div', 'label', el.nameplate, `left:0;width:${NICHE.w}px;top:46px;text-align:center;color:#d0b98f;font-size:17px;letter-spacing:2px`, 'Penitent of the Ashen Vigil, Level 47');
    svg(p, 64, 64, A.cornerFleuron(), 'left:-2px;top:870px;transform:scale(.62);transform-origin:0 0');
    svg(p, 64, 64, A.cornerFleuron(), `left:${NICHE.w + 2}px;top:870px;transform:scale(-.62,.62);transform-origin:0 0`);
    el.nicheDim = h('div', '', p, `left:0;top:0;width:${NICHE.w}px;height:${NICHE.h}px;background:#050302;opacity:0;clip-path:path('${PANELS.niche.outer}')`);
  }

  function buildChest() {
    const p = document.getElementById('chest');
    el.chest = p;
    p.style.cssText = `left:${CHEST.x}px;top:${CHEST.y}px;width:${CHEST.w}px;height:${CHEST.h}px`;
    bakeDiv(p, 'panel-chest.jpg', CHEST.w, CHEST.h, PANELS.chest.outer);
    cartouche(p, CHEST.w / 2, -14, 'Reliquary');
    [['Arms', 0, 1], ['Relics', 1, 0], ['Gems', 2, 0]].forEach(([lbl, i, on]) => {
      const g = h('div', '', p, `left:${46 + i * 152}px;top:50px;width:140px;height:40px`);
      ui(g, `tab-${on ? 'on' : 'off'}.webp`, 0, 0, 140, 40);
      if (on) h('div', '', g, 'left:34px;top:29px;width:72px;height:4px;border-radius:2px;background:#ff8a3a;box-shadow:0 0 6px 1px rgba(255,150,70,.45)');
      h('div', on ? 'title' : 'label', g, `left:0;width:140px;top:${on ? 7 : 11}px;text-align:center;font-size:${on ? 22 : 17}px;color:${on ? '#f6dfa4' : '#bba582'}`, lbl);
    });
    el.items = {};
    for (const it of INV) {
      const [key, c, r, w, hh, rar, count] = it;
      const x = 30 + c * CELL, y = 96 + r * CELL;
      const g = h('div', '', p, `left:${x}px;top:${y}px;width:${w * CELL}px;height:${hh * CELL}px`);
      const back = h('div', 'rarity r-' + (rar === 'gem' ? 'common' : rar), g, `left:3px;top:3px;width:${w * CELL - 6}px;height:${hh * CELL - 6}px`);
      let im;
      if (key.startsWith('gem:')) {
        const kind = key.slice(4);
        im = svg(g, CELL, CELL, A.gem(kind, 17), 'left:0;top:0', '-30 -30 60 60');
        const halo = h('div', '', g, `left:6px;top:6px;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle,${A.GEMS[kind].glow}55,${A.GEMS[kind].glow}00 70%)`);
        g.insertBefore(halo, im);
        el.items[key + ':halo'] = halo;
      } else {
        im = h('img', 'item', g, `left:2px;top:2px;width:${w * CELL - 4}px;height:${hh * CELL - 4}px`);
        im.src = IMG + key + '.webp';
      }
      if (count) h('div', 'count', g, 'right:6px;bottom:4px', lone(String(count)));
      el.items[key] = { g, back, im, c, r, w, hh };
    }
    el.hover = svg(p, 2 * CELL + 12, 4 * CELL + 12, (() => {
      const W = 2 * CELL + 12, H = 4 * CELL + 12, k = 16;
      return `<g fill="none" stroke="#ffd38a" stroke-width="2.5">
        <path d="M2 ${k} L2 2 L${k} 2 M${W - k} 2 L${W - 2} 2 L${W - 2} ${k} M${W - 2} ${H - k} L${W - 2} ${H - 2} L${W - k} ${H - 2} M${k} ${H - 2} L2 ${H - 2} L2 ${H - k}"/></g>
        <rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="#ffb46a" stroke-opacity=".45" stroke-width="1"/>`;
    })(), `left:${30 - 6}px;top:${96 - 6}px;opacity:0`);
    el.newMark = svg(p, 24, 24, `<path d="M12 1 L23 12 L12 23 L1 12 Z" fill="#ff8a2a" stroke="#2a0e02" stroke-width="1.5"/><path d="M12 6 L18 12 L12 18 L6 12 Z" fill="#fff0c8"/>`,
      `left:${30 + 2 * CELL - 26}px;top:${96 + 4}px;opacity:0`);
    const fy = 96 + 8 * CELL + 30;
    svg(p, 470, 16, A.flourish(470, '#8a6a3a').replace(/#d8c39a/g, '#2a140c'), `left:35px;top:${fy - 18}px;overflow:visible`, '-235 -8 470 16');
    const gold = h('div', '', p, `left:52px;top:${fy + 6}px;width:200px;height:44px`);
    ui(gold, 'coin.webp', 0, 0, 40, 40);
    el.goldNum = h('div', 'num', gold, 'left:46px;top:8px;font-size:28px', '12,480');
    const sh = h('div', '', p, `left:290px;top:${fy + 6}px;width:200px;height:44px`);
    svg(sh, 40, 40, A.shard(16), 'left:0;top:0', '-20 -20 40 40');
    h('div', 'num', sh, 'left:46px;top:8px;font-size:28px', '64');
    const by = fy + 100;
    svg(p, 470, 30, `<path d="M0 15 L470 15" stroke="#1a0c06" stroke-width="16" stroke-linecap="round"/>
      <path d="M0 15 L470 15" stroke="#4a2414" stroke-width="12" stroke-linecap="round"/>
      <path d="M6 10 L464 10 M6 20 L464 20" stroke="#c9a070" stroke-opacity=".35" stroke-width="1" stroke-dasharray="4 4"/>`, `left:35px;top:${by + 26}px`);
    [['ember-flask', '3'], ['ember-flask', '2'], ['ampulla', '1'], [null, ''], [null, '']].forEach(([key, n], i) => {
      const x = 62 + i * 90, w = 70, hh = 84;
      const g = h('div', '', p, `left:${x}px;top:${by}px;width:${w}px;height:${hh}px`);
      const arch = `M0 ${hh} L0 16 Q0 0 ${w / 2} 0 Q${w} 0 ${w} 16 L${w} ${hh} Z`;
      svg(g, w, hh, `<path d="${arch}" fill="#0b0806" fill-opacity=".9"/>`, 'left:0;top:0');
      if (key) h('img', 'item', g, `left:6px;top:6px;width:${w - 12}px;height:${hh - 12}px;object-fit:contain`).src = IMG + key + '.webp';
      ui(g, `slot-${w}x${hh}.webp`, 0, 0, w, hh);
      h('div', 'keycap', g, `left:${w / 2 - 12}px;top:${hh - 6}px;min-width:28px;height:24px;line-height:24px;font-size:15px`, 'F' + (i + 1));
      if (n) h('div', 'count', g, 'right:6px;top:6px', lone(n));
    });    el.packText = h('div', 'label', p, `left:52px;top:${fy + 60}px;width:440px;font-size:18px;color:#c4ad88;letter-spacing:1px`, '');
  }

  function buildTip(parent, cfg) {
    const V = cfg.page;
    const root = h('div', 'vellum', parent, `left:${cfg.x}px;top:${cfg.y}px;width:${V.w}px;height:${V.h}px;transform-origin:50% 0`);
    const shadow = h('div', '', root, `left:10px;top:16px;width:${V.w}px;height:${V.h}px;background:#000;opacity:.55;filter:blur(14px);border-radius:10px`);
    const sheet = h('div', '', root, `left:0;top:0;width:${V.w}px;height:${V.h}px`);
    h('div', 'page', sheet, `width:${V.w}px;height:${V.h}px;background-image:url(assets/${cfg.img});clip-path:path('${V.outer}');-webkit-clip-path:path('${V.outer}')`);
    const lines = [];
    const add = (node, y) => { lines.push({ node, y }); return node; };
    cfg.content(sheet, add);
    const clasp = h('div', '', root, `left:${V.w / 2 - 75}px;top:-20px;width:150px;height:40px`);
    ui(clasp, 'clasp.webp', 0, 0, 150, 40);
    if (cfg.gem) svg(clasp, 40, 40, A.gem(cfg.gem, 12), 'left:55px;top:0', '-20 -20 40 40');
    const curl = h('div', '', root, `left:4px;top:0;width:${V.w - 8}px;height:26px;border-radius:13px;
      background:linear-gradient(180deg,#5a4024,#d9c39a 40%,#f3e4c0 55%,#8a6a40 85%,#3a2814);box-shadow:0 6px 10px rgba(0,0,0,.5)`);
    let seal = null;
    if (cfg.seal) {
      const [sx, sy] = cfg.seal;
      const wax = h('div', '', sheet, `left:${sx - 42}px;top:${sy - 41}px;width:84px;height:84px;transform-origin:42px 41px`);
      ui(wax, 'seal-wax.webp', 0, 0, 84, 84);
      seal = { wax };
    }
    return { root, sheet, shadow, lines, clasp, curl, V, seal };
  }
  function rarityGemRow(parent, x, y) {
    const g = h('div', '', parent, `left:${x}px;top:${y}px;width:400px;height:36px`);
    const ring = ui(g, 'socket.webp', 0, 0, 36, 36);
    const gm = svg(g, 36, 36, A.gem('ember', 11), 'left:0;top:0;opacity:0', '-18 -18 36 36');
    const empty = h('div', 'ink faded', g, 'left:46px;top:6px', 'Empty Socket');
    const full = h('div', 'ink rubric', g, 'left:46px;top:6px;opacity:0;font-weight:700', 'Ember Tear: +22% Fire Damage');
    return { g, ring, gm, empty, full };
  }
  const rule = (pg, add, x, y, w) => add(svg(pg, w, 14, A.flourish(w, '#3a2210'), `left:${x}px;top:${y}px;overflow:visible`, `${-w / 2} -7 ${w} 14`), y);
  function buildTips() {
    const tips = document.getElementById('tips');
    const MW = PANELS.vellum.w;
    el.tip = buildTip(tips, {
      x: 890, y: 146, page: PANELS.vellum, img: 'vellum-main.jpg', gem: 'ember', seal: [378, 545],
      content: (pg, add) => {
        add(h('div', 'itemname', pg, 'left:36px;top:38px;color:#5e1004', 'Saint-Breaker'), 40);
        add(h('div', 'itemname molten', pg, 'left:36px;top:38px;background-image:linear-gradient(180deg,#8a2408,#661205 55%,#3e0a03)', 'Saint-Breaker'), 40);
        add(h('div', 'ink italic rubric', pg, 'left:38px;top:94px;font-size:21px;font-weight:700', 'Legendary Flamberge'), 94);
        add(h('div', 'ipower', pg, 'right:36px;top:36px', '725'), 38);
        add(h('div', 'ink small faded', pg, 'right:36px;top:96px', 'Item Power'), 96);
        rule(pg, add, 35, 128, MW - 70);
        add(h('div', 'ink', pg, 'left:38px;top:148px;font-size:34px;font-weight:800;font-family:AR Gotisch', '1,612'), 148);
        add(h('div', 'ink', pg, 'left:136px;top:158px', 'Damage per Second'), 158);
        el.tipDelta = add(h('div', 'ink up', pg, 'right:36px;top:158px', '+508'), 158);
        add(h('div', 'ink small faded', pg, 'left:38px;top:196px', '1,280 to 1,940 Damage per Hit'), 196);
        add(h('div', 'ink small faded', pg, 'left:38px;top:223px', '0.95 Attacks per Second'), 223);
        el.tipDelta2 = add(h('div', 'ink down small', pg, 'right:36px;top:223px', '-0.15'), 223);
        rule(pg, add, 35, 258, MW - 70);
        [['+84 Strength', '+20'], ['+18.5% Critical Strike Chance', '+6.5%'], ['+31% Damage to the Undying', '+19%'], ['+9% Movement Speed', '+9%']].forEach(([a, dlt], i) => {
          const y = 280 + i * 35;
          add(svg(pg, 14, 14, '<path d="M7 1 L13 7 L7 13 L1 7 Z" fill="#8a5a12" stroke="#2a1606" stroke-width="1"/>', `left:39px;top:${y + 6}px`), y);
          add(h('div', 'ink', pg, `left:62px;top:${y}px`, a), y);
          add(h('div', 'ink up small', pg, `right:36px;top:${y + 2}px`, dlt), y);
        });
        const py = 430;
        add(ui(pg, 'initial.webp', 36, py, 56, 56), py);
        add(h('div', 'dropcap', pg, `left:36px;top:${py - 1}px;width:56px;text-align:center;font-size:54px;color:#ffe2a0`, 'E'), py);
        add(h('div', 'ink rubric', pg, `left:102px;top:${py + 2}px;font-weight:700`, 'very fourth strike looses a'), py);
        add(h('div', 'ink rubric', pg, `left:102px;top:${py + 30}px;font-weight:700`, 'wave of cinders that burns'), py + 28);
        add(h('div', 'ink rubric', pg, `left:38px;top:${py + 60}px;font-weight:700`, 'for 210% weapon damage over 3 seconds.'), py + 56);
        el.tipShimmer = add(h('div', '', pg, `left:30px;top:${py - 4}px;width:${MW - 60}px;height:92px;overflow:hidden`), py);
        el.tipShimmerBar = h('div', '', el.tipShimmer, 'left:-80px;top:0;width:70px;height:92px;background:linear-gradient(90deg,rgba(255,240,200,0),rgba(255,236,190,.75),rgba(255,240,200,0));mix-blend-mode:screen');
        el.tipSocket = rarityGemRow(pg, 36, 530);
        add(el.tipSocket.g, 530);
        rule(pg, add, 35, 580, MW - 70);
        add(h('div', 'ink italic faded', pg, `left:0;width:${MW}px;top:602px;text-align:center;font-size:21px`, 'Cast from the bell that tolled her burning.'), 602);
        add(h('div', 'ink small', pg, 'left:38px;top:650px', 'Requires Level 45'), 650);
        add(h('div', 'ink small', pg, 'right:62px;top:650px', 'Sells for 3,210'), 650);
        add(ui(pg, 'coin.webp', MW - 57, 647, 24, 24), 650);
        const keys = h('div', '', pg, 'left:38px;top:698px;width:400px;height:30px');
        add(keys, 698);
        h('div', 'keycap', keys, 'left:0;top:0', 'E');
        h('div', 'ink small', keys, 'left:32px;top:2px', 'Equip');
        h('div', 'keycap', keys, 'left:112px;top:0', 'G');
        h('div', 'ink small', keys, 'left:144px;top:2px', 'Set a gem');
        h('div', 'keycap wide', keys, 'left:264px;top:0', 'Shift');
        h('div', 'ink small', keys, 'left:318px;top:2px', 'Compare');
      },
    });
    const CW = PANELS.vellumOld.w;
    el.cmp = buildTip(tips, {
      x: 890 - CW + 14, y: 196, page: PANELS.vellumOld, img: 'vellum-old.jpg', gem: null,
      content: (pg, add) => {
        add(h('div', 'ink small', pg, `left:0;width:${CW}px;top:34px;text-align:center;letter-spacing:3px;font-weight:700;color:#3a2410`, 'Equipped'), 34);
        add(h('div', 'itemname', pg, 'left:30px;top:64px;font-size:36px;font-weight:900;color:#3a2603', "Pilgrim's Oath"), 62);
        add(h('div', 'ink italic', pg, 'left:32px;top:106px;font-size:21px;font-weight:700;color:#3a2603', 'Rare Longsword'), 106);
        add(h('div', 'ipower', pg, 'right:30px;top:64px;font-size:42px', '610'), 64);
        rule(pg, add, 30, 140, CW - 60);
        add(h('div', 'ink', pg, 'left:32px;top:160px;font-size:30px;font-weight:800;font-family:AR Gotisch', '1,104'), 160);
        add(h('div', 'ink', pg, 'left:118px;top:168px', 'Damage per Second'), 168);
        add(h('div', 'ink small faded', pg, 'left:32px;top:204px', '860 to 1,340 Damage per Hit'), 204);
        add(h('div', 'ink small faded', pg, 'left:32px;top:231px', '1.10 Attacks per Second'), 231);
        rule(pg, add, 30, 264, CW - 60);
        ['+64 Strength', '+12.0% Critical Strike', '+12% Damage to the Undying'].forEach((a, i) => {
          const y = 286 + i * 35;
          add(svg(pg, 14, 14, '<path d="M7 1 L13 7 L7 13 L1 7 Z" fill="#7a5a1a" stroke="#2a1606" stroke-width="1"/>', `left:33px;top:${y + 6}px`), y);
          add(h('div', 'ink', pg, `left:56px;top:${y}px`, a), y);
        });
        const row = rarityGemRow(pg, 30, 400);
        add(row.g, 400);
        rule(pg, add, 30, 450, CW - 60);
        add(h('div', 'ink italic faded', pg, `left:0;width:${CW}px;top:472px;text-align:center;font-size:20px`, 'Walked to the shrine and back, twice.'), 472);
        add(h('div', 'ink small', pg, 'left:32px;top:520px', 'Requires Level 38'), 520);
      },
    });
  }
  function buildFx(R) {
    const fx = document.getElementById('fx');
    el.fly = h('div', '', fx, 'left:0;top:0;width:0;height:0');
    el.flyGlow = h('img', '', el.fly, 'left:-60px;top:-200px;width:120px;height:400px;filter:blur(8px);mix-blend-mode:screen');
    el.flyGlow.src = IMG + 'saint-breaker-glow.webp';
    el.flyImg = h('img', '', el.fly, 'left:-60px;top:-200px;width:120px;height:400px');
    el.flyImg.src = IMG + 'saint-breaker-large.webp';
    el.trail = [];
    for (let i = 0; i < 18; i++) el.trail.push(h('div', 'ember', fx, `width:${8 + R() * 8}px;height:${8 + R() * 8}px`));
    el.held = svg(fx, 80, 80, A.gem('ember', 18), 'left:0;top:0;opacity:0', '-40 -40 80 80');
    el.heldGlow = h('div', '', fx, `left:0;top:0;width:140px;height:140px;margin:-70px 0 0 -70px;border-radius:50%;background:radial-gradient(circle,rgba(255,70,40,.75),rgba(255,40,20,0) 65%);mix-blend-mode:screen;opacity:0`);
    el.impacts = ['land', 'set', 'equip'].map((name, k) => {
      const ring = h('div', '', fx, `left:0;top:0;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;
        background:radial-gradient(circle,rgba(255,160,60,0) 58%,rgba(255,210,140,.95) 66%,rgba(255,120,40,.35) 71%,rgba(255,90,30,0) 76%);mix-blend-mode:screen;opacity:0`);
      const flash = h('div', '', fx, `left:0;top:0;width:360px;height:360px;margin:-180px 0 0 -180px;border-radius:50%;
        background:radial-gradient(circle,rgba(255,250,235,.95),rgba(255,190,110,.5) 25%,rgba(255,110,40,0) 65%);mix-blend-mode:screen;opacity:0`);
      const streak = h('div', '', fx, `left:0;top:0;width:760px;height:18px;margin:-9px 0 0 -380px;border-radius:50%;background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(255,236,200,.95),rgba(255,160,70,.35) 35%,rgba(255,120,40,0) 70%);mix-blend-mode:screen;opacity:0`);
      const sparks = [];
      for (let i = 0; i < 22; i++) {
        const a = R() * TAU, v = 220 + R() * 420;
        sparks.push({ d: h('div', 'spark', fx, ''), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.35 + R() * 0.5 });
      }
      return { ring, flash, streak, sparks, seed: k };
    });
    el.ripple = h('div', '', fx, 'left:0;top:0;width:300px;height:300px;margin:-150px 0 0 -150px;border-radius:50%;backdrop-filter:url(#f-ripple);-webkit-backdrop-filter:url(#f-ripple);' +
      '-webkit-mask-image:radial-gradient(circle,transparent 38%,#000 46%,#000 54%,transparent 66%);mask-image:radial-gradient(circle,transparent 38%,#000 46%,#000 54%,transparent 66%);opacity:0');
    el.floats = ['+508'].map((txt) => h('div', 'title', fx, 'font-size:40px;color:#a8ec90;text-shadow:0 0 10px rgba(80,200,90,.7),0 2px 3px #000;opacity:0', txt));
    el.caption = h('div', '', fx, `left:${NICHE.x}px;top:${NICHE.y + 858}px;width:${NICHE.w}px;height:90px;opacity:0`);
    h('div', 'title bloom-ember', el.caption, `left:0;width:${NICHE.w}px;top:0;text-align:center;font-size:46px`, 'Ember Tear set');
    h('div', 'title molten', el.caption, `left:0;width:${NICHE.w}px;top:0;text-align:center;font-size:46px`, 'Ember Tear set');
    h('div', 'label', el.caption, `left:0;width:${NICHE.w}px;top:56px;text-align:center;font-size:19px;color:#ffc58a;letter-spacing:1.5px`, '+22% Fire Damage. The runes wake.');
    const OW = 560;
    el.oathLabel = h('div', '', fx, `left:${960 - OW / 2}px;top:4px;width:${OW}px;height:96px;opacity:0`);
    svg(el.oathLabel, OW, 70, `
      <defs><linearGradient id="ob" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a0605" stop-opacity="0"/><stop offset=".18" stop-color="#0a0605" stop-opacity=".88"/>
        <stop offset=".82" stop-color="#0a0605" stop-opacity=".88"/><stop offset="1" stop-color="#0a0605" stop-opacity="0"/></linearGradient></defs>
      <rect x="0" y="4" width="${OW}" height="62" fill="url(#ob)"/>
      <path d="M60 6 L${OW - 60} 6 M60 64 L${OW - 60} 64" stroke="url(#g-gold-h)" stroke-width="1.4"/>`, 'left:0;top:0');
    h('div', 'title bloom-ember', el.oathLabel, `left:0;width:${OW}px;top:9px;text-align:center;font-size:38px`, 'Oath of Cinders');
    h('div', 'title molten', el.oathLabel, `left:0;width:${OW}px;top:9px;text-align:center;font-size:38px`, 'Oath of Cinders');
    h('div', 'label', el.oathLabel, `left:0;width:${OW}px;top:72px;text-align:center;font-size:16px;color:#e8c08a;letter-spacing:2px`, 'Awakened in the rose by Saint-Breaker');
    el.cursor = document.getElementById('cursor');
    svg(el.cursor, 34, 40, A.cursor(), 'left:0;top:0');
  }

  function rWorld(t) {
    const menu = env(t, T.open, T.open + 0.55, T.close + 0.1, T.closed);
    el.menuK = menu;
    const [sx, sy] = shake(t, T.impact, 9, 8, 1);
    if (LIVE) { PTR.x += (PTR.tx - PTR.x) * 0.08; PTR.y += (PTR.ty - PTR.y) * 0.08; }
    const cx = 18 * per(t, 1) + sx - 26 * PTR.x, cy = 8 * per(t, 2, 1) + sy - 14 * PTR.y;
    const sc = 1.0 + 0.012 * per(t, 1, 2) + 0.04 * menu;
    tf(el.cam, `translate(${f2(cx)}px,${f2(cy)}px) scale(${f2(sc * 1000) / 1000})`);
    op(el.wMenu, menu);
    op(el.dim, menu * 0.42);
    el.torches.forEach((tc, i) => {
      const f = flicker(t, tc.seed);
      op(tc.g, 0.78 + 0.22 * f);
      op(tc.c, 0.65 + 0.35 * f);
      tf(tc.g, `scale(${f2(1 + 0.04 * f)})`);
    });
    el.fog.forEach((f, i) => tf(f, `translateX(${f2(60 * per(t, 1, i * 2))}px)`));
    tf(el.fgL, `translate(${f2(-cx * 1.8)}px,${f2(-cy * 1.2)}px)`);
    tf(el.fgR, `translate(${f2(-cx * 1.8)}px,${f2(-cy * 1.2 + 6 * per(t, 2))}px) rotate(${f2(1.2 * per(t, 1, 0.5))}deg)`);
    for (const e of el.embers) {
      const u = ((t / e.period + e.ph) % 1 + 1) % 1;
      const y = 1180 - u * 1300;
      const x = e.x0 + e.sway * Math.sin(TAU * (u * e.swayK + e.ph));
      const a = e.a * Math.sin(Math.PI * u) * (e.depth === 2 ? 0.6 : 1);
      tf(e.d, `translate(${f2(x)}px,${f2(y)}px)`);
      op(e.d, a);
    }
  }

  function rDrop(t) {
    const fall = lin(t, T.spark, T.impact);
    const live = t >= T.spark && t < T.pickup + 0.4;
    const fade = 1 - E.soft(lin(t, T.pickup, T.pickup + 0.4));
    const pulse = 0.85 + 0.15 * per(t, 13);
    const hit = t >= T.impact ? Math.exp(-(t - T.impact) * 5) : 0;
    let beamA = 0, sY = 0, sX = 1;
    if (live) {
      if (t < T.impact) { beamA = 0.6 * fall; sY = E.in(fall); sX = 0.35; }
      else { beamA = pulse * fade; sY = 1; sX = 1 + 1.2 * hit; }
    }
    op(el.beamCore, beamA);
    op(el.beamBlur, beamA);
    op(el.beamGlow, beamA * (t < T.impact ? 0.3 : 1));
    const bt = `scale(${f2(sX)},${f2(Math.max(0.001, sY))})`;
    tf(el.beamCore, bt);
    tf(el.beamBlur, bt);
    tf(el.beamGlow, `scale(${f2(0.7 + 0.3 * sX + 0.6 * hit)},${f2(Math.max(0.001, sY))})`);
    const ru = lin(t, T.impact, T.impact + 0.7);
    op(el.ring, t >= T.impact && ru < 1 ? (1 - ru) : 0);
    const su = t - T.impact;
    op(el.dropStreak, su >= 0 && su < 1 ? Math.exp(-su * 6) : 0);
    tf(el.dropStreak, `scale(${f2(0.6 + 1.2 * E.out(clamp01(su * 4)))},${f2(1 - 0.5 * clamp01(su * 3))})`);
    tf(el.ring, `scaleY(.3) scale(${f2(0.3 + 2.6 * E.out(ru))})`);
    op(el.pool, t >= T.impact ? (0.55 + 0.45 * hit + 0.1 * per(t, 13)) * fade : 0);
    tf(el.pool, `scaleY(.34) scale(${f2(1 + 0.5 * hit)})`);
    for (const sp of el.sparks) {
      const u = t - T.impact;
      if (u < 0 || u > sp.life) { op(sp.d, 0); continue; }
      const x = sp.vx * u, y = sp.vy * u + 900 * u * u;
      const vx = sp.vx, vy = sp.vy + 1800 * u;
      const ang = Math.atan2(vy, vx) * 180 / Math.PI;
      tf(sp.d, `translate(${f2(DROP.x + x)}px,${f2(DROP.y - 20 + y)}px) rotate(${f2(ang)}deg)`);
      op(sp.d, 1 - u / sp.life);
    }
    for (const m of el.motes) {
      const u = ((t * m.sp * 0.5 + m.ph) % 1);
      tf(m.d, `translate(${f2(DROP.x + m.x + 6 * Math.sin(u * 9))}px,${f2(DROP.y - 30 - u * 700)}px) scale(${f2(m.sz)})`);
      op(m.d, beamA * Math.sin(Math.PI * u) * (t > T.impact ? 1 : 0));
    }
    const lift = E.out(lin(t, T.pickup, T.pickup + 0.25));
    const shown = t >= T.impact && t < T.pickup + 0.22;
    op(el.lie, shown ? 1 : 0);
    const settle = t >= T.impact ? spring(t, T.impact, 3.2, 7) : 0;
    tf(el.lie, `translate(0px,${f2(-36 * lift - 14 * (1 - settle))}px) scaleY(.5) rotate(-66deg)`);
    op(el.lieGlow, 0.55 + 0.35 * per(t, 13) + 0.6 * hit);
    const la = t >= T.label ? E.out(lin(t, T.label, T.label + 0.14)) : 0;
    const lgone = E.in(lin(t, T.pickup - 0.05, T.pickup + 0.12));
    const pop = t >= T.label ? E.punch(lin(t, T.label, T.label + 0.32)) : 0;
    op(el.label, la * (1 - lgone));
    tf(el.label, `translateY(${f2(-8 * per(t, 4))}px) scale(${f2((0.55 + 0.45 * pop) * (1 - 0.3 * lgone))})`);
    op(el.labelBloom, 0.55 + 0.25 * per(t, 13, 1));
    const sw = lin(t, T.sweep, T.sweep + 0.55);
    tf(el.labelSweepBar, `translateX(${f2(-120 + 640 * E.inOut(sw))}px) skewX(-24deg)`);
    op(el.labelSweepBar, sw > 0 && sw < 1 ? 1 : 0);
    op(el.tether, la * (1 - lgone) * 0.9);
  }

  function rPanels(t) {
    const kIn = (d0, d1) => E.back(lin(t, T.open + d0, T.open + d1));
    const kOut = (d) => E.backIn(lin(t, T.close + d, T.close + d + 0.5));
    const lgI = kIn(0.05, 0.6), lgO = kOut(0.12);
    op(el.ledger, clamp01(lin(t, T.open + 0.05, T.open + 0.25)) * (1 - clamp01(lin(t, T.close + 0.4, T.close + 0.62))));
    tf(el.ledger, `translateX(${f2(-90 * (1 - lgI) - 120 * lgO)}px)`);
    const nI = kIn(0.12, 0.72), nO = kOut(0.05);
    op(el.niche, clamp01(lin(t, T.open + 0.12, T.open + 0.3)) * (1 - clamp01(lin(t, T.close + 0.35, T.close + 0.55))));
    tf(el.niche, `translateY(${f2(90 * (1 - nI) + 120 * nO)}px)`);
    const cI = kIn(0.18, 0.78), cO = kOut(0);
    op(el.chest, clamp01(lin(t, T.open + 0.18, T.open + 0.32)) * (1 - clamp01(lin(t, T.close + 0.3, T.close + 0.5))));
    tf(el.chest, `translateX(${f2(80 * cO)}px) scaleX(${f2(Math.max(0.05, 0.2 + 0.8 * cI))}) skewY(${f2(-7 * (1 - cI))}deg)`);
    set(el.chest, 'transform-origin', '100% 50%');
    const tipK = env(t, T.tip, T.tip + 0.35, T.fold, T.fold + 0.35);
    op(el.ledgerDim, 0.42 * tipK);
    op(el.nicheDim, 0.3 * tipK);
    const [ax, ay] = shake(t, T.land, 4, 10, 3);
    const [bx, by] = shake(t, T.set, 7, 8, 5);
    const [qx, qy] = shake(t, T.equip, 3, 10, 7);
    tf(document.getElementById('ui'), `translate(${f2(ax + bx + qx + 6 * PTR.x)}px,${f2(ay + by + qy + 4 * PTR.y)}px)`);
  }

  function rFly(t) {
    const u = lin(t, T.pickup + 0.15, T.land);
    const on = t >= T.pickup + 0.15 && t < T.land;
    op(el.fly, on ? 1 : 0);
    const p0 = [DROP.x, DROP.y - 40], p2 = [LEG_C[0], LEG_C[1]], p1 = [1180, 260];
    const k = E.inOut(u);
    const [x, y] = qb(p0, p1, p2, k);
    const rot = mix(-66, 0, E.out(u)) + 14 * Math.sin(Math.PI * u);
    const sc = mix(1.0, 0.6, k) * (1 + 0.25 * Math.sin(Math.PI * u));
    tf(el.fly, `translate(${f2(x)}px,${f2(y)}px) rotate(${f2(rot)}deg) scale(${f2(sc)})`);
    el.trail.forEach((d, i) => {
      const uu = u - i * 0.022;
      if (!on || uu < 0) { op(d, 0); return; }
      const [tx, ty] = qb(p0, p1, p2, E.inOut(uu));
      tf(d, `translate(${f2(tx + 10 * Math.sin(i * 2.3))}px,${f2(ty + 10 * Math.cos(i * 1.7))}px)`);
      op(d, (1 - i / el.trail.length) * 0.9);
    });
  }

  function impact(fx, t, t0, x, y, scale) {
    const u = t - t0;
    const on = u >= 0 && u < 1.2;
    const ru = clamp01(u / 0.55);
    op(fx.ring, on && ru < 1 ? 1 - ru : 0);
    tf(fx.ring, `translate(${f2(x)}px,${f2(y)}px) scale(${f2((0.2 + 1.8 * E.out(ru)) * scale)})`);
    op(fx.flash, on ? Math.exp(-u * 9) : 0);
    op(fx.streak, on ? Math.exp(-u * 7) * 0.9 : 0);
    tf(fx.streak, `translate(${f2(x)}px,${f2(y)}px) scale(${f2(scale * (0.5 + 0.9 * E.out(clamp01(u * 4))))},${f2(1 - 0.5 * clamp01(u * 3))})`);
    tf(fx.flash, `translate(${f2(x)}px,${f2(y)}px) scale(${f2(scale * (0.6 + 0.6 * clamp01(u * 6)))})`);
    for (const sp of fx.sparks) {
      if (!on || u > sp.life) { op(sp.d, 0); continue; }
      const px = sp.vx * u * scale, py = (sp.vy * u + 700 * u * u) * scale;
      const ang = Math.atan2(sp.vy + 1400 * u, sp.vx) * 180 / Math.PI;
      tf(sp.d, `translate(${f2(x + px)}px,${f2(y + py)}px) rotate(${f2(ang)}deg) scaleX(${f2(0.6 + 0.6 * (1 - u / sp.life))})`);
      op(sp.d, 1 - u / sp.life);
    }
  }

  function rChest(t) {
    const L = el.items['saint-breaker'];
    const landed = t >= T.land;
    const lift = E.in(lin(t, T.rise - 0.1, T.rise + 0.15));
    op(L.g, landed && t < T.rise + 0.15 ? 1 - lift : 0);
    const bump = landed ? spring(t, T.land, 3, 7) : 0;
    tf(L.g, `translateY(${f2(-30 * lift)}px) scale(${f2(1.25 - 0.25 * bump + 0.1 * lift)})`);
    const O = el.items['pilgrims-oath'];
    const back = t >= T.equip + 0.2;
    op(O.g, back ? 1 : 0);
    tf(O.g, `scale(${f2(back ? 1.25 - 0.25 * spring(t, T.equip + 0.2, 3, 7) : 1)})`);
    op(L.back, landed ? 0.7 + 0.3 * per(t, 10) : 0);
    op(el.newMark, landed && t < T.tip ? 0.6 + 0.4 * per(t, 40) : 0);
    const hov = env(t, T.hover + 0.55, T.hover + 0.75, T.fold, T.fold + 0.15);
    op(el.hover, hov);
    const G = el.items['gem:ember'];
    op(G.im, t < T.gemPick ? 1 : 0);
    op(el.items['gem:ember:halo'], t < T.gemPick ? 1 : 0);
    const used = t < T.land ? 44 : t < T.gemPick ? 52 : t < T.rise ? 51 : t < T.equip + 0.2 ? 43 : 47;
    text(el.packText, `Pack: ${used} of 64 pockets`);
    impact(el.impacts[0], t, T.land, LEG_C[0], LEG_C[1], 0.9);
  }

  const CUR = [
    [0, 1120, 760], [T.hover, 1120, 760], [T.hover + 0.6, LEG_C[0] + 18, LEG_C[1] + 10],
    [T.fold + 0.05, LEG_C[0] + 18, LEG_C[1] + 10], [T.gemPick - 0.05, GEM_C[0] + 10, GEM_C[1] + 8],
    [T.gemFly, GEM_C[0] + 10, GEM_C[1] + 8 - 30], [T.set - 0.04, SOCKET[0] + 8, SOCKET[1] + 6],
    [T.lower + 0.3, SOCKET[0] + 8, SOCKET[1] + 6], [T.equip + 0.4, MAIN_C[0] + 26, MAIN_C[1] + 30],
    [T.close, MAIN_C[0] + 26, MAIN_C[1] + 30],
  ];
  function cursorAt(t) {
    for (let i = 1; i < CUR.length; i++) {
      if (t <= CUR[i][0]) {
        const [a, ax, ay] = CUR[i - 1], [b, bx, by] = CUR[i];
        const k = E.inOut(lin(t, a, b));
        return [mix(ax, bx, k), mix(ay, by, k)];
      }
    }
    return [CUR[CUR.length - 1][1], CUR[CUR.length - 1][2]];
  }
  function rCursor(t) {
    const a = env(t, T.land + 0.2, T.land + 0.5, T.close - 0.1, T.close + 0.15);
    const [x, y] = cursorAt(t);
    const press = t > T.gemPick - 0.08 && t < T.gemPick + 0.08 ? 0.85 : 1;
    tf(el.cursor, `translate(${f2(x)}px,${f2(y)}px) scale(${press})`);
    op(el.cursor, a);
    const held = t >= T.gemPick && t < T.set;
    const lift = E.back(lin(t, T.gemPick, T.gemPick + 0.25));
    const shrink = lin(t, T.set - 0.35, T.set);
    const gs = (1 + 0.35 * lift) * mix(1, 0.62, E.in(shrink));
    tf(el.held, `translate(${f2(x - 48)}px,${f2(y - 46)}px) scale(${f2(gs)})`);
    op(el.held, held ? 1 : 0);
    tf(el.heldGlow, `translate(${f2(x - 8)}px,${f2(y - 6)}px) scale(${f2(gs)})`);
    op(el.heldGlow, held ? 0.7 + 0.3 * per(t, 30) : 0);
  }

  function showLines(tip, t, t0) {
    const H = tip.V.h;
    tip.lines.forEach((ln) => {
      const reach = t0 + 0.45 * (1 - Math.sqrt(1 - Math.min(0.999, ln.y / H)));
      const u = lin(t, reach, reach + 0.18);
      op(ln.node, E.out(u));
      tf(ln.node, `translateX(${f2(-6 * (1 - E.out(u)))}px)`);
    });
  }
  function rTip(tip, t, t0, t1) {
    const open = E.out(lin(t, t0, t0 + 0.45));
    const close = E.in(lin(t, t1, t1 + 0.3));
    const vis = t >= t0 && t < t1 + 0.3;
    op(tip.root, vis ? 1 : 0);
    if (!vis) return;
    const k = open * (1 - close);
    const H = tip.V.h;
    const hh = Math.max(1, H * k);
    set(tip.sheet, 'clip-path', `inset(0px 0px ${f2(H - hh)}px 0px)`);
    set(tip.sheet, '-webkit-clip-path', `inset(0px 0px ${f2(H - hh)}px 0px)`);
    tf(tip.curl, `translateY(${f2(hh - 13)}px)`);
    op(tip.curl, k < 0.995 ? 1 : 0);
    tf(tip.shadow, `scaleY(${f2(Math.max(0.01, k))})`);
    set(tip.shadow, 'transform-origin', '50% 0');
    op(tip.clasp, E.out(lin(t, t0 - 0.08, t0 + 0.1)) * (1 - close));
    tf(tip.clasp, `scaleX(${f2(0.3 + 0.7 * E.back(lin(t, t0 - 0.08, t0 + 0.18)))})`);
    showLines(tip, t, t0);
    if (tip.seal) {
      const st = t0 + 0.5;
      const press = E.back(lin(t, st, st + 0.24));
      op(tip.seal.wax, (t >= st ? 1 : 0) * (1 - close));
      tf(tip.seal.wax, `scale(${f2(1.3 - 0.3 * press)})`);
    }
  }

  function rTips(t) {
    rTip(el.tip, t, T.tip, T.fold);
    rTip(el.cmp, t, T.cmp, T.fold + 0.05);
    [el.tipDelta, el.tipDelta2].forEach((d, i) => {
      const u = lin(t, T.deltas + i * 0.1, T.deltas + i * 0.1 + 0.3);
      tf(d, `scale(${f2(t < T.deltas + i * 0.1 ? 0.01 : 1 + 0.5 * (1 - E.back(u)))})`);
    });
    const sh = lin(t, T.shimmer, T.shimmer + 0.7);
    tf(el.tipShimmerBar, `translateX(${f2(520 * E.inOut(sh))}px) skewX(-20deg)`);
    op(el.tipShimmerBar, sh > 0 && sh < 1 ? 1 : 0);
  }

  function swordPose(t) {
    const up = E.out(lin(t, T.rise, T.rise + 0.8));
    const down = E.inOut(lin(t, T.lower, T.equip));
    const P0 = { cx: SWORD_UP.cx, top: SWORD_UP.top + 420, h: SWORD_UP.h };
    let cx = mix(P0.cx, SWORD_UP.cx, up), top = mix(P0.top, SWORD_UP.top, up), hh = SWORD_UP.h;
    cx = mix(cx, SWORD_EQ.cx, down); top = mix(top, SWORD_EQ.top, down); hh = mix(hh, SWORD_EQ.h, down);
    const sway = (1 - down) * up * 0.8 * per(t, 3);
    return { cx, top, hh, sway, up, down };
  }

  function rNiche(t) {
    const S = swordPose(t);
    const shown = t >= T.rise && t < T.close + 0.7;
    op(el.sword, shown ? Math.min(1, S.up * 2) : 0);
    const sc = S.hh / 1000;
    tf(el.sword, `translate(${f2(S.cx - (1000 * SWORD_AR * sc) / 2)}px,${f2(S.top)}px) rotate(${f2(S.sway)}deg)`);
    tf(el.swordScale, `scale(${f2(sc * 1000) / 1000})`);
    const gone = env(t, T.rise - 0.05, T.rise + 0.5, T.lower + 0.15, T.equip);
    op(el.effigy, 1 - 0.88 * gone);
    const wake = env(t, T.rise, T.rise + 0.9, T.lower, T.equip + 0.6);
    const flare = t >= T.set ? Math.exp(-(t - T.set) * 2.2) : 0;
    const oathFlare = rOath(t);
    const oathGlow = 0.18 * env(t, T.oath + 1.0, T.oath + 1.5, T.close, T.close + 0.4);
    op(el.roseLit, 0.1 + 0.3 * wake + 0.35 * flare + 0.3 * oathFlare + oathGlow + 0.05 * per(t, 5));
    op(el.roseBloom, 0.1 + 0.2 * wake + 0.45 * flare + 0.35 * oathFlare);
    op(el.roseHalo, 0.45 + 0.35 * wake + 0.45 * flare + 0.35 * oathFlare);
    op(el.shaft, 0.6 + 0.4 * wake);
    const setK = t >= T.set ? 1 : 0;
    op(el.socketGem, setK);
    tf(el.socketGem, `scale(${f2(t >= T.set ? 1 + 0.6 * Math.exp(-(t - T.set) * 10) : 1)})`);
    set(el.socketGem, 'transform-origin', '30px 30px');
    op(el.socketGlow, setK * (0.55 + 0.45 * flare + 0.15 * per(t, 25)));
    el.runes.forEach((r, i) => {
      const t0 = T.runes + i * T.runeGap;
      const u = t - t0;
      const lit = u >= 0 ? 1 : 0;
      const burst = u >= 0 ? Math.exp(-u * 6) : 0;
      const cool = 1 - 0.45 * E.soft(lin(t, T.lower, T.equip + 0.4));
      op(r.core, lit * cool);
      op(r.glow, lit * (0.55 + 0.45 * burst) * cool);
      tf(r.box, `scale(${f2(1 + 0.5 * burst)})`);
      set(r.box, 'transform-origin', '40px 40px');
    });
    const heat = clamp01((t - T.runes + 0.05) / (RUNE_Y.length * T.runeGap + 0.1));
    const top = 0.34, reach = top + (0.995 - top) * E.out(heat);
    const cut = `inset(0px 0px ${f2((1 - reach) * 1000)}px 0px)`;
    const cool = 1 - 0.55 * E.soft(lin(t, T.lower, T.equip + 0.5));
    set(el.swordHot, 'height', f2(reach * 1000) + 'px');
    set(el.swordHalo, 'height', f2(60 + reach * 1000 + (reach > 0.99 ? 60 : 0)) + 'px');
    op(el.swordHot, (t >= T.runes ? 0.85 : 0) * cool * (0.9 + 0.1 * per(t, 23)));
    op(el.swordHalo, (t >= T.runes ? 1 : 0.0) * cool + (S.up > 0 ? 0.25 * S.up * (1 - setK) : 0));
    const ringK = env(t, T.equip, T.equip + 0.5, T.close, T.close + 0.4);
    op(el.ringSvg, ringK * (0.75 + 0.25 * per(t, 9)));
    op(el.ringBloom, ringK * (0.7 + 0.3 * per(t, 9)));
    tf(el.ringSvg, `rotate(${f2(t * 9)}deg)`);
    const ms = el.slots.main;
    const out = E.in(lin(t, T.equip - 0.25, T.equip));
    op(ms.im, 1 - out);
    op(ms.back, 1 - out);
    const inn = t >= T.equip ? 1 : 0;
    const bump = t >= T.equip ? spring(t, T.equip, 3, 7) : 0;
    op(ms.newIm, inn);
    op(ms.newBack, inn * (0.75 + 0.25 * per(t, 10)));
    tf(ms.newIm, `scale(${f2(1.3 - 0.3 * bump)})`);
    impact(el.impacts[1], t, T.set, SOCKET[0], SOCKET[1], 1.2);
    const ru = t - T.set;
    const rOn = ru >= 0 && ru < 0.75;
    op(el.ripple, rOn ? 1 - E.in(ru / 0.75) : 0);
    tf(el.ripple, `translate(${f2(SOCKET[0])}px,${f2(SOCKET[1])}px) scale(${f2(rOn ? 0.3 + 2.4 * E.out(ru / 0.75) : 0.3)})`);
    impact(el.impacts[2], t, T.equip, MAIN_C[0], MAIN_C[1], 0.7);
    const cap = env(t, T.caption, T.caption + 0.3, T.lower - 0.1, T.lower + 0.2);
    op(el.caption, cap);
    op(el.nameplate, 1 - cap);
    tf(el.caption, `translateY(${f2(12 * (1 - E.out(lin(t, T.caption, T.caption + 0.35))))}px) scale(${f2(0.92 + 0.08 * E.back(lin(t, T.caption, T.caption + 0.35)))})`);
  }

  const OATH_STEP = 0.38;
  function rOath(t) {
    const base = env(t, T.oath - 0.35, T.oath, T.close, T.close + 0.35);
    op(el.oathBase, base);
    const burn = env(t, T.oath, T.oath + 0.05, T.close, T.close + 0.35);
    op(el.oathGlow, burn);
    op(el.oathCore, burn);
    el.oathSegs.forEach((sg, i) => {
      const u = E.inOut(lin(t, T.oath + i * OATH_STEP, T.oath + (i + 1) * OATH_STEP));
      const off = f2(sg.len * (1 - u));
      attr(el.oathSegEls[i][0], 'stroke-dashoffset', off);
      attr(el.oathSegEls[i][1], 'stroke-dashoffset', off);
    });
    el.oathNodes.forEach((nd, i) => {
      const t0 = T.oath + (i + 1) * OATH_STEP;
      const u = t - t0;
      const a = u < 0 ? 0 : (nd.last ? 0.75 : 0.55) + (nd.last ? 1 : 0.6) * Math.exp(-u * 4);
      op(nd.n, Math.min(1, a) * burn);
      tf(nd.n, `scale(${f2(u < 0 ? 0.5 : 1 + (nd.last ? 0.8 : 0.4) * Math.exp(-u * 5) + 0.06 * per(t, 11, i))})`);
    });
    const t3 = T.oath + 3 * OATH_STEP;
    const su = t - t3;
    op(el.oathStar, su >= 0 ? Math.min(1, Math.exp(-su * 2.2) * 1.4 + 0.25) * burn : 0);
    op(el.oathStarGlow, su >= 0 ? (0.6 + 0.6 * Math.exp(-su * 3)) * burn : 0);
    tf(el.oathStar, `rotate(${f2(su >= 0 ? 40 * su : 0)}deg) scale(${f2(su >= 0 ? 0.6 + 0.9 * E.out(clamp01(su * 4)) - 0.3 * clamp01(su * 1.5) : 0.1)})`);
    const lab = env(t, t3 + 0.05, t3 + 0.35, T.close - 0.1, T.close + 0.2);
    op(el.oathLabel, lab);
    tf(el.oathLabel, `scale(${f2(0.85 + 0.15 * E.back(lin(t, t3 + 0.05, t3 + 0.45)))})`);
    return su >= 0 ? Math.exp(-su * 2.5) : 0;
  }

  function rLedger(t) {
    const k = E.out(lin(t, T.stats, T.stats + 1.1));
    const write = (o, v, dec, suffix, prefix) => text(o.n, (prefix || '') + fmt(v, dec) + (suffix || ''));
    const val = (key) => mix(STATS[key][0], STATS[key][1], k);
    const flashK = (key, d) => {
      if (STATS[key][0] === STATS[key][1]) return 0;
      const u = t - (T.stats + 1.1 + (d || 0));
      return u >= 0 ? Math.exp(-u * 3) : (t >= T.stats ? 0.35 : 0);
    };
    const R = el.roundels;
    write(R.damage, Math.round(val('damage')), 0);
    write(R.armor, val('armor'), 0);
    write(R.life, val('life'), 0);
    op(R.damage.glow, flashK('damage'));
    text(R.damage.glow, R.damage.n.textContent);
    const rows = el.rows;
    write(rows.strength, Math.round(val('strength')), 0);
    write(rows.faith, val('faith'), 0);
    write(rows.wrath, val('wrath'), 0);
    write(rows.fortitude, val('fortitude'), 0);
    write(rows.crit, val('crit'), 1, '%');
    write(rows.speed, val('speed'), 2);
    write(rows.fire, Math.round(val('fire')), 0, '%', '+');
    write(rows.undying, Math.round(val('undying')), 0, '%', '+');
    const deltas = { strength: '+84', crit: '+6.5%', speed: '-0.15', fire: '+22%', undying: '+31%' };
    for (const key in rows) {
      const o = rows[key];
      const f = flashK(key, 0.04 * Object.keys(rows).indexOf(key));
      op(o.glow, f);
      text(o.glow, o.n.textContent);
      if (deltas[key]) {
        text(o.delta, deltas[key]);
        set(o.delta, 'color', deltas[key][0] === '-' ? '#e07a6a' : '#8fe08a');
        op(o.delta, env(t, T.stats + 0.2, T.stats + 0.5, T.stats + 3.4, T.stats + 4.0));
      }
    }
    const spots = [[LEDGER.x + 128, LEDGER.y + 100], [LEDGER.x + 470, LEDGER.y + 345], [LEDGER.x + 470, LEDGER.y + 553], [LEDGER.x + 470, LEDGER.y + 629]];
    el.floats.forEach((d, i) => {
      const u = lin(t, T.stats + 0.15 * i, T.stats + 0.15 * i + 1.3);
      op(d, t >= T.stats + 0.15 * i && u < 1 ? Math.sin(Math.PI * Math.min(1, u * 1.4)) : 0);
      tf(d, `translate(${f2(spots[i][0] - 30)}px,${f2(spots[i][1] - 34 * E.out(u))}px) scale(${f2(0.8 + 0.3 * E.back(clamp01(u * 3)))})`);
    });
  }

  function rFlash(t) {
    const f = (t >= T.impact ? Math.exp(-(t - T.impact) * 7) * 0.55 : 0) + (t >= T.set ? Math.exp(-(t - T.set) * 8) * 0.35 : 0);
    op(document.getElementById('flash'), f);
  }

  let DBG = '';
  const LIVE = !new URLSearchParams(location.search).has('t');
  const PTR = { x: 0, y: 0, tx: 0, ty: 0 };
  function setup(ctx) {
    if (LIVE) addEventListener('mousemove', (e) => { PTR.tx = e.clientX / innerWidth * 2 - 1; PTR.ty = e.clientY / innerHeight * 2 - 1; });
    DBG = String(ctx.params.hide || '');
    const R = rng(11);
    buildDefs();
    buildWorld(R);
    buildDrop(R);
    buildHud();
    buildLedger();
    buildNiche();
    buildChest();
    buildTips();
    buildFx(R);
    built = true;
  }
  function render(t) {
    if (!built) return;
    if (DBG) { for (const k of DBG.split(',')) if (el[k]) { el[k].style.display = 'none'; } }
    rWorld(t);
    rDrop(t);
    rHud(t);
    rPanels(t);
    rFly(t);
    rChest(t);
    rTips(t);
    rNiche(t);
    rLedger(t);
    rCursor(t);
    rFlash(t);
  }
  function applyView(v, ctx) {
    const st = ctx.stage;
    const fit = Math.min(innerWidth / 1920, innerHeight / 1080);
    st.style.transformOrigin = '50% 50%';
    st.style.transform = `translate(${v.x}px,${v.y}px) rotate(${v.rotate}deg) scale(${fit * v.zoom})`;
  }

  function define() {
    scene.define({
      name: 'ashen-reliquary',
      controls: [[['Mouse move'], 'Look around']],
      duration: DUR,
      keyTimes: [1.3, 4.35, 6.7, 9.97, 10.9, 13.6, 15.9],
      params: { hide: '' },
      setup, render, applyView,
    });
  }
  const fonts = [document.fonts.load('800 40px "AR Gotisch"'), document.fonts.load('500 20px "AR Grenze"'),
    document.fonts.load('italic 500 20px "AR Grenze"')];
  Promise.race([Promise.all(fonts), new Promise((r) => setTimeout(r, 1500))]).then(define, define);
})();
