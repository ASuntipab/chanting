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

    // Render Checklist / Tracker Items
    this.container.innerHTML = '';
    displayList.forEach(prayer => {
      const isCompleted = !!trackerData.todayChanted[prayer.id];
      const count = trackerData.totalCounts[prayer.id] || 0;

      const item = document.createElement('div');
      item.className = `tracker-item ${isCompleted ? 'completed' : ''}`;
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div class="tracker-item-left">
          <div class="tracker-status-icon">
            ${isCompleted ? '✅' : '⚪'}
          </div>
          <div style="min-width: 0; flex: 1;">
            <div class="tracker-title">${prayer.title}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              ${isCompleted ? '<span style="color: var(--accent-green); font-weight: 500;">สวดแล้ววันนี้</span> • ' : ''}สวดสะสม ${count} จบ
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
          <button class="btn-primary btn-read-tracker" data-id="${prayer.id}" style="padding: 6px 14px; font-size: 0.85rem; border-radius: 20px;">
            เปิดสวด
          </button>
        </div>
      `;

      // Click to open prayer reader directly
      item.addEventListener('click', () => {
        if (window.tammaApp && window.tammaApp.reader) {
          window.tammaApp.reader.open(prayer);
        }
      });

      this.container.appendChild(item);
    });
  }
}

export const tracker = new DhammaTrackerEngine();
