/**
 * Tamma OS - Daily Dhamma Tracker & Chanting Counter Engine
 * Manages daily habits, streaks, counts, and interactive checklist
 */

import { storage } from './storage.js';
import { audio } from './audio.js';

export class DhammaTrackerEngine {
  constructor() {
    this.container = document.getElementById('trackerList');
    this.streakEl = document.getElementById('statStreakDays');
    this.todayCountEl = document.getElementById('statTodayCount');
    this.totalChantsEl = document.getElementById('statTotalChants');
  }

  render() {
    if (!this.container) return;

    const trackerData = storage.getTrackerData();
    const prayers = storage.getPrayers();
    const favorites = storage.getFavorites();

    // Prioritize favorites and common prayers in the daily checklist
    let displayList = prayers.filter(p => favorites.includes(p.id));
    if (displayList.length === 0) {
      displayList = prayers.slice(0, 5);
    }

    // Compute Summary Stats
    const todayChantedCount = Object.values(trackerData.todayChanted).filter(Boolean).length;
    const totalLifetimeChants = Object.values(trackerData.totalCounts).reduce((a, b) => a + b, 0);

    if (this.streakEl) this.streakEl.textContent = trackerData.streakDays || 1;
    if (this.todayCountEl) this.todayCountEl.textContent = todayChantedCount;
    if (this.totalChantsEl) this.totalChantsEl.textContent = totalLifetimeChants;

    // Render Checklist
    this.container.innerHTML = '';
    displayList.forEach(prayer => {
      const isCompleted = !!trackerData.todayChanted[prayer.id];
      const count = trackerData.totalCounts[prayer.id] || 0;

      const item = document.createElement('div');
      item.className = `tracker-item ${isCompleted ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="tracker-item-left">
          <button class="tracker-checkbox" aria-label="ติ๊กสวดแล้ว" data-id="${prayer.id}">
            ${isCompleted ? '✓' : ''}
          </button>
          <div>
            <div class="tracker-title">${prayer.title}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">สวดสะสม ${count} จบ</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="tracker-counter-btn btn-plus-one" data-id="${prayer.id}">
            +1 จบ 🔔
          </button>
        </div>
      `;

      // Event Listeners
      const checkBtn = item.querySelector('.tracker-checkbox');
      checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playBell();
        storage.toggleTodayChanted(prayer.id);
        this.render();
      });

      const plusBtn = item.querySelector('.btn-plus-one');
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playBell(586);
        storage.incrementPrayerCount(prayer.id);
        this.render();
      });

      this.container.appendChild(item);
    });
  }
}

export const tracker = new DhammaTrackerEngine();
