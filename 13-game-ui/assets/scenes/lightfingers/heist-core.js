(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, u) => a + (b - a) * u;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const TAU = Math.PI * 2;

  const E = {
    lin: (u) => u,
    outCubic: (u) => 1 - Math.pow(1 - u, 3),
    inCubic: (u) => u * u * u,
    outQuint: (u) => 1 - Math.pow(1 - u, 5),
    inOutCubic: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    inExpo: (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10)),
    outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
    outBack: (u) => { const s = 1.9; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); },
    outBackBig: (u) => { const s = 3.2; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); },
    step: () => 0,
  };

  function K(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (t < k[0]) {
        const p = keys[i - 1];
        const ease = k[2] || E.lin;
        return lerp(p[1], k[1], ease((t - p[0]) / (k[0] - p[0])));
      }
    }
    return keys[keys.length - 1][1];
  }

  function shake(t, events) {
    let x = 0, y = 0, r = 0;
    for (let i = 0; i < events.length; i++) {
      const e = events[i], dt = t - e[0];
      if (dt < 0 || dt > e[2] * 5) continue;
      const a = e[1] * Math.exp(-dt / e[2]);
      const w = TAU * e[3] * dt;
      x += a * Math.sin(w + 0.3);
      y += a * 0.7 * Math.sin(w * 1.31 + 1.7);
      r += a * 0.04 * Math.sin(w * 0.77 + 0.9);
    }
    return [x, y, r];
  }

  function rng(seed) {
    let a = seed | 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  const pts = (a) => a.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const polyCSS = (a) => 'polygon(' + a.map((p) => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',') + ')';

  function torn(w, h, o = {}) {
    const r = rng(o.seed || 1), amp = o.amp == null ? 8 : o.amp, step = o.step || 18;
    const sides = o.sides || 'trbl', out = [];
    const edge = (x0, y0, x1, y1, on, nx, ny) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = on ? Math.max(1, Math.round(len / step)) : 1;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        let x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
        if (on && i > 0) {
          const a = (i % 2 ? 1 : -0.6) * amp * (0.35 + 0.65 * r());
          x += nx * a; y += ny * a;
        }
        out.push([x, y]);
      }
    };
    edge(0, 0, w, 0, sides.includes('t'), 0, 1);
    edge(w, 0, w, h, sides.includes('r'), -1, 0);
    edge(w, h, 0, h, sides.includes('b'), 0, -1);
    edge(0, h, 0, 0, sides.includes('l'), 1, 0);
    return out;
  }

  function rough(P, o = {}) {
    const amp = o.amp == null ? 1.6 : o.amp, step = o.step || 7, scale = o.scale || 26;
    const jit = o.jit == null ? 0.35 : o.jit, r = rng(o.seed || 1);
    const lat = [];
    for (let i = 0; i < 1024; i++) lat.push(r() * 2 - 1);
    const noise = (s) => {
      const u = s / scale, i = Math.floor(u), f = u - i, w = f * f * (3 - 2 * f);
      return lat[i & 1023] * (1 - w) + lat[(i + 1) & 1023] * w;
    };
    const out = [];
    let s = 0;
    for (let k = 0; k < P.length; k++) {
      const a = P[k], b = P[(k + 1) % P.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L, n = Math.max(1, Math.round(L / step));
      out.push(a);
      for (let i = 1; i < n; i++) {
        const u = i / n;
        const taper = Math.min(1, Math.min(u, 1 - u) * L / (step * 2));
        const d = amp * taper * ((1 - jit) * noise(s + u * L) + jit * (r() * 2 - 1));
        out.push([a[0] + dx * u + nx * d, a[1] + dy * u + ny * d]);
      }
      s += L;
    }
    return out;
  }

  function tornR(w, h, o = {}) {
    const r = rng(o.seed || 1), amp = o.amp == null ? 8 : o.amp, step = o.step || 6;
    const sides = o.sides || 'trbl', out = [], rim = [];
    const edge = (x0, y0, x1, y1, on, nx, ny) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = on ? Math.max(1, Math.round(len / step)) : 1;
      let wv = 0, v = 0;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        let x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
        let f = 0;
        if (on && i > 0) {
          v = v * 0.8 + (r() - 0.5) * 0.9;
          wv = clamp(wv + v * 0.35, -1, 1);
          const a = amp * (0.55 * wv + 0.45 * (r() - 0.5) * (r() < 0.15 ? 2.4 : 1));
          x += nx * a; y += ny * a;
          f = 2 + r() * r() * 6;
        }
        out.push([x, y]);
        rim.push([x - nx * f, y - ny * f]);
      }
    };
    edge(0, 0, w, 0, sides.includes('t'), 0, 1);
    edge(w, 0, w, h, sides.includes('r'), -1, 0);
    edge(w, h, 0, h, sides.includes('b'), 0, -1);
    edge(0, h, 0, 0, sides.includes('l'), 1, 0);
    out.rim = rim;
    return out;
  }

  function speedLines(cx, cy, n, r0, r0Spread, r1, hwMax, seed) {
    const r = rng(seed);
    const P = (a, rad) => `${(cx + Math.cos(a) * rad).toFixed(0)} ${(cy + Math.sin(a) * rad).toFixed(0)}`;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (r() - 0.5) * 0.1, hw = 0.002 + r() * r() * hwMax;
      const a0 = r0 + r() * r0Spread;
      d += `M${P(a, a0)} L${P(a - hw, r1)} L${P(a + hw, r1)}Z `;
    }
    return d;
  }

  function tape(w, h, seed) {
    return torn(w, h, { seed, amp: Math.min(9, h * 0.22), step: Math.max(6, h / 4), sides: 'lr' });
  }

  function burst(n, r1, r2, seed, jitter = 0.3) {
    const r = rng(seed), out = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * TAU + (r() - 0.5) * jitter * (TAU / (n * 2));
      const rad = i % 2 ? r1 * (0.88 + r() * 0.2) : r2 * (0.72 + r() * 0.28);
      out.push([Math.cos(a) * rad, Math.sin(a) * rad]);
    }
    return out;
  }

  function limb(ax, ay, bx, by, wa, wb) {
    const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    return [[ax + nx * wa / 2, ay + ny * wa / 2], [bx + nx * wb / 2, by + ny * wb / 2],
      [bx - nx * wb / 2, by - ny * wb / 2], [ax - nx * wa / 2, ay - ny * wa / 2]];
  }

  function halftoneChunks(w, h, cell, fn, chunk = 1500) {
    const out = [];
    let d = '', n = 0;
    const k = 0.5523;
    for (let row = 0, y = 0; y <= h + cell; row++, y += cell * 0.866) {
      for (let x = (row % 2) * cell / 2; x <= w + cell; x += cell) {
        const v = fn(x, y);
        if (v <= 0.04) continue;
        const r = Math.min(1, v) * cell * 0.62;
        const c = r * k;
        d += `M${(x + r).toFixed(1)} ${y.toFixed(1)}` +
          `C${(x + r).toFixed(1)} ${(y + c).toFixed(1)} ${(x + c).toFixed(1)} ${(y + r).toFixed(1)} ${x.toFixed(1)} ${(y + r).toFixed(1)}` +
          `C${(x - c).toFixed(1)} ${(y + r).toFixed(1)} ${(x - r).toFixed(1)} ${(y + c).toFixed(1)} ${(x - r).toFixed(1)} ${y.toFixed(1)}` +
          `C${(x - r).toFixed(1)} ${(y - c).toFixed(1)} ${(x - c).toFixed(1)} ${(y - r).toFixed(1)} ${x.toFixed(1)} ${(y - r).toFixed(1)}` +
          `C${(x + c).toFixed(1)} ${(y - r).toFixed(1)} ${(x + r).toFixed(1)} ${(y - c).toFixed(1)} ${(x + r).toFixed(1)} ${y.toFixed(1)}Z`;
        if (++n >= chunk) { out.push(d); d = ''; n = 0; }
      }
    }
    if (d) out.push(d);
    return out;
  }
  function halftone(parent, w, h, cell, fn, attrs) {
    const g = S('g', attrs || {}, parent);
    for (const d of halftoneChunks(w, h, cell, fn)) S('path', { d }, g);
    return g;
  }

  function htImg(parent, name, x, y, w, h) {
    const im = D('img', 'abs', parent);
    im.src = `assets/${name}.png`;
    im.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    return im;
  }

  function S(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function D(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function svgBox(parent, x, y, w, h, cls) {
    const s = S('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: cls || '' }, parent);
    s.style.position = 'absolute'; s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.overflow = 'visible';
    return s;
  }

  const TEX = { grit: 1024, mottle: 512 };
  function texFill(svg, id, name) {
    const n = TEX[name];
    const p = S('pattern', { id, width: n, height: n, patternUnits: 'userSpaceOnUse' }, S('defs', {}, svg));
    S('image', { href: `assets/${name}.png`, width: n, height: n }, p);
    return `url(#${id})`;
  }

  let tpCount = 0;
  function tornPlate(parent, w, h, o = {}) {
    const P = tornR(w, h, { seed: o.seed, amp: o.amp || 8, step: 4, sides: o.sides || 'r' });
    if (o.rim !== false) S('polygon', { points: pts(P.rim), fill: '#fff' }, parent);
    const plate = S('polygon', { points: pts(P), fill: o.fill || '#000' }, parent);
    let grit = null;
    if (o.grit !== false) {
      const id = 'tp' + (tpCount++);
      S('polygon', { points: pts(P) }, S('clipPath', { id }, S('defs', {}, parent)));
      grit = S('image', { href: 'assets/grit.png', width: TEX.grit, height: TEX.grit, 'clip-path': `url(#${id})` }, parent);
    }
    return { plate, grit, P };
  }

  function glowCopies(parent, layers, build) {
    return layers.map(([r, o]) => {
      const w = D('div', 'abs o0', parent);
      if (r) w.style.filter = `blur(${r}px)`;
      if (o < 1) w.style.opacity = String(o);
      return build(w, r > 0);
    });
  }

  function tf(el, x, y, r = 0, sx = 1, sy = sx) {
    const v = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
    if (el._tf !== v) { el.style.transform = v; el._tf = v; }
  }
  function op(el, o) {
    const v = clamp(o).toFixed(3);
    if (el._op !== v) { el.style.opacity = v; el._op = v; }
  }
  function vis(el, on) {
    if (el._vis !== on) { el.style.visibility = on ? 'visible' : 'hidden'; el._vis = on; }
  }
  function disp(el, on) {
    if (el._disp !== on) { el.style.display = on ? '' : 'none'; el._disp = on; }
  }
  function txt(el, s) {
    if (el._txt !== s) { el.textContent = s; el._txt = s; }
  }
  function attr(el, k, v) {
    const key = '_a_' + k;
    if (el[key] !== v) { el.setAttribute(k, v); el[key] = v; }
  }
  function sty(el, k, v) {
    const key = '_s_' + k;
    if (el[key] !== v) { el.style[k] = v; el[key] = v; }
  }
  function wipeX(el, u, fromRight) {
    u = clamp(u, 0.0001, 1);
    const cut = ((1 - u) * 100).toFixed(3) + '%';
    sty(el, 'clipPath', fromRight ? `inset(0 0 0 ${cut})` : `inset(0 ${cut} 0 0)`);
  }

  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  window.HC = { NS, clamp, lerp, prog, TAU, E, K, shake, rng, pts, polyCSS, torn, tornR, rough, tape, burst, limb,
    halftone, htImg, tornPlate, texFill, speedLines, S, D, svgBox, glowCopies, tf, op, vis, disp, txt, attr, sty, wipeX, fmt };
})();
