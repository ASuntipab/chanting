import test from 'node:test';
import assert from 'node:assert';
import { mp3Player, CHANTING_AUDIO_TRACKS } from '../src/js/mp3-player.js';
import { TIPITAKA_SUTTA_PRAYERS } from '../src/js/prayers-tipitaka-suttas.js';

test('MP3 Chanting Audio Engine & Strict Prayer Matching Verification', async (t) => {
  await t.test('CHANTING_AUDIO_TRACKS provides authentic public domain chanting sources', () => {
    assert.ok(CHANTING_AUDIO_TRACKS.length >= 59, `Expected 59+ tracks, got ${CHANTING_AUDIO_TRACKS.length}`);
    
    CHANTING_AUDIO_TRACKS.forEach(track => {
      assert.ok(track.id, 'Track must have an ID');
      assert.ok(track.title, 'Track must have a title');
      assert.ok(track.temple, 'Track must have a temple attribution');
      assert.ok(track.srcWebm, 'Track must have compressed WebM/Ogg source');
      assert.ok(track.srcMp3.endsWith('.mp3'), 'Track must have fallback MP3 source');
    });
  });

  await t.test('MP3 player strictly matches prayer or returns null if no audio exists', () => {
    const morningPrayer = { id: 'morning-chanting', title: 'บททำวัตรเช้า', category: 'ทำวัตร' };
    const matchedMorning = mp3Player.getTrackForPrayer(morningPrayer);
    assert.ok(matchedMorning);
    assert.strictEqual(matchedMorning.id, 'track-morning-chanting');
    assert.strictEqual(mp3Player.hasAudioForPrayer(morningPrayer), true);

    const eveningPrayer = { id: 'evening-chanting', title: 'บททำวัตรเย็น', category: 'ทำวัตร' };
    const matchedEvening = mp3Player.getTrackForPrayer(eveningPrayer);
    assert.ok(matchedEvening);
    assert.strictEqual(matchedEvening.id, 'track-evening-chanting');

    const chinabanchorn = { id: 'somdej-toh-chinabanchorn', title: 'พระคาถาชินบัญชร', category: 'คาถาศักดิ์สิทธิ์' };
    const matchedChina = mp3Player.getTrackForPrayer(chinabanchorn);
    assert.ok(matchedChina);
    assert.strictEqual(matchedChina.id, 'track-chinabanchorn');

    const dhammacakka = { id: 'dhammacakkappavattana-sutta', title: 'ธัมมจักกัปปวัตตนสูตร', category: 'พระสูตรสำคัญ' };
    const matchedDhamma = mp3Player.getTrackForPrayer(dhammacakka);
    assert.ok(matchedDhamma);
    assert.strictEqual(matchedDhamma.id, 'track-dhammacakka');

    const jayaNoy = { id: 'jaya-noy-chant', title: 'ชัยน้อย', category: 'ชัยมงคลคาถา' };
    const matchedJaya = mp3Player.getTrackForPrayer(jayaNoy);
    assert.ok(matchedJaya);
    assert.strictEqual(matchedJaya.id, 'track-jaya-noy');

    const ovada = { id: 'ovada-patimokkha-chant', title: 'โอวาทปาติโมกข์', category: 'พระสูตรสำคัญ' };
    const matchedOvada = mp3Player.getTrackForPrayer(ovada);
    assert.ok(matchedOvada);
    assert.strictEqual(matchedOvada.id, 'track-ovada-patimokkha');

    // Prayers without recorded audio must return NULL so button is NOT displayed
    const unrecordedPrayer = { id: 'luang-por-guay-chant', title: 'คาถาหลวงพ่อกวย', category: 'พระเกจิอาจารย์' };
    const matchedNone = mp3Player.getTrackForPrayer(unrecordedPrayer);
    assert.strictEqual(matchedNone, null, 'Unrecorded prayer must return null');
    assert.strictEqual(mp3Player.hasAudioForPrayer(unrecordedPrayer), false, 'hasAudioForPrayer must be false');

    // New tracks added in expansion
    const namo = { id: 'namo-tassa', title: 'นะโม ตัสสะ ภะคะวะโต' };
    assert.strictEqual(mp3Player.getTrackForPrayer(namo).id, 'track-namo-tassa');

    const dhammapada = { id: 'dhammapada', title: 'ธรรมบท' };
    assert.strictEqual(mp3Player.getTrackForPrayer(dhammapada).id, 'track-dhammapada-yamaka');

    const buddhaVandana = { id: 'buddha-vandana', title: 'พุทธวันทนา' };
    assert.strictEqual(mp3Player.getTrackForPrayer(buddhaVandana).id, 'track-buddha-vandana-dhammamon');

    const bhojananga = { id: 'bhojananga', title: 'โภชนังคปริตร' };
    assert.strictEqual(mp3Player.getTrackForPrayer(bhojananga).id, 'track-bhojananga-dhammamon');

    // All track IDs must be unique
    const ids = CHANTING_AUDIO_TRACKS.map(t => t.id);
    assert.strictEqual(ids.length, new Set(ids).size, 'All track IDs must be unique');

    // Alternative tracks for multi-version prayers
    const altDhammacakka = mp3Player.getAlternativeTracks({ title: 'ธัมมจักกัปปวัตตนสูตร' });
    assert.ok(altDhammacakka.length >= 4, `ธัมมจักร should have 4+ versions, got ${altDhammacakka.length}`);

    const altKaraniya = mp3Player.getAlternativeTracks({ title: 'กรณียเมตตสูตร' });
    assert.ok(altKaraniya.length >= 4, `เมตตสูตร should have 4+ versions, got ${altKaraniya.length}`);

    const altChinabanchorn = mp3Player.getAlternativeTracks({ title: 'ชินบัญชร' });
    assert.ok(altChinabanchorn.length >= 2, `ชินบัญชร should have 2+ versions, got ${altChinabanchorn.length}`);
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
