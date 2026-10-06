(() => {
  const { D, S, K, E, tf, op, vis, disp, txt, attr, sty, prog, clamp, lerp, rng, pts, torn,
    halftone, svgBox } = HC;
  const T = HW.T;

  const ITEMS = [
    ['TRICKS', '9 tricks learned. 64 SP to spend.'],
    ['STASH', '23 items, 3 new. Two are still warm.'],
    ['GEAR', 'Stiletto, derringer, and a very good coat.'],
    ['CREW', 'Four masks. Everyone showed up tonight.'],
    ['MARKS', 'One open case: Aurelio Gilt.'],
    ['CASEBOOK', 'Floor plans, photos, loose ends.'],
    ['ALIBI', 'Save the night. Lie low until morning.'],
  ];
  const SEL = [1.0].concat(T.cursor);
  const AXIS = -8;
  const COL = [935, 150];
  const STEP = 110;
  const JAG = [40, 160, 10, 140, -10, 120, -30];
  const wordX = (i) => JAG[i] - 36 * i;
  const FIG = { x: 26, y: 94, s: 0.97 };

  const CREW = [
    { name: 'MAGPIE', lv: 37, hp: [412, 480], sp: [64, 112] },
    { name: 'LOCKJAW', lv: 36, hp: [538, 560], sp: [41, 70] },
    { name: 'HUSH', lv: 36, hp: [377, 420], sp: [88, 96] },
    { name: 'STATIC', lv: 35, hp: [301, 350], sp: [120, 140] },
  ];

  function selAt(t) { let k = 0; for (let i = 0; i < SEL.length; i++) if (t >= SEL[i]) k = i; return k; }

  function maskIcon(g, name) {
    S('polygon', { points: '6,10 80,2 78,80 2,84', fill: '#e60012' }, g);
    S('polygon', { points: '22,74 20,40 30,18 52,14 66,28 68,52 60,74', fill: '#000' }, g);
    if (name === 'MAGPIE') {
      S('polygon', { points: '24,38 64,34 66,44 56,48 44,44 30,48 8,50 26,42 6,36', fill: '#fff' }, g);
      S('polygon', { points: '50,38 60,37 59,42 51,42', fill: '#e60012' }, g);
    } else if (name === 'LOCKJAW') {
      S('polygon', { points: '20,50 68,46 66,70 44,80 22,70', fill: '#fff' }, g);
      for (let i = 0; i < 4; i++) S('rect', { x: 26 + i * 10, y: 56, width: 4, height: 16, fill: '#000' }, g);
    } else if (name === 'HUSH') {
      S('polygon', { points: '28,24 60,22 66,48 58,72 34,74 24,50', fill: '#fff' }, g);
      S('rect', { x: 34, y: 38, width: 10, height: 4, fill: '#000' }, g);
      S('rect', { x: 50, y: 37, width: 10, height: 4, fill: '#000' }, g);
      S('path', { d: 'M38 58 L56 64 M38 64 L56 57', stroke: '#e60012', 'stroke-width': 3 }, g);
    } else {
      S('polygon', { points: '20,32 70,28 70,46 20,50', fill: '#fff' }, g);
      S('rect', { x: 26, y: 36, width: 38, height: 4, fill: '#e60012' }, g);
      S('path', { d: 'M58 18 L70 2 M64 22 L80 12', stroke: '#fff', 'stroke-width': 3 }, g);
    }
  }

  function padGlyph(parent, x, y, dir, size = 34) {
    const g = svgBox(parent, x, y, size, size);
    const h = size / 2, r = size * 0.13;
    S('polygon', { points: `${h},1 ${size - 1},${h} ${h},${size - 1} 1,${h}`, fill: '#000', stroke: '#fff', 'stroke-width': 2 }, g);
    const at = { n: [h, size * 0.24], e: [size * 0.76, h], s: [h, size * 0.76], w: [size * 0.24, h] };
    for (const k in at) S('circle', { cx: at[k][0], cy: at[k][1], r: k === dir ? r * 1.5 : r, fill: k === dir ? '#e60012' : '#fff' }, g);
    return g;
  }

  function blueprint(g) {
    const walls = [
      'M0 0 H420 M480 0 H1000 V250 M1000 330 V700 H560 M500 700 H0 V560 M0 500 V0',
      'M300 0 V280 M300 340 V700', 'M640 0 V120 M640 180 V420', 'M0 420 H140 M200 420 H300',
      'M640 300 H780 M840 300 H1000', 'M300 560 H560 V700', 'M640 420 H700',
    ].join(' ');
    S('path', { d: walls, fill: 'none', stroke: 'rgba(255,255,255,0.42)', 'stroke-width': 3 }, g);
    let thin = '';
    for (let i = 0; i < 11; i++) thin += `M${24 + i * 16} 470 V660 `;
    for (let x = 360; x <= 580; x += 110) for (let y = 60; y <= 500; y += 110) thin += `M${x} ${y} h16 v16 h-16 Z `;
    thin += 'M480 40 H580 V140 H480 Z M480 40 L580 140 M580 40 L480 140 ';
    thin += 'M0 -40 H1000 M0 -50 V-30 M1000 -50 V-30 M500 -46 V-34 ';
    thin += 'M660 330 H990 M660 352 H990 M660 374 H990 ';
    S('path', { d: thin, fill: 'none', stroke: 'rgba(255,255,255,0.3)', 'stroke-width': 1.25 }, g);
    S('circle', { cx: 830, cy: 540, r: 110, fill: 'none', stroke: 'rgba(255,255,255,0.5)', 'stroke-width': 3 }, g);
    S('circle', { cx: 830, cy: 540, r: 84, fill: 'none', stroke: 'rgba(255,255,255,0.3)', 'stroke-width': 1.25, 'stroke-dasharray': '4 6' }, g);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      S('line', { x1: 830 - Math.cos(a) * 60, y1: 540 - Math.sin(a) * 60, x2: 830 + Math.cos(a) * 60, y2: 540 + Math.sin(a) * 60,
        stroke: 'rgba(255,255,255,0.3)', 'stroke-width': 1.25 }, g);
    }
    const label = (x, y, s, size = 15) => {
      const t = S('text', { x, y, fill: 'rgba(255,255,255,0.5)', 'font-family': 'LF Archivo', 'font-size': size,
        'font-weight': 700, 'letter-spacing': '2' }, g);
      t.textContent = s;
    };
    label(40, 60, 'LOBBY'); label(330, 40, 'TELLERS'); label(668, 60, 'SECURITY'); label(492, 166, 'LIFT');
    label(24, 456, 'STAIRS B'); label(770, 680, 'B3 VAULT', 18); label(668, 322, 'LASER GRID');
    label(440, -54, '48.6 M', 14); label(316, 640, 'GUARD');
    const route = [[-60, 610], [160, 610], [160, 380], [470, 380], [470, 230], [720, 230], [720, 540], [740, 540]];
    let len = 0;
    for (let i = 1; i < route.length; i++) len += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
    const path = S('polyline', { points: pts(route), fill: 'none', stroke: '#e60012', 'stroke-width': 8,
      'stroke-linejoin': 'miter', 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len }, g);
    const x = S('path', { d: 'M800 510 L860 570 M860 510 L800 570', stroke: '#e60012', 'stroke-width': 14 }, g);
    return { path, len, x };
  }

  function buildPause(ui) {
    const root = D('div', 'scr', ui);
    const veil = D('div', 'bleed grit', root);

    const tagWall = D('div', 'abs o0', root);
    const tagImg = D('img', 'abs', tagWall);
    tagImg.src = 'assets/stencil-mask.png';

    const bpWrap = D('div', 'abs o0', root);
    const bpSvg = svgBox(bpWrap, 0, 0, 1000, 700);
    const bp = blueprint(S('g', {}, bpSvg));

    const sheet = D('div', 'abs o0', root);
    const ss = svgBox(sheet, 0, 0, 1000, 1080);
    const edge = [], rim = [];
    const er = rng(11);
    const N = 330;
    let wv = 0, v = 0;
    const ex = 320 / Math.hypot(320, 1920), ey = 1920 / Math.hypot(320, 1920);
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      v = v * 0.82 + (er() - 0.5) * 0.9;
      wv = clamp(wv + v * 0.3, -1, 1);
      const a = 16 * wv + 5 * (er() - 0.5) * (er() < 0.12 ? 2.6 : 1);
      const x = lerp(920, 600, u) + a * ey, y = lerp(-420, 1500, u) + a * ex;
      edge.push([x, y]);
      const f = 4 + er() * er() * 10;
      rim.push([x + f * ey, y + f * ex]);
    }
    const shardPts = [[-900, -420]].concat(edge, [[-900, 1500]]);
    S('polygon', { points: pts([[-900, -420]].concat(rim, [[-900, 1500]])), fill: '#fff' }, ss);
    const cp = S('clipPath', { id: 'shardClip' }, S('defs', {}, ss));
    S('polygon', { points: pts(shardPts) }, cp);
    S('polygon', { points: pts(shardPts), fill: '#e60012' }, ss);
    const inner = S('g', { 'clip-path': 'url(#shardClip)' }, ss);
    S('rect', { x: -900, y: -420, width: 1900, height: 1920, fill: HC.texFill(ss, 'sheetMottle', 'mottle') }, inner);
    S('image', { href: 'assets/ht-sheet.png', x: 0, y: 0, width: 1000, height: 1100 }, inner);
    const floor = FIG.y + 980 * FIG.s, ppi = 12.5;
    let rl = '', rb = '';
    for (let h = 0; h <= 96; h += 2) {
      const y = floor - h * ppi;
      if (h % 6 === 0) rb += `M-900 ${y.toFixed(1)} H1000 `; else rl += `M-900 ${y.toFixed(1)} H1000 `;
    }
    S('path', { d: rl, stroke: 'rgba(0,0,0,0.28)', 'stroke-width': 1.25 }, inner);
    S('path', { d: rb, stroke: 'rgba(0,0,0,0.7)', 'stroke-width': 3 }, inner);
    for (let h = 36; h <= 84; h += 6) {
      const y = floor - h * ppi - 8;
      const tx = S('text', { x: 18, y: y.toFixed(1), fill: '#000', 'font-family': 'LF Archivo', 'font-size': 22, 'font-weight': 800 }, inner);
      tx.textContent = Math.floor(h / 12) + '′' + (h % 12) + '″';
    }

    const hero = D('div', 'scr', ui);
    const front = D('div', 'scr', ui);
    const figWrap = D('div', 'abs o0', hero);
    const figSvg = svgBox(figWrap, 0, 0, 700, 1000);
    const fig = HA.magpie(S('g', {}, figSvg), { ink: '#000', paper: '#fff', mis: '#7a0009', outline: 14 });

    const plac = D('div', 'abs o0', front);
    const pls = svgBox(plac, 0, 0, 392, 176);
    S('rect', { x: 12, y: 11, width: 392, height: 176, fill: '#000' }, pls);
    S('rect', { x: 0, y: 0, width: 392, height: 176, fill: '#fff' }, pls);
    S('rect', { x: 10, y: 10, width: 372, height: 156, fill: 'none', stroke: '#000', 'stroke-width': 2 }, pls);
    const p1 = D('div', 'arch cap', plac, 'Nadir City P.D.   Booking');
    p1.style.cssText = 'position:absolute;left:24px;top:20px;font-size:14px;color:#000';
    const p2 = D('div', 'anton ink', plac, 'MAGPIE');
    p2.style.cssText = 'position:absolute;left:22px;top:40px;font-size:76px;color:#000';
    const p3 = D('div', 'arch cap', plac, 'No. 0037        6′2″');
    p3.style.cssText = 'position:absolute;left:24px;top:124px;font-size:16px;color:#000';
    const p4 = D('div', 'abril', plac, 'charges\ndropped');
    p4.style.cssText = 'position:absolute;left:268px;top:62px;font-size:26px;line-height:0.95;color:#e60012;transform:rotate(-9deg)';

    const menu = D('div', 'abs o0', front);
    const swSvg = svgBox(menu, 0, 0, 10, 10);
    swSvg.style.zIndex = '0';
    const sw = S('g', {}, swSvg);
    const fxSvg = svgBox(menu, 0, 0, 10, 10);
    fxSvg.style.zIndex = '2';
    const fx = S('g', {}, fxSvg);
    const burstG = S('g', {}, sw);
    const burstSpin = S('g', {}, burstG);
    S('image', { href: 'assets/swipe.png', x: -50, y: -185, width: 740, height: 350 }, burstSpin);
    const bladeMis = S('polygon', { fill: '#e60012' }, fx);
    const blade = S('polygon', { fill: '#fff' }, fx);

    const words = ITEMS.map(([name], i) => {
      const w = D('div', 'abs', menu);
      w.style.transformOrigin = '0 52px';
      const ini = D('div', 'abs', w);
      ini.style.cssText = `left:-38px;top:-30px;width:156px;height:204px;transform:rotate(${[4, -3, 2, 5, -2, 3, -4][i]}deg)`;
      const paint = D('img', 'abs', ini);
      paint.src = `assets/spray-${i % 3}.png`;
      const paintK = D('img', 'abs', ini);
      paintK.src = `assets/spray-k${i % 3}.png`;
      const letter = D('div', 'anton ink', ini, name[0]);
      letter.style.cssText = 'position:absolute;left:36px;top:36px;width:84px;line-height:92px;font-size:84px;text-align:center;color:#000';
      const rest = D('div', 'anton ink', w, name.slice(1));
      rest.style.cssText = 'position:absolute;left:88px;top:-4px;font-size:100px;color:#fff;text-shadow:6px 5px 0 #e60012';
      return { w, ini, paint, paintK, letter, rest, width: 0, x: wordX(i), y: i * STEP };
    });

    const cap = D('div', 'abs o0', front);
    const capT = D('div', 'tape w arch', cap, '');
    capT.style.cssText += ';font-size:27px;font-weight:650;padding-left:1em;padding-right:1em';

    const nights = D('div', 'abs o0', front);
    const n6 = D('div', 'anton ink', nights, '6');
    n6.style.cssText = 'position:absolute;left:0;top:0;font-size:230px;color:#fff;text-shadow:10px 8px 0 #e60012';
    const nl = D('div', 'abril', nights, 'nights\nleft');
    nl.style.cssText = 'position:absolute;left:128px;top:62px;font-size:46px;line-height:0.95;color:#fff';
    const nd = D('div', 'arch cap', nights, 'Deadline  Fri 20 Nov');
    nd.style.cssText = 'position:absolute;left:132px;top:166px;font-size:17px;color:#fff';

    const tags = CREW.map((c, i) => {
      const w = D('div', 'abs o0', front);
      const plate = svgBox(w, 0, 0, 390, 116);
      HC.tornPlate(plate, 390, 116, { seed: 40 + i, amp: 9, sides: 'r' });
      S('rect', { x: 0, y: 0, width: 5, height: 116, fill: '#e60012' }, plate);
      maskIcon(S('g', { transform: 'translate(16 16)' }, plate), c.name);
      const nm = D('div', 'anton', w, c.name);
      nm.style.cssText = 'position:absolute;left:116px;top:6px;font-size:38px;color:#fff';
      const lv = D('div', 'arch cap', w, 'LV ' + c.lv);
      lv.style.cssText = 'position:absolute;left:296px;top:18px;width:66px;text-align:right;font-size:15px;color:#fff';
      const bars = svgBox(w, 116, 0, 270, 116);
      const row = (y, label, v, max, color, track) => {
        const l = S('text', { x: 0, y: y + 10, fill: '#fff', 'font-family': 'LF Archivo', 'font-size': 14, 'font-weight': 800, 'letter-spacing': 1 }, bars);
        l.textContent = label;
        S('rect', { x: 28, y, width: 150, height: 10, fill: track }, bars);
        S('rect', { x: 28, y, width: 150 * v / max, height: 10, fill: color }, bars);
        const n = D('div', 'anton', w, String(v));
        n.style.cssText = `position:absolute;left:296px;top:${y - 12}px;width:66px;text-align:right;font-size:26px;color:${color}`;
      };
      row(64, 'HP', c.hp[0], c.hp[1], '#fff', 'rgba(255,255,255,0.22)');
      row(88, 'SP', c.sp[0], c.sp[1], '#e60012', 'rgba(230,0,18,0.3)');
      return { w };
    });

    const dos = D('div', 'abs o0', front);
    const dsv = svgBox(dos, 0, 0, 540, 720);
    const dshape = pts(torn(540, 720, { seed: 71, amp: 5, step: 16, sides: 'b' }));
    S('polygon', { points: dshape, fill: '#e60012', transform: 'translate(16 14)' }, dsv);
    S('polygon', { points: dshape, fill: '#fff' }, dsv);
    const pg = S('g', { transform: 'translate(34 96)' }, dsv);
    S('rect', { x: 0, y: 0, width: 230, height: 270, fill: '#fff', stroke: '#000', 'stroke-width': 4 }, pg);
    const ptClip = S('clipPath', { id: 'portraitClip' }, S('defs', {}, dsv));
    S('rect', { x: 2, y: 2, width: 226, height: 266 }, ptClip);
    const pin = S('g', { 'clip-path': 'url(#portraitClip)' }, pg);
    halftone(pin, 230, 270, 9, (x, y) => 0.55 - Math.hypot(x - 115, y - 110) / 420, { fill: '#e60012' });
    HA.markPortrait(S('g', { transform: 'translate(-12 16) scale(0.62)' }, pin), { ink: '#000', paper: '#fff', accent: '#e60012' });
    let pr = '';
    for (let y = 20; y < 270; y += 25) pr += `M0 ${y} h${(y % 50 === 20) ? 26 : 14} `;
    S('path', { d: pr, stroke: '#000', 'stroke-width': 2 }, pin);
    const caseTape = D('div', 'tape r anton', dos, 'CASE 07');
    caseTape.style.cssText += ';position:absolute;left:24px;top:28px;font-size:34px;transform:rotate(-4deg)';
    const mname = D('div', 'anton ink', dos, 'AURELIO\nGILT');
    mname.style.cssText = 'position:absolute;left:286px;top:96px;font-size:66px;line-height:0.98;color:#000';
    const malias = D('div', 'abril', dos, '“The Gilded\nMan”');
    malias.style.cssText = 'position:absolute;left:288px;top:240px;font-size:30px;line-height:1.05;color:#e60012';
    const facts = [
      ['Owns', 'Gilt & Daughters Bank'],
      ['Hides', 'the city pension fund'],
      ['Where', 'vault B3, under the lobby'],
      ['Guard', 'the Gilt Warden'],
    ];
    const redacts = [];
    facts.forEach(([k, v], i) => {
      const row = D('div', 'arch', dos);
      row.style.cssText = `position:absolute;left:34px;top:${398 + i * 46}px;font-size:24px;color:#000;white-space:pre;font-weight:600`;
      const kk = D('span', 'arch cap', row, k);
      kk.style.cssText = 'font-size:15px;color:#e60012;display:inline-block;width:78px';
      const vv = D('span', '', row, v);
      vv.style.position = 'relative';
      if (i === 1 || i === 2) {
        const bar = D('span', '', vv);
        bar.style.cssText = 'position:absolute;left:-4px;right:-6px;top:3px;bottom:0px;background:#000;transform-origin:100% 50%;' +
          'clip-path:polygon(0 18%,2% 2%,40% 6%,97% 0,100% 24%,99% 80%,95% 100%,52% 94%,3% 100%,1% 64%)';
        redacts.push(bar);
      }
    });
    const stamp = D('div', 'abs o0', dos);
    const stampIn = D('div', 'anton ink', stamp, 'TONIGHT');
    stampIn.style.cssText = 'font-size:64px;color:#e60012;padding:4px 18px 0;border:6px double #e60012;line-height:1.05';
    const voids = D('div', 'abs', stamp);
    voids.style.cssText = 'left:0;top:0;width:100%;height:100%;background:url(assets/grit.png) 37px 11px';
    const copy = D('img', 'abs', dos);
    copy.src = 'assets/copy-dossier.png';
    copy.style.clipPath = HC.polyCSS(torn(540, 720, { seed: 71, amp: 5, step: 16, sides: 'b' }));
    const go = D('div', 'abs o0', dos);
    const goT = D('div', 'tape anton', go, 'GO IN');
    goT.style.cssText += ';font-size:40px;padding-left:64px';
    padGlyph(go, 18, 15, 's', 36);

    const foot = D('div', 'abs o0', front);
    const fund = D('div', 'anton ink', foot, '$1,204,550');
    fund.style.cssText = 'position:absolute;left:0;top:0;font-size:52px;color:#fff;text-shadow:5px 4px 0 #e60012';
    const fundL = D('div', 'arch cap', foot, 'Crew fund');
    fundL.style.cssText = 'position:absolute;left:4px;top:62px;font-size:15px;color:#fff';
    const hints = D('div', 'abs o0', front);
    [['s', 'Select'], ['e', 'Back']].forEach(([d, s], i) => {
      padGlyph(hints, i * 140, 0, d, 28);
      const l = D('div', 'arch cap', hints, s);
      l.style.cssText = `position:absolute;left:${i * 140 + 36}px;top:5px;font-size:16px;color:#fff`;
    });

    const slash = D('div', 'abs o0', front);
    const slSvg = svgBox(slash, 0, 0, 10, 10);
    S('polygon', { points: '-200,-60 2400,-150 2400,40 -200,120', fill: '#fff' }, slSvg);
    S('polygon', { points: '-200,-30 2400,-120 2400,10 -200,90', fill: '#e60012' }, slSvg);

    function measure() {
      for (const w of words) w.width = 88 + w.rest.offsetWidth;
    }

    function colFrame(t) {
      const sub = E.outBack(prog(t, T.marks, T.marks + 0.26));
      return [COL[0] + lerp(0, -170, sub), COL[1] + lerp(0, 50, sub), AXIS + lerp(0, -5, sub), lerp(1, 0.9, sub), sub];
    }
    function colToScreen(f, x, y) {
      const a = f[2] * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      return [f[0] + (x * c - y * s) * f[3], f[1] + (x * s + y * c) * f[3]];
    }
    function aimAngle(p) {
      const sx = FIG.x + HA.ARM_PIVOT[0] * FIG.s, sy = FIG.y + HA.ARM_PIVOT[1] * FIG.s;
      return Math.atan2(p[1] - sy, p[0] - sx) * 180 / Math.PI;
    }

    const TOWER = [1190, 330];

    function update(t) {
      const out = prog(t, T.lo, T.lo + 0.3);
      const outE = E.inExpo(out);
      const heroOn = t < T.lo + 0.42 || t >= T.fieldIn;
      disp(hero, heroOn);
      if (heroOn) {
        const back = E.outBack(prog(t, T.fieldIn, T.fieldIn + 0.3));
        tf(figWrap, t >= T.fieldIn ? FIG.x + lerp(-760, 0, back) : FIG.x - outE * 1200, FIG.y, 0, FIG.s);
        if (t < T.pauseIn || t >= T.fieldIn) fig.aim(aimAngle(TOWER));
      }
      const on = t >= T.pauseIn && t < T.lo + 0.42;
      disp(root, on);
      disp(front, on);
      if (!on) return;
      if (!words[0].width) measure();
      const dossierOn = t >= T.marks;
      const f = colFrame(t);

      const sp = prog(t, T.pauseIn, T.pauseIn + 0.2);
      vis(slash, sp > 0 && sp < 1);
      tf(slash, lerp(-2600, 2600, E.inOutCubic(sp)), 470, -8, 1);

      op(veil, K(t, [[T.pauseIn, 0], [T.pauseIn + 0.12, 0.7]]) * (1 - out));
      tf(tagWall, 980 - outE * 900, 560, -8, 0.78);
      HC.wipeX(tagImg, E.outCubic(prog(t, T.pauseIn + 0.3, T.pauseIn + 0.62)));

      const shIn = E.outExpo(prog(t, T.pauseIn + 0.04, T.pauseIn + 0.34));
      tf(sheet, lerp(-1400, 0, shIn) - outE * 1500, 0, 0, 1);

      const pIn = E.outBack(prog(t, T.pauseIn + 0.34, T.pauseIn + 0.56));
      vis(plac, pIn > 0);
      tf(plac, 280 - outE * 1300, lerp(1300, 846, pIn), 4, 1);

      tf(menu, f[0], f[1], f[2], f[3]);
      const k = selAt(t);
      const ts = SEL[k];
      const pop = prog(t, ts, ts + 0.16);
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const inP = E.outBack(prog(t, T.pauseIn + 0.18 + i * 0.045, T.pauseIn + 0.4 + i * 0.045));
        const outP = E.inExpo(prog(t, T.lo + i * 0.03, T.lo + 0.2 + i * 0.03));
        const sel = i === k && t >= SEL[0];
        const s = sel ? 1 + 0.2 * E.outBack(pop) : 1;
        const dx = lerp(1300, 0, inP) + outP * 1500;
        const dy = lerp(-160, 0, inP) - outP * 300;
        tf(w.w, w.x + dx + (sel ? 34 * E.outBack(pop) : 0), w.y + dy, (sel ? -3 * E.outBack(pop) : 0) + lerp(-12, 0, inP), s);
        const dimmed = dossierOn && !sel;
        sty(w.w, 'zIndex', sel ? '3' : '1');
        sty(w.rest, 'color', sel ? '#000' : '#fff');
        const trail = 1 + 2 * Math.max(0, 1 - inP) * (inP > 0 ? 1 : 0);
        const mx = sel ? 7 : 6 * trail, my = sel ? 6 : 5;
        sty(w.rest, 'textShadow', dimmed && !sel ? 'none' : `${mx.toFixed(1)}px ${my.toFixed(1)}px 0 #e60012`);
        vis(w.paint, !sel);
        vis(w.paintK, sel);
        sty(w.letter, 'color', sel ? '#fff' : '#000');
        sty(w.rest, 'filter', dimmed ? 'none' : '');
        sty(w.letter, 'filter', dimmed ? 'none' : '');
        op(w.w, dimmed ? 0.3 : 1);
      }
      const w = words[k];
      const fxOn = t >= SEL[0] && out < 0.3;
      vis(fxSvg, fxOn);
      vis(swSvg, fxOn);
      if (fxOn) {
        const ww = w.width * 1.2;
        const u = E.outExpo(pop);
        const bl = [[-46, -60], [lerp(-40, ww + 54, u), -84], [lerp(-30, ww + 92, u), -4], [lerp(-40, ww + 44, u), 76], [-28, 72], [-56, 6]];
        attr(blade, 'points', pts(bl));
        attr(bladeMis, 'points', pts(bl.map((p) => [p[0] + 15, p[1] + 13])));
        const wx = w.x + 34, wy = w.y + 52;
        attr(fx, 'transform', `translate(${wx.toFixed(1)} ${wy.toFixed(1)}) rotate(-3)`);
        attr(sw, 'transform', `translate(${wx.toFixed(1)} ${wy.toFixed(1)}) rotate(-3)`);
        const swp = clamp(prog(t, ts, ts + 0.05));
        const sx = (ww + 190) / 640;
        attr(burstG, 'transform', `translate(-96 ${(k % 2 ? 8 : -6)}) rotate(${k % 2 ? -4 : -9})`);
        attr(burstSpin, 'transform', `scale(${(sx * (0.08 + 0.92 * E.outCubic(swp))).toFixed(4)} ${0.78 + 0.1 * (k % 3) / 2})`);
        attr(blade, 'fill', t >= T.marks && t < T.marks + 0.1 ? '#e60012' : '#fff');
      }
      const capOn = t >= SEL[0] + 0.05 && !dossierOn;
      vis(cap, capOn);
      if (capOn) {
        txt(capT, ITEMS[k][1]);
        const cu = E.outBack(prog(t, ts + 0.04, ts + 0.2));
        tf(cap, lerp(1000, 860, cu), 958, -3, 1);
        op(cap, cu);
      }

      const target = (i) => aimAngle(colToScreen(f, words[i].x + 60, words[i].y + 52));
      let ang;
      if (t < T.marks) {
        const prev = k > 0 ? target(k - 1) : aimAngle(TOWER);
        ang = lerp(prev, target(k), E.outBack(prog(t, ts, ts + 0.2)));
      } else {
        ang = lerp(target(4), aimAngle([1340, 380]), E.outBack(prog(t, T.marks + 0.05, T.marks + 0.3)));
      }
      fig.aim(ang);

      const nIn = E.outBack(prog(t, T.pauseIn + 0.28, T.pauseIn + 0.52));
      tf(nights, 1548 + outE * 900, lerp(-300, 24, nIn), AXIS, 1);
      const fIn2 = E.outBack(prog(t, T.pauseIn + 0.34, T.pauseIn + 0.6));
      tf(foot, 1560 + outE * 900, lerp(1200, 948, fIn2), AXIS, 1);
      tf(hints, 1574 + outE * 900, lerp(1300, 1036, fIn2), AXIS, 1);

      for (let i = 0; i < tags.length; i++) {
        const inP = E.outBack(prog(t, T.pauseIn + 0.3 + i * 0.05, T.pauseIn + 0.55 + i * 0.05));
        const awayP = E.inExpo(prog(t, T.marks - 0.02 + i * 0.03, T.marks + 0.16 + i * 0.03));
        tf(tags[i].w, 1478 + i * 20 + lerp(700, 0, inP) + awayP * 800, 312 + i * 134, AXIS, 1);
      }

      disp(dos, dossierOn);
      if (dossierOn) {
        const dIn = E.outBack(prog(t, T.marks + 0.04, T.marks + 0.3));
        const dOut = E.inExpo(prog(t, T.lo, T.lo + 0.22));
        tf(dos, lerp(1900, 1310, dIn) + dOut * 900, lerp(60, 150, dIn) - dOut * 200, lerp(24, 5, dIn) + dOut * 20, 1);
        for (let i = 0; i < redacts.length; i++) {
          const u = E.inOutCubic(prog(t, 4.25 + i * 0.28, 4.6 + i * 0.28));
          tf(redacts[i], 0, 0, 0, Math.max(0.0001, 1 - u), 1);
          vis(redacts[i], u < 1);
        }
        const st = prog(t, 4.95, 5.08);
        vis(stamp, st > 0);
        tf(stamp, 236, 560, -14, lerp(2.4, 1, E.outBack(st)));
        const goIn = E.outBack(prog(t, 4.3, 4.5));
        vis(go, goIn > 0);
        const pressed = t >= T.goIn && t < T.goIn + 0.12;
        tf(go, 300 + lerp(200, 0, goIn), 650, -3, pressed ? 0.92 : 1);
        sty(goT, 'background', pressed ? '#e60012' : '#000');
      }

      const bpIn = prog(t, T.pauseIn + 0.2, T.pauseIn + 0.6);
      op(bpWrap, bpIn * (1 - out));
      tf(bpWrap, 880 + lerp(80, 0, bpIn) - f[4] * 60, 300, AXIS, 1.0);
      const rd = E.inOutCubic(prog(t, 4.3, 5.1));
      attr(bp.path, 'stroke-dashoffset', (bp.len * (1 - rd)).toFixed(1));
      vis(bp.x, rd >= 1);
    }
    return { update };
  }

  window.HP = { buildPause, ITEMS, padGlyph, maskIcon, CREW };
})();
