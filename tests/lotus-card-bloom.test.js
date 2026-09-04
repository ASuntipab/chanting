import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Blooming Lotus Background & Readability Verification', async (t) => {
  const rootDir = process.cwd();
  const baseCssContent = fs.readFileSync(path.join(rootDir, 'src/css/tamma-base.css'), 'utf8');
  const appJsContent = fs.readFileSync(path.join(rootDir, 'src/js/app.js'), 'utf8');

  await t.test('CSS Verification: .lotus-bg-container is absolute with z-index 0 and subtle opacity', () => {
    assert.match(baseCssContent, /\.lotus-bg-container\s*\{[^}]*position:\s*absolute/, '.lotus-bg-container must be absolute');
    assert.match(baseCssContent, /\.lotus-bg-container\s*\{[^}]*z-index:\s*0/, '.lotus-bg-container must have z-index 0');
    assert.match(baseCssContent, /\.lotus-bg-container\s*\{[^}]*opacity:\s*0\.08/, '.lotus-bg-container default opacity must be 0.08 for text clarity');
    assert.match(baseCssContent, /body\.theme-parchment\s+\.lotus-bg-container\s*\{[^}]*opacity:\s*0\.05/, 'Parchment theme opacity must be 0.05');
  });

  await t.test('CSS Verification: .card-inner-content has relative position and z-index 1 for perfect readability', () => {
    assert.match(baseCssContent, /\.card-inner-content\s*\{[^}]*position:\s*relative;/, '.card-inner-content must be relative');
    assert.match(baseCssContent, /\.card-inner-content\s*\{[^}]*z-index:\s*1;/, '.card-inner-content must have z-index 1');
  });

  await t.test('CSS Verification: .lotus-svg has petal rotation transforms bound to --bloom-progress', () => {
    assert.match(baseCssContent, /\.petal-outer-left\s*\{[^}]*var\(--bloom-progress/, 'Petal left rotation must use --bloom-progress');
    assert.match(baseCssContent, /\.petal-outer-right\s*\{[^}]*var\(--bloom-progress/, 'Petal right rotation must use --bloom-progress');
  });

  await t.test('JS Verification: app.js contains getLotusBgSvgHtml and sets --bloom-progress based on 9 chants', () => {
    assert.match(appJsContent, /getLotusBgSvgHtml\(\)/, 'app.js must provide getLotusBgSvgHtml helper');
    assert.match(appJsContent, /Math\.min\(chantCount\s*\/\s*9,\s*1\)/, 'bloomProgress must scale up to 9 chants max');
    assert.match(appJsContent, /--bloom-progress/, 'card style must set --bloom-progress');
    assert.match(appJsContent, /card-inner-content/, 'cards must wrap content in card-inner-content');
  });
});
