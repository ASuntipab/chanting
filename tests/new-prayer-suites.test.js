import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { WEALTH_FORTUNE_PRAYERS } from '../src/js/prayers-wealth-fortune.js';
import { SACRED_PROTECTION_PRAYERS } from '../src/js/prayers-sacred-protection.js';
import { ZODIAC_RELIC_PRAYERS } from '../src/js/prayers-zodiac-relics.js';
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';
import { mp3Player } from '../src/js/mp3-player.js';
import { DhammaTTSEngine } from '../src/js/tts-engine.js';

const SUITES = {
  WEALTH_FORTUNE_PRAYERS,
  SACRED_PROTECTION_PRAYERS,
  ZODIAC_RELIC_PRAYERS
};

test('New prayer suites (wealth, protection, zodiac relics)', async (t) => {
  await t.test('every prayer is well-formed with 1-indexed pages and chant text', () => {
    Object.entries(SUITES).forEach(([name, suite]) => {
      assert.ok(suite.length > 0, `${name} must not be empty`);
      suite.forEach(p => {
        assert.ok(p.id && p.title && p.category && p.author && p.description, `${p.id} missing metadata`);
        assert.strictEqual(p.status, 'approved');
        assert.ok(Array.isArray(p.pages) && p.pages.length > 0, `${p.id} must have pages`);
        p.pages.forEach((page, idx) => {
          assert.strictEqual(page.pageNumber, idx + 1, `${p.id} page numbering`);
          assert.ok(page.verseTitle, `${p.id} page ${idx + 1} verseTitle`);
          assert.ok(page.pali && page.pali.trim(), `${p.id} page ${idx + 1} pali`);
          assert.ok(page.thai && page.thai.trim(), `${p.id} page ${idx + 1} thai`);
        });
      });
    });
  });

  await t.test('DEFAULT_PRAYERS includes all new prayers with no duplicate IDs', () => {
    const ids = DEFAULT_PRAYERS.map(p => p.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'No duplicate IDs in DEFAULT_PRAYERS');
    Object.values(SUITES).flat().forEach(p => {
      assert.ok(ids.includes(p.id), `DEFAULT_PRAYERS must contain ${p.id}`);
    });
  });

  await t.test('wealth suite uses the โชคลาภ category', () => {
    WEALTH_FORTUNE_PRAYERS.forEach(p => assert.strictEqual(p.category, 'โชคลาภ', p.id));
  });

  await t.test('zodiac suite covers all 12 years exactly once', () => {
    const years = ['ชวด', 'ฉลู', 'ขาล', 'เถาะ', 'มะโรง', 'มะเส็ง', 'มะเมีย', 'มะแม', 'วอก', 'ระกา', 'จอ', 'กุน'];
    assert.strictEqual(ZODIAC_RELIC_PRAYERS.length, 12);
    years.forEach(y => {
      const matches = ZODIAC_RELIC_PRAYERS.filter(p => p.title.includes(`ปี${y} `) || p.title.includes(`ปี${y}(`));
      assert.strictEqual(matches.length, 1, `Exactly one relic prayer for ปี${y}`);
    });
    ZODIAC_RELIC_PRAYERS.forEach(p => assert.strictEqual(p.category, 'พระธาตุประจำปีเกิด', p.id));
  });

  await t.test('protection parittas that already had audio now link to their tracks', () => {
    const expected = {
      'katha-photibat': 'track-katha-photibat',
      'chaddanta-paritta': 'track-chaddanta-paritta',
      'mongkol-chakrawan-yai': 'track-mongkol-chakrawan-yai'
    };
    Object.entries(expected).forEach(([prayerId, trackId]) => {
      const prayer = SACRED_PROTECTION_PRAYERS.find(p => p.id === prayerId);
      assert.ok(prayer, `${prayerId} must exist`);
      assert.strictEqual(mp3Player.getTrackForPrayer(prayer)?.id, trackId, `${prayerId} audio link`);
    });
  });

  await t.test('TTS engine can queue every new prayer', () => {
    const tts = new DhammaTTSEngine();
    tts.setMode('both');
    Object.values(SUITES).flat().forEach(p => {
      tts.prepareQueue(p);
      assert.ok(tts.queue.length > 0, `Queue for ${p.id} must not be empty`);
    });
  });

  await t.test('category dropdown lists the new categories', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'tamma.html'), 'utf8');
    assert.ok(html.includes('value="โชคลาภ"'));
    assert.ok(html.includes('value="พระธาตุประจำปีเกิด"'));
  });
});
