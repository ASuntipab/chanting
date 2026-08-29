import test from 'node:test';
import assert from 'node:assert/strict';
import { DhammaTTSEngine } from '../src/js/tts-engine.js';
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';

test('TTS Engine: Pali and Thai text normalization for speech synthesis', () => {
  const engine = new DhammaTTSEngine();
  const rawPali = 'นะโม ตัสสะ ภะคะวะโต (๓ จบ) ยะ-ธา-พุท-โม-นะ (กราบ)';
  const clean = engine.cleanPaliForTTS(rawPali);
  assert.equal(clean.includes('(กราบ)'), false, 'Should strip (กราบ) annotation');
  assert.equal(clean.includes('(๓ จบ)'), false, 'Should replace (๓ จบ) with text');
  assert.equal(clean.includes('สามจบ'), true, 'Should pronounce (๓ จบ) as สามจบ');
  assert.equal(clean.includes('ยะ ธา พุท โม นะ'), true, 'Should expand hyphens into separated syllables for TTS');
  assert.equal(clean.includes('ตัดสะ'), true, 'Should normalize ตัสสะ to phonetic ตัดสะ');
  assert.equal(clean.includes('พะคะวะโต'), true, 'Should normalize ภะคะวะโต to phonetic พะคะวะโต');
});

test('TTS Engine: Queue Generation from Multi-Page Prayer', () => {
  const engine = new DhammaTTSEngine();
  const prayer = DEFAULT_PRAYERS.find(p => p.id === 'somdet-toh-collection');
  assert.ok(prayer, 'Somdet Toh prayer must exist');
  engine.setMode('both');
  engine.prepareQueue(prayer);
  assert.ok(engine.queue.length > 5, 'Queue should contain multiple chunks');
  const hasTitle = engine.queue.some(c => c.type === 'title');
  const hasPali = engine.queue.some(c => c.type === 'pali');
  const hasThai = engine.queue.some(c => c.type === 'thai');
  assert.equal(hasTitle, true, 'Queue must have titles');
  assert.equal(hasPali, true, 'Queue must have pali verses');
  assert.equal(hasThai, true, 'Queue must have thai translations');
});

test('TTS Engine: Mode Filtering (Pali Only vs Thai Only)', () => {
  const engine = new DhammaTTSEngine();
  const samplePrayer = {
    pages: [
      {
        verseTitle: 'บทที่ ๑',
        pali: 'พุทธัง สะระณัง คัจฉามิ',
        thai: 'ข้าพเจ้าขอถึงพระพุทธเจ้าเป็นที่พึ่ง'
      }
    ]
  };
  engine.setMode('pali');
  engine.prepareQueue(samplePrayer);
  const paliTypes = engine.queue.map(c => c.type);
  assert.equal(paliTypes.includes('pali'), true);
  assert.equal(paliTypes.includes('thai'), false);
  engine.setMode('thai');
  engine.prepareQueue(samplePrayer);
  const thaiTypes = engine.queue.map(c => c.type);
  assert.equal(thaiTypes.includes('pali'), false);
  assert.equal(thaiTypes.includes('thai'), true);
});

test('TTS Engine: Speed Rate Bounds & Normalization', () => {
  const engine = new DhammaTTSEngine();
  engine.setRate(0.85);
  assert.equal(engine.rate, 0.85);
  engine.setRate(0.2);
  assert.equal(engine.rate, 0.6, 'Should clamp to min 0.6');
  engine.setRate(3.0);
  assert.equal(engine.rate, 1.5, 'Should clamp to max 1.5');
});

test('TTS Engine: Interactive Tap-to-Speak Queue Index Matching', () => {
  const engine = new DhammaTTSEngine();
  const samplePrayer = {
    pages: [
      {
        pageNumber: 1,
        verseTitle: '๑. บทนำ',
        pali: 'นะโม ตัสสะ\nภะคะวะโต',
        thai: 'ขอนอบน้อม'
      },
      {
        pageNumber: 2,
        verseTitle: '๒. คาถาชินบัญชร',
        pali: 'ชะยาสะนากะตา พุทธา\nเชตวา มารัง',
        thai: 'พระพุทธเจ้าผู้ชนะมาร'
      }
    ]
  };

  engine.prepareQueue(samplePrayer);
  
  // Find chunk corresponding to page 2 pali 'ชะยาสะนากะตา พุทธา'
  const targetChunk = engine.queue.find(c => c.pageIndex === 1 && c.type === 'pali' && c.rawText.includes('ชะยาสะนากะตา'));
  assert.ok(targetChunk, 'Target chunk for page 2 should exist in queue');
  assert.equal(targetChunk.pageIndex, 1);
  assert.equal(targetChunk.type, 'pali');
});

