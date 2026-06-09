import rcedit from 'rcedit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe');
const backupPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe.backup');
const iconPath = path.join(__dirname, '..', 'public', 'mixfade_icon-icoext.ico');

async function patchElectronIcon() {
  try {
    // Check if icon file exists
    if (!fs.existsSync(iconPath)) {
      console.error('❌ Icon file not found:', iconPath);
      return;
    }

    // Check if electron.exe exists
    if (!fs.existsSync(electronPath)) {
      console.error('❌ Electron executable not found:', electronPath);
      return;
    }

    // Create backup if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      console.log('📁 Creating backup of original electron.exe...');
      fs.copyFileSync(electronPath, backupPath);
      console.log('✅ Backup created');
    }

    // Patch the icon
    console.log('🎨 Patching electron.exe icon...');
    await rcedit(electronPath, {
      icon: iconPath
    });

    console.log('✅ Electron icon patched successfully!');
    console.log('🚀 Your taskbar icon should now show the custom MixFade icon');
    console.log('💡 To restore original: npm run restore-electron-icon');
  } catch (error) {
    console.error('❌ Failed to patch electron icon:', error.message);
  }
}

async function restoreElectronIcon() {
  try {
    if (!fs.existsSync(backupPath)) {
      console.log('ℹ️  No backup found, electron.exe is probably already original');
      return;
    }

    console.log('🔄 Restoring original electron.exe...');
    fs.copyFileSync(backupPath, electronPath);
    console.log('✅ Original electron.exe restored');
  } catch (error) {
    console.error('❌ Failed to restore electron icon:', error.message);
  }
}

// Check command line arguments
const action = process.argv[2];
if (action === 'restore') {
  restoreElectronIcon();
} else {
  patchElectronIcon();
}
