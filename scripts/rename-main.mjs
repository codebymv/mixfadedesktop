import { existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const oldPath = join(__dirname, '..', 'dist', 'main', 'main.js');
const newPath = join(__dirname, '..', 'dist', 'main', 'main.cjs');

if (existsSync(oldPath)) {
  renameSync(oldPath, newPath);
  console.log(`Renamed ${oldPath} to ${newPath}`);
} else {
  console.log(`File not found: ${oldPath}`);
  process.exit(1);
}
