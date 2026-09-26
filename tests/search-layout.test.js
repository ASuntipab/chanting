import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

test('Search & Category Filter 2-Row Layout & Icon Verification', async (t) => {
  const rootDir = process.cwd();
  const htmlContent = fs.readFileSync(path.join(rootDir, 'tamma.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(rootDir, 'src/css/tamma-base.css'), 'utf8');

  await t.test('DOM Hierarchy: search-icon contains crisp SVG vector in both library and tipitaka views', () => {
    const $ = cheerio.load(htmlContent);

    // Prayer Library Search
    const libSearchWrap = $('#viewLibrary .search-container .search-input-wrap');
    assert.equal(libSearchWrap.length, 1, 'viewLibrary must have .search-input-wrap');
    const libSearchIcon = libSearchWrap.find('.search-icon svg');
    assert.equal(libSearchIcon.length, 1, 'viewLibrary .search-icon must contain SVG element');
    const libInput = libSearchWrap.find('#searchInput');
    assert.equal(libInput.length, 1, '#searchInput must exist');

    // Tipitaka Search
    const tipitakaSearchWrap = $('#viewTipitaka .search-container .search-input-wrap');
    assert.equal(tipitakaSearchWrap.length, 1, 'viewTipitaka must have .search-input-wrap');
    const tipitakaSearchIcon = tipitakaSearchWrap.find('.search-icon svg');
    assert.equal(tipitakaSearchIcon.length, 1, 'viewTipitaka .search-icon must contain SVG element');
    const tipitakaInput = tipitakaSearchWrap.find('#tipitakaSearchInput');
    assert.equal(tipitakaInput.length, 1, '#tipitakaSearchInput must exist');
  });

  await t.test('CSS Verification: .search-container uses column layout (2 rows) without squishing', () => {
    const containerMatch = cssContent.match(/(?:^|\n)\.search-container\s*\{([^}]+)\}/);
    assert.ok(containerMatch, '.search-container must be defined in CSS');
    const rules = containerMatch[1];
    assert.match(rules, /flex-direction:\s*column/, '.search-container must have flex-direction: column for 2-line layout');
    assert.match(rules, /align-items:\s*stretch/, '.search-container must stretch children to full width');
  });

  await t.test('CSS Verification: .search-icon has z-index and pointer-events: none so it is visible over input', () => {
    const iconMatch = cssContent.match(/\.search-input-wrap\s+\.search-icon\s*\{([^}]+)\}/);
    assert.ok(iconMatch, '.search-input-wrap .search-icon must be defined in CSS');
    const rules = iconMatch[1];
    assert.match(rules, /z-index:\s*2/, '.search-icon must have z-index: 2 so backdrop-filter does not blur/cover it');
    assert.match(rules, /pointer-events:\s*none/, '.search-icon must have pointer-events: none for seamless input click/focus');
  });

  await t.test('CSS Verification: .category-select and wrap take full width to prevent label truncation', () => {
    const wrapMatch = cssContent.match(/(?:^|\n)\.category-dropdown-wrap\s*\{([^}]+)\}/);
    assert.ok(wrapMatch, '.category-dropdown-wrap must be defined in CSS');
    assert.match(wrapMatch[1], /width:\s*100%/, '.category-dropdown-wrap must take width: 100%');

    const selectMatch = cssContent.match(/(?:^|\n)\.category-select\s*\{([^}]+)\}/);
    assert.ok(selectMatch, '.category-select base selector must be defined in CSS');
    assert.match(selectMatch[1], /width:\s*100%/, '.category-select must take width: 100%');
  });
});
