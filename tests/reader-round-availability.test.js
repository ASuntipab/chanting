import test from 'node:test';
import assert from 'node:assert/strict';
import { ComicReaderEngine } from '../src/js/reader.js';
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';

test('a teacher name or a normal Itipiso verse does not enable the age counter', () => {
  for (const title of ['บทแผ่เมตตา หลวงพ่อจรัญ', 'อิติปิโส', 'พุทธคุณ']) {
    const reader = { currentPrayer: { title, pages: [{ verseTitle: 'อิติปิโส', pali: 'อิติปิ โส ภะคะวา' }] } };
    assert.equal(ComicReaderEngine.prototype.isItipisoChantAvailable.call(reader), false);
    assert.equal(ComicReaderEngine.prototype.isItipisoPage.call(reader, 0), false);
  }
});

test('the daily collection enables the counter only on its age repetition page', () => {
  const prayer = DEFAULT_PRAYERS.find(p => p.pages?.some(page => page.verseTitle?.includes('เท่าอายุ')));
  assert.ok(prayer);
  const reader = { currentPrayer: prayer };
  assert.equal(ComicReaderEngine.prototype.isItipisoChantAvailable.call(reader), true);
  for (let index = 0; index < prayer.pages.length; index++) {
    assert.equal(ComicReaderEngine.prototype.isItipisoPage.call(reader, index), prayer.pages[index].verseTitle.includes('เท่าอายุ'));
  }
});

test('age plus one instructions support Thai and Arabic numbers', () => {
  for (const title of ['สวดอิติปิโส อายุ + ๑ จบ', 'สวดอิติปิโส อายุ+1 จบ']) {
    assert.equal(ComicReaderEngine.prototype.isItipisoChantAvailable.call({ currentPrayer: { title } }), true);
  }
});
