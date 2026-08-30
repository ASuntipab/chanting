import test from 'node:test';
import assert from 'node:assert/strict';
import { paliScript, SUPPORTED_SCRIPTS } from '../src/js/paliscript.js';

test('PaliScript Transliteration Engine Verification', async (t) => {

  await t.test('Supported scripts registry contains all 5 liturgical writing systems', () => {
    assert.strictEqual(SUPPORTED_SCRIPTS.length, 5);
    const ids = SUPPORTED_SCRIPTS.map(s => s.id);
    assert.ok(ids.includes('thai-phonetic'));
    assert.ok(ids.includes('thai-pinthu'));
    assert.ok(ids.includes('roman-iast'));
    assert.ok(ids.includes('devanagari'));
    assert.ok(ids.includes('burmese'));
  });

  await t.test('Ratanattaya Vandana & Namakara transliterates into pure Roman IAST without stray Thai', () => {
    const rawPali = 'อะระหัง สัมมาสัมพุทโธ ภะคะวา, พุทธัง ภะคะวันตัง อะภิวาเทมิ. (กราบ)\nสะวากขาโต ภะคะวะตา ธัมโม, ธัมมัง นะมัสสามิ. (กราบ)\nสุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ, สังฆัง นะมามิ. (กราบ)\nนะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ';

    const roman = paliScript.toRomanIAST(rawPali);
    assert.ok(!roman.includes('ภะคะวันตัง'), 'Should not leave Thai text in Roman mode');
    assert.ok(!roman.includes('สะวากขาโต'), 'Should not leave Thai text in Roman mode');
    assert.ok(!roman.includes('นะมัสสามิ'), 'Should not leave Thai text in Roman mode');
    assert.ok(!roman.includes('นะมามิ'), 'Should not leave Thai text in Roman mode');
    
    assert.ok(roman.includes('Arahaṃ sammāsambuddho bhagavā, buddhaṃ bhagavantaṃ abhivādemi.'));
    assert.ok(roman.includes('Svākkhāto bhagavatā dhammo, dhammaṃ namassāmi.'));
    assert.ok(roman.includes('Supaṭipanno bhagavato sāvakasaṅgho, saṅghaṃ namāmi.'));
    assert.ok(roman.includes('Namo tassa bhagavato arahato sammāsambuddhassa'));
  });

  await t.test('Traisarana transliterates accurately across all 3 refuges', () => {
    const raw = 'พุทธัง สะระณัง คัจฉามิ\nธัมมัง สะระณัง คัจฉามิ\nสังฆัง สะระณัง คัจฉามิ';
    const roman = paliScript.toRomanIAST(raw);
    assert.strictEqual(
      roman,
      'Buddhaṃ saraṇaṃ gacchāmi\nDhammaṃ saraṇaṃ gacchāmi\nSaṅghaṃ saraṇaṃ gacchāmi'
    );
  });

  await t.test('Thai Pinthu canonical format converts double vowels and sounds with pinthu', () => {
    const phonetic = 'นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ';
    const pinthu = paliScript.toThaiPinthu(phonetic);
    assert.strictEqual(pinthu, 'นโม ตสฺส ภควโต อรหโต สมฺมาสมฺพุทฺธสฺส');
  });

  await t.test('Devanagari and Burmese scripts render core mantras correctly', () => {
    const text = 'นะโม ตัสสะ ภะคะวะโต';
    const dev = paliScript.toDevanagari(text);
    const bur = paliScript.toBurmese(text);
    assert.ok(dev.includes('नमो'), 'Devanagari should contain Namo');
    assert.ok(bur.includes('နမော'), 'Burmese should contain Namo');
  });
});
