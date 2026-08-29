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

  /**
   * Normalizes Pali verses for accurate, natural Thai TTS pronunciation
   * Applies sacred chant phonetic dictionary & syllable pacing
   */
  cleanPaliForTTS(text) {
    if (!text) return '';
    let res = text
      .replace(/\(กราบ\)/g, '')
      .replace(/\(สวด\s*[\d๑-๙]+\s*จบ.*?\)/g, '')
      .replace(/\(๓ จบ\)/g, 'สามจบ')
      .replace(/\(3 จบ\)/g, 'สามจบ')
      .replace(/\(๑ จบ\)/g, 'หนึ่งจบ')
      .replace(/[\(\),.]/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Apply phonetic pronunciation replacements
    for (const [pali, phonetic] of PALI_PHONETIC_ENTRIES) {
      if (res.includes(pali)) {
        res = res.replaceAll(pali, phonetic);
      }
    }

    return res.replace(/\s+/g, ' ').trim();
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

export const PALI_PHONETIC_MAP = {
  // รัตนตรัย & บทนำ
  'นะโม': 'นะโม',
  'ตัสสะ': 'ตัดสะ',
  'ภะคะวะโต': 'พะคะวะโต',
  'อะระหะโต': 'อะระหะโต',
  'สัมมาสัมพุทธัสสะ': 'สัมมา สัมพุดทัดสะ',
  'พุทธัง': 'พุดทัง',
  'ธัมมัง': 'ทำมัง',
  'สังฆัง': 'สังคัง',
  'สะระณัง': 'สะระนัง',
  'คัจฉามิ': 'คัดฉามิ',
  'ทุติยัมปิ': 'ทุติยัมปิ',
  'ตะติยัมปิ': 'ตะติยัมปิ',

  // พุทธคุณ ธรรมคุณ สังฆคุณ
  'อิติปิ โส': 'อิติปิ โส',
  'อิติปิโส': 'อิติปิ โส',
  'ภะคะวา': 'พะคะวา',
  'สัมมาสัมพุทโธ': 'สัมมา สัมพุดโท',
  'วิชชาจะระณะสัมปันโน': 'วิดชา จะระนะ สัมปันโน',
  'สุคะโต': 'สุคะโต',
  'โลกะวิทู': 'โลกะวิทู',
  'อะนุตตะโร': 'อะนุดตะโร',
  'ปุริสะทัมมะสาระถิ': 'ปุริสะ ทำมะ สาระถิ',
  'สัตถา': 'สัดถา',
  'เทวะมะนุสสานัง': 'เทวะ มะนุดสานัง',
  'พุทโธ': 'พุดโท',
  'ภะคะวาติ': 'พะคะวาติ',
  'สะวากขาโต': 'สะหวากขาโต',
  'สวากขาโต': 'สะหวากขาโต',
  'สันทิฏฐิโก': 'สันทิดถิโก',
  'อะกาลิโก': 'อะกาลิโก',
  'เอหิปัสสิโก': 'เอหิ ปัดสิโก',
  'โอปะนะยิโก': 'โอปะนะยิโก',
  'ปัจจัตตัง': 'ปัดจัดตัง',
  'เวทิตัพโพ': 'เวทิทับโพ',
  'วิญญูหีติ': 'วินยูฮีติ',
  'สุปะฏิปันโน': 'สุปะติปันโน',
  'อุชุปะฏิปันโน': 'อุดชุ ปะติปันโน',
  'ญายะปะฏิปันโน': 'ยายะ ปะติปันโน',
  'สามีจิปะฏิปันโน': 'สามีจิ ปะติปันโน',
  'สาวะกะสังโฆ': 'สาวะกะ สังโค',
  'ยะทิทัง': 'ยะทิทัง',
  'จัตตาริ': 'จัดตาริ',
  'ปุริสะยุคานิ': 'ปุริสะ ยุคานิ',
  'อัฏฐะ': 'อัดถะ',
  'ปุริสะปุคคะลา': 'ปุริสะ ปุกคะลา',
  'อาหุเนยโย': 'อาหุเนยโย',
  'ปาหุเนยโย': 'ปาหุเนยโย',
  'ทักขิเณยโย': 'ทักขิเนยโย',
  'อัญชะลีกะระณีโย': 'อันชะลี กะระนียโย',
  'อะนุตตะรัง': 'อะนุดตะรัง',
  'ปุญญักเขตตัง': 'ปุนยัก เขดตัง',
  'โลกัสสาติ': 'โลกัดสาติ',

  // พาหุงมหากา
  'พาหุง': 'พาหุง',
  'สะหัสสะมะภินิมมิตะสาวุธันตัง': 'สะหัดสะ มะพินิมมิตะ สาวุทันตัง',
  'ครีเมขะลัง': 'คีรี เมขะลัง',
  'อุทิตะโฆระสะเสนะมารัง': 'อุทิตะ โคระสะ เสนะมารัง',
  'ทานาทิธัมมะวิธินา': 'ทานาทิ ทำมะวิทินา',
  'ชิตะวา': 'ชิดตะวา',
  'มุนินโท': 'มุนินโท',
  'ตันเตชะสา': 'ตันเตชะสา',
  'ภะวะตุ': 'พะวะตุ',
  'ชะยะมังคะลานิ': 'ชะยะ มังคะลานิ',
  'มะหาการุณิโก': 'มะหา การุนิโก',
  'หิตายะ': 'หิตายะ',
  'สัพพะปาณินัง': 'สับพะ ปานินัง',
  'ปูเรตวา': 'ปูเรดตะวา',
  'ปาระมี': 'ปาระมี',
  'สัพพา': 'สับพา',
  'ปัตโต': 'ปัดโต',
  'สัมโพธิมุตตะมัง': 'สัมโพทิ มุดตะมัง',
  'สัจจะวัชเชนะ': 'สัดจะ วัดเชนะ',
  'ชะยะมังคะลัง': 'ชะยะ มังคะลัง',
  'ชะยันโต': 'ชะยันโต',
  'โพธิยา': 'โพทิยา',
  'นันทิวัฑฒะโน': 'นันทิ วัดทะโน',
  'ชะยัสสุ': 'ชะยัดสุ',
  'ชะยะมังคะเล': 'ชะยะ มังคะเล',
  'อะปะราชิตะปัลลังเก': 'อะปะราชิตะ ปันลังเก',
  'ปะฐะวิโปกขะเร': 'ปะถะวิ โปกขะเร',
  'อะภิเสเก': 'อะพิเสเก',
  'สัพพะพุทธานัง': 'สับพะ พุดทานัง',
  'อัคคัปปัตโต': 'อักคับ ปัดโต',

  // คาถาชินบัญชร
  'ชะยาสะนากะตา': 'ชะยาสะนา กะตา',
  'เชตวา': 'เชดตะวา',
  'สะวาหะนัง': 'สะวาหะนัง',
  'จะตุสัจจาสะภัง': 'จะตุ สัดจา สะพัง',
  'ปิวิงสุ': 'ปิวิงสุ',
  'นะราสะภา': 'นะราสะพา',
  'ตัณหังกะราทะโย': 'ตันหัง กะราทะโย',
  'อัฏฐะวีสะติ': 'อัดถะ วีสะติ',
  'สัพเพ': 'สับเพ',
  'ปะติฏฐิตา': 'ปะติดถิตา',
  'มัยหัง': 'ไมหัง',
  'มัตถะเก': 'มัดถะเก',
  'มุนิสสะรา': 'มุนิดสะรา',
  'สิเร': 'สิเร',
  'ปะติฏฐิโต': 'ปะติดถิโต',
  'ธัมโม': 'ทำโม',
  'ทะวิโลจะเน': 'ทะวิ โลจะเน',
  'สังโฆ': 'สังโค',
  'สัพพะคุณากะโร': 'สับพะ คุนากะโร',
  'อะนุรุทโธ': 'อะนุรุดโท',
  'สารีปุตโต': 'สารี ปุดโต',
  'จะทักขิเณ': 'จะ ทักขิเน',
  'จะ ทักขิเณ': 'จะ ทักขิเน',
  'โกณฑัญโญ': 'โกนทันโญ',
  'ปิฏฐิภาคัสมิง': 'ปิดถิ พาคัดสะมิง',
  'โมคคัลลาโน': 'โมกคัลลาโน',
  'จะ วามะเก': 'จะ วามะเก',
  'จะวามะเก': 'จะ วามะเก',
  'ทักขิเณ': 'ทักขิเน',
  'อานันทะราหุโล': 'อานันทะ ราหุโล',
  'กัสสะโป': 'กัดสะโป',
  'มะหานาโม': 'มะหานาโม',
  'วามะโสตะเก': 'วามะ โสดตะเก',
  'เกสันเต': 'เกสันเต',
  'สุริโย': 'สุริโย',
  'ปะภังกะโร': 'ปะพัง กะโร',
  'สิริสัมปันโน': 'สิริ สัมปันโน',
  'โสภิโต': 'โสพิโต',
  'มุนิปุงคะโว': 'มุนิ ปุงคะโว',
  'กุมาระกัสสะโป': 'กุมาระ กัดสะโป',
  'เถโร': 'เถโร',
  'จิตตะวาทะโก': 'จิดตะ วาทะโก',
  'จิตตะ วาทะโก': 'จิดตะ วาทะโก',
  'นิจจัง': 'นิดจัง',
  'ปะติฏฐาสิคุณากะโร': 'ปะติดถาสิ คุนากะโร',
  'คุณากะโร': 'คุนากะโร',
  'ปุณโณ': 'ปุนโน',
  'อังคุลิมาโล': 'อังคุลิ มาโล',
  'อุปาลี': 'อุปาลี',
  'สีวะลี': 'สีวะลี',
  'ปัญจะ': 'ปันจะ',
  'นะลาเฏ': 'นะลาเต',
  'ติละกา': 'ติละกา',
  'เสสาสีติ': 'เสสาสีติ',
  'มะหาเถรา': 'มะหาเถรา',
  'วิชิตา': 'วิชิตา',
  'ชินะสาวะกา': 'ชินะ สาวะกา',
  'เอเตสีติ': 'เอเตสีติ',
  'ชิตะวันโต': 'ชิตะวันโต',
  'ชิโนระสา': 'ชิโนระสา',
  'สีละเตเชนะ': 'สีละ เตเชนะ',
  'อังคะมังเคสุ': 'อังคะ มังเคสุ',
  'สัณฐิตา': 'สันทิตา',
  'ระตะนัง': 'ระตะนัง',
  'เมตตะสุตตะกัง': 'เมดตะ สุดตะกัง',
  'เมตตะ สุตตะกัง': 'เมดตะ สุดตะกัง',
  'ธะชัคคัง': 'ทะชักคัง',
  'ปัจฉะโต': 'ปัดฉะโต',
  'อังคุลิมาละกัง': 'อังคุลิ มาละกัง',
  'ขันธะโมระปะริตตัญจะ': 'ขันทะ โมระ ปะริดตันจะ',
  'อาฏานาฏิยะสุตตะกัง': 'อาตานาติยะ สุดตะกัง',
  'อาฏานาฏิยะ สุตตะกัง': 'อาตานาติยะ สุดตะกัง',
  'อากาสัฏฐัง': 'อากาสัดถัง',
  'ปาการะสัณฐิตา': 'ปาการะ สันทิตา',
  'นานาวะระสังยุตตา': 'นานาวะระ สังยุดตา',
  'สัตตัปปาการะลังกะตา': 'สัดตับ ปาการะ ลังกะตา',
  'สัตตัปปาการะ ลังกะตา': 'สัดตับ ปาการะ ลังกะตา',
  'วาตะปิตตาทิสัญชาตา': 'วาตะ ปิดตาทิ สันชาตา',
  'พาหิรัชฌัตตุปัททะวา': 'พาริด ชัดตุ ปัดทะวา',
  'อะนันตะชินะเตชะสา': 'อะนันตะ ชินะ เตชะสา',
  'อะนันตะชินะ เตชะสา': 'อะนันตะ ชินะ เตชะสา',
  'สะกิจเจนะ': 'สะกิดเจนะ',
  'สัมพุทธะปัญชะเร': 'สัมพุดทะ ปันชะเร',
  'ชินะปัญชะระมัชฌัมหิ': 'ชินะ ปันชะระ มัดชัมหิ',
  'มะฮีตะเล': 'มะฮีตะเล',
  'มะฮี ตะเล': 'มะฮีตะเล',
  'มะหาปุริสาสะภา': 'มะหา ปุริสา สะพา',
  'อิจเจวะมันโต': 'อิดเจวะ มันโต',
  'สุคุตโต': 'สุคุดโต',
  'สุรักโข': 'สุรักโข',
  'ชินานุภาเวนะ': 'ชินานุ พาเวนะ',
  'ชิตุปัททะโว': 'ชิตุ ปัดทะโว',
  'ธัมมานุภาเวนะ': 'ทำมานุ พาเวนะ',
  'ชิตาริสังโฆ': 'ชิตาริ สังโค',
  'สังฆานุภาเวนะ': 'สังคานุ พาเวนะ',
  'ชิตะอันตะราโย': 'ชิตะ อันตะราโย',
  'ชิตันตะราโย': 'ชิตัน ตะราโย',
  'สัทธัมมานุภาวะปาลิโต': 'สัดทำมานุ พาวะ ปาลีโต',
  'ชินะปัญชะเรติ': 'ชินะ ปันชะเรติ',
  'ชินะ ปัญชะเรติ': 'ชินะ ปันชะเรติ',

  // คำอาราธนาสมเด็จโต
  'ปุตตะกาโม': 'ปุดตะกาโม',
  'ละเภปุตตัง': 'ละเภ ปุดตัง',
  'ธะนะกาโม': 'ทะนะกาโม',
  'ละเภธะนัง': 'ละเภ ทะนัง',
  'อัตถิกาเย': 'อัดถิกาเย',
  'กายะญายะ': 'กายะยายะ',
  'สุตตวา': 'สุดตะวา',
  'สุตวา': 'สุดตะวา',
  'ยะมะราชาโน': 'ยะมะ ราชาโน',
  'ท้าวเวสสุวัณโณ': 'ท้าวเวส สุวันโน',
  'มะระณัง': 'มะระนัง',
  'มรณัง': 'มอระนัง',
  'นะโมพุทธายะ': 'นะโม พุดทายะ',
  'นะโม พุทธายะ': 'นะโม พุดทายะ',

  // เมตตามหานิยม
  'เมตตา': 'เมดตา',
  'คุณะณัง': 'คุนานัง',

  // แผ่เมตตา & กรวดน้ำ
  'นิททุกโข': 'นิดทุกโข',
  'อัพยาปัชโฌ': 'อับพะยา ปัดโช',
  'อัตตานัง': 'อัดตานัง',
  'ปะริหะรามิ': 'ปะริหะ รามิ',
  'สัตตา': 'สัดตา',
  'อัพยาปัชฌา': 'อับพะยา ปัดชา',
  'อะนีฆา': 'อะนีคา',
  'ปะริหะรันตุ': 'ปะริหะ รันตุ',
  'มาตาปิตูนัง': 'มาตา ปิตูนัง',
  'มาตาปิตะโร': 'มาตา ปิตะโร',
  'ญาตีนัง': 'ยาตีนัง',
  'ญาตะโย': 'ญาตะโย',
  'คุรูปัชฌายาจริยานัง': 'คุรูปัดชายา จะริยานัง',
  'คุรูปัชฌายาจริยา': 'คุรูปัดชายา จะริยา',
  'สัพพะเทวะตานัง': 'สับพะ เทวะตานัง',
  'สัพเพเทวา': 'สับเพเทวา',
  'สัพพะเปตานัง': 'สับพะ เปตานัง',
  'สัพเพเปตา': 'สับเพเปตา',
  'สัพพะเวรีนัง': 'สับพะ เวรีนัง',
  'สัพเพเวรี': 'สับเพเวรี',
  'สัพพะสัตตานัง': 'สับพะ สัดตานัง'
};

export const PALI_PHONETIC_ENTRIES = Object.entries(PALI_PHONETIC_MAP).sort((a, b) => b[0].length - a[0].length);

export const ttsEngine = new DhammaTTSEngine();

