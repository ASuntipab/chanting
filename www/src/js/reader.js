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
import { starfield } from './starfield.js';
import { formatDisplayedNumbers, toArabicDigits } from './numerals.js';

function hasRoundInstruction(text) {
  return /เท่าอายุ|อายุ[^\n+]{0,24}\+\s*[๑1]/.test(text || '');
}

function isRoundCountingPage(page) {
  return [page.verseTitle, page.pali, page.thai].some(hasRoundInstruction);
}

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

/**
 * Smart Stanza-Aligned Book Paginator:
 * Chunks a prayer into discrete, beautifully formatted book pages.
 * Ensures that EVERY page begins cleanly at the very top with the first line of its stanza.
 * Dynamically adapts to font size scaling (e.g. up to 300% for elders) without breaking words or text clipping.
 */
export function paginatePrayerIntoBookPages(prayer, fontSizeRem = 1.15) {
  if (!prayer) return [];
  let rawPages = prayer.pages;
  if (!rawPages || !Array.isArray(rawPages) || rawPages.length === 0) {
    const rawText = prayer.content || prayer.description || '';
    const chunks = rawText.split(/\n\s*\n+/).filter(c => c.trim().length > 0);
    if (chunks.length > 0) {
      rawPages = chunks.map((c, i) => ({
        verseTitle: chunks.length > 1 ? `ตอนที่ ${i + 1}` : (prayer.title || 'บทสวด'),
        content: c
      }));
    } else {
      rawPages = [{
        verseTitle: prayer.title || 'บทสวด',
        content: rawText || 'ไม่มีเนื้อหา'
      }];
    }
  }
  const bookPages = [];

  const scaleFactor = Math.max(0.65, fontSizeRem / 1.15);
  const charsPerLine = Math.max(12, Math.round(38 / scaleFactor));
  const maxLinesPerPage = Math.max(3.2, 12.0 / scaleFactor);
  const maxCharsPerPage = Math.max(80, Math.round(440 / scaleFactor));

  function estimateTextLines(text, cpl) {
    if (!text) return 0;
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    let count = 0;
    lines.forEach(l => {
      count += Math.max(1, Math.ceil(l.length / cpl));
    });
    return count;
  }

  function breakLongWord(word, maxChars) {
    if (word.length <= maxChars) return [word];
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const seg = new Intl.Segmenter('th', { granularity: 'word' });
        const subWords = Array.from(seg.segment(word)).map(s => s.segment);
        const result = [];
        let cur = '';
        for (const sw of subWords) {
          if (cur && (cur + sw).length > maxChars) {
            result.push(cur);
            cur = sw;
          } else {
            cur += sw;
          }
        }
        if (cur) result.push(cur);
        if (result.length > 0) return result;
      } catch (e) {}
    }
    const result = [];
    for (let i = 0; i < word.length; i += maxChars) {
      result.push(word.slice(i, i + maxChars));
    }
    return result;
  }

  function chunkTextByBudget(text, cpl, maxLines, maxChars) {
    if (!text) return [];
    const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const chunks = [];
    let curLines = [];
    let curEst = 0;
    let curLen = 0;

    rawLines.forEach(line => {
      const lineEst = Math.max(1, Math.ceil(line.length / cpl));
      if (line.length > maxChars || lineEst > maxLines) {
        const rawWords = line.split(/\s+/).filter(w => w.trim().length > 0);
        const words = [];
        rawWords.forEach(rw => {
          if (rw.length > maxChars) {
            words.push(...breakLongWord(rw, maxChars));
          } else {
            words.push(rw);
          }
        });

        let curWordChunk = '';
        words.forEach(w => {
          const testChunk = curWordChunk ? (curWordChunk + ' ' + w) : w;
          const testEst = Math.max(1, Math.ceil(testChunk.length / cpl));
          if (curWordChunk && (testEst > maxLines || testChunk.length > maxChars)) {
            if (curLines.length > 0) {
              chunks.push(curLines.join('\n'));
              curLines = [];
              curEst = 0;
              curLen = 0;
            }
            chunks.push(curWordChunk);
            curWordChunk = w;
          } else {
            curWordChunk = testChunk;
          }
        });
        if (curWordChunk) {
          const wEst = Math.max(1, Math.ceil(curWordChunk.length / cpl));
          if (curLines.length > 0 && (curEst + wEst > maxLines || curLen + curWordChunk.length > maxChars)) {
            chunks.push(curLines.join('\n'));
            curLines = [curWordChunk];
            curEst = wEst;
            curLen = curWordChunk.length;
          } else {
            curLines.push(curWordChunk);
            curEst += wEst;
            curLen += curWordChunk.length;
          }
        }
      } else {
        if (curLines.length > 0 && (curEst + lineEst > maxLines || curLen + line.length > maxChars)) {
          chunks.push(curLines.join('\n'));
          curLines = [line];
          curEst = lineEst;
          curLen = line.length;
        } else {
          curLines.push(line);
          curEst += lineEst;
          curLen += line.length;
        }
      }
    });

    if (curLines.length > 0) {
      chunks.push(curLines.join('\n'));
    }
    return chunks;
  }

  rawPages.forEach((rawPage, rawIdx) => {
    const pTitle = rawPage.verseTitle || (rawPages.length > 1 ? `ตอนที่ ${rawIdx + 1}` : '');
    const paliRaw = rawPage.pali || '';
    const thaiRaw = rawPage.thai || '';
    const contentRaw = rawPage.content || '';

    // Collect all semantic stanza blocks for this page
    const stanzas = [];

    if (paliRaw) {
      const pBlocks = paliRaw.split(/\n\s*\n+/).filter(s => s.trim().length > 0);
      const tBlocks = thaiRaw ? thaiRaw.split(/\n\s*\n+/).filter(s => s.trim().length > 0) : [];

      pBlocks.forEach((pBlock, bIdx) => {
        const pLines = pBlock.trim().split('\n').filter(l => l.trim().length > 0);
        const tBlock = (pBlocks.length === tBlocks.length) ? (tBlocks[bIdx] ? tBlocks[bIdx].trim() : '') : (bIdx === pBlocks.length - 1 ? tBlocks.join('\n\n').trim() : '');
        const tLines = tBlock ? tBlock.split('\n').filter(l => l.trim().length > 0) : [];

        const blockLines = estimateTextLines(pBlock, charsPerLine) + (tBlock ? estimateTextLines(tBlock, charsPerLine) + 0.3 : 0);
        const blockChars = pBlock.length + (tBlock ? tBlock.length : 0);

        if (blockLines <= maxLinesPerPage && blockChars <= maxCharsPerPage) {
          // Fits entirely on a single page! Keep intact.
          stanzas.push({
            type: 'pali-thai',
            pali: pBlock.trim(),
            thai: tBlock
          });
        } else if (pLines.length === 1 && tLines.length <= 1 && pBlock.length <= 100 && tBlock.length <= 100) {
          // Single moderate verse couplet: keep paired as 1 stanza
          stanzas.push({
            type: 'pali-thai',
            pali: pBlock.trim(),
            thai: tBlock
          });
        } else {
          const is1to1Thai = tLines.length === pLines.length && pLines.length > 0;
          if (is1to1Thai) {
            let curPLines = [];
            let curTLines = [];
            let curEst = 0;
            let curChars = 0;

            pLines.forEach((pl, lIdx) => {
              const tl = tLines[lIdx];
              const plEst = Math.max(1, Math.ceil(pl.length / charsPerLine));
              const tlEst = tl ? Math.max(1, Math.ceil(tl.length / charsPerLine)) : 0;
              const pairEst = plEst + tlEst + (tl ? 0.3 : 0);
              const pairChars = pl.length + (tl ? tl.length : 0);

              if (pairEst > maxLinesPerPage || pairChars > maxCharsPerPage) {
                // Individual line pair exceeds page budget: chunk into separate subpages
                if (curPLines.length > 0) {
                  stanzas.push({
                    type: 'pali-thai',
                    pali: curPLines.join('\n'),
                    thai: curTLines.join('\n')
                  });
                  curPLines = [];
                  curTLines = [];
                  curEst = 0;
                  curChars = 0;
                }
                const plChunks = chunkTextByBudget(pl, charsPerLine, maxLinesPerPage, maxCharsPerPage);
                plChunks.forEach(pc => stanzas.push({ type: 'pali-only', pali: pc, thai: '' }));
                if (tl) {
                  const tlChunks = chunkTextByBudget(tl, charsPerLine, maxLinesPerPage, maxCharsPerPage);
                  tlChunks.forEach(tc => stanzas.push({ type: 'thai-only', pali: '', thai: tc }));
                }
              } else if (curPLines.length > 0 && (curEst + pairEst > maxLinesPerPage || curChars + pairChars > maxCharsPerPage)) {
                stanzas.push({
                  type: 'pali-thai',
                  pali: curPLines.join('\n'),
                  thai: curTLines.join('\n')
                });
                curPLines = [pl];
                curTLines = tl ? [tl] : [];
                curEst = pairEst;
                curChars = pairChars;
              } else {
                curPLines.push(pl);
                if (tl) curTLines.push(tl);
                curEst += pairEst;
                curChars += pairChars;
              }
            });

            if (curPLines.length > 0) {
              stanzas.push({
                type: 'pali-thai',
                pali: curPLines.join('\n'),
                thai: curTLines.join('\n')
              });
            }
          } else {
            // Not 1:1 Thai (e.g. Traisaranagamana or prose Suttas):
            // Chunk Pali into stanzas, and chunk Thai translation into thai-only stanzas
            let curPLines = [];
            let curEst = 0;
            let curChars = 0;

            pLines.forEach(pl => {
              const plEst = Math.max(1, Math.ceil(pl.length / charsPerLine));
              if (pl.length > maxCharsPerPage || plEst > maxLinesPerPage) {
                if (curPLines.length > 0) {
                  stanzas.push({ type: 'pali-only', pali: curPLines.join('\n'), thai: '' });
                  curPLines = [];
                  curEst = 0;
                  curChars = 0;
                }
                const plChunks = chunkTextByBudget(pl, charsPerLine, maxLinesPerPage, maxCharsPerPage);
                plChunks.forEach(pc => {
                  stanzas.push({ type: 'pali-only', pali: pc, thai: '' });
                });
              } else if (curPLines.length > 0 && (curEst + plEst > maxLinesPerPage || curChars + pl.length > maxCharsPerPage)) {
                stanzas.push({ type: 'pali-only', pali: curPLines.join('\n'), thai: '' });
                curPLines = [pl];
                curEst = plEst;
                curChars = pl.length;
              } else {
                curPLines.push(pl);
                curEst += plEst;
                curChars += pl.length;
              }
            });

            if (curPLines.length > 0) {
              stanzas.push({ type: 'pali-only', pali: curPLines.join('\n'), thai: '' });
            }

            if (tBlock) {
              const tChunks = chunkTextByBudget(tBlock, charsPerLine, maxLinesPerPage, maxCharsPerPage);
              tChunks.forEach(tc => {
                stanzas.push({ type: 'thai-only', pali: '', thai: tc });
              });
            }
          }
        }
      });

      // Any leftover Thai text that wasn't 1:1 mapped
      if (tBlocks.length > pBlocks.length) {
        const remainingThai = tBlocks.slice(pBlocks.length).join('\n\n').trim();
        if (remainingThai) {
          const tChunks = chunkTextByBudget(remainingThai, charsPerLine, maxLinesPerPage, maxCharsPerPage);
          tChunks.forEach(tc => {
            stanzas.push({
              type: 'thai-only',
              pali: '',
              thai: tc
            });
          });
        }
      }
    } else if (thaiRaw || contentRaw) {
      const text = thaiRaw || contentRaw;
      const blocks = text.split(/\n\s*\n+/).filter(s => s.trim().length > 0);
      blocks.forEach(b => {
        const bChunks = chunkTextByBudget(b, charsPerLine, maxLinesPerPage, maxCharsPerPage);
        bChunks.forEach(bc => {
          stanzas.push({
            type: 'text-only',
            pali: '',
            thai: bc
          });
        });
      });
    }

    if (stanzas.length === 0) {
      // Fallback for empty or raw string page
      stanzas.push({
        type: 'text-only',
        pali: '',
        thai: rawPage.content || rawPage.description || 'ไม่มีเนื้อหา'
      });
    }

    // Chunk stanzas into sub-pages respecting both line and char budgets
    let currentSubStanzas = [];
    let currentChars = 0;
    let currentLines = 0;
    const subPageList = [];

    stanzas.forEach((stanza) => {
      const stanzaChars = (stanza.pali ? stanza.pali.length : 0) + (stanza.thai ? stanza.thai.length : 0);
      const stanzaLines = (stanza.pali ? estimateTextLines(stanza.pali, charsPerLine) + 0.2 : 0) + (stanza.thai ? estimateTextLines(stanza.thai, charsPerLine) + 0.2 : 0);

      const hasPaliInCurrent = currentSubStanzas.some(s => s.pali);
      const isThaiOnly = !stanza.pali && stanza.thai;

      // If switching from Pali verses to separate Thai translation, place on fresh page
      if (hasPaliInCurrent && isThaiOnly) {
        subPageList.push(currentSubStanzas);
        currentSubStanzas = [stanza];
        currentChars = stanzaChars;
        currentLines = stanzaLines;
      } else if (currentSubStanzas.length > 0 && (currentLines + stanzaLines > maxLinesPerPage || currentChars + stanzaChars > maxCharsPerPage)) {
        subPageList.push(currentSubStanzas);
        currentSubStanzas = [stanza];
        currentChars = stanzaChars;
        currentLines = stanzaLines;
      } else {
        currentSubStanzas.push(stanza);
        currentChars += stanzaChars;
        currentLines += stanzaLines;
      }
    });

    if (currentSubStanzas.length > 0) {
      subPageList.push(currentSubStanzas);
    }

    const totalSub = subPageList.length;
    subPageList.forEach((subStanzas, subIdx) => {
      let displayTitle = pTitle;
      if (totalSub > 1 && pTitle) {
        displayTitle = `${pTitle} (${subIdx + 1}/${totalSub})`;
      }

      bookPages.push({
        pageNumber: bookPages.length + 1,
        originalPageIndex: rawIdx,
        subPageIndex: subIdx,
        totalSubPages: totalSub,
        verseTitle: displayTitle,
        stanzas: subStanzas,
        rawPage
      });
    });
  });

  return bookPages;
}

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
    this.btnPrev = document.getElementById('btnPrevPage');
    this.btnNext = document.getElementById('btnNextPage');
    this.readerTopPageBadge = document.getElementById('readerTopPageBadge');
    this.btnClose = document.getElementById('btnCloseReader');
    
    // Top-Right Zen & Fullscreen Exit Bar
    this.readerZenBar = document.getElementById('readerZenBar');
    this.btnExitZen = document.getElementById('btnExitZen');
    this.btnZenClose = document.getElementById('btnZenClose');
    this.btnEnterZen = document.getElementById('btnEnterZen');

    // Font Sizing & Typography in Bottom HUD Dock
    this.btnFontPlus = document.getElementById('btnFontPlus');
    this.btnFontMinus = document.getElementById('btnFontMinus');
    this.fontSizeDisplay = document.getElementById('fontSizeDisplay');
    this.readerFontSelect = document.getElementById('readerFontSelect');
    this.readerLayoutSelect = document.getElementById('readerLayoutSelect');
    this.readerSettingsModal = document.getElementById('readerSettingsModal');
    this.btnReaderSettings = document.getElementById('btnReaderSettings');
    this.btnCloseReaderSettings = document.getElementById('btnCloseReaderSettings');
    this.btnReaderThemeToggle = document.getElementById('btnReaderThemeToggle');
    this.paliScriptSelect = document.getElementById('paliScriptSelect');

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
    this.btnTTSFloatStop = document.getElementById('btnTTSFloatStop');
    this.ttsPlayIcon = document.getElementById('ttsPlayIcon');
    this.ttsPlayText = document.getElementById('ttsPlayText');
    this.btnTTSSettings = document.getElementById('btnTTSSettings');
    this.ttsSettingsModal = document.getElementById('ttsSettingsModal');
    this.btnCloseTTSSettings = document.getElementById('btnCloseTTSSettings');
    this.ttsModeBtns = document.querySelectorAll('.tts-mode-btn[data-mode]');
    this.bellModeBtns = document.querySelectorAll('.bell-mode-btn');
    this.voiceSourceBtns = document.querySelectorAll('.voice-source-btn');
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
    this.btnCloseItipisoWidget = document.getElementById('btnCloseItipisoWidget');
    this.itipisoUserAgeInput = document.getElementById('itipisoUserAgeInput');
    this.itipisoAgeHint = document.getElementById('itipisoAgeHint');
    this.itipisoCompleteModal = document.getElementById('itipisoCompleteModal');
    this.itipisoCompleteRounds = document.getElementById('itipisoCompleteRounds');
    this.btnItipisoCompleteClear = document.getElementById('btnItipisoCompleteClear');
    this.btnItipisoCompleteClose = document.getElementById('btnItipisoCompleteClose');

    // Recitation & Verse Focus Tracking
    this.focusedChunkIndex = null;
    this.focusedElement = null;
  }

  bindEvents() {
    if (!this.readerView) return;

    this.btnReaderSettings?.addEventListener('click', () => this.showReaderSettings());
    this.btnCloseReaderSettings?.addEventListener('click', () => this.hideReaderSettings());
    this.readerSettingsModal?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === this.readerSettingsModal) this.hideReaderSettings();
    });

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
      if (this.currentPageIndex >= this.totalPages - 1) {
        audio.playBell(648);
        document.getElementById('finishChantOverlay')?.classList.add('show');
      } else {
        this.nextPage();
      }
    });
    this.btnClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    // Top-Right Zen & Fullscreen Exit Bar
    this.btnExitZen?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showHUD();
    });
    this.btnZenClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    this.btnEnterZen?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideHUD();
    });
    this.readerZenBar?.addEventListener('click', (e) => e.stopPropagation());

    // Gesture Help & Navigation Guide Modal Events
    this.btnReaderHelp?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideReaderSettings();
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
      if (window.tammaApp && typeof window.tammaApp.refreshCurrentViews === 'function') {
        window.tammaApp.refreshCurrentViews();
      }
      
      // If reading within favorites playlist and has next chant
      if (this.playlist && this.playlistIndex >= 0 && this.playlistIndex < this.playlist.length - 1) {
        const nextItem = this.playlist[this.playlistIndex + 1];
        const nextNum = this.playlistIndex + 2;
        window.tammaApp?.showToast?.(`✨ อนุโมทนาบุญ! กำลังไปบทถัดไป (ลำดับที่ ${nextNum}: ${nextItem.title})`);
        setTimeout(() => {
          if (nextItem.isTipitaka && nextItem.volumeNumber) {
            this.close();
            window.tammaApp?.openTipitakaVolume?.(nextItem.volumeNumber);
          } else {
            this.open(nextItem, 0, {
              playlist: this.playlist,
              playlistIndex: this.playlistIndex + 1
            });
          }
        }, 1100);
        return;
      }

      // Close reader or show success toast
      if (this.playlist && this.playlist.length > 1) {
        window.tammaApp?.showToast?.(`🎉 สวดครบทุกบทตามลำดับรายการโปรดแล้ว! อนุโมทนาบุญ สาธุ 🙏`);
      } else {
        window.tammaApp?.showToast?.(`✨ อนุโมทนาบุญ! คุณสวดจบแล้ว ${count} ครั้ง`);
      }
      
      // Auto close after short delay
      setTimeout(() => this.close(), 1500);
    });

    // TTS Voice Controls Binding
    this.btnTTSFloatStop?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.stopTTS();
    });

    this.btnTTSPlay?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleTTS();
    });

    this.btnTTSSettings?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideReaderSettings();
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
          const curPage = this.currentPageIndex;
          this.renderPages(this.currentPrayer);
          this.goToPage(curPage, false);
          if (wasPlaying) {
            ttsEngine.play();
          }
        }
      });
    });

    // Bell sound pills (saved; opening a prayer only rings in 'all')
    const savedBell = storage.getSettings().bellMode || 'events';
    this.bellModeBtns?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bell === savedBell);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.dataset.bell;
        this.bellModeBtns.forEach(b => b.classList.toggle('active', b === btn));
        audio.setBellMode(mode);
        storage.saveSettings({ bellMode: mode });
        if (mode !== 'off') audio.playBell(mode === 'all' ? 528 : 648); // preview the chosen bell
      });
    });

    // Voice source pills: pre-generated male voice pack vs device voice (saved)
    const savedVoice = storage.getSettings().voiceSource || 'recorded';
    ttsEngine.setVoiceSource(savedVoice);
    this.voiceSourceBtns?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.voice === savedVoice);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const source = btn.dataset.voice;
        this.voiceSourceBtns.forEach(b => b.classList.toggle('active', b === btn));
        ttsEngine.setVoiceSource(source);
        storage.saveSettings({ voiceSource: source });
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
      const wasPlaying = mp3Player.isPlaying;
      mp3Player.loadTrack(trackId);
      if (wasPlaying) {
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
    // Inline target editing: แก้จำนวนจบตรง ๆ หรือกรอกอายุ (บันทึกทันทีที่พิมพ์)
    this.itipisoTarget?.addEventListener('input', () => this.saveItipisoTargetInput());
    this.itipisoUserAgeInput?.addEventListener('input', () => this.saveItipisoAgeInput());
    [this.itipisoTarget, this.itipisoUserAgeInput].forEach((input) => {
      input?.addEventListener('focus', () => input.select());
      input?.addEventListener('blur', () => this.updateItipisoDisplay()); // restore a valid value if left empty
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
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
      if (this.readerSettingsModal?.style.display === 'flex') {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.hideReaderSettings();
        } else if (e.key === 'Tab') {
          const controls = [...this.readerSettingsModal.querySelectorAll('button:not(:disabled), select')];
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
        return;
      }
      if (e.key === 'Escape' && this.readerHelpModal?.style.display === 'flex') {
        this.hideReaderHelp();
        this.btnReaderSettings?.focus();
        return;
      }
      if (e.key === 'Escape' && this.ttsSettingsModal && this.ttsSettingsModal.style.display !== 'none') {
        this.hideTTSSettings();
        this.btnReaderSettings?.focus();
        return;
      }
      if (e.key === 'Escape' && this.mp3PlayerDeck?.style.display === 'flex') {
        this.hideMP3Deck();
        this.btnMP3Play?.focus();
        return;
      }
      // Typing in a field (e.g. the itipiso round/age inputs) must not flip pages
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      // Space and arrows on a focused control retain their native behaviour.
      if (e.key !== 'Escape' && e.target.closest?.('button')) return;
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
      stage.addEventListener('touchcancel', () => this.cancelDrag());

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
        // Page height changed: re-pack pages to fill the new viewport
        this.resizeDebounce = setTimeout(() => this.repaginatePreservingPosition(), 150);
      }
    });
  }

  // --- HUD Controls: Manual Tap Toggle (Stable & No Sudden Auto-Disappearing) ---
  showHUD() {
    this.hudVisible = true;
    this.readerView?.classList.remove('hud-hidden');
    if (this.readerToolbar) this.readerToolbar.inert = false;
    if (this.readerBottomBar) this.readerBottomBar.inert = false;
    if (this.readerZenBar) this.readerZenBar.inert = true;
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  hideHUD() {
    this.hideGestureHint();
    const returnToPanel = this.readerToolbar?.contains(document.activeElement) || this.readerBottomBar?.contains(document.activeElement);
    this.hideReaderSettings(false);
    this.hudVisible = false;
    this.readerView?.classList.add('hud-hidden');
    if (this.readerToolbar) this.readerToolbar.inert = true;
    if (this.readerBottomBar) this.readerBottomBar.inert = true;
    if (this.readerZenBar) this.readerZenBar.inert = false;
    if (returnToPanel) this.btnExitZen?.focus();
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

  open(prayer, startPage = 0, options = {}) {
    if (!prayer) return;
    starfield.pause();
    this.currentPrayer = prayer;
    this.currentPageIndex = startPage;
    this.playlist = options.playlist || null;
    this.playlistIndex = typeof options.playlistIndex === 'number' ? options.playlistIndex : -1;
    this.focusedChunkIndex = null;
    this.focusedElement = null;

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
    if (this.readerSubtitle) {
      if (this.playlist && this.playlistIndex >= 0) {
        this.readerSubtitle.textContent = `บทที่ ${toArabicDigits(this.playlistIndex + 1)}/${toArabicDigits(this.playlist.length)} ในรายการโปรด • ${prayer.category || 'บทสวดมนต์'}`;
      } else {
        this.readerSubtitle.textContent = prayer.category || 'บทสวดมนต์';
      }
    }

    // Render Comic Pages
    this.renderPages(prayer);

    // Prime matching MP3 track & only show MP3 button if real recording exists
    const matchedTrack = mp3Player.getTrackForPrayer(prayer);
    this.readerBottomBar?.querySelector('.row-secondary')?.classList.toggle('has-monk-audio', !!matchedTrack);
    if (this.btnMP3Play) this.btnMP3Play.hidden = !matchedTrack;
    if (matchedTrack) {
      if (this.btnMP3Play) this.btnMP3Play.style.display = 'inline-flex';
      this.hideMP3Deck();
      mp3Player.loadTrack(matchedTrack);
    } else {
      if (this.btnMP3Play) this.btnMP3Play.style.display = 'none';
      this.hideMP3Deck();
      mp3Player.pause();
    }

    // Show View and start in HUD mode, then auto-hide
    this.readerView.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Web fonts change line heights: re-pack pages once they have loaded
    if (document.fonts && document.fonts.status !== 'loaded') {
      document.fonts.ready.then(() => {
        if (this.currentPrayer === prayer) this.repaginatePreservingPosition();
      });
    }

    // Go to Start Page
    this.goToPage(this.currentPageIndex, false);
    audio.playOpenBell(); // rings only when the bell setting is 'all', so it doesn't cut into the chant

    // Show HUD briefly, then smoothly fade into zen fullscreen reading
    this.showHUD();
    this.showGestureHint();
    nativeBridge.setKeepAwake(true);
    nativeBridge.hideStatusBar();
  }

  close() {
    this.hideReaderSettings(false);
    starfield.resume();
    this.readerView.classList.remove('active');
    this.readerView.classList.remove('tts-active');
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    this.hideGestureHint();
    this.hideReaderHelp();
    this.focusedChunkIndex = null;
    this.focusedElement = null;
    document.body.style.overflow = '';
    nativeBridge.setKeepAwake(false);
    nativeBridge.showStatusBar();
    ttsEngine.stop();
    mp3Player.pause();
    this.hideTTSSettings();
    this.hideMP3Deck();
    this.hideItipisoCompleteModal();
    if (this.itipisoCounterWidget) this.itipisoCounterWidget.style.display = 'none';
    if (window.tammaApp && typeof window.tammaApp.refreshCurrentViews === 'function') {
      window.tammaApp.refreshCurrentViews();
    }
  }

  isOpen() {
    return this.readerView.classList.contains('active');
  }

  getCurrentFontSize() {
    if (typeof storage !== 'undefined' && storage.getSettings) {
      return storage.getSettings().fontSize || 1.15;
    }
    return 1.15;
  }

  paginatePrayerIntoBookPages(prayer, fontSizeRem = 1.15) {
    return paginatePrayerIntoBookPages(prayer, fontSizeRem);
  }

  /**
   * True Book Page Flip Reader:
   * Renders discrete pages on horizontal comic-track.
   * Every page strictly begins at top: 0 with the first verse of that page.
   */
  renderPages(prayer) {
    this.currentPrayer = prayer;
    this.bookPages = this.paginatePrayerIntoBookPages(prayer, this.getCurrentFontSize());
    this.totalPages = Math.max(1, this.bookPages.length);
    this.totalViewportPages = this.totalPages;
    this.endFlip(); // the pages being turned are about to be replaced
    this.comicTrack.innerHTML = '';

    // Prepare TTS Queue from bookPages so chunks match 1-to-1 with rendered book pages
    ttsEngine.prepareQueue(prayer, this.bookPages);

    let chunkIdx = 0;
    let lastOriginalPageIndex = -1;

    this.bookPages.forEach((bPage, bIdx) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'comic-page' + (bIdx === this.currentPageIndex ? ' active-page' : '');
      pageEl.dataset.pageIndex = bIdx;
      pageEl.dataset.bookPageIndex = bIdx;
      pageEl.dataset.originalPageIndex = bPage.originalPageIndex;

      const frame = document.createElement('div');
      frame.className = 'page-frame';

      // 1. Page Header (Verse Title)
      if (bPage.verseTitle) {
        const headerEl = document.createElement('div');
        headerEl.className = 'page-verse-header verse-clickable';
        headerEl.dataset.pageIndex = bPage.originalPageIndex;
        headerEl.dataset.bookPageIndex = bIdx;
        headerEl.dataset.type = 'title';
        headerEl.dataset.text = bPage.verseTitle;
        headerEl.textContent = bPage.verseTitle;

        const isNewSection = bPage.originalPageIndex !== lastOriginalPageIndex;
        if (isNewSection) {
          lastOriginalPageIndex = bPage.originalPageIndex;
          if (chunkIdx < ttsEngine.queue.length && ttsEngine.queue[chunkIdx].type === 'title') {
            headerEl.dataset.chunkId = ttsEngine.queue[chunkIdx].id;
            headerEl.dataset.chunkIndex = chunkIdx;
            chunkIdx++;
          }
        }

        headerEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleVerseClick(headerEl);
        });
        frame.appendChild(headerEl);
      }

      // 2. Viewport & Flow Container (Top-aligned, zero arbitrary scroll cutting)
      const viewport = document.createElement('div');
      viewport.className = 'page-verse-viewport';

      const flow = document.createElement('div');
      const layoutClass = `layout-${this.currentLayout || 'book'}`;
      flow.className = `page-verse-flow ${layoutClass}`;

      bPage.stanzas.forEach((stanza) => {
        const section = document.createElement('div');
        section.className = 'verse-section';

        if (stanza.pali) {
          const paliWrap = document.createElement('div');
          paliWrap.className = 'verse-pali-wrap';

          const stanzaEl = document.createElement('div');
          stanzaEl.className = 'verse-stanza';

          const lines = stanza.pali.split('\n').filter(l => l.trim().length > 0);
          lines.forEach((line, lIdx) => {
            const paliEl = document.createElement('div');
            paliEl.className = 'verse-pali verse-clickable' + (lIdx === 0 ? ' stanza-first-line' : '');
            paliEl.dataset.pageIndex = bPage.originalPageIndex;
            paliEl.dataset.bookPageIndex = bIdx;
            paliEl.dataset.type = 'pali';
            paliEl.dataset.text = line.trim();

            if (chunkIdx < ttsEngine.queue.length) {
              let matchIdx = -1;
              if (ttsEngine.queue[chunkIdx].type === 'pali' && ttsEngine.queue[chunkIdx].rawText.trim() === line.trim()) {
                matchIdx = chunkIdx;
              } else {
                for (let si = chunkIdx; si < Math.min(chunkIdx + 15, ttsEngine.queue.length); si++) {
                  if (ttsEngine.queue[si].type === 'pali' && ttsEngine.queue[si].rawText.trim() === line.trim()) {
                    matchIdx = si;
                    break;
                  }
                }
              }
              if (matchIdx >= 0) {
                chunkIdx = matchIdx;
                const matchingIds = [];
                const firstIdx = chunkIdx;
                while (chunkIdx < ttsEngine.queue.length && ttsEngine.queue[chunkIdx].type === 'pali' && ttsEngine.queue[chunkIdx].rawText.trim() === line.trim()) {
                  matchingIds.push(ttsEngine.queue[chunkIdx].id);
                  chunkIdx++;
                }
                paliEl.dataset.chunkId = matchingIds[0];
                paliEl.dataset.chunkIds = matchingIds.join(',');
                paliEl.dataset.chunkIndex = firstIdx;
              }
            }

            const displayPali = (this.currentScript && this.currentScript !== 'thai-phonetic')
              ? paliScript.transliterate(line, this.currentScript)
              : line;
            paliEl.innerHTML = this.escapeHtml(displayPali);
            paliEl.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.handleVerseClick(paliEl);
            });
            stanzaEl.appendChild(paliEl);
          });
          paliWrap.appendChild(stanzaEl);
          section.appendChild(paliWrap);
        }

        if (stanza.thai) {
          const thaiWrap = document.createElement('div');
          thaiWrap.className = 'verse-thai-wrap';

          const stanzaEl = document.createElement('div');
          stanzaEl.className = 'verse-thai-stanza';

          const thaiLines = stanza.thai.split(/\n+/).filter(l => l.trim().length > 0);
          thaiLines.forEach((tLine, tIdx) => {
            const thaiEl = document.createElement('div');
            thaiEl.className = 'verse-thai verse-clickable' + (tIdx === 0 ? ' stanza-first-line' : '');
            thaiEl.dataset.pageIndex = bPage.originalPageIndex;
            thaiEl.dataset.bookPageIndex = bIdx;
            thaiEl.dataset.type = 'thai';
            thaiEl.dataset.text = tLine.trim();

            if (chunkIdx < ttsEngine.queue.length) {
              let matchIdx = -1;
              if (ttsEngine.queue[chunkIdx].type === 'thai' && ttsEngine.queue[chunkIdx].rawText.trim() === tLine.trim()) {
                matchIdx = chunkIdx;
              } else {
                for (let si = chunkIdx; si < Math.min(chunkIdx + 15, ttsEngine.queue.length); si++) {
                  if (ttsEngine.queue[si].type === 'thai' && ttsEngine.queue[si].rawText.trim() === tLine.trim()) {
                    matchIdx = si;
                    break;
                  }
                }
              }
              if (matchIdx >= 0) {
                chunkIdx = matchIdx;
                const matchingIds = [];
                const firstIdx = chunkIdx;
                while (chunkIdx < ttsEngine.queue.length && ttsEngine.queue[chunkIdx].type === 'thai' && ttsEngine.queue[chunkIdx].rawText.trim() === tLine.trim()) {
                  matchingIds.push(ttsEngine.queue[chunkIdx].id);
                  chunkIdx++;
                }
                thaiEl.dataset.chunkId = matchingIds[0];
                thaiEl.dataset.chunkIds = matchingIds.join(',');
                thaiEl.dataset.chunkIndex = firstIdx;
              }
            }

            thaiEl.innerHTML = this.escapeHtml(tLine);
            thaiEl.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.handleVerseClick(thaiEl);
            });
            stanzaEl.appendChild(thaiEl);
          });
          thaiWrap.appendChild(stanzaEl);
          section.appendChild(thaiWrap);
        }

        flow.appendChild(section);
      });

      // Special itipiso tally counter button check
      const rawP = bPage.rawPage;
      if (rawP) {
        if (isRoundCountingPage(rawP)) {
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
          flow.appendChild(launchBox);
        }
      }

      viewport.appendChild(flow);
      frame.appendChild(viewport);

      // 3. Footer Container with Page indicator & Next cue

      pageEl.appendChild(frame);
      this.comicTrack.appendChild(pageEl);
    });

    // Keep the estimated pages for the TTS queue, then re-pack by real measured height
    this.logicalPages = this.bookPages;
    formatDisplayedNumbers(this.comicTrack);
    this.reflowPagesToFit();

    // Sync Scrubber & Dots
    this.calculateViewportMetrics();

    // Ensure we are on the current valid page
    const safePage = Math.min(this.currentPageIndex || 0, this.totalPages - 1);
    this.goToPage(safePage, false);
  }


  /**
   * Measured Book Reflow:
   * Re-packs the rendered stanzas into pages using the real on-screen page height,
   * so every page is filled top-to-bottom and reading flows continuously across
   * section boundaries. A stanza that doesn't fit continues on the next page line by line.
   * Returns false (keeping the estimated pages) when the reader isn't laid out yet.
   */
  reflowPagesToFit() {
    if (!this.comicTrack || typeof document === 'undefined') return false;
    const oldPages = Array.from(this.comicTrack.querySelectorAll('.comic-page'));
    if (oldPages.length === 0) return false;
    const probeViewport = oldPages[0].querySelector('.page-verse-viewport');
    if (!probeViewport || probeViewport.clientHeight < 60) return false;

    // 1. Flatten the estimated pages into an ordered stream of titles, stanzas & blocks
    const items = [];
    let lastOriginal = -1;
    let pendingBlock = null;
    oldPages.forEach((pageEl) => {
      const logical = this.logicalPages?.[parseInt(pageEl.dataset.pageIndex, 10)];
      const originalPageIndex = parseInt(pageEl.dataset.originalPageIndex, 10) || 0;
      if (originalPageIndex !== lastOriginal) {
        if (pendingBlock) items.push(pendingBlock);
        pendingBlock = null;
        lastOriginal = originalPageIndex;
        const text = (logical?.verseTitle || '').replace(/\s*\(\d+\/\d+\)$/, '');
        if (text) {
          items.push({ kind: 'title', text, originalPageIndex, el: pageEl.querySelector('.page-verse-header') });
        }
      }
      const flow = pageEl.querySelector('.page-verse-flow');
      Array.from(flow ? flow.children : []).forEach((child) => {
        if (child.classList.contains('verse-section')) {
          items.push({ kind: 'section', el: child, originalPageIndex });
        } else {
          // One launch box per section (the estimator repeats it on every sub-page)
          pendingBlock = { kind: 'block', el: child, originalPageIndex };
        }
      });
    });
    if (pendingBlock) items.push(pendingBlock);

    // 2. Rebuild pages, filling each one until the measured viewport is full
    this.comicTrack.innerHTML = '';
    const layoutClass = `layout-${this.currentLayout || 'book'}`;
    const rootFontPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const minLinePx = rootFontPx * this.getCurrentFontSize() * 2.1;
    const pages = [];
    let cur = null;
    let currentTitle = '';
    let currentOriginal = 0;

    const fits = () => cur.viewport.scrollHeight <= cur.viewport.clientHeight + 1;

    const setHeader = (page, titleEl, text) => {
      const displayedText = toArabicDigits(text);
      let header = titleEl;
      if (header) {
        header.className = 'page-verse-header verse-clickable';
      } else {
        header = document.createElement('div');
        header.className = 'page-verse-header';
      }
      header.textContent = displayedText;
      header.dataset.text = text;
      if (page.header) page.header.replaceWith(header);
      else page.frame.insertBefore(header, page.viewport);
      page.header = header;
    };

    const openPage = () => {
      // Only the page being filled stays attached, so each measurement lays out one page
      if (cur) {
        // Safety net: never clip text, let an over-full page scroll instead
        if (!fits()) cur.viewport.classList.add('page-overflow');
        cur.pageEl.remove();
      }
      const idx = pages.length;
      const pageEl = document.createElement('div');
      pageEl.className = 'comic-page';
      pageEl.dataset.pageIndex = idx;
      pageEl.dataset.bookPageIndex = idx;
      pageEl.dataset.originalPageIndex = currentOriginal;

      const frame = document.createElement('div');
      frame.className = 'page-frame';
      const viewport = document.createElement('div');
      viewport.className = 'page-verse-viewport';
      const flow = document.createElement('div');
      flow.className = `page-verse-flow ${layoutClass}`;
      viewport.appendChild(flow);
      frame.appendChild(viewport);
      pageEl.appendChild(frame);
      this.comicTrack.appendChild(pageEl);

      cur = { pageEl, frame, header: null, viewport, flow, count: 0, originalPageIndex: currentOriginal };
      if (currentTitle) setHeader(cur, null, currentTitle);
      pages.push(cur);
    };

    const placeTitle = (item) => {
      currentTitle = item.text;
      currentOriginal = item.originalPageIndex;
      if (cur && cur.count > 0) {
        const titleEl = item.el || document.createElement('div');
        titleEl.className = 'verse-section-title' + (item.el ? ' verse-clickable' : '');
        titleEl.textContent = toArabicDigits(item.text);
        titleEl.dataset.text = item.text;
        cur.flow.appendChild(titleEl);
        // Keep the title with at least one following line
        if (fits() && cur.viewport.clientHeight - cur.flow.offsetHeight >= minLinePx) return;
        titleEl.remove();
      }
      if (!cur || cur.count > 0) openPage();
      cur.originalPageIndex = item.originalPageIndex;
      cur.pageEl.dataset.originalPageIndex = item.originalPageIndex;
      setHeader(cur, item.el, item.text);
    };

    const placeBlock = (el) => {
      if (!cur) openPage();
      cur.flow.appendChild(el);
      if (fits() || cur.count === 0) { cur.count++; return; }
      el.remove();
      openPage();
      cur.flow.appendChild(el);
      cur.count++;
    };

    const placeSection = (section) => {
      if (!cur) openPage();
      cur.flow.appendChild(section);
      if (fits()) { cur.count++; return; }

      // Lines already clear of the page bottom in this layout can be placed without re-measuring
      const safeLines = new Set();
      const leafLines = Array.from(section.querySelectorAll('.verse-pali, .verse-thai'));
      if (leafLines.length > 0) {
        const lastBottom = leafLines[leafLines.length - 1].getBoundingClientRect().bottom;
        const limit = cur.viewport.getBoundingClientRect().top + cur.viewport.clientHeight
          - (cur.flow.getBoundingClientRect().bottom - lastBottom) - 24;
        for (const ln of leafLines) {
          if (ln.getBoundingClientRect().bottom > limit) break;
          safeLines.add(ln);
        }
      }
      section.remove();

      // Move lines one by one (section > wrap > stanza > line) into matching shells on this page.
      // Shells clone the source containers, so a stanza marked 'stanza-continued' stays un-indented.
      let secShell = null;
      let wrapShell = null;
      for (const wrap of Array.from(section.children)) {
        for (const stanza of Array.from(wrap.children)) {
          let stanzaShell = null;
          let placedInStanza = 0;
          for (const line of Array.from(stanza.children)) {
            if (!secShell) { secShell = section.cloneNode(false); cur.flow.appendChild(secShell); }
            if (!wrapShell) { wrapShell = wrap.cloneNode(false); secShell.appendChild(wrapShell); }
            if (!stanzaShell) { stanzaShell = stanza.cloneNode(false); wrapShell.appendChild(stanzaShell); }
            stanzaShell.appendChild(line);
            if (safeLines.has(line) || fits()) {
              cur.count++;
              placedInStanza++;
              continue;
            }

            // Page is full: keep the words of this line that fit, carry the rest back into the source
            let carry = line;
            const rest = this.splitLineToFit(line, fits, cur.count === 0 ? 1 : 2, cur.viewport);
            if (rest) {
              cur.count++;
              carry = rest;
            } else if (cur.count === 0) {
              // A single word taller than a whole page (extreme zoom) may scroll inside its page
              cur.viewport.classList.add('page-overflow');
              cur.count++;
              carry = null;
            } else {
              line.remove();
            }
            [stanzaShell, wrapShell, secShell].forEach(el => { if (!el.hasChildNodes()) el.remove(); });

            if (carry) stanza.prepend(carry);
            if (rest || placedInStanza > 0) stanza.classList.add('stanza-continued');
            section.querySelectorAll('.verse-stanza, .verse-thai-stanza').forEach(el => { if (!el.hasChildNodes()) el.remove(); });
            Array.from(section.children).forEach(el => { if (!el.hasChildNodes()) el.remove(); });

            // The remainder is placed like a fresh section, so it gets the whole-fit fast path again
            if (section.hasChildNodes()) {
              openPage();
              placeSection(section);
            }
            return;
          }
        }
        wrapShell = null;
      }
    };

    items.forEach((item) => {
      if (item.kind === 'title') placeTitle(item);
      else if (item.kind === 'section') placeSection(item.el);
      else placeBlock(item.el);
    });
    if (!cur) openPage();
    if (!fits()) cur.viewport.classList.add('page-overflow');

    // 3. Finalize page indices & TTS chunk → page mapping
    const chunkPage = new Map();
    pages.forEach((page, idx) => {
      this.comicTrack.appendChild(page.pageEl);
      page.pageEl.querySelectorAll('.verse-clickable').forEach((el) => {
        el.dataset.bookPageIndex = idx;
        const ids = (el.dataset.chunkIds || el.dataset.chunkId || '').split(',').filter(Boolean);
        // A split line belongs to the page where it starts
        ids.forEach(id => { if (!chunkPage.has(id)) chunkPage.set(id, idx); });
      });
    });
    ttsEngine.queue.forEach((chunk) => {
      if (chunkPage.has(chunk.id)) chunk.bookPageIndex = chunkPage.get(chunk.id);
    });

    this.bookPages = pages.map((page, idx) => ({
      pageNumber: idx + 1,
      originalPageIndex: page.originalPageIndex,
      verseTitle: page.header ? page.header.textContent : '',
      stanzas: []
    }));
    this.totalPages = pages.length;
    this.totalViewportPages = this.totalPages;
    return true;
  }

  // Trims an overflowing line to the most words that fit and returns a clone holding the rest
  splitLineToFit(line, fits, minWords = 1, viewport = null) {
    const full = line.textContent;
    // Thai often has no spaces between words, so segment by dictionary words when possible
    let words = null;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        if (!this.wordSegmenter) this.wordSegmenter = new Intl.Segmenter('th', { granularity: 'word' });
        words = Array.from(this.wordSegmenter.segment(full), seg => seg.segment);
      } catch (e) {
        words = null;
      }
    }
    if (!words) words = full.split(/(?<= )/);
    if (words.length < 2) return null;
    const head = (k) => words.slice(0, k).join('').trimEnd();
    let lo = 0;
    let hi = words.length - 1;

    // Fast path: read word positions from the current layout instead of re-measuring per guess
    const estimate = this.estimateWordsThatFit(line, words, viewport);
    if (estimate >= 0) {
      if (estimate > 0) {
        line.textContent = head(estimate);
        if (fits()) lo = estimate;
        else hi = estimate - 1;
      }
      if (lo === estimate && estimate < hi) {
        line.textContent = head(estimate + 1);
        if (fits()) lo = estimate + 1;
        else hi = estimate;
      }
    }
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      line.textContent = head(mid);
      if (fits()) lo = mid;
      else hi = mid - 1;
    }
    if (lo < minWords || !head(lo) || !words.slice(lo).join('').trim()) {
      line.textContent = full;
      return null;
    }
    line.textContent = head(lo);
    const rest = line.cloneNode(false);
    rest.textContent = words.slice(lo).join('').trimStart();
    rest.classList.remove('stanza-first-line');
    rest.classList.add('verse-line-continued');
    rest.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleVerseClick(rest);
    });
    return rest;
  }

  // Counts the leading words whose line box ends above the page bottom, using one layout pass (-1 = unknown)
  estimateWordsThatFit(line, words, viewport) {
    const textNode = line.firstChild;
    const flow = viewport?.firstElementChild;
    if (!textNode || textNode.nodeType !== 3 || line.childNodes.length !== 1 || !flow) return -1;
    const lineRect = line.getBoundingClientRect();
    const limit = viewport.getBoundingClientRect().top + viewport.clientHeight
      - (flow.getBoundingClientRect().bottom - lineRect.bottom);
    const lineHeight = parseFloat(getComputedStyle(line).lineHeight) || 0;
    const range = document.createRange();
    let offset = 0;
    let keep = 0;
    for (let i = 0; i < words.length; i++) {
      const end = offset + words[i].length;
      range.setStart(textNode, offset);
      range.setEnd(textNode, end);
      const rects = range.getClientRects();
      const rect = rects[rects.length - 1];
      if (rect && rect.height > 0) {
        // Glyph boxes are shorter than line boxes: add the half-leading below the glyphs
        const halfLeading = Math.max(0, (lineHeight - rect.height) / 2);
        if (rect.bottom + halfLeading > limit + 0.5) break;
      }
      keep = i + 1;
      offset = end;
    }
    return Math.min(keep, words.length - 1);
  }

  // Re-render after font/layout/viewport changes while keeping the reader on the same verse
  repaginatePreservingPosition() {
    if (!this.currentPrayer || !this.isOpen()) return;
    let anchor = -1;
    // First verse on the current page, or the closest one before it (repeated lines carry no chunk)
    for (let p = this.currentPageIndex; p >= 0 && anchor < 0; p--) {
      const pageEl = this.comicTrack?.querySelector(`.comic-page[data-page-index="${p}"]`);
      const marked = pageEl ? pageEl.querySelectorAll('[data-chunk-index]') : [];
      const el = p === this.currentPageIndex ? marked[0] : marked[marked.length - 1];
      if (el) anchor = parseInt(el.dataset.chunkIndex, 10);
    }

    this.renderPages(this.currentPrayer);

    let target = -1;
    if (anchor >= 0) {
      let best = -1;
      this.comicTrack.querySelectorAll('[data-chunk-index]').forEach((el) => {
        const ci = parseInt(el.dataset.chunkIndex, 10);
        if (ci <= anchor && ci > best) {
          best = ci;
          target = parseInt(el.closest('.comic-page')?.dataset.pageIndex, 10);
        }
      });
    }
    this.goToPage(target >= 0 ? target : Math.min(this.currentPageIndex, this.totalPages - 1), false);
  }

  calculateViewportMetrics() {
    this.totalPages = Math.max(1, this.bookPages ? this.bookPages.length : 1);
    this.totalViewportPages = this.totalPages;

    if (this.currentPageIndex >= this.totalPages) {
      this.currentPageIndex = this.totalPages - 1;
    }
    this.viewportIndex = this.currentPageIndex;

    // Sync Scrubber Controls
    if (this.readerScrubber) {
      this.readerScrubber.min = 1;
      this.readerScrubber.max = this.totalPages;
      this.readerScrubber.value = (this.currentPageIndex || 0) + 1;
    }
    if (this.readerPageBadge) {
      this.readerPageBadge.textContent = `${(this.currentPageIndex || 0) + 1} / ${this.totalPages}`;
    }

    this.renderPageDots();
  }

  goToPage(index, animate = true) {
    if (index < 0) index = 0;
    if (index >= this.totalPages) index = this.totalPages - 1;

    const fromIndex = Math.min(this.currentPageIndex || 0, this.totalPages - 1);
    this.currentPageIndex = index;
    this.viewportIndex = index;

    // A drag frame still queued must not overwrite the turn animation
    if (this.dragFrame) {
      cancelAnimationFrame(this.dragFrame);
      this.dragFrame = null;
    }

    // Active page class
    const pages = this.comicTrack.querySelectorAll('.comic-page');
    pages.forEach((p, idx) => {
      p.classList.toggle('active-page', idx === index);
    });

    // 3D book page turn
    this.turnToPage(fromIndex, index, animate);

    // Update Scrubber Badge & Slider Value
    if (this.readerScrubber) {
      this.readerScrubber.value = index + 1;
    }
    if (this.readerPageBadge) {
      this.readerPageBadge.textContent = `${index + 1} / ${this.totalPages}`;
    }
    this.readerScrubber?.setAttribute('aria-valuetext', `หน้า ${index + 1} จาก ${this.totalPages}`);

    // Update Finish overlay
    const finishOverlay = document.getElementById('finishChantOverlay');
    if (finishOverlay) {
      if (index === this.totalPages - 1) {
        finishOverlay.classList.add('show');
        if (this.btnFinishChantBig) {
          if (this.playlist && this.playlistIndex >= 0 && this.playlistIndex < this.playlist.length - 1) {
            const nextItem = this.playlist[this.playlistIndex + 1];
            this.btnFinishChantBig.innerHTML = `🔔 สวดจบแล้ว • ไปบทถัดไป (ลำดับที่ ${this.playlistIndex + 2}) ⏩<div style="font-size: 0.82rem; font-weight: normal; opacity: 0.9; margin-top: 3px;">${nextItem.title}</div>`;
          } else if (this.playlist && this.playlist.length > 1) {
            this.btnFinishChantBig.innerHTML = `🔔 สวดจบลำดับสุดท้ายแล้ว (จบรายการโปรด) 🙏`;
          } else {
            this.btnFinishChantBig.innerHTML = `🔔 อ่านจบแล้ว (บันทึกการสวด)`;
          }
        }
      } else {
        finishOverlay.classList.remove('show');
      }
    }

    this.updateDots();
    this.updateNavButtons();
    this.checkItipisoPage();
  }

  // --- 3D Book Page Turn ---
  // Pages lie stacked. Turning forward, the current leaf rotates on its spine (left edge) and lifts away,
  // revealing the next page underneath; turning back, the previous leaf comes down over the current one.
  // Angle of the top leaf: 0 = lying flat on the book, -90 = standing on the spine (edge-on, out of sight).
  getPageEl(index) {
    return this.comicTrack?.querySelector(`.comic-page[data-page-index="${index}"]`);
  }

  beginFlip(from, to) {
    this.endFlip();
    const forward = to > from;
    const top = this.getPageEl(forward ? from : to);
    const under = this.getPageEl(forward ? to : from);
    if (!top || !under || top === under) return null;
    if (!this.flipShade) {
      this.flipShade = document.createElement('div');
      this.flipShade.className = 'page-turn-shade';
      this.underShade = document.createElement('div');
      this.underShade.className = 'page-under-shade';
    }
    top.classList.add('flip-top');
    under.classList.add('flip-under');
    top.appendChild(this.flipShade);
    under.appendChild(this.underShade);
    this.flip = { from, to, forward, top, under };
    this.setFlipAngle(forward ? 0 : -90);
    return this.flip;
  }

  setFlipAngle(angle, durationMs = 0, easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)') {
    const f = this.flip;
    if (!f) return;
    const timing = durationMs ? `${Math.round(durationMs)}ms ${easing}` : '';
    f.top.style.transition = durationMs ? `transform ${timing}` : 'none';
    this.flipShade.style.transition = durationMs ? `opacity ${timing}` : 'none';
    this.underShade.style.transition = durationMs ? `opacity ${timing}` : 'none';
    f.top.style.transform = `rotateY(${angle}deg)`;
    const lift = Math.min(1, Math.abs(angle) / 90);
    this.flipShade.style.opacity = (lift * 0.7).toFixed(3);
    this.underShade.style.opacity = ((1 - lift) * 0.85).toFixed(3);
  }

  endFlip() {
    if (this.flipTimer) {
      clearTimeout(this.flipTimer);
      this.flipTimer = null;
    }
    const f = this.flip;
    if (!f) return;
    this.flip = null;
    f.top.classList.remove('flip-top');
    f.under.classList.remove('flip-under');
    f.top.style.transform = '';
    f.top.style.transition = '';
    this.flipShade?.remove();
    this.underShade?.remove();
  }

  // Show page `to`: finish a turn the finger started (or roll it back), or play a whole turn
  turnToPage(from, to, animate) {
    const f = this.flip;
    if (animate && f && (f.to === to || f.from === to)) {
      const showTarget = f.to === to;
      const angle = showTarget === f.forward ? -90 : 0;
      const duration = this.flipDuration || 480;
      this.setFlipAngle(angle, duration);
      this.flipTimer = setTimeout(() => this.endFlip(), duration + 40);
      return;
    }
    if (!animate || from === to || !this.beginFlip(from, to)) {
      this.endFlip();
      return;
    }
    // Buttons, TTS auto-turn, scrubber jumps: one full, unhurried turn
    // (force a style flush so the start angle is applied before the transition)
    void this.flip.top.offsetWidth;
    const duration = 560;
    this.setFlipAngle(this.flip.forward ? -90 : 0, duration, 'cubic-bezier(0.45, 0.05, 0.25, 1)');
    this.flipTimer = setTimeout(() => this.endFlip(), duration + 40);
  }

  goToViewport(index, animate = true) {
    this.goToPage(index, animate);
  }

  nextPage() {
    if (this.currentPageIndex < this.totalPages - 1) {
      this.goToPage(this.currentPageIndex + 1, true);
    } else {
      // Reached the end of prayer! Play bell tone
      audio.playBell(648);
    }
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.goToPage(this.currentPageIndex - 1, true);
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
    const atEnd = this.viewportIndex === this.totalViewportPages - 1;
    if (this.readerTopPageBadge) {
      this.readerTopPageBadge.textContent = `${this.viewportIndex + 1} / ${this.totalViewportPages}`;
      this.readerTopPageBadge.setAttribute('aria-label', `หน้า ${this.viewportIndex + 1} จาก ${this.totalViewportPages}`);
    }
    if (this.btnPrev) {
      this.btnPrev.disabled = this.viewportIndex === 0;
    }
    if (this.btnNext) {
      this.btnNext.textContent = atEnd ? 'จบ ✓' : 'ปัด ›';
      this.btnNext.setAttribute('aria-label', atEnd ? 'จบการสวดมนต์' : 'หน้าถัดไป');
    }
  }

  // --- Drag-to-Flip: the page follows the finger, then settles on release ---
  // Lock the gesture to one axis once it moves far enough, so vertical swipes never drag the track
  lockDragAxis(deltaX, deltaY) {
    if (!this.dragAxis && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
      this.dragAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
      if (this.dragAxis === 'x') {
        // Measure the drag from the lock point so the page doesn't jump by the 8px slop
        this.dragOriginX = this.touchCurrentX;
        this.dragSamples = [];
        this.comicStage?.classList.add('is-dragging');
        window.getSelection?.()?.removeAllRanges();
      }
    }
    return this.dragAxis;
  }

  // Track the finger with one transform write per display frame
  dragTo(clientX) {
    if (!this.comicTrack) return;
    const now = performance.now();
    this.dragSamples.push({ x: clientX, t: now });
    while (this.dragSamples.length > 2 && now - this.dragSamples[0].t > 100) this.dragSamples.shift();

    const dx = clientX - this.dragOriginX; // < 0 turns to the next page, > 0 back to the previous one
    const forward = dx < 0;
    const target = this.currentPageIndex + (forward ? 1 : -1);
    if (dx === 0 || target < 0 || target >= this.totalPages) {
      // Nothing to turn to (first/last page): keep the book still
      this.dragOffset = 0;
      if (this.flip) this.endFlip();
      return;
    }
    if (!this.flip || this.flip.to !== target) this.beginFlip(this.currentPageIndex, target);

    // The turning edge travels exactly as far as the finger. The edge sits at width·cos(angle):
    // forward it starts at the right edge and moves toward the spine; back it rises from the spine.
    const width = this.comicStage?.clientWidth || window.innerWidth || 360;
    const p = Math.min(1, Math.abs(dx) / width);
    this.dragOffset = dx;
    this.dragAngle = -(Math.acos(forward ? 1 - p : p) * 180) / Math.PI;

    if (this.dragFrame) return;
    this.dragFrame = requestAnimationFrame(() => {
      this.dragFrame = null;
      this.setFlipAngle(this.dragAngle);
    });
  }

  // Finger speed over the last ~100ms in px/ms (> 0 = moving right)
  dragVelocity() {
    const s = this.dragSamples || [];
    if (s.length < 2) return 0;
    const first = s[0];
    const last = s[s.length - 1];
    if (performance.now() - last.t > 80) return 0; // finger paused before lifting: no flick
    return (last.x - first.x) / Math.max(1, last.t - first.t);
  }

  // Flip when dragged far enough or flicked, otherwise spring back; the settle speed matches the flick
  finishDrag(deltaX) {
    const velocity = this.dragVelocity();
    const offset = this.dragOffset || 0;
    const width = this.comicStage?.clientWidth || window.innerWidth || 360;
    const towardNext = deltaX > 0;
    // A flick back against the drag direction cancels the flip, like a real page let go of
    const flickedBack = towardNext ? velocity > 0.3 : velocity < -0.3;
    const flicked = Math.abs(velocity) > 0.35 && Math.abs(deltaX) > 20;
    const commit = !flickedBack && (Math.abs(deltaX) > this.swipeThreshold || flicked);

    const before = this.currentPageIndex;
    const remaining = commit ? width - Math.abs(offset) : Math.abs(offset);
    const speed = Math.max(Math.abs(velocity), 1);
    this.flipDuration = Math.min(420, Math.max(180, (2.2 * remaining) / speed));

    if (commit) {
      if (towardNext) {
        this.nextPage();
      } else {
        this.prevPage();
      }
    }
    if (this.currentPageIndex === before) this.goToPage(before, true);
    // Hiding the HUD restyles the whole reader; do it here, where the settle slide runs on the GPU,
    // instead of on the first drag frame where it caused a hitch
    if (this.hudVisible) this.hideHUD();
    this.blockVerseTaps();
    this.endDragState();
  }

  endDragState() {
    this.dragAxis = null;
    this.dragOffset = 0;
    this.flipDuration = null;
    this.comicStage?.classList.remove('is-dragging');
  }

  cancelDrag() {
    const wasDragging = this.dragAxis === 'x';
    this.isSwiping = false;
    if (wasDragging) this.goToPage(this.currentPageIndex, true);
    this.endDragState();
  }

  // --- Touch Gesture Controllers (Swipe Left/Right = Flip Pages, Swipe Up/Down = Control Panel) ---
  handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    const target = e.target;
    // Ignore interactive controls to prevent button/HUD clash
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .reader-zen-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary, .itipiso-counter-widget, .itipiso-modal-overlay, .itipiso-modal-card')) {
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
    this.dragAxis = null;
  }

  handleTouchMove(e) {
    if (!this.isSwiping || e.touches.length !== 1) return;
    this.touchCurrentX = e.touches[0].clientX;
    this.touchCurrentY = e.touches[0].clientY;

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - this.touchCurrentY;

    // ปัดซ้าย-ขวา: หน้ากระดาษเลื่อนตามนิ้วทันที (แผงควบคุมซ่อนตอนปล่อยนิ้ว เพื่อไม่ให้สะดุดตอนเริ่มลาก)
    if (this.lockDragAxis(deltaX, deltaY) === 'x') {
      this.hideGestureHint();
      this.dragTo(this.touchCurrentX);
    }
  }

  handleTouchEnd(e) {
    if (!this.isSwiping || !this.touchStartTime) return;
    this.isSwiping = false;
    this.lastTouchTime = Date.now();

    if (this.dragAxis === 'x') {
      this.finishDrag(this.touchStartX - this.touchCurrentX);
      return;
    }
    this.dragAxis = null;

    const target = e.target;
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .reader-zen-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary, .itipiso-counter-widget, .itipiso-modal-overlay, .itipiso-modal-card')) {
      return;
    }

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - (e.changedTouches[0]?.clientY || this.touchCurrentY);
    const elapsed = Date.now() - this.touchStartTime;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 1. ปัดซ้าย-ขวา เป็นเปลี่ยนหน้า (Horizontal Swipe)
    if (absX > absY && absX > this.swipeThreshold) {
      this.blockVerseTaps();
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      if (deltaX > 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
      return;
    } 

    // 2. ปัดขึ้น-ลง เป็นเปิด/ซ่อนแผงควบคุม (Vertical Swipe)
    if (absY > absX && absY > this.swipeThreshold) {
      this.hideGestureHint();
      this.toggleHUD();
      return;
    }

    const isCleanTap = elapsed < 500 && absX < 20 && absY < 20;
    const edge = isCleanTap ? this.edgeTapDirection(this.touchStartX) : null;

    // 3. Edge taps always turn the page, even over verse text or its play chip
    if (edge) {
      this.blockVerseTaps();
      this.hideGestureHint();
      if (edge === 'next') this.nextPage(); else this.prevPage();
      return;
    }

    // If tap was on a clickable verse or focus pill, DO NOT toggle HUD or turn pages!
    // Native click event handles verse focus and recitation cleanly.
    if (target.closest('.verse-clickable, .verse-focus-pill')) {
      return;
    }

    // 4. Clean tap on the center of the reading stage -> Toggle HUD
    if (isCleanTap) {
      this.hideGestureHint();
      this.toggleHUD();
    }
  }

  // --- Mouse Drag & Click Gestures for Desktop ---
  handleMouseDown(e) {
    if (this.lastTouchTime && Date.now() - this.lastTouchTime < 700) return;
    const target = e.target;
    // Ignore interactive controls to prevent button/HUD clash
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .reader-zen-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary, .itipiso-counter-widget, .itipiso-modal-overlay, .itipiso-modal-card')) {
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
    this.dragAxis = null;
  }

  handleMouseMove(e) {
    if (!this.isMouseDown) return;
    this.touchCurrentX = e.clientX;
    this.touchCurrentY = e.clientY;

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - this.touchCurrentY;

    if (this.lockDragAxis(deltaX, deltaY) === 'x') {
      this.hideGestureHint();
      this.dragTo(this.touchCurrentX);
    }
  }

  handleMouseUp(e) {
    if (!this.isMouseDown || !this.touchStartTime) return;
    this.isMouseDown = false;
    if (this.dragAxis === 'x') {
      this.finishDrag(this.touchStartX - this.touchCurrentX);
      return;
    }
    this.dragAxis = null;
    if (this.lastTouchTime && Date.now() - this.lastTouchTime < 700) return;

    const target = e.target;
    if (target.closest('button, input, select, a, .scroll-more-indicator, .reader-toolbar, .reader-bottom-bar, .reader-zen-bar, .comic-nav-btn, .btn-circle-add, .card-fav-btn, .reader-dot, .btn-primary, .btn-secondary, .itipiso-counter-widget, .itipiso-modal-overlay, .itipiso-modal-card')) {
      return;
    }

    const deltaX = this.touchStartX - this.touchCurrentX;
    const deltaY = this.touchStartY - e.clientY;
    const elapsed = Date.now() - this.touchStartTime;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 1. ปัดซ้าย-ขวา เป็นเปลี่ยนหน้า
    if (absX > absY && absX > this.swipeThreshold) {
      this.blockVerseTaps();
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      if (deltaX > 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
      return;
    } 

    // 2. ปัดขึ้น-ลง เป็นเปิด/ซ่อนแผงควบคุม
    if (absY > absX && absY > this.swipeThreshold) {
      this.hideGestureHint();
      this.toggleHUD();
      return;
    }

    const isCleanClick = elapsed < 500 && absX < 15 && absY < 15;
    const edge = isCleanClick ? this.edgeTapDirection(this.touchStartX) : null;

    // 3. Edge clicks always turn the page, even over verse text or its play chip
    if (edge) {
      this.blockVerseTaps();
      this.hideGestureHint();
      if (edge === 'next') this.nextPage(); else this.prevPage();
      return;
    }

    // If click was on a clickable verse or focus pill, DO NOT toggle HUD or turn pages!
    if (target.closest('.verse-clickable, .verse-focus-pill')) {
      return;
    }

    // 4. Clean click on the center of the stage -> Toggle HUD
    if (isCleanClick) {
      this.hideGestureHint();
      this.toggleHUD();
    }
  }

  // --- Mouse Wheel & Trackpad Gesture Controller ---
  handleWheel(e) {
    if (!this.isOpen()) return;
    const target = e.target;
    if (target.closest('select, input, .reader-toolbar, .reader-bottom-bar, .reader-zen-bar, .tts-settings-card, .reader-help-card, .mp3-player-deck')) {
      return;
    }
    const now = Date.now();
    if (this.lastWheelTime && now - this.lastWheelTime < 280) return;

    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);

    // แนวนอน (Horizontal wheel/trackpad) -> เปลี่ยนหน้า
    if (absX > absY && absX > 20) {
      e.preventDefault();
      this.lastWheelTime = now;
      if (this.hudVisible) this.hideHUD();
      this.hideGestureHint();
      if (e.deltaX > 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
      return;
    }

    // แนวตั้ง (Vertical wheel/trackpad) -> เปิด/ซ่อนแผงควบคุม
    if (absY > absX && absY > 20) {
      e.preventDefault();
      this.lastWheelTime = now;
      this.hideGestureHint();
      this.toggleHUD();
      return;
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

  showReaderSettings() {
    if (!this.readerSettingsModal) return;
    this.showHUD();
    this.hideReaderHelp();
    this.hideTTSSettings();
    this.hideMP3Deck();
    this.readerSettingsModal.style.display = 'flex';
    [this.readerToolbar, this.readerBottomBar, this.comicStage, this.readerZenBar].forEach(el => {
      if (el) el.inert = true;
    });
    this.btnReaderSettings?.setAttribute('aria-expanded', 'true');
    this.btnCloseReaderSettings?.focus();
  }

  hideReaderSettings(restoreFocus = true) {
    if (!this.readerSettingsModal || this.readerSettingsModal.style.display === 'none') return;
    this.readerSettingsModal.style.display = 'none';
    [this.readerToolbar, this.readerBottomBar, this.comicStage, this.readerZenBar].forEach(el => {
      if (el) el.inert = false;
    });
    if (this.readerZenBar) this.readerZenBar.inert = this.hudVisible;
    this.btnReaderSettings?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) this.btnReaderSettings?.focus();
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

    // Dynamic Re-Pagination with new font size and preserve reading progress
    if (this.currentPrayer && this.isOpen()) {
      requestAnimationFrame(() => this.repaginatePreservingPosition());
    }
  }

  applyFontSize(sizeRem) {
    document.documentElement.style.setProperty('--reader-font-size', `${sizeRem}rem`);
    const percentStr = `${Math.round((sizeRem / 1.15) * 100)}%`;
    if (this.fontSizeDisplay) {
      this.fontSizeDisplay.textContent = percentStr;
    }
    if (this.btnFontMinus) this.btnFontMinus.disabled = sizeRem <= 0.75;
    if (this.btnFontPlus) this.btnFontPlus.disabled = sizeRem >= 3.45;
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

    // Dynamic Re-Pagination with new font metrics
    if (this.currentPrayer && this.isOpen()) {
      requestAnimationFrame(() => this.repaginatePreservingPosition());
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

    // Dynamic Re-Pagination with new layout
    if (this.currentPrayer && this.isOpen()) {
      requestAnimationFrame(() => this.repaginatePreservingPosition());
    }
  }

  // --- Reader Theme Toggle (Synced with All 4 Themes) ---
  toggleReaderTheme() {
    const themes = ['cosmic', 'gold', 'parchment', 'midnight'];
    const themeNames = {
      'cosmic': '🌌 จักรวาล',
      'gold': '🌟 ทองอร่าม',
      'parchment': '📜 ใบลาน',
      'midnight': '⚫ ดำมินิมอล'
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

  // --- TTS Voice Reading & Karaoke Mechanics ---
  initTTSCallbacks() {
    ttsEngine.onHighlight = (chunkIndex, chunk) => this.handleTTSHighlight(chunkIndex, chunk);
    ttsEngine.onStateChange = (state) => this.handleTTSState(state);
    ttsEngine.onFinish = () => this.handleTTSFinish();
  }

  // --- Recitation Focus & Manual / TTS Voice Reading ---
  setVerseFocus(el, startSpeech = false) {
    if (!el || !this.comicTrack) return;

    // Remove active highlight & focus classes and any existing focus action pills
    const actives = this.comicTrack.querySelectorAll('.verse-reading-active, .verse-focused');
    actives.forEach(item => {
      item.classList.remove('verse-reading-active', 'verse-focused');
      const oldPill = item.querySelector('.verse-focus-pill');
      if (oldPill) oldPill.remove();
    });

    // Add focus classes to target element
    el.classList.add('verse-reading-active', 'verse-focused');
    this.focusedElement = el;

    // Find corresponding chunk index in ttsEngine.queue
    if (this.currentPrayer) {
      if (ttsEngine.queue.length === 0) {
        ttsEngine.prepareQueue(this.currentPrayer, this.logicalPages || this.bookPages);
      }
      
      let targetIdx = -1;
      if (el.dataset.chunkIndex !== undefined && el.dataset.chunkIndex !== '') {
        targetIdx = parseInt(el.dataset.chunkIndex, 10);
      } else if (el.dataset.chunkId) {
        targetIdx = ttsEngine.queue.findIndex(c => c.id === el.dataset.chunkId);
      }

      if (targetIdx < 0 || isNaN(targetIdx)) {
        const bIdx = parseInt(el.dataset.bookPageIndex, 10);
        const pageIndex = parseInt(el.dataset.pageIndex, 10);
        const type = el.dataset.type;
        const text = (el.dataset.text || el.textContent || '').trim();

        // Scope to current book page first (prevents matching refrains on other pages)
        if (!isNaN(bIdx)) {
          targetIdx = ttsEngine.queue.findIndex(c => 
            c.bookPageIndex === bIdx && c.type === type && (c.rawText.trim() === text || c.text.includes(text))
          );
        }
        if (targetIdx < 0) {
          targetIdx = ttsEngine.queue.findIndex(c => 
            c.pageIndex === pageIndex && c.type === type && (c.rawText.trim() === text || c.text.includes(text))
          );
        }
        if (targetIdx < 0 && !isNaN(bIdx)) {
          targetIdx = ttsEngine.queue.findIndex(c => c.bookPageIndex === bIdx && c.type === type);
        }
        if (targetIdx < 0) {
          targetIdx = ttsEngine.queue.findIndex(c => c.pageIndex === pageIndex && c.type === type);
        }
      }

      if (targetIdx >= 0 && targetIdx < ttsEngine.queue.length) {
        this.focusedChunkIndex = targetIdx;
        ttsEngine.currentIndex = targetIdx;
      }
    }

    if (startSpeech) {
      this.playFromElement(el);
      return;
    }

    // When TTS is NOT playing: add a compact play chip centered beneath the verse.
    // Only the chip itself starts reading; the rest of its row swallows taps so a near-miss does nothing.
    if (!ttsEngine.isPlaying && !ttsEngine.isPaused) {
      const pill = document.createElement('div');
      pill.className = 'verse-focus-pill';
      pill.innerHTML = '<span class="pill-play-action" role="button" tabindex="0">▶ สวดตรงนี้</span>';
      pill.title = 'แตะปุ่มเพื่อเริ่มสวดนำตรงนี้';
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.target.closest('.pill-play-action') || this.isVerseTapBlocked()) return;
        this.playFromElement(el);
      });
      el.appendChild(pill);
    }
  }

  // Stop reading but keep the line it stopped on focused, with its play chip, so one tap resumes from there
  stopTTS() {
    const stoppedOn = this.focusedElement;
    ttsEngine.stop();
    if (stoppedOn?.isConnected) this.setVerseFocus(stoppedOn, false);
  }

  clearVerseFocus() {
    this.comicTrack?.querySelectorAll('.verse-reading-active, .verse-focused').forEach(item => {
      item.classList.remove('verse-reading-active', 'verse-focused');
      item.querySelector('.verse-focus-pill')?.remove();
    });
    this.focusedElement = null;
    this.focusedChunkIndex = null;
  }

  // Page-turn gestures block verse taps briefly, so the click that follows a flip can't focus or start reading
  blockVerseTaps(ms = 400) {
    this.verseTapBlockedUntil = Date.now() + ms;
  }

  isVerseTapBlocked() {
    return Date.now() < (this.verseTapBlockedUntil || 0);
  }

  // Outer 12% of the screen are page-turn zones, even when the tap lands on verse text or its play chip
  edgeTapDirection(clientX) {
    const screenWidth = window.innerWidth || 360;
    if (clientX > screenWidth * 0.88) return 'next';
    if (clientX < screenWidth * 0.12) return 'prev';
    return null;
  }

  handleVerseClick(el) {
    if (!el || !this.currentPrayer || this.isVerseTapBlocked()) return;

    // If HUD was showing, hide it so the user can recite freely
    if (this.hudVisible) {
      this.hideHUD();
    }
    this.hideGestureHint();

    // If TTS is already playing on THIS exact element, tap stops it immediately!
    if (ttsEngine.isPlaying && el === this.focusedElement) {
      this.stopTTS();
      return;
    }

    const isAlreadyFocused = el.classList.contains('verse-reading-active') || el.classList.contains('verse-focused');

    if (ttsEngine.isPlaying || ttsEngine.isPaused) {
      // If TTS is running on another element, seek to this element immediately
      this.playFromElement(el);
    } else if (isAlreadyFocused) {
      // Second tap on the focused verse clears the focus; reading only starts from the play chip
      this.clearVerseFocus();
    } else {
      // First tap -> set visual recitation focus & prepare TTS start point
      this.setVerseFocus(el, false);
      nativeBridge.hapticSuccess?.();
    }
  }

  toggleTTS() {
    if (!this.currentPrayer) return;
    if (ttsEngine.queue.length === 0) {
      ttsEngine.prepareQueue(this.currentPrayer);
    }
    
    // If playing OR paused, tap immediately STOPS speech completely!
    if (ttsEngine.isPlaying || ttsEngine.isPaused) {
      this.stopTTS();
    } else {
      // Start from the currently focused verse if set, otherwise first visible chunk in viewport
      let startIdx = (typeof this.focusedChunkIndex === 'number' && this.focusedChunkIndex >= 0)
        ? this.focusedChunkIndex
        : this.findFirstVisibleChunkIndex();
      ttsEngine.play(startIdx >= 0 ? startIdx : 0);
    }
  }

  playFromElement(el) {
    if (!el || !this.currentPrayer) return;

    if (ttsEngine.queue.length === 0) {
      ttsEngine.prepareQueue(this.currentPrayer, this.logicalPages || this.bookPages);
    }

    let targetIdx = -1;
    if (el.dataset.chunkIndex !== undefined && el.dataset.chunkIndex !== '') {
      targetIdx = parseInt(el.dataset.chunkIndex, 10);
    } else if (el.dataset.chunkId) {
      targetIdx = ttsEngine.queue.findIndex(c => c.id === el.dataset.chunkId);
    }

    if (targetIdx < 0 || isNaN(targetIdx)) {
      const bIdx = parseInt(el.dataset.bookPageIndex, 10);
      const pageIndex = parseInt(el.dataset.pageIndex, 10);
      const type = el.dataset.type;
      const text = (el.dataset.text || el.textContent || '').trim();

      // 1. Scoped to current book page first (prevents jumping back to previous pages with identical refrains!)
      if (!isNaN(bIdx)) {
        targetIdx = ttsEngine.queue.findIndex(c => 
          c.bookPageIndex === bIdx && c.type === type && (c.rawText.trim() === text || c.text.includes(text))
        );
      }
      // 2. Fallback to matching raw pageIndex & type & text
      if (targetIdx < 0) {
        targetIdx = ttsEngine.queue.findIndex(c => 
          c.pageIndex === pageIndex && c.type === type && (c.rawText.trim() === text || c.text.includes(text))
        );
      }
      // 3. Fallback to matching book page & type
      if (targetIdx < 0 && !isNaN(bIdx)) {
        targetIdx = ttsEngine.queue.findIndex(c => c.bookPageIndex === bIdx && c.type === type);
      }
      // 4. Fallback to first chunk of this book page
      if (targetIdx < 0 && !isNaN(bIdx)) {
        targetIdx = ttsEngine.queue.findIndex(c => c.bookPageIndex === bIdx);
      }
    }

    if (targetIdx >= 0 && targetIdx < ttsEngine.queue.length) {
      this.focusedChunkIndex = targetIdx;
      this.focusedElement = el;
      ttsEngine.play(targetIdx);
      this.scheduleAutoHide(5000);
      nativeBridge.hapticSuccess?.();
    }
  }

  findFirstVisibleChunkIndex() {
    if (!this.comicTrack || ttsEngine.queue.length === 0) return 0;
    
    // 1. First find chunk matching currentPageIndex (book page)
    const pageChunkIdx = ttsEngine.queue.findIndex(c => c.bookPageIndex === this.currentPageIndex);
    if (pageChunkIdx >= 0) return pageChunkIdx;

    // 2. Active DOM page check
    const activePage = this.comicTrack.querySelector(`.comic-page[data-page-index="${this.currentPageIndex}"]`);
    if (activePage) {
      const firstClickable = activePage.querySelector('.verse-clickable[data-chunk-index]');
      if (firstClickable && firstClickable.dataset.chunkIndex !== undefined && firstClickable.dataset.chunkIndex !== '') {
        const idx = parseInt(firstClickable.dataset.chunkIndex, 10);
        if (!isNaN(idx) && idx >= 0 && idx < ttsEngine.queue.length) return idx;
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
    if (!this.comicTrack) return;

    // Remove active highlight from all elements
    const actives = this.comicTrack.querySelectorAll('.verse-reading-active, .verse-focused');
    actives.forEach(el => {
      el.classList.remove('verse-reading-active', 'verse-focused');
      const oldPill = el.querySelector('.verse-focus-pill');
      if (oldPill) oldPill.remove();
    });

    if (!chunk || chunkIndex < 0) return;
    this.focusedChunkIndex = chunkIndex;

    // 1. Find exact matching DOM node by unique chunkId or chunkIndex
    let target = null;
    if (chunk.id) {
      target = this.comicTrack.querySelector(`[data-chunk-id="${chunk.id}"]`);
      if (!target) {
        target = this.comicTrack.querySelector(`[data-chunk-ids~="${chunk.id}"]`)
          || this.comicTrack.querySelector(`[data-chunk-ids*="${chunk.id}"]`);
      }
    }
    if (!target && typeof chunkIndex === 'number') {
      target = this.comicTrack.querySelector(`[data-chunk-index="${chunkIndex}"]`);
    }

    // 2. Scoped fallback: look inside the specific book page first!
    if (!target && chunk.bookPageIndex !== undefined) {
      const pageEl = this.comicTrack.querySelector(`.comic-page[data-page-index="${chunk.bookPageIndex}"]`);
      if (pageEl) {
        const candidates = pageEl.querySelectorAll(`[data-type="${chunk.type}"]`);
        for (const el of candidates) {
          if (el.dataset.text && (el.dataset.text.trim() === chunk.rawText?.trim() || chunk.rawText?.includes(el.dataset.text.trim()))) {
            target = el;
            break;
          }
        }
        if (!target && candidates.length > 0) {
          target = candidates[0];
        }
      }
    }

    // 3. Global fallback
    if (!target) {
      const candidates = this.comicTrack.querySelectorAll(`[data-page-index="${chunk.pageIndex}"][data-type="${chunk.type}"]`);
      for (const el of candidates) {
        if (el.dataset.text && el.dataset.text.trim() === chunk.rawText?.trim()) {
          target = el;
          break;
        }
      }
      if (!target && candidates.length > 0) {
        target = candidates[0];
      }
    }

    if (target) {
      target.classList.add('verse-reading-active', 'verse-focused');
      this.focusedElement = target;
      // A long line may be split across two pages: highlight its continuation too
      if (target.dataset.chunkIds) {
        this.comicTrack.querySelectorAll(`[data-chunk-ids="${target.dataset.chunkIds}"]`).forEach((part) => {
          if (part !== target) part.classList.add('verse-reading-active');
        });
      }

      // Auto-flip book page if target element is located on another book page!
      const targetPageEl = target.closest('.comic-page');
      if (targetPageEl && targetPageEl.dataset.pageIndex !== undefined) {
        const targetPageIndex = parseInt(targetPageEl.dataset.pageIndex, 10);
        if (targetPageIndex !== this.currentPageIndex && targetPageIndex >= 0 && targetPageIndex < this.totalPages) {
          this.goToPage(targetPageIndex, true);
        }
      }
    } else if (chunk.bookPageIndex !== undefined && chunk.bookPageIndex !== this.currentPageIndex) {
      // If no target DOM element found, advance page if chunk belongs to another page
      if (chunk.bookPageIndex >= 0 && chunk.bookPageIndex < this.totalPages) {
        this.goToPage(chunk.bookPageIndex, true);
      }
    }
  }

  handleTTSState(state) {
    if (!this.btnTTSPlay) return;

    if (state === 'playing') {
      this.btnTTSPlay.classList.add('playing');
      this.readerView?.classList.add('tts-active');
      if (this.ttsPlayIcon) this.ttsPlayIcon.textContent = '⏹️';
      if (this.ttsPlayText) this.ttsPlayText.textContent = 'หยุดเสียงอ่าน';
      this.btnTTSPlay.title = 'แตะเพื่อหยุดเสียงสวดนำ (AI)';
      nativeBridge.setKeepAwake(true);
    } else {
      this.btnTTSPlay.classList.remove('playing');
      this.readerView?.classList.remove('tts-active');
      if (this.ttsPlayIcon) this.ttsPlayIcon.textContent = '🔊';
      if (this.ttsPlayText) this.ttsPlayText.textContent = 'ฟังคำอ่าน';
      this.btnTTSPlay.title = 'แตะเพื่อเริ่มเสียงสวดนำ (AI)';
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
        this.btnMP3MainPlay.textContent = state.isPlaying ? '⏸️ พัก' : '▶️ เล่น';
        this.btnMP3MainPlay.setAttribute('aria-label', state.isPlaying ? 'พักเสียงพระสวด' : 'เล่นเสียงพระสวด');
      }
      this.btnMP3Loop?.setAttribute('aria-pressed', String(state.isLooping));
      if (this.mp3SpeedSelect) this.mp3SpeedSelect.value = String(state.playbackRate === 1 ? '1.0' : state.playbackRate);
      if (this.btnMP3Play) {
        this.btnMP3Play.classList.toggle('playing', state.isPlaying);
      }
      if (state.currentTrack) {
        if (this.mp3TrackTitle) this.mp3TrackTitle.textContent = state.currentTrack.title;
        if (this.mp3TrackTemple) this.mp3TrackTemple.textContent = state.currentTrack.temple;
        if (this.mp3TrackSelect) this.mp3TrackSelect.value = state.currentTrack.id;
        if (this.mp3CurrentTime) this.mp3CurrentTime.textContent = mp3Player.formatTime(mp3Player.audioElement?.currentTime || 0);
        if (this.mp3Duration) this.mp3Duration.textContent = mp3Player.audioElement?.duration > 0 ? mp3Player.formatTime(mp3Player.audioElement.duration) : '--:--';
        if (this.mp3ProgressBar) this.mp3ProgressBar.value = mp3Player.audioElement?.duration > 0 ? (mp3Player.audioElement.currentTime / mp3Player.audioElement.duration) * 100 : 0;
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
      this.showHUD();
      this.mp3PlayerDeck.style.display = 'flex';
      this.readerBottomBar?.classList.add('mp3-deck-open');
      this.btnMP3Play?.setAttribute('aria-expanded', 'true');
      this.hideTTSSettings();
      this.btnMP3MainPlay?.focus();
      this.scheduleAutoHide(15000);
    }
  }

  hideMP3Deck() {
    if (this.mp3PlayerDeck) {
      const restoreFocus = this.mp3PlayerDeck.contains(document.activeElement);
      this.mp3PlayerDeck.style.display = 'none';
      this.readerBottomBar?.classList.remove('mp3-deck-open');
      this.btnMP3Play?.setAttribute('aria-expanded', 'false');
      const options = document.getElementById('mp3Options');
      if (options) options.open = false;
      if (restoreFocus && this.hudVisible) this.btnMP3Play?.focus();
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
    if (hasRoundInstruction(this.currentPrayer.title)) return true;
    const pages = this.currentPrayer.pages || [];
    return pages.some(isRoundCountingPage);
  }

  isItipisoPage(index) {
    if (!this.currentPrayer) return false;
    const rawPages = this.currentPrayer.pages;
    if (rawPages && rawPages[index]) {
      return isRoundCountingPage(rawPages[index]);
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
    }
  }

  updateItipisoDisplay() {
    const key = this.getPrayerKey();
    const current = storage.getItipisoRound(key);
    const target = storage.getItipisoTarget();
    const settings = storage.getSettings();
    const age = parseInt(settings.userAge, 10) || 40;
    const isCustom = target !== age + 1;

    if (this.itipisoCurrent) this.itipisoCurrent.textContent = current;
    // Don't overwrite a field while the user is typing in it
    if (this.itipisoTarget && document.activeElement !== this.itipisoTarget) this.itipisoTarget.value = target;
    if (this.itipisoUserAgeInput && document.activeElement !== this.itipisoUserAgeInput) this.itipisoUserAgeInput.value = age;
    if (this.itipisoAgeHint) {
      this.itipisoAgeHint.textContent = isCustom ? `→ ตั้งเอง ${target} จบ (แก้อายุเพื่อใช้ อายุ + ๑)` : '→ สวดเท่าอายุ + ๑';
    }
    this.itipisoUserAgeInput?.closest('.itipiso-age-row')?.classList.toggle('is-custom', isCustom);

    if (this.itipisoProgressBar) {
      const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
      this.itipisoProgressBar.style.width = `${pct}%`;
    }
  }

  // Typed a round count directly (e.g. 9, 108); matching age + 1 falls back to age mode
  saveItipisoTargetInput() {
    const target = parseInt(this.itipisoTarget?.value, 10);
    if (!(target >= 1 && target <= 999)) return;
    const age = parseInt(storage.getSettings().userAge, 10) || 40;
    storage.saveSettings({ itipisoCustomTarget: target === age + 1 ? 0 : target });
    this.updateItipisoDisplay();
  }

  // Typed an age: target becomes age + 1 (clears any custom round count)
  saveItipisoAgeInput() {
    const age = parseInt(this.itipisoUserAgeInput?.value, 10);
    if (!(age >= 1 && age <= 150)) return;
    storage.saveSettings({ userAge: age, itipisoCustomTarget: 0 });
    this.updateItipisoDisplay();
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
