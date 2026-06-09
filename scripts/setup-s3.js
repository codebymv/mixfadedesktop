import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
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

async function setupS3Bucket() {
  try {
    console.log('🚀 Setting up AWS S3 bucket for MixFade releases...');

    // Check if bucket exists
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log(`✅ Bucket '${bucketName}' already exists`);
    } catch (error) {
      if (error.statusCode === 404) {
        // Create bucket
        console.log(`📦 Creating bucket '${bucketName}'...`);
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`✅ Bucket '${bucketName}' created successfully`);
      } else {
        throw error;
      }
    }

    // Configure bucket for public read access
    console.log('🔧 Configuring bucket policy...');

    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };

    await s3.putBucketPolicy({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    }).promise();

    // Disable block public access for this specific use case
    await s3.putPublicAccessBlock({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    }).promise();

    console.log('✅ Bucket policy configured for public read access');

    // Configure CORS for web downloads
    console.log('🌐 Configuring CORS...');

    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'HEAD'],
          AllowedOrigins: ['*'],
          MaxAgeSeconds: 3000
        }
      ]
    };

    await s3.putBucketCors({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    }).promise();

    console.log('✅ CORS configured successfully');

    // Create releases folder structure
    console.log('📁 Creating folder structure...');

    const folders = ['releases/', 'releases/windows/', 'releases/mac/', 'releases/linux/'];

    for (const folder of folders) {
      await s3.putObject({
        Bucket: bucketName,
        Key: folder,
        Body: ''
      }).promise();
    }

    console.log('✅ Folder structure created');

    console.log('\n🎉 AWS S3 setup completed successfully!');
    console.log(`\n📋 Bucket Details:`);
    console.log(`   Name: ${bucketName}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`   URL: https://${bucketName}.s3.amazonaws.com/`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Build your installer: npm run dist`);
    console.log(`   2. Create installer package: npm run create:installer`);
    console.log(`   3. Upload to S3: npm run upload:installer`);

  } catch (error) {
    console.error('❌ Error setting up S3 bucket:', error.message);

    if (error.code === 'CredentialsError' || error.code === 'SignatureDoesNotMatch') {
      console.log('\n🔑 Please check your AWS credentials:');
      console.log('   - AWS_ACCESS_KEY_ID');
      console.log('   - AWS_SECRET_ACCESS_KEY');
      console.log('   - AWS_REGION (optional, defaults to us-east-1)');
    }

    process.exit(1);
  }
}

// Check for required environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_ACCESS_KEY_ID === 'your_access_key_here' ||
    process.env.AWS_SECRET_ACCESS_KEY === 'your_secret_key_here') {
  console.error('❌ Missing or invalid AWS credentials');
  console.log('\n📝 Please update your .env file with actual AWS credentials:');
  console.log('   1. Copy .env.example to .env (if not done already)');
  console.log('   2. Replace placeholder values with your actual AWS credentials:');
  console.log('      AWS_ACCESS_KEY_ID=AKIA... (your actual access key)');
  console.log('      AWS_SECRET_ACCESS_KEY=... (your actual secret key)');
  console.log('   3. Optionally set AWS_REGION and AWS_S3_BUCKET');
  console.log('\n🔑 Get AWS credentials from:');
  console.log('   AWS Console → IAM → Users → Your User → Security Credentials');
  console.log('\n📖 See AWS_S3_SETUP.md for detailed instructions');
  process.exit(1);
}

setupS3Bucket();
