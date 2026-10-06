(() => {
  const { D, S, K, E, tf, op, vis, disp, txt, attr, sty, prog, clamp, lerp, rng, pts, torn, burst,
    halftone, svgBox, fmt, TAU, polyCSS } = HC;
  const T = HW.T;
  const PW = 1240, PH = 860;
  const PAPER_ROT = -6;
  const CASH = 412800, EXP = 3140;
  const EXPROWS = [
    { name: 'MAGPIE', lv: 37, from: 0.62, to: 1.0, up: true },
    { name: 'LOCKJAW', lv: 36, from: 0.31, to: 0.66 },
    { name: 'HUSH', lv: 36, from: 0.48, to: 0.83 },
    { name: 'STATIC', lv: 35, from: 0.12, to: 0.44 },
  ];
  const LOOT = [['Gilded derringer', '1'], ['Vault keycard B3', '1'], ['Bearer bonds', '12'], ['Signet ring', '1']];
  const COPY = 'Thieves in paper masks emptied the sub-level vault of Gilt & Daughters Bank late Friday, police said. ' +
    'Night staff reported a power failure at 2:14 a.m. When the lights came back on, the vault door stood open and ' +
    'the guard on duty was found asleep at his post. Investigators say the crew ignored the deposit boxes and took ' +
    'only the private ledgers of the bank’s owner, Aurelio Gilt, along with bearer bonds whose ownership is now ' +
    'in question. A red stencil was left on the vault door. Mr. Gilt declined to comment. City Hall has called for ' +
    'an audit of the pension fund held at the bank, the third such call this year.';

  let paperCount = 0;
  function buildPaper(parent) {
    const root = D('div', 'abs', parent);
    root.style.width = PW + 'px'; root.style.height = PH + 'px';

    const rc = D('div', 'abs o0', root);
    const rcs = svgBox(rc, 0, 0, 280, 470);
    S('polygon', { points: pts(torn(280, 470, { seed: 9, amp: 9, step: 14, sides: 'b' })), fill: '#fff', stroke: '#000', 'stroke-width': 2 }, rcs);
    const rh = D('div', 'anton', rc, 'LOOT');
    rh.style.cssText = 'position:absolute;left:24px;top:18px;font-size:44px;color:#000';
    const rsub = D('div', 'arch cap', rc, 'Vault B3  /  2:31 a.m.');
    rsub.style.cssText = 'position:absolute;left:26px;top:70px;font-size:14px;color:#000';
    let rl = 'M20 100 H260 ';
    LOOT.forEach(([n, q], i) => {
      const row = D('div', 'arch', rc);
      row.style.cssText = `position:absolute;left:24px;top:${112 + i * 40}px;width:232px;font-size:20px;color:#000;font-weight:650;white-space:pre`;
      D('span', '', row, n);
      const qq = D('span', '', row, q);
      qq.style.cssText = 'position:absolute;right:0;top:0';
      rl += `M20 ${146 + i * 40} H260 `;
    });
    S('path', { d: rl, stroke: '#000', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }, rcs);
    const tot = D('div', 'anton', rc, '4 ITEMS');
    tot.style.cssText = 'position:absolute;left:24px;top:282px;font-size:34px;color:#e60012';
    let bars = '';
    const br = rng(61);
    for (let x = 24; x < 254;) { const w = 1 + Math.floor(br() * 4); bars += `M${x} 340 h${w} v64 h-${w} Z `; x += w + 1 + Math.floor(br() * 4); }
    S('path', { d: bars, fill: '#000' }, rcs);

    const sheet = svgBox(root, 0, 0, PW, PH);
    S('rect', { x: 18, y: 16, width: PW, height: PH, fill: '#000' }, sheet);
    S('rect', { x: 0, y: 0, width: PW, height: PH, fill: '#fff' }, sheet);
    S('path', { d: `M40 50 H${PW - 40} M40 172 H${PW - 40} M40 179 H${PW - 40}`, stroke: '#000', 'stroke-width': 2 }, sheet);
    S('path', { d: `M40 176 H${PW - 40}`, stroke: '#000', 'stroke-width': 0 }, sheet);
    S('rect', { x: 40, y: 170, width: PW - 80, height: 5, fill: '#000' }, sheet);
    const top = (s, x, anchor) => {
      const tx = S('text', { x, y: 40, 'text-anchor': anchor, fill: '#000', 'font-family': 'LF Archivo', 'font-size': 15, 'font-weight': 800, 'letter-spacing': 2 }, sheet);
      tx.textContent = s;
    };
    top('LATE CITY EDITION', 40, 'start'); top('SATURDAY, NOVEMBER 14', PW / 2, 'middle'); top('PRICE 50¢', PW - 40, 'end');
    const mast = D('div', 'abril ink', root, 'The Nadir Clarion');
    mast.style.cssText = `position:absolute;left:0;top:52px;width:${PW}px;text-align:center;font-size:104px;color:#000`;

    const head = D('div', 'anton ink', root, 'MASKED CREW\nHITS GILT VAULT');
    head.style.cssText = 'position:absolute;left:38px;top:192px;font-size:128px;line-height:0.94;color:#000';
    const subh = D('div', 'abril', root, '“They took the gold and left a signature,”\nsays the night guard. Police baffled.');
    subh.style.cssText = 'position:absolute;left:40px;top:450px;font-size:29px;line-height:1.12;color:#e60012';

    const ph = svgBox(root, 40, 540, 460, 270);
    const pc = S('clipPath', { id: 'phClip' + (paperCount++) }, S('defs', {}, ph));
    S('rect', { x: 0, y: 0, width: 460, height: 270 }, pc);
    const pg = S('g', { 'clip-path': `url(#${pc.id})` }, ph);
    S('rect', { x: 0, y: 0, width: 460, height: 270, fill: '#fff' }, pg);
    halftone(pg, 460, 270, 7, (x, y) => 0.2 + y / 340 + 0.18 * Math.sin(x / 30), { fill: '#000' });
    let sky = '';
    const sr = rng(5);
    for (let x = -10; x < 470;) { const w = 24 + sr() * 50, h = 40 + sr() * 120; sky += `M${x.toFixed(0)} 270 V${(200 - h).toFixed(0)} h${w.toFixed(0)} V270 Z `; x += w + 4; }
    S('path', { d: sky, fill: '#000' }, pg);
    S('rect', { x: 0, y: 214, width: 460, height: 60, fill: '#000' }, pg);
    [[60, 0.165, 1, -20], [150, 0.15, -1, 80], [258, 0.158, 1, -75], [352, 0.145, -1, 10]].forEach(([x, s, flip, aim]) => {
      const g = S('g', { transform: `translate(${x + (flip < 0 ? 700 * s : 0)} ${214 - 980 * s}) scale(${s * flip} ${s})` }, pg);
      HA.magpie(g, { ink: '#000', paper: '#fff', outline: 22 }).aim(aim);
    });
    S('rect', { x: 0, y: 0, width: 460, height: 270, fill: 'none', stroke: '#000', 'stroke-width': 3 }, ph);
    const cap = D('div', 'arch', root, 'Four masked figures on the bank roof at 2:40 a.m.,\nas seen from the Vermilion ferry.');
    cap.style.cssText = 'position:absolute;left:40px;top:816px;font-size:14px;line-height:1.25;color:#000;font-weight:600;white-space:pre';

    const body = D('div', 'arch', root);
    body.style.cssText = 'position:absolute;left:522px;top:540px;width:338px;height:296px;overflow:hidden;font-size:14px;' +
      'line-height:1.32;color:#000;font-weight:520;text-align:left;-webkit-column-count:2;-webkit-column-gap:18px';
    const dc = D('span', 'abril', body, 'N');
    dc.style.cssText = 'float:left;font-size:58px;line-height:0.86;margin:3px 6px 0 0;color:#e60012';
    D('span', '', body, 'ADIR CITY. ' + COPY);

    const box = svgBox(root, 884, 194, 318, 640);
    S('rect', { x: 0, y: 0, width: 318, height: 640, fill: '#000' }, box);
    const tk = D('div', 'anton ink', root, 'THE TAKE');
    tk.style.cssText = 'position:absolute;left:906px;top:204px;font-size:64px;color:#fff;text-shadow:5px 4px 0 #e60012';
    const cl = D('div', 'arch cap', root, 'Cash');
    cl.style.cssText = 'position:absolute;left:908px;top:290px;font-size:15px;color:#fff';
    const cash = D('div', 'anton', root, '$0');
    cash.style.cssText = 'position:absolute;left:906px;top:306px;font-size:66px;color:#fff';
    const el = D('div', 'arch cap', root, 'Experience');
    el.style.cssText = 'position:absolute;left:908px;top:392px;font-size:15px;color:#fff';
    const exp = D('div', 'anton', root, '+0 EXP');
    exp.style.cssText = 'position:absolute;left:906px;top:408px;font-size:44px;color:#fff';
    const rows = EXPROWS.map((r, i) => {
      const y = 488 + i * 80;
      const n = D('div', 'anton', root, r.name);
      n.style.cssText = `position:absolute;left:908px;top:${y}px;font-size:30px;color:#fff`;
      const lv = D('div', 'arch cap', root, 'LV ' + r.lv);
      lv.style.cssText = `position:absolute;left:1100px;top:${y + 10}px;width:80px;text-align:right;font-size:15px;color:#fff`;
      const b = svgBox(root, 908, y + 44, 274, 16);
      S('polygon', { points: '4,0 274,0 270,14 0,14', fill: 'rgba(255,255,255,0.2)' }, b);
      const fill = S('polygon', { fill: '#fff' }, b);
      return { n, lv, fill, r };
    });

    const stamp = D('div', 'abs o0', root);
    const stIn = D('div', '', stamp);
    stIn.style.cssText = 'border:7px double #e60012;padding:6px 18px 4px;text-align:center;background:#fff;box-shadow:12px 10px 0 #000';
    stIn.classList.add('ink');
    const st1 = D('div', 'anton', stIn, 'LEVEL UP');
    st1.style.cssText = 'font-size:74px;color:#e60012';
    const st2 = D('div', 'arch cap', stIn, 'MAGPIE  37 → 38');
    st2.style.cssText = 'font-size:18px;color:#e60012;margin-top:2px';

    const tag = D('div', 'abs o0', root);
    const mist = D('img', 'abs', tag);
    mist.src = 'assets/overspray.png';
    mist.style.cssText = 'left:-40px;top:-30px;width:760px;height:220px';
    const tagT = D('div', 'tag', tag, 'Lightfingers');
    tagT.style.cssText = 'font-size:116px;color:#e60012;text-shadow:4px 4px 0 #fff';
    const drips = svgBox(tag, 0, 0, 10, 10);
    const dr = rng(8);
    const dripEls = [];
    for (let i = 0; i < 7; i++) {
      const x = 50 + i * 100 + dr() * 40, y = 100 + dr() * 20, len = 30 + dr() * 70;
      const d = S('rect', { x: x.toFixed(0), y: y.toFixed(0), width: 5 + dr() * 3, height: 0.01, rx: 3, fill: '#e60012' }, drips);
      dripEls.push({ d, len, delay: dr() * 0.3 });
    }
    const copy = D('img', 'abs', root);
    copy.src = 'assets/copy-paper.png';
    copy.style.cssText = `left:0;top:0;width:${PW}px;height:${PH}px`;
    const tapes = [[-40, -26, -32], [PW - 140, -30, 28]].map(([x, y, r], i) => {
      const w = D('div', 'abs o0', root);
      const s = svgBox(w, 0, 0, 200, 56);
      S('polygon', { points: pts(torn(200, 56, { seed: 300 + i, amp: 7, step: 9, sides: 'lr' })), fill: '#000' }, s);
      tf(w, x, y, r, 1);
      return w;
    });

    function update(t) {
      const c = E.outCubic(prog(t, 13.15, 14.1));
      txt(cash, '$' + fmt(CASH * c));
      txt(exp, '+' + fmt(EXP * E.outCubic(prog(t, 13.5, 14.3))) + ' EXP');
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const u = E.inOutCubic(prog(t, 14.0 + i * 0.12, 14.9 + i * 0.12));
        const v = lerp(r.r.from, r.r.to, u);
        const full = r.r.up && t >= 15.3;
        const vv = full ? lerp(0, 0.08, prog(t, 15.3, 15.6)) : v;
        attr(r.fill, 'points', `4,0 ${(4 + 270 * vv).toFixed(1)},0 ${(270 * vv).toFixed(1)},14 0,14`);
        attr(r.fill, 'fill', r.r.up && v > 0.98 && !full ? '#e60012' : '#fff');
        txt(r.lv, 'LV ' + (full ? r.r.lv + 1 : r.r.lv));
        sty(r.lv, 'color', full ? '#e60012' : '#fff');
      }
      const sp = prog(t, 15.3, 15.42);
      vis(stamp, sp > 0);
      tf(stamp, 1000, 430, 11, lerp(2.6, 1, E.outBack(sp)));
      const rp = E.outBack(prog(t, 15.8, 16.15));
      tf(rc, lerp(PW - 300, PW + 8, rp), lerp(300, 312, rp), lerp(0, 8, rp), 1);
      const tg = prog(t, 16.4, 17.0);
      vis(tag, tg > 0);
      tf(tag, 150, 640, -11, 1);
      HC.wipeX(tagT, E.inOutCubic(tg));
      HC.wipeX(mist, E.inOutCubic(prog(t, 16.38, 17.05)));
      for (const d of dripEls) attr(d.d, 'height', (0.01 + d.len * E.outCubic(prog(t, 16.9 + d.delay, 17.7 + d.delay))).toFixed(1));
    }
    return { root, update };
  }

  function buildResults(ui) {
    const root = D('div', 'scr', ui);
    const bg = D('div', 'bleed', root);
    bg.style.background = '#e60012 url(assets/mottle.png)';
    const raysW = D('div', 'abs o0', root);
    const rs = svgBox(raysW, 0, 0, 10, 10);
    const raysSpin = S('g', {}, rs);
    let rd = '';
    for (let i = 0; i < 24; i++) {
      const a0 = (i / 24) * TAU, a1 = a0 + TAU / 48;
      rd += `M0 0 L${(Math.cos(a0) * 1900).toFixed(0)} ${(Math.sin(a0) * 1900).toFixed(0)} L${(Math.cos(a1) * 1900).toFixed(0)} ${(Math.sin(a1) * 1900).toFixed(0)}Z `;
    }
    S('path', { d: rd, fill: '#7a0009' }, raysSpin);
    const htW = D('div', 'abs o0', root);
    HC.htImg(htW, 'ht-results', -240, -210, 2400, 1500);

    const spd = D('div', 'abs o0', root);
    const spdSvg = svgBox(spd, 0, 0, 10, 10);
    S('path', { d: HC.speedLines(0, 0, 52, 380, 260, 1500, 0.012, 131), fill: '#fff' }, spdSvg);

    const stack = D('div', 'abs o0', root);
    const full = buildPaper(stack);
    const tearPts = [];
    const tr = rng(17);
    let v = 0, wv = 0;
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      v = v * 0.8 + (tr() - 0.5) * 0.9;
      wv = clamp(wv + v * 0.35, -1, 1);
      tearPts.push([lerp(760, 470, u) + 22 * wv + 6 * (tr() - 0.5), lerp(-120, PH + 160, u)]);
    }
    const halves = [0, 1].map((side) => {
      const w = D('div', 'abs o0', root);
      const p = buildPaper(w);
      const poly = side === 0
        ? [[-700, -700]].concat(tearPts, [[-700, PH + 700]])
        : [[2200, -700]].concat(tearPts, [[2200, PH + 700]]);
      p.root.style.clipPath = polyCSS(poly);
      return { w, p };
    });

    const cont = D('div', 'abs o0', root);
    const contT = D('div', 'tape anton', cont, 'CONTINUE');
    contT.style.cssText += ';font-size:36px;padding-left:58px';
    HP.padGlyph(cont, 16, 12, 's', 32);

    const CX = 940, CY = 556;
    function paperFrame(t) {
      const s = K(t, [[T.results, 0.04], [12.85, 1.07, E.outCubic], [13.0, 1, E.inOutCubic]]);
      const r = K(t, [[T.results, PAPER_ROT - 900], [12.92, PAPER_ROT, E.outCubic]]);
      return [s, r];
    }
    function place(el, s, r, dx, dy) {
      const a = r * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
      const hx = PW / 2 * s, hy = PH / 2 * s;
      tf(el, CX + dx - (hx * c - hy * sn), CY + dy - (hx * sn + hy * c), r, s);
    }

    function update(t) {
      const on = t >= 11.92 && t < T.fieldIn + 0.3;
      disp(root, on);
      if (!on) return;
      const fade = prog(t, 19.05, 19.45);
      op(bg, 1 - fade);
      op(htW, 1 - fade);
      op(raysW, (1 - fade) * 0.85);
      tf(raysW, CX, CY, (t * 5) % 360, 1);
      tf(htW, 0, 0, 0, 1);
      const sl = prog(t, T.results, T.slam + 0.35);
      vis(spd, sl > 0 && sl < 1);
      if (sl > 0 && sl < 1) {
        tf(spd, CX, CY, -t * 40, 0.7 + 0.5 * E.outCubic(sl));
        op(spd, (sl < 0.15 ? sl / 0.15 : 1) * (1 - E.inCubic(sl)) * 0.9);
      }
      const pf = paperFrame(t);
      const torn_ = t >= T.tear;
      disp(stack, !torn_ && t >= T.results);
      if (!torn_) {
        if (t >= T.results) { full.update(t); place(stack, pf[0], pf[1], 0, 0); }
      }
      for (let i = 0; i < 2; i++) {
        const h = halves[i];
        disp(h.w, torn_);
        if (!torn_) continue;
        h.p.update(T.tear - 0.01);
        const u = prog(t, T.tear + 0.06, T.tear + 0.62);
        const rip = clamp((t - T.tear) / 0.06) * 12;
        const e = E.inCubic(u);
        const dx = i === 0 ? -rip - e * 1100 : rip + e * 1200;
        const dy = i === 0 ? -e * 700 : e * 640;
        place(h.w, 1, PAPER_ROT + (i === 0 ? -22 : 18) * e, dx, dy);
      }
      const cIn = E.outBack(prog(t, 17.3, 17.5));
      vis(cont, cIn > 0 && !torn_);
      const pressed = t >= 18.62 && t < 18.75;
      sty(contT, 'background', pressed ? '#e60012' : '#000');
      tf(cont, lerp(2000, 1560, cIn), 984, -3, pressed ? 0.92 : 1);
    }
    return { update };
  }

  window.HR = { buildResults };
})();
