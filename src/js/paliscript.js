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
    this._initDictionary();
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

    s = s.replace(/([ก-ฮ])ะ/g, '$1');
    s = s.replace(/ั([ก-ฮ])/g, 'ฺ$1');
    s = s.replace(/ำ/g, 'ํ');
    return s;
  }

  _initDictionary() {
    this.phraseDict = [
      // 1. Ratanattaya Vandana & Namakara
      ['อะระหัง สัมมาสัมพุทโธ ภะคะวา, พุทธัง ภะคะวันตัง อะภิวาเทมิ.', 'Arahaṃ sammāsambuddho bhagavā, buddhaṃ bhagavantaṃ abhivādemi.'],
      ['อะระหัง สัมมาสัมพุทโธ ภะคะวา พุทธัง ภะคะวันตัง อะภิวาเทมิ', 'Arahaṃ sammāsambuddho bhagavā buddhaṃ bhagavantaṃ abhivādemi'],
      ['อรหํ สมฺมาสมฺพุทฺโธ ภควา, พุทฺธํ ภควนฺตํ อภิวาเทมิ.', 'Arahaṃ sammāsambuddho bhagavā, buddhaṃ bhagavantaṃ abhivādemi.'],
      ['สะวากขาโต ภะคะวะตา ธัมโม, ธัมมัง นะมัสสามิ.', 'Svākkhāto bhagavatā dhammo, dhammaṃ namassāmi.'],
      ['สวากขาโต ภะคะวะตา ธัมโม, ธัมมัง นะมัสสามิ.', 'Svākkhāto bhagavatā dhammo, dhammaṃ namassāmi.'],
      ['สฺวากฺขาโต ภควตา ธมฺโม, ธมฺมํ นมสฺสามิ.', 'Svākkhāto bhagavatā dhammo, dhammaṃ namassāmi.'],
      ['สุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ, สังฆัง นะมามิ.', 'Supaṭipanno bhagavato sāvakasaṅgho, saṅghaṃ namāmi.'],
      ['สุปฏิปนฺโน ภควโต สาวกสงฺโฆ, สงฺฆํ นมามิ.', 'Supaṭipanno bhagavato sāvakasaṅgho, saṅghaṃ namāmi.'],
      ['นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ', 'Namo tassa bhagavato arahato sammāsambuddhassa'],
      ['นโม ตสฺส ภควโต อรหโต สมฺมาสมฺพุทฺธสฺส', 'Namo tassa bhagavato arahato sammāsambuddhassa'],

      // 2. Traisarana
      ['พุทธัง สะระณัง คัจฉามิ', 'Buddhaṃ saraṇaṃ gacchāmi'],
      ['ธัมมัง สะระณัง คัจฉามิ', 'Dhammaṃ saraṇaṃ gacchāmi'],
      ['สังฆัง สะระณัง คัจฉามิ', 'Saṅghaṃ saraṇaṃ gacchāmi'],
      ['ทุติยัมปิ พุทธัง สะระณัง คัจฉามิ', 'Dutiyampi buddhaṃ saraṇaṃ gacchāmi'],
      ['ทุติยัมปิ ธัมมัง สะระณัง คัจฉามิ', 'Dutiyampi dhammaṃ saraṇaṃ gacchāmi'],
      ['ทุติยัมปิ สังฆัง สะระณัง คัจฉามิ', 'Dutiyampi saṅghaṃ saraṇaṃ gacchāmi'],
      ['ตะติยัมปิ พุทธัง สะระณัง คัจฉามิ', 'Tatiyampi buddhaṃ saraṇaṃ gacchāmi'],
      ['ตะติยัมปิ ธัมมัง สะระณัง คัจฉามิ', 'Tatiyampi dhammaṃ saraṇaṃ gacchāmi'],
      ['ตะติยัมปิ สังฆัง สะระณัง คัจฉามิ', 'Tatiyampi saṅghaṃ saraṇaṃ gacchāmi'],

      // 3. Buddhagun, Dhammagun, Sanghagun
      ['อิติปิ โส ภะคะวา อะระหัง สัมมาสัมพุทโธ', 'Itipi so bhagavā arahaṃ sammāsambuddho'],
      ['วิชชาจะระณะสัมปันโน สุคะโต โลกะวิทู', 'Vijjācaraṇasampanno sugato lokavidū'],
      ['อะนุตตะโร ปุริสะทัมมะสาระถิ สัตถา เทวะมะนุสสานัง พุทโธ ภะคะวาติ', 'Anuttaro purisadammasārathi satthā devamanussānaṃ buddho bhagavāti'],
      ['สวากขาโต ภะคะวะตา ธัมโม สันทิฏฐิโก อะกาลิโก', 'Svākkhāto bhagavatā dhammo sandiṭṭhiko akāliko'],
      ['เอหิปัสสิโก โอปะนะยิโก ปัจจัตตัง เวทิตัพโพ วิญญูหีติ', 'Ehipassiko opanayiko paccattaṃ veditabbo viññūhīti'],
      ['สุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ', 'Supaṭipanno bhagavato sāvakasaṅgho'],
      ['อุชุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ', 'Ujupaṭipanno bhagavato sāvakasaṅgho'],
      ['ญายะปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ', 'Ñāyapaṭipanno bhagavato sāvakasaṅgho'],
      ['สามีจิปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ', 'Sāmīcipaṭipanno bhagavato sāvakasaṅgho'],
      ['ยะทิทัง จัตตาริ ปุริสะยุคานิ อัฏฐะ ปุริสะปุคคะลา', 'Yadidaṃ cattāri purisayugāni aṭṭha purisapuggalā'],
      ['เอสะ ภะคะวะโต สาวะกะสังโฆ', 'Esa bhagavato sāvakasaṅgho'],
      ['อาหุเนยโย ปาหุเนยโย ทักขิเณยโย อัญชะลีกะระณีโย', 'Āhuneyyo pāhuneyyo dakkhiṇeyyo añjalīkaraṇīyo'],
      ['อะนุตตะรัง ปุญญักเขตตัง โลกัสสาติ', 'Anuttaraṃ puññakkhettaṃ lokassāti'],

      // Actions / Parenthetical notations
      ['(กราบ)', '(Vandāmi)'],
      ['(กราบ ๓ หน)', '(Vandāmi 3 times)'],
      ['(กราบ 3 หน)', '(Vandāmi 3 times)'],
      ['(กราบ ๓ ครั้ง)', '(Vandāmi 3 times)'],
      ['(กราบ 3 ครั้ง)', '(Vandāmi 3 times)']
    ];

    this.wordDict = [
      ['อะระหัง', 'arahaṃ'],
      ['สัมมาสัมพุทโธ', 'sammāsambuddho'],
      ['สัมมาสัมพุทธัสสะ', 'sammāsambuddhassa'],
      ['สัมมา', 'sammā'],
      ['สัมพุทธัสสะ', 'sambuddhassa'],
      ['สัมพุทโธ', 'sambuddho'],
      ['สัมพุทธ', 'sambuddha'],
      ['พุทธัง', 'buddhaṃ'],
      ['พุทโธ', 'buddho'],
      ['พุทธัสสะ', 'buddhassa'],
      ['พุทธา', 'buddhā'],
      ['พุทธานัง', 'buddhānaṃ'],
      ['พุทธ', 'buddha'],
      ['ภะคะวันตัง', 'bhagavantaṃ'],
      ['ภะคะวา', 'bhagavā'],
      ['ภะคะวะโต', 'bhagavato'],
      ['ภะคะวะตา', 'bhagavatā'],
      ['ภะคะวาติ', 'bhagavāti'],
      ['อะภิวาเทมิ', 'abhivādemi'],
      ['ธัมมัง', 'dhammaṃ'],
      ['ธัมโม', 'dhammo'],
      ['ธัมมัสสะ', 'dhammassa'],
      ['ธัมมา', 'dhammā'],
      ['นะมัสสามิ', 'namassāmi'],
      ['นะมามิ', 'namāmi'],
      ['สะวากขาโต', 'svākkhāto'],
      ['สวากขาโต', 'svākkhāto'],
      ['สังฆัง', 'saṅghaṃ'],
      ['สังโฆ', 'saṅgho'],
      ['สาวะกะสังโฆ', 'sāvakasaṅgho'],
      ['สาวะกานัง', 'sāvakānaṃ'],
      ['สุปะฏิปันโน', 'supaṭipanno'],
      ['อุชุปะฏิปันโน', 'ujupaṭipanno'],
      ['ญายะปะฏิปันโน', 'ñāyapaṭipanno'],
      ['สามีจิปะฏิปันโน', 'sāmīcipaṭipanno'],
      ['สะระณัง', 'saraṇaṃ'],
      ['คัจฉามิ', 'gacchāmi'],
      ['สันทิฏฐิโก', 'sandiṭṭhiko'],
      ['อะกาลิโก', 'akāliko'],
      ['เอหิปัสสิโก', 'ehipassiko'],
      ['โอปะนะยิโก', 'opanayiko'],
      ['ปัจจัตตัง', 'paccattaṃ'],
      ['เวทิตัพโพ', 'veditabbo'],
      ['วิญญูหีติ', 'viññūhīti'],
      ['วิชชาจะระณะสัมปันโน', 'vijjācaraṇasampanno'],
      ['สุคะโต', 'sugato'],
      ['โลกะวิทู', 'lokavidū'],
      ['อะนุตตะโร', 'anuttaro'],
      ['ปุริสะทัมมะสาระถิ', 'purisadammasārathi'],
      ['สัตถา', 'satthā'],
      ['เทวะมะนุสสานัง', 'devamanussānaṃ'],
      ['เทวะตา', 'devatā'],
      ['มะนุสสานัง', 'manussānaṃ'],
      ['ชินะบัญชะระ', 'jinapañjara'],
      ['ชินบัญชร', 'jinapañjara'],
      ['พาหุง', 'bāhuṃ'],
      ['สะหัสสะมะภินิมมิตะสาวุธันตัง', 'sahassamabhinimmitasāvudhantaṃ'],
      ['คิรีเมขะลัง', 'girimekhalaṃ'],
      ['อุทิตะโฆระสะเสนะมารัง', 'uditakhorasasenamāraṃ'],
      ['ทานาทิธัมมะวิธินา', 'dānādidhammavidhinā'],
      ['ชิตะวา', 'jitvā'],
      ['มุนินโท', 'munindo'],
      ['ตันเตชะสา', 'tantejasā'],
      ['ภะวะตุ', 'bhavatu'],
      ['ชะยะมังคะลานิ', 'jayamangalāni'],
      ['ชะยะมังคะลัง', 'jayamangalaṃ'],
      ['สัพเพ', 'sabbe'],
      ['สัตตา', 'sattā'],
      ['อะเวรา', 'averā'],
      ['โหนตุ', 'hontu'],
      ['อัพยาปัชฌา', 'abyāpajjhā'],
      ['อะนีฆา', 'anīghā'],
      ['สุขี', 'sukhī'],
      ['อัตตานัง', 'attānaṃ'],
      ['ปะริหะรันตุ', 'pariharantu'],
      ['กัมมัสสะกา', 'kammassakā'],
      ['กัมมะทายาทา', 'kammadāyādā'],
      ['กัมมะโยนิ', 'kammayoni'],
      ['กัมมะพันธุ', 'kammabandhu'],
      ['กัมมะปะฏิสะระณา', 'kammapaṭisaraṇā'],
      ['ยัง', 'yaṃ'],
      ['กัมมัง', 'kammaṃ'],
      ['กะริสสันติ', 'karissanti'],
      ['กัลยาณัง', 'kalyāṇaṃ'],
      ['วา', 'vā'],
      ['ปาปะกัง', 'pāpakaṃ'],
      ['ตัสสะ', 'tassa'],
      ['ทายาทา', 'dāyādā'],
      ['ภะวิสสันติ', 'bhavissanti'],
      ['เต', 'te'],
      ['เม', 'me'],
      ['โส', 'so'],
      ['นะโม', 'namo'],
      ['อิติปิ', 'itipi']
    ];
  }

  /**
   * 3. Romanized IAST (International Alphabet of Sanskrit/Pali Transliteration):
   */
  toRomanIAST(text) {
    if (!text || typeof text !== 'string') return text;
    let res = text;

    // Phase 1: High-priority phrase replacements
    for (const [k, v] of this.phraseDict) {
      res = res.replaceAll(k, v);
    }

    // Phase 2: Word vocabulary replacements
    for (const [k, v] of this.wordDict) {
      res = res.replaceAll(k, v);
    }

    // Phase 3: Syllable-by-syllable fallback for any remaining Thai text
    if (/[ก-ฮ]/.test(res)) {
      res = this._syllablePaliToRoman(res);
    }

    // Phase 4: Sentence capitalization & formatting
    return this._formatSentenceCasing(res);
  }

  _syllablePaliToRoman(text) {
    // Map individual syllables & clusters
    return text
      // Vowels & diphthongs
      .replace(/เ([ก-ฮ])([า-ไ])/g, '$1$2')
      .replace(/โ([ก-ฮ])ะ/g, '$1o')
      .replace(/โ([ก-ฮ])/g, '$1o')
      .replace(/เ([ก-ฮ])ะ/g, '$1e')
      .replace(/เ([ก-ฮ])/g, '$1e')
      .replace(/แ([ก-ฮ])/g, '$1e')
      .replace(/([ก-ฮ])ั([ก-ฮ])/g, '$1a$2')
      .replace(/([ก-ฮ])ัง/g, '$1aṃ')
      .replace(/([ก-ฮ])ํ/g, '$1ṃ')
      .replace(/([ก-ฮ])า/g, '$1ā')
      .replace(/([ก-ฮ])ิ/g, '$1i')
      .replace(/([ก-ฮ])ี/g, '$1ī')
      .replace(/([ก-ฮ])ึ/g, '$1u')
      .replace(/([ก-ฮ])ื/g, '$1ū')
      .replace(/([ก-ฮ])ุ/g, '$1u')
      .replace(/([ก-ฮ])ู/g, '$1ū')
      .replace(/([ก-ฮ])ะ/g, '$1a')
      // Consonants with implicit 'a'
      .replace(/ก/g, 'ka')
      .replace(/ข/g, 'kha')
      .replace(/ค/g, 'ga')
      .replace(/ฆ/g, 'gha')
      .replace(/ง/g, 'ṅa')
      .replace(/จ/g, 'ca')
      .replace(/ฉ/g, 'cha')
      .replace(/ช/g, 'ja')
      .replace(/ฌ/g, 'jha')
      .replace(/ญ/g, 'ña')
      .replace(/ฏ/g, 'ṭa')
      .replace(/ฐ/g, 'ṭha')
      .replace(/ฑ/g, 'ḍa')
      .replace(/ฒ/g, 'ḍha')
      .replace(/ณ/g, 'ṇa')
      .replace(/ต/g, 'ta')
      .replace(/ถ/g, 'tha')
      .replace(/ท/g, 'da')
      .replace(/ธ/g, 'dha')
      .replace(/น/g, 'na')
      .replace(/บ/g, 'ba')
      .replace(/ป/g, 'pa')
      .replace(/ผ/g, 'pha')
      .replace(/ฝ/g, 'fa')
      .replace(/พ/g, 'ba')
      .replace(/ฟ/g, 'fa')
      .replace(/ภ/g, 'bha')
      .replace(/ม/g, 'ma')
      .replace(/ย/g, 'ya')
      .replace(/ร/g, 'ra')
      .replace(/ล/g, 'la')
      .replace(/ว/g, 'va')
      .replace(/ศ/g, 'sa')
      .replace(/ษ/g, 'sa')
      .replace(/ส/g, 'sa')
      .replace(/ห/g, 'ha')
      .replace(/ฬ/g, 'ḷa')
      .replace(/อ/g, 'a')
      .replace(/ฮ/g, 'ha')
      // Cleanup double 'aa' from implicit vowel merges
      .replace(/a([āīūeoiu])/g, '$1')
      .replace(/([āīūeoiu])a/g, '$1')
      .replace(/aa/g, 'ā');
  }

  _formatSentenceCasing(text) {
    const lines = text.split('\n');
    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      // Capitalize first letter of line
      return line.replace(/^([a-zāīūñṭḍṇḷ])/i, (m) => m.toUpperCase());
    }).join('\n');
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

