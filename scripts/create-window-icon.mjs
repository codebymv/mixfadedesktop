import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, '..', 'public', 'mixfade_icon.png');
const outputIcon = path.join(__dirname, '..', 'public', 'mixfade_window_icon.png');

async function createWindowIcon() {
  try {
    console.log('📐 Creating optimized window icon...');

    // Create a 32x32 icon optimized for Windows title bars
    await sharp(sourceIcon)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
      })
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toFile(outputIcon);

    console.log('✅ Window icon created:', outputIcon);
    console.log('🎯 Icon optimized at 32x32 pixels for Windows title bar');

  } catch (error) {
    console.error('❌ Failed to create window icon:', error.message);
  }
}

createWindowIcon();
