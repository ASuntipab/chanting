/**
 * Tamma OS - Tipitaka Brotli (.br) & JSON Lazy Loader Engine
 * Seamlessly fetches and parses 45-Volume Tipitaka datasets with automatic .br decompression support.
 */

class TipitakaLoaderEngine {
  constructor() {
    this.basePath = './src/data/tipitaka';
    this.indexCache = null;
    this.volumeCache = new Map();
  }

  /**
   * Set custom base path for loading assets (e.g. for testing or production builds)
   */
  setBasePath(customPath) {
    this.basePath = customPath;
  }

  /**
   * Load the master 45-Volume Tipitaka Index
   */
  async loadIndex() {
    if (this.indexCache) {
      return this.indexCache;
    }

    try {
      const data = await this._fetchJsonOrBr('index');
      this.indexCache = data;
      return data;
    } catch (err) {
      console.error('Failed to load Tipitaka index:', err);
      throw err;
    }
  }

  /**
   * Load a specific volume (1 to 45) with lazy caching
   * @param {number|string} volumeNumber 
   */
  async loadVolume(volumeNumber) {
    const volNum = parseInt(volumeNumber, 10);
    if (isNaN(volNum) || volNum < 1 || volNum > 45) {
      throw new Error(`Invalid Tipitaka volume number: ${volumeNumber}. Must be between 1 and 45.`);
    }

    if (this.volumeCache.has(volNum)) {
      return this.volumeCache.get(volNum);
    }

    const volStr = String(volNum).padStart(2, '0');
    const data = await this._fetchJsonOrBr(`vol_${volStr}`);
    this.volumeCache.set(volNum, data);
    return data;
  }

  /**
   * Quick search across all 45 volumes
   * @param {string} query Search keyword
   */
  async search(query) {
    if (!query || !query.trim()) return [];
    const cleanQuery = query.trim().toLowerCase();
    const index = await this.loadIndex();
    
    return index.volumes.filter(vol => {
      const matchTitle = vol.bookTitle && vol.bookTitle.toLowerCase().includes(cleanQuery);
      const matchPali = vol.bookPali && vol.bookPali.toLowerCase().includes(cleanQuery);
      const matchPitaka = vol.pitaka && vol.pitaka.toLowerCase().includes(cleanQuery);
      const matchDesc = vol.description && vol.description.toLowerCase().includes(cleanQuery);
      const matchVolNum = String(vol.volume) === cleanQuery || `เล่ม ${vol.volume}` === cleanQuery || `เล่มที่ ${vol.volume}` === cleanQuery;
      return matchTitle || matchPali || matchPitaka || matchDesc || matchVolNum;
    });
  }

  /**
   * Internal helper to load JSON with fallback
   */
  async _fetchJsonOrBr(filePrefix) {
    // 1. In Node.js environment (for tests and SSR)
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const zlib = await import('node:zlib');

      const brPath = path.resolve(this.basePath, `${filePrefix}.json.br`);
      if (fs.existsSync(brPath)) {
        const compressed = fs.readFileSync(brPath);
        const decompressed = zlib.brotliDecompressSync(compressed).toString('utf-8');
        return JSON.parse(decompressed);
      }

      const jsonPath = path.resolve(this.basePath, `${filePrefix}.json`);
      if (fs.existsSync(jsonPath)) {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      }

      throw new Error(`Node FS: file not found for ${filePrefix} in ${this.basePath}`);
    }

    // 2. In browser environment with fetch
    if (typeof fetch === 'function') {
      // Try fetching the .json.br first (served with Content-Encoding: br by server)
      try {
        const res = await fetch(`${this.basePath}/${filePrefix}.json.br`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // Fallback to standard .json
      }

      const fallbackRes = await fetch(`${this.basePath}/${filePrefix}.json`);
      if (!fallbackRes.ok) {
        throw new Error(`HTTP Error ${fallbackRes.status} loading ${filePrefix}.json`);
      }
      return await fallbackRes.json();
    }

    throw new Error(`Unable to load dataset for ${filePrefix}`);
  }
}

export const tipitakaLoader = new TipitakaLoaderEngine();
export { TipitakaLoaderEngine };
