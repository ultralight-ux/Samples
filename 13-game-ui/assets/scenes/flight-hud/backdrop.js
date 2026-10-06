'use strict';
window.buildBackdrop = (ctx, sim) => {
  const { E, Track, PB, Part } = HUD;
  const { D, T, PPD } = sim;
  const rnd = ctx.random;
  const rad = Math.PI / 180;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const glow = (c0, c1, c2) => `border-radius:50%;background:radial-gradient(closest-side, ${c0}, ${c1} 45%, ${c2} 100%)`;
  const root = new Part(null);

  const rollP = root.part({ x: 960, y: 540, tf: sim.horizonTf });
  const pan = rollP.part({ tf: sim.heading.map((h) => [-(h - 247) * PPD, 0, 0, 1]) });
  pan.img(-1800, -950, 3600, 1900, ctx.params.grade ? 'assets/world-graded.jpg' : 'assets/world.jpg');
  pan.part({ op: sim.visorDark }).img(-1800, -950, 3600, 1900, 'assets/world-deep.jpg');
  if (ctx.params.svs) {
    const yh = -3 * PPD, altM = 120, pb = new PB(), pbFar = new PB();
    const hn = (xw, z) => 14 * Math.sin(xw / 310 + z / 900) + 9 * Math.sin(xw / 133 - z / 410 + 1.3) + 5 * Math.sin(xw / 61 + z / 170);
    for (let k = 0; k < 24; k++) {
      const z = 160 * Math.pow(1.19, k);
      const pts = [];
      for (let ang = -72; ang <= 72; ang += 0.8) {
        const xw = z * Math.tan(ang * rad);
        const y = yh + Math.atan2(altM - hn(xw, z), Math.hypot(xw, z)) / rad * PPD;
        pts.push([ang * PPD, y]);
      }
      (k < 11 ? pb : pbFar).poly(pts);
    }
    pan.part({ op: sim.powerOp(300, 2.4) }).path(pb, { s: 'rgba(143,208,230,0.08)', w: 1 }).path(pbFar, { s: 'rgba(143,208,230,0.045)', w: 1 });
  }

  const spr = root.part({ x: 960, y: 540 });
  const proj = (w, t, z) => sim.project(sim.relTo(w, t), t, z);
  const farFade = (d) => smooth((sim.P - 420 - d) / 320);
  for (let i = 0; i < 6; i++) {
    const w = sim.strip((sim.P * (i + 0.3 + 0.4 * rnd())) / 6, (rnd() < 0.5 ? -1 : 1) * (60 + 700 * rnd()));
    const tf = Track.sample((t) => { const p = proj(w, t, 40); return [p.x, p.y, 0, Math.min(5, 700 / p.d)]; }, D, 0.05);
    const op = Track.sample((t) => { const p = proj(w, t, 40); return +(farFade(p.d) * smooth((p.d - 160) / 220) * 0.9).toFixed(3); }, D, 0.05);
    spr.part({ tf, op }).div(-230, -40, 460, 80, glow('rgba(176,150,206,0.16)', 'rgba(150,130,190,0.07)', 'rgba(140,120,180,0)'));
  }
  for (let i = 0; i < 28; i++) {
    const w = sim.strip((sim.P * (i + rnd())) / 28, (rnd() < 0.5 ? -1 : 1) * (110 + 1300 * rnd()));
    const warm = rnd() < 0.82, size = 0.55 + 0.8 * rnd();
    const tf = Track.sample((t) => { const p = proj(w, t, 0); return [p.x, p.y, 0, Math.min(3.4, (620 / p.d) * size)]; }, D, 0.05);
    const op = Track.sample((t) => { const p = proj(w, t, 0); return +(farFade(p.d) * smooth((50 - Math.abs(p.relB)) / 6)).toFixed(3); }, D, 0.05);
    spr.part({ tf, op }).div(-14, -14, 28, 28, warm
      ? glow('rgba(255,222,160,0.95)', 'rgba(255,160,80,0.32)', 'rgba(255,140,60,0)')
      : glow('rgba(200,240,255,0.9)', 'rgba(120,200,255,0.3)', 'rgba(100,180,255,0)'));
  }

  sim.drones.forEach((dr, i) => {
    const op = new Track(0).set(dr.t0, 1).set(dr.t1, 0);
    const h = spr.part({ tf: sim.droneTfs[i], op });
    h.div(-46, -16, 92, 32, 'border-radius:50%;background:radial-gradient(closest-side, rgba(6,6,14,0.82), rgba(10,10,20,0.45) 55%, rgba(10,10,20,0) 100%)');
    h.div(-34, -15, 32, 30, glow('rgba(255,250,235,1)', 'rgba(255,170,90,0.45)', 'rgba(255,120,60,0)'));
    h.div(14, -12, 20, 20, glow('rgba(255,236,210,0.9)', 'rgba(255,150,80,0.3)', 'rgba(255,120,60,0)'));
    const blink = new Track(0);
    for (let b = dr.t0; b < dr.t1 - 0.2; b += 0.8) blink.set(b, 1).to(b, b + 0.3, 0, E.decay);
    h.part({ op: blink }).div(28, -18, 12, 12, glow('rgba(255,90,90,1)', 'rgba(255,60,60,0.4)', 'rgba(255,40,40,0)'));
  });

  sim.shots.forEach((ts, i) => {
    if (i % 2) return;
    const dr = ts < (T.KILL_A + T.CONTACT_B) / 2 ? sim.drones[0] : sim.drones[1];
    const [x1, y1] = sim.droneAt(dr, ts + 0.14);
    const x0 = 60 + (i % 4 ? -26 : 26), y0 = 640;
    const ang = Math.atan2(x1 - x0, -(y1 - y0)) / rad;
    const tf = new Track([x0, y0, ang, 1]).set(ts, [x0, y0, ang, 1]).to(ts, ts + 0.14, [x1, y1, ang, 0.28], E.lin);
    const op = new Track(0).set(ts, 1).set(ts + 0.14, 0);
    spr.part({ tf, op }).div(-2.5, 0, 5, 110, 'border-radius:3px;background:linear-gradient(180deg,#fffaf0 0,rgba(255,224,170,0.9) 10%,rgba(255,150,70,0) 100%)');
  });
  const mz = new Track(0);
  sim.shots.forEach((ts, i) => {
    const nx = sim.shots[i + 1];
    mz.set(ts, 0.6).to(ts, Math.min(ts + 0.08, (nx ?? D) - 0.004), 0.15, E.decay);
    if (!nx || nx - ts > 0.2) mz.to(mz.end.t, mz.end.t + 0.12, 0, E.soft);
  });
  spr.part({ op: mz }).div(-420, 430, 960, 300, glow('rgba(255,214,150,0.55)', 'rgba(255,150,70,0.18)', 'rgba(255,120,50,0)'));

  {
    const KA = T.KILL_A;
    const [kx, ky] = sim.droneAt(sim.drones[0], KA - 1e-3);
    for (const [dx, dy, r, d0] of [[0, 0, 150, 0], [-46, -20, 110, 0.12], [52, -34, 96, 0.2], [10, -70, 120, 0.3]]) {
      const smoke = spr.part({ x: kx + dx * 0.4, y: ky + dy * 0.4, tf: new Track([0, 0, 0, 0.4]).set(KA, [0, 0, 0, 0.4]).to(KA + d0, KA + 2.6, [dx * 0.6 + 10, dy - 50, 0, 1.7], E.soft),
        op: new Track(0).set(KA, 0).to(KA + 0.2 + d0, KA + 0.6 + d0, 0.6, E.soft).to(KA + 0.9 + d0, KA + 2.6, 0, E.soft) });
      smoke.div(-r, -r, 2 * r, 2 * r, 'border-radius:50%;background:radial-gradient(closest-side, rgba(24,18,26,0.7), rgba(30,22,32,0.3) 55%, rgba(30,22,32,0) 100%)');
    }
    for (const [dx, dy, r, d0, k] of [[0, 0, 120, 0, 1], [-38, 10, 80, 0.04, 0.85], [44, -14, 74, 0.07, 0.8], [8, -42, 66, 0.1, 0.75], [-20, 34, 58, 0.06, 0.7]]) {
      const fb = spr.part({ x: kx + dx, y: ky + dy, tf: new Track([0, 0, 0, 0.12]).set(KA, [0, 0, 0, 0.12]).to(KA + d0, KA + d0 + 0.55, [dx * 0.3, dy * 0.3 - 8, 0, 1.2], E.out),
        op: new Track(0).set(KA, k).to(KA + 0.2 + d0, KA + 1.2 + d0, 0, E.soft) });
      fb.div(-r, -r, 2 * r, 2 * r, 'border-radius:50%;background:radial-gradient(closest-side, rgba(255,214,140,0.95), rgba(255,140,60,0.6) 40%, rgba(255,80,30,0.2) 70%, rgba(255,70,30,0) 100%)');
    }
    const core = spr.part({ x: kx, y: ky, tf: new Track([0, 0, 0, 0.3]).set(KA, [0, 0, 0, 0.3]).to(KA, KA + 0.25, [0, -4, 0, 1], E.out),
      op: new Track(0).set(KA, 1).to(KA + 0.08, KA + 0.6, 0, E.soft) });
    core.div(-60, -60, 120, 120, 'border-radius:50%;background:radial-gradient(closest-side, #fffdf4, rgba(255,240,200,0.8) 35%, rgba(255,200,120,0) 100%)');
  }

  [0, 0.09, 0.18].forEach((dt, k) => {
    const ts = T.HIT1 - 0.34 + dt;
    const x0 = -1060, y0 = 380 - k * 70, x1 = -160 + k * 40, y1 = -20 - k * 16;
    const ang = Math.atan2(x1 - x0, -(y1 - y0)) / rad;
    const tf = new Track([x0, y0, ang, 1.6]).set(ts, [x0, y0, ang, 1.6]).to(ts, ts + 0.22, [x1, y1, ang, 0.3], E.lin);
    spr.part({ tf, op: new Track(0).set(ts, 1).set(ts + 0.22, 0) })
      .div(-3, 0, 6, 140, 'border-radius:3px;background:linear-gradient(180deg,#ffe8e0 0,rgba(255,110,90,0.9) 10%,rgba(255,60,60,0) 100%)');
  });
  [[T.HIT2 - 0.62, 560, -230, 0.8], [T.HIT2 - 0.3, 420, -120, 1.1], [T.HIT2 - 0.02, 300, -40, 1.5]].forEach(([ts, x, y, k]) => {
    const p = spr.part({ x, y, tf: new Track([0, 0, 0, 0.2 * k]).set(ts, [0, 0, 0, 0.2 * k]).to(ts, ts + 0.5, [0, -8, 0, k], E.out),
      op: new Track(0).set(ts, 1).to(ts + 0.15, ts + 1.4, 0, E.soft) });
    p.div(-90, -90, 180, 180, 'border-radius:50%;background:radial-gradient(closest-side, rgba(255,236,200,0.95), rgba(255,130,60,0.6) 30%, rgba(26,20,26,0.55) 60%, rgba(26,20,26,0) 100%)');
  });

  const full = (css, op) => root.part({ op }).div(-160, -120, 2240, 1320, css);
  full('background:rgba(255,190,120,1)', new Track(0).set(T.KILL_A, 0.12).to(T.KILL_A, T.KILL_A + 0.4, 0, E.soft));
  full('background:radial-gradient(ellipse 70% 90% at 0% 100%, rgba(255,150,60,0.9), rgba(255,120,60,0) 70%)',
    new Track(0).set(T.HIT1, 0.75).to(T.HIT1, T.HIT1 + 0.7, 0, E.soft));
  full('background:radial-gradient(ellipse 70% 90% at 100% 20%, rgba(255,70,60,0.95), rgba(255,60,60,0) 70%)',
    new Track(0).set(T.HIT2, 0.85).to(T.HIT2, T.HIT2 + 0.8, 0, E.soft));
  full('background:rgba(255,60,50,1)', new Track(0).set(T.HIT2, 0.16).to(T.HIT2, T.HIT2 + 0.5, 0, E.soft));
  full('background:#020309', sim.visorDark.map((v) => +(v * 0.62).toFixed(3)));
  full('background:radial-gradient(ellipse 75% 80% at 50% 48%, rgba(0,0,0,0) 55%, rgba(1,2,6,0.62) 100%)', null);
  return { root };
};
