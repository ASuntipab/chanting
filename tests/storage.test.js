import test from 'node:test';
import assert from 'node:assert/strict';

// Mock-free in-memory storage simulator for Node test environment
class StorageTester {
  constructor() {
    this.store = {};
    this.prayers = [
      { id: 'p1', title: 'บทสวดที่ 1', status: 'approved' },
      { id: 'p2', title: 'บทสวดที่ 2', status: 'approved' }
    ];
    this.pending = [];
    this.favorites = [];
    this.tracker = {
      todayDate: '2026-08-29',
      todayChanted: {},
      totalCounts: {},
      streakDays: 1,
      lastChantedDate: '2026-08-29'
    };
  }

  addPending(item) {
    item.status = 'pending';
    this.pending.push(item);
    return item;
  }

  approvePending(id) {
    const idx = this.pending.findIndex(p => p.id === id);
    if (idx >= 0) {
      const item = this.pending[idx];
      item.status = 'approved';
      this.prayers.push(item);
      this.pending.splice(idx, 1);
      return true;
    }
    return false;
  }

  rejectPending(id) {
    const idx = this.pending.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.pending.splice(idx, 1);
      return true;
    }
    return false;
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

test('Admin Approval Workflow: Pending prayer should transition to Approved and become public', () => {
  const tester = new StorageTester();
  
  // 1. User uploads new prayer
  const newSubmission = { id: 'user-sub-1', title: 'คาถาชินบัญชร ย่อ' };
  tester.addPending(newSubmission);
  
  assert.equal(tester.pending.length, 1);
  assert.equal(tester.pending[0].status, 'pending');
  assert.equal(tester.prayers.length, 2); // Not in public yet

  // 2. Admin approves
  const success = tester.approvePending('user-sub-1');
  assert.ok(success);
  assert.equal(tester.pending.length, 0); // Removed from queue
  assert.equal(tester.prayers.length, 3); // Added to public library
  assert.equal(tester.prayers[2].id, 'user-sub-1');
  assert.equal(tester.prayers[2].status, 'approved');
});

test('Admin Reject Workflow: Rejected prayer should be removed without adding to library', () => {
  const tester = new StorageTester();
  tester.addPending({ id: 'spam-1', title: 'เนื้อหาไม่เหมาะสม' });
  assert.equal(tester.pending.length, 1);

  tester.rejectPending('spam-1');
  assert.equal(tester.pending.length, 0);
  assert.equal(tester.prayers.length, 2);
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
