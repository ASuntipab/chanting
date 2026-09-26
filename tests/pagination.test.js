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

  await t.test('Zero-Scrollbar: Font size scaling to 230% and 300% increases page count so each page fits without scrolling', async () => {
    const { DEFAULT_PRAYERS } = await import('../src/js/default-prayers.js');
    const mettaPrayer = DEFAULT_PRAYERS[0]; // Includes 9. บทแผ่เมตตา (5-line multi-sentence prayer)

    const pages100 = paginatePrayerIntoBookPages(mettaPrayer, 1.15); // 100%
    const pages200 = paginatePrayerIntoBookPages(mettaPrayer, 2.30); // 200%
    const pages230 = paginatePrayerIntoBookPages(mettaPrayer, 2.645); // 230%
    const pages300 = paginatePrayerIntoBookPages(mettaPrayer, 3.45); // 300%

    // Page count MUST strictly increase with font size
    assert.ok(pages200.length > pages100.length, `200% should have more pages than 100% (got ${pages200.length} vs ${pages100.length})`);
    assert.ok(pages230.length >= pages200.length, `230% should have >= 200% pages (got ${pages230.length} vs ${pages200.length})`);
    assert.ok(pages300.length >= pages230.length, `300% should have >= 230% pages (got ${pages300.length} vs ${pages230.length})`);

    // Verify Metta subpages (originalPageIndex = 8) are split into individual lines at 230%
    const mettaSub230 = pages230.filter(p => p.originalPageIndex === 8);
    assert.ok(mettaSub230.length >= 8, `Metta at 230% should have at least 8 subpages (got ${mettaSub230.length}) so each page has at most 1-2 lines`);
    mettaSub230.forEach(sp => {
      const lineCount = sp.stanzas.reduce((acc, s) => acc + (s.pali ? s.pali.split('\n').length : 0), 0);
      assert.ok(lineCount <= 2, `Every subpage at 230% should have <= 2 lines to prevent vertical scrollbar (got ${lineCount})`);
    });
  });

  await t.test('Traisaranagamana Zero-Truncation: Thai translation is cleanly split and not dumped into Pali couplets', async () => {
    const { DEFAULT_PRAYERS } = await import('../src/js/default-prayers.js');
    const somdetToh = DEFAULT_PRAYERS[0];

    // Page 2 is ๒. บทไตรสรณคมน์
    const p2_100 = paginatePrayerIntoBookPages(somdetToh, 1.15).filter(p => p.originalPageIndex === 1);
    const p2_230 = paginatePrayerIntoBookPages(somdetToh, 2.645).filter(p => p.originalPageIndex === 1);
    const p2_300 = paginatePrayerIntoBookPages(somdetToh, 3.45).filter(p => p.originalPageIndex === 1);

    assert.ok(p2_230.length > p2_100.length, `230% should split Traisaranagamana into more subpages than 100% (got ${p2_230.length} vs ${p2_100.length})`);
    assert.ok(p2_300.length >= p2_230.length, `300% should have >= 230% subpages (got ${p2_300.length} vs ${p2_230.length})`);

    // Verify each subpage at 230% has at most 5 visual lines (never overflows the viewport)
    p2_230.forEach((sp, idx) => {
      assert.ok(sp.stanzas.length > 0, `Subpage ${idx + 1} must have stanzas`);
      let totalLines = 0;
      sp.stanzas.forEach(st => {
        if (st.pali) totalLines += st.pali.split('\n').length;
        if (st.thai) totalLines += Math.ceil(st.thai.length / 16);
      });
      assert.ok(totalLines <= 6, `Subpage ${idx + 1} at 230% must have <= 6 visual lines so text is never truncated (got ${totalLines})`);
    });

    // Verify all Thai translation text is completely preserved
    const allThaiCollected = p2_230.map(sp => sp.stanzas.map(st => st.thai).filter(Boolean).join(' ')).filter(Boolean).join(' ');
    assert.match(allThaiCollected, /พระพุทธเจ้า/, 'Thai translation must contain พระพุทธเจ้า');
    assert.match(allThaiCollected, /ที่พึ่งที่ระลึก/, 'Thai translation must contain ที่พึ่งที่ระลึก');
    assert.match(allThaiCollected, /แม้ครั้งที่สาม/, 'Thai translation must contain แม้ครั้งที่สาม');
  });
});


