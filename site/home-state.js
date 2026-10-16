export const clamp = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
export const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };

/** Scroll owns the entire scene after leaving the initial conversation. */
export function welcomeAt(progress) {
  const p = clamp(progress);
  const amount = smooth((p - .018) / .285);
  return { progress: p, amount, active: amount > .001 };
}

export function composeWelcome(snapshot, progress, reduced = false, gazeProgress = 1) {
  const group = welcomeAt(progress);
  if (!group.active) return { ...snapshot, group: 0 };
  const amount = group.amount;
  return {
    active: -1,
    group: amount,
    phases: snapshot.phases.map(() => amount >= .999 ? 'welcome' : 'joining'),
    values: snapshot.values.map((value, index) => {
      const gaze=smooth((clamp(gazeProgress)-index*.06)/.76);
      return {
      color: amount + value.color * (1 - amount),
      turn: reduced ? 0 : value.turn + (1-value.turn)*gaze,
      gesture: reduced ? 0 : value.gesture * (1 - gaze),
      settle: reduced ? 0 : value.settle * (1 - gaze),
      flourish: reduced ? 0 : value.flourish * (1 - gaze),
      nod: reduced ? 0 : value.nod * (1 - gaze),
    }; }),
  };
}

export function scrollFrame(progress, reduced = false) {
  const p = clamp(progress);
  return {
    titleOpacity: 1 - smooth((p - .1) / .5),
    titleY: reduced ? 0 : -p * 205,
    titleScale: reduced ? 1 : 1 - p * .08,
    sceneY: reduced ? 0 : -smooth(p) * 30,
    sceneScale: reduced ? 1 : 1 + smooth(p) * .028,
    noteOpacity: smooth((p - .54) / .28),
    hintOpacity: 1 - smooth(p / .2),
    decorationsOpacity: 1 - smooth((p - .58) / .42),
  };
}

export function foregroundFrame(key, progress, reduced = false) {
  const p = clamp(progress);
  const layers = {
    art: {x:-300, y:-620, rotation:-15, spin:-16, scale:.04},
    code: {x:320, y:-440, rotation:8, spin:12, scale:-.05},
    orbit: {x:440, y:-930, rotation:-12, spin:28, scale:.08},
    palette: {x:-65,y:-310,rotation:-12,spin:18,scale:-.06},
    map: {x:75,y:-280,rotation:10,spin:-18,scale:.04},
    plane: {x:-240,y:220,rotation:-13,spin:-12,scale:.04},
  };
  const layer = layers[key];
  if(!layer) throw new TypeError('Unknown foreground layer');
  return {
    x: reduced ? 0 : p * layer.x,
    y: reduced ? 0 : p * layer.y,
    rotation: layer.rotation + (reduced ? 0 : p * layer.spin),
    scale: 1 + (reduced ? 0 : p * layer.scale),
  };
}
