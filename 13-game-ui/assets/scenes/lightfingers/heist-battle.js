(() => {
  const { D, S, K, E, tf, op, vis, disp, txt, attr, sty, prog, clamp, lerp, rng, pts, burst,
    svgBox, glowCopies, fmt, TAU } = HC;
  const T = HW.T;
  const AXIS = -8;

  const ELEMENTS = ['CUT', 'SHOT', 'BLAZE', 'FROST', 'VOLT', 'GALE', 'HEX', 'GLARE'];
  function elementGlyph(g, name, color = '#fff') {
    const st = { stroke: color, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'square' };
    if (name === 'CUT') S('polygon', { points: '8,34 30,4 34,8 12,36', fill: color }, g);
    else if (name === 'SHOT') { S('circle', Object.assign({ cx: 20, cy: 20, r: 12 }, st), g); S('circle', { cx: 20, cy: 20, r: 4, fill: color }, g); }
    else if (name === 'BLAZE') S('polygon', { points: '20,2 31,22 27,36 20,28 13,36 9,22', fill: color }, g);
    else if (name === 'FROST') S('path', Object.assign({ d: 'M20 4 V36 M6 12 L34 28 M6 28 L34 12' }, st), g);
    else if (name === 'VOLT') S('polygon', { points: '24,2 8,22 19,22 14,38 32,16 21,16', fill: color }, g);
    else if (name === 'GALE') S('path', Object.assign({ d: 'M4 12 H26 Q34 12 32 6 M4 22 H32 M4 32 H22 Q30 32 28 38' }, st), g);
    else if (name === 'HEX') { S('polygon', Object.assign({ points: '20,3 35,11 35,29 20,37 5,29 5,11' }, st), g); S('circle', { cx: 20, cy: 20, r: 5, fill: color }, g); }
    else { S('circle', { cx: 20, cy: 20, r: 8, fill: color }, g); S('path', Object.assign({ d: 'M20 2 V8 M20 32 V38 M2 20 H8 M32 20 H38 M7 7 L11 11 M29 29 L33 33 M33 7 L29 11 M7 33 L11 29' }, st), g); }
  }

  function buildLights(ui) {
    const root = D('div', 'scr', ui);
    const bladeA = D('div', 'abs o0', root);
    const sa = svgBox(bladeA, 0, 0, 10, 10);
    const seam = [];
    const r = rng(5);
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      seam.push([lerp(-500, 2420, u), lerp(760, 300, u) + (i % 2 ? 1 : -1) * (6 + r() * 14)]);
    }
    const aPts = pts([[-500, -600]].concat([[2420, -600]], seam.slice().reverse()));
    S('polygon', { points: aPts, fill: '#000' }, sa);
    S('polygon', { points: aPts, fill: HC.texFill(sa, 'loGritA', 'grit') }, sa);
    const bladeB = D('div', 'abs o0', root);
    const sb = svgBox(bladeB, 0, 0, 10, 10);
    S('polyline', { points: pts(seam.map((p) => [p[0], p[1] - 10])), fill: 'none', stroke: '#e60012', 'stroke-width': 10 }, sb);
    const bPts = pts(seam.concat([[2420, 1700], [-500, 1700]]));
    S('polygon', { points: bPts, fill: '#000' }, sb);
    S('polygon', { points: bPts, fill: HC.texFill(sb, 'loGritB', 'grit') }, sb);

    const city = D('div', 'abs o0', root);
    const cs = svgBox(city, 0, 0, 10, 10);
    const sky = HW.skyline(44, 0, 820, 0, 150, 430, { windows: true, lit: 0.4 });
    S('path', { d: sky.polys.map((p) => 'M' + pts(p) + 'Z').join(''), fill: '#7a0009' }, cs);
    const wr = rng(45);
    const windows = sky.wins.map((w) => ({
      el: S('rect', { x: w[0], y: w[1], width: w[2] + 3, height: w[3] + 3, fill: wr() < 0.15 ? '#e60012' : '#fff' }, cs),
      off: 6.1 + wr() * 0.34,
    }));

    const word = D('div', 'abs o0 ink', root);
    const letters = 'LIGHTS'.split('').map((ch) => {
      const s = D('span', 'anton', word, ch);
      s.style.cssText = 'font-size:300px;color:#fff;text-shadow:12px 10px 0 #e60012;-webkit-text-stroke:0 #fff';
      return s;
    });
    const out = D('div', 'abs o0', root);
    const outT = D('div', 'abril ink', out, 'out.');
    outT.style.cssText = 'font-size:260px;color:#e60012;text-shadow:10px 9px 0 #fff';
    const sub = D('div', 'abs o0', root);
    const subT = D('div', 'tape w arch', sub, 'Sub-level B3. The cameras are ours.');
    subT.style.cssText += ';font-size:28px;font-weight:650';

    function update(t) {
      const on = t >= T.lo + 0.06 && t < 6.85;
      disp(root, on);
      if (!on) return;
      const close = E.outExpo(prog(t, T.lo + 0.08, T.lo + 0.24));
      const close2 = E.outExpo(prog(t, T.lo + 0.12, T.lo + 0.28));
      const cut = 6.5;
      const open = E.outExpo(prog(t, cut, cut + 0.3));
      const typeOn = t < cut;
      vis(city, typeOn); vis(word, typeOn && prog(t, 5.8, 5.94) > 0); vis(out, typeOn && prog(t, 5.97, 6.1) > 0); vis(sub, typeOn && prog(t, 6.14, 6.3) > 0);
      if (!typeOn) { tf(bladeA, open * 1400, -open * 1100, 0, 1); tf(bladeB, -open * 1400, open * 1100, 0, 1); return; }
      tf(bladeA, lerp(1600, 0, close), lerp(-900, 0, close), 0, 1);
      tf(bladeB, lerp(-1600, 0, close2), lerp(900, 0, close2), 0, 1);

      tf(city, 1150, 420, AXIS, 0.74);
      op(city, prog(t, 5.7, 5.85));
      for (let i = 0; i < windows.length; i++) {
        const w = windows[i];
        let lit = t < w.off;
        if (t >= w.off - 0.05 && t < w.off) lit = Math.floor(t * 60 + i) % 2 === 0;
        vis(w.el, lit);
      }
      const wIn = prog(t, 5.8, 5.94);
      tf(word, 180, 300, AXIS, lerp(1.9, 1, E.outBack(wIn)));
      for (let i = 0; i < letters.length; i++) {
        const offT = 6.12 + i * 0.05;
        let lit = t < offT;
        if (t >= offT - 0.04 && t < offT) lit = Math.floor(t * 75) % 2 === 0;
        sty(letters[i], 'color', lit ? '#fff' : 'transparent');
        sty(letters[i], 'webkitTextStroke', lit ? '0px #fff' : '3px #fff');
        sty(letters[i], 'textShadow', lit ? '12px 10px 0 #e60012' : 'none');
      }
      const oIn = prog(t, 5.97, 6.1);
      tf(out, 1240, 470, 5, lerp(2.2, 1, E.outBack(oIn)));
      const sIn = E.outBack(prog(t, 6.14, 6.3));
      tf(sub, lerp(-700, 220, sIn), 700, -3, 1);
    }
    return { update };
  }

  const CMDS = [
    { name: 'TRICK', pad: 'n' }, { name: 'STRIKE', pad: 'e' }, { name: 'SHOOT', pad: 'w' },
    { name: 'GUARD', pad: 's' }, { name: 'STASH', pad: 'L' }, { name: 'PLAN', pad: 'R' },
  ];
  const DIAL = { x: 690, y: 690, r: 124 };
  const CMD_R = 250;
  const CMD_DY = [-225, -135, -45, 45, 135, 225];
  const CMD_ANG = CMD_DY.map((dy) => Math.atan2(dy, Math.sqrt(CMD_R * CMD_R - dy * dy)) * 180 / Math.PI);
  const SKILLS = [
    { name: 'PICKPOCKET', el: 'CUT', sp: 4 },
    { name: 'SMOKE BOMB', el: 'GALE', sp: 6 },
    { name: 'VOLT SNARE', el: 'VOLT', sp: 8 },
    { name: 'LIVE WIRE', el: 'VOLT', sp: 16 },
  ];
  const SKILL_DESC = ['Lift one item from a foe.', 'Lower every foe’s accuracy.', 'Shock damage to one foe. Leaves them twitching.', 'Shock damage to every foe.'];
  const ENEMY = { x: 1050, y: 236, s: 0.92 };
  const DOOR = [ENEMY.x + 386 * ENEMY.s, ENEMY.y + 210 * ENEMY.s];
  const BFIG = { x: -60, y: 330, s: 1.12 };

  function padMini(parent, x, y, dir, size) {
    if (dir === 'L' || dir === 'R') {
      const g = svgBox(parent, x, y + 4, size + 6, size - 8);
      S('rect', { x: 1, y: 1, width: size + 4, height: size - 10, rx: 7, fill: 'none', stroke: '#fff', 'stroke-width': 2 }, g);
      const tx = S('text', { x: (size + 6) / 2, y: size - 15, 'text-anchor': 'middle', fill: '#fff', 'font-family': 'LF Archivo',
        'font-size': 15, 'font-weight': 800 }, g);
      tx.textContent = dir;
      return g;
    }
    return HP.padGlyph(parent, x, y, dir, size);
  }

  function buildBattle(ui) {
    const root = D('div', 'scr', ui);
    const raysW = D('div', 'abs o0', root);
    raysW.style.willChange = 'transform';
    const rs = svgBox(raysW, 0, 0, 10, 10);
    const raysSpin = S('g', {}, rs);
    let rd = '';
    for (let i = 0; i < 20; i++) {
      const a0 = (i / 20) * TAU, a1 = a0 + TAU / 40;
      const tri = HC.rough([[0, 0], [Math.cos(a0) * 1650, Math.sin(a0) * 1650], [Math.cos(a1) * 1650, Math.sin(a1) * 1650]], { amp: 4, step: 14, scale: 60, seed: 300 + i });
      rd += 'M' + pts(tri) + 'Z';
    }
    S('path', { d: rd, fill: 'rgba(122,0,9,0.55)' }, raysSpin);
    const bht = D('div', 'abs o0', root);
    HC.htImg(bht, 'ht-encore', -240, -210, 2400, 1500);
    const wedge = D('div', 'abs o0', root);
    const ws = svgBox(wedge, 0, 0, 10, 10);
    S('polygon', { points: pts([[-400, 360], [520, 240], [980, 1300], [-400, 1300]]), fill: 'rgba(0,0,0,0.78)' }, ws);
    S('polygon', { points: pts([[-400, 1000], [1900, 760], [2400, 1500], [-400, 1500]]), fill: 'rgba(0,0,0,0.5)' }, ws);
    S('polygon', { points: pts(HC.rough([[-400, 360], [520, 240], [980, 1300], [-400, 1300]], { amp: 3, step: 10, seed: 31 })), fill: HC.texFill(ws, 'wedgeGrit', 'grit') }, ws);

    const impact = D('div', 'abs o0', root);
    const impBg = D('div', 'bleed', impact);
    const isv = svgBox(impact, 0, 0, 10, 10);
    const impLines = S('path', { d: HC.speedLines(DOOR[0], DOOR[1], 44, 160, 260, 2300, 0.011, 97) }, isv);

    const enW = D('div', 'abs o0', root);
    const enSvg = svgBox(enW, 0, 0, 760, 900);
    const en = HA.warden(S('g', {}, enSvg), { ink: '#000', paper: '#fff', mis: '#e60012', outline: 12 });

    const figW = D('div', 'abs o0', root);
    const figSvg = svgBox(figW, 0, 0, 700, 1000);
    const fig = HA.magpie(S('g', {}, figSvg), { ink: '#000', paper: '#fff', mis: '#e60012', outline: 14 });

    const etag = D('div', 'abs o0', root);
    const en1 = D('div', 'anton ink', etag, 'GILT WARDEN');
    en1.style.cssText = 'position:absolute;left:0;top:0;font-size:66px;color:#fff;text-shadow:6px 5px 0 #e60012';
    const en2 = D('div', 'arch cap', etag, 'LV 41  Vault guardian');
    en2.style.cssText = 'position:absolute;left:4px;top:76px;font-size:16px;color:#fff';
    const hpSvg = svgBox(etag, 0, 104, 470, 30);
    S('polygon', { points: '8,0 470,0 462,22 0,22', fill: '#000', stroke: '#fff', 'stroke-width': 2 }, hpSvg);
    const hpGhost = S('polygon', { fill: '#e60012' }, hpSvg);
    const hpFill = S('polygon', { fill: '#fff' }, hpSvg);
    const weak = [];
    ELEMENTS.forEach((el, i) => {
      const g = svgBox(etag, i * 54, 146, 48, 64);
      const box = S('rect', { x: 0, y: 0, width: 46, height: 46, fill: '#000', stroke: '#fff', 'stroke-width': 2 }, g);
      const gl = S('g', { transform: 'translate(3 3)' }, g);
      elementGlyph(gl, el);
      const q = S('text', { x: 23, y: 34, 'text-anchor': 'middle', fill: '#e60012', 'font-family': 'LF Anton', 'font-size': 34 }, g);
      q.textContent = '?';
      const lab = S('text', { x: 23, y: 64, 'text-anchor': 'middle', fill: '#fff', 'font-family': 'LF Archivo', 'font-size': 14, style: 'font-stretch:70%',
        'font-weight': 800, 'letter-spacing': 1 }, g);
      lab.textContent = el;
      weak.push({ box, gl, q, lab, el });
    });

    const dialW = D('div', 'abs o0', root);
    const ds = svgBox(dialW, 0, 0, 10, 10);
    S('circle', { cx: 0, cy: 0, r: DIAL.r + 26, fill: '#000', stroke: '#fff', 'stroke-width': 5 }, ds);
    const dialSpin = S('g', {}, ds);
    let ticks = '';
    for (let i = 0; i < 100; i++) {
      const a = (i / 100) * TAU, r0 = DIAL.r + (i % 10 === 0 ? -4 : i % 5 === 0 ? 4 : 10), r1 = DIAL.r + 20;
      ticks += `M${(Math.cos(a) * r0).toFixed(1)} ${(Math.sin(a) * r0).toFixed(1)} L${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)} `;
    }
    S('path', { d: ticks, stroke: '#fff', 'stroke-width': 2 }, dialSpin);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2;
      const tx = S('text', { x: (Math.cos(a) * (DIAL.r - 26)).toFixed(1), y: (Math.sin(a) * (DIAL.r - 26) + 8).toFixed(1),
        'text-anchor': 'middle', fill: '#fff', 'font-family': 'LF Anton', 'font-size': 24 }, dialSpin);
      tx.textContent = String(i * 10);
    }
    S('circle', { cx: 0, cy: 0, r: 64, fill: '#e60012' }, dialSpin);
    S('circle', { cx: 0, cy: 0, r: 46, fill: '#000' }, dialSpin);
    S('path', { d: 'M-30 0 H30 M0 -30 V30', stroke: '#e60012', 'stroke-width': 6 }, dialSpin);
    const pointer = S('g', {}, ds);
    S('polygon', { points: `${DIAL.r + 30},-16 ${DIAL.r + 70},0 ${DIAL.r + 30},16`, fill: '#e60012', stroke: '#fff', 'stroke-width': 3 }, pointer);
    const tabs = CMDS.map((c, i) => {
      const w = D('div', 'abs', root);
      w.style.transformOrigin = '0 32px';
      const bg = svgBox(w, 0, 0, 290, 64);
      const plate = S('polygon', { points: pts(HC.rough([[10, 0], [290, 0], [276, 64], [0, 64]], { amp: 1.2, step: 6, seed: 60 + i })), fill: '#000', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' }, bg);
      padMini(w, 16, 14, c.pad, 36);
      const l = D('div', 'anton', w, c.name);
      l.style.cssText = 'position:absolute;left:66px;top:3px;font-size:52px;color:#fff';
      return { w, plate, l };
    });

    const list = D('div', 'abs o0', root);
    const rows = SKILLS.map((s, i) => {
      const w = D('div', 'abs o0', list);
      const bg = svgBox(w, 0, 0, 520, 62);
      const tp = HC.tornPlate(bg, 520, 62, { seed: 90 + i, amp: 7, sides: 'lr', rim: false });
      const plate = tp.plate;
      const gl = S('g', { transform: 'translate(22 11)' }, bg);
      elementGlyph(gl, s.el);
      const n = D('div', 'anton ink', w, s.name);
      n.style.cssText = 'position:absolute;left:76px;top:6px;font-size:46px;color:#fff';
      const c = D('div', 'anton', w, s.sp + ' SP');
      c.style.cssText = 'position:absolute;left:390px;top:12px;width:100px;text-align:right;font-size:36px;color:#e60012';
      return { w, plate, grit: tp.grit, gl, n, c };
    });
    const sdesc = D('div', 'abs o0', root);
    const sdescT = D('div', 'tape r arch', sdesc, '');
    sdescT.style.cssText += ';font-size:26px;font-weight:650';

    const party = HP.CREW.map((c, i) => {
      const w = D('div', 'abs o0', root);
      const plate = svgBox(w, 0, 0, 200, 96);
      const pl = HC.tornPlate(plate, 200, 96, { seed: 140 + i, amp: 7, sides: 'r', fill: i === 0 ? '#e60012' : '#000', grit: i !== 0 }).plate;
      HP.maskIcon(S('g', { transform: 'translate(8 14) scale(0.72)' }, plate), c.name);
      const nm = D('div', 'anton', w, c.name);
      nm.style.cssText = 'position:absolute;left:78px;top:6px;font-size:28px;color:#fff';
      const bars = svgBox(w, 78, 46, 110, 40);
      S('rect', { x: 0, y: 0, width: 104, height: 9, fill: 'rgba(255,255,255,0.22)' }, bars);
      S('rect', { x: 0, y: 0, width: 104 * c.hp[0] / c.hp[1], height: 9, fill: '#fff' }, bars);
      S('rect', { x: 0, y: 18, width: 104, height: 9, fill: 'rgba(230,0,18,0.3)' }, bars);
      const spF = S('rect', { x: 0, y: 18, width: 104 * c.sp[0] / c.sp[1], height: 9, fill: '#e60012' }, bars);
      const spCost = S('rect', { x: 104 * (c.sp[0] - 8) / c.sp[1], y: 18, width: 104 * 8 / c.sp[1], height: 9, fill: '#fff' }, bars);
      return { w, pl, spF, spCost, c };
    });

    const lockW = D('div', 'abs o0', root);
    const ls = svgBox(lockW, 0, 0, 10, 10);
    const brackets = [];
    for (let i = 0; i < 4; i++) {
      const g = S('g', {}, ls);
      S('path', { d: 'M0 46 V0 H46', fill: 'none', stroke: '#e60012', 'stroke-width': 12 }, g);
      S('path', { d: 'M0 46 V0 H46', fill: 'none', stroke: '#fff', 'stroke-width': 3 }, g);
      brackets.push(g);
    }
    const lockLabel = D('div', 'tape anton', lockW, 'VOLT SNARE');
    lockLabel.style.cssText += ';position:absolute;left:-150px;top:196px;font-size:32px;transform:rotate(-8deg)';

    const boltW = D('div', 'abs o0', root);
    const boltPts = [];
    const br = rng(23);
    for (let b = 0; b < 3; b++) {
      const p = [];
      const x = DOOR[0] - 300 + b * 280, y = -80, n = 9;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        p.push([lerp(x, DOOR[0], u) + (i > 0 && i < n ? (br() - 0.5) * 140 : 0), lerp(y, DOOR[1], u)]);
      }
      boltPts.push(pts(p));
    }
    const bolts = boltPts.map(() => []);
    glowCopies(boltW, [[16, 0.9], [5, 1], [0, 1]], (w) => {
      const bs = svgBox(w, 0, 0, 10, 10);
      boltPts.forEach((p, b) => {
        const g = S('g', {}, bs);
        S('polyline', { points: p, fill: 'none', stroke: '#e60012', 'stroke-width': 24, 'stroke-linejoin': 'miter' }, g);
        S('polyline', { points: p, fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linejoin': 'miter' }, g);
        bolts[b].push(g);
      });
    });

    const softW = D('div', 'abs o0', root);
    const softT = D('div', 'tape r anton ink', softW, 'SOFT SPOT!');
    softT.style.cssText += ';font-size:96px;padding:0.12em 0.45em 0.08em';
    const dmgW = D('div', 'abs o0', root);
    const dmgSvg = svgBox(dmgW, 0, 0, 10, 10);
    const dmgMis = S('text', { x: 12, y: 10, 'text-anchor': 'middle', fill: '#e60012', stroke: '#e60012', 'stroke-width': 16,
      'stroke-linejoin': 'round', 'font-family': 'LF Anton', 'font-size': 190 }, dmgSvg);
    const dmg = S('text', { x: 0, y: 0, 'text-anchor': 'middle', fill: '#fff', stroke: '#000', 'stroke-width': 16, 'paint-order': 'stroke',
      'stroke-linejoin': 'round', 'font-family': 'LF Anton', 'font-size': 190 }, dmgSvg);
    dmgMis.textContent = dmg.textContent = '1,284';
    const downW = D('div', 'abs o0', root);
    const downT = D('div', 'tape w anton ink', downW, 'DOWN');
    downT.style.cssText += ';font-size:44px';

    const turn = D('div', 'abs o0', root);
    const turnT = D('div', 'abril', turn, 'Your move,');
    turnT.style.cssText = 'position:absolute;left:0;top:0;font-size:40px;color:#fff';
    const turnN = D('div', 'anton ink', turn, 'MAGPIE');
    turnN.style.cssText = 'position:absolute;left:0;top:42px;font-size:84px;color:#fff;text-shadow:6px 5px 0 #e60012';

    const HP0 = 1, HP1 = 0.18;
    function update(t) {
      const on = t >= T.battle && t < T.encore + 0.05;
      disp(root, on);
      if (!on) return;
      const tin = (a, d = 0.3) => E.outBack(prog(t, T.battle + a, T.battle + a + d));
      const hit = t >= T.hit;
      const hitP = prog(t, T.hit, T.hit + 0.5);

      tf(raysW, DOOR[0], DOOR[1], t * 6, 1);
      op(raysW, prog(t, T.battle + 0.1, T.battle + 0.5));
      tf(wedge, lerp(-600, 0, E.outExpo(prog(t, T.battle + 0.05, T.battle + 0.35))), 0, 0, 1);

      const eIn = tin(0.1, 0.4);
      const bob = 6 * Math.sin(t * 2.6);
      const flinch = hit ? Math.exp(-(t - T.hit) / 0.12) * Math.sin((t - T.hit) * 60) : 0;
      const down = E.outBack(prog(t, T.hit + 0.18, T.hit + 0.45));
      tf(enW, ENEMY.x + lerp(500, 0, eIn) + flinch * 30 + down * 30, ENEMY.y + lerp(300, 0, eIn) + bob * (1 - down) + down * 70,
        flinch * 3 + down * 9, ENEMY.s);
      attr(en.spin, 'transform', `rotate(${(t * 20 + (hit ? Math.min(t - T.hit, 0.6) * 900 : 0)).toFixed(2)})`);
      const IMP = [[T.hit, '#000', '#fff'], [T.hit + 0.034, '#fff', '#000'], [T.hit + 0.067, '#e60012', '#000']];
      let fi = -1;
      for (let i = 0; i < IMP.length; i++) if (t >= IMP[i][0] && t < IMP[i][0] + 0.0335) fi = i;
      vis(impact, fi >= 0);
      if (fi >= 0) { sty(impBg, 'background', IMP[fi][1]); attr(impLines, 'fill', IMP[fi][2]); }
      sty(enSvg, 'filter', fi === 0 || (t >= T.hit + 0.12 && t < T.hit + 0.155) ? 'url(#toWhite)' : 'none');
      sty(figSvg, 'filter', fi === 0 ? 'url(#toWhite)' : 'none');
      attr(en.eye, 'fill', hit && Math.floor(t * 20) % 2 ? '#fff' : '#e60012');

      const fIn = tin(0, 0.35);
      tf(figW, BFIG.x + lerp(-700, 0, fIn), BFIG.y + lerp(200, 0, fIn), 0, BFIG.s);
      const sx = BFIG.x + HA.ARM_PIVOT[0] * BFIG.s, sy = BFIG.y + HA.ARM_PIVOT[1] * BFIG.s;
      const aimEnemy = Math.atan2(DOOR[1] - sy, DOOR[0] - sx) * 180 / Math.PI;
      const recoil = t >= T.cast ? Math.exp(-(t - T.cast) / 0.15) * -14 : 0;
      fig.aim(lerp(HA.ARM_ANGLE + 30, aimEnemy, E.outBack(prog(t, T.battle + 0.2, T.battle + 0.5))) + recoil);

      tf(etag, 1350 + lerp(700, 0, tin(0.25)), 70, AXIS, 1);
      const hpV = hit ? lerp(HP0, HP1, E.outExpo(prog(t, T.hit, T.hit + 0.15))) : HP0;
      const ghostV = hit ? lerp(HP0, HP1, E.inOutCubic(prog(t, T.hit + 0.45, T.hit + 0.8))) : HP0;
      const bar = (v) => `8,0 ${(8 + 462 * v).toFixed(1)},0 ${(462 * v).toFixed(1)},22 0,22`;
      attr(hpFill, 'points', bar(hpV));
      attr(hpGhost, 'points', bar(ghostV));
      for (let i = 0; i < weak.length; i++) {
        const wv = weak[i];
        const revealed = wv.el === 'VOLT' && t >= T.hit + 0.05;
        vis(wv.q, !revealed);
        vis(wv.gl, revealed);
        attr(wv.box, 'fill', revealed ? '#e60012' : '#000');
      }

      const dIn = tin(0.3, 0.35);
      tf(dialW, DIAL.x + lerp(-500, 0, dIn), DIAL.y + lerp(400, 0, dIn), 0, lerp(0.4, 1, dIn));
      const selCmd = t >= T.dialTrick ? 0 : 1;
      const turnP = E.outBack(prog(t, T.dialTrick, T.dialTrick + 0.22));
      const ptrAng = t >= T.dialTrick ? lerp(CMD_ANG[1], CMD_ANG[0], turnP) : CMD_ANG[1];
      const castSpin = t >= T.cast ? E.outCubic(prog(t, T.cast, T.cast + 0.4)) * 360 : 0;
      attr(pointer, 'transform', `rotate(${ptrAng.toFixed(2)})`);
      attr(dialSpin, 'transform', `rotate(${(ptrAng * 2.2 + castSpin).toFixed(2)})`);
      const cmdOut = E.inExpo(prog(t, T.cast + 0.05, T.cast + 0.22));
      for (let i = 0; i < tabs.length; i++) {
        const a = CMD_ANG[i] * Math.PI / 180;
        const inP = tin(0.36 + i * 0.04, 0.24);
        const sel = i === selCmd;
        const rr = lerp(0.3, 1, inP);
        const x = DIAL.x + (Math.cos(a) * CMD_R + (sel ? 24 : 0)) * rr, y = DIAL.y + CMD_DY[i] * rr - 32;
        tf(tabs[i].w, x + cmdOut * 1700, y, AXIS, (sel ? 1.12 : 0.92) * lerp(0.2, 1, inP));
        attr(tabs[i].plate, 'fill', sel ? '#fff' : '#000');
        sty(tabs[i].l, 'color', sel ? '#000' : '#fff');
        op(tabs[i].w, lerp(0, sel ? 1 : 0.88, prog(t, T.battle + 0.36 + i * 0.04, T.battle + 0.45 + i * 0.04)));
      }
      vis(dialW, cmdOut < 1);

      const lOn = t >= T.skills && t < T.cast + 0.3;
      vis(list, lOn);
      vis(sdesc, lOn);
      if (lOn) {
        const k = t >= T.skillCur[1] ? 2 : t >= T.skillCur[0] ? 1 : 0;
        const kt = [T.skills, T.skillCur[0], T.skillCur[1]][k];
        const pop = E.outBack(prog(t, kt, kt + 0.14));
        const lout = E.inExpo(prog(t, T.cast + 0.05, T.cast + 0.25));
        tf(list, 640 + lout * 1200, 92, AXIS, 1);
        for (let i = 0; i < rows.length; i++) {
          const inP = E.outBack(prog(t, T.skills + i * 0.04, T.skills + 0.2 + i * 0.04));
          const sel = i === k;
          tf(rows[i].w, lerp(-200, 0, inP) + (sel ? 40 * pop : 0), i * 70 + lerp(240, 0, inP), 0, sel ? 1 + 0.06 * pop : 1);
          op(rows[i].w, inP);
          attr(rows[i].plate, 'fill', sel ? '#fff' : '#000');
          vis(rows[i].grit, !sel);
          sty(rows[i].n, 'color', sel ? '#000' : '#fff');
          for (const c of rows[i].gl.children) {
            if (c.getAttribute('fill') && c.getAttribute('fill') !== 'none') attr(c, 'fill', sel ? '#000' : '#fff');
            if (c.getAttribute('stroke')) attr(c, 'stroke', sel ? '#000' : '#fff');
          }
        }
        txt(sdescT, SKILL_DESC[k]);
        const dP = E.outBack(prog(t, kt + 0.03, kt + 0.18));
        tf(sdesc, lerp(400, 700, dP) + lout * 1200, 388, -3, 1);
      }

      for (let i = 0; i < party.length; i++) {
        const p = party[i];
        const inP = tin(0.42 + i * 0.05, 0.25);
        tf(p.w, 1088 + i * 206 + lerp(700, 0, inP), 958 - i * 29, AXIS, i === 0 ? 1.06 : 1);
        const preview = i === 0 && t >= T.skillCur[1] && t < T.cast;
        vis(p.spCost, preview && Math.floor(t * 8) % 2 === 0);
        attr(p.spF, 'width', (104 * (p.c.sp[0] - (i === 0 && t >= T.cast ? 8 : 0)) / p.c.sp[1]).toFixed(1));
      }

      const tIn = tin(0.4, 0.3);
      vis(turn, t < T.cast + 0.1);
      tf(turn, lerp(-500, 70, tIn), 70, AXIS, 1);

      const lk = prog(t, T.cast + 0.05, T.cast + 0.3);
      vis(lockW, lk > 0 && t < T.hit + 0.3);
      if (lk > 0) {
        const spread = lerp(260, 150, E.outBack(lk));
        tf(lockW, DOOR[0], DOOR[1], (1 - E.outCubic(lk)) * 60, 1);
        const c = [[-1, -1, 0], [1, -1, 90], [1, 1, 180], [-1, 1, 270]];
        for (let i = 0; i < 4; i++) attr(brackets[i], 'transform', `translate(${c[i][0] * spread} ${c[i][1] * spread}) rotate(${c[i][2]})`);
      }

      const bOn = t >= T.hit - 0.04 && t < T.hit + 0.26;
      vis(boltW, bOn);
      if (bOn) {
        for (let i = 0; i < bolts.length; i++) {
          const show = (Math.floor(t * 40) + i) % 3 !== 0;
          for (const g of bolts[i]) vis(g, show);
        }
      }

      const sP = prog(t, T.hit + 0.06, T.hit + 0.2);
      vis(softW, sP > 0);
      tf(softW, 920, lerp(220, 250, prog(t, T.hit, T.encore)), 5, lerp(2.6, 1, E.outBackBig(sP)));
      const dP = prog(t, T.hit + 0.1, T.hit + 0.24);
      vis(dmgW, dP > 0);
      tf(dmgW, DOOR[0] - 330, DOOR[1] + 250 - prog(t, T.hit, T.encore) * 60, -6, lerp(2.2, 1, E.outBackBig(dP)));
      const dnP = E.outBack(prog(t, T.hit + 0.42, T.hit + 0.56));
      vis(downW, dnP > 0);
      tf(downW, DOOR[0] + 140, DOOR[1] + 250, 8, dnP);
    }
    return { update };
  }

  function buildEncore(ui) {
    const root = D('div', 'scr', ui);
    const bg = D('div', 'bleed', root);
    bg.style.background = '#e60012 url(assets/mottle.png)';
    const ht = D('div', 'abs o0', root);
    HC.htImg(ht, 'ht-encore', -240, -210, 2400, 1500);
    const burstW = D('div', 'abs o0', root);
    const bspin = D('div', 'abs o0', burstW);
    bspin.style.willChange = 'transform';
    const bsv = svgBox(bspin, 0, 0, 10, 10);
    const bPts = pts(HC.rough(burst(22, 330, 900, 77, 0.5), { amp: 3, step: 10, seed: 77 }));
    S('polygon', { points: bPts, fill: '#000' }, bsv);
    S('polygon', { points: bPts, fill: HC.texFill(bsv, 'encGrit', 'grit') }, bsv);
    S('polygon', { points: pts(HC.rough(burst(22, 300, 520, 78, 0.4), { amp: 1.5, step: 8, seed: 78 })), fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linejoin': 'round' }, bsv);

    const lights = D('div', 'abs o0', root);
    const gsv = svgBox(lights, 0, 0, 1, 1);
    const lg = S('linearGradient', { id: 'spotG', x1: 0, y1: 0, x2: 0, y2: 1 }, S('defs', {}, gsv));
    S('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 1 }, lg);
    S('stop', { offset: 0.55, 'stop-color': '#fff', 'stop-opacity': 0.42 }, lg);
    S('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, lg);
    const cones = [[230, 1], [1690, -1]].map(([x, dir]) => {
      const el = D('div', 'abs o0', lights);
      el.style.willChange = 'transform';
      glowCopies(el, [[26, 0.6], [9, 0.75], [0, 1]], (w, glow) => {
        const s = svgBox(w, 0, 0, 1, 1);
        if (glow) S('polygon', { points: '-16,0 16,0 150,1180 -150,1180', fill: 'url(#spotG)' }, s);
        else S('image', { href: 'assets/cone.png', x: -160, y: 0, width: 320, height: 1180 }, s);
        S('ellipse', { cx: 0, cy: 6, rx: 34, ry: 16, fill: '#fff' }, s);
      });
      return { el, x, dir };
    });

    const mask = D('div', 'abs o0', root);
    const msv = svgBox(mask, 0, 0, 10, 10);
    HA.crewMask(S('g', { transform: 'translate(16 14)' }, msv), '#000', '#000');
    HA.crewMask(S('g', {}, msv), '#fff', '#e60012');

    const word = D('div', 'abs o0', root);
    glowCopies(word, [[26, 0.65], [8, 0.8], [0, 1]], (w, glow) => {
      const wt = D('div', 'anton', w, 'ENCORE!');
      wt.style.cssText = 'font-size:330px;color:#fff' + (glow ? '' : ';text-shadow:16px 14px 0 #000');
      if (!glow) wt.classList.add('ink');
    });
    const sub = D('div', 'abs o0', root);
    const subT = D('div', 'tape abril ink', sub, 'Take another bow.');
    subT.style.cssText += ';font-size:50px;padding:0.2em 0.6em 0.22em';
    const who = D('div', 'abs o0', root);
    const whoT = D('div', 'tape w arch cap', who, 'Soft spot found  /  MAGPIE goes again');
    whoT.style.cssText += ';font-size:22px';

    function update(t) {
      const on = t >= T.encore && t < T.smash;
      disp(root, on);
      if (!on) return;
      const out = E.inExpo(prog(t, T.smash - 0.2, T.smash));
      const p = (a, d) => prog(t, T.encore + a, T.encore + a + d);
      tf(burstW, 900, 560, 0, lerp(0.3, 1, E.outBack(p(0, 0.2))) * (1 + out * 1.4));
      tf(bspin, 0, 0, t * 14, 1);
      tf(ht, 0, 0, 0, 1);
      for (const c of cones) tf(c.el, c.x, -60, c.dir * (lerp(-38, -24, E.outCubic(p(0, 0.5))) + 4 * Math.sin(t * 5)), 1);
      op(lights, prog(t, T.encore + 0.04, T.encore + 0.16) * (1 - out));
      const mIn = E.outExpo(p(0.03, 0.22));
      tf(mask, lerp(-900, 330, mIn) - out * 1400, 200, -12, lerp(0.5, 0.62, mIn));
      const wIn = p(0.07, 0.16);
      tf(word, 470 + out * 2400, 330, AXIS, lerp(3.2, 1, E.outBack(wIn)) * (1 + out * 0.3));
      const sIn = E.outBack(p(0.3, 0.18));
      tf(sub, lerp(1900, 1080, sIn) + out * 1600, 720, 5, 1);
      const hIn = E.outBack(p(0.4, 0.18));
      vis(who, hIn > 0);
      tf(who, lerp(-700, 560, hIn) - out * 1600, 846, 5, 1);
    }
    return { update };
  }

  function buildSmash(ui) {
    const root = D('div', 'scr', ui);
    const frames = [];
    const mk = (bg, build) => {
      const f = D('div', 'scr', root);
      const b = D('div', 'bleed', f);
      b.style.background = bg === '#000' ? '#000 url(assets/grit.png)' : bg === '#e60012' ? '#e60012 url(assets/mottle.png)' : bg;
      const content = D('div', 'abs o0', f);
      build(content);
      frames.push({ f, content });
    };
    mk('#000', (c) => {
      const cs = svgBox(c, 0, 0, 10, 10);
      const r = rng(31);
      let d = '';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + r() * 0.3;
        let x = 0, y = 0, len = 0;
        d += 'M0 0 ';
        while (len < 1300) {
          const s = 60 + r() * 120;
          const aa = a + (r() - 0.5) * 0.5;
          x += Math.cos(aa) * s; y += Math.sin(aa) * s; len += s;
          d += `L${x.toFixed(0)} ${y.toFixed(0)} `;
        }
      }
      S('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 2.5 }, cs);
      S('polygon', { points: pts(burst(9, 30, 110, 4, 0.6)), fill: '#fff' }, cs);
      const w = D('div', 'anton ink', c, 'SMASH');
      w.style.cssText = 'position:absolute;left:-560px;top:-190px;font-size:330px;color:#fff;text-shadow:14px 12px 0 #e60012';
    });
    mk('#fff', (c) => {
      HC.htImg(c, 'ht-amp', -1000, -700, 2000, 1400);
      const w = D('div', 'abril ink', c, '&');
      w.style.cssText = 'position:absolute;left:-250px;top:-590px;font-size:800px;color:#e60012;text-shadow:18px 14px 0 #000';
    });
    mk('#e60012', (c) => {
      const cs = svgBox(c, 0, 0, 10, 10);
      S('polygon', { points: pts(HC.rough(burst(13, 260, 620, 21, 0.5), { amp: 3, step: 9, seed: 21 })), fill: '#000' }, cs);
      const w = D('div', 'anton ink', c, 'GRAB');
      w.style.cssText = 'position:absolute;left:-400px;top:-190px;font-size:330px;color:#fff;text-shadow:14px 12px 0 #000';
    });
    const cuts = [T.smash, T.smash + 0.2, T.smash + 0.37, T.smash + 0.57];
    function update(t) {
      const on = t >= cuts[0] && t < T.results + 0.05;
      disp(root, on);
      if (!on) return;
      for (let i = 0; i < 3; i++) {
        const fo = t >= cuts[i] && t < cuts[i + 1] + (i === 2 ? 0.25 : 0);
        disp(frames[i].f, fo);
        if (!fo) continue;
        const u = prog(t, cuts[i], cuts[i] + 0.09);
        const drift = (t - cuts[i]) * 40;
        const rot = [AXIS, 6, -5][i];
        tf(frames[i].content, 960 + drift * (i === 1 ? -1 : 1), 540, rot, lerp(1.35, 1, E.outCubic(u)) + drift * 0.002);
      }
    }
    return { update };
  }

  function buildFlash(ui) {
    const el = D('div', 'bleed', ui);
    el.style.pointerEvents = 'none';
    const FL = [
      [6.46, 0.12, '#fff', 1], [9.45, 0.06, '#fff', 0.6], [10.15, 0.06, '#fff', 0.9],
      [11.92, 0.26, '#fff', 1], [13.0, 0.08, '#fff', 0.45], [18.8, 0.1, '#fff', 0.5],
    ];
    function update(t) {
      let a = 0, c = '#fff';
      for (const f of FL) {
        const u = (t - f[0]) / f[1];
        if (u >= 0 && u < 1) { const v = f[3] * (1 - u * u); if (v > a) { a = v; c = f[2]; } }
      }
      vis(el, a > 0.002);
      if (a > 0.002) { op(el, a); sty(el, 'background', c); }
    }
    return { update };
  }

  window.HB = { buildLights, buildBattle, buildEncore, buildSmash, buildFlash, elementGlyph, ELEMENTS };
})();
