/** Browser layout/focus events are not evidence that the visitor acted. */
export class IdleInput {
  constructor() {
    this.pointer = null;
    this.scrollUntil = -Infinity;
  }
  accept(event, now) {
    if (!event) return true; // Explicit keyboard focus or reset controls.
    if (event.isTrusted === false) return false;
    if (event.type === 'pointermove') {
      const previous = this.pointer;
      this.pointer = [event.clientX, event.clientY];
      if (previous && previous[0] === event.clientX && previous[1] === event.clientY) return false;
      // Browsers may report the initial pointer location without any movement.
      if (!previous && event.movementX === 0 && event.movementY === 0) return false;
    } else if (event.type === 'scroll') {
      // Keep counting momentum from a real gesture, but not initial anchor positioning.
      if (now > this.scrollUntil) return false;
    } else if (!['pointerdown', 'pointerup', 'pointercancel', 'keydown', 'wheel'].includes(event.type)) {
      return false;
    }
    this.scrollUntil = now + 500;
    return true;
  }
}
