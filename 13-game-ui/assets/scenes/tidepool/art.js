(() => {
  const C = {
    ink: '#3b335e', inkSoft: '#6b6491', foam: '#fff8ea', sand: '#f3e2c4', sandDeep: '#e3c99e',
    sea: '#7ed9c3', seaDeep: '#3fb4a6', coral: '#ff7c6e', coralDeep: '#e85a4f', yolk: '#ffcb4f',
    yolkDeep: '#f0a92e', pink: '#ff9dbf', pinkDeep: '#f07aa4', lilac: '#b9a6f2', lilacDeep: '#937cdf',
    blue: '#8ccbf3', blueDeep: '#5aa9e0', kelp: '#9ed27a', kelpDeep: '#6fb252', wood: '#d39a68',
    woodDeep: '#ab6f45', white: '#ffffff', silhouette: '#d9cfc8',
  };

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f = (n) => Math.round(n * 100) / 100;
  const pt = (p) => `${f(p[0])} ${f(p[1])}`;

  function slabPath(w, h, r, seed = 1, bulge = 3, jit = 0.14) {
    const rnd = mulberry32(seed * 7919 + 13);
    const rr = [0, 1, 2, 3].map(() => Math.min(r * (1 + (rnd() * 2 - 1) * jit), w / 2, h / 2));
    const fit = (i, j, len) => { const s = rr[i] + rr[j]; if (s > len) { rr[i] *= len / s; rr[j] *= len / s; } };
    fit(0, 1, w); fit(3, 2, w); fit(0, 3, h); fit(1, 2, h);
    const [a, b, c, d] = rr;
    const sideLen = [w - a - b, h - b - c, w - c - d, h - d - a];
    const bl = sideLen.map((L) => Math.min(bulge, Math.max(0, L) * 0.04) * (0.55 + 0.45 * rnd()) / 0.75);
    const k = 0.56;
    const side = (x0, y0, x1, y1, nx, ny, o) => {
      const c1 = [x0 + (x1 - x0) / 3 + nx * o, y0 + (y1 - y0) / 3 + ny * o];
      const c2 = [x0 + 2 * (x1 - x0) / 3 + nx * o, y0 + 2 * (y1 - y0) / 3 + ny * o];
      return ` C${pt(c1)} ${pt(c2)} ${f(x1)} ${f(y1)}`;
    };
    let s = `M${f(a)} 0`;
    s += side(a, 0, w - b, 0, 0, -1, bl[0]);
    s += ` C${f(w - b + k * b)} 0 ${f(w)} ${f(b - k * b)} ${f(w)} ${f(b)}`;
    s += side(w, b, w, h - c, 1, 0, bl[1]);
    s += ` C${f(w)} ${f(h - c + k * c)} ${f(w - c + k * c)} ${f(h)} ${f(w - c)} ${f(h)}`;
    s += side(w - c, h, d, h, 0, 1, bl[2]);
    s += ` C${f(d - k * d)} ${f(h)} 0 ${f(h - d + k * d)} 0 ${f(h - d)}`;
    s += side(0, h - d, 0, a, -1, 0, bl[3]);
    s += ` C0 ${f(a - k * a)} ${f(a - k * a)} 0 ${f(a)} 0Z`;
    return s;
  }

  function smoothClosed(P) {
    const n = P.length;
    let s = `M${pt(P[0])}`;
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      s += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
    }
    return s + 'Z';
  }

  function blobPath(cx, cy, rx, ry, seed = 1, o = {}) {
    const n = o.n || 3.4, irr = o.irr === undefined ? 0.045 : o.irr, count = o.pts || 28;
    const rnd = mulberry32(seed * 104729 + 7);
    const p1 = rnd() * 6.283, p2 = rnd() * 6.283, p3 = rnd() * 6.283;
    const a1 = 0.6 + rnd() * 0.6, a2 = 0.4 + rnd() * 0.6, a3 = rnd() * 0.5;
    const tilt = (rnd() - 0.5) * (o.tilt || 0);
    const P = [];
    for (let i = 0; i < count; i++) {
      const th = (i / count) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const ex = 2 / n;
      let x = Math.sign(c) * Math.pow(Math.abs(c), ex), y = Math.sign(s) * Math.pow(Math.abs(s), ex);
      const k = 1 + irr * (a1 * Math.sin(2 * th + p1) + a2 * Math.sin(3 * th + p2) + a3 * Math.sin(5 * th + p3)) / 1.6;
      x *= rx * k; y *= ry * k;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      P.push([cx + x * ct - y * st, cy + x * st + y * ct]);
    }
    return smoothClosed(P);
  }

  function foamPath(cx, cy, rx, ry, bumps, depth, phase, n = 2) {
    const P = [];
    const N = bumps * 6, ex = 2 / n;
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const x = Math.sign(c) * Math.pow(Math.abs(c), ex), y = Math.sign(s) * Math.pow(Math.abs(s), ex);
      const b = Math.abs(Math.sin(th * bumps / 2 + phase));
      const k = depth * (Math.pow(b, 0.6) - 0.5);
      const L = Math.hypot(x / rx, y / ry) || 1;
      const nx = x / rx / L, ny = y / ry / L;
      const nl = Math.hypot(nx, ny) || 1;
      P.push([cx + x * rx + (nx / nl) * k, cy + y * ry + (ny / nl) * k]);
    }
    return smoothClosed(P);
  }

  function pebble(o) {
    const w = o.w, h = o.h, sw = o.sw || 3.5, lipH = o.lipH === undefined ? 6 : o.lipH;
    const d = o.kind === 'blob'
      ? blobPath(w / 2, h / 2, w / 2, h / 2, o.seed || 1, o.blob || {})
      : slabPath(w, h, o.r || 24, o.seed || 1, o.bulge === undefined ? Math.min(4, w * 0.012 + 1) : o.bulge);
    const shapes = [d, ...(o.extra || [])];
    const pad = o.pad || 16;
    const shadowY = o.shadowY === undefined ? lipH + 7 : o.shadowY;
    const svgOpen = (cls) => `<svg class="${cls}" width="${w + pad * 2}" height="${h + pad * 2 + lipH + shadowY}" ` +
      `viewBox="${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2 + lipH + shadowY}" style="left:${-pad}px;top:${-pad}px">`;
    const union = (fill, tf) => {
      const at = tf ? ` transform="${tf}"` : '';
      return shapes.map((s) => `<path d="${s}"${at} fill="none" stroke="${C.ink}" stroke-width="${sw * 2}" stroke-linejoin="round"/>`).join('') +
        shapes.map((s) => `<path d="${s}"${at} fill="${fill}"/>`).join('');
    };
    let lip = svgOpen('lip');
    if (o.shadow !== false) {
      lip += shapes.length === 1
        ? `<path d="${d}" transform="translate(${o.shadowX || 0} ${shadowY})" fill="${C.ink}" fill-opacity="${o.shadowA || 0.2}"/>`
        : `<g opacity="${o.shadowA || 0.2}" transform="translate(${o.shadowX || 0} ${shadowY})">` +
          shapes.map((s) => `<path d="${s}" fill="${C.ink}" stroke="${C.ink}" stroke-width="${sw}"/>`).join('') + '</g>';
    }
    if (lipH > 0) lip += union(o.lip || C.sand, `translate(0 ${lipH})`);
    lip += '</svg>';
    let face = svgOpen('face') + (o.defs || '');
    face += union(o.face || C.foam);
    if (o.gloss !== false) {
      const gr = Math.min(o.r || 24, h * 0.42, w * 0.3);
      const gx = o.kind === 'blob' ? w * 0.16 : Math.max(7, gr * 0.32), gy = o.kind === 'blob' ? h * 0.2 : Math.max(7, gr * 0.32);
      const len = Math.min(w * 0.28, 90);
      face += `<path d="M${f(gx)} ${f(gy + gr * 0.55)} Q${f(gx)} ${f(gy)} ${f(gx + gr * 0.55)} ${f(gy)} L${f(gx + gr * 0.55 + len * 0.35)} ${f(gy)}" ` +
        `fill="none" stroke="#fff" stroke-opacity="${o.glossA || 0.75}" stroke-width="${o.glossW || 4}" stroke-linecap="round"/>`;
    }
    face += (o.inner || '') + '</svg>';
    return { lip, face, d, pad };
  }

  const NS = 'stroke="none"';
  const g = (sw, inner, ex = '') =>
    `<g fill="none" stroke="${C.ink}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${ex}>${inner}</g>`;
  const P = (d, fill = 'none', ex = '') => `<path d="${d}" fill="${fill}" ${ex}/>`;
  const Cc = (cx, cy, r, fill = 'none', ex = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${ex}/>`;
  const E = (cx, cy, rx, ry, fill = 'none', ex = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${ex}/>`;
  const fillOnly = (d, fill) => P(d, fill, NS);
  const line = (d, sw, color = C.ink) => P(d, 'none', `stroke="${color}" stroke-width="${f(sw)}"`);
  const tube = (d, color, w, sw) => P(d, 'none', `stroke-width="${f(w + 2 * sw)}"`) + P(d, 'none', `stroke="${color}" stroke-width="${f(w)}"`);
  const eye = (x, y, r = 2.6) => Cc(x, y, r, C.ink, NS) + Cc(x - r * 0.32, y - r * 0.38, r * 0.4, '#fff', NS);
  const blush = (x, y, s = 1) => E(x, y, 2.8 * s, 1.7 * s, C.pink, NS + ' fill-opacity=".85"');
  const smile = (x, y, w, sw) => P(`M${f(x - w)} ${f(y)} Q${f(x)} ${f(y + w)} ${f(x + w)} ${f(y)}`, 'none', `stroke-width="${f(sw * 0.75)}"`);
  const hl = (x, y, rx, ry, rot = -30, a = 0.8) => E(0, 0, rx, ry, '#fff', NS + ` fill-opacity="${a}" transform="translate(${f(x)} ${f(y)}) rotate(${rot})"`);
  const pol = (cx, cy, a, r) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const face = (x, y, gap, sw, s = 1) => eye(x - gap, y, 2.5 * s) + eye(x + gap, y, 2.5 * s) + smile(x, y + 4.2 * s, 2.6 * s, sw) +
    blush(x - gap - 3.2 * s, y + 4 * s, s) + blush(x + gap + 3.2 * s, y + 4 * s, s);

  const CRITTERS = {
    star(sw) {
      let d = '';
      for (let k = 0; k < 5; k++) {
        const a = -90 + 72 * k;
        const v1 = pol(32, 34, a - 36, 11.5), v2 = pol(32, 34, a + 36, 11.5);
        const c1 = pol(32, 34, a - 15, 33), c2 = pol(32, 34, a + 15, 33);
        d += (k === 0 ? `M${pt(v1)}` : '') + ` C${pt(c1)} ${pt(c2)} ${pt(v2)}`;
      }
      d += 'Z';
      let dots = '';
      for (let k = 0; k < 5; k++) {
        const a = -90 + 72 * k;
        dots += Cc(...pol(32, 34, a, 19), 2.1, '#ee6a4d', NS) + Cc(...pol(32, 34, a + 9, 14.5), 1.3, '#ee6a4d', NS);
      }
      let swirl = '';
      for (let k = 0; k < 5; k++) {
        const a = -90 + 72 * k + 36;
        const p0 = pol(32, 34, a, 4), p1 = pol(32, 34, a + 40, 10);
        swirl += line(`M${pt(p0)} Q${pt(pol(32, 34, a + 35, 5))} ${pt(p1)}`, sw * 0.5, '#ee6a4d');
      }
      return P(d, '#ffa47e') + dots + hl(22, 22, 3.2, 1.8, -50) + face(32, 33, 4.6, sw, 0.9);
    },
    octopus(sw) {
      return E(32, 57, 22, 4.2, C.foam) +
        P('M17 38 C15 12 49 12 47 38 Z', C.pink) + hl(24, 19, 3.4, 2, -40) + face(32, 26, 5, sw, 1) +
        P('M50 40 C59 39 59 51 48 50', 'none') +
        P('M13 36 H51 L48 50 Q47 55.5 41 55.5 H23 Q17 55.5 16 50 Z', C.foam) +
        fillOnly('M14.6 41.5 H49.4 L48.7 45.2 H15.3 Z', C.blue) +
        P('M13 36 H51 L48 50 Q47 55.5 41 55.5 H23 Q17 55.5 16 50 Z') + hl(20, 47, 1.4, 3, 10, 0.9) +
        tube('M21 36 C14 35 10 40 13 44 C15 46 18 44.5 17 42', C.pink, 4.2, sw) +
        tube('M43 36 C50 35 54 40 51 44 C49 46 46 44.5 47 42', C.pink, 4.2, sw);
    },
    crab(sw) {
      let legs = '';
      for (const s of [-1, 1]) {
        const x = (v) => 32 + s * v;
        legs += P(`M${x(14)} 42 L${x(23)} 45`) + P(`M${x(14)} 46 L${x(22)} 51`) + P(`M${x(12)} 49 L${x(18)} 55`);
      }
      const claw = (cx, s) => P(`M${cx - 7 * s} 22 C${cx - 8 * s} 12 ${cx + 6 * s} 9 ${cx + 7 * s} 18 L${cx + 1 * s} 19 L${cx + 6 * s} 24 C${cx + 3 * s} 30 ${cx - 6 * s} 30 ${cx - 7 * s} 22 Z`, '#ff9a4d');
      return legs +
        tube('M22 36 Q16 31 14 25', '#ff9a4d', 3.6, sw) + tube('M42 36 Q48 31 50 25', '#ff9a4d', 3.6, sw) +
        claw(13, 1) + claw(51, -1) + hl(10, 15, 1.6, 1.1, -40) + hl(54, 15, 1.6, 1.1, 40) +
        tube('M27 33 L26 25', '#ff9a4d', 2.6, sw) + tube('M37 33 L38 25', '#ff9a4d', 2.6, sw) +
        E(32, 41, 18, 12, '#ff9a4d') + fillOnly('M17.5 44 C22 52 42 52 46.5 44 C40 47 24 47 17.5 44 Z', '#f27d33') +
        E(32, 41, 18, 12) +
        Cc(26, 23, 3.8, '#fff') + Cc(38, 23, 3.8, '#fff') + Cc(26.4, 23.4, 1.7, C.ink, NS) + Cc(37.6, 23.4, 1.7, C.ink, NS) +
        smile(32, 39, 3, sw) + blush(23, 40) + blush(41, 40) + hl(24, 34, 3, 1.6, -20);
    },
    snail(sw) {
      return P('M8 50 C8 44 15 42 24 42 H44 C52 42 57 46 57 50 C57 53.5 53 55 48 55 H13 C10 55 8 53 8 50 Z', '#c4f0e0') +
        tube('M14 44 L11 34', '#c4f0e0', 2.6, sw) + tube('M19 43 L19 33', '#c4f0e0', 2.6, sw) +
        Cc(11, 32.5, 2.4, C.ink, NS) + Cc(19, 31.5, 2.4, C.ink, NS) +
        Cc(38, 32, 16, C.lilac) + Cc(38, 32, 11.5, 'none', `stroke="${C.lilacDeep}" stroke-width="${f(sw * 0.6)}"`) +
        Cc(34.5, 28.5, 2, C.lilacDeep, NS) + Cc(41.5, 28.5, 2, C.lilacDeep, NS) + Cc(34.5, 35.5, 2, C.lilacDeep, NS) + Cc(41.5, 35.5, 2, C.lilacDeep, NS) +
        hl(30, 23, 3.2, 1.8, -40) + smile(15, 49.5, 2.2, sw) + blush(21, 49);
    },
    goby(sw) {
      const body = 'M8 33 C8 23 20 19 32 21 C42 22 50 27 50 33 C50 39 42 44 32 45 C20 47 8 43 8 33 Z';
      return P('M47 33 L58 24 Q61 33 58 42 Z', C.blue) +
        P('M19 24 C22 11 36 7 45 19 C38 17 29 19 24 26 Z', C.yolk) +
        fillOnly(body, C.blue) +
        line('M26 22 C23.5 29 23.5 37 26 44', 4.2, C.yolk) + line('M37 23 C35 29 35 37 37 43', 4.2, C.yolk) +
        fillOnly('M10 37 C16 44 30 46 40 44 C45 42 48 40 49.5 36 C40 41 22 42 10 37 Z', C.blueDeep) +
        P(body) + P('M28 35 C30 40 35 41 37 38', C.blueDeep) +
        Cc(17, 30, 4.2, '#fff') + Cc(16.4, 30.4, 2, C.ink, NS) + P('M9.5 35.5 Q11.5 37 13 35.6', 'none', `stroke-width="${f(sw * 0.7)}"`) +
        hl(22, 25, 3, 1.5, -15) + blush(20, 36.5, 0.8);
    },
    urchin(sw) {
      let spines = '';
      for (let k = 0; k < 14; k++) {
        const a = k * (360 / 14) + 6;
        spines += tube(`M${pt(pol(32, 35, a, 12))} L${pt(pol(32, 35, a, 25))}`, '#8a70d6', 3, sw);
      }
      return spines + Cc(32, 35, 16.5, C.lilac) +
        fillOnly('M17 39 C20 50 44 50 47 39 C42 45 22 45 17 39 Z', '#9f88e6') + Cc(32, 35, 16.5) +
        hl(24, 26, 3.4, 2, -40) + face(32, 35, 5, sw);
    },
    anemone(sw) {
      const tips = [[13, 14], [19, 8], [27, 5], [36, 5], [44, 8], [51, 14]];
      let t = '';
      tips.forEach(([x, y], i) => {
        const bx = 21 + i * 4.4;
        t += tube(`M${f(bx)} 32 C${f(bx)} 22 ${f(x + (i < 3 ? 6 : -6))} ${f(y + 10)} ${f(x)} ${f(y)}`, '#ffb6d0', 3.6, sw);
      });
      tips.forEach(([x, y]) => { t += Cc(x, y, 3.2, '#ffe0eb'); });
      return t + P('M17 32 H47 C47 43 45 53 40 56 H24 C19 53 17 43 17 32 Z', C.sea) +
        line('M25 36 C25 43 26 49 27 53', 2.4, C.seaDeep) + line('M39 36 C39 43 38 49 37 53', 2.4, C.seaDeep) +
        P('M17 32 H47 C47 43 45 53 40 56 H24 C19 53 17 43 17 32 Z') +
        face(32, 42, 4.6, sw, 0.9) + hl(21, 36, 1.4, 3, 10);
    },
    jelly(sw) {
      return tube('M24 40 C20 46 27 50 22 57', '#c9b8f5', 2.6, sw) + tube('M32 41 C29 48 35 51 31 58', '#c9b8f5', 2.6, sw) +
        tube('M40 40 C44 46 37 50 42 57', '#c9b8f5', 2.6, sw) +
        P('M11 38 C10 19 54 19 53 38 Q48.75 43 44.5 38 Q40.25 43 36 38 Q31.75 43 27.5 38 Q23.25 43 19 38 Q15 43 11 38 Z', '#bfe3fb') +
        fillOnly('M17.5 32 C17.5 27 21.5 23.5 27 22.8 C22.5 25 20.5 28 20.5 32 Z', '#fff') + face(32, 30, 5, sw);
    },
    slug(sw) {
      const body = 'M7 45 C7 37 19 32 32 32 C46 32 57 38 57 46 C57 50.5 53 53 47 53 H15 C10 53 7 50 7 45 Z';
      let gills = '';
      for (let k = 0; k < 5; k++) {
        const a = -150 + k * 30;
        gills += tube(`M45 34 L${pt(pol(45, 34, a, 9))}`, '#ffb24d', 3, sw);
      }
      return gills + tube('M16 35 L12.5 25', '#ffb24d', 2.8, sw) + tube('M23 33.5 L23 23.5', '#ffb24d', 2.8, sw) +
        P(body, '#ffdb63') + fillOnly('M9 47 C14 52 40 52 55 49 C53 52 50 53 47 53 H15 C11 53 9 50 9 47 Z', '#f6be3f') + P(body) +
        Cc(30, 38, 2.2, '#ff9a4d', NS) + Cc(38, 41, 1.8, '#ff9a4d', NS) + Cc(47, 44, 2.2, '#ff9a4d', NS) + Cc(36, 47, 1.5, '#ff9a4d', NS) +
        eye(15, 42, 2.3) + eye(22, 41.5, 2.3) + smile(18.5, 46, 2.2, sw) + hl(28, 34.5, 3, 1.3, -8);
    },
    shrimp(sw) {
      const body = 'M21 47 C17 35 27 22 42 22 C50 22 56.5 27.5 55.5 34 C54.5 39.5 48 42 42 41 C35 41 29 44 27 50 Z';
      return line('M53.5 29 C61 21 59 9 49 6.5', sw * 0.7) +
        line('M51.5 27.5 C53 17 47 10 40 11', sw * 0.85) +
        P('M24.5 47 C19 44 12 44.5 9.5 48.5 C12 50.5 14.5 51 16 51 C13.5 53 12.5 56.5 14 59 C18.5 58 23 54.5 27 50.5 Z', '#ff7a52') +
        line('M13 48.5 L22 49 M16.5 56 L23 50.5', sw * 0.5, '#e8603d') +
        P('M33 41.5 L31.5 48 M37.5 41 L37 47.5 M42 41.2 L43 46.5', 'none') +
        P(body, '#ff8f5e') +
        fillOnly('M23 45 C25 41 31 38 38 38.5 C44 39 50 38 54 34.5 C53 39.5 48 42 42 41 C35 41 29 44 27 50 Z', '#ffc2a2') +
        line('M28.5 27.5 Q34 33 31 41.5', sw * 0.55, '#e8603d') + line('M35 24 Q40 30 37.5 39.5', sw * 0.55, '#e8603d') +
        P(body) + P('M55 33 L60.5 31.5', 'none') +
        eye(47.5, 29.5, 2.8) + blush(51, 35, 0.8) + hl(36, 25.5, 3.2, 1.4, -10) +
        Cc(38.5, 11.5, 5.4, C.yolk) + hl(36.8, 9.6, 1.6, 1.1, -30, 1);
    },
    hermit(sw) {
      return Cc(38, 30, 15, C.lilac) + P('M8 48 C8 40 16 38 24 40 L30 44 C30 50 24 54 16 54 C10 54 8 52 8 48 Z', '#f9a') +
        Cc(16, 36, 7, '#f9a') + P('M24 26 L20 18 M30 24 L29 15') + Cc(20, 17, 2.4) + Cc(29, 14, 2.4) +
        P('M22 52 L20 58 M28 51 L28 58 M34 50 L36 57');
    },
    seapig(sw) {
      return P('M10 40 C10 30 22 26 32 26 C44 26 56 31 56 40 C56 47 46 50 32 50 C18 50 10 47 10 40 Z', '#f9a') +
        P('M16 49 L15 55 M24 50 L24 57 M32 50 L32 57 M40 50 L40 57 M48 48 L49 55') +
        P('M18 28 L14 18 M26 26 L25 16') + Cc(14, 17, 2.6) + Cc(25, 15, 2.6);
    },
  };

  const TOOLS = {
    net(sw) {
      const cx = 41, cy = 22, rx = 15, ry = 12.5;
      const vx = rx * Math.cos(Math.PI / 3), hy = ry * Math.sin(Math.PI / 6);
      const vy = ry * Math.sin(Math.PI / 3), hx = rx * Math.cos(Math.PI / 6);
      const mesh = [[cx - vx, cy - vy, cx - vx, cy + vy], [cx + vx, cy - vy, cx + vx, cy + vy], [cx, cy - ry, cx, cy + ry],
        [cx - hx, cy - hy, cx + hx, cy - hy], [cx - hx, cy + hy, cx + hx, cy + hy]]
        .map(([a, b, c, d]) => line(`M${f(a)} ${f(b)} L${f(c)} ${f(d)}`, sw * 0.45, C.inkSoft)).join('');
      return tube('M10 56 L30 32', C.wood, 5, sw) + `<g transform="rotate(-18 ${cx} ${cy})">` +
        E(cx, cy, rx, ry, '#ffffff', 'fill-opacity=".7" stroke="none"') + mesh + tube(`M${cx - rx} ${cy} A${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`, C.sea, 3.4, sw) + '</g>' +
        hl(14, 50, 1, 2.2, 40);
    },
    rod(sw) {
      return line('M49 9 Q59 20 55.5 33.5', sw * 0.5) + tube('M9 57 L49 9', C.wood, 4.2, sw) +
        line('M9 57 L19 45', 5.2, C.woodDeep) + Cc(21, 46, 6.2, C.foam) + Cc(21, 46, 2, C.ink, NS) +
        Cc(55.5, 40, 6.4, '#fff') + P('M49.1 40 A6.4 6.4 0 0 1 61.9 40 Z', C.coral) + Cc(55.5, 40, 6.4) +
        line('M55.5 33.6 L55.5 31', sw * 0.8);
    },
    shovel(sw) {
      return `<g transform="rotate(38 32 32)">` + tube('M32 56 L32 27', C.wood, 4.6, sw) + tube('M25 57 L39 57', C.woodDeep, 4.2, sw) +
        P('M22.5 29 H41.5 C41.5 18 38 9.5 32 5.5 C26 9.5 22.5 18 22.5 29 Z', C.sea) +
        fillOnly('M32 26 C36 26 39 22 38.5 16 C37 11 34.5 8.5 32 7 Z', C.seaDeep) +
        P('M22.5 29 H41.5 C41.5 18 38 9.5 32 5.5 C26 9.5 22.5 18 22.5 29 Z') + hl(27, 17, 1.4, 4, 8) + '</g>';
    },
    can(sw) {
      return tube('M42 45 L55 27', C.blue, 4.4, sw) + E(0, 0, 4.5, 6, C.blue, 'transform="translate(56.5 24.5) rotate(36)"') +
        P('M19 26 C18 13 37 13 37 26', 'none', `stroke-width="${f(sw + 3.6)}"`) + P('M19 26 C18 13 37 13 37 26', 'none', `stroke="${C.blue}" stroke-width="3.6"`) +
        P('M14 27 H42 Q46 27 46 31 V51 Q46 55.5 41.5 55.5 H18.5 Q14 55.5 14 51 V31 Q14 27 18 27 Z', C.blue) +
        fillOnly('M15.8 44 H44.2 V51 Q44.2 53.8 41.4 53.8 H18.6 Q15.8 53.8 15.8 51 Z', C.blueDeep) +
        P('M14 27 H42 Q46 27 46 31 V51 Q46 55.5 41.5 55.5 H18.5 Q14 55.5 14 51 V31 Q14 27 18 27 Z') +
        Cc(30, 37, 4.5, C.yolk) + hl(19, 33, 1.3, 3.2, 0) +
        P('M58 34 q2 3 0 4.5 q-2 -1.5 0 -4.5 Z', C.blue) + P('M51 37 q2 3 0 4.5 q-2 -1.5 0 -4.5 Z', C.blue);
    },
    pail(sw) {
      return P('M16 27 C16 7 48 7 48 27', 'none', `stroke-width="${f(sw * 0.8)}"`) +
        P('M13 28 H51 L47 51 Q46 56 40.5 56 H23.5 Q18 56 17 51 Z', C.coral) +
        fillOnly('M15.6 42 H48.4 L47 51 Q46 54.3 40.5 54.3 H23.5 Q18 54.3 17 51 Z', C.coralDeep) +
        P('M13 28 H51 L47 51 Q46 56 40.5 56 H23.5 Q18 56 17 51 Z') +
        tube('M11 27.5 H53', C.coral, 5, sw) + E(32, 26.6, 17, 1.6, C.sea, NS) +
        P(starPath(32, 39, 6.2, 2.8), C.yolk) + hl(19.5, 35, 1.3, 3, 8);
    },
    bait(sw) {
      return P('M17 22 H47 V50 Q47 56 41 56 H23 Q17 56 17 50 Z', '#e4f6f2') +
        tube('M24 49 C27 40 33 52 37 43 C39 39 42 41 41.5 36', C.pink, 3.4, sw) +
        P('M17 22 H47 V50 Q47 56 41 56 H23 Q17 56 17 50 Z') +
        P('M14 13.5 Q14 11 16.5 11 H47.5 Q50 11 50 13.5 V20 Q50 22.5 47.5 22.5 H16.5 Q14 22.5 14 20 Z', C.coral) +
        line('M20 16.8 H44', sw * 0.5, C.coralDeep) + hl(21.5, 33, 1.2, 4, 0);
    },
    berries(sw) {
      return P('M33 27 C31 17 39 9 49 10 C49 20 42 27 33 27 Z', C.kelp) + line('M35 25 C39 19 43 15 47 12.5', sw * 0.5, C.kelpDeep) +
        P('M30 30 C30 24 32 21 35 18', 'none') +
        Cc(24.5, 39, 11.5, C.pink) + fillOnly('M14 42 C16 49 30 52 35 43 C30 49 18 48 14 42 Z', C.pinkDeep) + Cc(24.5, 39, 11.5) +
        Cc(41, 43, 10, C.lilac) + fillOnly('M31.6 45 C34 52 47 53 50.6 46 C46 51 36 51 31.6 45 Z', C.lilacDeep) + Cc(41, 43, 10) +
        hl(19.5, 34, 2.6, 1.6, -40) + hl(37, 38.5, 2.2, 1.4, -40);
    },
  };

  function starPath(cx, cy, R, r, points = 5, rot = -90) {
    const p = [];
    for (let i = 0; i < points * 2; i++) p.push(pol(cx, cy, rot + i * 180 / points, i % 2 ? r : R));
    return `M${p.map(pt).join(' L')}Z`;
  }
  function sparklePath(cx, cy, R, k = 0.22) {
    const r = R * k;
    const seg = (x0, y0, x1, y1) => ` C${f(cx + x0 * r)} ${f(cy + y0 * r)} ${f(cx + x1 * r)} ${f(cy + y1 * r)}`;
    return `M${f(cx)} ${f(cy - R)}` + seg(0, -1, 1, 0) + ` ${f(cx + R)} ${f(cy)}` + seg(1, 0, 0, 1) + ` ${f(cx)} ${f(cy + R)}` +
      seg(0, 1, -1, 0) + ` ${f(cx - R)} ${f(cy)}` + seg(-1, 0, 0, -1) + ` ${f(cx)} ${f(cy - R)}Z`;
  }

  const APPS = {
    journal(sw) {
      return P('M15 13 Q15 10 18 10 H45 Q50 10 50 15 V50 Q50 54 46 54 H18 Q15 54 15 51 Z', C.foam) +
        fillOnly('M16.8 11.8 H22 V52.2 H18 Q16.8 52.2 16.8 51 Z', C.coral) + line('M22 11 V53', sw * 0.7) +
        P('M15 13 Q15 10 18 10 H45 Q50 10 50 15 V50 Q50 54 46 54 H18 Q15 54 15 51 Z') +
        P('M41 10 V22 L44.5 19 L48 22 V12', C.yolk) +
        P('M26 34 C29 28 37 27 41 32 L45.5 28 L45.5 38 L41 34.5 C37 39 29 39 26 34 Z', C.sea) + Cc(30.5, 33, 1.4, C.ink, NS);
    },
    map(sw) {
      return P('M9 17 L23 11 L40 17 L55 11 V46 L40 52 L23 46 L9 52 Z', C.foam) +
        fillOnly('M23 11 L40 17 V52 L23 46 Z', '#f3ead6') +
        P(blobPath(31, 33, 10, 7, 3, { n: 2.2, irr: 0.25, pts: 10 }), C.kelp) + line('M23 11 V46 M40 17 V52', sw * 0.6) +
        P('M9 17 L23 11 L40 17 L55 11 V46 L40 52 L23 46 L9 52 Z') +
        P('M46 30 C41 24 43 18 47.5 18 C52 18 54 24 49 30 L47.5 32 Z', C.coral) + Cc(47.5, 22.5, 1.8, '#fff', NS);
    },
    camera(sw) {
      return P('M19 19 L22 13.5 H34 L37 19', C.foam) +
        P('M10 23 Q10 19 14 19 H50 Q54 19 54 23 V47 Q54 51 50 51 H14 Q10 51 10 47 Z', C.foam) +
        Cc(32, 35, 11, C.lilacDeep) + Cc(32, 35, 6, C.blue) + hl(29, 32, 2, 1.3, -40, 1) +
        Cc(47, 26, 2.6, C.coral, NS);
    },
    bottle(sw) {
      return `<g transform="rotate(-32 32 34)">` + P('M27 9 H37 V16 H27 Z', C.wood) +
        P('M27 16 H37 V22 C45 25 46 31 46 37 V51 Q46 56 41 56 H23 Q18 56 18 51 V37 C18 31 19 25 27 22 Z', '#d5f2fc') +
        P('M25.5 34 H38.5 V48 H25.5 Z', C.foam) + line('M28 38.5 H36 M28 42.5 H34.5', sw * 0.55, C.inkSoft) +
        hl(22, 40, 1.4, 5, 0, 0.95) + '</g>';
    },
    tides(sw) {
      return P('M8 41 C13 27 26 21 34 27 C29 29 27.5 35.5 33 39.5 C39 43.5 48 40 56 35 V53 Q56 55 54 55 H10 Q8 55 8 53 Z', C.foam) +
        line('M14 48 C20 45 26 47 32 48', sw * 0.6, C.seaDeep) +
        P('M47 9 C40 10 37 18 41 24 C44.5 28 50.5 28 54 24.5 C48.5 24.5 45 19 47 9 Z', C.yolk);
    },
    recipes(sw) {
      return P('M32 52 C18 50 13 36 20 22 C30 26 36 38 32 52 Z', C.kelp) + line('M31 48 C29 38 26 31 21 25', sw * 0.55, C.kelpDeep) +
        `<g transform="rotate(35 38 30)">` + tube('M38 22 V54', C.wood, 4.6, sw) +
        P('M28 12 Q28 9 31 9 H45 Q48 9 48 12 V20 Q48 23 45 23 H31 Q28 23 28 20 Z', C.foam) + '</g>';
    },
    stamps(sw) {
      let d = '';
      const x0 = 12, y0 = 10, x1 = 52, y1 = 54, rr = 2.6;
      const edge = (ax, ay, bx, by, n) => {
        let s = '';
        for (let i = 0; i < n; i++) {
          const t1 = (i + 1) / n;
          const mx = ax + (bx - ax) * (i + 0.5) / n, my = ay + (by - ay) * (i + 0.5) / n;
          const nx = (by - ay) === 0 ? 0 : (by > ay ? -1 : 1), ny = (bx - ax) === 0 ? 0 : (bx > ax ? 1 : -1);
          s += ` Q${f(mx + nx * rr * 1.6)} ${f(my + ny * rr * 1.6)} ${f(ax + (bx - ax) * t1)} ${f(ay + (by - ay) * t1)}`;
        }
        return s;
      };
      d = `M${x0} ${y0}` + edge(x0, y0, x1, y0, 7) + edge(x1, y0, x1, y1, 8) + edge(x1, y1, x0, y1, 7) + edge(x0, y1, x0, y0, 8) + 'Z';
      return P(d, C.foam) + P('M18 16 H46 V48 H18 Z', C.pink) + P(starPath(32, 33, 10, 4.6), C.yolk) +
        hl(22, 21, 1.2, 2.4, 0, 0.9);
    },
    shop(sw) {
      let scal = '';
      for (let i = 0; i < 5; i++) scal += ` Q${f(13 + i * 7.6)} 34 ${f(16.8 + i * 7.6)} 28.5`;
      return P('M14 30 H50 V52 Q50 55 47 55 H17 Q14 55 14 52 Z', C.foam) + P('M27 40 H37 V55 H27 Z', C.coral) +
        P(`M9 28.5 L13 12 H51 L55 28.5 H9.2 Z`, C.coral) +
        fillOnly('M20.6 12.6 H28.2 L27 28 H18.6 Z M35.8 12.6 H43.4 L45.4 28 H37 Z', '#fff') +
        P(`M9 28.5 L13 12 H51 L55 28.5`) + P(`M9 28.5${scal} Q51 34 55 28.5`, C.coral);
    },
    radio(sw) {
      return line('M20 20 L44 9', sw * 0.9) + Cc(44, 9, 2.4, C.yolk) +
        P('M9 24 Q9 20 13 20 H51 Q55 20 55 24 V49 Q55 53 51 53 H13 Q9 53 9 49 Z', C.foam) +
        Cc(23, 37, 9, C.blue) + Cc(23, 37, 3.4, C.blueDeep, NS) +
        P('M37 29 H48 V35 H37 Z', C.yolk) + Cc(40, 44, 2.6, C.coral) + Cc(47, 44, 2.6, C.kelp);
    },
  };

  const GLYPHS = {
    sanddollar(sw) {
      let petals = '';
      for (let k = 0; k < 5; k++) {
        const a = -90 + 72 * k;
        const tip = pol(32, 32, a, 15), l = pol(32, 32, a - 12, 9), r = pol(32, 32, a + 12, 9);
        petals += P(`M${pt(pol(32, 32, a, 5))} Q${pt(l)} ${pt(tip)} Q${pt(r)} ${pt(pol(32, 32, a, 5))}Z`, '#e8b85c', NS);
      }
      return Cc(32, 32, 24, '#ffd98a') + fillOnly('M12 40 C18 54 46 54 52 40 C46 49 18 49 12 40 Z', '#f5c56a') + Cc(32, 32, 24) +
        petals + Cc(32, 32, 2.4, '#e8b85c', NS) + hl(20, 20, 3.4, 2, -40);
    },
    sun(sw) {
      let rays = '';
      for (let k = 0; k < 8; k++) rays += tube(`M${pt(pol(32, 32, k * 45, 19))} L${pt(pol(32, 32, k * 45, 25))}`, C.yolk, 3.4, sw);
      return rays + Cc(32, 32, 13, C.yolk) + hl(27, 27, 2.6, 1.6, -40);
    },
    sunset(sw) {
      let rays = '';
      for (let k = 0; k < 5; k++) rays += tube(`M${pt(pol(32, 38, 180 + 22.5 + k * 33.75, 18))} L${pt(pol(32, 38, 180 + 22.5 + k * 33.75, 24))}`, '#ffb04d', 3.2, sw);
      return rays + P('M18 38 A14 14 0 0 1 46 38 Z', '#ffb04d') +
        P('M8 40 C14 36 18 44 24 40 C30 36 34 44 40 40 C46 36 50 44 56 40', 'none') +
        P('M14 48 C20 45 26 50 32 47 C38 44 44 49 50 47', 'none', `stroke="${C.seaDeep}"`);
    },
    moon(sw) {
      return P('M36 10 C24 11 17 22 20 34 C23 46 37 52 48 46 C36 46 28 36 30 25 C31 18 33 13 36 10 Z', C.yolk) +
        P(sparklePath(46, 20, 6.5), '#fff6d8') + Cc(52, 33, 2, '#fff6d8', NS) + hl(25, 26, 1.4, 4, 15);
    },
    wave(sw) {
      return P('M6 38 C12 24 25 19 32 25 C27.5 27 26.5 33 31 36.5 C37 41 46 38 58 31 V50 Q58 53 55 53 H9 Q6 53 6 50 Z', C.sea) +
        line('M13 45 C20 42 26 45 32 45', sw * 0.6, C.seaDeep);
    },
    pin(sw) { return P('M32 54 C20 40 17 32 17 26 C17 17 24 11 32 11 C40 11 47 17 47 26 C47 32 44 40 32 54 Z', C.coral) + Cc(32, 26, 6, C.foam); },
    clock(sw) {
      return Cc(32, 33, 19, C.foam) + P('M32 21 V33 L40 38', 'none') + Cc(32, 33, 2, C.ink, NS);
    },
    ruler(sw) {
      return `<g transform="rotate(-30 32 32)">` + P('M8 24 H56 V40 H8 Z', C.yolk) +
        line('M16 24 V31 M24 24 V29 M32 24 V31 M40 24 V29 M48 24 V31', sw * 0.6) + '</g>';
    },
    blossom(sw) {
      let p = '';
      for (let k = 0; k < 5; k++) p += Cc(...pol(32, 32, -90 + k * 72, 11), 9, C.pink);
      return p + Cc(32, 32, 7, C.yolk);
    },
    leaf(sw) { return P('M14 50 C12 30 26 14 52 12 C52 36 38 52 14 50 Z', '#ffa24d') + line('M16 48 C26 38 36 28 46 18', sw * 0.6, '#e07a2a'); },
    snow(sw) {
      let s = '';
      for (let k = 0; k < 3; k++) s += P(`M${pt(pol(32, 32, k * 60, 20))} L${pt(pol(32, 32, k * 60 + 180, 20))}`, 'none');
      return s + Cc(32, 32, 5, C.blue);
    },
    check(sw) { return P('M17 33 L28 44 L48 21', 'none', `stroke-width="${f(sw * 1.6)}"`); },
    bug(sw) {
      return P('M24 20 L19 12 M40 20 L45 12', 'none') + Cc(32, 22, 8, C.ink, NS) +
        P('M12 38 C12 26 21 19 32 19 C43 19 52 26 52 38 C52 50 43 56 32 56 C21 56 12 50 12 38 Z', C.coral) +
        line('M32 21 V55', sw) + Cc(23, 33, 3.4, C.ink, NS) + Cc(41, 33, 3.4, C.ink, NS) + Cc(24, 46, 2.8, C.ink, NS) + Cc(40, 46, 2.8, C.ink, NS) +
        hl(20, 27, 2.6, 1.5, -40);
    },
    sparkle(sw) { return P(sparklePath(32, 32, 24), C.yolk); },
  };

  function puffin(sw) {
    const beak = 'M60 39 C71 40 83 49 86 58 C83 63 72 67 60 66 C62.5 57 62.5 48 60 39 Z';
    return P('M16 100 C16 78 32 70 48 70 C64 70 80 78 80 100 Z', '#4a4774') +
      P('M34 100 C34 86 40 79 48 79 C56 79 62 86 62 100 Z', '#fff') +
      Cc(46, 50, 28, '#4a4774') +
      P('M26 53 C25 40 34 33 45 33 C56 33 64 41 63 53 C62 63 55 68 45 68 C35 68 27 62 26 53 Z', '#eeebf3') +
      P(beak, '#ff7a45') +
      fillOnly('M60.6 40.5 C63.5 40.8 66 41.6 68 42.6 C68.6 50 68.4 57 67.2 64.8 C65 65.5 62.8 65.8 60.6 65.7 C62.6 57 62.6 49 60.6 40.5 Z', '#8d9cc8') +
      line('M70 43.8 C71.3 50 71.2 57.5 69.8 64', sw * 0.9, C.yolk) + P(beak) +
      line('M62.5 53.5 C70 53 78 55 85 57.8', sw * 0.55, '#c94f2a') +
      eye(46, 48, 3.8) + P('M40 41.5 L47.5 41.2 L43.5 38.2 Z', '#8b88b0', NS) + P('M43 54.5 L49.5 53 L45.3 57 Z', '#8b88b0', NS) +
      blush(41, 59, 1.4) +
      P('M27 31 C27 17 43 12 55 16 C63 19 67 25 67 31 C55 27 39 27 27 31 Z', C.blue) +
      P('M24 32 C37 27 57 27 72 32 C73 35 71 36.5 69 36 C55 32 39 32 26 36 C24 36.5 22.5 34 24 32 Z', C.blueDeep) +
      Cc(47, 21, 4.2, C.yolk) + hl(35, 20, 3, 1.6, -30);
  }

  function scallopPath(cx, hy, w, h, dir, scallops = 9) {
    const half = w / 2;
    const ear = Math.min(42, w * 0.14);
    const P = [];
    let s = `M${f(cx - ear * 1.6)} ${f(hy)} L${f(cx - ear * 1.6)} ${f(hy + dir * ear * 0.55)}`;
    s += ` C${f(cx - half * 0.7)} ${f(hy + dir * h * 0.2)} ${f(cx - half * 1.02)} ${f(hy + dir * h * 0.5)} ${f(cx - half)} ${f(hy + dir * h * 0.72)}`;
    const n = scallops;
    const arcPt = (u) => {
      const a = Math.PI * (1 - u);
      return [cx + Math.cos(a) * half, hy + dir * (h * 0.72 + Math.sin(a) * h * 0.28)];
    };
    for (let i = 0; i < n; i++) {
      const p0 = arcPt(i / n), p1 = arcPt((i + 1) / n), pm = arcPt((i + 0.5) / n);
      const nx = pm[0] - cx, ny = (pm[1] - hy) - dir * h * 0.5;
      const L = Math.hypot(nx, ny) || 1;
      const bump = Math.min(w / n * 0.42, 22);
      s += ` Q${f(pm[0] + nx / L * bump)} ${f(pm[1] + ny / L * bump)} ${pt(p1)}`;
      P.push(pm);
    }
    s += ` C${f(cx + half * 1.02)} ${f(hy + dir * h * 0.5)} ${f(cx + half * 0.7)} ${f(hy + dir * h * 0.2)} ${f(cx + ear * 1.6)} ${f(hy + dir * ear * 0.55)}`;
    s += ` L${f(cx + ear * 1.6)} ${f(hy)} Z`;
    const ribs = P.map((pm) => `M${f(cx + (pm[0] - cx) * 0.18)} ${f(hy + dir * ear * 0.9)} L${f(cx + (pm[0] - cx) * 0.9)} ${f(hy + (pm[1] - hy) * 0.9)}`).join(' ');
    return { d: s, ribs };
  }

  window.ART = {
    C, mulberry32, slabPath, blobPath, foamPath, pebble, smoothClosed, starPath, sparklePath, scallopPath,
    CRITTERS, TOOLS, APPS, GLYPHS, puffin,
    svg(fn, size, sw, ex = '', vb = 64) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${vb} ${vb}" overflow="visible" ${ex}>${g(sw, fn(sw))}</svg>`;
    },
    group: g,
  };
})();
