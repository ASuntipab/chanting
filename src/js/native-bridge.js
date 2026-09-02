/**
 * Tamma OS - Native Mobile Bridge (iOS & Android)
 * Connects Capacitor Native Plugins with Universal Web Fallbacks
 * 100% Cross-Platform Native Mobile Compliant
 */

class NativeMobileBridge {
  constructor() {
    this.isNative = typeof window !== 'undefined' && 
                    window.Capacitor && 
                    window.Capacitor.isNativePlatform && 
                    window.Capacitor.isNativePlatform();
    this.hapticsPlugin = null;
    this.keepAwakePlugin = null;
    this.statusBarPlugin = null;
    this.localNotificationsPlugin = null;
    this.preferencesPlugin = null;
  }

  async init() {
    if (typeof window !== 'undefined' && window.Capacitor) {
      const Plugins = window.Capacitor.Plugins || {};
      this.hapticsPlugin = Plugins.Haptics;
      this.keepAwakePlugin = Plugins.KeepAwake;
      this.statusBarPlugin = Plugins.StatusBar;
      this.localNotificationsPlugin = Plugins.LocalNotifications;
      this.preferencesPlugin = Plugins.Preferences;
      this.splashScreenPlugin = Plugins.SplashScreen;

      // Apply Native Status Bar Style
      if (this.statusBarPlugin) {
        try {
          await this.statusBarPlugin.setStyle({ style: 'DARK' });
          await this.statusBarPlugin.setBackgroundColor({ color: '#181411' });
        } catch (e) {}
      }

      // Hide Splash Screen immediately once app web runtime is ready
      if (this.splashScreenPlugin) {
        try {
          await this.splashScreenPlugin.hide();
        } catch (e) {}
      }
    }
  }

  /**
   * Native Haptic Feedback (Taptic Engine on iOS & Haptic Motor on Android)
   */
  async hapticImpact(style = 'LIGHT') {
    try {
      if (this.hapticsPlugin) {
        await this.hapticsPlugin.impact({ style: style.toUpperCase() });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch (e) {}
  }

  async hapticSuccess() {
    try {
      if (this.hapticsPlugin) {
        await this.hapticsPlugin.notification({ type: 'SUCCESS' });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 50, 20]);
      }
    } catch (e) {}
  }

  /**
   * Keep Screen Awake (Prevent screen from turning off while chanting)
   */
  async setKeepAwake(enable = true) {
    try {
      if (this.keepAwakePlugin) {
        if (enable) {
          await this.keepAwakePlugin.keepAwake();
        } else {
          await this.keepAwakePlugin.allowSleep();
        }
      }
    } catch (e) {}
  }

  /**
   * Native Local Notification for Daily Chanting Alarms
   */
  async scheduleChantingReminder(title, body, scheduleTime) {
    try {
      if (this.localNotificationsPlugin) {
        await this.localNotificationsPlugin.requestPermissions();
        await this.localNotificationsPlugin.schedule({
          notifications: [
            {
              title: title || '🙏 ได้เวลาสวดมนต์ประจำวัน',
              body: body || 'เจริญสมาธิภาวนา สร้างบุญบารมีวันนี้',
              id: Math.floor(Date.now() % 100000),
              schedule: { at: scheduleTime || new Date(Date.now() + 1000 * 60) },
              sound: null,
              actionTypeId: '',
              extra: null
            }
          ]
        });
        return true;
      }
    } catch (e) {
      console.warn('Local notification scheduling failed:', e);
    }
    return false;
  }
}

export const nativeBridge = new NativeMobileBridge();
