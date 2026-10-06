(() => {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lin = (t, a, b) => clamp((t - a) / (b - a));
  const easeIn = (x) => x * x * x;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const mix = (a, b, k) => a + (b - a) * k;

  function spring(x, w = 14, z = 0.56) {
    if (x <= 0) return 0;
    const zw = z * w, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-zw * x) * (Math.cos(wd * x) + (zw / wd) * Math.sin(wd * x));
  }
  const wobble = (x, amp = 8, w = 17, decay = 6) => (x <= 0 ? 0 : amp * Math.exp(-decay * x) * Math.sin(w * x));

  function press(x, hold = 0.07) {
    if (x <= 0) return 0;
    if (x < hold) return easeOut(x / hold);
    return 1 - spring(x - hold, 18, 0.38);
  }

  function env(t, a, b = Infinity, o = {}) {
    const dOut = o.dOut || 0.18, from = o.from === undefined ? 0 : o.from;
    if (t < a || t > b + dOut) return { s: from, o: 0, r: 0, on: false, k: 0, out: t > b ? 1 : 0 };
    if (t <= b) {
      const x = t - a;
      const k = spring(x, o.w || 14, o.z || 0.56);
      return { s: mix(from, 1, k), o: clamp(x / 0.08), r: wobble(x, o.wob === undefined ? 6 : o.wob), on: true, k, out: 0 };
    }
    const x = (t - b) / dOut;
    const out = x < 0.25 ? -0.06 * Math.sin((x / 0.25) * Math.PI) : easeIn((x - 0.25) / 0.75);
    return { s: 1 - 0.08 * easeIn(x), o: 1 - easeIn(clamp((x - 0.35) / 0.65)), r: 0, on: true, k: 1, out };
  }

  function springSteps(t, keys, w = 14, z = 0.56) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) break;
      v = v + (keys[i][1] - v) * spring(t - keys[i][0], w, z);
    }
    return v;
  }
  function stepIndex(t, keys) {
    let i = 0;
    while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    return i;
  }

  const osc = (t, dur, k, ph = 0) => Math.sin((t / dur) * k * Math.PI * 2 + ph);

  window.M = { clamp, lin, easeIn, easeOut, easeInOut, mix, spring, wobble, press, env, springSteps, stepIndex, osc };
})();
