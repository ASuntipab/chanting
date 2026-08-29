/**
 * Tamma OS - Admin Moderation & Approval Engine
 * Handles Admin Authentication, Approval Queue, Review & Direct Edits
 */

import { storage } from './storage.js';
import { audio } from './audio.js';

export class DhammaAdminEngine {
  constructor() {
    this.adminBadge = document.getElementById('adminBadgeCount');
    this.adminQueueContainer = document.getElementById('adminQueueList');
    this.adminPasscode = 'admin123'; // Default configurable admin passcode
  }

  authenticate(passcode) {
    if (passcode === this.adminPasscode) {
      storage.setAdmin(true);
      return true;
    }
    return false;
  }

  logout() {
    storage.setAdmin(false);
  }

  getPendingCount() {
    return storage.getPendingPrayers().length;
  }

  updateBadge() {
    const count = this.getPendingCount();
    if (this.adminBadge) {
      if (count > 0) {
        this.adminBadge.textContent = count;
        this.adminBadge.style.display = 'inline-block';
      } else {
        this.adminBadge.style.display = 'none';
      }
    }
  }

  renderQueue(onPreviewPrayer) {
    if (!this.adminQueueContainer) return;
    const pending = storage.getPendingPrayers();
    this.updateBadge();

    if (pending.length === 0) {
      this.adminQueueContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">✨</div>
          <div style="font-family: var(--font-header);">ไม่มีบทสวดที่รอการอนุมัติ</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">ทุกบทสวดได้รับการตรวจสอบเรียบร้อยแล้ว</div>
        </div>
      `;
      return;
    }

    this.adminQueueContainer.innerHTML = '';
    pending.forEach(item => {
      const card = document.createElement('div');
      card.className = 'admin-card pending';
      
      const firstPage = item.pages?.[0] || {};
      const sampleText = firstPage.pali || firstPage.thai || firstPage.content || item.description || '';

      card.innerHTML = `
        <div class="admin-card-header">
          <div>
            <div class="admin-card-title">${item.title}</div>
            <div class="admin-card-meta">${item.category || 'ทั่วไป'} • โดย: ${item.author || 'ผู้ใช้นิรนาม'}</div>
          </div>
          <span style="font-size: 0.75rem; color: var(--accent-amber); background: rgba(245, 158, 11, 0.15); padding: 2px 8px; border-radius: 9999px;">
            รออนุมัติ
          </span>
        </div>
        <div class="admin-card-excerpt">
          ${sampleText.substring(0, 160)}...
        </div>
        <div class="admin-card-actions">
          <button class="btn-secondary btn-preview-item" style="padding: 4px 10px; font-size: 0.8rem;">
            👁️ ดูตัวอย่าง E-Book
          </button>
          <button class="btn-reject btn-reject-item" data-id="${item.id}">
            ✕ ไม่อนุมัติ
          </button>
          <button class="btn-approve btn-approve-item" data-id="${item.id}">
            ✓ อนุมัติลงระบบ
          </button>
        </div>
      `;

      // Event Listeners
      card.querySelector('.btn-preview-item')?.addEventListener('click', () => {
        if (onPreviewPrayer) onPreviewPrayer(item);
      });

      card.querySelector('.btn-approve-item')?.addEventListener('click', () => {
        audio.playBell(528);
        storage.approvePendingPrayer(item.id);
        this.renderQueue(onPreviewPrayer);
        window.dispatchEvent(new CustomEvent('tamma:prayer-approved'));
      });

      card.querySelector('.btn-reject-item')?.addEventListener('click', () => {
        if (confirm(`คุณต้องการปฏิเสธบทสวด "${item.title}" ใช่หรือไม่?`)) {
          storage.rejectPendingPrayer(item.id);
          this.renderQueue(onPreviewPrayer);
        }
      });

      this.adminQueueContainer.appendChild(card);
    });
  }
}

export const adminEngine = new DhammaAdminEngine();
