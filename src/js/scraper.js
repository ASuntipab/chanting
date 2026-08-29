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

    // List of resilient CORS proxy gateways
    const proxies = [
      (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
      (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    ];

    let lastError = null;

    for (let i = 0; i < proxies.length; i++) {
      try {
        const targetProxy = proxies[i](url);
        const response = await fetch(targetProxy, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;

        let rawHtml = '';
        if (i === 0) {
          // allorigins returns JSON { contents: "..." }
          const data = await response.json();
          rawHtml = data.contents;
        } else {
          rawHtml = await response.text();
        }

        if (rawHtml && rawHtml.length > 50) {
          return this.parseHtmlToPrayer(rawHtml, url);
        }
      } catch (e) {
        lastError = e;
        console.warn(`Proxy ${i + 1} failed, trying next fallback...`, e);
      }
    }

    throw new Error(`ไม่สามารถดึงบทสวดจาก URL อัตโนมัติได้ (${lastError?.message || 'เว็บเป้าหมายอาจจำกัดสิทธิ์'}) คุณสามารถคัดลอกข้อความมาวางในแท็บ 'พิมพ์บทสวดเอง' ได้ครับ`);
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
