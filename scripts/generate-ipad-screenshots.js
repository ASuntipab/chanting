import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 8097;
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
      console.log(`iPad Internal server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// Injects authentic iPadOS Status Bar and Home Bar
async function setupIPadDecorations(page, isDark = true) {
  await page.evaluate((isDark) => {
    document.documentElement.style.setProperty('--safe-top', '28px');
    document.documentElement.style.setProperty('--safe-bottom', '20px');

    let oldBar = document.getElementById('ipad-mock-statusbar');
    if (oldBar) oldBar.remove();
    let oldHome = document.getElementById('ipad-mock-homebar');
    if (oldHome) oldHome.remove();

    const textColor = isDark ? '#ffffff' : '#2b1d0c';
    const batteryBg = isDark ? '#ffffff' : '#2b1d0c';

    const statusBar = document.createElement('div');
    statusBar.id = 'ipad-mock-statusbar';
    statusBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 24px 0 24px;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      color: ${textColor};
      z-index: 999999;
      pointer-events: none;
      box-sizing: border-box;
    `;

    statusBar.innerHTML = `
      <div style="letter-spacing: -0.1px;">9:41</div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <!-- Wifi Icon -->
        <svg width="15" height="11" viewBox="0 0 16 12" fill="${textColor}">
          <path d="M8 9.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zm0-4.4c2.2 0 4.2.9 5.7 2.4l-1.4 1.4C11.2 7.9 9.7 7.2 8 7.2s-3.2.7-4.3 1.8L2.3 7.6C3.8 6.1 5.8 5.2 8 5.2zm0-4.4c3.5 0 6.6 1.4 8.9 3.7l-1.4 1.4C13.6 4 10.9 2.8 8 2.8S2.4 4 .5 5.9L-.9 4.5C1.4 2.2 4.5.8 8 .8z"/>
        </svg>
        <span style="font-size: 12px; font-weight: 600;">100%</span>
        <!-- Battery Icon -->
        <div style="display: flex; align-items: center; gap: 1px;">
          <div style="width: 22px; height: 11px; border: 1.5px solid ${textColor}; border-radius: 3.5px; padding: 1.5px; box-sizing: border-box;">
            <div style="width: 100%; height: 100%; background: ${batteryBg}; border-radius: 1px;"></div>
          </div>
          <div style="width: 1.5px; height: 4px; background: ${textColor}; border-radius: 0 1px 1px 0;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(statusBar);

    // iPad Home Bar at bottom (wider pill)
    const homeBar = document.createElement('div');
    homeBar.id = 'ipad-mock-homebar';
    homeBar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      padding-bottom: 5px;
      z-index: 999999;
      pointer-events: none;
      box-sizing: border-box;
    `;
    homeBar.innerHTML = `
      <div style="width: 280px; height: 5px; background: ${isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.35)'}; border-radius: 100px;"></div>
    `;
    document.body.appendChild(homeBar);
  }, isDark);
}

async function run() {
  const server = await startServer();
  const outDir = path.join(ROOT_DIR, 'screenshots', 'ios_ipad_12.9_2048x2732');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  // iPad Pro 12.9": 1024 x 1366 @ 2x = 2048 x 2732 pixels
  await page.setViewport({
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  await page.setUserAgent('Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1');

  console.log('Navigating to app on iPad viewport (2048 x 2732)...');
  await page.goto(`http://localhost:${PORT}/tamma.html`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1200));

  // 1. Library (คลังบทสวดมนต์ - Cosmic Theme)
  console.log('Capturing iPad 01_library.png...');
  await setupIPadDecorations(page, true);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '01_library.png') });

  // 2. Reader Mode (พระคาถาชินบัญชร - Zen Reader)
  console.log('Capturing iPad 02_zen_reader.png...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.prayer-card'));
    const chinabanchornCard = cards.find(c => c.textContent.includes('ชินบัญชร')) || cards[0];
    if (chinabanchornCard) chinabanchornCard.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await setupIPadDecorations(page, true);
  await page.screenshot({ path: path.join(outDir, '02_zen_reader.png') });

  // 3. Monastic MP3 Audio Player Deck
  console.log('Capturing iPad 03_monastic_audio.png...');
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
  await setupIPadDecorations(page, true);
  await page.screenshot({ path: path.join(outDir, '03_monastic_audio.png') });

  // Close reader and hide mp3 deck
  await page.evaluate(() => {
    const mp3Deck = document.getElementById('mp3PlayerDeck');
    if (mp3Deck) mp3Deck.style.display = 'none';
    const closeBtn = document.getElementById('btnCloseReader');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 4. Tipitaka 45 Volumes
  console.log('Capturing iPad 04_tipitaka.png...');
  await page.evaluate(() => {
    window.tammaApp.switchTab('tipitaka');
  });
  await new Promise(r => setTimeout(r, 800));
  await setupIPadDecorations(page, true);
  await page.screenshot({ path: path.join(outDir, '04_tipitaka.png') });

  // 5. Daily Tracker / Habit
  console.log('Capturing iPad 05_daily_tracker.png...');
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
  await setupIPadDecorations(page, true);
  await page.screenshot({ path: path.join(outDir, '05_daily_tracker.png') });

  // 6. Ancient Parchment Theme (คัมภีร์ใบลาน สบายตา)
  console.log('Capturing iPad 06_parchment_theme.png...');
  await page.evaluate(() => {
    document.body.className = 'theme-parchment';
    window.tammaApp.switchTab('library');
  });
  await new Promise(r => setTimeout(r, 800));
  await setupIPadDecorations(page, false);
  await page.screenshot({ path: path.join(outDir, '06_parchment_theme.png') });

  // 7. Golden Temple Theme (ธีมทองคำอร่าม)
  console.log('Capturing iPad 07_golden_theme.png...');
  await page.evaluate(() => {
    document.body.className = 'theme-gold';
    window.tammaApp.switchTab('library');
  });
  await new Promise(r => setTimeout(r, 800));
  await setupIPadDecorations(page, true);
  await page.screenshot({ path: path.join(outDir, '07_golden_theme.png') });

  console.log('All iPad screenshots generated successfully!');
  await browser.close();
  server.close();
}

run().catch(err => {
  console.error('iPad capture error:', err);
  process.exit(1);
});
