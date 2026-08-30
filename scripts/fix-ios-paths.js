import fs from 'node:fs';
import path from 'node:path';

const packageSwiftPath = path.join(process.cwd(), 'ios', 'App', 'CapApp-SPM', 'Package.swift');
if (fs.existsSync(packageSwiftPath)) {
  let content = fs.readFileSync(packageSwiftPath, 'utf8');
  content = content.replace(/path:\s*"([^"]+)"/g, (match, p1) => {
    return `path: "${p1.replace(/\\/g, '/')}"`;
  });
  fs.writeFileSync(packageSwiftPath, content, 'utf8');
  console.log('Fixed iOS Package.swift paths for Xcode / macOS compatibility.');
}
