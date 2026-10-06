(() => {
  const { TAU, DUR, f2, per, op, tf, h, svg } = AR;
  const R = 111;
  const S = 330;
  const P = 110;
  const WW = 2 * R + 6 * P;
  const KINDS = {
    life: {
      level: 0.8, empty: ['#2a0807', '#070202'], aura: 'rgba(255,36,20,.24)', core: 'rgba(255,70,40,.26)',
      back: '#3a0507', front: ['#a3221a', '#5e080b'], crest: '#ff9a80',
      waves: [6, -4], motes: 6, value: '9,412',
    },
    wrath: {
      level: 0.6, empty: ['#0b1730', '#03060d'], aura: 'rgba(120,180,255,.42)', core: 'rgba(205,236,255,.46)',
      back: '#123574', front: ['#6fa8ea', '#2c62bc'], crest: '#e6f4ff',
      waves: [8, -5], motes: 11, value: '58',
    },
  };

  function surface(parent, kind, amp, ph, cols, crest, top) {
    const hs = 2 * amp + 26, mid = amp + 2;
    let d = '';
    for (let x = 0; x <= WW; x += 5) d += `${x ? 'L' : 'M'}${x} ${f2(mid + amp * Math.sin((x / P) * TAU + ph))} `;
    const id = `sf-${kind}-${crest ? 'f' : 'b'}`;
    const fade = 2 * amp + 5;
    return svg(parent, WW, hs, `
      <defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${hs}">
        <stop offset="0" stop-color="${cols[0]}"/><stop offset="${f2(fade / hs)}" stop-color="${cols[1]}"/>
        <stop offset="1" stop-color="${cols[1]}" stop-opacity="0"/></linearGradient></defs>
      <path d="${d}L${WW} ${hs} L0 ${hs} Z" fill="url(#${id})"/>
      ${crest ? `<path d="${d}" fill="none" stroke="${crest}" stroke-opacity=".22" stroke-width="4" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="${crest}" stroke-opacity=".85" stroke-width="1.4"/>` : ''}`,
    `left:-40px;top:${f2(top - mid)}px`);
  }

  function build(parent, cx, cy, kind) {
    const k = KINDS[kind];
    const g = h('div', '', parent, `left:${cx - S / 2}px;top:${cy - S / 2}px;width:${S}px;height:${S}px`);
    const aura = h('div', '', g, `left:-50px;top:-50px;width:${S + 100}px;height:${S + 100}px;border-radius:50%;
      background:radial-gradient(circle,${k.aura},rgba(0,0,0,0) 60%)`);
    svg(g, S, S, `<defs><radialGradient id="oe-${kind}" cx=".5" cy=".4" r=".62"><stop offset="0" stop-color="${k.empty[0]}"/>
      <stop offset="1" stop-color="${k.empty[1]}"/></radialGradient></defs><circle r="${R}" fill="url(#oe-${kind})"/>`,
    'left:0;top:0', `${-S / 2} ${-S / 2} ${S} ${S}`);
    const clip = h('div', '', g, `left:${S / 2 - R}px;top:${S / 2 - R}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;overflow:hidden`);
    const tilt = h('div', '', clip, `left:0;top:0;width:${2 * R}px;height:${2 * R}px;transform-origin:${R}px ${R}px`);
    const sy = 2 * R * (1 - k.level);
    const amp = 6;
    const wTop = sy + amp + 1;
    const win = h('div', '', tilt, `left:-40px;top:${f2(wTop)}px;width:${2 * R + 80}px;height:${f2(2 * R + 50 - wTop)}px;overflow:hidden`);
    const anchor = h('div', '', win, `left:40px;top:${f2(-wTop)}px;width:${2 * R}px;height:${2 * R}px;transform-origin:${R}px ${R}px`);
    h('img', '', anchor, `left:0;top:0;width:${2 * R}px;height:${2 * R}px`).src = `assets/orb-${kind}-body.jpg`;
    const SW = Math.round(2 * R * 1.5), so = R - SW / 2;
    const veins = h('img', '', anchor, `left:${so}px;top:${so}px;width:${SW}px;height:${SW}px;transform-origin:50% 50%;opacity:${kind === 'life' ? 0.8 : 0.55}`);
    veins.src = `assets/orb-${kind}-veins.webp`;
    const wisps = h('img', '', anchor, `left:${so}px;top:${so}px;width:${SW}px;height:${SW}px;transform-origin:50% 50%;mix-blend-mode:screen;opacity:${kind === 'life' ? 0.4 : 0.6}`);
    wisps.src = `assets/orb-${kind}-wisps.jpg`;
    const core = h('div', '', anchor, `left:${f2(R * 0.3)}px;top:${f2(R * 0.62)}px;width:${f2(R * 1.4)}px;height:${f2(R * 1.3)}px;border-radius:50%;
      background:radial-gradient(ellipse at 50% 58%,${k.core},rgba(0,0,0,0) 68%);mix-blend-mode:screen`);
    const motes = [];
    for (let i = 0; i < k.motes; i++) {
      const sz = kind === 'life' ? 3 + (i % 3) * 1.5 : 6 + (i % 4) * 2.5;
      const bg = kind === 'life' ? 'radial-gradient(circle,rgba(255,190,170,.75),rgba(255,120,100,.25) 55%,rgba(255,90,70,0) 72%)'
        : 'radial-gradient(circle,#ffffff,rgba(190,228,255,.7) 35%,rgba(120,180,255,0) 72%)';
      const d = h('div', '', anchor, `left:0;top:0;width:${sz}px;height:${sz}px;margin:${-sz / 2}px 0 0 ${-sz / 2}px;border-radius:50%;background:${bg}`);
      motes.push({ d, x: R + (((i * 0.618) % 1) - 0.5) * R * 1.3, ph: (i * 0.37) % 1, sp: 1 + (i % 4), sway: 3 + (i % 3) * 3 });
    }
    const back = surface(tilt, kind, amp + 1, 1.7, [k.back, k.back], null, sy - 3);
    back.style.opacity = '0.6';
    const front = surface(tilt, kind, amp, 0, k.front, k.crest, sy);
    h('img', '', g, `left:${S / 2 - R}px;top:${S / 2 - R}px;width:${2 * R}px;height:${2 * R}px`).src = 'assets/ui/orb-glass.webp';
    h('img', '', g, `left:-12px;top:-12px;width:${S + 24}px;height:${S + 24}px`).src = 'assets/ui/orb-frame.webp';
    h('img', '', g, `left:${S / 2 - 112}px;top:${S / 2 - 188}px;width:224px;height:110px`).src = 'assets/ui/orb-crown.webp';
    const PW = 124, py = S / 2 + R + 4;    h('div', 'num', g, `left:${S / 2 - PW / 2}px;width:${PW}px;top:${py + 6}px;text-align:center;font-size:21px;color:#f6e4b8`, k.value);
    return { g, kind, aura, core, tilt, anchor, veins, wisps, back, front, motes, sy };
  }

  function heartbeat(t) {
    const u = ((t * 24) / DUR) % 1;
    return Math.exp(-((u / 0.06) ** 2)) + 0.6 * Math.exp(-(((u - 0.22) / 0.07) ** 2));
  }

  function render(o, t) {
    const life = o.kind === 'life';
    const a = (life ? 1.8 : 2.4) * per(t, 3) + 0.9 * per(t, 7, 1.3);
    const dy = 1.6 * per(t, 4, 2.1);
    tf(o.tilt, `translateY(${f2(dy)}px) rotate(${f2(a)}deg)`);
    tf(o.anchor, `rotate(${f2(-a)}deg) translateY(${f2(-dy)}px)`);
    const [kf, kb] = KINDS[o.kind].waves;
    tf(o.front, `translateX(${f2(-(((t * P * kf) / DUR) % P + P) % P - P * 2)}px)`);
    tf(o.back, `translateX(${f2(-((((t * P * kb) / DUR) % P) + P) % P - P * 2.5)}px)`);
    if (life) {
      tf(o.veins, `rotate(${f2(26 * per(t, 1))}deg) translate(${f2(10 * per(t, 2))}px,${f2(8 * per(t, 1, 1.2))}px)`);
      tf(o.wisps, `rotate(${f2(-34 * per(t, 1, 0.8))}deg) translate(${f2(-9 * per(t, 2, 0.5))}px,${f2(7 * per(t, 3))}px)`);
      const hb = heartbeat(t);
      op(o.aura, 0.72 + 0.28 * hb);
      op(o.core, 0.6 + 0.4 * hb);
    } else {
      tf(o.veins, `rotate(${f2(30 * per(t, 1, 2))}deg) translate(${f2(8 * per(t, 2, 1))}px,${f2(10 * per(t, 1))}px)`);
      tf(o.wisps, `rotate(${f2(-(t / DUR) * 360)}deg)`);
      op(o.aura, 0.8 + 0.2 * per(t, 5));
      op(o.core, 0.8 + 0.2 * per(t, 7, 0.4));
    }
    const top = o.sy + 10, bottom = 2 * R - 12;
    o.motes.forEach((m) => {
      const u = ((t * m.sp) / DUR + m.ph) % 1;
      const y = bottom - u * (bottom - top);
      const x = m.x + m.sway * Math.sin(TAU * (u * 2 + m.ph));
      tf(m.d, `translate(${f2(x)}px,${f2(y)}px)`);
      const fade = Math.min(1, u * 5) * Math.min(1, (1 - u) * 4);
      op(m.d, life ? 0.7 * fade : fade * (0.6 + 0.4 * per(t, 40 + m.sp * 7, m.ph * 6)));
    });
  }

  AR.orbs = { build, render, R, S };
})();
