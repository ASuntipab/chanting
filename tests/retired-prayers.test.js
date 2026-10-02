import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storage, RETIRED_PRAYER_IDS } from '../src/js/storage.js';
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';

test('Retired duplicate prayers', async (t) => {
  await t.test('retired ids are gone from defaults and point at a prayer that still exists', () => {
    const ids = new Set(DEFAULT_PRAYERS.map(p => p.id));
    Object.entries(RETIRED_PRAYER_IDS).forEach(([oldId, keptId]) => {
      assert.ok(!ids.has(oldId), `${oldId} must be removed from DEFAULT_PRAYERS`);
      assert.ok(ids.has(keptId), `${keptId} must exist in DEFAULT_PRAYERS`);
    });
  });

  await t.test('existing users keep their favorites and chanting stats after migration', () => {
    const today = storage.getTodayDateString();
    storage.save('tamma_prayers_v1', [...storage.getPrayers(), { id: 'khandha-paritta', title: 'ขันธปริตร', pages: [] }]);
    storage.save('tamma_favorites_v1', ['pahung-mahaka', 'khandha-paritta', 'khandha-sutta']);
    storage.save('tamma_tracker_v1', {
      todayDate: today,
      todayChanted: { 'khandha-paritta': true },
      totalCounts: { 'khandha-paritta': 7, 'khandha-sutta': 3, 'pahung-mahaka': 5 },
      streakDays: 4,
      lastChantedDate: today
    });
    storage.save('tamma_itipiso_rounds_v1', { 'khandha-paritta': 9, 'khandha-sutta': 2 });

    storage.migrateRetiredPrayers();

    assert.ok(!storage.getPrayers().some(p => p.id === 'khandha-paritta'), 'retired prayer removed from library');
    assert.deepEqual(storage.getFavorites(), ['pahung-mahaka', 'khandha-sutta'], 'favorite order kept, duplicate merged');
    const tracker = storage.getTrackerData();
    assert.equal(tracker.totalCounts['khandha-sutta'], 10, 'counts are summed');
    assert.equal(tracker.totalCounts['pahung-mahaka'], 5);
    assert.ok(!('khandha-paritta' in tracker.totalCounts));
    assert.equal(tracker.todayChanted['khandha-sutta'], true);
    assert.equal(tracker.streakDays, 4, 'unrelated tracker fields untouched');
    assert.equal(storage.getItipisoRound('khandha-sutta'), 9, 'itipiso keeps the higher round');
  });

  await t.test('restoring an old backup maps retired ids to the kept prayer', () => {
    storage.save('tamma_favorites_v1', []);
    const result = storage.importData({ favorites: ['khandha-paritta'], tracker: { totalCounts: { 'khandha-paritta': 2 } } });
    assert.equal(result.success, true);
    assert.deepEqual(storage.getFavorites(), ['khandha-sutta']);
    assert.equal(storage.getTrackerData().totalCounts['khandha-sutta'], 2);
  });
});
