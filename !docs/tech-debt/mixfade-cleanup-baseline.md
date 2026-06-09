# Mixfade Electron Cleanup Baseline

Date: 2026-06-09

## Scope

This checkpoint focuses on `mixfadeElectron`. The wrapper folder `mixfade.com` is not a git repo, and `mixfade-landing` is deferred until the Electron gates are stable.

Accepted constraints:

- `release/` is generated packaged output and is excluded from source lint/test gates.
- `dist/` and `dist-renderer/` are build outputs and are excluded from source lint/test gates.
- `mixfade-vst.md` is preexisting untracked user work and was not touched.
- Audio behavior, crossfade behavior, visualization math, package version semantics, installer scripts, and UI copy were not intentionally changed.

## Initial Baseline

- `mixfade-landing`: `npm run lint` passed with `0 errors / 8 warnings`.
- `mixfadeElectron`: `npm run lint` failed with `138 errors / 8 warnings`.
- `mixfadeElectron`: lint excluding `release/` dropped to about `69 errors / 4 warnings`.
- `mixfadeElectron`: `npm test -- --runInBand` failed.

Initial test failure classes:

- Jest scanned `release/mixfade-win32-x64/resources/app/package.json`, causing a haste package-name collision.
- Jest did not define Vite's runtime `__APP_VERSION__` global.
- `FilesPanel` tests expected stale dropzone copy.
- `WaveformPlayer` tests used stale metadata mock shape and jsdom-incomplete audio mocks.
- App state tests had stale expectations for settings defaults, upload text, and direct recent-file storage behavior.

## Cleanup Completed

- ESLint and Jest now ignore generated output: `release/`, `dist/`, and `dist-renderer/`.
- Jest setup defines `__APP_VERSION__` as `0.9.8`.
- Electron tests were updated to match current UI and hook contracts.
- Source lint errors from unused imports/locals, stale props, empty catch blocks, and CommonJS benchmark imports were removed.
- Fast-refresh warnings were cleared by moving non-component exports to sidecar modules.
- `WaveformPlayer` imperative-handle dependencies were tightened.
- Added scripts:
  - `npm run check:quick`
  - `npm run check`

## Latest Verification

Passing:

- `npm run lint`: `0 errors / 0 warnings`
- `npm test -- --runInBand`: `13 suites / 212 tests`
- `npm run build`
- `npm run check`

Build warnings still accepted for follow-up:

- `caniuse-lite` / Browserslist database is outdated.
- Renderer main chunk is larger than 500 kB after minification.

## Current Hotspots

- `src/components/sidebar/analysis/useSmoothedAnalysis.ts`: 350 LOC
- `src/components/WaveformPlayer.tsx`: 309 LOC

`AnalysisPanel.tsx` is no longer a hotspot after the sidebar analysis split. `WaveformPlayer.tsx` is now below the file-size risk threshold after the render and audio lifecycle splits. `useSmoothedAnalysis.ts` is still the densest remaining local module, but it is now mostly live smoothing effects.

## Audio Analysis Split Checkpoint

`src/utils/audioAnalysis.ts` is now a compatibility facade. Existing imports from `src/utils/audioAnalysis.ts` remain valid, while the implementation lives under `src/utils/audio/`.

New module layout:

- `src/utils/audio/types.ts`: shared analysis interfaces.
- `src/utils/audio/levels.ts`: RMS averaging and level/LUFS helpers.
- `src/utils/audio/stereo.ts`: stereo averaging and phase/width/mid-side helpers.
- `src/utils/audio/frequency.ts`: frequency averaging and frequency metrics.
- `src/utils/audio/spectrogram.ts`: spectrogram averaging, buffer, and metrics.
- `src/utils/audio/index.ts`: aggregate exports and `AudioUtils` compatibility object.
- `src/utils/audioAnalysis.ts`: public compatibility facade.

Latest LOC counts:

- `src/utils/audioAnalysis.ts`: 19 LOC
- `src/utils/audio/types.ts`: 55 LOC
- `src/utils/audio/levels.ts`: 192 LOC
- `src/utils/audio/stereo.ts`: 245 LOC
- `src/utils/audio/frequency.ts`: 211 LOC
- `src/utils/audio/spectrogram.ts`: 329 LOC
- `src/utils/audio/index.ts`: 68 LOC

Verification after split:

- `npm run lint`: passes with `0 errors / 0 warnings`
- `npm test -- --runInBand`: passes with `13 suites / 212 tests`
- `npm run build`: passes
- `npm run check`: passes

Accepted remaining warnings/noise:

- Browserslist/caniuse-lite is outdated.
- Vite reports the renderer main chunk above 500 kB.
- Jest still emits known async `WaveformPlayer` console noise, but tests pass.

## Sidebar Analysis Split Checkpoint

`src/components/sidebar/AnalysisPanel.tsx` is now a coordinator for the analysis sidebar. The local collapsed-section persistence, collapsible card shell, shared prop/snapshot types, and smoothed analysis state machine were moved into focused modules under `src/components/sidebar/analysis/`.

New module layout:

- `src/components/sidebar/analysis/types.ts`: `AnalysisPanelProps` and `AnalysisSnapshot`.
- `src/components/sidebar/analysis/useCollapsedSections.ts`: persisted collapsed-section state.
- `src/components/sidebar/analysis/CollapsibleCard.tsx`: reusable collapsible card wrapper.
- `src/components/sidebar/analysis/useSmoothedAnalysis.ts`: analysis smoothing, recent snapshots, and crossfade snapshot selection.
- `src/components/sidebar/AnalysisPanel.tsx`: public panel coordinator and existing render composition.

Latest LOC counts:

- `src/components/sidebar/AnalysisPanel.tsx`: 156 LOC
- `src/components/sidebar/analysis/types.ts`: 41 LOC
- `src/components/sidebar/analysis/useCollapsedSections.ts`: 28 LOC
- `src/components/sidebar/analysis/CollapsibleCard.tsx`: 44 LOC
- `src/components/sidebar/analysis/useSmoothedAnalysis.ts`: 441 LOC
- `src/components/WaveformPlayer.tsx`: 557 LOC

Verification after split:

- `npm run lint`: passes with `0 errors / 0 warnings`
- `npm test -- --runInBand`: passes with `13 suites / 212 tests`
- `npm run build`: passes
- `npm run check`: passes

Accepted remaining warnings/noise:

- Browserslist/caniuse-lite is outdated.
- Vite reports the renderer main chunk above 500 kB.
- Jest still emits known async `WaveformPlayer` console noise, but tests pass.

## Waveform Player Render Split Checkpoint

`src/components/WaveformPlayer.tsx` now keeps the playback state, audio initialization, analysis hook wiring, and imperative ref handle local, while public types and render-only header/error surfaces live beside the waveform components.

New module layout:

- `src/components/waveform/waveformPlayerTypes.ts`: `WaveformPlayerProps`, `WaveformPlayerRef`, and shared render config shape.
- `src/components/waveform/WaveformPlayerHeader.tsx`: play/link/loop/volume/time header rendering.
- `src/components/waveform/WaveformPlayerError.tsx`: retryable error state rendering.
- `src/components/WaveformPlayer.tsx`: public player component, audio lifecycle, playback controls, and existing ref API.

Latest LOC counts:

- `src/components/WaveformPlayer.tsx`: 469 LOC
- `src/components/waveform/WaveformPlayerHeader.tsx`: 120 LOC
- `src/components/waveform/WaveformPlayerError.tsx`: 20 LOC
- `src/components/waveform/waveformPlayerTypes.ts`: 52 LOC
- `src/components/sidebar/analysis/useSmoothedAnalysis.ts`: 441 LOC

Verification after split:

- `npm run lint`: passes with `0 errors / 0 warnings`
- `npm test -- --runInBand __tests__/components/WaveformPlayer.test.tsx`: passes with `17 tests`
- `npm run check`: passes

Accepted remaining warnings/noise:

- Browserslist/caniuse-lite is outdated.
- Vite reports the renderer main chunk above 500 kB.
- Jest still emits known async `WaveformPlayer` console noise, but tests pass.

## Waveform Player Audio Lifecycle Split Checkpoint

`src/components/WaveformPlayer.tsx` now delegates audio element lifecycle, object URL tracking, file initialization, metadata extraction, waveform generation, element event listeners, loading/error state, and retry behavior to `src/components/waveform/useWaveformPlayerAudio.ts`.

New module layout:

- `src/components/waveform/useWaveformPlayerAudio.ts`: audio ref, file initialization, volume syncing, event listeners, metadata/waveform generation, and retry state.
- `src/components/WaveformPlayer.tsx`: public player component, playback controls, deck volume/mute/loop handlers, analysis hook wiring, waveform click seeking, and existing ref API.

Latest LOC counts:

- `src/components/WaveformPlayer.tsx`: 309 LOC
- `src/components/waveform/useWaveformPlayerAudio.ts`: 212 LOC
- `src/components/waveform/WaveformPlayerHeader.tsx`: 120 LOC
- `src/components/waveform/WaveformPlayerError.tsx`: 20 LOC
- `src/components/waveform/waveformPlayerTypes.ts`: 52 LOC
- `src/components/sidebar/analysis/useSmoothedAnalysis.ts`: 441 LOC

Verification after split:

- `npm run lint`: passes with `0 errors / 0 warnings`
- `npm test -- --runInBand __tests__/components/WaveformPlayer.test.tsx`: passes with `17 tests`
- `npm run check`: passes

Accepted remaining warnings/noise:

- Browserslist/caniuse-lite is outdated.
- Vite reports the renderer main chunk above 500 kB.
- Jest still emits known async `WaveformPlayer` console noise, but tests pass.

## Analysis Snapshot Split Checkpoint

`src/components/sidebar/analysis/useSmoothedAnalysis.ts` now keeps live smoothing effects local and delegates snapshot building, crossfade/post-crossfade snapshot selection, and recent-analysis persistence to focused sidecar modules.

New module layout:

- `src/components/sidebar/analysis/analysisSnapshots.ts`: pure snapshot construction, faded-track selection, recent snapshot selection, and smoothed-data presence checks.
- `src/components/sidebar/analysis/useRecentAnalysisSnapshots.ts`: localStorage persistence and paused-analysis snapshot capture.
- `src/components/sidebar/analysis/useSmoothedAnalysis.ts`: live RMS/frequency/stereo/spectrogram smoothing and crossfade snapshot capture state.

Latest LOC counts:

- `src/components/sidebar/analysis/useSmoothedAnalysis.ts`: 350 LOC
- `src/components/sidebar/analysis/analysisSnapshots.ts`: 151 LOC
- `src/components/sidebar/analysis/useRecentAnalysisSnapshots.ts`: 93 LOC
- `src/components/WaveformPlayer.tsx`: 309 LOC

Verification after split:

- `npm run lint`: passes with `0 errors / 0 warnings`
- `npm run check`: passes

Accepted remaining warnings/noise:

- Browserslist/caniuse-lite is outdated.
- Vite reports the renderer main chunk above 500 kB.
- Jest still emits known async `WaveformPlayer` console noise, but tests pass.

## Follow-Up Plan

1. Optionally split `src/components/sidebar/analysis/useSmoothedAnalysis.ts` further by extracting per-signal smoothing hooks.
2. Optionally extract `WaveformPlayer` imperative-handle helpers if the player needs another pass.
3. Investigate renderer chunk size and add stable manual chunks only if it improves load behavior.
4. Update Browserslist database in a separate tooling-only change.

## Guardrails

For follow-up cleanup phases:

- Keep audio formulas, crossfade formulas, waveform geometry/timing, visualizer behavior, app routes, package version source, and installer packaging behavior stable.
- Keep `release/` present but outside source gates.
- Do not touch `mixfade-vst.md` unless explicitly requested.
- End each batch with `npm run check`, `git status --short`, and a review of generated-output churn.
