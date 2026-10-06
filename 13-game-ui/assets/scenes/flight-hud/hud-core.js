'use strict';
window.HUD = (() => {
  const E = {
    lin: 'linear',
    hold: 'hold',
    inOut: [0.65, 0, 0.35, 1],
    cam: [0.87, 0, 0.13, 1],
    out: [0.16, 1, 0.3, 1],
    soft: [0.33, 1, 0.68, 1],
    back: [0.34, 1.56, 0.64, 1],
    in: [0.7, 0, 0.84, 0],
    decay: [0.05, 0.7, 0.3, 1],
  };

  const bezCache = new Map();
  function bezier(c) {
    const key = c.join();
    let fn = bezCache.get(key);
    if (fn) return fn;
    const [x1, y1, x2, y2] = c;
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u;
    const sy = (u) => ((ay * u + by) * u + cy) * u;
    const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
    fn = (x) => {
      let u = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(u) - x;
        if (Math.abs(e) < 1e-7) return sy(u);
        const d = dx(u);
        if (Math.abs(d) < 1e-6) break;
        u -= e / d;
      }
      let lo = 0, hi = 1;
      u = x;
      for (let i = 0; i < 40 && hi - lo > 1e-7; i++) {
        if (sx(u) < x) lo = u; else hi = u;
        u = (lo + hi) / 2;
      }
      return sy(u);
    };
    bezCache.set(key, fn);
    return fn;
  }
  const easeFn = (e) => (e === 'linear' ? (p) => p : e === 'hold' ? () => 0 : bezier(e));
  const cssEase = (e) => (e === 'linear' ? 'linear' : e === 'hold' ? 'step-end' : `cubic-bezier(${e.join(',')})`);

  const lerp = (a, b, p) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * p) : a + (b - a) * p);

  class Track {
    constructor(v0) { this.k = [{ t: 0, v: v0, e: 'linear' }]; }
    get end() { return this.k[this.k.length - 1]; }
    get value() { return this.end.v; }
    to(t0, t1, v, e = E.lin) {
      const L = this.end;
      if (t0 < L.t - 1e-3) throw new Error(`track overlap: ${t0} < ${L.t}`);
      t0 = Math.max(t0, L.t);
      t1 = Math.max(t1, t0 + 1e-3);
      if (t0 > L.t + 1e-6) { L.e = 'linear'; this.k.push({ t: t0, v: L.v, e }); } else L.e = e;
      this.k.push({ t: t1, v, e: 'linear' });
      return this;
    }
    set(t, v) {
      const L = this.end;
      if (this.k.length === 1 && t <= 1e-6) { L.v = v; return this; }
      if (t < L.t - 1e-3) throw new Error(`track overlap: ${t} < ${L.t}`);
      L.e = 'hold';
      this.k.push({ t: Math.max(t, L.t + 1e-4), v, e: 'linear' });
      return this;
    }
    at(t) {
      const k = this.k, n = k.length;
      if (t <= k[0].t) return k[0].v;
      if (t >= k[n - 1].t) return k[n - 1].v;
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (k[m].t <= t) lo = m; else hi = m;
      }
      const a = k[lo], b = k[hi];
      const f = a.f || (a.f = easeFn(a.e));
      return lerp(a.v, b.v, f((t - a.t) / (b.t - a.t)));
    }
    map(fn) {
      const tr = new Track(0);
      tr.k = this.k.map((k) => ({ t: k.t, v: fn(k.v), e: k.e }));
      return tr;
    }
    static sample(fn, D, dt) {
      const n = Math.max(1, Math.round(D / dt));
      const tr = new Track(fn(0));
      for (let i = 1; i <= n; i++) tr.k.push({ t: (i * D) / n, v: fn((i * D) / n), e: 'linear' });
      return tr;
    }
    static const(v) { return new Track(v); }
  }

  const FAM = "'GB Saira', 'Arial', sans-serif";
  const BASE = 0.848;

  const n2 = (v) => +(+v).toFixed(2);
  const n3 = (v) => +(+v).toFixed(3);
  const n4 = (v) => +(+v).toFixed(4);

  const polar = (cx, cy, r, a) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  class PB {
    constructor() { this.s = []; this.b = [Infinity, Infinity, -Infinity, -Infinity]; }
    pt(x, y) {
      const b = this.b;
      if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y;
      if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
    }
    M(x, y) { this.pt(x, y); this.s.push(`M${n2(x)} ${n2(y)}`); return this; }
    L(x, y) { this.pt(x, y); this.s.push(`L${n2(x)} ${n2(y)}`); return this; }
    Z() { this.s.push('Z'); return this; }
    line(x1, y1, x2, y2) { return this.M(x1, y1).L(x2, y2); }
    poly(pts, close) {
      pts.forEach(([x, y], i) => (i ? this.L(x, y) : this.M(x, y)));
      return close ? this.Z() : this;
    }
    rect(x, y, w, h) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true); }
    arc(cx, cy, r, a0, a1, cont) {
      const [x0, y0] = polar(cx, cy, r, a0);
      if (cont) this.L(x0, y0); else this.M(x0, y0);
      let a = a0;
      while (a1 - a > 1e-6) {
        const b = Math.min(a1, a + 179.9);
        const [x1, y1] = polar(cx, cy, r, b);
        this.s.push(`A${n2(r)} ${n2(r)} 0 0 1 ${n2(x1)} ${n2(y1)}`);
        a = b;
      }
      const [xe, ye] = polar(cx, cy, r, a1);
      this.pt(x0, y0); this.pt(xe, ye);
      for (let q = Math.ceil(a0 / 90) * 90; q <= a1; q += 90) { const [x, y] = polar(cx, cy, r, q); this.pt(x, y); }
      return this;
    }
    circle(cx, cy, r) { return this.arc(cx, cy, r, 0, 360).Z(); }
    dot(x, y, r) {
      this.pt(x - r, y - r); this.pt(x + r, y + r);
      this.s.push(`M${n2(x - r)} ${n2(y)}A${r} ${r} 0 1 0 ${n2(x + r)} ${n2(y)}A${r} ${r} 0 1 0 ${n2(x - r)} ${n2(y)}Z`);
      return this;
    }
    dots(cx, cy, r, a0, a1, step, dr = 1.2, skip) {
      for (let a = a0, i = 0; a <= a1 + 1e-6; a += step, i++) {
        if (skip && skip(a, i)) continue;
        const [x, y] = polar(cx, cy, r, a);
        this.dot(x, y, dr);
      }
      return this;
    }
    ticks(cx, cy, r0, r1, a0, a1, step, skip) {
      for (let a = a0, i = 0; a <= a1 + 1e-6; a += step, i++) {
        if (skip && skip(a, i)) continue;
        const [x0, y0] = polar(cx, cy, r0, a), [x1, y1] = polar(cx, cy, r1, a);
        this.line(x0, y0, x1, y1);
      }
      return this;
    }
    sector(cx, cy, r0, r1, a0, a1) {
      this.arc(cx, cy, r1, a0, a1);
      const [x, y] = polar(cx, cy, r0, a1);
      this.L(x, y);
      const steps = Math.max(1, Math.ceil((a1 - a0) / 179.9));
      for (let i = 1; i <= steps; i++) {
        const b = a1 - ((a1 - a0) * i) / steps;
        const [x1, y1] = polar(cx, cy, r0, b);
        this.s.push(`A${n2(r0)} ${n2(r0)} 0 0 0 ${n2(x1)} ${n2(y1)}`);
      }
      return this.Z();
    }
    get d() { return this.s.join(''); }
  }

  let seq = 0;
  class Part {
    constructor(parent, o = {}) {
      this.id = seq++;
      Object.assign(this, {
        x: 0, y: 0, tf: null, op: null, val: null, clip: null, mask: null, maskFrac: 0.16,
        box: null, wipe: null, wipeMode: 'c', fx: null,
      }, o);
      this.prims = []; this.els = []; this.kids = [];
      this.bb = [Infinity, Infinity, -Infinity, -Infinity];
      if (parent) parent.kids.push(this);
    }
    part(o) { return new Part(this, o); }
    ext(b) {
      const a = this.bb;
      a[0] = Math.min(a[0], b[0]); a[1] = Math.min(a[1], b[1]);
      a[2] = Math.max(a[2], b[2]); a[3] = Math.max(a[3], b[3]);
    }
    path(pb, st) {
      if (!pb.s.length) return this;
      const pad = (st.w || 1) + 1;
      this.ext([pb.b[0] - pad, pb.b[1] - pad, pb.b[2] + pad, pb.b[3] + pad]);
      this.prims.push({ k: 'path', d: pb.d, ...st });
      return this;
    }
    stext(x, y, s, st, a = 'l', rot = 0) {
      const w = s.length * st.s * 0.9, r = Math.max(w, st.s) + 4;
      this.ext([x - r, y - r, x + r, y + r]);
      this.prims.push({ k: 'text', x, y, s, st, a, rot });
      return this;
    }
    text(x, y, s, st, a = 'l') { this.els.push({ k: 'text', x, y, s, st, a }); return this; }
    bar(x, y, w, h, n, gap, on, off) { this.els.push({ k: 'bar', x, y, w, h, n, gap, on, off }); return this; }
    sweep(r, rgb, span, peak) { this.els.push({ k: 'sweep', r, rgb, span, peak }); return this; }
    img(x, y, w, h, src, css = '') { this.els.push({ k: 'img', x, y, w, h, src, css }); return this; }
    div(x, y, w, h, css) { this.els.push({ k: 'div', x, y, w, h, css }); return this; }
  }

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let gradSeq = 0;
  function svgPaint(v, defs) {
    if (!v || typeof v === 'string') return v || 'none';
    if (!v._id) {
      v._id = 'g' + gradSeq++;
      const stops = v.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
      if (v.lin) {
        const [x1, y1, x2, y2] = v.lin;
        defs.push(`<linearGradient id="${v._id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`);
      } else {
        const [cx, cy, r] = v.rad;
        defs.push(`<radialGradient id="${v._id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stops}</radialGradient>`);
      }
    }
    return `url(#${v._id})`;
  }
  const fontCSS = (st) => `font-variation-settings:'wdth' ${st.wd || 100}` + (st.tnum ? ';font-variant-numeric:tabular-nums' : '');

  function svgString(part) {
    const b = part.bb, defs = [], body = [];
    part.prims.forEach((p, i) => {
      const op = p.o != null && p.o !== 1 ? ` opacity="${p.o}"` : '';
      if (p.k === 'path') {
        let a = `d="${p.d}" fill="${svgPaint(p.f, defs)}"`;
        if (p.s) {
          a += ` stroke="${svgPaint(p.s, defs)}" stroke-width="${p.w || 1}"`;
          if (p.cap) a += ` stroke-linecap="${p.cap}"`;
          if (p.join) a += ` stroke-linejoin="${p.join}"`;
          if (p.prog) a += ` stroke-dasharray="${n3(p.prog)} ${n3(p.prog)}" data-prog="${i}"`;
          else if (p.dash) a += ` stroke-dasharray="${p.dash.join(' ')}"`;
        }
        if (p.rule) a += ` fill-rule="${p.rule}"`;
        body.push(`<path ${a}${op}/>`);
      } else {
        const st = p.st;
        const anchor = p.a === 'c' ? 'middle' : p.a === 'r' ? 'end' : 'start';
        const tr = p.rot ? ` transform="rotate(${n2(p.rot)} ${n2(p.x)} ${n2(p.y)})"` : '';
        body.push(`<text x="${n2(p.x)}" y="${n2(p.y)}" font-family="${FAM.replace(/"/g, "'")}" ` +
          `font-size="${st.s}" font-weight="${st.w}" letter-spacing="${n3((st.ls || 0) * st.s)}" ` +
          `fill="${st.c}" text-anchor="${anchor}" style="${fontCSS(st)}"${tr}${op}>${esc(p.s)}</text>`);
      }
    });
    const x0 = Math.floor(b[0]), y0 = Math.floor(b[1]);
    const w = Math.ceil(b[2]) - x0, h = Math.ceil(b[3]) - y0;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x0} ${y0} ${w} ${h}" ` +
      `style="position:absolute;left:${x0}px;top:${y0}px;overflow:visible">` +
      (defs.length ? `<defs>${defs.join('')}</defs>` : '') + body.join('') + '</svg>';
  }

  const fontOf = (st) => `${st.w} ${st.s}px ${FAM}`;
  function textDiv(e) {
    const st = e.st, d = document.createElement('div');
    d.className = 't';
    const s = d.style;
    s.font = fontOf(st);
    s.lineHeight = '1';
    s.fontVariationSettings = `'wdth' ${st.wd || 100}`;
    if (st.ls) s.letterSpacing = st.ls + 'em';
    s.color = st.c;
    s.left = n2(e.x) + 'px';
    s.top = n2(e.y - BASE * st.s) + 'px';
    if (st.tnum) s.fontVariantNumeric = 'tabular-nums';
    const back = st.ls ? ` translateX(${st.ls * st.s * (e.a === 'c' ? 0.5 : 1)}px)` : '';
    if (e.a === 'c') s.transform = 'translateX(-50%)' + back;
    else if (e.a === 'r') s.transform = 'translateX(-100%)' + back;
    if (Array.isArray(e.s)) {
      for (const [txt, c] of e.s) {
        const sp = document.createElement('span');
        sp.textContent = txt;
        if (c) sp.style.color = c;
        d.appendChild(sp);
      }
    } else d.textContent = typeof e.s === 'function' ? e.s(0) : e.s;
    return d;
  }

  const tfCSS = (v) => `translate(${n2(v[0])}px,${n2(v[1])}px) rotate(${n4(v[2])}deg) scale(${n4(v[3])})`;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const pct = (v) => n3(Math.min(99.99, v * 100)) + '%';
  const clipCSS = (v) => `inset(0 ${pct(1 - clamp01(v))} 0 0)`;
  const wipeCSS = (mode, v) => {
    const h = pct((1 - clamp01(v)) / 2), f = pct(1 - clamp01(v));
    return mode === 'y' ? `inset(${h} 0 ${h} 0)` : mode === 'l' ? `inset(0 ${f} 0 0)` : mode === 'r' ? `inset(0 0 0 ${f})` : `inset(0 ${h} 0 ${h})`;
  };
  const dashCSS = (L, v) => n3(L * (1 - clamp01(v)));

  function keyframes(name, tr, D, fmt) {
    const out = [];
    for (const k of tr.k) out.push(`${((k.t / D) * 100).toFixed(5)}%{${fmt(k.v)};animation-timing-function:${cssEase(k.e)}}`);
    if (tr.end.t < D) out.push(`100%{${fmt(tr.end.v)}}`);
    return `@keyframes ${name}{${out.join('')}}`;
  }

  function buildDOM(root, host, mode, D) {
    const sheet = [], named = new Set(), anims = [], binds = [], vals = [];
    const animate = (el, name, tr, fmt) => {
      if (!named.has(name)) { named.add(name); sheet.push(keyframes(name, tr, D, fmt)); }
      el.style.animation = (el.style.animation ? el.style.animation + ', ' : '') + `${name} ${D}s infinite`;
    };
    const wrap = (parentEl, cls, x, y, w, h) => {
      const ce = document.createElement('div'), inner = document.createElement('div');
      ce.className = cls;
      Object.assign(ce.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      inner.className = 'p';
      inner.style.left = -x + 'px';
      inner.style.top = -y + 'px';
      ce.appendChild(inner);
      parentEl.appendChild(ce);
      return [ce, inner];
    };
    function fill(part, content, cp, a) {
      if (part.prims.length) {
        content.insertAdjacentHTML('beforeend', svgString(part));
        for (const p of content.lastChild.querySelectorAll('[data-prog]')) a.dashes.push([p, part.prims[+p.dataset.prog].prog]);
      }
      for (const e of part.els) {
        if (e.k === 'text') {
          const d = textDiv(e);
          content.appendChild(d);
          if (typeof e.s === 'function') binds.push({ el: d, fn: e.s, last: d.textContent });
        } else if (e.k === 'bar') {
          const pitch = (e.w + e.gap) / e.n, seg = pitch - e.gap;
          const grad = (c) => `repeating-linear-gradient(90deg, ${c} 0 ${n3(seg)}px, transparent ${n3(seg)}px ${n3(pitch)}px)`;
          for (let k = 0; k < 2; k++) {
            const c = k ? e.on : e.off, isFill = k === 1;
            if (!c) continue;
            const d = document.createElement('div');
            d.className = 'b';
            Object.assign(d.style, { left: e.x + 'px', top: e.y + 'px', width: e.w + 'px', height: e.h + 'px', background: grad(c) });
            content.appendChild(d);
            if (isFill) a.fills.push(d);
          }
        } else if (e.k === 'sweep') {
          const d = document.createElement('div');
          d.className = 'b';
          const [r, g, b] = e.rgb;
          Object.assign(d.style, {
            left: -e.r + 'px', top: -e.r + 'px', width: 2 * e.r + 'px', height: 2 * e.r + 'px', borderRadius: '50%',
            background: `conic-gradient(from ${-e.span}deg, rgba(${r},${g},${b},0) 0deg, rgba(${r},${g},${b},${e.peak}) ${e.span}deg, rgba(${r},${g},${b},0) ${e.span}deg)`,
          });
          content.appendChild(d);
        } else if (e.k === 'img' || e.k === 'div') {
          const d = document.createElement(e.k);
          d.className = 'b';
          if (e.k === 'img') d.src = e.src;
          d.style.cssText = `left:${n2(e.x)}px;top:${n2(e.y)}px;width:${n2(e.w)}px;height:${n2(e.h)}px;` + e.css;
          content.appendChild(d);
        }
      }
      for (const k of part.kids) mk(k, content, cp);
    }
    function mk(part, parentEl, cp) {
      const el = document.createElement('div');
      el.className = 'p';
      el.style.left = n2(part.x) + 'px';
      el.style.top = n2(part.y) + 'px';
      let content = el;
      const a = { part, el, fills: [], dashes: [], boxEl: null };
      if (part.blend) el.style.mixBlendMode = part.blend;
      if (part.clip) {
        const c = part.clip;
        const [ce, inner] = wrap(content, 'c', c.x, c.y, c.w, c.h);
        if (c.circle) ce.style.borderRadius = '50%';
        else if (c.r) ce.style.borderRadius = c.r + 'px';
        if (part.mask) {
          const m = part.maskFrac * 100;
          const v = part.mask === 'r'
            ? `radial-gradient(closest-side, #000 ${100 - m}%, transparent)`
            : `linear-gradient(${part.mask === 'x' ? 90 : 180}deg, transparent, #000 ${m}%, #000 ${100 - m}%, transparent)`;
          ce.style.webkitMaskImage = v;
          ce.style.maskImage = v;
        }
        content = inner;
      }
      if (part.box) {
        const fx = cp ? [] : part.fx || [];
        let g = 0;
        for (const f of fx) g = Math.max(g, Math.ceil(3 * (f.blur || 0) + 2));
        const bx = part.box[0] - g, by = part.box[1] - g, bw = part.box[2] + 2 * g, bh = part.box[3] + 2 * g;
        const [be, inner] = wrap(content, 'bx', bx, by, bw, bh);
        if (part.bcss) be.style.cssText += part.bcss;
        a.boxEl = be;
        for (const f of fx) {
          const [ce, ci] = wrap(inner, 'bx', bx, by, bw, bh);
          if (f.blur) ce.style.filter = `blur(${f.blur}px)`;
          if (f.op != null) ce.style.opacity = f.op;
          fill(part, ci, true, a);
        }
        content = inner;
      }
      fill(part, content, cp, a);
      if (typeof part.op === 'number') el.style.opacity = part.op;
      const opT = part.op && typeof part.op !== 'number';
      const wipe = part.wipe && a.boxEl;
      if (part.tf || opT || wipe || (part.val && (a.fills.length || a.dashes.length))) {
        if (mode === 'css') {
          if (part.tf) { el.style.transformOrigin = '0 0'; animate(el, `a${part.id}t`, part.tf, (v) => `transform:${tfCSS(v)}`); }
          if (opT) animate(el, `a${part.id}o`, part.op, (v) => `opacity:${n3(v)};visibility:${n3(v) ? 'visible' : 'hidden'}`);
          if (wipe) {
            const m = part.wipeMode;
            animate(a.boxEl, `a${part.id}w`, part.wipe, (v) => `clip-path:${wipeCSS(m, v)};-webkit-clip-path:${wipeCSS(m, v)}`);
          }
          if (part.val) {
            a.fills.forEach((f) => animate(f, `a${part.id}b`, part.val, (v) => `clip-path:${clipCSS(v)};-webkit-clip-path:${clipCSS(v)}`));
            a.dashes.forEach(([p, L]) => animate(p, `a${part.id}d${n3(L)}`, part.val, (v) => `stroke-dashoffset:${dashCSS(L, v)}`));
          }
          if (part.val || wipe) vals.push(a);
        } else {
          if (part.tf) el.style.transformOrigin = '0 0';
          if (mode === 'js-layer' && (part.tf || opT)) {
            el.style.willChange = part.tf && opT ? 'transform, opacity' : part.tf ? 'transform' : 'opacity';
          }
          anims.push(a);
        }
      }
      parentEl.appendChild(el);
    }
    mk(root, host, false);
    if (sheet.length) {
      const st = document.createElement('style');
      st.textContent = sheet.join('\n');
      document.head.appendChild(st);
    }
    const setVal = (a, t) => {
      const p = a.part;
      if (p.val) {
        const v = p.val.at(t);
        for (const f of a.fills) {
          const c = clipCSS(v);
          if (f._c !== c) { f.style.clipPath = c; f.style.webkitClipPath = c; f._c = c; }
        }
        for (let i = 0; i < a.dashes.length; i++) {
          const el = a.dashes[i][0], d = dashCSS(a.dashes[i][1], v);
          if (el._d !== d) { el.style.strokeDashoffset = d; el._d = d; }
        }
      }
      if (p.wipe && a.boxEl) {
        const c = wipeCSS(p.wipeMode, p.wipe.at(t));
        if (a.boxEl._c !== c) { a.boxEl.style.clipPath = c; a.boxEl.style.webkitClipPath = c; a.boxEl._c = c; }
      }
    };
    const memo = new Map();
    return {
      update(t) {
        for (const a of anims) {
          const p = a.part;
          if (p.tf) {
            const s = tfCSS(p.tf.at(t));
            if (s !== a.lt) { a.el.style.transform = s; a.lt = s; }
          }
          if (p.op && typeof p.op !== 'number') {
            const o = String(n3(p.op.at(t)));
            if (o !== a.lo) {
              a.el.style.opacity = o;
              if ((o === '0') !== (a.lo === '0')) a.el.style.visibility = o === '0' ? 'hidden' : '';
              a.lo = o;
            }
          }
          if (p.val || p.wipe) setVal(a, t);
        }
        memo.clear();
        for (const b of binds) {
          let s = memo.get(b.fn);
          if (s === undefined) { s = b.fn(t); memo.set(b.fn, s); }
          if (s !== b.last) { b.el.textContent = s; b.last = s; }
        }
      },
      freeze(t) {
        for (const a of vals) {
          for (const f of a.fills) f.style.animation = 'none';
          for (const [p] of a.dashes) p.style.animation = 'none';
          if (a.boxEl && a.part.wipe) a.boxEl.style.animation = 'none';
          setVal(a, t);
        }
      },
    };
  }

  return { E, Track, PB, Part, polar, FAM, BASE, buildDOM, fontOf };
})();
