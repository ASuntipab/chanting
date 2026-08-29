/**
 * Tamma OS - Comic-Book Style E-Book Reader Engine
 * Handles Touch Swipe, 3D Page Turns, Auto-Pagination, Audio Chimes & Font Scaling
 */

import { audio } from './audio.js';
import { storage } from './storage.js';

export class ComicReaderEngine {
  constructor() {
    this.currentPrayer = null;
    this.currentPageIndex = 0;
    this.totalPages = 0;
    
    // HUD & Fullscreen State
    this.hudVisible = true;
    this.autoHideTimer = null;

    // Touch & Gesture Tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCurrentX = 0;
    this.touchStartTime = 0;
    this.isSwiping = false;
    this.swipeThreshold = 40; // min px for swipe trigger

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.readerView = document.getElementById('readerView');
    this.readerToolbar = document.getElementById('readerToolbar');
    this.readerBottomBar = document.getElementById('readerBottomBar');
    this.comicTrack = document.getElementById('comicTrack');
    this.readerTitle = document.getElementById('readerTitle');
    this.readerSubtitle = document.getElementById('readerSubtitle');
    this.readerPageDots = document.getElementById('readerPageDots');
    this.readerChantCount = document.getElementById('readerChantCount');
    this.btnPrev = document.getElementById('btnPrevPage');
    this.btnNext = document.getElementById('btnNextPage');
    this.btnClose = document.getElementById('btnCloseReader');
    this.btnSettings = document.getElementById('btnReaderSettings');
    this.settingsDrawer = document.getElementById('readerSettingsDrawer');
    
    // Font Sizing in Toolbar & Drawer
    this.btnToolbarFontPlus = document.getElementById('btnToolbarFontPlus');
    this.btnToolbarFontMinus = document.getElementById('btnToolbarFontMinus');
    this.toolbarFontSize = document.getElementById('toolbarFontSize');
    this.btnFontPlus = document.getElementById('btnFontPlus');
    this.btnFontMinus = document.getElementById('btnFontMinus');
    this.fontSizeDisplay = document.getElementById('fontSizeDisplay');
    this.btnToggleFullscreen = document.getElementById('btnToggleFullscreen');
    this.btnChantInReader = document.getElementById('btnChantInReader');
  }

  bindEvents() {
    if (!this.readerView) return;

    // Navigation buttons
    this.btnPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prevPage();
      this.scheduleAutoHide();
    });
    this.btnNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextPage();
      this.scheduleAutoHide();
    });
    this.btnClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    // Chanting counter inside reader
    this.btnChantInReader?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.currentPrayer) return;
      audio.playBell();
      const count = storage.incrementPrayerCount(this.currentPrayer.id);
      this.updateChantDisplay(count);
      this.animateCounterBump();
      this.scheduleAutoHide();
    });

    // Settings Toggle
    this.btnSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.settingsDrawer?.classList.toggle('open');
      this.scheduleAutoHide(6000);
    });

    document.addEventListener('click', (e) => {
      if (this.settingsDrawer?.classList.contains('open') && !this.settingsDrawer.contains(e.target) && e.target !== this.btnSettings) {
        this.settingsDrawer.classList.remove('open');
      }
    });

    // Font Sizing (Toolbar & Drawer)
    this.btnToolbarFontPlus?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustFontSize(0.1);
      this.scheduleAutoHide(4500);
    });
    this.btnToolbarFontMinus?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustFontSize(-0.1);
      this.scheduleAutoHide(4500);
    });
    this.btnFontPlus?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustFontSize(0.1);
      this.scheduleAutoHide(6000);
    });
    this.btnFontMinus?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustFontSize(-0.1);
      this.scheduleAutoHide(6000);
    });

    // Fullscreen Toggle
    this.btnToggleFullscreen?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
      this.scheduleAutoHide();
    });

    // Prevent clicks inside Toolbar & Bottom bar from toggling page
    this.readerToolbar?.addEventListener('click', (e) => e.stopPropagation());
    this.readerBottomBar?.addEventListener('click', (e) => e.stopPropagation());

    // Keyboard Arrow navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prevPage();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    // Touch Gestures & Tap Zones on Stage
    const stage = document.getElementById('comicStage');
    if (stage) {
      stage.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      stage.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
      stage.addEventListener('touchend', (e) => this.handleTouchEnd(e));
      
      // Mouse drag & click gestures for desktop
      stage.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
  }

  // --- HUD Auto-Hide & Toggle Mechanics ---
  showHUD() {
    this.hudVisible = true;
    this.readerView?.classList.remove('hud-hidden');
    this.scheduleAutoHide(4000);
  }

  hideHUD() {
    this.hudVisible = false;
    this.readerView?.classList.add('hud-hidden');
    this.settingsDrawer?.classList.remove('open');
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
  }

  toggleHUD() {
    if (this.hudVisible) {
      this.hideHUD();
    } else {
      this.showHUD();
    }
  }

  scheduleAutoHide(delay = 3500) {
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    this.autoHideTimer = setTimeout(() => {
      if (this.isOpen() && this.hudVisible && !this.settingsDrawer?.classList.contains('open')) {
        this.hideHUD();
      }
    }, delay);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  open(prayer, startPage = 0) {
    if (!prayer) return;
    this.currentPrayer = prayer;
    this.currentPageIndex = startPage;

    // Apply User Font Preference
    const settings = storage.getSettings();
    this.applyFontSize(settings.fontSize || 1.15);

    // Update Headers
    if (this.readerTitle) this.readerTitle.textContent = prayer.title;
    if (this.readerSubtitle) this.readerSubtitle.textContent = prayer.category || 'บทสวดมนต์';

    // Render Comic Pages
    this.renderPages(prayer);

    // Update Chant Count for this prayer
    const trackerData = storage.getTrackerData();
    const count = trackerData.totalCounts[prayer.id] || 0;
    this.updateChantDisplay(count);

    // Show View and start in HUD mode, then auto-hide
    this.readerView.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Go to Start Page
    this.goToPage(this.currentPageIndex, false);
    audio.playBell(528); // Miraculous tone on open

    // Show HUD briefly, then smoothly fade into zen fullscreen reading
    this.showHUD();
  }

  close() {
    this.readerView.classList.remove('active');
    this.settingsDrawer?.classList.remove('open');
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    document.body.style.overflow = '';
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  isOpen() {
    return this.readerView.classList.contains('active');
  }

  /**
   * Intelligently renders and paginates prayer content into Comic frames
   */
  renderPages(prayer) {
    let pages = prayer.pages;

    // If pages not pre-split, auto-paginate text
    if (!pages || pages.length === 0) {
      pages = this.autoPaginateText(prayer.content || prayer.description || '');
      this.currentPrayer.pages = pages;
    }

    this.totalPages = pages.length;
    this.comicTrack.innerHTML = '';

    pages.forEach((page, idx) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'comic-page';
      pageEl.dataset.pageIndex = idx;

      const frame = document.createElement('div');
      frame.className = 'page-frame';

      const header = document.createElement('div');
      header.className = 'page-verse-header';
      header.innerHTML = `<span>${page.verseTitle || `บทที่ ${idx + 1}`}</span>`;

      const body = document.createElement('div');
      body.className = 'page-verse-body';

      if (page.pali) {
        const paliEl = document.createElement('div');
        paliEl.className = 'verse-pali';
        paliEl.innerHTML = page.pali.replace(/\n/g, '<br>');
        body.appendChild(paliEl);
      }

      if (page.thai) {
        const thaiEl = document.createElement('div');
        thaiEl.className = 'verse-thai';
        thaiEl.innerHTML = page.thai.replace(/\n/g, '<br>');
        body.appendChild(thaiEl);
      }

      // If plain text content
      if (!page.pali && !page.thai && page.content) {
        const contentEl = document.createElement('div');
        contentEl.className = 'verse-thai';
        contentEl.innerHTML = page.content.replace(/\n/g, '<br>');
        body.appendChild(contentEl);
      }

      const counterBadge = document.createElement('div');
      counterBadge.className = 'page-counter-badge';
      counterBadge.textContent = `หน้า ${idx + 1} จาก ${this.totalPages}`;

      frame.appendChild(header);
      frame.appendChild(body);
      frame.appendChild(counterBadge);
      pageEl.appendChild(frame);
      this.comicTrack.appendChild(pageEl);
    });

    this.renderPageDots();
  }

  autoPaginateText(rawText) {
    if (!rawText.trim()) {
      return [{ pageNumber: 1, verseTitle: 'บทสวด', content: 'ไม่มีเนื้อหา' }];
    }
    // Split by double line breaks or verses
    const chunks = rawText.split(/\n\s*\n/).filter(c => c.trim().length > 0);
    if (chunks.length <= 1) {
      // Chunk by sentence length approx 300 chars
      const lines = rawText.split('\n');
      const pages = [];
      let cur = [];
      lines.forEach(l => {
        cur.push(l);
        if (cur.join('\n').length > 350) {
          pages.push(cur.join('\n'));
          cur = [];
        }
      });
      if (cur.length > 0) pages.push(cur.join('\n'));
      return pages.map((c, i) => ({
        pageNumber: i + 1,
        verseTitle: `ตอนที่ ${i + 1}`,
        content: c
      }));
    }

    return chunks.map((chunk, i) => ({
      pageNumber: i + 1,
      verseTitle: `บทที่ ${i + 1}`,
      content: chunk
    }));
  }

  renderPageDots() {
    if (!this.readerPageDots) return;
    this.readerPageDots.innerHTML = '';
    for (let i = 0; i < this.totalPages; i++) {
      const dot = document.createElement('div');
      dot.className = `reader-dot ${i === this.currentPageIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => this.goToPage(i));
      this.readerPageDots.appendChild(dot);
    }
  }

  goToPage(index, animateSound = true, direction = 'next') {
    if (index < 0 || index >= this.totalPages) return;

    const oldIndex = this.currentPageIndex;
    const allPages = this.comicTrack.querySelectorAll('.comic-page');
    const oldPage = allPages[oldIndex];
    const newPage = allPages[index];

    // Apply 3D Page Turning class
    if (oldPage && oldIndex !== index) {
      const turnClass = direction === 'next' ? 'turning-left' : 'turning-right';
      oldPage.classList.add(turnClass);
      setTimeout(() => {
        oldPage.classList.remove('turning-left', 'turning-right');
      }, 400);
    }

    this.currentPageIndex = index;

    // Shift comic track with 3D transform
    const offsetPercent = -(this.currentPageIndex * 100);
    this.comicTrack.style.transform = `translateX(${offsetPercent}%)`;

    // Reset any manual inline drag transforms on page frames
    allPages.forEach(p => {
      const frame = p.querySelector('.page-frame');
      if (frame) {
        frame.style.transform = '';
        frame.style.boxShadow = '';
      }
    });

    // Update Nav buttons
    if (this.btnPrev) this.btnPrev.style.visibility = this.currentPageIndex === 0 ? 'hidden' : 'visible';
    if (this.btnNext) this.btnNext.style.visibility = this.currentPageIndex === this.totalPages - 1 ? 'hidden' : 'visible';

    // Update Dots
    const dots = this.readerPageDots?.querySelectorAll('.reader-dot');
    dots?.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.currentPageIndex);
    });

    if (animateSound) {
      audio.playTick();
    }
  }

  nextPage() {
    if (this.currentPageIndex < this.totalPages - 1) {
      this.goToPage(this.currentPageIndex + 1, true, 'next');
    } else {
      // Reached the end! Play celebration bell
      audio.playBell(648);
    }
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.goToPage(this.currentPageIndex - 1, true, 'prev');
    }
  }

  // --- 3D Touch Gesture Controllers with Live Page Lift & Tap Zones ---
  handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    this.touchStartTime = Date.now();
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentX = this.touchStartX;
    this.isSwiping = true;
  }

  handleTouchMove(e) {
    if (!this.isSwiping || e.touches.length !== 1) return;
    this.touchCurrentX = e.touches[0].clientX;

    const deltaX = this.touchStartX - this.touchCurrentX;
    const allPages = this.comicTrack.querySelectorAll('.comic-page');
    const curPage = allPages[this.currentPageIndex];
    const frame = curPage?.querySelector('.page-frame');

    if (frame && Math.abs(deltaX) > 12) {
      // Rotate 3D page dynamically with finger movement
      const angle = Math.max(Math.min((deltaX / window.innerWidth) * -60, 45), -45);
      const lift = Math.min(Math.abs(deltaX) * 0.2, 25);
      frame.style.transform = `rotateY(${angle}deg) translateZ(${lift}px) scale(0.98)`;
    }
  }

  handleTouchEnd(e) {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = Math.abs(this.touchStartY - (e.changedTouches[0]?.clientY || this.touchStartY));
    const elapsed = Date.now() - this.touchStartTime;

    // Reset frame tilt
    const allPages = this.comicTrack.querySelectorAll('.comic-page');
    const curPage = allPages[this.currentPageIndex];
    const frame = curPage?.querySelector('.page-frame');
    if (frame) frame.style.transform = '';

    // 1. Horizontal swipe dominant -> Turn Page
    if (Math.abs(deltaX) > this.swipeThreshold && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        this.nextPage(); // Swipe Left -> Turn Page Next
      } else {
        this.prevPage(); // Swipe Right -> Turn Page Prev
      }
    } 
    // 2. Clean Tap Detected (Short duration, minimal movement)
    else if (elapsed < 350 && Math.abs(deltaX) < 15 && deltaY < 15) {
      const tapX = this.touchStartX;
      const screenWidth = window.innerWidth;

      if (tapX < screenWidth * 0.22) {
        // Tap Left Margin -> Previous Page
        this.prevPage();
      } else if (tapX > screenWidth * 0.78) {
        // Tap Right Margin -> Next Page
        this.nextPage();
      } else {
        // Tap Center -> Toggle Floating Control HUD & Font Controls!
        this.toggleHUD();
      }
    }
  }

  // --- Mouse Drag & Click Gestures for Desktop ---
  handleMouseDown(e) {
    this.isMouseDown = true;
    this.touchStartTime = Date.now();
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.touchCurrentX = e.clientX;
  }

  handleMouseMove(e) {
    if (!this.isMouseDown) return;
    this.touchCurrentX = e.clientX;

    const deltaX = this.touchStartX - this.touchCurrentX;
    const allPages = this.comicTrack.querySelectorAll('.comic-page');
    const curPage = allPages[this.currentPageIndex];
    const frame = curPage?.querySelector('.page-frame');

    if (frame && Math.abs(deltaX) > 12) {
      const angle = Math.max(Math.min((deltaX / window.innerWidth) * -50, 40), -40);
      const lift = Math.min(Math.abs(deltaX) * 0.15, 20);
      frame.style.transform = `rotateY(${angle}deg) translateZ(${lift}px) scale(0.98)`;
    }
  }

  handleMouseUp(e) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = Math.abs(this.touchStartY - e.clientY);
    const elapsed = Date.now() - this.touchStartTime;

    const allPages = this.comicTrack.querySelectorAll('.comic-page');
    const curPage = allPages[this.currentPageIndex];
    const frame = curPage?.querySelector('.page-frame');
    if (frame) frame.style.transform = '';

    if (Math.abs(deltaX) > this.swipeThreshold) {
      if (deltaX > 0) this.nextPage();
      else this.prevPage();
    } else if (elapsed < 350 && Math.abs(deltaX) < 10 && deltaY < 10) {
      const clickX = e.clientX;
      const screenWidth = window.innerWidth;

      if (clickX < screenWidth * 0.22) {
        this.prevPage();
      } else if (clickX > screenWidth * 0.78) {
        this.nextPage();
      } else {
        this.toggleHUD();
      }
    }
  }

  // --- Font Scaling & Preference Persistence ---
  adjustFontSize(delta) {
    const settings = storage.getSettings();
    let current = settings.fontSize || 1.15;
    current = Math.min(Math.max(current + delta, 0.75), 2.2);
    settings.fontSize = parseFloat(current.toFixed(2));
    storage.saveSettings(settings);
    this.applyFontSize(settings.fontSize);
  }

  applyFontSize(sizeRem) {
    document.documentElement.style.setProperty('--reader-font-size', `${sizeRem}rem`);
    const percentStr = `${Math.round((sizeRem / 1.15) * 100)}%`;
    if (this.fontSizeDisplay) {
      this.fontSizeDisplay.textContent = percentStr;
    }
    if (this.toolbarFontSize) {
      this.toolbarFontSize.textContent = percentStr;
    }
  }

  updateChantDisplay(count) {
    if (this.readerChantCount) {
      this.readerChantCount.textContent = `${count} จบ`;
    }
  }

  animateCounterBump() {
    if (this.btnChantInReader) {
      this.btnChantInReader.style.transform = 'scale(1.25)';
      setTimeout(() => {
        this.btnChantInReader.style.transform = 'scale(1)';
      }, 200);
    }
  }
}
