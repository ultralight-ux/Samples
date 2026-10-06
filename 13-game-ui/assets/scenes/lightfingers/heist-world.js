(() => {
  const { D, S, K, E, tf, op, vis, disp, attr, sty, prog, rng, pts, rough, TAU } = HC;

  const T = {
    DUR: 20,
    pauseIn: 0.7, cursor: [1.6, 2.2, 2.75, 3.3], marks: 3.75, goIn: 5.3,
    lo: 5.5, battle: 6.45, dialTrick: 7.55, skills: 7.75, skillCur: [8.1, 8.4], cast: 8.8, hit: 9.35,
    encore: 10.15, smash: 11.35, results: 12.15, slam: 13.0, levelUp: 15.3, tear: 18.8, fieldIn: 19.35,
  };

  const SHAKES = [
    [5.64, 7, 0.07, 26], [6.0, 6, 0.06, 26], [9.35, 18, 0.1, 30], [9.52, 8, 0.08, 34],
    [10.27, 12, 0.08, 27], [11.36, 9, 0.06, 30], [11.56, 9, 0.06, 30], [11.73, 9, 0.06, 30],
    [13.0, 16, 0.09, 26], [15.33, 9, 0.07, 30], [18.84, 6, 0.06, 30],
  ];

  function mood(t) {
    const dim = K(t, [[0, 0], [0.7, 0], [0.95, 0.5, E.outCubic], [5.6, 0.5], [6.1, 0.82, E.outCubic],
      [6.7, 0.8, E.outCubic], [12.1, 0.8], [12.3, 0.6], [19.2, 0.6], [19.8, 0, E.inOutCubic], [20, 0]]);
    const push = K(t, [[0, 1], [0.7, 1], [1.4, 1.05, E.outCubic], [5.6, 1.06], [6.7, 1.1, E.outCubic],
      [12.1, 1.12], [12.3, 1.06], [19.3, 1.06], [20, 1, E.inOutCubic]]);
    return { dim, push };
  }
  const blurred = (t) => t >= T.pauseIn + 0.08 && t < 19.05;

  function skyline(seed, x0, x1, y0, hMin, hMax, o = {}) {
    const r = rng(seed), polys = [], wins = [];
    let x = x0;
    while (x < x1) {
      const w = 60 + r() * 110, h = hMin + (hMax - hMin) * Math.pow(r(), 1.3);
      const kind = r();
      const P = [[x, y0 + 60]];
      let hw = h;
      if (kind < 0.35 && h > 200) {
        const s1 = w * 0.14, h1 = h * 0.74, s2 = w * 0.3, h2 = h * 0.9;
        P.push([x, y0 - h1], [x + s1, y0 - h1], [x + s1, y0 - h2], [x + s2, y0 - h2], [x + s2, y0 - h],
          [x + w - s2, y0 - h], [x + w - s2, y0 - h2], [x + w - s1, y0 - h2], [x + w - s1, y0 - h1], [x + w, y0 - h1]);
        hw = h1;
      } else if (kind < 0.55) {
        const a = x + w * 0.56, b = x + w * 0.86;
        P.push([x, y0 - h], [a, y0 - h], [a + 3, y0 - h - 16], [a + 6, y0 - h - 16], [a + 6, y0 - h - 50],
          [(a + b) / 2, y0 - h - 62], [b, y0 - h - 50], [b, y0 - h - 16], [b + 3, y0 - h - 16], [b + 6, y0 - h], [x + w, y0 - h]);
      } else if (kind < 0.65) {
        const m = x + w * 0.5;
        P.push([x, y0 - h], [m - 3, y0 - h], [m - 1, y0 - h - 80], [m + 1, y0 - h - 80], [m + 3, y0 - h], [x + w, y0 - h]);
      } else {
        P.push([x, y0 - h], [x + w, y0 - h]);
      }
      P.push([x + w, y0 + 60]);
      polys.push(rough(P, { amp: 1.3, step: 6, seed: seed * 7 + polys.length }));
      if (o.windows) {
        for (let wy = y0 - 22; wy > y0 - hw + 14; wy -= 26) {
          for (let wx = x + 10; wx < x + w - 18; wx += 19) {
            if (r() < (o.lit || 0.42)) wins.push([wx, wy, 9, 13]);
          }
        }
      }
      x += w + (r() < 0.3 ? 4 + r() * 16 : -6 - r() * 10);
    }
    return { polys, wins };
  }

  function giltTower(cx, y0) {
    const tiers = [[250, 300], [184, 390], [124, 460], [66, 506]];
    const L = [[cx - tiers[0][0] / 2, y0 + 60]], R = [[cx + tiers[0][0] / 2, y0 + 60]];
    for (let i = 0; i < tiers.length; i++) {
      const [w, h] = tiers[i];
      L.push([cx - w / 2, y0 - h]);
      if (i + 1 < tiers.length) L.push([cx - tiers[i + 1][0] / 2, y0 - h]);
      R.push([cx + w / 2, y0 - h]);
      if (i + 1 < tiers.length) R.push([cx + tiers[i + 1][0] / 2, y0 - h]);
    }
    L.push([cx - 5, y0 - 506], [cx - 1.5, y0 - 620]);
    R.push([cx + 5, y0 - 506], [cx + 1.5, y0 - 620]);
    const poly = rough(L.concat(R.reverse()), { amp: 1.1, step: 6, seed: 404 });
    const wins = [];
    const r = rng(405);
    for (let i = 0; i < tiers.length - 1; i++) {
      const [w, h] = tiers[i], top = i ? tiers[i - 1][1] : 0;
      for (let wx = cx - w / 2 + 12; wx < cx + w / 2 - 14; wx += 16) {
        if (Math.abs(wx + 2 - cx) < 22 && i === 0) continue;
        for (let wy = y0 - top - 20; wy > y0 - h + 12; wy -= 20) if (r() < 0.32) wins.push([wx, wy, 5, 14]);
      }
    }
    return { poly, wins };
  }

  function buildWorld(root) {
    const cover = D('div', 'wl', root);
    cover.style.width = '1920px'; cover.style.height = '1080px';
    cover.style.background = '#000';
    const layer = (cls) => {
      const w = D('div', 'wl' + (cls ? ' ' + cls : ''), cover);
      w.style.willChange = 'transform';
      return w;
    };

    const sky = layer();
    const skyImg = D('img', 'wl', sky);
    skyImg.src = 'assets/sky-lines.png';
    skyImg.style.cssText += ';left:-160px;top:-150px;width:2240px;height:1260px';
    const moon = layer();
    const moonImg = D('img', 'wl', moon);
    moonImg.src = 'assets/moon.png';
    moonImg.style.cssText += ';left:1000px;top:120px;width:380px;height:380px';

    const beamW = layer();
    const beam = D('img', 'wl', beamW);
    beam.src = 'assets/beam.png';
    beam.style.cssText += ';left:0;top:-130px;width:1500px;height:260px';

    const far = layer();
    const farSvg = HC.svgBox(far, 0, 0, 10, 10);
    const fs = skyline(81, -260, 2200, 760, 140, 330);
    S('path', { d: fs.polys.map((p) => 'M' + pts(p) + 'Z').join(''), fill: '#7a0009' }, farSvg);

    const near = layer();
    const nearSvg = HC.svgBox(near, 0, 0, 10, 10);
    const ns = skyline(57, -260, 2200, 800, 90, 250, { windows: true, lit: 0.2 });
    const tower = giltTower(1190, 800);
    S('path', { d: ns.polys.map((p) => 'M' + pts(p) + 'Z').join('') + 'M' + pts(tower.poly) + 'Z', fill: '#000' }, nearSvg);
    const wr = rng(58);
    const windows = ns.wins.concat(tower.wins).map((w, i) => {
      const red = wr() < 0.18;
      const el = S('rect', { x: w[0], y: w[1], width: w[2], height: w[3], fill: red ? '#e60012' : '#fff' }, nearSvg);
      return { el, off: 6.05 + wr() * 0.38, on: 19.4 + wr() * 0.4, flick: wr() < 0.03 ? wr() : -1 };
    });
    const sign = S('g', {}, nearSvg);
    'GILT'.split('').forEach((ch, i) => {
      const tx = S('text', { x: 1190, y: 800 - 236 + i * 44, 'text-anchor': 'middle', fill: '#e60012',
        'font-family': 'LF Anton', 'font-size': 40 }, sign);
      tx.textContent = ch;
    });

    const river = layer();
    const rSvg = HC.svgBox(river, 0, 0, 10, 10);
    S('rect', { x: -300, y: 806, width: 2500, height: 600, fill: '#000' }, rSvg);
    const dr = rng(61);
    const dashes = [];
    for (let i = 0; i < 150; i++) {
      const moonCol = i < 34;
      const y = 820 + Math.pow(dr(), 1.4) * 250;
      const x = moonCol ? 1190 + (dr() - 0.5) * (40 + (y - 810) * 0.5) : -100 + dr() * 2100;
      const len = (moonCol ? 18 : 6) + dr() * (moonCol ? 60 : 34);
      dashes.push({ x, y, len, red: !moonCol && dr() < 0.4, ph: dr() * TAU, lamp: !moonCol });
    }
    const dashW = S('path', { fill: 'none', stroke: '#fff', 'stroke-width': 3 }, rSvg);
    const dashR = S('path', { fill: 'none', stroke: '#e60012', 'stroke-width': 3 }, rSvg);

    const soft = layer();
    const softLit = D('img', 'wl', soft), softDark = D('img', 'wl', soft);
    softLit.src = 'assets/city-soft-lit.jpg'; softDark.src = 'assets/city-soft-dark.jpg';
    for (const im of [softLit, softDark]) im.style.cssText += ';left:-96px;top:-54px;width:2112px;height:1188px';
    const sharp = [sky, moon, beamW, far, near, river];

    const vignette = D('div', 'wl', cover);
    vignette.style.width = '1920px'; vignette.style.height = '1080px';
    vignette.style.background = 'radial-gradient(ellipse 75% 70% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)';
    const dim = D('div', 'wl', cover);
    dim.style.width = '1920px'; dim.style.height = '1080px'; dim.style.background = '#000';

    const LAYERS = [[sky, 0.3], [moon, 0.35], [beamW, 0.5], [far, 0.55], [near, 0.8], [river, 0.9]];

    function update(t, ctx) {
      const W = ctx.width, H = ctx.height;
      const k = Math.max(W / 1920, H / 1080);
      tf(cover, (W - 1920 * k) / 2, (H - 1080 * k) / 2, 0, k);
      const m = mood(t);
      const ph = (t / T.DUR) * TAU;
      const dx = 30 * Math.sin(ph) + 8 * Math.sin(ph * 3 + 1.1);
      const dy = 9 * Math.sin(ph * 2 + 0.4) + 4 * Math.sin(ph * 5 + 2);
      const p = ctx.ptr || { x: 0, y: 0 };
      const lx = dx - p.x * 22, ly = dy - p.y * 10;
      const s = m.push;
      const cx = 960 * (1 - s), cy = 540 * (1 - s);
      const blur = blurred(t) && !ctx.params.bake;
      for (const el of sharp) disp(el, !blur);
      disp(soft, blur);
      if (blur) {
        tf(soft, cx + lx * 0.6 * s, cy + ly * 0.6 * s, 0, s);
        op(softDark, prog(t, 6.05, 6.45) * (1 - prog(t, 19.0, 19.05)));
      }
      for (const [el, par] of LAYERS) {
        if (el === beamW || blur) continue;
        tf(el, cx + lx * par * s, cy + ly * par * s, 0, s);
      }
      const lampX = 420, lampY = 640;
      const ang = -62 + 16 * Math.sin(ph * 2 + 0.8);
      if (!blur) tf(beamW, cx + (lampX + lx * 0.5) * s, cy + (lampY + ly * 0.5) * s, ang, s);

      const tick = Math.floor(t * 12);
      for (let i = 0; i < windows.length; i++) {
        const w = windows[i];
        let on = !(t >= w.off && t < w.on) && ctx.params.bake !== 2;
        if (t >= w.off - 0.08 && t < w.off) on = (tick + i) % 2 === 0;
        if (on && w.flick >= 0 && !blur) on = Math.sin(t * TAU / 2 + w.flick * 40) > -0.6 || tick % 3 !== 0;
        vis(w.el, on);
      }
      vis(sign, (!(t >= 6.42 && t < 19.5) || (t >= 6.36 && t < 6.42 && tick % 2 === 0)) && ctx.params.bake !== 2);

      if (!blur || t < T.pauseIn + 0.2) {
        let dw = '', dR = '';
        const lit = !(t >= 6.1 && t < 19.4) && ctx.params.bake !== 2;
        for (let i = 0; i < dashes.length; i++) {
          const d = dashes[i];
          if (d.lamp && !lit) continue;
          const j = Math.sin(TAU * tick * 67 / 240 + d.ph) * (3 + (d.y - 806) * 0.04);
          const l = d.len * (0.7 + 0.3 * Math.sin(TAU * tick * 35 / 240 + d.ph * 3));
          const seg = `M${(d.x + j - l / 2).toFixed(1)} ${d.y.toFixed(1)}h${l.toFixed(1)}`;
          if (d.red) dR += seg; else dw += seg;
        }
        attr(dashW, 'd', dw || 'M0 0');
        attr(dashR, 'd', dR || 'M0 0');
      }
      op(dim, m.dim);
    }
    return { update };
  }

  function buildField(ui) {
    const root = D('div', 'scr', ui);

    const roof = HC.svgBox(root, 0, 0, 10, 10);
    const ledge = rough([[-140, 1036], [262, 1030], [270, 1022], [330, 1022], [338, 1030], [940, 1040], [990, 1120], [-140, 1120]],
      { amp: 1.6, step: 6, seed: 12 });
    S('polygon', { points: pts(ledge), fill: '#fff', stroke: '#fff', 'stroke-width': 12, 'stroke-linejoin': 'round' }, roof);
    S('polygon', { points: pts(ledge), fill: '#000' }, roof);
    HA.crewMask(S('g', { transform: 'translate(760 1060) rotate(-3) scale(0.055)' }, roof), '#e60012', '#000');

    const place = D('div', 'abs o0', root);
    const emb = HC.svgBox(place, 0, 6, 10, 10);
    HA.crewMask(S('g', { transform: 'translate(52 30) scale(0.1)' }, emb), '#fff', '#e60012');
    const d1 = D('div', 'anton ink', place, 'SAINT VERMILION');
    d1.style.cssText = 'margin-left:118px;font-size:46px;color:#fff;text-shadow:5px 4px 0 #e60012';
    const d2 = D('div', 'arch cap', place, '23:41   Waterfront');
    d2.style.cssText = 'margin-left:120px;font-size:18px;margin-top:8px;color:#fff';

    const crew = D('div', 'abs o0', root);
    HP.CREW.forEach((c, i) => {
      const g = HC.svgBox(crew, i * 92, 0, 84, 104);
      HP.maskIcon(S('g', {}, g), c.name);
      S('rect', { x: 4, y: 92, width: 76, height: 7, fill: 'rgba(255,255,255,0.25)' }, g);
      S('rect', { x: 4, y: 92, width: 76 * c.hp[0] / c.hp[1], height: 7, fill: '#fff' }, g);
    });

    const heat = D('div', 'abs o0', root);
    const hl = D('div', 'anton ink', heat, 'HEAT');
    hl.style.cssText = 'position:absolute;left:0;top:0;font-size:46px;color:#fff;text-shadow:5px 4px 0 #e60012';
    const bars = S('svg', { width: 250, height: 60, viewBox: '0 0 250 60' }, heat);
    bars.style.cssText = 'position:absolute;left:112px;top:6px;overflow:visible';
    for (let i = 0; i < 5; i++) {
      const x = i * 46;
      const filled = i < 2;
      S('polygon', { points: `${x + 12},0 ${x + 42},0 ${x + 30},44 ${x},44`, fill: filled ? '#e60012' : 'none',
        stroke: filled ? '#e60012' : '#fff', 'stroke-width': 3 }, bars);
    }
    const hs = D('div', 'arch', heat, 'Low profile. Keep it that way.');
    hs.style.cssText = 'position:absolute;left:2px;top:62px;font-size:19px;color:#fff;white-space:pre';

    const job = D('div', 'abs o0', root);
    const jt = D('div', 'tape r anton', job, 'NEXT JOB');
    jt.style.cssText = 'font-size:30px;position:absolute;left:0;top:0';
    const jd = D('div', 'tape arch', job, 'Case the Gilt & Daughters Bank');
    jd.style.cssText = 'font-size:26px;position:absolute;left:150px;top:4px;font-weight:700';
    const jn = D('div', 'tape arch cap', job, '6 nights left');
    jn.style.cssText += ';font-size:17px;position:absolute;left:150px;top:58px';

    function update(t) {
      const u = K(t, [[0, 1], [T.pauseIn, 1], [T.pauseIn + 0.16, 0, E.inExpo], [T.fieldIn, 0],
        [T.fieldIn + 0.45, 1, E.outBack], [T.DUR, 1]]);
      disp(root, u > 0.001);
      if (u <= 0.001) return;
      tf(roof, 0, (1 - u) * 160, 0, 1);
      tf(place, 1330 + (1 - u) * 620, 52, -4, 1);
      tf(heat, 1512 + (1 - u) * 560, 196, -4, 1);
      tf(job, 830 + (1 - u) * 1100, 968, -4, 1);
      tf(crew, 1500 + (1 - u) * 600, 930, -4, 1);
    }
    return { update };
  }

  window.HW = { T, SHAKES, mood, buildWorld, buildField, skyline };
})();
