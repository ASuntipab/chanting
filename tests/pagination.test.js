import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of autoPaginateText algorithm
function autoPaginateText(rawText) {
  if (!rawText || !rawText.trim()) {
    return [{ pageNumber: 1, verseTitle: 'บทสวด', content: 'ไม่มีเนื้อหา' }];
  }
  const chunks = rawText.split(/\n\s*\n/).filter(c => c.trim().length > 0);
  if (chunks.length <= 1) {
    const lines = rawText.split('\n');
    const pages = [];
    let cur = [];
    lines.forEach(l => {
      cur.push(l);
      if (cur.join('\n').length > 350) {
        pages.push(cur.join('\n'));
        cur = [];
      }
    });
    if (cur.length > 0) pages.push(cur.join('\n'));
    return pages.map((c, i) => ({
      pageNumber: i + 1,
      verseTitle: `ตอนที่ ${i + 1}`,
      content: c
    }));
  }

  return chunks.map((chunk, i) => ({
    pageNumber: i + 1,
    verseTitle: `บทที่ ${i + 1}`,
    content: chunk
  }));
}

test('Auto-Pagination should handle empty or whitespace text cleanly', () => {
  const res1 = autoPaginateText('');
  assert.equal(res1.length, 1);
  assert.equal(res1[0].content, 'ไม่มีเนื้อหา');

  const res2 = autoPaginateText('   \n  \t ');
  assert.equal(res2.length, 1);
  assert.equal(res2[0].content, 'ไม่มีเนื้อหา');
});

test('Auto-Pagination should split multi-paragraph prayer into discrete pages', () => {
  const multiVerse = `
  นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ (๓ จบ)

  ชะยาสะนากะตา พุทธา เชตวา มารัง สะวาหะนัง
  จะตุสัจจาสะภัง ระสัง เย ปิวิงสุ นะราสะภา

  ตัณหังกะราทะโย พุทธา อัฏฐะวีสะติ นายะกา
  สัพเพ ปะติฏฐิตา มัยหัง มัตถะเก เต มุนิสสะรา
  `;

  const pages = autoPaginateText(multiVerse);
  assert.equal(pages.length, 3);
  assert.equal(pages[0].pageNumber, 1);
  assert.equal(pages[1].pageNumber, 2);
  assert.equal(pages[2].pageNumber, 3);
  assert.match(pages[0].content, /นะโม ตัสสะ/);
  assert.match(pages[1].content, /ชะยาสะนากะตา/);
  assert.match(pages[2].content, /ตัณหังกะราทะโย/);
});

test('Auto-Pagination should chunk long continuous text without empty breaks', () => {
  const longText = Array(20).fill('อิติปิ โส ภะคะวา อะระหัง สัมมาสัมพุทโธ วิชชาจะระณะสัมปันโน สุคะโต โลกะวิทู').join('\n');
  const pages = autoPaginateText(longText);
  assert.ok(pages.length > 1, 'Long continuous text should be paginated into multiple pages');
  pages.forEach((p, idx) => {
    assert.equal(p.pageNumber, idx + 1);
    assert.ok(p.content.length > 0);
  });
});
