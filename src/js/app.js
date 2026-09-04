import { storage } from './storage.js';
import { audio } from './audio.js';
import { ComicReaderEngine, FONT_FAMILIES } from './reader.js';
import { tracker } from './tracker.js';
import { scraper } from './scraper.js';
import { shareEngine } from './share.js';
import { starfield } from './starfield.js';
import { nativeBridge } from './native-bridge.js';
import { renderQRCodeToCanvas } from './qrcode.js';
import { tipitakaLoader } from './tipitaka-loader.js';
import { mp3Player } from './mp3-player.js';

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
    const currentTheme = settings.theme || 'cosmic';
    const currentFont = settings.fontFamily || 'sarabun';
    document.body.className = `theme-${currentTheme} font-${currentFont}`;
    
    const fontInfo = FONT_FAMILIES[currentFont];
    if (fontInfo && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--reader-font-family', fontInfo.family);
    }
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
      const settings = storage.getSettings();
      const currentTheme = settings.theme || 'cosmic';
      let idx = themes.indexOf(currentTheme);
      idx = (idx + 1) % themes.length;
      const newTheme = themes[idx];
      
      const currentFont = settings.fontFamily || 'sarabun';
      document.body.className = `theme-${newTheme} font-${currentFont}`;
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

    // Tipitaka Pitaka Select Dropdown
    const tipitakaSelect = document.getElementById('tipitakaSelect');
    tipitakaSelect?.addEventListener('change', (e) => {
      this.tipitakaPitaka = e.target.value || 'all';
      this.renderTipitaka();
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
    const btnSaveQrImage = document.getElementById('btnSaveQrImage');
    const btnScanQrCamera = document.getElementById('btnScanQrCamera');
    const inputQrImage = document.getElementById('inputQrImage');
    const qrScannerContainer = document.getElementById('qrScannerContainer');
    const qrScannerVideo = document.getElementById('qrScannerVideo');
    const btnCloseScanner = document.getElementById('btnCloseScanner');

    let qrStream = null;
    let qrScanInterval = null;

    // Helper: Universal QR Code decoder from ImageData using bundled jsQR
    const decodeQRCodeFromImageData = (imageData) => {
      if (typeof jsQR !== 'undefined') {
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });
          if (code && code.data) return code.data;
        } catch (e) {
          console.warn('jsQR decode error:', e);
        }
      }
      return null;
    };

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

    // About & Privacy Policy Modal
    const btnOpenAbout = document.getElementById('btnOpenAbout');
    const btnCloseAbout = document.getElementById('btnCloseAbout');
    const aboutModal = document.getElementById('aboutModal');

    btnOpenAbout?.addEventListener('click', () => {
      aboutModal?.classList.add('open');
    });

    btnCloseAbout?.addEventListener('click', () => {
      aboutModal?.classList.remove('open');
    });

    aboutModal?.addEventListener('click', (e) => {
      if (e.target === aboutModal) aboutModal.classList.remove('open');
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

    // 3. Save QR Code Image to Device (Download PNG)
    btnSaveQrImage?.addEventListener('click', () => {
      if (!qrCanvas) return;
      try {
        const dataUrl = qrCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        const today = new Date().toISOString().slice(0, 10);
        a.href = dataUrl;
        a.download = `tamma-backup-qr-${today}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showToast('💾 บันทึกภาพ QR Code ลงเครื่องเรียบร้อยแล้ว!');
      } catch (err) {
        alert('ไม่สามารถบันทึกภาพได้: ' + err.message);
      }
    });

    // 4. QR Camera Scanner (Live Video Stream with Fallback)
    btnScanQrCamera?.addEventListener('click', async () => {
      try {
        qrStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (qrScannerVideo && qrScannerContainer) {
          qrScannerVideo.srcObject = qrStream;
          qrScannerVideo.play();
          qrScannerContainer.style.display = 'block';

          let barcodeDetector = null;
          if ('BarcodeDetector' in window) {
            try {
              barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
            } catch (e) {
              barcodeDetector = null;
            }
          }

          qrScanInterval = setInterval(async () => {
            try {
              let qrValue = null;

              // 1. Try BarcodeDetector
              if (barcodeDetector) {
                const barcodes = await barcodeDetector.detect(qrScannerVideo);
                if (barcodes.length > 0) qrValue = barcodes[0].rawValue;
              }

              // 2. Try jsQR on video frame
              if (!qrValue && typeof jsQR !== 'undefined' && qrScannerVideo.videoWidth > 0) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = qrScannerVideo.videoWidth;
                tempCanvas.height = qrScannerVideo.videoHeight;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(qrScannerVideo, 0, 0);
                const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                qrValue = decodeQRCodeFromImageData(imgData);
              }

              if (qrValue) {
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

    // 5. QR Image File Picker Scanner (Universal Canvas + jsQR)
    inputQrImage?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          let qrValue = null;

          // 1. Primary: Canvas + jsQR
          try {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);
            const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
            qrValue = decodeQRCodeFromImageData(imgData);
          } catch (err) {
            console.warn('Canvas jsQR error:', err);
          }

          // 2. Secondary fallback: BarcodeDetector
          if (!qrValue && ('BarcodeDetector' in window)) {
            try {
              const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
              const barcodes = await barcodeDetector.detect(img);
              if (barcodes.length > 0) qrValue = barcodes[0].rawValue;
            } catch (err) {
              console.warn('BarcodeDetector fallback error:', err);
            }
          }

          if (qrValue) {
            const result = storage.importData(qrValue);
            if (result.success) {
              this.refreshCurrentViews();
              this.applyInitialSettings();
              backupModal?.classList.remove('open');
              inputQrImage.value = '';
              this.showToast('✨ กู้คืนข้อมูลจากรูปภาพ QR Code สำเร็จเรียบร้อย! 🎉');
            } else {
              alert('ข้อมูลในรูปภาพ QR Code ไม่ถูกต้อง หรือไม่ใช่ข้อมูลของแอปบทสวดมนต์');
            }
          } else {
            alert('ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาเลือกภาพที่เห็น QR Code ชัดเจน');
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
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
    if (this.currentCategory === 'has-audio') {
      prayers = prayers.filter(p => !!mp3Player.getTrackForPrayer(p));
    } else if (this.currentCategory !== 'all') {
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

    // Sort: Favorites first (รายการโปรดขึ้นก่อน)
    prayers.sort((a, b) => {
      const favA = storage.isFavorite(a.id) ? 1 : 0;
      const favB = storage.isFavorite(b.id) ? 1 : 0;
      return favB - favA;
    });

    this.updateCategoryDropdownCounts(allPrayers);
    this.renderPrayerCards(container, prayers);
  }

  updateCategoryDropdownCounts(allPrayers = null) {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect) return;

    if (!allPrayers) {
      allPrayers = storage.getPrayers().filter(p => p.status !== 'hidden');
    }

    const toThai = (n) => String(n).replace(/[0-9]/g, d => ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'][d]);

    const categoryCounts = {};
    let withAudioCount = 0;
    allPrayers.forEach(p => {
      const cat = p.category || 'บทสวดมนต์';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (mp3Player.getTrackForPrayer(p)) {
        withAudioCount++;
      }
    });

    const categoryIcons = {
      'all': '✨',
      'has-audio': '🎵',
      'หลวงพ่อจรัญ': '🪷',
      'หลวงปู่มั่น': '⛰️',
      'หลวงตามหาบัว': '🪷',
      'แผ่เมตตา': '💖',
      'คาถาศักดิ์สิทธิ์': '🌟',
      'บทสวดประจำวัน': '🙏',
      'ชัยมงคลคาถา': '🛡️',
      'ทำวัตร': '📜',
      'พระสูตรสำคัญ': '📖',
      'พระเกจิอาจารย์': '📿',
      'พิธีกรรม': '🕯️'
    };

    Array.from(categorySelect.options).forEach(opt => {
      const val = opt.value;
      const icon = categoryIcons[val] || '📿';
      if (val === 'all') {
        opt.textContent = `${icon} ทุกหมวดหมู่ (${toThai(allPrayers.length)} บท)`;
      } else if (val === 'has-audio') {
        opt.textContent = `${icon} มีเสียงพระสวดจริง (${toThai(withAudioCount)} บท)`;
      } else {
        const count = categoryCounts[val] || 0;
        const baseName = opt.textContent.replace(/^[^\s]+\s+/, '').replace(/\s*\([^)]*\)$/, '').trim();
        opt.textContent = `${icon} ${baseName} (${toThai(count)} บท)`;
      }
    });
  }

  async renderFavorites() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;

    const favIds = storage.getFavorites();
    const allPrayers = storage.getPrayers();
    let favPrayers = allPrayers.filter(p => favIds.includes(p.id));

    // Also include favorited Tipitaka volumes
    const tipitakaFavIds = favIds.filter(id => id.startsWith('tipitaka-vol-'));
    if (tipitakaFavIds.length > 0) {
      try {
        const index = await tipitakaLoader.loadIndex();
        (index.volumes || []).forEach(vol => {
          const volId = `tipitaka-vol-${String(vol.volume).padStart(2, '0')}`;
          if (tipitakaFavIds.includes(volId) && !favPrayers.some(p => p.id === volId)) {
            favPrayers.push({
              id: volId,
              isTipitaka: true,
              volumeNumber: vol.volume,
              title: `พระไตรปิฎก เล่มที่ ${vol.volume}: ${vol.bookTitle}`,
              category: vol.pitaka,
              author: `พระไตรปิฎก (${vol.bookPali})`,
              description: vol.description,
              status: 'approved',
              pages: []
            });
          }
        });
      } catch (err) {
        console.warn('Failed to load Tipitaka index in favorites:', err);
      }
    }

    const favCountSubtitle = document.querySelector('#viewFavorites p');
    if (favCountSubtitle) {
      const toThai = (n) => String(n).replace(/[0-9]/g, d => ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'][d]);
      favCountSubtitle.textContent = `บทสวดมนต์และพระไตรปิฎกที่คุณบันทึกไว้ (${toThai(favPrayers.length)} รายการ)`;
    }

    if (favPrayers.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 16px; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 10px;">💖</div>
          <div style="font-family: var(--font-header); font-size: 1.1rem;">ยังไม่มีรายการโปรด</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">กดไอคอนหัวใจที่บทสวดหรือพระไตรปิฎกเพื่อบันทึกเป็นรายการโปรด</div>
        </div>
      `;
      return;
    }

    this.renderPrayerCards(container, favPrayers);
  }

  getLotusBgSvgHtml() {
    return `
      <div class="lotus-bg-container">
        <svg class="lotus-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 95 C 48 90, 48 85, 50 80 C 52 85, 52 90, 50 95 Z" fill="currentColor" stroke="none" opacity="0.6"/>
          <path class="petal-outer-left" d="M50 80 C 25 75, 15 65, 15 50 C 25 55, 35 65, 50 80 Z"/>
          <path class="petal-outer-right" d="M50 80 C 75 75, 85 65, 85 50 C 75 55, 65 65, 50 80 Z"/>
          <path class="petal-inner-left" d="M50 80 C 35 65, 30 50, 35 35 C 40 45, 45 60, 50 80 Z"/>
          <path class="petal-inner-right" d="M50 80 C 65 65, 70 50, 65 35 C 60 45, 55 60, 50 80 Z"/>
          <path class="petal-center" d="M50 80 C 40 60, 45 40, 50 20 C 55 40, 60 60, 50 80 Z"/>
          <path class="petal-leaf-left" d="M50 85 C 20 85, 10 90, 10 95 C 25 92, 35 90, 50 85 Z"/>
          <path class="petal-leaf-right" d="M50 85 C 80 85, 90 90, 90 95 C 75 92, 65 90, 50 85 Z"/>
        </svg>
      </div>
    `;
  }

  renderPrayerCards(container, prayers) {
    container.innerHTML = '';
    const trackerData = storage.getTrackerData();

    prayers.forEach(prayer => {
      const isFav = storage.isFavorite(prayer.id);
      const chantCount = trackerData.totalCounts[prayer.id] || 0;
      const audioTrack = mp3Player.getTrackForPrayer(prayer);
      const hasAudio = !!audioTrack;
      const bloomProgress = Math.min(chantCount / 9, 1);

      const card = document.createElement('div');
      card.className = `prayer-card ${hasAudio ? 'has-monk-audio' : ''}`;
      card.style.setProperty('--bloom-progress', bloomProgress);
      card.innerHTML = `
        ${this.getLotusBgSvgHtml()}
        <div class="card-inner-content">
          <div>
            <div class="card-header">
              <div class="card-badges">
                <span class="card-category">${prayer.category || 'บทสวดมนต์'}</span>
                ${hasAudio ? `
                  <span class="card-audio-badge" title="มีเสียงพระสงฆ์สวดจริง: ${audioTrack.title} (${audioTrack.temple})">
                    <span class="audio-wave-dot"></span>🎵 มีเสียงพระสวด
                  </span>
                ` : ''}
              </div>
              <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${prayer.id}" aria-label="รายการโปรด">
                ${isFav ? '❤️' : '🤍'}
              </button>
            </div>
            <div class="card-title">${prayer.title}</div>
            ${prayer.author ? `<div class="card-author" title="${prayer.author}">🙏 ${prayer.author}</div>` : ''}
            <div class="card-excerpt">${prayer.description || (prayer.pages?.[0]?.thai || prayer.pages?.[0]?.pali || '')}</div>
          </div>
          <div class="card-footer">
            <div class="card-stats">
              <span class="card-stat-item">🔔 ${chantCount} จบ</span>
              ${hasAudio && audioTrack.temple ? `
                <span class="card-stat-audio" title="บันทึกเสียงจาก: ${audioTrack.temple}">
                  🎧 ${audioTrack.temple.split('/')[0].trim()}
                </span>
              ` : ''}
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
        </div>
      `;

      // Card Click -> Open Comic Reader or Tipitaka
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-fav-btn') || e.target.closest('.btn-card-share')) return;
        if (prayer.isTipitaka && prayer.volumeNumber) {
          this.openTipitakaVolume(prayer.volumeNumber);
        } else {
          this.reader.open(prayer);
        }
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
        tracker.render();
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

      // Sort: Favorites first (รายการโปรดขึ้นก่อน)
      volumes.sort((a, b) => {
        const volIdA = `tipitaka-vol-${String(a.volume).padStart(2, '0')}`;
        const volIdB = `tipitaka-vol-${String(b.volume).padStart(2, '0')}`;
        const favA = storage.isFavorite(volIdA) ? 1 : 0;
        const favB = storage.isFavorite(volIdB) ? 1 : 0;
        if (favA !== favB) {
          return favB - favA;
        }
        return a.volume - b.volume;
      });

      container.innerHTML = '';
      const trackerData = storage.getTrackerData();

      volumes.forEach(vol => {
        const card = document.createElement('div');
        card.className = 'prayer-card';
        const volId = `tipitaka-vol-${String(vol.volume).padStart(2, '0')}`;
        const isFav = storage.isFavorite(volId);
        const chantCount = trackerData.totalCounts[volId] || 0;
        
        let pitakaBadgeClass = 'rgba(218, 165, 32, 0.15)';
        let pitakaColor = 'var(--accent-gold)';
        if (vol.pitaka === 'พระวินัยปิฎก') {
          pitakaColor = '#e07a5f';
        } else if (vol.pitaka === 'พระสุตตันตปิฎก') {
          pitakaColor = '#81b29a';
        } else if (vol.pitaka === 'พระอภิธรรมปิฎก') {
          pitakaColor = '#9d4edd';
        }

        const bloomProgress = Math.min(chantCount / 9, 1);
        card.style.setProperty('--bloom-progress', bloomProgress);

        card.innerHTML = `
          ${this.getLotusBgSvgHtml()}
          <div class="card-inner-content">
            <div>
              <div class="card-header">
                <span class="card-category" style="color: ${pitakaColor}; background: ${pitakaBadgeClass}; border: 1px solid ${pitakaColor};">
                  ${vol.pitaka} • เล่มที่ ${vol.volume}
                </span>
                <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${volId}" aria-label="รายการโปรด">
                  ${isFav ? '❤️' : '🤍'}
                </button>
              </div>
              <div class="card-title">${vol.bookTitle}</div>
              <div style="font-size: 0.8rem; color: var(--accent-gold); margin-bottom: 6px; font-style: italic;">${vol.bookPali}</div>
              <div class="card-excerpt">${vol.description}</div>
            </div>
            <div class="card-footer" style="margin-top: 12px;">
              <div class="card-stats">
                <span class="card-stat-item">📑 ${vol.totalSections} กัณฑ์/สูตร</span>
                <span class="card-stat-item" style="margin-left: 8px;">🔔 ${chantCount} จบ</span>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="btn-icon btn-card-share" data-id="${volId}" style="width: 32px; height: 32px; font-size: 0.85rem;" title="แชร์">
                  📤
                </button>
                <button class="btn-primary btn-read-card" style="padding: 4px 14px; font-size: 0.85rem;">
                  📖 เปิดอ่าน
                </button>
              </div>
            </div>
          </div>
        `;

        card.addEventListener('click', (e) => {
          if (e.target.closest('.card-fav-btn') || e.target.closest('.btn-card-share')) return;
          this.openTipitakaVolume(vol.volume);
        });

        // Favorite Toggle
        card.querySelector('.card-fav-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          audio.playTick();
          const active = storage.toggleFavorite(volId);
          e.currentTarget.classList.toggle('active', active);
          e.currentTarget.textContent = active ? '❤️' : '🤍';
          this.showToast(active ? `เพิ่ม "พระไตรปิฎก เล่มที่ ${vol.volume}" ในรายการโปรดแล้ว` : 'นำออกจากรายการโปรด');
          if (this.activeTab === 'favorites') this.renderFavorites();
          tracker.render();
        });

        // Share button
        card.querySelector('.btn-card-share')?.addEventListener('click', (e) => {
          e.stopPropagation();
          const prayerObj = {
            id: volId,
            title: `พระไตรปิฎก เล่มที่ ${vol.volume}: ${vol.bookTitle}`,
            category: vol.pitaka,
            author: `พระไตรปิฎก (${vol.bookPali})`,
            description: vol.description
          };
          this.openShareModal(prayerObj);
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
      this.showToast(`📖 กำลังเปิดพระไตรปิฎก เล่มที่ ${volumeNumber}...`);
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

// Auto bootstrap when DOM loaded (Supports instant WKWebView initialization)
function bootstrap() {
  if (!window.tammaApp) {
    window.tammaApp = new TammaApp();
    window.tammaApp.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
