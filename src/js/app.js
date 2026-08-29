/**
 * Tamma OS - Main Application Controller
 * Coordinates Reader, Library, Tracker, URL Scraper, Share, Admin & Native Capacitor Bridge
 */

import { storage } from './storage.js';
import { audio } from './audio.js';
import { ComicReaderEngine } from './reader.js';
import { tracker } from './tracker.js';
import { scraper } from './scraper.js';
import { shareEngine } from './share.js';
import { adminEngine } from './admin.js';
import { starfield } from './starfield.js';

class TammaApp {
  constructor() {
    this.reader = null;
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.activeTab = 'library';
  }

  init() {
    // 1. Initialize Cosmic Starfield
    starfield.init();

    // 2. Initialize Reader Engine
    this.reader = new ComicReaderEngine();

    // 3. Initialize Settings & Theme
    this.applyInitialSettings();

    // 4. Render Views
    this.renderLibrary();
    tracker.render();
    adminEngine.updateBadge();

    // 5. Bind Global UI Events
    this.bindEvents();

    console.log('🙏 Tamma OS E-Book Engine Initialized Successfully in Cosmic Sanctuary.');
  }

  applyInitialSettings() {
    const settings = storage.getSettings();
    document.body.className = `theme-${settings.theme || 'cosmic'}`;
  }

  bindEvents() {
    // Tab Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Theme Switcher Buttons
    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.setTheme;
        document.body.className = `theme-${theme}`;
        storage.saveSettings({ theme });
        this.showToast(`เปลี่ยนธีมเป็น: ${btn.textContent.trim()}`);
      });
    });

    // Search Input
    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderLibrary();
    });

    // Category Chips
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentCategory = chip.dataset.category || 'all';
        this.renderLibrary();
      });
    });

    // Upload / Import Modal Triggers
    const btnOpenUpload = document.getElementById('btnOpenUpload');
    const uploadModal = document.getElementById('uploadModal');
    const btnCloseUpload = document.getElementById('btnCloseUpload');
    btnOpenUpload?.addEventListener('click', () => uploadModal?.classList.add('open'));
    btnCloseUpload?.addEventListener('click', () => uploadModal?.classList.remove('open'));

    // Upload Tabs (Manual vs URL)
    const tabBtnManual = document.getElementById('tabBtnManual');
    const tabBtnUrl = document.getElementById('tabBtnUrl');
    const tabPaneManual = document.getElementById('tabPaneManual');
    const tabPaneUrl = document.getElementById('tabPaneUrl');

    tabBtnManual?.addEventListener('click', () => {
      tabBtnManual.classList.add('active');
      tabBtnUrl.classList.remove('active');
      tabPaneManual.style.display = 'block';
      tabPaneUrl.style.display = 'none';
    });

    tabBtnUrl?.addEventListener('click', () => {
      tabBtnUrl.classList.add('active');
      tabBtnManual.classList.remove('active');
      tabPaneManual.style.display = 'none';
      tabPaneUrl.style.display = 'block';
    });

    // Form: Manual Upload
    const formManual = document.getElementById('formManualUpload');
    formManual?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('uploadTitle').value.trim();
      const category = document.getElementById('uploadCategory').value;
      const author = document.getElementById('uploadAuthor').value.trim() || 'ผู้มีจิตศรัทธา';
      const content = document.getElementById('uploadContent').value.trim();

      if (!title || !content) {
        alert('กรุณากรอกชื่อบทสวดและเนื้อหา');
        return;
      }

      const newPrayer = scraper.parseRawTextToPrayer(title, content);
      newPrayer.category = category;
      newPrayer.author = author;

      storage.addPendingPrayer(newPrayer);
      uploadModal?.classList.remove('open');
      formManual.reset();
      this.showToast('ส่งบทสวดสำเร็จ! รอแอดมินตรวจสอบอนุมัติ 🙏');
      adminEngine.updateBadge();
      adminEngine.renderQueue(p => this.reader.open(p));
    });

    // Form: URL Import
    const btnFetchUrl = document.getElementById('btnFetchUrl');
    btnFetchUrl?.addEventListener('click', async () => {
      const url = document.getElementById('uploadUrlInput').value.trim();
      const statusEl = document.getElementById('urlFetchStatus');
      if (!url) {
        alert('กรุณาระบุ URL เว็บไซต์บทสวด');
        return;
      }

      try {
        if (statusEl) {
          statusEl.textContent = '⏳ กำลังดึงและจัดหน้าบทสวดจากเว็บ...';
          statusEl.style.display = 'block';
        }
        btnFetchUrl.disabled = true;

        const importedPrayer = await scraper.extractFromUrl(url);
        storage.addPendingPrayer(importedPrayer);

        uploadModal?.classList.remove('open');
        document.getElementById('uploadUrlInput').value = '';
        this.showToast(`นำเข้าสำเร็จ: "${importedPrayer.title}" (ส่งเข้าคิวรออนุมัติ)`);
        adminEngine.updateBadge();
        adminEngine.renderQueue(p => this.reader.open(p));
      } catch (err) {
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
      } finally {
        btnFetchUrl.disabled = false;
        if (statusEl) statusEl.style.display = 'none';
      }
    });

    // Share Modal
    const shareModal = document.getElementById('shareModal');
    const btnCloseShare = document.getElementById('btnCloseShare');
    const btnNativeShare = document.getElementById('btnNativeShare');
    const btnDownloadCard = document.getElementById('btnDownloadCard');

    btnCloseShare?.addEventListener('click', () => shareModal?.classList.remove('open'));
    
    btnNativeShare?.addEventListener('click', async () => {
      if (this.currentSharePrayer) {
        const res = await shareEngine.shareNative(this.currentSharePrayer);
        if (res === 'copied') this.showToast('คัดลอกข้อความบทสวดลงคลิปบอร์ดแล้ว ✨');
      }
    });

    btnDownloadCard?.addEventListener('click', () => {
      shareEngine.downloadCard(`dhamma-${this.currentSharePrayer?.id || 'card'}.png`);
      this.showToast('บันทึกรูปภาพการ์ดธรรมะเรียบร้อย 🪷');
    });

    // Admin Passcode Modal
    const adminAuthModal = document.getElementById('adminAuthModal');
    const btnSubmitPasscode = document.getElementById('btnSubmitPasscode');
    const btnCloseAdminAuth = document.getElementById('btnCloseAdminAuth');

    btnCloseAdminAuth?.addEventListener('click', () => adminAuthModal?.classList.remove('open'));
    btnSubmitPasscode?.addEventListener('click', () => {
      const code = document.getElementById('adminPasscodeInput').value;
      if (adminEngine.authenticate(code)) {
        adminAuthModal?.classList.remove('open');
        this.switchTab('admin');
        this.showToast('เข้าสู่ระบบแอดมินสำเร็จ 🛡️');
      } else {
        alert('รหัสผ่านไม่ถูกต้อง (ค่าเริ่มต้นคือ: admin123)');
      }
    });

    // Listen to prayer approved event
    window.addEventListener('tamma:prayer-approved', () => {
      this.renderLibrary();
      this.showToast('อนุมัติบทสวดลงระบบสาธารณะเรียบร้อยแล้ว ✨');
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });

    // Tab content views
    const viewLibrary = document.getElementById('viewLibrary');
    const viewTracker = document.getElementById('viewTracker');
    const viewFavorites = document.getElementById('viewFavorites');
    const viewAdmin = document.getElementById('viewAdmin');

    if (viewLibrary) viewLibrary.style.display = tabId === 'library' ? 'block' : 'none';
    if (viewTracker) viewTracker.style.display = tabId === 'tracker' ? 'block' : 'none';
    if (viewFavorites) viewFavorites.style.display = tabId === 'favorites' ? 'block' : 'none';
    if (viewAdmin) viewAdmin.style.display = tabId === 'admin' ? 'block' : 'none';

    if (tabId === 'tracker') {
      tracker.render();
    } else if (tabId === 'favorites') {
      this.renderFavorites();
    } else if (tabId === 'admin') {
      if (!storage.isAdmin()) {
        document.getElementById('adminAuthModal')?.classList.add('open');
      } else {
        adminEngine.renderQueue(p => this.reader.open(p));
      }
    } else {
      this.renderLibrary();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderLibrary() {
    const container = document.getElementById('prayerGrid');
    if (!container) return;

    let prayers = storage.getPrayers();

    // Filter by Category
    if (this.currentCategory !== 'all') {
      prayers = prayers.filter(p => p.category === this.currentCategory);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      prayers = prayers.filter(p => 
        p.title.toLowerCase().includes(this.searchQuery) ||
        (p.description && p.description.toLowerCase().includes(this.searchQuery)) ||
        (p.author && p.author.toLowerCase().includes(this.searchQuery))
      );
    }

    this.renderPrayerCards(container, prayers);
  }

  renderFavorites() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;

    const favIds = storage.getFavorites();
    const allPrayers = storage.getPrayers();
    const favPrayers = allPrayers.filter(p => favIds.includes(p.id));

    if (favPrayers.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 16px; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 10px;">💖</div>
          <div style="font-family: var(--font-header); font-size: 1.1rem;">ยังไม่มีรายการโปรด</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">กดไอคอนหัวใจที่บทสวดเพื่อบันทึกเป็นบทสวดประจำตัว</div>
        </div>
      `;
      return;
    }

    this.renderPrayerCards(container, favPrayers);
  }

  renderPrayerCards(container, prayers) {
    container.innerHTML = '';
    const trackerData = storage.getTrackerData();

    prayers.forEach(prayer => {
      const isFav = storage.isFavorite(prayer.id);
      const chantCount = trackerData.totalCounts[prayer.id] || 0;
      const pageCount = prayer.pages?.length || 1;

      const card = document.createElement('div');
      card.className = 'prayer-card';
      card.innerHTML = `
        <div>
          <div class="card-header">
            <span class="card-category">${prayer.category || 'บทสวดมนต์'}</span>
            <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${prayer.id}" aria-label="รายการโปรด">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="card-title">${prayer.title}</div>
          <div class="card-excerpt">${prayer.description || (prayer.pages?.[0]?.thai || prayer.pages?.[0]?.pali || '')}</div>
        </div>
        <div class="card-footer">
          <div class="card-stats">
            <span class="card-stat-item">📖 ${pageCount} หน้า</span>
            <span class="card-stat-item">🔔 ${chantCount} จบ</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn-icon btn-card-share" data-id="${prayer.id}" style="width: 32px; height: 32px; font-size: 0.85rem;" title="แชร์บทสวด">
              📤
            </button>
            <button class="btn-primary btn-read-card" style="padding: 4px 12px; font-size: 0.85rem;">
              เปิดอ่าน
            </button>
          </div>
        </div>
      `;

      // Card Click -> Open Comic Reader
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-fav-btn') || e.target.closest('.btn-card-share')) return;
        this.reader.open(prayer);
      });

      // Favorite toggle
      card.querySelector('.card-fav-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playTick();
        const active = storage.toggleFavorite(prayer.id);
        e.currentTarget.classList.toggle('active', active);
        e.currentTarget.textContent = active ? '❤️' : '🤍';
        this.showToast(active ? `เพิ่ม "${prayer.title}" ในรายการโปรดแล้ว` : 'นำออกจากรายการโปรด');
        if (this.activeTab === 'favorites') this.renderFavorites();
      });

      // Share button
      card.querySelector('.btn-card-share')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openShareModal(prayer);
      });

      container.appendChild(card);
    });
  }

  openShareModal(prayer) {
    this.currentSharePrayer = prayer;
    const modal = document.getElementById('shareModal');
    const titleEl = document.getElementById('sharePrayerTitle');
    if (titleEl) titleEl.textContent = prayer.title;

    // Generate Card Preview on Canvas
    shareEngine.generateCard(prayer);
    modal?.classList.add('open');
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }
}

// Auto bootstrap when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  window.tammaApp = new TammaApp();
  window.tammaApp.init();
});
