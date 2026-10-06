const Foe = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#1b1712';
  const TAU = Math.PI * 2;
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lin = (t, a, b) => clamp01((t - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const f1 = (v) => Math.round(v * 10) / 10;
  const f2 = (v) => Math.round(v * 100) / 100;
  const f5 = (v) => Math.round(v * 1e5) / 1e5;

  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mad = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const vlen = (a) => Math.hypot(a[0], a[1]);
  const unit = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l]; };
  const ang = (a) => [Math.cos(a), Math.sin(a)];
  const rot = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };

  const EASE = {
    lin: (k) => k,
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    o: (k) => 1 - Math.pow(1 - k, 3),
    snap: (k) => 1 - Math.pow(1 - k, 5),
    back: (k) => { const c = 1.6, u = k - 1; return 1 + (c + 1) * u * u * u + c * u * u; },
  };

  const BASE = {
    x: 0, y: 0, s: 1, hip: 236, lean: 0.02, bow: 0.08, head: 0.06, hat: 0,
    gx: -26, gy: -80, blade: -2.2, draw: 1, drop: 0, lh: 0, lx: 34, ly: -30,
    fr: -62, fl: 50, rl: 0, ll: 0, kn: 0,
  };
  const FIELDS = Object.keys(BASE);
  const P = (o) => Object.assign({}, BASE, o);
  const POSE = {
    walk1: P({ x: 210, y: -8, s: 0.94, hip: 250, lean: -0.02, bow: 0.02, head: 0.1, gx: -62, gy: -8, blade: 3.3, draw: 0, lh: 1, lx: 30, ly: -18, fr: -36, fl: 34, ll: 8 }),
    walk2: P({ x: 150, y: -5, s: 0.96, hip: 245, lean: 0.01, bow: 0.02, head: 0.1, gx: -60, gy: -12, blade: 3.3, draw: 0, lh: 1, lx: 30, ly: -18, fr: -26, fl: 44, rl: 8 }),
    walk3: P({ x: 92, y: -2, s: 0.98, hip: 250, lean: -0.01, bow: 0.03, head: 0.08, gx: -62, gy: -10, blade: 3.3, draw: 0, lh: 1, lx: 30, ly: -18, fr: -44, fl: 30, ll: 7 }),
    stand: P({ x: 50, hip: 248, lean: 0, bow: 0.04, head: 0.06, gx: -60, gy: -14, blade: 3.3, draw: 0, lh: 1, lx: 30, ly: -18, fr: -46, fl: 42 }),
    ready: P({ x: 44, hip: 230, lean: 0.04, bow: 0.12, head: 0.12, gx: 16, gy: -22, blade: 3.3, draw: 0, lh: 1, lx: 32, ly: -16, fr: -60, fl: 52 }),
    ready2: P({ x: 42, hip: 222, lean: 0.06, bow: 0.18, head: 0.16, gx: 18, gy: -20, blade: 3.3, draw: 0, lh: 1, lx: 34, ly: -14, fr: -66, fl: 56 }),
    drawn: P({ x: 34, hip: 226, lean: 0.1, bow: 0.1, head: 0.08, gx: -128, gy: -128, blade: 3.02, lh: 1, lx: 40, ly: -12, fr: -84, fl: 56 }),
    drawn2: P({ x: 32, hip: 228, lean: 0.12, bow: 0.08, head: 0.06, gx: -136, gy: -122, blade: 3.16, lh: 1, lx: 40, ly: -12, fr: -84, fl: 56 }),
    guard: P({}),
    hitA: P({ x: 30, hip: 242, lean: -0.17, bow: -0.06, head: -0.24, hat: -0.14, gx: -8, gy: -100, blade: -1.9, fr: -40, fl: 66 }),
    hitA2: P({ x: 38, hip: 240, lean: -0.12, bow: -0.02, head: -0.14, hat: -0.06, gx: -12, gy: -92, blade: -2.0, fr: -38, fl: 66 }),
    hitB: P({ x: -26, hip: 240, lean: 0.15, bow: 0.02, head: 0.26, hat: 0.14, gx: -44, gy: -86, blade: -2.5, fr: -76, fl: 36 }),
    hitB2: P({ x: -32, hip: 238, lean: 0.1, bow: 0.04, head: 0.16, hat: 0.06, gx: -40, gy: -84, blade: -2.42, fr: -76, fl: 38 }),
    windup: P({ x: 24, hip: 226, lean: -0.12, bow: -0.04, head: -0.04, gx: 32, gy: -204, blade: -0.5, fr: -36, fl: 84 }),
    windup2: P({ x: 30, hip: 218, lean: -0.16, bow: -0.06, head: -0.02, gx: 30, gy: -206, blade: -0.38, fr: -34, fl: 88 }),
    lunge: P({ x: -150, y: 80, s: 1.4, hip: 196, lean: 0.3, bow: 0.28, head: 0.12, hat: 0.08, gx: -90, gy: -46, blade: 2.55, fr: -160, fl: 110 }),
    follow: P({ x: -162, y: 86, s: 1.42, hip: 190, lean: 0.34, bow: 0.3, head: 0.16, hat: 0.1, gx: -88, gy: -40, blade: 2.85, fr: -168, fl: 116 }),
    guardB: P({ x: -60, y: 30, s: 1.16, hip: 232, lean: 0.05, bow: 0.1, head: 0.08, gx: -30, gy: -82, blade: -2.15, fr: -80, fl: 60 }),
    raise: P({ x: -30, y: 16, s: 1.1, hip: 240, lean: -0.04, bow: -0.05, head: -0.08, gx: -14, gy: -236, blade: -1.7, fr: -70, fl: 64 }),
    strike: P({ x: -40, y: 22, s: 1.14, hip: 222, lean: 0.12, bow: 0.2, head: 0.1, gx: -40, gy: -70, blade: 2.25, fr: -90, fl: 60 }),
    recoil: P({ x: 20, y: 10, s: 1.08, hip: 240, lean: -0.2, bow: -0.1, head: -0.25, hat: -0.15, gx: 24, gy: -206, blade: -0.55, fr: -30, fl: 100 }),
    recoil2: P({ x: 40, y: 6, s: 1.04, hip: 240, lean: -0.16, bow: -0.06, head: -0.18, hat: -0.08, gx: 20, gy: -196, blade: -0.75, fr: -24, fl: 104 }),
    stagger: P({ x: 20, hip: 214, lean: 0.1, bow: 0.34, head: 0.32, hat: 0.1, gx: -64, gy: -6, blade: 1.9, lh: 1, lx: 40, ly: -40, fr: -56, fl: 64 }),
    stagger2: P({ x: 22, hip: 206, lean: 0.12, bow: 0.4, head: 0.38, hat: 0.12, gx: -66, gy: 0, blade: 1.85, lh: 1, lx: 42, ly: -34, fr: -56, fl: 64 }),
    cut: P({ x: 22, hip: 232, lean: 0.02, bow: -0.12, head: -0.2, hat: -0.05, gx: -62, gy: -10, blade: 1.75, lh: 1, lx: 50, ly: -60, fr: -56, fl: 64 }),
    kneel: P({ kn: 1, x: 24, hip: 150, lean: 0.08, bow: 0.5, head: 0.5, hat: 0.1, gx: -60, gy: 10, blade: 1.75, drop: 1, lh: 1, lx: 50, ly: 20, fr: -80, fl: 60 }),
    kneel2: P({ kn: 1, x: 26, hip: 140, lean: 0.1, bow: 0.62, head: 0.55, hat: 0.1, gx: -56, gy: 16, blade: 1.75, drop: 1, lh: 1, lx: 48, ly: 28, fr: -80, fl: 60 }),
    fall: P({ kn: 1, x: 50, hip: 118, lean: 0.3, bow: 1.0, head: 0.6, hat: 0.1, gx: 0, gy: 40, blade: 1.75, drop: 1, lh: 1, lx: 80, ly: 30, fr: -40, fl: 90 }),
  };

  function buildKeys(T) {
    const [h0, h1, h2, h3] = T.hits;
    const K = [
      [T.foeIn - 0.1, 'walk1', 'lin'], [T.foeIn + 0.18, 'walk2', 'io'], [T.foeIn + 0.4, 'walk3', 'io'],
      [T.foeIn + 0.6, 'stand', 'io'], [T.foeIn + 0.73, 'ready', 'io'], [T.foeIn + 0.85, 'ready2', 'o'],
      [T.foeIn + 0.92, 'drawn', 'snap'], [T.foeIn + 1.01, 'drawn2', 'o'], [T.foeIn + 1.21, 'guard', 'back'],
    ];
    const hit = (at, a, b, back) => K.push([at - 0.02, 'guard', 'lin'], [at + 0.03, a, 'snap'], [at + 0.1, b, 'o'], [at + back, 'guard', 'io']);
    hit(h0, 'hitA', 'hitA2', 0.5);
    hit(h1, 'hitB', 'hitB2', 0.5);
    K.push(
      [T.warn, 'guard', 'lin'], [T.warn + 0.38, 'windup', 'io'], [T.hurt - 0.07, 'windup2', 'o'],
      [T.hurt - 0.01, 'lunge', 'snap'], [T.hurt + 0.12, 'follow', 'o'],
      [T.parry - 0.32, 'guardB', 'io'], [T.parry - 0.12, 'raise', 'io'], [T.parry - 0.01, 'strike', 'snap'],
      [T.parry + 0.04, 'recoil', 'snap'], [T.parry + 0.24, 'recoil2', 'o'], [T.parry + 0.65, 'guard', 'io'],
    );
    hit(h2, 'hitA', 'hitA2', 0.42);
    K.push(
      [h3 - 0.02, 'guard', 'lin'], [h3 + 0.04, 'stagger', 'snap'], [T.blow - 0.03, 'stagger2', 'o'],
      [T.blow + 0.06, 'cut', 'snap'], [T.blow + 0.41, 'cut', 'lin'], [T.blow + 0.67, 'kneel', 'io'],
      [T.blow + 1.0, 'kneel2', 'o'], [T.blow + 1.65, 'fall', 'io'],
    );
    return K;
  }

  const ARM = [70, 66], LEG = [128, 122], BLADE = 200, TSUKA = 58;

  function ik(a, c, l1, l2, pref) {
    let d = sub(c, a), dist = vlen(d);
    const reach = l1 + l2 - 0.5;
    if (dist > reach) { c = mad(a, d, reach / dist); d = sub(c, a); dist = reach; }
    dist = Math.max(dist, Math.abs(l1 - l2) + 0.5);
    const base = Math.atan2(d[1], d[0]);
    const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))));
    const m1 = mad(a, ang(base + A), l1), m2 = mad(a, ang(base - A), l1);
    const s1 = (m1[0] - a[0]) * pref[0] + (m1[1] - a[1]) * pref[1];
    const s2 = (m2[0] - a[0]) * pref[0] + (m2[1] - a[1]) * pref[1];
    return [s1 >= s2 ? m1 : m2, c];
  }

  function derive(p) {
    const k = p.s, ox = p.x, oy = p.y;
    const W = (q) => [ox + q[0] * k, oy + q[1] * k];
    const hip = [0, -p.hip];
    const up = [Math.sin(p.lean), -Math.cos(p.lean)];
    const across = [Math.cos(p.lean), Math.sin(p.lean)];
    const down = [-up[0], -up[1]];
    const spine = 150 * Math.cos(p.bow * 1.15);
    const chest = mad(hip, up, spine);
    const shR = mad(mad(chest, across, -54), down, 6);
    const shL = mad(mad(chest, across, 52), down, 7);
    const neck = mad(chest, up, 14);
    const hu = [Math.sin(p.lean + p.head), -Math.cos(p.lean + p.head)];
    const headC = mad(neck, hu, 30 - 22 * Math.max(0, p.bow));
    const waist = mad(hip, up, 18);
    const bd = ang(p.blade);
    const [elR, handR] = ik(shR, [p.gx, -p.hip + p.gy], ARM[0], ARM[1], [-0.8, 0.6]);
    const gripL = mad(handR, bd, -48);
    const freeL = [p.lx, -p.hip + p.ly];
    const [elL, handL] = ik(shL, lerp2(gripL, freeL, p.lh), ARM[0], ARM[1], [0.8, 0.6]);
    const hipR = mad(hip, across, -22), hipL = mad(hip, across, 22);
    let [knR, ftR] = ik(hipR, [p.fr, -p.rl], LEG[0], LEG[1], [-0.9, -0.2]);
    let [knL, ftL] = ik(hipL, [p.fl, -p.ll], LEG[0], LEG[1], [0.9, -0.2]);
    if (p.kn > 0) {
      knR = lerp2(knR, mad(hipR, [-26, 62], 1), p.kn);
      ftR = lerp2(ftR, [knR[0] - 8, 0], p.kn);
      knL = lerp2(knL, [p.fl, -8], p.kn);
      ftL = lerp2(ftL, [p.fl + 10, -2], p.kn);
    }
    const sDir = rot(across, 0.5);
    const mouth = mad(mad(hip, across, 30), up, 14);
    const sayaEnd = mad(mouth, sDir, 196);
    const sheathTsuba = mad(mouth, sDir, -4), sheathAng = Math.atan2(sDir[1], sDir[0]);
    const handTsuba = mad(handR, bd, 7);
    let tsuba = lerp2(sheathTsuba, handTsuba, p.draw);
    let bAng = p.blade;
    let tsukaAng = mix(sheathAng + Math.PI, p.blade + Math.PI, p.draw);
    let bLen = BLADE * p.draw;
    if (p.drop > 0) {
      const e = EASE.o(p.drop), groundT = [-150, -4], groundA = Math.PI - 0.06;
      tsuba = lerp2(tsuba, groundT, p.drop);
      tsuba[1] -= 36 * Math.sin(Math.PI * Math.min(1, p.drop * 1.1)) * (1 - p.drop);
      bAng = mix(p.blade, groundA, e);
      tsukaAng = bAng + Math.PI;
    }
    const tip = mad(tsuba, ang(bAng), bLen);
    const kashira = mad(tsuba, ang(tsukaAng), TSUKA + 7);
    const J = {
      s: k, p, up, across, hip: W(hip), chest: W(chest), shR: W(shR), shL: W(shL), neck: W(neck),
      headC: W(headC), hu, waist: W(waist), elR: W(elR), handR: W(handR), elL: W(elL), handL: W(handL),
      hipR: W(hipR), hipL: W(hipL), knR: W(knR), knL: W(knL), ftR: W(ftR), ftL: W(ftL),
      mouth: W(mouth), sayaEnd: W(sayaEnd), sDir, tsuba: W(tsuba), tip: W(tip), kashira: W(kashira),
      bAng, bLen: bLen * k, drawn: p.draw > 0.02,
    };
    return J;
  }

  const HDT = 1 / 40, HN = 24;
  const kernels = {};
  function kernel(f, z, delay) {
    const key = f + '|' + z + '|' + delay;
    if (kernels[key]) return kernels[key];
    const w = TAU * f, wd = w * Math.sqrt(1 - z * z), out = new Float64Array(HN + 1);
    let sum = 0;
    for (let k = 0; k <= HN; k++) {
      const tau = k * HDT - delay;
      const g = tau <= 0 ? 0 : Math.exp(-z * w * tau) * Math.sin(wd * tau);
      out[k] = g; sum += g;
    }
    for (let k = 0; k <= HN; k++) out[k] /= sum;
    return (kernels[key] = out);
  }
  function lag(H, name, kern, gain, cap) {
    let x = 0, y = 0;
    for (let k = 0; k <= HN; k++) { const q = H[k][name]; x += kern[k] * q[0]; y += kern[k] * q[1]; }
    const now = H[0][name];
    let d = [(x - now[0]) * gain, (y - now[1]) * gain];
    const l = vlen(d);
    if (cap && l > cap) d = [d[0] * cap / l, d[1] * cap / l];
    return d;
  }

  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function setA(el, name, v) {
    const c = el.__a || (el.__a = {});
    if (c[name] === v) return;
    c[name] = v;
    el.setAttribute(name, v);
  }
  const T10 = (v) => Math.round(v * 10);
  const pt = (q) => T10(q[0]) + ',' + T10(q[1]);
  function drop(x, y, r, st, a) {
    const ex = Math.cos(a) * r * st, ey = Math.sin(a) * r * st, deg = Math.round((a * 180) / Math.PI);
    const A = `A${T10(r * st)},${T10(r)} ${deg} 1 0 `;
    return `M${T10(x + ex)},${T10(y + ey)}${A}${T10(x - ex)},${T10(y - ey)}${A}${T10(x + ex)},${T10(y + ey)}Z`;
  }
  function closed(pts) {
    const n = pts.length;
    let d = 'M' + pt(pts[0]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += 'C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' ' +
        pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + pt(p2);
    }
    return d + 'Z';
  }
  function grow(pts, e) {
    let cx = 0, cy = 0;
    for (const q of pts) { cx += q[0]; cy += q[1]; }
    cx /= pts.length; cy /= pts.length;
    return pts.map((q) => { const d = unit([q[0] - cx, q[1] - cy]); return [q[0] + d[0] * e, q[1] + d[1] * e]; });
  }

  function Wash(g, fill, alpha, edge) {
    const e = edge ? s('path', { fill, 'fill-opacity': f2(alpha * 0.3) }, g) : null;
    const b = s('path', { fill, 'fill-opacity': alpha }, g);
    return {
      set(pts) {
        if (!pts) { setA(b, 'd', ''); if (e) setA(e, 'd', ''); return; }
        setA(b, 'd', closed(pts));
        if (e) setA(e, 'd', closed(grow(pts, edge)));
      },
    };
  }
  function Stroke(g, color, alpha, base, grad) {
    const fill = grad ? grad.url : color;
    const bl = base.bleed ? s('path', { fill: color, 'fill-opacity': f2(alpha * 0.14) }, g) : null;
    const core = s('path', { fill, 'fill-opacity': alpha }, g);
    const fing = s('path', { fill, 'fill-opacity': f2(alpha * 0.9) }, g);
    return {
      set(ctrl, w, extra) {
        if (!ctrl || w <= 0.3) { setA(core, 'd', ''); setA(fing, 'd', ''); if (bl) setA(bl, 'd', ''); return; }
        const st = Brush.stroke(ctrl, w, extra ? Object.assign({}, base, extra) : base);
        setA(core, 'd', st.core);
        setA(fing, 'd', st.fingers.join(''));
        if (bl) setA(bl, 'd', st.bleed);
        if (grad) {
          const a = ctrl[0], b = ctrl[ctrl.length - 1];
          setA(grad.el, 'x1', T10(a[0])); setA(grad.el, 'y1', T10(a[1]));
          setA(grad.el, 'x2', T10(b[0])); setA(grad.el, 'y2', T10(b[1]));
        }
      },
      alpha(a) {
        setA(core, 'fill-opacity', String(f2(alpha * a)));
        setA(fing, 'fill-opacity', String(f2(alpha * 0.9 * a)));
      },
    };
  }

  const C = {
    deep: '#0b0806', dark: '#16110d', cloth: '#6b5e4d', kimono0: '#857761', kimono1: '#4d4135', hat: '#5b4b3a',
    pale: '#cdbd9e', rim: '#ecb468', steel: '#2c2723',
  };
  let instances = 0;

  function create(parent, T) {
    const KEYS = buildKeys(T);
    const gid = 'foe' + (instances++);
    const defs = s('defs', {}, parent);
    const gHat = s('linearGradient', { id: gid + 'k', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    s('stop', { offset: 0, 'stop-color': '#7d6a52' }, gHat);
    s('stop', { offset: 0.55, 'stop-color': C.hat }, gHat);
    s('stop', { offset: 1, 'stop-color': '#2a2219' }, gHat);
    const gShadow = s('radialGradient', { id: gid + 'g', cx: 0.5, cy: 0.5, r: 0.5 }, defs);
    s('stop', { offset: 0, 'stop-color': '#120c07', 'stop-opacity': 0.5 }, gShadow);
    s('stop', { offset: 0.6, 'stop-color': '#120c07', 'stop-opacity': 0.2 }, gShadow);
    s('stop', { offset: 1, 'stop-color': '#120c07', 'stop-opacity': 0 }, gShadow);

    let gradN = 0;
    const SG = (c0, c1, mid) => {
      const el = s('linearGradient', { id: gid + 'sg' + (++gradN), gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      s('stop', { offset: 0, 'stop-color': c0 }, el);
      if (mid) s('stop', { offset: mid[0], 'stop-color': mid[1] }, el);
      s('stop', { offset: 1, 'stop-color': c1 }, el);
      return { el, url: `url(#${gid}sg${gradN})` };
    };

    const root = s('g', {}, parent);
    const body = s('g', {}, root);
    const shadowG = s('g', {}, body);
    const fig = s('g', { transform: 'scale(0.1)' }, body);
    let seed = 500;
    const ST = (o) => {
      const r = Object.assign({ seed: seed += 7, bleed: 0, n: 48, fk: 16, q10: true }, o);
      r.n = Math.max(10, Math.round(r.n * 0.55)); r.fk = Math.max(6, Math.round(r.fk * 0.6));
      if (!o.keepBleed) r.bleed = 0;
      return r;
    };
    const gLong = s('radialGradient', { id: gid + 'ls', cx: 0.5, cy: 0.5, r: 0.5 }, defs);
    s('stop', { offset: 0, 'stop-color': '#120c07', 'stop-opacity': 0.42 }, gLong);
    s('stop', { offset: 0.55, 'stop-color': '#120c07', 'stop-opacity': 0.16 }, gLong);
    s('stop', { offset: 1, 'stop-color': '#120c07', 'stop-opacity': 0 }, gLong);
    const longShadow = s('rect', { fill: `url(#${gid}ls)`, x: -210, y: -70, width: 420, height: 250 }, shadowG);
    const shadow = s('rect', { fill: `url(#${gid}g)`, x: -150, y: -24, width: 300, height: 48 }, shadowG);
    const hair = [0, 1, 2].map((i) => Stroke(fig, C.deep, i ? 0.85 : 1, ST({ tail: 'dry', split: i ? 0.3 : 0.38, fingers: i ? 3 : 7, hairs: i ? 1 : 3, press: 0.15, thin: 0.25, grain: 0.5 }), SG(C.deep, '#3a3027')));
    const saya = Stroke(fig, C.deep, 1, ST({ tail: 'stop', press: 0.05, thin: 0, wobble: 0.02, grain: 0.3, n: 40 }));
    const sageo = Stroke(fig, C.deep, 0.9, ST({ tail: 'dry', split: 0.5, fingers: 2, hairs: 1, press: 0, n: 30, fk: 10 }));
    const leg = () => ({
      body: Stroke(fig, C.dark, 1, ST({ tail: 'dry', split: 0.84, fingers: 6, hairs: 2, press: 0.04, entry: 0.03, thin: -0.85, oblique: 0.1, grain: 1.3, wobble: 0.06, bleed: 2.2, keepBleed: true, n: 64, fk: 22 }), SG('#0e0a07', '#4a3d30', [0.55, '#1c1610'])),
      pleatA: Stroke(fig, C.deep, 0.9, ST({ tail: 'dry', split: 0.55, fingers: 3, hairs: 1, press: 0.25, thin: 0.35, n: 44, fk: 14 })),
      pleatB: Stroke(fig, C.deep, 0.75, ST({ tail: 'dry', split: 0.5, fingers: 2, hairs: 1, press: 0.2, thin: 0.4, n: 44, fk: 14 })),
      rim: Stroke(fig, C.rim, 0.6, ST({ tail: 'sweep', taperFrom: 0.15, press: 0, thin: 0.5, grain: 0.3, n: 30, fk: 10 })),
    });
    const legB = leg();
    const panel = Stroke(fig, C.dark, 1, ST({ tail: 'dry', split: 0.6, fingers: 5, hairs: 1, press: 0.05, entry: 0.04, thin: 0.2, grain: 1.0, n: 40, fk: 14 }), SG('#0e0a07', '#1c1610'))
    const legF = leg();
    const torso = Stroke(fig, C.cloth, 1, ST({ tail: 'stop', press: 0.06, entry: 0.12, thin: -0.12, oblique: 0.25, grain: 1.1, wobble: 0.05, bleed: 2, n: 40, fk: 14 }), SG(C.kimono0, C.kimono1));
    const torsoShade = Stroke(fig, C.deep, 0.3, ST({ tail: 'dry', split: 0.6, fingers: 3, hairs: 1, press: 0.1, thin: 0.3, n: 36, fk: 12 }));
    const drape = [0, 1, 2].map(() => Stroke(fig, '#3a3027', 0.32, ST({ tail: 'dry', split: 0.3, fingers: 6, hairs: 1, press: 0.1, entry: 0.05, thin: 0.3, grain: 1.2, n: 36, fk: 12 })));
    const sides = [0, 1].map(() => Stroke(fig, C.deep, 1, ST({ tail: 'dry', split: 0.62, fingers: 3, hairs: 1, press: 0.32, entry: 0.06, thin: 0.35, oblique: 0.4, n: 40, fk: 14 })));
    const collarPale = [0, 1].map(() => Stroke(fig, C.pale, 0.95, ST({ tail: 'sweep', taperFrom: 0.55, press: 0.1, thin: 0.2, grain: 0.2, n: 30, fk: 10 })));
    const collar = [0, 1].map(() => Stroke(fig, C.deep, 1, ST({ tail: 'sweep', taperFrom: 0.6, press: 0.3, entry: 0.08, thin: 0.15, n: 32, fk: 12 })));
    const folds = [0, 1].map(() => Stroke(fig, C.deep, 0.7, ST({ tail: 'sweep', taperFrom: 0.3, press: 0.25, entry: 0.1, thin: 0.5, n: 24, fk: 8 })));
    const obi = Stroke(fig, C.deep, 1, ST({ tail: 'stop', press: 0.1, entry: 0.1, thin: 0, grain: 0.6, n: 30, fk: 10 }));
    const obiPale = Stroke(fig, C.pale, 0.35, ST({ tail: 'sweep', taperFrom: 0.3, press: 0, entry: 0.2, thin: 0.2, grain: 0.3, n: 30, fk: 10 }));
    const shoulderRim = Stroke(fig, C.rim, 0.75, ST({ tail: 'sweep', taperFrom: 0.25, press: 0, thin: 0.3, grain: 0.3, n: 40, fk: 12 }));
    const gSleeve = s('linearGradient', { id: gid + 'sl', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    s('stop', { offset: 0, 'stop-color': C.kimono0 }, gSleeve);
    s('stop', { offset: 1, 'stop-color': C.kimono1 }, gSleeve);
    const sleeve = () => ({
      hang: Wash(fig, `url(#${gid}sl)`, 1, 2),
      arm: Stroke(fig, C.cloth, 1, ST({ tail: 'sweep', taperFrom: 0.72, press: 0.1, entry: 0.06, thin: 0.15, oblique: 0.5, grain: 0.9, bleed: 1.6, n: 40, fk: 14 }), SG(C.kimono0, C.kimono1)),
      top: Stroke(fig, C.deep, 1, ST({ tail: 'sweep', taperFrom: 0.6, press: 0.3, entry: 0.06, thin: 0.3, oblique: 0.4, n: 40, fk: 14 })),
      side: Stroke(fig, C.deep, 0.95, ST({ tail: 'dry', split: 0.55, fingers: 3, hairs: 1, press: 0.25, entry: 0.06, thin: 0.3, n: 30, fk: 10 })),
      hem: Stroke(fig, C.deep, 1, ST({ tail: 'dry', split: 0.5, fingers: 4, hairs: 1, press: 0.3, entry: 0.06, thin: 0.25, n: 30, fk: 10 })),
      hand: Stroke(fig, C.dark, 1, ST({ tail: 'stop', press: 0.2, entry: 0.2, thin: 0, n: 16, fk: 6 })),
    });
    const slvB = sleeve(), slvF = sleeve();
    const face = Wash(fig, C.deep, 1, 1.5);
    const jaw = Stroke(fig, '#3a3027', 0.9, ST({ tail: 'sweep', taperFrom: 0.4, press: 0.1, n: 24, fk: 8 }));
    const bun = Stroke(fig, C.deep, 1, ST({ tail: 'dry', split: 0.5, fingers: 7, hairs: 4, press: 0.2, thin: 0.2, n: 30, fk: 10 }));
    const hatPart = () => {
      const g = s('g', {}, fig);
      return {
        cone: Wash(g, `url(#${gid}k)`, 1, 1.5),
        straw: [0, 1, 2].map(() => Stroke(g, '#1e1813', 0.5, ST({ tail: 'sweep', taperFrom: 0.2, press: 0, thin: 0.6, grain: 0.2, n: 24, fk: 8 }))),
        brim: Stroke(g, C.deep, 1, ST({ tail: 'sweep', taperFrom: 0.66, press: 0.35, entry: 0.1, thin: 0.12, oblique: 0.5, bleed: 1.6, n: 64, fk: 22 })),
        rim: Stroke(g, C.rim, 0.85, ST({ tail: 'sweep', taperFrom: 0.3, press: 0, thin: 0.3, grain: 0.2, n: 30, fk: 10 })),
      };
    };
    const hatL = hatPart();
    const cords = [0, 1].map(() => Stroke(fig, C.deep, 0.9, ST({ tail: 'sweep', taperFrom: 0.3, press: 0, thin: 0.4, grain: 0.15, n: 24, fk: 8 })));
    const tsuka = Stroke(fig, C.deep, 1, ST({ tail: 'stop', press: 0.05, thin: 0, wobble: 0.02, n: 20, fk: 8 }));
    const tsubaW = Wash(fig, C.deep, 1, 0);
    const blade = Wash(fig, C.steel, 1, 0);
    const edge = s('path', { fill: 'none', stroke: '#f6ecd6', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-opacity': 0.85 }, fig);
    const fxg = s('g', { transform: 'scale(0.1)' }, root);
    const gSmear = s('linearGradient', { id: gid + 'sm', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    s('stop', { offset: 0, 'stop-color': C.deep, 'stop-opacity': 0.5 }, gSmear);
    s('stop', { offset: 0.55, 'stop-color': C.deep, 'stop-opacity': 0.2 }, gSmear);
    s('stop', { offset: 1, 'stop-color': C.deep, 'stop-opacity': 0 }, gSmear);
    const smearSheet = s('path', { fill: `url(#${gid}sm)` }, fxg);
    const streaks = [1, 0.86, 0.7, 0.52].map((r, i) => ({ r, st: Stroke(fxg, C.deep, 0.9 - i * 0.12, ST({ tail: 'dry', split: 0.22, fingers: 4, hairs: 2, press: 0.25, entry: 0.02, thin: 0.6, grain: 0.8, n: 36, fk: 12 })) }));
    const trails = [0, 1, 2, 3, 4, 5].map(() => Stroke(fxg, C.deep, 0.6, ST({ tail: 'dry', split: 0.2, fingers: 4, hairs: 2, press: 0.1, entry: 0.02, thin: 0.6, n: 30, fk: 10 })));
    const spray = s('path', { fill: C.deep }, fxg);
    const flakes = s('path', { fill: C.deep, 'fill-opacity': 0.82 }, fxg);

    const sprays = T.hits.map((at, i) => {
      const R = Brush.rng(700 + i);
      const drops = [];
      for (let k = 0; k < 22; k++) {
        const a = (i % 2 ? Math.PI + 0.35 : -0.35) + (R() - 0.5) * 1.3, v = 260 + R() * 520;
        drops.push([(R() - 0.5) * 60, (R() - 0.5) * 50, Math.cos(a) * v, Math.sin(a) * v - 120, 1.2 + Math.pow(R(), 3) * 5.5, R()]);
      }
      return { at, drops, J: null };
    });
    const DZ = [T.blow + 1.0, T.blow + 1.95];
    const DZ_SOFT = 160, DZ_PALE = 0.55, DZ_DIR = [Math.cos(-0.2), Math.sin(-0.2)];
    const dzMask = s('mask', { id: gid + 'dz', maskUnits: 'userSpaceOnUse', x: -3000, y: -3000, width: 6000, height: 6000 }, defs);
    const dzGrad = s('linearGradient', { id: gid + 'dzg', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    s('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, dzGrad);
    const dzStop = s('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 1 }, dzGrad);
    s('rect', { x: -3000, y: -3000, width: 6000, height: 6000, fill: `url(#${gid}dzg)` }, dzMask);
    let dzBox = null;
    const dissolveBox = () => {
      if (dzBox) return dzBox;
      const Jd = derive(poseAt(DZ[0]));
      const pts = [Jd.headC, Jd.shR, Jd.shL, Jd.elR, Jd.elL, Jd.chest, Jd.hip, Jd.knR, Jd.knL, Jd.ftR, Jd.ftL];
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 70, y0 = Math.min(...ys) - 140, y1 = Math.max(...ys) + 60;
      const ym = (y0 + y1) / 2, proj = (q) => q[0] * DZ_DIR[0] + (q[1] - ym) * DZ_DIR[1];
      const ps = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(proj);
      const p0 = Math.min(...ps) - 40, p1 = Math.max(...ps) + 40 + DZ_SOFT;
      const front = (k) => p0 + (p1 - p0) * EASE.io(k);
      const R = Brush.rng(931);
      const motes = [];
      for (let i = 0; i < 120; i++) {
        const a = pts[Math.floor(R() * pts.length)], b = pts[Math.floor(R() * pts.length)], u = R();
        const hx = a[0] + (b[0] - a[0]) * u + (R() - 0.5) * 30, hy = a[1] + (b[1] - a[1]) * u + (R() - 0.5) * 30;
        let lo = 0, hi = 1;
        for (let n = 0; n < 24; n++) { const m = (lo + hi) / 2; if (front(m) - DZ_SOFT * 0.5 < proj([hx, hy])) lo = m; else hi = m; }
        const streak = i % 3 !== 0;
        motes.push([hx, hy, DZ[0] + lo * (DZ[1] - DZ[0]), streak ? 0.6 + R() * 1.2 : 1 + Math.pow(R(), 2) * 2.2, R(), R(), streak]);
      }
      return (dzBox = { x0, x1, ym, front, motes });
    };
    function dissolve(t) {
      const k = lin(t, DZ[0], DZ[1]);
      if (k <= 0) return null;
      return { x: dissolveBox().front(k), k };
    }
    const smearWins = [[T.foeIn + 0.8, T.foeIn + 1.1], [T.hurt - 0.09, T.hurt + 0.22], [T.parry - 0.2, T.parry + 0.32]];
    const hatCut = T.blow + 0.43;

    function poseAt(t) {
      let i = 0;
      if (t <= KEYS[0][0]) return Object.assign({}, POSE[KEYS[0][1]]);
      while (i < KEYS.length - 1 && t >= KEYS[i + 1][0]) i++;
      if (i >= KEYS.length - 1) return Object.assign({}, POSE[KEYS[KEYS.length - 1][1]]);
      const [a0, n0] = KEYS[i], [a1, n1, e] = KEYS[i + 1];
      const k = EASE[e](lin(t, a0, a1));
      const A = POSE[n0], B = POSE[n1], out = {};
      for (const f of FIELDS) out[f] = A[f] + (B[f] - A[f]) * k;
      const db = ((((B.blade - A.blade) % TAU) + 3 * Math.PI) % TAU) - Math.PI;
      out.blade = A.blade + db * k;
      const br = Math.sin((TAU * 6 * t) / 20);
      const duel = lin(t, 3.7, 4.0) * (1 - lin(t, T.hits[3], T.hits[3] + 0.2));
      out.hip += 1.6 * br * (1 - out.drop);
      out.head += 0.015 * br;
      out.x += 12 * Math.sin((TAU * 2 * t) / 20 + 0.4) * duel;
      out.blade += 0.03 * Math.sin((TAU * 7 * t) / 20) * duel;
      const shake = lin(t, T.warn + 0.25, T.warn + 0.4) * (1 - lin(t, T.hurt - 0.06, T.hurt - 0.03));
      out.blade += 0.025 * Math.sin(t * 71) * shake;
      out.gx += 1.5 * Math.sin(t * 83) * shake;
      return out;
    }

    function hatPts(J) {
      const bow = Math.max(0, J.p.bow), R = 100, ry = 8 + 24 * bow, apexY = -46 + 36 * bow;
      const front = [];
      for (let i = 0; i <= 10; i++) {
        const u = -1 + i / 5;
        front.push([u * R, ry * (1 - u * u) + 3]);
      }
      const apex = [3, apexY];
      return { body: [...front, [R * 0.66, -9], [R * 0.32, apexY * 0.62], apex, [-R * 0.3, apexY * 0.64], [-R * 0.66, -10]], front, apex };
    }
    function render(t, env) {
      env = env || {};
      const gust = env.gust || (() => 0);
      const H = [];
      for (let k = 0; k <= HN; k++) H.push(derive(poseAt(t - k * HDT)));
      const J = H[0], sc = J.s, p = J.p;
      const wind = 5 + 16 * gust(t, 0.42);
      const flut = (ph, fr) => Math.sin(t * fr + ph);
      const A = J.across, U = J.up, D = [-U[0], -U[1]];
      const bare = t >= hatCut;

      const fm = lerp2(J.ftR, J.ftL, 0.5), gy = Math.max(J.ftR[1], J.ftL[1]);
      setA(longShadow, 'transform', `translate(${f1(fm[0] + (J.chest[0] - fm[0]) * 0.4 + 24 * sc)} ${f1(gy)}) scale(${f5(sc * (0.9 + Math.abs(J.ftL[0] - J.ftR[0]) / 400))} ${f5(sc)})`);
      setA(shadow, 'transform', `translate(${f1(fm[0])} ${f1(Math.max(J.ftR[1], J.ftL[1]) + 2)}) scale(${f5(sc * (1 + Math.abs(J.ftL[0] - J.ftR[0]) / 300))} ${f5(sc)})`);

      {
        const back = mad(mad(J.headC, A, 12 * sc), D, 8 * sc);
        hair.forEach((st, k) => {
          const c = [mad(back, A, k * 3 * sc)];
          let q = c[0];
          const n = k ? 6 : 7;
          for (let i = 1; i <= n; i++) {
            const lg = lag(H, 'headC', kernel(1.7, 0.32, i * 0.03), 0.9, 160);
            const a = Math.PI / 2 - 0.35 - 0.1 * k - (0.34 + 0.028 * wind) * (i / n) - 0.12 * flut(i * 0.9 + k * 1.7, 9 + k) * (i / n);
            q = mad(q, ang(a), (k ? 19 : 22) * sc);
            c.push(add(q, [lg[0] * (i / n) * 0.7, lg[1] * (i / n) * 0.45]));
          }
          st.set(c, (k ? 6 : 17) * sc);
        });
      }

      saya.set([J.mouth, lerp2(J.mouth, J.sayaEnd, 0.5), J.sayaEnd], 9 * sc);
      {
        const lg = lag(H, 'mouth', kernel(2.4, 0.3, 0.04), 1, 90);
        let q = mad(J.mouth, J.sDir, 10 * sc);
        const c = [q];
        for (let i = 1; i <= 4; i++) {
          const a = Math.PI / 2 - (0.15 + 0.03 * wind) * i / 4 - 0.12 * flut(i, 11);
          q = mad(q, ang(a), 15 * sc);
          c.push(add(q, [lg[0] * i / 4, lg[1] * i / 4]));
        }
        sageo.set(c, 4 * sc);
      }

      const legPath = (R) => {
        const ft = R ? J.ftR : J.ftL, kn = R ? J.knR : J.knL, o = R ? -1 : 1;
        const lg = lag(H, R ? 'knR' : 'knL', kernel(2.6, 0.38, 0.02), 1.0, 80);
        const top = mad(mad(J.waist, A, o * 20 * sc), U, 4 * sc);
        const knee = mad(kn, A, o * 8 * sc);
        const hem = add(mad(ft, [o, 0], 14 * sc), [lg[0] * 0.9 + wind * 0.6 + 2.5 * flut(o, 13), lg[1] * 0.3 + 4 * sc]);
        const mid = lerp2(knee, hem, 0.45);
        return { c: [top, lerp2(top, knee, 0.55), knee, add(mid, [lg[0] * 0.35, 0]), hem], o, top, knee, hem };
      };
      const LR = legPath(true), LL = legPath(false);
      const rFront = J.ftR[1] >= J.ftL[1] - 2;
      const paintLeg = (L, Q, front) => {
        Q.body.set(L.c, 52 * sc);
        const pl = (u, v) => L.c.map((q, i) => mad(q, A, L.o * sc * mix(u, v, i / (L.c.length - 1))));
        Q.pleatA.set(pl(-10, -26), 4.5 * sc);
        Q.pleatB.set(front ? pl(12, 30) : null, 3.5 * sc);
        Q.rim.set([mad(L.c[0], A, L.o * 27 * sc), mad(L.c[1], A, L.o * 33 * sc), mad(L.c[2], A, L.o * 40 * sc)], 2.4 * sc);
      };
      paintLeg(rFront ? LL : LR, legB, false);
      const knees = lerp2(J.knR, J.knL, 0.5);
      const spread = clamp01((vlen(sub(J.knR, J.knL)) / sc - 110) / 120);
      const crotch = lerp2(J.waist, knees, 0.7 - 0.3 * spread);
      panel.set([mad(J.waist, U, 4 * sc), lerp2(J.waist, crotch, 0.5), crotch], (60 + 40 * spread) * sc);
      paintLeg(rFront ? LR : LL, legF, true);

      const neckR = mad(J.neck, A, -12 * sc), neckL = mad(J.neck, A, 12 * sc);
      torso.set([mad(J.neck, D, 8 * sc), lerp2(J.chest, J.waist, 0.4), mad(J.waist, U, 24 * sc)], 84 * sc);
      torsoShade.set([mad(J.shL, D, 20 * sc), mad(lerp2(J.shL, mad(J.waist, A, 40 * sc), 0.5), A, -6 * sc), mad(J.waist, A, 34 * sc)], 18 * sc);
      drape[0].set([mad(mad(J.shL, D, 10 * sc), A, -12 * sc), mad(lerp2(J.chest, J.waist, 0.45), A, 8 * sc), mad(mad(J.waist, U, 14 * sc), A, -14 * sc)], 26 * sc);
      drape[1].set([mad(mad(J.shR, D, 22 * sc), A, 14 * sc), mad(lerp2(J.chest, J.waist, 0.6), A, -18 * sc), mad(mad(J.waist, U, 12 * sc), A, -30 * sc)], 18 * sc);
      drape[2].set([mad(mad(J.chest, D, 40 * sc), A, 28 * sc), mad(mad(J.waist, U, 14 * sc), A, 30 * sc)], 14 * sc);
      sides[0].set([mad(mad(J.shR, D, 30 * sc), A, 8 * sc), mad(lerp2(J.shR, J.waist, 0.55), A, -2 * sc), mad(J.waist, A, -40 * sc)], 6 * sc);
      sides[1].set([mad(mad(J.shL, D, 30 * sc), A, -8 * sc), mad(lerp2(J.shL, J.waist, 0.55), A, 4 * sc), mad(J.waist, A, 40 * sc)], 5.5 * sc);
      const cross = mad(mad(J.chest, D, 26 * sc), A, -6 * sc);
      const low = mad(J.waist, U, 10 * sc);
      collarPale[0].set([mad(neckL, A, -4 * sc), lerp2(neckL, cross, 0.5), mad(cross, A, -3 * sc)], 4.5 * sc);
      collarPale[1].set([mad(neckR, A, 4 * sc), lerp2(neckR, cross, 0.5), mad(cross, A, 2 * sc)], 4.5 * sc);
      collar[0].set([neckL, lerp2(neckL, cross, 0.5), cross, mad(lerp2(cross, low, 0.6), A, -14 * sc)], 10 * sc);
      collar[1].set([neckR, lerp2(neckR, cross, 0.55), mad(cross, A, -3 * sc)], 9 * sc);
      folds[0].set([mad(mad(cross, D, 14 * sc), A, 10 * sc), mad(mad(cross, D, 36 * sc), A, 18 * sc), mad(mad(J.waist, U, 14 * sc), A, 22 * sc)], 3.2 * sc);
      folds[1].set([mad(mad(cross, D, 24 * sc), A, -20 * sc), mad(mad(J.waist, U, 16 * sc), A, -26 * sc)], 2.6 * sc);
      obi.set([mad(J.waist, A, -46 * sc), J.waist, mad(J.waist, A, 46 * sc)], 17 * sc);
      obiPale.set([mad(mad(J.waist, A, -40 * sc), U, 9 * sc), mad(J.waist, U, 10 * sc), mad(mad(J.waist, A, 38 * sc), U, 9 * sc)], 2.2 * sc);
      shoulderRim.set([mad(mad(J.shR, U, 8 * sc), A, -6 * sc), mad(neckR, U, 3 * sc), mad(neckL, U, 3 * sc), mad(mad(J.shL, U, 8 * sc), A, 6 * sc)], 2.6 * sc);

      const paintArm = (Q, sh, el, hand, name, o) => {
        const fa = unit(sub(hand, el)), wrist = mad(hand, fa, -12 * sc);
        const lg = lag(H, name, kernel(2.2, 0.36, 0.03), 1.0, 100);
        const g = unit([lg[0] * 0.012 + wind * 0.01 + 0.04 * flut(o * 2, 10), 1 + lg[1] * 0.006]);
        const hangK = clamp01((0.85 - Math.abs(fa[1])) / 0.4);
        const depth = (24 + 40 * hangK) * sc;
        const e0 = lerp2(el, sh, 0.12), w0 = mad(wrist, fa, 4 * sc);
        const b0 = add(mad(e0, g, depth * 1.08), [lg[0] * 0.5, lg[1] * 0.25]);
        const b1 = add(mad(w0, g, depth), [lg[0] * 0.8, lg[1] * 0.4]);
        Q.hang.set([mad(e0, U, 6 * sc), lerp2(e0, w0, 0.5), w0, mad(lerp2(w0, b1, 0.5), fa, 2 * sc), b1, lerp2(b1, b0, 0.5), b0, lerp2(b0, e0, 0.5)]);
        Q.arm.set([mad(sh, U, 2 * sc), el, wrist], 28 * sc);
        const away = (a, b) => {
          const d = unit(sub(b, a)), n = [-d[1], d[0]], m = sub(lerp2(a, b, 0.5), J.chest);
          return n[0] * m[0] + n[1] * m[1] >= 0 ? n : [-n[0], -n[1]];
        };
        const n1 = away(sh, el), n2 = away(el, wrist), n12 = unit(add(n1, n2));
        Q.top.set([mad(sh, n1, 12 * sc), mad(el, n12, 13 * sc), mad(wrist, n2, 12 * sc)], 6 * sc);
        const outer = (o > 0 ? b0[0] > b1[0] : b0[0] < b1[0]) ? [e0, b0] : [w0, b1];
        Q.side.set(hangK > 0.35 ? [mad(outer[0], g, 10 * sc), lerp2(outer[0], outer[1], 0.55), outer[1]] : null, 5 * sc);
        Q.hem.set(hangK > 0.2 ? (o > 0 ? [b1, lerp2(b1, b0, 0.5), b0] : [b0, lerp2(b0, b1, 0.5), b1]) : null, 7 * sc * Math.min(1, hangK * 2));
        Q.hand.set([mad(hand, fa, -5 * sc), mad(hand, fa, 9 * sc)], 15 * sc);
      };
      paintArm(slvB, J.shL, J.elL, J.handL, 'elL', 1);
      paintArm(slvF, J.shR, J.elR, J.handR, 'elR', -1);

      const hd = J.headC, hu = J.hu, hx = [-hu[1], hu[0]];
      face.set([mad(hd, hx, -16 * sc), mad(mad(hd, hx, -15 * sc), hu, -16 * sc), mad(hd, hu, -26 * sc), mad(mad(hd, hx, 14 * sc), hu, -15 * sc), mad(hd, hx, 16 * sc), mad(hd, hu, 16 * sc)]);
      jaw.set([mad(mad(hd, hx, -13 * sc), hu, -12 * sc), mad(hd, hu, -24 * sc), mad(mad(hd, hx, 11 * sc), hu, -15 * sc)], 3 * sc);
      bun.set(bare ? [mad(hd, hu, 14 * sc), mad(mad(hd, hu, 26 * sc), hx, 4 * sc), mad(mad(hd, hu, 30 * sc), hx, 26 * sc + wind * 0.6)] : null, 22 * sc);

      const paintHat = (Q, tr) => {
        const h = hatPts(J);
        const M = (q) => { const r = rot([q[0], q[1] * tr.f], tr.a); return [tr.x + r[0] * sc * tr.k, tr.y + r[1] * sc * tr.k]; };
        Q.cone.set(h.body.map(M));
        Q.brim.set(h.front.map(M), 11 * sc * tr.k);
        const ap = M(h.apex);
        [-0.55, 0.15, 0.55].forEach((u0, i) => Q.straw[i].set([ap, M([u0 * 60, -18]), M([u0 * 96, -3])], 1.5 * sc * tr.k));
        Q.rim.set([M([-70, -12]), M([-34, -32]), ap], 2.8 * sc * tr.k);
      };
      if (!bare) {
        const hatC = mad(hd, hu, 12 * sc);
        paintHat(hatL, { a: Math.atan2(hu[1], hu[0]) + Math.PI / 2 + p.hat, x: hatC[0], y: hatC[1], k: 1, f: 1 });
      } else {
        const u = t - hatCut, Jc = derive(poseAt(hatCut)), c0 = mad(Jc.headC, Jc.hu, 12 * Jc.s);
        const a0 = Math.atan2(Jc.hu[1], Jc.hu[0]) + Math.PI / 2 + Jc.p.hat;
        paintHat(hatL, {
          a: a0 + 1.6 * u + 0.5 * u * u, x: c0[0] + 380 * u + 300 * u * u, y: c0[1] - 300 * u + 110 * u * u,
          k: 1 - 0.6 * Math.min(1, u / 1.3), f: 0.25 + 0.75 * Math.abs(Math.cos(u * 7.5)),
        });
      }
      {
        const chin = mad(hd, hu, -24 * sc);
        const lg = lag(H, 'headC', kernel(2.8, 0.25, 0.02), 1, 60);
        cords.forEach((cd, i) => {
          if (bare) { cd.set(null); return; }
          const c = [chin];
          let q = chin;
          for (let k = 1; k <= 3; k++) {
            const a = Math.PI / 2 - (0.4 + 0.03 * wind) - i * 0.3 - 0.2 * flut(k + i * 2, 14);
            q = mad(q, ang(a), 13 * sc);
            c.push(add(q, [lg[0] * k / 3, lg[1] * k / 3]));
          }
          cd.set(c, 2.4 * sc);
        });
      }
      const kd = ang(J.bAng), tn = [-kd[1], kd[0]];
      tsuka.set([J.kashira, lerp2(J.kashira, J.tsuba, 0.5), J.tsuba], 7.5 * sc);
      tsubaW.set([mad(J.tsuba, tn, -8 * sc), mad(J.tsuba, kd, 3 * sc), mad(J.tsuba, tn, 8 * sc), mad(J.tsuba, kd, -3 * sc)]);
      if (J.bLen > 4) {
        const b0 = mad(J.tsuba, kd, 3 * sc), b1 = mad(J.tsuba, kd, J.bLen), bm = mad(lerp2(b0, b1, 0.5), tn, -4 * sc);
        blade.set([mad(b0, tn, -2.6 * sc), mad(bm, tn, -2.4 * sc), b1, mad(bm, tn, 2 * sc), mad(b0, tn, 2.6 * sc)]);
        setA(edge, 'd', `M${pt(mad(b0, tn, 1.6 * sc))}Q${pt(mad(bm, tn, 1.2 * sc))} ${pt(b1)}`);
        setA(edge, 'stroke-width', String(Math.round(13 * sc)));
      } else { blade.set(null); setA(edge, 'd', ''); }
      {
        const allow = smearWins.some(([a, b]) => t >= a && t <= b);
        const trailOn = !bare && (allow || T.hits.some((h) => t >= h && t <= h + 0.25));
        const S = [];
        for (let k = 0; k <= 7 && (allow || trailOn); k++) S.push(derive(poseAt(t - k * 0.01)));
        if (!S.length) S.push(J);
        const at = (q, r) => mad(q.tsuba, ang(q.bAng), q.bLen * r);
        let L = 0;
        for (let k = 1; k < S.length; k++) L += vlen(sub(S[k].tip, S[k - 1].tip));
        if (allow && J.drawn && L > 60) {
          const k = Math.min(1, (L - 60) / 200);
          const outer = S.map((q) => at(q, 1)), inner = S.map((q) => at(q, 0.3));
          setA(smearSheet, 'd', 'M' + outer.map(pt).join('L') + 'L' + inner.reverse().map(pt).join('L') + 'Z');
          const m0 = at(S[0], 0.65), m1 = at(S[S.length - 1], 0.65);
          setA(gSmear, 'x1', T10(m0[0])); setA(gSmear, 'y1', T10(m0[1])); setA(gSmear, 'x2', T10(m1[0])); setA(gSmear, 'y2', T10(m1[1]));
          setA(smearSheet, 'fill-opacity', String(f2(k)));
          streaks.forEach(({ r, st }, i) => st.set(S.slice(0, Math.max(3, Math.round(S.length * (1 - i * 0.18)))).map((q) => at(q, r)), (6.5 - i * 1.2) * sc * k));
        } else { setA(smearSheet, 'd', ''); streaks.forEach(({ st }) => st.set(null)); }
        const pts = [
          (q) => mad(q.headC, q.across, -100 * q.s), (q) => mad(q.headC, q.across, 100 * q.s),
          (q) => mad(q.elR, [0, 1], 90 * q.s), (q) => mad(q.elL, [0, 1], 90 * q.s),
          (q) => mad(q.ftR, [1, 0], -40 * q.s), (q) => mad(q.ftL, [1, 0], 40 * q.s),
        ];
        pts.forEach((fn, i) => {
          if (!trailOn) { trails[i].set(null); return; }
          const path = [0, 2, 4, 6, 7].map((k) => fn(S[k]));
          let l = 0;
          for (let k = 1; k < path.length; k++) l += vlen(sub(path[k], path[k - 1]));
          trails[i].set(l > 40 && trailOn ? path : null, Math.min(6, (l - 40) * 0.05 + 1.5) * sc);
        });
      }
      {
        let d = '';
        for (const sp of sprays) {
          const u = t - sp.at;
          if (u < 0 || u > 0.7) continue;
          const Jh = sp.J || (sp.J = derive(poseAt(sp.at)));
          const o = lerp2(Jh.chest, Jh.hip, 0.4);
          for (const [x, y, vx, vy, r, k] of sp.drops) {
            const uu = u * (0.8 + 0.4 * k), life = 1 - uu / 0.7;
            if (life <= 0) continue;
            const px = o[0] + x + vx * uu, py = o[1] + y + vy * uu + 900 * uu * uu;
            const vy2 = vy + 1800 * uu, rr = r * Math.max(0.15, life);
            const st = Math.min(3, 1 + Math.hypot(vx, vy2) / 420), a = Math.atan2(vy2, vx);
            d += drop(px, py, rr, st, a);
          }
        }
        const dz = dissolve(t);
        let fl = '';
        if (dz) {
          const B = dissolveBox(), pale = String(f5(1 - DZ_PALE * EASE.io(dz.k)));
          setA(body, 'mask', `url(#${gid}dz)`);
          const a = dz.x - DZ_SOFT;
          setA(dzGrad, 'x1', f2(a * DZ_DIR[0])); setA(dzGrad, 'y1', f2(B.ym + a * DZ_DIR[1]));
          setA(dzGrad, 'x2', f2(dz.x * DZ_DIR[0])); setA(dzGrad, 'y2', f2(B.ym + dz.x * DZ_DIR[1]));
          setA(dzStop, 'stop-opacity', pale);
          for (const [hx, hy, te, r, k1, k2, streak] of B.motes) {
            const u = t - te;
            if (u < 0 || u > 1.1) continue;
            const life = 1 - u / 1.1;
            const vx = 380 + 380 * k1, px = hx + vx * u + 520 * u * u, py = hy - (30 + 80 * k2) * u + 10 * Math.sin(u * 7 + k1 * 6);
            fl += drop(px, py, r * Math.pow(life, 0.6), streak ? 4 + 5 * k2 + 6 * u : 1.3 + vx / 400, -0.1 + 0.08 * Math.sin(u * 5 + k2 * 4));
          }
        } else setA(body, 'mask', 'none');
        setA(spray, 'd', d);
        setA(flakes, 'd', fl);
      }
      return J;
    }

    return { root, fig, render, poseAt, dissolve, jointsAt: (t) => derive(poseAt(t)) };
  }

  return { create, derive, POSE };
})();
