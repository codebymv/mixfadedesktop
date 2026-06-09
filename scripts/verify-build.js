import fs from 'fs';
import path from 'path';

async function verifyBuild() {
  console.log('🔍 Verifying build includes latest functionality...');

  const requiredDirs = ['dist/main', 'dist-renderer'];
  const issues = [];

  // Check that required directories exist
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      issues.push(`Missing directory: ${dir}`);
    } else {
      const files = fs.readdirSync(dir);
      console.log(`✅ ${dir} contains ${files.length} files`);
    }
  }

  // Check main process build (renamed to .cjs)
  const mainJsPath = 'dist/main/main.cjs';
  if (fs.existsSync(mainJsPath)) {
    const mainStats = fs.statSync(mainJsPath);
    const ageMinutes = (Date.now() - mainStats.mtime.getTime()) / (1000 * 60);
    console.log(`📋 Main process built ${ageMinutes.toFixed(1)} minutes ago`);

    if (ageMinutes > 10) {
      issues.push('Main process build is older than 10 minutes - may not include latest changes');
    }
  } else {
    issues.push('Main process JavaScript file not found (looking for main.cjs)');
  }

  // Check renderer build
  const rendererIndexPath = 'dist-renderer/index.html';
  if (fs.existsSync(rendererIndexPath)) {
    const rendererStats = fs.statSync(rendererIndexPath);
    const ageMinutes = (Date.now() - rendererStats.mtime.getTime()) / (1000 * 60);
    console.log(`📋 Renderer built ${ageMinutes.toFixed(1)} minutes ago`);

    if (ageMinutes > 10) {
      issues.push('Renderer build is older than 10 minutes - may not include latest changes');
    }

    // Check if assets exist
    const assetsDir = 'dist-renderer/assets';
    if (fs.existsSync(assetsDir)) {
      const assetFiles = fs.readdirSync(assetsDir);
      console.log(`📋 Renderer has ${assetFiles.length} asset files`);
    }
  } else {
    issues.push('Renderer index.html not found');
  }

  // Check package.json for version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`📋 Package version: ${packageJson.version}`);

  if (issues.length === 0) {
    console.log('\n✅ Build verification passed! Your latest functionality should be included.');
    console.log('You can now run: npm run build:exe');
    return true;
  } else {
    console.log('\n❌ Build verification failed:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('\nRecommendation: Run "npm run build" first to ensure fresh build');
    return false;
  }
}

// Run verification
verifyBuild().catch(console.error);
