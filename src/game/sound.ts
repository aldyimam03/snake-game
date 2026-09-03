/** Tiny WebAudio chip-tune synth. All calls are safe no-ops on failure. */

const MUTE_KEY = "serpentine.mute.v1";

type OscType = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      this.muted = false;
    }
  }

  /** Create / resume the context. Call from a user gesture. */
  ensure() {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      /* audio unavailable */
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  private tone(
    f0: number,
    f1: number,
    dur: number,
    type: OscType,
    gain: number,
    delay = 0,
  ) {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(30, f0), t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* ignore */
    }
  }

  eat() {
    this.tone(480, 740, 0.08, "square", 0.14);
    this.tone(740, 1020, 0.07, "square", 0.1, 0.055);
  }

  bonus() {
    const notes = [660, 880, 1174, 1568];
    notes.forEach((n, i) => this.tone(n, n * 1.02, 0.09, "square", 0.12, i * 0.06));
  }

  die() {
    this.tone(300, 52, 0.5, "sawtooth", 0.18);
    this.tone(180, 40, 0.62, "square", 0.1, 0.05);
  }

  turn() {
    this.tone(250, 250, 0.028, "triangle", 0.045);
  }

  ui() {
    this.tone(500, 640, 0.06, "square", 0.09);
  }

  count(go: boolean) {
    if (go) this.tone(880, 900, 0.16, "square", 0.15);
    else this.tone(440, 444, 0.08, "square", 0.11);
  }

  best() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => this.tone(n, n, 0.1, "triangle", 0.12, i * 0.07));
  }
}

export const sfx = new Sfx();
