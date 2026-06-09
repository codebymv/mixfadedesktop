import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version || '1.0.0';

async function buildExeInstaller() {
  try {
    console.log('🔨 Building MixFade .exe installer...');

    // Step 1: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    try {
      execSync('rimraf release', { stdio: 'inherit' });
      execSync('rimraf dist', { stdio: 'inherit' });
      execSync('rimraf dist-renderer', { stdio: 'inherit' });
      // Clear additional cache directories
      execSync('rimraf node_modules/.cache', { stdio: 'inherit' });
      execSync('rimraf .vite', { stdio: 'inherit' });
      execSync('rimraf tsconfig.main.tsbuildinfo', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Some cleanup failed, continuing...');
    }

    // Step 2: Build the application
    console.log('📦 Building application...');

    // Build the application (this handles TypeScript compilation)
    execSync('npm run build', { stdio: 'inherit' });

    // Verify builds were created
    if (!fs.existsSync('dist/main') || !fs.existsSync('dist-renderer')) {
      throw new Error('Build failed: dist directories not created');
    }
    console.log('✅ Application build completed successfully');

    // Step 3: Try different electron-builder approaches
    console.log('🔧 Attempting to create .exe installer...');

    const approaches = [
      // Approach 1: Standard electron-builder
      () => {
        console.log('📋 Trying standard electron-builder...');
        execSync('npx electron-builder --win --publish=never', { stdio: 'inherit' });
      },

      // Approach 2: Force rebuild of native modules
      () => {
        console.log('📋 Trying with native module rebuild...');
        execSync('npm rebuild', { stdio: 'inherit' });
        execSync('npx electron-builder --win --publish=never', { stdio: 'inherit' });
      },

      // Approach 3: Use electron-packager + create NSIS manually
      () => {
        console.log('📋 Trying electron-packager approach...');

        // First package the app
        const packagerCmd = [
          'npx electron-packager .',
          '--platform=win32',
          '--arch=x64',
          '--out=release',
          '--overwrite',
          `--app-version=${version}`,
          '--icon=public/mixfade_icon-icoext.ico',
          '--app-copyright="MixFade Team"',
          '--win32metadata.CompanyName="MixFade"',
          '--win32metadata.ProductName="MixFade"'
        ].join(' ');

        execSync(packagerCmd, { stdio: 'inherit' });

        // Then try to create installer with electron-builder
        execSync('npx electron-builder --prepackaged release/mixfade-win32-x64 --win', { stdio: 'inherit' });
      },

      // Approach 4: Use older electron-builder version
      () => {
        console.log('📋 Trying with specific electron-builder configuration...');

        // Create a temporary builder config
        const tempConfig = {
          "appId": "com.mixfade.app",
          "productName": "MixFade",
          "directories": {
            "output": "release"
          },
          "files": [
            "dist-renderer/**/*",
            "dist/main/**/*",
            "node_modules/**/*"
          ],
          "win": {
            "target": {
              "target": "nsis",
              "arch": ["x64"]
            },
            "icon": "public/mixfade_icon-icoext.ico",
            "artifactName": "MixFade Setup ${version}.exe"
          },
          "nsis": {
            "oneClick": false,
            "allowToChangeInstallationDirectory": true,
            "createDesktopShortcut": true,
            "createStartMenuShortcut": true
          }
        };

        fs.writeFileSync('electron-builder-temp.json', JSON.stringify(tempConfig, null, 2));

        try {
          execSync('npx electron-builder --config electron-builder-temp.json --win', { stdio: 'inherit' });
        } finally {
          // Clean up temp config
          if (fs.existsSync('electron-builder-temp.json')) {
            fs.unlinkSync('electron-builder-temp.json');
          }
        }
      }
    ];

    let success = false;
    let lastError = null;

    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`\n🔄 Attempt ${i + 1}/${approaches.length}`);
        approaches[i]();
        success = true;
        break;
      } catch (error) {
        console.log(`❌ Attempt ${i + 1} failed:`, error.message);
        lastError = error;

        if (i < approaches.length - 1) {
          console.log('🔄 Trying next approach...');
        }
      }
    }

    if (!success) {
      throw new Error(`All build approaches failed. Last error: ${lastError?.message}`);
    }

    // Verify the installer was created
    const releaseDir = path.join(__dirname, '..', 'release');
    const expectedInstaller = path.join(releaseDir, `MixFade Setup ${version}.exe`);

    if (fs.existsSync(expectedInstaller)) {
      const stats = fs.statSync(expectedInstaller);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log('\n✅ .exe installer created successfully!');
      console.log(`📋 Installer Details:`);
      console.log(`   File: MixFade Setup ${version}.exe`);
      console.log(`   Size: ${fileSizeInMB} MB`);
      console.log(`   Path: ${expectedInstaller}`);

      console.log('\n🎉 Ready to upload!');
      console.log('   Run: npm run upload:installer:exe');

      return {
        path: expectedInstaller,
        size: stats.size,
        version: version
      };
    } else {
      // Look for any .exe files in release directory
      if (fs.existsSync(releaseDir)) {
        const exeFiles = fs.readdirSync(releaseDir).filter(f => f.endsWith('.exe'));
        if (exeFiles.length > 0) {
          console.log('\n✅ Installer created with different name:');
          exeFiles.forEach(file => {
            const filePath = path.join(releaseDir, file);
            const stats = fs.statSync(filePath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`   ${file} (${fileSizeInMB} MB)`);
          });
          return {
            path: path.join(releaseDir, exeFiles[0]),
            size: fs.statSync(path.join(releaseDir, exeFiles[0])).size,
            version: version
          };
        }
      }

      throw new Error('Installer was not created in expected location');
    }

  } catch (error) {
    console.error('❌ Error building .exe installer:', error.message);

    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Try updating electron-builder: npm install electron-builder@latest');
    console.log('2. Clear node_modules and reinstall: rm -rf node_modules && npm install');
    console.log('3. Check Windows Defender isn\'t blocking app-builder.exe');
    console.log('4. Run as administrator if permission issues persist');
    console.log('5. Use the existing installer if available in release/ directory');

    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('build-exe-installer.js')) {
  buildExeInstaller();
}

export default buildExeInstaller;
