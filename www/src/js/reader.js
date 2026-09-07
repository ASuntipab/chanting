/**
 * Tamma OS - Comic-Book Style E-Book Reader Engine
 * Handles Touch Swipe, 3D Page Turns, Auto-Pagination, Audio Chimes & Font Scaling
 */

import { audio } from './audio.js';
import { storage } from './storage.js';
import { nativeBridge } from './native-bridge.js';
import { ttsEngine } from './tts-engine.js';
import { mp3Player, CHANTING_AUDIO_TRACKS } from './mp3-player.js';
import { paliScript } from './paliscript.js';

export const FONT_FAMILIES = {
  'sarabun': {
    name: 'สารบรรณ',
    label: '🇹🇭 สารบรรณ',
    family: "'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  'prompt': {
    name: 'พร้อมท์',
    label: '✨ พร้อมท์',
    family: "'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  'noto-serif': {
    name: 'โนโตะ เซรีฟ',
    label: '📜 โนโตะ (ใบลาน)',
    family: "'Noto Serif Thai', Georgia, 'Times New Roman', serif"
  },
  'mitr': {
    name: 'มิตร',
    label: '🍃 มิตร',
    family: "'Mitr', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  'charm': {
    name: 'ชาร์ม',
    label: '✍️ ชาร์ม (ตัวเขียน)',
    family: "'Charm', 'TH Sarabun New', cursive, sans-serif"
  },
  'bai-jamjuree': {
    name: 'จามจุรี',
    label: '💎 จามจุรี',
    family: "'Bai Jamjuree', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  'chakra': {
    name: 'จักรเพชร',
    label: '⚡ จักรเพชร',
    family: "'Chakra Petch', -apple-system, BlinkMacSystemFont, sans-serif"
  }
};

export class ComicReaderEngine {
  constructor() {
    this.currentPrayer = null;
    this.currentPageIndex = 0;
    this.totalPages = 0;
    this.currentScript = 'thai-phonetic';
    
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
    
    // Font Sizing & Typography in Bottom HUD Dock
    this.btnFontPlus = document.getElementById('btnFontPlus');
    this.btnFontMinus = document.getElementById('btnFontMinus');
    this.fontSizeDisplay = document.getElementById('fontSizeDisplay');
    this.readerFontSelect = document.getElementById('readerFontSelect');
    this.readerLayoutSelect = document.getElementById('readerLayoutSelect');
    this.btnReaderThemeToggle = document.getElementById('btnReaderThemeToggle');
    this.paliScriptSelect = document.getElementById('paliScriptSelect');
    this.btnChantInReader = document.getElementById('btnChantInReader');

    // Layout Mode (Traditional Book Indent vs Centered)
    const savedLayout = (typeof storage !== 'undefined' && storage.getSettings) ? storage.getSettings().readerLayout : null;
    this.currentLayout = savedLayout || (typeof localStorage !== 'undefined' ? localStorage.getItem('tamma_reader_layout') : null) || 'book';
    if (this.readerLayoutSelect) {
      this.readerLayoutSelect.value = this.currentLayout;
    }
    this.applyLayout(this.currentLayout, false);

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

    // Gesture Guide & Help Modal Elements
    this.btnReaderHelp = document.getElementById('btnReaderHelp');
    this.readerHelpModal = document.getElementById('readerHelpModal');
    this.btnCloseReaderHelp = document.getElementById('btnCloseReaderHelp');
    this.btnGotReaderHelp = document.getElementById('btnGotReaderHelp');
    this.readerGestureHint = document.getElementById('readerGestureHint');
    this.gestureHintTimer = null;
    this.lastWheelTime = 0;

    // Itipiso Tally Counter Elements
    this.itipisoCounterWidget = document.getElementById('itipisoCounterWidget');
    this.itipisoCurrent = document.getElementById('itipisoCurrent');
    this.itipisoTarget = document.getElementById('itipisoTarget');
    this.itipisoProgressBar = document.getElementById('itipisoProgressBar');
    this.itipisoVerseCard = document.getElementById('itipisoVerseCard');
    this.btnItipisoCount = document.getElementById('btnItipisoCount');
    this.btnItipisoMinus = document.getElementById('btnItipisoMinus');
    this.btnItipisoReset = document.getElementById('btnItipisoReset');
    this.btnItipisoSettings = document.getElementById('btnItipisoSettings');
    this.btnCloseItipisoWidget = document.getElementById('btnCloseItipisoWidget');
    this.itipisoAgeModal = document.getElementById('itipisoAgeModal');
    this.itipisoUserAgeInput = document.getElementById('itipisoUserAgeInput');
    this.itipisoCalculatedTarget = document.getElementById('itipisoCalculatedTarget');
    this.btnSaveItipisoAge = document.getElementById('btnSaveItipisoAge');
    this.btnCloseItipisoAgeModal = document.getElementById('btnCloseItipisoAgeModal');
    this.itipisoCompleteModal = document.getElementById('itipisoCompleteModal');
    this.itipisoCompleteRounds = document.getElementById('itipisoCompleteRounds');
    this.btnItipisoCompleteClear = document.getElementById('btnItipisoCompleteClear');
    this.btnItipisoCompleteClose = document.getElementById('btnItipisoCompleteClose');
  }

  bindEvents() {
    if (!this.readerView) return;

    // Navigation buttons
    this.btnPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      this.prevPage();
    });
    this.btnNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      this.nextPage();
    });
    this.btnClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    // Gesture Help & Navigation Guide Modal Events
    this.btnReaderHelp?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleReaderHelp();
    });
    this.btnCloseReaderHelp?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideReaderHelp();
    });
    this.btnGotReaderHelp?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideReaderHelp();
    });
    this.readerHelpModal?.addEventListener('click', (e) => e.stopPropagation());

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

      // ถ้าเป็นชุดบทสวดที่มีบทพุทธคุณเท่าอายุ + ๑ ให้เปิดห้องสวดนับจบแบบ Popup ทันที!
      if (this.isItipisoChantAvailable()) {
        this.showItipisoWidget();
        return;
      }

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

    // Font Family Switcher (7 Thai Fonts)
    this.readerFontSelect?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.applyFontFamily(e.target.value, true);
      this.scheduleAutoHide(5000);
    });

    // Layout Mode Switcher (Traditional Book Indent vs Centered)
    this.readerLayoutSelect?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.applyLayout(e.target.value, true);
      this.scheduleAutoHide(5000);
    });

    // Theme Toggle Button in Reader Toolbar
    this.btnReaderThemeToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleReaderTheme();
      this.scheduleAutoHide(5000);
    });

    // Pali Script Switcher (Transliteration Engine)
    this.paliScriptSelect?.addEventListener('change', (e) => {
      e.stopPropagation();
      this.currentScript = e.target.value;
      storage.saveSettings({ paliScript: this.currentScript });
      if (this.currentPrayer) {
        this.renderPages(this.currentPrayer);
        this.goToViewport(this.viewportIndex, false);
      }
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

    // Prevent clicks inside Toolbar, Bottom bar & Modals from toggling page
    this.readerToolbar?.addEventListener('click', (e) => e.stopPropagation());
    this.readerBottomBar?.addEventListener('click', (e) => e.stopPropagation());
    this.ttsSettingsModal?.addEventListener('click', (e) => e.stopPropagation());
    this.mp3PlayerDeck?.addEventListener('click', (e) => e.stopPropagation());
    this.itipisoAgeModal?.addEventListener('click', (e) => e.stopPropagation());
    this.itipisoCompleteModal?.addEventListener('click', (e) => e.stopPropagation());

    // Itipiso Modal Background Click to Close
    this.itipisoCounterWidget?.addEventListener('click', (e) => {
      if (e.target === this.itipisoCounterWidget) {
        e.stopPropagation();
        this.hideItipisoWidget();
      } else {
        e.stopPropagation();
      }
    });

    // Close Itipiso Popup Button
    this.btnCloseItipisoWidget?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideItipisoWidget();
    });

    // Itipiso Tally Counter Action Events
    this.btnItipisoCount?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleItipisoCount();
    });
    this.itipisoVerseCard?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleItipisoCount();
    });
    this.btnItipisoMinus?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleItipisoMinus();
    });
    this.btnItipisoReset?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleItipisoReset();
    });
    this.btnItipisoSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showItipisoAgeModal();
    });
    this.btnCloseItipisoAgeModal?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideItipisoAgeModal();
    });
    this.btnSaveItipisoAge?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.saveItipisoAgeSettings();
    });
    this.itipisoUserAgeInput?.addEventListener('input', (e) => {
      const age = parseInt(e.target.value, 10) || 40;
      if (this.itipisoCalculatedTarget) {
        this.itipisoCalculatedTarget.textContent = age + 1;
      }
    });

    // Itipiso Preset Buttons
    const presetBtns = this.itipisoAgeModal?.querySelectorAll('.itipiso-preset-btn');
    presetBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.preset === 'age-plus-1') {
          const age = parseInt(this.itipisoUserAgeInput?.value, 10) || 40;
          if (this.itipisoCalculatedTarget) this.itipisoCalculatedTarget.textContent = age + 1;
          this.tempCustomTarget = 0;
        } else if (btn.dataset.target) {
          const t = parseInt(btn.dataset.target, 10);
          if (this.itipisoCalculatedTarget) this.itipisoCalculatedTarget.textContent = t;
          this.tempCustomTarget = t;
        }
      });
    });

    // Itipiso Completion Modal Buttons
    this.btnItipisoCompleteClear?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleItipisoReset();
      this.hideItipisoCompleteModal();
    });
    this.btnItipisoCompleteClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideItipisoCompleteModal();
    });

    // Keyboard Arrow navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (this.hudVisible) this.hideHUD();
        this.hideGestureHint();
        this.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (this.hudVisible) this.hideHUD();
        this.hideGestureHint();
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

      // Mouse Wheel / Trackpad Scroll to navigate pages & hide HUD
      stage.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
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

  // --- HUD Controls: Manual Tap Toggle (Stable & No Sudden Auto-Disappearing) ---
  showHUD() {
    this.hudVisible = true;
    this.readerView?.classList.remove('hud-hidden');
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  hideHUD() {
    this.hudVisible = false;
    this.readerView?.classList.add('hud-hidden');
    this.settingsDrawer?.classList.remove('open');
    this.hideTTSSettings();
    this.hideMP3Deck();
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  toggleHUD() {
    if (this.hudVisible) {
      this.hideHUD();
    } else {
      this.showHUD();
    }
  }

  scheduleAutoHide() {
    // Disabled aggressive auto-hide so the control panel stays open until the user taps to hide it
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
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

    // Apply User Font, Script & Theme Preference automatically
    const settings = storage.getSettings();
    this.currentScript = settings.paliScript || 'thai-phonetic';
    if (this.paliScriptSelect) {
      this.paliScriptSelect.value = this.currentScript;
    }
    this.applyFontSize(settings.fontSize || 1.15);
    this.applyFontFamily(settings.fontFamily || 'sarabun', false);
    if (settings.theme) {
      const currentClasses = document.body.className.split(' ').filter(c => !c.startsWith('theme-'));
      currentClasses.push(`theme-${settings.theme}`);
      document.body.className = currentClasses.join(' ');
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
    this.showGestureHint();
    nativeBridge.setKeepAwake(true);
    nativeBridge.hideStatusBar();
  }

  close() {
    this.readerView.classList.remove('active');
    this.readerView.classList.remove('tts-active');
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    this.hideGestureHint();
    this.hideReaderHelp();
    document.body.style.overflow = '';
    nativeBridge.setKeepAwake(false);
    nativeBridge.showStatusBar();
    ttsEngine.stop();
    mp3Player.pause();
    this.hideTTSSettings();
    this.hideMP3Deck();
    this.hideItipisoAgeModal();
    this.hideItipisoCompleteModal();
    if (this.itipisoCounterWidget) this.itipisoCounterWidget.style.display = 'none';
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

    // Viewport Window
    const viewport = document.createElement('div');
    viewport.className = 'page-verse-viewport';
    this.viewportEl = viewport;

    // Continuous Flow Container
    const flow = document.createElement('div');
    const layoutClass = `layout-${this.currentLayout || 'book'}`;
    flow.className = `page-verse-flow ${layoutClass}`;
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
        titleEl.addEventListener('click', (e) => {
          if (ttsEngine.isPlaying || ttsEngine.isPaused) {
            e.stopPropagation();
            this.playFromElement(titleEl);
          }
        });
        section.appendChild(titleEl);
      }

      if (page.pali) {
        const paliWrap = document.createElement('div');
        paliWrap.className = 'verse-pali-wrap';
        
        // แยกบท/ตอนตามย่อหน้า (เว้นบรรทัดว่าง \n\s*\n)
        const stanzas = page.pali.split(/\n\s*\n+/).filter(s => s.trim().length > 0);
        stanzas.forEach((stanza, sIdx) => {
          const stanzaEl = document.createElement('div');
          stanzaEl.className = 'verse-stanza';
          stanzaEl.dataset.stanzaIndex = sIdx;
          
          const lines = stanza.split('\n').filter(l => l.trim().length > 0);
          lines.forEach((line, lIdx) => {
            const paliEl = document.createElement('div');
            paliEl.className = 'verse-pali verse-clickable' + (lIdx === 0 ? ' stanza-first-line' : '');
            paliEl.dataset.pageIndex = idx;
            paliEl.dataset.type = 'pali';
            paliEl.dataset.text = line.trim();
            const displayPali = (this.currentScript && this.currentScript !== 'thai-phonetic')
              ? paliScript.transliterate(line, this.currentScript)
              : line;
            paliEl.innerHTML = this.escapeHtml(displayPali);
            paliEl.addEventListener('click', (e) => {
              if (ttsEngine.isPlaying || ttsEngine.isPaused) {
                e.stopPropagation();
                this.playFromElement(paliEl);
              }
            });
            stanzaEl.appendChild(paliEl);
          });
          paliWrap.appendChild(stanzaEl);
        });
        section.appendChild(paliWrap);
      }

      if (page.thai) {
        const thaiWrap = document.createElement('div');
        thaiWrap.className = 'verse-thai-wrap';
        
        // แยกย่อหน้าคำแปลภาษาไทย
        const thaiStanzas = page.thai.split(/\n+/).filter(s => s.trim().length > 0);
        thaiStanzas.forEach((stanza, sIdx) => {
          const stanzaEl = document.createElement('div');
          stanzaEl.className = 'verse-thai-stanza';
          stanzaEl.dataset.stanzaIndex = sIdx;
          
          const thaiEl = document.createElement('div');
          thaiEl.className = 'verse-thai verse-clickable stanza-first-line';
          thaiEl.dataset.pageIndex = idx;
          thaiEl.dataset.type = 'thai';
          thaiEl.dataset.text = stanza.trim();
          thaiEl.innerHTML = this.escapeHtml(stanza);
          thaiEl.addEventListener('click', (e) => {
            if (ttsEngine.isPlaying || ttsEngine.isPaused) {
              e.stopPropagation();
              this.playFromElement(thaiEl);
            }
          });
          stanzaEl.appendChild(thaiEl);
          thaiWrap.appendChild(stanzaEl);
        });
        section.appendChild(thaiWrap);
      }

      if (!page.pali && !page.thai && page.content) {
        const contentWrap = document.createElement('div');
        contentWrap.className = 'verse-thai-wrap';
        const contentStanzas = page.content.split(/\n+/).filter(s => s.trim().length > 0);
        contentStanzas.forEach((stanza, sIdx) => {
          const stanzaEl = document.createElement('div');
          stanzaEl.className = 'verse-thai-stanza';
          stanzaEl.dataset.stanzaIndex = sIdx;
          
          const contentEl = document.createElement('div');
          contentEl.className = 'verse-thai verse-clickable stanza-first-line';
          contentEl.dataset.pageIndex = idx;
          contentEl.dataset.type = 'thai';
          contentEl.dataset.text = stanza.trim();
          contentEl.innerHTML = this.escapeHtml(stanza);
          contentEl.addEventListener('click', (e) => {
            if (ttsEngine.isPlaying || ttsEngine.isPaused) {
              e.stopPropagation();
              this.playFromElement(contentEl);
            }
          });
          stanzaEl.appendChild(contentEl);
          contentWrap.appendChild(stanzaEl);
        });
        section.appendChild(contentWrap);
      }

      // ตรวจสอบว่าหน้านี้เป็นบทพุทธคุณเท่าอายุ + ๑ หรือไม่ เพื่อแสดงปุ่มเปิดห้องสวดนับจบ
      const pTitle = (page.verseTitle || '').toLowerCase();
      const pThai = (page.thai || '').toLowerCase();
      const pPali = (page.pali || '').toLowerCase();
      if (pTitle.includes('เท่าอายุ') || pThai.includes('เท่าอายุ') || (pTitle.includes('อิติปิโส') && pPali.includes('อิติปิ โส'))) {
        const launchBox = document.createElement('div');
        launchBox.className = 'itipiso-launch-box';
        const launchBtn = document.createElement('button');
        launchBtn.type = 'button';
        launchBtn.className = 'btn-launch-itipiso-modal';
        launchBtn.innerHTML = '<span>📿</span> <span>แตะเปิดห้องสวดนับจบ (เท่าอายุ + ๑)</span>';
        launchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showItipisoWidget();
        });
        launchBox.appendChild(launchBtn);
        section.appendChild(launchBox);
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
    moreIndicator.innerHTML = '<span>มีต่อ</span> <span>▼</span> <span class="more-subtext">(ปัดขึ้น/แตะ)</span>';
    const handleMoreClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
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
    this.checkItipisoPage();
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
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary, .itipiso-counter-widget, .itipiso-modal-overlay, .itipiso-modal-card')) {
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

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - this.touchCurrentY;

    // เมื่อเริ่มปัดซ้าย-ขวา หรือเลื่อนขึ้น-ลง เกิน 15px ให้ซ่อนแผงควบคุมและ Hint ทันที
    if (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15) {
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
    }
  }

  handleTouchEnd(e) {
    if (!this.isSwiping || !this.touchStartTime) return;
    this.isSwiping = false;
    this.lastTouchTime = Date.now();

    const target = e.target;
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary, .itipiso-counter-widget, .itipiso-modal-overlay, .itipiso-modal-card')) {
      return;
    }

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - (e.changedTouches[0]?.clientY || this.touchCurrentY);
    const elapsed = Date.now() - this.touchStartTime;

    // 1. Unified Swipe Handling: Swipe Left OR Swipe Up -> Next Viewport
    if (deltaX > this.swipeThreshold || deltaY > this.swipeThreshold) {
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      this.nextPage();
    } 
    // 2. Swipe Right OR Swipe Down -> Prev Viewport
    else if (deltaX < -this.swipeThreshold || deltaY < -this.swipeThreshold) {
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      this.prevPage();
    } 
    // 3. Clean Tap on reading text area -> Toggle HUD
    else if (elapsed < 500 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
      this.hideGestureHint();
      this.toggleHUD();
    }
  }

  // --- Mouse Drag & Click Gestures for Desktop ---
  handleMouseDown(e) {
    if (this.lastTouchTime && Date.now() - this.lastTouchTime < 700) return;
    const target = e.target;
    // Ignore interactive controls to prevent button/HUD clash
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary, .itipiso-counter-widget, .itipiso-modal-overlay, .itipiso-modal-card')) {
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

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - this.touchCurrentY;

    if (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15) {
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
    }
  }

  handleMouseUp(e) {
    if (!this.isMouseDown || !this.touchStartTime) return;
    this.isMouseDown = false;
    if (this.lastTouchTime && Date.now() - this.lastTouchTime < 700) return;

    const target = e.target;
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary, .itipiso-counter-widget, .itipiso-modal-overlay, .itipiso-modal-card')) {
      return;
    }

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - e.clientY;
    const elapsed = Date.now() - this.touchStartTime;

    // Swipe Left or Up -> Next Viewport
    if (deltaX > this.swipeThreshold || deltaY > this.swipeThreshold) {
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      this.nextPage();
    } 
    // Swipe Right or Down -> Prev Viewport
    else if (deltaX < -this.swipeThreshold || deltaY < -this.swipeThreshold) {
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      this.prevPage();
    } 
    // Clean Click on reading text area -> Toggle HUD
    else if (elapsed < 500 && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      this.hideGestureHint();
      this.toggleHUD();
    }
  }

  // --- Mouse Wheel & Trackpad Gesture Controller ---
  handleWheel(e) {
    if (!this.isOpen()) return;
    const target = e.target;
    if (target.closest('select, input, .reader-toolbar, .reader-bottom-bar, .tts-settings-card, .reader-help-card, .mp3-player-deck')) {
      return;
    }
    const now = Date.now();
    if (this.lastWheelTime && now - this.lastWheelTime < 280) return;

    if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
      e.preventDefault();
      this.lastWheelTime = now;
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      if (e.deltaY > 0 || e.deltaX > 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
    }
  }

  // --- Gesture Hints & Guide Controller ---
  showGestureHint() {
    if (!this.readerGestureHint) return;
    if (this.gestureHintTimer) {
      clearTimeout(this.gestureHintTimer);
    }
    this.readerGestureHint.classList.add('show');
    // Auto-hide hint smoothly after 5 seconds
    this.gestureHintTimer = setTimeout(() => {
      this.hideGestureHint();
    }, 5000);
  }

  hideGestureHint() {
    if (this.gestureHintTimer) {
      clearTimeout(this.gestureHintTimer);
      this.gestureHintTimer = null;
    }
    this.readerGestureHint?.classList.remove('show');
  }

  toggleReaderHelp() {
    if (this.readerHelpModal && this.readerHelpModal.style.display !== 'none') {
      this.hideReaderHelp();
    } else {
      this.showReaderHelp();
    }
  }

  showReaderHelp() {
    if (!this.readerHelpModal) return;
    this.readerHelpModal.style.display = 'flex';
  }

  hideReaderHelp() {
    if (!this.readerHelpModal) return;
    this.readerHelpModal.style.display = 'none';
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

  // --- Font Family Management (7 Thai Typography Styles) ---
  applyFontFamily(fontKey, save = false) {
    const validKey = FONT_FAMILIES[fontKey] ? fontKey : 'sarabun';
    const fontInfo = FONT_FAMILIES[validKey];

    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--reader-font-family', fontInfo.family);
      
      // Update body font classes while preserving theme class
      const currentClasses = document.body.className.split(' ').filter(c => !c.startsWith('font-'));
      currentClasses.push(`font-${validKey}`);
      document.body.className = currentClasses.join(' ');

      if (this.readerFontSelect && this.readerFontSelect.value !== validKey) {
        this.readerFontSelect.value = validKey;
      }
    }

    if (save) {
      storage.saveSettings({ fontFamily: validKey });
    }

    // Recalculate viewports with new font metrics
    if (this.currentPrayer && this.isOpen()) {
      const relativeProgress = this.totalViewportPages > 1 ? this.viewportIndex / (this.totalViewportPages - 1) : 0;
      requestAnimationFrame(() => {
        this.calculateViewportMetrics();
        const newIndex = Math.min(Math.round(relativeProgress * (this.totalViewportPages - 1)), this.totalViewportPages - 1);
        this.goToViewport(newIndex, false);
      });
    }
  }

  // --- Reader Layout Mode (Traditional Book Indent vs Modern Centered) ---
  applyLayout(layoutKey, save = false) {
    const validLayout = layoutKey === 'centered' ? 'centered' : 'book';
    this.currentLayout = validLayout;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('tamma_reader_layout', validLayout);
      } catch (e) {
        // ignore quota errors
      }
    }
    if (save && typeof storage !== 'undefined' && storage.saveSettings) {
      storage.saveSettings({ readerLayout: validLayout });
    }

    if (this.readerView) {
      this.readerView.classList.remove('layout-book', 'layout-centered');
      this.readerView.classList.add(`layout-${validLayout}`);
    }

    if (typeof document !== 'undefined') {
      const flows = document.querySelectorAll('.page-verse-flow');
      flows.forEach(flow => {
        flow.classList.remove('layout-book', 'layout-centered');
        flow.classList.add(`layout-${validLayout}`);
      });
    }

    if (this.readerLayoutSelect && this.readerLayoutSelect.value !== validLayout) {
      this.readerLayoutSelect.value = validLayout;
    }

    // Recalculate viewports with new layout metrics
    if (this.currentPrayer && this.isOpen()) {
      const relativeProgress = this.totalViewportPages > 1 ? this.viewportIndex / (this.totalViewportPages - 1) : 0;
      requestAnimationFrame(() => {
        this.calculateViewportMetrics();
        const newIndex = Math.min(Math.round(relativeProgress * (this.totalViewportPages - 1)), this.totalViewportPages - 1);
        this.goToViewport(newIndex, false);
      });
    }
  }

  // --- Reader Theme Toggle (Synced with All 4 Themes) ---
  toggleReaderTheme() {
    const themes = ['cosmic', 'gold', 'parchment', 'midnight'];
    const themeNames = {
      'cosmic': '🌌 จักรวาล',
      'gold': '🌟 ทองอร่าม',
      'parchment': '📜 ใบลาน',
      'midnight': '🌙 ราตรีสงบ'
    };
    const settings = storage.getSettings();
    const currentTheme = settings.theme || 'cosmic';
    let idx = themes.indexOf(currentTheme);
    idx = (idx + 1) % themes.length;
    const newTheme = themes[idx];

    // Preserve font class when toggling theme
    const currentClasses = document.body.className.split(' ').filter(c => !c.startsWith('theme-'));
    currentClasses.push(`theme-${newTheme}`);
    document.body.className = currentClasses.join(' ');

    storage.saveSettings({ theme: newTheme });

    if (window.tammaApp && typeof window.tammaApp.showToast === 'function') {
      window.tammaApp.showToast(`เปลี่ยนธีม: ${themeNames[newTheme]}`);
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
      this.hideMP3Deck();
      this.scheduleAutoHide(12000);
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
      this.readerView?.classList.add('tts-active');
      if (this.ttsPlayIcon) this.ttsPlayIcon.textContent = '⏸️';
      if (this.ttsPlayText) this.ttsPlayText.textContent = 'พักเสียง';
      nativeBridge.setKeepAwake(true);
    } else if (state === 'paused') {
      this.btnTTSPlay.classList.remove('playing');
      this.readerView?.classList.add('tts-active');
      if (this.ttsPlayIcon) this.ttsPlayIcon.textContent = '▶️';
      if (this.ttsPlayText) this.ttsPlayText.textContent = 'สวดต่อ';
    } else {
      this.btnTTSPlay.classList.remove('playing');
      this.readerView?.classList.remove('tts-active');
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
      this.scheduleAutoHide(15000);
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

  // --- Itipiso Tally Counter Controllers ---
  getPrayerKey() {
    return this.currentPrayer ? this.currentPrayer.id : 'default';
  }

  isItipisoChantAvailable() {
    if (!this.currentPrayer) return false;
    const pTitle = (this.currentPrayer.title || '').toLowerCase();
    if (pTitle.includes('เท่าอายุ') || pTitle.includes('อิติปิโส') || pTitle.includes('หลวงพ่อจรัญ')) {
      return true;
    }
    const pages = this.currentPrayer.pages || [];
    return pages.some(p => {
      const t = (p.verseTitle || '').toLowerCase();
      const pali = (p.pali || '').toLowerCase();
      const thai = (p.thai || '').toLowerCase();
      return t.includes('เท่าอายุ') || thai.includes('เท่าอายุ') || (t.includes('อิติปิโส') && pali.includes('อิติปิ โส'));
    });
  }

  isItipisoPage(index) {
    if (!this.currentPrayer) return false;
    const rawPages = this.currentPrayer.pages;
    if (rawPages && rawPages[index]) {
      const page = rawPages[index];
      const title = (page.verseTitle || '').toLowerCase();
      const pali = (page.pali || '').toLowerCase();
      const thai = (page.thai || '').toLowerCase();
      if (title.includes('เท่าอายุ') || title.includes('อายุ + ๑') || title.includes('อายุ+๑') || thai.includes('เท่าอายุ')) {
        return true;
      }
      if (title.includes('อิติปิโส') || title.includes('พุทธคุณ') || pali.includes('อิติปิ โส') || pali.includes('อิติปิโส')) {
        return true;
      }
    }
    return false;
  }

  checkItipisoPage() {
    // ปรับปรุงตามคำสั่งผู้ใช้: ไม่บังคับเปิด widget ลอยทับหน้าจออ่านปกติโดยอัตโนมัติ
    // เพื่อป้องกันการแสดงผลผิดจุดและไม่บดบังเนื้อหาบทสวดมนต์
    // ผู้ใช้สามารถกดเปิดห้องสวดนับจบได้จากปุ่มในหน้าบทสวด หรือปุ่มนับจบในแถบควบคุม
    this.updateItipisoDisplay();
  }

  showItipisoWidget() {
    if (!this.itipisoCounterWidget) return;
    this.updateItipisoDisplay();
    this.itipisoCounterWidget.style.display = 'flex';
  }

  hideItipisoWidget() {
    if (this.itipisoCounterWidget) {
      this.itipisoCounterWidget.style.display = 'none';
      this.hideItipisoAgeModal();
    }
  }

  updateItipisoDisplay() {
    const key = this.getPrayerKey();
    const current = storage.getItipisoRound(key);
    const target = storage.getItipisoTarget();

    if (this.itipisoCurrent) this.itipisoCurrent.textContent = current;
    if (this.itipisoTarget) this.itipisoTarget.textContent = target;

    if (this.itipisoProgressBar) {
      const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
      this.itipisoProgressBar.style.width = `${pct}%`;
    }
  }

  handleItipisoCount() {
    const key = this.getPrayerKey();
    const result = storage.incrementItipisoRound(key);

    // Play sweet chime bell & haptic vibration
    audio.playBell(580);
    nativeBridge.hapticSuccess();

    // Bump animation on number
    if (this.itipisoCurrent) {
      this.itipisoCurrent.textContent = result.current;
      this.itipisoCurrent.classList.remove('bump');
      void this.itipisoCurrent.offsetWidth; // trigger reflow
      this.itipisoCurrent.classList.add('bump');
      setTimeout(() => this.itipisoCurrent?.classList.remove('bump'), 180);
    }

    // Flash animation on verse card to give delightful feedback
    if (this.itipisoVerseCard) {
      this.itipisoVerseCard.classList.remove('chant-count-flash');
      void this.itipisoVerseCard.offsetWidth;
      this.itipisoVerseCard.classList.add('chant-count-flash');
      setTimeout(() => this.itipisoVerseCard?.classList.remove('chant-count-flash'), 320);
    }

    if (this.itipisoProgressBar) {
      const pct = Math.min(100, Math.round((result.current / Math.max(1, result.target)) * 100));
      this.itipisoProgressBar.style.width = `${pct}%`;
    }

    // Check completion & celebrate!
    if (result.completed) {
      setTimeout(() => {
        this.showItipisoCompleteModal(result.current);
      }, 350);
    }
  }

  handleItipisoMinus() {
    const key = this.getPrayerKey();
    storage.decrementItipisoRound(key);
    nativeBridge.hapticLight?.();
    this.updateItipisoDisplay();
  }

  handleItipisoReset() {
    const key = this.getPrayerKey();
    const current = storage.getItipisoRound(key);
    if (current > 0 && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const confirmed = window.confirm(`ท่านสวดไปแล้ว ${current} จบ ต้องการเคลียร์ตัวนับรอบเพื่อเริ่มใหม่ใช่หรือไม่?`);
      if (!confirmed) return;
    }
    storage.resetItipisoRound(key);
    nativeBridge.hapticSuccess();
    this.updateItipisoDisplay();
    if (window.tammaApp && typeof window.tammaApp.showToast === 'function') {
      window.tammaApp.showToast('↺ เคลียร์ตัวนับรอบเรียบร้อยแล้ว');
    }
  }

  showItipisoAgeModal() {
    if (!this.itipisoAgeModal) return;
    const settings = storage.getSettings();
    const age = settings.userAge || 40;
    if (this.itipisoUserAgeInput) this.itipisoUserAgeInput.value = age;
    if (this.itipisoCalculatedTarget) this.itipisoCalculatedTarget.textContent = storage.getItipisoTarget();
    this.itipisoAgeModal.style.display = 'flex';
  }

  hideItipisoAgeModal() {
    if (this.itipisoAgeModal) this.itipisoAgeModal.style.display = 'none';
  }

  saveItipisoAgeSettings() {
    const age = parseInt(this.itipisoUserAgeInput?.value, 10) || 40;
    const customTarget = this.tempCustomTarget !== undefined ? this.tempCustomTarget : 0;
    storage.saveSettings({ userAge: age, itipisoCustomTarget: customTarget });
    this.hideItipisoAgeModal();
    this.updateItipisoDisplay();
    if (window.tammaApp && typeof window.tammaApp.showToast === 'function') {
      const target = storage.getItipisoTarget();
      window.tammaApp.showToast(`บันทึกเป้าหมาย: ${target} จบ เรียบร้อย`);
    }
  }

  showItipisoCompleteModal(rounds) {
    if (!this.itipisoCompleteModal) return;
    audio.playBell(648); // Miraculous bell chime on completion
    nativeBridge.hapticSuccess();
    if (this.itipisoCompleteRounds) this.itipisoCompleteRounds.textContent = rounds;
    this.itipisoCompleteModal.style.display = 'flex';
  }

  hideItipisoCompleteModal() {
    if (this.itipisoCompleteModal) this.itipisoCompleteModal.style.display = 'none';
  }
}
