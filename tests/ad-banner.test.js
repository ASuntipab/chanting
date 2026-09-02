import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('100% Ad-Free Pure Dharma Application Verification', async (t) => {
  
  await t.test('tamma.html must be 100% Ad-Free without any topAdBanner elements', () => {
    const htmlPath = path.join(process.cwd(), 'tamma.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    assert.strictEqual(htmlContent.includes('id="topAdBanner"'), false, 'tamma.html must NOT contain id="topAdBanner"');
    assert.strictEqual(htmlContent.includes('class="top-ad-banner"'), false, 'tamma.html must NOT contain class="top-ad-banner"');
    assert.strictEqual(htmlContent.includes('โฆษณาแบนเนอร์ด้านบน'), false, 'tamma.html must NOT contain ad banner aria labels');
  });

  await t.test('index.html must also be 100% Ad-Free', () => {
    const indexPath = path.join(process.cwd(), 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    assert.strictEqual(indexContent.includes('id="topAdBanner"'), false, 'index.html must NOT contain id="topAdBanner"');
    assert.strictEqual(indexContent.includes('class="top-ad-banner"'), false, 'index.html must NOT contain class="top-ad-banner"');
  });

  await t.test('tamma-base.css must not include any ad banner styles', () => {
    const cssPath = path.join(process.cwd(), 'src', 'css', 'tamma-base.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert.strictEqual(cssContent.includes('.top-ad-banner'), false, 'CSS must not define .top-ad-banner');
    assert.strictEqual(cssContent.includes('.ad-banner-inner'), false, 'CSS must not define .ad-banner-inner');
    assert.strictEqual(cssContent.includes('.ad-badge'), false, 'CSS must not define .ad-badge');
  });
});
