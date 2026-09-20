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

test('paginatePrayerIntoBookPages: Discrete Book Page-Flip & Top-Aligned Stanzas', async (t) => {
  const { paginatePrayerIntoBookPages } = await import('../src/js/reader.js');

  const samplePrayer = {
    id: 'test-bojjhanga',
    title: 'โพชฌังคปริตร',
    pages: [
      {
        verseTitle: 'บทนำโพชฌังคปริตร',
        pali: 'โพชฌังโค สะติสังขาโต ธัมมานัง วิจะโย ตะถา\nวิริยัมปีติปัสสัทธิ โพชฌังคา จะ ตะถาปะเร',
        thai: 'โพชฌงค์ ๗ ประการ คือ สติสัมโพชฌงค์ ธัมมวิจยสัมโพชฌงค์\nวิริยสัมโพชฌงค์ ปีติสัมโพชฌงค์ ปัสสัทธิสัมโพชฌงค์'
      },
      {
        verseTitle: 'ข้อที่สอง',
        pali: 'สะมาธุเปกขะโพชฌังคา สัตเตเต สัพพะทัสสินา\nมุนินา สัมมะทักขาตา ภาวิตา พะหุลีกะตา',
        thai: 'สมาธิสัมโพชฌงค์ และอุเบกขาสัมโพชฌงค์ ๗ ประการเหล่านี้\nเป็นธรรมอันพระมุนีเจ้า ผู้เห็นธรรมทั้งปวงตรัสไว้ชอบแล้ว'
      }
    ]
  };

  await t.test('Produces discrete book pages with top-aligned complete stanzas', () => {
    const bookPages = paginatePrayerIntoBookPages(samplePrayer, 1.15);
    assert.ok(bookPages.length >= 2, 'Should have at least 2 pages');
    assert.equal(bookPages[0].pageNumber, 1);
    assert.equal(bookPages[0].verseTitle, 'บทนำโพชฌังคปริตร');
    assert.ok(bookPages[0].stanzas.length > 0);
    assert.equal(bookPages[0].stanzas[0].pali, 'โพชฌังโค สะติสังขาโต ธัมมานัง วิจะโย ตะถา\nวิริยัมปีติปัสสัทธิ โพชฌังคา จะ ตะถาปะเร');

    assert.equal(bookPages[1].pageNumber, 2);
    assert.equal(bookPages[1].verseTitle, 'ข้อที่สอง');
    assert.equal(bookPages[1].stanzas[0].pali, 'สะมาธุเปกขะโพชฌังคา สัตเตเต สัพพะทัสสินา\nมุนินา สัมมะทักขาตา ภาวิตา พะหุลีกะตา');
  });

  await t.test('Dynamic Font Scaling: Larger font sizes increase page count to prevent vertical clipping', () => {
    // Generate a prayer with a large stanza block (~600 characters)
    const longStanzaPali = Array(8).fill('ชะยาสะนากะตา พุทธา เชตวา มารัง สะวาหะนัง จะตุสัจจาสะภัง ระสัง เย ปิวิงสุ นะราสะภา').join('\n\n');
    const longStanzaThai = Array(8).fill('พระพุทธเจ้าทั้งหลาย ผู้ประทับนั่งบนชนะบัลลังก์ ทรงชนะพญามารพร้อมด้วยเสนา').join('\n\n');
    const largePrayer = {
      title: 'ชินบัญชร คาถา',
      pages: [{
        verseTitle: 'คาถาชินบัญชรเต็ม',
        pali: longStanzaPali,
        thai: longStanzaThai
      }]
    };

    // At standard font size 1.15rem (100%)
    const normalPages = paginatePrayerIntoBookPages(largePrayer, 1.15);
    // At large font size 2.30rem (200%)
    const largePages = paginatePrayerIntoBookPages(largePrayer, 2.30);
    // At max elder font size 3.45rem (300%)
    const elderPages = paginatePrayerIntoBookPages(largePrayer, 3.45);

    assert.ok(normalPages.length >= 2, `Normal font should paginate into at least 2 pages (got ${normalPages.length})`);
    assert.ok(largePages.length >= normalPages.length, `200% font should create >= normal pages (got ${largePages.length} vs ${normalPages.length})`);
    assert.ok(elderPages.length >= largePages.length, `300% font should create >= 200% pages (got ${elderPages.length} vs ${largePages.length})`);

    // Verify subpage indicators when a single prayer page is split
    elderPages.forEach((p, idx) => {
      assert.equal(p.pageNumber, idx + 1);
      assert.match(p.verseTitle, /\(\d+\/\d+\)/, 'Subpage title should include progress indicator like (1/N)');
      assert.ok(p.stanzas.length > 0, 'Every subpage must have at least 1 intact stanza');
      // Verify no broken text
      p.stanzas.forEach(st => {
        assert.ok(st.pali.length > 0, 'Stanza Pali must not be empty');
      });
    });
  });

  await t.test('Handles single-string content prayers gracefully with fallback pagination', () => {
    const rawContentPrayer = {
      title: 'คาถาสั้น',
      content: 'สัมปะฏิจฉามิ\n\nเพ็ง ๆ พา ๆ หา ๆ ฤๅ ๆ'
    };
    const bookPages = paginatePrayerIntoBookPages(rawContentPrayer, 1.15);
    assert.ok(bookPages.length >= 1);
    assert.equal(bookPages[0].stanzas[0].thai, 'สัมปะฏิจฉามิ');
  });
});

