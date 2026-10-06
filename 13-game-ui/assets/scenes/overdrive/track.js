(() => {
  const TAU = Math.PI * 2;
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const mix = (a, b, k) => a + (b - a) * k;

  const CAM = { fov: 0.95, h: 4.2, d: 10.0, pitch: 0.19, hover: 0.62 };

  const SEGS = [
    [300, 0], [560, 0.50], [240, 0], [380, 1.30], [1214, 0], [260, -0.90], [420, 2.10], [1106, 0],
    [300, -0.70], [480, 1.60], [300, 0], [360, 1.10], [200, -0.60], [380, 0],
  ];
  const LAP = SEGS.reduce((a, s) => a + s[0], 0);
  const TUNNEL = [335, 995];
  const HALF_W = 7.5;
  const KERB = 1.1;
  const WALL_X = HALF_W + KERB + 0.5;
  const WALL_H = 1.05;
  const TUN_X = WALL_X + 1.2, TUN_H = 7.4;
  const PADS = [182, 228, 275];
  const STAND = [-400, 60];

  const turnSum = SEGS.reduce((a, s) => a + s[1], 0);
  const turnScale = TAU / turnSum;
  const N = LAP;
  const HX = new Float64Array(N + 1), HZ = new Float64Array(N + 1), HD = new Float64Array(N + 1), K = new Float64Array(N + 1);
  {
    let i = 0;
    for (const [len, ang] of SEGS) {
      const a = ang * turnScale, kp = (2 * a) / len;
      for (let j = 0; j < len; j++, i++) K[i] = kp * Math.pow(Math.sin(Math.PI * (j + 0.5) / len), 2);
    }
    K[N] = K[0];
    let x = 0, z = 0, h = 0;
    for (let k = 0; k <= N; k++) {
      HX[k] = x; HZ[k] = z; HD[k] = h;
      h += K[k];
      x += Math.sin(h); z += Math.cos(h);
    }
    const ex = HX[N], ez = HZ[N];
    for (let k = 0; k <= N; k++) { HX[k] -= ex * k / N; HZ[k] -= ez * k / N; }
  }
  const HC = new Float64Array(N + 1), HS = new Float64Array(N + 1);
  for (let k = 0; k <= N; k++) { HC[k] = Math.cos(HD[k]); HS[k] = Math.sin(HD[k]); }
  const wrap = (s) => ((s % LAP) + LAP) % LAP;
  function at(s) {
    const u = wrap(s), i = Math.floor(u), f = u - i;
    const lap = Math.floor(s / LAP);
    return {
      x: mix(HX[i], HX[i + 1], f), z: mix(HZ[i], HZ[i + 1], f),
      h: mix(HD[i], HD[i + 1], f) + lap * TAU, k: mix(K[i], K[i + 1], f),
    };
  }
  const curvature = (s) => at(s).k;
  const inTunnel = (s) => { const u = wrap(s); return u >= TUNNEL[0] && u < TUNNEL[1]; };
  const inStand = (s) => { let u = wrap(s); if (u > LAP / 2) u -= LAP; return u >= STAND[0] && u < STAND[1]; };

  function mapOutline(n) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let k = 0; k < N; k += 10) { x0 = Math.min(x0, HX[k]); x1 = Math.max(x1, HX[k]); z0 = Math.min(z0, HZ[k]); z1 = Math.max(z1, HZ[k]); }
    const sc = 1 / Math.max(x1 - x0, z1 - z0);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const toMap = (s) => { const p = at(s); return [(p.x - cx) * sc, -(p.z - cz) * sc]; };
    const pts = [];
    for (let k = 0; k < n; k++) pts.push(toMap((k / n) * LAP));
    return { pts, toMap, aspect: (x1 - x0) / (z1 - z0) };
  }

  function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }

  function glowSprite(r, g, b, size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
    gr.addColorStop(0.16, `rgba(${r},${g},${b},0.45)`);
    gr.addColorStop(0.45, `rgba(${r},${g},${b},0.12)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr;
    x.fillRect(0, 0, size, size);
    return c;
  }
  function streakSprite(r, g, b) {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 128;
    const x = c.getContext('2d');
    const gv = x.createLinearGradient(0, 0, 0, 128);
    gv.addColorStop(0, `rgba(${r},${g},${b},0)`);
    gv.addColorStop(0.1, `rgba(${r},${g},${b},0.9)`);
    gv.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`);
    gv.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gv;
    x.fillRect(0, 0, 32, 128);
    x.globalCompositeOperation = 'destination-in';
    const gh = x.createLinearGradient(0, 0, 32, 0);
    gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(0.5, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gh;
    x.fillRect(0, 0, 32, 128);
    return c;
  }

  function lineSprite(r, gr, b) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 8;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, `rgba(${r},${gr},${b},0)`); g.addColorStop(0.75, `rgba(${r},${gr},${b},0.9)`); g.addColorStop(1, `rgba(${r},${gr},${b},0)`);
    x.fillStyle = g;
    x.fillRect(0, 2, 256, 4);
    x.globalAlpha = 0.35;
    x.fillRect(0, 0, 256, 8);
    return c;
  }

  function gantrySign(font, kind) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 160;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 160);
    g.addColorStop(0, '#121826'); g.addColorStop(1, '#070a10');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 160);
    for (let i = 0; i < 64; i++) for (let j = 0; j < 2; j++) {
      x.fillStyle = (i + j) % 2 ? '#e8ebf2' : '#0a0d14';
      x.fillRect(i * 16, 128 + j * 16, 16, 16);
    }
    x.fillStyle = '#ff2b3d'; x.fillRect(0, 0, 1024, 6);
    x.fillStyle = '#ff2b3d'; x.fillRect(0, 121, 1024, 3);
    x.textBaseline = 'middle';
    x.textAlign = 'center';
    if (kind === 'final') {
      x.font = `italic 800 92px ${font}`;
      x.fillStyle = '#ff4a5a';
      x.fillText('FINAL LAP', 512, 66);
    } else if (kind === 'finish') {
      x.font = `italic 800 92px ${font}`;
      x.fillStyle = '#eef0ff';
      x.fillText('FINISH', 512, 66);
    } else {
      x.font = `italic 800 70px ${font}`;
      x.fillStyle = '#f2f4f8';
      x.textAlign = 'left';
      x.fillText('MIRAHAMA', 56, 64);
      x.font = `italic 600 34px ${font}`;
      x.fillStyle = '#9aa4b8';
      x.fillText('NIGHT CIRCUIT  /  ROUND 07', 470, 66);
    }
    return c;
  }

  function adCanvas(font, kind) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 192;
    const x = c.getContext('2d');
    const A = {
      ktn: ['KAITEN DYNAMIC', 'ROTATION IS A PROMISE', '#ff2b3d', '#ffd6dc'],
      nvk: ['NORDVAKT', 'COLD ENGINEERING / WARM RESULTS', '#5b6bff', '#d4d8ff'],
      odl: ['OVERDRIVE', 'VELOCITY LEAGUE / SEASON 89', '#f2f4f8', '#9aa4b8'],
      sln: ['SOLENNE AERO', 'THE SUN NEVER BRAKES', '#eef0ff', '#ffb03a'],
      tkn: ['TAKANE HEAVY', 'HEAVIER IS HONEST', '#ffb03a', '#fff0d8'],
    }[kind];
    const g = x.createLinearGradient(0, 0, 0, 192);
    g.addColorStop(0, '#111622'); g.addColorStop(1, '#05070c');
    x.fillStyle = g; x.fillRect(0, 0, 512, 192);
    x.fillStyle = A[2]; x.fillRect(0, 0, 512, 8); x.fillRect(0, 184, 512, 8);
    x.fillRect(28, 40, 14, 112);
    x.font = `italic 800 ${A[0].length > 10 ? 58 : 76}px ${font}`;
    x.textBaseline = 'middle';
    x.fillStyle = A[2];
    x.fillText(A[0], 62, 88);
    x.font = `600 22px ${font}`;
    x.fillStyle = A[3];
    x.fillText(A[1], 64, 146);
    x.fillStyle = 'rgba(0,0,0,0.35)';
    for (let i = 0; i < 512; i += 4) x.fillRect(i, 0, 1, 192);
    for (let j = 0; j < 192; j += 4) x.fillRect(0, j, 512, 1);
    return { canvas: c, color: A[2] };
  }

  function skyline(w, h, k, period, seed, layer, base) {
    const tmp = document.createElement('canvas');
    tmp.width = Math.round(w * k); tmp.height = Math.round(h * k);
    const x = tmp.getContext('2d');
    x.scale(k, k);
    const bld = [];
    let px = 0, kq = seed;
    while (px < period) {
      const bw = (layer ? 50 : 26) + hash(kq++) * (layer ? 120 : 70);
      let bh = (layer ? 46 : 30) + Math.pow(hash(kq++), 2.4) * (layer ? 240 : 160);
      if (!layer && hash(kq * 1.3) > 0.94) bh += 140;
      bld.push([px, bw, bh, kq]);
      px += bw * (0.7 + hash(kq++) * 0.45);
    }
    const body = layer ? '#0a0d16' : '#141a28';
    for (const [bx, bw, bh, kk] of bld) {
      for (let off = -period; off < w + period; off += period) {
        const x0 = bx + off;
        if (x0 > w || x0 + bw < 0) continue;
        x.fillStyle = body;
        x.fillRect(x0, base - bh, bw, bh + 2);
        if (bh > 240 && !layer) {
          x.fillRect(x0 + bw / 2 - 1.5, base - bh - 40, 3, 40);
          x.fillStyle = 'rgba(255,43,61,0.85)';
          x.fillRect(x0 + 4, base - bh + 6, bw - 8, 3);
        }
        const cols = Math.floor(bw / 7), rows = Math.floor(bh / 9);
        for (let r = 0; r < rows; r++) {
          if (hash(kk * 3.1 + r) < 0.35) continue;
          for (let q = 0; q < cols; q++) {
            const hv = hash(kk * 7.7 + r * 13.1 + q * 1.7);
            if (hv < 0.64) continue;
            x.fillStyle = hv > 0.97 ? 'rgba(200,218,255,0.85)' : hv > 0.96 ? 'rgba(255,90,60,0.85)' : 'rgba(255,212,168,0.5)';
            x.fillRect(x0 + 3 + q * 7, base - bh + 5 + r * 9, 2, 3);
          }
        }
        if (bh > (layer ? 190 : 140)) { x.fillStyle = '#ff2b3d'; x.fillRect(x0 + bw / 2 - 2, base - bh - (bh > 240 && !layer ? 44 : 6), 4, 4); }
        if (hash(kk * 5.3) > 0.85) {
          x.fillStyle = hash(kk * 9.1) > 0.75 ? 'rgba(255,43,61,0.9)' : hash(kk * 9.1) > 0.4 ? 'rgba(210,225,255,0.85)' : 'rgba(91,107,255,0.9)';
          x.fillRect(x0 + bw * 0.15, base - bh * 0.7, bw * 0.7, 3);
        }
      }
    }
    if (!layer) {
      for (let off = -period; off < w + period; off += period) {
        const bx = period * 0.12 + off, span = 860, dy = base - 70;
        if (bx > w || bx + span < 0) continue;
        const t1 = bx + 150, t2 = bx + span - 150, top = dy - 190;
        x.fillStyle = '#0f131d';
        x.fillRect(bx, dy, span, 7);
        for (const tx of [t1, t2]) { x.fillRect(tx - 6, top, 12, base - top); x.fillRect(tx - 14, top + 30, 28, 5); }
        const cable = (xa, ya, xb, yb, sag) => (u) => [mix(xa, xb, u), mix(ya, yb, u) + sag * 4 * u * (1 - u)];
        const cs = [cable(bx, dy, t1, top, 26), cable(t1, top, t2, top, 150), cable(t2, top, bx + span, dy, 26)];
        x.strokeStyle = 'rgba(40,48,66,0.9)'; x.lineWidth = 1.5;
        for (const cf of cs) { x.beginPath(); for (let i = 0; i <= 40; i++) { const p = cf(i / 40); (i ? x.lineTo : x.moveTo).call(x, p[0], p[1]); } x.stroke(); }
        for (const cf of cs) for (let i = 0; i <= 40; i++) {
          const p = cf(i / 40);
          x.fillStyle = i % 5 === 0 ? 'rgba(255,214,176,0.95)' : 'rgba(236,240,250,0.8)';
          x.fillRect(p[0] - 1, p[1] - 1, 2, 2);
        }
        for (let i = 0; i < span; i += 9) { x.fillStyle = 'rgba(255,200,150,0.75)'; x.fillRect(bx + i, dy + 2, 3, 2); }
        x.fillStyle = '#ff2b3d';
        for (const tx of [t1, t2]) x.fillRect(tx - 2, top - 6, 4, 4);
      }
    }
    const hz = x.createLinearGradient(0, base - 160, 0, base);
    hz.addColorStop(0, 'rgba(52,62,84,0)'); hz.addColorStop(1, layer ? 'rgba(52,62,84,0.35)' : 'rgba(52,62,84,0.6)');
    x.fillStyle = hz;
    x.fillRect(0, base - 160, w, 160);
    const c = document.createElement('canvas');
    c.width = tmp.width; c.height = tmp.height;
    const o = c.getContext('2d');
    o.drawImage(tmp, 0, 0);
    o.scale(k, k);
    const water = o.createLinearGradient(0, base, 0, h);
    water.addColorStop(0, '#0b0f1a'); water.addColorStop(1, '#04060b');
    o.fillStyle = water;
    o.fillRect(0, base, w, h - base);
    const rh = Math.min(h - base, base), band = 3;
    for (let yy = 0; yy < rh; yy += band) {
      const shift = Math.sin(yy * 0.9) * 4 + Math.sin(yy * 0.31) * 6;
      o.globalAlpha = 0.5 * Math.pow(1 - yy / rh, 1.5);
      o.drawImage(tmp, 0, (base - yy - band) * k, w * k, band * k, shift, base + yy, w, band);
    }
    o.globalAlpha = 1;
    if (layer) {
      let q = seed * 7.3;
      for (let i = 0; i < period / 14; i++) {
        const sx = hash(q++) * period, len = 60 + hash(q++) * (h - base) * 0.8, hv = hash(q++);
        const col = hv > 0.9 ? '255,90,60' : hv > 0.66 ? '170,192,255' : '255,200,150';
        for (let off = -period; off < w + period; off += period) {
          const xx = sx + off;
          if (xx < -10 || xx > w + 10) continue;
          for (let yy = 0; yy < len; yy += 4) {
            const a = 0.42 * Math.pow(1 - yy / len, 1.6) * (0.6 + 0.4 * hash(yy * 1.7 + i));
            o.fillStyle = `rgba(${col},${a.toFixed(3)})`;
            o.fillRect(xx + Math.sin(yy * 0.35 + i) * 2.5, base + 4 + yy, 2 + hash(i + yy) * 2, 3);
          }
        }
      }
    }
    return { canvas: c, base };
  }

  function clipPolygon(P, x0, y0, x1, y1) {
    const edges = [[0, x0, 1], [0, x1, -1], [1, y0, 1], [1, y1, -1]];
    for (const [ax, lim, sgn] of edges) {
      if (P.length < 3) return [];
      const out = [];
      const inside = (p) => sgn * (p[ax] - lim) >= 0;
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length], ia = inside(a), ib = inside(b);
        if (ia) out.push(a);
        if (ia !== ib) {
          const u = (lim - a[ax]) / (b[ax] - a[ax]);
          out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
        }
      }
      P = out;
    }
    return P;
  }
  function clipSegment(a, b, x0, y0, x1, y1) {
    let t0 = 0, t1 = 1;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]]) {
      if (p === 0) { if (q < 0) return null; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
  }
  function clipContext(ctx, bounds) {
    const g = {};
    let subs = [], cur = null;
    const flush = () => {
      if (!subs.length) return;
      const [x0, y0, x1, y1] = bounds();
      for (const s of subs) {
        if (s.closed) {
          const P = clipPolygon(s.pts, x0, y0, x1, y1);
          if (P.length < 3) continue;
          ctx.moveTo(P[0][0], P[0][1]);
          for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
          ctx.closePath();
        } else {
          let last = null;
          for (let i = 1; i < s.pts.length; i++) {
            const c = clipSegment(s.pts[i - 1], s.pts[i], x0, y0, x1, y1);
            if (!c) { last = null; continue; }
            if (!last || last[0] !== c[0][0] || last[1] !== c[0][1]) ctx.moveTo(c[0][0], c[0][1]);
            ctx.lineTo(c[1][0], c[1][1]);
            last = c[1];
          }
        }
      }
      subs = []; cur = null;
    };
    g.beginPath = () => { subs = []; cur = null; ctx.beginPath(); };
    g.moveTo = (x, y) => { cur = { pts: [[x, y]], closed: false }; subs.push(cur); };
    g.lineTo = (x, y) => { if (!cur) g.moveTo(x, y); else cur.pts.push([x, y]); };
    g.closePath = () => { if (cur) { cur.closed = true; const p = cur.pts[0]; cur = { pts: [[p[0], p[1]]], closed: false }; subs.push(cur); } };
    g.fill = (...a) => { flush(); ctx.fill(...a); };
    g.stroke = (...a) => { flush(); ctx.stroke(...a); };
    const FLUSH = new Set(['arc', 'setTransform', 'translate', 'scale', 'rotate', 'transform', 'save', 'restore', 'clip']);
    for (let o = Object.getPrototypeOf(ctx); o && o !== Object.prototype; o = Object.getPrototypeOf(o)) {
      for (const k of Object.getOwnPropertyNames(o)) {
        if (k in g || k === 'constructor') continue;
        const d = Object.getOwnPropertyDescriptor(o, k);
        if (typeof d.value === 'function') {
          const f = d.value;
          g[k] = FLUSH.has(k) ? (...a) => { flush(); return f.apply(ctx, a); } : (...a) => f.apply(ctx, a);
        } else if (d.get) {
          Object.defineProperty(g, k, { get: () => ctx[k], set: (v) => { ctx[k] = v; } });
        }
      }
    }
    return g;
  }

  const NEON = [255, 43, 61], ARGON = [91, 107, 255], COOL = [190, 208, 255], SURF = [205, 212, 228];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

  class World {
    constructor(opts) {
      this.canvas = opts.canvas;
      const gb = opts.guard === undefined ? 0.1 : opts.guard;
      this.g = opts.guard === 0 ? this.canvas.getContext('2d')
        : clipContext(this.canvas.getContext('2d'), () => [-gb * this.W, -gb * this.H, (1 + gb) * this.W, (1 + gb) * this.H]);
      this.sprites = opts.sprites || {};
      this.font = opts.font;
      this.glowNeon = glowSprite(255, 52, 70, 64);
      this.glowArgon = glowSprite(96, 112, 255, 64);
      this.glowWhite = glowSprite(255, 236, 220, 64);
      this.glowAmber = glowSprite(255, 168, 60, 64);
      this.glowCool = glowSprite(200, 216, 255, 64);
      this.streakWhite = streakSprite(255, 228, 210);
      this.streakNeon = streakSprite(255, 52, 70);
      this.streakArgon = streakSprite(100, 116, 255);
      this.lineSprite = lineSprite(226, 230, 242);
      this.lineArgon = lineSprite(140, 156, 255);
      this.signs = { round: gantrySign(this.font, 'round'), final: gantrySign(this.font, 'final'), finish: gantrySign(this.font, 'finish') };
      this.ads = ['odl', 'ktn', 'nvk', 'sln', 'tkn'].map((k) => adCanvas(this.font, k));
    }

    resize(W, H, scale) {
      this.W = W; this.H = H;
      this.scale = scale;
      this.canvas.width = Math.round(W * scale);
      this.canvas.height = Math.round(H * scale);
      this.f0 = (H / 2) / Math.tan(CAM.fov / 2);
      this.f = this.f0;
      this.horizon = H / 2 - this.f * Math.tan(CAM.pitch);
    }

    view(sP, xP) {
      const sC = sP - CAM.d;
      const c = at(sC), ahead = at(sP + 6);
      const head = mix(c.h, ahead.h, 0.55);
      const nx = Math.cos(c.h), nz = -Math.sin(c.h);
      return {
        sC, x: c.x + nx * xP * 0.9, z: c.z + nz * xP * 0.9, y: CAM.h, head,
        ch: Math.cos(head), sh: Math.sin(head), cp: Math.cos(CAM.pitch), sp: Math.sin(CAM.pitch),
      };
    }

    proj(v, s, X, Y) {
      let u = s % LAP;
      if (u < 0) u += LAP;
      const i = u | 0, f = u - i;
      const c = HC[i] + (HC[i + 1] - HC[i]) * f, sn = HS[i] + (HS[i + 1] - HS[i]) * f;
      const wx = HX[i] + (HX[i + 1] - HX[i]) * f + c * X, wz = HZ[i] + (HZ[i + 1] - HZ[i]) * f - sn * X;
      const dx = wx - v.x, dz = wz - v.z, dy = Y - v.y;
      const xr = dx * v.ch - dz * v.sh;
      const zf = dx * v.sh + dz * v.ch;
      const zc = zf * v.cp - dy * v.sp;
      const yc = dy * v.cp + zf * v.sp;
      if (zc < 0.3) return null;
      return [this.W / 2 + this.f * xr / zc, this.H / 2 - this.f * yc / zc, zc];
    }

    band(v, ss, X0, Y0, X1, Y1) {
      const A = [], B = [];
      for (const s of ss) {
        const a = this.proj(v, s, X0, Y0), b = this.proj(v, s, X1, Y1);
        if (a && b) { A.push(a); B.push(b); }
      }
      if (A.length < 2) return false;
      const g = this.g;
      g.moveTo(A[0][0], A[0][1]);
      for (let i = 1; i < A.length; i++) g.lineTo(A[i][0], A[i][1]);
      for (let i = B.length - 1; i >= 0; i--) g.lineTo(B[i][0], B[i][1]);
      g.closePath();
      return true;
    }
    quad(v, s0, s1, x0, x1, y) {
      y = y || 0;
      const a = this.proj(v, s0, x0, y), b = this.proj(v, s0, x1, y), c = this.proj(v, s1, x1, y), d = this.proj(v, s1, x0, y);
      if (!a || !b || !c || !d) return;
      const g = this.g;
      g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath();
    }
    fog(depth) { return Math.exp(-depth / 650); }

    frame(st) {
      const g = this.g, W = this.W, H = this.H;
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      g.clearRect(0, 0, W, H);
      this.f = this.f0 * (st.fovK || 1);
      this.horizon = H / 2 - this.f * Math.tan(CAM.pitch);
      const v = this.view(st.sP, st.xP);
      this.v = v;
      this.st = st;
      const blur = Math.min(9, st.speed / 50);
      const S = [];
      for (let d = 1.2; d < 1400; d = d * 1.045 + 0.5) S.push(v.sC + d);
      this.S = S;
      this.camInTunnel = inTunnel(v.sC + 2);

      this.drawSkyFx(g, v, st);
      this.drawRoad(g, v, S, st);
      this.drawSurface(g, v, S, st, blur);
      this.drawPads(g, v, st);
      this.drawEdgeLights(g, v, st, blur);
      this.drawHaze(g, v);
      this.drawStand(g, v, S, st);
      this.drawWalls(g, v, S, blur, 'far');
      this.drawTunnelShell(g, v, S, blur);
      this.drawWalls(g, v, S, blur, 'near');
      this.drawItems(g, v, st, blur);
      this.drawPlayerLights(g, v, st, blur);
      if (st.speedLines > 0.001) this.drawSpeedLines(g, st);
    }

    drawSpeedLines(g, st) {
      const cx = this.W / 2, cy = this.horizon, R = Math.hypot(this.W, this.H) * 0.62, k = this.scale;
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 120; i++) {
        const a = hash(i * 1.37) * TAU, ph = hash(i * 7.11);
        let u = st.t * 1.7 + ph;
        u -= Math.floor(u);
        const r = R * (0.1 + 1.0 * u * u), len = R * (0.06 + 0.32 * u), w = 1.5 + 4 * u * hash(i * 3.3);
        g.globalAlpha = st.speedLines * Math.sin(Math.PI * u) * 0.55;
        const ca = Math.cos(a), sa = Math.sin(a);
        g.setTransform(k * ca, k * sa, -k * sa, k * ca, k * (cx + ca * r), k * (cy + sa * r));
        g.drawImage(hash(i * 5.9) > 0.75 ? this.lineArgon : this.lineSprite, 0, -w / 2, len, w);
      }
      g.setTransform(k, 0, 0, k, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }

    drawSkyFx(g, v, st) {
      if (this.camInTunnel) return;
      const hz = this.horizon;
      g.globalCompositeOperation = 'lighter';
      const t = st.t;
      for (let i = 0; i < 3; i++) {
        const az = [-0.55, 0.32, 0.9][i] - (v.head % TAU);
        const azw = ((az + Math.PI) % TAU + TAU) % TAU - Math.PI;
        const bx = this.W / 2 + azw * this.f;
        if (bx < -600 || bx > this.W + 600) continue;
        const ang = -Math.PI / 2 + 0.45 * Math.sin(t * TAU / 20 * (i + 1) + i * 2.1);
        const len = hz * 1.6, wd = 0.05;
        const ex = bx + Math.cos(ang - wd) * len, ey = hz + Math.sin(ang - wd) * len;
        const fx = bx + Math.cos(ang + wd) * len, fy = hz + Math.sin(ang + wd) * len;
        const gr = g.createLinearGradient(bx, hz, (ex + fx) / 2, (ey + fy) / 2);
        gr.addColorStop(0, 'rgba(205,218,255,0.14)'); gr.addColorStop(1, 'rgba(205,218,255,0)');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(bx, hz); g.lineTo(ex, ey); g.lineTo(fx, fy); g.closePath(); g.fill();
      }
      for (const fw of st.fireworks || []) {
        const d = t - fw.t;
        if (d < 0 || d > 2.2) continue;
        const azw = ((fw.az - (v.head % TAU) + Math.PI) % TAU + TAU) % TAU - Math.PI;
        const cx = this.W / 2 + azw * this.f, cy = hz - fw.el * this.f;
        const R = fw.r * this.f * (1 - Math.exp(-d * 3.2));
        const fall = 40 * d * d;
        const a = Math.pow(clamp01(1 - d / 2.2), 1.4);
        const col = fw.col;
        g.strokeStyle = rgba(col, 0.95 * a);
        g.lineWidth = 2.5;
        g.beginPath();
        for (let k = 0; k < 48; k++) {
          const th = (k / 48) * TAU + fw.t;
          const r1 = R * (0.86 + 0.14 * hash(k + fw.t)), r0 = r1 * (0.62 + 0.2 * clamp01(d));
          g.moveTo(cx + Math.cos(th) * r0, cy + Math.sin(th) * r0 + fall);
          g.lineTo(cx + Math.cos(th) * r1, cy + Math.sin(th) * r1 + fall);
        }
        g.stroke();
        const gs = R * 1.6;
        g.globalAlpha = 0.6 * a;
        g.drawImage(col === ARGON ? this.glowArgon : this.glowNeon, cx - gs, cy - gs + fall, gs * 2, gs * 2);
        g.globalAlpha = 1;
      }
      g.globalCompositeOperation = 'source-over';
    }

    drawRoad(g, v, S, st) {
      const far = this.proj(v, S[S.length - 1], 0, 0);
      const yFar = far ? far[1] : this.horizon;
      const gr = g.createLinearGradient(0, yFar, 0, this.H);
      gr.addColorStop(0, '#2b313c');
      gr.addColorStop(0.06, '#1b1f28');
      gr.addColorStop(0.45, '#12151b');
      gr.addColorStop(1, '#0c0e12');
      g.fillStyle = gr;
      g.beginPath();
      if (this.band(v, S, -HALF_W - KERB, 0, HALF_W + KERB, 0)) g.fill();
    }

    drawSurface(g, v, S, st, blur) {
      const near = S.filter((s) => s < v.sC + 700);
      g.globalCompositeOperation = 'lighter';
      for (const tun of [false, true]) {
        const ss = near.filter((s) => inTunnel(s) === tun);
        if (ss.length < 2) continue;
        const c = SURF;
        for (const [w, a] of [[3.2, 0.04], [1.2, 0.055]]) {
          g.beginPath();
          this.band(v, ss, -HALF_W, 0, -HALF_W + w, 0);
          this.band(v, ss, HALF_W - w, 0, HALF_W, 0);
          g.fillStyle = rgba(c, a);
          g.fill();
        }
      }
      g.globalCompositeOperation = 'source-over';
      g.beginPath();
      for (const [x, w] of [[-0.9, 0.5], [0.9, 0.5], [-0.2, 0.25]]) this.band(v, near.filter((s) => s < v.sC + 400), x - w / 2, 0, x + w / 2, 0);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fill();

      const s0 = v.sC + 1.0;
      const KB = 2.4;
      const kStart = Math.floor(s0 / KB) * KB;
      for (const pass of [0, 1]) {
        g.beginPath();
        for (let s = kStart; s < v.sC + 170; s += KB) {
          if ((Math.round(s / KB) & 1) !== pass) continue;
          const e = s + KB + blur * 0.9;
          this.quad(v, s, Math.min(e, s + KB * 2), -HALF_W - KERB, -HALF_W);
          this.quad(v, s, Math.min(e, s + KB * 2), HALF_W, HALF_W + KERB);
        }
        const smear = clamp01(blur / 6);
        g.fillStyle = pass ? `rgba(220,224,232,${(0.62 - 0.32 * smear).toFixed(3)})` : `rgba(156,34,46,${(0.62 - 0.36 * smear).toFixed(3)})`;
        g.fill();
      }
      g.beginPath();
      for (const side of [-1, 1]) this.band(v, S.filter((s) => s > v.sC + 166 && s < v.sC + 900), side < 0 ? -HALF_W - KERB : HALF_W, 0, side < 0 ? -HALF_W : HALF_W + KERB, 0);
      g.fillStyle = 'rgba(132,116,124,0.26)';
      g.fill();

      g.beginPath();
      const lineS = S.filter((s) => s < v.sC + 900);
      for (const side of [-1, 1]) this.band(v, lineS, side * (HALF_W - 0.38), 0, side * (HALF_W - 0.16), 0);
      g.fillStyle = 'rgba(236,240,248,0.86)';
      g.fill();
      const DP = 14, DL = 5;
      g.beginPath();
      for (let s = Math.floor(s0 / DP) * DP; s < v.sC + 420; s += DP) {
        for (const lx of [-HALF_W / 3, HALF_W / 3]) this.quad(v, s, s + DL + blur * 1.2, lx - 0.1, lx + 0.1);
      }
      g.fillStyle = 'rgba(236,240,248,0.7)';
      g.fill();
      g.beginPath();
      const JP = 9;
      for (let s = Math.floor(s0 / JP) * JP; s < v.sC + 140; s += JP) this.quad(v, s, s + 0.2 + blur * 0.5, -HALF_W, HALF_W);
      g.fillStyle = 'rgba(170,185,210,0.06)';
      g.fill();

      const lap0 = Math.round(v.sC / LAP) * LAP;
      for (const base of [lap0 - LAP, lap0, lap0 + LAP]) {
        if (base < v.sC - 60 || base > v.sC + 700) continue;
        g.beginPath();
        for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) {
          if ((i + j) % 2) continue;
          const x0 = -HALF_W + (i * 2 * HALF_W) / 12;
          this.quad(v, base + j * 1.25, base + (j + 1) * 1.25, x0, x0 + (2 * HALF_W) / 12);
        }
        g.fillStyle = 'rgba(236,240,248,0.88)';
        g.fill();
        g.beginPath();
        for (let k = 0; k < 4; k++) {
          const sb = base - 10 - k * 8, lx = k % 2 ? -2.7 : 2.7;
          this.quad(v, sb, sb + 0.3, lx - 2.3, lx + 2.3);
          this.quad(v, sb - 4.5, sb + 0.3, lx - 2.3, lx - 2.0);
          this.quad(v, sb - 4.5, sb + 0.3, lx + 2.0, lx + 2.3);
        }
        g.fillStyle = 'rgba(236,240,248,0.55)';
        g.fill();
      }

      g.globalCompositeOperation = 'lighter';
      const RP = 22;
      g.beginPath();
      let anyRing = false;
      for (let s = Math.floor((v.sC + 1) / RP) * RP; s < v.sC + 300; s += RP) {
        if (!inTunnel(s) || !inTunnel(s + RP)) continue;
        this.quad(v, s - 3.5 - blur * 0.5, s + 1.0, -HALF_W, HALF_W);
        anyRing = true;
      }
      if (anyRing) { g.fillStyle = rgba(SURF, 0.045); g.fill(); }
      g.globalCompositeOperation = 'source-over';
    }

    drawPads(g, v, st) {
      const lapBase = Math.floor(v.sC / LAP) * LAP;
      g.globalCompositeOperation = 'lighter';
      for (const base of [lapBase, lapBase + LAP]) {
        for (const ps of PADS) {
          const s = base + ps;
          if (s < v.sC + 1 || s > v.sC + 500) continue;
          const lit = st.padFlash ? st.padFlash(s) : 0;
          const fogA = this.fog(s - v.sC);
          g.beginPath();
          this.quad(v, s - 0.5, s + 9, -2.9, 2.9, 0.01);
          g.fillStyle = rgba(ARGON, (0.10 + 0.25 * lit) * fogA);
          g.fill();
          g.beginPath();
          for (let k = 0; k < 3; k++) {
            const z = s + k * 2.7;
            const pts = [[-2.3, z], [0, z + 1.8], [2.3, z], [2.3, z + 0.85], [0, z + 2.65], [-2.3, z + 0.85]];
            const pp = pts.map(([X, Z]) => this.proj(v, Z, X, 0.02));
            if (pp.some((p) => !p)) continue;
            g.moveTo(pp[0][0], pp[0][1]);
            for (let i = 1; i < pp.length; i++) g.lineTo(pp[i][0], pp[i][1]);
            g.closePath();
          }
          g.fillStyle = `rgba(150,160,255,${((0.7 + 0.3 * lit) * fogA).toFixed(3)})`;
          g.fill();
          const c = this.proj(v, s + 4, 0, 0.3);
          if (c) {
            const r = (this.f * (6 + 6 * lit)) / c[2];
            g.globalAlpha = (0.45 + 0.55 * lit) * fogA;
            g.drawImage(this.glowArgon, c[0] - r, c[1] - r * 0.45, r * 2, r * 0.9);
            g.globalAlpha = 1;
          }
        }
      }
      g.globalCompositeOperation = 'source-over';
    }

    drawEdgeLights(g, v, st, blur) {
      const SP = 4;
      const s0 = Math.floor((v.sC + 1) / SP) * SP;
      for (const tun of [false, true]) {
        g.beginPath();
        let any = false;
        for (let s = s0; s < v.sC + 360; s += SP) {
          if (s > v.sC + 150 && Math.round(s / SP) % 2) continue;
          if (inTunnel(s) !== tun) continue;
          for (const side of [-1, 1]) {
            const X = side * (HALF_W + KERB + 0.22);
            this.quad(v, s, s + 0.3 + blur * 1.3, X - 0.06, X + 0.06, 0.06);
            any = true;
          }
        }
        if (!any) continue;
        g.fillStyle = tun ? '#d4d8ff' : '#e6ecff';
        g.fill();
      }
      g.globalCompositeOperation = 'lighter';
      const odG = st.odGlow || 0;
      for (let s = s0; s < v.sC + 160; s += SP) {
        const tun = inTunnel(s);
        const spr = tun ? this.glowArgon : this.glowCool;
        for (const side of [-1, 1]) {
          const p = this.proj(v, s + 0.15 + blur * 0.6, side * (HALF_W + KERB + 0.22), 0.1);
          if (!p) continue;
          const r = (this.f * (0.9 + blur * 0.18) * (tun ? 1 + 0.5 * odG : 1)) / p[2];
          if (r < 1.2) continue;
          g.globalAlpha = Math.min(1, tun ? 0.5 + 0.35 * odG : 0.5);
          g.drawImage(spr, p[0] - r, p[1] - r * 0.5, r * 2, r);
        }
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }

    drawHaze(g, v) {
      if (this.camInTunnel) return;
      const y = this.horizon;
      const gr = g.createLinearGradient(0, y - 30, 0, y + 70);
      gr.addColorStop(0, 'rgba(60,72,96,0)');
      gr.addColorStop(0.3, 'rgba(60,72,96,0.55)');
      gr.addColorStop(1, 'rgba(60,72,96,0)');
      g.fillStyle = gr;
      g.fillRect(0, y - 30, this.W, 100);
    }

    drawStand(g, v, S, st) {
      const ss = S.filter((s) => inStand(s) && s < v.sC + 900);
      if (ss.length < 2) return;
      const X0 = -(WALL_X + 3), X1 = -(WALL_X + 30), Y0 = 1.4, Y1 = 15;
      g.beginPath();
      if (this.band(v, ss, X0, Y0, X1, Y1)) {
        const gr = g.createLinearGradient(0, this.horizon - 200, 0, this.H);
        gr.addColorStop(0, '#131826'); gr.addColorStop(1, '#090c14');
        g.fillStyle = gr;
        g.fill();
      }
      g.beginPath();
      if (this.band(v, ss, X0, 0, X0, Y0)) { g.fillStyle = '#07090f'; g.fill(); }
      g.beginPath();
      for (let k = 1; k < 7; k++) {
        const u = k / 7, X = mix(X0, X1, u), Y = mix(Y0, Y1, u);
        let first = true;
        for (const s of ss) { const p = this.proj(v, s, X, Y); if (!p) continue; if (first) { g.moveTo(p[0], p[1]); first = false; } else g.lineTo(p[0], p[1]); }
      }
      g.strokeStyle = 'rgba(160,175,210,0.16)';
      g.lineWidth = 1;
      g.stroke();
      const roof = ss.map((s) => this.proj(v, s, X0 - 4, Y1 + 3)).filter(Boolean);
      g.beginPath();
      roof.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.strokeStyle = 'rgba(238,240,255,0.65)';
      g.lineWidth = 1.5;
      g.stroke();
      g.globalCompositeOperation = 'lighter';
      const t = st.t;
      const lapBase = Math.floor(v.sC / LAP) * LAP;
      for (let s = Math.floor((v.sC + 3) / 3) * 3; s < v.sC + 420; s += 3) {
        if (!inStand(s)) continue;
        for (let r = 0; r < 7; r++) {
          const hv = hash(Math.round(s - lapBase) * 0.37 + r * 17.3);
          const flick = hash(Math.floor(t * 9) * 3.7 + hv * 99);
          if (flick < 0.86) continue;
          const u = (r + 0.5) / 7;
          const p = this.proj(v, s + hv * 3, mix(X0, X1, u), mix(Y0, Y1, u) + 0.6);
          if (!p) continue;
          const rr = Math.max(1.2, (this.f * 0.5) / p[2]);
          g.globalAlpha = 0.9;
          g.drawImage(hv > 0.92 ? this.glowNeon : hv > 0.75 ? this.glowArgon : this.glowWhite, p[0] - rr * 2, p[1] - rr * 2, rr * 4, rr * 4);
        }
      }
      for (let s = Math.floor((v.sC + 5) / 30) * 30; s < v.sC + 700; s += 30) {
        if (!inStand(s)) continue;
        const p = this.proj(v, s, X0 - 4, Y1 + 2.6);
        if (!p) continue;
        const r = (this.f * 6) / p[2];
        g.globalAlpha = 0.7 * this.fog(p[2]);
        g.drawImage(this.glowWhite, p[0] - r, p[1] - r * 0.5, r * 2, r);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }

    drawWalls(g, v, S, blur, which) {
      const firstTunnel = S.find((s) => s < v.sC + 1100 && inTunnel(s));
      const runs = [];
      let cur = [];
      for (const s of S) { if (s > v.sC + 1100) break; if (!inTunnel(s)) cur.push(s); else if (cur.length) { runs.push(cur); cur = []; } }
      if (cur.length) runs.push(cur);
      for (const run of runs) {
        const far = firstTunnel !== undefined && run[0] > firstTunnel;
        if (far !== (which === 'far')) continue;
        for (const side of [-1, 1]) {
          g.beginPath();
          if (!this.band(v, run, side * WALL_X, 0, side * WALL_X, WALL_H)) continue;
          g.fillStyle = '#14171d';
          g.fill();
          const top = run.map((s) => this.proj(v, s, side * WALL_X, WALL_H)).filter(Boolean);
          g.beginPath();
          top.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
          g.globalCompositeOperation = 'lighter';
          g.strokeStyle = rgba(COOL, 0.14);
          g.lineWidth = 14;
          g.stroke();
          g.strokeStyle = rgba(COOL, 0.32);
          g.lineWidth = 5;
          g.stroke();
          g.globalCompositeOperation = 'source-over';
          g.strokeStyle = '#dfe7f8';
          g.lineWidth = 1.6;
          g.stroke();
          const FH = 4.4, FP = 7;
          g.beginPath();
          for (let s = Math.floor((run[0] + 1) / FP) * FP; s < Math.min(run[run.length - 1], v.sC + 300); s += FP) {
            if (s < v.sC + 1.5) continue;
            const X = side * (WALL_X + 0.15);
            const a = this.proj(v, s, X, WALL_H), b = this.proj(v, s, X, FH), c = this.proj(v, s + 0.12 + blur * 0.7, X, FH), d = this.proj(v, s + 0.12 + blur * 0.7, X, WALL_H);
            if (!a || !b || !c || !d) continue;
            g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath();
          }
          g.fillStyle = `rgba(50,58,76,${(0.85 / (1 + blur * 0.25)).toFixed(3)})`;
          g.fill();
          const cab = run.filter((s) => s < v.sC + 500).map((s) => this.proj(v, s, side * (WALL_X + 0.15), FH)).filter(Boolean);
          g.beginPath();
          cab.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
          g.strokeStyle = 'rgba(70,80,104,0.7)';
          g.lineWidth = 1.2;
          g.stroke();
        }
      }
    }

    drawTunnelShell(g, v, S, blur) {
      const runs = [];
      let cur = [];
      for (const s of S) { if (s > v.sC + 1100) break; if (inTunnel(s)) cur.push(s); else if (cur.length) { runs.push(cur); cur = []; } }
      if (cur.length) runs.push(cur);
      for (const run of runs) {
        const last = this.proj(v, run[run.length - 1], 0, TUN_H);
        const yFar = last ? last[1] : this.horizon;
        const wallG = g.createLinearGradient(0, yFar, 0, this.H);
        wallG.addColorStop(0, '#1a1c21'); wallG.addColorStop(1, '#08090b');
        g.beginPath();
        this.band(v, run, -TUN_X, 0, -TUN_X, TUN_H);
        this.band(v, run, TUN_X, 0, TUN_X, TUN_H);
        g.fillStyle = wallG;
        g.fill();
        const ceilG = g.createLinearGradient(0, 0, 0, yFar);
        ceilG.addColorStop(0, '#06070a'); ceilG.addColorStop(1, '#15171c');
        g.beginPath();
        this.band(v, run, -TUN_X, TUN_H, TUN_X, TUN_H);
        g.fillStyle = ceilG;
        g.fill();
        g.beginPath();
        this.band(v, run, -WALL_X, 0, -WALL_X, WALL_H);
        this.band(v, run, WALL_X, 0, WALL_X, WALL_H);
        g.fillStyle = '#0e1014';
        g.fill();
        for (const [X, Y, a] of [[-TUN_X + 0.02, 1.6, 0.9], [TUN_X - 0.02, 1.6, 0.9], [-TUN_X + 0.02, 4.4, 0.55], [TUN_X - 0.02, 4.4, 0.55]]) {
          const line = run.map((s) => this.proj(v, s, X, Y)).filter(Boolean);
          g.beginPath();
          line.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
          g.globalCompositeOperation = 'lighter';
          const odG = this.st.odGlow || 0;
          if (odG > 0.01) {
            g.strokeStyle = rgba(ARGON, Math.min(0.14, 0.07 * a * odG));
            g.lineWidth = 46;
            g.stroke();
          }
          g.strokeStyle = rgba(ARGON, Math.min(0.4, 0.12 * a * (1 + 0.8 * odG)));
          g.lineWidth = 12 + 4 * odG;
          g.stroke();
          g.globalCompositeOperation = 'source-over';
          g.strokeStyle = `rgba(200,206,255,${(0.9 * a).toFixed(2)})`;
          g.lineWidth = 1.6;
          g.stroke();
        }
        g.beginPath();
        const LPs = 8;
        for (let s = Math.floor(run[0] / LPs) * LPs; s < run[run.length - 1]; s += LPs) {
          if (s < v.sC + 5) continue;
          this.quad(v, s, s + Math.min(5, 1.2 + blur * 0.6), -0.35, 0.35, TUN_H - 0.02);
        }
        g.fillStyle = 'rgba(225,232,255,0.55)';
        g.fill();
      }
    }

    drawItems(g, v, st, blur) {
      const items = [];
      const LP = 55;
      for (let s = Math.floor((v.sC + 2) / LP) * LP; s < v.sC + 900; s += LP) {
        if (inTunnel(s) || inStand(s)) continue;
        items.push({ s, kind: 'lamp', side: Math.round(s / LP) % 2 ? 1 : -1 });
      }
      const RP = 22;
      for (let s = Math.floor((v.sC + 2) / RP) * RP; s < v.sC + 900; s += RP) if (inTunnel(s) && inTunnel(s + RP)) items.push({ s, kind: 'ring' });
      const BP = 150;
      for (let s = Math.floor((v.sC + 2) / BP) * BP + 70; s < v.sC + 900; s += BP) {
        if (inTunnel(s) || inTunnel(s + 20) || inStand(s) || inStand(s + 20)) continue;
        const n = Math.round((s - 70) / BP);
        items.push({ s, kind: 'board', side: n % 2 ? 1 : -1, ad: ((n % 5) + 5) % 5 });
      }
      const lapBase = Math.floor(v.sC / LAP) * LAP;
      for (const base of [lapBase - LAP, lapBase, lapBase + LAP]) {
        for (const ps of TUNNEL) { const s = base + ps; if (s > v.sC + 1 && s < v.sC + 1100) items.push({ s, kind: 'portal' }); }
      }
      const lap0 = Math.round(v.sC / LAP) * LAP;
      for (const base of [lap0 - LAP, lap0, lap0 + LAP]) if (base > v.sC + 1 && base < v.sC + 1200) items.push({ s: base, kind: 'gantry' });
      for (const r of st.rivals || []) if (r.s > v.sC + 1 && r.s < v.sC + 900) items.push({ s: r.s, kind: 'rival', r });
      items.sort((a, b) => b.s - a.s);
      for (const it of items) {
        if (it.kind === 'lamp') this.drawLamp(g, v, it.s, it.side);
        else if (it.kind === 'ring') this.drawRing(g, v, it.s);
        else if (it.kind === 'portal') this.drawPortal(g, v, it.s);
        else if (it.kind === 'board') this.drawBoard(g, v, it.s, it.side, it.ad);
        else if (it.kind === 'gantry') this.drawGantry(g, v, it.s, st);
        else this.drawRival(g, v, it.r, st, blur);
      }
    }

    drawBoard(g, v, s, side, adIdx) {
      const NB = 8;
      const ad = this.ads[adIdx];
      const X0 = side * (WALL_X + 4), X1 = side * (WALL_X + 13), S0 = s, S1 = s + 6.5, Y0 = 4.4, Y1 = 8.7;
      const corner = (u, y) => this.proj(v, mix(S0, S1, u), mix(X0, X1, u), y);
      const pts = [];
      for (let i = 0; i <= NB; i++) { const u = i / NB; pts.push([corner(u, Y1), corner(u, Y0)]); }
      if (pts.some(([a, b]) => !a || !b)) return;
      const mid = pts[NB / 2];
      const depth = mid[0][2];
      const fa = this.fog(depth);
      const legW = Math.max(1, (this.f * 0.3) / depth);
      g.strokeStyle = '#06050f';
      g.lineWidth = legW;
      g.beginPath();
      for (const u of [0.2, 0.8]) { const a = corner(u, Y0), b = corner(u, 0); if (a && b) { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); } }
      g.stroke();
      g.globalCompositeOperation = 'lighter';
      const R = (this.f * 9) / depth;
      g.globalAlpha = 0.35 * fa;
      g.drawImage(ad.color === '#5b6bff' ? this.glowArgon : ad.color === '#ffb03a' ? this.glowAmber : ad.color === '#ff2b3d' ? this.glowNeon : this.glowWhite,
        mid[0][0] - R, (mid[0][1] + mid[1][1]) / 2 - R * 0.6, R * 2, R * 1.2);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      const W = ad.canvas.width, H = ad.canvas.height, sw = W / NB;
      g.save();
      g.globalAlpha = Math.max(0.25, fa);
      for (let i = 0; i < NB; i++) {
        const k0 = side < 0 ? NB - i : i, k1 = side < 0 ? NB - 1 - i : i + 1;
        const tl = pts[k0][0], tr = pts[k1][0], bl = pts[k0][1], br = pts[k1][1];
        const vx = ((bl[0] - tl[0]) + (br[0] - tr[0])) / 2, vy = ((bl[1] - tl[1]) + (br[1] - tr[1])) / 2;
        g.setTransform(this.scale * (tr[0] - tl[0]) / sw, this.scale * (tr[1] - tl[1]) / sw,
                       this.scale * vx / H, this.scale * vy / H, this.scale * tl[0], this.scale * tl[1]);
        g.drawImage(ad.canvas, sw * i, 0, sw + 0.5, H, 0, 0, sw + 0.5, H);
      }
      g.restore();
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    }
    drawRing(g, v, s) {
      const X = TUN_X - 0.05, Y = TUN_H - 0.05, c = 1.0, gap = 0.35;
      const segs = [
        [[-X, 1.0], [-X, Y - c - gap]], [[-X, Y - c + gap * 0.3], [-X + c - gap * 0.3, Y]],
        [[-X + c + gap, Y], [-gap * 0.5, Y]], [[gap * 0.5, Y], [X - c - gap, Y]],
        [[X - c + gap * 0.3, Y], [X, Y - c + gap * 0.3]], [[X, Y - c - gap], [X, 1.0]],
      ];
      const P = segs.map(([a, b]) => [this.proj(v, s, a[0], a[1]), this.proj(v, s, b[0], b[1])]);
      if (P.some(([a, b]) => !a || !b)) return;
      const depth = P[2][0][2];
      const w = Math.max(1, (this.f * 0.20) / depth);
      const fa = this.fog(depth);
      g.beginPath();
      for (const [a, b] of P) { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
      g.lineCap = 'round';
      g.globalCompositeOperation = 'lighter';
      const odG = this.st.odGlow || 0;
      if (odG > 0.01) {
        g.strokeStyle = rgba(ARGON, Math.min(0.12, 0.05 * fa * odG));
        g.lineWidth = w * 26;
        g.stroke();
      }
      g.strokeStyle = rgba(ARGON, Math.min(0.3, 0.08 * fa * (1 + 0.7 * odG)));
      g.lineWidth = w * (9 + 2 * odG);
      g.stroke();
      g.strokeStyle = rgba(ARGON, Math.min(0.8, 0.28 * fa * (1 + 1.1 * odG)));
      g.lineWidth = w * (3 + 0.8 * odG);
      g.stroke();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = `rgba(226,230,255,${(0.95 * fa).toFixed(3)})`;
      g.lineWidth = w;
      g.stroke();
      g.lineCap = 'butt';
    }

    drawPortal(g, v, s) {
      const X = TUN_X + 0.1, Y = TUN_H + 0.1, O = 2.6;
      const inner = [[-X, 0], [-X, Y], [X, Y], [X, 0]].map(([a, b]) => this.proj(v, s, a, b));
      const outer = [[-X - O, 0], [-X - O, Y + O], [X + O, Y + O], [X + O, 0]].map(([a, b]) => this.proj(v, s, a, b));
      if (inner.some((p) => !p) || outer.some((p) => !p)) return;
      g.beginPath();
      g.moveTo(outer[0][0], outer[0][1]); outer.slice(1).forEach((p) => g.lineTo(p[0], p[1]));
      g.lineTo(inner[3][0], inner[3][1]); inner.slice().reverse().slice(1).forEach((p) => g.lineTo(p[0], p[1]));
      g.closePath();
      g.fillStyle = '#0a0d15';
      g.fill();
      const w = Math.max(1, (this.f * 0.3) / inner[1][2]);
      g.beginPath();
      g.moveTo(inner[0][0], inner[0][1]); inner.slice(1).forEach((p) => g.lineTo(p[0], p[1]));
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = rgba(ARGON, 0.35);
      g.lineWidth = w * 6;
      g.stroke();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(220,224,255,0.95)';
      g.lineWidth = w;
      g.stroke();
    }

    drawLamp(g, v, s, side) {
      const X = side * (WALL_X + 2.4), XH = side * (HALF_W - 1.0), Y = 10.5;
      const base = this.proj(v, s, X, 0), top = this.proj(v, s, X, Y), head = this.proj(v, s, XH, Y - 0.2);
      if (!base || !top || !head) return;
      const fa = this.fog(head[2]);
      const w = Math.max(1, (this.f * 0.32) / base[2]);
      g.strokeStyle = '#05070b';
      g.lineWidth = w;
      g.beginPath(); g.moveTo(base[0], base[1]); g.lineTo(top[0], top[1]); g.lineTo(head[0], head[1]); g.stroke();
      g.globalCompositeOperation = 'lighter';
      const fl = this.proj(v, s, XH - 3, 0), fr = this.proj(v, s, XH + 3, 0);
      if (fl && fr) {
        const gr = g.createLinearGradient(head[0], head[1], head[0], fl[1]);
        gr.addColorStop(0, `rgba(255,230,210,${(0.10 * fa).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,230,210,0)');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(head[0], head[1]); g.lineTo(fl[0], fl[1]); g.lineTo(fr[0], fr[1]); g.closePath(); g.fill();
      }
      const r = (this.f * 4.4) / head[2];
      g.globalAlpha = fa;
      g.drawImage(this.glowWhite, head[0] - r, head[1] - r * 0.6, r * 2, r * 1.2);
      const rf = this.proj(v, s, XH, -Y * 0.6), rb = this.proj(v, s, XH, 0);
      if (rf && rb) {
        const rw = (this.f * 1.6) / rb[2];
        g.globalAlpha = 0.7 * fa;
        g.drawImage(this.streakWhite, rb[0] - rw, rb[1] - (rf[1] - rb[1]) * 0.12, rw * 2, (rf[1] - rb[1]) * 1.4);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#fff6ee';
      const hr = Math.max(1, (this.f * 0.35) / head[2]);
      g.fillRect(head[0] - hr * 1.6, head[1] - hr * 0.4, hr * 3.2, hr * 0.8);
    }

    drawGantry(g, v, s, st) {
      const X = WALL_X + 1.8, Y0 = 7.2, Y1 = 9.8, D = 0.8;
      const P = (x, y, ds) => this.proj(v, s + (ds || 0), x, y);
      const lb = P(-X, 0), lt = P(-X, Y1 + 0.6), rb = P(X, 0), rt = P(X, Y1 + 0.6);
      const sl = P(-X + 0.6, Y1), sr = P(X - 0.6, Y1), bl = P(-X + 0.6, Y0), br = P(X - 0.6, Y0);
      if (!lb || !lt || !rb || !rt || !sl || !sr || !bl || !br) return;
      const fa = this.fog(lb[2]);
      const legW = Math.max(2, (this.f * 1.0) / lb[2]);
      g.fillStyle = '#090c13';
      g.fillRect(lb[0] - legW, lt[1], legW * 1.5, lb[1] - lt[1]);
      g.fillRect(rb[0] - legW * 0.5, rt[1], legW * 1.5, rb[1] - rt[1]);
      g.fillStyle = rgba(NEON, 0.9 * fa);
      const sw = Math.max(1, legW * 0.12);
      g.fillRect(lb[0] + legW * 0.5 - sw, lt[1], sw, lb[1] - lt[1]);
      g.fillRect(rb[0] - legW * 0.5, rt[1], sw, rb[1] - rt[1]);
      const tl = P(-X, Y1 + 0.6), tr = P(X, Y1 + 0.6), ul = P(-X, Y1 + 1.6), ur = P(X, Y1 + 1.6);
      if (tl && tr && ul && ur) {
        g.strokeStyle = '#0b0e16';
        g.lineWidth = Math.max(1, (this.f * 0.18) / tl[2]);
        g.beginPath();
        g.moveTo(tl[0], tl[1]); g.lineTo(tr[0], tr[1]); g.moveTo(ul[0], ul[1]); g.lineTo(ur[0], ur[1]);
        const n = 10;
        for (let i = 0; i < n; i++) {
          const a = P(mix(-X, X, i / n), Y1 + (i % 2 ? 0.6 : 1.6)), b = P(mix(-X, X, (i + 1) / n), Y1 + (i % 2 ? 1.6 : 0.6));
          if (a && b) { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
        }
        g.stroke();
      }
      const sign = this.signs[st.sign || 'round'];
      g.drawImage(sign, sl[0], sl[1], sr[0] - sl[0], bl[1] - sl[1]);
      const lights = st.startLights || { lit: 0, go: 0 };
      for (let i = 0; i < 5; i++) {
        const X0 = -4.0 + i * 2.0;
        const p = P(X0, Y0 - 0.7), h0 = P(X0 - 0.75, Y0), h1 = P(X0 + 0.75, Y0 - 1.4);
        if (!p || !h0 || !h1) continue;
        g.fillStyle = '#05070b';
        g.fillRect(h0[0], h0[1], h1[0] - h0[0], h1[1] - h0[1]);
        const r = (this.f * 0.5) / p[2];
        const on = lights.go > 0 ? 2 : i < lights.lit ? 1 : 0;
        g.fillStyle = on === 2 ? '#e4e6ff' : on === 1 ? '#ffe0d6' : '#1a1f2c';
        g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.fill();
        if (on) {
          g.globalCompositeOperation = 'lighter';
          const spr = on === 2 ? this.glowArgon : this.glowNeon;
          const R = r * (on === 2 ? 10 + 8 * lights.go : 9);
          g.drawImage(spr, p[0] - R, p[1] - R, R * 2, R * 2);
          g.globalCompositeOperation = 'source-over';
        }
      }
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = rgba(NEON, 0.95 * fa);
      g.lineWidth = Math.max(1, (this.f * 0.14) / bl[2]);
      g.beginPath(); g.moveTo(bl[0], bl[1]); g.lineTo(br[0], br[1]); g.stroke();
      g.strokeStyle = rgba(NEON, 0.25 * fa);
      g.lineWidth = Math.max(3, (this.f * 0.9) / bl[2]);
      g.stroke();
      g.globalCompositeOperation = 'source-over';
    }

    drawRival(g, v, r, st, blur) {
      const c = this.proj(v, r.s, r.x, CAM.hover);
      if (!c) return;
      const spr = this.sprites[r.livery];
      if (!spr) return;
      const depth = c[2];
      const lateral = r.x - (st.xP || 0);
      const view = depth < 20 && Math.abs(lateral) > 2.5 ? spr.near : Math.abs(lateral) > 2.2 ? spr.side : spr.far;
      const img = view.img;
      if (!img.naturalWidth) return;
      const k = (view.dist / depth) * (this.H / 1080) / view.scale;
      const fa = this.fog(depth);
      this.drawTrailFor(g, v, r.s, r.x, r.light, 0.8 * fa, st, blur);
      g.globalCompositeOperation = 'lighter';
      const pool = this.proj(v, r.s, r.x, 0);
      const poolSpr = r.light === 'argon' ? this.glowArgon : r.light === 'amber' ? this.glowAmber : this.glowWhite;
      if (pool) {
        const R = (this.f * 3.6) / pool[2];
        g.globalAlpha = 0.5 * fa;
        g.drawImage(poolSpr, pool[0] - R * 1.2, pool[1] - R * 0.4, R * 2.4, R * 0.8);
        g.globalAlpha = 1;
      }
      g.globalCompositeOperation = 'source-over';
      const flip = lateral < -0.5 && view.side;
      g.save();
      g.translate(c[0], c[1]);
      if (flip) g.scale(-1, 1);
      g.globalAlpha = fa < 1 ? Math.max(0.3, fa) : 1;
      g.drawImage(img, -view.ax * k, -view.ay * k, img.naturalWidth * k, img.naturalHeight * k);
      g.restore();
      g.globalCompositeOperation = 'lighter';
      for (const side of [-1, 1]) {
        const gl = this.proj(v, r.s - 3.5, r.x + side * 0.86, CAM.hover + 0.08);
        if (!gl) continue;
        const R = (this.f * 1.5) / gl[2];
        g.globalAlpha = fa;
        g.drawImage(poolSpr, gl[0] - R, gl[1] - R * 0.8, R * 2, R * 1.6);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }

    drawTrailFor(g, v, s, x, light, alpha, st, blur) {
      alpha *= clamp01(st.speed / 60);
      if (alpha <= 0.01) return;
      const len = 5 + blur * 3.5;
      const col = light === 'argon' ? [96, 112, 255] : light === 'amber' ? [255, 168, 60] : light === 'white' ? [220, 228, 255] : [255, 52, 70];
      g.globalCompositeOperation = 'lighter';
      for (const side of [-1, 1]) {
        const X = x + side * 0.86;
        const a = this.proj(v, s - 3.5, X, CAM.hover + 0.08);
        const b = this.proj(v, Math.max(v.sC + 0.8, s - 3.5 - len), X, CAM.hover - 0.05);
        if (!a || !b) continue;
        const wa = (this.f * 0.25) / a[2], wb = (this.f * 0.6) / b[2];
        const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]);
        gr.addColorStop(0, rgba(col, 0.8 * alpha));
        gr.addColorStop(1, rgba(col, 0));
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(a[0] - wa, a[1]); g.lineTo(a[0] + wa, a[1]); g.lineTo(b[0] + wb, b[1]); g.lineTo(b[0] - wb, b[1]);
        g.closePath();
        g.fill();
      }
      g.globalCompositeOperation = 'source-over';
    }

    drawPlayerLights(g, v, st, blur) {
      const sP = v.sC + CAM.d, xP = st.xP;
      const boost = st.boostLight || 0;
      const pc = boost ? this.glowArgon : this.glowNeon;
      g.globalCompositeOperation = 'lighter';
      const pool = this.proj(v, sP + 0.4, xP, 0);
      if (pool) {
        const R = (this.f * 4.6) / pool[2];
        g.globalAlpha = 0.42;
        g.drawImage(pc, pool[0] - R * 1.05, pool[1] - R * 0.36, R * 2.1, R * 0.72);
      }
      for (const side of [-1, 1]) {
        const top = this.proj(v, sP - 3.7, xP + side * 0.86, 0), bot = this.proj(v, sP - 3.7, xP + side * 0.86, -1.1);
        if (!top || !bot) continue;
        const rw = (this.f * 0.75) / top[2];
        g.globalAlpha = 0.6;
        g.drawImage(boost ? this.streakArgon : this.streakNeon, top[0] - rw, top[1] - 2, rw * 2, (bot[1] - top[1]) * 1.5);
      }
      g.globalAlpha = 1;
      const a = clamp01(st.speed / 80);
      if (a > 0.01) {
        const col = boost ? ARGON : NEON;
        for (const side of [-1, 1]) {
          const X = xP + side * 2.12;
          const pts = [];
          for (let d = 2.9; d < 7.2; d += 0.5) {
            const p = this.proj(v, sP - d, X, CAM.hover + 0.95 - (d - 2.9) * 0.05);
            if (p) pts.push(p);
          }
          if (pts.length < 2) continue;
          const head = pts[0], tail = pts[pts.length - 1];
          for (const [wk, ak] of [[0.12, 0.12], [0.022, 0.6]]) {
            const gr = g.createLinearGradient(head[0], head[1], tail[0], tail[1]);
            gr.addColorStop(0, rgba(col, 0.85 * a * ak)); gr.addColorStop(1, rgba(col, 0));
            g.fillStyle = gr;
            g.beginPath();
            pts.forEach((p, i) => { const w = (this.f * wk) / p[2]; (i ? g.lineTo : g.moveTo).call(g, p[0] - w, p[1] - w * 0.3); });
            for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i], w = (this.f * wk) / p[2]; g.lineTo(p[0] + w, p[1] + w * 0.3); }
            g.closePath();
            g.fill();
          }
        }
      }
      g.globalCompositeOperation = 'source-over';
    }
  }

  window.ODTrack = {
    CAM, LAP, TUNNEL, PADS, HALF_W, at, curvature, inTunnel, mapOutline, skyline, World, NEON, ARGON,
  };
})();
