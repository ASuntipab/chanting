import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

test('Mobile Safe-Area Header & Navigation Layout Live Verification', async (t) => {
  const rootDir = process.cwd();
  const htmlContent = fs.readFileSync(path.join(rootDir, 'tamma.html'), 'utf8');
  const baseCssContent = fs.readFileSync(path.join(rootDir, 'src/css/tamma-base.css'), 'utf8');
  const readerCssContent = fs.readFileSync(path.join(rootDir, 'src/css/reader.css'), 'utf8');

  await t.test('DOM Hierarchy: top-header is placed outside and before app-container', () => {
    const $ = cheerio.load(htmlContent);
    const topHeader = $('header.top-header');
    assert.equal(topHeader.length, 1, 'header.top-header must exist in DOM');
    
    const parentTag = topHeader.parent()[0]?.tagName?.toLowerCase();
    assert.equal(parentTag, 'body', 'header.top-header parent must be body (not nested inside app-container)');

    const nextElem = topHeader.next('.app-container');
    assert.equal(nextElem.length, 1, '.app-container must be the immediate following sibling of .top-header');

    const headerInner = topHeader.find('.header-inner');
    assert.equal(headerInner.length, 1, '.header-inner must exist inside .top-header for responsive centering');

    assert.equal(headerInner.find('.brand').length, 1, 'brand logo must be inside header-inner');
    assert.equal(headerInner.find('.header-actions').length, 1, 'header-actions must be inside header-inner');
  });

  await t.test('CSS Verification: body padding-top is 0 to prevent double-gap and scroll jumping', () => {
    const bodyMatch = baseCssContent.match(/body\s*\{([^}]+)\}/);
    assert.ok(bodyMatch, 'body selector must exist in tamma-base.css');
    const bodyRules = bodyMatch[1];
    assert.match(bodyRules, /padding-top:\s*0;?/, 'body padding-top must be explicitly 0');
    assert.match(bodyRules, /padding-bottom:\s*0;?/, 'body padding-bottom must be explicitly 0');
  });

  await t.test('CSS Verification: top-header integrates var(--safe-top) and sticky top 0', () => {
    const headerMatch = baseCssContent.match(/\.top-header\s*\{([^}]+)\}/);
    assert.ok(headerMatch, '.top-header selector must exist in tamma-base.css');
    const headerRules = headerMatch[1];
    assert.match(headerRules, /position:\s*sticky;?/, '.top-header must be sticky');
    assert.match(headerRules, /top:\s*0;?/, '.top-header must stick at top 0');
    assert.match(headerRules, /padding-top:\s*calc\(10px\s*\+\s*var\(--safe-top\)\);?/, '.top-header must have padding-top: calc(10px + var(--safe-top))');
    assert.match(headerRules, /padding-left:\s*max\(14px,\s*env\(safe-area-inset-left\)\);?/, '.top-header must respect safe-area-inset-left');
    assert.match(headerRules, /padding-right:\s*max\(14px,\s*env\(safe-area-inset-right\)\);?/, '.top-header must respect safe-area-inset-right');
  });

  await t.test('CSS Verification: reader-toolbar integrates var(--safe-top) and bottom alignment', () => {
    const readerMatch = readerCssContent.match(/\.reader-toolbar\s*\{([^}]+)\}/);
    assert.ok(readerMatch, '.reader-toolbar selector must exist in reader.css');
    const readerRules = readerMatch[1];
    assert.match(readerRules, /padding-top:\s*max\(8px,\s*var\(--safe-top\)\);?/, '.reader-toolbar must have padding-top with safe-top');
    assert.match(readerRules, /height:\s*calc\(64px\s*\+\s*var\(--safe-top\)\);?/, '.reader-toolbar must calculate total height including safe-top');
    assert.match(readerRules, /align-items:\s*flex-end;?/, '.reader-toolbar must align items flex-end to push buttons away from top edge');
  });

  await t.test('CSS Verification: reader-view has 0 padding and page-frame maximizes area in hud-hidden', () => {
    const readerViewMatch = readerCssContent.match(/\.reader-view\s*\{([^}]+)\}/);
    assert.ok(readerViewMatch, '.reader-view selector must exist in reader.css');
    assert.match(readerViewMatch[1], /padding:\s*0;?/, '.reader-view must have padding: 0 to eliminate double safe-padding');

    const hudHiddenMatch = readerCssContent.match(/\.reader-view\.hud-hidden\s+\.page-frame\s*\{([^}]+)\}/);
    assert.ok(hudHiddenMatch, '.reader-view.hud-hidden .page-frame selector must exist');
    assert.match(hudHiddenMatch[1], /padding:\s*max\(14px,\s*calc\(var\(--safe-top\)\s*\+\s*6px\)\)/, 'hud-hidden page-frame must maximize vertical reading space');
  });

  await t.test('JS Verification: shareEngine uses vector lotus and strict centering', () => {
    const shareJsContent = fs.readFileSync(path.join(rootDir, 'src/js/share.js'), 'utf8');
    assert.ok(shareJsContent.includes('drawLotusWatermark'), 'shareEngine must use drawLotusWatermark instead of raw emoji');
    assert.ok(shareJsContent.includes("ctx.textAlign = 'center'"), 'shareEngine must explicitly enforce textAlign center');
  });

  await t.test('JS Verification: nativeBridge supports hideStatusBar and showStatusBar', () => {
    const bridgeJsContent = fs.readFileSync(path.join(rootDir, 'src/js/native-bridge.js'), 'utf8');
    assert.ok(bridgeJsContent.includes('hideStatusBar'), 'nativeBridge must have hideStatusBar method');
    assert.ok(bridgeJsContent.includes('showStatusBar'), 'nativeBridge must have showStatusBar method');
  });

  await t.test('CSS Verification: toast-container respects var(--safe-top)', () => {
    const toastMatch = baseCssContent.match(/\.toast-container\s*\{([^}]+)\}/);
    assert.ok(toastMatch, '.toast-container selector must exist in tamma-base.css');
    const toastRules = toastMatch[1];
    assert.match(toastRules, /top:\s*calc\(20px\s*\+\s*var\(--safe-top\)\);?/, '.toast-container must calculate top with var(--safe-top)');
  });
});
