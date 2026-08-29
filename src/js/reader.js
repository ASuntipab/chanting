/**
 * Tamma OS - Comic-Book Style E-Book Reader Engine
 * Handles Touch Swipe, 3D Page Turns, Auto-Pagination, Audio Chimes & Font Scaling
 */

import { audio } from './audio.js';
import { storage } from './storage.js';
import { nativeBridge } from './native-bridge.js';

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
    
    // Font Sizing in Bottom HUD Dock
    this.btnFontPlus = document.getElementById('btnFontPlus');
    this.btnFontMinus = document.getElementById('btnFontMinus');
    this.fontSizeDisplay = document.getElementById('fontSizeDisplay');
    this.btnChantInReader = document.getElementById('btnChantInReader');

    // Fast Page Scrubber & Quick Navigation
    this.readerScrubber = document.getElementById('readerScrubber');
    this.readerPageBadge = document.getElementById('readerPageBadge');
    this.btnJumpFirst = document.getElementById('btnJumpFirst');
    this.btnJumpLast = document.getElementById('btnJumpLast');
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

    // Quick Jump: First Page & Last Page Buttons
    this.btnJumpFirst?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.goToViewport(0);
      this.scheduleAutoHide(5000);
    });
    this.btnJumpLast?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.goToViewport(this.totalViewportPages - 1);
      this.scheduleAutoHide(5000);
    });

    // Scrubber Slider Dragging / Jumping
    this.readerScrubber?.addEventListener('input', (e) => {
      e.stopPropagation();
      const targetPage = parseInt(e.target.value, 10);
      this.goToViewport(targetPage - 1, false);
      this.scheduleAutoHide(6000);
    });

    // Chanting counter inside reader
    this.btnChantInReader?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.currentPrayer) return;
      audio.playBell();
      nativeBridge.hapticSuccess();
      const count = storage.incrementPrayerCount(this.currentPrayer.id);
      this.updateChantDisplay(count);
      this.animateCounterBump();
      this.scheduleAutoHide();
    });

    // Font Sizing in Bottom HUD Dock (Up to 300% for Elders)
    this.btnFontPlus?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustFontSize(0.15);
      this.scheduleAutoHide(5000);
    });
    this.btnFontMinus?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustFontSize(-0.15);
      this.scheduleAutoHide(5000);
    });

    // Theme Switcher directly in Bottom HUD Dock
    this.readerBottomBar?.querySelectorAll('[data-set-theme]')?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const theme = btn.dataset.setTheme;
        document.body.className = `theme-${theme}`;
        storage.saveSettings({ theme });
        this.scheduleAutoHide(5000);
      });
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

    // Dynamic Live Viewport Recalculation on Screen Resize / Orientation Change
    window.addEventListener('resize', () => {
      if (this.isOpen() && this.currentPrayer) {
        if (this.resizeDebounce) clearTimeout(this.resizeDebounce);
        this.resizeDebounce = setTimeout(() => {
          const relativeProgress = this.totalViewportPages > 1 ? this.viewportIndex / (this.totalViewportPages - 1) : 0;
          this.calculateViewportMetrics();
          const newIndex = Math.min(Math.round(relativeProgress * (this.totalViewportPages - 1)), this.totalViewportPages - 1);
          this.goToViewport(newIndex, false);
        }, 150);
      }
    });
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

    // Apply User Font & Theme Preference automatically
    const settings = storage.getSettings();
    this.applyFontSize(settings.fontSize || 1.15);
    if (settings.theme) {
      document.body.className = `theme-${settings.theme}`;
    }

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
    nativeBridge.setKeepAwake(true);
  }

  close() {
    this.readerView.classList.remove('active');
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    document.body.style.overflow = '';
    nativeBridge.setKeepAwake(false);
  }

  isOpen() {
    return this.readerView.classList.contains('active');
  }

  /**
   * Viewport Snap Paging Engine:
   * Renders the entire prayer continuously in 1 unified frame.
   * Measures rendered height and calculates viewport snap steps without scrollbars.
   */
  renderPages(prayer) {
    this.currentPrayer = prayer;
    const rawPages = prayer.pages || this.autoPaginateText(prayer.content || prayer.description || '');
    this.comicTrack.innerHTML = '';

    const pageEl = document.createElement('div');
    pageEl.className = 'comic-page active-page';
    pageEl.dataset.pageIndex = 0;

    const frame = document.createElement('div');
    frame.className = 'page-frame';

    // Header
    const header = document.createElement('div');
    header.className = 'page-verse-header';
    header.innerHTML = `<span>${this.escapeHtml(prayer.title || 'บทสวดมนต์')}</span>`;

    // Viewport Window
    const viewport = document.createElement('div');
    viewport.className = 'page-verse-viewport';
    this.viewportEl = viewport;

    // Continuous Flow Container
    const flow = document.createElement('div');
    flow.className = 'page-verse-flow';
    this.flowEl = flow;

    rawPages.forEach((page, idx) => {
      const section = document.createElement('div');
      section.className = 'verse-section';

      if (page.verseTitle && rawPages.length > 1) {
        const titleEl = document.createElement('div');
        titleEl.className = 'verse-section-title';
        titleEl.style.fontSize = '0.92rem';
        titleEl.style.color = 'var(--accent-gold)';
        titleEl.style.opacity = '0.85';
        titleEl.style.marginBottom = '4px';
        titleEl.textContent = page.verseTitle;
        section.appendChild(titleEl);
      }

      if (page.pali) {
        const paliEl = document.createElement('div');
        paliEl.className = 'verse-pali';
        paliEl.innerHTML = this.escapeHtml(page.pali).replace(/\n/g, '<br>');
        section.appendChild(paliEl);
      }

      if (page.thai) {
        const thaiEl = document.createElement('div');
        thaiEl.className = 'verse-thai';
        thaiEl.innerHTML = this.escapeHtml(page.thai).replace(/\n/g, '<br>');
        section.appendChild(thaiEl);
      }

      if (!page.pali && !page.thai && page.content) {
        const contentEl = document.createElement('div');
        contentEl.className = 'verse-thai';
        contentEl.innerHTML = this.escapeHtml(page.content).replace(/\n/g, '<br>');
        section.appendChild(contentEl);
      }

      flow.appendChild(section);

      if (idx < rawPages.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'verse-section-divider';
        flow.appendChild(divider);
      }
    });

    viewport.appendChild(flow);

    // Footer Container with Indicator and Progress
    const footer = document.createElement('div');
    footer.className = 'page-footer-container';

    const moreIndicator = document.createElement('div');
    moreIndicator.className = 'scroll-more-indicator';
    moreIndicator.innerHTML = '<span>มีต่อ</span> <span>▼</span>';
    moreIndicator.addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextPage();
    });
    this.moreIndicator = moreIndicator;

    const counterBadge = document.createElement('div');
    counterBadge.className = 'page-counter-badge';
    this.counterBadge = counterBadge;

    footer.appendChild(moreIndicator);
    footer.appendChild(counterBadge);

    frame.appendChild(header);
    frame.appendChild(viewport);
    frame.appendChild(footer);
    pageEl.appendChild(frame);
    this.comicTrack.appendChild(pageEl);

    // Calculate dynamic viewport step & pages
    requestAnimationFrame(() => {
      this.calculateViewportMetrics();
      this.goToViewport(this.viewportIndex || 0, false);
    });
  }

  calculateViewportMetrics() {
    if (!this.viewportEl || !this.flowEl) {
      this.totalViewportPages = 1;
      this.totalPages = 1;
      return;
    }

    const viewportHeight = this.viewportEl.clientHeight || 450;
    const flowHeight = this.flowEl.scrollHeight || 450;

    // Overlap slightly (24px) for reading continuity
    this.viewportStepPx = Math.max(viewportHeight - 24, 120);
    this.totalViewportPages = Math.max(1, Math.ceil((flowHeight - 24) / this.viewportStepPx));
    this.totalPages = this.totalViewportPages;

    if (this.viewportIndex >= this.totalViewportPages) {
      this.viewportIndex = this.totalViewportPages - 1;
    }

    // Sync Scrubber Controls
    if (this.readerScrubber) {
      this.readerScrubber.min = 1;
      this.readerScrubber.max = this.totalViewportPages;
      this.readerScrubber.value = (this.viewportIndex || 0) + 1;
    }
    if (this.readerPageBadge) {
      this.readerPageBadge.textContent = `${(this.viewportIndex || 0) + 1} / ${this.totalViewportPages}`;
    }

    this.renderPageDots();
  }

  goToViewport(index, animate = true) {
    if (index < 0) index = 0;
    if (index >= this.totalViewportPages) index = this.totalViewportPages - 1;

    this.viewportIndex = index;
    this.currentPageIndex = index;

    if (this.flowEl && this.viewportStepPx) {
      const offsetY = index * this.viewportStepPx;
      this.flowEl.style.transition = animate ? 'transform 0.45s cubic-bezier(0.2, 0.9, 0.2, 1)' : 'none';
      this.flowEl.style.transform = offsetY > 0 ? `translateY(-${offsetY}px)` : 'translateY(0px)';
    }

    // Update Counter Badge
    if (this.counterBadge) {
      this.counterBadge.textContent = this.totalViewportPages > 1 
        ? `ส่วนที่ ${index + 1} จาก ${this.totalViewportPages}` 
        : '๑ บทสมบูรณ์';
    }

    // Update Scrubber Badge & Slider Value
    if (this.readerScrubber) {
      this.readerScrubber.value = index + 1;
    }
    if (this.readerPageBadge) {
      this.readerPageBadge.textContent = `${index + 1} / ${this.totalViewportPages}`;
    }

    // Update "มีต่อ ▼" Indicator
    if (this.moreIndicator) {
      if (index < this.totalViewportPages - 1) {
        this.moreIndicator.classList.remove('hidden');
      } else {
        this.moreIndicator.classList.add('hidden');
      }
    }

    this.updateDots();
    this.updateNavButtons();
  }

  goToPage(index, animate = true) {
    this.goToViewport(index, animate);
  }

  nextPage() {
    if (this.viewportIndex < this.totalViewportPages - 1) {
      this.goToViewport(this.viewportIndex + 1, true);
    } else {
      // Reached the end of prayer! Play bell tone
      audio.playBell(648);
    }
  }

  prevPage() {
    if (this.viewportIndex > 0) {
      this.goToViewport(this.viewportIndex - 1, true);
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  autoPaginateText(rawText) {
    if (!rawText.trim()) {
      return [{ pageNumber: 1, verseTitle: 'บทสวด', content: 'ไม่มีเนื้อหา' }];
    }
    const chunks = rawText.split(/\n\s*\n/).filter(c => c.trim().length > 0);
    if (chunks.length <= 1) {
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
    for (let i = 0; i < this.totalViewportPages; i++) {
      const dot = document.createElement('div');
      dot.className = `reader-dot ${i === this.viewportIndex ? 'active' : ''}`;
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToViewport(i, true);
      });
      this.readerPageDots.appendChild(dot);
    }
  }

  updateDots() {
    if (!this.readerPageDots) return;
    const dots = this.readerPageDots.querySelectorAll('.reader-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.viewportIndex);
    });
  }

  updateNavButtons() {
    if (this.btnPrev) {
      this.btnPrev.style.opacity = this.viewportIndex === 0 ? '0.3' : '1';
      this.btnPrev.style.pointerEvents = this.viewportIndex === 0 ? 'none' : 'auto';
    }
    if (this.btnNext) {
      this.btnNext.style.opacity = this.viewportIndex === this.totalViewportPages - 1 ? '0.3' : '1';
    }
  }

  // --- Touch Gesture Controllers (Swipe Left/Right & Up/Down to Snap Viewport) ---
  handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    this.lastTouchTime = Date.now();
    this.touchStartTime = Date.now();
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentX = this.touchStartX;
    this.touchCurrentY = this.touchStartY;
    this.isSwiping = true;
  }

  handleTouchMove(e) {
    if (!this.isSwiping || e.touches.length !== 1) return;
    this.touchCurrentX = e.touches[0].clientX;
    this.touchCurrentY = e.touches[0].clientY;
  }

  handleTouchEnd(e) {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    this.lastTouchTime = Date.now();

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - (e.changedTouches[0]?.clientY || this.touchCurrentY);
    const elapsed = Date.now() - this.touchStartTime;

    // 1. Unified Swipe Handling: Swipe Left OR Swipe Up -> Next Viewport
    if (deltaX > this.swipeThreshold || deltaY > this.swipeThreshold) {
      this.nextPage();
    } 
    // 2. Swipe Right OR Swipe Down -> Prev Viewport
    else if (deltaX < -this.swipeThreshold || deltaY < -this.swipeThreshold) {
      this.prevPage();
    } 
    // 3. Instant Single Tap Detected on mobile
    else if (elapsed < 600 && Math.abs(deltaX) < 25 && Math.abs(deltaY) < 25) {
      this.toggleHUD();
    }
  }

  // --- Mouse Drag & Click Gestures for Desktop ---
  handleMouseDown(e) {
    if (this.lastTouchTime && Date.now() - this.lastTouchTime < 700) return;
    this.isMouseDown = true;
    this.touchStartTime = Date.now();
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.touchCurrentX = e.clientX;
    this.touchCurrentY = e.clientY;
  }

  handleMouseMove(e) {
    if (!this.isMouseDown) return;
    this.touchCurrentX = e.clientX;
    this.touchCurrentY = e.clientY;
  }

  handleMouseUp(e) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    if (this.lastTouchTime && Date.now() - this.lastTouchTime < 700) return;

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - e.clientY;
    const elapsed = Date.now() - this.touchStartTime;

    // Swipe Left or Up -> Next Viewport
    if (deltaX > this.swipeThreshold || deltaY > this.swipeThreshold) {
      this.nextPage();
    } 
    // Swipe Right or Down -> Prev Viewport
    else if (deltaX < -this.swipeThreshold || deltaY < -this.swipeThreshold) {
      this.prevPage();
    } 
    // Instant Single Click -> Toggle HUD
    else if (elapsed < 600 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
      this.toggleHUD();
    }
  }

  // --- Font Scaling & Preference Persistence (Up to 300% for Elders) ---
  adjustFontSize(delta) {
    const settings = storage.getSettings();
    let current = settings.fontSize || 1.15;
    // Allow scaling from 0.75rem (~65%) up to 3.45rem (300%)
    current = Math.min(Math.max(current + delta, 0.75), 3.45);
    settings.fontSize = parseFloat(current.toFixed(2));
    storage.saveSettings(settings);
    this.applyFontSize(settings.fontSize);

    // Recalculate viewports with new font size and preserve reading progress
    if (this.currentPrayer && this.isOpen()) {
      const relativeProgress = this.totalViewportPages > 1 ? this.viewportIndex / (this.totalViewportPages - 1) : 0;
      requestAnimationFrame(() => {
        this.calculateViewportMetrics();
        const newIndex = Math.min(Math.round(relativeProgress * (this.totalViewportPages - 1)), this.totalViewportPages - 1);
        this.goToViewport(newIndex, false);
      });
    }
  }

  applyFontSize(sizeRem) {
    document.documentElement.style.setProperty('--reader-font-size', `${sizeRem}rem`);
    const percentStr = `${Math.round((sizeRem / 1.15) * 100)}%`;
    if (this.fontSizeDisplay) {
      this.fontSizeDisplay.textContent = percentStr;
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
