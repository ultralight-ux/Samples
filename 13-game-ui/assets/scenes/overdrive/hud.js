(() => {
  const TAU = Math.PI * 2;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  function el(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function sv(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function css(e, prop, val) { const k = '_c_' + prop; if (e[k] !== val) { e[k] = val; e.style[prop] = val; } }
  function attr(e, name, val) { const k = '_a_' + name; if (e[k] !== val) { e[k] = val; e.setAttribute(name, val); } }
  function text(e, s) { if (e._t !== s) { e._t = s; e.textContent = s; } }
  function cls(e, name, on) { const k = '_k_' + name; if (e[k] !== on) { e[k] = on; e.classList.toggle(name, on); } }
  const path = (P) => P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');

  function lit(parent, klass, extra) {
    const box = el('span', 'lt ' + klass, parent);
    box._layers = [];
    for (const name of ['lt-bw', 'lt-bt', ...(extra || []), 'lt-f']) {
      const l = el('span', name, box);
      box._layers.push(l);
      box[name] = l;
    }
    return box;
  }
  function setLit(box, s) { if (box._t !== s) { box._t = s; for (const l of box._layers) l.textContent = s; } }

  const ORD = (n) => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
  const TEAMS = {
    KTN: { name: 'Kaiten Dynamic', color: '#ff2b3d' },
    NVK: { name: 'Nordvakt', color: '#6f7dff' },
    SLN: { name: 'Solenne Aero', color: '#dfe4f0' },
    TKN: { name: 'Takane Heavy', color: '#ffb03a' },
    BRV: { name: 'Bravura', color: '#ff6fae' },
    HXL: { name: 'Hexlumen', color: '#46e0c8' },
    PLX: { name: 'Parallax Grav', color: '#a77bff' },
  };

  const HDR = { cool: [0.9, 0.9, 0.9], neon: [1.0, 0.17, 0.24], argon: [0.16, 0.18, 1.0] };
  const LAYERS = { core: 3.0, mid: 1.1, rim: 0.55, in: 0.4, out: 0.28 };
  const OVERLAY_LAYERS = ['core', 'mid', 'rim'];
  const BASE_PEAK = 0.93;
  const sdr = (c, k) => c.map((x) => Math.round(255 * Math.min(1, x * k)));
  function sdrRed(c, k, core) {
    const v = c.map((x) => x * k), m = Math.max(...v);
    if (m <= 1) return v.map((x) => Math.round(255 * x));
    const w = core ? (m - 1) / (m + 2) : 0;
    return v.map((x) => Math.round(255 * ((x / m) * (1 - w) + w)));
  }
  function instance() {
    const self = {};
    let R = {};

    self.build = function (root, track, scrimRoot, dodgeRoot) {
      R = { root, dodge: dodgeRoot };
      if (dodgeRoot) buildDodge(dodgeRoot);
      if (scrimRoot) R.scrims = el('div', 'scrims', scrimRoot);
      for (const s of ['scrim-top', 'scrim-bl', 'scrim-br']) el('div', 'scrim ' + s, R.scrims);

      const pos = el('div', 'mod m-pos', root);
      R.pos = pos;
      const row = el('div', 'pos-row', pos);
      R.posNum = lit(row, 'pos-num', ['pos-split split-a', 'pos-split split-n']);
      R.posOld = el('span', 'pos-old', R.posNum);
      R.posRing = el('span', 'pos-ring', R.posNum);
      R.posOrd = el('span', 'pos-ord', row);
      el('span', 'pos-of', row, '/12');
      R.posRule = el('div', 'rule pos-rule', pos);
      const pinfo = el('div', 'pos-info', pos);
      el('span', 'lbl', pinfo, 'POSITION');
      R.posGap = el('span', 'pos-gap', pinfo);

      const lap = el('div', 'mod m-lap', root);
      R.lap = lap;
      const lapL = el('div', 'lap-left', lap);
      R.lapLbl = el('div', 'lbl lap-lbl', lapL, 'LAP');
      const lapRow = el('div', 'lap-row', lapL);
      R.lapNum = lit(lapRow, 'lap-num');
      el('span', 'lap-of', lapRow, '/3');
      const pips = el('div', 'lap-pips', lapL);
      R.pips = [0, 1, 2].map(() => el('i', '', pips));
      el('div', 'lap-div', lap);
      const lapR = el('div', 'lap-right', lap);
      el('div', 'lbl', lapR, 'LAP TIME');
      R.lapTime = el('div', 'lap-time', lapR);
      const lapSub = el('div', 'lap-sub', lapR);
      el('span', 'lbl', lapSub, 'BEST');
      R.lapBest = el('span', 'lap-best', lapSub);
      el('div', 'rule lap-rule', lap);
      R.split = el('div', 'split', lap);
      R.splitV = el('span', 'split-v', R.split);
      R.splitK = el('span', 'lbl split-k', R.split, 'PERSONAL BEST');

      const st = el('div', 'mod m-stand', root);
      R.stand = st;
      const sh = el('div', 'stand-head', st);
      el('span', 'lbl', sh, 'STANDINGS');
      el('span', 'lbl', sh, 'INT');
      R.rows = {};
      for (const code of ['NVK', 'SLN', 'TKN', 'KTN', 'BRV']) {
        const r = el('div', 'srow' + (code === 'KTN' ? ' me' : ''), st);
        el('div', 'srow-light', r);
        const p = el('div', 'srow-pos', r);
        el('i', 'srow-tick', r).style.setProperty('--tc', TEAMS[code].color);
        el('div', 'srow-code', r, code);
        const gap = el('div', 'srow-gap', r);
        R.rows[code] = { row: r, p, gap };
      }

      const mm = el('div', 'mod m-map', root);
      R.map = mm;
      const MW = 520, MH = 280, LIFT = 26, EL = 0.5, ROT = (120 * Math.PI) / 180;
      const N = 360;
      const cr = Math.cos(ROT), sr = Math.sin(ROT);
      const ground = (s) => { const p = track.at(s); return [p.x * cr - p.z * sr, p.x * sr + p.z * cr]; };
      const G = [];
      for (let i = 0; i < N; i++) G.push(ground((i / N) * track.LAP));
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const [x, z] of G) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const PAD = 14;
      const ks = Math.min((MW - 2 * PAD) / (x1 - x0), (MH - 2 * PAD - LIFT) / ((z1 - z0) * EL));
      const proj = ([x, z], h) => [PAD + (x - x0) * ks, MH - PAD - (z - z0) * ks * EL - h];
      const at = (s, h) => proj(ground(s), h);
      const msvg = sv('svg', { viewBox: `0 0 ${MW} ${MH}`, width: MW, height: MH, class: 'map-svg' }, mm);
      const loop = (h) => path(G.map((g) => proj(g, h))) + 'Z';
      sv('path', { d: loop(0), class: 'map-shadow' }, msvg);
      let pyl = '';
      for (let i = 0; i < N; i += 12) { const a = proj(G[i], 0), b = proj(G[i], LIFT - 3); pyl += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }
      sv('path', { d: pyl, class: 'map-pylon' }, msvg);
      const SIDE = 8;
      let side = '';
      for (let i = 0; i < N; i++) {
        const g0 = G[i], g1 = G[(i + 1) % N];
        const q = [proj(g0, LIFT), proj(g1, LIFT), proj(g1, LIFT - SIDE), proj(g0, LIFT - SIDE)];
        side += 'M' + q.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
      }
      sv('path', { d: side, class: 'map-side' }, msvg);
      sv('path', { d: loop(LIFT - SIDE), class: 'map-under' }, msvg);
      sv('path', { d: loop(LIFT), class: 'map-glow' }, msvg);
      sv('path', { d: loop(LIFT), class: 'map-ribbon' }, msvg);
      const tun = [];
      for (let s = track.TUNNEL[0]; s <= track.TUNNEL[1]; s += 10) tun.push(at(s, LIFT));
      sv('path', { d: path(tun), class: 'map-tunnel-glow' }, msvg);
      sv('path', { d: path(tun), class: 'map-tunnel' }, msvg);
      {
        const p = track.at(0), n = [Math.cos(p.h), -Math.sin(p.h)], w = 13 / ks;
        const side = (sgn) => { const gx = p.x + n[0] * w * sgn, gz = p.z + n[1] * w * sgn; return [gx * cr - gz * sr, gx * sr + gz * cr]; };
        const L0 = proj(side(-1), LIFT), L1 = proj(side(-1), LIFT + 9), R0 = proj(side(1), LIFT), R1 = proj(side(1), LIFT + 9);
        const f = (q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1);
        sv('path', { d: `M${f(L0)}L${f(R0)}`, class: 'map-line' }, msvg);
        sv('path', { d: `M${f(L0)}L${f(L1)}M${f(R0)}L${f(R1)}M${f(L1)}L${f(R1)}`, class: 'map-gate' }, msvg);
      }
      const dyn = sv('svg', { viewBox: `0 0 ${MW} ${MH}`, width: MW, height: MH, class: 'map-svg map-dyn' }, mm);
      let total = 0;
      const RP = G.map((g) => proj(g, LIFT));
      for (let i = 0; i < N; i++) { const a = RP[i], b = RP[(i + 1) % N]; total += Math.hypot(b[0] - a[0], b[1] - a[1]); }
      R.mapLen = total;
      R.mapProg = sv('path', { d: loop(LIFT), class: 'map-prog', 'stroke-dasharray': `0 ${total.toFixed(1)}` }, dyn);
      R.mapDots = {};
      for (const code of ['PLX', 'HXL', 'BRV', 'TKN', 'SLN', 'NVK']) {
        const g = sv('g', {}, dyn);
        sv('circle', { r: 12, class: 'map-dot-glow', fill: TEAMS[code].color }, g);
        sv('circle', { r: 5.5, class: 'map-dot', fill: TEAMS[code].color }, g);
        R.mapDots[code] = g;
      }
      R.mapMe = sv('g', { class: 'map-me' }, dyn);
      sv('line', { x1: 0, y1: 0, x2: 0, y2: -24, class: 'map-me-stalk' }, R.mapMe);
      sv('ellipse', { cx: 0, cy: 0, rx: 8, ry: 4, class: 'map-me-foot' }, R.mapMe);
      sv('circle', { cx: 0, cy: -24, r: 22, class: 'map-me-glow' }, R.mapMe);
      sv('circle', { cx: 0, cy: -24, r: 8, class: 'map-me-dot' }, R.mapMe);
      R.mapAt = (s) => at(s, LIFT);
      const mcap = el('div', 'map-cap', mm);
      el('span', 'map-name', mcap, 'MIRAHAMA');
      R.mapSector = el('span', 'lbl map-sector', mcap);

      const sp = el('div', 'mod m-speed', root);
      R.speed = sp;
      const S = 460, C = S / 2;
      const ds = sv('svg', { viewBox: `0 0 ${S} ${S}`, width: S, height: S, class: 'dial-svg' }, sp);
      const defs = sv('defs', {}, ds);
      for (const [id, c] of [['od-head', '240,240,240'], ['od-head-a', '120,136,255']]) {
        const rg = sv('radialGradient', { id }, defs);
        for (const [o, col] of [[0, 'rgba(255,255,255,1)'], [0.16, `rgba(${c},.85)`], [0.45, `rgba(${c},.22)`], [1, `rgba(${c},0)`]]) sv('stop', { offset: o, 'stop-color': col }, rg);
      }
      const A0 = -128, A1 = 128, VMAX = 1000;
      const polar = (r, a) => [C + r * Math.sin(a * Math.PI / 180), C - r * Math.cos(a * Math.PI / 180)];
      const arcD = (r, a0, a1) => {
        const p0 = polar(r, a0), p1 = polar(r, a1);
        return `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
      };
      sv('path', { d: arcD(200, A0, A1), class: 'dial-hair' }, ds);
      sv('path', { d: arcD(200, A0 + (A1 - A0) * 0.85, A1), class: 'dial-hair od-zone' }, ds);
      sv('path', { d: arcD(200, A0, A1), class: 'dial-hair-core' }, ds);
      R.ticks = [];
      for (let v = 0; v <= VMAX; v += 20) {
        const a = A0 + (A1 - A0) * (v / VMAX);
        const major = v % 100 === 0;
        const p0 = polar(major ? 184 : 191, a), p1 = polar(198, a);
        const tk = sv('line', { x1: p0[0].toFixed(2), y1: p0[1].toFixed(2), x2: p1[0].toFixed(2), y2: p1[1].toFixed(2), class: 'tick' + (major ? ' major' : '') + (v >= 850 ? ' od' : '') }, ds);
        R.ticks.push([v, tk]);
        if (major) {
          const pl = polar(167, a);
          sv('text', { x: pl[0].toFixed(1), y: (pl[1] + 6).toFixed(1), class: 'tick-num' + (v >= 900 ? ' od' : '') }, ds).textContent = String(v / 100);
        }
      }
      const glow = sv('svg', { viewBox: `0 0 ${S} ${S}`, width: S, height: S, class: 'dial-dyn' }, null);
      sp.insertBefore(glow, ds);
      R.segGlow = sv('path', { class: 'seg-glow' }, glow);
      R.segGlow2 = sv('path', { class: 'seg-glow tight' }, glow);
      const dyn2 = sv('svg', { viewBox: `0 0 ${S} ${S}`, width: S, height: S, class: 'dial-dyn' }, sp);
      R.segs = [];
      const NSEG = 48, segA = (A1 - A0) / NSEG;
      for (let i = 0; i < NSEG; i++) {
        const a0 = A0 + i * segA + 0.7, a1 = A0 + (i + 1) * segA - 0.7;
        const o0 = polar(150, a0), o1 = polar(150, a1), i1 = polar(138, a1), i0 = polar(138, a0);
        const dseg = `M${o0[0].toFixed(2)} ${o0[1].toFixed(2)}A150 150 0 0 1 ${o1[0].toFixed(2)} ${o1[1].toFixed(2)}L${i1[0].toFixed(2)} ${i1[1].toFixed(2)}A138 138 0 0 0 ${i0[0].toFixed(2)} ${i0[1].toFixed(2)}Z`;
        const seg = sv('path', { d: dseg, class: 'seg' }, ds);
        const u = i / (NSEG - 1);
        seg.style.setProperty('--on', `rgb(${Math.round(168 + 87 * u)},${Math.round(186 + 69 * u)},255)`);
        R.segs.push(seg);
      }
      R.segHead = sv('circle', { r: 24, class: 'seg-head' }, dyn2);
      R.cells = [];
      const CA0 = -96, CA1 = 96, cw = (CA1 - CA0) / 3;
      for (let i = 0; i < 3; i++) {
        const a0 = CA0 + i * cw + 2.5, a1 = CA0 + (i + 1) * cw - 2.5;
        sv('path', { d: arcD(122, a0, a1), class: 'cell-bg' }, ds);
        const fill = sv('path', { d: arcD(122, a0, a1), class: 'cell' }, ds);
        const len = (Math.PI * 122 * (a1 - a0)) / 180;
        fill.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${(len + 10).toFixed(2)}`);
        R.cells.push({ fill, len });
      }
      R.polar = polar; R.arcD = arcD; R.A0 = A0; R.A1 = A1; R.VMAX = VMAX;
      const bloom = (klass) => {
        const b = el('div', 'dial-bloom ' + klass, null);
        sp.insertBefore(b, ds);
        const c = ds.cloneNode(true);
        for (const n of c.querySelectorAll('defs, text, .cell, .cell-bg')) n.remove();
        b.appendChild(c);
        return { el: b, segs: [...c.querySelectorAll('.seg')], ticks: [...c.querySelectorAll('.tick')] };
      };
      R.blooms = [bloom('out'), bloom('in')];
      R.odRing = el('div', 'od-ring', sp);
      R.odFlash = el('div', 'od-flash', sp);
      const rd = el('div', 'dial-read', sp);
      R.spdSplitA = el('div', 'spd-num spd-split-a', rd);
      R.spdSplitN = el('div', 'spd-num spd-split-n', rd);
      R.spd = el('div', 'spd-num spd-main', rd);
      el('div', 'spd-unit lbl', rd, 'KM/H');
      R.odLbl = el('div', 'lbl od-lbl', sp, 'OVERDRIVE');
      R.odState = el('div', 'od-state', sp);
      return R;
    };

    self.update = function (h) {
      cls(R.root, 'od', !!h.speed.od);
      setExposure(h.exposure, !!h.speed.od, h.gain);
      {
        const on = h.odIgn >= 0 && h.odIgn < 0.6, u = on ? h.odIgn / 0.6 : 1;
        css(R.odRing, 'visibility', on ? 'visible' : 'hidden');
        css(R.odFlash, 'visibility', on ? 'visible' : 'hidden');
        if (on) {
          css(R.odRing, 'opacity', (1 - u).toFixed(3));
          css(R.odRing, 'transform', `scale(${(0.7 + 0.6 * expoOut(u)).toFixed(4)})`);
          css(R.odFlash, 'opacity', Math.exp(-h.odIgn / 0.16).toFixed(3));
        }
      }
      for (const [key, k] of Object.entries(h.show)) {
        const m = R[key];
        if (!m) continue;
        const o = clamp01(k);
        css(m, 'opacity', o >= 1 ? '1' : o.toFixed(3));
        css(m, 'visibility', o <= 0 ? 'hidden' : 'visible');
        const dy = (1 - o) * (key === 'map' || key === 'speed' ? 40 : -40);
        css(m, 'transform', `translate3d(0,${dy.toFixed(2)}px,0)`);
      }
      const scr = Math.max(h.show.pos, h.show.speed);
      if (R.scrims) {
        css(R.scrims, 'opacity', clamp01(scr).toFixed(3));
        css(R.scrims, 'visibility', scr <= 0 ? 'hidden' : 'visible');
      }
      if (R.dodge) {
        const dk = h.gain.dodge * Math.max(1, 1 + 0.3 * (h.exposure - 1.5)) * clamp01(scr);
        css(R.dodge, 'visibility', dk > 0.002 ? 'visible' : 'hidden');
        css(R.dodge, 'filter', `brightness(${dk.toFixed(4)})`);
      }

      const pos = h.pos;
      setLit(R.posNum, String(pos.n));
      text(R.posOrd, ORD(pos.n));
      const ip = pos.impact;
      const k = ip < 0.5 ? ip / 0.5 : 1;
      const sc = ip < 0.5 ? 1.32 - 0.32 * backOut(k) : 1;
      for (const l of R.posNum._layers) css(l, 'transform', `scale(${sc.toFixed(4)})`);
      cls(R.posNum, 'flash', ip < 0.12);
      const split = ip < 0.3 ? (1 - ip / 0.3) * 14 : 0;
      for (const [e, sgn] of [[R.posNum['pos-split split-a'], -1], [R.posNum['pos-split split-n'], 1]]) {
        css(e, 'visibility', split > 0.3 ? 'visible' : 'hidden');
        css(e, 'transform', `translate3d(${(sgn * split).toFixed(2)}px,0,0) scale(${sc.toFixed(4)})`);
      }
      if (pos.prev && ip < 0.35) {
        text(R.posOld, String(pos.prev));
        const u = ip / 0.35;
        css(R.posOld, 'visibility', 'visible');
        css(R.posOld, 'opacity', (0.8 * (1 - u)).toFixed(3));
        css(R.posOld, 'transform', `translate3d(${(-50 * u).toFixed(2)}px,${(-80 * u).toFixed(2)}px,0) skewX(${(-18 * u).toFixed(2)}deg) scale(${(1 - 0.2 * u).toFixed(4)})`);
      } else css(R.posOld, 'visibility', 'hidden');
      const rb = ip < 0.6 ? ip / 0.6 : 1;
      css(R.posRing, 'visibility', rb < 1 ? 'visible' : 'hidden');
      css(R.posRing, 'opacity', ((1 - rb) * 0.85).toFixed(3));
      css(R.posRing, 'transform', `scale(${(0.4 + 1.3 * expoOut(rb)).toFixed(4)})`);
      cls(R.posRule, 'hit', ip < 0.6);
      text(R.posGap, pos.gap);

      setLit(R.lapNum, String(h.lap.n));
      text(R.lapLbl, h.lap.final ? 'FINAL LAP' : 'LAP');
      cls(R.lap, 'final', !!h.lap.final);
      R.pips.forEach((p, i) => {
        cls(p, 'done', i < h.lap.n - 1);
        cls(p, 'cur', i === h.lap.n - 1);
      });
      text(R.lapTime, h.lap.time);
      text(R.lapBest, h.lap.best);
      const sp = h.split;
      css(R.split, 'opacity', sp ? sp.a.toFixed(3) : '0');
      css(R.split, 'visibility', sp ? 'visible' : 'hidden');
      css(R.split, 'transform', `translate3d(0,${sp ? ((1 - sp.a) * -12).toFixed(2) : -12}px,0)`);
      if (sp) { text(R.splitV, sp.v); text(R.splitK, sp.k); cls(R.split, 'slow', !!sp.slow); }

      for (const [code, r] of Object.entries(R.rows)) {
        const st = h.stand[code];
        if (!st) continue;
        text(r.p, String(st.p));
        text(r.gap, st.gap);
        css(r.row, 'transform', `translate3d(${(st.x || 0).toFixed(2)}px,${(st.y * 42).toFixed(2)}px,0)`);
      }

      for (const [code, s] of Object.entries(h.map.rivals)) {
        const p = R.mapAt(s);
        attr(R.mapDots[code], 'transform', `translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})`);
      }
      const me = R.mapAt(h.map.me);
      attr(R.mapMe, 'transform', `translate(${me[0].toFixed(2)} ${me[1].toFixed(2)})`);
      const prog = h.map.progress * R.mapLen;
      attr(R.mapProg, 'stroke-dasharray', `${prog.toFixed(1)} ${(R.mapLen + 10).toFixed(1)}`);
      text(R.mapSector, h.map.sector);

      const v = h.speed.kmh;
      const od = !!h.speed.od;
      const lit = Math.round((Math.min(v, R.VMAX) / R.VMAX) * R.segs.length);
      R.segs.forEach((s, i) => { cls(s, 'on', i < lit); for (const b of R.blooms) cls(b.segs[i], 'on', i < lit); });
      R.ticks.forEach(([tv, tk], i) => { cls(tk, 'lit', tv <= v); for (const b of R.blooms) cls(b.ticks[i], 'lit', tv <= v); });
      const ha = R.A0 + (R.A1 - R.A0) * (Math.min(v, R.VMAX) / R.VMAX);
      const hp = R.polar(144, ha);
      attr(R.segHead, 'cx', hp[0].toFixed(2));
      attr(R.segHead, 'cy', hp[1].toFixed(2));
      attr(R.segHead, 'visibility', v > 5 ? 'visible' : 'hidden');
      const glowD = v > 5 ? R.arcD(144, R.A0, Math.max(R.A0 + 1, ha)) : 'M0 0';
      attr(R.segGlow, 'd', glowD);
      attr(R.segGlow2, 'd', glowD);
      cls(R.speed, 'od', od);
      R.cells.forEach((c) => css(c.fill, 'stroke', h.speed.ready ? `rgba(255,255,255,${(0.7 + 0.3 * h.speed.pulse).toFixed(3)})` : ''));
      const sTxt = String(Math.round(v));
      text(R.spd, sTxt);
      const wd = Math.round((75 + 50 * clamp01(v / 1000)) / 5) * 5;
      for (const e of [R.spd, R.spdSplitA, R.spdSplitN]) css(e, 'fontVariationSettings', `'wdth' ${wd}`);
      const ss = h.speed.split || 0;
      for (const [e, sgn] of [[R.spdSplitA, -1], [R.spdSplitN, 1]]) {
        css(e, 'visibility', ss > 0.05 ? 'visible' : 'hidden');
        if (ss <= 0.05) continue;
        text(e, sTxt);
        css(e, 'transform', `translate3d(${(sgn * ss * 10).toFixed(2)}px,0,0)`);
      }
      h.speed.cells.forEach((f, i) => {
        const c = R.cells[i];
        attr(c.fill, 'stroke-dashoffset', (c.len * (1 - clamp01(f))).toFixed(2));
        cls(c.fill, 'full', f >= 1);
      });
      cls(R.speed, 'ready', !!h.speed.ready);
      text(R.odState, h.speed.state);
    };

    function setExposure(E, od, gain) {
      const key = E.toFixed(4) + (od ? 'a' : 'n') + gain.overlay + '/' + gain.glow;
      if (R._xk === key) return;
      R._xk = key;
      const st = R.root.style;
      for (const [name, c] of [['cool', od ? HDR.argon : HDR.cool], ['neon', od ? HDR.argon : HDR.neon]]) {
        for (const layer in LAYERS) {
        const boost = layer === 'in' ? Math.pow(Math.max(1, E / 1.5), 0.6) : 1;
        const k = LAYERS[layer] * E * boost * (OVERLAY_LAYERS.includes(layer) ? gain.overlay : gain.glow);
        let v = c === HDR.neon ? sdrRed(c, k, layer === 'core') : sdr(c, k);
        if (!od && name === 'cool') v = v.map((x) => Math.round(x * BASE_PEAK));
        const rgb = v.join(',');
          st.setProperty(`--${name}-${layer}`, `rgb(${rgb})`);
          st.setProperty(`--${name}-${layer}-rgb`, rgb);
        }
      }
      const g = Math.sqrt(E);
      st.setProperty('--xb-in', (3.5 + 1.2 * g).toFixed(2) + 'px');
      st.setProperty('--xb-out', (20 * g).toFixed(2) + 'px');
      const c = od ? HDR.argon : HDR.cool;
      R.segs.forEach((s, i) => s.style.setProperty('--on', `rgb(${sdr(c, (0.6 + 1.1 * i / (R.segs.length - 1)) * E * gain.overlay).map((x) => (od ? x : Math.round(x * BASE_PEAK))).join(',')})`));
      css(R.blooms[0].el, 'filter', `blur(${(7 * g).toFixed(2)}px)`);
      css(R.blooms[1].el, 'filter', `blur(${(1.6 + 0.5 * g).toFixed(2)}px)`);
      attr(R.segGlow, 'stroke-width', (30 * g).toFixed(2));
      attr(R.segGlow2, 'stroke-width', (12 + 2 * g).toFixed(2));
    }

    function buildDodge(root) {
      const c = document.createElement('canvas');
      c.width = 960; c.height = 540;
      const g = c.getContext('2d');
      g.scale(0.5, 0.5);
      g.fillStyle = '#000';
      g.fillRect(0, 0, 1920, 1080);
      g.globalCompositeOperation = 'lighter';
      const cx = 1920 - 30 - 230, cy = 1080 + 6 - 230, a0 = (-128 - 90) * Math.PI / 180, a1 = (128 - 90) * Math.PI / 180;
      g.lineCap = 'round';
      for (const [w, a] of [[120, 0.03], [80, 0.045], [48, 0.06], [24, 0.08]]) {
        g.strokeStyle = `rgba(90,118,255,${a})`;
        g.lineWidth = w;
        g.beginPath(); g.arc(cx, cy, 144, a0, a1); g.stroke();
      }
      const blob = (x, y, rx, ry, col) => {
        g.save(); g.translate(x, y); g.scale(rx / ry, 1);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, ry);
        gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(0.5, `rgba(${col},.45)`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(-ry, -ry, 2 * ry, 2 * ry); g.restore();
      };
      blob(cx, cy, 170, 80, '28,36,72');
      blob(120, 108, 120, 100, '26,30,52');
      blob(1015, 78, 130, 36, '24,30,56');
      root.appendChild(c);
    }
    return self;
  }

  const passes = [instance(), instance()];
  const hud = {
    build(overlayRoot, glowRoot, track, scrimRoot, dodgeRoot) {
      passes[0].build(overlayRoot, track, scrimRoot, dodgeRoot);
      passes[1].build(glowRoot, track, null, null);
    },
    update(h) { for (const p of passes) p.update(h); },
  };

  function expoOut(x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
  function backOut(x, k = 1.7) { x = clamp01(x) - 1; return 1 + (k + 1) * x * x * x + k * x * x; }

  window.ODHud = { hud, TEAMS, ORD, lit, setLit, el, sv, css, text, cls, attr };
})();
