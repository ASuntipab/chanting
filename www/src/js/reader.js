/**
 * Tamma OS - Comic-Book Style E-Book Reader Engine
 * Handles Touch Swipe, 3D Page Turns, Auto-Pagination, Audio Chimes & Font Scaling
 */

import { audio } from './audio.js';
import { storage } from './storage.js';
import { nativeBridge } from './native-bridge.js';
import { ttsEngine } from './tts-engine.js';
import { mp3Player, CHANTING_AUDIO_TRACKS } from './mp3-player.js';

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
    this.initTTSCallbacks();
    this.initMP3Player();
  }

  initElements() {
    this.readerView = document.getElementById('readerView');
    this.readerToolbar = document.getElementById('readerToolbar');
    this.readerBottomBar = document.getElementById('readerBottomBar');
    this.comicStage = document.getElementById('comicStage');
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

    // TTS Voice Controls
    this.btnTTSPlay = document.getElementById('btnTTSPlay');
    this.ttsPlayIcon = document.getElementById('ttsPlayIcon');
    this.ttsPlayText = document.getElementById('ttsPlayText');
    this.btnTTSSettings = document.getElementById('btnTTSSettings');
    this.ttsSettingsModal = document.getElementById('ttsSettingsModal');
    this.btnCloseTTSSettings = document.getElementById('btnCloseTTSSettings');
    this.ttsModeBtns = document.querySelectorAll('.tts-mode-btn');
    this.ttsSpeedBtns = document.querySelectorAll('.tts-speed-btn');

    // Real Monastic MP3 Controls
    this.btnMP3Play = document.getElementById('btnMP3Play');
    this.mp3PlayerDeck = document.getElementById('mp3PlayerDeck');
    this.btnCloseMP3Deck = document.getElementById('btnCloseMP3Deck');
    this.mp3TrackSelect = document.getElementById('mp3TrackSelect');
    this.mp3TrackTitle = document.getElementById('mp3TrackTitle');
    this.mp3TrackTemple = document.getElementById('mp3TrackTemple');
    this.mp3CurrentTime = document.getElementById('mp3CurrentTime');
    this.mp3Duration = document.getElementById('mp3Duration');
    this.mp3ProgressBar = document.getElementById('mp3ProgressBar');
    this.btnMP3Rewind10 = document.getElementById('btnMP3Rewind10');
    this.btnMP3MainPlay = document.getElementById('btnMP3MainPlay');
    this.btnMP3Forward10 = document.getElementById('btnMP3Forward10');
    this.btnMP3Loop = document.getElementById('btnMP3Loop');
    this.mp3SpeedSelect = document.getElementById('mp3SpeedSelect');
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
      if (window.tammaApp && typeof window.tammaApp.refreshCurrentViews === 'function') {
        window.tammaApp.refreshCurrentViews();
      }
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

    // Finish Chanting Big Button (On last page)
    this.btnFinishChantBig = document.getElementById('btnFinishChantBig');
    this.btnFinishChantBig?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.currentPrayer) return;
      audio.playBell(648);
      nativeBridge.hapticSuccess();
      const count = storage.incrementPrayerCount(this.currentPrayer.id);
      this.updateChantDisplay(count);
      if (window.tammaApp && typeof window.tammaApp.refreshCurrentViews === 'function') {
        window.tammaApp.refreshCurrentViews();
      }
      
      // Close reader or show success toast
      window.tammaApp.showToast(`✨ อนุโมทนาบุญ! คุณสวดจบแล้ว ${count} ครั้ง`);
      
      // Auto close after short delay
      setTimeout(() => this.close(), 1500);
    });

    // TTS Voice Controls Binding
    this.btnTTSPlay?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleTTS();
    });

    this.btnTTSSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleTTSSettings();
    });

    this.btnCloseTTSSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideTTSSettings();
    });

    // TTS Mode selection pills
    this.ttsModeBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.dataset.mode;
        this.ttsModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ttsEngine.setMode(mode);
        if (this.currentPrayer) {
          const wasPlaying = ttsEngine.isPlaying;
          ttsEngine.prepareQueue(this.currentPrayer);
          if (wasPlaying) {
            ttsEngine.play();
          }
        }
      });
    });

    // TTS Speed selection pills
    this.ttsSpeedBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const speed = parseFloat(btn.dataset.speed);
        this.ttsSpeedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ttsEngine.setRate(speed);
      });
    });

    // MP3 Real Chanting Controls Binding
    this.btnMP3Play?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMP3Deck();
    });

    this.btnCloseMP3Deck?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideMP3Deck();
    });

    this.btnMP3MainPlay?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (ttsEngine.isPlaying) {
        ttsEngine.stop();
      }
      mp3Player.togglePlay();
    });

    this.btnMP3Rewind10?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mp3Player.audioElement) {
        mp3Player.seek((mp3Player.audioElement.currentTime || 0) - 10);
      }
    });

    this.btnMP3Forward10?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mp3Player.audioElement) {
        mp3Player.seek((mp3Player.audioElement.currentTime || 0) + 10);
      }
    });

    this.btnMP3Loop?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isLoop = mp3Player.toggleLoop();
      this.btnMP3Loop.style.color = isLoop ? 'var(--accent-gold)' : 'var(--text-muted)';
    });

    this.mp3SpeedSelect?.addEventListener('change', (e) => {
      e.stopPropagation();
      const speed = parseFloat(e.target.value);
      mp3Player.setSpeed(speed);
    });

    this.mp3TrackSelect?.addEventListener('change', (e) => {
      e.stopPropagation();
      const trackId = e.target.value;
      mp3Player.loadTrack(trackId);
      if (mp3Player.isPlaying) {
        mp3Player.play();
      }
    });

    this.mp3ProgressBar?.addEventListener('input', (e) => {
      e.stopPropagation();
      const percent = parseFloat(e.target.value);
      mp3Player.seekPercent(percent);
    });

    // Prevent clicks inside Toolbar & Bottom bar from toggling page
    this.readerToolbar?.addEventListener('click', (e) => e.stopPropagation());
    this.readerBottomBar?.addEventListener('click', (e) => e.stopPropagation());
    this.ttsSettingsModal?.addEventListener('click', (e) => e.stopPropagation());
    this.mp3PlayerDeck?.addEventListener('click', (e) => e.stopPropagation());

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
    if (!this.hudVisible) return;
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

    // Prime matching MP3 track & only show MP3 button if real recording exists
    const matchedTrack = mp3Player.getTrackForPrayer(prayer);
    if (matchedTrack) {
      if (this.btnMP3Play) this.btnMP3Play.style.display = 'inline-flex';
      mp3Player.loadTrack(matchedTrack);
    } else {
      if (this.btnMP3Play) this.btnMP3Play.style.display = 'none';
      this.hideMP3Deck();
      mp3Player.pause();
    }

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
    ttsEngine.stop();
    mp3Player.pause();
    this.hideTTSSettings();
    this.hideMP3Deck();
    if (window.tammaApp && typeof window.tammaApp.refreshCurrentViews === 'function') {
      window.tammaApp.refreshCurrentViews();
    }
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
    header.innerHTML = `<span>${this.escapeHtml(prayer.title || 'บทสวดมนต์')}</span><span class="page-verse-header-hint">💡 แตะที่ข้อความเพื่อเริ่มฟังจากจุดนั้น</span>`;

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
      section.dataset.pageIndex = idx;

      if (page.verseTitle && rawPages.length > 1) {
        const titleEl = document.createElement('div');
        titleEl.className = 'verse-section-title verse-clickable';
        titleEl.dataset.pageIndex = idx;
        titleEl.dataset.type = 'title';
        titleEl.dataset.text = page.verseTitle.trim();
        titleEl.textContent = page.verseTitle;
        titleEl.title = 'แตะเพื่อเริ่มสวดจากท่อนนี้';
        titleEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.playFromElement(titleEl);
        });
        section.appendChild(titleEl);
      }

      if (page.pali) {
        const paliWrap = document.createElement('div');
        paliWrap.className = 'verse-pali-wrap';
        const paliLines = page.pali.split('\n').filter(l => l.trim().length > 0);
        paliLines.forEach(line => {
          const paliEl = document.createElement('div');
          paliEl.className = 'verse-pali verse-clickable';
          paliEl.dataset.pageIndex = idx;
          paliEl.dataset.type = 'pali';
          paliEl.dataset.text = line.trim();
          paliEl.innerHTML = this.escapeHtml(line);
          paliEl.title = 'แตะเพื่อเริ่มสวดจากท่อนนี้';
          paliEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playFromElement(paliEl);
          });
          paliWrap.appendChild(paliEl);
        });
        section.appendChild(paliWrap);
      }

      if (page.thai) {
        const thaiWrap = document.createElement('div');
        thaiWrap.className = 'verse-thai-wrap';
        const thaiLines = page.thai.split('\n').filter(l => l.trim().length > 0);
        thaiLines.forEach(line => {
          const thaiEl = document.createElement('div');
          thaiEl.className = 'verse-thai verse-clickable';
          thaiEl.dataset.pageIndex = idx;
          thaiEl.dataset.type = 'thai';
          thaiEl.dataset.text = line.trim();
          thaiEl.innerHTML = this.escapeHtml(line);
          thaiEl.title = 'แตะเพื่อเริ่มสวดจากท่อนนี้';
          thaiEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playFromElement(thaiEl);
          });
          thaiWrap.appendChild(thaiEl);
        });
        section.appendChild(thaiWrap);
      }

      if (!page.pali && !page.thai && page.content) {
        const contentWrap = document.createElement('div');
        contentWrap.className = 'verse-thai-wrap';
        const contentLines = page.content.split('\n').filter(l => l.trim().length > 0);
        contentLines.forEach(line => {
          const contentEl = document.createElement('div');
          contentEl.className = 'verse-thai verse-clickable';
          contentEl.dataset.pageIndex = idx;
          contentEl.dataset.type = 'thai';
          contentEl.dataset.text = line.trim();
          contentEl.innerHTML = this.escapeHtml(line);
          contentEl.title = 'แตะเพื่อเริ่มสวดจากท่อนนี้';
          contentEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playFromElement(contentEl);
          });
          contentWrap.appendChild(contentEl);
        });
        section.appendChild(contentWrap);
      }

      flow.appendChild(section);

      if (idx < rawPages.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'verse-section-divider';
        flow.appendChild(divider);
      }
    });

    viewport.appendChild(flow);

    // Prepare TTS Queue for current prayer
    ttsEngine.prepareQueue(prayer);

    // Footer Container with Indicator and Progress
    const footer = document.createElement('div');
    footer.className = 'page-footer-container';

    const moreIndicator = document.createElement('div');
    moreIndicator.className = 'scroll-more-indicator';
    moreIndicator.innerHTML = '<span>มีต่อ</span> <span>▼</span>';
    const handleMoreClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.nextPage();
    };
    moreIndicator.addEventListener('click', handleMoreClick);
    moreIndicator.addEventListener('touchend', handleMoreClick);
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

    // Update "มีต่อ ▼" Indicator & Finish Button
    const finishOverlay = document.getElementById('finishChantOverlay');
    if (index < this.totalViewportPages - 1) {
      if (this.moreIndicator) this.moreIndicator.classList.remove('hidden');
      if (finishOverlay) finishOverlay.classList.remove('show');
    } else {
      if (this.moreIndicator) this.moreIndicator.classList.add('hidden');
      if (finishOverlay) finishOverlay.classList.add('show');
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
    const target = e.target;
    // Ignore interactive controls to prevent button/HUD clash
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary')) {
      this.isSwiping = false;
      this.touchStartTime = 0;
      return;
    }
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
    if (!this.isSwiping || !this.touchStartTime) return;
    this.isSwiping = false;
    this.lastTouchTime = Date.now();

    const target = e.target;
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary')) {
      return;
    }

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
    // 3. Clean Tap on reading text area -> Toggle HUD
    else if (elapsed < 500 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
      this.toggleHUD();
    }
  }

  // --- Mouse Drag & Click Gestures for Desktop ---
  handleMouseDown(e) {
    if (this.lastTouchTime && Date.now() - this.lastTouchTime < 700) return;
    const target = e.target;
    // Ignore interactive controls to prevent button/HUD clash
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary')) {
      this.isMouseDown = false;
      this.touchStartTime = 0;
      return;
    }
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
    if (!this.isMouseDown || !this.touchStartTime) return;
    this.isMouseDown = false;
    if (this.lastTouchTime && Date.now() - this.lastTouchTime < 700) return;

    const target = e.target;
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary')) {
      return;
    }

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
    // Clean Click on reading text area -> Toggle HUD
    else if (elapsed < 500 && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
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

  // --- TTS Voice Reading & Karaoke Mechanics ---
  initTTSCallbacks() {
    ttsEngine.onHighlight = (chunkIndex, chunk) => this.handleTTSHighlight(chunkIndex, chunk);
    ttsEngine.onStateChange = (state) => this.handleTTSState(state);
    ttsEngine.onFinish = () => this.handleTTSFinish();
  }

  toggleTTS() {
    if (!this.currentPrayer) return;
    if (ttsEngine.queue.length === 0) {
      ttsEngine.prepareQueue(this.currentPrayer);
    }
    
    if (ttsEngine.isPlaying) {
      ttsEngine.pause();
    } else if (ttsEngine.isPaused) {
      ttsEngine.play();
    } else {
      // Start from the currently visible verse in viewport
      const startIdx = this.findFirstVisibleChunkIndex();
      ttsEngine.play(startIdx >= 0 ? startIdx : 0);
    }
  }

  playFromElement(el) {
    if (!el || !this.currentPrayer) return;
    const pageIndex = parseInt(el.dataset.pageIndex, 10);
    const type = el.dataset.type;
    const text = (el.dataset.text || el.textContent || '').trim();

    if (ttsEngine.queue.length === 0) {
      ttsEngine.prepareQueue(this.currentPrayer);
    }

    // 1. Find exact matching chunk in queue
    let targetIdx = ttsEngine.queue.findIndex(c => 
      c.pageIndex === pageIndex && c.type === type && (c.rawText.trim() === text || c.text.includes(text))
    );

    // 2. Fallback to matching page & type
    if (targetIdx < 0) {
      targetIdx = ttsEngine.queue.findIndex(c => c.pageIndex === pageIndex && c.type === type);
    }

    // 3. Fallback to first chunk of this page
    if (targetIdx < 0) {
      targetIdx = ttsEngine.queue.findIndex(c => c.pageIndex === pageIndex);
    }

    if (targetIdx >= 0) {
      ttsEngine.play(targetIdx);
      this.scheduleAutoHide(5000);
      nativeBridge.hapticSuccess();
    }
  }

  findFirstVisibleChunkIndex() {
    if (!this.flowEl || ttsEngine.queue.length === 0 || !this.viewportStepPx) return 0;
    const currentViewportTop = (this.viewportIndex || 0) * this.viewportStepPx;
    
    const clickables = this.flowEl.querySelectorAll('.verse-clickable');
    for (const el of clickables) {
      if (el.offsetTop >= currentViewportTop - 40) {
        const pageIndex = parseInt(el.dataset.pageIndex, 10);
        const type = el.dataset.type;
        const text = (el.dataset.text || el.textContent || '').trim();
        const idx = ttsEngine.queue.findIndex(c => 
          c.pageIndex === pageIndex && c.type === type && (c.rawText.trim() === text || c.text.includes(text))
        );
        if (idx >= 0) return idx;
      }
    }
    return 0;
  }

  toggleTTSSettings() {
    if (!this.ttsSettingsModal) return;
    if (this.ttsSettingsModal.style.display === 'none' || !this.ttsSettingsModal.style.display) {
      this.ttsSettingsModal.style.display = 'block';
    } else {
      this.ttsSettingsModal.style.display = 'none';
    }
  }

  hideTTSSettings() {
    if (this.ttsSettingsModal) {
      this.ttsSettingsModal.style.display = 'none';
    }
  }

  handleTTSHighlight(chunkIndex, chunk) {
    if (!this.flowEl) return;

    // Remove active highlight from all elements
    const actives = this.flowEl.querySelectorAll('.verse-reading-active');
    actives.forEach(el => el.classList.remove('verse-reading-active'));

    if (!chunk || chunkIndex < 0) return;

    // Find the exact matching DOM node
    let target = null;
    const candidates = this.flowEl.querySelectorAll(`[data-page-index="${chunk.pageIndex}"][data-type="${chunk.type}"]`);
    for (const el of candidates) {
      if (el.dataset.text && el.dataset.text.trim() === chunk.rawText.trim()) {
        target = el;
        break;
      }
    }
    if (!target && candidates.length > 0) {
      target = candidates[0];
    }

    if (target) {
      target.classList.add('verse-reading-active');

      // Auto-scroll / Jump Viewport if target is outside current view
      if (this.viewportStepPx) {
        const elOffsetTop = target.offsetTop;
        const targetViewport = Math.floor(elOffsetTop / this.viewportStepPx);
        if (targetViewport !== this.viewportIndex && targetViewport >= 0 && targetViewport < this.totalViewportPages) {
          this.goToViewport(targetViewport, true);
        }
      }
    }
  }

  handleTTSState(state) {
    if (!this.btnTTSPlay) return;

    if (state === 'playing') {
      this.btnTTSPlay.classList.add('playing');
      if (this.ttsPlayIcon) this.ttsPlayIcon.textContent = '⏸️';
      if (this.ttsPlayText) this.ttsPlayText.textContent = 'พักเสียง';
      nativeBridge.setKeepAwake(true);
    } else if (state === 'paused') {
      this.btnTTSPlay.classList.remove('playing');
      if (this.ttsPlayIcon) this.ttsPlayIcon.textContent = '▶️';
      if (this.ttsPlayText) this.ttsPlayText.textContent = 'สวดต่อ';
    } else {
      this.btnTTSPlay.classList.remove('playing');
      if (this.ttsPlayIcon) this.ttsPlayIcon.textContent = '🔊';
      if (this.ttsPlayText) this.ttsPlayText.textContent = 'สวดนำ';
    }
  }

  handleTTSFinish() {
    audio.playBell(648);
    if (window.tammaApp && typeof window.tammaApp.showToast === 'function') {
      window.tammaApp.showToast('✨ สวดมนต์จบแล้ว อนุโมทนาบุญครับ 🙏');
    }
    // Jump to the last page to show completion button
    this.goToViewport(this.totalViewportPages - 1, true);
  }

  // --- Real Monastic MP3 Audio Player Integration ---
  initMP3Player() {
    // Populate Track Dropdown
    if (this.mp3TrackSelect) {
      this.mp3TrackSelect.innerHTML = '';
      CHANTING_AUDIO_TRACKS.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.title} (${t.temple})`;
        this.mp3TrackSelect.appendChild(opt);
      });
    }

    // Subscribe to state updates
    mp3Player.onStateChange((state) => {
      if (this.btnMP3MainPlay) {
        this.btnMP3MainPlay.textContent = state.isPlaying ? '⏸️ พักเสียงพระสวด' : '▶️ เล่นเสียงพระสวด';
      }
      if (this.btnMP3Play) {
        this.btnMP3Play.classList.toggle('playing', state.isPlaying);
      }
      if (state.currentTrack) {
        if (this.mp3TrackTitle) this.mp3TrackTitle.textContent = state.currentTrack.title;
        if (this.mp3TrackTemple) this.mp3TrackTemple.textContent = state.currentTrack.temple;
        if (this.mp3TrackSelect) this.mp3TrackSelect.value = state.currentTrack.id;
      }
    });

    // Subscribe to progress updates
    mp3Player.onProgress((p) => {
      if (this.mp3CurrentTime) this.mp3CurrentTime.textContent = p.formattedCurrent;
      if (this.mp3Duration && p.duration > 0) this.mp3Duration.textContent = p.formattedDuration;
      if (this.mp3ProgressBar && !this.mp3ProgressBar.matches(':active')) {
        this.mp3ProgressBar.value = p.percent || 0;
      }
    });
  }

  toggleMP3Deck() {
    if (!this.mp3PlayerDeck) return;
    if (this.mp3PlayerDeck.style.display === 'none' || !this.mp3PlayerDeck.style.display) {
      this.showMP3Deck();
    } else {
      this.hideMP3Deck();
    }
  }

  showMP3Deck() {
    if (this.mp3PlayerDeck) {
      this.mp3PlayerDeck.style.display = 'flex';
      this.hideTTSSettings();
    }
  }

  hideMP3Deck() {
    if (this.mp3PlayerDeck) {
      this.mp3PlayerDeck.style.display = 'none';
    }
  }

  selectMP3Track(trackId) {
    mp3Player.loadTrack(trackId);
  }
}
