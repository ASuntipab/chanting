import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of parseRawTextToPrayer logic
function parseRawTextToPrayer(title, rawText, sourceUrl = '') {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const pages = [];
  let currentPali = [];
  let currentThai = [];
  let currentTitle = 'บทเริ่มต้น';
  let pageNum = 1;

  const flushPage = () => {
    if (currentPali.length > 0 || currentThai.length > 0) {
      pages.push({
        pageNumber: pageNum++,
        verseTitle: currentTitle,
        pali: currentPali.join('\n'),
        thai: currentThai.join('\n')
      });
      currentPali = [];
      currentThai = [];
    }
  };

  lines.forEach(line => {
    if (/^(บทที่|คาถาที่|ท่อนที่|ตอนที่|\d+\.|\(\d+\))/i.test(line)) {
      flushPage();
      currentTitle = line;
    } else if (line.includes('คำแปล') || line.includes('แปลว่า') || line.startsWith('(')) {
      currentThai.push(line.replace(/^(คำแปล|แปลว่า)[:\s]*/, ''));
    } else {
      currentPali.push(line);
    }

    if (currentPali.length + currentThai.length >= 8) {
      flushPage();
      currentTitle = `ตอนที่ ${pageNum}`;
    }
  });

  flushPage();

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      verseTitle: 'เนื้อหาบทสวด',
      content: rawText
    });
  }

  return {
    id: `imported-test`,
    title: title || 'บทสวดมนต์',
    category: 'บทสวดทั่วไป',
    sourceUrl: sourceUrl,
    author: 'นำเข้าจากเว็บไซต์',
    description: `บทสวดมนต์นำเข้าจากแหล่งข้อมูลภายนอก`,
    status: 'pending',
    pages: pages
  };
}

test('Scraper should parse headers, Pali verses and Thai translations accurately', () => {
  const webContent = `
    บทที่ ๑ : เริ่มต้น
    โย โส ภะคะวา อะระหัง สัมมาสัมพุทโธ
    คำแปล: พระผู้มีพระภาคเจ้าพระองค์นั้น เป็นผู้ไกลจากกิเลส
    (กราบหนึ่งครั้ง)

    บทที่ ๒ : พระธรรม
    สวากขาโต ภะคะวะตา ธัมโม
    คำแปล: พระธรรมอันพระผู้มีพระภาคเจ้าตรัสไว้ดีแล้ว
  `;

  const parsed = parseRawTextToPrayer('บทสวดทำวัตร', webContent, 'https://dhamma.example.com');
  
  assert.equal(parsed.title, 'บทสวดทำวัตร');
  assert.equal(parsed.status, 'pending');
  assert.equal(parsed.sourceUrl, 'https://dhamma.example.com');
  assert.equal(parsed.pages.length, 2);

  assert.equal(parsed.pages[0].verseTitle, 'บทที่ ๑ : เริ่มต้น');
  assert.match(parsed.pages[0].pali, /โย โส ภะคะวา/);
  assert.match(parsed.pages[0].thai, /พระผู้มีพระภาคเจ้า/);

  assert.equal(parsed.pages[1].verseTitle, 'บทที่ ๒ : พระธรรม');
  assert.match(parsed.pages[1].pali, /สวากขาโต/);
  assert.match(parsed.pages[1].thai, /พระธรรมอันพระผู้มีพระภาคเจ้า/);
});
