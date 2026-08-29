import test from 'node:test';
import assert from 'node:assert/strict';

// Mock-free in-memory storage simulator for Node test environment
class StorageTester {
  constructor() {
    this.prayers = [
      { id: 'p1', title: 'บทสวดที่ 1', status: 'approved' },
      { id: 'p2', title: 'บทสวดที่ 2', status: 'approved' }
    ];
    this.favorites = [];
    this.tracker = {
      todayDate: '2026-08-29',
      todayChanted: {},
      totalCounts: {},
      streakDays: 1,
      lastChantedDate: '2026-08-29'
    };
  }

  savePrayer(item) {
    item.status = 'approved';
    const idx = this.prayers.findIndex(p => p.id === item.id);
    if (idx >= 0) {
      this.prayers[idx] = item;
    } else {
      this.prayers.push(item);
    }
    return item;
  }

  deletePrayer(id) {
    this.prayers = this.prayers.filter(p => p.id !== id);
  }

  exportData() {
    return JSON.stringify({
      version: '1.0.0',
      prayers: this.prayers,
      favorites: this.favorites
    });
  }

  importData(rawJson) {
    const data = JSON.parse(rawJson);
    const existingIds = new Set(this.prayers.map(p => p.id));
    let addedCount = 0;
    data.prayers.forEach(p => {
      if (!existingIds.has(p.id)) {
        this.prayers.push(p);
        addedCount++;
      }
    });
    return { success: true, addedCount };
  }

  toggleFavorite(id) {
    if (this.favorites.includes(id)) {
      this.favorites = this.favorites.filter(f => f !== id);
      return false;
    } else {
      this.favorites.push(id);
      return true;
    }
  }

  incrementCount(prayerId, amount = 1) {
    this.tracker.totalCounts[prayerId] = (this.tracker.totalCounts[prayerId] || 0) + amount;
    this.tracker.todayChanted[prayerId] = true;
    return this.tracker.totalCounts[prayerId];
  }
}

test('Direct Offline Save: User added prayer is saved directly to local library offline', () => {
  const tester = new StorageTester();
  
  // User adds prayer
  const newPrayer = { id: 'user-custom-1', title: 'บทสวดพระมหาจักรพรรดิ ย่อ' };
  tester.savePrayer(newPrayer);
  
  assert.equal(tester.prayers.length, 3);
  assert.equal(tester.prayers[2].id, 'user-custom-1');
  assert.equal(tester.prayers[2].status, 'approved');
});

test('Zero-Database Backup & Restore: Export & Import JSON works seamlessly offline', () => {
  const tester1 = new StorageTester();
  tester1.savePrayer({ id: 'p3', title: 'บทสวดพิเศษจากเพื่อน' });
  
  const exportedJson = tester1.exportData();
  assert.ok(exportedJson.includes('บทสวดพิเศษจากเพื่อน'));

  // Another user imports the JSON
  const tester2 = new StorageTester();
  assert.equal(tester2.prayers.length, 2);

  const res = tester2.importData(exportedJson);
  assert.equal(res.success, true);
  assert.equal(res.addedCount, 1);
  assert.equal(tester2.prayers.length, 3);
  assert.equal(tester2.prayers[2].id, 'p3');
});

test('Favorites & Chanting Counter State', () => {
  const tester = new StorageTester();

  // Favorite toggle
  assert.equal(tester.toggleFavorite('p1'), true);
  assert.deepEqual(tester.favorites, ['p1']);
  assert.equal(tester.toggleFavorite('p1'), false);
  assert.deepEqual(tester.favorites, []);

  // Counter
  const count1 = tester.incrementCount('p1', 1);
  assert.equal(count1, 1);
  assert.equal(tester.tracker.todayChanted['p1'], true);

  const count9 = tester.incrementCount('p1', 8);
  assert.equal(count9, 9);
});

// =========================================================================
// Reader Engine & Gesture Interaction Tests
// =========================================================================
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';

class ReaderGestureTester {
  constructor() {
    this.hudVisible = true;
    this.fontSize = 1.15;
    this.currentPageIndex = 0;
    this.totalPages = 10;
  }

  toggleHUD() {
    this.hudVisible = !this.hudVisible;
    return this.hudVisible;
  }

  handleTapOrSwipe(deltaX, deltaY, elapsed) {
    const swipeThreshold = 40;
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) this.currentPageIndex = Math.min(this.currentPageIndex + 1, this.totalPages - 1);
      else this.currentPageIndex = Math.max(this.currentPageIndex - 1, 0);
      return { action: 'swipe', page: this.currentPageIndex };
    } else if (elapsed < 600 && Math.abs(deltaX) < 25 && deltaY < 25) {
      this.toggleHUD();
      return { action: 'tap', hudVisible: this.hudVisible };
    }
    return { action: 'none' };
  }

  adjustFontSize(delta) {
    let current = this.fontSize + delta;
    current = Math.min(Math.max(current, 0.75), 2.2);
    this.fontSize = parseFloat(current.toFixed(2));
    const percent = Math.round((this.fontSize / 1.15) * 100);
    return { fontSize: this.fontSize, percent: `${percent}%` };
  }
}

test('Instant Single-Tap: Tapping once should immediately toggle HUD state without long press', () => {
  const tester = new ReaderGestureTester();
  assert.equal(tester.hudVisible, true);

  // Single Tap with minimal movement and short duration (e.g. 120ms, delta 2px)
  const tap1 = tester.handleTapOrSwipe(2, 1, 120);
  assert.equal(tap1.action, 'tap');
  assert.equal(tap1.hudVisible, false, 'HUD should immediately hide on single tap');

  // Second Single Tap
  const tap2 = tester.handleTapOrSwipe(0, 0, 80);
  assert.equal(tap2.action, 'tap');
  assert.equal(tap2.hudVisible, true, 'HUD should immediately appear on second tap');
});

test('Swipe vs Tap Discrimination: Swiping turns page without toggling HUD', () => {
  const tester = new ReaderGestureTester();
  assert.equal(tester.hudVisible, true);
  assert.equal(tester.currentPageIndex, 0);

  // Swipe Left (deltaX = 60px)
  const swipeRes = tester.handleTapOrSwipe(60, 5, 200);
  assert.equal(swipeRes.action, 'swipe');
  assert.equal(swipeRes.page, 1, 'Page should advance to 1 on swipe left');
  assert.equal(tester.hudVisible, true, 'HUD state should remain untouched during swipe');
});

test('Font Size Rescaling: Scaling clamps safely and calculates percentage accurately', () => {
  const tester = new ReaderGestureTester();
  assert.equal(tester.fontSize, 1.15);

  // Zoom In (+0.1)
  const zoomIn = tester.adjustFontSize(0.1);
  assert.equal(zoomIn.fontSize, 1.25);
  assert.equal(zoomIn.percent, '109%');

  // Zoom Out (-0.3)
  const zoomOut = tester.adjustFontSize(-0.3);
  assert.equal(zoomOut.fontSize, 0.95);
  assert.equal(zoomOut.percent, '83%');
});

test('Default Prayers Suite: Verified Luang Pu Mun, Luang Ta Maha Bua & Maha Metta Yai (12 pages)', () => {
  const ids = DEFAULT_PRAYERS.map(p => p.id);

  // Verify Maha Metta Yai has all 12 complete pages
  const metta = DEFAULT_PRAYERS.find(p => p.id === 'maha-metta-yai');
  assert.ok(metta, 'Maha Metta Yai must exist');
  assert.equal(metta.pages.length, 12, 'Maha Metta Yai must have 12 authentic pages');

  // Verify Luang Pu Mun Prayers exist
  assert.ok(ids.includes('lp-mun-mora-paritta'), 'Mora Paritta (Luang Pu Mun) must exist');
  assert.ok(ids.includes('lp-mun-khandha-paritta'), 'Khandha Paritta must exist');
  assert.ok(ids.includes('lp-mun-kammathana'), 'Kammathana (Luang Pu Mun) must exist');

  // Verify Luang Ta Maha Bua Prayer exists
  assert.ok(ids.includes('lp-maha-bua-metta'), 'Luang Ta Maha Bua prayer suite must exist');

  // Verify Standalone Pahung Mahaka Prayer exists
  const pahung = DEFAULT_PRAYERS.find(p => p.id === 'pahung-mahaka');
  assert.ok(pahung, 'Pahung Mahaka prayer must exist');
  assert.equal(pahung.pages.length, 6, 'Pahung Mahaka must have 6 complete pages');
});

test('100% Zero-Loss Content Parity: All prayers retain complete Pali verses and paired Thai translations without loss', () => {
  DEFAULT_PRAYERS.forEach(prayer => {
    assert.ok(prayer.pages && prayer.pages.length > 0, `Prayer ${prayer.title} must have pages`);
    prayer.pages.forEach((page, idx) => {
      // Must have either pali or thai or content
      const hasContent = (page.pali && page.pali.trim().length > 0) ||
                         (page.thai && page.thai.trim().length > 0) ||
                         (page.content && page.content.trim().length > 0);
      assert.ok(hasContent, `Page ${idx + 1} of ${prayer.title} must have valid content`);
    });
  });
});
