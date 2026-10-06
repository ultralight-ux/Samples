function buildUI(ctx, root) {
  const A = ART, C = A.C, S = STORY, T = S.T;
  const LW = ctx.LW, LH = ctx.LH;

  const cache = new WeakMap();
  const memo = (el) => { let c = cache.get(el); if (!c) cache.set(el, (c = {})); return c; };
  const put = (el, p, v) => { const c = memo(el); if (c[p] !== v) { c[p] = v; el.style[p] = v; } };
  const attr = (el, n, v) => { const c = memo(el); if (c['@' + n] !== v) { c['@' + n] = v; el.setAttribute(n, v); } };
  const text = (el, v) => { const c = memo(el); if (c.txt !== v) { c.txt = v; el.textContent = v; } };
  const html = (el, v) => { const c = memo(el); if (c.html !== v) { c.html = v; el.innerHTML = v; } };
  const r2 = (v) => Math.round(v * 100) / 100;
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const tf = (el, x = 0, y = 0, s = 1, r = 0, sx = 1, sy = 1) =>
    put(el, 'transform', `translate(${r2(x)}px,${r2(y)}px) rotate(${r2(r)}deg) scale(${r3(s * sx)},${r3(s * sy)})`);
  const vis = (el, o) => {
    put(el, 'opacity', o >= 0.999 ? '1' : o <= 0.001 ? '0' : o.toFixed(3));
    put(el, 'visibility', o <= 0.001 ? 'hidden' : 'visible');
  };
  const mk = (tag, cls, parent, css, inner) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) e.style.cssText = css;
    if (inner !== undefined) e.innerHTML = inner;
    if (parent) parent.appendChild(e);
    return e;
  };
  const svgIcon = (fn, size, px = 3.5) => A.svg(fn, size, px * 64 / size);
  const peb = (parent, x, y, w, h, o = {}, css = '') => {
    const p = A.pebble({ w, h, ...o });
    const el = mk('div', 'pw', parent, `left:${x}px;top:${y}px;width:${w}px;height:${h}px;${css}`);
    el.innerHTML = p.lip + `<div class="pf">${p.face}<div class="pc"></div></div>`;
    return { el, face: el.querySelector('.pf'), ct: el.querySelector('.pc'), x, y, w, h };
  };
  const label = (parent, x, y, str, cls = '', css = '') => mk('div', 't ' + cls, parent, `left:${x}px;top:${y}px;${css}`, str);
  const voice = (el, str) => {
    el.innerHTML = '';
    const spans = [];
    str.split(' ').forEach((w, i, all) => {
      const ws = mk('span', 'vw', el);
      for (const ch of w) spans.push(mk('span', 'vc', ws, '', ch === '<' ? '&lt;' : ch));
      if (i < all.length - 1) { el.appendChild(document.createTextNode(' ')); spans.push(null); }
    });
    return spans;
  };
  const typeOn = (spans, t, start, dt = 0.022) => {
    for (let i = 0; i < spans.length; i++) {
      const s = spans[i];
      if (!s) continue;
      const x = t - (start + i * dt);
      if (x <= 0) { vis(s, 0); put(s, 'transform', 'none'); } else if (x >= 0.45) { vis(s, 1); put(s, 'transform', 'none'); } else {
        vis(s, M.clamp(x / 0.06));
        put(s, 'transform', `translateY(${r2(7 * (1 - M.spring(x, 22, 0.45)))}px)`);
      }
    }
  };
  const typeDone = (spans, start, dt = 0.022) => start + spans.length * dt;
  const pose = (el, e, ex = 0, ey = 0) => { tf(el, ex * e.out, ey * e.out, e.s, e.r); vis(el, e.o); };

  const foamRing = (parent, z = 5) => {
    const el = mk('div', 'ring', parent, `z-index:${z}`);
    el.innerHTML = `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible"><path class="r0" fill="none" stroke="${C.ink}" stroke-width="10.5" stroke-linejoin="round"/><path class="r1" fill="none" stroke="${C.sea}" stroke-width="5.5" stroke-linejoin="round"/></svg>`;
    return { el, p0: el.querySelector('.r0'), p1: el.querySelector('.r1') };
  };
  const ringPose = (ring, cx, cy, w, h, t, o = 1, n = 4, bumps = 16) => {
    const br = 1 + 0.025 * Math.sin(t * Math.PI * 2 / 1.5);
    const d = A.foamPath(0, 0, (w / 2) * br, (h / 2) * br, bumps, 6, Math.PI * 8 * t / S.DUR, n);
    attr(ring.p0, 'd', d); attr(ring.p1, 'd', d);
    tf(ring.el, cx, cy);
    vis(ring.el, o);
  };

  root.innerHTML = '';
  const hud = mk('div', 'layer', root);
  const fxLayer = mk('div', 'layer', root);
  const clamLayer = mk('div', 'layer', root);
  const tideLayer = mk('div', 'layer', root);
  const bookLayer = mk('div', 'layer', root);

  const DAYW = 364;
  const day = peb(hud, 56, 44, DAYW, 124, { r: 44, seed: 11 }, 'transform-origin:0 0;z-index:2');
  day.ct.innerHTML = `
    <svg width="100" height="100" viewBox="0 0 100 100" style="position:absolute;left:14px;top:12px;overflow:visible">
      <defs>
        <clipPath id="ph-clip"><circle cx="50" cy="50" r="45"/></clipPath>
        <linearGradient id="ph-aft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#84c4f0"/><stop offset="1" stop-color="#e8f6f2"/></linearGradient>
        <linearGradient id="ph-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4a98e"/><stop offset="1" stop-color="#ffe2a2"/></linearGradient>
        <linearGradient id="ph-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d58ad"/><stop offset="1" stop-color="#ff9d97"/></linearGradient>
      </defs>
      <g clip-path="url(#ph-clip)">
        <rect width="100" height="100" fill="url(#ph-aft)"/>
        <rect id="ph-g2" width="100" height="100" fill="url(#ph-gold)" opacity="0"/>
        <rect id="ph-g3" width="100" height="100" fill="url(#ph-dusk)" opacity="0"/>
        <g id="ph-sun"><circle r="17" fill="#fff4c4" fill-opacity=".45"/><circle r="10.5" fill="${C.yolk}" stroke="${C.ink}" stroke-width="2.6"/></g>
        <path id="ph-rock" d="M58 100 L60 84 C62 76 70 74 76 77 C82 74 88 79 88 86 L90 100 Z" fill="${C.sandDeep}" stroke="${C.ink}" stroke-width="2.6"/>
        <path id="ph-sea" d="M-60 0 C-50 -5 -40 -5 -30 0 C-20 5 -10 5 0 0 C10 -5 20 -5 30 0 C40 5 50 5 60 0 C70 -5 80 -5 90 0 C100 5 110 5 120 0 C130 -5 140 -5 150 0 V60 H-60 Z" fill="${C.sea}" stroke="${C.ink}" stroke-width="2.6"/>
      </g>
      <circle cx="50" cy="50" r="45" fill="none" stroke="${C.ink}" stroke-width="3.5"/>
    </svg>
    <div class="t f600 clock" style="left:138px;top:16px;font-size:60px"><span id="clk"></span><span class="ap" id="clk-ap" style="font-size:27px;margin-left:7px;color:${C.inkSoft};font-weight:500">pm</span></div>
    <div class="t f500" style="left:140px;top:84px;font-size:21px;color:${C.inkSoft}">Sat, Summer 14</div>`;
  const phG2 = day.ct.querySelector('#ph-g2'), phG3 = day.ct.querySelector('#ph-g3');
  const phSun = day.ct.querySelector('#ph-sun'), phSea = day.ct.querySelector('#ph-sea'), phRock = day.ct.querySelector('#ph-rock');
  const clk = day.ct.querySelector('#clk');

  const info = peb(hud, 56, 182, DAYW, 58, { r: 29, seed: 12, lipH: 5 }, 'transform-origin:0 0');
  const HALF = DAYW / 2;
  info.ct.innerHTML =
    `<div class="wh abs" style="left:0;top:0;width:${HALF}px;height:58px;transform-origin:50% 50%"><div class="ic" style="position:absolute;left:12px;top:9px"></div><div class="t f600 wl" style="left:56px;top:20px;font-size:19px"></div></div>` +
    `<svg width="10" height="10" style="position:absolute;left:${HALF - 3}px;top:26px;overflow:visible"><circle cx="3" cy="3" r="3.2" fill="${C.ink}" fill-opacity=".28"/></svg>` +
    `<div class="th abs" style="left:${HALF}px;top:0;width:${HALF}px;height:58px;transform-origin:50% 50%">` +
    `<svg width="10" height="10" style="position:absolute;left:30px;top:29px;overflow:visible"><circle r="15" fill="none" stroke="${C.coral}" stroke-width="3" class="tpr"/></svg>` +
    `<div style="position:absolute;left:10px;top:9px">${svgIcon(A.GLYPHS.wave, 40)}</div><div class="t f600 tl" style="left:54px;top:20px;font-size:19px"></div></div>`;
  const wHalf = info.ct.querySelector('.wh'), tHalf = info.ct.querySelector('.th');
  const wIcon = info.ct.querySelector('.ic'), wLabel = info.ct.querySelector('.wl');
  const tLabel = info.ct.querySelector('.tl'), tPipRing = info.ct.querySelector('.tpr');
  const WEATHER = [[0, 'sun', 'Sunny, 24°'], [6.6, 'sunset', 'Golden hour'], [11.2, 'moon', 'Clear dusk']];

  const money = peb(hud, LW - 56 - 244, 44, 244, 78, { r: 39, seed: 21 }, 'transform-origin:100% 0');
  money.ct.innerHTML = `<div style="position:absolute;left:12px;top:11px">${svgIcon(A.GLYPHS.sanddollar, 56)}</div><div class="t f600" style="left:80px;top:19px;font-size:40px">12,480</div>`;

  const goal = peb(hud, LW - 56 - 384, 142, 384, 100, { r: 32, seed: 22 }, 'transform-origin:100% 0');
  goal.ct.innerHTML = `<div style="position:absolute;left:14px;top:18px">${svgIcon(A.TOOLS.pail, 62)}</div>
    <div class="t f600" style="left:88px;top:20px;font-size:21px">Catch 3 tidepool critters</div>
    <div class="t f600 gc" style="left:318px;top:58px;font-size:21px;color:${C.inkSoft}"></div>
    <svg width="160" height="36" style="position:absolute;left:84px;top:52px;overflow:visible">${[0, 1, 2].map((i) =>
      `<g class="gp" transform="translate(${18 + i * 40} 16)"><circle r="14" fill="${C.sand}" stroke="${C.ink}" stroke-width="3"/>` +
      `<g class="gpd"><circle r="14" fill="${C.sea}" stroke="${C.ink}" stroke-width="3"/><path d="M-6 0.5 L-1.5 5 L6.5 -4.5" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></g></g>`).join('')}</svg>`;
  const goalDone = [...goal.ct.querySelectorAll('.gpd')], goalCount = goal.ct.querySelector('.gc');

  const TOOLS = [['net', 'Bug net'], ['rod', 'Fishing rod'], ['shovel', 'Shovel'], ['can', 'Watering can'], ['pail', 'Tide pail'], ['bait', 'Bait jar', 7], ['berries', 'Seaberries', 3]];
  const slotW = 88, gap = 20, trayPad = 22;
  const trayW = TOOLS.length * slotW + (TOOLS.length - 1) * gap + trayPad * 2, trayH = 114;
  const trayX = Math.round(LW / 2 - trayW / 2), trayY = LH - 40 - trayH;
  const tray = peb(hud, trayX, trayY, trayW, trayH, { r: 46, seed: 31, face: '#dcae7c', lip: '#b47d4f', lipH: 8, glossA: 0.45 }, 'transform-origin:50% 100%');
  {
    const rg = A.mulberry32(37);
    let grain = '';
    for (let i = 0; i < 5; i++) {
      const y = 16 + i * 21 + rg() * 6, x0 = 30 + rg() * 60, x1 = trayW - 30 - rg() * 60;
      const w1 = (rg() - 0.5) * 10, w2 = (rg() - 0.5) * 10;
      grain += `<path d="M${x0.toFixed(0)} ${y.toFixed(1)} C${(x0 + (x1 - x0) * 0.3).toFixed(0)} ${(y + w1).toFixed(1)} ${(x0 + (x1 - x0) * 0.7).toFixed(0)} ${(y + w2).toFixed(1)} ${x1.toFixed(0)} ${y.toFixed(1)}" fill="none" stroke="#c49162" stroke-width="3" stroke-linecap="round"/>`;
    }
    grain += `<ellipse cx="${trayW * 0.31}" cy="60" rx="12" ry="5" fill="none" stroke="#b9845a" stroke-width="3"/><ellipse cx="${trayW * 0.74}" cy="38" rx="9" ry="4" fill="none" stroke="#b9845a" stroke-width="3"/>`;
    mk('div', 'abs', tray.ct, 'left:0;top:0', `<svg width="${trayW}" height="${trayH}">${grain}</svg>`);
  }
  const slots = TOOLS.map(([id, name, count], i) => {
    const s = peb(tray.ct, trayPad + i * (slotW + gap), 12, slotW, slotW, { kind: 'blob', seed: 40 + i, blob: { n: 3.6, irr: 0.05 }, lip: '#e9d6b4', lipH: 6, shadowA: 0.22, shadowY: 9, pad: 12 });
    s.ct.innerHTML = `<div style="position:absolute;left:12px;top:11px">${svgIcon(A.TOOLS[id], 64)}</div>` +
      (count ? `<div class="cnt t f600">${count}</div>` : '');
    return s;
  });
  const slotSel = slots.map((s) => {
    const p = A.pebble({ w: slotW, h: slotW, kind: 'blob', seed: 40 + slots.indexOf(s), blob: { n: 3.6, irr: 0.05 }, face: '#dff7ef', lipH: 0, shadow: false, pad: 12 });
    const e = mk('div', 'pf', s.face, 'opacity:0', p.face);
    s.face.insertBefore(e, s.ct);
    return e;
  });
  const hint = (parent, x, y, ch, w = 46) => {
    const h = peb(parent, x, y, w, 36, { r: 18, seed: ch.charCodeAt(0), face: C.ink, lip: '#241e3f', lipH: 4, shadow: false, pad: 8, gloss: false });
    h.ct.innerHTML = `<div class="t f600" style="left:0;top:9px;width:${w}px;text-align:center;font-size:19px;color:${C.foam}">${ch}</div>`;
    return h;
  };
  hint(tray.ct, -64, 38, 'L');
  hint(tray.ct, trayW + 18, 38, 'R');
  const toolRing = foamRing(tray.ct);
  const toolTag = mk('div', 'tag', tray.ct, 'left:0;top:-58px');
  const toolTagIn = mk('div', 'tagin t f600', toolTag, '');

  const CL = { w: 470, lidH: 236, bodyH: 536 };
  const clamClosed = { x: LW - 70 - 70, y: LH - 50 - 14, s: 0.3 };
  const clamOpen = { x: LW / 2, y: 312, s: 1 };
  const clam = mk('div', 'clam', clamLayer, 'left:0;top:0;width:0;height:0');
  const lidSc = A.scallopPath(0, 0, CL.w, CL.lidH, -1, 9);
  const lidDefs = `<defs>
    <linearGradient id="lid-out" x1="0" y1="-1" x2="0" y2="0" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#ffb8a0"/><stop offset="1" stop-color="#ff8670"/></linearGradient>
    <radialGradient id="lid-in" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#fff6ef"/><stop offset=".6" stop-color="#ffe4dc"/><stop offset="1" stop-color="#f6cfe0"/></radialGradient>
    <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9faf4"/><stop offset="1" stop-color="#c9efe4"/></linearGradient>
  </defs>`;
  const lidSvg = (fill, rib, ribA) => `<svg width="${CL.w + 80}" height="${CL.lidH + 60}" viewBox="${-CL.w / 2 - 40} ${-CL.lidH - 40} ${CL.w + 80} ${CL.lidH + 60}" style="position:absolute;left:${-CL.w / 2 - 40}px;top:${-CL.lidH - 40}px;overflow:visible">${lidDefs}` +
    `<path d="${lidSc.d}" transform="translate(0 9)" fill="${C.ink}" fill-opacity=".2"/>` +
    `<path d="${lidSc.d}" fill="${fill}" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>` +
    `<path d="${lidSc.ribs}" fill="none" stroke="${rib}" stroke-opacity="${ribA}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M${-CL.w * 0.3} ${-CL.lidH * 0.62} Q${-CL.w * 0.2} ${-CL.lidH * 0.86} 0 ${-CL.lidH * 0.93}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7" stroke-linecap="round"/></svg>`;
  const lidOuter = mk('div', 'lid', clam, '', lidSvg('url(#lid-out)', '#e8604f', 0.55));
  const lidInner = mk('div', 'lid', clam, '', lidSvg('url(#lid-in)', '#ffffff', 0.85));
  const status = peb(lidInner, -150, -170, 300, 96, { r: 40, seed: 51, face: '#fffaf3', lipH: 4, lip: '#f3d9cf', shadow: false });
  status.ct.innerHTML = `<div class="t f600 st" style="left:0;top:14px;width:300px;text-align:center;font-size:40px"></div>` +
    `<div class="t f500" style="left:0;top:60px;width:300px;text-align:center;font-size:19px;color:${C.inkSoft}">Low tide, east rocks open</div>`;
  const statusClock = status.ct.querySelector('.st');
  const bumps = [];
  for (let i = 0; i < 8; i++) {
    const cx = 34 + i * ((CL.w - 68) / 7), cy = CL.bodyH - 16;
    bumps.push(`M${cx - 30} ${cy} A30 30 0 1 0 ${cx + 30} ${cy} A30 30 0 1 0 ${cx - 30} ${cy}Z`);
  }
  const body = mk('div', 'cbody', clam, `left:${-CL.w / 2}px;top:0;width:${CL.w}px;height:${CL.bodyH}px;transform-origin:50% 0`);
  const bodyP = peb(body, 0, 0, CL.w, CL.bodyH, { r: 64, seed: 52, face: '#fff1ea', lip: '#f2c9bd', lipH: 9, extra: bumps, shadowA: 0.22 });
  const screen = peb(bodyP.ct, 26, 28, CL.w - 52, 448, { r: 40, seed: 53, face: 'url(#scr)', lipH: 0, shadow: false, gloss: false, defs: lidDefs });
  const appName = mk('div', 'tag', screen.ct, `left:${(CL.w - 52) / 2}px;top:22px`);
  const appNameIn = mk('div', 'tagin t f600', appName, '');
  const APPS = [['journal', 'Field Journal', C.coral], ['map', 'Island Map', C.kelp], ['camera', 'Camera', C.lilac],
    ['bottle', 'Bottle Mail', C.blue], ['tides', 'Tide Chart', C.sea], ['recipes', 'Recipes', C.yolk],
    ['stamps', 'Stamp Book', C.pink], ['shop', 'Okra’s Shop', '#ffc08a'], ['radio', 'Driftwood FM', '#c7b6f7']];
  const appSize = 100, appGap = 20, gridX = (CL.w - 52 - (3 * appSize + 2 * appGap)) / 2, gridY = 70;
  const apps = APPS.map(([id, name, col], i) => {
    const x = gridX + (i % 3) * (appSize + appGap), y = gridY + Math.floor(i / 3) * (appSize + appGap);
    const wrap = mk('div', 'pw', screen.ct, `left:${x}px;top:${y}px;width:${appSize}px;height:${appSize}px;transform-origin:50% 60%`);
    const a = peb(wrap, 0, 0, appSize, appSize, { kind: 'blob', seed: 60 + i * 3, blob: { n: 3.3, irr: 0.07 }, face: col, lip: 'rgba(59,51,94,.35)', lipH: 6, shadow: false, pad: 12 });
    a.ct.innerHTML = `<div style="position:absolute;left:14px;top:12px">${svgIcon(A.APPS[id], 72, 3.4)}</div>`;
    return { wrap, a, x, y, name };
  });
  const appBadge = mk('div', 'badge t f600', apps[0].wrap, 'left:76px;top:-12px', '1');
  apps[0].wrap.style.zIndex = 2;
  const appRing = foamRing(screen.ct);
  const pageDots = mk('div', '', screen.ct, `position:absolute;left:${(CL.w - 52) / 2 - 22}px;top:422px;width:44px;height:12px`,
    `<svg width="44" height="12"><circle cx="8" cy="6" r="5" fill="${C.ink}"/><circle cx="30" cy="6" r="5" fill="none" stroke="${C.ink}" stroke-width="2.5"/></svg>`);
  mk('div', '', clam, `position:absolute;left:-92px;top:-17px;width:184px;height:34px`,
    `<svg width="184" height="34" viewBox="0 0 184 34"><rect x="2" y="2" width="180" height="30" rx="15" fill="${C.coral}" stroke="${C.ink}" stroke-width="3.5"/>` +
    `<rect x="40" y="2" width="104" height="30" fill="${C.coralDeep}" stroke="${C.ink}" stroke-width="3.5"/><path d="M50 10 H134" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/></svg>`);
  const clamBadge = mk('div', 'badge t f600', clam, 'left:120px;top:-210px;font-size:56px;width:84px;height:84px;line-height:66px;border-width:9px', '1');
  const clamHint = hint(hud, LW - 70 - 70 - 128, trayY + 38, 'Y', 46);

  const pimX = 56, pimY = LH - 52 - 160;
  const pim = mk('div', 'pw', hud, `left:${pimX}px;top:${pimY}px;width:160px;height:160px;transform-origin:30% 100%`);
  const pimP = peb(pim, 0, 0, 160, 160, { kind: 'blob', seed: 71, blob: { n: 2.2, irr: 0.03 }, face: '#c9f1e6', lip: C.seaDeep, lipH: 6 });
  pimP.ct.innerHTML = `<svg width="160" height="160" viewBox="0 0 160 160" style="position:absolute;left:0;top:0;overflow:visible">
      <defs><clipPath id="pim-clip"><circle cx="80" cy="80" r="76"/></clipPath>
        <path id="pim-arc" d="M18 112 Q80 168 142 112"/></defs>
      <g clip-path="url(#pim-clip)"><g transform="translate(12 -6) scale(1.42)">${A.group(2.5, A.puffin(2.5))}</g></g>
      <path d="M14 108 Q80 172 146 108" fill="none" stroke="${C.ink}" stroke-width="40" stroke-linecap="round"/>
      <path d="M14 108 Q80 172 146 108" fill="none" stroke="${C.coral}" stroke-width="33" stroke-linecap="round"/>
      <text font-family="TP Fredoka" font-weight="600" font-size="23" fill="${C.foam}" letter-spacing="1"><textPath href="#pim-arc" startOffset="50%" text-anchor="middle">Pim</textPath></text>
    </svg>`;
  const bubX = pimX + 178, bubW = 640, bubH = 160, bubY = pimY - 172;
  const tail = `M14 ${bubH - 92} C0 ${bubH - 44} -20 ${bubH + 14} -46 ${bubH + 44} C-4 ${bubH + 40} 40 ${bubH + 18} 84 ${bubH - 4} Z`;
  const bub = peb(hud, bubX, bubY, bubW, bubH, { r: 52, seed: 72, extra: [tail], lipH: 6, pad: 64 }, 'transform-origin:0 100%');
  const bubText = mk('div', 'voice pimv', bub.ct, `position:absolute;left:38px;top:30px;width:${bubW - 80}px`);
  const pimLine = "psst! tide's way out tonight. the east rocks are wiggling with shrimp!!";
  const pimSpans = voice(bubText, pimLine);
  const bubNext = mk('div', '', bub.ct, `position:absolute;left:${bubW - 58}px;top:${bubH - 46}px;width:30px;height:24px`,
    `<svg width="30" height="24" viewBox="0 0 30 24"><path d="M4 4 H26 Q28 4 27 6 L16.5 20 Q15 22 13.5 20 L3 6 Q2 4 4 4 Z" fill="${C.coral}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/></svg>`);

  const biteS = ctx.world.toScreen(ctx.world.biteW.x, ctx.world.biteW.y, T.bite), us = ctx.width / LW;
  const biteX = biteS.x / us, biteY = biteS.y / us - 84;
  const bite = peb(fxLayer, biteX - 50, biteY - 60, 100, 116, { kind: 'blob', seed: 81, blob: { n: 2.6 }, face: C.coral, lip: C.coralDeep, lipH: 8 }, 'transform-origin:50% 100%');
  bite.ct.innerHTML = `<div class="t f700" style="left:0;top:14px;width:100px;text-align:center;font-size:86px;color:${C.foam}">!</div>`;

  const cx0 = LW / 2, cy0 = 410;
  const card = mk('div', 'card', fxLayer, `left:${cx0}px;top:${cy0}px`);
  let rays = '';
  for (let i = 0; i < 18; i++) {
    const a0 = (i / 18) * 360, a1 = a0 + 360 / 36;
    const p = (a, r) => `${(Math.cos(a * Math.PI / 180) * r).toFixed(1)} ${(Math.sin(a * Math.PI / 180) * r).toFixed(1)}`;
    rays += `<path d="M${p(a0, 130)} L${p(a0 - 1.5, 380)} A380 380 0 0 1 ${p(a1 + 1.5, 380)} L${p(a1, 130)} Z" fill="${i % 2 ? '#ffe39a' : C.yolk}"/>`;
  }
  const burst = mk('div', 'abs wc', card, 'left:0;top:0',
    `<svg width="840" height="840" viewBox="-420 -420 840 840" style="position:absolute;left:-420px;top:-420px;overflow:visible">
      <defs><radialGradient id="burst-fade"><stop offset=".3" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <mask id="burst-mask"><circle r="400" fill="url(#burst-fade)"/></mask></defs>
      <g mask="url(#burst-mask)"><g filter="url(#glowL)" opacity=".7">${rays}</g><g filter="url(#glowS)" opacity=".6">${rays}</g>${rays}</g></svg>`);
  const medal = mk('div', 'abs', card, 'left:0;top:0',
    `<svg width="330" height="330" viewBox="-165 -165 330 330" style="position:absolute;left:-165px;top:-165px;overflow:visible">
      <defs><radialGradient id="med-water" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#9ae6e0"/><stop offset=".7" stop-color="#4fbfc0"/><stop offset="1" stop-color="#3a9fb0"/></radialGradient>
      <radialGradient id="lantern-glow"><stop offset="0" stop-color="#fff6c8" stop-opacity="1"/><stop offset=".35" stop-color="#ffd86a" stop-opacity=".75"/><stop offset="1" stop-color="#ffcb4f" stop-opacity="0"/></radialGradient></defs>
      <circle r="152" cy="12" fill="${C.ink}" fill-opacity=".22"/>
      <circle r="150" fill="${C.foam}" stroke="${C.ink}" stroke-width="4.5"/>
      <circle r="128" fill="url(#med-water)" stroke="${C.ink}" stroke-width="3.5"/>
      <g fill="#fff" fill-opacity=".45"><circle cx="-70" cy="60" r="9"/><circle cx="-88" cy="30" r="5"/><circle cx="80" cy="74" r="7"/><circle cx="62" cy="-82" r="5"/></g>
      <path d="M-104 -50 Q-90 -96 -40 -112" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="9" stroke-linecap="round"/>
    </svg>`);
  const critter = mk('div', 'abs', card, 'left:-118px;top:-118px;width:236px;height:236px;transform-origin:50% 60%');
  const lantern = mk('div', 'abs wc', critter, `left:${(38.5 / 64 * 236).toFixed(1)}px;top:${(11.5 / 64 * 236).toFixed(1)}px`,
    `<svg width="200" height="200" viewBox="-100 -100 200 200" style="position:absolute;left:-100px;top:-100px;overflow:visible"><circle r="70" fill="url(#lantern-glow)"/></svg>`);
  mk('div', 'abs', critter, 'left:0;top:0', svgIcon(A.CRITTERS.shrimp, 236, 5.5));
  const sparkles = [];
  for (let i = 0; i < 9; i++) {
    const a = -100 + i * 40 + (i % 2) * 12, r = 190 + (i % 3) * 30;
    const s = mk('div', 'abs wc', card, `left:0;top:0`,
      `<svg width="60" height="60" viewBox="-30 -30 60 60" style="position:absolute;left:-30px;top:-30px;overflow:visible">` +
      `<path d="${A.sparklePath(0, 0, 22 + (i % 3) * 7)}" fill="${C.yolk}" filter="url(#glowS)" opacity=".85"/>` +
      `<path d="${A.sparklePath(0, 0, 18 + (i % 3) * 6)}" fill="${i % 3 === 1 ? '#fff6d8' : C.yolk}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/></svg>`);
    sparkles.push({ el: s, x: Math.cos(a * Math.PI / 180) * r, y: Math.sin(a * Math.PI / 180) * r * 0.8, d: 0.12 + i * 0.05 });
  }
  const sticker = mk('div', 'abs', card, 'left:84px;top:-150px;width:0;height:0',
    `<svg width="130" height="130" viewBox="-65 -65 130 130" style="position:absolute;left:-65px;top:-65px;overflow:visible">
      <path d="${A.foamPath(0, 5, 52, 52, 12, 9, 0, 2)}" fill="${C.ink}" fill-opacity=".25"/>
      <path d="${A.foamPath(0, 0, 52, 52, 12, 9, 0, 2)}" fill="${C.coral}" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/></svg>
     <div class="t f700" style="left:-60px;top:-17px;width:120px;text-align:center;font-size:32px;color:${C.foam}">New!</div>`);
  const sizeChip = peb(card, -170, 100, 128, 52, { r: 26, seed: 82, face: C.ink, lip: '#241e3f', lipH: 5, gloss: false }, 'transform-origin:100% 50%');
  sizeChip.ct.innerHTML = `<div class="t f600" style="left:0;top:14px;width:128px;text-align:center;font-size:23px;color:${C.foam}">6.4 cm</div>`;
  const ribW = 640, ribH = 96;
  const ribbonTails = mk('div', 'abs', card, `left:${-ribW / 2 - 70}px;top:${172}px;width:${ribW + 140}px;height:${ribH}px`,
    `<svg width="${ribW + 140}" height="${ribH + 30}" style="overflow:visible">
      <path d="M100 18 H10 L40 52 L10 86 H100 Z" fill="${C.coralDeep}" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round" transform="translate(0 14)"/>
      <path d="M${ribW + 40} 18 H${ribW + 130} L${ribW + 100} 52 L${ribW + 130} 86 H${ribW + 40} Z" fill="${C.coralDeep}" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round" transform="translate(0 14)"/></svg>`);
  const ribbon = peb(card, -ribW / 2, 160, ribW, ribH, { r: 44, seed: 83, face: C.coral, lip: C.coralDeep, lipH: 8 }, 'transform-origin:50% 50%');
  ribbon.ct.innerHTML = `<div class="t f700 disp" style="left:0;top:20px;width:${ribW}px;text-align:center;font-size:56px;color:${C.foam}">Lantern Shrimp</div>`;
  const quip = peb(card, -250, 286, 500, 76, { r: 38, seed: 84, extra: ['M230 -8 C236 -24 244 -32 252 -40 C254 -26 262 -14 270 -6 Z'], lipH: 5 }, 'transform-origin:50% 0');
  const quipText = mk('div', 'voice mev', quip.ct, 'position:absolute;left:0;top:20px;width:500px;text-align:center');
  const quipSpans = voice(quipText, 'a tiny lighthouse... for a tiny boat!');
  const clamTarget = { x: clamClosed.x, y: clamClosed.y - 34 };

  const tideEl = mk('div', 'abs', tideLayer, `left:0;top:0;width:${LW}px;height:${LH}px`);
  tideEl.innerHTML = `<svg width="${LW}" height="${LH}" style="position:absolute;left:0;top:0;overflow:visible">
      <defs><linearGradient id="tide-g" x1="0" y1="0" x2="0" y2="${LH}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#b2f2e4" stop-opacity=".45"/><stop offset=".07" stop-color="#8fe0cf" stop-opacity=".8"/>
        <stop offset=".2" stop-color="#6ccdc1"/><stop offset=".65" stop-color="#4fb8b2"/><stop offset="1" stop-color="#3a9ea6"/></linearGradient></defs>
      <path id="tide-water" fill="url(#tide-g)"/>
    </svg>`;
  const tideWater = tideEl.querySelector('#tide-water'), tideGrad = tideEl.querySelector('#tide-g');
  const under = mk('div', 'abs', tideLayer, `left:0;top:0;width:${LW}px;height:${LH}px;overflow:hidden;` +
    `-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 130px);mask-image:linear-gradient(180deg,transparent 0,#000 130px)`);
  const underIn = mk('div', 'abs', under, `left:0;top:0;width:${LW}px;height:${LH}px`);
  const UT = 420;
  const causU = [[UT, 101, 6, 0.24, 1], [672, 202, 9, 0.13, -1]].map(([tile, seed, gap, a, kx], i) => {
    const d = WA.caustics(-tile, -40, LW + tile * 2, LH + 80, tile, seed, gap, 4);
    const el = mk('div', 'abs', underIn, 'left:0;top:0;width:0;height:0;will-change:transform',
      `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible"><defs><linearGradient id="cfade${i}" x1="0" y1="0" x2="0" y2="${LH}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="#f4fffb" stop-opacity="${a}"/><stop offset=".6" stop-color="#e6fff7" stop-opacity="${(a * 0.5).toFixed(3)}"/><stop offset="1" stop-color="#e6fff7" stop-opacity="${(a * 0.25).toFixed(3)}"/></linearGradient></defs>` +
      `<path d="${d}" fill="url(#cfade${i})" fill-rule="evenodd"/></svg>`);
    return { el, tile, kx, ky: 0 };
  });
  const shafts = [];
  for (let i = 0; i < 5; i++) {
    const x = LW * (0.1 + i * 0.205) + (i % 2) * 50, w = 150 + (i % 3) * 80;
    let wedges = '';
    for (let j = 0; j < 3; j++) {
      const ww = w * (1 - j * 0.3);
      wedges += `<div style="position:absolute;left:${-ww / 2}px;top:0;width:${ww}px;height:${LH + 200}px;clip-path:polygon(32% 0,68% 0,100% 100%,0 100%);` +
        `background:linear-gradient(180deg,rgba(255,255,240,${0.16 + j * 0.06}),rgba(255,255,240,${0.05 + j * 0.02}) 50%,rgba(255,255,240,0) 85%)"></div>`;
    }
    const el = mk('div', 'abs', underIn, `left:${x}px;top:-60px;width:0;height:0;will-change:transform,opacity`, wedges);
    shafts.push({ el, ph: i * 1.3, k: 1 + (i % 2) });
  }
  const kelpSide = (x, flip, seed) => {
    const r = A.mulberry32(seed);
    let a = '', b = '';
    for (let i = 0; i < 5; i++) {
      const bx = x + flip * (i * 34 + r() * 20), L = 520 + r() * 380;
      a += WA.ribbon(bx, LH + 60, L, 26 + r() * 10, -90 + flip * (6 + r() * 10), (r() - 0.5) * 0.5, -flip * 1.2);
      b += WA.ribbon(bx + 6, LH + 60, L * 0.8, 9, -90 + flip * (6 + r() * 10), (r() - 0.5) * 0.4, -flip * 1.2);
    }
    return mk('div', 'abs', underIn, `left:0;top:0;width:0;height:0;will-change:transform;transform-origin:${x}px ${LH}px`,
      `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible;filter:blur(9px)"><path d="${a}" fill="#2f8a7e" fill-opacity=".85"/><path d="${b}" fill="#57b394" fill-opacity=".8"/></svg>`);
  };
  const kelps = [kelpSide(40, 1, 61), kelpSide(LW - 40, -1, 62)];
  const tideFront = mk('div', 'abs', tideLayer, `left:0;top:0;width:${LW}px;height:${LH}px`,
    `<svg width="${LW}" height="${LH}" style="position:absolute;left:0;top:0;overflow:visible">
      <path id="tide-crest" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="22" stroke-linecap="round"/>
      <path id="tide-lace" fill="#ffffff" fill-opacity=".95"/>
      <path id="tide-edge" fill="none" stroke="#e9fffa" stroke-opacity=".6" stroke-width="6" stroke-linecap="round"/>
      <path id="tide-spray" fill="#ffffff" fill-opacity=".85"/></svg>`);
  const tideCrest = tideFront.querySelector('#tide-crest'), tideLace = tideFront.querySelector('#tide-lace');
  const tideEdge = tideFront.querySelector('#tide-edge'), tideSpray = tideFront.querySelector('#tide-spray');
  const laceR = Array.from({ length: 70 }, (_, i) => ({ u: (i + A.mulberry32(5 + i)() * 0.8) / 70, r: 9 + A.mulberry32(99 + i)() * 16, dy: A.mulberry32(300 + i)() * 18 }));
  const bubblesUp = [];
  const rb = A.mulberry32(91);
  for (let i = 0; i < 14; i++) {
    const r = 6 + rb() * 16;
    const b = mk('div', 'abs', tideLayer, 'left:0;top:0', `<svg width="${r * 2 + 8}" height="${r * 2 + 8}" style="position:absolute;left:${-r - 4}px;top:${-r - 4}px"><circle cx="${r + 4}" cy="${r + 4}" r="${r}" fill="#ffffff" fill-opacity=".18" stroke="#ffffff" stroke-opacity=".7" stroke-width="3"/><circle cx="${r * 0.65 + 4}" cy="${r * 0.65 + 4}" r="${r * 0.25}" fill="#fff" fill-opacity=".8"/></svg>`);
    bubblesUp.push({ el: b, x: rb() * LW, ph: rb(), k: 1 + Math.floor(rb() * 2), sway: 10 + rb() * 24 });
  }
  const waveY = (x, Y, t, amp, ph) => Y + amp * Math.sin(x / 210 + t * 3.1 + ph) + amp * 0.55 * Math.sin(x / 97 - t * 4.3 + ph * 2);
  const waveEdge = (Y, t, amp, ph) => {
    const n = 26, pts = [];
    for (let i = 0; i <= n; i++) {
      const x = -40 + (LW + 80) * i / n;
      pts.push([x, waveY(x, Y, t, amp, ph)]);
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };

  const ENTRIES = [
    { id: 'star', name: 'Pinwheel Star', latin: 'Rotula stellaris', where: 'Tidepools', when: 'All day', size: '9.2 cm', price: '120', seasons: [1, 1, 1, 0],
      note: "slowly spins when nobody's looking. i have looked. it has not spun." },
    { id: 'octopus', name: 'Teacup Octopus', latin: 'Octopus pocillum', where: 'Rock pools', when: 'Mornings', size: '4.1 cm', price: '640', seasons: [0, 1, 1, 0],
      note: "moved into okra's spare teacup. okra would like it back. the octopus would not." },
    { id: 'crab' }, { id: 'snail' }, { id: 'goby' }, { id: 'urchin' }, { id: 'anemone' }, { id: 'jelly' }, { id: 'slug' },
    { id: 'shrimp', name: 'Lantern Shrimp', latin: 'Lucerna minima', where: 'East rocks', when: 'After dusk', size: '6.4 cm', price: '380', seasons: [0, 1, 1, 0],
      note: 'glows like a tiny porch light once the tide goes out. pim swears they hum.',
      hint: 'pim says: try the east tidepools after sundown.' },
    { id: 'hermit', unknown: true }, { id: 'seapig', unknown: true },
  ];
  const BX = Math.round(LW / 2 - 800), BY = Math.round(LH / 2 - 394), PW = 788, PH = 740;
  const book = mk('div', 'abs', bookLayer, `left:${BX}px;top:${BY}px;width:1600px;height:${PH}px;transform-origin:50% 60%`);
  const TABS = [['bug', 'Bugs', C.kelp], ['goby', 'Fish', C.blue], ['star', 'Tidepool', C.sea], ['sanddollar', 'Shells', C.pink]];
  const tabs = TABS.map(([ic, name, col], i) => {
    const sel = i === 2;
    const fn = A.GLYPHS[ic] || A.CRITTERS[ic];
    const tb = peb(book, 64 + i * 176, sel ? -66 : -50, 164, 90, { r: 30, seed: 100 + i, face: sel ? col : C.sand, lip: sel ? C.seaDeep : C.sandDeep, lipH: 0, shadow: false });
    tb.ct.innerHTML = `<div style="position:absolute;left:14px;top:12px;opacity:${sel ? 1 : 0.7}">${svgIcon(fn, 38)}</div><div class="t f600" style="left:58px;top:20px;font-size:21px;color:${sel ? C.ink : C.inkSoft}">${name}</div>`;
    return tb;
  });
  const pageL = peb(book, 0, 0, PW, PH, { r: 46, seed: 110, face: C.foam, lip: C.sandDeep, lipH: 12, shadowA: 0.25, shadowY: 22 });
  const pageR = peb(book, 812, 0, PW, PH, { r: 46, seed: 111, face: C.foam, lip: C.sandDeep, lipH: 12, shadowA: 0.25, shadowY: 22 });
  const dotGrid = `<svg width="${PW}" height="${PH}" style="position:absolute;left:0;top:0"><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="2" fill="${C.sandDeep}" fill-opacity=".55"/></pattern></defs><rect x="22" y="22" width="${PW - 44}" height="${PH - 44}" rx="30" fill="url(#dots)"/></svg>`;
  pageL.ct.innerHTML = dotGrid;
  pageR.ct.innerHTML = dotGrid.replace('id="dots"', 'id="dots2"').replace('url(#dots)', 'url(#dots2)');
  for (let i = 0; i < 4; i++) {
    mk('div', '', book, `position:absolute;left:770px;top:${120 + i * 190}px;width:60px;height:30px`,
      `<svg width="60" height="30" style="overflow:visible"><rect x="2" y="5" width="56" height="22" rx="11" fill="${C.ink}" fill-opacity=".25"/><rect x="2" y="2" width="56" height="22" rx="11" fill="${C.yolk}" stroke="${C.ink}" stroke-width="3.5"/><path d="M12 8 H34" stroke="#fff" stroke-opacity=".7" stroke-width="3.5" stroke-linecap="round"/></svg>`);
  }
  label(pageL.ct, 54, 44, 'Tidepool critters', 'f600', 'font-size:42px');
  const count = peb(pageL.ct, PW - 54 - 156, 40, 156, 54, { r: 27, seed: 112, face: C.sand, lip: C.sandDeep, lipH: 4, shadow: false, gloss: false }, 'transform-origin:50% 50%');
  const countText = label(count.ct, 0, 15, '', 'f600', 'width:156px;text-align:center;font-size:23px');
  const TILE = 156, TG = 20, GX = 52, GY = 116;
  const tCx = GX + 1 * (TILE + TG) + TILE / 2, tCy = GY + 2 * (TILE + TG) + TILE / 2;
  const jRays = Array.from({ length: 12 }, (_, i) => {
    const a0 = i * 30 - 7, a1 = i * 30 + 7;
    const p = (aa, r) => `${(Math.cos(aa * Math.PI / 180) * r).toFixed(1)} ${(Math.sin(aa * Math.PI / 180) * r).toFixed(1)}`;
    return `<path d="M${p(a0 + 4, 70)} L${p(a0, 260)} A260 260 0 0 1 ${p(a1, 260)} L${p(a1 - 4, 70)} Z" fill="${i % 2 ? '#fff1b0' : C.yolk}"/>`;
  }).join('');
  const jBurst = mk('div', 'abs wc', pageL.ct, `left:${tCx}px;top:${tCy}px;z-index:2`,
    `<svg width="560" height="560" viewBox="-280 -280 560 560" style="position:absolute;left:-280px;top:-280px;overflow:visible">
      <defs><radialGradient id="jb-fade"><stop offset=".25" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <mask id="jb-mask"><circle r="270" fill="url(#jb-fade)"/></mask></defs>
      <g mask="url(#jb-mask)"><g filter="url(#glowL)" opacity=".7">${jRays}</g><g filter="url(#glowS)" opacity=".6">${jRays}</g>${jRays}</g></svg>`);
  const jShock = mk('div', 'abs', pageL.ct, `left:${tCx}px;top:${tCy}px;z-index:2`,
    `<svg width="10" height="10" style="position:absolute;left:0;top:0;overflow:visible"><circle r="100" fill="none" stroke="${C.yolk}" stroke-width="10"/><circle r="100" fill="none" stroke="${C.ink}" stroke-width="3" stroke-opacity=".5"/></svg>`);
  const tiles = ENTRIES.map((e, i) => {
    const x = GX + (i % 4) * (TILE + TG), y = GY + Math.floor(i / 4) * (TILE + TG);
    const isNew = e.id === 'shrimp';
    const wrap = mk('div', 'pw', pageL.ct, `left:${x}px;top:${y}px;width:${TILE}px;height:${TILE}px;transform-origin:50% 60%${isNew ? ';z-index:3' : ''}`);
    const p = peb(wrap, 0, 0, TILE, TILE, { kind: 'blob', seed: 120 + i * 2, blob: { n: 3.8, irr: 0.05 }, face: e.unknown || isNew ? '#f6ecda' : C.foam, lip: C.sandDeep, lipH: 6, shadow: false, pad: 12 });
    const icon = svgIcon(A.CRITTERS[e.id], 112, 3.4);
    p.ct.innerHTML = `<div class="${e.unknown || isNew ? 'sil' : ''}" style="position:absolute;left:22px;top:20px">${icon}</div>` +
      (isNew ? `<div class="col" style="position:absolute;left:22px;top:20px">${icon}</div>` : '');
    const q = (e.unknown || isNew) ? mk('div', 'qmark t f700', wrap, 'left:118px;top:-8px', '?') : null;
    return { wrap, p, x, y, col: p.ct.querySelector('.col'), q };
  });
  const tileNew = mk('div', 'abs', tiles[9].wrap, 'left:124px;top:4px;width:0;height:0',
    `<svg width="96" height="96" viewBox="-48 -48 96 96" style="position:absolute;left:-48px;top:-48px;overflow:visible"><path d="${A.foamPath(0, 0, 36, 36, 10, 7, 0, 2)}" fill="${C.coral}" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/></svg>` +
    `<div class="t f700" style="left:-40px;top:-12px;width:80px;text-align:center;font-size:23px;color:${C.foam}">New!</div>`);
  const tileRing = foamRing(pageL.ct);
  const barX = GX, barY = 660, barW = 4 * TILE + 3 * TG;
  const bar = mk('div', 'abs', pageL.ct, `left:${barX}px;top:${barY}px;width:${barW}px;height:30px`,
    `<svg width="${barW}" height="40" style="overflow:visible"><rect x="0" y="0" width="${barW}" height="30" rx="15" fill="${C.sand}" stroke="${C.ink}" stroke-width="3.5"/>` +
    `<rect class="bf" x="4" y="4" width="0" height="22" rx="11" fill="${C.sea}"/><rect class="bh" x="14" y="8" width="0" height="5" rx="2.5" fill="#fff" fill-opacity=".7"/></svg>`);
  const barFill = bar.querySelector('.bf'), barHi = bar.querySelector('.bh');
  const hints = mk('div', 'abs', book, `left:${1600 - (2 * 214 + 196)}px;top:${PH + 44}px`);
  [['A', 'Look closer'], ['B', 'Close'], ['X', 'Sort by name']].forEach(([k, s], i) => {
    const hp = peb(hints, i * 214, 0, 196, 48, { r: 24, seed: 160 + i, face: C.foam, lip: C.sandDeep, lipH: 4, shadowA: 0.16, gloss: false });
    hp.ct.innerHTML = `<svg width="40" height="40" style="position:absolute;left:5px;top:4px;overflow:visible"><circle cx="20" cy="20" r="17" fill="${C.ink}"/></svg>` +
      `<div class="t f600" style="left:5px;top:13px;width:40px;text-align:center;font-size:20px;color:${C.foam}">${k}</div><div class="t f600" style="left:54px;top:14px;font-size:20px">${s}</div>`;
  });
  const rp = mk('div', 'abs', pageR.ct, 'left:0;top:0;width:100%;height:100%;transform-origin:50% 40%');
  const rMed = mk('div', 'abs', rp, 'left:198px;top:198px;width:0;height:0',
    `<svg width="330" height="330" viewBox="-165 -165 330 330" style="position:absolute;left:-165px;top:-165px;overflow:visible">
      <defs><radialGradient id="med-water2" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#b4ece4"/><stop offset=".7" stop-color="#6fd0c4"/><stop offset="1" stop-color="#4bb5b4"/></radialGradient></defs>
      <circle r="150" cy="10" fill="${C.ink}" fill-opacity=".2"/>
      <circle r="148" fill="${C.foam}" stroke="${C.ink}" stroke-width="4.5"/>
      <circle r="128" fill="url(#med-water2)" stroke="${C.ink}" stroke-width="3.5"/>
      <g fill="#fff" fill-opacity=".5"><circle cx="-76" cy="58" r="9"/><circle cx="-92" cy="26" r="5"/><circle cx="84" cy="70" r="7"/></g>
      <path d="M-104 -50 Q-90 -96 -40 -112" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="9" stroke-linecap="round"/></svg>`);
  const rGlow = mk('div', 'abs wc', rMed, 'left:0;top:0',
    `<svg width="200" height="200" viewBox="-100 -100 200 200" style="position:absolute;left:-100px;top:-100px;overflow:visible"><circle r="62" fill="url(#lantern-glow)"/></svg>`);
  const rSil = mk('div', 'abs sil', rMed, 'left:-112px;top:-112px;width:224px;height:224px');
  const rCol = mk('div', 'abs', rMed, 'left:-112px;top:-112px;width:224px;height:224px');
  const rName = label(rp, 382, 70, '', 'f600', 'font-size:46px;transform-origin:0 50%');
  const rLatin = label(rp, 384, 128, '', 'voice latin', 'font-size:23px;color:' + C.inkSoft);
  const stamp = mk('div', 'abs', rp, 'left:306px;top:292px;width:0;height:0;z-index:2',
    `<svg width="300" height="160" viewBox="-200 -80 300 160" style="position:absolute;left:-200px;top:-80px;overflow:visible" fill="none" stroke="${C.coral}" stroke-linecap="round">
      <path d="M-196 -26 q14 -10 28 0 t28 0 t28 0 t28 0 M-196 -2 q14 -10 28 0 t28 0 t28 0 t28 0 M-196 22 q14 -10 28 0 t28 0 t28 0 t28 0" stroke-width="5"/>
      <circle r="72" cy="7" fill="${C.ink}" fill-opacity=".2" stroke="none"/>
      <circle r="72" fill="${C.foam}" stroke="${C.ink}" stroke-width="3.5"/>
      <circle r="62" stroke-width="6"/><circle r="50" stroke-width="3"/></svg>` +
    `<div class="t f600" style="left:-50px;top:-30px;width:100px;text-align:center;font-size:19px;color:${C.coral}">Caught</div>` +
    `<div class="t f700" style="left:-60px;top:-6px;width:120px;text-align:center;font-size:27px;color:${C.coral}">6:02 pm</div>` +
    `<div class="t f600" style="left:-50px;top:24px;width:100px;text-align:center;font-size:15px;color:${C.coral}">Summer 14</div>`);
  const STAT_ICONS = ['pin', 'clock', 'ruler', 'sanddollar'];
  const stats = [0, 1, 2, 3].map((i) => {
    const s = peb(rp, 382 + (i % 2) * 184, 178 + Math.floor(i / 2) * 82, 172, 64, { r: 26, seed: 130 + i, face: '#fffdf6', lip: C.sand, lipH: 5, shadow: false }, 'transform-origin:50% 50%');
    s.ct.innerHTML = `<div style="position:absolute;left:10px;top:10px">${svgIcon(A.GLYPHS[STAT_ICONS[i]], 44)}</div>`;
    return { s, tx: label(s.ct, 60, 21, '', 'f600', 'font-size:21px') };
  });
  const SEASONS = [['blossom', 'Spring', '#ffe0ea'], ['sun', 'Summer', '#fff0bf'], ['leaf', 'Autumn', '#ffe2c6'], ['snow', 'Winter', '#e2f1fd']];
  const seasons = SEASONS.map(([ic, name, tint], i) => {
    const s = peb(rp, 48 + i * 176, 378, 162, 56, { r: 28, seed: 140 + i, face: tint, lip: C.sand, lipH: 4, shadow: false, gloss: false }, 'transform-origin:50% 50%');
    s.ct.innerHTML = `<div class="si" style="position:absolute;left:10px;top:9px">${svgIcon(A.GLYPHS[ic], 38)}</div><div class="t f600" style="left:56px;top:17px;font-size:20px">${name}</div>`;
    const off = mk('div', 'pf', s.el, 'opacity:0', A.pebble({ w: 162, h: 56, r: 28, seed: 140 + i, face: C.foam, lipH: 0, shadow: false, gloss: false }).face);
    return { s, off };
  });
  const note = peb(rp, 48, 470, 690, 210, { r: 26, seed: 150, face: '#fff3bb', lip: '#efd78a', lipH: 6, shadowA: 0.18, bulge: 5 }, 'transform-origin:50% 0;transform:rotate(-1.2deg)');
  mk('div', 'abs', note.el, 'left:270px;top:-22px;width:150px;height:44px',
    `<svg width="150" height="44" style="overflow:visible"><g transform="rotate(3 75 22)"><rect x="0" y="4" width="150" height="38" fill="${C.sea}" fill-opacity=".72"/><path d="M0 4 v38 M150 4 v38" stroke="${C.seaDeep}" stroke-width="2" stroke-dasharray="4 4"/><path d="M14 12 l12 22 M44 12 l12 22 M74 12 l12 22 M104 12 l12 22 M134 12 l12 22" stroke="#fff" stroke-opacity=".45" stroke-width="6"/></g></svg>`);
  const noteSketch = mk('div', 'abs sketch', note.ct, 'left:548px;top:84px;width:116px;height:116px;transform:rotate(9deg)');
  const noteText = mk('div', 'voice notev', note.ct, 'position:absolute;left:38px;top:44px;width:620px');
  let noteKey = '', noteSpans = [];

  const jfx = mk('div', 'abs', bookLayer, 'left:0;top:0');
  const cfX = BX + tCx, cfY = BY + tCy;
  const confetti = [];
  const rc = A.mulberry32(222);
  const CONF = [(c) => `<path d="${A.starPath(0, 0, 13, 6)}" fill="${c}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`,
    (c) => `<path d="M-12 6 C-12 -10 12 -10 12 6 Z" fill="${c}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><path d="M-6 4 L-3 -4 M0 4 V-6 M6 4 L3 -4" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`,
    (c) => `<circle r="9" fill="${c}" fill-opacity=".35" stroke="${C.ink}" stroke-width="3"/><circle cx="-3" cy="-3" r="2.4" fill="#fff"/>`,
    (c) => `<path d="${A.sparklePath(0, 0, 13)}" fill="${c}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`];
  const confCols = [C.yolk, C.pink, C.sea, C.coral, C.lilac, C.blue];
  for (let i = 0; i < 18; i++) {
    const a = -160 + (i / 17) * 140 + (rc() - 0.5) * 14;
    const v = 520 + rc() * 360;
    const el = mk('div', 'abs', jfx, 'left:0;top:0',
      `<svg width="40" height="40" viewBox="-20 -20 40 40" style="position:absolute;left:-20px;top:-20px;overflow:visible">${CONF[i % 4](confCols[i % 6])}</svg>`);
    confetti.push({ el, vx: Math.cos(a * Math.PI / 180) * v, vy: Math.sin(a * Math.PI / 180) * v, spin: (rc() - 0.5) * 720, d: rc() * 0.08 });
  }

  let rKey = '';
  const showEntry = (i, revealed) => {
    const e = ENTRIES[i];
    const key = i + (revealed ? 'r' : 'u');
    if (key === rKey) return;
    rKey = key;
    html(rSil, svgIcon(A.CRITTERS[e.id], 224, 4.6));
    html(rCol, svgIcon(A.CRITTERS[e.id], 224, 4.6));
    html(noteSketch, i === 9 && !revealed ? '' : svgIcon(A.CRITTERS[e.id], 116, 3));
  };

  const D = S.DUR;
  function update(tw) {
    const tb = S.tb(tw);
    const t = tw >= 13.95 ? 0 : tw;
    const phase = S.dayPhase(t);
    const mins = S.minutes(t), clock = S.fmtClock(mins);

    const hudOn = (a, b, o = {}) => M.env(t, a, b, { dOut: 0.3, ...o });
    const eDay = hudOn(T.hudIn, 13.4);
    pose(day.el, eDay, 0, -260);
    const eInfo = hudOn(T.hudIn + 0.08, 11.5);
    pose(info.el, eInfo, 0, -80);
    const flipAt = (x) => (x < 0 || x > 1 ? 1 : x < 0.12 ? 1 - M.easeIn(x / 0.12) * 0.9 : 0.1 + 0.9 * M.spring(x - 0.12, 16, 0.5));
    const wi = M.stepIndex(t, WEATHER);
    const wFlip = wi > 0 ? t - WEATHER[wi][0] : 9;
    const wShown = wFlip < 0.12 && wi > 0 ? wi - 1 : wi;
    html(wIcon, svgIcon(A.GLYPHS[WEATHER[wShown][1]], 40));
    text(wLabel, WEATHER[wShown][2]);
    tf(wHalf, 0, 0, 1, 0, 1, flipAt(wFlip));
    const tFlip = t - 11.0, low = tFlip >= 0.12;
    text(tLabel, low ? 'Low tide now!' : 'Low tide 6:30');
    tf(tHalf, 0, 0, 1, 0, 1, flipAt(tFlip));
    const pr = (t * 1.2) % 1;
    attr(tPipRing, 'r', (14 + pr * 14).toFixed(2)); attr(tPipRing, 'stroke-opacity', low ? (1 - pr).toFixed(3) : '0');
    text(clk, clock.hm);
    const u = M.clamp((mins - 990) / 150);
    attr(phSun, 'transform', `translate(${(24 + 56 * u).toFixed(2)} ${(28 + 40 * u * u).toFixed(2)})`);
    attr(phG2, 'opacity', (M.clamp(phase) * (phase <= 1 ? 1 : 2 - phase)).toFixed(3));
    attr(phG3, 'opacity', M.clamp(phase - 1).toFixed(3));
    const level = 58 + 22 * M.clamp((mins - 1010) / 100);
    attr(phSea, 'transform', `translate(${(-30 * ((t * 0.5) % 1)).toFixed(2)} ${level.toFixed(2)})`);
    attr(phRock, 'transform', `translate(0 ${(12 * (1 - M.clamp((level - 64) / 14))).toFixed(2)})`);

    const eMoney = hudOn(T.hudIn + 0.06, 11.52), eGoal = hudOn(T.hudIn + 0.12, 11.58);
    pose(money.el, eMoney, 0, -220);
    const goalBump = M.wobble(t - T.goal, 0.06, 20, 7);
    tf(goal.el, 0, -300 * eGoal.out, eGoal.s * (1 + goalBump), eGoal.r); vis(goal.el, eGoal.o);
    const done = t >= T.goal ? 3 : 2;
    text(goalCount, `${done}/3`);
    for (let i = 0; i < 3; i++) {
      const s = i < 2 ? 1 : M.spring(t - T.goal, 16, 0.45);
      attr(goalDone[i], 'transform', `scale(${s.toFixed(3)})`);
      attr(goalDone[i], 'opacity', s > 0.01 ? '1' : '0');
    }

    const eTray = hudOn(T.hudIn + 0.18, 11.48);
    pose(tray.el, eTray, 0, 240);
    const selX = M.springSteps(t, [[0, 0], [T.tool, 1]], 15, 0.5);
    const selI = t >= T.tool ? 1 : 0;
    slots.forEach((s, i) => {
      const lift = i === 0 ? 1 - M.spring(t - T.tool, 16, 0.5) : i === 1 ? M.spring(t - T.tool - 0.04, 16, 0.45) : 0;
      const pk = i === 1 ? M.press(t - T.tool, 0.06) : 0;
      tf(s.el, 0, -8 * lift);
      tf(s.face, 0, 3 * pk, 1, 0, 1 + 0.08 * pk, 1 - 0.1 * pk);
      vis(slotSel[i], M.clamp(lift));
    });
    const ringX = trayPad + selX * (slotW + gap) + slotW / 2;
    ringPose(toolRing, ringX, 12 + slotW / 2 - 7, slotW + 12, slotW + 14, t, 1, 3.4, 14);
    text(toolTagIn, TOOLS[selI][1]);
    const tagE = M.env(t, selI ? T.tool + 0.05 : T.hudIn + 0.4, 99);
    tf(toolTag, ringX, 0, tagE.s, tagE.r * 0.5); vis(toolTag, tagE.o);

    const ePim = hudOn(T.pimIn, T.pimOut, { wob: 10 });
    tf(pim, 0, 260 * ePim.out, ePim.s, ePim.r); vis(pim, ePim.o);
    const eBub = hudOn(T.pimIn + 0.12, T.pimOut - 0.04);
    tf(bub.el, 0, 0, eBub.s, eBub.r * 0.4); vis(bub.el, eBub.o);
    typeOn(pimSpans, t, T.pimType, 0.021);
    const nextOn = t > typeDone(pimSpans, T.pimType, 0.021) + 0.2;
    vis(bubNext, nextOn ? 1 : 0);
    tf(bubNext, 0, 4 * Math.abs(Math.sin(t * Math.PI * 1.6)));

    const eBite = M.env(t, T.bite, T.catchIn - 0.02, { dOut: 0.1, wob: 14 });
    tf(bite.el, 0, -10 * eBite.k, eBite.s, eBite.r + 6 * Math.sin(t * 40) * M.clamp(1 - (t - T.bite) * 3)); vis(bite.el, eBite.o);

    const cIn = t - T.catchIn;
    const fly = M.easeInOut(M.lin(t, T.catchFly, T.catchLand));
    const cardOn = t >= T.catchIn && t < T.catchLand;
    vis(card, cardOn ? 1 : 0);
    if (cardOn) {
      const p0x = cx0, p0y = cy0, p2x = clamTarget.x, p2y = clamTarget.y, p1x = (p0x + p2x) / 2 + 120, p1y = Math.min(p0y, p2y) - 220;
      const fx = (1 - fly) * (1 - fly) * p0x + 2 * (1 - fly) * fly * p1x + fly * fly * p2x;
      const fy = (1 - fly) * (1 - fly) * p0y + 2 * (1 - fly) * fly * p1y + fly * fly * p2y;
      const fs = M.mix(1, 0.1, fly);
      tf(card, fx - cx0, fy - cy0, fs, fly * 20);
      const eBurst = M.env(t, T.catchIn, T.catchFly - 0.05, { dOut: 0.2, wob: 0 });
      tf(burst, 0, 0, eBurst.s, t * 14); vis(burst, eBurst.o * 0.95);
      const eMed = M.env(t, T.catchIn + 0.05, 99, { wob: 12 });
      pose(medal, eMed);
      tf(lantern, 0, 0, 0.8 + 0.2 * Math.sin(t * 7));
      const jig = M.wobble(cIn - 0.1, 12, 22, 4);
      const sq = M.wobble(cIn - 0.1, 0.1, 18, 4);
      tf(critter, 0, 0, eMed.s, jig + 3 * Math.sin(t * 5), 1 + sq, 1 - sq); vis(critter, eMed.o);
      const eSt = M.env(t, T.catchIn + 0.38, 99, { from: 1.8, w: 22, z: 0.5, wob: 0 });
      tf(sticker, 0, 0, eSt.s, 12); vis(sticker, eSt.o);
      const eSize = M.env(t, T.catchIn + 0.5, 99);
      pose(sizeChip.el, eSize);
      const eRib = M.env(t, T.catchIn + 0.22, 99, { wob: 3 });
      tf(ribbon.el, 0, 0, eRib.s, eRib.r * 0.4); vis(ribbon.el, eRib.o);
      tf(ribbonTails, 0, 0, 1, 0, eRib.s, 1); vis(ribbonTails, eRib.o);
      const eQ = M.env(t, T.quip - 0.08, 99);
      tf(quip.el, 0, 0, eQ.s, 0); vis(quip.el, eQ.o);
      typeOn(quipSpans, t, T.quip, 0.025);
      sparkles.forEach((sp) => {
        const e = M.env(t, T.catchIn + sp.d, T.catchFly - 0.1 + sp.d * 0.3, { wob: 0 });
        const twk = 0.8 + 0.2 * Math.sin(t * 9 + sp.d * 30);
        tf(sp.el, sp.x, sp.y, e.s * twk, t * 60 + sp.d * 300); vis(sp.el, e.o);
      });
    }

    const clamVis = t >= T.hudIn && t < 13.9;
    vis(clam, clamVis ? 1 : 0);
    const eClamIn = M.env(t, T.hudIn + 0.24, 99, { wob: 10 });
    const openK = M.spring(t - T.clamOpen, 11, 0.62);
    const landB = M.wobble(t - T.catchLand, 0.14, 22, 6);
    const cxp = M.mix(clamClosed.x, clamOpen.x, openK), cyp = M.mix(clamClosed.y, clamOpen.y, openK);
    const cs = M.mix(clamClosed.s, clamOpen.s, openK) * eClamIn.s;
    tf(clam, cxp, cyp, cs, eClamIn.r * (1 - openK), 1 + landB, 1 - landB);
    const lidT = t - (T.clamOpen + 0.16);
    const lidSq = lidT < 0 ? 1 : lidT < 0.1 ? 1 - 0.85 * M.easeIn(lidT / 0.1) : 0.15 + 0.85 * M.spring(lidT - 0.1, 16, 0.42);
    const inside = lidT >= 0.1;
    tf(lidOuter, 0, 0, 1, 0, 1, lidSq); vis(lidOuter, inside ? 0 : 1);
    tf(lidInner, 0, 0, 1, 0, 1, lidSq); vis(lidInner, inside ? 1 : 0);
    const bodyK = M.spring(lidT - 0.1, 13, 0.5);
    tf(body, 0, 0, 1, 0, 1, Math.max(0.001, bodyK)); vis(body, lidT > 0.1 ? 1 : 0);
    text(statusClock, `${clock.hm} ${clock.ap}`);
    const bad = M.env(t, T.catchLand, 99, { from: 0, wob: 16 });
    tf(clamBadge, 0, 0, bad.s * (inside ? 0 : 1), bad.r); vis(clamBadge, inside ? 0 : bad.o);
    const eHint = hudOn(T.hudIn + 0.3, 11.5);
    pose(clamHint.el, eHint, 0, 200);
    apps.forEach((ap, i) => {
      const row = Math.floor(i / 3), col = i % 3;
      const e = M.env(t, T.appsIn + (row + col) * 0.05, 99, { wob: 12 });
      const pk = i === 0 ? M.press(t - T.clamPress + 0, 0.07) : 0;
      tf(ap.wrap, 0, 3 * pk, e.s, e.r, 1 + 0.1 * pk, 1 - 0.12 * pk); vis(ap.wrap, e.o);
    });
    const af = M.springSteps(t, [[0, 1], [T.appFocus[1][0], 0]], 16, 0.5);
    const afx = gridX + af * (appSize + appGap) + appSize / 2, afy = gridY + appSize / 2;
    const ringE = M.env(t, T.appFocus[0][0], 99);
    ringPose(appRing, afx, afy, appSize + 22, appSize + 22, t, ringE.o, 3.3, 14);
    tf(appRing.el, afx, afy, ringE.s);
    const ai = t >= T.appFocus[1][0] + 0.05 ? 0 : 1;
    text(appNameIn, APPS[ai][1]);
    const nameE = M.env(t, ai === 0 ? T.appFocus[1][0] + 0.05 : T.appFocus[0][0] + 0.02, 99);
    tf(appName, 0, 0, nameE.s); vis(appName, nameE.o);
    const bE = M.env(t, T.appsIn + 0.3, 99, { wob: 14 });
    tf(appBadge, 0, 0, bE.s, bE.r); vis(appBadge, bE.o);

    let Y = null;
    if (tb >= T.tideIn && tb < T.tideInEnd + 0.05) Y = M.mix(LH + 90, -170, M.easeInOut(M.lin(tb, T.tideIn, T.tideInEnd)));
    else if (tb >= T.tideInEnd + 0.05 && tb < T.tideOut) Y = -170;
    else if (tb >= T.tideOut && tb < T.tideOutEnd) Y = M.mix(-170, LH + 90, M.easeInOut(M.lin(tb, T.tideOut, T.tideOutEnd)));
    const tideOn = Y !== null, still = Y === -170;
    vis(tideEl, tideOn ? 1 : 0); vis(under, tideOn ? 1 : 0); vis(tideFront, tideOn && !still ? 1 : 0);
    if (tideOn) {
      const amp = 30;
      if (still) {
        attr(tideWater, 'd', `M-40 -40 H${LW + 40} V${LH + 40} H-40 Z`);
        attr(tideGrad, 'y1', '-300'); attr(tideGrad, 'y2', String(LH));
        tf(under, 0, 0); tf(underIn, 0, 0);
      } else {
        attr(tideWater, 'd', `${waveEdge(Y, tw, amp, 0)} L${LW + 40} ${LH + 260} L-40 ${LH + 260} Z`);
        attr(tideGrad, 'y1', (Y - amp * 1.4).toFixed(1)); attr(tideGrad, 'y2', (Y - amp * 1.4 + LH).toFixed(1));
        const top = Math.max(0, Y - amp);
        tf(under, 0, top); tf(underIn, 0, -top);
        attr(tideCrest, 'd', waveEdge(Y + 14, tw, amp, 0));
        attr(tideEdge, 'd', waveEdge(Y + 30, tw + 0.25, amp * 0.85, 1.3));
        let lace = '', spray = '';
        for (const l of laceR) {
          const x = -40 + (LW + 80) * l.u, y = waveY(x, Y, tw, amp, 0) - 4 + l.dy * 0.5, r = l.r * (0.75 + 0.25 * Math.sin(tw * 9 + l.u * 40));
          lace += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${(r * 0.8).toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${(r * 0.8).toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0Z`;
        }
        for (let i = 0; i < 16; i++) {
          const x = LW * (i + 0.5) / 16 + 30 * Math.sin(i * 7.1), q = (tw * 2.6 + i * 0.37) % 1;
          const y = waveY(x, Y, tw, amp, 0) - 10 - 70 * Math.sin(q * Math.PI), r = 5 * (1 - q) + 2;
          spray += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0Z`;
        }
        attr(tideLace, 'd', lace); attr(tideSpray, 'd', spray);
      }
      causU.forEach((c) => tf(c.el, c.kx * c.tile * tw / D, c.ky * c.tile * tw / D));
      shafts.forEach((sh) => {
        tf(sh.el, 0, 0, 1, 4 * M.osc(tw, D, sh.k, sh.ph));
        vis(sh.el, 0.55 + 0.45 * (0.5 + 0.5 * M.osc(tw, D, sh.k * 3, sh.ph * 2)));
      });
      kelps.forEach((kl, i) => tf(kl, 0, 0, 1, 2.5 * M.osc(tw, D, 2, i * 2.1)));
    }
    bubblesUp.forEach((b) => {
      const uu = ((tb / D) * b.k * 3 + b.ph) % 1;
      const by = LH + 40 - uu * (LH + 80);
      const o = (Y === null ? 0 : by > Y + 30 ? 1 : 0) * M.clamp(Math.sin(uu * Math.PI) * 3);
      tf(b.el, b.x + b.sway * Math.sin(uu * 9 + b.ph * 6), by); vis(b.el, o);
    });

    const eBook = M.env(tb, T.bookIn, T.bookOut, { from: 0.86, wob: 2, dOut: 0.34 });
    const drop = eBook.out < 0 ? 150 * eBook.out : 760 * eBook.out;
    tf(book, 0, 40 * (1 - eBook.k) + drop, eBook.s, eBook.r * 0.3 + 8 * Math.max(0, eBook.out)); vis(book, eBook.o);
    if (eBook.on) {
      tiles.forEach((tl, i) => {
        const row = Math.floor(i / 4), col = i % 4;
        const e = M.env(tb, T.tilesIn + (row + col) * 0.045, 99, { wob: 10 });
        const pk = i === 9 ? M.press(tb - T.tilePress, 0.07) : 0;
        tf(tl.wrap, 0, 3 * pk, e.s, e.r, 1 + 0.1 * pk, 1 - 0.12 * pk); vis(tl.wrap, e.o);
      });
      const rv = M.easeOut(M.lin(tb, T.reveal, T.reveal + 0.4));
      if (tiles[9].col) {
        put(tiles[9].col, 'clip-path', `circle(${(rv * 84 + 0.01).toFixed(2)}px at 56px 56px)`);
        vis(tiles[9].col, rv > 0 ? 1 : 0);
      }
      vis(tiles[9].q, tb < T.reveal ? 1 : 0);
      const nE = M.env(tb, T.reveal + 0.15, 99, { from: 1.7, w: 22, z: 0.5, wob: 0 });
      tf(tileNew, 0, 0, nE.s, -12); vis(tileNew, nE.o);
      const bi = M.stepIndex(tb, T.browse);
      const fx = M.springSteps(tb, T.browse.map(([tt, idx]) => [tt, tiles[idx].x + TILE / 2]), 15, 0.55);
      const fy = M.springSteps(tb, T.browse.map(([tt, idx]) => [tt, tiles[idx].y + TILE / 2]), 15, 0.55);
      const fE = M.env(tb, T.browse[0][0], 99);
      ringPose(tileRing, fx, fy - 2, TILE + 22, TILE + 22, tb, fE.o, 3.6, 16);
      tf(tileRing.el, fx, fy - 2, fE.s);
      const found = tb >= T.reveal + 0.2 ? 24 : 23;
      text(countText, `${found} of 40`);
      const cb = M.wobble(tb - T.reveal - 0.2, 0.12, 20, 6);
      tf(count.el, 0, 0, 1 + cb);
      const frac = M.mix(23, 24, M.spring(tb - T.reveal - 0.2, 12, 0.5)) / 40;
      attr(barFill, 'width', ((barW - 8) * frac).toFixed(1));
      attr(barHi, 'width', Math.max(0, (barW - 8) * frac - 24).toFixed(1));
      const entryI = T.browse[bi][1];
      const revealed = entryI === 9 && tb >= T.reveal;
      showEntry(entryI, revealed);
      const e = ENTRIES[entryI];
      const swapE = M.env(tb, T.browse[bi][0] + 0.02, 99, { from: 0.94, wob: 0 });
      const rpIn = bi === 0 ? M.env(tb, T.browse[0][0] - 0.3, 99, { from: 0.9 }) : swapE;
      tf(rp, 0, 10 * (1 - rpIn.k), rpIn.s); vis(rp, rpIn.o);
      const unknown = entryI === 9 && !revealed;
      const medRv = entryI === 9 ? M.easeOut(M.lin(tb, T.reveal + 0.1, T.reveal + 0.55)) : 1;
      vis(rSil, medRv < 1 ? 1 : 0);
      put(rCol, 'clip-path', `circle(${(medRv * 160 + 0.01).toFixed(2)}px at 112px 112px)`);
      vis(rCol, medRv > 0 ? 1 : 0);
      const glowO = entryI === 9 ? medRv * (0.8 + 0.2 * Math.sin(tb * 6)) : 0;
      vis(rGlow, glowO);
      tf(rGlow, 38.5 / 64 * 224 - 112, 11.5 / 64 * 224 - 112, 0.75 + 0.15 * Math.sin(tb * 6));
      const nmE = entryI === 9 ? M.env(tb, revealed ? T.nameIn : T.browse[2][0], 99, { from: revealed ? 0.4 : 1, wob: revealed ? 6 : 0 }) : { s: 1, r: 0, o: 1 };
      text(rName, unknown ? '???' : e.name);
      tf(rName, 0, 0, nmE.s, nmE.r * 0.5); vis(rName, nmE.o);
      text(rLatin, unknown ? 'not yet recorded' : e.latin);
      tf(rLatin, 0, 0, nmE.s); vis(rLatin, nmE.o);
      const stE = M.env(tb, T.stamp, 99, { from: 1.6, w: 26, z: 0.45, wob: 0 });
      const showStamp = entryI === 9 && revealed;
      tf(stamp, 0, 0, stE.s * 0.82, -14 + 4 * (1 - stE.k)); vis(stamp, showStamp ? stE.o * 0.92 : 0);
      const isNew = entryI === 9 && revealed;
      stats.forEach((st, i) => {
        const at = T.statsIn + i * 0.07;
        const vals = [e.where, e.when, e.size, e.price];
        text(st.tx, unknown || (isNew && tb < at) ? '?' : vals[i]);
        tf(st.s.el, 0, 0, 1 + (isNew ? M.wobble(tb - at, 0.14, 20, 6) : 0), isNew ? M.wobble(tb - at, 5, 17, 6) : 0);
      });
      seasons.forEach((ss, i) => {
        const at = T.statsIn + 0.3 + i * 0.07;
        const on = !unknown && e.seasons && e.seasons[i] && !(isNew && tb < at);
        vis(ss.off, on ? 0 : 0.62);
        tf(ss.s.el, 0, 0, 1 + (isNew && e.seasons[i] ? M.wobble(tb - at, 0.14, 20, 6) : 0));
      });
      const nk = entryI + (unknown ? 'h' : 'n');
      if (nk !== noteKey) { noteKey = nk; noteSpans = voice(noteText, unknown ? e.hint : e.note); }
      if (isNew) typeOn(noteSpans, tb, T.note, 0.014); else typeOn(noteSpans, tb, -99, 0);
      const jb = M.env(tb, T.reveal, T.reveal + 0.7, { from: 0.2, dOut: 0.35, wob: 0 });
      tf(jBurst, 0, 0, jb.s, tb * 24); vis(jBurst, jb.o * 0.95);
      const sh = M.lin(tb, T.reveal, T.reveal + 0.55);
      tf(jShock, 0, 0, 0.5 + 1.6 * M.easeOut(sh)); vis(jShock, sh > 0 && sh < 1 ? 1 - sh : 0);
      confetti.forEach((c) => {
        const x = tb - T.reveal - 0.05 - c.d;
        if (x <= 0 || x > 1.3) { vis(c.el, 0); return; }
        const px = cfX + c.vx * x * 0.9, py = cfY + c.vy * x + 900 * x * x;
        tf(c.el, px, py, M.clamp(x * 8) * (1 - 0.3 * x), c.spin * x); vis(c.el, M.clamp((1.3 - x) * 3));
      });
    } else {
      vis(jBurst, 0); vis(jShock, 0); confetti.forEach((c) => vis(c.el, 0));
    }
  }

  return { update };
}
