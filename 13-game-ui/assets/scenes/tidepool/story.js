(() => {
  const DUR = 18;
  const T = {
    clamPress: 13.0, tideIn: 13.12, tideInEnd: 13.82,
    bookIn: 13.62, tilesIn: 13.9, browse: [[14.7, 0], [15.85, 1], [17.0, 9]],
    tilePress: 18.15, reveal: 18.3, nameIn: 18.65, stamp: 19.0, statsIn: 19.15, note: 19.3,
    bookOut: 20.95, tideOut: 21.1, tideOutEnd: 21.85,
    hudIn: 3.75, tool: 4.95, pimIn: 5.3, pimType: 5.62, pimOut: 8.15,
    bite: 8.5, catchIn: 8.75, quip: 9.15, goal: 9.75, catchFly: 10.75, catchLand: 11.2,
    clamOpen: 11.6, appsIn: 12.02, appFocus: [[12.3, 1], [12.62, 0]],
  };
  const tb = (t) => (t < 6 ? t + DUR : t);

  function dayPhase(t) {
    const { easeInOut, lin } = M;
    if (t < 5.6) return 0;
    if (t < 8.6) return easeInOut(lin(t, 5.6, 8.6));
    if (t < 10.9) return 1;
    if (t < 12.8) return 1 + easeInOut(lin(t, 10.9, 12.8));
    if (t < 16.2) return 2;
    if (t < 17.2) return 2 * (1 - easeInOut(lin(t, 16.2, 17.2)));
    return 0;
  }
  const minutes = (t) => 16 * 60 + 50 + (M.clamp(t, 3, 14) - 3) * 12.5;
  const fmtClock = (m) => {
    const h = Math.floor(m / 60), mm = Math.floor(m % 60);
    return { hm: `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`, ap: h >= 12 ? 'pm' : 'am' };
  };
  const menuDepth = (t) => (t < 11.6 || t > 15 ? 0 : M.easeInOut(M.lin(t, 11.6, 12.1)));
  const bump = (t) => M.wobble(t - T.bite, 9, 26, 6) + M.wobble(t - T.catchIn, 4, 20, 5);

  window.STORY = { DUR, T, tb, dayPhase, minutes, fmtClock, menuDepth, bump };
})();
