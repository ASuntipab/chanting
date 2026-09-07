import test from 'node:test';
import assert from 'node:assert/strict';
import { storage } from '../src/js/storage.js';
import fs from 'node:fs';
import path from 'node:path';

test('Itipiso Tally Counter Suite: Age + 1 Calculation, Tally Counts & Reset Lifecycle', async (t) => {

  await t.test('Calculation: userAge = 40 calculates target = 41 chants (อายุ + ๑)', () => {
    storage.saveSettings({ userAge: 40, itipisoCustomTarget: 0 });
    const target = storage.getItipisoTarget();
    assert.strictEqual(target, 41, 'Age 40 should result in 41 chants (40 + 1)');
  });

  await t.test('Calculation: userAge = 59 calculates target = 60 chants', () => {
    storage.saveSettings({ userAge: 59, itipisoCustomTarget: 0 });
    const target = storage.getItipisoTarget();
    assert.strictEqual(target, 60, 'Age 59 should result in 60 chants');
  });

  await t.test('Calculation: Custom target (e.g. 108 or 9) overrides age formula when set', () => {
    storage.saveSettings({ userAge: 40, itipisoCustomTarget: 108 });
    assert.strictEqual(storage.getItipisoTarget(), 108, 'Custom target 108 should be respected');

    storage.saveSettings({ userAge: 40, itipisoCustomTarget: 9 });
    assert.strictEqual(storage.getItipisoTarget(), 9, 'Custom target 9 should be respected');

    // Reset back to age formula
    storage.saveSettings({ userAge: 40, itipisoCustomTarget: 0 });
    assert.strictEqual(storage.getItipisoTarget(), 41);
  });

  await t.test('Tally Counting: increments sequentially and detects completion at target', () => {
    const prayerId = 'test-itipiso-prayer';
    storage.saveSettings({ userAge: 2, itipisoCustomTarget: 3 }); // target 3 for quick test
    storage.resetItipisoRound(prayerId);
    assert.strictEqual(storage.getItipisoRound(prayerId), 0);

    // Chant 1
    const r1 = storage.incrementItipisoRound(prayerId);
    assert.strictEqual(r1.current, 1);
    assert.strictEqual(r1.completed, false);

    // Chant 2
    const r2 = storage.incrementItipisoRound(prayerId);
    assert.strictEqual(r2.current, 2);
    assert.strictEqual(r2.completed, false);

    // Chant 3 (Completed!)
    const r3 = storage.incrementItipisoRound(prayerId);
    assert.strictEqual(r3.current, 3);
    assert.strictEqual(r3.completed, true, 'Round 3 should trigger completion on target 3');
  });

  await t.test('Decrement (-1): decreases count and never goes below 0', () => {
    const prayerId = 'test-decrement-prayer';
    storage.setItipisoRound(prayerId, 2);

    const d1 = storage.decrementItipisoRound(prayerId);
    assert.strictEqual(d1.current, 1);

    const d2 = storage.decrementItipisoRound(prayerId);
    assert.strictEqual(d2.current, 0);

    // Attempt below 0
    const d3 = storage.decrementItipisoRound(prayerId);
    assert.strictEqual(d3.current, 0, 'Count should not go below 0');
  });

  await t.test('Clear / Reset (↺): immediately resets count to 0 for next session', () => {
    const prayerId = 'test-reset-prayer';
    storage.setItipisoRound(prayerId, 35);
    assert.strictEqual(storage.getItipisoRound(prayerId), 35);

    const cleared = storage.resetItipisoRound(prayerId);
    assert.strictEqual(cleared, 0, 'resetItipisoRound should return 0');
    assert.strictEqual(storage.getItipisoRound(prayerId), 0, 'storage must reflect 0 after reset');
  });

  await t.test('HTML & CSS Live Verification: Itipiso widget, buttons and modals exist in code', () => {
    const rootDir = process.cwd();
    const html = fs.readFileSync(path.join(rootDir, 'tamma.html'), 'utf8');
    const css = fs.readFileSync(path.join(rootDir, 'src', 'css', 'reader.css'), 'utf8');
    const js = fs.readFileSync(path.join(rootDir, 'src', 'js', 'reader.js'), 'utf8');

    // HTML elements
    assert.ok(html.includes('id="itipisoCounterWidget"'), 'itipisoCounterWidget must exist in tamma.html');
    assert.ok(html.includes('id="btnItipisoCount"'), 'btnItipisoCount must exist');
    assert.ok(html.includes('id="btnItipisoReset"'), 'btnItipisoReset must exist');
    assert.ok(html.includes('id="btnItipisoMinus"'), 'btnItipisoMinus must exist');
    assert.ok(html.includes('id="itipisoAgeModal"'), 'itipisoAgeModal must exist');
    assert.ok(html.includes('id="itipisoCompleteModal"'), 'itipisoCompleteModal must exist');

    // CSS rules
    assert.ok(css.includes('.itipiso-counter-widget'), '.itipiso-counter-widget must be styled in reader.css');
    assert.ok(css.includes('.btn-itipiso-main'), '.btn-itipiso-main must be styled');
    assert.ok(css.includes('.btn-itipiso-reset'), '.btn-itipiso-reset must be styled');
    assert.ok(css.includes('.itipiso-modal-overlay'), '.itipiso-modal-overlay must be styled');

    // JS Engine logic
    assert.ok(js.includes('isItipisoPage('), 'isItipisoPage method must exist');
    assert.ok(js.includes('checkItipisoPage()'), 'checkItipisoPage method must exist');
    assert.ok(js.includes('handleItipisoCount()'), 'handleItipisoCount method must exist');
    assert.ok(js.includes('handleItipisoReset()'), 'handleItipisoReset method must exist');
  });
});
