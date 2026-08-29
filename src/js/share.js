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
    ctx.font = 'bold 22px "Prompt", sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('❖ ธรรมะ E-BOOK • TAMMA OS ❖', width / 2, 85);

    // 5. Prayer Title
    ctx.font = 'bold 36px "Prompt", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(prayer.title, width / 2, 160);

    // Category / Origin Subtitle
    ctx.font = '20px "Sarabun", sans-serif';
    ctx.fillStyle = '#d1c5b8';
    ctx.fillText(prayer.author || prayer.category || 'บทสวดมนต์อันเป็นมงคล', width / 2, 205);

    // 6. Dividing Ornament Line
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, 235);
    ctx.lineTo(width / 2 + 120, 235);
    ctx.stroke();

    // 7. Key Excerpt / First Verse Body
    const firstPage = prayer.pages?.[0] || {};
    const textPali = firstPage.pali || prayer.description || '';
    const textThai = firstPage.thai || '';

    ctx.font = '22px "Sarabun", sans-serif';
    ctx.fillStyle = '#f59e0b';
    this.wrapText(ctx, textPali, width / 2, 310, width - 140, 36);

    if (textThai) {
      ctx.font = '18px "Sarabun", sans-serif';
      ctx.fillStyle = '#a89d8f';
      this.wrapText(ctx, `"${textThai}"`, width / 2, 540, width - 160, 30);
    }

    // 8. User Stats & Merit Badge Box
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

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = text.split('\n');
    let curY = y;

    for (let i = 0; i < lines.length && curY < y + 200; i++) {
      const line = lines[i];
      const words = line.split(' ');
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(currentLine.trim(), x, curY);
          currentLine = words[n] + ' ';
          curY += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      ctx.fillText(currentLine.trim(), x, curY);
      curY += lineHeight;
    }
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
