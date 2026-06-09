import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const requiredTrackedScripts = new Set([
  'scripts/convert-to-ico.mjs',
  'scripts/create-window-icon.mjs',
  'scripts/rename-main.mjs',
  'scripts/patch-electron-icon.js',
  'scripts/setup-s3.js',
  'scripts/create-installer.js',
  'scripts/create-installer-mac.js',
  'scripts/upload-installer.js',
  'scripts/upload-exe-installer.js',
  'scripts/upload-installer-mac.js',
  'scripts/upload-all-platforms.js',
  'scripts/verify-build.js',
  'scripts/build-exe-installer.js',
  'scripts/verify-release-alignment.js',
  'scripts/verify-release-scripts.js',
]);

const legacyIgnoredScripts = new Set([
  'scripts/clean-build.js',
  'scripts/create-exe-installer.js',
  'scripts/create-nsis-installer.js',
  'scripts/create-portable-exe.js',
  'scripts/create-proper-installer.js',
  'scripts/create-self-extracting-exe.js',
  'scripts/rename-main.js',
  'scripts/upload-nsis-installer.js',
]);

function fail(message) {
  console.error(`Release script verification failed: ${message}`);
  process.exitCode = 1;
}

function normalizePath(value) {
  return value.replaceAll('\\', '/');
}

function gitLsFiles(args) {
  try {
    return execFileSync('git', ['ls-files', ...args], {
      cwd: rootDir,
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .filter(Boolean)
      .map(normalizePath);
  } catch (error) {
    throw new Error(`git ls-files failed: ${error.message}`);
  }
}

function extractScriptReferences(packageScripts) {
  const references = [];
  const pattern = /node\s+(scripts\/[^\s"'&|;]+)/g;

  for (const [scriptName, command] of Object.entries(packageScripts)) {
    for (const match of command.matchAll(pattern)) {
      references.push({
        packageScript: scriptName,
        scriptPath: normalizePath(match[1]),
      });
    }
  }

  return references;
}

function containsAwsSdkV2Import(source) {
  return /(?:from\s+['"]aws-sdk['"]|require\(\s*['"]aws-sdk['"]\s*\))/.test(source);
}

const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const references = extractScriptReferences(packageJson.scripts ?? {});
const trackedFiles = new Set(gitLsFiles(['scripts']));

for (const scriptPath of requiredTrackedScripts) {
  if (!trackedFiles.has(scriptPath)) {
    fail(`Required release script is not tracked: ${scriptPath}`);
  }
}

for (const { packageScript, scriptPath } of references) {
  const absolutePath = path.join(rootDir, scriptPath);
  const exists = fs.existsSync(absolutePath);
  const tracked = trackedFiles.has(scriptPath);
  const legacy = legacyIgnoredScripts.has(scriptPath);

  console.log(
    `${packageScript}: ${scriptPath} (${tracked ? 'tracked' : 'untracked'})`
  );

  if (!exists) {
    fail(`Package script "${packageScript}" references missing file: ${scriptPath}`);
  }

  if (legacy) {
    fail(`Package script "${packageScript}" references ignored legacy script: ${scriptPath}`);
  }

  if (!tracked) {
    fail(`Package script "${packageScript}" references untracked script: ${scriptPath}`);
  }

  if (containsAwsSdkV2Import(fs.readFileSync(absolutePath, 'utf8'))) {
    fail(
      `Package-referenced script ${scriptPath} imports aws-sdk v2. Use @aws-sdk/* v3 clients or remove the package reference.`
    );
  }
}

for (const legacyScript of legacyIgnoredScripts) {
  const referenced = references.some(({ scriptPath }) => scriptPath === legacyScript);
  if (referenced) {
    fail(`Ignored legacy script is package-referenced: ${legacyScript}`);
  }
}

if (process.exitCode === 1) {
  process.exit(1);
}

console.log('Release script verification passed.');
