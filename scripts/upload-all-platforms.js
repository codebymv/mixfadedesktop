import fs from 'fs';
import path from 'path';
import createInstaller from './create-installer.js';
import createMacInstaller from './create-installer-mac.js';
import dotenv from 'dotenv';
import { createLegacyS3Compat } from './lib/s3-helpers.js';

// Load environment variables
dotenv.config();

const s3 = createLegacyS3Compat();
const bucketName = process.env.AWS_S3_BUCKET || 'mixfade-releases';

async function uploadPlatformInstaller(installerInfo, platform) {
  console.log(`📤 Uploading ${platform} installer to S3...`);

  // Read the installer file
  const fileContent = fs.readFileSync(installerInfo.path);

  // S3 key (path in bucket)
  const s3Key = `releases/${platform.toLowerCase()}/${installerInfo.name}`;

  // Determine content type based on platform
  const contentTypes = {
    windows: 'application/zip',
    macos: 'application/x-apple-diskimage',
    linux: 'application/x-executable'
  };

  // Upload parameters
  const uploadParams = {
    Bucket: bucketName,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentTypes[platform.toLowerCase()] || 'application/octet-stream',
    ContentDisposition: `attachment; filename="${installerInfo.name}"`,
    Metadata: {
      'version': installerInfo.version,
      'platform': platform.toLowerCase(),
      'architecture': platform === 'macOS' ? 'universal' : 'x64',
      'upload-date': new Date().toISOString()
    }
  };

  // Upload with progress
  const upload = s3.upload(uploadParams);

  upload.on('httpUploadProgress', (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    process.stdout.write(`\r📊 ${platform} upload progress: ${percent}%`);
  });

  const result = await upload.promise();
  console.log(`\n✅ ${platform} upload completed successfully!`);

  // Generate download URL
  const downloadUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

  console.log(`\n📋 ${platform} Upload Details:`);
  console.log(`   File: ${installerInfo.name}`);
  console.log(`   Size: ${(installerInfo.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   S3 Location: s3://${bucketName}/${s3Key}`);
  console.log(`   Download URL: ${downloadUrl}`);

  return {
    platform: platform.toLowerCase(),
    url: downloadUrl,
    size: installerInfo.size,
    filename: installerInfo.name
  };
}

async function uploadAllPlatforms() {
  try {
    console.log('🚀 Starting MixFade multi-platform installer upload process...');

    const uploadedPlatforms = [];
    const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

    // Check and upload Windows installer
    try {
      console.log('\n🪟 Processing Windows installer...');
      const windowsInstaller = await createInstaller();
      if (fs.existsSync(windowsInstaller.path)) {
        const windowsUpload = await uploadPlatformInstaller(windowsInstaller, 'windows');
        uploadedPlatforms.push(windowsUpload);
      } else {
        console.log('⚠️  Windows installer not found, skipping...');
      }
    } catch (error) {
      console.log(`⚠️  Windows build failed: ${error.message}`);
    }

    // Check and upload macOS installer
    try {
      console.log('\n🍎 Processing macOS installer...');
      const macInstaller = await createMacInstaller();
      if (fs.existsSync(macInstaller.path)) {
        const macUpload = await uploadPlatformInstaller(macInstaller, 'macOS');
        uploadedPlatforms.push(macUpload);
      } else {
        console.log('⚠️  macOS installer not found, skipping...');
      }
    } catch (error) {
      console.log(`⚠️  macOS build failed: ${error.message}`);
    }

    if (uploadedPlatforms.length === 0) {
      console.error('❌ No installers were successfully uploaded!');
      console.log('\n📝 Please ensure you have built the applications first:');
      console.log('   npm run dist:win    # For Windows');
      console.log('   npm run dist:mac    # For macOS (requires macOS)');
      process.exit(1);
    }

    // Create/update comprehensive release metadata
    console.log('\n📝 Creating comprehensive release metadata...');

    const releaseMetadata = {
      version: version,
      releaseDate: new Date().toISOString(),
      files: {},
      changelog: `MixFade ${version} - Multi-platform Release\n\n### Features\n- Professional DJ mixing capabilities\n- Seamless crossfading\n- Multi-format audio support\n- Real-time waveform visualization\n\n### Platforms\n${uploadedPlatforms.map(p => `- ${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}`).join('\n')}`,
      minimumSystemVersion: {
        windows: "10.0.0",
        macos: "10.15.0",
        linux: "Ubuntu 18.04+"
      }
    };

    // Add platform-specific file info
    uploadedPlatforms.forEach(platform => {
      releaseMetadata.files[platform.platform] = {
        url: platform.url,
        size: platform.size,
        filename: platform.filename
      };
    });

    // Upload metadata
    await s3.upload({
      Bucket: bucketName,
      Key: 'releases/latest.json',
      Body: JSON.stringify(releaseMetadata, null, 2),
      ContentType: 'application/json'
    }).promise();

    console.log('✅ Comprehensive release metadata uploaded');

    // Create a multi-platform download page
    const downloadPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download MixFade - Multi-Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            text-align: center;
        }
        .logo {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .version {
            opacity: 0.8;
            margin-bottom: 40px;
            font-size: 1.2em;
        }
        .platforms {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .platform-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .platform-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        .download-btn {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.3s;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .download-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .file-info {
            margin-top: 15px;
            font-size: 0.9em;
            opacity: 0.8;
        }
        .changelog {
            margin-top: 40px;
            text-align: left;
            background: rgba(0, 0, 0, 0.2);
            padding: 25px;
            border-radius: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎵 MixFade</div>
        <div class="version">Version ${version}</div>

        <div class="platforms">
            ${uploadedPlatforms.map(platform => {
              const icons = {
                windows: '🪟',
                macos: '🍎',
                linux: '🐧'
              };
              const names = {
                windows: 'Windows',
                macos: 'macOS',
                linux: 'Linux'
              };
              return `
            <div class="platform-card">
                <div class="platform-icon">${icons[platform.platform]}</div>
                <h3>${names[platform.platform]}</h3>
                <a href="${platform.url}" class="download-btn" download>
                    📥 Download
                </a>
                <div class="file-info">
                    ${(platform.size / (1024 * 1024)).toFixed(1)} MB<br>
                    ${platform.filename}
                </div>
            </div>`;
            }).join('')}
        </div>

        <div class="changelog">
            <h3>📋 Release Notes</h3>
            <pre style="white-space: pre-wrap; font-family: inherit;">${releaseMetadata.changelog}</pre>
        </div>
    </div>
</body>
</html>`;

    // Upload download page
    await s3.upload({
      Bucket: bucketName,
      Key: 'index.html',
      Body: downloadPageHtml,
      ContentType: 'text/html'
    }).promise();

    console.log('✅ Multi-platform download page created');

    console.log('\n🎉 MixFade multi-platform deployment completed!');
    console.log(`\n🌐 Access URLs:`);
    console.log(`   Download Page: https://${bucketName}.s3.amazonaws.com/index.html`);
    console.log(`   Release Info: https://${bucketName}.s3.amazonaws.com/releases/latest.json`);

    console.log(`\n📱 Platform-specific downloads:`);
    uploadedPlatforms.forEach(platform => {
      console.log(`   ${platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}: ${platform.url}`);
    });

    return {
      version,
      platforms: uploadedPlatforms,
      downloadPageUrl: `https://${bucketName}.s3.amazonaws.com/index.html`
    };

  } catch (error) {
    console.error('❌ Error in multi-platform upload:', error.message);

    if (error.code === 'NoSuchBucket') {
      console.log('\n🔧 Bucket not found. Please run setup first:');
      console.log('   npm run setup:s3');
    } else if (error.code === 'CredentialsError') {
      console.log('\n🔑 Please check your AWS credentials in .env file');
    }

    process.exit(1);
  }
}

// Check for required environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_ACCESS_KEY_ID === 'your_access_key_here' ||
    process.env.AWS_SECRET_ACCESS_KEY === 'your_secret_key_here') {
  console.error('❌ Missing or invalid AWS credentials');
  console.log('\n📝 Please update your .env file with actual AWS credentials');
  console.log('   See AWS_S3_SETUP.md for detailed setup instructions');
  process.exit(1);
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('upload-all-platforms.js')) {
  uploadAllPlatforms();
}

export default uploadAllPlatforms;
