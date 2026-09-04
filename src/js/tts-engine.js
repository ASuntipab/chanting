/**
 * Tamma OS - Text-to-Speech (TTS) Buddhist Chanting Engine
 * Utilizes Web Speech API for 100% Offline, Native Thai Voice Synthesis
 * Features verse-by-verse sequential queue, karaoke highlighting & auto-scroll triggers
 */

/**
 * Converts any integer (Thai or Arabic digits) into natural spoken Thai words.
 * Handles 1-99, hundreds, thousands, up to millions (e.g. 10 / ๑๐ -> 'สิบ').
 */
export function numberToThaiWords(numStr) {
  if (numStr === null || numStr === undefined) return '';
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

  const arabic = numStr.toString().replace(/[๐-๙]/g, d => '๐๑๒๓๔๕๖๗๘๙'.indexOf(d));
  const cleaned = arabic.replace(/^0+/, '') || '0';
  if (cleaned === '0') return 'ศูนย์';

  function convertChunk(chunkStr) {
    let res = '';
    const len = chunkStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(chunkStr[i], 10);
      const place = len - i - 1;
      if (digit === 0) continue;

      if (place === 1) {
        if (digit === 1) res += 'สิบ';
        else if (digit === 2) res += 'ยี่สิบ';
        else res += digits[digit] + 'สิบ';
      } else if (place === 0) {
        if (digit === 1 && len > 1 && chunkStr.slice(0, -1).split('').some(c => c !== '0')) {
          res += 'เอ็ด';
        } else {
          res += digits[digit];
        }
      } else {
        res += digits[digit] + places[place];
      }
    }
    return res;
  }

  if (cleaned.length <= 6) return convertChunk(cleaned);

  const millions = cleaned.slice(0, -6);
  const remainder = cleaned.slice(-6);
  return convertChunk(millions) + 'ล้าน' + convertChunk(remainder);
}

/**
 * Replaces all Thai and Arabic numerals in text with natural spoken Thai words.
 */
export function convertNumbersToThaiWords(text) {
  if (!text) return '';
  const normalized = text.replace(/([0-9๐-๙]),([0-9๐-๙])/g, '$1$2');
  return normalized.replace(/[0-9๐-๙]+/g, (match) => {
    return ' ' + numberToThaiWords(match) + ' ';
  });
}

/**
 * Parses Thai or Arabic number string into an integer.
 */
export function parseRepeatCount(str) {
  if (!str) return 1;
  const arabic = str.toString().replace(/[๐-๙]/g, d => '๐๑๒๓๔๕๖๗๘๙'.indexOf(d));
  const num = parseInt(arabic, 10);
  return isNaN(num) || num <= 0 ? 1 : num;
}

/**
 * Detects repetition patterns in chanting verses or instructions.
 * Supports:
 * - Suffix repeat: "นะโม ตัสสะ... (๓ จบ)" or "นำมอไต๋ซื้อ... (3 รอบ)"
 * - Namo instruction: "ท่อง  นโม 3 รอบ", "ตั้งนะโม ๓ จบ", "สวด นะโม 3 จบ"
 */
export function extractLineRepeats(line, isPali = true) {
  if (!line) return null;
  const trimmed = line.trim();

  // 1. Suffix repeat format: e.g. "นะโม ตัสสะ... (๓ จบ)" or "... (3 รอบ)"
  const suffixMatch = trimmed.match(/^(.*?)\s*[\(\[]\s*(?:สวด|ท่อง|ตั้ง|ว่า)?\s*([0-9๐-๙]+)\s*(?:จบ|รอบ)\s*[\)\]]\s*$/);
  if (suffixMatch && suffixMatch[1].trim().length > 0) {
    let count = parseRepeatCount(suffixMatch[2]);
    count = Math.min(count, 9);
    return {
      coreText: suffixMatch[1].trim(),
      count
    };
  }

  // 2. Namo instruction format: e.g. "ท่อง  นโม 3 รอบ" or "ตั้งนะโม ๓ จบ"
  const namoMatch = trimmed.match(/^[\(\[]?\s*(?:ให้)?(?:สวด|ท่อง|ตั้ง|ว่า)?\s*(?:นะโม|นโม)\s*([0-9๐-๙]+)\s*(?:จบ|รอบ)\s*[\)\]]?$/);
  if (namoMatch) {
    let count = parseRepeatCount(namoMatch[1]);
    count = Math.min(count, 9);
    const coreText = isPali
      ? 'นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ'
      : 'ขอนอบน้อมแด่พระผู้มีพระภาคเจ้า พระองค์นั้น ซึ่งเป็นผู้ไกลจากกิเลส ตรัสรู้ชอบได้โดยพระองค์เอง';
    return {
      coreText,
      count
    };
  }

  return null;
}

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
          const repeatInfo = extractLineRepeats(line, true);
          if (repeatInfo) {
            const cleanText = this.cleanPaliForTTS(repeatInfo.coreText);
            if (cleanText) {
              for (let r = 0; r < repeatInfo.count; r++) {
                this.queue.push({
                  id: 'tts-chunk-' + (chunkSeq++),
                  pageIndex,
                  type: 'pali',
                  text: cleanText,
                  rawText: line,
                  rate: this.rate,
                  repeatRound: r + 1,
                  totalRounds: repeatInfo.count
                });
              }
            }
          } else {
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
          }
        });
      }

      // 3. Thai Translation
      if (page.thai && (this.mode === 'both' || this.mode === 'thai')) {
        const thaiLines = page.thai.split('\n').filter(l => l.trim().length > 0);
        thaiLines.forEach((line) => {
          const repeatInfo = extractLineRepeats(line, false);
          if (repeatInfo) {
            const cleanText = this.cleanThaiForTTS(repeatInfo.coreText);
            if (cleanText) {
              for (let r = 0; r < repeatInfo.count; r++) {
                this.queue.push({
                  id: 'tts-chunk-' + (chunkSeq++),
                  pageIndex,
                  type: 'thai',
                  text: cleanText,
                  rawText: line,
                  rate: Math.min(this.rate * 1.08, 1.15),
                  repeatRound: r + 1,
                  totalRounds: repeatInfo.count
                });
              }
            }
          } else {
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
          }
        });
      }

      // 4. Generic Content fallback
      if (!page.pali && !page.thai && page.content) {
        const contentLines = page.content.split('\n').filter(l => l.trim().length > 0);
        contentLines.forEach((line) => {
          const repeatInfo = extractLineRepeats(line, true);
          if (repeatInfo) {
            const cleanText = this.cleanThaiForTTS(repeatInfo.coreText);
            if (cleanText) {
              for (let r = 0; r < repeatInfo.count; r++) {
                this.queue.push({
                  id: 'tts-chunk-' + (chunkSeq++),
                  pageIndex,
                  type: 'thai',
                  text: cleanText,
                  rawText: line,
                  rate: this.rate,
                  repeatRound: r + 1,
                  totalRounds: repeatInfo.count
                });
              }
            }
          } else {
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
          }
        });
      }
    });
  }

  /**
   * Normalizes Pali verses for accurate, natural Thai TTS pronunciation
   * Applies sacred chant phonetic dictionary, ligature decoding & syllable pacing
   */
  cleanPaliForTTS(text) {
    if (!text) return '';
    let res = text
      .replace(/\(กราบ\)/g, '')
      .replace(/\((?:สวด\s*)?([0-9๐-๙]+)\s*จบ.*?\)/g, (match, p1) => {
        return ' ' + numberToThaiWords(p1) + 'จบ ';
      })
      .replace(/\(๓ จบ\)/g, 'สามจบ')
      .replace(/\(3 จบ\)/g, 'สามจบ')
      .replace(/\(๑ จบ\)/g, 'หนึ่งจบ');

    // Convert number ranges (e.g., ๙-๑๐ -> ๙ ถึง ๑๐)
    res = res.replace(/([0-9๐-๙]+)\s*[-–—]\s*([0-9๐-๙]+)/g, '$1 ถึง $2');

    // Convert all remaining digits (both Thai and Arabic) to natural Thai words
    res = convertNumbersToThaiWords(res);

    res = res
      .replace(/[\(\),.\[\]:;—–]/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Decode special Pali ligatures
    res = res
      .replace(/พฺรหฺม|พ๎รัหม/g, 'พรม')
      .replace(/ชุตินฺธะโร/g, 'ชุตินทะโร')
      .replace(/สฺวา/g, 'สะหวา')
      .replace(/ตฺวา/g, 'ตะวา')
      .replace(/ภิกฺขุ/g, 'พิกขุ')
      .replace(/อัพ๎ยากะตา/g, 'อับพยากะตา')
      .replace(/สัก๎ยะ/g, 'สักกะยะ')
      .replace(/ฉัพ๎ยา/g, 'ฉับพยา')
      .replace(/\u0E3A/g, '')  // Strip remaining Pinthu ฺ
      .replace(/\u0E4E/g, '')  // Strip remaining Yamakkan ๎
      .replace(/รํสี/g, 'รังสี')
      .replace(/สํฆ/g, 'สังค')
      .replace(/\u0E4D/g, 'ัง'); // Decode Nikhahit ํ into ัง

    // 2. Apply comprehensive phonetic pronunciation dictionary
    for (const [pali, phonetic] of PALI_PHONETIC_ENTRIES) {
      if (res.includes(pali)) {
        res = res.replaceAll(pali, phonetic);
      }
    }

    return res.replace(/\s+/g, ' ').trim();
  }

  cleanThaiForTTS(text) {
    if (!text) return '';
    let res = text
      .replace(/\(กราบ\)/g, '')
      .replace(/\((?:สวด\s*)?([0-9๐-๙]+)\s*จบ.*?\)/g, (match, p1) => {
        return ' ' + numberToThaiWords(p1) + 'จบ ';
      });

    // Convert number ranges (e.g., ๙-๑๐ -> ๙ ถึง ๑๐)
    res = res.replace(/([0-9๐-๙]+)\s*[-–—]\s*([0-9๐-๙]+)/g, '$1 ถึง $2');

    // Convert all remaining digits (both Thai and Arabic) to natural Thai words
    res = convertNumbersToThaiWords(res);

    return res
      .replace(/[\(\),.\[\]:;—–]/g, ' ')
      .replace(/-/g, ' ')
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

  // พาหุงมหากา & ชัยมงคลคาถา
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

  // คำอาราธนาสมเด็จโต & เมตตามหานิยม
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
  'เมตตา': 'เมดตา',
  'คุณะณัง': 'คุนานัง',

  // มหาเมตตาใหญ่ (มหาเมตตาพรหมวิหาระภาวนา)
  'เอวัมเม สุตัง': 'เอวัมเม สุดตัง',
  'สาวัตถิยัง': 'สาวัดถิยัง',
  'เชตะวะเน': 'เชตะวะเน',
  'อะนาถะปิณฑิกัสสะ': 'อะนาถะ ปินทิกัดสะ',
  'ภิกขะโวติ': 'พิกขะโวติ',
  'ภะทันเตติ': 'พะทันเตติ',
  'ปัจจัสโสสุง': 'ปัดจัดโสสุง',
  'เอตะทะโวจะ': 'เอตะ ทะโวจะ',
  'เมตตายะ': 'เมดตายะ',
  'เจโตวิมุตติยา': 'เจโต วิมุดติยา',
  'อาเสวิตายะ': 'อาเสวิตายะ',
  'ภาวิตายะ': 'พาวิตายะ',
  'พะหุลีกะตายะ': 'พะหุ ลีกะตายะ',
  'ยานีกะตายะ': 'ยานีกะตายะ',
  'วัตถุกะตายะ': 'วัดถุกะตายะ',
  'อะนุฏฐิตายะ': 'อะนุดถิตายะ',
  'ปะริจิตายะ': 'ปะริจิตายะ',
  'สุสะมารัทธายะ': 'สุสะมารัดทายะ',
  'เอกาทะสานิสังสา': 'เอกาทะ สานิสังสา',
  'ปาฏิกังขา': 'ปาติกังขา',
  'เอกาทะสะ': 'เอกาทะสะ',
  'สุขัง สุปะติ': 'สุ ขัง สุ ปะ ติ',
  'สุขัง ปะฏิพุชฌะติ': 'สุ ขัง ปะ ติ พุด ชะ ติ',
  'นะ ปาปะกัง': 'นะ ปา ปะ กัง',
  'สุปินัง ปัสสะติ': 'สุ ปิ นัง ปัด สะ ติ',
  'ปิโย โหติ': 'ปิ โย โห ติ',
  'เทวะตา รักขันติ': 'เท วะ ตา รัก ขัน ติ',
  'สัตถัง วา': 'สัด ถัง วา',
  'สะมาธิยะติ': 'สะ มา ทิ ยะ ติ',
  'มุขะวัณโณ': 'มุ ขะ วัน โน',
  'วิปปะสีทะติ': 'วิบ ปะ สี ทะ ติ',
  'อะสัมมุฬโห': 'อะ สัม มุน โห',
  'อัปปะฏิวิชฌันโต': 'อับ ปะ ติ วิด ชัน โต',
  'พรัหมะโลกูปะโค': 'พรม มะ โล กู ปะ โค',
  'สัพเพ ปาณา': 'สับ เพ ปา นา',
  'สัพเพ ภูตา': 'สับ เพ พู ตา',
  'สัพเพ ปุคคะลา': 'สับ เพ ปุก คะ ลา',
  'สัพเพ อัตตะภาวะปะริยาปันนา': 'สับ เพ อัด ตะ พาวะ ปะ ริ ยา ปัน นา',
  'สัพพา อิตถิโย': 'สับ พา อิด ถิ โย',
  'สัพเพ ปุริสา': 'สับ เพ ปุ ริ สา',
  'สัพเพ อะริยา': 'สับ เพ อะ ริ ยา',
  'สัพเพ อะนะริยา': 'สับ เพ อะ นะ ริ ยา',
  'สัพเพ วินิปาติกา': 'สับ เพ วิ นิ ปา ติ กา',
  'ปุรัตถิมายะ ทิสายะ': 'ปุ รัด ถิ มา ยะ ทิ สา ยะ',
  'ปัจฉิมายะ ทิสายะ': 'ปัด ฉิ มา ยะ ทิ สา ยะ',
  'อุตตะรายะ ทิสายะ': 'อุด ตะ รา ยะ ทิ สา ยะ',
  'ทักขิณายะ ทิสายะ': 'ทัก ขิ นา ยะ ทิ สา ยะ',
  'ปุรัตถิมายะ อะนุทิสายะ': 'ปุ รัด ถิ มา ยะ อะ นุ ทิ สา ยะ',
  'ปัจฉิมายะ อะนุทิสายะ': 'ปัด ฉิ มา ยะ อะ นุ ทิ สา ยะ',
  'อุตตะรายะ อะนุทิสายะ': 'อุด ตะ รา ยะ อะ นุ ทิ สา ยะ',
  'ทักขิณายะ อะนุทิสายะ': 'ทัก ขิ นา ยะ อะ นุ ทิ สา ยะ',
  'เหฏฐิมายะ ทิสายะ': 'เหด ถิ มา ยะ ทิ สา ยะ',
  'อุปะริมายะ ทิสายะ': 'อุ ปะ ริ มา ยะ ทิ สา ยะ',

  // พระคาถามหาจักรพรรดิ (หลวงปู่ดู่)
  'พระพุทธะไตรรัตนะญาณ': 'พระ พุด ทะ ไตร รัด ตะ นะ ยาน',
  'มณีนพรัตน์': 'มะ นี นบ พะ รัด',
  'สีสะหัสสะ สุธรรมา': 'สี สะ หัด สะ สุ ทำ มา',
  'ยะ-ธา-พุท-โม-นะ': 'ยะ ธา พุด โม นะ',
  'อัคคีทานัง': 'อัก คี ทา นัง',
  'วะรังคันธัง': 'วะ รัง คัน ทัง',
  'สีวะลี จะมะหาเถรัง': 'สี วะ ลี จะ มะ หา เถ รัง',
  'อะหัง วันทามิ ทูระโต': 'อะ หัง วัน ทา มิ ทู ระ โต',
  'อะหัง วันทามิ ธาตุโย': 'อะ หัง วัน ทา มิ ทา ตุ โย',
  'อะหัง วันทามิ สัพพะโส': 'อะ หัง วัน ทา มิ สับ พะ โส',
  'พุทธะ ธัมมะ สังฆะ ปูเชมิ': 'พุด ทะ ทำ มะ สัง คะ ปู เช มิ',
  'พะลัปปัตตา': 'พะ ลับ ปัด ตา',
  'ปัจเจกานัญจะ': 'ปัด เจ กา นัน จะ',
  'อะระหันตานัญจะ': 'อะ ระ ขัน ตา นัน จะ',
  'เตเชนะ รักขัง พันธามิ': 'เต เช นะ รัก ขัง พัน ทา มิ',

  // บารมี ๓๐ ทัศ
  'ทานะปาระมี': 'ทา นะ ปา ระ มี',
  'ทานะอุปะปาระมี': 'ทา นะ อุ ปะ ปา ระ มี',
  'ทานะปะระมัตถะปาระมี': 'ทา นะ ปะ ระ มัด ถะ ปา ระ มี',
  'สีละปาระมี': 'สี ละ ปา ระ มี',
  'เนกขัมมะปาระมี': 'เนก ขัม มะ ปา ระ มี',
  'ปัญญาปาระมี': 'ปัน ยา ปา ระ มี',
  'วิริยะปาระมี': 'วิ ริ ยะ ปา ระ มี',
  'ขันตีปาระมี': 'ขัน ตี ปา ระ มี',
  'สัจจะปาระมี': 'สัด จะ ปา ระ มี',
  'อะธิฏฐานะปาระมี': 'อะ ติด ถา นะ ปา ระ มี',
  'เมตตาปาระมี': 'เมด ตา ปา ระ มี',
  'อุเปกขาปาระมี': 'อุ เปก ขา ปา ระ มี',

  // โมรปริตร & ขันธปริตร (หลวงปู่มั่น)
  'โมระปะริตตัง': 'โม ระ ปะ ริด ตัง',
  'อุเทตะยัญจักขุมา': 'อุ เท ตะ ยัน จัก ขุ มา',
  'เอกะราชา': 'เอ กะ รา ชา',
  'หะริสสะวัณโณ': 'หะ ริด สะ วัน โน',
  'ปะฐะวิปปะภาโส': 'ปะ ถะ วิบ ปะ พา โส',
  'ตัง ตัง นะมัสสามิ': 'ตัง ตัง นะ มัด สา มิ',
  'พ๎ราหมะณา': 'พราม มะ นา',
  'เวทะคุ สัพพะธัมเม': 'เว ทะ คุ สับ พะ ทำ เม',
  'นะโม เต นัตถุ': 'นะ โม เต นัด ถุ',
  'นะโม มุตตานัง': 'นะ โม มุด ตา นัง',
  'นะโม วิมุตติยา': 'นะ โม วิ มุด ติ ยา',
  'กัตวา โมโร วะระมะจารี': 'กัด ตะ วา โม โร วะ ระ มะ จา รี',
  'วิรูปักเขหิ': 'วิ รู ปัก เข หิ',
  'เอราปะเถหิ': 'เอ รา ปะ เถ หิ',
  'ฉัพ๎ยาปุตเตหิ': 'ฉับ พะ ยา ปุด เต หิ',
  'กัณหาโคตะมะเกหิ': 'กัน หา โค ตะ มะ เก หิ',
  'อปาทะเกหิ': 'อะ ปา ทะ เก หิ',
  'ทิปาทะเกหิ': 'ทิ ปา ทะ เก หิ',
  'จะตุปปาเทหิ': 'จะ ตุบ ปา เท หิ',
  'พะหุปปาเทหิ': 'พะ หุบ ปา เท หิ',
  'อปาทะโก': 'อะ ปา ทะ โก',
  'มา มัง หิงสิ': 'มา มัง หิง สิ',
  'กัตวา เม รักขัง': 'กัด ตะ วา เม รัก ขัง',

  // พระอภิธรรม ๗ คัมภีร์ & กรวดน้ำอิมินา
  'กุสะลา ธัมมา': 'กุ สะ ลา ทำ มา',
  'อะกุสะลา ธัมมา': 'อะ กุ สะ ลา ทำ มา',
  'อัพ๎ยากะตา ธัมมา': 'อับ พะ ยา กะ ตา ทำ มา',
  'ปัญจักขันธา': 'ปัน จัก ขัน ทา',
  'รูปักขันโธ': 'รู ปัก ขัน โท',
  'เวทะนากขันโธ': 'เว ทะ นาก ขัน โท',
  'สัญญากขันโธ': 'สัน ยาด ขัน โท',
  'สังขารักขันโธ': 'สัง ขา รัก ขัน โท',
  'วิญญาณักขันโธ': 'วิน ยา นัด ขัน โท',
  'สังคะโห อะสังคะโห': 'สัง คะ โห อะ สัง คะ โห',
  'ฉะ ปัญญัตติโย': 'ฉะ ปัน ยัด ติ โย',
  'ปุคคะโล อุปะลัพภะติ': 'ปุก คะ โล อุ ปะ ลับ พะ ติ',
  'สัจฉิกัตถะปะระมัตเถนาติ': 'สัด ฉิ กัด ถะ ปะ ระ มัด เถ นา ติ',
  'เหตุปัจจะโย': 'เห ตุ ปัด จะ โย',
  'อารัมมะณะปัจจะโย': 'อา รัม มะ นะ ปัด จะ โย',
  'อะธิปะติปัจจะโย': 'อะ ทิ ปะ ติ ปัด จะ โย',
  'อะนันตะระปัจจะโย': 'อะ นัน ตะ ระ ปัด จะ โย',
  'สะมะนันตะระปัจจะโย': 'สะ มะ นัน ตะ ระ ปัด จะ โย',
  'สะหะชาตะปัจจะโย': 'สะ หะ ชา ตะ ปัด จะ โย',
  'อัญญะมัญญะปัจจะโย': 'อัน ยะ มัน ยะ ปัด จะ โย',
  'นิสสะยะปัจจะโย': 'นิด สะ ยะ ปัด จะ โย',
  'อุปะนิสสะยะปัจจะโย': 'อุ ปะ นิด สะ ยะ ปัด จะ โย',
  'ปุเรชาตะปัจจะโย': 'ปุ เร ชา ตะ ปัด จะ โย',
  'ปัจฉาชาตะปัจจะโย': 'ปัด ฉา ชา ตะ ปัด จะ โย',
  'อาเสวะนะปัจจะโย': 'อา เส วะ นะ ปัด จะ โย',
  'กัมมะปัจจะโย': 'กำ มะ ปัด จะ โย',
  'วิปากะปัจจะโย': 'วิ ปา กะ ปัด จะ โย',
  'อาหาระปัจจะโย': 'อา หา ระ ปัด จะ โย',
  'อินทริยะปัจจะโย': 'อิน ทะ ริ ยะ ปัด จะ โย',
  'ฌานะปัจจะโย': 'ชา นะ ปัด จะ โย',
  'มัคคะปัจจะโย': 'มัก คะ ปัด จะ โย',
  'สัมปะยุตตะปัจจะโย': 'สัม ปะ ยุด ตะ ปัด จะ โย',
  'วิปปะยุตตะปัจจะโย': 'วิบ ปะ ยุด ตะ ปัด จะ โย',
  'อัตถิปัจจะโย': 'อัด ถิ ปัด จะ โย',
  'นัตถิปัจจะโย': 'นัด ถิ ปัด จะ โย',
  'วิคะตะปัจจะโย': 'วิ คะ ตะ ปัด จะ โย',
  'อะวิคะตะปัจจะโยติ': 'อะ วิ คะ ตะ ปัด จะ โย ติ',
  'อิมินา ปุญญะกัมเมนะ': 'อิ มิ นา ปุน ยะ กำ เม นะ',
  'อุปัชฌายา คุณุตตะรา': 'อุ ปัด ชา ยา คุ นุด ตะ รา',
  'อาจะริยูปะการา': 'อา จะ ริ ยู ปะ กา รา',
  'พ๎รัหมะมารา': 'พรม มะ มา รา',
  'มัชฌัตตา': 'มัด ชัด ตา',
  'ขิปปัง ปาเปถะ โว มะตัง': 'ขิบ ปัง ปา เป ถะ โว มะ ตัง',

  // บทสวดหลวงปู่ทวด & หลวงพ่อกวย & หลวงปู่ศุข
  'นะโม โพธิสัตโต': 'นะ โม โพ ทิ สัด โต',
  'อาคันติมายะ': 'อา คัน ติ มา ยะ',
  'อิติภะคะวา': 'อิ ติ พะ คะ วา',
  'ชุตินฺธะโร': 'ชุ ติน ทะ โร',
  'นะมะพะทะ': 'นะ มะ พะ ทะ',
  'จะภะกะสะ': 'จะ พะ กะ สะ',
  'มะอะอุ': 'มะ อะ อุ',
  'อิติสุคะโต': 'อิ ติ สุ คะ โต',

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


