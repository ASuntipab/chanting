import { storage } from './storage.js';
import { audio } from './audio.js';
import { ComicReaderEngine } from './reader.js';
import { tracker } from './tracker.js';
import { scraper } from './scraper.js';
import { shareEngine } from './share.js';
import { starfield } from './starfield.js';
import { nativeBridge } from './native-bridge.js';
import { renderQRCodeToCanvas } from './qrcode.js';
import { tipitakaLoader } from './tipitaka-loader.js';

class TammaApp {
  constructor() {
    this.reader = null;
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.tipitakaPitaka = 'all';
    this.tipitakaQuery = '';
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

    console.log('🙏 แอปพลิเคชันบทสวดมนต์ เริ่มทำงาน (100% Offline-First).');
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

    // Theme Toggle Button
    const btnToggleTheme = document.getElementById('btnToggleTheme');
    const themes = ['cosmic', 'gold', 'parchment', 'midnight'];
    const themeNames = ['🌌 จักรวาล', '🌟 ทองอร่าม', '📜 ใบลาน', '🌙 ราตรีสงบ'];
    btnToggleTheme?.addEventListener('click', () => {
      const currentTheme = storage.getSettings().theme || 'cosmic';
      let idx = themes.indexOf(currentTheme);
      idx = (idx + 1) % themes.length;
      const newTheme = themes[idx];
      document.body.className = `theme-${newTheme}`;
      storage.saveSettings({ theme: newTheme });
      this.showToast(`เปลี่ยนธีม: ${themeNames[idx]}`);
    });

    // Search Input
    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderLibrary();
    });

    // Category Dropdown Select
    const categorySelect = document.getElementById('categorySelect');
    categorySelect?.addEventListener('change', (e) => {
      this.currentCategory = e.target.value || 'all';
      this.renderLibrary();
    });

    // Tipitaka Search Input
    const tipitakaSearchInput = document.getElementById('tipitakaSearchInput');
    tipitakaSearchInput?.addEventListener('input', (e) => {
      this.tipitakaQuery = e.target.value.toLowerCase().trim();
      this.renderTipitaka();
    });

    // Tipitaka Filter Pills
    document.querySelectorAll('.tipitaka-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.tipitaka-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.tipitakaPitaka = pill.dataset.pitaka || 'all';
        this.renderTipitaka();
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
    const btnCopyBackupCode = document.getElementById('btnCopyBackupCode');
    const inputBackupCode = document.getElementById('inputBackupCode');
    const btnRestoreCode = document.getElementById('btnRestoreCode');
    const importFileInput = document.getElementById('importFileInput');
    
    // Backup Method Tabs
    const tabBackupLine = document.getElementById('tabBackupLine');
    const tabBackupQr = document.getElementById('tabBackupQr');
    const tabBackupFile = document.getElementById('tabBackupFile');
    const panelBackupLine = document.getElementById('panelBackupLine');
    const panelBackupQr = document.getElementById('panelBackupQr');
    const panelBackupFile = document.getElementById('panelBackupFile');
    const qrCanvas = document.getElementById('qrCanvas');
    const btnScanQrCamera = document.getElementById('btnScanQrCamera');
    const inputQrImage = document.getElementById('inputQrImage');
    const qrScannerContainer = document.getElementById('qrScannerContainer');
    const qrScannerVideo = document.getElementById('qrScannerVideo');
    const btnCloseScanner = document.getElementById('btnCloseScanner');

    let qrStream = null;
    let qrScanInterval = null;

    const stopQrScanner = () => {
      if (qrStream) {
        qrStream.getTracks().forEach(t => t.stop());
        qrStream = null;
      }
      if (qrScanInterval) {
        clearInterval(qrScanInterval);
        qrScanInterval = null;
      }
      if (qrScannerContainer) qrScannerContainer.style.display = 'none';
    };

    const updateQrCanvas = () => {
      if (qrCanvas) {
        const backupCode = storage.exportBackupCode();
        renderQRCodeToCanvas(qrCanvas, backupCode, 200);
      }
    };

    btnOpenBackup?.addEventListener('click', () => {
      backupModal?.classList.add('open');
      updateQrCanvas();
    });

    btnCloseBackup?.addEventListener('click', () => {
      stopQrScanner();
      backupModal?.classList.remove('open');
    });

    // Switch Backup Method Tabs
    const switchBackupTab = (activeTab, activePanel) => {
      [tabBackupLine, tabBackupQr, tabBackupFile].forEach(t => t?.classList.remove('active'));
      [panelBackupLine, panelBackupQr, panelBackupFile].forEach(p => {
        if (p) p.style.display = 'none';
      });
      activeTab?.classList.add('active');
      if (activePanel) activePanel.style.display = 'block';
    };

    tabBackupLine?.addEventListener('click', () => {
      stopQrScanner();
      switchBackupTab(tabBackupLine, panelBackupLine);
    });

    tabBackupQr?.addEventListener('click', () => {
      switchBackupTab(tabBackupQr, panelBackupQr);
      updateQrCanvas();
    });

    tabBackupFile?.addEventListener('click', () => {
      stopQrScanner();
      switchBackupTab(tabBackupFile, panelBackupFile);
    });

    // 1. Easy Copy Backup Code (For LINE / Notes)
    btnCopyBackupCode?.addEventListener('click', async () => {
      const code = storage.exportBackupCode();
      const message = `🙏 ข้อมูลสำรองบทสวดมนต์ของคุณ:\n${code}\n\n(นำรหัสนี้ไปกด 'วางรหัสเพื่อกู้คืน' ในแอปบทสวดมนต์บนเครื่องใหม่)`;
      try {
        await navigator.clipboard.writeText(message);
        this.showToast('📋 คัดลอกรหัสสำรองแล้ว! ส่งเก็บไว้ใน LINE ได้เลย');
      } catch (err) {
        prompt('คัดลอกรหัสสำรองด้านล่างนี้ไปเก็บไว้:', code);
      }
    });

    // 2. Easy Restore from Pasted Code
    btnRestoreCode?.addEventListener('click', () => {
      const rawText = inputBackupCode?.value?.trim();
      if (!rawText) {
        alert('กรุณาวางรหัสสำรองที่คัดลอกมา');
        return;
      }

      // Extract code if user pasted full message
      let codeToImport = rawText;
      const lines = rawText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('🙏') && !trimmed.startsWith('(')) {
          codeToImport = trimmed;
          break;
        }
      }

      const result = storage.importData(codeToImport);
      if (result.success) {
        this.refreshCurrentViews();
        this.applyInitialSettings();
        backupModal?.classList.remove('open');
        if (inputBackupCode) inputBackupCode.value = '';
        this.showToast('✨ กู้คืนสถิติและรายการโปรดสำเร็จเรียบร้อย! 🎉');
      } else {
        alert(`รหัสสำรองไม่ถูกต้อง หรือข้อมูลเสียหาย: ${result.error || ''}`);
      }
    });

    // 3. QR Camera Scanner
    btnScanQrCamera?.addEventListener('click', async () => {
      if (!('BarcodeDetector' in window)) {
        alert('เบราว์เซอร์นี้ไม่รองรับการสแกนกล้องสดโดยตรง กรุณาใช้การถ่ายรูป QR Code หรือใช้วิธีคัดลอกรหัสส่ง LINE แทนครับ');
        return;
      }

      try {
        qrStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (qrScannerVideo && qrScannerContainer) {
          qrScannerVideo.srcObject = qrStream;
          qrScannerVideo.play();
          qrScannerContainer.style.display = 'block';

          const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
          qrScanInterval = setInterval(async () => {
            try {
              const barcodes = await barcodeDetector.detect(qrScannerVideo);
              if (barcodes.length > 0) {
                const qrValue = barcodes[0].rawValue;
                stopQrScanner();
                const result = storage.importData(qrValue);
                if (result.success) {
                  this.refreshCurrentViews();
                  this.applyInitialSettings();
                  backupModal?.classList.remove('open');
                  this.showToast('✨ สแกน QR Code กู้คืนข้อมูลสำเร็จเรียบร้อย! 🎉');
                } else {
                  alert('ข้อมูลใน QR Code ไม่ถูกต้อง');
                }
              }
            } catch (err) {
              // Frame scan error, ignore
            }
          }, 300);
        }
      } catch (err) {
        alert('ไม่สามารถเปิดกล้องได้: ' + (err.message || 'กรุณาอนุญาตให้เข้าถึงกล้อง'));
      }
    });

    btnCloseScanner?.addEventListener('click', stopQrScanner);

    // 4. QR Image File Picker Scanner
    inputQrImage?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!('BarcodeDetector' in window)) {
        alert('เบราว์เซอร์นี้ไม่รองรับการอ่าน QR จากภาพ กรุณาใช้วิธีคัดลอกรหัสส่ง LINE แทนครับ');
        return;
      }

      const img = new Image();
      img.onload = async () => {
        try {
          const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes.length > 0) {
            const qrValue = barcodes[0].rawValue;
            const result = storage.importData(qrValue);
            if (result.success) {
              this.refreshCurrentViews();
              this.applyInitialSettings();
              backupModal?.classList.remove('open');
              inputQrImage.value = '';
              this.showToast('✨ อ่าน QR Code กู้คืนข้อมูลสำเร็จเรียบร้อย! 🎉');
            } else {
              alert('ข้อมูลใน QR Code ไม่ถูกต้อง');
            }
          } else {
            alert('ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาลองเลือกรูปใหม่');
          }
        } catch (err) {
          alert('ไม่สามารถอ่าน QR Code ได้: ' + err.message);
        }
      };
      img.src = URL.createObjectURL(file);
    });

    // 5. Export JSON File Action
    btnExportJson?.addEventListener('click', () => {
      const jsonStr = storage.exportData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhamma-stats-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      this.showToast('ส่งออกไฟล์สถิติ (JSON) เรียบร้อย 💾');
    });

    // 6. Import JSON File Action
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
          this.refreshCurrentViews();
          this.applyInitialSettings();
          backupModal?.classList.remove('open');
          if (importFileInput) importFileInput.value = '';
          this.showToast('✨ กู้คืนสถิติและรายการโปรดสำเร็จเรียบร้อย! 🎉');
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
    const viewTipitaka = document.getElementById('viewTipitaka');
    const viewTracker = document.getElementById('viewTracker');
    const viewFavorites = document.getElementById('viewFavorites');

    if (viewLibrary) viewLibrary.style.display = tabId === 'library' ? 'block' : 'none';
    if (viewTipitaka) viewTipitaka.style.display = tabId === 'tipitaka' ? 'block' : 'none';
    if (viewTracker) viewTracker.style.display = tabId === 'tracker' ? 'block' : 'none';
    if (viewFavorites) viewFavorites.style.display = tabId === 'favorites' ? 'block' : 'none';

    if (tabId === 'tracker') {
      tracker.render();
    } else if (tabId === 'favorites') {
      this.renderFavorites();
    } else if (tabId === 'tipitaka') {
      this.renderTipitaka();
    } else {
      this.renderLibrary();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  refreshCurrentViews() {
    this.renderLibrary();
    tracker.render();
    if (this.activeTab === 'favorites') {
      this.renderFavorites();
    } else if (this.activeTab === 'tipitaka') {
      this.renderTipitaka();
    }
  }

  renderLibrary() {
    const container = document.getElementById('prayerGrid');
    if (!container) return;

    const allPrayers = storage.getPrayers();
    let prayers = [...allPrayers];

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

    // Update Total Count & Filter Status Badge
    const countEl = document.getElementById('prayerTotalCountText');
    if (countEl) {
      const toThai = (n) => String(n).replace(/[0-9]/g, d => ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'][d]);
      const totalAll = allPrayers.length;
      const totalPages = allPrayers.reduce((acc, p) => acc + (p.pages?.length || 1), 0);

      if (this.currentCategory === 'all' && !this.searchQuery) {
        countEl.innerHTML = `บทสวดมนต์ทั้งหมด <strong>${toThai(totalAll)}</strong> บท (${toThai(totalPages)} หน้า)`;
      } else if (this.searchQuery) {
        countEl.innerHTML = `ค้นพบ <strong>${toThai(prayers.length)}</strong> บท จากคำค้น "${this.searchQuery}" (จากทั้งหมด ${toThai(totalAll)} บท)`;
      } else {
        countEl.innerHTML = `หมวดหมู่ <strong>${this.currentCategory}</strong>: <strong>${toThai(prayers.length)}</strong> บท (จากทั้งหมด ${toThai(totalAll)} บท)`;
      }
    }

    this.renderPrayerCards(container, prayers);
  }

  renderFavorites() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;

    const favIds = storage.getFavorites();
    const allPrayers = storage.getPrayers();
    const favPrayers = allPrayers.filter(p => favIds.includes(p.id));

    const favCountSubtitle = document.querySelector('#viewFavorites p');
    if (favCountSubtitle) {
      const toThai = (n) => String(n).replace(/[0-9]/g, d => ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'][d]);
      favCountSubtitle.textContent = `บทสวดมนต์ที่คุณบันทึกไว้เปิดสวดเป็นประจำ (${toThai(favPrayers.length)} บท)`;
    }

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

  async renderTipitaka() {
    const container = document.getElementById('tipitakaGrid');
    if (!container) return;

    try {
      const index = await tipitakaLoader.loadIndex();
      let volumes = index.volumes || [];

      // Filter by Pitaka
      if (this.tipitakaPitaka !== 'all') {
        volumes = volumes.filter(v => v.pitaka === this.tipitakaPitaka);
      }

      // Filter by Search Query
      if (this.tipitakaQuery) {
        volumes = await tipitakaLoader.search(this.tipitakaQuery);
        if (this.tipitakaPitaka !== 'all') {
          volumes = volumes.filter(v => v.pitaka === this.tipitakaPitaka);
        }
      }

      if (volumes.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 48px 16px; color: var(--text-muted);">
            <div style="font-size: 3rem; margin-bottom: 10px;">🔍</div>
            <div style="font-family: var(--font-header); font-size: 1.1rem;">ไม่พบข้อมูลพระไตรปิฎกที่ค้นหา</div>
            <div style="font-size: 0.85rem; margin-top: 4px;">ลองเปลี่ยนคำค้นหา เช่น ธรรมบท, มหาปรินิพพาน หรือเลือกหมวดหมู่อื่น</div>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      volumes.forEach(vol => {
        const card = document.createElement('div');
        card.className = 'prayer-card';
        
        let pitakaBadgeClass = 'rgba(218, 165, 32, 0.15)';
        let pitakaColor = 'var(--accent-gold)';
        if (vol.pitaka === 'พระวินัยปิฎก') {
          pitakaColor = '#e07a5f';
        } else if (vol.pitaka === 'พระสุตตันตปิฎก') {
          pitakaColor = '#81b29a';
        } else if (vol.pitaka === 'พระอภิธรรมปิฎก') {
          pitakaColor = '#9d4edd';
        }

        card.innerHTML = `
          <div>
            <div class="card-header">
              <span class="card-category" style="color: ${pitakaColor}; background: ${pitakaBadgeClass}; border: 1px solid ${pitakaColor};">
                ${vol.pitaka} • เล่มที่ ${vol.volume}
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">⚡ .br (${vol.brSizeKb} KB)</span>
            </div>
            <div class="card-title">${vol.bookTitle}</div>
            <div style="font-size: 0.8rem; color: var(--accent-gold); margin-bottom: 6px; font-style: italic;">${vol.bookPali}</div>
            <div class="card-excerpt">${vol.description}</div>
          </div>
          <div class="card-footer" style="margin-top: 12px;">
            <div class="card-stats">
              <span class="card-stat-item">📑 ${vol.totalSections} กัณฑ์/สูตร</span>
            </div>
            <button class="btn-primary btn-read-card" style="padding: 4px 14px; font-size: 0.85rem;">
              📖 เปิดอ่าน
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          this.openTipitakaVolume(vol.volume);
        });

        container.appendChild(card);
      });
    } catch (err) {
      console.error('Error rendering Tipitaka:', err);
      container.innerHTML = `<div style="grid-column:1/-1; color:var(--text-danger); text-align:center; padding:24px;">ไม่สามารถโหลดพระไตรปิฎกได้: ${err.message}</div>`;
    }
  }

  async openTipitakaVolume(volumeNumber) {
    try {
      this.showToast(`⚡ กำลังคลายการบีบอัด .br เล่มที่ ${volumeNumber}...`);
      const volData = await tipitakaLoader.loadVolume(volumeNumber);
      
      if (!volData || !volData.sections || volData.sections.length === 0) {
        this.showToast('ไม่พบเนื้อหาในเล่มนี้');
        return;
      }

      // Convert volume sections into a combined readable prayer object for Comic Reader
      const combinedPages = [];
      volData.sections.forEach(sec => {
        if (sec.pages && sec.pages.length > 0) {
          sec.pages.forEach(p => {
            combinedPages.push({
              pageNumber: combinedPages.length + 1,
              verseTitle: `${sec.title} (${sec.paliTitle})`,
              pali: p.pali,
              thai: p.thai
            });
          });
        }
      });

      const tipitakaPrayerObj = {
        id: `tipitaka-vol-${String(volumeNumber).padStart(2, '0')}`,
        title: `พระไตรปิฎก เล่มที่ ${volumeNumber}: ${volData.bookTitle}`,
        category: volData.pitaka,
        author: `พระไตรปิฎกฉบับสยามรัฐ (${volData.bookPali})`,
        description: volData.description,
        status: 'approved',
        pages: combinedPages
      };

      this.reader.open(tipitakaPrayerObj);
      this.showToast(`✨ เปิดพระไตรปิฎก เล่มที่ ${volumeNumber} สำเร็จ (${combinedPages.length} ตอน)`);
    } catch (err) {
      console.error('Failed to open Tipitaka volume:', err);
      this.showToast(`❌ เกิดข้อผิดพลาดในการโหลด: ${err.message}`);
    }
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
