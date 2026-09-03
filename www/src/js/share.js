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
      title: `${prayer.title} - บทสวดมนต์`,
      text: `🙏 ขอเชิญร่วมสวดมนต์บท "${prayer.title}"\nกดลิงก์ด้านล่างเพื่อเพิ่มเข้าคลังบทสวดมนต์ของคุณได้ฟรี:`,
      url: shareUrl
    };

    let fullPrayerText = '';
    if (prayer.pages && prayer.pages.length > 0) {
      fullPrayerText = prayer.pages.map(p => {
        let text = '';
        if (p.verseTitle) text += `[ ${p.verseTitle} ]\n`;
        if (p.pali) text += `${p.pali.replace(/<br>/g, '\n')}\n`;
        if (p.thai) text += `${p.thai.replace(/<br>/g, '\n')}\n`;
        return text.trim();
      }).join('\n\n');
    } else {
      fullPrayerText = prayer.description || '';
    }
    
    const combinedText = `${shareData.text}\n${shareData.url}\n\n=== เนื้อหาบทสวด ===\n${fullPrayerText}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: combinedText,
        });
        return true;
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('Share error:', e);
        }
      }
    }

    // Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(combinedText);
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

    // 3. Sacred Golden Lotus Mandala Watermark (Vector Path, No Emoji Fallback Bugs)
    this.drawLotusWatermark(ctx, width / 2, height / 2 - 40, 95);

    // 4. Header & App Branding (Strictly Centered)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 22px "Prompt", sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('❖ บทสวดมนต์ ❖', width / 2, 85);

    // 5. Prayer Title (Strict Auto-fitting to Max 640px Width)
    const titleText = prayer.title || 'บทสวดมนต์อันเป็นมงคล';
    let titleFontSize = 28;
    ctx.font = `bold ${titleFontSize}px "Prompt", sans-serif`;
    while (ctx.measureText(titleText).width > 640 && titleFontSize > 17) {
      titleFontSize -= 1;
      ctx.font = `bold ${titleFontSize}px "Prompt", sans-serif`;
    }

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const titleEndY = this.wrapText(ctx, titleText, width / 2, 140, 640, titleFontSize * 1.35, 2);

    // Category / Origin Subtitle
    const subtitleY = titleEndY + 28;
    ctx.font = '18px "Sarabun", sans-serif';
    ctx.fillStyle = '#d1c5b8';
    ctx.textAlign = 'center';
    ctx.fillText(prayer.author || prayer.category || 'บทสวดมนต์อันเป็นมงคล', width / 2, subtitleY);

    // 6. Dividing Ornament Line (Centered)
    const dividerY = subtitleY + 20;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 130, dividerY);
    ctx.lineTo(width / 2 + 130, dividerY);
    ctx.stroke();

    // 7. Key Excerpt / First Verse Body
    const firstPage = prayer.pages?.[0] || {};
    const textPali = firstPage.pali || prayer.description || '';
    const textThai = firstPage.thai || '';

    const paliStartY = dividerY + 36;
    ctx.font = '21px "Sarabun", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    const paliEndY = this.wrapText(ctx, textPali, width / 2, paliStartY, 660, 32, 5);

    if (textThai) {
      const thaiStartY = Math.max(paliEndY + 24, 490);
      ctx.font = '17px "Sarabun", sans-serif';
      ctx.fillStyle = '#a89d8f';
      ctx.textAlign = 'center';
      this.wrapText(ctx, `"${textThai}"`, width / 2, thaiStartY, 660, 28, 4);
    }

    // 8. User Stats & Merit Badge Box (Centered at x = 140, width = 520)
    const trackerData = storage.getTrackerData();
    const count = trackerData.totalCounts[prayer.id] || 1;
    const streak = trackerData.streakDays || 1;

    const badgeWidth = 520;
    const badgeHeight = 90;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = height - 230;

    ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    this.roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 16, true, true);

    ctx.font = 'bold 21px "Prompt", sans-serif';
    ctx.fillStyle = '#d4af37';
    ctx.textAlign = 'center';
    ctx.fillText(`✨ ร่วมเจริญพระพุทธมนต์ สะสมบุญบารมี ✨`, width / 2, badgeY + 40);

    ctx.font = '16px "Sarabun", sans-serif';
    ctx.fillStyle = '#e5e7eb';
    ctx.textAlign = 'center';
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(`บันทึกบุญบารมี ณ วันที่ ${dateStr}`, width / 2, badgeY + 68);

    // 9. Footer Blessing (Strictly Centered)
    ctx.font = 'italic 16px "Sarabun", sans-serif';
    ctx.fillStyle = '#9b8a78';
    ctx.textAlign = 'center';
    ctx.fillText('ขออานิสงส์แห่งการเจริญพระพุทธมนต์ จงดลบันดาลให้ท่านมีความสุข สงบ และเจริญด้วยธรรม', width / 2, height - 70);

    return this.canvas.toDataURL('image/png');
  }

  /**
   * Draws a Sacred Golden Lotus Mandala as high-res vector watermark
   */
  drawLotusWatermark(ctx, cx, cy, radius = 95) {
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.lineWidth = 1.5;

    // 8 Outer Petals
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const angle = (i * Math.PI * 2) / petals;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(radius * 0.35, -radius * 0.6, 0, -radius);
      ctx.quadraticCurveTo(-radius * 0.35, -radius * 0.6, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 8 Inner Petals
    for (let i = 0; i < petals; i++) {
      const angle = (i * Math.PI * 2) / petals + (Math.PI / petals);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(radius * 0.22, -radius * 0.38, 0, -radius * 0.65);
      ctx.quadraticCurveTo(-radius * 0.22, -radius * 0.38, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Center Sacred Core
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.22)';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 5) {
    if (!text) return y;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

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
          ctx.textAlign = 'center';
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
        ctx.textAlign = 'center';
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
