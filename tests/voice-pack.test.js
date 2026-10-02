import test from 'node:test';
import assert from 'node:assert/strict';
import { DhammaTTSEngine, voiceClipKey, VOICE_PACK_BASE_URL } from '../src/js/tts-engine.js';
import { collectSpokenTexts } from '../scripts/generate-voice.js';
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';

// Minimal HTMLAudioElement stand-in that finishes each clip on the next tick
class FakeAudio {
  static played = [];
  static failSrc = null;
  pause() {}
  play() {
    FakeAudio.played.push({ src: this.src, rate: this.playbackRate });
    if (this.src === FakeAudio.failSrc) return Promise.reject(new Error('decode error'));
    setTimeout(() => { this.onplaying?.(); this.onended?.(); }, 0);
    return Promise.resolve();
  }
}

function makeEngine(clipTexts) {
  const engine = new DhammaTTSEngine();
  engine.voicePack = { baseUrl: VOICE_PACK_BASE_URL, ext: 'mp3', clips: new Set(clipTexts.map(voiceClipKey)) };
  return engine;
}

const prayer = { id: 't', pages: [{ verseTitle: 'บทหนึ่ง', pali: 'อิติปิ โส\nภะคะวา', thai: 'แปลไทย' }] };

test('voiceClipKey is stable, 14 hex chars, and distinguishes texts', () => {
  assert.equal(voiceClipKey('นะโม ตัสสะ'), voiceClipKey('นะโม ตัสสะ'));
  assert.notEqual(voiceClipKey('นะโม ตัสสะ'), voiceClipKey('นะโม ตัสสะ '));
  assert.match(voiceClipKey('อิติปิ โส'), /^[0-9a-f]{14}$/);
});

test('generator covers every line the reader speaks in any mode, with no key collisions', () => {
  const texts = collectSpokenTexts(DEFAULT_PRAYERS);
  assert.ok(texts.size > 1000);
  assert.equal(new Set(texts.values()).size, texts.size, 'two different texts share a clip key');

  const engine = new DhammaTTSEngine();
  for (const mode of ['pali', 'thai']) {
    engine.setMode(mode);
    for (const p of DEFAULT_PRAYERS.slice(0, 40)) {
      engine.prepareQueue(p);
      for (const c of engine.queue) assert.ok(texts.has(voiceClipKey(c.text)), `missing clip for "${c.text}"`);
    }
  }
});

test('plays recorded clips in order, scaled to the chosen speed, and skips lines with no voice', async () => {
  globalThis.Audio = FakeAudio;
  FakeAudio.played = [];
  const engine = makeEngine(['บทหนึ่ง', 'อิติปิ โส', 'แปลไทย']); // 'ภะคะวา' has no clip, no device voice in Node
  engine.setRate(1.0);
  engine.prepareQueue(prayer);
  const highlighted = [];
  engine.onHighlight = (i) => { if (i >= 0) highlighted.push(i); };
  const finished = new Promise(r => { engine.onFinish = r; });
  engine.play(0);
  await finished;

  assert.deepEqual(FakeAudio.played.map(p => p.src), ['บทหนึ่ง', 'อิติปิ โส', 'แปลไทย'].map(t => `${VOICE_PACK_BASE_URL}${voiceClipKey(t)}.mp3`));
  assert.ok(Math.abs(FakeAudio.played[1].rate - 1.0 / 0.85) < 1e-9);
  assert.deepEqual(highlighted, [0, 1, 3]);
});

test("'device' voice source ignores the pack", () => {
  const engine = makeEngine(['บทหนึ่ง']);
  engine.prepareQueue(prayer);
  assert.ok(engine.getClipUrl(engine.queue[0]));
  engine.setVoiceSource('device');
  assert.equal(engine.getClipUrl(engine.queue[0]), null);
});

test('a clip that fails to play falls back instead of stalling', async () => {
  globalThis.Audio = FakeAudio;
  FakeAudio.played = [];
  const engine = makeEngine(['บทหนึ่ง', 'อิติปิ โส']);
  FakeAudio.failSrc = `${VOICE_PACK_BASE_URL}${voiceClipKey('บทหนึ่ง')}.mp3`;
  engine.prepareQueue({ id: 'f', pages: [{ verseTitle: 'บทหนึ่ง', pali: 'อิติปิ โส' }] });
  const finished = new Promise(r => { engine.onFinish = r; });
  engine.play(0);
  await finished;
  FakeAudio.failSrc = null;
  assert.equal(FakeAudio.played.at(-1).src, `${VOICE_PACK_BASE_URL}${voiceClipKey('อิติปิ โส')}.mp3`);
});
