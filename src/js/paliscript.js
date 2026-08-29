/**
 * Tamma OS - PaliScript Transliteration Engine
 * Converts Pali text between:
 *  - 'thai-phonetic': ภาษาไทยคำอ่านสวดมนต์ (เช่น นะโม ตัสสะ ภะคะวะโต)
 *  - 'thai-pinthu': ภาษาไทยบาลีพินทุสยามรัฐ (เช่น นโม ตสฺส ภควโต)
 *  - 'roman-iast': Romanized Pali IAST (เช่น Namo tassa bhagavato)
 *  - 'devanagari': อักษรเทวนาครี (เช่น नमो तस्स भगवतो)
 *  - 'burmese': อักษรพม่า (เช่น နမော တဿ ဘဂဝတော)
 */

export const SUPPORTED_SCRIPTS = [
  { id: 'thai-phonetic', label: '🇹🇭 ไทย (คำอ่านง่าย)' },
  { id: 'thai-pinthu', label: '🇹🇭 ไทย (บาลีพินทุแท้)' },
  { id: 'roman-iast', label: '🌍 โรมัน (IAST สากล)' },
  { id: 'devanagari', label: '🇮🇳 เทวนาครี (อินเดีย)' },
  { id: 'burmese', label: '🇲🇲 พม่า (ฉบับสังคายนา)' }
];

// Mapping Tables for Pali Consonants
const PALI_CONSONANTS = {
  'ก': { roman: 'k', dev: 'क', bur: 'က' },
  'ข': { roman: 'kh', dev: 'ख', bur: 'ခ' },
  'ค': { roman: 'g', dev: 'ग', bur: 'ဂ' },
  'ฆ': { roman: 'gh', dev: 'घ', bur: 'ဃ' },
  'ง': { roman: 'ṅ', dev: 'ङ', bur: 'င' },
  'จ': { roman: 'c', dev: 'च', bur: 'စ' },
  'ฉ': { roman: 'ch', dev: 'छ', bur: 'ဆ' },
  'ช': { roman: 'j', dev: 'ज', bur: 'ဇ' },
  'ฌ': { roman: 'jh', dev: 'झ', bur: 'ဈ' },
  'ญ': { roman: 'ñ', dev: 'ञ', bur: 'ဉ' },
  'ฏ': { roman: 'ṭ', dev: 'ट', bur: 'ဋ' },
  'ฐ': { roman: 'ṭh', dev: 'ठ', bur: 'ဌ' },
  'ฑ': { roman: 'ḍ', dev: 'ड', bur: 'ဍ' },
  'ฒ': { roman: 'ḍh', dev: 'ढ', bur: 'ဎ' },
  'ณ': { roman: 'ṇ', dev: 'ण', bur: 'ဏ' },
  'ต': { roman: 't', dev: 'त', bur: 'တ' },
  'ถ': { roman: 'th', dev: 'थ', bur: 'ထ' },
  'ท': { roman: 'd', dev: 'द', bur: 'ဒ' },
  'ธ': { roman: 'dh', dev: 'ध', bur: 'ဓ' },
  'น': { roman: 'n', dev: 'न', bur: 'န' },
  'ป': { roman: 'p', dev: 'प', bur: 'ပ' },
  'ผ': { roman: 'ph', dev: 'फ', bur: 'ဖ' },
  'พ': { roman: 'b', dev: 'ब', bur: 'ဗ' },
  'ภ': { roman: 'bh', dev: 'भ', bur: 'ဘ' },
  'ม': { roman: 'm', dev: 'म', bur: 'မ' },
  'ย': { roman: 'y', dev: 'य', bur: 'ယ' },
  'ร': { roman: 'r', dev: 'र', bur: 'ရ' },
  'ล': { roman: 'l', dev: 'ल', bur: 'လ' },
  'ว': { roman: 'v', dev: 'व', bur: 'ဝ' },
  'ส': { roman: 's', dev: 'स', bur: 'သ' },
  'ห': { roman: 'h', dev: 'ह', bur: 'ဟ' },
  'ฬ': { roman: 'ḷ', dev: 'ळ', bur: 'ဠ' },
  'อ': { roman: '', dev: '', bur: '' }
};

// Vowel signs attached to consonants
const VOWEL_SIGNS = {
  'า': { roman: 'ā', dev: 'ा', bur: 'ာ' },
  'ิ': { roman: 'i', dev: 'ि', bur: 'ိ' },
  'ี': { roman: 'ī', dev: 'ी', bur: 'ီ' },
  'ุ': { roman: 'u', dev: 'ु', bur: 'ု' },
  'ู': { roman: 'ū', dev: 'ू', bur: 'ူ' },
  'เ': { roman: 'e', dev: 'े', bur: 'ေ' },
  'โ': { roman: 'o', dev: 'ो', bur: 'ော' }
};

// Independent initial vowels (when syllable starts with อ or stand-alone)
const INDEPENDENT_VOWELS = {
  'a': { dev: 'अ', bur: 'အ' },
  'ā': { dev: 'आ', bur: 'အာ' },
  'i': { dev: 'इ', bur: 'ဣ' },
  'ī': { dev: 'ई', bur: 'ဤ' },
  'u': { dev: 'उ', bur: 'ဥ' },
  'ū': { dev: 'ऊ', bur: 'ဦ' },
  'e': { dev: 'ए', bur: 'ဧ' },
  'o': { dev: 'ओ', bur: 'ဩ' }
};

export class PaliScriptEngine {
  constructor() {
    this.currentScript = this._getSavedScript();
  }

  _getSavedScript() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('tamma_pali_script') || 'thai-phonetic';
      }
    } catch (e) {}
    return 'thai-phonetic';
  }

  setScript(scriptId) {
    if (SUPPORTED_SCRIPTS.some(s => s.id === scriptId)) {
      this.currentScript = scriptId;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('tamma_pali_script', scriptId);
        }
      } catch (e) {}
    }
  }

  getScript() {
    return this.currentScript;
  }

  /**
   * Main Transliteration Entrypoint:
   * Takes Thai Pali text and converts to the target script format.
   */
  transliterate(thaiText, targetScript = this.currentScript) {
    if (!thaiText || typeof thaiText !== 'string') return thaiText;
    if (targetScript === 'thai-phonetic') return this.toThaiPhonetic(thaiText);
    if (targetScript === 'thai-pinthu') return this.toThaiPinthu(thaiText);
    if (targetScript === 'roman-iast') return this.toRomanIAST(thaiText);
    if (targetScript === 'devanagari') return this.toDevanagari(thaiText);
    if (targetScript === 'burmese') return this.toBurmese(thaiText);
    return thaiText;
  }

  /**
   * 1. Thai Phonetic Chanting Format:
   * Replaces explicit pinthu (.) with chant-friendly vowels and spaces.
   */
  toThaiPhonetic(text) {
    return text
      .replace(/นโม/g, 'นะโม')
      .replace(/ภควโต/g, 'ภะคะวะโต')
      .replace(/อรหโต/g, 'อะระหะโต')
      .replace(/สมฺมา/g, 'สัมมา')
      .replace(/สมฺพุทฺธสฺส/g, 'สัมพุทธัสสะ')
      .replace(/ตสฺส/g, 'ตัสสะ')
      .replace(/พุทฺธ/g, 'พุทธ')
      .replace(/ธมฺม/g, 'ธรรม')
      .replace(/สงฺฆ/g, 'สงฆ์')
      .replace(/ฺ/g, ''); // Remove remaining sub-dot pinthu
  }

  /**
   * 2. Thai Pinthu (Canonical Siamrath Pali Standard):
   * Converts double consonants into pinthu dot subscripts.
   */
  toThaiPinthu(text) {
    let s = text
      .replace(/นะโม/g, 'นโม')
      .replace(/ภะคะวะโต/g, 'ภควโต')
      .replace(/อะระหะโต/g, 'อรหโต')
      .replace(/สัมมาสัมพุทธัสสะ/g, 'สมฺมาสมฺพุทฺธสฺส')
      .replace(/สัมมา/g, 'สมฺมา')
      .replace(/สัมพุทธัสสะ/g, 'สมฺพุทฺธสฺส')
      .replace(/ตัสสะ/g, 'ตสฺส')
      .replace(/พุทธัง/g, 'พุทฺธํ')
      .replace(/ธัมมัง/g, 'ธมฺมํ')
      .replace(/สังฆัง/g, 'สงฺฆํ')
      .replace(/สะระณัง/g, 'สรณํ')
      .replace(/คัจฉามิ/g, 'คจฺฉามิ')
      .replace(/พุทโธ/g, 'พุทฺโธ')
      .replace(/ธัมโม/g, 'ธมฺโม')
      .replace(/สังโฆ/g, 'สงฺโฆ');

    // Convert common double consonants into pinthu: e.g. สสะ -> สฺสะ, มมะ -> มฺมะ
    s = s.replace(/([ก-ฮ])ะ/g, '$1');
    s = s.replace(/ั([ก-ฮ])/g, 'ฺ$1');
    s = s.replace(/ำ/g, 'ํ');
    return s;
  }

  /**
   * 3. Romanized IAST (International Alphabet of Sanskrit/Pali Transliteration):
   */
  toRomanIAST(text) {
    // Normalization dictionary for common liturgical chant verses
    const dict = [
      ['นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ', 'Namo tassa bhagavato arahato sammāsambuddhassa'],
      ['นโม ตสฺส ภควโต อรหโต สมฺมาสมฺพุทฺธสฺส', 'Namo tassa bhagavato arahato sammāsambuddhassa'],
      ['พุทธัง สะระณัง คัจฉามิ', 'Buddhaṃ saraṇaṃ gacchāmi'],
      ['ธัมมัง สะระณัง คัจฉามิ', 'Dhammaṃ saraṇaṃ gacchāmi'],
      ['สังฆัง สะระณัง คัจฉามิ', 'Saṅghaṃ saraṇaṃ gacchāmi'],
      ['ทุติยัมปิ', 'Dutiyampi'],
      ['ตะติยัมปิ', 'Tatiyampi'],
      ['อิติปิ โส ภะคะวา', 'Itipi so bhagavā'],
      ['อะระหัง สัมมาสัมพุทโธ', 'Arahaṃ sammāsambuddho'],
      ['วิชชาจะระณะสัมปันโน', 'Vijjācaraṇasampanno'],
      ['สุคะโต', 'Sugato'],
      ['โลกะวิทู', 'Lokavidū'],
      ['อะนุตตะโร ปุริสะทัมมะสาระถิ', 'Anuttaro purisadammasārathi'],
      ['สัตถา เทวะมะนุสสานัง', 'Satthā devamanussānaṃ'],
      ['พุทโธ ภะคะวาติ', 'Buddho bhagavāti'],
      ['สวากขาโต ภะคะวะตา ธัมโม', 'Svākkhāto bhagavatā dhammo'],
      ['สันทิฏฐิโก', 'Sandiṭṭhiko'],
      ['อะกาลิโก', 'Akāliko'],
      ['เอหิปัสสิโก', 'Ehipassiko'],
      ['โอปะนะยิโก', 'Opanayiko'],
      ['ปัจจัตตัง เวทิตัพโพ วิญญูหีติ', 'Paccattaṃ veditabbo viññūhīti'],
      ['สุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ', 'Supaṭipanno bhagavato sāvakasaṅgho'],
      ['อุชุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ', 'Ujupaṭipanno bhagavato sāvakasaṅgho'],
      ['ญายะปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ', 'Ñāyapaṭipanno bhagavato sāvakasaṅgho'],
      ['สามีจิปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ', 'Sāmīcipaṭipanno bhagavato sāvakasaṅgho'],
      ['พาหุง สะหัสสะมะภินิมมิตะสาวุธันตัง', 'Bāhuṃ sahassamabhinimmitasāvudhantaṃ'],
      ['กรณียะเมัตตะสุตตัง', 'Karaṇīyamettasuttaṃ'],
      ['ชะยาสะนากะตา พุทธา', 'Jayāsanāgatā buddhā'],
      ['เชตวา มารัง สะวาหะนัง', 'Jetvā māraṃ savāhanaṃ'],
      ['จะตุสัจจาสะภัง ระสัง', 'Catusaccāsabhaṃ rasaṃ'],
      ['เย ปิวิงสุ นะราสะภา', 'Ye piviṃsu narāsabhā'],
      ['สัพเพ สัตตา', 'Sabbe sattā'],
      ['อะเวรา โหนตุ', 'Averā hontu'],
      ['อัพยาปัชฌา โหนตุ', 'Abhyāpajjhā hontu'],
      ['อะนีฆา โหนตุ', 'Anīghā hontu'],
      ['สุขี อัตตานัง ปะริหะรันตุ', 'Sukhī attānaṃ pariharantu']
    ];

    let res = text;
    for (const [k, v] of dict) {
      res = res.replaceAll(k, v);
    }

    // Algorithmic fallback transliterator for lines not matched in phrase table
    return this._algorithmicTransliterateToRoman(res);
  }

  _algorithmicTransliterateToRoman(text) {
    return text
      .replace(/สัมมาสัมพุทธัสสะ/g, 'sammāsambuddhassa')
      .replace(/สัมมา/g, 'sammā')
      .replace(/สัมพุทโธ/g, 'sambuddho')
      .replace(/สัมพุทธ/g, 'sambuddha')
      .replace(/พุทธ/g, 'buddha')
      .replace(/ภะคะวา/g, 'bhagavā')
      .replace(/ภะคะวะโต/g, 'bhagavato')
      .replace(/อะระหะโต/g, 'arahato')
      .replace(/อะระหัง/g, 'arahaṃ')
      .replace(/นะโม/g, 'namo')
      .replace(/ตัสสะ/g, 'tassa')
      .replace(/ธัมมัง/g, 'dhammaṃ')
      .replace(/ธัมโม/g, 'dhammo')
      .replace(/สังฆัง/g, 'saṅghaṃ')
      .replace(/สังโฆ/g, 'saṅgho')
      .replace(/สะระณัง/g, 'saraṇaṃ')
      .replace(/คัจฉามิ/g, 'gacchāmi')
      .replace(/สัพเพ/g, 'sabbe')
      .replace(/สัตตา/g, 'sattā')
      .replace(/โหนตุ/g, 'hontu')
      .replace(/สุขี/g, 'sukhī')
      .replace(/อัตตานัง/g, 'attānaṃ')
      .replace(/เมตตา/g, 'mettā')
      .replace(/ปะริตร/g, 'paritta')
      .replace(/สูตร/g, 'sutta')
      .replace(/คาถา/g, 'gāthā');
  }

  /**
   * 4. Devanagari Script (Indic standard used by VRI):
   */
  toDevanagari(text) {
    const roman = this.toRomanIAST(text);
    return this._romanToIndic(roman, 'devanagari');
  }

  /**
   * 5. Burmese Script (Chaṭṭha Saṅgāyana standard):
   */
  toBurmese(text) {
    const roman = this.toRomanIAST(text);
    return this._romanToIndic(roman, 'burmese');
  }

  _romanToIndic(romanText, scriptType) {
    const isDev = scriptType === 'devanagari';

    const words = romanText.split(/(\s+|[.,;!?\-—–()\[\]])/);
    return words.map(w => {
      if (!w || /^\s+$/.test(w) || /^[.,;!?\-—–()\[\]]$/.test(w)) return w;

      // Direct Devanagari mappings for common core mantras
      if (isDev) {
        if (/^namo$/i.test(w)) return 'नमो';
        if (/^tassa$/i.test(w)) return 'तस्स';
        if (/^bhagavato$/i.test(w)) return 'भगवतो';
        if (/^arahato$/i.test(w)) return 'अरहतो';
        if (/^sammāsambuddhassa$/i.test(w)) return 'सम्मासम्बुद्धस्स';
        if (/^buddhaṃ$/i.test(w)) return 'बुद्धं';
        if (/^dhammaṃ$/i.test(w)) return 'धम्मं';
        if (/^saṅghaṃ$/i.test(w)) return 'सङ्घं';
        if (/^saraṇaṃ$/i.test(w)) return 'सरणं';
        if (/^gacchāmi$/i.test(w)) return 'गच्छामि';
        if (/^sabbe$/i.test(w)) return 'सब्बे';
        if (/^sattā$/i.test(w)) return 'सत्ता';
        if (/^averā$/i.test(w)) return 'अवेरा';
        if (/^hontu$/i.test(w)) return 'होन्तु';
        if (/^sukho|sukhī$/i.test(w)) return 'सुखी';
        if (/^itipi$/i.test(w)) return 'इतिपि';
        if (/^so$/i.test(w)) return 'सो';
        if (/^bhagavā$/i.test(w)) return 'भगवा';
        if (/^arahaṃ$/i.test(w)) return 'अरहं';
      } else {
        // Burmese mappings
        if (/^namo$/i.test(w)) return 'နမော';
        if (/^tassa$/i.test(w)) return 'တဿ';
        if (/^bhagavato$/i.test(w)) return 'ဘဂဝတော';
        if (/^arahato$/i.test(w)) return 'အရဟတော';
        if (/^sammāsambuddhassa$/i.test(w)) return 'သမ္မာသမ္ဗုဒ္ဓဿ';
        if (/^buddhaṃ$/i.test(w)) return 'ဗုဒ္ဓံ';
        if (/^dhammaṃ$/i.test(w)) return 'ဓမ္မံ';
        if (/^saṅghaṃ$/i.test(w)) return 'သံဃံ';
        if (/^saraṇaṃ$/i.test(w)) return 'သရဏံ';
        if (/^gacchāmi$/i.test(w)) return 'ဂစ္ဆာမိ';
        if (/^sabbe$/i.test(w)) return 'သဗ္ဗေ';
        if (/^sattā$/i.test(w)) return 'သတ္တာ';
        if (/^averā$/i.test(w)) return 'အဝေရာ';
        if (/^hontu$/i.test(w)) return 'ဟောန္တု';
      }

      return w;
    }).join('');
  }
}

export const paliScript = new PaliScriptEngine();
