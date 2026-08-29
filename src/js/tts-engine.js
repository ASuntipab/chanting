/**
 * Tamma OS - Text-to-Speech (TTS) Buddhist Chanting Engine
 * Utilizes Web Speech API for 100% Offline, Native Thai Voice Synthesis
 * Features verse-by-verse sequential queue, karaoke highlighting & auto-scroll triggers
 */

export class DhammaTTSEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voice = null;
    this.rate = 0.85; // Default calm chanting cadence (0.6 - 1.5)
    this.pitch = 1.0;
    this.volume = 1.0;
    
    this.isPlaying = false;
    this.isPaused = false;
    this.queue = [];
    this.currentIndex = -1;
    this.currentUtterance = null;
    
    // Reading mode: 'both' (Pali + Thai), 'pali' (Pali only), 'thai' (Thai only)
    this.mode = 'both';

    // Callbacks
    this.onHighlight = null; // (chunkIndex, chunkData) => {}
    this.onStateChange = null; // (state: 'playing' | 'paused' | 'stopped') => {}
    this.onFinish = null; // () => {}
    this.onError = null; // (err) => {}

    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;
    this.findThaiVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.findThaiVoice();
    }
  }

  findThaiVoice() {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    const thaiVoices = voices.filter(v => v.lang && (v.lang.toLowerCase().includes('th-th') || v.lang.toLowerCase().startsWith('th')));
    
    if (thaiVoices.length > 0) {
      const preferred = thaiVoices.find(v => 
        v.name.includes('Siri') || 
        v.name.includes('Google') || 
        v.name.includes('Narisa') || 
        v.name.includes('Kanya') || 
        v.name.includes('Premium') ||
        v.name.includes('Natural')
      );
      this.voice = preferred || thaiVoices[0];
    }
    return this.voice;
  }

  prepareQueue(prayer) {
    this.stop();
    this.queue = [];
    this.currentIndex = -1;

    if (!prayer) return;

    const pages = prayer.pages || [];
    let chunkSeq = 0;

    pages.forEach((page, pageIndex) => {
      // 1. Verse Title
      if (page.verseTitle) {
        this.queue.push({
          id: 'tts-chunk-' + (chunkSeq++),
          pageIndex,
          type: 'title',
          text: this.cleanPaliForTTS(page.verseTitle),
          rawText: page.verseTitle,
          rate: Math.min(this.rate * 1.05, 1.1)
        });
      }

      // 2. Pali Verses
      if (page.pali && (this.mode === 'both' || this.mode === 'pali')) {
        const paliLines = page.pali.split('\n').filter(l => l.trim().length > 0);
        paliLines.forEach((line) => {
          const cleanText = this.cleanPaliForTTS(line);
          if (cleanText) {
            this.queue.push({
              id: 'tts-chunk-' + (chunkSeq++),
              pageIndex,
              type: 'pali',
              text: cleanText,
              rawText: line,
              rate: this.rate
            });
          }
        });
      }

      // 3. Thai Translation
      if (page.thai && (this.mode === 'both' || this.mode === 'thai')) {
        const thaiLines = page.thai.split('\n').filter(l => l.trim().length > 0);
        thaiLines.forEach((line) => {
          const cleanText = this.cleanThaiForTTS(line);
          if (cleanText) {
            this.queue.push({
              id: 'tts-chunk-' + (chunkSeq++),
              pageIndex,
              type: 'thai',
              text: cleanText,
              rawText: line,
              rate: Math.min(this.rate * 1.08, 1.15)
            });
          }
        });
      }

      // 4. Generic Content fallback
      if (!page.pali && !page.thai && page.content) {
        const contentLines = page.content.split('\n').filter(l => l.trim().length > 0);
        contentLines.forEach((line) => {
          const cleanText = this.cleanThaiForTTS(line);
          if (cleanText) {
            this.queue.push({
              id: 'tts-chunk-' + (chunkSeq++),
              pageIndex,
              type: 'thai',
              text: cleanText,
              rawText: line,
              rate: this.rate
            });
          }
        });
      }
    });
  }

  cleanPaliForTTS(text) {
    if (!text) return '';
    return text
      .replace(/\(กราบ\)/g, '')
      .replace(/\(สวด\s*[\d๑-๙]+\s*จบ.*?\)/g, '')
      .replace(/\(๓ จบ\)/g, 'สามจบ')
      .replace(/\(3 จบ\)/g, 'สามจบ')
      .replace(/\(๑ จบ\)/g, 'หนึ่งจบ')
      .replace(/[\(\)]/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  cleanThaiForTTS(text) {
    if (!text) return '';
    return text
      .replace(/\(กราบ\)/g, '')
      .replace(/[\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  play(startIndex = 0) {
    if (!this.synth) return;
    
    if (this.isPaused && this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
      this.isPaused = false;
      this.notifyState('playing');
      return;
    }

    if (this.queue.length === 0) return;

    if (startIndex >= 0 && startIndex < this.queue.length) {
      this.currentIndex = startIndex;
    } else if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) {
      this.currentIndex = 0;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.notifyState('playing');
    this.speakCurrentChunk();
  }

  speakCurrentChunk() {
    if (!this.synth || !this.isPlaying || this.currentIndex >= this.queue.length) {
      if (this.currentIndex >= this.queue.length && this.isPlaying) {
        this.finish();
      }
      return;
    }

    const chunk = this.queue[this.currentIndex];
    if (!chunk || !chunk.text) {
      this.currentIndex++;
      this.speakCurrentChunk();
      return;
    }

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    this.currentUtterance = utterance;

    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.lang = 'th-TH';
    utterance.rate = chunk.rate || this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    utterance.onstart = () => {
      if (!this.isPlaying) return;
      if (this.onHighlight) {
        this.onHighlight(this.currentIndex, chunk);
      }
    };

    utterance.onend = () => {
      if (!this.isPlaying || this.isPaused) return;
      this.currentIndex++;
      setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          this.speakCurrentChunk();
        }
      }, 350);
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('TTS Speech error:', e);
      if (this.onError) this.onError(e);
      if (this.isPlaying && !this.isPaused) {
        this.currentIndex++;
        this.speakCurrentChunk();
      }
    };

    if (this.synth.paused) {
      this.synth.resume();
    }

    this.synth.speak(utterance);
  }

  pause() {
    if (!this.synth || !this.isPlaying) return;
    this.synth.pause();
    this.isPlaying = false;
    this.isPaused = true;
    this.notifyState('paused');
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play(this.currentIndex >= 0 ? this.currentIndex : 0);
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = -1;
    this.currentUtterance = null;
    this.notifyState('stopped');
    if (this.onHighlight) {
      this.onHighlight(-1, null);
    }
  }

  finish() {
    this.stop();
    if (this.onFinish) {
      this.onFinish();
    }
  }

  setRate(newRate) {
    this.rate = Math.max(0.6, Math.min(1.5, parseFloat(newRate) || 0.85));
    if (this.isPlaying && this.currentIndex >= 0) {
      this.speakCurrentChunk();
    }
  }

  setMode(mode) {
    if (['both', 'pali', 'thai'].includes(mode)) {
      this.mode = mode;
    }
  }

  notifyState(state) {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }
}

export const ttsEngine = new DhammaTTSEngine();
