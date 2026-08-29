/**
 * Tamma OS - Audio Synthesizer Engine (Web Audio API)
 * Generates realistic Tibetan Singing Bowl / Buddhist Temple Bell Chime
 * Zero external mp3 dependencies - 100% Mobile & Offline compatible
 */

class DhammaAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Plays a resonant Tibetan Singing Bowl / Bell chime
   * Frequencies: Base 432Hz (Sacred frequency) + Harmonics
   */
  playBell(freq = 432) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Master Gain for smooth decay
      const masterGain = this.ctx.createGain();
      masterGain.connect(this.ctx.destination);
      masterGain.gain.setValueAtTime(0.35, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      // Fundamental & Overtones frequencies for singing bowl
      const harmonics = [
        { ratio: 1.0, gain: 0.6 },
        { ratio: 2.76, gain: 0.3 },
        { ratio: 5.4, gain: 0.15 },
        { ratio: 8.9, gain: 0.05 }
      ];

      harmonics.forEach(h => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * h.ratio, now);
        
        g.gain.setValueAtTime(h.gain, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + (3.0 / Math.sqrt(h.ratio)));
        
        osc.connect(g);
        g.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 3.2);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  playTick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }
}

export const audio = new DhammaAudioEngine();
