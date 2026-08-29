import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BANNER_POSITION, AD_CONFIG, AdManager } from '../src/js/ad-manager.js';

test('Top Ad Banner Architecture & Lifecycle Verification', async (t) => {
  
  await t.test('Ad Banner position must strictly be TOP_CENTER (Top Only)', () => {
    assert.strictEqual(BANNER_POSITION.TOP_CENTER, 'TOP_CENTER', 'Banner position must be defined as TOP_CENTER');
    assert.strictEqual(AD_CONFIG.position, 'TOP_CENTER', 'Default Ad config position must be strictly TOP_CENTER');
    
    const manager = new AdManager();
    assert.strictEqual(manager.getPosition(), 'TOP_CENTER', 'AdManager.getPosition() must return TOP_CENTER');
  });

  await t.test('AdManager configuration has valid test AdMob Unit IDs', () => {
    assert.ok(AD_CONFIG.androidBannerId.startsWith('ca-app-pub-'), 'Android test banner ID must follow AdMob pub format');
    assert.ok(AD_CONFIG.iosBannerId.startsWith('ca-app-pub-'), 'iOS test banner ID must follow AdMob pub format');
    assert.strictEqual(AD_CONFIG.isTesting, true, 'isTesting should default to true for safety');
  });

  await t.test('AdManager Web Fallback Banner renders structure into DOM mock', () => {
    // Setup Mock DOM Element
    const mockContainer = {
      id: 'topAdBanner',
      innerHTML: '',
      style: { display: 'none' }
    };

    // Mock document
    const originalDocument = globalThis.document;
    globalThis.document = {
      getElementById: (id) => (id === 'topAdBanner' ? mockContainer : null)
    };

    try {
      const manager = new AdManager({ autoShow: false });
      manager.containerEl = mockContainer;
      
      assert.strictEqual(manager.isBannerVisible(), false, 'Banner starts hidden when autoShow=false');

      manager.renderWebBanner();
      assert.strictEqual(manager.isBannerVisible(), true, 'Banner should be visible after renderWebBanner()');
      assert.strictEqual(mockContainer.style.display, 'block', 'Container display should be set to block');
      assert.ok(mockContainer.innerHTML.includes('ad-banner-inner'), 'Inner banner container must exist');
      assert.ok(mockContainer.innerHTML.includes('โฆษณา'), 'Ad badge "โฆษณา" must be present');
      assert.ok(mockContainer.innerHTML.includes('ad-content-slot'), 'Ad content slot must be present');

      // Test custom ad injection
      manager.setCustomAd('<div id="customSponsor">ผู้สนับสนุนใจบุญ</div>');
      assert.ok(mockContainer.innerHTML.includes('customSponsor'), 'Custom ad HTML must be rendered');
      assert.ok(mockContainer.innerHTML.includes('โฆษณา'), 'Ad badge remains present for transparency');

      // Test hide banner
      manager.hideBanner();
      assert.strictEqual(manager.isBannerVisible(), false, 'Banner should be marked invisible after hideBanner()');
      assert.strictEqual(mockContainer.style.display, 'none', 'Container style.display must be none after hideBanner()');
    } finally {
      globalThis.document = originalDocument;
    }
  });

  await t.test('tamma.html contains topAdBanner positioned at the top of app container', () => {
    const htmlPath = path.join(process.cwd(), 'tamma.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(htmlContent.includes('id="topAdBanner"'), 'tamma.html must contain id="topAdBanner"');
    assert.ok(htmlContent.includes('class="top-ad-banner"'), 'tamma.html must contain class="top-ad-banner"');
    
    // Check placement: topAdBanner must appear BEFORE viewLibrary tab view
    const bannerIndex = htmlContent.indexOf('id="topAdBanner"');
    const libraryIndex = htmlContent.indexOf('id="viewLibrary"');
    const headerIndex = htmlContent.indexOf('class="top-header"');

    assert.ok(headerIndex !== -1, 'Top header must exist');
    assert.ok(bannerIndex !== -1, 'Top banner must exist');
    assert.ok(libraryIndex !== -1, 'Library view must exist');
    assert.ok(bannerIndex > headerIndex, 'Top banner must be positioned right after or at top-header');
    assert.ok(bannerIndex < libraryIndex, 'Top banner must be positioned before viewLibrary at top');
  });

  await t.test('tamma-base.css includes responsive top ad banner styles and theme adaptations', () => {
    const cssPath = path.join(process.cwd(), 'src', 'css', 'tamma-base.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert.ok(cssContent.includes('.top-ad-banner'), 'CSS must define .top-ad-banner');
    assert.ok(cssContent.includes('.ad-banner-inner'), 'CSS must define .ad-banner-inner');
    assert.ok(cssContent.includes('.ad-badge'), 'CSS must define .ad-badge');
    assert.ok(cssContent.includes('body.theme-parchment .top-ad-banner'), 'Parchment theme styles must exist for ad banner');
    assert.ok(cssContent.includes('body.theme-cosmic .top-ad-banner'), 'Cosmic theme styles must exist for ad banner');
    assert.ok(cssContent.includes('body.theme-midnight .top-ad-banner'), 'Midnight theme styles must exist for ad banner');
  });
});
