import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDisplayedNumbers, toArabicDigits } from '../src/js/numerals.js';
import { tipitakaLoader } from '../src/js/tipitaka-loader.js';

test('Thai numerals become ordinary digits without changing surrounding Thai text', () => {
  assert.equal(toArabicDigits('๐๑๒๓๔๕๖๗๘๙'), '0123456789');
  assert.equal(toArabicDigits('บทที่ ๑๕ / 45 • สวด ๑๐๘ จบ'), 'บทที่ 15 / 45 • สวด 108 จบ');
  assert.equal(toArabicDigits(140), '140');
  assert.equal(toArabicDigits(undefined), '');
});

test('display conversion changes captions and text while preserving option values and verse data', () => {
  const attributes = { title: 'สวด ๓ จบ', 'aria-label': 'หน้า ๑', value: 'raw-๓', 'data-text': 'สวด ๓ จบ' };
  const text = { nodeType: 3, nodeValue: 'สวด ๓ จบ' };
  const element = { nodeType: 1, tagName: 'OPTION', childNodes: [text], getAttribute: name => attributes[name] ?? null, setAttribute: (name, value) => { attributes[name] = value; } };
  formatDisplayedNumbers(element);
  assert.equal(text.nodeValue, 'สวด 3 จบ');
  assert.equal(attributes.title, 'สวด 3 จบ');
  assert.equal(attributes['aria-label'], 'หน้า 1');
  assert.equal(attributes.value, 'raw-๓');
  assert.equal(attributes['data-text'], 'สวด ๓ จบ');
});

test('volume search accepts both digit systems against the same source text', async () => {
  const initialCache = tipitakaLoader.indexCache;
  tipitakaLoader.indexCache = { volumes: [{ volume: 7, bookTitle: 'ข้อธรรม ๑๐๘ ประการ' }] };
  try {
    assert.equal((await tipitakaLoader.search('108')).length, 1);
    assert.equal((await tipitakaLoader.search('๑๐๘')).length, 1);
    assert.equal((await tipitakaLoader.search('๗')).length, 1);
  } finally {
    tipitakaLoader.indexCache = initialCache;
  }
});
