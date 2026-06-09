import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
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
const builtAppDir = path.join(releaseDir, 'MixFade-win32-x64');

async function createInstaller() {
  try {
    console.log('📦 Creating MixFade installer package...');

    // Check if built app exists
    if (!fs.existsSync(builtAppDir)) {
      console.error('❌ Built application not found!');
      console.log('\n📝 Please build the application first:');
      console.log('   npm run build');
      console.log('   npm run dist');
      process.exit(1);
    }

    // Create installers directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create installer filename
    const installerName = `${appName}-${version}-Windows-x64.zip`;
    const installerPath = path.join(outputDir, installerName);

    console.log(`📁 Packaging: ${builtAppDir}`);
    console.log(`💾 Output: ${installerPath}`);

    // Remove existing installer if it exists
    if (fs.existsSync(installerPath)) {
      fs.unlinkSync(installerPath);
      console.log('🗑️  Removed existing installer');
    }

    // Create zip using Node.js archiver
    console.log('🔄 Creating zip archive...');

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(installerPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        console.log(`📦 Archive created: ${archive.pointer()} bytes`);
        resolve();
      });

      archive.on('error', (err) => {
        console.error('❌ Archive error:', err.message);
        reject(err);
      });

      archive.pipe(output);

      // Add all files from the built app directory
      archive.directory(builtAppDir, false);

      archive.finalize();
    });

    // Verify installer was created
    if (!fs.existsSync(installerPath)) {
      console.error('❌ Installer creation failed - file not found');
      process.exit(1);
    }

    // Get file size
    const stats = fs.statSync(installerPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ Installer created successfully!');
    console.log(`\n📋 Installer Details:`);
    console.log(`   Name: ${installerName}`);
    console.log(`   Size: ${fileSizeInMB} MB`);
    console.log(`   Path: ${installerPath}`);

    // Create installation instructions
    const instructionsPath = path.join(outputDir, 'INSTALLATION.md');
    const instructions = `# MixFade Installation Instructions

## Windows Installation

### Download
1. Download \`${installerName}\` from the releases page
2. Save it to your desired location (e.g., Downloads folder)

### Installation
1. **Extract the Archive**
   - Right-click on \`${installerName}\`
   - Select "Extract All..." or use your preferred archive tool
   - Choose a destination folder (e.g., \`C:\\Program Files\\MixFade\`)

2. **Run MixFade**
   - Navigate to the extracted folder
   - Double-click \`MixFade.exe\` to launch the application

3. **Create Desktop Shortcut (Optional)**
   - Right-click on \`MixFade.exe\`
   - Select "Create shortcut"
   - Move the shortcut to your Desktop

### System Requirements
- Windows 10 or later (64-bit)
- 4 GB RAM minimum
- 500 MB free disk space

### Troubleshooting

**Windows Defender Warning**
If Windows Defender shows a warning:
1. Click "More info"
2. Click "Run anyway"
3. This happens because the app isn't code-signed yet

**Application Won't Start**
1. Ensure you extracted all files from the zip
2. Check that you have the latest Windows updates
3. Try running as administrator

**Missing DLL Errors**
1. Install Microsoft Visual C++ Redistributable
2. Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe

### Uninstallation
1. Simply delete the MixFade folder
2. Remove any desktop shortcuts you created

---

**Version:** ${version}
**Platform:** Windows x64
**Package Size:** ${fileSizeInMB} MB
`;

    fs.writeFileSync(instructionsPath, instructions);
    console.log(`📄 Installation instructions created: ${instructionsPath}`);

    console.log('\n🎉 Installer package ready!');
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Upload to S3: npm run upload:installer`);
    console.log(`   2. Test download and installation`);

    // Return installer info for use by upload script
    return {
      name: installerName,
      path: installerPath,
      size: stats.size,
      version: version
    };

  } catch (error) {
    console.error('❌ Error creating installer:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('create-installer.js')) {
  createInstaller();
}

export default createInstaller;
