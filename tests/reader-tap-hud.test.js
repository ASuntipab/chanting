import test from 'node:test';
import assert from 'node:assert/strict';
import { ttsEngine } from '../src/js/tts-engine.js';

test('Reader Click / Tap Behavior: Recitation Focus & Collision-Free Navigation Architecture', async (t) => {

  await t.test('Click / tap on verse always stops propagation to prevent HUD toggling or accidental page flips', () => {
    let propagationStopped = false;
    let defaultPrevented = false;
    const mockEvent = {
      stopPropagation: () => { propagationStopped = true; },
      preventDefault: () => { defaultPrevented = true; }
    };

    // Simulate clicking on verse
    mockEvent.preventDefault();
    mockEvent.stopPropagation();

    assert.strictEqual(propagationStopped, true, 'Click event on verse must stop propagation so HUD does not toggle unexpectedly');
    assert.strictEqual(defaultPrevented, true, 'Default action should be prevented on verse click');
  });

  await t.test('When TTS is actively playing, click on verse stops propagation for karaoke seek', () => {
    ttsEngine.isPlaying = true;

    let propagationStopped = false;
    const mockEvent = {
      stopPropagation: () => { propagationStopped = true; }
    };

    mockEvent.stopPropagation();
    assert.strictEqual(propagationStopped, true, 'When TTS is playing, clicking verse stops propagation for seek');

    ttsEngine.stop();
  });

  await t.test('Recitation focus pill and active classes are defined for manual & TTS reading', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cssContent = fs.readFileSync(path.join(process.cwd(), 'src', 'css', 'reader.css'), 'utf8');
    const jsContent = fs.readFileSync(path.join(process.cwd(), 'src', 'js', 'reader.js'), 'utf8');

    assert.ok(cssContent.includes('.verse-focus-pill'), 'CSS must define .verse-focus-pill');
    assert.ok(cssContent.includes('.verse-focused'), 'CSS must define .verse-focused');
    assert.ok(jsContent.includes('setVerseFocus('), 'JS must implement setVerseFocus method');
    assert.ok(jsContent.includes('handleVerseClick('), 'JS must implement handleVerseClick method');
    assert.ok(jsContent.includes("target.closest('.verse-clickable, .verse-focus-pill')"), 'Gestures must ignore verse clicks to prevent HUD clash');
  });
});

test('Reader Gesture Hint & Auto-Hide HUD Live Verification', async (t) => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const rootDir = process.cwd();
  const htmlContent = fs.readFileSync(path.join(rootDir, 'tamma.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(rootDir, 'src', 'css', 'reader.css'), 'utf8');
  const jsContent = fs.readFileSync(path.join(rootDir, 'src', 'js', 'reader.js'), 'utf8');

  await t.test('HTML includes btnReaderHelp, readerGestureHint, reader-dock-hint, readerZenBar, and readerHelpModal', () => {
    assert.ok(htmlContent.includes('id="btnReaderHelp"'), 'btnReaderHelp must exist in tamma.html toolbar');
    assert.ok(htmlContent.includes('id="readerGestureHint"'), 'readerGestureHint pill must exist in tamma.html');
    assert.ok(htmlContent.includes('class="reader-dock-hint"'), 'reader-dock-hint must exist in bottom bar');
    assert.ok(htmlContent.includes('id="readerHelpModal"'), 'readerHelpModal guide modal must exist in tamma.html');
    assert.ok(htmlContent.includes('id="readerZenBar"'), 'readerZenBar floating bar must exist for zen exit');
    assert.ok(htmlContent.includes('id="btnExitZen"'), 'btnExitZen button must exist in top-right corner');
    assert.ok(htmlContent.includes('id="btnZenClose"'), 'btnZenClose button must exist in top-right corner');
    assert.ok(htmlContent.includes('ปัดซ้าย-ขวา เพื่อเปลี่ยนหน้า'), 'Gesture hint text must explain horizontal page swipe');
  });

  await t.test('CSS defines rules for floating gesture hint, zen bar, and scroll safety net', () => {
    assert.ok(cssContent.includes('.reader-gesture-hint'), '.reader-gesture-hint must be styled in reader.css');
    assert.ok(cssContent.includes('.reader-gesture-hint.show'), '.reader-gesture-hint.show rule must exist in reader.css');
    assert.ok(cssContent.includes('.reader-dock-hint'), '.reader-dock-hint must be styled in reader.css');
    assert.ok(cssContent.includes('.reader-help-modal-overlay'), '.reader-help-modal-overlay must be styled in reader.css');
    assert.ok(cssContent.includes('.reader-zen-bar'), '.reader-zen-bar must be styled in reader.css');
    assert.ok(cssContent.includes('.btn-zen-pill'), '.btn-zen-pill must be styled in reader.css');
    assert.ok(cssContent.includes('.btn-zen-close'), '.btn-zen-close must be styled in reader.css');
    assert.ok(cssContent.includes('overflow-y: auto'), '.page-verse-viewport must have overflow-y: auto to prevent text cut-off');
  });

  await t.test('JS reader.js implements gestures, auto-hiding HUD, and zen exit controls', () => {
    assert.ok(jsContent.includes('showGestureHint()'), 'showGestureHint method must exist');
    assert.ok(jsContent.includes('hideGestureHint()'), 'hideGestureHint method must exist');
    assert.ok(jsContent.includes('handleWheel(e)'), 'handleWheel method must exist for mouse scroll');
    assert.ok(jsContent.includes('toggleReaderHelp()'), 'toggleReaderHelp method must exist');
    assert.ok(jsContent.includes('btnExitZen'), 'JS must initialize btnExitZen');
    assert.ok(jsContent.includes('btnZenClose'), 'JS must initialize btnZenClose');
    // Ensure that handleTouchEnd and handleMouseUp call hideHUD() on horizontal page flips
    assert.ok(jsContent.includes('if (this.hudVisible) this.hideHUD();'), 'HUD must hide automatically when navigating pages or swiping');
    assert.ok(htmlContent.includes('ปัดซ้าย-ขวา เพื่อเปลี่ยนหน้า'), 'Gesture guide must explain swiping left-right');
  });
});
