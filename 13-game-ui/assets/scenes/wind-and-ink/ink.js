(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#1b1712', SHU = '#c0392b', WASHI = '#ece3cf', KIN = '#b8954f', KIN_L = '#dcc48e';
  const DUR = 20;
  const q = new URLSearchParams(location.search);
  const STANCES = ['ten', 'yoko', 'tate', 'harai'];

  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lin = (t, a, b) => clamp01((t - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const f2 = (v) => Math.round(v * 100) / 100;
  const f5 = (v) => Math.round(v * 1e5) / 1e5;

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u;
    const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let u = x;
      for (let i = 0; i < 6; i++) { const e = sx(u) - x, d = dx(u); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; u -= e / d; }
      return sy(clamp01(u));
    };
  }
  const E = {
    brush: bezier(0.55, 0, 0.2, 1),
    out: bezier(0.2, 0.7, 0.3, 1),
    inOut: bezier(0.65, 0, 0.25, 1),
    soft: bezier(0.4, 0, 0.2, 1),
    stamp: bezier(0.3, 1.6, 0.5, 1),
  };
  const env = (t, a, b, c, d, ein, eout) => {
    if (t < a || t > d) return 0;
    if (t < b) return (ein || E.out)(lin(t, a, b));
    if (t <= c) return 1;
    return 1 - (eout || E.soft)(lin(t, c, d));
  };

  function set(el, prop, v) {
    const c = el.__s || (el.__s = {});
    if (c[prop] === v) return;
    c[prop] = v;
    el.style.setProperty(prop, v);
  }
  function setAttr(el, name, v) {
    const c = el.__a || (el.__a = {});
    if (c[name] === v) return;
    c[name] = v;
    el.setAttribute(name, v);
  }
  function h(tag, cls, parent, css, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const show = (el, a) => { set(el, 'opacity', a <= 0 ? '0' : a >= 1 ? '1' : String(f5(a))); set(el, 'visibility', a <= 0 ? 'hidden' : 'visible'); };
  const tf = (el, v) => set(el, 'transform', v);
  const clip = (el, v) => { set(el, 'clip-path', v); set(el, '-webkit-clip-path', v); };
  function wedgeClip(cx, cy, r, a0, a1) {
    const pts = [[cx, cy]];
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.3));
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return 'polygon(' + pts.map((q) => f2(q[0]) + 'px ' + f2(q[1]) + 'px').join(',') + ')';
  }

  const BROCADE = 'background:' +
    'repeating-linear-gradient(45deg, rgba(206,170,96,.2) 0 1.2px, transparent 1.2px 8.5px),' +
    'repeating-linear-gradient(-45deg, rgba(206,170,96,.2) 0 1.2px, transparent 1.2px 8.5px),' +
    'linear-gradient(to right, rgba(255,240,210,.05), rgba(0,0,0,.18) 50%, rgba(255,240,210,.05)),' +
    '#2a221b;';

  const wrap = (x) => ((x % DUR) + DUR) % DUR;
  const GUSTS = [0.7, 4.2, 9.1, 13.6, 17.4];
  function gust(t, delay) {
    let g = 0;
    for (const at of GUSTS) {
      const u = wrap(t - at - delay);
      if (u < 2.2) g += Math.pow(Math.sin((Math.PI * u) / 2.2), 2) * (1 - 0.35 * (u / 2.2));
    }
    return g;
  }
  const TAU = Math.PI * 2;
  const per = (t, k, ph) => Math.sin((TAU * k * t) / DUR + (ph || 0));

  function inkStroke(parent, ctrl, w, opt, look) {
    look = look || {};
    const st = Brush.stroke(ctrl, w, opt);
    const b = st.bbox;
    const svg = s('svg', { class: 'ink', width: f2(b.w), height: f2(b.h), viewBox: `${f2(b.x)} ${f2(b.y)} ${f2(b.w)} ${f2(b.h)}` }, parent);
    svg.style.left = f2(b.x) + 'px';
    svg.style.top = f2(b.y) + 'px';
    const color = look.color || INK, alpha = look.alpha == null ? 1 : look.alpha;
    if (st.bleed && look.bleed !== false) s('path', { d: st.bleed, fill: color, 'fill-opacity': f2(alpha * 0.1) }, svg);
    s('path', { d: st.core, fill: color, 'fill-opacity': f2(alpha) }, svg);
    for (const f of st.fingers) s('path', { d: f, fill: color, 'fill-opacity': f2(alpha * 0.95) }, svg);
    const dx = st.b.x - st.a.x, dy = st.b.y - st.a.y, L = Math.hypot(dx, dy) || 1, tx = dx / L, ty = dy / L;
    const back = w * 0.75;
    const A = { x: st.a.x - b.x - tx * back, y: st.a.y - b.y - ty * back };
    const B = { x: st.b.x - b.x + tx * back * 0.6, y: st.b.y - b.y + ty * back * 0.6 };
    const jag = Brush.jagFor((opt && opt.seed) || 1, 11, Math.min(14, w * 0.45));
    const ext = Math.max(b.w, b.h) * 1.5;
    let last = -1;
    return {
      svg, st,
      reveal(p) {
        p = clamp01(p);
        if (p === last) return;
        last = p;
        set(svg, 'visibility', p <= 0 ? 'hidden' : 'visible');
        if (p > 0) clip(svg, p >= 1 ? 'none' : Brush.frontClip(A, B, p, ext, jag));
      },
    };
  }

  function seal(parent, size, chars, seed, opt) {
    opt = opt || {};
    const box = h('div', 'abs', parent, `width:${size}px;height:${size}px;`);
    const svg = s('svg', { class: 'ink', width: size, height: size, viewBox: `0 0 ${size} ${size}` }, box);
    svg.style.left = '0'; svg.style.top = '0';
    s('path', { d: Brush.sealEdge(seed, size, size, Math.max(1.5, size * 0.035)), fill: opt.color || SHU }, svg);
    const inset = size * 0.1, cols = chars.length > 2 ? 2 : 1;
    const col = (size - inset * 2) / cols;
    const per = Math.ceil(chars.length / cols);
    for (let c = 0; c < cols; c++) {
      const txt = chars.slice(c * per, (c + 1) * per);
      const fs = Math.min(col * 0.86, ((size - inset * 2) / txt.length) * 0.9);
      const tx = s('text', {
        x: f2(size - inset - col * c - col / 2), y: f2(inset + fs * 0.88), fill: WASHI,
        'font-family': 'WI Mincho', 'font-weight': '800', 'font-size': f2(fs), 'text-anchor': 'middle',
      }, svg);
      for (let i = 0; i < txt.length; i++) {
        const sp = s('tspan', { x: f2(size - inset - col * c - col / 2), y: f2(inset + fs * 0.88 + i * ((size - inset * 2) / txt.length)) }, tx);
        sp.textContent = txt[i];
      }
    }
    for (const d of Brush.sealVoids(seed + 3, size, size, Math.round(size * 0.5))) s('path', { d, fill: WASHI, 'fill-opacity': '0.85' }, svg);
    return box;
  }

  const VCSS = q.get('p.vtext') === 'css';
  function jpV(parent, txt, size, weight, css) {
    if (VCSS) return h('div', 't v jp', parent, `font-size:${size}px;font-weight:${weight};letter-spacing:.14em;${css || ''}`, txt);
    const e = h('div', 't jp vs', parent, `font-size:${size}px;font-weight:${weight};letter-spacing:.14em;${css || ''}`);
    const ls = parseFloat((/letter-spacing:\s*([\d.]+)em/.exec(e.style.cssText + ';' + (css || '')) || [0, 0.14])[1]);
    e.style.letterSpacing = '0';
    for (const ch of txt) {
      const c = h('span', null, e, `display:block;height:${f2(size * (1 + ls))}px;`, ch);
      if (ch === '　') c.style.height = f2(size * (0.6 + ls)) + 'px';
    }
    return e;
  }
  const en = (parent, txt, size, weight, css) => h('div', 't en', parent, `font-size:${size}px;font-weight:${weight};${css || ''}`, txt);

  const FOE = [940, 872], FOE_S = 1.1;
  function buildWorld(W) {
    const foeLay = document.getElementById('foe');
    foeLay.__glow = h('div', 'abs', foeLay, 'left:-380px;top:-380px;width:760px;height:760px;border-radius:50%;will-change:transform,opacity;' +
      'background:radial-gradient(closest-side, rgba(255,222,160,.42), rgba(255,210,140,.18) 45%, rgba(255,200,130,0) 100%);');
    const fwrap = h('div', 'abs', foeLay, 'left:0;top:0;width:1920px;height:1080px;');
    const fsvg = s('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080' }, fwrap);
    fsvg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
    const foe = Foe.create(s('g', { transform: `translate(${FOE[0]} ${FOE[1]}) scale(${FOE_S})` }, fsvg), T);
    foe.wrap = fwrap;
    const far = h('div', 'abs', foeLay, 'left:1030px;top:480px;width:200px;height:200px;will-change:transform,opacity;');
    const farSvg = s('svg', { width: 200, height: 200, viewBox: '1030 480 200 200' }, far);
    farSvg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
    s('feGaussianBlur', { stdDeviation: 2.2 }, s('filter', { id: 'farHaze', x: '-20%', y: '-20%', width: '140%', height: '140%' }, s('defs', {}, farSvg)));
    Foe.create(s('g', { transform: 'translate(1130 640) scale(0.26)' }, s('g', { filter: 'url(#farHaze)' }, farSvg)), T).render(T.foeIn + 0.62, { gust: () => 0.3 });
    foe.far = far;
    const atFoe = (q) => [FOE[0] + q[0] * FOE_S, FOE[1] + q[1] * FOE_S];

    const wfx = document.getElementById('wfx');
    const slashes = [
      { d: [[-110, -90], [0, 0], [120, 100]], w: 16, seed: 41, at: T.hits[0] },
      { d: [[120, -70], [0, 10], [-130, 80]], w: 14, seed: 42, at: T.hits[1] },
      { d: [[-150, 10], [0, 0], [160, 26]], w: 15, seed: 43, at: T.hits[2] },
      { d: [[-60, -160], [10, 0], [70, 170]], w: 18, seed: 44, at: T.hits[3] },
    ].map((sl) => {
      const J = foe.jointsAt(sl.at + 0.03), c = atFoe(J.chest.map((v, i) => mix(v, J.hip[i], 0.25)));
      sl.ctrl = sl.d.map((q) => [c[0] + q[0], c[1] + q[1]]);
      return Object.assign(sl, { el: inkStroke(wfx, sl.ctrl, sl.w, { seed: sl.seed, tail: 'sweep', taperFrom: 0.35, press: 0.1, bleed: 0 }, { color: '#fbf5e6' }) });
    });
    const glint = s('svg', { width: 400, height: 400, viewBox: '-200 -200 400 400' }, wfx);
    {
      const J = foe.jointsAt(T.parry), q = atFoe([mix(J.tsuba[0], J.tip[0], 0.62), mix(J.tsuba[1], J.tip[1], 0.62)]);
      glint.style.cssText = `position:absolute;left:${f2(q[0] - 200)}px;top:${f2(q[1] - 200)}px;overflow:visible`;
    }
    const star = (parent, c1, c2) => {
      s('path', { d: 'M0 -46 L3.2 -3.2 L46 0 L3.2 3.2 L0 46 L-3.2 3.2 L-46 0 L-3.2 -3.2 Z', fill: c1 }, parent);
      s('path', { d: 'M-150 0 L0 -1.4 L150 0 L0 1.4 Z', fill: c2 }, parent);
      s('path', { d: 'M0 -20 L1.6 -1.6 L20 0 L1.6 1.6 L0 20 L-1.6 1.6 L-20 0 L-1.6 -1.6 Z', fill: c1, transform: 'rotate(45)' }, parent);
      s('circle', { r: 6, fill: c1 }, parent);
    };
    star(s('g', { filter: 'url(#glow10)', 'fill-opacity': 0.9 }, glint), '#ffd98a', '#ffcf7a');
    star(s('g', { filter: 'url(#glow3)' }, glint), '#fff1cf', '#ffe3a6');
    star(glint, '#fffaf0', '#ffeec4');

    const reedsLay = document.getElementById('reeds');
    const R = Brush.rng(5);
    const reeds = [];
    const pg = s('radialGradient', { id: 'spk', cx: '0.5', cy: '0.5', r: '0.5' }, s('defs', {}, s('svg', { width: 0, height: 0 }, reedsLay)));
    s('stop', { offset: '0', 'stop-color': '#fbe9c0', 'stop-opacity': '0.8' }, pg);
    s('stop', { offset: '0.55', 'stop-color': '#ebcb8a', 'stop-opacity': '0.42' }, pg);
    s('stop', { offset: '1', 'stop-color': '#dcb46c', 'stop-opacity': '0' }, pg);
    const spots = [[30, 1.55, 1], [200, 1.25, 1], [-60, 1.1, 1], [1700, 1.6, 1], [1850, 1.2, 1], [1560, 1.05, 1], [430, 0.62, 0], [1420, 0.58, 0], [620, 0.45, 0]];
    spots.forEach(([x, sc, near], i) => {
      const H = 640 * sc, wd = 260 * sc;
      const svg = s('svg', { width: f2(wd * 2), height: f2(H + 80), viewBox: `${f2(-wd)} ${f2(-H)} ${f2(wd * 2)} ${f2(H + 80)}` }, reedsLay);
      svg.style.cssText = `position:absolute;left:${f2(x - wd)}px;top:${f2(1130 - H)}px;overflow:visible;will-change:transform;transform-origin:${f2(wd)}px ${f2(H)}px`;
      const g = s('g', { filter: near ? 'url(#softer)' : 'url(#soft)' }, svg);
      const dir = 1;
      const lean = (x < 960 ? 0.06 : -0.04) + (R() - 0.5) * 0.08;
      const tip = [lean * H, -H * 0.94], ctl = [lean * H * 0.15, -H * 0.5];
      const stem = (u) => {
        const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
        return [b * ctl[0] + c * tip[0], 70 * a + b * ctl[1] + c * tip[1]];
      };
      s('path', { d: `M0 70 Q${f2(ctl[0])} ${f2(ctl[1])} ${f2(tip[0])} ${f2(tip[1])}`, stroke: near ? '#6a4c2c' : '#4a3520', 'stroke-opacity': near ? '0.26' : '0.45', 'stroke-width': f2((near ? 4 : 2.5) * sc), fill: 'none' }, g);
      const axis = (u) => {
        const p = stem(0.66 + 0.34 * u);
        return [p[0] + dir * u * u * 70 * sc, p[1] + u * u * 26 * sc];
      };
      for (let k = 0; k < 3; k++) {
        const u = 0.25 + k * 0.3, p = axis(u), p2 = axis(Math.min(1, u + 0.05));
        const ang = (Math.atan2(p2[1] - p[1], p2[0] - p[0]) * 180) / Math.PI;
        s('ellipse', { cx: f2(p[0]), cy: f2(p[1]), rx: f2(70 * sc), ry: f2(16 * sc), fill: 'url(#spk)', transform: `rotate(${f5(ang)} ${f2(p[0])} ${f2(p[1])})` }, g);
      }
      const n = 14;
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n, p = axis(u), p2 = axis(Math.min(1, u + 0.05));
        const along = Math.atan2(p2[1] - p[1], p2[0] - p[0]);
        const side = k % 2 ? 1 : -1;
        const a = along + dir * (0.35 + R() * 0.45) * (side > 0 ? 1 : 0.6) + (side > 0 ? 0.25 : -0.1);
        const len = (46 + 56 * Math.sin(Math.PI * Math.min(1, u * 1.2)) + R() * 20) * sc;
        const cx = p[0] + Math.cos(a) * len * 0.5, cy = p[1] + Math.sin(a) * len * 0.5;
        s('ellipse', { cx: f2(cx), cy: f2(cy), rx: f2(len * 0.5), ry: f2((4 + R() * 3) * sc), fill: 'url(#spk)', transform: `rotate(${f5((a * 180) / Math.PI)} ${f2(cx)} ${f2(cy)})` }, g);
      }
      reeds.push({ el: svg, x, sc, ph: R() * TAU });
    });

    const leavesLay = document.getElementById('leaves');
    const leaves = [];
    const cols = ['#b5432a', '#cf7d36', '#e0b35a', '#a8382a', '#d9963f'];
    for (let i = 0; i < 16; i++) {
      const near = i < 5;
      const size = near ? 26 + R() * 18 : 9 + R() * 9;
      const c = cols[i % cols.length];
      const el = h('div', 'abs', leavesLay, `left:0;top:0;width:${f2(size * 1.6)}px;height:${f2(size)}px;border-radius:50%;` +
        `background:radial-gradient(closest-side, ${c} ${near ? 15 : 35}%, ${c}00 100%);will-change:transform;`);
      leaves.push({ el, near, size, k: [2, 3, 4, 5][i % 4], ph: R(), y0: -80 + R() * 500, amp: 40 + R() * 80, spin: (R() < 0.5 ? -1 : 1) * (1 + R() * 2) });
    }
    return { slashes, glint, reeds, leaves, foe };
  }

  function buildHUD(hud) {
    const H = {};

    {
      const c = h('div', 'cl', hud);
      c.dataset.anchor = 'tr';
      H.title = { c };
      H.title.jp = jpV(c, '白鷺の渡し', 48, 800, 'right:70px;top:96px;letter-spacing:.16em;');
      H.title.haiku = jpV(c, '葦なびく　渡しに人の　影ひとつ', 19, 500, 'right:146px;top:104px;letter-spacing:.22em;color:#3b342b;');
      H.title.seal = seal(c, 40, '渡', 11);
      H.title.seal.style.cssText += 'right:74px;top:392px;';
      H.title.rule = inkStroke(c, [[-420, 452], [-300, 449], [-180, 453]], 3, { seed: 71, tail: 'sweep', taperFrom: 0.55, press: 0.3, bleed: 0 });
      H.title.en = en(c, 'Shirasagi Ford', 32, 300, 'right:70px;top:462px;text-align:right;');
      H.title.sub = en(c, 'Reeds bow in the wind. At the ford, a lone shadow.', 16, 300, 'right:70px;top:504px;font-style:italic;color:#3b342b;');
    }

    {
      const c = h('div', 'cl', hud);
      c.dataset.anchor = 'bl';
      const P = H.player = { c };
      P.inner = h('div', 'abs', c, 'left:0;top:0;');
      const ctrl = [[134, -62], [330, -66], [560, -59]];
      P.ghost = inkStroke(P.inner, ctrl, 26, { seed: 21, tail: 'dry', split: 0.8, bleed: 0 }, { alpha: 0.16 });
      P.wash = inkStroke(P.inner, ctrl, 26, { seed: 21, tail: 'dry', split: 0.8, bleed: 0 }, { color: '#8e2a1e', alpha: 0.55 });
      P.bar = inkStroke(P.inner, ctrl, 26, { seed: 21, tail: 'dry', split: 0.8 });
      const cs = s('svg', { class: 'ink', width: 120, height: 120, viewBox: '-60 -60 120 120' }, P.inner);
      cs.style.left = '-8px'; cs.style.top = '-120px';
      P.crest = cs;
      s('circle', { r: 47, fill: 'none', stroke: INK, 'stroke-width': 2.2 }, cs);
      s('circle', { r: 42.5, fill: 'none', stroke: INK, 'stroke-width': 0.7, 'stroke-opacity': 0.55 }, cs);
      P.petals = [];
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k * TAU) / 5, px = Math.cos(a) * 21, py = Math.sin(a) * 21;
        const g = s('g', { transform: `translate(${f2(px)} ${f2(py)})` }, cs);
        s('circle', { r: 12.2, fill: INK, 'fill-opacity': 0.13, stroke: INK, 'stroke-width': 1.1, 'stroke-opacity': 0.7 }, g);
        const fill = s('circle', { r: 12.2, fill: SHU }, g);
        P.petals.push({ g, fill, a });
      }
      s('circle', { r: 6.5, fill: WASHI, stroke: INK, 'stroke-width': 1.2 }, cs);
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + ((k + 0.5) * TAU) / 5;
        s('circle', { cx: f2(Math.cos(a) * 9.5), cy: f2(Math.sin(a) * 9.5), r: 1.3, fill: INK }, cs);
      }
      const hs = s('svg', { class: 'ink', width: 700, height: 300, viewBox: '0 -260 700 300' }, P.inner);
      hs.style.left = '0'; hs.style.top = '-260px';
      let hd = '';
      for (const d of Brush.splatter(71, 560, -72, Math.PI + 0.3, { size: 1.3, count: 40, spread: 0.8, reach: 250 })) hd += d;
      for (const d of Brush.splatter(72, 620, -60, Math.PI - 0.15, { size: 0.9, count: 18, spread: 0.5, reach: 170 })) hd += d;
      s('path', { d: hd, fill: '#7d2016', 'fill-opacity': 0.85 }, hs);
      P.hurt = hs;
      const fly = s('svg', { class: 'ink', width: 30, height: 30, viewBox: '-15 -15 30 30' }, P.inner);
      fly.style.cssText += 'left:0;top:0;will-change:transform;';
      s('circle', { r: 12.2, fill: SHU }, fly);
      P.fly = fly;
    }

    {
      const c = h('div', 'cl', hud);
      c.dataset.anchor = 'br';
      const S = H.stance = { c };
      S.inner = h('div', 'abs', c, 'left:0;top:0;');
      const cx = -66, cy = -84, r = 30;
      S.ring = s('svg', { class: 'ink', width: 160, height: 160, viewBox: '-80 -80 160 160' }, S.inner);
      S.ring.style.left = (cx - 80) + 'px'; S.ring.style.top = (cy - 80) + 'px';
      s('circle', { r: 66, fill: 'none', stroke: INK, 'stroke-width': 2 }, S.ring);
      s('circle', { r: 61, fill: 'none', stroke: INK, 'stroke-width': 0.7, 'stroke-opacity': 0.55 }, S.ring);
      const marks = {
        ten: { ctrl: [[cx - 6, cy - r - 9], [cx, cy - r - 1], [cx + 5, cy - r + 9]], w: 19, o: { tail: 'sweep', taperFrom: 0, press: 0, entry: 0.001, oblique: 0.15, thin: 0, wobble: 0.02 } },
        yoko: { ctrl: [[cx + r - 18, cy + 1], [cx + r + 2, cy - 2], [cx + r + 22, cy]], w: 10, o: { tail: 'stop', press: 0.3 } },
        tate: { ctrl: [[cx, cy + r - 20], [cx + 1, cy + r], [cx - 1, cy + r + 22]], w: 10, o: { tail: 'dry', split: 0.6, fingers: 4, hairs: 1 } },
        harai: { ctrl: [[cx - r + 12, cy - 18], [cx - r + 2, cy - 2], [cx - r - 20, cy + 16]], w: 11, o: { tail: 'sweep', taperFrom: 0.3 } },
      };
      S.marks = {};
      let seed = 30;
      for (const k of Object.keys(marks)) {
        const m = marks[k];
        const pale = inkStroke(S.inner, m.ctrl, m.w, Object.assign({ seed, bleed: 0 }, m.o), { alpha: 0.3 });
        const solid = inkStroke(S.inner, m.ctrl, m.w, Object.assign({ seed }, m.o));
        S.marks[k] = { pale, solid };
        seed++;
      }
      S.bead = h('div', 'abs', S.inner, `left:${cx - 6}px;top:${cy - 6}px;width:12px;height:12px;border-radius:50%;background:${SHU};box-shadow:0 0 0 2.5px ${WASHI};will-change:transform;`);
      S.beadAngle = { ten: -90, yoko: 0, tate: 90, harai: 180 };
      S.cx = cx; S.cy = cy;
      S.names = {};
      const label = (k, jp, en1, en2) => {
        const g = h('div', 'abs', S.inner, 'left:0;top:0;');
        jpV(g, jp, 25, 800, 'right:164px;top:-214px;letter-spacing:.16em;');
        en(g, en1, 28, 300, 'right:214px;top:-100px;text-align:right;');
        en(g, en2, 15, 300, 'right:214px;top:-60px;text-align:right;font-style:italic;color:#3b342b;');
        S.names[k] = g;
      };
      label('ten', '点の構え', 'Point stance', 'Pierces a spear guard.');
      label('yoko', '横の構え', 'Level stance', 'Breaks a sword guard.');
      label('tate', '縦の構え', 'Fall stance', 'Splits a shield.');
      label('harai', '払の構え', 'Sweep stance', 'Clears a ring of foes.');
    }

    {
      const c = h('div', 'cl', hud);
      c.dataset.anchor = 'tr';
      const F = H.foe = { c };
      F.inner = h('div', 'abs', c, 'left:0;top:0;');
      F.scroll = h('div', 'abs', F.inner, 'left:-250px;top:-20px;width:104px;height:0;overflow:hidden;');
      const sc = h('div', 'abs', F.scroll, 'left:0;top:0;width:104px;height:500px;');
      h('div', 'abs', sc, 'left:0;top:0;width:104px;height:500px;' + BROCADE + 'box-shadow:0 6px 18px rgba(20,14,8,.35);');
      h('div', 'abs', sc, `left:7px;top:0;width:88px;height:494px;border-left:1px solid ${KIN};border-right:1px solid ${KIN};`);
      h('div', 'abs', sc, `left:14px;top:44px;width:76px;height:408px;background:${WASHI} url(assets/paper.jpg) -300px -200px;`);
      F.name = jpV(sc, '灰鷺　宗園', 26, 800, 'left:46px;top:100px;letter-spacing:.12em;');
      const pc = [[29, 100], [27, 270], [30, 436]];
      F.poiseGhost = inkStroke(sc, pc, 13, { seed: 51, tail: 'dry', split: 0.72, fingers: 6, bleed: 0 }, { alpha: 0.14 });
      F.poise = inkStroke(sc, pc, 13, { seed: 51, tail: 'dry', split: 0.72, fingers: 6 });
      F.crest = s('svg', { class: 'ink', width: 34, height: 34, viewBox: '-17 -17 34 34' }, sc);
      F.crest.style.left = '35px'; F.crest.style.top = '54px';
      s('circle', { r: 15, fill: 'none', stroke: INK, 'stroke-width': 1.5 }, F.crest);
      for (const sgn of [-1, 1]) {
        const g = s('g', { transform: `rotate(${sgn * 32})` }, F.crest);
        s('path', { d: 'M0 -12 Q5 -4 3 8 L0 12 L-3 8 Q-5 -4 0 -12 Z', fill: INK }, g);
        s('line', { x1: 0, y1: -10, x2: 0, y2: 11, stroke: WASHI, 'stroke-width': 0.8 }, g);
      }
      F.rod = h('div', 'abs', sc, 'left:-10px;top:492px;width:124px;height:13px;border-radius:7px;' +
        'background:linear-gradient(to bottom,#5a4634,#2a1f17 55%,#120d09);');
      for (const x of [-12, 108]) h('div', 'abs', F.rod, `left:${x + 10}px;top:-1px;width:16px;height:15px;border-radius:5px;background:linear-gradient(to bottom,${KIN_L},${KIN} 60%,#7a5e2c);`);
      F.text = h('div', 'abs', F.inner, 'left:0;top:0;');
      en(F.text, 'Sōen', 36, 300, 'right:276px;top:70px;text-align:right;');
      en(F.text, 'of the Grey Heron', 16, 300, 'right:276px;top:116px;text-align:right;font-style:italic;');
      en(F.text, 'Master of the reed-cutting school', 13, 400, 'right:276px;top:146px;text-align:right;color:#4a4238;letter-spacing:.03em;');
      F.breakSeal = seal(F.inner, 46, '崩', 13);
      F.breakSeal.style.left = '-244px'; F.breakSeal.style.top = '394px';
    }

    {
      const c = h('div', 'cl', hud);
      c.dataset.anchor = 'tc';
      const Wn = H.warn = { c };
      Wn.inner = h('div', 'abs', c, 'left:0;top:-50px;');
      Wn.swash = inkStroke(Wn.inner, [[-150, 352], [0, 348], [150, 354]], 44, { seed: 61, tail: 'dry', split: 0.7, bleed: 0 }, { color: '#f3ead6', alpha: 0.88 });
    }
    return H;
  }

  function buildWarn(H) {
    const Wn = H.warn;
    const st = Brush.enso(62, 0, 250, 74, 15, { a0: -1.9, sweep: 5.7 });
    Wn.ensoArc = { cx: -st.bbox.x, cy: 250 - st.bbox.y, a0: -1.9 - 0.25, sweep: 5.7 + 0.5 };
    const b = st.bbox;
    const svg = s('svg', { class: 'ink', width: f2(b.w), height: f2(b.h), viewBox: `${f2(b.x)} ${f2(b.y)} ${f2(b.w)} ${f2(b.h)}` }, Wn.inner);
    svg.style.left = f2(b.x) + 'px'; svg.style.top = f2(b.y) + 'px';
    s('path', { d: st.bleed, fill: SHU, 'fill-opacity': '0.12' }, svg);
    s('path', { d: st.core, fill: SHU }, svg);
    for (const f of st.fingers) s('path', { d: f, fill: SHU, 'fill-opacity': '0.95' }, svg);
    Wn.ensoSvg = svg;
    Wn.glyph = h('div', 't brushfont', Wn.inner, `left:-36px;top:214px;font-size:72px;color:${SHU};`, '避');
    Wn.text = en(Wn.inner, 'Unblockable. Step aside.', 17, 400, 'left:-100px;width:200px;top:339px;text-align:center;font-style:italic;');
  }

  function buildBlow(hud) {
    const c = h('div', 'cl', hud);
    c.dataset.anchor = 'cc';
    const B = { c };
    B.inner = h('div', 'abs', c, 'left:0;top:0;');
    B.stroke = inkStroke(B.inner, [[-700, 10], [-260, -16], [240, -6], [730, 18]], 132,
      { seed: 81, tail: 'dry', split: 0.62, fingers: 16, hairs: 6, press: 0.12, thin: 0.12, wobble: 0.04, grain: 0.9, bleed: 3.5 });
    const sp = s('svg', { class: 'ink', width: 1300, height: 460, viewBox: '-100 -260 1300 460' }, B.inner);
    sp.style.left = '-100px'; sp.style.top = '-260px';
    let spd = '';
    for (const d of Brush.splatter(83, 690, 4, -0.08, { size: 1.05, count: 64, spread: 0.42, reach: 300 })) spd += d;
    for (const d of Brush.splatter(84, 420, -60, -0.9, { size: 0.8, count: 12, spread: 0.6, reach: 110 })) spd += d;
    for (const d of Brush.splatter(85, 560, 70, 0.7, { size: 0.7, count: 8, spread: 0.5, reach: 90 })) spd += d;
    s('path', { d: spd, fill: INK }, sp);
    B.splat = sp;
    B.seal = seal(B.inner, 92, '風墨', 17);
    B.seal.style.left = '600px'; B.seal.style.top = '96px';
    B.jp = jpV(B.inner, '一閃', 56, 800, 'left:-700px;top:-262px;letter-spacing:.24em;');
    B.en = en(B.inner, 'One stroke.', 44, 300, 'left:-612px;top:-196px;');
    B.sub = en(B.inner, 'Sōen of the Grey Heron falls at Shirasagi Ford.', 18, 300, 'left:-610px;top:-138px;font-style:italic;');
    return B;
  }

  function buildNote(hud) {
    const c = h('div', 'cl', hud);
    c.dataset.anchor = 'br';
    const N = { c };
    N.inner = h('div', 'abs', c, 'left:0;top:0;');
    N.jp = jpV(N.inner, '白鷺の借り', 32, 800, 'right:1px;top:-214px;letter-spacing:.16em;');
    N.seal = seal(N.inner, 36, '録', 19);
    N.seal.style.cssText += 'right:-1px;top:-16px;';
    N.rule = inkStroke(N.inner, [[-420, -110], [-260, -113], [-80, -109]], 3, { seed: 92, tail: 'sweep', taperFrom: 0.55, press: 0.3, bleed: 0 });
    N.title = en(N.inner, 'The Heron’s Debt', 30, 300, 'right:64px;top:-100px;text-align:right;');
    N.sub = en(N.inner, 'Journal updated.', 17, 400, 'right:64px;top:-56px;text-align:right;font-style:italic;color:#2b251f;');
    en(N.sub, 'A new path is marked on your map.', 17, 400, 'right:0;top:23px;text-align:right;');
    return N;
  }

  function buildMap(hud) {
    const MW = 1600, MH = 760;
    const c = h('div', 'cl', hud);
    c.dataset.anchor = 'cc';
    const M = { c, MW, MH };
    M.win = h('div', 'abs', c, `left:${-MW / 2}px;top:${-MH / 2 - 30}px;width:${MW}px;height:${MH + 60}px;overflow:hidden;will-change:transform;`);
    M.body = h('div', 'abs', M.win, `left:0;top:0;width:${MW}px;height:${MH + 60}px;will-change:transform;`);
    h('div', 'abs', M.body, `left:0;top:0;width:${MW}px;height:${MH + 60}px;${BROCADE}`);
    h('div', 'abs', M.body, `left:0;top:9px;width:${MW}px;height:${MH + 42}px;border-top:1px solid ${KIN};border-bottom:1px solid ${KIN};`);
    h('div', 'abs', M.body, `left:0;top:30px;width:${MW}px;height:${MH}px;background:#e9dfc7 url(assets/paper.jpg) -100px -160px;box-shadow:inset 0 0 0 2000px rgba(255,251,242,.28);`);
    const svg = s('svg', { class: 'ink', width: MW, height: MH, viewBox: `0 0 ${MW} ${MH}` }, M.body);
    svg.style.left = '0'; svg.style.top = '30px';
    M.svg = svg;
    const R = Brush.rng(301);
    const defs = s('defs', {}, svg);

    s('rect', { x: 26, y: 22, width: MW - 52, height: MH - 44, fill: 'none', stroke: KIN, 'stroke-width': 1 }, svg);
    s('rect', { x: 31, y: 27, width: MW - 62, height: MH - 54, fill: 'none', stroke: KIN, 'stroke-width': 0.6, 'stroke-opacity': 0.7 }, svg);

    const cx = 800, cy = 410, rx = 455, ry = 252;
    const harm = Array.from({ length: 14 }, (_, k) => ({ k: k + 2, a: (0.3 / (k + 2)) * (0.5 + R() * 1.0), p: R() * TAU }));
    const radius = (th) => {
      let r = 1;
      for (const m of harm) r += m.a * Math.sin(m.k * th + m.p);
      const bay = (a, w, d) => { const x = Math.abs(((th - a + Math.PI) % TAU + TAU) % TAU - Math.PI); return d * Math.exp(-(x * x) / w); };
      r -= bay(1.95, 0.01, 0.2);
      r += bay(-0.2, 0.025, 0.2);
      r -= bay(-1.25, 0.006, 0.12);
      r += bay(2.9, 0.02, 0.12);
      r += bay(1.15, 0.008, 0.1);
      return r;
    };
    const N = 300, coast = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * TAU;
      const r = radius(th);
      coast.push([cx + Math.cos(th) * rx * r, cy + Math.sin(th) * ry * r]);
    }
    const norm = coast.map((p, i) => {
      const a = coast[(i + N - 1) % N], b = coast[(i + 1) % N];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      return [dy / L, -dx / L];
    });
    const ring = (inner, outer) => {
      const o = coast.map((p, i) => [p[0] + norm[i][0] * outer(i), p[1] + norm[i][1] * outer(i)]);
      const n = coast.map((p, i) => [p[0] - norm[i][0] * inner(i), p[1] - norm[i][1] * inner(i)]);
      return 'M' + o.map((q) => f2(q[0]) + ',' + f2(q[1])).join('L') + 'Z M' + n.reverse().map((q) => f2(q[0]) + ',' + f2(q[1])).join('L') + 'Z';
    };
    const wn = Brush.noise1(R, 40);
    s('path', { d: ring(() => 0, (i) => 26 + 10 * wn(i / N)), fill: '#3b4652', 'fill-opacity': 0.07, 'fill-rule': 'evenodd' }, svg);
    s('path', { d: 'M' + coast.map((q) => f2(q[0]) + ',' + f2(q[1])).join('L') + 'Z', fill: INK, 'fill-opacity': 0.035 }, svg);
    s('path', { d: ring((i) => 16 + 8 * wn(i / N), () => 0), fill: INK, 'fill-opacity': 0.06, 'fill-rule': 'evenodd' }, svg);
    const wc = Brush.noise1(R, 70);
    s('path', { d: ring((i) => 0.45 + 0.75 * (0.5 + 0.5 * wc(i / N)), (i) => 0.35 + 1.1 * (0.5 + 0.5 * wc((i / N + 0.5) % 1))), fill: INK, 'fill-rule': 'evenodd' }, svg);
    let islets = '';
    for (const [x, y, r0] of [[318, 300, 16], [342, 328, 8], [1330, 600, 12], [1170, 676, 9], [560, 700, 7]]) islets += Brush.blob(R, x, y, r0, 1.5, R() * 0.6, 0.35);
    s('path', { d: islets, fill: INK, 'fill-opacity': 0.08, stroke: INK, 'stroke-width': 1.1 }, svg);

    const insideIsland = (x, y) => { const th = Math.atan2((y - cy) / ry, (x - cx) / rx); const r = radius((th + TAU) % TAU); return Math.hypot((x - cx) / rx, (y - cy) / ry) < r + 0.07; };
    let waves = '';
    for (let i = 0; i < 140; i++) {
      const x = 60 + R() * (MW - 120), y = 50 + R() * (MH - 100);
      if (insideIsland(x, y) || x > MW - 190) continue;
      const w = 7 + R() * 6;
      waves += `M${f2(x - w)},${f2(y)} q${f2(w / 2)},${f2(-w / 2.4)} ${f2(w)},0 q${f2(w / 2)},${f2(w / 2.4)} ${f2(w)},0 `;
    }
    s('path', { d: waves, fill: 'none', stroke: '#3b4652', 'stroke-opacity': 0.32, 'stroke-width': 1, 'stroke-linecap': 'round' }, svg);

    const river = (pts) => s('path', { d: 'M' + pts.map((p) => p.join(',')).join(' L'), fill: 'none', stroke: '#2f3a44', 'stroke-opacity': 0.55, 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    river([[812, 352], [800, 392], [780, 420], [770, 452], [742, 486], [728, 520], [700, 552], [690, 580], [664, 616], [648, 650], [640, 682]]);
    river([[990, 360], [1010, 400], [1052, 430], [1090, 468], [1136, 490], [1182, 506], [1224, 512]]);

    const mg = s('linearGradient', { id: 'mwash', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    s('stop', { offset: '0', 'stop-color': INK, 'stop-opacity': '0.42' }, mg);
    s('stop', { offset: '1', 'stop-color': INK, 'stop-opacity': '0' }, mg);
    const peaks = [
      [690, 330, 96, 170], [930, 320, 110, 180], [800, 352, 160, 220], [620, 380, 70, 140],
      [1010, 380, 84, 150], [880, 400, 70, 130], [720, 410, 60, 120], [1120, 430, 46, 100],
      [520, 452, 38, 90], [1060, 500, 34, 80], [560, 520, 28, 70],
    ];
    let seed = 200;
    for (const [x, y, ht, wd] of peaks) {
      const ax = x + (R() - 0.5) * wd * 0.15, ay = y - ht;
      s('path', { d: `M${x - wd / 2},${y} Q${f2(x - wd * 0.22)},${f2(y - ht * 0.45)} ${f2(ax)},${f2(ay)} Q${f2(x + wd * 0.2)},${f2(y - ht * 0.55)} ${x + wd / 2},${y} Z`, fill: 'url(#mwash)' }, svg);
      const sw = Math.max(2.2, ht / 32);
      const r1 = Brush.stroke([[ax, ay], [x - wd * 0.2, y - ht * 0.5], [x - wd * 0.46, y - ht * 0.05]], sw, { seed: seed++, tail: 'sweep', taperFrom: 0.4, press: 0.2, bleed: 0, grain: 0.3 });
      s('path', { d: r1.core, fill: INK }, svg);
      const r2 = Brush.stroke([[ax, ay], [x + wd * 0.18, y - ht * 0.55], [x + wd * 0.42, y - ht * 0.12]], sw * 0.7, { seed: seed++, tail: 'sweep', taperFrom: 0.3, press: 0.1, bleed: 0, grain: 0.3 });
      s('path', { d: r2.core, fill: INK, 'fill-opacity': 0.75 }, svg);
      let dots = '';
      for (let k = 0; k < Math.round(ht / 20); k++) {
        const u = R(), side = R() < 0.5 ? -1 : 1;
        const dx = side * u * wd * 0.3, dy = u * ht * 0.6;
        dots += Brush.blob(R, ax + dx, ay + dy + 4, 1 + R() * 1.6, 1.4, R() * 3, 0.3);
      }
      s('path', { d: dots, fill: INK, 'fill-opacity': 0.8 }, svg);
    }

    let pines = '';
    for (const [gx, gy, n] of [[460, 500, 26], [610, 600, 22], [960, 560, 30], [1180, 460, 18], [880, 640, 16], [400, 380, 14]]) {
      for (let k = 0; k < n; k++) pines += Brush.blob(R, gx + (R() - 0.5) * 70, gy + (R() - 0.5) * 36, 1.2 + R() * 1.5, 1.2, 0, 0.3);
    }
    s('path', { d: pines, fill: '#2b3a2e', 'fill-opacity': 0.55 }, svg);

    const road = (pts) => s('path', { d: 'M' + pts.map((p) => p.join(',')).join(' L'), fill: 'none', stroke: INK, 'stroke-opacity': 0.5, 'stroke-width': 1.3, 'stroke-dasharray': '1.5 6', 'stroke-linecap': 'round' }, svg);
    road([[700, 566], [640, 548], [580, 530], [526, 522]]);
    road([[700, 566], [790, 580], [900, 592], [1010, 588], [1110, 572], [1180, 562]]);
    road([[526, 522], [470, 480], [420, 440]]);

    const HALO = 'text-shadow:' + [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0]].map(([x, y]) => `#efe6d0 ${x}px ${y}px 0`).join(',') + ';';
    M.places = {};
    const place = (key, x, y, jp, enName, glyph, hidden, flip) => {
      const g = h('div', 'abs', M.body, `left:${x}px;top:${y + 30}px;will-change:opacity;${HALO}`);
      const d = s('svg', { class: 'ink', width: 30, height: 30, viewBox: '-15 -15 30 30' }, g);
      d.style.left = '-15px'; d.style.top = '-15px';
      s('circle', { r: 11, fill: '#efe6d0', stroke: INK, 'stroke-width': 1.4 }, d);
      s('path', { d: glyph, fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, d);
      jpV(g, jp, 15, 500, (flip ? 'right:15px;' : 'left:15px;') + 'top:-9px;letter-spacing:.14em;');
      en(g, enName, 15, 400, (flip ? 'right:37px;text-align:right;' : 'left:37px;') + 'top:-8px;font-style:italic;color:#3b342b;');
      M.places[key] = { g, hidden };
      return g;
    };
    const G = {
      village: 'M-6 2 L0 -5 L6 2 M-4 1 L-4 6 L4 6 L4 1',
      shrine: 'M-7 -4 L7 -4 M-5 -1 L5 -1 M-4 -4 L-4 6 M4 -4 L4 6',
      pass: 'M-7 5 L-2 -5 L1 1 L4 -3 L7 5',
      harbor: 'M-6 1 Q-3 -2 0 1 Q3 4 6 1 M-6 5 Q-3 2 0 5 Q3 8 6 5',
      ford: 'M-6 -2 L6 -2 M-6 3 L6 3 M-3 -5 L-3 6 M3 -5 L3 6',
      strand: 'M-6 4 Q0 -6 6 4',
    };
    place('ford', 700, 566, '白鷺の渡し', 'Shirasagi Ford', G.ford);
    place('village', 526, 522, '灯籠村', 'Tōrō Village', G.village);
    place('harbor', 1180, 562, '潮見の港', 'Shiomi Harbor', G.harbor);
    place('strand', 420, 440, '千鳥ヶ浜', 'Chidori Strand', G.strand);
    place('pass', 856, 236, '黒鉄峠', 'Kurogane Pass', G.pass, true);
    place('shrine', 1030, 176, '月見の社', 'Tsukimi Shrine', G.shrine, true);
    M.peakName = jpV(M.body, '霧鳴山', 15, 500, `left:${740}px;top:${176 + 30}px;letter-spacing:.3em;color:#3b342b;will-change:opacity;${HALO}`);

    const routePts = [[700, 566], [724, 520], [760, 470], [790, 420], [812, 372], [834, 312], [856, 262], [900, 228], [960, 204], [1030, 180]];
    let rd = 'M' + routePts[0].join(',');
    for (let i = 1; i < routePts.length - 1; i++) {
      const p = routePts[i], nx = routePts[i + 1];
      rd += ` Q${p[0]},${p[1]} ${f2((p[0] + nx[0]) / 2)},${f2((p[1] + nx[1]) / 2)}`;
    }
    rd += ` L${routePts[routePts.length - 1].join(',')}`;
    const rsvg = s('svg', { class: 'ink', width: MW, height: MH, viewBox: `0 0 ${MW} ${MH}` }, M.body);
    rsvg.style.cssText += 'left:0;top:30px;will-change:transform;';
    M.route = s('path', { d: rd, fill: 'none', stroke: SHU, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 9' }, rsvg);
    M.routeLen = M.route.getTotalLength ? M.route.getTotalLength() : 560;

    M.winds = [];
    for (let k = 0; k < 4; k++) {
      const off = (k - 1.5) * 16;
      const pts = routePts.slice(1, 9).map((p, i) => [p[0] + off + 6 * Math.sin(i * 1.3 + k), p[1] + off * 0.4]);
      let d = 'M' + pts[0].join(',');
      for (let i = 1; i < pts.length - 1; i++) d += ` Q${f2(pts[i][0])},${f2(pts[i][1])} ${f2((pts[i][0] + pts[i + 1][0]) / 2)},${f2((pts[i][1] + pts[i + 1][1]) / 2)}`;
      const p = s('path', { d, fill: 'none', stroke: INK, 'stroke-opacity': 0.45, 'stroke-width': 1.1, 'stroke-linecap': 'round', 'stroke-dasharray': '46 420' }, rsvg);
      M.winds.push(p);
    }

    const PAPER_BG = (x, y) => 'background:linear-gradient(rgba(255,251,242,.42),rgba(255,251,242,.42)),' +
      `url(assets/paper.jpg) ${-100 - x}px ${-160 - y}px,#e9dfc7;`;
    const mistGroup = (name) => {
      const g = window.MIST[name];
      const wrap = h('div', 'abs', M.body, `left:0;top:30px;width:${MW}px;height:${MH}px;will-change:transform;`);
      const box = `left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;`;
      h('img', 'abs', wrap, box).src = `assets/wash-${name}.png`;
      const m = `url(assets/mist-${name}.png)`;
      h('div', 'abs', wrap, box + PAPER_BG(g.x, g.y) + `-webkit-mask-image:${m};mask-image:${m};-webkit-mask-size:100% 100%;mask-size:100% 100%;`);
      return { wrap, x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y1, name };
    };
    M.mistKeep = mistGroup('keep');
    M.mistA = mistGroup('a');
    M.mistB = mistGroup('b');
    {
      const [x0, x1, y, th] = window.MIST.keep.banks[0], r = Brush.rng(37);
      let dust = '';
      for (let k = 0; k < 32; k++) {
        const u = r(), dx = x0 + (x1 - x0) * (0.12 + 0.76 * u);
        const dy = y + (r() - 0.5) * th * (0.9 - Math.abs(u - 0.5));
        dust += Brush.blob(r, dx, dy, 0.7 + r() * r() * 1.5, 1.3, r() * 3, 0.3);
      }
      const sv = s('svg', { class: 'ink', width: MW, height: MH, viewBox: `0 0 ${MW} ${MH}` }, M.mistKeep.wrap);
      sv.style.left = '0'; sv.style.top = '0';
      s('path', { d: dust, fill: KIN, 'fill-opacity': 0.55 }, sv);
    }
    M.wipeJagA = Brush.jagFor(401, 13, 26);
    M.wipeJagB = Brush.jagFor(402, 13, 26);
    for (const grp of [M.mistA, M.mistB]) {
      const hgt = grp.y1 - grp.y0 + 70;
      const holder = h('div', 'abs', M.body, `left:0;top:${f2(grp.y0 + 30 - 35)}px;will-change:transform;`);
      inkStroke(holder, [[-6, 0], [4, hgt * 0.5], [-4, hgt]], 24, { seed: 410 + grp.x0 % 7, tail: 'dry', split: 0.55, fingers: 8, bleed: 0 }, { color: '#efe5cd', alpha: 0.75 }).reveal(1);
      grp.brush = holder;
    }

    const tg = h('div', 'abs', M.body, 'left:0;top:0;');
    jpV(tg, '霧鳴島之図', 40, 800, `left:${MW - 110}px;top:72px;letter-spacing:.22em;`);
    en(tg, 'Kirinaki Island', 18, 300, `left:${MW - 190}px;top:${MH - 64}px;text-align:right;width:150px;font-style:italic;`);
    const ts = seal(tg, 44, '霧鳴', 23);
    ts.style.left = (MW - 104) + 'px'; ts.style.top = '440px'; ts.style.transform = 'rotate(-2deg)';
    const north = h('div', 'abs', M.body, `left:${MW - 250}px;top:70px;`);
    inkStroke(north, [[0, 0], [1, 30], [0, 62]], 5, { seed: 501, tail: 'sweep', taperFrom: 0.5, bleed: 0 });
    jpV(north, '北', 18, 800, 'left:-9px;top:72px;');
    const scale = h('div', 'abs', M.body, `left:120px;top:${MH - 30}px;`);
    inkStroke(scale, [[0, 0], [60, -2], [120, 1]], 4, { seed: 502, tail: 'stop', bleed: 0 });
    en(scale, 'one ri', 13, 400, 'left:132px;top:-8px;font-style:italic;');

    M.roller = h('div', 'abs', c, `left:${MW / 2 - 14}px;top:${-MH / 2 - 44}px;width:28px;height:${MH + 88}px;border-radius:12px;will-change:transform;` +
      'background:linear-gradient(to right,#140e0a,#3a2c20 30%,#5d4632 46%,#2a1f17 70%,#0f0b08);box-shadow:4px 0 12px rgba(20,12,6,.35);');
    for (const y of [-4, MH + 70]) h('div', 'abs', M.roller, `left:-3px;top:${y}px;width:34px;height:22px;border-radius:6px;background:linear-gradient(to right,#6e5426,${KIN_L} 45%,#8c6c33);`);
    M.shadow = h('div', 'abs', c, `left:${-MW / 2}px;top:${-MH / 2 - 30}px;width:${MW}px;height:${MH + 60}px;box-shadow:0 18px 50px rgba(40,26,12,.35);will-change:transform;`);
    c.insertBefore(M.shadow, M.win);

    M.cursor = h('div', 'abs', M.body, 'left:0;top:0;will-change:transform;');
    const cu = s('svg', { class: 'ink', width: 80, height: 80, viewBox: '-40 -40 80 80' }, M.cursor);
    cu.style.left = '-40px'; cu.style.top = '-40px';
    s('circle', { r: 20, fill: 'none', stroke: INK, 'stroke-width': 1.3 }, cu);
    s('circle', { r: 25, fill: 'none', stroke: INK, 'stroke-width': 0.7, 'stroke-opacity': 0.6 }, cu);
    s('path', { d: 'M0 -32 L0 -22 M0 22 L0 32 M-32 0 L-22 0 M22 0 L32 0', stroke: INK, 'stroke-width': 1.3 }, cu);
    s('circle', { r: 4, fill: SHU }, cu);

    M.me = s('svg', { class: 'ink', width: 30, height: 30, viewBox: '-15 -15 30 30' }, M.body);
    M.me.style.left = (700 - 15 - 22) + 'px'; M.me.style.top = (566 + 30 - 15 + 16) + 'px';
    s('path', { d: 'M0 -11 L8 9 L0 4 L-8 9 Z', fill: SHU, transform: 'rotate(28)' }, M.me);

    M.dest = seal(M.body, 34, '月', 29);
    M.dest.style.left = (1030 - 66) + 'px'; M.dest.style.top = (176 + 30 - 60) + 'px';
    return M;
  }

  function buildQuest(hud) {
    const c = h('div', 'cl', hud);
    c.dataset.anchor = 'cc';
    const Q = { c };
    const QW = 400, QH = 700;
    Q.win = h('div', 'abs', c, `left:-860px;top:-330px;width:${QW}px;height:0;overflow:hidden;`);
    Q.body = h('div', 'abs', Q.win, `left:0;top:0;width:${QW}px;height:${QH}px;`);
    h('div', 'abs', Q.body, `left:0;top:0;width:${QW}px;height:${QH}px;${BROCADE}box-shadow:0 10px 30px rgba(20,14,8,.35);`);
    h('div', 'abs', Q.body, `left:9px;top:0;width:${QW - 20}px;height:${QH - 6}px;border-left:1px solid ${KIN};border-right:1px solid ${KIN};`);
    const P = h('div', 'abs', Q.body, `left:22px;top:34px;width:${QW - 44}px;height:${QH - 80}px;` +
      `background:linear-gradient(rgba(251,247,238,.62),rgba(251,247,238,.62)),${WASHI} url(assets/paper.jpg) -700px -300px;`);
    jpV(P, '白鷺の借り', 32, 800, `left:${QW - 44 - 58}px;top:26px;letter-spacing:.2em;`);
    en(P, 'The Heron’s Debt', 30, 300, 'left:26px;top:30px;');
    en(P, 'A tale of Shirasagi Ford', 16, 400, 'left:27px;top:72px;font-style:italic;color:#3a332b;');
    h('div', 'abs', P, `left:26px;top:104px;width:250px;height:1px;background:${KIN};`);
    h('div', 'abs', P, 'left:26px;top:120px;width:262px;font-size:17px;line-height:1.45;white-space:normal;font-weight:400;',
      'Sōen owed a debt of honour to the keeper of Tsukimi Shrine. His blade must go home before the first frost.');
    const obj = (y, txt, state) => {
      const g = h('div', 'abs', P, `left:26px;top:${y}px;width:300px;`);
      const mark = s('svg', { class: 'ink', width: 22, height: 22, viewBox: '-11 -11 22 22' }, g);
      mark.style.left = '0'; mark.style.top = '1px';
      if (state === 'done') {
        const st = Brush.stroke([[-7, 0], [-2, 6], [8, -8]], 3.4, { seed: 611, tail: 'sweep', taperFrom: 0.5, bleed: 0, press: 0.2 });
        s('path', { d: st.core, fill: INK }, mark);
      } else {
        s('circle', { r: 5.5, fill: 'none', stroke: state === 'new' ? SHU : INK, 'stroke-width': 1.5 }, mark);
        if (state === 'new') s('circle', { r: 2.2, fill: SHU }, mark);
      }
      const tx = h('div', 'abs', g, `left:32px;top:-1px;width:250px;font-size:17px;line-height:1.4;white-space:normal;${state === 'done' ? 'color:#4d453b;' : ''}`, txt);
      return { g, tx };
    };
    Q.o1 = obj(262, 'Defeat Sōen at Shirasagi Ford', 'done');
    Q.o2 = obj(318, 'Return the heron blade to Tsukimi Shrine', 'new');
    Q.o3 = obj(396, 'Light the lanterns of Tōrō Village', 'opt');
    en(Q.o3.g, 'Optional, 0 of 3', 15, 400, 'left:32px;top:52px;font-style:italic;color:#4d453b;');
    h('div', 'abs', P, `left:26px;top:494px;width:250px;height:1px;background:${KIN};`);
    en(P, 'Reward', 15, 500, 'left:26px;top:510px;letter-spacing:.04em;color:#3a332b;');
    en(P, 'A charm of still water', 18, 400, 'left:26px;top:534px;font-style:italic;');
    const qs = seal(P, 54, '月見', 31);
    qs.style.left = (QW - 44 - 80) + 'px'; qs.style.top = '520px'; qs.style.transform = 'rotate(3deg)';
    Q.roller = h('div', 'abs', c, `left:-874px;top:-336px;width:${QW + 28}px;height:16px;border-radius:8px;` +
      'background:linear-gradient(to bottom,#5a4634,#2a1f17 55%,#120d09);will-change:transform;');
    for (const x of [-4, QW + 12]) h('div', 'abs', Q.roller, `left:${x}px;top:-2px;width:20px;height:20px;border-radius:5px;background:linear-gradient(to bottom,${KIN_L},${KIN} 60%,#7a5e2c);`);
    Q.QH = QH;
    return Q;
  }

  function layout(ctx) {
    const W = ctx.width, H = ctx.height;
    const sc = Math.min(W / 1920, H / 1080), LW = W / sc, LH = H / sc;
    const hud = document.getElementById('hud');
    hud.style.width = LW + 'px';
    hud.style.height = LH + 'px';
    hud.style.transform = `scale(${sc})`;
    for (const c of hud.querySelectorAll('.cl')) {
      const a = c.dataset.anchor;
      const x = a[1] === 'l' ? 88 : a[1] === 'r' ? LW - 88 : LW / 2;
      const y = a[0] === 't' ? 0 : a[0] === 'b' ? LH - 88 : LH / 2;
      c.style.left = x + 'px';
      c.style.top = y + 'px';
    }
    const cs = Math.max(W / 1920, H / 1080);
    const cam = document.getElementById('cam');
    cam.style.transform = `translate(${(W - 1920 * cs) / 2}px, ${(H - 1080 * cs) / 2}px) scale(${cs})`;
  }

  const T = {
    titleIn: 0.3, titleOut: 2.15,
    foeIn: 2.45, foeOut: 10.95, hudIn: 2.7,
    stance: 3.9,
    hits: [4.45, 5.25, 8.05, 8.6],
    warn: 5.9, hurt: 6.5, parry: 7.25, heal: 7.75,
    blow: 8.95, seal: 9.45, blowOut: 10.4,
    hudOut: 10.0,
    note: 10.75, noteOut: 12.15,
    mapIn: 12.1, unroll: 12.45, wipeA: 14.0, wipeB: 14.4, quest: 14.95, route: 15.75, dest: 16.55,
    rollUp: 17.75, mapOut: 18.45,
  };

  function render(t, ctx) {
    const { W: Wd, H: Hd, M, Q, B, N } = ctx;
    const dusk = Brush.smooth(3.0, 11.0, t) * (1 - Brush.smooth(15.0, 17.0, t));
    const inkAmt = Math.max(env(t, 8.86, 9.02, 9.95, 10.9, E.out, E.soft), 0);
    show(document.getElementById('sky-dusk'), dusk);
    show(document.getElementById('ground-dusk'), dusk);
    show(document.getElementById('sky-ink'), inkAmt);
    show(document.getElementById('ground-ink'), inkAmt);
    show(document.getElementById('inkmode'), inkAmt * 0.9);
    const flash = env(t, 9.08, 9.12, 9.14, 9.5, E.out, E.soft) * 0.55 + env(t, T.parry, T.parry + 0.03, T.parry + 0.05, T.parry + 0.3) * 0.25;
    show(document.getElementById('flash'), flash);

    let sx = 0, sy = 0;
    const kicks = [[T.hits[0], 5], [T.hits[1], 5], [T.hurt, 16], [T.parry, 6], [T.hits[2], 6], [T.hits[3], 9], [9.1, 12], [T.seal, 4]];
    for (let i = 0; i < kicks.length; i++) {
      const at = kicks[i][0], a = kicks[i][1], u = t - at;
      if (u < 0 || u > 0.6) continue;
      const k = a * Math.exp(-u * 9);
      sx += k * Math.sin(u * 83 + at); sy += k * Math.cos(u * 71 + at * 3);
    }
    const duel = env(t, 2.4, 3.6, 10.2, 11.6, E.inOut, E.inOut);
    const mapPush = env(t, 11.9, 12.9, 18.3, 19.4, E.inOut, E.inOut);
    const bob = 3 * per(t, 9);
    const L = ctx.live;
    if (L.enabled) {
      L.cur.x += (L.look.x - L.cur.x) * 0.06;
      L.cur.y += (L.look.y - L.cur.y) * 0.06;
      if (t < T.hudIn) L.stance = null;
    }
    const camX = 18 * per(t, 1) + sx - 34 * L.cur.x, camY = 6 * per(t, 2, 1) + bob + sy - 12 * L.cur.y;
    const zoom = 1 + 0.035 * duel + 0.05 * env(t, 8.9, 9.4, 9.9, 10.8, E.out, E.inOut) + 0.06 * mapPush;
    tf(document.getElementById('sky'), `translate(${f2(camX * 0.3)}px, ${f2(camY * 0.3)}px) scale(${f5(1 + (zoom - 1) * 0.4)})`);
    tf(document.getElementById('ground'), `translate(${f2(camX * 0.6)}px, ${f2(camY * 0.6)}px) scale(${f5(1 + (zoom - 1) * 0.8)})`);

    {
      const FL = document.getElementById('foe'), foe = ctx.world.foe;
      const farA = Math.max(1 - E.soft(lin(t, T.foeIn - 0.2, T.foeIn + 0.15)), E.soft(lin(t, 18.9, 19.9)));
      show(foe.far, farA * 0.6);
      tf(foe.far, `translate(${f2(camX * 0.35)}px, ${f2(camY * 0.35)}px)`);
      const visF = t >= T.foeIn - 0.12 && t < T.foeOut;
      const fIn = lin(t, T.foeIn - 0.12, T.foeIn + 0.62);
      show(foe.wrap, visF ? E.out(lin(t, T.foeIn - 0.12, T.foeIn + 0.2)) : 0);
      tf(FL, `translate(${f2(camX * 0.75)}px, ${f2(camY * 0.75)}px) scale(${f5(zoom)})`);
      set(foe.wrap, 'filter', visF && fIn < 1 ? `blur(${f2(10 * (1 - E.out(fIn)))}px)` : 'none');
      if (!visF) show(FL.__glow, 0);
      else {
        const J = foe.render(t, { gust }), dz = foe.dissolve(t);
        tf(FL.__glow, `translate(${f2(FOE[0] + J.chest[0] * FOE_S)}px, ${f2(FOE[1] + (J.chest[1] - 40) * FOE_S)}px) scale(${f5(0.8 + 0.25 * J.s)})`);
        show(FL.__glow, E.out(fIn) * (1 - 0.5 * dusk) * (1 - inkAmt) * (dz ? 1 - dz.k : 1));
      }
    }

    for (const sl of ctx.world.slashes) {
      const u = t - sl.at;
      sl.el.reveal(u < 0 || u > 0.7 ? 0 : E.brush(lin(u, 0, 0.12)));
      set(sl.el.svg, 'opacity', String(f5(1 - lin(u, 0.18, 0.7))));
    }
    const gl = env(t, T.parry, T.parry + 0.06, T.parry + 0.12, T.parry + 0.55, E.out, E.soft);
    show(ctx.world.glint, gl);
    tf(ctx.world.glint, `scale(${f5(0.6 + 0.5 * gl)}) rotate(${f5((t - T.parry) * 30)}deg)`);
    tf(document.getElementById('wfx'), `translate(${f2(camX * 0.75)}px, ${f2(camY * 0.75)}px) scale(${f5(zoom)})`);

    for (const r of ctx.world.reeds) {
      const g = gust(t, r.x / 2400);
      const a = 2.2 * Math.sin((TAU * 4 * t) / DUR + r.ph) + 1.1 * Math.sin((TAU * 7 * t) / DUR + r.ph * 2) + 9 * g;
      tf(r.el, `translate(${f2(camX * 1.25)}px, ${f2(camY * 1.2 + 30 * mapPush)}px) rotate(${f5(a)}deg)`);
    }
    for (const L of ctx.world.leaves) {
      const period = DUR / L.k, u = wrap(t + L.ph * period) % period / period;
      const g = gust(t, 0.3);
      const x = -120 + u * 2200 + 60 * Math.sin(u * 9 + L.ph * 6);
      const y = L.y0 + u * (L.near ? 900 : 600) + L.amp * Math.sin(u * 7 + L.ph * 4) - g * 40;
      const tumble = Math.cos(u * L.spin * 14 + L.ph * 9);
      tf(L.el, `translate(${f2(x + camX * (L.near ? 1.4 : 0.8))}px, ${f2(y + camY)}px) rotate(${f5(u * 360 * L.spin)}deg) scaleX(${f5(0.35 + 0.65 * Math.abs(tumble))})`);
    }

    const breath = E.soft(lin(t, 0.2, 0.8)) * (1 - lin(t, 13, 14));
    const closed = env(t, 2.4, 3.6, T.noteOut - 0.2, T.noteOut + 0.9, E.inOut, E.inOut);
    const margin = mix(1.1 - 0.04 * breath, 1.0, closed);
    tf(document.getElementById('paper'), `scale(${f5(margin)})`);
    show(document.getElementById('paper-full'), env(t, T.mapIn, T.mapIn + 0.7, T.mapOut, T.mapOut + 0.75, E.inOut, E.inOut));

    renderHUD(t, ctx);
    renderMap(t, ctx);
  }

  function renderHUD(t, ctx) {
    const H = ctx.hud;
    {
      const T0 = T.titleIn, out = 1 - E.soft(lin(t, 1.85, 2.35));
      const ti = H.title;
      const p1 = E.brush(lin(t, T0, T0 + 0.55));
      clip(ti.jp, p1 >= 1 ? 'none' : `inset(0 0 ${f2(99.9 - 99.9 * p1)}% 0)`);
      const p2 = E.soft(lin(t, T0 + 0.35, T0 + 1.1));
      clip(ti.haiku, p2 >= 1 ? 'none' : `inset(0 0 ${f2(99.9 - 99.9 * p2)}% 0)`);
      ti.rule.reveal(E.brush(lin(t, T0 + 0.15, T0 + 0.5)));
      const sealK = lin(t, T0 + 0.8, T0 + 0.92);
      show(ti.seal, sealK);
      tf(ti.seal, `rotate(2deg) scale(${f5(1.25 - 0.25 * E.stamp(sealK))})`);
      show(ti.en, E.out(lin(t, T0 + 0.5, T0 + 0.9)));
      show(ti.sub, E.out(lin(t, T0 + 0.75, T0 + 1.2)));
      show(ti.c, t < T0 || t > 2.4 ? 0 : out);
      tf(ti.c, `translate(${f2(24 * (1 - out))}px, 0)`);
    }

    const hin = (i) => E.brush(lin(t, T.hudIn + i * 0.07, T.hudIn + i * 0.07 + 0.32));
    const dis = E.soft(lin(t, T.hudOut, T.hudOut + 0.9));
    const visHud = t >= T.hudIn && t < T.hudOut + 0.95;
    const drift = (k) => `translate(${f2(dis * (18 + 10 * k))}px, ${f2(-dis * 4 * k)}px)`;

    {
      const P = H.player;
      show(P.c, visHud ? 1 - dis : 0);
      tf(P.inner, drift(1));
      let hp = 1, ghost = 1;
      if (t >= T.hurt) hp = mix(1, 0.56, E.out(lin(t, T.hurt, T.hurt + 0.1)));
      if (t >= T.hurt) ghost = mix(1, 0.56, E.soft(lin(t, T.hurt + 0.5, T.hurt + 0.85)));
      if (t >= T.heal) { hp = mix(0.56, 0.84, E.brush(lin(t, T.heal + 0.15, T.heal + 0.6))); ghost = hp; }
      const reveal = hin(0);
      P.ghost.reveal(reveal);
      P.bar.reveal(Math.min(reveal, hp));
      P.wash.reveal(t > T.hurt && t < T.heal ? Math.min(reveal, ghost) : 0);
      const hk = lin(t, T.hurt, T.hurt + 0.12);
      show(P.hurt, hk > 0 ? 1 - E.soft(lin(t, T.hurt + 0.5, T.hurt + 1.3)) : 0);
      clip(P.hurt, hk >= 1 ? 'none' : `inset(0 0 0 ${f2(99.9 - 99.9 * E.out(hk))}%)`);
      let full = 2;
      if (t >= T.hits[1]) full = 3;
      if (t >= T.parry) full = 4;
      if (t >= T.heal) full = 3;
      if (t >= T.hits[3]) full = 4;
      const cIn = hin(1);
      show(P.crest, cIn);
      tf(P.crest, `rotate(${f5(-40 * (1 - cIn))}deg)`);
      for (let k = 0; k < 5; k++) {
        const pt = P.petals[k];
        let a = k < full ? 1 : 0;
        const bloomAt = k === 2 ? T.hits[1] : k === 3 ? (t >= T.hits[3] ? T.hits[3] : T.parry) : -1;
        let sc = 1;
        if (bloomAt > 0 && t >= bloomAt && t < bloomAt + 0.35) sc = 0.3 + 0.7 * E.stamp(lin(t, bloomAt, bloomAt + 0.3));
        setAttr(pt.fill, 'fill-opacity', a ? '1' : '0');
        setAttr(pt.fill, 'r', String(f2(12.2 * sc)));
      }
      const fl = lin(t, T.heal, T.heal + 1.1);
      if (fl > 0 && fl < 1) {
        const a = P.petals[3].a;
        const x0 = 52 + Math.cos(a) * 21 - 15, y0 = -60 + Math.sin(a) * 21 - 15;
        const e = E.out(fl);
        show(P.fly, 1 - Brush.smooth(0.55, 1, fl));
        tf(P.fly, `translate(${f2(x0 + e * 260 + 30 * Math.sin(fl * 7))}px, ${f2(y0 - e * 120 + 40 * fl * fl)}px) rotate(${f5(fl * 540)}deg) scale(${f5(1 - 0.5 * fl)}, ${f5((1 - 0.5 * fl) * Math.abs(Math.cos(fl * 9)))})`);
      } else show(P.fly, 0);
    }

    {
      const S = H.stance;
      show(S.c, visHud ? 1 - dis : 0);
      tf(S.inner, drift(1.5));
      let active = 'ten', prev = null, u = 0;
      if (t >= T.stance) { active = 'yoko'; prev = 'ten'; u = t - T.stance; }
      const ov = ctx.live.stance;
      if (ov && t > T.hudIn + 0.8 && t < T.hudOut) { active = ov.k; prev = ov.prev; u = (performance.now() - ov.at) / 1000; }
      ctx.live.current = active;
      STANCES.forEach((k, i) => {
        const m = S.marks[k];
        m.pale.reveal(hin(2 + i * 0.6));
        let solid = 0, op = 1;
        if (k === active) solid = prev ? E.brush(lin(u, 0.05, 0.3)) : hin(2);
        else if (k === prev) { solid = 1; op = 1 - lin(u, 0, 0.25); }
        m.solid.reveal(op > 0 ? solid : 0);
        set(m.solid.svg, 'opacity', String(f5(op)));
        const nIn = k === active ? (prev ? E.out(lin(u, 0.12, 0.42)) : E.out(lin(t, T.hudIn + 0.25, T.hudIn + 0.6))) : k === prev ? 1 - lin(u, 0, 0.15) : 0;
        show(S.names[k], nIn);
        tf(S.names[k], `translate(0, ${f2(k === active ? 8 * (1 - nIn) : 0)}px)`);
      });
      const ringIn = hin(2);
      show(S.ring, ringIn);
      tf(S.ring, `rotate(${f5(-60 * (1 - ringIn))}deg)`);
      const a0 = S.beadAngle[prev || active], a1 = S.beadAngle[active];
      const delta = ((a1 - a0 + 540) % 360) - 180;
      const ang = ((a0 + delta * (prev ? E.inOut(lin(u, 0, 0.3)) : 1)) * Math.PI) / 180;
      tf(S.bead, `translate(${f2(Math.cos(ang) * 66)}px, ${f2(Math.sin(ang) * 66)}px)`);
      show(S.bead, hin(4.5));
    }

    {
      const F = H.foe;
      show(F.c, visHud ? 1 - dis : 0);
      tf(F.inner, drift(0.6));
      const un = E.inOut(lin(t, T.hudIn + 0.1, T.hudIn + 0.75));
      set(F.scroll, 'height', f2(512 * un) + 'px');
      show(F.text, E.out(lin(t, T.hudIn + 0.55, T.hudIn + 0.95)));
      const marks = [[T.hits[0], 0.3], [T.hits[1], 0.52], [T.parry, 0.74], [T.hits[2], 0.88], [T.hits[3], 1]];
      let p = 0, prev = 0;
      for (let i = 0; i < marks.length; i++) {
        const at = marks[i][0], v = marks[i][1];
        if (t < at) break;
        const rec = Math.min(0.06, (t - at - 0.3) * 0.05);
        p = mix(prev, v, E.out(lin(t, at, at + 0.12))) - (rec > 0 && v < 1 ? rec : 0);
        prev = v;
      }
      F.poiseGhost.reveal(un >= 1 ? 1 : 0);
      F.poise.reveal(Math.max(0, p));
      const bk = lin(t, T.hits[3] + 0.08, T.hits[3] + 0.2);
      show(F.breakSeal, bk);
      tf(F.breakSeal, `rotate(-4deg) scale(${f5(1.3 - 0.3 * E.stamp(bk))})`);
    }

    {
      const Wn = H.warn;
      const a = env(t, T.warn, T.warn + 0.1, T.hurt - 0.02, T.hurt + 0.25, E.out, E.soft);
      show(Wn.c, a);
      const p = E.brush(lin(t, T.warn, T.warn + 0.22));
      const ar = Wn.ensoArc;
      clip(Wn.ensoSvg, p >= 1 ? 'none' : wedgeClip(ar.cx, ar.cy, 200, ar.a0, ar.a0 + ar.sweep * Math.max(0.001, p)));
      Wn.swash.reveal(E.brush(lin(t, T.warn + 0.08, T.warn + 0.28)));
      const pulse = 1 + 0.06 * Math.max(0, Math.sin((t - T.warn) * 18)) * (1 - lin(t, T.warn, T.hurt));
      tf(Wn.inner, `scale(${f5(pulse)})`);
      set(Wn.inner, 'transform-origin', '0 250px');
      show(Wn.glyph, E.out(lin(t, T.warn + 0.05, T.warn + 0.15)));
    }

    {
      const B = ctx.B;
      const a = t >= T.blow && t < T.blowOut + 0.9 ? 1 - E.soft(lin(t, T.blowOut, T.blowOut + 0.85)) : 0;
      show(B.c, a);
      tf(B.inner, `translate(${f2(40 * E.soft(lin(t, T.blowOut, T.blowOut + 0.85)))}px, 0)`);
      B.stroke.reveal(E.brush(lin(t, T.blow, T.blow + 0.3)));
      const sp = lin(t, T.blow + 0.12, T.blow + 0.36);
      show(B.splat, sp > 0 ? 1 : 0);
      clip(B.splat, sp >= 1 ? 'none' : `inset(0 ${f2(99.9 - 99.9 * E.out(sp))}% 0 0)`);
      const sk = lin(t, T.seal, T.seal + 0.11);
      show(B.seal, sk);
      tf(B.seal, `rotate(-3deg) scale(${f5(1.22 - 0.22 * E.stamp(sk))})`);
      const jp = E.brush(lin(t, T.blow + 0.35, T.blow + 0.75));
      clip(B.jp, jp >= 1 ? 'none' : `inset(0 0 ${f2(99.9 - 99.9 * jp)}% 0)`);
      show(B.jp, jp > 0 ? 1 : 0);
      show(B.en, E.out(lin(t, T.blow + 0.5, T.blow + 0.8)));
      show(B.sub, E.out(lin(t, T.blow + 0.65, T.blow + 0.95)));
    }

    {
      const N = ctx.N;
      const T0 = T.note, out = 1 - E.soft(lin(t, T.noteOut - 0.4, T.noteOut));
      show(N.c, t < T0 || t > T.noteOut ? 0 : out);
      const p1 = E.brush(lin(t, T0, T0 + 0.55));
      clip(N.jp, p1 >= 1 ? 'none' : `inset(0 0 ${f2(99.9 - 99.9 * p1)}% 0)`);
      N.rule.reveal(E.brush(lin(t, T0 + 0.15, T0 + 0.5)));
      const sk = lin(t, T0 + 0.6, T0 + 0.72);
      show(N.seal, sk);
      tf(N.seal, `rotate(-3deg) scale(${f5(1.25 - 0.25 * E.stamp(sk))})`);
      show(N.title, E.out(lin(t, T0 + 0.3, T0 + 0.7)));
      show(N.sub, E.out(lin(t, T0 + 0.5, T0 + 0.9)));
      tf(N.inner, `translate(${f2(24 * (1 - out))}px, 0)`);
    }
  }

  function renderMap(t, ctx) {
    const M = ctx.M, Q = ctx.Q;
    const vis = t >= T.unroll - 0.05 && t < T.mapOut + 0.2;
    set(M.c, 'display', vis ? 'block' : 'none');
    show(M.c, vis ? 1 : 0);
    if (vis) {
      const u = E.inOut(lin(t, T.unroll, T.unroll + 0.85)) * (1 - E.inOut(lin(t, T.rollUp, T.rollUp + 0.75)));
      const hide = (1 - u) * M.MW;
      tf(M.win, `translate(${f2(hide)}px, 0)`);
      tf(M.body, `translate(${f2(-hide)}px, 0)`);
      tf(M.shadow, `translate(${f2(hide)}px, 0)`);
      tf(M.roller, `translate(${f2(-u * M.MW)}px, 0)`);
      show(M.roller, 1 - lin(t, T.mapOut - 0.1, T.mapOut + 0.15));
      for (const k of Object.keys(M.places)) {
        const pl = M.places[k];
        const at = pl.hidden ? (k === 'shrine' ? T.wipeA + 0.5 : T.wipeB + 0.5) : T.unroll + 0.7 + { ford: 0, village: 0.08, harbor: 0.16, strand: 0.24 }[k];
        const a = E.out(lin(t, at, at + 0.35));
        show(pl.g, a);
      }
      show(M.peakName, E.out(lin(t, T.wipeB + 0.55, T.wipeB + 0.9)));
      const wipe = (grp, at, jag) => {
        const p = E.inOut(lin(t, at, at + 0.55));
        const fx = grp.x0 - 40 + (grp.x1 - grp.x0 + 80) * p;
        show(grp.brush, p > 0 && p < 1 ? Math.min(1, Math.sin(Math.PI * p) * 2.2) : 0);
        tf(grp.brush, `translate(${f2(fx + 6)}px, 0) skewX(-8deg)`);
        if (p <= 0) { clip(grp.wrap, 'none'); show(grp.wrap, 1); return p; }
        if (p >= 1) { show(grp.wrap, 0); return p; }
        show(grp.wrap, 1);
        const pts = [[fx, grp.y0 - 60]];
        for (let i = 1; i < jag.length - 1; i++) pts.push([fx + jag[i], grp.y0 - 60 + ((grp.y1 - grp.y0 + 120) * i) / (jag.length - 1)]);
        pts.push([fx, grp.y1 + 60], [M.MW + 50, grp.y1 + 60], [M.MW + 50, grp.y0 - 60]);
        clip(grp.wrap, 'polygon(' + pts.map((q) => f2(q[0]) + 'px ' + f2(q[1]) + 'px').join(',') + ')');
        return p;
      };
      wipe(M.mistA, T.wipeA, M.wipeJagA);
      wipe(M.mistB, T.wipeB, M.wipeJagB);
      const cpath = [[T.unroll + 0.9, 700, 566], [13.7, 700, 566], [14.25, 900, 250], [15.0, 980, 214], [15.5, 1030, 176]];
      let cxp = 700, cyp = 566;
      for (let i = 0; i < cpath.length - 1; i++) {
        const [a0, x0, y0] = cpath[i], [a1, x1, y1] = cpath[i + 1];
        if (t >= a0) { const k = E.inOut(lin(t, a0, a1)); cxp = mix(x0, x1, k); cyp = mix(y0, y1, k); }
      }
      tf(M.cursor, `translate(${f2(cxp)}px, ${f2(cyp + 30)}px) scale(${f5(1 + 0.15 * Math.sin(t * 5))})`);
      show(M.cursor, E.out(lin(t, T.unroll + 0.8, T.unroll + 1.1)));
      show(M.me, E.out(lin(t, T.unroll + 0.6, T.unroll + 0.9)));
      const rp = E.soft(lin(t, T.route, T.route + 0.8));
      const len = M.routeLen * rp;
      setAttr(M.route, 'stroke-dasharray', rp <= 0 ? '0 100000' : `0.1 9 0 0`);
      setAttr(M.route, 'stroke-dashoffset', '0');
      if (rp > 0 && rp < 1) {
        const n = Math.floor(len / 9.1);
        setAttr(M.route, 'stroke-dasharray', Array(n).fill('0.1 9').join(' ') + ' 0 100000');
      } else if (rp >= 1) setAttr(M.route, 'stroke-dasharray', '0.1 9');
      const dk = lin(t, T.dest, T.dest + 0.12);
      show(M.dest, dk);
      tf(M.dest, `rotate(-4deg) scale(${f5(1.3 - 0.3 * E.stamp(dk))})`);
      const wa = env(t, T.dest + 0.1, T.dest + 0.4, T.rollUp - 0.3, T.rollUp);
      M.winds.forEach((p, i) => {
        setAttr(p, 'stroke-dashoffset', String(f2(-((t - T.dest) * 260 + i * 110) % 466)));
        setAttr(p, 'stroke-opacity', String(f2(0.45 * wa)));
      });
    }

    const qv = t >= T.quest && t < T.rollUp + 0.7;
    set(Q.c, 'display', qv ? 'block' : 'none');
    show(Q.c, qv ? 1 : 0);
    if (qv) {
      const u = E.inOut(lin(t, T.quest, T.quest + 0.7)) * (1 - E.inOut(lin(t, T.rollUp - 0.15, T.rollUp + 0.45)));
      set(Q.win, 'height', f2(Q.QH * u) + 'px');
      tf(Q.roller, `translate(0, ${f2(Q.QH * u)}px)`);
      const o2 = E.brush(lin(t, T.route - 0.1, T.route + 0.35));
      show(Q.o2.g, o2 > 0 ? 1 : 0);
      clip(Q.o2.tx, o2 >= 1 ? 'none' : `inset(0 ${f2(99.9 - 99.9 * o2)}% 0 0)`);
    }
  }

  scene.define({
    name: 'wind-and-ink',
    controls: [[['1–4'], 'Change stance in the duel'], [['Mouse move'], 'Look around']],
    duration: DUR,
    keyTimes: [1.4, 3.7, 6.65, 7.4, 9.9, 13.5, 14.7, 16.4],
    params: { vtext: { default: 'stack', options: ['stack', 'css'] } },
    routes: ['photon-fill', 'photon-text', 'svg-inline', 'clip-path', 'mask', 'mix-blend-mode', 'svg-filter', 'composited-layer'],
    setup(ctx) {
      ctx.live = { enabled: !q.has('t'), look: { x: 0, y: 0 }, cur: { x: 0, y: 0 }, stance: null, current: 'ten' };
      if (ctx.live.enabled) {
        addEventListener('mousemove', (e) => {
          ctx.live.look.x = (e.clientX / innerWidth - 0.5) * 2;
          ctx.live.look.y = (e.clientY / innerHeight - 0.5) * 2;
        });
        addEventListener('keydown', (e) => {
          const k = STANCES[+e.key - 1];
          if (k && k !== ctx.live.current) ctx.live.stance = { k, prev: ctx.live.current, at: performance.now() };
        });
      }
      ctx.world = buildWorld();
      const hud = document.getElementById('hud');
      ctx.hud = buildHUD(hud);
      buildWarn(ctx.hud);
      ctx.B = buildBlow(hud);
      ctx.N = buildNote(hud);
      ctx.M = buildMap(hud);
      ctx.Q = buildQuest(hud);
      layout(ctx);
    },
    applyView(v, ctx) {
      const st = document.getElementById('stage');
      st.style.transformOrigin = '50% 50%';
      st.style.transform = `translate(${v.x}px, ${v.y}px) rotate(${v.rotate}deg) scale(${v.zoom})`;
    },
    render(t, ctx) { render(t, ctx); },
  });
})();
