import test from 'node:test';
import assert from 'node:assert/strict';
import { BIRTHDAY_PROTECTION_PRAYERS } from '../src/js/prayers-birthday-protection.js';
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';

test('Birthday Prayers Suite: Comprehensive 7-Day 8-Posture & Anniversary Verification', async (t) => {
  await t.test('All 9 birthday prayers are registered with valid metadata and category', () => {
    assert.equal(BIRTHDAY_PROTECTION_PRAYERS.length, 9, 'Should have exactly 9 birthday prayers (7 days, 8 pangs, + 1 anniversary)');
    
    const expectedIds = [
      'birthday-sunday-mora',
      'birthday-monday-abhaya',
      'birthday-tuesday-karaniya',
      'birthday-wednesday-khandha',
      'birthday-rahu-suriyachanta',
      'birthday-thursday-vattaka',
      'birthday-friday-dhajagga',
      'birthday-saturday-angulimala',
      'birthday-anniversary-blessing'
    ];

    expectedIds.forEach(id => {
      const found = BIRTHDAY_PROTECTION_PRAYERS.find(p => p.id === id);
      assert.ok(found, `Prayer with ID ${id} must exist`);
      assert.equal(found.category, 'บทสวดประจำวันเกิด', `Prayer ${id} must have category 'บทสวดประจำวันเกิด'`);
      assert.ok(found.description && found.description.length > 30, `Prayer ${id} must have a rich, informative description`);
      assert.ok(found.pages && found.pages.length >= 3, `Prayer ${id} must have at least 3 pages (explanation, daily mantra, paritta/blessing)`);
    });
  });

  await t.test('Each daily prayer specifies its traditional Buddha Posture (ปางพระพุทธรูป) and Auspicious Details', () => {
    const dailyMap = {
      'birthday-sunday-mora': { pang: 'ปางถวายเนตร', paritta: 'โมรปริตร' },
      'birthday-monday-abhaya': { pang: 'ปางห้ามญาติ', paritta: 'อภยปริตร' },
      'birthday-tuesday-karaniya': { pang: 'ปางไสยาสน์', paritta: 'กะระณียะเมตต' },
      'birthday-wednesday-khandha': { pang: 'ปางอุ้มบาตร', paritta: 'ขันธปริตร' },
      'birthday-rahu-suriyachanta': { pang: 'ปางป่าเลไลยก์', paritta: 'จันทปริตร' },
      'birthday-thursday-vattaka': { pang: 'ปางสมาธิ', paritta: 'วัฏฏกปริตร' },
      'birthday-friday-dhajagga': { pang: 'ปางรำพึง', paritta: 'ธชัคค' },
      'birthday-saturday-angulimala': { pang: 'ปางนาคปรก', paritta: 'อังคุลิมาลปริตร' }
    };

    Object.entries(dailyMap).forEach(([id, { pang, paritta }]) => {
      const p = BIRTHDAY_PROTECTION_PRAYERS.find(item => item.id === id);
      assert.ok(p.title.includes(pang), `Title of ${id} should mention ${pang}`);
      assert.ok(p.description.includes(pang), `Description of ${id} should mention ${pang}`);
      assert.ok(p.pages[0].content.includes(pang), `Explanation page of ${id} should detail ${pang}`);
      assert.ok(p.pages[0].content.includes('กำลังวัน'), `Explanation page of ${id} should detail กำลังวัน`);
      assert.ok(p.pages[0].content.includes('อานิสงส์'), `Explanation page of ${id} should detail อานิสงส์`);
    });
  });

  await t.test('Page 2 of daily prayers contains the authentic Itipiso 8-directions mantra', () => {
    const dailyMantras = {
      'birthday-sunday-mora': 'อะ วิช สุ นุต สา นุส ติ',
      'birthday-monday-abhaya': 'อิ ระ ชา คะ ตะ ระ สา',
      'birthday-tuesday-karaniya': 'ติ หัง จะ โต โร ถิ นัง',
      'birthday-wednesday-khandha': 'ปิ สัม ระ โล ปุ สัต พุท',
      'birthday-rahu-suriyachanta': 'คะ พุท ปัน ทู ธัม วะ คะ',
      'birthday-thursday-vattaka': 'ภะ สัม สัม วิ สะ เท ภะ',
      'birthday-friday-dhajagga': 'วา โธ โน อะ มะ มะ วา',
      'birthday-saturday-angulimala': 'โส มา ณะ กะ ริ ถา โธ'
    };

    Object.entries(dailyMantras).forEach(([id, mantra]) => {
      const p = BIRTHDAY_PROTECTION_PRAYERS.find(item => item.id === id);
      const page2 = p.pages[1];
      assert.ok(page2.pali.includes(mantra), `Page 2 of ${id} must contain the mantra: ${mantra}`);
      assert.ok(page2.thai && page2.thai.length > 20, `Page 2 of ${id} must have a dedicated blessing/meaning translation`);
    });
  });

  await t.test('Birthday Anniversary prayer contains all 5 comprehensive steps', () => {
    const anniv = BIRTHDAY_PROTECTION_PRAYERS.find(p => p.id === 'birthday-anniversary-blessing');
    assert.equal(anniv.pages.length, 5, 'Birthday Anniversary prayer should have 5 comprehensive pages');
    assert.ok(anniv.pages[0].verseTitle.includes('คำแนะนำการทำบุญในวันคล้ายวันเกิด') || anniv.pages[0].content.includes('การทำบุญในวันคล้ายวันเกิด'), 'Page 1 is guidance');
    assert.ok(anniv.pages[1].pali.includes('นะโม ตัสสะ'), 'Page 2 is Namakara & Traisarana');
    assert.ok(anniv.pages[2].pali.includes('ชะยันโต'), 'Page 3 is Mangala Chakkawala Noi (Chayanto)');
    assert.ok(anniv.pages[3].pali.includes('โส อัตถะลัทโธ'), 'Page 4 is So Attholattho');
    assert.ok(anniv.pages[4].content.includes('คำอธิษฐานจิตในวันคล้ายวันเกิด'), 'Page 5 is dedication and water pouring');
  });

  await t.test('All birthday prayers are integrated cleanly into DEFAULT_PRAYERS without collision', () => {
    const defaultIds = DEFAULT_PRAYERS.map(p => p.id);
    const uniqueIds = new Set(defaultIds);
    assert.equal(defaultIds.length, uniqueIds.size, 'DEFAULT_PRAYERS must have unique IDs without duplicates');

    const bPrayers = DEFAULT_PRAYERS.filter(p => p.category === 'บทสวดประจำวันเกิด');
    assert.equal(bPrayers.length, 9, 'DEFAULT_PRAYERS must contain all 9 birthday prayers');
  });
});
