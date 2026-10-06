(() => {
  const q = new URLSearchParams(location.search);
  const num = (v) => (v !== null && v !== '' && !isNaN(+v) ? +v : v);
  const CHOOSER_URL = '../../index.html';
  const FADE_IN_MS = 250, FADE_OUT_MS = 200;
  const CONTROLS_ENTRY_MS = 5000, CONTROLS_IDLE_MS = 4000;

  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Game UI Sans'; src: url(../../fonts/HankenGrotesk-wght.ttf);
      font-weight: 100 900;
    }
    html { background: #000; cursor: default; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    * { -webkit-user-select: none; user-select: none; -webkit-user-drag: none; }
    #scene-veil {
      position: fixed; inset: 0; z-index: 2147483647; background: #000;
      pointer-events: none; transition: opacity ${FADE_IN_MS}ms ease-out;
    }
    #scene-controls {
      position: fixed; left: 8px; top: 8px; z-index: 2147483646;
      display: flex; align-items: center; gap: 14px; padding: 4px 14px 4px 4px;
      font: 400 13px/1 'Game UI Sans', sans-serif; color: #f2f2f2; white-space: nowrap;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      background: rgba(10, 10, 10, 0.45); border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px; backdrop-filter: blur(12px);
      opacity: 0; transition: opacity 500ms ease-out; pointer-events: none;
    }
    #scene-controls.shown { opacity: 1; transition-duration: 150ms; pointer-events: auto; }
    #scene-back {
      display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 6px;
      font: 600 13px/1 'Game UI Sans', sans-serif; color: inherit; text-shadow: inherit;
      background: rgba(255, 255, 255, 0.1); border: 0; border-radius: 4px; cursor: pointer;
    }
    #scene-back:hover { background: rgba(255, 255, 255, 0.22); }
    #scene-back svg { width: 13px; height: 13px; }
    #scene-controls kbd {
      display: inline-block; min-width: 9px; padding: 3px 5px; text-align: center;
      font: 600 11px/1 'Game UI Sans', sans-serif; color: #f2f2f2;
      border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 3px;
    }
    #scene-keys { display: flex; align-items: center; gap: 16px; }
    #scene-keys:empty { display: none; }
    #scene-keys > span { display: flex; align-items: center; gap: 6px; }
    #scene-keys b { font-weight: 600; }
    #scene-keys i { font-style: normal; color: rgba(242, 242, 242, 0.8); }
  `;
  document.head.appendChild(style);

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  let def = null, ctx = null, live = !q.has('t'), t0 = 0, rafId = 0, setupError = null;
  addEventListener('error', (e) => { setupError = setupError || String(e.message); });
  addEventListener('unhandledrejection', (e) => { setupError = setupError || String(e.reason); });
  const view = { zoom: 1, rotate: 0, x: 0, y: 0 };

  function defaultApplyView(v, c) {
    const stage = c.stage;
    if (!stage) return;
    stage.style.transformOrigin = '50% 50%';
    stage.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.zoom})`;
  }
  function applyView() {
    (def.applyView || defaultApplyView)(view, ctx);
    if (!live) renderAt(ctx.time);
  }

  function renderAt(sec) {
    ctx.time = sec;
    if (def.render) def.render(sec, ctx);
  }

  function setTime(sec) {
    live = false;
    cancelAnimationFrame(rafId);
    renderAt(sec);
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = sec * 1000;
    }
  }

  const PERF_CAP = 8192;
  let perf = null;
  function perfReset() {
    perf = { frames: 0, errors: 0, firstError: null, js: [], dt: [], last: 0, start: performance.now() };
  }
  perfReset();
  function stats(a) {
    if (!a.length) return null;
    const s = a.slice().sort((x, y) => x - y);
    const at = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return { n: a.length, mean: a.reduce((x, y) => x + y, 0) / a.length, p50: at(0.5), p95: at(0.95), max: s[s.length - 1] };
  }
  function perfReport() {
    const dt = stats(perf.dt);
    return JSON.stringify({
      frames: perf.frames, errors: perf.errors, firstError: perf.firstError,
      seconds: (performance.now() - perf.start) / 1000,
      js_ms: stats(perf.js), raf_dt_ms: dt,
      long_frames: dt ? perf.dt.filter((x) => x > 1.5 * dt.p50).length : 0,
    });
  }

  function loop(now) {
    if (!live) return;
    rafId = requestAnimationFrame(loop);
    const d = def.duration || 0;
    let sec = Math.max(0, (now - t0) / 1000);
    if (d > 0) sec %= d;
    const a = performance.now();
    try {
      renderAt(sec);
    } catch (e) {
      perf.errors++;
      if (!perf.firstError) {
        perf.firstError = String(e) + (e && e.stack ? '\n' + e.stack : '');
        console.error('[scene] frame threw: ' + perf.firstError);
      }
    }
    if (perf.js.length < PERF_CAP) {
      perf.js.push(performance.now() - a);
      if (perf.last) perf.dt.push(now - perf.last);
    }
    perf.last = now;
    perf.frames++;
    hudTick(now);
  }

  let hud = null, hudFrames = 0, hudLast = 0;
  function hudTick(now) {
    if (!hud) return;
    hudFrames++;
    if (now - hudLast >= 500) {
      const fps = (hudFrames * 1000) / (now - hudLast);
      hud.textContent = `${fps.toFixed(1)} fps  ${(1000 / fps).toFixed(2)} ms`;
      hudFrames = 0; hudLast = now;
    }
  }

  let veil = null, leaving = false, revealed = false;
  function revealScene() {
    if (!veil || leaving || revealed) return;
    revealed = true;
    veil.style.opacity = '0';
    showControls(CONTROLS_ENTRY_MS);
    setTimeout(() => { if (!leaving) veil.style.display = 'none'; }, FADE_IN_MS + 50);
  }
  function goBack() {
    if (leaving) return;
    leaving = true;
    veil.style.display = '';
    veil.style.transitionDuration = FADE_OUT_MS + 'ms';
    requestAnimationFrame(() => {
      veil.style.opacity = '1';
      setTimeout(() => { location.href = CHOOSER_URL; }, FADE_OUT_MS + 20);
    });
  }

  const POINTER = new Set(['Mouse move']);
  let controls = null, controlsTimer = 0;
  function showControls(ms) {
    if (!controls) return;
    controls.classList.add('shown');
    clearTimeout(controlsTimer);
    controlsTimer = setTimeout(() => controls.classList.remove('shown'), ms);
  }
  function listControls(entries) {
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    const keys = (list) => list.map((k) => (POINTER.has(k) ? `<b>${esc(k)}</b>` : `<kbd>${esc(k)}</kbd>`)).join('');
    document.getElementById('scene-keys').innerHTML =
      entries.map(([k, action]) => `<span>${keys(k)}<i>${esc(action)}</i></span>`).join('');
  }

  function installSampleControls() {
    veil = document.createElement('div');
    veil.id = 'scene-veil';
    document.body.appendChild(veil);

    controls = document.createElement('div');
    controls.id = 'scene-controls';
    controls.innerHTML =
      '<button id="scene-back" type="button">' +
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"' +
      ' stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>' +
      'Back<kbd>Esc</kbd></button><span id="scene-keys"></span>';
    document.body.appendChild(controls);

    for (const type of ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'wheel'])
      controls.addEventListener(type, (e) => e.stopPropagation());
    controls.querySelector('#scene-back').addEventListener('click', goBack);

    addEventListener('mousemove', () => { if (revealed) showControls(CONTROLS_IDLE_MS); }, { passive: true });
    addEventListener('selectstart', (e) => e.preventDefault());
    addEventListener('dragstart', (e) => e.preventDefault());

    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        goBack();
      } else if (e.key === 'Backspace' && !e.target.isContentEditable &&
                 !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) {
        e.preventDefault();
      }
    }, true);

    setTimeout(revealScene, 4000);
  }

  if (live) installSampleControls();

  function define(d) {
    def = d;
    const params = {};
    const specs = d.params || {};
    for (const k of Object.keys(specs)) {
      const spec = specs[k];
      params[k] = q.has('p.' + k) ? num(q.get('p.' + k)) : (typeof spec === 'object' ? spec.default : spec);
    }
    ctx = {
      params, view, time: 0,
      variant: q.get('variant') || (d.variants ? d.variants[0] : null),
      random: mulberry32(q.has('seed') ? +q.get('seed') : 1),
      width: innerWidth, height: innerHeight,
      stage: document.getElementById('stage'),
    };
    try {
      if (d.setup) d.setup(ctx);
    } catch (e) {
      setupError = String(e) + (e && e.stack ? '\n' + e.stack : '');
      console.error('[scene] setup failed: ' + setupError);
    }
    ctx.stage = ctx.stage || document.getElementById('stage');
    applyView();
    if (q.get('hud') === '1') {
      hud = document.createElement('div');
      hud.style.cssText = 'position:fixed;right:8px;top:8px;z-index:99999;font:12px monospace;' +
        'color:#0f0;background:rgba(0,0,0,.6);padding:2px 6px;pointer-events:none';
      document.body.appendChild(hud);
    }
    if (q.has('t')) {
      setTime(+q.get('t'));
      return;
    }
    if (controls) {
      listControls(d.controls || []);
    }
    t0 = performance.now() - (q.has('start') ? +q.get('start') * 1000 : 0);
    rafId = requestAnimationFrame(loop);
    requestAnimationFrame(() => requestAnimationFrame(revealScene));
  }

  window.scene = {
    define, setTime,
    info: () => JSON.stringify({
      ready: !!def && !setupError, error: setupError,
      name: def && def.name, duration: def && def.duration, variants: def && def.variants,
      params: def && def.params, keyTimes: def && def.keyTimes,
      state: ctx && { time: ctx.time, variant: ctx.variant, params: ctx.params, view },
    }),
    perf: () => perfReport(),
    perfReset: () => perfReset(),
  };
})();
