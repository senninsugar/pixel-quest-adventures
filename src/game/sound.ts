export type SfxKind =
  | "slash"
  | "hit"
  | "hurt"
  | "pickup"
  | "chest"
  | "unlock"
  | "victory"
  | "gameover"
  | "talk";

class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    gainPeak: number,
    delay = 0,
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public play(kind: SfxKind) {
    if (this.muted) return;
    switch (kind) {
      case "slash":
        this.tone(540, 170, 0.09, "square", 0.08);
        break;
      case "hit":
        this.tone(240, 90, 0.11, "sawtooth", 0.1);
        break;
      case "hurt":
        this.tone(180, 70, 0.2, "sawtooth", 0.12);
        break;
      case "pickup":
        this.tone(587, 880, 0.09, "square", 0.07);
        this.tone(880, 1175, 0.1, "square", 0.07, 0.07);
        break;
      case "chest":
        this.tone(523, 523, 0.11, "square", 0.08, 0);
        this.tone(659, 659, 0.11, "square", 0.08, 0.1);
        this.tone(784, 784, 0.11, "square", 0.08, 0.2);
        this.tone(1046, 1046, 0.28, "triangle", 0.11, 0.3);
        break;
      case "unlock":
        this.tone(330, 440, 0.14, "triangle", 0.1, 0);
        this.tone(440, 660, 0.18, "triangle", 0.1, 0.12);
        this.tone(660, 880, 0.26, "square", 0.08, 0.26);
        break;
      case "victory":
        [523, 659, 784, 1046, 784, 1046].forEach((n, i) => {
          this.tone(n, n, i === 5 ? 0.45 : 0.13, "square", 0.08, i * 0.13);
        });
        break;
      case "gameover":
        [392, 349, 311, 261].forEach((n, i) => {
          this.tone(n, n * 0.96, 0.22, "sawtooth", 0.08, i * 0.2);
        });
        break;
      case "talk":
        this.tone(440, 520, 0.045, "square", 0.05);
        break;
    }
  }
}

export const sfx = new RetroSoundEngine();