(() => {
  const f = (n) => Math.round(n * 10) / 10;
  const pt = (p) => `${f(p[0])} ${f(p[1])}`;
  const rad = (a) => a * Math.PI / 180;

  const W = {
    rockLit: '#e2cbc6', rock: '#9b8cb1', rockShade: '#6f6296', crevice: '#4f4773', wet: '#625888',
    coral: '#f4a7b9', coralDeep: '#e186a2', weed: '#cdb75e', weedDeep: '#a89242',
    grass: '#7fd47e', grassDeep: '#4fae62', anem: '#8fe3a6', anemDeep: '#3faf86', anemTip: '#ffb0c8',
    ochre: '#9b6ad0', ochreDot: '#eedcff', bat: '#ff925e', batDeep: '#e9703f', urchin: '#7d5ac6',
    urchinLit: '#a98ae6', mussel: '#4d4a80', musselLit: '#a3a8dc', barnacle: '#f3ebdf',
    lettuce: '#9fe07a', lettuceDeep: '#62b85a', film: '#a9c98c',
    floor: '#e7dcc0', water: '#7fd8c4', waterDeep: '#3fa9a6',
  };
  const mixc = (a, c, k) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
    const A = p(a), Cc = p(c);
    return '#' + A.map((v, i) => Math.round(v + (Cc[i] - v) * k).toString(16).padStart(2, '0')).join('');
  };

  function roundPoly(P) {
    const n = P.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let s = `M${pt(mid(P[n - 1], P[0]))}`;
    for (let i = 0; i < n; i++) s += ` Q${pt(P[i])} ${pt(mid(P[i], P[(i + 1) % n]))}`;
    return s + 'Z';
  }

  function blob(cx, cy, rx, ry, rnd, irr = 0.14, n = 9) {
    const ph = rnd() * 6.28, a2 = 0.5 + rnd() * 0.5, a3 = rnd() * 0.6;
    const P = [];
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.25;
      const k = 1 + irr * (a2 * Math.sin(2 * th + ph) + a3 * Math.sin(3 * th + ph * 1.7) + (rnd() - 0.5) * 0.8);
      P.push([cx + Math.cos(th) * rx * k, cy + Math.sin(th) * ry * k]);
    }
    return { d: roundPoly(P), P };
  }
  const shift = (P, dx, dy, s = 1, cx = 0, cy = 0) => P.map(([x, y]) => [cx + (x - cx) * s + dx, cy + (y - cy) * s + dy]);

  let rockId = 0;
  function rock(cx, cy, rx, ry, rnd, o = {}) {
    const id = 'rk' + (rockId++);
    const pal = o.pal || {};
    const lit = pal.lit || W.rockLit, body = pal.body || W.rock, shade = pal.shade || W.rockShade;
    const b = blob(cx, cy, rx, ry, rnd, o.irr === undefined ? 0.13 : o.irr, o.n || 9);
    const bodyP = shift(b.P, rx * 0.1, -ry * 0.16, 0.97, cx, cy);
    const capP = shift(b.P, rx * 0.2, -ry * 0.34, 0.8, cx, cy);
    let s = `<defs><clipPath id="${id}"><path d="${b.d}"/></clipPath></defs>`;
    if (o.contact !== false) {
      s += `<ellipse cx="${f(cx - rx * 0.08)}" cy="${f(cy + ry * 0.78)}" rx="${f(rx * 1.08)}" ry="${f(ry * 0.36)}" fill="${W.crevice}" fill-opacity=".38"/>`;
    }
    s += `<path d="${b.d}" fill="${shade}"/><g clip-path="url(#${id})">` +
      `<path d="${roundPoly(bodyP)}" fill="${body}"/>` +
      `<path d="${roundPoly(capP)}" fill="${lit}"/>`;
    const nb = o.barnacles === undefined ? Math.round(rx * ry / 260) : o.barnacles;
    let bd = '', bs = '';
    for (let i = 0; i < nb; i++) {
      const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 0.72;
      const x = cx + rx * 0.14 + Math.cos(a) * rx * r, y = cy - ry * 0.26 + Math.sin(a) * ry * r * 0.8;
      const rr = 1.6 + rnd() * 2.8;
      bs += `M${f(x - rr)} ${f(y + rr * 0.35)}a${f(rr)} ${f(rr * 0.75)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr * 0.75)} 0 1 0 ${f(-rr * 2)} 0Z`;
      bd += `M${f(x - rr * 0.4)} ${f(y)}a${f(rr * 0.4)} ${f(rr * 0.3)} 0 1 0 ${f(rr * 0.8)} 0a${f(rr * 0.4)} ${f(rr * 0.3)} 0 1 0 ${f(-rr * 0.8)} 0Z`;
    }
    if (bs) s += `<path d="${bs}" fill="${W.barnacle}" fill-opacity=".85"/><path d="${bd}" fill="${shade}" fill-opacity=".7"/>`;
    if (o.wet) s += `<path d="${roundPoly(shift(b.P, -rx * 0.05, ry * 0.62, 1.02, cx, cy))}" fill="${W.wet}" fill-opacity=".55"/>`;
    s += `</g>`;
    s += `<path d="${b.d}" fill="none" stroke="url(#rim)" stroke-width="${f(Math.max(2.5, rx * 0.035))}" stroke-linejoin="round"/>`;
    return { svg: s, d: b.d, P: b.P };
  }

  function slab(cx, cy, rx, ry, rnd, tone = 0) {
    const b = blob(cx, cy, rx, ry, rnd, 0.3, 8);
    const top = shift(b.P, rx * 0.06, -ry * 0.2, 0.86, cx, cy);
    const body = mixc(W.rock, W.rockLit, 0.12 + tone * 0.22), lit = mixc(W.rock, W.rockLit, 0.5 + tone * 0.4);
    let s = `<path d="${roundPoly(shift(b.P, -rx * 0.02, ry * 0.26))}" fill="${W.rockShade}"/>` +
      `<path d="${b.d}" fill="${body}"/><path d="${roundPoly(top)}" fill="${lit}"/>`;
    const film = rnd();
    if (film < 0.3) s += `<path d="${blob(cx + rx * 0.1, cy - ry * 0.25, rx * 0.45, ry * 0.32, rnd, 0.3, 8).d}" fill="${film < 0.15 ? W.film : W.coral}" fill-opacity=".45"/>`;
    return s;
  }

  function lettuce(cx, cy, w, rnd, n = 6, deep = W.lettuceDeep, lit = W.lettuce, tall = 0.6) {
    let a = '', b = '';
    for (let i = 0; i < n; i++) {
      const x = cx + (rnd() - 0.5) * w, y = cy + (rnd() - 0.5) * w * 0.25, r = w * (0.16 + rnd() * 0.14);
      const bl = blob(x, y + r * (tall - 0.6), r, r * tall, rnd, 0.35, 8);
      a += bl.d; b += roundPoly(shift(bl.P, r * 0.1, -r * 0.18 * tall / 0.6, 0.62, x, y + r * (tall - 0.6)));
    }
    return `<path d="${a}" fill="${deep}"/><path d="${b}" fill="${lit}"/>`;
  }

  function anemone(cx, cy, r, rnd, o = {}) {
    const base = o.base || W.anem, deep = o.deep || W.anemDeep, tip = o.tip || W.anemTip, sq = o.sq || 0.6;
    const n = Math.round(14 + r * 0.5);
    let ring = '', tips = '';
    for (let k = 0; k < 2; k++) {
      const rr = r * (k ? 0.62 : 1);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + k * 0.2 + rnd() * 0.12;
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        const tr = r * (k ? 0.2 : 0.26) * (0.85 + rnd() * 0.3);
        ring += `M${f(x - tr)} ${f(y)}a${f(tr)} ${f(tr)} 0 1 0 ${f(tr * 2)} 0a${f(tr)} ${f(tr)} 0 1 0 ${f(-tr * 2)} 0Z`;
        if (!k) tips += `M${f(x * 1.08 - tr * 0.45)} ${f(y * 1.08)}a${f(tr * 0.45)} ${f(tr * 0.45)} 0 1 0 ${f(tr * 0.9)} 0a${f(tr * 0.45)} ${f(tr * 0.45)} 0 1 0 ${f(-tr * 0.9)} 0Z`;
      }
    }
    return `<g transform="translate(${f(cx)} ${f(cy)}) scale(1 ${sq})">` +
      `<circle r="${f(r * 1.25)}" cy="${f(r * 0.25)}" fill="${W.crevice}" fill-opacity=".22"/>` +
      `<circle r="${f(r * 1.05)}" fill="${deep}"/><path d="${ring}" fill="${base}"/><path d="${tips}" fill="${tip}"/>` +
      `<circle r="${f(r * 0.34)}" fill="${deep}"/><ellipse rx="${f(r * 0.16)}" ry="${f(r * 0.1)}" fill="${W.crevice}" fill-opacity=".5"/></g>`;
  }

  function star(cx, cy, R, rot, rnd, col, deep, dots, sq = 0.62) {
    let d = '';
    const r0 = R * 0.36;
    for (let k = 0; k < 5; k++) {
      const a = rot + 72 * k;
      const v1 = [Math.cos(rad(a - 36)) * r0, Math.sin(rad(a - 36)) * r0], v2 = [Math.cos(rad(a + 36)) * r0, Math.sin(rad(a + 36)) * r0];
      const bend = (rnd() - 0.5) * 14;
      const c1 = [Math.cos(rad(a - 13 + bend)) * R * 1.12, Math.sin(rad(a - 13 + bend)) * R * 1.12];
      const c2 = [Math.cos(rad(a + 13 + bend)) * R * 1.12, Math.sin(rad(a + 13 + bend)) * R * 1.12];
      d += (k === 0 ? `M${pt(v1)}` : '') + ` C${pt(c1)} ${pt(c2)} ${pt(v2)}`;
    }
    d += 'Z';
    let dd = '';
    if (dots) {
      for (let i = 0; i < 26; i++) {
        const k = Math.floor(rnd() * 5), a = rot + 72 * k + (rnd() - 0.5) * 16, r = R * (0.15 + rnd() * 0.72);
        const x = Math.cos(rad(a)) * r, y = Math.sin(rad(a)) * r, rr = R * (0.035 + rnd() * 0.035);
        dd += `M${f(x - rr)} ${f(y)}a${f(rr)} ${f(rr)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr)} 0 1 0 ${f(-rr * 2)} 0Z`;
      }
    }
    return `<g transform="translate(${f(cx)} ${f(cy)}) scale(1 ${sq})">` +
      `<path d="${d}" transform="translate(-3 7)" fill="${W.crevice}" fill-opacity=".25"/>` +
      `<path d="${d}" fill="${deep}"/><path d="${d}" transform="translate(1.5 -3) scale(.93)" fill="${col}"/>` +
      (dd ? `<path d="${dd}" fill="${W.ochreDot}" fill-opacity=".9"/>` : '') +
      `<ellipse cx="${f(R * 0.12)}" cy="${f(-R * 0.18)}" rx="${f(R * 0.22)}" ry="${f(R * 0.1)}" fill="#fff" fill-opacity=".28"/></g>`;
  }

  function urchin(cx, cy, r, rnd, sq = 0.7) {
    let sp = '';
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * 6.283 + rnd() * 0.1, L = r * (1.45 + rnd() * 0.25);
      sp += `M${f(Math.cos(a) * r * 0.7)} ${f(Math.sin(a) * r * 0.7)}L${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}`;
    }
    return `<g transform="translate(${f(cx)} ${f(cy)}) scale(1 ${sq})">` +
      `<ellipse cy="${f(r * 0.5)}" rx="${f(r * 1.5)}" ry="${f(r * 0.8)}" fill="${W.crevice}" fill-opacity=".3"/>` +
      `<path d="${sp}" stroke="${W.urchin}" stroke-width="${f(r * 0.13)}" stroke-linecap="round"/>` +
      `<circle r="${f(r)}" fill="${W.urchin}"/><circle cx="${f(r * 0.2)}" cy="${f(-r * 0.3)}" r="${f(r * 0.6)}" fill="${W.urchinLit}"/>` +
      `<circle cx="${f(r * 0.32)}" cy="${f(-r * 0.45)}" r="${f(r * 0.18)}" fill="#fff" fill-opacity=".45"/></g>`;
  }

  function mussels(cx, cy, w, h, rnd, n = 14) {
    let a = '', b = '';
    for (let i = 0; i < n; i++) {
      const x = cx + (rnd() - 0.5) * w, y = cy + (rnd() - 0.5) * h, L = 12 + rnd() * 7, ang = -60 + rnd() * 120 + (rnd() < 0.5 ? 180 : 0);
      const c = Math.cos(rad(ang)), s = Math.sin(rad(ang));
      const p = (u, v) => `${f(x + u * c - v * s)} ${f(y + (u * s + v * c) * 0.7)}`;
      a += `M${p(-L, 0)} C${p(-L * 0.4, -L * 0.62)} ${p(L, -L * 0.42)} ${p(L, 0)} C${p(L, L * 0.42)} ${p(-L * 0.4, L * 0.62)} ${p(-L, 0)}Z`;
      b += `M${p(-L * 0.3, -L * 0.22)} L${p(L * 0.55, -L * 0.18)}`;
    }
    return `<path d="${a}" fill="${W.mussel}"/><path d="${b}" fill="none" stroke="${W.musselLit}" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".8"/>`;
  }

  function pebbles(cx, cy, w, h, rnd, n, cols) {
    const parts = cols.map(() => '');
    for (let i = 0; i < n; i++) {
      const x = cx + (rnd() - 0.5) * w, y = cy + (rnd() - 0.5) * h, r = 4 + rnd() * 9;
      const k = Math.floor(rnd() * cols.length);
      parts[k] += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r * 0.6)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r * 0.6)} 0 1 0 ${f(-r * 2)} 0Z`;
    }
    return parts.map((d, i) => (d ? `<path d="${d}" fill="${cols[i]}"/>` : '')).join('');
  }

  function ribbon(x0, y0, len, w, ang, sway, bend = 0.4) {
    const N = 7, L = [], R = [];
    let x = x0, y = y0, a = rad(ang);
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const ww = w * (1 - u * 0.85) * (u < 0.1 ? 0.6 + u * 4 : 1);
      const nx = -Math.sin(a), ny = Math.cos(a);
      L.push([x + nx * ww, y + ny * ww]); R.push([x - nx * ww, y - ny * ww]);
      a += (bend * 0.15 + sway * (0.5 + u)) / N * 2;
      x += Math.cos(a) * len / N; y += Math.sin(a) * len / N;
    }
    const P = L.concat([[x, y]], R.reverse());
    return roundPoly(P);
  }

  function caustics(x0, y0, aw, ah, tile, seed, gap = 7, grid = 5) {
    const rnd = ART.mulberry32(seed);
    const S = [];
    for (let j = 0; j < grid; j++) for (let i = 0; i < grid; i++) {
      S.push({ x: (i + 0.5 + (rnd() - 0.5) * 0.8) * tile / grid, y: (j + 0.5 + (rnd() - 0.5) * 0.8) * tile / grid, g: gap * (0.55 + rnd() * 0.9) });
    }
    const cells = S.map((p, pi) => {
      let poly = [[p.x - tile, p.y - tile], [p.x + tile, p.y - tile], [p.x + tile, p.y + tile], [p.x - tile, p.y + tile]];
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        S.forEach((q, qi) => {
          if (qi === pi && !ox && !oy) return;
          const qx = q.x + ox * tile, qy = q.y + oy * tile;
          const dx = qx - p.x, dy = qy - p.y, L = Math.hypot(dx, dy);
          if (L > tile * 0.9) return;
          const nx = dx / L, ny = dy / L, c = (L - (p.g + q.g) / 2) / 2;
          const out = [];
          for (let k = 0; k < poly.length; k++) {
            const A = poly[k], B = poly[(k + 1) % poly.length];
            const da = (A[0] - p.x) * nx + (A[1] - p.y) * ny - c, db = (B[0] - p.x) * nx + (B[1] - p.y) * ny - c;
            if (da <= 0) out.push(A);
            if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); }
          }
          poly = out;
        });
      }
      return poly;
    });
    const wob = cells.map((poly, i) => {
      const out = [], p = S[i];
      for (let k = 0; k < poly.length; k++) {
        const A = poly[k], B = poly[(k + 1) % poly.length];
        const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
        out.push(A);
        if (L > gap * 2.5) {
          const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, o = rnd() * 0.32;
          out.push([mx + (p.x - mx) * o, my + (p.y - my) * o]);
        }
      }
      const ch = [];
      const q = (v) => Math.round(v * 10) / 10;
      for (let k = 0; k < out.length; k++) {
        const A = out[k], B = out[(k + 1) % out.length];
        ch.push([q(A[0] * 0.75 + B[0] * 0.25), q(A[1] * 0.75 + B[1] * 0.25)], [q(A[0] * 0.25 + B[0] * 0.75), q(A[1] * 0.25 + B[1] * 0.75)]);
      }
      return ch;
    });
    let d = `M${f(x0)} ${f(y0)}H${f(x0 + aw)}V${f(y0 + ah)}H${f(x0)}Z`;
    const tx0 = Math.floor(x0 / tile) - 1, ty0 = Math.floor(y0 / tile) - 1;
    const tx1 = Math.ceil((x0 + aw) / tile) + 1, ty1 = Math.ceil((y0 + ah) / tile) + 1;
    const q = (v) => Math.round(v * 10) / 10;
    const outl = wob.map((P) => P.map((p, k) => {
      const n = P[(k + 1) % P.length];
      return [p, [q((p[0] + n[0]) / 2), q((p[1] + n[1]) / 2)]];
    }));
    for (let ty = ty0; ty < ty1; ty++) for (let tx = tx0; tx < tx1; tx++) {
      outl.forEach((O, i) => {
        const cx = S[i].x + tx * tile, cy = S[i].y + ty * tile;
        if (cx < x0 - tile * 0.3 || cx > x0 + aw + tile * 0.3 || cy < y0 - tile * 0.3 || cy > y0 + ah + tile * 0.3) return;
        if (O.length < 3) return;
        const ox = tx * tile, oy = ty * tile, P2 = (p) => `${f(p[0] + ox)} ${f(p[1] + oy)}`;
        d += `M${P2(O[O.length - 1][1])}`;
        for (const [ctl, mid] of O) d += ` Q${P2(ctl)} ${P2(mid)}`;
        d += 'Z';
      });
    }
    return d;
  }

  window.WA = { W, f, pt, mixc, roundPoly, blob, shift, rock, slab, lettuce, anemone, star, urchin, mussels, pebbles, ribbon, caustics };
})();
