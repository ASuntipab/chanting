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
    
    // Touch tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCurrentX = 0;
    this.isSwiping = false;
    this.swipeThreshold = 45; // min px for swipe trigger

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.readerView = document.getElementById('readerView');
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
    this.btnFontPlus = document.getElementById('btnFontPlus');
    this.btnFontMinus = document.getElementById('btnFontMinus');
    this.fontSizeDisplay = document.getElementById('fontSizeDisplay');
    this.btnChantInReader = document.getElementById('btnChantInReader');
  }

  bindEvents() {
    if (!this.readerView) return;

    // Navigation buttons
    this.btnPrev?.addEventListener('click', () => this.prevPage());
    this.btnNext?.addEventListener('click', () => this.nextPage());
    this.btnClose?.addEventListener('click', () => this.close());

    // Chanting counter inside reader
    this.btnChantInReader?.addEventListener('click', () => {
      if (!this.currentPrayer) return;
      audio.playBell();
      const count = storage.incrementPrayerCount(this.currentPrayer.id);
      this.updateChantDisplay(count);
      this.animateCounterBump();
    });

    // Settings Toggle
    this.btnSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.settingsDrawer?.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (this.settingsDrawer?.classList.contains('open') && !this.settingsDrawer.contains(e.target) && e.target !== this.btnSettings) {
        this.settingsDrawer.classList.remove('open');
      }
    });

    // Font Sizing
    this.btnFontPlus?.addEventListener('click', () => this.adjustFontSize(0.1));
    this.btnFontMinus?.addEventListener('click', () => this.adjustFontSize(-0.1));

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

    // Touch Swipe Gestures
    const stage = document.getElementById('comicStage');
    if (stage) {
      stage.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      stage.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
      stage.addEventListener('touchend', (e) => this.handleTouchEnd(e));
      
      // Mouse drag gestures for desktop
      stage.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
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

    // Show View
    this.readerView.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Go to Start Page
    this.goToPage(this.currentPageIndex, false);
    audio.playBell(528); // Miraculous tone on open
  }

  close() {
    this.readerView.classList.remove('active');
    this.settingsDrawer?.classList.remove('open');
    document.body.style.overflow = '';
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

  goToPage(index, animateSound = true) {
    if (index < 0 || index >= this.totalPages) return;
    this.currentPageIndex = index;

    // Shift comic track with 3D transform
    const offsetPercent = -(this.currentPageIndex * 100);
    this.comicTrack.style.transform = `translateX(${offsetPercent}%)`;

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
      this.goToPage(this.currentPageIndex + 1);
    } else {
      // Reached the end! Play celebration bell
      audio.playBell(648);
    }
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.goToPage(this.currentPageIndex - 1);
    }
  }

  // --- Touch Gesture Controllers ---
  handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentX = this.touchStartX;
    this.isSwiping = true;
  }

  handleTouchMove(e) {
    if (!this.isSwiping || e.touches.length !== 1) return;
    this.touchCurrentX = e.touches[0].clientX;
  }

  handleTouchEnd(e) {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = Math.abs(this.touchStartY - (e.changedTouches[0]?.clientY || this.touchStartY));

    // Horizontal swipe dominant
    if (Math.abs(deltaX) > this.swipeThreshold && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        this.nextPage(); // Swipe Left -> Next Page
      } else {
        this.prevPage(); // Swipe Right -> Prev Page
      }
    }
  }

  // --- Mouse Drag Gestures for Desktop ---
  handleMouseDown(e) {
    this.isMouseDown = true;
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.touchCurrentX = e.clientX;
  }

  handleMouseMove(e) {
    if (!this.isMouseDown) return;
    this.touchCurrentX = e.clientX;
  }

  handleMouseUp(e) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    const deltaX = this.touchStartX - this.touchCurrentX;
    if (Math.abs(deltaX) > this.swipeThreshold) {
      if (deltaX > 0) this.nextPage();
      else this.prevPage();
    }
  }

  // --- Font & Customization ---
  adjustFontSize(delta) {
    const settings = storage.getSettings();
    let current = settings.fontSize || 1.15;
    current = Math.min(Math.max(current + delta, 0.85), 2.2);
    settings.fontSize = parseFloat(current.toFixed(2));
    storage.saveSettings(settings);
    this.applyFontSize(settings.fontSize);
  }

  applyFontSize(sizeRem) {
    document.documentElement.style.setProperty('--reader-font-size', `${sizeRem}rem`);
    if (this.fontSizeDisplay) {
      this.fontSizeDisplay.textContent = `${Math.round(sizeRem * 100)}%`;
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
