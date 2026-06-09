import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const landingDownloadsPath = path.resolve(
  rootDir,
  '..',
  'mixfade-landing',
  'frontend',
  'src',
  'config',
  'downloads.ts'
);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
);
const version = packageJson.version;
const installerName = `MixFade Setup ${version}.exe`;
const installerPath = path.join(rootDir, 'release', installerName);
const expectedDownloadUrl = `https://mixfade.s3.us-east-1.amazonaws.com/releases/v${version}/MixFade%20Setup%20${version}.exe`;

function fail(message) {
  console.error(`Release alignment failed: ${message}`);
  process.exitCode = 1;
}

function extractSingle(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) {
    fail(`Could not find ${label} in landing downloads config.`);
    return '';
  }
  return match[1];
}

if (!version) {
  fail('package.json has no version.');
}

if (!fs.existsSync(installerPath)) {
  fail(`Expected installer does not exist: ${installerPath}`);
} else {
  const stats = fs.statSync(installerPath);
  const sizeMb = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
  console.log(`Installer: ${installerName}`);
  console.log(`Installer size: ${sizeMb}`);

  if (fs.existsSync(landingDownloadsPath)) {
    const source = fs.readFileSync(landingDownloadsPath, 'utf8');
    const currentVersion = extractSingle(
      source,
      /export const CURRENT_VERSION = '([^']+)'/,
      'CURRENT_VERSION'
    );
    const advertisedSize = extractSingle(
      source,
      /export const DOWNLOAD_URLS:[\s\S]*?createDownloads\([\s\S]*?CURRENT_VERSION,[\s\S]*?`[^`]+`,\s*'([^']+)'/,
      'current download size'
    );

    if (currentVersion !== version) {
      fail(
        `Electron package version ${version} does not match landing CURRENT_VERSION ${currentVersion}.`
      );
    }

    if (!source.includes(expectedDownloadUrl)) {
      fail(`Landing downloads config does not include ${expectedDownloadUrl}.`);
    }

    if (advertisedSize !== sizeMb) {
      fail(
        `Landing current download size ${advertisedSize} does not match installer size ${sizeMb}.`
      );
    }

    if (process.exitCode !== 1) {
      console.log('Landing download metadata is aligned.');
    }
  } else {
    console.log(`Landing downloads config not found at ${landingDownloadsPath}; skipped.`);
  }
}

if (process.exitCode === 1) {
  process.exit(1);
}

console.log('Release alignment check passed.');
