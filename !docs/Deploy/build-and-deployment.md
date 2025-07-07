# Build and Deployment Guide

This guide covers building MixFade for development and production, as well as deploying across multiple platforms.

## Development Build

### **Quick Development Setup**
```bash
# Clone and setup
git clone <repository-url>
cd MixFade/Prototype4
npm install

# Start development environment
npm run electron:dev
```

### **Development Scripts**
```bash
# Frontend development with hot reload
npm run dev

# Electron development with hot reload
npm run electron:dev

# Electron with custom icon patching
npm run electron:dev-with-icon

# Run tests
npm run test
npm run test:watch
npm run test:coverage

# Code quality
npm run lint
```

## Production Build Process

### **Step 1: Build Components**
```bash
# Build React frontend
npm run build:renderer

# Build Electron main process
npm run build:main

# Complete build (both frontend and main)
npm run build
```

### **Step 2: Create Distribution Packages**
```bash
# Create distributable packages for all platforms
npm run dist

# Platform-specific builds
npm run dist -- --win    # Windows only
npm run dist -- --mac    # macOS only
npm run dist -- --linux  # Linux only
```

## Build Configuration

### **Electron Builder Configuration**
Located in `package.json` under the `build` section:

```json
{
  "build": {
    "appId": "com.mixfade.app",
    "productName": "MixFade",
    "directories": {
      "buildResources": "assets",
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "!node_modules/**/{CHANGELOG.md,README.md,readme.md}",
      "!node_modules/**/{test,__tests__,tests,powered-test,example,examples}",
      "!node_modules/**/{*.d.ts,*.map}",
      "!node_modules/**/.bin"
    ],
    "extraResources": [
      {
        "from": "public/",
        "to": "public/",
        "filter": ["**/*"]
      }
    ]
  }
}
```

### **Platform-Specific Configuration**

#### **Windows Configuration**
```json
{
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ],
    "icon": "public/mixfade_icon-icoext.ico",
    "publisherName": "MixFade Team",
    "verifyUpdateCodeSignature": false
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "installerIcon": "public/mixfade_icon-icoext.ico",
    "uninstallerIcon": "public/mixfade_icon-icoext.ico",
    "installerHeaderIcon": "public/mixfade_icon-icoext.ico",
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "MixFade"
  }
}
```

#### **macOS Configuration**
```json
{
  "mac": {
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      },
      {
        "target": "zip",
        "arch": ["x64", "arm64"]
      }
    ],
    "icon": "public/mixfade_icon.png",
    "category": "public.app-category.music",
    "minimumSystemVersion": "10.14.0",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.inherit.plist"
  },
  "dmg": {
    "background": "build/background.tiff",
    "contents": [
      {
        "x": 410,
        "y": 150,
        "type": "link",
        "path": "/Applications"
      },
      {
        "x": 130,
        "y": 150,
        "type": "file"
      }
    ]
  }
}
```

#### **Linux Configuration**
```json
{
  "linux": {
    "target": [
      {
        "target": "AppImage",
        "arch": ["x64"]
      },
      {
        "target": "deb",
        "arch": ["x64"]
      },
      {
        "target": "rpm",
        "arch": ["x64"]
      },
      {
        "target": "tar.gz",
        "arch": ["x64"]
      }
    ],
    "icon": "public/mixfade_icon.png",
    "category": "AudioVideo",
    "description": "Professional audio analysis and waveform visualization tool",
    "desktop": {
      "Name": "MixFade",
      "Comment": "Audio Analysis Tool",
      "Keywords": "audio;analysis;waveform;spectrum;music;"
    }
  }
}
```

## Build Optimization

### **Bundle Size Optimization**
```bash
# Analyze bundle size
npm run build:renderer -- --analyze

# Tree-shake unused dependencies
npm run build -- --treeshake
```

### **Performance Optimization**
- **Code Splitting**: Lazy load non-critical components
- **Tree Shaking**: Remove unused code
- **Minification**: Compress JavaScript and CSS
- **Asset Optimization**: Compress images and icons

### **Electron Optimization**
```typescript
// Main process optimization
if (process.env.NODE_ENV === 'production') {
  // Disable DevTools
  app.whenReady().then(() => {
    // Remove developer tools access
    globalShortcut.unregisterAll();
  });
  
  // Enable security features
  app.enableSandbox();
}
```

## Code Signing

### **Windows Code Signing**
```bash
# Install certificate
npm install -g electron-builder

# Sign application (requires certificate)
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"
npm run dist -- --win
```

### **macOS Code Signing**
```bash
# Developer ID signing
export APPLE_ID="developer@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export CSC_NAME="Developer ID Application: Your Name"

# Build and sign
npm run dist -- --mac

# Notarize (macOS 10.14+)
npx electron-notarize --bundle-id com.mixfade.app \
  --app-path dist/mac/MixFade.app \
  --apple-id $APPLE_ID \
  --apple-id-password $APPLE_ID_PASSWORD
```

### **Linux Signing (Optional)**
```bash
# GPG signing for repositories
gpg --armor --detach-sign dist/MixFade-1.0.0.AppImage
```

## Continuous Integration

### **GitHub Actions Workflow**
Create `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Create distribution
        run: npm run dist
        env:
          # Code signing secrets
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: dist/*
```

## Distribution

### **Release Channels**
- **Stable**: Tagged releases (v1.0.0, v1.1.0, etc.)
- **Beta**: Pre-release versions (v1.1.0-beta.1)
- **Alpha**: Development builds (v1.1.0-alpha.1)

### **Distribution Platforms**

#### **Direct Download**
- GitHub Releases
- Official website
- Mirror servers

#### **Package Managers**

**Windows:**
```bash
# Chocolatey
choco install mixfade

# Winget
winget install MixFade.MixFade
```

**macOS:**
```bash
# Homebrew
brew install --cask mixfade
```

**Linux:**
```bash
# Snap Store
sudo snap install mixfade

# AppImage (portable)
chmod +x MixFade-1.0.0.AppImage
./MixFade-1.0.0.AppImage

# Debian/Ubuntu
sudo dpkg -i mixfade_1.0.0_amd64.deb

# Fedora/RHEL
sudo rpm -i mixfade-1.0.0.x86_64.rpm
```

### **Auto-Updates**

#### **Configuration**
```typescript
// Main process auto-updater
import { autoUpdater } from 'electron-updater';

// Configure update server
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'mixfade',
  repo: 'mixfade',
  private: false
});

// Check for updates
autoUpdater.checkForUpdatesAndNotify();

// Handle update events
autoUpdater.on('update-available', (info) => {
  // Notify user of available update
});

autoUpdater.on('update-downloaded', (info) => {
  // Prompt user to restart and install
});
```

#### **Update Server Setup**
```json
{
  "version": "1.0.0",
  "files": [
    {
      "url": "MixFade-Setup-1.0.0.exe",
      "sha512": "...",
      "size": 85647234
    }
  ],
  "path": "MixFade-Setup-1.0.0.exe",
  "sha512": "...",
  "releaseDate": "2024-01-15T10:00:00.000Z"
}
```

## Deployment Checklist

### **Pre-Deployment**
- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] Version number updated
- [ ] Changelog updated
- [ ] Build succeeds on all platforms
- [ ] Manual testing completed

### **Deployment Steps**
- [ ] Create release tag
- [ ] Trigger CI/CD pipeline
- [ ] Verify builds complete successfully
- [ ] Test installation on clean systems
- [ ] Upload to distribution platforms
- [ ] Update documentation
- [ ] Announce release

### **Post-Deployment**
- [ ] Monitor for crashes/issues
- [ ] Verify auto-updates work
- [ ] Check download statistics
- [ ] Collect user feedback
- [ ] Plan next release

## Troubleshooting

### **Common Build Issues**

#### **Node.js Version Mismatch**
```bash
# Use specific Node.js version
nvm use 18
npm run build
```

#### **Missing Dependencies**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Platform-Specific Build Failures**
```bash
# Windows: Install Visual Studio Build Tools
npm install --global windows-build-tools

# macOS: Install Xcode Command Line Tools
xcode-select --install

# Linux: Install build essentials
sudo apt-get install build-essential libnss3-dev libatk-bridge2.0-dev
```

### **Code Signing Issues**

#### **Windows Certificate Problems**
- Verify certificate is valid and not expired
- Check certificate password
- Ensure certificate supports code signing

#### **macOS Notarization Issues**
- Check Apple ID credentials
- Verify app-specific password
- Ensure hardened runtime is enabled
- Check entitlements are correct

---

This comprehensive build and deployment process ensures MixFade can be reliably distributed across all supported platforms with proper security and update mechanisms. 