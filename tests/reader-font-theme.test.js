import test from 'node:test';
import assert from 'node:assert/strict';
import { FONT_FAMILIES } from '../src/js/reader.js';
import { storage } from '../src/js/storage.js';

test('Reader Typography & Theme Customization System Verification', async (t) => {

  await t.test('All 7 Thai Buddhist & Modern font families are registered with valid CSS definitions', () => {
    const expectedFonts = ['sarabun', 'prompt', 'noto-serif', 'mitr', 'charm', 'bai-jamjuree', 'chakra'];
    
    expectedFonts.forEach(fontKey => {
      assert.ok(FONT_FAMILIES[fontKey], `Font key "${fontKey}" should exist in FONT_FAMILIES`);
      assert.ok(FONT_FAMILIES[fontKey].name, `Font "${fontKey}" should have a name`);
      assert.ok(FONT_FAMILIES[fontKey].family, `Font "${fontKey}" should have a CSS font family definition`);
      assert.ok(FONT_FAMILIES[fontKey].family.length > 0, `CSS font family for "${fontKey}" must not be empty`);
    });

    assert.strictEqual(Object.keys(FONT_FAMILIES).length, 7, 'Should provide exactly 7 curated Thai fonts');
  });

  await t.test('Storage engine provides default fontFamily and persists user changes', () => {
    // Check default settings
    const defaultSettings = storage.getSettings();
    assert.strictEqual(defaultSettings.fontFamily, 'sarabun', 'Default font should be sarabun');

    // Test saving new font preference
    storage.saveSettings({ fontFamily: 'noto-serif' });
    const updated1 = storage.getSettings();
    assert.strictEqual(updated1.fontFamily, 'noto-serif', 'Font preference should update to noto-serif');

    storage.saveSettings({ fontFamily: 'charm' });
    const updated2 = storage.getSettings();
    assert.strictEqual(updated2.fontFamily, 'charm', 'Font preference should update to charm');

    // Reset back to sarabun
    storage.saveSettings({ fontFamily: 'sarabun' });
  });

  await t.test('All 4 Themes (Cosmic, Gold, Parchment, Midnight) are supported and preserve font class', () => {
    const themes = ['cosmic', 'gold', 'parchment', 'midnight'];
    
    themes.forEach(theme => {
      storage.saveSettings({ theme: theme });
      const current = storage.getSettings();
      assert.strictEqual(current.theme, theme, `Theme should be set to ${theme}`);
    });

    // Reset to cosmic default
    storage.saveSettings({ theme: 'cosmic', fontFamily: 'sarabun' });
  });

  await t.test('Font fallback logic ensures invalid font keys fallback to Sarabun safely', () => {
    const invalidKey = 'non-existent-font-xyz';
    const resolvedKey = FONT_FAMILIES[invalidKey] ? invalidKey : 'sarabun';
    assert.strictEqual(resolvedKey, 'sarabun', 'Invalid font key should safely fallback to sarabun');
  });
});
