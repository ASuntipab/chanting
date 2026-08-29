import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/tamma.html';
  }

  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    let ext = path.extname(filePath).toLowerCase();
    let isBrotli = false;
    let contentType = MIME_TYPES[ext] || 'application/octet-stream';

    if (ext === '.br') {
      isBrotli = true;
      const baseExt = path.extname(filePath.slice(0, -3)).toLowerCase();
      contentType = MIME_TYPES[baseExt] || 'application/json; charset=UTF-8';
    }

    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    };

    if (isBrotli) {
      headers['Content-Encoding'] = 'br';
    }

    res.writeHead(200, headers);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🪷 ธรรมะ E-Book (Tamma OS) Server running at: http://localhost:${PORT}/tamma.html`);
});
