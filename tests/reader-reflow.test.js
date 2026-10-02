import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const readerJs = fs.readFileSync(path.join(process.cwd(), 'src/js/reader.js'), 'utf8');
const readerCss = fs.readFileSync(path.join(process.cwd(), 'src/css/reader.css'), 'utf8');

test('Measured Book Reflow: pages are filled by real on-screen height', async (t) => {

  await t.test('Page frame keeps the same size whether the HUD is shown or hidden', () => {
    const base = readerCss.match(/\n\.page-frame\s*\{([^}]+)\}/);
    const hudHidden = readerCss.match(/\.reader-view\.hud-hidden\s+\.page-frame\s*\{([^}]+)\}/);
    assert.ok(base && hudHidden, 'Both .page-frame rules must exist');
    const padding = (block) => block.match(/padding:\s*([^;]+);/)[1].trim();
    assert.equal(padding(base[1]), padding(hudHidden[1]), 'Measured pages must not shift when the HUD toggles');
  });

  await t.test('Continued stanzas and split lines are not re-indented', () => {
    assert.ok(readerCss.includes('.verse-stanza.stanza-continued > .verse-pali'));
    assert.ok(readerCss.includes('.verse-line-continued'));
    assert.ok(readerCss.includes('.page-verse-viewport.page-overflow'), 'Over-full pages must scroll instead of clipping');
  });

  await t.test('Reflow runs on render and re-runs on font, layout and viewport changes', () => {
    assert.match(readerJs, /renderPages\(prayer\) \{[\s\S]*?this\.reflowPagesToFit\(\);/);
    assert.ok(readerJs.includes('splitLineToFit('), 'Long lines must be split across pages');
    const repaginateCalls = readerJs.match(/requestAnimationFrame\(\(\) => this\.repaginatePreservingPosition\(\)\)/g) || [];
    assert.equal(repaginateCalls.length, 3, 'Font size, font family and layout changes must re-paginate');
    assert.ok(readerJs.includes('setTimeout(() => this.repaginatePreservingPosition(), 150)'), 'Resize must re-paginate');
    assert.ok(readerJs.includes('document.fonts.ready.then'), 'Pages must be re-measured once web fonts load');
  });
});
