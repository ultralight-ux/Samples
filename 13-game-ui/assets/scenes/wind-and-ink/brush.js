const Brush = (() => {
  function rng(seed) {
    let a = seed | 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const f1 = (v) => Math.round(v * 10) / 10;

  function noise1(R, k) {
    const v = Array.from({ length: k + 4 }, () => R() * 2 - 1);
    return (s) => {
      const x = clamp(s, 0, 1) * k, i = Math.min(k - 1, Math.floor(x)), f = x - i;
      const p0 = v[i], p1 = v[i + 1], p2 = v[i + 2], p3 = v[i + 3];
      return 0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
    };
  }

  const cr = (a, b, c, d, t, t2, t3) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  function centerline(ctrl, n) {
    const P = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
    const dense = [];
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      for (let j = 0; j < 24; j++) {
        const t = j / 24, t2 = t * t, t3 = t2 * t;
        dense.push([cr(p0[0], p1[0], p2[0], p3[0], t, t2, t3), cr(p0[1], p1[1], p2[1], p3[1], t, t2, t3)]);
      }
    }
    dense.push(ctrl[ctrl.length - 1]);
    const L = [0];
    for (let i = 1; i < dense.length; i++) L.push(L[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    const len = L[L.length - 1], out = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
      const target = (i / (n - 1)) * len;
      while (k < L.length - 2 && L[k + 1] < target) k++;
      const f = (target - L[k]) / Math.max(1e-6, L[k + 1] - L[k]);
      const x = dense[k][0] + (dense[k + 1][0] - dense[k][0]) * f;
      const y = dense[k][1] + (dense[k + 1][1] - dense[k][1]) * f;
      out.push({ x, y });
    }
    for (let i = 0; i < n; i++) {
      const a = out[Math.max(0, i - 1)], b = out[Math.min(n - 1, i + 1)];
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      out[i].tx = (b.x - a.x) / d; out[i].ty = (b.y - a.y) / d;
      out[i].nx = -out[i].ty; out[i].ny = out[i].tx;
    }
    return { pts: out, len };
  }

  function profile(s, o) {
    let w = 0.6 + 0.4 * smooth(0, o.entry, s);
    w *= 1 + o.press * Math.exp(-(((s - o.entry * 1.2) / 0.07) ** 2));
    w *= 1 - o.thin * s;
    if (o.tail === 'sweep') w *= Math.pow(1 - smooth(o.taperFrom, 1, s), 1.15) * 0.97 + 0.03;
    if (o.tail === 'stop') w *= 1 + 0.1 * Math.exp(-(((s - 0.93) / 0.05) ** 2));
    return w;
  }

  const pathOfPx = (pts) => 'M' + pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join('L') + 'Z';
  function pathOf10(pts) {
    let s = 'M';
    for (let i = 0; i < pts.length; i++) s += (i ? 'L' : '') + Math.round(pts[i][0] * 10) + ',' + Math.round(pts[i][1] * 10);
    return s + 'Z';
  }

  function stroke(ctrl, w, opt) {
    const o = Object.assign({
      seed: 1, tail: 'dry', press: 0.14, thin: 0.16, entry: 0.06, taperFrom: 0.5, oblique: 0.35,
      grain: 0.55, wobble: 0.05, split: 0.7, fingers: 9, bleed: 2.2, hairs: 2, n: 0, fk: 0,
    }, opt || {});
    const R = rng(o.seed * 7919 + 13);
    const pathOf = o.q10 ? pathOf10 : pathOfPx;
    const C = centerline(ctrl, o.n || Math.max(40, Math.min(220, Math.round(Math.hypot(ctrl[ctrl.length - 1][0] - ctrl[0][0], ctrl[ctrl.length - 1][1] - ctrl[0][1]) / 4))));
    const { pts, len } = C, n = pts.length;
    const lowL = noise1(R, 5), lowR = noise1(R, 5);
    const fk = o.fk || Math.max(8, Math.round(len / 5));
    const fineL = noise1(R, fk), fineR = noise1(R, fk);
    const W = (s) => w * profile(s, o);
    const sCore = o.tail === 'dry' ? o.split + (1 - o.split) * 0.5 : 1;
    const Wc = o.tail === 'dry'
      ? (s) => W(s) * (Math.pow(1 - smooth(o.split - 0.04, sCore, s), 0.85) * 0.94 + 0.06)
      : W;
    const Wv = new Float64Array(n), Wcv = new Float64Array(n), fineLv = new Float64Array(n);
    const offL = new Float64Array(n), offR = new Float64Array(n), fineRv = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1);
      Wv[i] = W(s); Wcv[i] = o.tail === 'dry' ? Wc(s) : Wv[i];
      fineLv[i] = fineL(s); fineRv[i] = fineR(s);
      offL[i] = 1 + o.wobble * lowL(s); offR[i] = 1 + o.wobble * lowR(s);
    }
    const sEnd = sCore;
    const iEnd = Math.round(sEnd * (n - 1));
    const outline = (extra, noisy) => {
      const out = [];
      const side = (i, sg) => {
        const p = pts[i], half = Wcv[i] / 2;
        const off = half * (sg > 0 ? offL[i] : offR[i]) + o.grain * (sg > 0 ? fineLv[i] : fineRv[i]) * noisy * Math.min(1, half / 3) + extra;
        out.push([p.x + p.nx * off * sg, p.y + p.ny * off * sg]);
      };
      for (let i = 0; i <= iEnd; i++) side(i, 1);
      {
        const p = pts[iEnd], h = Wcv[iEnd] / 2 + extra, capLen = o.tail === 'stop' ? 0.75 : 0.6;
        for (let k = 1; k < 10; k++) {
          const a = (k / 10) * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
          out.push([p.x + p.nx * h * ca + p.tx * h * capLen * sa, p.y + p.ny * h * ca + p.ty * h * capLen * sa]);
        }
      }
      for (let i = iEnd; i >= 0; i--) side(i, -1);
      {
        const p = pts[0], h = Wv[0] / 2 + extra;
        for (let k = 1; k < 12; k++) {
          const a = (k / 12) * Math.PI;
          const across = -Math.cos(a), back = Math.sin(a);
          const reach = h * (0.55 * back + o.oblique * 0.5 * (across + 1) * back);
          out.push([p.x + p.nx * h * across - p.tx * reach, p.y + p.ny * h * across - p.ty * reach]);
        }
      }
      return out;
    };
    const core = pathOf(outline(0, 1));
    const bleed = o.bleed > 0 ? pathOf(outline(o.bleed, 2.2)) : '';
    const fingers = [];
    if (o.tail === 'dry') {
      const K = o.fingers, split = o.split;
      for (let k = 0; k < K; k++) {
        const c = -0.5 + (k + 0.5) / K + (R() - 0.5) * 0.3 / K;
        const frac = (0.5 / K) * (0.7 + R() * 0.55);
        const edgeness = Math.abs(c) * 2;
        const s0 = split - 0.1;
        const s1 = clamp(split + (1 - split) * (0.3 + 0.7 * R()) * (1 - 0.4 * edgeness), split + 0.06, 1);
        const segs = [];
        let a = s0;
        for (let g = 0; g < 2; g++) {
          if (R() < 0.5) {
            const at = a + (s1 - a) * (0.4 + R() * 0.45), len = 0.01 + R() * 0.04;
            if (at + len < s1 - 0.02) { segs.push([a, at]); a = at + len; }
          }
        }
        segs.push([a, s1]);
        const drift = noise1(R, 4), thick = noise1(R, 6);
        for (const [a0, b] of segs) {
          if (b - a0 < 0.012) continue;
          const left = [], right = [];
          const m = Math.max(4, Math.round((b - a0) * n));
          const last = b >= s1 - 1e-6, first = a0 <= s0 + 1e-6;
          for (let j = 0; j <= m; j++) {
            const s = a0 + (b - a0) * (j / m), i = Math.round(s * (n - 1)), p = pts[i];
            const Ws = Wv[i] * (1 - 0.25 * smooth(split, 1, s));
            const tipOut = last ? Math.pow(1 - smooth(a0 + (b - a0) * 0.4, b, s), 0.75) : Math.pow(1 - smooth(b - 0.035, b, s), 0.6);
            const tipIn = first ? 1 : Math.pow(smooth(a0, a0 + 0.03, s), 0.6);
            const tip = tipOut * tipIn * (1 + 0.3 * thick(s));
            const hw = Ws * frac * tip + 0.18;
            const cc = c * Ws + (Ws / K) * 0.35 * drift(s) * smooth(split - 0.05, 1, s) + o.grain * fineLv[i] * 0.6;
            left.push([p.x + p.nx * (cc + hw), p.y + p.ny * (cc + hw)]);
            right.push([p.x + p.nx * (cc - hw), p.y + p.ny * (cc - hw)]);
          }
          fingers.push(pathOf([...left, ...right.reverse()]));
        }
      }
      for (let h = 0; h < o.hairs; h++) {
        const c = (R() - 0.5) * 0.7, a = Math.min(0.97, sEnd + 0.1 * R()), b = clamp(a + 0.18 + R() * 0.2, 0, 1);
        const left = [], right = [];
        const m = 8;
        for (let j = 0; j <= m; j++) {
          const s = a + (b - a) * (j / m), i = Math.round(s * (n - 1)), p = pts[i];
          const hw = 0.55 * (1 - j / m) + 0.1, cc = c * Wv[i];
          left.push([p.x + p.nx * (cc + hw), p.y + p.ny * (cc + hw)]);
          right.push([p.x + p.nx * (cc - hw), p.y + p.ny * (cc - hw)]);
        }
        fingers.push(pathOf([...left, ...right.reverse()]));
      }
    }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    const pad = w * 0.8 + o.bleed + 4;
    return {
      core, bleed, fingers, len,
      a: { x: pts[0].x, y: pts[0].y }, b: { x: pts[n - 1].x, y: pts[n - 1].y },
      bbox: { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad },
    };
  }

  function blob(R, x, y, r, stretch, ang, rough) {
    const m = 18, pts = [], nz = noise1(R, 6);
    for (let i = 0; i < m; i++) {
      const a = (i / m) * Math.PI * 2;
      const rr = r * (1 + rough * nz(i / m));
      const ex = Math.cos(a) * rr * stretch, ey = Math.sin(a) * rr;
      pts.push([x + ex * Math.cos(ang) - ey * Math.sin(ang), y + ex * Math.sin(ang) + ey * Math.cos(ang)]);
    }
    return pathOfPx(pts);
  }

  function splatter(seed, x, y, ang, opt) {
    const o = Object.assign({ size: 1, count: 26, spread: 0.7, reach: 260 }, opt || {});
    const R = rng(seed * 104729 + 7);
    const out = [];
    for (let i = 0; i < o.count; i++) {
      const a = ang + (R() - 0.5) * 2 * o.spread * (0.4 + 0.6 * R());
      const u = Math.pow(R(), 0.8), d = o.reach * u * o.size;
      const r = (0.7 + 7 * Math.pow(R(), 4) * (1 - 0.6 * u)) * o.size;
      out.push(blob(R, x + Math.cos(a) * d, y + Math.sin(a) * d, r, 1 + u * 1.5 + R() * 0.5, a, 0.3));
    }
    return out;
  }

  function enso(seed, cx, cy, r, w, opt) {
    const o = Object.assign({ a0: -2.2, sweep: 5.6 }, opt || {});
    const R = rng(seed * 31 + 3);
    const pts = [];
    const m = 14;
    for (let i = 0; i <= m; i++) {
      const a = o.a0 + (o.sweep * i) / m, rr = r * (1 + (R() - 0.5) * 0.03);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return stroke(pts, w, Object.assign({ seed, tail: 'dry', split: 0.78, thin: 0.35, press: 0.22, fingers: 7 }, o));
  }

  function sealEdge(seed, w, h, rough) {
    const R = rng(seed * 17 + 5), pts = [];
    const side = (x0, y0, x1, y1) => {
      for (let i = 0; i < 9; i++) {
        const f = i / 9;
        pts.push([x0 + (x1 - x0) * f + (R() - 0.5) * rough, y0 + (y1 - y0) * f + (R() - 0.5) * rough]);
      }
    };
    const c = rough * 0.8;
    side(c, 0, w - c, 0); side(w, c, w, h - c); side(w - c, h, c, h); side(0, h - c, 0, c);
    return pathOfPx(pts);
  }

  function sealVoids(seed, w, h, count) {
    const R = rng(seed * 61 + 9), out = [];
    for (let i = 0; i < count; i++) {
      const x = R() * w, y = R() * h, r = 0.35 + Math.pow(R(), 4) * 1.6;
      out.push(blob(R, x, y, r, 1 + R() * 2, R() * Math.PI, 0.3));
    }
    return out;
  }

  function frontClip(A, B, p, ext, jag) {
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    const tx = dx / L, ty = dy / L, nx = -ty, ny = tx;
    const fx = A.x + dx * p, fy = A.y + dy * p;
    const pts = [[fx - tx * 9000 + nx * ext, fy - ty * 9000 + ny * ext]];
    const m = jag.length;
    for (let i = 0; i < m; i++) {
      const u = 1 - (2 * i) / (m - 1);
      pts.push([fx + nx * ext * u + tx * jag[i], fy + ny * ext * u + ty * jag[i]]);
    }
    pts.push([fx - tx * 9000 - nx * ext, fy - ty * 9000 - ny * ext]);
    return 'polygon(' + pts.map((q) => f1(q[0]) + 'px ' + f1(q[1]) + 'px').join(',') + ')';
  }

  function jagFor(seed, m, amp) {
    const R = rng(seed * 13 + 1);
    return Array.from({ length: m }, (_, i) => (i === 0 || i === m - 1 ? 0 : (R() - 0.5) * 2 * amp));
  }

  return { rng, noise1, centerline, stroke, blob, splatter, enso, sealEdge, sealVoids, frontClip, jagFor, smooth, clamp };
})();
