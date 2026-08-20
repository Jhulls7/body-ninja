export class AudioEngine {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  unlock() {
    if (!this.enabled) return;
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") this.context.resume();
  }

  toggleMute() {
    this.enabled = !this.enabled;
    if (this.context) {
      if (this.enabled) this.context.resume();
      else this.context.suspend();
    }
    return !this.enabled;
  }

  tone(frequency, duration = 0.08, type = "sine", gain = 0.035, slide = 0) {
    if (!this.enabled) return;
    this.unlock();
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const volume = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + slide), now + duration);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(gain, now + 0.008);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(volume).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  slash(combo = 1) { this.tone(220 + combo * 16, 0.07, "sawtooth", 0.025, 260); }
  combo(combo) { this.tone(280 + combo * 18, 0.16, "triangle", 0.035, 420); }
  bomb() { this.tone(100, 0.28, "square", 0.05, -65); }
  countdown() { this.tone(520, 0.1, "square", 0.025, -160); }
  gameOver() { this.tone(180, 0.45, "sawtooth", 0.04, -100); }
}
