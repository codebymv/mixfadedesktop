import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import createInstaller from './create-installer.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET || 'mixfade-releases';

async function uploadInstaller() {
  try {
    console.log('🚀 Starting MixFade installer upload process...');

    // First, create the installer if it doesn't exist
    console.log('📦 Checking/creating installer package...');
    const installerInfo = await createInstaller();

    if (!fs.existsSync(installerInfo.path)) {
      console.error('❌ Installer file not found:', installerInfo.path);
      process.exit(1);
    }

    console.log('📤 Uploading installer to S3...');

    // Read the installer file
    const fileContent = fs.readFileSync(installerInfo.path);

    // S3 key (path in bucket)
    const s3Key = `releases/windows/${installerInfo.name}`;

    // Upload parameters
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/zip',
      ContentDisposition: `attachment; filename="${installerInfo.name}"`,
      Metadata: {
        'version': installerInfo.version,
        'platform': 'windows',
        'architecture': 'x64',
        'upload-date': new Date().toISOString()
      }
    };

    // Upload with progress
    const upload = s3.upload(uploadParams);

    upload.on('httpUploadProgress', (progress) => {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      process.stdout.write(`\r📊 Upload progress: ${percent}%`);
    });

    const result = await upload.promise();
    console.log('\n✅ Upload completed successfully!');

    // Generate download URL
    const downloadUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

    console.log(`\n📋 Upload Details:`);
    console.log(`   File: ${installerInfo.name}`);
    console.log(`   Size: ${(installerInfo.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   S3 Location: s3://${bucketName}/${s3Key}`);
    console.log(`   Download URL: ${downloadUrl}`);

    // Create/update latest.json for auto-updater compatibility
    console.log('📝 Creating release metadata...');

    const releaseMetadata = {
      version: installerInfo.version,
      releaseDate: new Date().toISOString(),
      files: {
        windows: {
          url: downloadUrl,
          size: installerInfo.size,
          filename: installerInfo.name
        }
      },
      changelog: `MixFade ${installerInfo.version} - Windows Release`,
      minimumSystemVersion: "10.0.0"
    };

    // Upload metadata
    await s3.upload({
      Bucket: bucketName,
      Key: 'releases/latest.json',
      Body: JSON.stringify(releaseMetadata, null, 2),
      ContentType: 'application/json'
    }).promise();

    console.log('✅ Release metadata uploaded');

    // Create a simple download page HTML
    const downloadPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download MixFade</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .logo {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .version {
            color: #666;
            margin-bottom: 30px;
        }
        .download-btn {
            display: inline-block;
            background: #007AFF;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.1em;
            transition: background 0.2s;
        }
        .download-btn:hover {
            background: #0056CC;
        }
        .info {
            margin-top: 30px;
            color: #666;
            font-size: 0.9em;
        }
        .requirements {
            margin-top: 20px;
            text-align: left;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎵 MixFade</div>
        <div class="version">Version ${installerInfo.version}</div>

        <a href="${downloadUrl}" class="download-btn" download>
            📥 Download for Windows
        </a>

        <div class="info">
            <strong>File:</strong> ${installerInfo.name}<br>
            <strong>Size:</strong> ${(installerInfo.size / (1024 * 1024)).toFixed(2)} MB<br>
            <strong>Platform:</strong> Windows 10+ (64-bit)
        </div>

        <div class="requirements">
            <h3>📋 Installation Instructions</h3>
            <ol>
                <li>Download the zip file above</li>
                <li>Extract all files to a folder (e.g., C:\\Program Files\\MixFade)</li>
                <li>Run MixFade.exe to start the application</li>
                <li>Create a desktop shortcut if desired</li>
            </ol>

            <h3>⚙️ System Requirements</h3>
            <ul>
                <li>Windows 10 or later (64-bit)</li>
                <li>4 GB RAM minimum</li>
                <li>500 MB free disk space</li>
            </ul>
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

    console.log('✅ Download page created');

    console.log('\n🎉 MixFade installer deployment completed!');
    console.log(`\n🌐 Access URLs:`);
    console.log(`   Download Page: https://${bucketName}.s3.amazonaws.com/index.html`);
    console.log(`   Direct Download: ${downloadUrl}`);
    console.log(`   Release Info: https://${bucketName}.s3.amazonaws.com/releases/latest.json`);

    console.log(`\n📱 Share with users:`);
    console.log(`   "Download MixFade ${installerInfo.version} for Windows:`);
    console.log(`   https://${bucketName}.s3.amazonaws.com/index.html"`);

    return {
      downloadUrl,
      version: installerInfo.version,
      size: installerInfo.size
    };

  } catch (error) {
    console.error('❌ Error uploading installer:', error.message);

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
if (process.argv[1] && process.argv[1].endsWith('upload-installer.js')) {
  uploadInstaller();
}

export default uploadInstaller;
