/**
 * Tamma OS - Intelligent URL & Dhamma Web Content Extractor
 * Cleans out website noise, detects Pali verses vs Thai translations, and auto-paginates
 */

export class DhammaScraperEngine {
  /**
   * Fetches and extracts content from a URL via CORS proxies or Direct Fetch
   */
  async extractFromUrl(url) {
    if (!url || !url.startsWith('http')) {
      throw new Error('กรุณาระบุ URL ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://)');
    }

    try {
      // Try direct fetch or open proxy for web content
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลจากเว็บไซต์เป้าหมายได้ (Network error)');
      }
      
      const data = await response.json();
      const rawHtml = data.contents;
      return this.parseHtmlToPrayer(rawHtml, url);
    } catch (e) {
      console.warn('Proxy fetch fallback to direct parse:', e);
      throw new Error(`ไม่สามารถดึงบทสวดจาก URL อัตโนมัติได้: ${e.message}`);
    }
  }

  /**
   * Parses Raw HTML string into structured Dhamma Prayer object with pages
   */
  parseHtmlToPrayer(htmlString, sourceUrl = '') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Remove noise elements
    const noiseTags = ['script', 'style', 'nav', 'header', 'footer', 'iframe', 'ads', '.ads', '.advertisement', '.sidebar', '.menu'];
    noiseTags.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Extract Title
    let title = doc.querySelector('h1')?.textContent?.trim() ||
                doc.querySelector('title')?.textContent?.trim() ||
                'บทสวดมนต์นำเข้า';
    title = title.replace(/[-|].*$/, '').trim(); // Remove site name suffix like "- Sanook"

    // Extract Main Content Area
    const mainArea = doc.querySelector('article') ||
                     doc.querySelector('.entry-content') ||
                     doc.querySelector('.post-content') ||
                     doc.querySelector('.content') ||
                     doc.body;

    const rawText = mainArea.innerText || mainArea.textContent || '';
    return this.parseRawTextToPrayer(title, rawText, sourceUrl);
  }

  /**
   * Parses raw text into structured pages with Pali & Thai separation
   */
  parseRawTextToPrayer(title, rawText, sourceUrl = '') {
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
      // Check if line looks like a section header (e.g. บทที่ ๑, ท่อนที่ 2, คาถาที่ 3)
      if (/^(บทที่|คาถาที่|ท่อนที่|ตอนที่|\d+\.|\(\d+\))/i.test(line)) {
        flushPage();
        currentTitle = line;
      } else if (line.includes('คำแปล') || line.includes('แปลว่า') || line.startsWith('(')) {
        currentThai.push(line.replace(/^(คำแปล|แปลว่า)[:\s]*/, ''));
      } else {
        // If line contains Pali-like Roman/Thai phonetics or ends in o, ang, etc.
        currentPali.push(line);
      }

      // If page gets too long, split
      if (currentPali.length + currentThai.length >= 8) {
        flushPage();
        currentTitle = `ตอนที่ ${pageNum}`;
      }
    });

    flushPage();

    // Fallback if no pages created
    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        verseTitle: 'เนื้อหาบทสวด',
        content: rawText
      });
    }

    return {
      id: `imported-${Date.now()}`,
      title: title || 'บทสวดมนต์',
      category: 'บทสวดทั่วไป',
      sourceUrl: sourceUrl,
      author: 'นำเข้าจากเว็บไซต์',
      description: `บทสวดมนต์นำเข้าจากแหล่งข้อมูลภายนอก`,
      status: 'pending', // Requires admin approval
      pages: pages
    };
  }
}

export const scraper = new DhammaScraperEngine();
