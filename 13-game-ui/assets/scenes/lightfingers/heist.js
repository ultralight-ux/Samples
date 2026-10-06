(() => {
  const { tf, op, shake } = HC;
  const T = HW.T;
  const q = new URLSearchParams(location.search);
  const live = !q.has('t');

  const ptr = { x: 0, y: 0, tx: 0, ty: 0, last: 0 };
  if (live) {
    addEventListener('mousemove', (e) => {
      ptr.tx = (e.clientX / innerWidth) * 2 - 1;
      ptr.ty = (e.clientY / innerHeight) * 2 - 1;
    });
  }
  function easePointer() {
    if (!live) return;
    const now = performance.now();
    const dt = ptr.last ? Math.min(100, now - ptr.last) : 16;
    ptr.last = now;
    const k = 1 - Math.exp(-dt / 320);
    ptr.x += (ptr.tx - ptr.x) * k;
    ptr.y += (ptr.ty - ptr.y) * k;
  }

  function start() {
    scene.define({
      name: 'lightfingers',
      controls: [[['1–6'], 'Jump to a chapter'], [['Mouse move'], 'Lean the city']],
      duration: T.DUR,
      keyTimes: [0.4, 2.55, 4.7, 6.3, 8.45, 9.55, 10.75, 17.4],
      params: {
        shake: { default: 1, min: 0, max: 2 },
        grain: { default: 1, min: 0, max: 1 },
        bake: { default: 0, min: 0, max: 2 },
      },
      routes: ['photon-text', 'photon-fill', 'photon-stroke', 'photon-hairline', 'svg-inline', 'svg-filter',
        'clip-path', 'composited-layer'],

      setup(ctx) {
        const ui = document.getElementById('ui');
        ctx.world = HW.buildWorld(document.getElementById('world'));
        ctx.screens = [
          HW.buildField(ui),
          HP.buildPause(ui),
          HB.buildLights(ui),
          HB.buildBattle(ui),
          HB.buildEncore(ui),
          HB.buildSmash(ui),
          HR.buildResults(ui),
        ];
        ctx.grain = HC.D('div', '', ui);
        ctx.grain.id = 'grain';
        const gr = HC.rng(909);
        ctx.grainOffsets = Array.from({ length: 16 }, () => [Math.round((gr() - 0.5) * 180), Math.round((gr() - 0.5) * 180)]);
        ctx.screens.push(HB.buildFlash(ui));
        ctx.ui = ui;
        ctx.cam = document.getElementById('cam');
        ctx.ptr = ptr;
        const fit = () => {
          ctx.width = innerWidth; ctx.height = innerHeight;
          const k = Math.min(ctx.width / 1920, ctx.height / 1080);
          ctx.fit = [(ctx.width - 1920 * k) / 2, (ctx.height - 1080 * k) / 2, k];
        };
        fit();
        addEventListener('resize', fit);
      },

      render(t, ctx) {
        easePointer();
        const f = ctx.fit;
        const sh = shake(t, HW.SHAKES);
        const m = ctx.params.shake;
        tf(ctx.cam, sh[0] * m * f[2], sh[1] * m * f[2], sh[2] * m, 1);
        tf(ctx.ui, f[0], f[1], 0, f[2]);
        if (ctx.params.bake) HC.disp(ctx.ui, false);
        ctx.world.update(t, ctx);
        const g = ctx.grainOffsets[Math.floor(t * 12) % 16];
        tf(ctx.grain, g[0], g[1], 0, 1);
        op(ctx.grain, ctx.params.grain);
        for (const s of ctx.screens) s.update(t, ctx);
      },
    });
  }

  const CHAPTERS = { 1: 0.5, 2: 3.6, 3: 6.3, 4: 9.9, 5: 12.0, 6: 18.5 };
  addEventListener('keydown', (e) => {
    if (!live || !(e.key in CHAPTERS)) return;
    q.set('start', CHAPTERS[e.key]);
    location.search = q.toString();
  });

  const faces = ['400 100px "LF Anton"', '400 100px "LF Abril"', '700 20px "LF Archivo"', '400 60px "LF Sedgwick"'];
  Promise.all(faces.map((f) => document.fonts.load(f))).then(start, start);
})();
