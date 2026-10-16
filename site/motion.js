export const TIMING = Object.freeze({ dwell: 0, leave: 260, glanceHold: 180, turn: 130, eye: 0, color: 100, gestureAt: 140, gesture: 160, greetingEnd: 600, return: 240, switchColor: 180, touchHold: 1500 });
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = v => { const x = clamp(v); return x * x * (3 - 2 * x); };
const empty = () => ({ turn: 0, gesture: 0, settle: 0, color: 0, flourish: 0, nod: 0 });
const copy = value => ({ ...value });
export function isIntentionalTap(down, end) {
  return !!down && down.role>=0 && down.id===end.id && down.role===end.role && end.time-down.time<=700
    && Math.hypot(end.x-down.x,end.y-down.y)<=9 && Math.abs(end.scroll-down.scroll)<=5;
}

/** An interruptible, timestamp-driven performance. No DOM timers or queued greetings. */
export class PeopleMotion {
  constructor({ count = 5, reduced = false } = {}) {
    this.count = count; this.reduced = reduced; this.reset();
  }
  reset() {
    this.active = -1; this.hovered = -1; this.candidate = null; this.leaveAt = Infinity;
    this.releaseAt = Infinity; this.mode = 'hover'; this.last = 0;
    this.actors = Array.from({ length: this.count }, () => ({ value: empty(), mode: 'idle', start: 0, from: empty() }));
  }
  setReduced(value) { this.reduced = value; this.reset(); }
  hover(index, now) {
    this.tick(now);
    if (index === this.hovered) return;
    this.hovered = index;
    this.candidate = null;
    if (index >= 0 && index !== this.active) { this.activate(index, now, 'hover'); return; }
    if (index === this.active && index >= 0) {
      this.leaveAt = Infinity;
      if (this.mode === 'hover') this.releaseAt = Infinity;
    } else if (this.active >= 0 && this.mode === 'hover') {
      const actor=this.actors[this.active];
      // A fleeting pass still completes its greeting. A new person can interrupt immediately.
      const finishAt=actor.mode==='forward' ? actor.start + TIMING.greetingEnd + (this.active===4?80:0) + TIMING.glanceHold : 0;
      this.leaveAt=Math.max(now+TIMING.leave,finishAt);
    }
  }
  focus(index, now) { this.activate(index, now, 'focus'); }
  blur(now) { if (this.mode === 'focus') this.leaveAt = now + TIMING.leave; }
  tap(index, now) { this.activate(index, now, 'tap'); }
  activate(index, now, mode = 'hover') {
    if (index < 0 || index >= this.count) return;
    this.tick(now, false);
    this.candidate = null; this.leaveAt = Infinity;
    if (this.active === index) {
      if (mode === 'tap' && this.actors[index].mode === 'hold') {
        this.actors[index].replayAt = this.reduced ? null : now;
        this.releaseAt = now + TIMING.greetingEnd + TIMING.touchHold;
      }
      // A click while noticing/greeting never restarts or stacks the performance.
      if (mode !== 'hover') this.mode = mode;
      if (mode === 'tap' && !Number.isFinite(this.releaseAt)) this.releaseAt = now + TIMING.greetingEnd + TIMING.touchHold;
      if (mode === 'focus') this.releaseAt = Infinity;
      return;
    }
    if (this.active >= 0) this.startReturn(this.active, now, true);
    this.active = index; this.mode = mode;
    const actor = this.actors[index];
    if(actor.mode==='idle'&&!this.reduced) actor.value.color=.35;
    actor.from = copy(actor.value); actor.mode = 'forward'; actor.start = now; actor.replayAt = null;
    actor.automatic = mode === 'auto';
    this.releaseAt = mode === 'tap' ? now + TIMING.greetingEnd + (index === 4 ? 80 : 0) + TIMING.touchHold : Infinity;
    if (this.reduced) { actor.value = { ...empty(), color: 1 }; actor.mode = 'hold'; }
  }
  startReturn(index, now, switching = false) {
    const actor = this.actors[index]; actor.from = copy(actor.value); actor.start = now;
    actor.mode = 'return'; actor.switching = switching; actor.replayAt = null;
    if (this.reduced) { actor.value = empty(); actor.mode = 'idle'; }
  }
  dismiss(now) {
    this.tick(now, false);
    if (this.active >= 0) this.startReturn(this.active, now);
    this.active = -1; this.candidate = null; this.hovered = -1;
    this.leaveAt = Infinity; this.releaseAt = Infinity;
  }
  tick(now, processInput = true) {
    this.last = now;
    for (let i = 0; i < this.count; i++) {
      const actor = this.actors[i];
      if (actor.mode === 'forward') {
        const elapsed = now - actor.start;
        const turn = smooth(elapsed / (actor.automatic ? 130 : TIMING.turn));
        const color = smooth((elapsed - TIMING.eye) / (actor.automatic ? 100 : TIMING.color));
        const gesture = smooth((elapsed - TIMING.gestureAt - (i === 4 ? 80 : 0)) / TIMING.gesture);
        const wave = clamp((elapsed - 280) / 280);
        actor.value = {
          turn: actor.from.turn + (1 - actor.from.turn) * turn,
          color: actor.from.color + (1 - actor.from.color) * color,
          gesture: actor.from.gesture + (1 - actor.from.gesture) * gesture,
          settle: actor.from.settle + (1 - actor.from.settle) * smooth((elapsed - 440) / 160),
          flourish: wave > 0 && wave < 1 ? Math.sin(wave * Math.PI * 2) * Math.sin(wave * Math.PI) * (actor.automatic ? .12 : .35) : 0,
          nod: Math.sin(clamp((elapsed - 250) / 280) * Math.PI) * (actor.automatic ? .15 : .4),
        };
        if (elapsed >= TIMING.greetingEnd) { actor.mode = 'hold'; actor.value = { ...empty(), turn: 1, gesture: 1, settle: 1, color: 1 }; }
      } else if (actor.mode === 'return') {
        const elapsed = now - actor.start;
        const amount = 1 - smooth(elapsed / TIMING.return);
        actor.value = Object.fromEntries(Object.entries(actor.from).map(([key, value]) => [key, value * amount]));
        actor.value.color = actor.from.color * (1 - smooth(elapsed / (actor.switching ? TIMING.switchColor : 220)));
        if (elapsed >= TIMING.return) { actor.mode = 'idle'; actor.value = empty(); }
      } else if (actor.mode === 'hold' && actor.replayAt !== null && actor.replayAt !== undefined && !this.reduced) {
        const progress = clamp((now - actor.replayAt) / 640);
        actor.value.flourish = Math.sin(progress * Math.PI * 2) * Math.sin(progress * Math.PI);
        actor.value.nod = Math.sin(progress * Math.PI);
        if (progress === 1) actor.replayAt = null;
      }
    }
    if (processInput && this.candidate && now - this.candidate.since >= TIMING.dwell) {
      const { index } = this.candidate; this.activate(index, now, 'hover');
    }
    if (processInput && (now >= this.leaveAt || now >= this.releaseAt)) this.dismiss(now);
    return this.snapshot();
  }
  snapshot() {
    return { active: this.active, values: this.actors.map(a => copy(a.value)), phases: this.actors.map(a => a.mode) };
  }
  get moving() { return this.actors.some(a => a.mode === 'forward' || a.mode === 'return' || a.replayAt != null) || !!this.candidate || Number.isFinite(this.leaveAt) || Number.isFinite(this.releaseAt); }
}
