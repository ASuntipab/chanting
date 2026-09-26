import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Favorites Drag-and-Drop Reorder Verification (Clean UI without clunky buttons)', async (t) => {
  const rootDir = process.cwd();
  const cssContent = fs.readFileSync(path.join(rootDir, 'src/css/tamma-base.css'), 'utf8');
  const appJsContent = fs.readFileSync(path.join(rootDir, 'src/js/app.js'), 'utf8');
  const htmlContent = fs.readFileSync(path.join(rootDir, 'tamma.html'), 'utf8');

  await t.test('DOM / JS: Clunky arrow buttons (▲/▼) and .card-reorder-controls container are completely removed', () => {
    assert.equal(appJsContent.includes('card-reorder-controls'), false, 'app.js must not contain card-reorder-controls');
    assert.equal(appJsContent.includes('btn-move-up'), false, 'app.js must not contain btn-move-up');
    assert.equal(appJsContent.includes('btn-move-down'), false, 'app.js must not contain btn-move-down');
    assert.equal(cssContent.includes('.card-reorder-controls'), false, 'CSS must not contain .card-reorder-controls');
    assert.equal(cssContent.includes('.btn-reorder'), false, 'CSS must not contain .btn-reorder');
  });

  await t.test('DOM / JS: Sleek .drag-handle SVG button exists with touch & mouse drag support', () => {
    assert.match(appJsContent, /<button class="drag-handle"/, 'app.js must render .drag-handle button');
    assert.match(appJsContent, /startReorderDrag/, 'app.js must implement startReorderDrag handler');
    assert.match(appJsContent, /addEventListener\('touchstart'/, 'app.js must support touchstart for mobile touch');
    assert.match(appJsContent, /addEventListener\('mousedown'/, 'app.js must support mousedown for desktop mouse');
    assert.match(appJsContent, /longPressTimer/, 'app.js must support long-press drag on card body');
  });

  await t.test('CSS Verification: .drag-handle has touch-action: none and smooth hover/active feedback', () => {
    const handleMatch = cssContent.match(/\.drag-handle\s*\{([^}]+)\}/);
    assert.ok(handleMatch, '.drag-handle must be defined in CSS');
    assert.match(handleMatch[1], /touch-action:\s*none/, '.drag-handle must have touch-action: none so touch dragging does not scroll page');
    assert.match(handleMatch[1], /cursor:\s*grab/, '.drag-handle must have cursor: grab');

    assert.ok(cssContent.includes('.prayer-card.is-touch-dragging'), '.prayer-card.is-touch-dragging must be defined');
    assert.ok(cssContent.includes('.prayer-card.drag-target-over'), '.prayer-card.drag-target-over must be defined');
  });

  await t.test('Hint Text: Updated to guide user to drag cleanly', () => {
    assert.match(htmlContent, /ลากการ์ดเพื่อสลับลำดับบทสวด/, 'tamma.html hint must explain drag to reorder');
  });
});
