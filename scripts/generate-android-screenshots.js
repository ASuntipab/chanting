import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8098;
const ROOT_DIR = process.cwd();
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.br': 'application/x-brotli',
  '.wasm': 'application/wasm'
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/' || reqPath === '') {
        reqPath = '/tamma.html';
      }

      let filePath = path.join(ROOT_DIR, reqPath);
      if (!fs.existsSync(filePath)) {
        const wwwPath = path.join(ROOT_DIR, 'www', reqPath);
        if (fs.existsSync(wwwPath)) filePath = wwwPath;
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      });
    });

    server.listen(PORT, () => {
      console.log(`Android Internal server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// Injects authentic Android Material Status Bar and Gesture Bar
async function setupAndroidDecorations(page, isDark = true) {
  await page.evaluate((isDark) => {
    document.documentElement.style.setProperty('--safe-top', '36px');
    document.documentElement.style.setProperty('--safe-bottom', '24px');

    let oldBar = document.getElementById('android-mock-statusbar');
    if (oldBar) oldBar.remove();
    let oldHome = document.getElementById('android-mock-homebar');
    if (oldHome) oldHome.remove();

    const textColor = isDark ? '#ffffff' : '#2b1d0c';

    const statusBar = document.createElement('div');
    statusBar.id = 'android-mock-statusbar';
    statusBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 18px 0 18px;
      font-family: 'Roboto', -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: ${textColor};
      z-index: 999999;
      pointer-events: none;
      box-sizing: border-box;
    `;

    statusBar.innerHTML = `
      <div style="letter-spacing: 0.1px;">9:41</div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <!-- 5G Badge -->
        <span style="font-size: 11px; font-weight: 700; letter-spacing: -0.5px;">5G</span>
        <!-- Android Wifi -->
        <svg width="15" height="12" viewBox="0 0 24 24" fill="${textColor}">
          <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3c3.78 0 7.22 1.47 9.77 3.89L12 18.66 2.23 10.89C4.78 8.47 8.22 7 12 7z"/>
        </svg>
        <!-- Android Vertical Battery -->
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 4px; height: 1.5px; background: ${textColor}; border-radius: 1px 1px 0 0;"></div>
          <div style="width: 10px; height: 14px; border: 1.5px solid ${textColor}; border-radius: 2px; padding: 1px; box-sizing: border-box;">
            <div style="width: 100%; height: 100%; background: ${textColor}; border-radius: 0.5px;"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(statusBar);

    // Android Gesture Navigation Pill Bar
    const homeBar = document.createElement('div');
    homeBar.id = 'android-mock-homebar';
    homeBar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      padding-bottom: 6px;
      z-index: 999999;
      pointer-events: none;
      box-sizing: border-box;
    `;
    homeBar.innerHTML = `
      <div style="width: 72px; height: 4px; background: ${isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)'}; border-radius: 4px;"></div>
    `;
    document.body.appendChild(homeBar);
  }, isDark);
}

// Generate the 1024 x 500 Google Play Feature Graphic
async function generateFeatureGraphic(browser, serverUrl, outDir) {
  console.log('Generating Google Play Feature Graphic (1024 x 500)...');
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });

  // Read icon-512 as base64
  const iconPath = path.join(ROOT_DIR, 'src', 'assets', 'icon-512.png');
  const iconBase64 = fs.existsSync(iconPath) ? fs.readFileSync(iconPath).toString('base64') : '';

  const html = `
  <!DOCTYPE html>
  <html lang="th">
  <head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800&family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1024px;
        height: 500px;
        overflow: hidden;
        background: #0d0a14;
        font-family: 'Sarabun', sans-serif;
        color: #fdfaf6;
        display: flex;
        position: relative;
      }
      /* Cosmic Nebula Glows */
      .glow-gold {
        position: absolute;
        top: -60px;
        right: 180px;
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(212, 175, 55, 0.28) 0%, rgba(14, 20, 44, 0) 70%);
        filter: blur(40px);
        pointer-events: none;
      }
      .glow-lotus {
        position: absolute;
        bottom: -100px;
        left: -50px;
        width: 450px;
        height: 450px;
        background: radial-gradient(circle, rgba(244, 114, 182, 0.22) 0%, rgba(13, 10, 20, 0) 70%);
        filter: blur(50px);
        pointer-events: none;
      }
      .glow-cyan {
        position: absolute;
        top: 20%;
        right: -80px;
        width: 350px;
        height: 350px;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(13, 10, 20, 0) 70%);
        filter: blur(40px);
        pointer-events: none;
      }

      /* Content Container */
      .content {
        position: relative;
        z-index: 10;
        width: 610px;
        padding: 55px 0 50px 60px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      
      .brand-row {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .app-icon {
        width: 92px;
        height: 92px;
        border-radius: 22px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(212, 175, 55, 0.4);
        border: 2px solid rgba(251, 191, 36, 0.5);
      }
      .title-group h1 {
        font-family: 'Prompt', sans-serif;
        font-size: 42px;
        font-weight: 800;
        letter-spacing: -0.5px;
        background: linear-gradient(135deg, #ffffff 0%, #fef3c7 50%, #fbbf24 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1.15;
      }
      .title-group .app-tag {
        font-size: 16px;
        font-weight: 500;
        color: #d1c5b8;
        margin-top: 4px;
        letter-spacing: 0.2px;
      }

      .description {
        font-size: 17px;
        line-height: 1.5;
        color: #e2e8f0;
        margin: 15px 0 20px 0;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }

      .badges-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: rgba(30, 24, 40, 0.65);
        border: 1px solid rgba(251, 191, 36, 0.35);
        backdrop-filter: blur(8px);
        padding: 8px 16px;
        border-radius: 100px;
        font-size: 13.5px;
        font-weight: 600;
        color: #fef08a;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      }
      .badge-icon {
        font-size: 15px;
      }

      /* Right Mockup Showcase */
      .mockup-wrap {
        position: absolute;
        right: 45px;
        top: 30px;
        bottom: -60px;
        width: 320px;
        perspective: 1000px;
        z-index: 10;
      }
      .phone-frame {
        width: 290px;
        height: 580px;
        background: #181410;
        border-radius: 40px;
        border: 5px solid rgba(251, 191, 36, 0.45);
        box-shadow: 
          0 25px 50px rgba(0, 0, 0, 0.8),
          0 0 40px rgba(212, 175, 55, 0.25);
        overflow: hidden;
        transform: rotate(-5deg) translateY(10px);
        padding: 20px 16px;
        box-sizing: border-box;
      }
      .phone-header {
        font-family: 'Prompt', sans-serif;
        color: #fbbf24;
        font-size: 16px;
        font-weight: 700;
        text-align: center;
        border-bottom: 1px solid rgba(251, 191, 36, 0.2);
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .verse-box {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(251, 191, 36, 0.2);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 10px;
      }
      .verse-title {
        font-size: 12px;
        color: #f59e0b;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .verse-pali {
        font-size: 13.5px;
        font-weight: 600;
        color: #fef08a;
        line-height: 1.4;
      }
      .verse-thai {
        font-size: 11px;
        color: #cbd5e1;
        margin-top: 4px;
        line-height: 1.35;
      }
    </style>
  </head>
  <body>
    <div class="glow-gold"></div>
    <div class="glow-lotus"></div>
    <div class="glow-cyan"></div>

    <div class="content">
      <div class="brand-row">
        <img class="app-icon" src="data:image/png;base64,${iconBase64}" alt="Icon">
        <div class="title-group">
          <h1>บทสวดมนต์</h1>
          <div class="app-tag">Chant : คลังบทสวดมนต์ & พระไตรปิฎก ๔๕ เล่ม</div>
        </div>
      </div>

      <div class="description">
        แอปพลิเคชันพุทธศาสนาฉบับสมบูรณ์ พร้อมเสียงสวดมนต์พระสงฆ์จริง<br>
        อ่านสบายตา ไร้โฆษณา และใช้งานได้แบบออฟไลน์ ๑๐๐%
      </div>

      <div class="badges-grid">
        <div class="badge"><span class="badge-icon">🪷</span> ออฟไลน์ ๑๐๐%</div>
        <div class="badge"><span class="badge-icon">🎵</span> มีเสียงพระสวดจริง (MP3)</div>
        <div class="badge"><span class="badge-icon">📖</span> พระไตรปิฎกครบ ๔๕ เล่ม</div>
        <div class="badge"><span class="badge-icon">📊</span> บันทึกสถิติการสวดมนต์</div>
        <div class="badge"><span class="badge-icon">🔊</span> สวดนำคาราโอเกะ (AI TTS)</div>
      </div>
    </div>

    <div class="mockup-wrap">
      <div class="phone-frame">
        <div class="phone-header">✨ พระคาถาชินบัญชร</div>
        <div class="verse-box">
          <div class="verse-title">บทสรรเสริญพระพุทธคุณ</div>
          <div class="verse-pali">ชะยาสะนากะตา พุทธา<br>เชตวา มารัง สะวาหะนัง...</div>
          <div class="verse-thai">พระพุทธเจ้าผู้ทรงชนะพญามารและเสนาทั้งหลาย ประทับนั่งบนบัลลังก์แห่งชัยชนะ</div>
        </div>
        <div class="verse-box">
          <div class="verse-title">บทอัญเชิญพระบารมี</div>
          <div class="verse-pali">ตัณหังกะราทะโย พุทธา<br>อัฏฐะวีสะติ นายะกา...</div>
          <div class="verse-thai">พระพุทธเจ้าทั้ง ๒๘ พระองค์ ผู้เป็นประมุข น้อมอัญเชิญประดิษฐานเหนือเศียรเกล้า</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 600));

  const featureGraphicPath = path.join(outDir, 'feature_graphic_1024x500.png');
  await page.screenshot({ path: featureGraphicPath });
  console.log(`Feature graphic saved to: ${featureGraphicPath}`);
  await page.close();
}

async function run() {
  const server = await startServer();
  const phoneDir = path.join(ROOT_DIR, 'screenshots', 'android_phone_1080x2400');
  const promoDir = path.join(ROOT_DIR, 'screenshots', 'android_feature_graphic_1024x500');
  
  if (!fs.existsSync(phoneDir)) fs.mkdirSync(phoneDir, { recursive: true });
  if (!fs.existsSync(promoDir)) fs.mkdirSync(promoDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  // 0. Generate 1024 x 500 Feature Graphic
  await generateFeatureGraphic(browser, `http://localhost:${PORT}`, promoDir);
  // Also copy to phoneDir for convenience
  fs.copyFileSync(
    path.join(promoDir, 'feature_graphic_1024x500.png'),
    path.join(phoneDir, '00_feature_graphic_1024x500.png')
  );

  const page = await browser.newPage();
  // Android Full HD+ 20:9: 360 x 800 @ 3x = 1080 x 2400 pixels
  await page.setViewport({
    width: 360,
    height: 800,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36');

  console.log('Navigating to app on Android viewport (1080 x 2400)...');
  await page.goto(`http://localhost:${PORT}/tamma.html`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1200));

  // 1. Library (คลังบทสวดมนต์ - Cosmic Theme)
  console.log('Capturing Android 01_library.png...');
  await setupAndroidDecorations(page, true);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(phoneDir, '01_library.png') });

  // 2. Reader Mode (พระคาถาชินบัญชร - Zen Reader)
  console.log('Capturing Android 02_zen_reader.png...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.prayer-card'));
    const chinabanchornCard = cards.find(c => c.textContent.includes('ชินบัญชร')) || cards[0];
    if (chinabanchornCard) chinabanchornCard.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await setupAndroidDecorations(page, true);
  await page.screenshot({ path: path.join(phoneDir, '02_zen_reader.png') });

  // 3. Monastic MP3 Audio Player Deck
  console.log('Capturing Android 03_monastic_audio.png...');
  await page.evaluate(() => {
    const mp3Deck = document.getElementById('mp3PlayerDeck');
    if (mp3Deck) {
      mp3Deck.style.display = 'block';
      const playBtn = document.getElementById('btnMP3Play');
      if (playBtn) playBtn.innerHTML = '⏸️';
      const curTime = document.getElementById('mp3CurrentTime');
      if (curTime) curTime.textContent = '04:18';
      const durTime = document.getElementById('mp3Duration');
      if (durTime) durTime.textContent = '18:32';
      const progress = document.getElementById('mp3ProgressBar');
      if (progress) progress.value = 24;
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await setupAndroidDecorations(page, true);
  await page.screenshot({ path: path.join(phoneDir, '03_monastic_audio.png') });

  // Close reader and hide mp3 deck
  await page.evaluate(() => {
    const mp3Deck = document.getElementById('mp3PlayerDeck');
    if (mp3Deck) mp3Deck.style.display = 'none';
    const closeBtn = document.getElementById('btnCloseReader');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 4. Tipitaka 45 Volumes
  console.log('Capturing Android 04_tipitaka.png...');
  await page.evaluate(() => {
    window.tammaApp.switchTab('tipitaka');
  });
  await new Promise(r => setTimeout(r, 800));
  await setupAndroidDecorations(page, true);
  await page.screenshot({ path: path.join(phoneDir, '04_tipitaka.png') });

  // 5. Daily Tracker / Habit
  console.log('Capturing Android 05_daily_tracker.png...');
  await page.evaluate(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    localStorage.setItem('tamma_tracker_v1', JSON.stringify({
      todayDate: todayStr,
      streakDays: 7,
      lastChantedDate: todayStr,
      todayChanted: {
        'lp-charan-complete-set': true,
        'somdet-toh-collection': true,
        'lp-charan-ahosikarma': true
      },
      totalCounts: {
        'lp-charan-complete-set': 21,
        'somdet-toh-collection': 14,
        'lp-charan-ahosikarma': 49
      }
    }));
    window.tammaApp.switchTab('tracker');
  });
  await new Promise(r => setTimeout(r, 800));
  await setupAndroidDecorations(page, true);
  await page.screenshot({ path: path.join(phoneDir, '05_daily_tracker.png') });

  // 6. Ancient Parchment Theme (คัมภีร์ใบลาน สบายตา)
  console.log('Capturing Android 06_parchment_theme.png...');
  await page.evaluate(() => {
    document.body.className = 'theme-parchment';
    window.tammaApp.switchTab('library');
  });
  await new Promise(r => setTimeout(r, 800));
  await setupAndroidDecorations(page, false);
  await page.screenshot({ path: path.join(phoneDir, '06_parchment_theme.png') });

  // 7. Golden Temple Theme (ธีมทองคำอร่าม)
  console.log('Capturing Android 07_golden_theme.png...');
  await page.evaluate(() => {
    document.body.className = 'theme-gold';
    window.tammaApp.switchTab('library');
  });
  await new Promise(r => setTimeout(r, 800));
  await setupAndroidDecorations(page, true);
  await page.screenshot({ path: path.join(phoneDir, '07_golden_theme.png') });

  console.log('All Android screenshots and feature graphic generated successfully!');
  await browser.close();
  server.close();
}

run().catch(err => {
  console.error('Android capture error:', err);
  process.exit(1);
});
