# MixFade Hotfix Pipeline

## Overview

This document outlines the streamlined hotfix deployment pipeline for MixFade, designed for rapid bug fixes and critical updates that need to be deployed immediately without going through the full release cycle.

## Pipeline Components

### 1. Build Process
```bash
npx electron-builder --win --publish never
```
- **Purpose**: Creates Windows installer without auto-publishing
- **Output**: `MixFade Setup [version].exe` in `release/` directory
- **Benefits**: Fast build, no accidental publishing, manual control

### 2. Upload Process
```bash
node scripts/upload-nsis-installer.js
```
- **Purpose**: Deploys installer to S3 with metadata and download page
- **Features**: 
  - Automatic file detection
  - Size calculation and validation
  - Metadata generation
  - Download page creation
  - Direct download links

## Recent Hotfix Example: Session-Only Recent Files

### Problem
- Users clicking recent files after app restart were getting file upload dialogs
- Expected behavior: Direct loading to respective A/B decks
- Root cause: localStorage couldn't persist File objects, only metadata

### Solution
- Made recent files session-only (cleared on app restart)
- Removed localStorage persistence logic
- Simplified UI by removing warning states
- Added subtle UI hints about session-only behavior

### Files Modified
- `src/App.tsx` - Removed localStorage loading/saving logic
- `src/components/sidebar/FilesPanel.tsx` - Simplified UI, removed warning indicators
- `src/components/Sidebar.tsx` - Updated interface comments

## Deployment Results

### Build Output
- **Version**: 0.9.4
- **Installer**: `MixFade Setup 0.9.4.exe`
- **Size**: 80.90 MB
- **Build Time**: ~2 minutes

### S3 Deployment
- **Direct Download**: https://mixfade.s3.amazonaws.com/releases/windows/MixFade+Setup+0.9.4.exe
- **Download Page**: https://mixfade.s3.amazonaws.com/
- **Metadata**: Automatically generated and uploaded

## Pipeline Advantages

### Speed
- **Total Time**: ~5 minutes from code change to live deployment
- **Build**: ~2 minutes
- **Upload**: ~1 minute
- **Verification**: ~2 minutes

### Reliability
- **Consistent Process**: Same steps every time
- **Error Handling**: Scripts validate files before upload
- **Rollback Capability**: Previous versions remain available

### Automation
- **File Detection**: Automatically finds latest installer
- **Metadata Generation**: Creates version info and download links
- **Multi-artifact Upload**: Installer + metadata + download page

## Best Practices

### Pre-Deployment
1. **Test Locally**: Verify fix works in development
2. **Code Review**: Even for hotfixes, review changes
3. **Build Verification**: Ensure build completes successfully
4. **Size Check**: Verify installer size is reasonable

### During Deployment
1. **Clean Release**: Delete existing release folder for fresh build
2. **Monitor Build**: Watch for any build errors or warnings
3. **Verify Upload**: Confirm successful S3 upload
4. **Test Download**: Verify download links work

### Post-Deployment
1. **Version Tracking**: Document what was fixed
2. **User Communication**: Notify users of available update
3. **Monitor Feedback**: Watch for any new issues
4. **Cleanup**: Remove old installers if needed

## Common Commands

### Build Only
```bash
npm run build:exe
```

### Upload Only (after manual build)
```bash
node scripts/upload-nsis-installer.js
```

### Full Pipeline
```bash
# 1. Clean previous build
rm -rf release/

# 2. Build installer
npm run build:exe

# 3. Upload to S3
node scripts/upload-nsis-installer.js
```

### Verification
```bash
# Check build output
dir release *.exe

# Verify upload
curl -I https://mixfade.s3.amazonaws.com/releases/windows/MixFade+Setup+0.9.4.exe
```

## Troubleshooting

### Build Issues
- **Node modules**: Run `npm install` if dependencies are missing
- **Electron version**: Ensure electron version matches package.json
- **Permissions**: Check file/folder permissions on Windows

### Upload Issues
- **AWS Credentials**: Verify AWS credentials are configured
- **S3 Permissions**: Ensure bucket has proper write permissions
- **Network**: Check internet connection for upload

### Distribution Issues
- **Download Links**: Verify URLs are accessible
- **File Integrity**: Check installer file isn't corrupted
- **Version Confusion**: Ensure version numbers match across all artifacts

## Future Improvements

### Potential Enhancements
1. **Automated Testing**: Add pre-deployment smoke tests
2. **Version Bumping**: Automatic version increment for hotfixes
3. **Changelog Generation**: Auto-generate changelog entries
4. **Rollback Automation**: Script for quick rollback to previous version
5. **Multi-platform**: Extend pipeline to macOS and Linux

### Monitoring
- **Download Analytics**: Track download counts and success rates
- **Error Reporting**: Monitor for installation failures
- **User Feedback**: Collect feedback on hotfix effectiveness

## Security Considerations

- **Code Signing**: Ensure all releases are properly signed
- **Checksum Verification**: Provide checksums for download verification
- **Secure Distribution**: Use HTTPS for all download links
- **Access Control**: Limit who can deploy hotfixes

---

*Last Updated: January 2025*  
*Pipeline Version: 1.0*  
*Maintainer: MixFade Team* 