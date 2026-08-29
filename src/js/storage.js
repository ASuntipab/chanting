/**
 * Tamma OS - Storage & State Engine
 * LocalStorage & Offline-First Persistence with Cloud Sync capability
 */

import { DEFAULT_PRAYERS } from './default-prayers.js';

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
    // Seed default prayers if not already present
    const existing = this.getPrayers();
    if (!existing || existing.length === 0) {
      this.save(STORAGE_KEYS.PRAYERS, DEFAULT_PRAYERS);
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
    const prayers = this.getPrayers();
    const idx = prayers.findIndex(p => p.id === prayer.id);
    if (idx >= 0) {
      prayers[idx] = prayer;
    } else {
      prayers.unshift(prayer);
    }
    this.save(STORAGE_KEYS.PRAYERS, prayers);
  }

  deletePrayer(id) {
    const prayers = this.getPrayers().filter(p => p.id !== id);
    this.save(STORAGE_KEYS.PRAYERS, prayers);
  }

  // --- Admin & Pending Prayers API ---
  getPendingPrayers() {
    return this.get(STORAGE_KEYS.PENDING_PRAYERS, []);
  }

  addPendingPrayer(prayer) {
    const pending = this.getPendingPrayers();
    prayer.status = 'pending';
    prayer.createdAt = new Date().toISOString();
    pending.unshift(prayer);
    this.save(STORAGE_KEYS.PENDING_PRAYERS, pending);
    return prayer;
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

  // --- Daily Tracker & Chanting Counter API ---
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
    
    // Auto reset today checklist if date changed
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
      const yestStr = yesterday.toISOString().split('T')[0];
      
      if (data.lastChantedDate === yestStr) {
        data.streakDays = (data.streakDays || 0) + 1;
      } else {
        data.streakDays = 1;
      }
      data.lastChantedDate = todayStr;
    }
  }

  getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }

  // --- Settings API ---
  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS, {
      theme: 'gold',
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
