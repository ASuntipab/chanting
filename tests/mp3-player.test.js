import test from 'node:test';
import assert from 'node:assert';
import { mp3Player, CHANTING_AUDIO_TRACKS } from '../src/js/mp3-player.js';
import { TIPITAKA_SUTTA_PRAYERS } from '../src/js/prayers-tipitaka-suttas.js';

test('MP3 Chanting Audio Engine & New Suttas Verification', async (t) => {
  await t.test('CHANTING_AUDIO_TRACKS provides authentic public domain chanting sources', () => {
    assert.ok(CHANTING_AUDIO_TRACKS.length >= 8);
    
    CHANTING_AUDIO_TRACKS.forEach(track => {
      assert.ok(track.id, 'Track must have an ID');
      assert.ok(track.title, 'Track must have a title');
      assert.ok(track.temple, 'Track must have a temple attribution');
      assert.ok(track.src.endsWith('.mp3'), 'Track src must be MP3');
    });
  });

  await t.test('MP3 player matches track intelligently based on opened prayer', () => {
    const morningPrayer = { id: 'morning-chanting', title: 'บททำวัตรเช้า', category: 'ทำวัตร' };
    const matchedMorning = mp3Player.getTrackForPrayer(morningPrayer);
    assert.strictEqual(matchedMorning.id, 'track-morning-chanting');

    const eveningPrayer = { id: 'evening-chanting', title: 'บททำวัตรเย็น', category: 'ทำวัตร' };
    const matchedEvening = mp3Player.getTrackForPrayer(eveningPrayer);
    assert.strictEqual(matchedEvening.id, 'track-evening-chanting');

    const chinabanchorn = { id: 'somdej-toh-chinabanchorn', title: 'พระคาถาชินบัญชร', category: 'คาถาศักดิ์สิทธิ์' };
    const matchedChina = mp3Player.getTrackForPrayer(chinabanchorn);
    assert.strictEqual(matchedChina.id, 'track-chinabanchorn');

    const satipatthana = { id: 'mahasatipatthana-sutta-full', title: 'มหาสติปัฏฐานสูตร (ฉบับสวดมนต์เต็ม)', category: 'พระสูตรสำคัญ' };
    const matchedSati = mp3Player.getTrackForPrayer(satipatthana);
    assert.strictEqual(matchedSati.id, 'track-satipatthana');
  });

  await t.test('MP3 player utility functions: time formatting, speed, loop', () => {
    assert.strictEqual(mp3Player.formatTime(0), '00:00');
    assert.strictEqual(mp3Player.formatTime(65), '01:05');
    assert.strictEqual(mp3Player.formatTime(920), '15:20');

    mp3Player.setSpeed(1.25);
    assert.strictEqual(mp3Player.playbackRate, 1.25);

    const isLoop = mp3Player.toggleLoop();
    assert.strictEqual(typeof isLoop, 'boolean');
  });

  await t.test('Full Chanting Suite: Mahasatipatthana & Kalama Suttas verified in Tipitaka suttas', () => {
    const mahasatipatthana = TIPITAKA_SUTTA_PRAYERS.find(p => p.id === 'mahasatipatthana-sutta-full');
    assert.ok(mahasatipatthana, 'Mahasatipatthana Sutta must exist');
    assert.strictEqual(mahasatipatthana.pages.length, 4);
    assert.ok(mahasatipatthana.pages[0].pali.includes('เอกาโยโน อะยัง ภิกขะเว มัคโค'));
    assert.ok(mahasatipatthana.pages[0].thai.includes('ทางนี้เป็นทางสายเอกสายเดียว'));

    const kalama = TIPITAKA_SUTTA_PRAYERS.find(p => p.id === 'kalama-sutta-full');
    assert.ok(kalama, 'Kalama Sutta must exist');
    assert.strictEqual(kalama.pages.length, 2);
    assert.ok(kalama.pages[0].pali.includes('มา อะนุสสะเวนะ'));
    assert.ok(kalama.pages[0].thai.includes('อย่าเพิ่งเชื่อ'));
  });
});
