window.AR = window.AR || {};
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;
  const DUR = 20;

  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lin = (t, a, b) => clamp01((t - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const f2 = (v) => Math.round(v * 100) / 100;
  const f3 = (v) => Math.round(v * 1000) / 1000;

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u;
    const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let u = x;
      for (let i = 0; i < 6; i++) {
        const e = sx(u) - x, d = dx(u);
        if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
        u -= e / d;
      }
      return sy(clamp01(u));
    };
  }
  const E = {
    out: bezier(0.2, 0.7, 0.3, 1),
    in: bezier(0.55, 0, 0.9, 0.4),
    inOut: bezier(0.65, 0, 0.25, 1),
    soft: bezier(0.4, 0, 0.2, 1),
    back: bezier(0.3, 1.45, 0.45, 1),
    backIn: bezier(0.5, -0.45, 0.75, 0.2),
    punch: bezier(0.2, 1.9, 0.4, 1),
  };
  function env(t, a, b, c, d, ein, eout) {
    if (t < a || t > d) return 0;
    if (t < b) return (ein || E.out)(lin(t, a, b));
    if (t <= c) return 1;
    return 1 - (eout || E.soft)(lin(t, c, d));
  }
  function spring(t, t0, freq = 2.2, damp = 6) {
    if (t <= t0) return 0;
    const u = t - t0;
    return 1 - Math.exp(-damp * u) * Math.cos(TAU * freq * u);
  }
  function shake(t, t0, amp, decay = 9, seed = 1) {
    if (t < t0) return [0, 0];
    const u = t - t0;
    const k = amp * Math.exp(-decay * u);
    if (k < 0.05) return [0, 0];
    return [k * Math.sin(u * 83 + seed), k * Math.cos(u * 71 + seed * 2.3)];
  }
  const per = (t, k, ph) => Math.sin((TAU * k * t) / DUR + (ph || 0));
  function flicker(t, seed) {
    return 0.5 * per(t, 37, seed) + 0.3 * per(t, 61, seed * 1.7) + 0.2 * per(t, 97, seed * 2.9);
  }

  function set(el, prop, v) {
    const c = el.__s || (el.__s = {});
    if (c[prop] === v) return;
    c[prop] = v;
    el.style.setProperty(prop, v);
  }
  function attr(el, name, v) {
    const c = el.__a || (el.__a = {});
    if (c[name] === v) return;
    c[name] = v;
    el.setAttribute(name, v);
  }
  function text(el, v) {
    if (el.__t === v) return;
    el.__t = v;
    el.textContent = v;
  }
  function op(el, a) {
    set(el, 'opacity', a <= 0.001 ? '0' : a >= 0.999 ? '1' : String(f3(a)));
    set(el, 'visibility', a <= 0.001 ? 'hidden' : 'visible');
  }
  const tf = (el, v) => set(el, 'transform', v);

  function h(tag, cls, parent, css, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) e.style.cssText = css;
    if (txt != null) e.textContent = txt;
    if (parent) parent.appendChild(e);
    return e;
  }
  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function svg(parent, w, h, inner, css, vb) {
    const e = document.createElementNS(NS, 'svg');
    e.setAttribute('width', w);
    e.setAttribute('height', h);
    e.setAttribute('viewBox', vb || `0 0 ${w} ${h}`);
    if (css) e.style.cssText = css;
    e.innerHTML = inner;
    if (parent) parent.appendChild(e);
    return e;
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

  const fmt = (n, dec = 0) => {
    const s0 = Math.abs(n).toFixed(dec);
    const [i, d] = s0.split('.');
    const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '-' : '') + g + (d ? '.' + d : '');
  };

  const qb = (p0, p1, p2, u) => [
    (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0],
    (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1],
  ];

  Object.assign(AR, {
    NS, TAU, DUR, clamp01, lin, mix, f2, f3, bezier, E, env, spring, shake, per, flicker,
    set, attr, text, op, tf, h, s, svg, rng, fmt, qb,
  });
})();
