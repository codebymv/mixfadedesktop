import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version || '1.0.0';
const appName = 'MixFade';

// Paths
const releaseDir = path.join(__dirname, '..', 'release');
const outputDir = path.join(__dirname, '..', 'installers');
const builtAppPath = path.join(releaseDir, `${appName}-${version}.dmg`);

async function createMacInstaller() {
  try {
    console.log('🍎 Creating MixFade macOS installer package...');

    // Check if built DMG exists
    if (!fs.existsSync(builtAppPath)) {
      console.error('❌ Built macOS application not found!');
      console.log('\n📝 Please build the macOS application first:');
      console.log('   npm run build');
      console.log('   npm run dist:mac');
      console.log('\n💡 Note: macOS builds require running on macOS or using cross-compilation');
      process.exit(1);
    }

    // Create installers directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create installer filename
    const installerName = `${appName}-${version}-macOS-x64.dmg`;
    const installerPath = path.join(outputDir, installerName);

    console.log(`📁 Source DMG: ${builtAppPath}`);
    console.log(`💾 Output: ${installerPath}`);

    // Remove existing installer if it exists
    if (fs.existsSync(installerPath)) {
      fs.unlinkSync(installerPath);
      console.log('🗑️  Removed existing installer');
    }

    // Copy and rename the DMG
    console.log('🔄 Copying DMG file...');

    try {
      fs.copyFileSync(builtAppPath, installerPath);
    } catch (error) {
      console.error('❌ Failed to copy DMG file:', error.message);
      process.exit(1);
    }

    // Verify installer was created
    if (!fs.existsSync(installerPath)) {
      console.error('❌ Installer creation failed - file not found');
      process.exit(1);
    }

    // Get file size
    const stats = fs.statSync(installerPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ macOS Installer created successfully!');
    console.log(`\n📋 Installer Details:`);
    console.log(`   Name: ${installerName}`);
    console.log(`   Size: ${fileSizeInMB} MB`);
    console.log(`   Path: ${installerPath}`);

    // Create installation instructions for macOS
    const instructionsPath = path.join(outputDir, 'INSTALLATION-macOS.md');
    const instructions = `# MixFade macOS Installation Instructions

## macOS Installation

### Download
1. Download \`${installerName}\` from the releases page
2. Save it to your desired location (e.g., Downloads folder)

### Installation
1. **Mount the DMG**
   - Double-click on \`${installerName}\`
   - The DMG will mount and open a Finder window

2. **Install MixFade**
   - Drag the MixFade app to the Applications folder
   - Wait for the copy process to complete

3. **Run MixFade**
   - Open Applications folder
   - Double-click MixFade to launch
   - You may need to right-click and select "Open" the first time

4. **Add to Dock (Optional)**
   - Right-click the MixFade icon in the dock while running
   - Select "Options" > "Keep in Dock"

### System Requirements
- macOS 10.15 (Catalina) or later
- Intel or Apple Silicon Mac
- 4 GB RAM minimum
- 500 MB free disk space

### Troubleshooting

**Gatekeeper Warning**
If macOS shows a security warning:
1. Go to System Preferences > Security & Privacy
2. Click "Open Anyway" next to the MixFade warning
3. Or right-click the app and select "Open"

**Application Won't Start**
1. Ensure you copied the app to Applications folder
2. Check that you have the latest macOS updates
3. Try restarting your Mac

**Permission Issues**
1. Right-click MixFade in Applications
2. Select "Get Info"
3. Expand "Sharing & Permissions"
4. Ensure you have "Read & Write" access

### Uninstallation
1. Open Applications folder
2. Drag MixFade to Trash
3. Empty Trash to complete removal

---

**Version:** ${version}
**Platform:** macOS (Universal)
**Package Size:** ${fileSizeInMB} MB
`;

    fs.writeFileSync(instructionsPath, instructions);
    console.log(`📄 macOS installation instructions created: ${instructionsPath}`);

    console.log('\n🎉 macOS Installer package ready!');
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Upload to S3: npm run upload:installer:mac`);
    console.log(`   2. Test download and installation on macOS`);

    // Return installer info for use by upload script
    return {
      name: installerName,
      path: installerPath,
      size: stats.size,
      version: version,
      platform: 'macOS'
    };

  } catch (error) {
    console.error('❌ Error creating macOS installer:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('create-installer-mac.js')) {
  createMacInstaller();
}

export default createMacInstaller;
