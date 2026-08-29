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
