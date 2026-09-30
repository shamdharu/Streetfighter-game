'use strict';

/* ============================================================
 * Input — keyboard state with just-pressed buffering.
 * justPressed() values persist until endFrame() is called, so
 * presses made during hit-stop are consumed on the next frame
 * instead of being lost (keeps combat responsive).
 * ============================================================ */
class Input {
  constructor() {
    this.down = Object.create(null);
    this.pressed = Object.create(null);

    const BLOCKED = new Set([
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'
    ]);

    window.addEventListener('keydown', (e) => {
      if (BLOCKED.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.down[e.code] = true;
      this.pressed[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.down[e.code] = false;
    });

    // Losing focus should not leave keys stuck.
    window.addEventListener('blur', () => {
      this.down = Object.create(null);
    });
  }

  /** Held down? */
  isDown(...codes) {
    for (let i = 0; i < codes.length; i++) {
      if (this.down[codes[i]]) return true;
    }
    return false;
  }

  /** Pressed this frame (buffered until endFrame)? */
  justPressed(...codes) {
    for (let i = 0; i < codes.length; i++) {
      if (this.pressed[codes[i]]) return true;
    }
    return false;
  }

  /** Clear the pressed buffer. Call once per consumed frame. */
  endFrame() {
    this.pressed = Object.create(null);
  }

  /** Clear everything (used when changing game state). */
  clear() {
    this.down = Object.create(null);
    this.pressed = Object.create(null);
  }
}
