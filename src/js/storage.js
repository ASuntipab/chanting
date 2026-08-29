/**
 * Tamma OS - Storage & State Engine
 * LocalStorage & Offline-First Persistence with Cloud Sync capability
 */

import { DEFAULT_PRAYERS as BUDDHIST_PRAYERS } from './default-prayers.js';
import { SCRAPED_PRAYERS } from './scraped-prayers.js';

const DEFAULT_PRAYERS = [...BUDDHIST_PRAYERS, ...SCRAPED_PRAYERS];

const STORAGE_KEYS = {
  PRAYERS: 'tamma_prayers_v1',
  PENDING_PRAYERS: 'tamma_pending_prayers_v1',
  FAVORITES: 'tamma_favorites_v1',
  TRACKER: 'tamma_tracker_v1',
  SETTINGS: 'tamma_settings_v1',
  ADMIN_AUTH: 'tamma_admin_auth_v1'
};

class DhammaStorageEngine {
  constructor() {
    this.init();
  }

  init() {
    // Seed, update, and merge default prayers so latest versions are always loaded
    const existing = this.getPrayers();
    if (!existing || existing.length === 0) {
      this.save(STORAGE_KEYS.PRAYERS, DEFAULT_PRAYERS);
    } else {
      const defaultMap = new Map(DEFAULT_PRAYERS.map(p => [p.id, p]));
      let updated = false;

      // 1. Update existing default prayers with latest complete content
      const merged = existing.map(p => {
        if (defaultMap.has(p.id)) {
          const latest = defaultMap.get(p.id);
          // If page count changed or content improved, upgrade it
          if (!p.pages || p.pages.length !== latest.pages.length || p.title !== latest.title) {
            updated = true;
            return { ...p, ...latest };
          }
        }
        return p;
      });

      // 2. Add any newly introduced default prayers
      const existingIds = new Set(merged.map(p => p.id));
      DEFAULT_PRAYERS.forEach(dp => {
        if (!existingIds.has(dp.id)) {
          merged.push(dp);
          updated = true;
        }
      });

      if (updated) {
        this.save(STORAGE_KEYS.PRAYERS, merged);
      }
    }
  }

  // Generic Safe Storage Helpers
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
      return false;
    }
  }

  // --- Prayers API ---
  getPrayers() {
    return this.get(STORAGE_KEYS.PRAYERS, []);
  }

  getPrayerById(id) {
    const prayers = this.getPrayers();
    return prayers.find(p => p.id === id) || null;
  }

  savePrayer(prayer) {
    prayer.status = 'approved';
    const prayers = this.getPrayers();
    const idx = prayers.findIndex(p => p.id === prayer.id);
    if (idx >= 0) {
      prayers[idx] = prayer;
    } else {
      prayers.unshift(prayer);
    }
    this.save(STORAGE_KEYS.PRAYERS, prayers);
    return prayer;
  }

  deletePrayer(id) {
    const prayers = this.getPrayers().filter(p => p.id !== id);
    this.save(STORAGE_KEYS.PRAYERS, prayers);
  }

  // --- Export & Import User Data Backup API (Favorites, Stats & Settings only) ---
  exportData() {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      favorites: this.getFavorites(),
      tracker: this.getTrackerData(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  exportBackupCode() {
    const jsonStr = this.exportData();
    return btoa(encodeURIComponent(jsonStr));
  }

  importData(rawJson) {
    try {
      let data = rawJson;
      if (typeof rawJson === 'string') {
        rawJson = rawJson.trim();
        // Check if Base64 string
        if (rawJson.startsWith('{') || rawJson.startsWith('[')) {
          data = JSON.parse(rawJson);
        } else {
          try {
            data = JSON.parse(decodeURIComponent(atob(rawJson)));
          } catch {
            data = JSON.parse(rawJson);
          }
        }
      }

      if (!data || typeof data !== 'object') {
        throw new Error('โครงสร้างข้อมูลไม่ถูกต้อง');
      }

      // 1. Restore Favorites
      if (Array.isArray(data.favorites)) {
        const currentFavs = new Set(this.getFavorites());
        data.favorites.forEach(f => currentFavs.add(f));
        this.save(STORAGE_KEYS.FAVORITES, Array.from(currentFavs));
      }

      // 2. Restore Tracker & Stats
      if (data.tracker && typeof data.tracker === 'object') {
        const currentTracker = this.getTrackerData();
        if (data.tracker.totalCounts) {
          currentTracker.totalCounts = { ...currentTracker.totalCounts, ...data.tracker.totalCounts };
        }
        if (data.tracker.todayChanted) {
          currentTracker.todayChanted = { ...currentTracker.todayChanted, ...data.tracker.todayChanted };
        }
        currentTracker.streakDays = Math.max(currentTracker.streakDays || 1, data.tracker.streakDays || 1);
        this.save(STORAGE_KEYS.TRACKER, currentTracker);
      }

      // 3. Restore Settings
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings(data.settings);
      }

      return { success: true };
    } catch (e) {
      console.error('Import error:', e);
      return { success: false, error: e.message };
    }
  }

  approvePendingPrayer(id) {
    const pending = this.getPendingPrayers();
    const target = pending.find(p => p.id === id);
    if (target) {
      target.status = 'approved';
      this.savePrayer(target);
      this.save(STORAGE_KEYS.PENDING_PRAYERS, pending.filter(p => p.id !== id));
      return true;
    }
    return false;
  }

  rejectPendingPrayer(id) {
    const pending = this.getPendingPrayers().filter(p => p.id !== id);
    this.save(STORAGE_KEYS.PENDING_PRAYERS, pending);
    return true;
  }

  // --- Favorites API ---
  getFavorites() {
    return this.get(STORAGE_KEYS.FAVORITES, []);
  }

  isFavorite(prayerId) {
    const favs = this.getFavorites();
    return favs.includes(prayerId);
  }

  toggleFavorite(prayerId) {
    let favs = this.getFavorites();
    if (favs.includes(prayerId)) {
      favs = favs.filter(id => id !== prayerId);
    } else {
      favs.push(prayerId);
    }
    this.save(STORAGE_KEYS.FAVORITES, favs);
    return this.isFavorite(prayerId);
  }

  // --- Daily Tracker & Chanting Counter API (Local Device Timezone) ---
  getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayDateString() {
    return this.getLocalDateString(new Date());
  }

  getTrackerData() {
    const todayStr = this.getTodayDateString();
    const defaultData = {
      todayDate: todayStr,
      todayChanted: {},   // { [prayerId]: boolean }
      totalCounts: {},    // { [prayerId]: number }
      streakDays: 1,
      lastChantedDate: todayStr,
      history: []
    };
    const data = this.get(STORAGE_KEYS.TRACKER, defaultData);
    
    // Auto reset today checklist if local calendar date changed
    if (data.todayDate !== todayStr) {
      data.todayDate = todayStr;
      data.todayChanted = {};
      this.save(STORAGE_KEYS.TRACKER, data);
    }
    return data;
  }

  toggleTodayChanted(prayerId) {
    const data = this.getTrackerData();
    const current = !!data.todayChanted[prayerId];
    data.todayChanted[prayerId] = !current;
    
    if (!current) {
      // If toggled to true, increment count once
      data.totalCounts[prayerId] = (data.totalCounts[prayerId] || 0) + 1;
      this.updateStreak(data);
    }
    
    this.save(STORAGE_KEYS.TRACKER, data);
    return data;
  }

  incrementPrayerCount(prayerId, amount = 1) {
    const data = this.getTrackerData();
    data.totalCounts[prayerId] = (data.totalCounts[prayerId] || 0) + amount;
    data.todayChanted[prayerId] = true;
    this.updateStreak(data);
    this.save(STORAGE_KEYS.TRACKER, data);
    return data.totalCounts[prayerId];
  }

  updateStreak(data) {
    const todayStr = this.getTodayDateString();
    if (data.lastChantedDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = this.getLocalDateString(yesterday);
      
      if (data.lastChantedDate === yestStr) {
        data.streakDays = (data.streakDays || 0) + 1;
      } else {
        data.streakDays = 1;
      }
      data.lastChantedDate = todayStr;
    }
  }

  // --- Settings API ---
  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS, {
      theme: 'cosmic',
      fontSize: 1.15,
      soundEnabled: true
    });
  }

  saveSettings(settings) {
    const current = this.getSettings();
    const merged = { ...current, ...settings };
    this.save(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  }

  // --- Admin Role API ---
  isAdmin() {
    return this.get(STORAGE_KEYS.ADMIN_AUTH, false);
  }

  setAdmin(status) {
    this.save(STORAGE_KEYS.ADMIN_AUTH, !!status);
    return status;
  }
}

export const storage = new DhammaStorageEngine();
