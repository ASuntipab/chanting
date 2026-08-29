/**
 * Tamma OS - Dhamma Share Engine & Canvas Card Generator
 * Creates beautiful Buddhist Art Cards for Social Sharing & Web Share API
 */

import { storage } from './storage.js';

export class DhammaShareEngine {
  constructor() {
    this.canvas = document.getElementById('shareCanvas');
  }

  /**
   * Share via Native Mobile Web Share API
   */
  async shareNative(prayer) {
    const trackerData = storage.getTrackerData();
    const count = trackerData.totalCounts[prayer.id] || 0;
    const streak = trackerData.streakDays || 1;

    // สร้าง Deep Link (Zero-Database P2P Share)
    // บีบอัดบทสวดเป็น Base64 แทรกลงใน URL Parameter
    const prayerPayload = {
      title: prayer.title,
      category: prayer.category,
      author: prayer.author,
      pages: prayer.pages
    };
    const base64Prayer = btoa(encodeURIComponent(JSON.stringify(prayerPayload)));
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?import=${base64Prayer}`;

    const shareData = {
      title: `${prayer.title} - ธรรมะ E-Book`,
      text: `🙏 ขอเชิญร่วมสวดมนต์บท "${prayer.title}"\n(วันนี้ฉันสวดสะสมแล้ว ${count} จบ, ต่อเนื่อง ${streak} วัน)\n\nกดลิงก์ด้านล่างเพื่อเปิดอ่านและเพิ่มเข้าแอปธรรมะ E-Book ของคุณได้ฟรี (ไม่ต้องโหลดแอป):`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('Share error:', e);
        }
      }
    }

    // Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      return 'copied';
    } catch (e) {
      return false;
    }
  }

  /**
   * Generates a high-resolution Buddhist Art Card on HTML5 Canvas
   */
  generateCard(prayer) {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }

    const ctx = this.canvas.getContext('2d');
    const width = 800;
    const height = 1000;

    this.canvas.width = width;
    this.canvas.height = height;

    // 1. Background Gradient (Deep sacred amber & dark wood)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#1c140e');
    bgGrad.addColorStop(0.5, '#120e0b');
    bgGrad.addColorStop(1, '#241a12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Gold Borders & Corners
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // 3. Glowing Lotus Centerpiece Watermark
    ctx.save();
    ctx.font = '140px serif';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪷', width / 2, height / 2 - 40);
    ctx.restore();

    // 4. Header & App Branding
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Prompt", sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('❖ ธรรมะ E-BOOK • TAMMA OS ❖', width / 2, 85);

    // 5. Prayer Title (Auto-scaling & Word Wrapping)
    const titleText = prayer.title || 'บทสวดมนต์อันเป็นมงคล';
    let titleFontSize = 32;
    if (titleText.length > 32) titleFontSize = 23;
    else if (titleText.length > 20) titleFontSize = 27;

    ctx.font = `bold ${titleFontSize}px "Prompt", sans-serif`;
    ctx.fillStyle = '#ffffff';
    const titleEndY = this.wrapText(ctx, titleText, width / 2, 140, width - 140, titleFontSize * 1.35, 2);

    // Category / Origin Subtitle
    const subtitleY = titleEndY + 28;
    ctx.font = '18px "Sarabun", sans-serif';
    ctx.fillStyle = '#d1c5b8';
    ctx.fillText(prayer.author || prayer.category || 'บทสวดมนต์อันเป็นมงคล', width / 2, subtitleY);

    // 6. Dividing Ornament Line
    const dividerY = subtitleY + 20;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, dividerY);
    ctx.lineTo(width / 2 + 120, dividerY);
    ctx.stroke();

    // 7. Key Excerpt / First Verse Body
    const firstPage = prayer.pages?.[0] || {};
    const textPali = firstPage.pali || prayer.description || '';
    const textThai = firstPage.thai || '';

    const paliStartY = dividerY + 36;
    ctx.font = '21px "Sarabun", sans-serif';
    ctx.fillStyle = '#f59e0b';
    const paliEndY = this.wrapText(ctx, textPali, width / 2, paliStartY, width - 140, 32, 5);

    if (textThai) {
      const thaiStartY = Math.max(paliEndY + 22, 500);
      ctx.font = '17px "Sarabun", sans-serif';
      ctx.fillStyle = '#a89d8f';
      this.wrapText(ctx, `"${textThai}"`, width / 2, thaiStartY, width - 160, 28, 4);
    }

    // 8. User Stats & Merit Badge Box (Local Device Timezone)
    const trackerData = storage.getTrackerData();
    const count = trackerData.totalCounts[prayer.id] || 1;
    const streak = trackerData.streakDays || 1;

    const badgeY = height - 230;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    this.roundRect(ctx, width / 2 - 250, badgeY, 500, 90, 16, true, true);

    ctx.font = 'bold 22px "Prompt", sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText(`✨ สวดมนต์สะสม ${count} จบ • ต่อเนื่อง ${streak} วัน ✨`, width / 2, badgeY + 42);

    ctx.font = '16px "Sarabun", sans-serif';
    ctx.fillStyle = '#e5e7eb';
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(`บันทึกบุญบารมี ณ วันที่ ${dateStr}`, width / 2, badgeY + 70);

    // 9. Footer Blessing
    ctx.font = 'italic 16px "Sarabun", sans-serif';
    ctx.fillStyle = '#9b8a78';
    ctx.fillText('ขออานิสงส์แห่งการเจริญพระพุทธมนต์ จงดลบันดาลให้ท่านมีความสุข สงบ และเจริญด้วยธรรม', width / 2, height - 70);

    return this.canvas.toDataURL('image/png');
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 5) {
    if (!text) return y;
    const lines = text.split('\n');
    let curY = y;
    let totalRendered = 0;

    for (let i = 0; i < lines.length; i++) {
      if (totalRendered >= maxLines) break;
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      let tokens = [];
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        try {
          const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
          tokens = Array.from(segmenter.segment(rawLine), s => s.segment);
        } catch (e) {
          tokens = rawLine.split(' ');
        }
      } else {
        tokens = rawLine.split(' ');
      }

      let currentLine = '';
      for (let n = 0; n < tokens.length; n++) {
        const token = tokens[n];
        const testLine = currentLine + token;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.length > 0) {
          ctx.fillText(currentLine.trim(), x, curY);
          currentLine = token;
          curY += lineHeight;
          totalRendered++;
          if (totalRendered >= maxLines) break;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.length > 0 && totalRendered < maxLines) {
        ctx.fillText(currentLine.trim(), x, curY);
        curY += lineHeight;
        totalRendered++;
      }
    }
    return curY;
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  downloadCard(filename = 'dhamma-card.png') {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

export const shareEngine = new DhammaShareEngine();
