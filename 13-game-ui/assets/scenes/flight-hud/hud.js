'use strict';
window.buildGameHUD = (ctx) => {
  const { E, Track, PB, Part, polar } = HUD;
  const D = 20;
  const rnd = ctx.random;

  const IC = (a) => `rgba(143,208,230,${+Math.min(1, a * 1.2).toFixed(3)})`;
  const SG = (a) => `rgba(255,106,61,${a})`;
  const IK = (a) => `rgba(238,247,251,${a})`;
  const INK = '#eef7fb', SIGNAL = '#ff6a3d', SIGT = '#ff8a5e';
  const S = {
    micro: { s: 14, w: 500, wd: 118, ls: 0.2, c: IC(0.85) },
    label: { s: 15, w: 600, wd: 118, ls: 0.22, c: IC(0.95) },
    labelInk: { s: 15, w: 600, wd: 118, ls: 0.22, c: INK },
    row: { s: 16, w: 500, wd: 115, ls: 0.12, c: INK },
    value: { s: 18, w: 400, wd: 112, ls: 0.04, c: INK, tnum: true },
    tick: { s: 14, w: 500, wd: 112, ls: 0.02, c: IC(0.95), tnum: true },
    log: { s: 14, w: 500, wd: 112, ls: 0.12, c: IC(0.78) },
    tape: { s: 22, w: 400, wd: 112, ls: 0.02, c: INK, tnum: true },
    hdg: { s: 24, w: 500, wd: 112, ls: 0.02, c: INK, tnum: true },
    big: { s: 64, w: 200, wd: 112, ls: 0, c: INK, tnum: true },
    ammo: { s: 96, w: 200, wd: 112, ls: 0, c: INK, tnum: true },
    rsv: { s: 30, w: 300, wd: 112, ls: 0, c: IC(0.9), tnum: true },
    dmg: { s: 18, w: 600, wd: 112, ls: 0.04, c: IK(0.95), tnum: true },
    crit: { s: 24, w: 600, wd: 112, ls: 0.04, c: INK, tnum: true },
    alert: { s: 26, w: 600, wd: 118, ls: 0.3, c: INK },
    shoot: { s: 17, w: 600, wd: 118, ls: 0.46, c: SIGT },
  };
  const TNUM = { 200: 0.669, 300: 0.672, 400: 0.676 };
  const stroke = (c, w = 1, o = {}) => ({ s: c, w, ...o });
  const fill = (c, o = {}) => ({ f: c, ...o });
  const pad = (v, n) => String(v).padStart(n, '0');
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const wrap180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const rad = Math.PI / 180;
  const fxOn = !!ctx.params.fx;
  const GLOW = fxOn ? [{ blur: 10, op: 0.8 }, { blur: 3, op: 0.9 }] : null;
  const HOT = fxOn ? [{ blur: 16, op: 1 }, { blur: 6, op: 1 }, { blur: 2, op: 1 }] : null;

  const T = {
    PIP: 0.12,
    WAVE0: 0.42, WAVE_T: 1.3,
    DOWN0: 17.75, DOWN_T: 1.0,
    CONTACT_A: 4.0, ARM: 4.4, TRACK_A: 4.6, LOCK_A: 6.2, KILL_A: 8.0,
    HIT1: 9.4,
    CONTACT_B: 10.0, TRACK_B: 10.3, LOCK_B: 10.9,
    EMPTY: 12.5, HIT2: 13.0,
    RELOAD0: 12.7, RELOAD1: 14.0, ESCAPE: 14.6, LOST_B: 15.4, PICKUP: 15.2,
    FAULT: 15.9,
  };
  const OUT = new Track(0).to(0, 1, 1, E.out), IN = new Track(0).to(0, 1, 1, E.in), IO = new Track(0).to(0, 1, 1, E.inOut);
  const outE = (p) => OUT.at(p), inE = (p) => IN.at(p), ioE = (p) => IO.at(p);
  const WAVE_R = 1150;
  const WAVE_OUT = new Track(0).to(0, 1, 1, E.soft), WAVE_IN = new Track(0).to(0, 1, 1, [0.32, 0, 0.67, 0]);
  const solve = (f, y) => { let lo = 0, hi = 1; for (let i = 0; i < 32; i++) { const m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; } return hi; };
  const waveOn = (d) => T.WAVE0 + T.WAVE_T * solve((p) => WAVE_OUT.at(p), Math.min(1, d / WAVE_R));
  const waveOff = (d) => T.DOWN0 + T.DOWN_T * solve((p) => WAVE_IN.at(p), 1 - Math.min(1, d / WAVE_R));
  function powerOp(d, on = waveOn(d), off = waveOff(d)) {
    return new Track(0).set(on, 1).set(on + 0.04, 0.25).set(on + 0.075, 1)
      .set(off, 0.3).set(off + 0.05, 0.9).to(off + 0.07, off + 0.22, 0, E.in);
  }
  function powerWipe(d, on = waveOn(d), off = waveOff(d)) {
    return new Track(0).to(on, on + 0.45, 1, E.out).to(off + 0.02, off + 0.26, 0, E.in);
  }
  const widget = (parent, d, o = {}) => parent.part({
    ...o, op: powerOp(d, o.on, o.off), wipe: o.box ? powerWipe(d, o.on, o.off) : null,
  });

  const PPD = 25.6;
  const heading = new Track(247)
    .to(2.6, 4.2, 258, E.inOut)
    .to(8.6, 10.4, 236, E.inOut)
    .to(14.6, 16.8, 247, E.inOut);
  const hdgRate = (t) => (heading.at(t + 0.01) - heading.at(t - 0.01)) / 0.02;
  const roll = (t) => 7 * Math.tanh(hdgRate(t) / 12);
  const pitch = (t) => -3 + 0.45 * Math.sin((2 * Math.PI * t) / 10);
  const speed = (t) => 112 + 5 * Math.sin((2 * Math.PI * t) / 20 + 0.8);
  const alt = (t) => 120 + 9 * Math.sin((2 * Math.PI * t) / 10 + 0.4);

  const NI = 4000, dtI = D / NI, track = new Float64Array((NI + 1) * 2);
  for (let i = 0, x = 0, y = 0; i < NI; i++) {
    const tm = (i + 0.5) * dtI, h = heading.at(tm) * rad, v = speed(tm);
    x += v * Math.sin(h) * dtI; y += v * Math.cos(h) * dtI;
    track[(i + 1) * 2] = x; track[(i + 1) * 2 + 1] = y;
  }
  const posAt = (t) => {
    const f = Math.min(NI, Math.max(0, t / dtI)), i = Math.min(NI - 1, Math.floor(f)), p = f - i;
    return [track[i * 2] + (track[i * 2 + 2] - track[i * 2]) * p, track[i * 2 + 1] + (track[i * 2 + 3] - track[i * 2 + 1]) * p];
  };
  const [DX, DY] = posAt(D), P = Math.hypot(DX, DY);
  const ax = DX / P, ay = DY / P, rx = ay, ry = -ax;
  const strip = (u, v) => [u * ax + v * rx, u * ay + v * ry];
  const relTo = (w, t) => {
    const [cx, cy] = posAt(t);
    let x = w[0] - cx, y = w[1] - cy;
    const k = Math.floor((x * ax + y * ay + 300) / P);
    return [x - k * P * ax, y - k * P * ay];
  };
  const rollRot = (x, y, t) => {
    const r = -roll(t) * rad, c = Math.cos(r), s = Math.sin(r);
    return [x * c - y * s, x * s + y * c];
  };
  const project = (rel, t, z = 0) => {
    const d = Math.hypot(rel[0], rel[1]);
    const relB = wrap180(Math.atan2(rel[0], rel[1]) / rad - heading.at(t));
    const dep = Math.atan2(alt(t) - z, d) / rad;
    const [x, y] = rollRot(relB * PPD, (pitch(t) + dep) * PPD, t);
    return { x, y, relB, d };
  };
  const horizonTf = Track.sample((t) => {
    const [x, y] = rollRot(0, (pitch(t) + 3) * PPD, t);
    return [x, y, -roll(t), 1];
  }, D, 0.1);

  const burst = (t0, n, dt) => Array.from({ length: n }, (_, i) => +(t0 + i * dt).toFixed(3));
  const burstA = burst(6.5, 14, 0.1), burstB = burst(11.0, 26, 0.06);
  const shots = [...burstA, ...burstB];
  const MAG = 40;

  const weaveA = (t) => [130 + 70 * Math.sin((2 * Math.PI * t) / 5.2), -40 + 30 * Math.sin((2 * Math.PI * t) / 3.3 + 0.7)];
  const weaveB = (t) => [-150 + 70 * Math.sin((2 * Math.PI * (t - 10)) / 4.6), -30 + 26 * Math.sin((2 * Math.PI * (t - 10)) / 2.9)];
  const blend = (a, b, p) => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
  const drones = [
    { name: 'SKIFF-07', t0: T.CONTACT_A, t1: T.KILL_A, track: T.TRACK_A, lock: T.LOCK_A, release: T.KILL_A,
      steps: [[4.6, 64], [5.0, 56], [5.3, 49], [5.52, 43], [5.68, 38], [5.8, 34], [5.9, 31], [5.98, 29], [6.05, 27], [6.11, 25], [6.2, 22]],
      at: (t) => blend([1180, -150], weaveA(t), ioE(clamp01((t - T.CONTACT_A) / 1.4))),
      dist: (t) => 2300 - 410 * (t - T.CONTACT_A) },
    { name: 'SKIFF-12', t0: T.CONTACT_B, t1: T.LOST_B, track: T.TRACK_B, lock: T.LOCK_B, release: T.ESCAPE,
      steps: [[10.3, 56], [10.5, 44], [10.65, 36], [10.75, 30], [10.83, 26], [10.9, 22]],
      at: (t) => blend(blend([-1180, -170], weaveB(t), ioE(clamp01((t - T.CONTACT_B) / 0.9))), [-1260, -300], inE(clamp01((t - T.ESCAPE) / 0.8))),
      dist: (t) => Math.max(1150, 1900 - 600 * (t - T.CONTACT_B)) + 650 * Math.max(0, t - 13.6) },
  ];
  const droneAt = (dr, t) => { const [x, y] = dr.at(t); return rollRot(x, y, t); };
  const droneOf = (t) => (t < (T.KILL_A + T.CONTACT_B) / 2 ? drones[0] : drones[1]);
  const locked = (dr, t) => t >= dr.lock && t < dr.release;
  const tracking = (dr, t) => t >= dr.track && t < dr.release;
  const inRange = (dr, t) => locked(dr, t) && dr.dist(t) < 1400;
  const shootWin = drones.map((dr) => {
    let a = null, b = null;
    for (let t = dr.lock; t < dr.release; t += 0.01) { if (inRange(dr, t)) { if (a === null) a = +t.toFixed(2); b = +t.toFixed(2); } }
    return [a, b + 0.01];
  });

  const BOOT_V0 = 1.5, BOOT_V1 = 2.2, DOWN0 = T.DOWN0, DOWN1 = T.DOWN0 + 0.55;
  const shield = new Track(0).to(BOOT_V0, BOOT_V1, 86, E.out).to(T.HIT1, T.HIT1 + 0.45, 38, E.out);
  for (let i = 0, v = 38; i < 20; i++) { v += 2; shield.to(11.0 + i * 0.25, 11.0 + i * 0.25 + 0.14, v, E.back); }
  shield.to(DOWN0, DOWN1, 0, E.in);
  const shieldGhost = new Track(0).to(BOOT_V0, BOOT_V1, 86, E.out).to(T.HIT1 + 0.5, T.HIT1 + 0.95, 38, E.soft)
    .to(11.0, 15.9, 78, E.lin).to(DOWN0, DOWN1, 0, E.in);
  const hull = new Track(0).to(BOOT_V0, BOOT_V1, 72, E.out).to(T.HIT2, T.HIT2 + 0.3, 41, E.out);
  for (let i = 0, v = 41; i < 14; i++) { v += 1; hull.to(14.2 + i * 0.15, 14.2 + i * 0.15 + 0.1, v, E.back); }
  hull.to(DOWN0, DOWN1, 0, E.in);
  const hullGhost = new Track(0).to(BOOT_V0, BOOT_V1, 72, E.out).to(T.HIT2 + 0.5, T.HIT2 + 0.95, 41, E.soft)
    .to(14.2, 16.3, 55, E.lin).to(DOWN0, DOWN1, 0, E.in);
  const heat = new Track(8);
  {
    let h = 8, last = 0;
    for (const ts of shots) {
      const cooled = Math.max(8, h - 12 * (ts - last));
      if (cooled !== h) heat.to(last + 0.05, ts, cooled, E.lin);
      h = cooled + 2.2;
      heat.to(ts, ts + 0.05, h, E.back);
      last = ts;
    }
    heat.to(last + 0.05, Math.min(D, last + 0.05 + (h - 8) / 12), 8, E.lin);
  }
  const recoil = new Track(1);
  shots.forEach((ts, i) => {
    recoil.to(ts, ts + 0.025, 1.24, E.out);
    const next = shots[i + 1];
    if (next && next - ts < 0.15) recoil.to(ts + 0.025, next - 0.004, 1.1, E.soft);
    else recoil.to(ts + 0.025, ts + 0.35, 1, E.soft);
  });
  const ammoEvents = [[1.6, 2.1, MAG, E.out], ...shots.map((ts, i) => [ts, ts + 0.05, MAG - 1 - i, E.back]),
    [T.RELOAD1 - 0.5, T.RELOAD1, MAG, E.out], [DOWN0 + 0.1, DOWN1 + 0.1, 0, E.in]];
  const magVal = new Track(0).to(1.6, 2.1, 1, E.out);
  shots.forEach((ts, i) => magVal.set(ts, (MAG - 1 - i) / MAG));
  magVal.to(T.RELOAD1 - 0.5, T.RELOAD1, 1, E.out).to(DOWN0 + 0.1, DOWN1 + 0.1, 0, E.in);
  const rsvEvents = [[1.6, 2.1, 480, E.out], [T.RELOAD1 - 0.5, T.RELOAD1 - 0.1, 440, E.out],
    [T.PICKUP + 0.1, T.PICKUP + 0.7, 500, E.out], [DOWN0 + 0.1, DOWN1 + 0.1, 0, E.in]];

  function wheelTracks(v0, events, digits, stagger = 0) {
    const dig = (v, k) => Math.floor(v / 10 ** k) % 10;
    const tr = Array.from({ length: digits }, (_, k) => new Track(dig(v0, k)));
    let v = v0;
    for (const [t0, t1, nv, e] of events) {
      for (let k = 0; k < digits; k++) {
        const a = dig(v, k), b = dig(nv, k);
        if (a === b) continue;
        const s0 = t0 + k * stagger, s1 = t1 + k * stagger;
        if (nv < v) {
          if (b > a) tr[k].set(s0, a + 10);
          tr[k].to(s0, s1, b, e);
        } else if (b < a) tr[k].to(s0, s1, b + 10, e).set(s1, b);
        else tr[k].to(s0, s1, b, e);
      }
      v = nv;
    }
    return tr;
  }

  function pulse(t0, t1, lo = 0.35, beat = 0.5) {
    const tr = new Track(0);
    for (let b = t0; b < t1 - 1e-6; b += beat) tr.set(b, 1).to(b, b + beat * 0.9, lo, E.decay);
    const te = Math.max(t1, tr.end.t);
    return tr.to(te, te + 0.2, 0, E.soft);
  }
  const spin = (deg) => new Track([0, 0, 0, 1]).to(0, D, [0, 0, deg, 1], E.lin);
  const flickOn = (t0, t1, fade = 0.3) => new Track(0).set(t0, 1).set(t0 + 0.05, 0.25).set(t0 + 0.1, 1).to(t1, t1 + fade, 0, E.soft);

  const W = ctx.width, H = ctx.height;
  const fit = Math.min(W / 1920, H / 1080);
  const s = fit * ctx.params.scale;
  const LW = Math.max(W / s, 1920), LH = Math.max(H / s, 1080);
  const ox = (W - LW * s) / 2, oy = (H - LH * s) / 2;
  const root = new Part(null);
  const anchor = (fx, fy) => root.part({ x: fx * (LW - 1920), y: fy * (LH - 1080) });
  root.part({ op: powerOp(700) }).div(0, 0, LW, LH,
    'background:radial-gradient(circle, rgba(143,208,230,0.22) 0.9px, rgba(143,208,230,0) 1.5px) 0 0 / 32px 32px;' +
    '-webkit-mask-image:radial-gradient(ellipse 60% 62% at 50% 50%, rgba(0,0,0,0.25) 40%, #000 100%);' +
    'mask-image:radial-gradient(ellipse 60% 62% at 50% 50%, rgba(0,0,0,0.25) 40%, #000 100%)');
  const tl = anchor(0, 0), tc = anchor(0.5, 0), tr = anchor(1, 0);
  const mc = anchor(0.5, 0.5);
  const bl = anchor(0, 1), bc = anchor(0.5, 1), br = anchor(1, 1);
  const C = mc.part({ x: 960, y: 540 });
  const world = new Part(null);
  const CW = world.part({ x: 960, y: 540 });

  const KINDS = [
    ['UPLINK B', 'obj'], ['LZ ECHO', 'lz'], ['RELAY 4', 'relay'], ['CACHE 2', 'cache'],
    ['MAST K-9', 'relay'], ['BEACON 7', 'way'], ['DEPOT 5', 'cache'], ['SPIRE 11', 'relay'],
  ];
  const NM = Math.max(0, Math.round(ctx.params.markers));
  const markers = [];
  for (let i = 0; i < NM; i++) {
    const kind = KINDS[i % KINDS.length];
    const name = i < KINDS.length ? kind[0] : `WAYPOINT ${pad(i + 3, 2)}`;
    const u = (P * (i + 0.15 + 0.7 * rnd())) / Math.max(1, NM);
    const side = i % 2 ? 1 : -1;
    const v = side * (90 + 520 * rnd());
    markers.push({ name, type: i < KINDS.length ? kind[1] : 'way', uv: [u, v], w: strip(u, v) });
  }
  markers[0] && (markers[0].uv[1] = 60, markers[0].w = strip(markers[0].uv[0], 60));
  const uplink = markers[0];

  function markerIcon(p, type, col, sz = 7) {
    const pb = new PB();
    if (type === 'obj') pb.poly([[0, -sz], [sz, 0], [0, sz], [-sz, 0]], true).dot(0, 0, 1.4);
    else if (type === 'lz') pb.rect(-sz * 0.8, -sz * 0.8, sz * 1.6, sz * 1.6).dot(0, 0, 1.2);
    else if (type === 'relay') pb.poly([[0, -sz], [sz * 0.9, sz * 0.65], [-sz * 0.9, sz * 0.65]], true);
    else if (type === 'cache') pb.rect(-sz * 0.6, -sz * 0.6, sz * 1.2, sz * 1.2);
    else pb.poly([[-sz * 0.8, -sz * 0.4], [0, sz * 0.5], [sz * 0.8, -sz * 0.4]]);
    p.path(pb, { s: col, w: 1.2, f: null, join: 'miter' });
  }

  const bgS = Math.max(W / 1920, H / 1080);
  const toWorld = (fx, fy, x, y) => [(ox + s * (fx * (LW - 1920) + x) - W / 2) / bgS, (oy + s * (fy * (LH - 1080) + y) - H / 2) / bgS];
  const ZONES = [
    [0.5, 0.5, 515, 300, 712, 785], [0.5, 0.5, 1208, 300, 1405, 785],
    [0.5, 0.5, 660, 40, 1260, 135], [0.5, 0, 560, 135, 1360, 225],
    [1, 0, 1520, 20, 1900, 420], [0, 0, 50, 55, 430, 310],
    [0, 1, 40, 720, 340, 1000], [1, 1, 1500, 790, 1880, 1010],
    [0.5, 1, 720, 975, 1200, 1050],
  ].map(([fx, fy, x0, y0, x1, y1]) => [...toWorld(fx, fy, x0, y0), ...toWorld(fx, fy, x1, y1)]);
  const KA = T.KILL_A, killAt = droneAt(drones[0], KA - 1e-3);
  const timedZones = (t) => {
    const out = [];
    for (const dr of drones) if (t >= dr.t0 && t < dr.t1) { const [x, y] = droneAt(dr, t); out.push([x - 80, y - 112, x + 80, y + 124]); }
    if (t >= KA && t < KA + 1.5) out.push([killAt[0] - 110, killAt[1] - 70, killAt[0] + 110, killAt[1] + 146]);
    return out;
  };
  const hitsZone = (x0, y0, x1, y1, t) => ZONES.concat(timedZones(t)).some((z) => x0 < z[2] && x1 > z[0] && y0 < z[3] && y1 > z[1]);
  const FX = (W / 2 - 44) / bgS, FY = (H / 2 - 44) / bgS;
  const lag = (vals, dt, tau) => {
    const k = 1 - Math.exp(-dt / tau), out = vals.slice();
    let v = vals[vals.length - 1];
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < vals.length; i++) { v += (vals[i] - v) * k; out[i] = v; }
    return out;
  };
  const DT = 0.05, NS = Math.round(D / DT);
  const fromSamples = (arr, fmt) => {
    const tr = new Track(fmt(arr[0]));
    for (let i = 1; i <= NS; i++) tr.k.push({ t: i * DT, v: fmt(arr[i % NS]), e: 'linear' });
    return tr;
  };

  const markerPower = world.part({ op: powerOp(400) });
  const MW = markerPower.part({ x: 960, y: 540 });
  const nameSt = { ...S.labelInk, ls: 0.18 };
  for (const m of markers) {
    let tIn = -1;
    const sample = (t) => project(relTo(m.w, t), t);
    for (let t = 0.05; t < D; t += 0.05) {
      if (sample(t).d < 1560 && sample(t - 0.05).d >= 1560) { tIn = t; break; }
    }
    const LWID = Math.max(m.name.length * 12.6, 7 * 12) + 10;
    const xs = [], ys = [], base = [], icon = [], fr = [], fl = [], aL = [], aR = [];
    for (let i = 0; i < NS; i++) {
      const q = sample(i * DT);
      const x = Math.max(-FX, Math.min(FX, q.x)), y = Math.max(-FY, Math.min(FY, q.y));
      const dc = smooth((Math.hypot(x, y) - 70) / 80);
      base.push(+(smooth((1650 - q.d) / 140) * smooth((q.d - 270) / 70) * smooth((56 - Math.abs(q.relB)) / 6) * dc).toFixed(3));
      xs.push(x); ys.push(y);
      const t = i * DT;
      icon.push(hitsZone(x - 9, y - 9, x + 9, y + 9, t) ? 0.3 : 1);
      fr.push(x + 8 + LWID < FX && !hitsZone(x + 4, y - 52, x + 8 + LWID, y - 8, t));
      fl.push(x - 8 - LWID > -FX && !hitsZone(x - 8 - LWID, y - 52, x - 4, y - 8, t));
      aR.push(clamp01((q.x - FX) / 16)); aL.push(clamp01((-FX - q.x) / 16));
    }
    const tR = new Array(NS).fill(0), tL = new Array(NS).fill(0);
    let side = 1;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < NS; i++) {
      const free = side > 0 ? fr[i] : fl[i], other = side > 0 ? fl[i] : fr[i];
      if (!free && other) side = -side;
      const ok = side > 0 ? fr[i] : fl[i];
      tR[i] = ok && side > 0 ? 1 : 0; tL[i] = ok && side < 0 ? 1 : 0;
    }
    const pos = fromSamples(xs.map((x, i) => [x, ys[i]]), ([x, y]) => [+x.toFixed(2), +y.toFixed(2), 0, 1]);
    const mp = MW.part({ tf: pos, op: fromSamples(base, (v) => v) });
    const sm = (a) => fromSamples(lag(a, DT, 0.12), (v) => +v.toFixed(3));
    const lR0 = lag(tR, DT, 0.08), lL0 = lag(tL, DT, 0.08);
    const sideOp = {
      1: lag(tR.map((v, i) => (v && lL0[i] < 0.05 ? 1 : 0)), DT, 0.08),
      [-1]: lag(tL.map((v, i) => (v && lR0[i] < 0.05 ? 1 : 0)), DT, 0.08),
    };
    const pop = new Track([0, 0, 0, 1]);
    if (tIn > 0 && tIn < D - 0.6) pop.set(tIn, [0, 0, 0, 2.2]).to(tIn, tIn + 0.45, [0, 0, 0, 1], E.out);
    markerIcon(mp.part({ op: sm(icon) }).part({ tf: pop }), m.type, m === uplink ? INK : IC(0.95));
    const dist = (t) => (sample(t).d / 1000).toFixed(2) + ' KM';
    for (const sd of [1, -1]) {
      const side = sd, lp = mp.part({ op: fromSamples(sideOp[sd], (v) => +v.toFixed(3)) });
      lp.path(new PB().line(0, -10, 0, -30).dot(0, -30, 1.3), { s: IC(0.5), w: 1, f: IC(0.8) });
      lp.text(side * 8, -36, m.name, nameSt, side > 0 ? 'l' : 'r');
      lp.text(side * 8, -18, dist, S.micro, side > 0 ? 'l' : 'r');
    }
    for (const [side, vals] of [[1, aR], [-1, aL]]) {
      mp.part({ op: fromSamples(vals, (v) => +v.toFixed(3)) })
        .path(new PB().poly([[side * 13, -6], [side * 19, 0], [side * 13, 6]]), stroke(INK, 1.5));
    }
    m.dist = (t) => sample(t).d;
  }
  {
    const lw = world.part({ op: powerOp(290, 2.3) }).part({ x: 960, y: 540 });
    const win = lw.part({ clip: { x: -298, y: -298, w: 596, h: 596, circle: true }, mask: 'r', maskFrac: 0.1 });
    const lad = win.part({ tf: horizonTf });
    const y0 = -3 * PPD;
    lad.path(new PB().line(-300, y0, -150, y0).line(150, y0, 300, y0), stroke(IC(0.5), 1));
    lad.path(new PB().line(-150, y0, -96, y0).line(96, y0, 150, y0), stroke(INK, 2));
    lad.path(new PB().dot(-158, y0, 1.6).dot(158, y0, 1.6).dot(-88, y0, 1.6).dot(88, y0, 1.6), fill(INK));
    const pos = new PB(), neg = new PB(), dots = new PB();
    for (const th of [-15, -10, -5, 5, 10, 15]) {
      const y = y0 - th * PPD, pb = th > 0 ? pos : neg;
      pb.line(-150, y, -74, y).line(74, y, 150, y);
      dots.dot(-150, y, 1.3).dot(150, y, 1.3);
      const lab = pad(Math.abs(th), 2);
      const ls = { ...S.tick, c: IK(0.92) };
      lad.stext(-162, y + 5, lab, ls, 'r').stext(162, y + 5, lab, ls, 'l');
    }
    lad.path(pos, stroke(IC(0.45), 1)).path(neg, stroke(IC(0.45), 1, { dash: [5, 5] })).path(dots, fill(IC(0.8)));
  }

  {
    const R = 304;
    const g = widget(C, R);
    g.path(new PB().dots(0, 0, R, -40, 40, 2, 1.1, (a) => Math.abs(a) < 7).dots(0, 0, R, 140, 220, 2, 1.1, (a) => Math.abs(a - 180) < 7), fill(IC(0.6)));
    g.path(new PB().arc(0, 0, R, -6, 6).arc(0, 0, R, 174, 186), stroke(INK, 2));
    g.path(new PB().arc(0, 0, R + 10, -46, -30).arc(0, 0, R + 10, 30, 46).arc(0, 0, R + 10, 134, 150).arc(0, 0, R + 10, 210, 226), stroke(IC(0.4), 1));
    const warn = C.part({ box: [-R - 20, -R - 20, 2 * R + 40, 2 * R + 40], fx: GLOW });
    for (const op of [pulse(T.HIT2, T.HIT2 + 1.6, 0.25), pulse(T.FAULT, T.DOWN0 - 0.05, 0.2, 0.25)]) {
      const w = warn.part({ op });
      w.path(new PB().dots(0, 0, R, -40, 40, 2, 1.4, (a) => Math.abs(a) < 7).dots(0, 0, R, 140, 220, 2, 1.4, (a) => Math.abs(a - 180) < 7), fill(SIGNAL));
      w.path(new PB().arc(0, 0, R, -6, 6).arc(0, 0, R, 174, 186), stroke(SIGNAL, 2.5));
    }
  }

  const RANGE_FULL = 2400, RG = 44, GS_OFF = waveOff(RG);
  {
    const g = C.part({});
    const pipOp = new Track(0).set(T.PIP, 1).set(T.PIP + 0.1, 0.2).set(T.PIP + 0.2, 1).set(T.PIP + 0.3, 0.3).set(T.PIP + 0.38, 1)
      .set(GS_OFF + 0.5, 0.2).set(GS_OFF + 0.6, 1).to(GS_OFF + 0.9, GS_OFF + 1.1, 0, E.in);
    const ringDraw = new Track(0).to(T.WAVE0 - 0.1, T.WAVE0 + 0.45, 1, E.out).to(GS_OFF, GS_OFF + 0.45, 0, E.in);
    const ringOp = new Track(0).set(T.WAVE0 - 0.1, 1).set(GS_OFF + 0.5, 0);
    const gs = g.part({ op: ringOp });
    const L = 2 * Math.PI;
    const inner = gs.part({ tf: recoil.map((k) => [0, 0, 0, k]), op: new Track(0).set(waveOn(22), 1).set(GS_OFF + 0.1, 0) });
    inner.path(new PB().dots(0, 0, 20, 0, 359, 15, 1.1, (a) => a % 90 === 0), fill(IC(0.85)));
    inner.path(new PB().ticks(0, 0, 16, 24, 0, 270, 90), stroke(INK, 1.5));
    gs.part({ val: ringDraw }).path(new PB().arc(0, 0, RG, 0, 360), stroke(IC(0.85), 1, { prog: RG * L }));
    const ticks = gs.part({ op: new Track(0).set(waveOn(RG + 8), 1).set(GS_OFF + 0.2, 0) });
    ticks.path(new PB().dots(0, 0, RG + 6, 30, 330, 30, 1.1, (a) => a % 90 === 0), fill(IC(0.7)));
    const tabs = gs.part({ tf: Track.sample((t) => [0, 0, -roll(t), 1], D, 0.1) });
    tabs.path(new PB().line(-RG - 8, 0, -RG - 30, 0).line(RG + 8, 0, RG + 30, 0), stroke(INK, 2));
    tabs.path(new PB().dot(-RG - 36, 0, 1.5).dot(RG + 36, 0, 1.5), fill(IC(0.9)));

    const hot = g.part({ box: [-60, -60, 120, 120], fx: HOT });
    hot.part({ op: pipOp }).path(new PB().dot(0, 0, 2.2), fill(INK));
    const rangeVal = Track.sample((t) => {
      const dr = drones.find((d) => tracking(d, t));
      return dr ? +(clamp01(dr.dist(t) / RANGE_FULL) * outE(clamp01((t - dr.track) / 0.4))).toFixed(4) : 0;
    }, D, 0.05);
    const barOp = new Track(0);
    drones.forEach((dr) => barOp.set(dr.track, 1).to(dr.release, dr.release + 0.25, 0, E.soft));
    hot.part({ op: barOp, val: rangeVal }).path(new PB().arc(0, 0, RG - 5, 0, 360), stroke(SIGNAL, 2.5, { prog: (RG - 5) * L }));
    const notchOp = new Track(0).set(T.ARM, 1).set(T.ARM + 0.06, 0.2).set(T.ARM + 0.12, 1).to(GS_OFF, GS_OFF + 0.2, 0, E.in);
    const [n0x, n0y] = polar(0, 0, RG + 2, 210), [n1x, n1y] = polar(0, 0, RG + 11, 210);
    hot.part({ op: notchOp }).path(new PB().line(n0x, n0y, n1x, n1y), stroke(SIGNAL, 2.5));
    const closed = new Track(0);
    shootWin.forEach(([a, b]) => closed.set(a, 1).set(a + 0.05, 0.3).set(a + 0.1, 1).to(b, b + 0.3, 0, E.soft));
    hot.part({ op: closed }).path(new PB().circle(0, 0, RG), stroke(INK, 2));
    const hits = new Track(0);
    const hitTimes = [];
    C.hitmarker = (t) => hitTimes.push(t);
    C.finishHits = () => {
      const ts = [...new Set(hitTimes)].sort((a, b) => a - b);
      ts.forEach((t, i) => { const nx = ts[i + 1] ?? D; hits.set(t, 1).to(t + 0.03, Math.min(t + 0.16, nx - 0.002), 0, E.soft); });
    };
    const hp = new PB();
    for (const a of [45, 135, 225, 315]) { const [x0, y0] = polar(0, 0, 8, a), [x1, y1] = polar(0, 0, 15, a); hp.line(x0, y0, x1, y1); }
    hot.part({ op: hits }).path(hp, stroke(INK, 1.5));

    const shootOp = new Track(0);
    shootWin.forEach(([a, b]) => {
      for (let x = a; x < Math.min(b, a + 1.0) - 1e-6; x += 0.25) shootOp.set(x, 1).to(x, x + 0.22, 0.62, E.decay);
      shootOp.set(Math.min(b, a + 1.0), 1).to(b, b + 0.2, 0, E.soft);
    });
    const sh = g.part({ y: 84, op: shootOp, box: [-90, -22, 180, 32], fx: HOT });
    sh.text(0, 0, 'SHOOT', S.shoot, 'c');
    sh.path(new PB().line(-74, -6, -56, -6).line(56, -6, 74, -6), stroke(SIGNAL, 2));

    const ro = g.part({ x: 0, y: 144, op: powerOp(160) });
    ro.text(-8, 0, 'RNG', S.micro, 'r');
    ro.text(0, 0, (t) => {
      const dr = drones.find((d) => tracking(d, t));
      return dr ? (dr.dist(t) / 1000).toFixed(2) + ' KM' : '-.-- KM';
    }, { ...S.value, s: 16 });
  }

  {
    const TR = 118;
    const g = widget(C, TR);
    g.path(new PB().dots(0, 0, TR, 0, 359, 5, 1, (a) => a % 90 === 0), fill(IC(0.5)));
    g.path(new PB().ticks(0, 0, TR - 5, TR + 5, 0, 270, 90), stroke(INK, 1.5));
    const hitBox = C.part({ box: [-160, -160, 320, 320], fx: HOT });
    const sector = (p) => {
      p.path(new PB().sector(0, 0, TR - 14, TR + 14, -28, 28), fill(SG(0.16)));
      const dp = new PB();
      for (let r = TR - 10; r <= TR + 10.1; r += 5) dp.dots(0, 0, r, -26, 26, 2.6, 1);
      p.path(dp, fill(SG(0.85)));
      p.path(new PB().arc(0, 0, TR + 14, -28, 28).arc(0, 0, TR - 14, -28, 28), stroke(SIGNAL, 1.5));
      p.path(new PB().poly([[-8, -TR - 22], [0, -TR - 32], [8, -TR - 22]]), stroke(SIGNAL, 2));
    };
    for (const [t0, brg] of [[T.HIT1, 210], [T.HIT2, 60]]) {
      const op = new Track(0);
      for (let k = 0; k < 4; k++) op.set(t0 + k * 0.25, 1).to(t0 + k * 0.25, t0 + k * 0.25 + 0.22, 0.4, E.decay);
      op.to(t0 + 1.0, t0 + 1.8, 0, E.soft);
      sector(hitBox.part({ op, tf: new Track([0, 0, brg, 1]) }));
    }
    drones.forEach((dr) => {
      const ang = Track.sample((t) => { const [x, y] = droneAt(dr, Math.min(Math.max(t, dr.t0), dr.t1 - 1e-3)); return [0, 0, Math.atan2(x, -y) / rad, 1]; }, D, 0.05);
      const op = Track.sample((t) => {
        if (t < dr.t0 || t >= dr.t1) return 0;
        const [x, y] = droneAt(dr, t);
        return +smooth((Math.hypot(x, y) - 330) / 80).toFixed(3);
      }, D, 0.05);
      const cue = C.part({ tf: ang, op });
      cue.path(new PB().poly([[-7, -TR - 8], [0, -TR - 16], [7, -TR - 8]]), stroke(SIGNAL, 2));
      cue.path(new PB().poly([[-7, -TR - 14], [0, -TR - 22], [7, -TR - 14]]), stroke(SG(0.5), 1));
    });
  }

  {
    const g = C.part({});
    for (const r of [70, 118, 200, 304, 340, 470, 620]) {
      const on = waveOn(r), off = waveOff(r);
      const op = new Track(0).set(on, 0.9).to(on, on + 0.5, 0, E.soft).set(off, 0.6).to(off, off + 0.35, 0, E.soft);
      const step = Math.max(0.6, 360 / Math.round((2 * Math.PI * r) / 7));
      g.part({ op }).path(new PB().dots(0, 0, r, 0, 359.9, step, 1.1), fill(IK(0.9)));
    }
  }

  const droneTfs = drones.map((dr) => Track.sample((t) => { const [x, y] = droneAt(dr, Math.min(Math.max(t, dr.t0), dr.t1 - 1e-3)); return [x, y, 0, 1]; }, D, 0.05));
  drones.forEach((dr, i) => {
    const op = new Track(0).set(dr.t0, 1).set(dr.t0 + 0.06, 0.2).set(dr.t0 + 0.12, 1).set(dr.t1, 0);
    const inFrame = [], shift = [];
    for (let k = 0; k < NS; k++) {
      const t = Math.min(Math.max(k * DT, dr.t0), dr.t1 - 1e-3), [x, y] = droneAt(dr, t), hw = 66;
      inFrame.push(clamp01((FX - Math.abs(x) + 10) / 30));
      let dx = 0;
      for (const z of ZONES.slice(0, 2)) {
        if (x + hw + dx > z[0] && x - hw + dx < z[2] && y + 124 > z[1] && y - 106 < z[3]) {
          const a = z[0] - 6 - hw - x, b = z[2] + 6 + hw - x;
          dx = Math.abs(a) < Math.abs(b) ? a : b;
        }
      }
      dx = Math.min(dx, FX - hw - x); dx = Math.max(dx, -FX + hw - x);
      shift.push(dx);
    }
    const sh = lag(shift, DT, 0.1);
    const p = CW.part({ op: fromSamples(inFrame, (v) => +v.toFixed(3)) }).part({ tf: droneTfs[i], op });
    const lab = p.part({ tf: fromSamples(sh, (v) => [+v.toFixed(2), 0, 0, 1]) });
    p.path(new PB().poly([[0, -15], [15, 0], [0, 15], [-15, 0]], true), stroke(SIGNAL, 1.5));
    p.path(new PB().poly([[0, -7], [7, 0], [0, 7], [-7, 0]], true), stroke(IK(0.75), 1.2));
    lab.text(0, 98, dr.name, { ...S.label, c: SIGT }, 'c');
    lab.text(0, 116, (t) => (dr.dist(t) / 1000).toFixed(2) + ' KM', { ...S.micro, c: SG(0.85) }, 'c');
    const lockOp = new Track(0).set(dr.track, 1).to(dr.release, dr.release + 0.3, 0, E.soft);
    const lk = p.part({ op: lockOp, box: [-100, -100, 200, 200], fx: HOT });
    const corner = (sx, sy) => new PB().poly([[0, -sy * 11], [0, 0], [-sx * 11, 0]]);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const tfc = new Track([sx * 76, sy * 76, 0, 1]);
      dr.steps.forEach(([ts, o]) => tfc.to(ts, ts + 0.06, [sx * o, sy * o, 0, 1], E.back));
      tfc.to(dr.release, dr.release + 0.3, [sx * 58, sy * 58, 0, 1], E.in);
      lk.part({ tf: tfc }).path(corner(sx, sy), stroke(SIGNAL, 1.5));
    }
    const coreOp = new Track(0).set(dr.lock, 1).set(dr.lock + 0.05, 0.3).set(dr.lock + 0.1, 1);
    lk.part({ op: coreOp }).path(new PB().poly([[0, -7], [7, 0], [0, 7], [-7, 0]], true), { s: INK, w: 2, f: IK(0.35) });
    lk.part({ tf: new Track([0, 0, 0, 0.6]).set(dr.lock, [0, 0, 0, 0.6]).to(dr.lock, dr.lock + 0.45, [0, 0, 0, 2.3], E.out),
      op: new Track(0).set(dr.lock, 1).to(dr.lock + 0.05, dr.lock + 0.45, 0, E.soft) })
      .path(new PB().dots(0, 0, 32, 0, 359, 6, 1.2), fill(SIGNAL));
    const trackOp = new Track(0);
    dr.steps.slice(0, -1).forEach(([ts], k) => {
      const nx = dr.steps[k + 1][0];
      trackOp.set(ts, 1).to(ts, Math.min(ts + 0.3, nx - 0.004), 0.3, E.decay);
    });
    trackOp.set(dr.lock, 0);
    lab.part({ op: trackOp }).text(0, -90, 'TRACK', { ...S.label, c: SIGT }, 'c');
    const tag = lab.part({ op: new Track(0).set(dr.lock, 1).to(dr.release, dr.release + 0.3, 0, E.soft) });
    tag.text(0, -90, 'LOCK', S.labelInk, 'c');
    tag.path(new PB().rect(-36, -106, 72, 23), stroke(SIGNAL, 1));
  });
  {
    const KA = T.KILL_A;
    const [kx, ky] = droneAt(drones[0], KA - 1e-3);
    const kp = CW.part({ x: kx, y: ky, op: new Track(0).set(KA, 1).to(KA + 1.1, KA + 1.5, 0, E.soft) });
    const kb = kp.part({ box: [-130, -130, 260, 260], fx: HOT });
    for (let i = 0; i < 16; i++) {
      const a = (i * 360) / 16 + rnd() * 14, d = 44 + 50 * rnd();
      const [ex, ey] = polar(0, 0, d, a);
      const sh = kb.part({ tf: new Track([0, 0, a, 1]).to(KA, KA + 0.7, [ex, ey, a + (rnd() - 0.5) * 90, 1], E.out),
        op: new Track(1).to(KA + 0.25, KA + 0.75, 0, E.soft) });
      sh.path(new PB().line(0, -3, 0, -9 - 6 * rnd()), stroke(i % 3 ? SIGNAL : INK, 1.5));
    }
    kb.part({ tf: new Track([0, 0, 0, 0.25]).to(KA, KA + 0.6, [0, 0, 0, 1.5], E.out), op: new Track(1).to(KA + 0.1, KA + 0.6, 0, E.soft) })
      .path(new PB().dots(0, 0, 40, 0, 359, 5, 1.3), fill(INK));
    const conf = kp.part({ tf: new Track([0, 14, 0, 1]).to(KA + 0.1, KA + 0.5, [0, 0, 0, 1], E.out), op: new Track(0).to(KA + 0.1, KA + 0.35, 1, E.soft) });
    conf.text(0, 118, 'NEUTRALIZED', { ...S.labelInk, s: 16, ls: 0.32 }, 'c');
    conf.text(0, 138, [['SKIFF-07  ', IC(0.8)], ['+250', SIGT]], S.micro, 'c');
  }

  {
    const M = Math.max(0, Math.round(ctx.params.markers * 2));
    for (let j = 0; j < M; j++) {
      const ts = shots[Math.min(shots.length - 1, Math.floor(((j + 0.5) * shots.length) / M))];
      const dr = droneOf(ts);
      const tx = droneAt(dr, ts)[0];
      let sx = tx < -40 ? -1 : 1;
      const off = 56 + (j % 3) * 34 + rnd() * 6;
      if (ZONES.slice(0, 2).some((z) => tx + sx * (off + 24) > z[0] && tx + sx * (off - 24) < z[2])) sx = -sx;
      const x = sx * off, y = 12 - (j % 2) * 20 - rnd() * 4;
      const critHit = j % 5 === 4;
      const dmg = Math.round((84 + rnd() * 84) * (critHit ? 2.45 : 1));
      const tf = new Track([x, y, 0, 0.5]).to(ts, ts + 0.13, [x, y - 8, 0, 1.14], E.out)
        .to(ts + 0.13, ts + 0.3, [x, y - 11, 0, 1], E.soft).to(ts + 0.3, ts + 0.95, [x, y - 24, 0, 1], E.soft);
      const op = new Track(0).set(ts, 1).to(ts + 0.6, ts + 0.95, 0, E.in);
      const follow = Track.sample((t) => { const [fx, fy] = droneAt(dr, Math.min(Math.max(t, ts), ts + 1)); return [fx, fy, 0, 1]; }, D, 0.05);
      const p = CW.part({ tf: follow, op }).part({ tf });
      if (critHit) { p.text(0, 0, String(dmg), S.crit, 'c'); p.text(0, -28, 'CRIT', { ...S.micro, c: SIGT }, 'c'); }
      else p.text(0, 0, String(dmg), S.dmg, 'c');
      C.hitmarker(ts);
    }
    C.finishHits();
  }

  function arcTape(side, val, k, minor, major, lo, hi, ref, label, unit) {
    const R = 340, a0 = side < 0 ? 270 : 90;
    const g = widget(C, R);
    const win = g.part({ clip: { x: side < 0 ? -380 : 252, y: -170, w: 128, h: 340 }, mask: 'y', maskFrac: 0.22 });
    const st = win.part({ tf: Track.sample((t) => [0, 0, side < 0 ? -(val(t) - ref) * k : (val(t) - ref) * k, 1], D, 0.05) });
    const tk = new PB(), tkM = new PB();
    for (let v = lo; v <= hi + 1e-6; v += minor) {
      const a = side < 0 ? a0 + (v - ref) * k : a0 - (v - ref) * k;
      const isM = Math.abs(v / major - Math.round(v / major)) < 1e-6;
      const [x0, y0] = polar(0, 0, R, a), [x1, y1] = polar(0, 0, R - (isM ? 12 : 5), a);
      (isM ? tkM : tk).line(x0, y0, x1, y1);
      if (isM) { const [lx, ly] = polar(0, 0, R - 30, a); st.stext(lx, ly + 5, String(v), S.tick, 'c', side < 0 ? a - 270 : a - 90); }
    }
    st.path(tk, stroke(IC(0.4), 1)).path(tkM, stroke(IC(0.85), 1));
    win.path(new PB().arc(0, 0, R + 4, a0 - 30, a0 + 30), stroke(IC(0.35), 1));
    const box = g.part({ x: side * R });
    box.path(new PB().rect(side < 0 ? -84 : 12, -16, 72, 32), stroke(IC(0.75), 1));
    box.path(new PB().poly([[side * 2, 0], [side * 9, -5], [side * 9, 5]], true), fill(INK));
    const al = side < 0 ? 'l' : 'r';
    const xl = side < 0 ? -84 : 84;
    box.text(xl, -26, label, S.label, al);
    box.text(xl, 38, unit, S.micro, al);
    box.text(side < 0 ? -20 : 76, 8, (t) => String(Math.round(val(t))), S.tape, 'r');
  }
  arcTape(-1, speed, 1.0, 1, 10, 60, 170, 112, 'GS', 'M/S');
  arcTape(1, alt, 0.5, 2, 10, 40, 220, 120, 'ALT', 'M AGL');

  {
    const vs = (t) => 0.9 * Math.PI * Math.cos((2 * Math.PI * t) / 10 + 0.4);
    const sgn = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d);
    const stacks = [
      [-424, -196, 'THR', (t) => String(Math.round(78 + 4 * Math.sin((2 * Math.PI * t) / 5 + 1))) + '%'],
      [-424, 214, 'VS', (t) => sgn(vs(t), 1)],
      [424, -196, 'G', (t) => (1 / Math.cos(roll(t) * rad) + 0.04 * Math.sin((2 * Math.PI * t) / 2.5)).toFixed(2)],
      [424, 214, 'AOA', (t) => (3 + pitch(t) + 3.2).toFixed(1) + '°'],
    ];
    for (const [x, y, label, fn] of stacks) {
      const g = widget(C, Math.hypot(x, y), { x, y });
      const al = x < 0 ? 'l' : 'r';
      g.path(new PB().rect(x < 0 ? -12 : 7, -19, 5, 5), fill(IC(0.8)));
      g.text(0, -14, label, S.micro, al);
      g.text(0, 10, fn, { ...S.value, s: 20 }, al);
    }
  }

  {
    const R = 470, kh = 1.2;
    const g = widget(C, R);
    const win = g.part({ clip: { x: -300, y: -520, w: 600, h: 140 }, mask: 'x', maskFrac: 0.22 });
    const st = win.part({ tf: heading.map((h) => [0, 0, -(h - 247) * kh, 1]) });
    const t1 = new PB(), t5 = new PB(), t10 = new PB();
    const CARD = { 180: 'S', 225: 'SW', 270: 'W', 315: 'NW', 360: 'N' };
    for (let b = 190; b <= 305; b++) {
      const a = (b - 247) * kh;
      if (b % 5 === 0) {
        const len = b % 10 === 0 ? 12 : 6;
        const [x0, y0] = polar(0, 0, R, a), [x1, y1] = polar(0, 0, R - len, a);
        (b % 10 === 0 ? t10 : t5).line(x0, y0, x1, y1);
      } else t1.dot(...polar(0, 0, R - 2, a), 0.9);
      const [lx, ly] = polar(0, 0, R + 10, a);
      if (CARD[b]) st.stext(lx, ly, CARD[b], { s: 16, w: 600, wd: 118, ls: 0.06, c: INK }, 'c', a);
      else if (b % 10 === 0) st.stext(lx, ly, pad(b % 360, 3), S.tick, 'c', a);
    }
    st.path(t1, fill(IC(0.5))).path(t5, stroke(IC(0.6), 1)).path(t10, stroke(IC(0.95), 1));
    if (uplink) {
      const bug = win.part({ tf: Track.sample((t) => [0, 0, Math.max(-36, Math.min(36, project(relTo(uplink.w, t), t).relB * kh)), 1], D, 0.1) });
      bug.path(new PB().poly([[0, -R + 4], [5, -R + 9], [0, -R + 14], [-5, -R + 9]], true), stroke(INK, 1.2));
    }
    g.path(new PB().poly([[-5, -R + 26], [0, -R + 19], [5, -R + 26]], true), fill(INK));
    g.path(new PB().rect(-38, -R + 30, 76, 30), stroke(IC(0.75), 1));
    g.path(new PB().line(-38, -R + 30, -26, -R + 30).line(26, -R + 30, 38, -R + 30), stroke(INK, 2));
    g.text(0, -R + 54, (t) => pad(Math.round(heading.at(t)) % 360, 3), S.hdg, 'c');
    g.text(-54, -R + 51, 'HDG', S.micro, 'r');
    g.text(54, -R + 51, 'MAG', S.micro, 'l');
  }

  const estW = (str, st) => str.length * st.s * (0.66 + st.ls);
  function alertBanner(t0, t1, runs, sub, beat = 0.5) {
    const st = S.alert;
    const tw = estW(runs.map((r) => r[0]).join(''), st);
    const hw = Math.round(tw / 2 + 34);
    const g = tc.part({ x: 960, y: 168, op: new Track(0).set(t0, 1).to(t1, t1 + 0.25, 0, E.soft) });
    const hot = g.part({ box: [-hw - 120, -34, 2 * hw + 240, 56], fx: GLOW, wipe: new Track(0).set(t0, 0).to(t0, t0 + 0.32, 1, E.out), wipeMode: 'c' });
    hot.path(new PB().rect(-hw, -26, 2 * hw, 38), stroke(IC(0.6), 1));
    for (const sx of [-1, 1]) {
      const dash = hot.part({ tf: new Track([sx * -40, 0, 0, 1]).set(t0, [sx * -40, 0, 0, 1]).to(t0 + 0.1, t0 + 0.5, [0, 0, 0, 1], E.out) });
      dash.path(new PB().line(sx * (hw + 10), -7, sx * (hw + 70), -7), stroke(INK, 2));
      dash.path(new PB().dot(sx * (hw + 80), -7, 1.6), fill(INK));
    }
    hot.part({ op: pulse(t0, t1, 0.62, beat) }).text(0, 4, runs, st, 'c');
    const rule = new PB(), ruleHot = new PB();
    for (let i = -20; i <= 20; i++) (Math.abs(i) <= 2 ? ruleHot : rule).dot(i * 7, 22, 1.1);
    g.path(rule, fill(IC(0.7))).path(ruleHot, fill(SIGNAL));
    g.text(0, 46, sub, { ...S.micro, c: IC(0.9) }, 'c');
  }
  alertBanner(T.HIT1, T.HIT1 + 2.0, [['SHIELD ', INK], ['BREACH', SIGT]], 'REROUTING AUX POWER');
  alertBanner(T.HIT2, T.HIT2 + 1.6, [['HULL ', INK], ['INTEGRITY CRITICAL', SIGT]], 'ARMOUR BREACH DECK 2');
  {
    const t0 = T.FAULT, t1 = T.DOWN0 - 0.05;
    const st = S.alert, runs = [['FCS ', INK], ['FAULT', SIGT]];
    const hw = Math.round(estW('FCS FAULT', st) / 2 + 34);
    const g = tc.part({ x: 960, y: 168, op: new Track(0).set(t0, 1).set(t0 + 0.06, 0.2).set(t0 + 0.12, 1).set(t1, 0) });
    const hot = g.part({ box: [-hw - 40, -34, 2 * hw + 80, 56], fx: GLOW });
    hot.path(new PB().rect(-hw, -26, 2 * hw, 38), stroke(SG(0.7), 1));
    hot.part({ op: pulse(t0, t1, 0.45, 0.25) }).text(0, 4, runs, st, 'c');
    g.text(0, 46, (t) => 'VISOR POWER CYCLE IN ' + Math.max(1, Math.ceil(T.DOWN0 + 0.4 - t)) + ' S', { ...S.micro, c: IC(0.9) }, 'c');
  }

  {
    const lines = [['KESTREL-4 FCS 3.11', ''], ['IMU ALIGN', '0.02°'], ['RADAR', 'SRCH'], ['MASTER ARM', 'SAFE']];
    const g = C.part({ y: 176, op: new Track(0).set(0.2, 1).to(2.32, 2.5, 0, E.in), box: [-160, -18, 320, 116],
      wipe: new Track(1).to(2.3, 2.5, 0, E.in), wipeMode: 'y' });
    lines.forEach(([l, r], i) => {
      const t0 = 0.25 + i * 0.26, y = i * 20;
      g.text(-130, y, (t) => l.slice(0, Math.max(0, Math.min(l.length, Math.floor((t - t0) * 90)))), i ? S.log : { ...S.log, c: INK });
      if (r) g.part({ op: new Track(0).set(t0 + l.length / 90 + 0.08, 1) }).text(130, y, r, { ...S.log, c: INK }, 'r');
    });
    g.path(new PB().line(-130, 70, 130, 70), stroke(IC(0.35), 1));
    g.part({ op: new Track(0).set(1.78, 1).set(1.84, 0.3).set(1.9, 1) }).text(0, 92, 'SYSTEMS NOMINAL', { ...S.labelInk, ls: 0.36 }, 'c');
  }

  {
    const R = 136, RANGE = 1800, K = R / RANGE, cx = 1712, cy = 222;
    const g = widget(tr, 800, { x: cx, y: cy, box: [-R - 40, -R - 56, 2 * R + 80, 2 * R + 120] });
    const clipP = g.part({ clip: { x: -R, y: -R, w: 2 * R, h: 2 * R, circle: true }, mask: 'r', maskFrac: 0.12 });
    const rot = clipP.part({ tf: heading.map((h) => [0, 0, -h, 1]) });
    const toMap = (u, v) => { const [x, y] = strip(u, v); return [x * K, -y * K]; };
    const pan = rot.part({ tf: Track.sample((t) => { const [x, y] = posAt(t); return [-x * K, y * K, 0, 1]; }, D, 0.1) });
    const RV = RANGE * 1.25;
    const step = P / Math.round(P / 55), U0 = -Math.round(RV / step) * step, U1 = P - U0, V0 = -RV, V1 = RV;
    const lat = (nu, nv) => {
      const tab = [];
      for (let j = 0; j <= nv; j++) { tab.push([]); for (let i = 0; i < nu; i++) tab[j].push(rnd()); }
      return (u, v) => {
        const fu = ((((u / P) * nu) % nu) + nu) % nu, fv = Math.min(nv - 1e-6, Math.max(0, ((v - V0) / (V1 - V0)) * nv));
        const i = Math.floor(fu), j = Math.floor(fv), pu = fu - i, pv = fv - j;
        const su = pu * pu * (3 - 2 * pu), sv = pv * pv * (3 - 2 * pv);
        const a = tab[j][i], b = tab[j][(i + 1) % nu], c = tab[j + 1][i], d = tab[j + 1][(i + 1) % nu];
        return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
      };
    };
    const n1 = lat(4, 7), n2 = lat(9, 15), n3 = lat(19, 31);
    const hgt = (u, v) => 0.58 * n1(u, v) + 0.29 * n2(u, v) + 0.13 * n3(u, v);
    const nu = Math.ceil((U1 - U0) / step), nv = Math.ceil((V1 - V0) / step);
    const grid = [];
    for (let j = 0; j <= nv; j++) { const row = []; for (let i = 0; i <= nu; i++) row.push(hgt(U0 + i * step, V0 + j * step)); grid.push(row); }
    const CHUNK = 24;
    for (let l = 0.2, li = 0; l < 0.86; l += 0.05, li++) {
      const lv = l;
      for (let i0 = 0; i0 < nu; i0 += CHUNK) {
        const pb = new PB();
        for (let j = 0; j < nv; j++) for (let i = i0; i < Math.min(nu, i0 + CHUNK); i++) {
          const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i];
          const pts = [];
          const edge = (p, q, x0, y0, x1, y1) => {
            if ((p < lv) !== (q < lv)) { const f = (lv - p) / (q - p); pts.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]); }
          };
          const u = U0 + i * step, v = V0 + j * step;
          edge(a, b, u, v, u + step, v); edge(b, c, u + step, v, u + step, v + step);
          edge(c, d, u + step, v + step, u, v + step); edge(d, a, u, v + step, u, v);
          for (let k = 0; k + 1 < pts.length; k += 2) pb.line(...toMap(...pts[k]), ...toMap(...pts[k + 1]));
        }
        pan.path(pb, stroke(IC(li % 4 === 0 ? 0.32 : 0.13), 1));
      }
    }
    const curve = (fv, du = 30) => { const pts = []; for (let u = U0; u <= U1; u += du) pts.push(toMap(u, fv(u))); return pts; };
    const tau = (2 * Math.PI) / P;
    pan.path(new PB().poly(curve((u) => 260 * Math.sin(tau * u + 0.5) + 120 * Math.sin(2 * tau * u + 1))), stroke(IC(0.5), 1.5, { join: 'round' }));
    pan.path(new PB().poly(curve((u) => 720 + 150 * Math.sin(3 * tau * u))), stroke(IC(0.3), 1, { dash: [5, 4] }));
    const sw = clipP.part({ tf: spin(1800) });
    sw.sweep(R, [143, 208, 230], 70, 0.2);
    sw.path(new PB().line(0, 0, 0, -R), stroke(IC(0.85), 1));
    g.path(new PB().dots(0, 0, R / 3, 0, 359, 6, 0.9).dots(0, 0, (2 * R) / 3, 0, 359, 4, 0.9), fill(IC(0.4)));
    const [fx, fy] = polar(0, 0, R, 37.5);
    g.path(new PB().line(0, 0, fx, fy).line(0, 0, -fx, fy), stroke(IC(0.3), 1));
    g.path(new PB().circle(0, 0, R), stroke(IC(0.6), 1));
    const rose = g.part({ tf: heading.map((h) => [0, 0, -h, 1]) });
    rose.path(new PB().dots(0, 0, R + 8, 0, 359, 5, 0.9, (a) => a % 30 === 0), fill(IC(0.5)));
    rose.path(new PB().ticks(0, 0, R + 4, R + 13, 0, 330, 30), stroke(IC(0.9), 1));
    for (const [a, l] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
      g.part({ tf: Track.sample((t) => { const [lx, ly] = polar(0, 0, R + 22, a - heading.at(t)); return [lx, ly, 0, 1]; }, D, 0.05) }).text(0, 5, l, { ...S.tick, c: a === 0 ? INK : IC(0.8), w: 600 }, 'c');
    }
    g.path(new PB().poly([[0, -8], [6, 7], [0, 3], [-6, 7]], true), fill(INK));
    const contacts = [];
    for (const m of markers) contacts.push({ kind: m === uplink ? 'obj' : 'mark', rel: (t) => relTo(m.w, t) });
    drones.forEach((dr) => contacts.push({ kind: 'host', rel: (t) => {
      if (t < dr.t0 || t >= dr.t1) return null;
      const b = (heading.at(t) + dr.at(t)[0] / PPD) * rad, d = dr.dist(t);
      return [d * Math.sin(b), d * Math.cos(b)];
    } }));
    for (const [fwd, rt] of [[-60, -180], [-140, 210]]) contacts.push({ kind: 'friend', rel: (t) => {
      const h = heading.at(t) * rad;
      return [fwd * Math.sin(h) + rt * Math.cos(h), fwd * Math.cos(h) - rt * Math.sin(h)];
    } });
    for (let i = 0; i < 4; i++) {
      const a0 = rnd() * 360, d0 = 800 + rnd() * 800, ph = rnd() * 6;
      contacts.push({ kind: 'unk', rel: (t) => {
        const a = (a0 + 6 * Math.sin((2 * Math.PI * t) / D + ph)) * rad;
        return [d0 * Math.sin(a), d0 * Math.cos(a)];
      } });
    }
    const crot = g.part({ tf: heading.map((h) => [0, 0, -h, 1]) });
    const SWEEP = 360 * 5 / D;
    const sweepAng = (t) => (((SWEEP * t) % 360) + 360) % 360;
    const FADE = 3.8, DECAY = new Track(0).to(0, 1, 1, E.decay);
    const phosphor = (age) => 1 - 0.88 * DECAY.at(Math.min(1, age / FADE));
    for (const c of contacts) {
      const passes = [];
      let prev = null;
      for (let t = -4.2; t < D; t += 1 / 240) {
        const rel = c.rel(((t % D) + D) % D);
        const ca = rel ? Math.atan2(rel[0], rel[1]) / rad - heading.at(((t % D) + D) % D) : 0;
        const d = (((sweepAng(t) - ca) % 360) + 360) % 360;
        if (prev !== null && d < prev - 180) passes.push(t);
        prev = d;
      }
      const at = (tp) => {
        const rel = c.rel(((tp % D) + D) % D);
        if (!rel) return null;
        const x = rel[0] * K, y = -rel[1] * K;
        return Math.hypot(x, y) < R - 6 ? [x, y, 0, 1] : null;
      };
      const before = passes.filter((tp) => tp < 0).pop();
      const p0 = before !== undefined ? at(before) : null;
      const tf = new Track(p0 || [0, 0, 0, 1]);
      const age0 = before !== undefined ? -before : 9;
      const op = new Track(p0 ? +phosphor(age0).toFixed(4) : 0);
      const first = passes.find((tp) => tp >= 0);
      if (p0 && first !== undefined && age0 < FADE) op.to(0, Math.min(FADE - age0, first - 0.01), 0.12, E.soft);
      const inLoop = passes.filter((tp) => tp >= 0);
      inLoop.forEach((tp, i) => {
        const q = at(tp), nx = inLoop[i + 1];
        if (q) tf.set(tp, q);
        op.set(tp, q ? 1 : 0);
        if (!q) return;
        if (nx !== undefined) op.to(tp, Math.min(tp + FADE, nx - 0.01), 0.12, E.decay);
        else if (tp + FADE <= D) op.to(tp, tp + FADE, 0.12, E.decay);
        else op.to(tp, D, +phosphor(D - tp).toFixed(4), E.soft);
      });
      const cp = crot.part({ tf, op });
      const ico = new PB();
      if (c.kind === 'host') cp.path(ico.poly([[0, -6], [6, 0], [0, 6], [-6, 0]], true), stroke(SIGNAL, 1.5));
      else if (c.kind === 'friend') cp.path(ico.poly([[0, -5], [4, 4], [0, 1.5], [-4, 4]], true), fill(INK));
      else if (c.kind === 'unk') cp.path(ico.circle(0, 0, 3), stroke(IC(0.85), 1));
      else if (c.kind === 'obj') cp.path(ico.poly([[0, -5], [5, 0], [0, 5], [-5, 0]], true), stroke(INK, 1.2));
      else cp.path(ico.dot(0, 0, 2), fill(IC(0.95)));
    }
    g.text(-R - 30, -R - 46, 'TACTICAL', S.labelInk);
    const ping = new Track(0), count = new Track(1);
    for (const dr of drones) {
      ping.set(dr.t0, 1).set(dr.t0 + 0.12, 0.2).set(dr.t0 + 0.25, 1).set(dr.t0 + 0.37, 0.2).set(dr.t0 + 0.5, 1).to(dr.t0 + 1.4, dr.t0 + 1.7, 0, E.soft);
      count.set(dr.t0, 0).to(dr.t0 + 1.7, dr.t0 + 2.0, 1, E.soft);
    }
    g.part({ op: ping }).text(R + 30, -R - 46, 'NEW CONTACT', { ...S.label, c: SIGT }, 'r');
    g.part({ op: count }).text(R + 30, -R - 46, (t) => 'CONTACTS ' + pad(contacts.length - drones.filter((d) => t < d.t0 || t >= d.t1).length, 2), S.micro, 'r');
  }

  {
    const x0 = 64, x1 = 404;
    const g = widget(tl, 800, { box: [x0 - 10, 50, x1 - x0 + 30, 180], wipeMode: 'l' });
    g.text(x0, 82, 'TASKING', S.labelInk);
    g.text(x1, 82, 'LANTERN FALL', S.micro, 'r');
    g.path(new PB().line(x0, 96, x1, 96), stroke(IC(0.3), 1)).path(new PB().line(x0, 96, x0 + 36, 96), stroke(INK, 2));
    g.path(new PB().dot(x1 + 6, 96, 1.4), fill(IC(0.8)));
    function row(y, text, value, tf, op) {
      const p = g.part({ x: x0, y, tf, op });
      p.path(new PB().poly([[5, -11], [10, -6], [5, -1], [0, -6]], true), stroke(IC(0.95), 1.2));
      p.text(22, 0, text, S.row);
      p.text(x1 - x0, 0, value, { ...S.value, s: 16, c: IC(0.95) }, 'r');
      return p;
    }
    const slideIn = (t0) => new Track([48, 0, 0, 1]).set(t0, [48, 0, 0, 1]).to(t0, t0 + 0.45, [0, 0, 0, 1], E.out);
    row(130, 'SECURE UPLINK B', (t) => (uplink ? (uplink.dist(t) / 1000).toFixed(2) + ' KM' : '--'), null, null);
    const r2op = new Track(1).to(T.KILL_A + 0.3, T.KILL_A + 0.6, 0.5, E.soft);
    const r2 = row(162, 'NEUTRALIZE ESCORTS', (t) => (t >= T.KILL_A ? '3/3' : '2/3'), null, r2op);
    r2.part({ val: new Track(0).to(T.KILL_A + 0.15, T.KILL_A + 0.5, 1, E.out) }).path(new PB().line(22, -6, 216, -6), stroke(INK, 1, { prog: 194 }));
    const r3op = new Track(0).set(T.CONTACT_B, 0).to(T.CONTACT_B, T.CONTACT_B + 0.3, 1, E.soft).to(T.LOST_B, T.LOST_B + 0.3, 0.5, E.soft);
    row(194, 'INTERCEPT SKIFF-12', (t) => (t >= T.LOST_B ? 'LOST' : (drones[1].dist(t) / 1000).toFixed(2) + ' KM'), slideIn(T.CONTACT_B), r3op);
    g.part({ op: new Track(0).set(T.CONTACT_B, 1).to(T.CONTACT_B + 2.4, T.CONTACT_B + 2.7, 0, E.soft) }).text(x0 + 22, 222, 'TASKING UPDATED', { ...S.micro, c: SIGT });
    const feed = [[T.KILL_A + 0.1, 'SKIFF-07 NEUTRALIZED', '+250', SIGT, 2.8], [T.PICKUP, 'AMMO CACHE', '+60 RSV', INK, 1.3],
      [T.LOST_B + 0.15, 'SKIFF-12 EVADED', 'LOST', SG(0.8), 0.9]];
    feed.forEach(([t0, msg, val, col, hold], i) => {
      const tf = new Track([-40, 0, 0, 1]).set(t0, [-40, 0, 0, 1]).to(t0, t0 + 0.45, [0, 0, 0, 1], E.out);
      const op = new Track(0).set(t0, 0).to(t0, t0 + 0.25, 1, E.soft).to(t0 + hold, t0 + hold + 0.35, 0, E.soft);
      const p = tl.part({ x: x0, y: 262 + (i === 2 ? 32 : 0), tf, op });
      p.path(new PB().line(0, -16, 0, 6), stroke(col, 2));
      p.text(14, 0, msg, S.labelInk);
      p.text(x1 - x0, 0, val, { ...S.value, c: col }, 'r');
    });
  }

  {
    const cx = 196, cy = 878, R = 100;
    const g = widget(bl, 830, { x: cx, y: cy, box: [-150, -150, 300, 300] });
    const A0 = -135, A1 = 135, span = A1 - A0;
    const ang = (v) => A0 + (span * v) / 100;
    g.path(new PB().dots(0, 0, R + 9, A0, A1, span / 50, 0.9, (a, i) => i % 5 === 0), fill(IC(0.45)));
    g.path(new PB().ticks(0, 0, R + 5, R + 14, A0, A1, span / 10), stroke(IC(0.8), 1));
    for (const v of [0, 50, 100]) { const [x, y] = polar(0, 0, R + 30, ang(v)); g.stext(x, y + 5, String(v), S.tick, 'c'); }
    const L1 = R * span * rad, L2 = (R - 12) * span * rad;
    g.path(new PB().arc(0, 0, R, A0, A1), stroke(IC(0.16), 2));
    g.path(new PB().arc(0, 0, R - 12, A0, A1), stroke(IC(0.16), 1));
    const arcs = g.part({ box: [-114, -114, 228, 228], fx: GLOW });
    arcs.part({ val: shieldGhost.map((v) => v / 100) }).path(new PB().arc(0, 0, R, A0, A1), stroke(SG(0.8), 2, { prog: L1 }));
    arcs.part({ val: shield.map((v) => v / 100) }).path(new PB().arc(0, 0, R, A0, A1), stroke(INK, 2, { prog: L1 }));
    arcs.part({ val: hullGhost.map((v) => v / 100) }).path(new PB().arc(0, 0, R - 12, A0, A1), stroke(SG(0.8), 1, { prog: L2 }));
    arcs.part({ val: hull.map((v) => v / 100) }).path(new PB().arc(0, 0, R - 12, A0, A1), stroke(IC(0.95), 1, { prog: L2 }));
    g.part({ tf: shield.map((v) => [0, 0, ang(v), 1]) }).path(new PB().poly([[0, -R - 3], [-4, -R - 11], [4, -R - 11]], true), fill(INK));
    g.part({ tf: spin(-360) }).path(new PB().dots(0, 0, 70, 0, 359, 4, 0.8, (a) => a % 90 < 12), fill(IC(0.35)));
    g.part({ box: [-60, -36, 120, 60], fx: GLOW }).text(0, 18, (t) => String(Math.round(shield.at(t))), S.big, 'c');
    g.text(0, 44, 'SHIELD', { ...S.micro, c: IC(0.9) }, 'c');
    g.text(-6, 92, 'HULL', S.micro, 'r');
    g.text(4, 92, (t) => String(Math.round(hull.at(t))), { ...S.value, s: 18 }, 'l');
    g.part({ op: new Track(0).set(T.HIT1 + 0.2, 1).set(12.6, 0) }).text(0, 168, 'CAP 2 OFFLINE', { ...S.micro, c: SIGT }, 'c');
  }

  {
    const xr = 1856, xl = 1528;
    const g = widget(br, 830, { box: [xl - 20, 790, xr - xl + 40, 230] });
    g.text(xr, 818, (t) => (t >= T.ARM ? 'MASTER ARM  ON' : 'MASTER ARM  SAFE'), S.micro, 'r');
    g.text(xr, 844, 'VK-9 RAIL CARBINE', S.labelInk, 'r');
    g.path(new PB().line(xl, 856, xr, 856), stroke(IC(0.3), 1)).path(new PB().line(xr - 40, 856, xr, 856), stroke(INK, 2));
    g.path(new PB().dot(xl - 6, 856, 1.4), fill(IC(0.8)));
    function wheels(parent, x, y, st, trks, cell) {
      const cw = TNUM[st.w] * st.s;
      trks.forEach((trk, k) => {
        const dx = x + (trks.length - 1 - k) * cw;
        const win = parent.part({ x: dx, y, clip: { x: -2, y: -cell * 0.8, w: cw + 4, h: cell * 0.92 } });
        const col = win.part({ tf: trk.map((p) => [0, -p * cell, 0, 1]) });
        for (let i = 0; i < 20; i++) col.text(0, i * cell, String(i % 10), st);
      });
    }
    const ammoGlow = g.part({ box: [1616, 872, 156, 106], fx: GLOW });
    wheels(ammoGlow, 1626, 966, S.ammo, wheelTracks(0, ammoEvents, 2), 100);
    g.text(1772, 966, '/', { ...S.rsv, c: IC(0.6) });
    wheels(g, 1796, 966, S.rsv, wheelTracks(0, rsvEvents, 3, 0.05), 36);
    g.part({ val: magVal }).bar(xl, 988, xr - xl, 12, MAG, 6, INK, null);
    g.bar(xl, 988, xr - xl, 12, MAG, 6, null, IC(0.2));
    const hg = g.part({ x: 1566, y: 952 });
    hg.path(new PB().dots(0, 0, 42, -90, 36, 9, 0.9), fill(IC(0.5)));
    hg.path(new PB().arc(0, 0, 42, 40, 90), stroke(SG(0.7), 1.5));
    hg.path(new PB().ticks(0, 0, 36, 46, -90, 90, 90), stroke(IC(0.8), 1));
    hg.part({ tf: heat.map((h) => [0, 0, -90 + 1.8 * h, 1]) }).path(new PB().line(0, -8, 0, -36), stroke(INK, 1.5)).path(new PB().dot(0, 0, 2.5), fill(INK));
    hg.text(0, 22, 'HEAT', S.micro, 'c');
    g.part({ op: pulse(T.EMPTY, T.RELOAD0, 0.3, 0.1) }).text(xl, 890, 'MAG EMPTY', { ...S.labelInk, c: SIGT });
    g.part({ op: pulse(T.RELOAD0, T.RELOAD1, 0.35) }).text(xl, 890, 'RELOADING', S.labelInk);
  }

  {
    const g = widget(bc, 500, { box: [700, 976, 520, 90] });
    const tabs = [
      ['NAV', [[0, D]]],
      ['TGT', drones.map((dr) => [dr.track, dr.release])],
      ['ARM', [[T.ARM, DOWN0]]],
      ['FCS', [[T.FAULT, DOWN0]]],
      ['LNK', [[0, D]]],
    ];
    const tw = 74, gap = 14, x0 = 960 - (tabs.length * tw + (tabs.length - 1) * gap) / 2, y = 1032;
    tabs.forEach(([name, wins], i) => {
      const x = x0 + i * (tw + gap);
      const hot = name === 'TGT' || name === 'FCS';
      g.path(new PB().rect(x, y - 16, tw, 24), stroke(IC(0.3), 1));
      g.text(x + tw / 2, y, name, { ...S.micro, c: IC(0.5) }, 'c');
      const on = new Track(0);
      for (const [a, b] of wins) {
        if (name === 'FCS') on.set(a, 1).to(a, b, 1).set(b, 0);
        else on.set(a, 1).set(b, 0);
      }
      const lit = g.part({ op: name === 'FCS' ? pulse(T.FAULT, DOWN0, 0.3, 0.25) : on });
      lit.path(new PB().rect(x, y - 16, tw, 24), stroke(hot ? SIGNAL : INK, 1));
      lit.path(new PB().line(x, y - 16, x + 14, y - 16), stroke(hot ? SIGNAL : INK, 2));
      lit.text(x + tw / 2, y, name, { ...S.micro, c: hot ? SIGT : INK }, 'c');
    });
    const met0 = 2 * 3600 + 14 * 60 + 37.42;
    const fmt = (t) => {
      const v = met0 + t, h = Math.floor(v / 3600), m = Math.floor((v % 3600) / 60), sec = v % 60;
      return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(sec.toFixed(1), 4);
    };
    g.text(960, 998, (t) => 'MET ' + fmt(t) + '      LNK 98.2%', { ...S.micro, c: IC(0.65), tnum: true }, 'c');
  }

  const KICKS = [[T.KILL_A, 6, 0.6], [T.HIT1, 16, 0.8], [T.HIT2, 26, 1.0]];
  const shake = (t) => {
    let x = 1.4 * Math.sin((2 * Math.PI * t) / 5), y = 1.0 * Math.sin((2 * Math.PI * t) / 2.5 + 0.6);
    for (const [t0, a, dur] of KICKS) {
      const d = t - t0;
      if (d < 0 || d > dur) continue;
      const e = a * Math.exp(-d * 5.5);
      x += e * Math.sin(d * 2 * Math.PI * 11); y += e * 0.7 * Math.cos(d * 2 * Math.PI * 8.5 + 1);
    }
    for (const ts of shots) {
      const d = t - ts;
      if (d >= 0 && d < 0.06) { const e = 1.2 * (1 - d / 0.06); x += e * Math.sin(ts * 97); y += e; }
    }
    return [x, y];
  };
  const visorDark = Track.sample((t) => (t < 1.0 ? 1 : t < 2.6 ? 1 - smooth((t - 1.0) / 1.6) : t < T.DOWN0 + 0.15 ? 0 : smooth((t - T.DOWN0 - 0.15) / 1.3)), D, 0.05);
  const GLITCH = [[T.HIT1, 0.16], [T.HIT2 - 0.02, 0.24], [T.FAULT, 0.1]];
  const glitch = (t) => {
    for (const [t0, dur] of GLITCH) if (t >= t0 && t < t0 + dur) return `url(#glitch${Math.floor((t - t0) / 0.04) % 2})`;
    return '';
  };

  return {
    root, world, scale: s, ox, oy, LW, LH, D, T, heading, horizonTf, PPD, posAt, roll, pitch, alt,
    project, relTo, strip, P, drones, droneAt, droneTfs, shots, burstA, burstB, shake, visorDark, powerOp, glitch,
  };
};
