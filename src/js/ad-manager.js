/**
 * Tamma OS - Ad Banner Manager (Top-Only AdMob & Web Responsive Banner)
 * Designed for Cross-Platform iOS, Android & Modern Web
 * Position: Strictly Top-Only (BannerAdPosition.TOP_CENTER)
 */

export const BANNER_POSITION = {
  TOP_CENTER: 'TOP_CENTER'
};

export const AD_CONFIG = {
  // Standard Test Ad Unit IDs (AdMob)
  androidBannerId: 'ca-app-pub-3940256099942544/6300978111',
  iosBannerId: 'ca-app-pub-3940256099942544/2934735716',
  position: BANNER_POSITION.TOP_CENTER,
  isTesting: true,
  autoShow: true
};

export class AdManager {
  constructor(config = {}) {
    this.config = { ...AD_CONFIG, ...config };
    this.isVisible = false;
    this.isNative = typeof window !== 'undefined' && 
                    Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    this.adMobPlugin = null;
    this.containerEl = null;
  }

  /**
   * Initialize the Ad Manager
   * Resolves AdMob plugin if native, otherwise configures Web Top Banner container
   */
  async init() {
    if (typeof window === 'undefined') return;

    this.containerEl = document.getElementById('topAdBanner');

    if (this.isNative && window.Capacitor?.Plugins?.AdMob) {
      try {
        this.adMobPlugin = window.Capacitor.Plugins.AdMob;
        await this.adMobPlugin.initialize({
          requestTrackingAuthorization: true,
          testingDevices: ['2077ef8a63d5286eee25870b4f27ad61'],
          initializeForTesting: this.config.isTesting
        });

        if (this.config.autoShow) {
          await this.showNativeBanner();
        }
        return;
      } catch (e) {
        console.warn('AdMob native initialization failed, falling back to Web Top Banner:', e);
      }
    }

    // Web / Responsive Fallback
    if (this.config.autoShow) {
      this.renderWebBanner();
    }
  }

  /**
   * Get the current banner placement position (strictly Top-Only)
   */
  getPosition() {
    return this.config.position;
  }

  /**
   * Show Native Banner via AdMob at TOP_CENTER position
   */
  async showNativeBanner() {
    if (!this.adMobPlugin) return false;
    try {
      const isIos = window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios';
      const adId = isIos ? this.config.iosBannerId : this.config.androidBannerId;

      await this.adMobPlugin.showBanner({
        adId: adId,
        adSize: 'BANNER',
        position: this.config.position, // 'TOP_CENTER'
        margin: 0,
        isTesting: this.config.isTesting
      });
      this.isVisible = true;
      if (this.containerEl) {
        this.containerEl.style.display = 'none'; // Native banner overlays top, hide DOM placeholder
      }
      return true;
    } catch (e) {
      console.warn('Failed to show native AdMob banner:', e);
      this.renderWebBanner();
      return false;
    }
  }

  /**
   * Render Web Top Responsive Banner Fallback
   */
  renderWebBanner() {
    if (typeof document === 'undefined') return;
    this.containerEl = this.containerEl || document.getElementById('topAdBanner');
    if (!this.containerEl) return;

    this.containerEl.innerHTML = `
      <div class="ad-banner-inner" role="complementary" aria-label="พื้นที่โฆษณา">
        <span class="ad-badge">โฆษณา</span>
        <div class="ad-content-slot">
          <div class="ad-dharma-promo">
            <span class="ad-promo-icon">🪷</span>
            <span class="ad-promo-text">สนับสนุนแอปพลิเคชันบทสวดมนต์ & ธรรมทาน</span>
          </div>
        </div>
      </div>
    `;
    this.containerEl.style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Set custom HTML or advertising code inside the top banner slot
   */
  setCustomAd(htmlContent) {
    if (typeof document === 'undefined') return;
    this.containerEl = this.containerEl || document.getElementById('topAdBanner');
    if (!this.containerEl) return;

    this.containerEl.innerHTML = `
      <div class="ad-banner-inner" role="complementary" aria-label="พื้นที่โฆษณา">
        <span class="ad-badge">โฆษณา</span>
        <div class="ad-content-slot">
          ${htmlContent}
        </div>
      </div>
    `;
    this.containerEl.style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Hide Top Banner
   */
  async hideBanner() {
    if (this.adMobPlugin) {
      try {
        await this.adMobPlugin.hideBanner();
      } catch (e) {}
    }
    if (this.containerEl) {
      this.containerEl.style.display = 'none';
    }
    this.isVisible = false;
  }

  /**
   * Resume/Show Top Banner
   */
  async showBanner() {
    if (this.isNative && this.adMobPlugin) {
      await this.showNativeBanner();
    } else {
      this.renderWebBanner();
    }
  }

  /**
   * Check if banner is currently active/visible
   */
  isBannerVisible() {
    return this.isVisible;
  }
}

export const adManager = new AdManager();
