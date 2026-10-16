export const IDLE_TIMING = Object.freeze({ first: 0, resume: 6000, step: 1200 });
export const IDLE_ORDER = Object.freeze([2, 4, 0]);

/** One deadline at a time: a delayed frame never queues missed greetings. */
export class IdleSequence {
  constructor() {
    this.enabled = false;
    this.started = false;
    this.cursor = 0;
    this.phase = 'paused';
    this.nextAt = Infinity;
  }
  setEnabled(enabled, now) {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    this.cursor = 0;
    this.phase = enabled ? 'waiting' : 'paused';
    this.nextAt = enabled ? now + (this.started ? IDLE_TIMING.resume : IDLE_TIMING.first) : Infinity;
  }
  activity(now) {
    this.cursor = 0;
    this.phase = this.enabled ? 'waiting' : 'paused';
    this.nextAt = this.enabled ? now + IDLE_TIMING.resume : Infinity;
  }
  tick(now) {
    if (!this.enabled || now < this.nextAt) return null;
    this.started = true;
    if (this.cursor === IDLE_ORDER.length) this.cursor = 0;
    const index = IDLE_ORDER[this.cursor++];
    this.phase = 'round';
    this.nextAt = now + IDLE_TIMING.step;
    return { type: 'wake', index };
  }
}
