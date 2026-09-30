'use strict';

/* ============================================================
 * AudioSys — 100% original, procedurally generated sound effects
 * (WebAudio oscillators + noise). No sampled / copyrighted audio.
 * ============================================================ */
class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.noiseBuf = null;
  }

  /** Must be called after a user gesture (browser autoplay policy). */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }

    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.42;
    this.master.connect(this.ctx.destination);

    // Shared white-noise buffer for percussion / whooshes.
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  get on() { return this.enabled && this.ctx !== null; }

  _tone(f, f2, type, dur, vol, delay) {
    if (!this.on) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(Math.max(1, f), t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  _noise(dur, vol, f1, f2, type, delay) {
    if (!this.on) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filt = this.ctx.createBiquadFilter();
    filt.type = type || 'bandpass';
    filt.frequency.setValueAtTime(f1, t0);
    if (f2) filt.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.03);
  }

  /* ---- combat ---- */
  punch()   { this._noise(0.08, 0.22, 2400, 500); this._tone(190, 90, 'triangle', 0.06, 0.18); }
  kick()    { this._noise(0.11, 0.26, 1500, 280); this._tone(130, 55, 'square', 0.09, 0.2); }
  heavy()   { this._noise(0.15, 0.32, 1100, 180); this._tone(95, 40, 'square', 0.13, 0.28); }
  hit()     { this._tone(340, 70, 'square', 0.09, 0.26); this._noise(0.05, 0.18, 900); }
  hurt()    { this._tone(160, 70, 'sawtooth', 0.16, 0.26); this._noise(0.08, 0.16, 600, 200); }
  swing()   { this._noise(0.13, 0.18, 700, 3200); }
  special() { this._noise(0.3, 0.34, 400, 4000); this._tone(60, 30, 'sawtooth', 0.32, 0.3); this._tone(300, 900, 'sine', 0.2, 0.16, 0.05); }
  block()   { this._tone(700, 500, 'square', 0.07, 0.2); this._noise(0.05, 0.15, 3000); }

  /* ---- movement ---- */
  jump()  { this._tone(300, 760, 'square', 0.12, 0.15); }
  land()  { this._noise(0.07, 0.16, 320, null, 'lowpass'); }

  /* ---- weapons ---- */
  gun()   { this._noise(0.07, 0.4, 3200, 700, 'highpass'); this._tone(150, 45, 'square', 0.06, 0.24); }
  dry()   { this._tone(220, 180, 'square', 0.05, 0.14); }

  /* ---- pickups / ui ---- */
  pickup()     { this._tone(660, null, 'square', 0.07, 0.2); this._tone(990, null, 'square', 0.1, 0.2, 0.07); }
  powerup()    { this._tone(520, null, 'square', 0.07, 0.18); this._tone(660, null, 'square', 0.07, 0.18, 0.06); this._tone(880, null, 'square', 0.12, 0.18, 0.12); }
  combo(n)     { this._tone(900 + n * 40, 1400 + n * 40, 'square', 0.1, 0.18); }
  gate()       { this._tone(420, 640, 'triangle', 0.16, 0.2); }
  levelClear() { const b = [523, 659, 784, 1047]; b.forEach((f, i) => this._tone(f, null, 'square', 0.16, 0.2, i * 0.12)); }
  gameOver()   { const b = [392, 330, 262, 196]; b.forEach((f, i) => this._tone(f, f * 0.97, 'sawtooth', 0.24, 0.2, i * 0.18)); }

  /* ---- deaths (cartoon slide whistle) ---- */
  death() { this._tone(760, 170, 'sine', 0.34, 0.26); this._noise(0.06, 0.14, 1400); }
  bigDeath() { this._tone(980, 120, 'sine', 0.7, 0.3); this._noise(0.12, 0.2, 900, 200); this._tone(440, 60, 'square', 0.3, 0.18, 0.15); }

  /* ---- boss ---- */
  bossWarning() { this._tone(110, null, 'sawtooth', 0.28, 0.3); this._tone(110, null, 'sawtooth', 0.28, 0.3, 0.34); this._tone(82, null, 'sawtooth', 0.5, 0.3, 0.68); }
  roar()        { this._tone(90, 45, 'sawtooth', 0.5, 0.32); this._noise(0.4, 0.2, 500, 150); }
}
