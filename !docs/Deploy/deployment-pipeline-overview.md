# MixFade Deployment Pipeline Overview

This document outlines the complete deployment pipeline for releasing new versions of MixFade, from development completion to user availability.

## Pipeline Overview

### 1. Development Complete
- New functionality implemented and tested in the Electron app
- All features working as expected
- Code reviewed and ready to ship

### 2. Version Management

#### Update MixFade App Version
```bash
# In MixFade/Prototype4
# Update package.json version field
{
  "name": "mixfade",
  "version": "0.9.3",  # Update this
  "description": "Professional DJ mixing software"
}
```

#### Update Landing Page Version
```typescript
// In MFLanding/src/config/downloads.ts
export const CURRENT_VERSION = '0.9.3';  # Update this
```

### 3. Build & Package Professional Installer

#### Windows Professional Installer (Recommended)
```bash
# Navigate to MixFade project
cd C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4

# Build Windows NSIS installer (.exe)
npm run build:installer

# Deploy to S3
npm run deploy:installer
```

**Expected Output:**
- Creates `MixFade-{version}-Windows-x64-Setup.exe` in `release/` directory
- Professional NSIS installer with:
  - Welcome screen with branding
  - License agreement
  - Installation directory selection
  - Desktop and Start Menu shortcuts
  - File associations for audio files
  - Proper uninstaller in Control Panel
  - Windows registry integration

#### Legacy Build (ZIP - for technical users only)
```bash
# Build Windows application (creates zip)
npm run dist:win

# Create ZIP package (old method)
npm run create:installer
```

#### macOS Build (requires macOS or cross-compilation)
```bash
# Build macOS application
npm run dist:mac

# Create macOS installer package
npm run create:installer:mac
```

#### Multi-Platform Build
```bash
# Build all platforms (Windows, macOS, Linux)
npm run build:all-platforms
```

### 4. Upload to S3

#### Professional Installer Upload (Recommended)
```bash
# Upload NSIS installer
npm run deploy:installer
# This combines: npm run build:installer && npm run upload:nsis-installer
```

#### Legacy Upload Methods
```bash
# Upload ZIP installer (old method)
npm run upload:installer

# Upload macOS installer
npm run upload:installer:mac

# Upload all available platform installers
npm run upload:all-platforms
```

**Expected Output:**
- Uploads installer to `https://mixfade.s3.us-east-1.amazonaws.com/releases/windows/MixFade-{version}-Windows-x64-Setup.exe`
- Creates/updates `releases/latest-windows.json` with installer metadata
- Generates professional download page at `https://mixfade.s3.amazonaws.com/index.html`
- Provides both direct download and branded download page

### 5. Update Landing Page

#### Add New Version to History
```typescript
// In MFLanding/src/config/downloads.ts
export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: '0.9.3',  # New version
    date: '2024-12-19',
    size: '45.2 MB',  # Update actual installer size
    changes: [
      'Professional NSIS installer',
      'Enhanced crossfading algorithms',
      'Improved waveform visualization',
      'Bug fixes and performance improvements'
    ],
    downloads: {
      windows: {
        url: `${BASE_URL}/windows/MixFade-0.9.3-Windows-x64-Setup.exe`,
        filename: 'MixFade-0.9.3-Windows-x64-Setup.exe',
        size: '45.2 MB',
        type: 'installer'  # Changed from 'zip'
      },
      macOS: {
        url: `${BASE_URL}/macos/MixFade-0.9.3-macOS-x64.dmg`,
        filename: 'MixFade-0.9.3-macOS-x64.dmg',
        size: 'TBD MB'
      }
    }
  },
  # ... previous versions
];
```

#### Deploy Landing Page
```bash
# In MFLanding project
cd C:\Users\roxas\OneDrive\Desktop\PROJECTS\MFLanding

# Build and deploy (depends on your hosting)
npm run build
npm run deploy  # or your deployment command
```

### 6. Verification

#### Test Download Links
- [ ] Visit landing page download section
- [ ] Click download button
- [ ] Verify correct installer downloads (.exe file)
- [ ] Check file size matches expectations

#### Test Professional Installer
- [ ] Run downloaded installer (.exe)
- [ ] Verify installation wizard appears with branding
- [ ] Complete installation with default settings
- [ ] Check desktop shortcut was created
- [ ] Check Start Menu entry was created
- [ ] Launch MixFade from shortcut
- [ ] Test core functionality
- [ ] Check version number in app matches release
- [ ] Verify uninstaller appears in Control Panel

#### Check S3 Accessibility
- [ ] Direct S3 URL works: `https://mixfade.s3.us-east-1.amazonaws.com/releases/windows/MixFade-{version}-Windows-x64-Setup.exe`
- [ ] S3 permissions allow public read access
- [ ] No 403 forbidden errors
- [ ] Download page loads: `https://mixfade.s3.amazonaws.com/`

## File Locations

### MixFade App
- **Project**: `C:\Users\roxas\OneDrive\Desktop\PROJECTS\MixFade\Prototype4`
- **Package.json**: `package.json` (with enhanced NSIS config)
- **NSIS Config**: `nsis-installer-config.nsh`
- **Build Scripts**: `scripts/upload-nsis-installer.js`
- **Output**: `release/MixFade-{version}-Windows-x64-Setup.exe`

### Legacy Files (ZIP-based)
- **Scripts**: `scripts/create-installer.js`, `scripts/upload-installer.js`
- **Output**: `installers/MixFade-{version}-Windows-x64.zip`

### Landing Page
- **Project**: `C:\Users\roxas\OneDrive\Desktop\PROJECTS\MFLanding`
- **Config**: `src/config/downloads.ts`
- **Download Page**: `src/pages/Download.tsx`

### S3 Storage
- **Bucket**: `mixfade`
- **Region**: `us-east-1`
- **Windows Path**: `/releases/windows/`
- **Download Page**: `https://mixfade.s3.amazonaws.com/index.html`
- **Metadata**: `/releases/latest-windows.json`

## Professional Installer Features

### User Experience
- ✅ **Professional Branding**: Custom welcome screen with MixFade branding
- ✅ **License Agreement**: Displays LICENSE.txt during installation
- ✅ **Directory Selection**: User can choose installation location
- ✅ **Progress Indicator**: Visual feedback during installation
- ✅ **Completion Screen**: Option to launch app immediately

### System Integration
- ✅ **Desktop Shortcut**: Automatically created with proper icon
- ✅ **Start Menu Entry**: Added to Windows Start Menu
- ✅ **File Associations**: Associates .mp3, .wav, .flac, .m4a files
- ✅ **Registry Entries**: Proper Windows registry integration
- ✅ **Uninstaller**: Clean uninstall from Control Panel

### Security & Compatibility
- ✅ **Code Signing Ready**: Structure prepared for future code signing
- ✅ **Windows 10/11**: Full compatibility with modern Windows
- ✅ **UAC Support**: Proper User Account Control handling
- ✅ **Clean Uninstall**: Removes all files, shortcuts, and registry entries

## Platform-Specific Build Requirements

### Windows Builds
- **Environment:** Windows 10/11 or Windows Server
- **Requirements:** Node.js, npm, PowerShell
- **Output:** Professional NSIS installer (.exe)
- **Cross-compilation:** ✅ Supported from other platforms
- **Size:** ~45 MB (compressed installer vs ~115 MB zip)

### macOS Builds
- **Environment:** macOS 10.15+ (preferred) or cross-compilation setup
- **Requirements:** Xcode Command Line Tools (on macOS)
- **Output:** DMG disk image
- **Cross-compilation:** ⚠️ Limited support, best built on macOS
- **Code Signing:** Future consideration for distribution

### Linux Builds (Future)
- **Environment:** Ubuntu 18.04+ or compatible
- **Requirements:** Standard build tools
- **Output:** AppImage, DEB package
- **Cross-compilation:** ✅ Supported from other platforms

## Migration from ZIP to Professional Installer

### For New Deployments
Use the new commands:
```bash
npm run build:installer    # Builds NSIS installer
npm run deploy:installer   # Builds and uploads to S3
```

### For Backward Compatibility
The old ZIP-based system is still available:
```bash
npm run create:installer   # Creates ZIP file
npm run upload:installer   # Uploads ZIP to S3
```

### Benefits of Professional Installer
- **User Experience**: One-click installation like other professional software
- **Size Efficiency**: ~45 MB installer vs ~115 MB ZIP file
- **System Integration**: Proper shortcuts, file associations, uninstaller
- **Security**: Better Windows integration and future code signing support
- **Professionalism**: Matches expectations of desktop application users

## Automation Opportunities

### GitHub Actions (Future Enhancement)
```yaml
# .github/workflows/release.yml
name: Release MixFade Multi-Platform
on:
  push:
    tags:
      - 'v*'
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
      - name: Create installer
        run: npm run create:installer
      - name: Upload to S3
        run: npm run upload:installer
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build macOS application
        run: npm run dist:mac
      - name: Upload to S3
        run: npm run upload:installer:mac
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Version Sync Script (Future Enhancement)
```javascript
# scripts/sync-versions.js
# Automatically sync versions between MixFade and MFLanding projects
```