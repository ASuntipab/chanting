import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const wwwDir = path.join(rootDir, 'www');

if (fs.existsSync(wwwDir)) {
  fs.rmSync(wwwDir, { recursive: true, force: true });
}
fs.mkdirSync(wwwDir, { recursive: true });

fs.copyFileSync(path.join(rootDir, 'tamma.html'), path.join(wwwDir, 'index.html'));
fs.copyFileSync(path.join(rootDir, 'tamma.html'), path.join(wwwDir, 'tamma.html'));

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(path.join(rootDir, 'src'), path.join(wwwDir, 'src'));
copyDir(path.join(rootDir, 'assets'), path.join(wwwDir, 'assets'));
copyDir(path.join(rootDir, 'data'), path.join(wwwDir, 'data'));

// Create .nojekyll for GitHub Pages
fs.writeFileSync(path.join(wwwDir, '.nojekyll'), '', 'utf8');

console.log('Build complete: Web assets packaged to www/ successfully.');
