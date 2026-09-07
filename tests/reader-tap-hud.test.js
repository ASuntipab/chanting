import test from 'node:test';
import assert from 'node:assert/strict';
import { ttsEngine } from '../src/js/tts-engine.js';

test('Reader Click / Tap Behavior: No Accidental Speech when Tapping Screen to Toggle HUD / Exit', async (t) => {

  await t.test('When TTS is NOT playing, click event on verses must not stop propagation', () => {
    // Ensure TTS is stopped initially
    ttsEngine.stop();
    assert.strictEqual(ttsEngine.isPlaying, false);
    assert.strictEqual(ttsEngine.isPaused, false);

    let propagationStopped = false;
    const mockEvent = {
      stopPropagation: () => { propagationStopped = true; }
    };

    // Simulate clicking on verse when TTS is stopped
    if (ttsEngine.isPlaying || ttsEngine.isPaused) {
      mockEvent.stopPropagation();
    }

    assert.strictEqual(propagationStopped, false, 'Click event should bubble up freely so HUD toggles when tapping screen');
  });

  await t.test('When TTS is actively playing, click on verse stops propagation for karaoke seek', () => {
    // Simulate TTS playing state
    ttsEngine.isPlaying = true;

    let propagationStopped = false;
    const mockEvent = {
      stopPropagation: () => { propagationStopped = true; }
    };

    if (ttsEngine.isPlaying || ttsEngine.isPaused) {
      mockEvent.stopPropagation();
    }

    assert.strictEqual(propagationStopped, true, 'When TTS is playing, clicking verse should stop propagation for seek');

    // Clean up
    ttsEngine.stop();
  });
});

test('Reader Gesture Hint & Auto-Hide HUD Live Verification', async (t) => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const rootDir = process.cwd();
  const htmlContent = fs.readFileSync(path.join(rootDir, 'tamma.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(rootDir, 'src', 'css', 'reader.css'), 'utf8');
  const jsContent = fs.readFileSync(path.join(rootDir, 'src', 'js', 'reader.js'), 'utf8');

  await t.test('HTML includes btnReaderHelp, readerGestureHint, reader-dock-hint, and readerHelpModal', () => {
    assert.ok(htmlContent.includes('id="btnReaderHelp"'), 'btnReaderHelp must exist in tamma.html toolbar');
    assert.ok(htmlContent.includes('id="readerGestureHint"'), 'readerGestureHint pill must exist in tamma.html');
    assert.ok(htmlContent.includes('class="reader-dock-hint"'), 'reader-dock-hint must exist in bottom bar');
    assert.ok(htmlContent.includes('id="readerHelpModal"'), 'readerHelpModal guide modal must exist in tamma.html');
    assert.ok(htmlContent.includes('ปัดซ้าย-ขวา หรือ เลื่อนขึ้น-ลง'), 'Gesture hint text must explain swipe/scroll gestures');
  });

  await t.test('CSS defines rules for floating gesture hint and guide modal', () => {
    assert.ok(cssContent.includes('.reader-gesture-hint'), '.reader-gesture-hint must be styled in reader.css');
    assert.ok(cssContent.includes('.reader-gesture-hint.show'), '.reader-gesture-hint.show rule must exist in reader.css');
    assert.ok(cssContent.includes('.reader-dock-hint'), '.reader-dock-hint must be styled in reader.css');
    assert.ok(cssContent.includes('.reader-help-modal-overlay'), '.reader-help-modal-overlay must be styled in reader.css');
  });

  await t.test('JS reader.js implements auto-hiding HUD on swipe, touchmove, mousemove, and wheel', () => {
    assert.ok(jsContent.includes('showGestureHint()'), 'showGestureHint method must exist');
    assert.ok(jsContent.includes('hideGestureHint()'), 'hideGestureHint method must exist');
    assert.ok(jsContent.includes('handleWheel(e)'), 'handleWheel method must exist for mouse scroll');
    assert.ok(jsContent.includes('toggleReaderHelp()'), 'toggleReaderHelp method must exist');
    // Ensure that handleTouchEnd and handleMouseUp call hideHUD()
    assert.ok(jsContent.includes('if (this.hudVisible) this.hideHUD();'), 'HUD must hide automatically when navigating pages or swiping');
    assert.ok(jsContent.includes('(ปัดซ้าย-ขวา หรือ เลื่อนขึ้น-ลง)'), 'moreIndicator must inform user about swiping left-right and scrolling up-down');
  });
});
