import { storage } from './storage.js';
import { audio } from './audio.js';
import { tipitakaLoader } from './tipitaka-loader.js';

export class DhammaTrackerEngine {
  constructor() {
    this.container = document.getElementById('trackerList');
    this.streakEl = document.getElementById('statStreakDays');
    this.todayCountEl = document.getElementById('statTodayCount');
    this.totalChantsEl = document.getElementById('statTotalChants');
  }

  async render() {
    if (!this.container) return;

    const trackerData = storage.getTrackerData();
    const prayers = storage.getPrayers();
    const favorites = storage.getFavorites();

    // Map all available items (Prayers + Tipitaka Volumes if present in favorites/tracker)
    let allItems = [...prayers];
    const tipitakaTrackedIds = Object.keys(trackerData.totalCounts)
      .concat(Object.keys(trackerData.todayChanted))
      .concat(favorites)
      .filter(id => id.startsWith('tipitaka-vol-'));

    if (tipitakaTrackedIds.length > 0) {
      try {
        const index = await tipitakaLoader.loadIndex();
        (index.volumes || []).forEach(vol => {
          const volId = `tipitaka-vol-${String(vol.volume).padStart(2, '0')}`;
          if (tipitakaTrackedIds.includes(volId) && !allItems.some(p => p.id === volId)) {
            allItems.push({
              id: volId,
              isTipitaka: true,
              volumeNumber: vol.volume,
              title: `พระไตรปิฎก เล่มที่ ${vol.volume}: ${vol.bookTitle}`,
              category: vol.pitaka,
              author: `พระไตรปิฎก (${vol.bookPali})`,
              description: vol.description
            });
          }
        });
      } catch (err) {
        console.warn('Tipitaka tracker load index failed:', err);
      }
    }

    // Prioritize favorites and chanted items in the daily checklist
    let displayList = allItems.filter(p => favorites.includes(p.id) || trackerData.todayChanted[p.id] || (trackerData.totalCounts[p.id] || 0) > 0);
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

      const statusIconSvg = isCompleted
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="#10b981" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"><circle cx="12" cy="12" r="10"></circle></svg>`;

      const item = document.createElement('div');
      item.className = `tracker-item ${isCompleted ? 'completed' : ''}`;
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div class="tracker-item-left">
          <div class="tracker-status-icon">
            ${statusIconSvg}
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
            ${prayer.isTipitaka ? 'เปิดอ่าน' : 'เปิดสวด'}
          </button>
        </div>
      `;

      // Click to open prayer reader or tipitaka directly
      item.addEventListener('click', () => {
        if (prayer.isTipitaka && prayer.volumeNumber && window.tammaApp) {
          window.tammaApp.openTipitakaVolume(prayer.volumeNumber);
        } else if (window.tammaApp && window.tammaApp.reader) {
          window.tammaApp.reader.open(prayer);
        }
      });

      this.container.appendChild(item);
    });
  }
}

export const tracker = new DhammaTrackerEngine();

