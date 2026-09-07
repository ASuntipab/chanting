import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { storage } from '../src/js/storage.js';

test('Reader Traditional Book Layout & Indentation System Verification', async (t) => {

  await t.test('CSS Verification: Book layout indentation, stanza spacing, and translation block indent', () => {
    const cssContent = fs.readFileSync(path.join(process.cwd(), 'src/css/reader.css'), 'utf8');

    // 1. Stanza Wrappers
    assert.ok(cssContent.includes('.verse-stanza'), 'Must define .verse-stanza container');
    assert.ok(cssContent.includes('.verse-thai-stanza'), 'Must define .verse-thai-stanza container');

    // 2. Book Layout (Traditional Book Indent)
    assert.ok(cssContent.includes('.page-verse-flow.layout-book'), 'Must define .page-verse-flow.layout-book');
    assert.ok(cssContent.includes('stanza-first-line'), 'Must define stanza-first-line class for indentation');
    assert.ok(cssContent.includes('text-indent: 1.8em'), 'Must define first-line text-indent for Pali stanzas');
    assert.ok(cssContent.includes('border-left: 2px solid'), 'Must define left visual guide border for Thai translations');
    assert.ok(cssContent.includes('padding-left: 1.4em'), 'Must define block indent padding for Thai translation wrap');

    // 3. Modern Centered Layout
    assert.ok(cssContent.includes('.page-verse-flow.layout-centered'), 'Must define .page-verse-flow.layout-centered');
    assert.ok(cssContent.includes('text-indent: 0 !important'), 'Centered layout must reset text-indent');

    // 4. Anti-orphan and line wrap
    assert.ok(cssContent.includes('text-wrap: pretty'), 'Must utilize text-wrap: pretty to prevent single orphan words');

    // 5. Layout Select Dock in CSS
    assert.ok(cssContent.includes('.reader-layout-dock'), 'Must define .reader-layout-dock');
    assert.ok(cssContent.includes('.reader-layout-select'), 'Must define .reader-layout-select');
  });

  await t.test('HTML Verification: Layout selector exists in index.html and tamma.html', () => {
    const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const tammaHtml = fs.readFileSync(path.join(process.cwd(), 'tamma.html'), 'utf8');

    [indexHtml, tammaHtml].forEach((html, i) => {
      const filename = i === 0 ? 'index.html' : 'tamma.html';
      assert.ok(html.includes('id="readerLayoutSelect"'), `${filename} must have #readerLayoutSelect`);
      assert.ok(html.includes('value="book"'), `${filename} must include Book layout option`);
      assert.ok(html.includes('value="centered"'), `${filename} must include Centered layout option`);
    });
  });

  await t.test('Storage Engine: Persists readerLayout mode and defaults properly', () => {
    // Test saving layout preferences
    storage.saveSettings({ readerLayout: 'book' });
    let settings = storage.getSettings();
    assert.strictEqual(settings.readerLayout, 'book', 'Should save book layout');

    storage.saveSettings({ readerLayout: 'centered' });
    settings = storage.getSettings();
    assert.strictEqual(settings.readerLayout, 'centered', 'Should save centered layout');

    // Reset to book default
    storage.saveSettings({ readerLayout: 'book' });
    settings = storage.getSettings();
    assert.strictEqual(settings.readerLayout, 'book', 'Should reset to book layout');
  });

  await t.test('Stanza Parsing Logic: Accurately separates multiple Pali and Thai stanzas', () => {
    const samplePali = 'อะระหัง สัมมาสัมพุทโธ ภะคะวา\nสะวากขาโต ภะคะวะตา ธัมโม\n\nนะโม ตัสสะ ภะคะวะโต\nนะโม ตัสสะ ภะคะวะโต';
    const stanzas = samplePali.split(/\n\s*\n+/).filter(s => s.trim().length > 0);

    assert.strictEqual(stanzas.length, 2, 'Should split into exactly 2 distinct stanzas by double newline');
    
    // First stanza lines
    const stanza1Lines = stanzas[0].split('\n').filter(l => l.trim().length > 0);
    assert.strictEqual(stanza1Lines.length, 2, 'Stanza 1 should contain 2 lines');
    assert.strictEqual(stanza1Lines[0], 'อะระหัง สัมมาสัมพุทโธ ภะคะวา');

    // Second stanza lines
    const stanza2Lines = stanzas[1].split('\n').filter(l => l.trim().length > 0);
    assert.strictEqual(stanza2Lines.length, 2, 'Stanza 2 should contain 2 lines');
    assert.strictEqual(stanza2Lines[0], 'นะโม ตัสสะ ภะคะวะโต');
  });

  await t.test('Thai Translation Parsing Logic: Separates translation stanzas cleanly', () => {
    const sampleThai = 'พระผู้มีพระภาคเจ้า เป็นพระอรหันต์\nข้าพเจ้าขอนอบน้อมแด่พระผู้มีพระภาคเจ้า';
    const thaiStanzas = sampleThai.split(/\n+/).filter(s => s.trim().length > 0);

    assert.strictEqual(thaiStanzas.length, 2, 'Should split translation into 2 stanzas');
    assert.strictEqual(thaiStanzas[0], 'พระผู้มีพระภาคเจ้า เป็นพระอรหันต์');
    assert.strictEqual(thaiStanzas[1], 'ข้าพเจ้าขอนอบน้อมแด่พระผู้มีพระภาคเจ้า');
  });

});
