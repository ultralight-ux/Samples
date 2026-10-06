(() => {
  const { TAU, f2, rng } = AR;
  const P = (x, y) => `${f2(x)} ${f2(y)}`;
  const polar = (r, a) => [r * Math.sin(a), -r * Math.cos(a)];

  const defs = `
  <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fbe7a8"/><stop offset=".35" stop-color="#d4a24c"/>
    <stop offset=".6" stop-color="#8a5a20"/><stop offset="1" stop-color="#e2b866"/></linearGradient>
  <linearGradient id="g-gold-h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7a4f1c"/><stop offset=".3" stop-color="#f2d48a"/>
    <stop offset=".55" stop-color="#b8863a"/><stop offset="1" stop-color="#6a4416"/></linearGradient>
  <linearGradient id="g-iron" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6b6660"/><stop offset=".45" stop-color="#2f2c2a"/>
    <stop offset="1" stop-color="#151312"/></linearGradient>
  <linearGradient id="g-stone" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5e564c"/><stop offset=".45" stop-color="#2e2822"/>
    <stop offset="1" stop-color="#16120f"/></linearGradient>
  <radialGradient id="g-ember" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#fff2cf"/><stop offset=".25" stop-color="#ffb24a"/>
    <stop offset=".6" stop-color="#ff6a12" stop-opacity=".55"/><stop offset="1" stop-color="#c2410c" stop-opacity="0"/></radialGradient>
  <linearGradient id="gl-blue" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#0a1440"/><stop offset=".6" stop-color="#1c3a92"/><stop offset="1" stop-color="#4f74cf"/></linearGradient>
  <radialGradient id="gl-ruby" cx=".4" cy=".35" r=".7">
    <stop offset="0" stop-color="#ff6a5a"/><stop offset=".45" stop-color="#a3192a"/><stop offset="1" stop-color="#3a040c"/></radialGradient>
  <linearGradient id="gl-amber" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#5a2a05"/><stop offset=".55" stop-color="#c77a16"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
  <linearGradient id="gl-green" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#062a18"/><stop offset=".55" stop-color="#1d7a46"/><stop offset="1" stop-color="#7fd6a0"/></linearGradient>
  `;

  function lancet(r0, rs, r1, half) {
    const w0 = r0 * Math.sin(half) * 0.62, w1 = rs * Math.sin(half) * 0.74;
    return `M${P(-w0, -r0)} L${P(-w1, -rs)} Q${P(-w1 * 0.98, -(rs + (r1 - rs) * 0.62))} ${P(0, -r1)}` +
      ` Q${P(w1 * 0.98, -(rs + (r1 - rs) * 0.62))} ${P(w1, -rs)} L${P(w0, -r0)} Z`;
  }
  function quatrefoil(cx, cy, r) {
    let d = '';
    for (let i = 0; i < 4; i++) {
      const a = (i * TAU) / 4;
      const x = cx + Math.cos(a) * r * 0.52, y = cy + Math.sin(a) * r * 0.52;
      d += `M${P(x + r * 0.5, y)} A${f2(r * 0.5)} ${f2(r * 0.5)} 0 1 0 ${P(x - r * 0.5, y)} A${f2(r * 0.5)} ${f2(r * 0.5)} 0 1 0 ${P(x + r * 0.5, y)} Z`;
    }
    return d;
  }
  function roseWindow(R, lit) {
    const half = Math.PI / 12;
    const r0 = R * 0.42, rs = R * 0.74, r1 = R * 0.9;
    const glass = [], lead = [], mull = [];
    const shade = [0.0, 0.18, 0.08, 0.26, 0.04, 0.2, 0.12, 0.3, 0.02, 0.16, 0.1, 0.24];
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const d = lancet(r0, rs, r1, half);
      glass.push(`<path transform="rotate(${deg})" d="${d}" fill="url(#gl-blue)"/>`);
      glass.push(`<path transform="rotate(${deg})" d="${d}" fill="#000" fill-opacity="${shade[i]}"/>`);
      const my = -R * 0.6, mr = R * 0.062;
      glass.push(`<circle transform="rotate(${deg})" cx="0" cy="${f2(my)}" r="${f2(mr)}" fill="url(#gl-${i % 3 === 1 ? 'amber' : 'ruby'})"/>`);
      const bars = [0.5, 0.7].map((k) => {
        const y = -R * k, w = R * k * Math.sin(half) * 0.7;
        return `M${P(-w, y)} L${P(w, y)}`;
      }).join(' ');
      const wq = rs * Math.sin(half) * 0.7;
      const quarry = `M${P(-wq, -R * 0.72)} L${P(wq * 0.6, -R * 0.82)} M${P(wq, -R * 0.72)} L${P(-wq * 0.6, -R * 0.82)}` +
        ` M${P(-wq * 0.8, -R * 0.44)} L${P(wq * 0.8, -R * 0.52)}`;
      lead.push(`<path transform="rotate(${deg})" d="M0 ${f2(-r0)} L0 ${f2(my + mr)} M0 ${f2(my - mr)} L0 ${f2(-r1 * 0.97)} ${bars} ${quarry}"/>`);
      lead.push(`<circle transform="rotate(${deg})" cx="0" cy="${f2(my)}" r="${f2(mr)}"/>`);
      mull.push(`<path transform="rotate(${deg})" d="${d}"/>`);
      const [ox, oy] = polar(R * 0.86, (deg + 15) * Math.PI / 180);
      glass.push(`<circle cx="${f2(ox)}" cy="${f2(oy)}" r="${f2(R * 0.055)}" fill="url(#gl-amber)"/>`);
      mull.push(`<circle cx="${f2(ox)}" cy="${f2(oy)}" r="${f2(R * 0.055)}"/>`);
    }
    for (let i = 0; i < 6; i++) {
      const [qx, qy] = polar(R * 0.25, (i * 60 + 30) * Math.PI / 180);
      const d = quatrefoil(qx, qy, R * 0.105);
      glass.push(`<path d="${d}" fill="url(#${i % 2 ? 'gl-green' : 'gl-amber'})"/>`);
      mull.push(`<path d="${d}"/>`);
    }
    glass.push(`<circle r="${f2(R * 0.12)}" fill="url(#gl-ruby)"/>`);
    let petals = '';
    for (let i = 0; i < 8; i++) {
      const a = i * 45;
      petals += `<path transform="rotate(${a})" d="M0 0 Q${f2(R * 0.04)} ${f2(-R * 0.06)} 0 ${f2(-R * 0.115)} Q${f2(-R * 0.04)} ${f2(-R * 0.06)} 0 0 Z"/>`;
    }
    const stoneW = R * 0.035;
    const glassAll = `<g ${lit ? 'style="filter:saturate(1.25) brightness(1.6)"' : ''}>${glass.join('')}</g>`;
    return {
      base: `<circle r="${f2(R)}" fill="#17120e"/>`,
      glass: glassAll,
      lead: `<g fill="none" stroke="#120d0a" stroke-width="${f2(R * 0.008)}" stroke-opacity=".85">${lead.join('')}</g>`,
      stone: `
        <circle r="${f2(R * 0.965)}" fill="none" stroke="url(#g-stone)" stroke-width="${f2(R * 0.07)}"/>
        <circle r="${f2(R * 0.93)}" fill="none" stroke="#14100c" stroke-width="${f2(R * 0.012)}"/>
        <circle r="${f2(R)}" fill="none" stroke="#0d0a08" stroke-width="${f2(R * 0.014)}"/>
        <g fill="none" stroke="url(#g-stone)" stroke-width="${f2(stoneW)}" stroke-linejoin="round">${mull.join('')}</g>
        <g fill="none" stroke="#120d0a" stroke-width="${f2(R * 0.008)}">${mull.join('')}</g>
        <circle r="${f2(r0)}" fill="none" stroke="url(#g-stone)" stroke-width="${f2(R * 0.05)}"/>
        <circle r="${f2(r0 - R * 0.026)}" fill="none" stroke="#120d0a" stroke-width="${f2(R * 0.008)}"/>
        <circle r="${f2(R * 0.12)}" fill="none" stroke="url(#g-stone)" stroke-width="${f2(R * 0.03)}"/>
        <g fill="#2a231c" stroke="url(#g-stone)" stroke-width="${f2(R * 0.012)}">${petals}</g>`,
    };
  }

  const GEMS = {
    ember: { dark: '#2a0206', mid: '#b3111d', light: '#ff5a48', spark: '#ffe0d2', glow: '#ff3b2a', cut: 'pear' },
    grave: { dark: '#021b0f', mid: '#13824a', light: '#5ce39a', spark: '#e4ffef', glow: '#2fe08a', cut: 'cushion' },
    saint: { dark: '#030b2e', mid: '#1f49c4', light: '#6f9cff', spark: '#e6eeff', glow: '#4a7dff', cut: 'round' },
  };
  function outlinePts(cut, r, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      let x = Math.sin(a), y = -Math.cos(a), k = 1;
      if (cut === 'pear') {
        const up = Math.max(0, -y);
        k = 1 - 0.38 * Math.pow(up, 1.6);
        x *= k * (1 - 0.28 * Math.pow(up, 3));
        y = y * 1.18 + 0.12;
        if (i === 0) { x = 0; y = -1.16; }
      } else if (cut === 'cushion') {
        const p = 4.5;
        const m = Math.pow(Math.pow(Math.abs(x), p) + Math.pow(Math.abs(y), p), 1 / p);
        x /= m; y /= m;
        x *= 0.95; y *= 0.95;
      }
      pts.push([x * r, y * r]);
    }
    return pts;
  }
  function hexToRgb(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  function rgbStr(c) { return `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(',')})`; }
  function ramp(g, k) {
    const stops = [g.dark, g.mid, g.light, g.spark].map(hexToRgb);
    const x = Math.max(0, Math.min(0.999, k)) * 3, i = Math.floor(x), u = x - i;
    return rgbStr(stops[i].map((v, j) => v + (stops[i + 1][j] - v) * u));
  }
  function gem(kind, r) {
    const g = GEMS[kind];
    const n = g.cut === 'round' ? 16 : 14;
    const out = outlinePts(g.cut, r, n);
    const tab = out.map(([x, y]) => [x * 0.5 - r * 0.05, y * 0.5 - r * 0.06]);
    const L = [-0.62, -0.78];
    let facets = '';
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const mx = (out[i][0] + out[j][0]) / 2, my = (out[i][1] + out[j][1]) / 2;
      const len = Math.hypot(mx, my) || 1;
      const lit = (mx / len) * L[0] + (my / len) * L[1];
      const k1 = 0.42 + 0.34 * lit + (i % 2 ? 0.16 : -0.08);
      const k2 = 0.30 + 0.30 * -lit + (i % 3 === 0 ? 0.22 : 0);
      facets += `<path d="M${P(...out[i])} L${P(...out[j])} L${P(...tab[j])} Z" fill="${ramp(g, k1)}"/>`;
      facets += `<path d="M${P(...out[i])} L${P(...tab[j])} L${P(...tab[i])} Z" fill="${ramp(g, k2)}"/>`;
    }
    const tabD = 'M' + tab.map((p) => P(...p)).join(' L') + ' Z';
    const outD = 'M' + out.map((p) => P(...p)).join(' L') + ' Z';
    let star = '';
    const c = [-r * 0.05, -r * 0.06];
    for (let i = 0; i < n; i += 2) {
      const j = (i + 1) % n;
      star += `<path d="M${P(...c)} L${P(...tab[i])} L${P(...tab[j])} Z" fill="${ramp(g, 0.62 + (i % 4 ? 0.12 : -0.1))}"/>`;
    }
    return `
      <path d="${outD}" fill="${g.dark}"/>
      ${facets}
      <path d="${tabD}" fill="${ramp(g, 0.58)}"/>
      ${star}
      <path d="${tabD}" fill="none" stroke="${g.spark}" stroke-opacity=".35" stroke-width="${f2(r * 0.02)}"/>
      <path d="M${P(-r * 0.5, -r * 0.35)} L${P(-r * 0.18, -r * 0.62)} L${P(-r * 0.08, -r * 0.5)} L${P(-r * 0.4, -r * 0.22)} Z" fill="#fff" fill-opacity=".55"/>
      <path d="${outD}" fill="none" stroke="#0a0204" stroke-opacity=".8" stroke-width="${f2(r * 0.045)}"/>`;
  }
  function sparkle(r, col) {
    const k = r * 0.16;
    return `<path d="M0 ${f2(-r)} Q${f2(k)} ${f2(-k)} ${f2(r)} 0 Q${f2(k)} ${f2(k)} 0 ${f2(r)} Q${f2(-k)} ${f2(k)} ${f2(-r)} 0 Q${f2(-k)} ${f2(-k)} 0 ${f2(-r)} Z" fill="${col || '#fff'}"/>`;
  }

  const RUNES = [
    [[5, 0, 5, 16], [5, 2, 10, 6], [5, 7, 10, 11]],
    [[5, 0, 5, 16], [0, 4, 5, 8], [10, 4, 5, 8]],
    [[5, 0, 5, 16], [5, 8, 10, 3], [5, 8, 0, 13]],
    [[5, 0, 5, 16], [1, 5, 9, 5], [2, 11, 8, 11]],
    [[5, 0, 5, 16], [5, 3, 0, 8], [0, 8, 5, 13]],
    [[5, 0, 5, 16], [5, 4, 10, 9], [5, 4, 0, 9]],
    [[5, 0, 5, 16], [5, 6, 10, 1], [5, 10, 10, 15], [0, 8, 5, 8]],
    [[5, 0, 5, 16], [0, 3, 10, 13], [10, 3, 0, 13]],
    [[5, 0, 5, 16], [5, 2, 10, 7], [10, 7, 5, 12], [0, 14, 5, 12]],
  ];
  function runePath(i, scale) {
    const seg = RUNES[i % RUNES.length];
    const k = scale / 16;
    return seg.map(([a, b, c, d]) => `M${P((a - 5) * k, (b - 8) * k)} L${P((c - 5) * k, (d - 8) * k)}`).join(' ');
  }

  function flourish(w, col) {
    const hw = w / 2;
    const curl = (x, s) => `M${P(x, 0)} c${f2(s * 10)} -6 ${f2(s * 16)} 4 ${f2(s * 9)} 7 c${f2(-s * 5)} 2 ${f2(-s * 8)} -3 ${f2(-s * 4)} -5`;
    return `
      <path d="M${P(-hw + 14, 0)} Q0 -2.6 ${P(hw - 14, 0)} Q0 2.6 ${P(-hw + 14, 0)} Z" fill="${col}"/>
      <path d="M0 -7 L7 0 L0 7 L-7 0 Z" fill="${col}"/>
      <path d="M0 -3.4 L3.4 0 L0 3.4 L-3.4 0 Z" fill="#d8c39a"/>
      <path d="${curl(-hw + 16, -1)} ${curl(hw - 16, 1)}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  function cornerFleuron() {
    const d = 'M2 2 L62 2 L62 8 L18 8 Q10 8 9 16 L8 62 L2 62 Z ' +
      'M14 14 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z ' +
      'M30 8 q6 10 0 16 q-6 -6 0 -16 Z M8 30 q10 6 16 0 q-6 -6 -16 0 Z';
    return `<path d="${d}" fill="url(#g-gold)" stroke="#2a1606" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M4 4 L60 4 M4 4 L4 60" stroke="#fff3c4" stroke-opacity=".55" stroke-width="1"/>`;
  }

  const ICONS = {
    damage: 'M4 20 L15 9 L16.5 10.5 L5.5 21.5 Z M15 9 L21 3 L21 5 L16.5 10.5 Z M20 20 L9 9 L7.5 10.5 L18.5 21.5 Z M9 9 L3 3 L3 5 L7.5 10.5 Z M2.5 17.5 L6.5 21.5 M21.5 17.5 L17.5 21.5',
    armor: 'M12 2 L20 5 L20 11 Q20 18 12 22 Q4 18 4 11 L4 5 Z M12 5 L12 19 M7 9 L17 9',
    life: 'M12 2 Q19 11 19 15 Q19 21 12 21 Q5 21 5 15 Q5 11 12 2 Z',
    strength: 'M5 9 L15 9 L15 5 L19 5 L19 13 L15 13 L15 11 L9 11 L9 21 L5 21 Z',
    faith: 'M11 2 L13 2 L13 8 L19 8 L19 10 L13 10 L13 22 L11 22 L11 10 L5 10 L5 8 L11 8 Z',
    wrath: 'M12 2 Q17 8 15 12 Q19 10 18 15 Q17 21 12 21 Q6 21 6 15 Q6 11 9 9 Q9 12 11 13 Q8 7 12 2 Z',
    fortitude: 'M5 22 L5 8 L4 8 L4 3 L7 3 L7 5 L9 5 L9 3 L12 3 L12 5 L14 5 L14 3 L17 3 L17 5 L19 5 L19 3 L20 3 L20 8 L19 8 L19 22 Z M10 22 L10 16 Q12 13 14 16 L14 22',
    crit: 'M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z',
    speed: 'M3 6 L13 12 L3 18 Z M11 6 L21 12 L11 18 Z',
    fire: 'M12 2 Q17 8 15 12 Q19 10 18 15 Q17 21 12 21 Q6 21 6 15 Q6 11 9 9 Q9 12 11 13 Q8 7 12 2 Z',
    frost: 'M11 2 L13 2 L13 22 L11 22 Z M3.3 6.5 L4.3 4.8 L20.7 17.5 L19.7 19.2 Z M3.3 17.5 L19.7 4.8 L20.7 6.5 L4.3 19.2 Z',
    blight: 'M12 3 Q19 3 19 10 Q19 14 16 15 L16 19 L8 19 L8 15 Q5 14 5 10 Q5 3 12 3 Z M9 9 m-1.8 0 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0 Z M15 9 m-1.8 0 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0 Z',
    shadow: 'M15 3 Q7 5 7 12 Q7 19 15 21 Q5 22 3 13 Q3 4 15 3 Z',
    holy: 'M11 1 L13 1 L13 8 L11 8 Z M11 16 L13 16 L13 23 L11 23 Z M1 11 L8 11 L8 13 L1 13 Z M16 11 L23 11 L23 13 L16 13 Z M12 7 m-5 5 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z',
    undying: 'M12 3 Q19 3 19 10 Q19 14 16 15 L16 19 L8 19 L8 15 Q5 14 5 10 Q5 3 12 3 Z',
  };
  function shard(r) {
    return `<path d="M0 ${-r} L${f2(r * 0.45)} ${f2(-r * 0.2)} L${f2(r * 0.2)} ${r} L${f2(-r * 0.3)} ${f2(r * 0.8)} L${f2(-r * 0.45)} ${f2(-r * 0.1)} Z" fill="#7a4fd0" stroke="#1a0a30" stroke-width="1.2"/>
      <path d="M0 ${-r} L${f2(r * 0.05)} ${f2(r * 0.3)} L${f2(r * 0.2)} ${r}" fill="none" stroke="#d9c4ff" stroke-width="1"/>
      <path d="M0 ${-r} L${f2(-r * 0.45)} ${f2(-r * 0.1)} L${f2(r * 0.05)} ${f2(r * 0.3)} Z" fill="#b89af0"/>`;
  }
  function cursor() {
    return `<path d="M3 2 L3 30 L10 23 L15 34 L20 32 L15 21 L25 21 Z" fill="#0c0806" stroke="#0c0806" stroke-width="4" stroke-linejoin="round"/>
      <path d="M3 2 L3 30 L10 23 L15 34 L20 32 L15 21 L25 21 Z" fill="url(#g-iron)" stroke="url(#g-gold)" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M5 7 L5 24 L9.5 19.5" fill="none" stroke="#fff1c4" stroke-opacity=".7" stroke-width="1"/>`;
  }

  AR.art = { defs, roseWindow, gem, GEMS, sparkle, runePath, RUNES, flourish, cornerFleuron, ICONS, shard, cursor };
})();
