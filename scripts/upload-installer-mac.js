import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import createMacInstaller from './create-installer-mac.js';
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

async function uploadMacInstaller() {
  try {
    console.log('🚀 Starting MixFade macOS installer upload process...');

    // First, create the installer if it doesn't exist
    console.log('📦 Checking/creating macOS installer package...');
    const installerInfo = await createMacInstaller();

    if (!fs.existsSync(installerInfo.path)) {
      console.error('❌ macOS Installer file not found:', installerInfo.path);
      process.exit(1);
    }

    console.log('📤 Uploading macOS installer to S3...');

    // Read the installer file
    const fileContent = fs.readFileSync(installerInfo.path);

    // S3 key (path in bucket)
    const s3Key = `releases/macos/${installerInfo.name}`;

    // Upload parameters
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/x-apple-diskimage',
      ContentDisposition: `attachment; filename="${installerInfo.name}"`,
      Metadata: {
        'version': installerInfo.version,
        'platform': 'macos',
        'architecture': 'universal',
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
    console.log('\n✅ macOS Upload completed successfully!');

    // Generate download URL
    const downloadUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

    console.log(`\n📋 Upload Details:`);
    console.log(`   File: ${installerInfo.name}`);
    console.log(`   Size: ${(installerInfo.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   S3 Location: s3://${bucketName}/${s3Key}`);
    console.log(`   Download URL: ${downloadUrl}`);

    // Update/create release metadata to include macOS
    console.log('📝 Updating release metadata with macOS info...');

    let releaseMetadata;

    // Try to get existing metadata
    try {
      const existingMetadata = await s3.getObject({
        Bucket: bucketName,
        Key: 'releases/latest.json'
      }).promise();

      releaseMetadata = JSON.parse(existingMetadata.Body.toString());
      console.log('📄 Found existing release metadata, updating...');
    } catch (error) {
      // Create new metadata if it doesn't exist
      console.log('📄 Creating new release metadata...');
      releaseMetadata = {
        version: installerInfo.version,
        releaseDate: new Date().toISOString(),
        files: {},
        changelog: `MixFade ${installerInfo.version} - Multi-platform Release`,
        minimumSystemVersion: "10.15.0"
      };
    }

    // Add macOS info to metadata
    releaseMetadata.files.macos = {
      url: downloadUrl,
      size: installerInfo.size,
      filename: installerInfo.name
    };

    // Update version and date if this is newer
    releaseMetadata.version = installerInfo.version;
    releaseMetadata.releaseDate = new Date().toISOString();

    // Upload updated metadata
    await s3.upload({
      Bucket: bucketName,
      Key: 'releases/latest.json',
      Body: JSON.stringify(releaseMetadata, null, 2),
      ContentType: 'application/json'
    }).promise();

    console.log('✅ Release metadata updated with macOS info');

    console.log('\n🎉 MixFade macOS installer deployment completed!');
    console.log(`\n🌐 Access URLs:`);
    console.log(`   Direct Download: ${downloadUrl}`);
    console.log(`   Release Info: https://${bucketName}.s3.amazonaws.com/releases/latest.json`);

    console.log(`\n📱 Share with macOS users:`);
    console.log(`   "Download MixFade ${installerInfo.version} for macOS:`);
    console.log(`   ${downloadUrl}"`);

    return {
      downloadUrl,
      version: installerInfo.version,
      size: installerInfo.size,
      platform: 'macOS'
    };

  } catch (error) {
    console.error('❌ Error uploading macOS installer:', error.message);

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
if (process.argv[1] && process.argv[1].endsWith('upload-installer-mac.js')) {
  uploadMacInstaller();
}

export default uploadMacInstaller;
