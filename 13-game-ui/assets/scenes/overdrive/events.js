(() => {
  const { el, css, text, lit, TEAMS } = ODHud;
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lin = (t, a, b) => clamp01((t - a) / (b - a));
  const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const expoIn = (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
  const backOut = (x, k = 1.7) => { x = clamp01(x) - 1; return 1 + (k + 1) * x * x * x + k * x * x; };
  const mixv = (a, b, k) => a + (b - a) * k;

  function sign(parent, klass, s, perLetter) {
    const box = el('div', 'sign ' + klass, parent);
    box._layers = ['sg-bw', 'sg-bt', 'sg-fill'].map((cl) => {
      const layer = el('div', 'sg ' + cl, box);
      if (perLetter) layer._letters = [...s].map((ch) => el('span', ch === ' ' ? 'sp' : '', layer, ch === ' ' ? '&nbsp;' : ch));
      else layer.textContent = s;
      return layer;
    });
    return box;
  }
  function ignite(d) {
    if (d < 0) return 0;
    if (d < 0.04) return 1;
    if (d < 0.10) return 0.08;
    if (d < 0.13) return 0.9;
    if (d < 0.22) return 0.15;
    return 1;
  }

  function burstCanvas() {
    const c = document.createElement('canvas');
    c.width = c.height = 600;
    const g = c.getContext('2d');
    g.translate(300, 300);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, w = 0.02 + 0.02 * ((i * 7) % 3) / 2;
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 300);
      gr.addColorStop(0, 'rgba(255,248,240,0.6)'); gr.addColorStop(0.35, 'rgba(220,228,255,0.18)'); gr.addColorStop(1, 'rgba(220,228,255,0)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 300, a - w, a + w); g.closePath(); g.fill();
    }
    return c;
  }

  function instance() {
    const self = {};
    let E = {};

    self.build = function (root) {
      E = {};
      const tc = el('div', 'ev title-card', root);
      E.title = tc;
      el('div', 'tc-scrim', tc);
      el('div', 'tc-round lbl', tc, '<i class="tc-bar"></i>ROUND 07');
      lit(tc, 'tc-name').querySelectorAll('span').forEach((s) => { s.textContent = 'MIRAHAMA'; });
      el('div', 'tc-sub', tc, 'NIGHT CIRCUIT');
      el('div', 'rule tc-rule', tc);
      const facts = el('div', 'tc-facts', tc);
      for (const [k, v] of [['LAPS', '3'], ['LENGTH', '6.50 KM'], ['GRID', 'P4 / 12']]) {
        const f = el('div', 'tc-fact', facts);
        el('div', 'lbl', f, k);
        el('div', 'tc-v', f, v);
      }

      E.count = ['3', '2', '1'].map((n) => sign(root, 'ev count', n));
      E.go = sign(root, 'ev go', 'GO');
      E.goFlare = el('div', 'ev go-flare', root);
      E.goRing = el('div', 'ev go-ring', root);

      const od = el('div', 'ev od-banner', root);
      E.od = od;
      el('div', 'od-scrim', od);
      E.odLines = [el('div', 'od-line top', od), el('div', 'od-line bot', od)];
      E.odSmear = [0, 1, 2, 3].map(() => el('div', 'od-word od-smear', od, 'OVERDRIVE'));
      E.odA = el('div', 'od-word od-split-a', od, 'OVERDRIVE');
      E.odN = el('div', 'od-word od-split-n', od, 'OVERDRIVE');
      const word = el('div', 'od-word od-main', od);
      for (const cl of ['od-bw', 'od-bt', 'od-fill']) el('span', cl, word, 'OVERDRIVE');
      E.odSub = el('div', 'od-sub', od, '<span class="lbl">LIMITER OFF</span><b>x1.40</b>');

      E.final = sign(root, 'ev final-sign', 'FINAL LAP', true);
      E.finalSub = el('div', 'ev final-sub lbl', root, 'LAP 3 / 3');

      E.chequer = el('div', 'ev chequer', root);
      el('div', 'chequer-edge', E.chequer);
      const win = el('div', 'ev win', root);
      E.win = win;
      E.winGlow = el('div', 'win-glow', win);
      E.winBurst = el('div', 'win-burst', win);
      E.winBurst.appendChild(burstCanvas());
      E.winRing = el('div', 'win-ring', win);
      const wr = el('div', 'win-row', win);
      lit(wr, 'win-num').querySelectorAll('span').forEach((s) => { s.textContent = '1'; });
      lit(wr, 'win-ord').querySelectorAll('span').forEach((s) => { s.textContent = 'ST'; });
      E.winLbl = el('div', 'lbl win-lbl', win, 'RACE WINNER');
      const stats = el('div', 'win-stats', win);
      E.winStats = [];
      for (const [k, v, cl] of [['RACE TIME', '1:22.82', ''], ['BEST LAP', '0:27.18', 'fl'], ['POINTS', '+25', 'pts']]) {
        const f = el('div', 'win-stat ' + cl, stats);
        el('div', 'lbl', f, k);
        el('div', 'win-v', f, v);
        E.winStats.push(f);
      }
      E.winTeam = el('div', 'win-team', win, '<i></i><span>KAITEN DYNAMIC</span><b>N. ODA-VANCE  #07</b>');

      const rs = el('div', 'ev results', root);
      E.res = rs;
      el('div', 'res-scrim', rs);
      const rh = el('div', 'res-head', rs);
      el('div', 'res-title', rh, 'CLASSIFICATION');
      el('div', 'lbl', rh, 'MIRAHAMA / ROUND 07 / 3 LAPS');
      const cols = el('div', 'res-cols lbl', rs);
      for (const c of ['POS', 'TEAM', 'TIME', 'BEST', 'PTS']) el('span', '', cols, c);
      const ROWS = [
        ['KTN', '1:22.82', '0:27.18', '25'], ['NVK', '+0.84', '0:27.40', '18'], ['SLN', '+2.31', '0:27.55', '15'],
        ['TKN', '+5.07', '0:27.92', '12'], ['BRV', '+7.66', '0:28.10', '10'], ['HXL', '+9.20', '0:28.31', '8'],
      ];
      E.resRows = ROWS.map(([code, time, best, pts], i) => {
        const row = el('div', 'rrow' + (code === 'KTN' ? ' me' : ''), rs);
        el('div', 'rrow-light', row);
        el('div', 'rrow-pos', row, String(i + 1));
        el('i', 'rrow-tick', row).style.setProperty('--tc', TEAMS[code].color);
        el('div', 'rrow-code', row, code);
        el('div', 'rrow-name', row, TEAMS[code].name);
        el('div', 'rrow-time', row, time);
        el('div', 'rrow-best' + (i === 0 ? ' fl' : ''), row, best);
        el('div', 'rrow-pts', row, pts);
        return row;
      });
      const pr = el('div', 'ev prompts', root);
      E.prompts = pr;
      el('div', 'prompt', pr, '<i>A</i><span>CONTINUE</span>');
      el('div', 'prompt', pr, '<i>Y</i><span>REPLAY</span>');

      E.sting = el('div', 'ev wipe sting', root);
      el('div', 'wipe-edge-w', E.sting);
      el('div', 'wipe-edge-a', E.sting);
      el('div', 'wipe-word', E.sting, 'LAST SECTOR');
      E.wipe = el('div', 'ev wipe', root);
      el('div', 'wipe-edge-w', E.wipe);
      el('div', 'wipe-edge-a', E.wipe);
      el('div', 'wipe-word', E.wipe, 'OVERDRIVE');
      el('div', 'wipe-sub lbl', E.wipe, 'VELOCITY LEAGUE  /  ROUND 07  /  MIRAHAMA');
      return E;
    };

    const show = (e, on) => css(e, 'visibility', on ? 'visible' : 'hidden');

    self.update = function (t, T, LW, LH) {
      {
        const out = lin(t, T.c3 - 0.15, T.c3 + 0.2), back = lin(t, 19.25, 19.6);
        const u = t >= 19 ? 1 - expoOut(back) : expoIn(out);
        show(E.title, u < 0.999);
        css(E.title, 'opacity', (1 - u).toFixed(3));
        css(E.title, 'transform', `translate3d(${(-120 * u).toFixed(2)}px,0,0)`);
      }
      const beats = [T.c3, T.c2, T.c1];
      E.count.forEach((box, i) => {
        const d = t - beats[i], next = (i < 2 ? beats[i + 1] : T.go) - beats[i];
        const on = d >= 0 && d < next + 0.25;
        show(box, on);
        if (!on) return;
        const out = lin(d, next, next + 0.25);
        css(box, 'opacity', (ignite(d) * (1 - out)).toFixed(3));
        const sc = (1.18 - 0.18 * expoOut(d / 0.35)) * (1 + 0.6 * expoIn(out));
        css(box, 'transform', `scale(${sc.toFixed(4)})`);
      });
      {
        const d = t - T.go;
        const on = d >= 0 && d < 1.0;
        show(E.go, on); show(E.goFlare, on); show(E.goRing, on);
        if (on) {
          const out = lin(d, 0.55, 0.9);
          css(E.go, 'opacity', (1 - out).toFixed(3));
          css(E.go, 'transform', `scale(${((1.5 - 0.5 * backOut(d / 0.3)) * (1 + 0.5 * expoIn(out))).toFixed(4)})`);
          css(E.goFlare, 'opacity', (Math.exp(-d / 0.25)).toFixed(3));
          css(E.goFlare, 'transform', `scaleX(${(0.3 + 1.4 * expoOut(d / 0.4)).toFixed(4)})`);
          css(E.goRing, 'opacity', ((1 - lin(d, 0, 0.6)) * 0.8).toFixed(3));
          css(E.goRing, 'transform', `scale(${(0.3 + 2.4 * expoOut(d / 0.6)).toFixed(4)})`);
        }
      }
      {
        const d = t - T.od;
        const on = d >= 0 && d < 1.5;
        show(E.od, on);
        if (on) {
          const inK = expoOut(d / 0.22), outK = expoIn(lin(d, 1.15, 1.45));
          const x = 900 * (1 - inK) - 1300 * outK;
          const v = d < 0.22 ? (1 - inK) : outK;
          css(E.od, 'transform', `translate3d(${x.toFixed(2)}px,0,0) skewX(${(-10 * v).toFixed(2)}deg)`);
          E.odSmear.forEach((s, i) => {
            css(s, 'opacity', (v * (0.5 - i * 0.1)).toFixed(3));
            css(s, 'transform', `translate3d(${((i + 1) * 90 * v * (d < 0.22 ? 1 : -1)).toFixed(2)}px,0,0)`);
          });
          const sp = Math.exp(-d / 0.25) * 14 + 1.5;
          css(E.odA, 'transform', `translate3d(${(-sp).toFixed(2)}px,0,0)`);
          css(E.odN, 'transform', `translate3d(${sp.toFixed(2)}px,0,0)`);
          const ln = expoOut(lin(d, 0.05, 0.45));
          for (const l of E.odLines) css(l, 'transform', `scaleX(${ln.toFixed(4)})`);
          css(E.odSub, 'opacity', lin(d, 0.25, 0.4).toFixed(3));
        }
      }
      {
        const d = t - T.line;
        const on = d >= 0 && d < 1.75;
        show(E.final, on); show(E.finalSub, on);
        if (on) {
          for (const layer of E.final._layers) {
            layer._letters.forEach((s, i) => css(s, 'opacity', ignite(d - i * 0.035).toFixed(2)));
          }
          const fly = expoIn(lin(d, 1.3, 1.7));
          css(E.final, 'transform', `translate3d(0,${(-250 * fly).toFixed(2)}px,0) scale(${(1 - 0.75 * fly).toFixed(4)})`);
          css(E.final, 'opacity', (1 - lin(d, 1.55, 1.72)).toFixed(3));
          css(E.finalSub, 'opacity', (lin(d, 0.3, 0.5) * (1 - lin(d, 1.2, 1.35))).toFixed(3));
        }
      }
      {
        const d = t - T.finish;
        const onC = d >= -0.05 && d < 0.7;
        show(E.chequer, onC);
        if (onC) css(E.chequer, 'transform', `translate3d(${(LW + 600 - (LW + 1800) * lin(d, -0.05, 0.6)).toFixed(2)}px,0,0) skewX(-24deg)`);
        const onW = d >= 0.05 && t < 18.75;
        show(E.win, onW);
        if (onW) {
          const k = d - 0.05;
          const slam = k < 0.3 ? 1.6 - 0.6 * backOut(k / 0.3, 2.2) : 1;
          const mv = expoOut(lin(t, T.results, T.results + 0.5));
          const out = expoIn(lin(t, 18.35, 18.7));
          const x = -560 * mv - 300 * out, y = -60 * mv;
          css(E.win, 'transform', `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${(slam * (1 - 0.18 * mv)).toFixed(4)})`);
          css(E.win, 'opacity', (Math.min(1, k / 0.06) * (1 - out)).toFixed(3));
          css(E.winGlow, 'opacity', (0.45 + 0.55 * Math.exp(-k / 0.4)).toFixed(3));
          css(E.winBurst, 'opacity', (0.3 + 0.7 * Math.exp(-k / 0.5)).toFixed(3));
          css(E.winBurst, 'transform', `rotate(${(k * 14).toFixed(3)}deg) scale(${(0.6 + 0.4 * expoOut(k / 0.4)).toFixed(4)})`);
          css(E.winRing, 'visibility', k < 0.7 ? 'visible' : 'hidden');
          css(E.winRing, 'opacity', ((1 - lin(k, 0, 0.7)) * 0.8).toFixed(3));
          css(E.winRing, 'transform', `scale(${(0.2 + 1.6 * expoOut(k / 0.7)).toFixed(4)})`);
          css(E.winLbl, 'opacity', lin(t, T.results + 0.2, T.results + 0.45).toFixed(3));
          E.winStats.forEach((s, i) => {
            const a = expoOut(lin(t, T.results + 0.4 + i * 0.08, T.results + 0.7 + i * 0.08));
            css(s, 'opacity', a.toFixed(3));
            css(s, 'transform', `translate3d(${(-30 * (1 - a)).toFixed(2)}px,0,0)`);
          });
          css(E.winTeam, 'opacity', lin(t, T.results + 0.3, T.results + 0.55).toFixed(3));
        }
      }
      {
        const on = t >= T.results && t < 18.8;
        show(E.res, on); show(E.prompts, on);
        if (on) {
          const out = lin(t, 18.3, 18.65);
          css(E.res, 'opacity', (lin(t, T.results, T.results + 0.25) * (1 - out)).toFixed(3));
          E.resRows.forEach((r, i) => {
            const a = expoOut(lin(t, T.results + 0.25 + i * 0.06, T.results + 0.6 + i * 0.06));
            const o = expoIn(lin(t, 18.2 + i * 0.03, 18.5 + i * 0.03));
            css(r, 'opacity', (a * (1 - o)).toFixed(3));
            css(r, 'transform', `translate3d(${(80 * (1 - a) + 400 * o).toFixed(2)}px,${i * 50}px,0)`);
          });
          css(E.prompts, 'opacity', (lin(t, T.results + 0.9, T.results + 1.2) * (1 - out)).toFixed(3));
        }
      }
      {
        const on = t >= T.sting - 0.2 && t < T.sting + 0.2;
        show(E.sting, on);
        if (on) {
          const u = lin(t, T.sting - 0.2, T.sting + 0.2);
          css(E.sting, 'transform', `translate3d(${mixv(LW + 220, -LW - 1020, u).toFixed(2)}px,0,0) skewX(-18deg)`);
        }
      }
      {
        const on = t >= T.toGrid - 0.36 && t < T.toGrid + 0.36;
        show(E.wipe, on);
        if (on) {
          const u = lin(t, T.toGrid - 0.36, T.toGrid + 0.36);
          const x = mixv(LW + 220, -LW - 1020, u < 0.5 ? 0.5 * Math.pow(2 * u, 1.6) : 1 - 0.5 * Math.pow(2 - 2 * u, 1.6));
          css(E.wipe, 'transform', `translate3d(${x.toFixed(2)}px,0,0) skewX(-18deg)`);
        }
      }
    };
    return self;
  }

  const passes = [instance(), instance()];
  const ev = {
    build(overlayRoot, glowRoot) { passes[0].build(overlayRoot); passes[1].build(glowRoot); },
    update(t, T, LW, LH) { for (const p of passes) p.update(t, T, LW, LH); },
  };

  window.ODEvents = ev;
})();
