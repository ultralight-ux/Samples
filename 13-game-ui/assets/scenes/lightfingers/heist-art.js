(() => {
  const { S, pts, limb, rough } = HC;

  const ARM_PIVOT = [392, 252];
  const ARM_ANGLE = Math.atan2(124 - 252, 664 - 392) * 180 / Math.PI;
  function magpieArm() {
    return [limb(392, 252, 490, 212, 48, 38), limb(490, 212, 590, 166, 38, 30),
      [[576, 150], [604, 146], [660, 118], [664, 130], [616, 158], [624, 176], [598, 188], [582, 180]]];
  }
  function magpieParts() {
    const P = [];
    P.push([[292, 92], [270, 62], [304, 70], [296, 30], [330, 58], [350, 22], [358, 62], [394, 54], [376, 80],
      [396, 86], [382, 100], [388, 114], [400, 132], [388, 138], [390, 152], [372, 170], [346, 178], [320, 170],
      [302, 150], [294, 120]]);
    P.push(limb(336, 160, 338, 224, 36, 44));
    P.push([[276, 236], [272, 172], [312, 214], [338, 226], [368, 212], [402, 174], [404, 238]]);
    P.push([[268, 232], [406, 226], [400, 300], [376, 420], [368, 500], [300, 508], [290, 420], [266, 300]]);
    P.push([[276, 238], [250, 380], [210, 540], [156, 700], [56, 852], [170, 800], [190, 890], [250, 760],
      [296, 600], [316, 500], [302, 380]]);
    P.push([[398, 250], [416, 420], [448, 600], [500, 772], [428, 722], [394, 620], [368, 500]]);
    P.push([[312, 212], [200, 230], [70, 190], [150, 246], [30, 282], [210, 266], [314, 240]]);
    P.push(limb(312, 500, 250, 730, 62, 48));
    P.push(limb(250, 730, 196, 950, 46, 34));
    P.push([[176, 936], [220, 940], [226, 976], [140, 980], [150, 958]]);
    P.push(limb(352, 500, 452, 700, 64, 50));
    P.push(limb(452, 700, 472, 950, 50, 36));
    P.push([[452, 936], [492, 932], [556, 968], [552, 980], [456, 980]]);
    P.push(limb(276, 250, 246, 370, 42, 36));
    P.push(limb(246, 370, 282, 450, 34, 28));
    P.push([[270, 440], [304, 434], [310, 462], [278, 470]]);
    return P;
  }
  const MAGPIE_MASK = [[306, 104], [338, 102], [368, 96], [394, 98], [400, 112], [390, 126], [368, 128],
    [356, 120], [342, 130], [318, 130], [296, 122], [236, 130], [282, 110], [222, 98], [290, 98]];
  const MAGPIE_EYES = [[[366, 108], [390, 104], [386, 116], [368, 118]]];

  function wardenParts() {
    const P = [];
    P.push([[120, 300], [640, 290], [700, 380], [660, 600], [560, 700], [230, 710], [120, 600], [70, 390]]);
    P.push([[270, 110], [500, 104], [540, 300], [236, 306]]);
    P.push(limb(110, 340, 40, 520, 130, 110));
    P.push(limb(40, 520, 120, 650, 110, 100));
    P.push([[60, 610], [190, 600], [210, 720], [80, 740]]);
    P.push(limb(650, 340, 720, 560, 130, 110));
    P.push(limb(720, 560, 700, 760, 110, 96));
    P.push([[640, 740], [760, 736], [770, 860], [650, 870]]);
    P.push([[230, 690], [560, 690], [590, 900], [200, 900]]);
    return P;
  }

  function addPolys(g, polys, attrs) {
    for (const p of polys) S('polygon', Object.assign({ points: pts(p) }, attrs), g);
  }
  function inkEdges(polys, seed) {
    return polys.map((p, i) => rough(p, { amp: 1.4, step: 6, scale: 22, seed: seed + i * 13 }));
  }
  function cutEdges(polys, seed) {
    return polys.map((p, i) => rough(p, { amp: 4.5, step: 12, scale: 70, jit: 0.15, seed: seed + 500 + i * 13 }));
  }

  function cutoutRig(parent, groups, o) {
    const g = S('g', {}, parent);
    const ow = o.outline || 14;
    const passes = [];
    if (o.mis) passes.push([{ fill: o.mis, stroke: o.mis, 'stroke-width': ow, 'stroke-linejoin': 'round' },
      `translate(${o.misDx || 16} ${o.misDy || 12})`]);
    if (o.paper) passes.push([{ fill: o.paper, stroke: o.paper, 'stroke-width': ow, 'stroke-linejoin': 'round' }, null]);
    passes.push([{ fill: o.ink }, null]);
    const parts = {};
    let ink = null;
    const seed = o.seed || 1;
    const inkP = {}, cutP = {};
    Object.keys(groups).forEach((name, gi) => {
      inkP[name] = inkEdges(groups[name], seed + gi * 1000);
      cutP[name] = cutEdges(groups[name], seed + gi * 1000);
    });
    for (const [attrs, tr] of passes) {
      const pg = S('g', tr ? { transform: tr } : {}, g);
      const isCut = attrs.fill === o.paper && attrs.stroke;
      for (const name in groups) {
        const sub = S('g', {}, pg);
        addPolys(sub, isCut ? cutP[name] : inkP[name], attrs);
        (parts[name] = parts[name] || []).push(sub);
      }
      ink = pg;
    }
    return { g, ink, parts };
  }
  function cutout(parent, polys, o) {
    return cutoutRig(parent, { body: polys }, o).g;
  }

  function magpie(parent, o) {
    const rig = cutoutRig(parent, { body: magpieParts(), arm: magpieArm() }, o);
    const head = rig.parts.body[rig.parts.body.length - 1];
    S('polygon', { points: pts(MAGPIE_MASK), fill: o.maskColor || '#fff' }, head);
    for (const e of MAGPIE_EYES) S('polygon', { points: pts(e), fill: o.eyeColor || '#e60012' }, head);
    rig.aim = (deg) => {
      const v = `rotate(${(deg - ARM_ANGLE).toFixed(2)} ${ARM_PIVOT[0]} ${ARM_PIVOT[1]})`;
      if (rig._aim === v) return;
      rig._aim = v;
      for (const a of rig.parts.arm) a.setAttribute('transform', v);
    };
    return rig;
  }

  function warden(parent, o) {
    const g = cutout(parent, wardenParts(), o);
    const cx = 386, cy = 210;
    S('circle', { cx, cy, r: 150, fill: o.paper, stroke: o.ink, 'stroke-width': 10 }, g);
    S('circle', { cx, cy, r: 124, fill: 'none', stroke: o.ink, 'stroke-width': 4 }, g);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      S('circle', { cx: cx + Math.cos(a) * 137, cy: cy + Math.sin(a) * 137, r: 5, fill: o.ink }, g);
    }
    const wheel = S('g', { transform: `translate(${cx} ${cy})` }, g);
    const spin = S('g', {}, wheel);
    for (let i = 0; i < 3; i++) {
      S('rect', { x: -96, y: -9, width: 192, height: 18, fill: o.ink, transform: `rotate(${i * 60})` }, spin);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      S('circle', { cx: Math.cos(a) * 96, cy: Math.sin(a) * 96, r: 15, fill: o.ink }, spin);
    }
    S('circle', { cx: 0, cy: 0, r: 46, fill: o.ink }, wheel);
    const eye = S('circle', { cx: 0, cy: 0, r: 20, fill: o.eye || '#e60012' }, wheel);
    S('polygon', { points: pts([[330, 320], [386, 470], [440, 320], [410, 316], [386, 380], [362, 316]]), fill: o.paper }, g);
    S('polygon', { points: pts([[374, 330], [398, 330], [408, 520], [386, 560], [364, 520]]), fill: o.ink }, g);
    return { g, spin, eye };
  }

  function markPortrait(parent, o) {
    const P = [
      [[150, 70], [230, 52], [300, 80], [316, 150], [306, 230], [270, 280], [210, 292], [160, 260], [136, 190], [132, 120]],
      [[60, 420], [110, 320], [190, 290], [290, 286], [350, 320], [400, 420]],
      [[128, 128], [140, 80], [190, 50], [250, 44], [300, 62], [318, 96], [282, 84], [230, 82], [180, 96], [150, 140], [140, 170], [118, 160]],
    ];
    const g = S('g', {}, parent);
    addPolys(g, P, { fill: o.ink });
    S('polygon', { points: pts([[180, 214], [222, 202], [262, 212], [270, 228], [246, 220], [224, 224], [202, 220], [174, 230]]), fill: o.paper }, g);
    S('circle', { cx: 252, cy: 150, r: 19, fill: 'none', stroke: o.paper, 'stroke-width': 5 }, g);
    S('line', { x1: 268, y1: 160, x2: 300, y2: 300, stroke: o.paper, 'stroke-width': 2 }, g);
    S('polygon', { points: pts([[224, 300], [256, 300], [266, 420], [240, 440], [214, 420]]), fill: o.accent }, g);
    S('polygon', { points: pts([[190, 290], [240, 380], [290, 288], [270, 284], [240, 330], [210, 286]]), fill: o.paper }, g);
    S('polygon', { points: pts([[288, 226], [356, 214], [358, 226], [290, 240]]), fill: o.paper }, g);
    S('circle', { cx: 360, cy: 220, r: 6, fill: o.accent }, g);
    return g;
  }

  const MASK_HALF = [[0, -46], [-70, -78], [-190, -104], [-300, -100], [-380, -132], [-470, -236], [-452, -150],
    [-490, -120], [-430, -86], [-400, -30], [-340, 44], [-240, 88], [-140, 80], [-66, 40], [0, 62]];
  const EYE_HALF = [[-86, -22], [-156, -52], [-262, -44], [-300, -6], [-232, 26], [-128, 22]];
  function crewMask(parent, fill, eye) {
    const full = MASK_HALF.concat(MASK_HALF.slice(1, -1).reverse().map((p) => [-p[0], p[1]]));
    S('polygon', { points: pts(full), fill }, parent);
    S('polygon', { points: pts(EYE_HALF), fill: eye }, parent);
    S('polygon', { points: pts(EYE_HALF.map((p) => [-p[0], p[1]])), fill: eye }, parent);
  }

  window.HA = { magpie, warden, markPortrait, magpieParts, magpieArm, MAGPIE_MASK, MAGPIE_EYES,
    ARM_PIVOT, ARM_ANGLE, cutout, cutoutRig, crewMask };
})();
