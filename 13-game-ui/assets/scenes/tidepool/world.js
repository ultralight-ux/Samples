function buildWorld(ctx, host) {
  const DW = 1920, DH = 1080;
  const W = ctx.width, H = ctx.height;
  const k = Math.max(W / DW, H / DH) * 1.04;
  const ox0 = (W - DW * k) / 2, oy0 = (H - DH * k) / 2;
  const S = STORY, P = WA.W, f = WA.f;
  const HZ = 236;
  const rnd = ART.mulberry32(808);

  const layer = (id, z, extra = '') =>
    `<div id="${id}" style="position:absolute;left:0;top:0;width:${DW}px;height:${DH}px;transform-origin:0 0;` +
    `transform:translate(${f(ox0)}px,${f(oy0)}px) scale(${k.toFixed(5)});${extra}"></div>`;
  const svgOpen = (w = DW, h = DH, x = 0, y = 0, extra = '') =>
    `<svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" style="position:absolute;left:${x}px;top:${y}px;overflow:visible${extra}">`;

  host.innerHTML =
    layer('w-sky', 0) + layer('w-far', 1, 'filter:blur(2.5px)') + layer('w-lamp', 1) + layer('w-surf', 2, 'will-change:transform') +
    layer('w-cam', 3, 'will-change:transform') + layer('w-near', 4, 'will-change:transform') +
    layer('w-grade', 5) +
    `<div id="w-glass" style="position:absolute;inset:0;opacity:0;visibility:hidden"></div>` +
    `<div id="w-dim" style="position:absolute;inset:0;background:#2a2347;opacity:0"></div>` +
    `<div id="w-vig" style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 75% at 50% 48%, rgba(59,51,94,0) 58%, rgba(59,51,94,.38) 100%)"></div>`;
  const $ = (s) => host.querySelector(s);

  const sky = $('#w-sky');
  const skyGrad = (id, stops) => `<div id="${id}" style="position:absolute;left:-200px;top:-200px;width:${DW + 400}px;height:${HZ + 260}px;background:linear-gradient(180deg,${stops})"></div>`;
  sky.innerHTML =
    skyGrad('sk-aft', '#6ea9e6 0%, #9cc9f0 50%, #d2ebf4 86%, #eef7f3 100%') +
    skyGrad('sk-gold', '#8f93d6 0%, #d5a6bf 46%, #ffc99a 82%, #ffe6ad 100%') +
    skyGrad('sk-dusk', '#46418f 0%, #8a64a8 44%, #e88f9e 82%, #ffb08f 100%') +
    `<div id="sk-sun" style="position:absolute;left:0;top:0;width:0;height:0;will-change:transform">` +
    `<div style="position:absolute;left:-420px;top:-420px;width:840px;height:840px;border-radius:50%;background:radial-gradient(circle, rgba(255,246,214,.75) 0%, rgba(255,222,160,.32) 22%, rgba(255,200,140,.1) 52%, rgba(255,190,130,0) 70%)"></div>` +
    `<div style="position:absolute;left:-58px;top:-58px;width:116px;height:116px;border-radius:50%;background:radial-gradient(circle, #fffdf0 0%, #fff4c8 46%, rgba(255,226,140,.55) 72%, rgba(255,214,120,0) 100%)"></div></div>` +
    svgOpen(DW, HZ + 40, 0, 0) + [0, 1, 2].map(() =>
      `<g class="gull"><path d="M-14 0 Q-7 -8 0 0 Q7 -8 14 0" fill="none" stroke="#4a4570" stroke-opacity=".55" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('') + '</svg>';
  const skyEls = ['#sk-gold', '#sk-dusk'].map($);
  const sun = $('#sk-sun');
  const gullEls = [...sky.querySelectorAll('.gull')];
  const gulls = [{ y: 92, s: 1.0, ph: 0.1 }, { y: 140, s: 0.75, ph: 0.45 }, { y: 70, s: 0.6, ph: 0.72 }];

  {
    let s = svgOpen(DW + 400, 380, -200, HZ - 40) + `<defs>
      <linearGradient id="sea-g" x1="0" y1="${HZ}" x2="0" y2="560" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#bfe4ea"/><stop offset=".25" stop-color="#86c8de"/><stop offset="1" stop-color="#4e9fca"/></linearGradient>
      <linearGradient id="haze-g" x1="0" y1="${HZ - 40}" x2="0" y2="${HZ}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#d9c8e6" stop-opacity="0"/><stop offset="1" stop-color="#e9e0f0" stop-opacity=".9"/></linearGradient>
      <radialGradient id="glit-g" cx="1330" cy="${HZ + 6}" r="420" gradientTransform="translate(1330 ${HZ}) scale(.42 1) translate(-1330 -${HZ})" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fffbe6" stop-opacity=".85"/><stop offset=".5" stop-color="#fff2cc" stop-opacity=".25"/><stop offset="1" stop-color="#fff2cc" stop-opacity="0"/></radialGradient></defs>`;
    s += `<rect x="-200" y="${HZ}" width="${DW + 400}" height="340" fill="url(#sea-g)"/>`;
    s += `<rect x="1000" y="${HZ}" width="660" height="330" fill="url(#glit-g)"/>`;
    let wl = '';
    for (let i = 0; i < 46; i++) {
      const y = HZ + 6 + Math.pow(rnd(), 1.6) * 250, x = -150 + rnd() * (DW + 300), L = 30 + (y - HZ) * 0.6 * (0.5 + rnd());
      wl += `M${f(x)} ${f(y)} q${f(L / 2)} ${f(-3 - (y - HZ) * 0.01)} ${f(L)} 0`;
    }
    s += `<path d="${wl}" fill="none" stroke="#e8f7fa" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`;
    const stack = (pts, col, lit) => {
      const d = WA.roundPoly(pts);
      return `<path d="${d}" fill="${col}"/><path d="${WA.roundPoly(WA.shift(pts, 10, -6, 0.86, pts[0][0], HZ))}" fill="${lit}" fill-opacity=".6"/>`;
    };
    s += stack([[560, HZ + 8], [600, 214], [640, 186], [700, 170], [748, 182], [790, 200], [850, 214], [900, HZ + 8]], '#a99cc2', '#cbbfdb');
    s += stack([[1530, HZ + 6], [1556, 206], [1590, 190], [1624, 200], [1648, 220], [1666, HZ + 6]], '#ab9ec4', '#cdc2dc');
    s += `<path d="M692 176 L695 140 H707 L710 176Z" fill="#f4eef6"/><path d="M693.4 160 H708.6 L709.2 167 H692.8Z" fill="#e8818a"/>` +
      `<path d="M694 140 H708 V133 Q701 126 694 133Z" fill="#8a7fae"/><path d="M696 140 V133 H706 V140Z" fill="#fff4c8"/>`;
    s += `<rect x="-200" y="${HZ - 40}" width="${DW + 400}" height="44" fill="url(#haze-g)"/>`;
    let foam = '';
    for (let x = -180; x < DW + 200; x += 22 + rnd() * 26) {
      const y = 458 + 12 * Math.sin(x / 160) + rnd() * 8, r = 12 + rnd() * 18;
      foam += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r * 0.38)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r * 0.38)} 0 1 0 ${f(-r * 2)} 0Z`;
    }
    s += `<path d="M-200 470 Q400 440 960 458 T2120 450 V560 H-200Z" fill="#d6f1f2" fill-opacity=".65"/>`;
    s += `<path d="${foam}" fill="#ffffff" fill-opacity=".9"/></svg>`;
    $('#w-far').innerHTML = s;
  }

  $('#w-lamp').innerHTML = `<div id="lamp" style="position:absolute;left:631px;top:66px;width:140px;height:140px;border-radius:50%;opacity:0;will-change:opacity;` +
    `background:radial-gradient(circle, rgba(255,250,220,.95) 0%, rgba(255,226,140,.45) 18%, rgba(255,210,120,.12) 45%, rgba(255,210,120,0) 70%)"></div>`;
  const lamp = $('#lamp');

  const pools = [
    { cx: 1000, cy: 682, rx: 470, ry: 168, seed: 3, n: 13 },
    { cx: 290, cy: 808, rx: 236, ry: 78, seed: 7, n: 11 },
    { cx: 1668, cy: 628, rx: 196, ry: 64, seed: 9, n: 10 },
    { cx: 470, cy: 566, rx: 128, ry: 38, seed: 12, n: 9 },
    { cx: 1560, cy: 1012, rx: 300, ry: 92, seed: 15, n: 11 },
  ];
  pools.forEach((p) => {
    const r = ART.mulberry32(p.seed * 31);
    const b = WA.blob(p.cx, p.cy, p.rx, p.ry, r, 0.11, p.n);
    p.d = b.d; p.P = b.P;
  });
  const main = pools[0];

  {
    let s = svgOpen(DW + 200, DH + 200, -100, -100) + `<defs>
      <radialGradient id="floor-g" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="#ecdab0"/><stop offset=".6" stop-color="#a9d8c0"/><stop offset="1" stop-color="#5aa8a6"/></radialGradient></defs>`;
    for (const p of pools) s += `<path d="${p.d}" fill="url(#floor-g)"/>`;
    const r = ART.mulberry32(4242);
    s += WA.pebbles(main.cx, main.cy + 40, 780, 200, r, 60, ['#d9c9a6', '#c7b9a0', '#b9c7b2', '#efe3c8']);
    s += `<path d="${WA.blob(860, 742, 120, 30, r, 0.2).d}" fill="#7a5aa8" fill-opacity=".35"/>`;
    s += `<path d="${WA.blob(1180, 610, 150, 34, r, 0.2).d}" fill="#8a4f78" fill-opacity=".3"/>`;
    const pink = { base: '#ffb3c9', deep: '#e0789b', tip: '#fff0f4' }, peach = { base: '#ffd09a', deep: '#ee9a58', tip: '#fff4e0' };
    s += WA.anemone(700, 684, 46, r) + WA.anemone(790, 750, 34, r) + WA.anemone(636, 752, 26, r, pink) + WA.anemone(745, 800, 18, r);
    s += WA.anemone(1262, 634, 40, r) + WA.anemone(1330, 704, 25, r, pink) + WA.anemone(1200, 700, 20, r) + WA.anemone(1385, 650, 18, r, peach);
    s += WA.anemone(560, 640, 22, r, peach) + WA.anemone(1060, 610, 16, r, pink);
    s += WA.star(930, 770, 62, -18, r, P.ochre, '#7a4cb0', true);
    s += WA.star(1140, 768, 42, 12, r, P.bat, P.batDeep, false);
    s += WA.urchin(1336, 774, 21, r) + WA.urchin(1378, 794, 17, r) + WA.urchin(1300, 806, 15, r) + WA.urchin(598, 794, 18, r) + WA.urchin(630, 812, 13, r);
    const lp = pools[1];
    s += WA.pebbles(lp.cx, lp.cy + 10, 380, 90, r, 22, ['#d9c9a6', '#c7b9a0', '#b9c7b2']);
    s += WA.anemone(200, 800, 24, r) + WA.anemone(250, 830, 16, r) + WA.star(380, 806, 30, 30, r, '#ff7f8e', '#e05a6e', false);
    const rp = pools[2];
    s += WA.pebbles(rp.cx, rp.cy, 300, 70, r, 16, ['#d9c9a6', '#c7b9a0']);
    s += WA.urchin(1610, 630, 14, r) + WA.urchin(1640, 646, 11, r) + WA.anemone(1730, 624, 18, r);
    const np = pools[4];
    s += WA.pebbles(np.cx, np.cy, 480, 110, r, 26, ['#d9c9a6', '#c7b9a0', '#b9c7b2']);
    s += WA.anemone(1440, 1000, 30, r) + WA.star(1640, 1020, 40, 50, r, P.ochre, '#7a4cb0', true) + WA.anemone(1720, 990, 20, r);
    s += WA.anemone(470, 566, 14, r);
    s += '</svg>';
    $('#w-cam').insertAdjacentHTML('beforeend', `<div id="w-floor" style="position:absolute;left:0;top:0">${s}</div>`);
  }

  const cam = $('#w-cam');
  const animLayer = (id, html) => {
    cam.insertAdjacentHTML('beforeend', `<div id="${id}" style="position:absolute;left:0;top:0;width:0;height:0;will-change:transform">${html}</div>`);
    return cam.querySelector('#' + id);
  };
  const CT = 260, CSQ = 0.5;
  const causticLayer = (id, p, tile, seed, gap, col, alpha) => {
    const bx = Math.floor(p.cx - p.rx - 10), by = Math.floor(p.cy - p.ry - 10), bw = Math.ceil(p.rx * 2 + 20), bh = Math.ceil(p.ry * 2 + 20);
    const x0 = bx - tile, y0 = by / CSQ - tile, aw = bw + tile * 2, ah = bh / CSQ + tile * 2;
    const d = WA.caustics(x0, y0, aw, ah, tile, seed, gap, 4);
    cam.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;overflow:hidden">` +
      `<div id="${id}" style="position:absolute;left:${-bx}px;top:${-by}px;width:0;height:0;will-change:transform">` +
      `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible"><g transform="scale(1 ${CSQ})"><path d="${d}" fill="${col}" fill-opacity="${alpha}" fill-rule="evenodd"/></g></svg></div></div>`);
    return cam.querySelector('#' + id);
  };
  const caus = [
    [300, 11, 5, '#fffdf0', 0.42, 1, 1, main], [468, 23, 8, '#f0fff8', 0.18, -1, 1, main],
    [208, 31, 5, '#fffdf0', 0.45, 1, -1, pools[1]], [CT, 37, 5, '#fffdf0', 0.45, -1, -1, pools[4]],
  ].map(([tile, seed, gap, col, a, kx, ky, p], i) => ({ el: causticLayer('w-c' + i, p, tile, seed, gap, col, a), tile, kx, ky }));
  const grassRoots = [];
  {
    const r = ART.mulberry32(77);
    const roots = [[640, 822, -100], [700, 834, -88], [1080, 846, -80], [1150, 840, -96], [1230, 830, -70], [820, 840, -110], [1420, 760, -60], [585, 700, -120]];
    roots.forEach(([x, y, a]) => {
      for (let i = 0; i < 3; i++) grassRoots.push({ x: x + i * 7, y: y + i * 2, len: 70 + r() * 70, w: 5 + r() * 3, a: a + (r() - 0.5) * 30, ph: r() * 6.28, k: 2 + Math.floor(r() * 2), col: i % 2 ? P.grass : P.grassDeep });
    });
  }
  const grassEl = animLayer('w-grass', `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible">${grassRoots.map((g) => `<path fill="${g.col}"/>`).join('')}</svg>`);
  const grassPaths = [...grassEl.querySelectorAll('path')];
  const goby = (col) => `<svg width="80" height="40" viewBox="-40 -20 80 40" style="position:absolute;left:-40px;top:-20px;overflow:visible">
    <ellipse cx="2" cy="10" rx="22" ry="5" fill="${P.crevice}" fill-opacity=".22"/>
    <path d="M-24 0 C-22 -9 8 -10 18 -2 C22 1 22 3 18 5 C8 11 -20 9 -24 0Z" fill="${col}"/>
    <path d="M-22 0 L-34 -8 L-31 0 L-34 8Z" fill="${col}"/><path d="M-6 -7 C-2 -12 6 -12 8 -7Z" fill="#ffcb4f"/>
    <circle cx="11" cy="-1" r="2.4" fill="#3b335e"/><path d="M-14 -3 C-8 -6 4 -6 12 -3" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  const gobies = [
    { el: animLayer('w-goby1', goby('#8ccbf3')), x: 900, y: 690, ax: 210, ay: 40, k: 1, ph: 0.3, s: 1 },
    { el: animLayer('w-goby2', goby('#9ed27a')), x: 1120, y: 660, ax: 150, ay: 30, k: 2, ph: 2.1, s: 0.8 },
  ];
  const crabEl = animLayer('w-crab', `<svg width="70" height="60" viewBox="-35 -40 70 60" style="position:absolute;left:-35px;top:-40px;overflow:visible">
    <ellipse cx="0" cy="6" rx="26" ry="7" fill="${P.crevice}" fill-opacity=".25"/>
    <path d="M-16 4 L-24 10 M16 4 L24 10" stroke="#e87a52" stroke-width="4" stroke-linecap="round"/>
    <path d="M-14 -2 C-20 -26 10 -38 20 -16 C26 -2 14 6 0 6 C-10 6 -14 4 -14 -2Z" fill="#c9a7e8"/>
    <path d="M-6 -14 C-2 -24 10 -26 14 -18" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M-12 2 C-18 4 -24 0 -24 -6 C-18 -8 -12 -4 -12 2Z" fill="#ff8f5e"/><circle cx="-20" cy="-10" r="2.4" fill="#3b335e"/></svg>`);

  {
    let s = svgOpen(DW + 200, DH + 200, -100, -100) + `<defs>
      <radialGradient id="deep-g" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#14a4b2" stop-opacity=".5"/><stop offset="1" stop-color="#55d4cf" stop-opacity=".28"/></radialGradient>
      <linearGradient id="rim-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f6e" stop-opacity=".6"/><stop offset=".22" stop-color="#3a3f6e" stop-opacity=".12"/><stop offset=".4" stop-color="#3a3f6e" stop-opacity="0"/></linearGradient>
      <linearGradient id="refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2fbff" stop-opacity="0"/><stop offset=".14" stop-color="#eef9ff" stop-opacity=".62"/><stop offset=".5" stop-color="#e8f7ff" stop-opacity=".16"/><stop offset=".75" stop-color="#e8f7ff" stop-opacity="0"/></linearGradient></defs>`;
    for (const p of pools) {
      s += `<path d="${p.d}" fill="url(#deep-g)"/><path d="${p.d}" fill="url(#refl)"/><path d="${p.d}" fill="url(#rim-sh)"/>`;
    }
    s += `<path d="${WA.blob(760, 548, 70, 22, ART.mulberry32(5), 0.2).d}" fill="#4f4773" fill-opacity=".22"/>`;
    s += `<path d="${WA.blob(1250, 540, 96, 24, ART.mulberry32(6), 0.2).d}" fill="#4f4773" fill-opacity=".2"/>`;
    s += '</svg>';
    cam.insertAdjacentHTML('beforeend', `<div id="w-water" style="position:absolute;left:0;top:0">${s}</div>`);
  }

  const surf = animLayer('w-surface', `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible"><defs>
      <radialGradient id="g-glint"><stop offset="0" stop-color="#fffdf2" stop-opacity=".95"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <radialGradient id="g-shrimp"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#ffe27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffcb4f" stop-opacity="0"/></radialGradient></defs>
    ${[0, 1, 2].map(() => '<ellipse class="rip" rx="60" ry="14" fill="none" stroke="#ffffff" stroke-width="3"/>').join('')}
    ${Array.from({ length: 14 }, () => '<ellipse class="gl" rx="22" ry="3.5" fill="url(#g-glint)"/>').join('')}
    ${Array.from({ length: 8 }, () => '<g class="sh"><circle r="26" fill="url(#g-shrimp)"/><circle r="3.4" fill="#fffbe6"/></g>').join('')}
    <g id="w-splash">${[0, 1].map(() => `<g class="sring"><ellipse rx="100" ry="26" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="16"/><ellipse rx="100" ry="26" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="5"/></g>`).join('')}
      ${[0, 1, 2, 3, 4].map(() => '<circle class="sdrop" r="6" fill="#fff" fill-opacity=".85"/>').join('')}</g></svg>`);
  const ripEls = [...surf.querySelectorAll('.rip')], glEls = [...surf.querySelectorAll('.gl')], shEls = [...surf.querySelectorAll('.sh')];
  const splash = surf.querySelector('#w-splash');
  const splashRings = [...surf.querySelectorAll('.sring')], splashDrops = [...surf.querySelectorAll('.sdrop')];
  const ripples = [{ x: 820, y: 640, ph: 0 }, { x: 1180, y: 700, ph: 0.33 }, { x: 980, y: 760, ph: 0.66 }];
  const glints = Array.from({ length: 14 }, () => ({ x: 760 + rnd() * 560, y: 545 + Math.pow(rnd(), 1.5) * 90, ph: rnd() * 6.28, k: 4 + Math.floor(rnd() * 6) }));
  const shrimp = Array.from({ length: 8 }, () => ({ x: 640 + rnd() * 720, y: 620 + rnd() * 190, ph: rnd() * 6.28, k: 1 + Math.floor(rnd() * 2), r: 12 + rnd() * 18 }));

  {
    const r = ART.mulberry32(9090);
    let s = svgOpen(DW + 400, DH + 400, -200, -200) + `<defs>
      <linearGradient id="rim" x1="0" y1="1" x2="1" y2="0"><stop offset=".45" stop-color="#fff3e2" stop-opacity="0"/><stop offset=".8" stop-color="#fff3e2" stop-opacity=".85"/></linearGradient>
      <linearGradient id="shelf-fade" x1="0" y1="440" x2="0" y2="1200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b9b0cc"/><stop offset="1" stop-color="#7c7298"/></linearGradient>
      <clipPath id="holes"><path clip-rule="evenodd" d="M-300 300 H2300 V1400 H-300Z ${pools.map((p) => p.d).join(' ')}"/></clipPath></defs>`;
    const edge = (x) => 470 + 12 * Math.sin(x / 140 + 1) + 8 * Math.sin(x / 61);
    let ground = 'M-300 1400 L-300 ' + f(edge(-300));
    for (let x = -300; x <= 2300; x += 40) ground += ` L${x} ${f(edge(x))}`;
    ground += ' L2300 1400Z';
    let g = `<path d="${ground}" fill="url(#shelf-fade)"/>`;
    for (let y = 474; y < 1240; y += 40 + (y - 470) * 0.1) {
      const sc = 0.55 + (y - 470) / 640;
      for (let x = -260 + r() * 160; x < 2260; x += (220 + r() * 170) * sc) {
        const rx = (120 + r() * 120) * sc, ry = rx * (0.2 + r() * 0.1);
        g += WA.slab(x, y + (r() - 0.5) * 20, rx, ry, r, r());
      }
    }
    let bk = '';
    for (let i = 0; i < 420; i++) {
      const x = -150 + r() * 2200, y = 480 + Math.pow(r(), 0.8) * 700, rr = 1.4 + r() * 2.2 * (0.6 + (y - 480) / 700);
      bk += `M${f(x - rr)} ${f(y)}a${f(rr)} ${f(rr * 0.7)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr * 0.7)} 0 1 0 ${f(-rr * 2)} 0Z`;
    }
    g += `<path d="${bk}" fill="${P.barnacle}" fill-opacity=".6"/>`;
    let cr = '';
    for (let i = 0; i < 26; i++) {
      let x = -100 + r() * 2100, y = 500 + r() * 640;
      cr += `M${f(x)} ${f(y)}`;
      for (let j = 0; j < 4; j++) { x += 20 + r() * 50; y += (r() - 0.5) * 22; cr += ` L${f(x)} ${f(y)}`; }
    }
    g += `<path d="${cr}" fill="none" stroke="${P.crevice}" stroke-opacity=".45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const p of pools) {
      g += `<path d="${WA.roundPoly(WA.shift(p.P, 0, 4, 1.12, p.cx, p.cy))}" fill="${P.wet}" fill-opacity=".5"/>`;
      g += `<path d="${WA.roundPoly(WA.shift(p.P, 0, 2, 1.05, p.cx, p.cy))}" fill="${P.wet}" fill-opacity=".55"/>`;
    }
    g += `<path d="M-300 ${f(edge(-300) - 6)} ${Array.from({ length: 66 }, (_, i) => `L${-300 + i * 40} ${f(edge(-300 + i * 40) - 6)}`).join(' ')} L2300 560 L-300 560Z" fill="${P.wet}" fill-opacity=".45"/>`;
    s += `<g clip-path="url(#holes)">${g}</g>`;
    for (const p of pools) {
      const id = 'wall' + p.seed;
      s += `<clipPath id="${id}"><path d="${p.d}"/></clipPath><g clip-path="url(#${id})">` +
        `<path fill-rule="evenodd" d="M-300 300 H2300 V1400 H-300Z ${WA.roundPoly(WA.shift(p.P, 0, p.ry * 0.2))}" fill="${P.rockShade}"/>` +
        `<path fill-rule="evenodd" d="M-300 300 H2300 V1400 H-300Z ${WA.roundPoly(WA.shift(p.P, 0, p.ry * 0.13))}" fill="${P.rock}"/>`;
      let cc = '';
      p.P.forEach((q, i) => {
        if (q[1] > p.cy - p.ry * 0.25 || r() < 0.3) return;
        cc += WA.blob(q[0], q[1] + p.ry * 0.21, 14 + r() * 26, 4 + r() * 4, r, 0.3, 7).d;
      });
      s += `<path d="${cc}" fill="${P.coral}"/></g>`;
      s += `<path d="${p.d}" fill="none" stroke="#e9e2f2" stroke-opacity=".5" stroke-width="3" clip-path="url(#lip${p.seed})"/>` +
        `<clipPath id="lip${p.seed}"><rect x="${p.cx - p.rx * 1.2}" y="${p.cy + p.ry * 0.2}" width="${p.rx * 2.4}" height="${p.ry * 1.2}"/></clipPath>`;
    }
    for (const p of pools) {
      for (let i = 0; i < Math.round(p.rx / 40); i++) {
        const a = 0.15 + r() * 0.7, idx = Math.floor(a * p.P.length / 2) % p.P.length;
        const q = p.P[idx];
        s += `<path d="${WA.blob(q[0], q[1] + 4, 16 + r() * 20, 6 + r() * 5, r, 0.3, 7).d}" fill="${r() < 0.5 ? P.coral : P.coralDeep}" fill-opacity=".9"/>`;
      }
    }
    const weed = (x, y, n, s0 = 1) => WA.lettuce(x, y, 76 * s0, r, n, '#8f8040', '#c2ab55', 1.0);
    const boulders = [
      [690, 520, 108, 62, 1], [860, 506, 70, 40, 1], [1290, 512, 132, 70, 1], [1452, 552, 66, 40, 0],
      [-20, 470, 230, 120, 1], [140, 560, 120, 64, 0], [1880, 486, 210, 110, 1], [1760, 560, 90, 48, 0],
      [520, 870, 96, 54, 1], [1490, 838, 120, 60, 1], [40, 700, 140, 70, 0], [1890, 760, 150, 80, 0],
      [960, 1000, 110, 50, 0], [700, 960, 70, 36, 0],
    ];
    boulders.sort((a, b) => a[1] - b[1]);
    for (const [cx, cy, rx, ry, wet] of boulders) {
      s += WA.rock(cx, cy, rx, ry, r, { wet }).svg;
      if (wet && cy < 600) s += weed(cx - rx * 0.1, cy + ry * 0.66, Math.round(rx / 18), Math.min(1.2, rx / 100));
    }
    [[600, 828, 90], [1418, 818, 110], [430, 760, 70], [1508, 640, 70], [180, 842, 60], [1820, 662, 60], [880, 520, 60]].forEach(([x, y, w]) => { s += WA.lettuce(x, y, w, r); });
    s += WA.star(160, 905, 30, -40, r, P.bat, P.batDeep, false, 0.58);
    s += WA.star(1790, 690, 22, 10, r, P.ochre, '#7a4cb0', true, 0.58);
    s += WA.pebbles(980, 930, 1300, 130, r, 24, ['#efe6d8', '#f4c9b5', '#d9cfe6']);
    s += '</svg>';
    cam.insertAdjacentHTML('beforeend', `<div id="w-shelf" style="position:absolute;left:0;top:0">${s}</div>`);
  }

  const wetGl = Array.from({ length: 22 }, (_, i) => {
    const p = pools[i % 3], a = rnd() * 6.28;
    return { x: p.cx + Math.cos(a) * p.rx * (1.03 + rnd() * 0.12), y: p.cy + Math.sin(a) * p.ry * (1.05 + rnd() * 0.2) - 4, ph: rnd() * 6.28, k: 3 + Math.floor(rnd() * 5) };
  });
  const wetEl = animLayer('w-wet', `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible">${wetGl.map((g) =>
    `<path class="wg" transform="translate(${f(g.x)} ${f(g.y)})" d="${ART.sparklePath(0, 0, 9, 0.18)}" fill="#fffbea"/>`).join('')}</svg>`);
  const wetEls = [...wetEl.querySelectorAll('.wg')];

  const surges = [{ x: 380, ph: 0 }, { x: 1080, ph: 0.27 }, { x: 1560, ph: 0.55 }, { x: 760, ph: 0.8 }];
  {
    let s = '';
    surges.forEach((sg, i) => {
      const r = ART.mulberry32(500 + i);
      let d = '';
      for (let j = 0; j < 11; j++) {
        const x = (r() - 0.5) * 300, y = -r() * 22, rr = 12 + r() * 20;
        d += `M${f(x - rr)} ${f(y)}a${f(rr)} ${f(rr * 0.5)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr * 0.5)} 0 1 0 ${f(-rr * 2)} 0Z`;
      }
      let sp = '';
      for (let j = 0; j < 7; j++) {
        const x = (r() - 0.5) * 240, y = -30 - r() * 34, rr = 3 + r() * 4;
        sp += `M${f(x - rr)} ${f(y)}a${f(rr)} ${f(rr)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr)} 0 1 0 ${f(-rr * 2)} 0Z`;
      }
      s += `<div class="surge" style="position:absolute;left:${sg.x}px;top:466px;width:0;height:0;will-change:transform,opacity"><svg width="10" height="10" style="position:absolute;overflow:visible">` +
        `<path d="M-190 8 Q0 -14 190 8 Q0 30 -190 8Z" fill="#e6fbfb" fill-opacity=".7"/><path d="${d}" fill="#ffffff" fill-opacity=".9"/><path d="${sp}" fill="#ffffff" fill-opacity=".8"/></svg></div>`;
    });
    $('#w-surf').innerHTML = s;
  }
  const surgeEls = [...host.querySelectorAll('.surge')];

  {
    const r = ART.mulberry32(31337);
    const nearRock = (cx, cy, rx, ry, flip) => {
      const rk = WA.rock(cx, cy, rx, ry, r, { pal: { lit: '#8d82a6', body: '#625a83', shade: '#3f3864' }, barnacles: 40, contact: false });
      let kelp = '';
      for (let i = 0; i < 7; i++) {
        const x = cx + flip * (rx * 0.1 + i * rx * 0.1), y = cy - ry * (0.5 + 0.08 * Math.sin(i));
        kelp += WA.ribbon(x, y, 140 + r() * 120, 13, flip > 0 ? 170 - i * 8 : 10 + i * 8, (r() - 0.5) * 0.5, 2);
      }
      return rk.svg + `<path d="${kelp}" fill="#6a8f4a"/>`;
    };
    $('#w-near').innerHTML =
      `<div style="position:absolute;left:0;top:0;filter:blur(13px)">${svgOpen(1000, 700, -460, 800)}${nearRock(10, 1150, 420, 240, 1)}</svg></div>` +
      `<div style="position:absolute;left:0;top:0;filter:blur(13px)">${svgOpen(1000, 700, 1400, 780)}${nearRock(1930, 1130, 430, 250, -1)}</svg></div>`;
  }

  const gradeDiv = (id, blend, bg) =>
    `<div id="${id}" style="position:absolute;left:0;top:0;width:${DW + 400}px;height:${DH + 400}px;transform-origin:0 0;` +
    `transform:translate(${f(ox0)}px,${f(oy0)}px) scale(${k.toFixed(5)}) translate(-200px,-200px);mix-blend-mode:${blend};opacity:0;background:${bg}"></div>`;
  $('#w-grade').outerHTML =
    gradeDiv('gr-gold-m', 'multiply', `linear-gradient(180deg,#fff 0px,#fff ${HZ + 200}px,#ffdcd2 ${HZ + 204}px,#ffd4c4 ${670}px,#ffd2ae ${700}px,#f6bea4 ${DH + 400}px)`) +
    gradeDiv('gr-gold-s', 'screen', `radial-gradient(ellipse 150px 240px at 1500px ${HZ + 320}px, rgba(255,200,130,.75) 0%, rgba(255,170,110,.25) 55%, rgba(255,160,100,0) 100%), ` +
      `radial-gradient(ellipse 900px 600px at 1700px ${HZ + 420}px, rgba(255,170,90,.42) 0%, rgba(255,150,90,.12) 55%, rgba(255,150,90,0) 100%)`) +
    gradeDiv('gr-dusk-m', 'multiply', `linear-gradient(180deg,#fff 0px,#fff ${HZ + 200}px,#d6c4ea ${HZ + 204}px,#bba8de ${670}px,#a690d0 ${700}px,#7d6cb8 ${DH + 400}px)`) +
    gradeDiv('gr-dusk-s', 'screen', `radial-gradient(ellipse 900px 160px at 1450px ${HZ + 206}px, rgba(255,150,130,.55) 0%, rgba(255,120,150,.16) 55%, rgba(255,120,150,0) 100%)`);
  if (ctx.params.soft > 0) cam.style.filter = `blur(${ctx.params.soft}px)`;
  const grGold = [$('#gr-gold-m'), $('#gr-gold-s')], grDusk = [$('#gr-dusk-m'), $('#gr-dusk-s')];
  const glass = $('#w-glass'), dim = $('#w-dim');

  const cache = new WeakMap();
  const memo = (el) => { let c = cache.get(el); if (!c) cache.set(el, (c = {})); return c; };
  const put = (el, prop, v) => { const c = memo(el); if (c[prop] !== v) { c[prop] = v; el.style[prop] = v; } };
  const attr = (el, name, v) => { const c = memo(el); if (c['@' + name] !== v) { c['@' + name] = v; el.setAttribute(name, v); } };
  const D = S.DUR;
  const camAt = (t) => ({
    dx: 22 * M.osc(t, D, 1, 0.4) + 5 * M.osc(t, D, 3, 1.1),
    dy: 7 * M.osc(t, D, 2, 2.2) + 2 * M.osc(t, D, 5) + S.bump(t),
  });
  const T = S.T;
  const covered = (t) => { const tb = S.tb(t); return tb >= T.tideInEnd + 0.06 && tb < T.tideOut - 0.02; };

  function update(t) {
    const p = S.dayPhase(t), depth = S.menuDepth(t);
    const gold = M.clamp(p) * (p <= 1 ? 1 : 2 - p), dusk = M.clamp(p - 1);
    put(host, 'visibility', covered(t) ? 'hidden' : 'visible');
    put(skyEls[0], 'opacity', gold.toFixed(3));
    put(skyEls[1], 'opacity', dusk.toFixed(3));
    put(grGold[0], 'opacity', (gold * 0.75).toFixed(3)); put(grGold[1], 'opacity', (gold * 0.9).toFixed(3));
    put(grDusk[0], 'opacity', (dusk * 0.8).toFixed(3)); put(grDusk[1], 'opacity', (dusk * 0.8).toFixed(3));
    put(dim, 'opacity', (depth * 0.26).toFixed(3));
    put(glass, 'visibility', depth > 0.001 ? 'visible' : 'hidden');
    put(glass, 'opacity', depth.toFixed(3));
    put(glass, 'backdropFilter', depth > 0.001 ? `blur(${(9 * depth).toFixed(2)}px)` : 'none');
    put(glass, 'webkitBackdropFilter', depth > 0.001 ? `blur(${(9 * depth).toFixed(2)}px)` : 'none');

    const { dx, dy } = camAt(t);
    const mv = (el, kk) => put(el, 'transform', `translate(${(ox0 + dx * kk).toFixed(2)}px,${(oy0 + dy * kk).toFixed(2)}px) scale(${k.toFixed(5)})`);
    mv(cam, 1); mv($near, 1.7); mv($surf, 0.5);

    const sx = M.mix(1350, 1250, p / 2), sy = p <= 1 ? M.mix(78, 150, p) : M.mix(150, HZ + 4, p - 1);
    put(sun, 'transform', `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) scale(${(p <= 1 ? 1 : M.mix(1, 1.3, p - 1)).toFixed(3)})`);
    put(sun, 'opacity', (p <= 1 ? 0.95 : M.mix(0.95, 0.75, p - 1)).toFixed(3));
    const beat = Math.pow(0.5 + 0.5 * M.osc(t, D, 6), 3);
    put(lamp, 'opacity', (M.clamp(p - 0.6) * (0.35 + 0.65 * beat)).toFixed(3));
    for (let i = 0; i < gullEls.length; i++) {
      const gl = gulls[i];
      const u = ((t / D) + gl.ph) % 1;
      const x = -200 + u * (DW + 400), y = gl.y + 16 * Math.sin(u * 9 + i);
      const flap = 0.55 + 0.45 * Math.sin(t * (9 + i * 1.7) * Math.PI / 2 + i);
      attr(gullEls[i], 'transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${gl.s} ${(gl.s * flap).toFixed(3)})`);
    }

    surgeEls.forEach((el, i) => {
      const u = ((t / D) * 4 + surges[i].ph) % 1;
      const x = u / 0.32;
      if (x >= 1) { put(el, 'opacity', '0'); return; }
      const sc = 0.45 + 0.65 * M.easeOut(x);
      put(el, 'transform', `translate(0px,${(-8 * Math.sin(x * Math.PI) + 18 * x).toFixed(1)}px) scale(${sc.toFixed(3)},${(sc * (0.6 + 0.5 * Math.sin(x * Math.PI))).toFixed(3)})`);
      put(el, 'opacity', (Math.min(1, x * 6) * (1 - M.easeIn(x))).toFixed(3));
    });

    caus.forEach((c) => {
      const u = t / D;
      put(c.el, 'transform', `translate(${(c.kx * c.tile * u).toFixed(2)}px,${(c.ky * c.tile * CSQ * u).toFixed(2)}px)`);
    });
    grassRoots.forEach((g, i) => {
      const sw = 0.28 * M.osc(t, D, g.k, g.ph) + 0.1 * M.osc(t, D, g.k * 3, g.ph * 2);
      attr(grassPaths[i], 'd', WA.ribbon(g.x, g.y, g.len, g.w, g.a, sw, 0.6));
    });
    gobies.forEach((g) => {
      const u = (t / D) * g.k * Math.PI * 2 + g.ph;
      const x = g.x + g.ax * Math.sin(u), y = g.y + g.ay * Math.sin(2 * u);
      const vx = Math.cos(u);
      put(g.el, 'transform', `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(vx >= 0 ? 1 : -1) * g.s},${g.s})`);
    });
    {
      const u = M.osc(t, D, 1, 0.5);
      const x = 1060 + 90 * u, y = 712 + 10 * Math.sin(t * 6);
      put(crabEl, 'transform', `translate(${x.toFixed(1)}px,${(712 + 2 * Math.abs(Math.sin(t * 7))).toFixed(1)}px) scale(${M.osc(t, D, 1, 0.5 + Math.PI / 2) >= 0 ? -1 : 1},1)`);
      void y;
    }

    ripples.forEach((rp, i) => {
      const u = ((t / D) * 3 + rp.ph) % 1;
      attr(ripEls[i], 'transform', `translate(${rp.x} ${rp.y}) scale(${(0.2 + 1.3 * u).toFixed(3)})`);
      attr(ripEls[i], 'stroke-opacity', (0.5 * (1 - u) * Math.min(1, u * 5)).toFixed(3));
    });
    glints.forEach((g, i) => {
      const tw = 0.5 + 0.5 * M.osc(t, D, g.k, g.ph);
      attr(glEls[i], 'transform', `translate(${(g.x + 8 * M.osc(t, D, 2, g.ph)).toFixed(1)} ${g.y.toFixed(1)})`);
      attr(glEls[i], 'opacity', (tw * (0.55 + 0.45 * gold) * (1 - 0.6 * dusk)).toFixed(3));
    });
    shrimp.forEach((sh, i) => {
      const u = (t / D) * sh.k * Math.PI * 2 + sh.ph;
      attr(shEls[i], 'transform', `translate(${(sh.x + 20 * Math.sin(u)).toFixed(1)} ${(sh.y + 8 * Math.sin(u * 2)).toFixed(1)}) scale(${(sh.r / 26).toFixed(3)})`);
      attr(shEls[i], 'opacity', (dusk * (0.65 + 0.35 * Math.sin(u * 3))).toFixed(3));
    });
    wetEls.forEach((el, i) => {
      const g = wetGl[i];
      const tw = Math.pow(0.5 + 0.5 * M.osc(t, D, g.k, g.ph), 6);
      attr(el, 'opacity', (tw * (1 - 0.5 * dusk)).toFixed(3));
    });
    const sx0 = t - T.bite;
    splashRings.forEach((r, i) => {
      const x = (sx0 - i * 0.18) / 0.9;
      const on = x > 0 && x < 1;
      attr(r, 'transform', `translate(${biteW.x} ${biteW.y}) scale(${on ? (0.12 + 1.1 * M.easeOut(x)).toFixed(3) : 0.001})`);
      attr(r, 'opacity', on ? (1 - x).toFixed(3) : '0');
    });
    splashDrops.forEach((d, i) => {
      const x = sx0 - 0.02 * i;
      const on = x > 0 && x < 0.6;
      const vx = (i - 2) * 70, vy = -260 - (i % 2) * 90;
      attr(d, 'transform', on ? `translate(${(biteW.x + vx * x).toFixed(1)} ${(biteW.y + vy * x + 900 * x * x).toFixed(1)})` : `translate(${biteW.x} ${biteW.y})`);
      attr(d, 'opacity', on ? (1 - x / 0.6).toFixed(3) : '0');
    });
  }
  const $near = $('#w-near'), $surf = $('#w-surf');
  const biteW = { x: 1000, y: 610 };

  return {
    update,
    toScreen(x, y, t) { const c = camAt(t); return { x: ox0 + c.dx + x * k, y: oy0 + c.dy + y * k }; },
    biteW,
  };
}
