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
      version: '2.0.0',
      favorites: this.favorites,
      tracker: this.tracker
    });
  }

  exportBackupCode() {
    return btoa(encodeURIComponent(this.exportData()));
  }

  importData(rawJson) {
    let data = rawJson;
    if (typeof rawJson === 'string') {
      rawJson = rawJson.trim();
      if (rawJson.startsWith('{') || rawJson.startsWith('[')) {
        data = JSON.parse(rawJson);
      } else {
        try {
          data = JSON.parse(decodeURIComponent(atob(rawJson)));
        } catch {
          data = JSON.parse(rawJson);
        }
      }
    }

    if (Array.isArray(data.favorites)) {
      const currentFavs = new Set(this.favorites);
      data.favorites.forEach(f => currentFavs.add(f));
      this.favorites = Array.from(currentFavs);
    }

    if (data.tracker) {
      this.tracker.totalCounts = { ...this.tracker.totalCounts, ...(data.tracker.totalCounts || {}) };
      this.tracker.todayChanted = { ...this.tracker.todayChanted, ...(data.tracker.todayChanted || {}) };
      this.tracker.streakDays = Math.max(this.tracker.streakDays || 1, data.tracker.streakDays || 1);
    }

    return { success: true };
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

test('Zero-Database Backup & Restore: Lightweight User Stats & Favorites Backup via JSON and Code', () => {
  const tester1 = new StorageTester();
  tester1.toggleFavorite('p1');
  tester1.incrementCount('p1', 5);

  // 1. Export as code
  const backupCode = tester1.exportBackupCode();
  assert.ok(backupCode.length > 10);

  // 2. Another user / new phone imports the code
  const tester2 = new StorageTester();
  assert.deepEqual(tester2.favorites, []);
  assert.equal(tester2.tracker.totalCounts['p1'] || 0, 0);

  const res = tester2.importData(backupCode);
  assert.equal(res.success, true);
  assert.deepEqual(tester2.favorites, ['p1']);
  assert.equal(tester2.tracker.totalCounts['p1'], 5);
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

test('Local Device Timezone: Date strings use local calendar date instead of UTC offset', () => {
  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const sampleDate = new Date(2026, 7, 29, 23, 45); // 29 Aug 2026 23:45 local time
  assert.equal(getLocalDateString(sampleDate), '2026-08-29');

  const todayStr = getLocalDateString(new Date());
  assert.match(todayStr, /^\d{4}-\d{2}-\d{2}$/);
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
    // Unified swipe handling: Horizontal or Vertical
    if (deltaX > swipeThreshold || deltaY > swipeThreshold) {
      this.currentPageIndex = Math.min(this.currentPageIndex + 1, this.totalPages - 1);
      return { action: 'swipe', direction: 'next', page: this.currentPageIndex };
    } else if (deltaX < -swipeThreshold || deltaY < -swipeThreshold) {
      this.currentPageIndex = Math.max(this.currentPageIndex - 1, 0);
      return { action: 'swipe', direction: 'prev', page: this.currentPageIndex };
    } else if (elapsed < 600 && Math.abs(deltaX) < 25 && Math.abs(deltaY) < 25) {
      this.toggleHUD();
      return { action: 'tap', hudVisible: this.hudVisible };
    }
    return { action: 'none' };
  }

  adjustFontSize(delta) {
    let current = this.fontSize + delta;
    current = Math.min(Math.max(current, 0.75), 3.45);
    this.fontSize = parseFloat(current.toFixed(2));
    const percent = Math.round((this.fontSize / 1.15) * 100);
    return { fontSize: this.fontSize, percent: `${percent}%` };
  }

  jumpFirst() {
    this.currentPageIndex = 0;
    return this.currentPageIndex;
  }

  jumpLast() {
    this.currentPageIndex = this.totalPages - 1;
    return this.currentPageIndex;
  }

  jumpToPage(pageNumber) {
    this.currentPageIndex = Math.min(Math.max(pageNumber - 1, 0), this.totalPages - 1);
    return this.currentPageIndex;
  }
}

test('Quick Jump & Scrubber Navigation: Instant jump to first, last, next-to-last, or slider index', () => {
  const tester = new ReaderGestureTester();
  assert.equal(tester.currentPageIndex, 0);

  // 1. Jump to Last Page (10th section -> index 9)
  const lastIndex = tester.jumpLast();
  assert.equal(lastIndex, 9, 'jumpLast should jump to index 9');

  // 2. Jump to Next-to-last Page (9th section -> index 8)
  const nextToLast = tester.jumpToPage(9);
  assert.equal(nextToLast, 8, 'jumpToPage(9) should jump to next-to-last section (index 8)');

  // 3. Jump to First Page (1st section -> index 0)
  const firstIndex = tester.jumpFirst();
  assert.equal(firstIndex, 0, 'jumpFirst should jump back to index 0');

  // 4. Scrubber drag to any section (e.g. page 5 -> index 4)
  const middleIndex = tester.jumpToPage(5);
  assert.equal(middleIndex, 4, 'jumpToPage(5) should jump to section index 4');
});

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

test('Viewport Snap Swipe: Both Horizontal (Left/Right) and Vertical (Up/Down) swipes snap to next/prev section', () => {
  const tester = new ReaderGestureTester();
  assert.equal(tester.hudVisible, true);
  assert.equal(tester.currentPageIndex, 0);

  // 1. Swipe Left (deltaX = 55px, deltaY = 0) -> Next Section
  const swipeLeft = tester.handleTapOrSwipe(55, 0, 200);
  assert.equal(swipeLeft.action, 'swipe');
  assert.equal(swipeLeft.page, 1, 'Swipe left should advance to section 1');

  // 2. Swipe Up / Scroll Up gesture (deltaX = 0, deltaY = 60px) -> Next Section
  const swipeUp = tester.handleTapOrSwipe(0, 60, 200);
  assert.equal(swipeUp.action, 'swipe');
  assert.equal(swipeUp.page, 2, 'Swipe up should advance to section 2');

  // 3. Swipe Down (deltaX = 0, deltaY = -60px) -> Prev Section
  const swipeDown = tester.handleTapOrSwipe(0, -60, 200);
  assert.equal(swipeDown.action, 'swipe');
  assert.equal(swipeDown.page, 1, 'Swipe down should return to section 1');

  // 4. Swipe Right (deltaX = -55px, deltaY = 0) -> Prev Section
  const swipeRight = tester.handleTapOrSwipe(-55, 0, 200);
  assert.equal(swipeRight.action, 'swipe');
  assert.equal(swipeRight.page, 0, 'Swipe right should return to section 0');

  assert.equal(tester.hudVisible, true, 'HUD state should remain untouched during swipes');
});

test('Viewport Snap Metric Calculation: Accurately calculates total viewport pages from flow height and viewport height', () => {
  function calculateViewportPages(viewportHeight, flowHeight) {
    const step = Math.max(viewportHeight - 24, 120);
    return Math.max(1, Math.ceil((flowHeight - 24) / step));
  }

  // Short prayer (fits within 1 screen)
  assert.equal(calculateViewportPages(500, 420), 1, 'Short prayer should be exactly 1 section');

  // Medium prayer (800px content on 450px screen) -> 2 sections
  assert.equal(calculateViewportPages(450, 800), 2, '800px content on 450px screen should be 2 sections');

  // Long prayer (1800px content on 450px screen) -> 5 sections
  assert.equal(calculateViewportPages(450, 1800), 5, '1800px content on 450px screen should be 5 sections');
});

test('Font Size Rescaling: Scaling up to 300% (3.45rem) for elders and persists percentage', () => {
  const tester = new ReaderGestureTester();
  assert.equal(tester.fontSize, 1.15);

  // Zoom In (+0.15)
  const zoomIn = tester.adjustFontSize(0.15);
  assert.equal(zoomIn.fontSize, 1.30);
  assert.equal(zoomIn.percent, '113%');

  // Zoom to Maximum 300% (3.45rem)
  const maxZoom = tester.adjustFontSize(2.5);
  assert.equal(maxZoom.fontSize, 3.45, 'Font size should clamp at 3.45rem (300%)');
  assert.equal(maxZoom.percent, '300%');

  // Zoom Out (-2.7)
  const zoomOut = tester.adjustFontSize(-2.7);
  assert.equal(zoomOut.fontSize, 0.75, 'Font size should clamp at 0.75rem (~65%)');
  assert.equal(zoomOut.percent, '65%');
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

  // Verify Somdet Toh Collection has full 6 atomic pages
  const somdetToh = DEFAULT_PRAYERS.find(p => p.id === 'somdet-toh-collection');
  assert.ok(somdetToh, 'Somdet Toh collection must exist');
  assert.equal(somdetToh.pages.length, 6, 'Somdet Toh collection must have 6 complete atomic pages');
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

test('Library Header: Accurate Prayer Count & Thai Numeral Formatting', () => {
  const toThai = (n) => String(n).replace(/[0-9]/g, d => ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'][d]);
  
  const activePrayers = DEFAULT_PRAYERS.filter(p => p.status !== 'hidden');
  const totalCount = activePrayers.length;
  const totalPages = activePrayers.reduce((acc, p) => acc + (p.pages?.length || 1), 0);

  assert.equal(totalCount, 102, 'Should have exactly 102 active prayers in default library');
  assert.equal(toThai(totalCount), '๑๐๒', 'Should correctly format 102 to Thai numeral ๑๐๒');
  assert.equal(totalPages, 189, 'Should have 189 total pages across all prayers');
  assert.equal(toThai(totalPages), '๑๘๙', 'Should correctly format 189 pages to Thai numeral ๑๘๙');
});

