import { storage } from './storage.js';
import { audio } from './audio.js';
import { ComicReaderEngine } from './reader.js';
import { tracker } from './tracker.js';
import { scraper } from './scraper.js';
import { shareEngine } from './share.js';
import { starfield } from './starfield.js';
import { nativeBridge } from './native-bridge.js';

class TammaApp {
  constructor() {
    this.reader = null;
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.activeTab = 'library';
  }

  init() {
    // 0. Initialize Native Mobile Bridge (iOS & Android)
    nativeBridge.init();

    // 1. Initialize Cosmic Starfield
    starfield.init();

    // 2. Initialize Reader Engine
    this.reader = new ComicReaderEngine();

    // 3. Initialize Settings & Theme
    this.applyInitialSettings();

    // 4. Render Views (100% Offline-First)
    this.renderLibrary();
    tracker.render();

    // 5. Check for Peer-to-Peer Shared Prayer in URL
    this.checkDeepLinkImport();

    // 6. Bind Global UI Events
    this.bindEvents();

    console.log('🙏 Tamma OS E-Book Engine Initialized (100% Offline-First).');
  }

  checkDeepLinkImport() {
    const urlParams = new URLSearchParams(window.location.search);
    const importPayload = urlParams.get('import');
    
    if (importPayload) {
      try {
        const decoded = decodeURIComponent(atob(importPayload));
        const prayer = JSON.parse(decoded);
        
        if (prayer && prayer.title && prayer.pages) {
          // Generate new ID to avoid collision
          prayer.id = 'shared-' + Date.now().toString(36);
          prayer.status = 'approved';
          storage.savePrayer(prayer);
          
          this.renderLibrary();
          this.showToast(`✨ รับบทสวด "${prayer.title}" จากเพื่อนสำเร็จ!`);
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Auto open
          setTimeout(() => this.reader.open(prayer), 500);
        }
      } catch (e) {
        console.error('Failed to parse shared prayer:', e);
        this.showToast('❌ ลิงก์บทสวดมนต์ไม่ถูกต้อง หรือข้อมูลเสียหาย');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
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

    // Suggest / Request Prayer Modal Triggers (+)
    const btnOpenUpload = document.getElementById('btnOpenUpload');
    const uploadModal = document.getElementById('uploadModal');
    const btnCloseUpload = document.getElementById('btnCloseUpload');
    const btnSendEmailAdmin = document.getElementById('btnSendEmailAdmin');
    const btnCopyEmailContent = document.getElementById('btnCopyEmailContent');

    btnOpenUpload?.addEventListener('click', () => uploadModal?.classList.add('open'));
    btnCloseUpload?.addEventListener('click', () => uploadModal?.classList.remove('open'));

    const getSuggestionPayload = () => {
      const title = document.getElementById('suggestTitle')?.value.trim() || 'ขอแนะนำบทสวดมนต์';
      const url = document.getElementById('suggestUrl')?.value.trim() || '-';
      const notes = document.getElementById('suggestNotes')?.value.trim() || '(ไม่มีข้อความเพิ่มเติม)';

      const emailSubject = encodeURIComponent(`[แนะนำบทสวดมนต์] ${title}`);
      const emailBody = encodeURIComponent(
        `สวัสดีทีมงาน / แอดมิน (admin@kaisoft.net),\n\n` +
        `ฉันขอแนะนำ/ขอเพิ่มบทสวดมนต์เข้าสู่ระบบ ธรรมะ E-Book ดังนี้ครับ:\n\n` +
        `📌 ชื่อบทสวด / พระอาจารย์ / วัด: ${title}\n` +
        `🔗 ลิงก์เว็บไซต์ หรือ YouTube: ${url}\n` +
        `📝 เนื้อหาบทสวด / ข้อความที่ต้องการบอก:\n${notes}\n\n` +
        `รบกวนช่วยนำเข้าสู่ระบบด้วยนะครับ ขอบคุณครับ 🙏`
      );

      const plainText = 
        `ส่งถึง: admin@kaisoft.net\n` +
        `หัวข้อ: [แนะนำบทสวดมนต์] ${title}\n\n` +
        `📌 ชื่อบทสวด / พระอาจารย์ / วัด: ${title}\n` +
        `🔗 ลิงก์ที่มา: ${url}\n` +
        `📝 เนื้อหา / รายละเอียด:\n${notes}`;

      return {
        mailtoUrl: `mailto:admin@kaisoft.net?subject=${emailSubject}&body=${emailBody}`,
        plainText
      };
    };

    // Action: Send Email via Mail Client
    btnSendEmailAdmin?.addEventListener('click', () => {
      const payload = getSuggestionPayload();
      window.location.href = payload.mailtoUrl;
      this.showToast('กำลังเปิดแอปพลิเคชันอีเมลของคุณ... 📧');
    });

    // Action: Copy Formatted Content & Email
    btnCopyEmailContent?.addEventListener('click', async () => {
      const payload = getSuggestionPayload();
      try {
        await navigator.clipboard.writeText(payload.plainText);
        this.showToast('📋 คัดลอกข้อความและอีเมล admin@kaisoft.net เรียบร้อย!');
      } catch (err) {
        alert(`กรุณาส่งข้อมูลมาที่: admin@kaisoft.net\n\n${payload.plainText}`);
      }
    });

    // Backup & Restore Modal Triggers
    const btnOpenBackup = document.getElementById('btnOpenBackup');
    const backupModal = document.getElementById('backupModal');
    const btnCloseBackup = document.getElementById('btnCloseBackup');
    const btnExportJson = document.getElementById('btnExportJson');
    const btnImportJson = document.getElementById('btnImportJson');
    const importFileInput = document.getElementById('importFileInput');

    btnOpenBackup?.addEventListener('click', () => backupModal?.classList.add('open'));
    btnCloseBackup?.addEventListener('click', () => backupModal?.classList.remove('open'));

    // Export JSON Action
    btnExportJson?.addEventListener('click', () => {
      const jsonStr = storage.exportData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tamma-prayers-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('ส่งออกไฟล์บทสวดมนต์ (JSON) เรียบร้อย 💾');
    });

    // Import JSON Action
    btnImportJson?.addEventListener('click', () => {
      const file = importFileInput?.files?.[0];
      if (!file) {
        alert('กรุณาเลือกไฟล์ .json ที่ต้องการนำเข้า');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = storage.importData(e.target.result);
        if (result.success) {
          this.renderLibrary();
          tracker.render();
          backupModal?.classList.remove('open');
          importFileInput.value = '';
          this.showToast(`นำเข้าสำเร็จ! เพิ่มบทสวดใหม่ ${result.addedCount} บท 🎉`);
        } else {
          alert(`นำเข้าไฟล์ไม่สำเร็จ: ${result.error}`);
        }
      };
      reader.readAsText(file);
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

    if (viewLibrary) viewLibrary.style.display = tabId === 'library' ? 'block' : 'none';
    if (viewTracker) viewTracker.style.display = tabId === 'tracker' ? 'block' : 'none';
    if (viewFavorites) viewFavorites.style.display = tabId === 'favorites' ? 'block' : 'none';

    if (tabId === 'tracker') {
      tracker.render();
    } else if (tabId === 'favorites') {
      this.renderFavorites();
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
