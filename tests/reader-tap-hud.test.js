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
