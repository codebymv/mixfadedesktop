import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

dotenv.config();

const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
);
const version = packageJson.version || '1.0.0';
const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET || 'mixfade';
const installerName = `MixFade Setup ${version}.exe`;
const s3Key = `releases/v${version}/${installerName}`;

const requiredEnv = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];

function validateAwsEnv() {
  const missing = requiredEnv.filter((key) => {
    const value = process.env[key];
    return !value || value === 'your_access_key_here' || value === 'your_secret_key_here';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing or invalid AWS environment variables: ${missing.join(', ')}`
    );
  }
}

function getInstallerInfo() {
  const releaseDir = path.join(rootDir, 'release');
  const installerPath = path.join(releaseDir, installerName);

  if (!fs.existsSync(installerPath)) {
    const available = fs.existsSync(releaseDir)
      ? fs.readdirSync(releaseDir).filter((file) => file.endsWith('.exe'))
      : [];
    const availableText =
      available.length > 0
        ? ` Available installers: ${available.join(', ')}.`
        : '';

    throw new Error(
      `Installer not found at ${installerPath}. Run npm run build:exe first.${availableText}`
    );
  }

  const stats = fs.statSync(installerPath);
  return {
    installerPath,
    stats,
    sizeMb: (stats.size / (1024 * 1024)).toFixed(2),
  };
}

function getDownloadUrl() {
  return `https://${bucketName}.s3.${region}.amazonaws.com/releases/v${version}/${encodeURIComponent(installerName)}`;
}

function createReleaseMetadata(downloadUrl, stats) {
  return {
    version,
    releaseDate: new Date().toISOString(),
    files: {
      windows: {
        url: downloadUrl,
        size: stats.size,
        filename: installerName,
        type: 'nsis-installer',
      },
    },
    changelog: `MixFade ${version} - Windows Release`,
    minimumSystemVersion: '10.0.0',
  };
}

function createDownloadPage(downloadUrl, sizeMb) {
  return `<!DOCTYPE html>
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
    .highlight {
      background: #e8f5e8;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      border-left: 4px solid #28a745;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">MixFade</div>
    <div class="version">Version ${version}</div>

    <div class="highlight">
      <strong>Easy Installation</strong><br>
      Single-click installer - no extraction needed.
    </div>

    <a href="${downloadUrl}" class="download-btn" download>
      Download Installer
    </a>

    <div class="info">
      <strong>File:</strong> ${installerName}<br>
      <strong>Size:</strong> ${sizeMb} MB<br>
      <strong>Platform:</strong> Windows 10+ (64-bit)
    </div>

    <div class="requirements">
      <h3>Installation Instructions</h3>
      <ol>
        <li><strong>Download</strong> the installer above</li>
        <li><strong>Run</strong> the downloaded .exe file</li>
        <li><strong>Follow</strong> the installation wizard</li>
        <li><strong>Launch</strong> MixFade from Start Menu or Desktop</li>
      </ol>

      <h3>Security Notice</h3>
      <p>Windows may show a security warning because the app is not code-signed yet. Click "More info" then "Run anyway" to proceed with installation.</p>

      <h3>System Requirements</h3>
      <ul>
        <li>Windows 10 or later (64-bit)</li>
        <li>4 GB RAM minimum</li>
        <li>500 MB free disk space</li>
      </ul>

      <h3>Uninstallation</h3>
      <p>Use Windows "Add or Remove Programs" to uninstall MixFade cleanly.</p>
    </div>
  </div>
</body>
</html>`;
}

async function putTextObject(s3, key, body, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    })
  );
}

async function uploadExeInstaller() {
  validateAwsEnv();

  const { installerPath, stats, sizeMb } = getInstallerInfo();
  const downloadUrl = getDownloadUrl();
  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  console.log('Starting MixFade Windows installer upload...');
  console.log(`Installer: ${installerPath}`);
  console.log(`Size: ${sizeMb} MB`);
  console.log(`S3 target: s3://${bucketName}/${s3Key}`);

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: s3Key,
      Body: fs.createReadStream(installerPath),
      ContentType: 'application/octet-stream',
      ContentDisposition: `attachment; filename="${installerName}"`,
      ServerSideEncryption: 'AES256',
      Metadata: {
        version,
        platform: 'windows',
        architecture: 'x64',
        'installer-type': 'nsis',
        'upload-date': new Date().toISOString(),
      },
    },
  });

  upload.on('httpUploadProgress', (progress) => {
    if (!progress.total) {
      return;
    }
    const percent = Math.round((progress.loaded / progress.total) * 100);
    process.stdout.write(`\rUpload progress: ${percent}%`);
  });

  await upload.done();
  console.log('\nInstaller upload completed.');

  await putTextObject(
    s3,
    'releases/latest.json',
    JSON.stringify(createReleaseMetadata(downloadUrl, stats), null, 2),
    'application/json'
  );
  console.log('Release metadata uploaded.');

  await putTextObject(
    s3,
    'index.html',
    createDownloadPage(downloadUrl, sizeMb),
    'text/html'
  );
  console.log('Download page uploaded.');

  console.log('\nMixFade Windows installer deployment completed.');
  console.log(`Download page: https://${bucketName}.s3.amazonaws.com/index.html`);
  console.log(`Direct download: ${downloadUrl}`);
  console.log(`Release info: https://${bucketName}.s3.amazonaws.com/releases/latest.json`);

  return {
    downloadUrl,
    version,
    size: stats.size,
  };
}

if (process.argv[1] && process.argv[1].endsWith('upload-exe-installer.js')) {
  uploadExeInstaller().catch((error) => {
    console.error(`Upload failed: ${error.message}`);
    process.exit(1);
  });
}

export default uploadExeInstaller;
