# MixFade Release Scripts

This directory contains the tracked scripts used by package commands. The
canonical Windows web release path is the NSIS installer upload flow.

## Canonical Local Validation

Run these before preparing a release:

```bash
npm run check
npm run release:verify
npm run build:icon
```

For a single release-readiness gate that does not upload anything:

```bash
npm run release:check
```

## Canonical Windows Release Build

```bash
npm run build:exe
```

This creates:

```text
release/MixFade Setup <version>.exe
```

## Canonical Windows S3 Deploy

```bash
npm run deploy:exe
```

Current deploy sequence:

```text
build:exe -> release:verify -> upload:installer:exe
```

Current S3 object pattern:

```text
s3://mixfade/releases/v<version>/MixFade Setup <version>.exe
```

Current public URL pattern:

```text
https://mixfade.s3.us-east-1.amazonaws.com/releases/v<version>/MixFade%20Setup%20<version>.exe
```

## Source Of Truth

```text
package.json
scripts/build-exe-installer.js
scripts/verify-release-alignment.js
scripts/upload-exe-installer.js
../mixfade-landing/frontend/src/config/downloads.ts
```

## Secondary Helpers

The following tracked scripts are retained for secondary setup or
multi-platform packaging flows. They are not the canonical Windows web release
path:

```text
scripts/setup-s3.js
scripts/create-installer.js
scripts/create-installer-mac.js
scripts/upload-installer.js
scripts/upload-installer-mac.js
scripts/upload-all-platforms.js
```

Some secondary helpers still use AWS SDK v2. Removing `aws-sdk` requires either
migrating those helpers to AWS SDK v3 or removing their package commands from
the supported tool surface.

## Ignored Legacy Scripts

Ignored legacy scripts under `scripts/` are local reference artifacts and are
not part of supported release automation unless they are unignored, tracked,
documented, and verified.
