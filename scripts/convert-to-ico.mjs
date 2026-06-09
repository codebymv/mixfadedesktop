import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');
const sourcePng = path.join(publicDir, 'mixfade_icon.png');
const icoPath = path.join(publicDir, 'mixfade_icon-icoext.ico');

const missing = [sourcePng, icoPath].filter((filePath) => !fs.existsSync(filePath));

if (missing.length > 0) {
  console.error('Missing icon asset(s):');
  missing.forEach((filePath) => console.error(`- ${filePath}`));
  process.exit(1);
}

console.log(`Icon source verified: ${sourcePng}`);
console.log(`Windows ICO verified: ${icoPath}`);
