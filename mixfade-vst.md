# MixFade VST Strategy

## Overview

Strategic vision for creating a MixFade VST plugin that complements the existing Electron desktop application, following the iZotope model of standalone apps and VST counterparts sharing brand identity and core technology.

## Inspiration: ADPTR Audio Metric AB

The MixFade VST is positioned similarly to the ADPTR Audio Metric AB Reference Plug-in:
- Single-track metering plugin for DAW integration
- Compares live DAW audio (A) against reference file (B)
- Provides professional analysis modules for mixing/mastering decisions
- Drag-and-drop reference loading functionality

## Product Architecture

### VST Plugin (MixFade Plugin)

**Core Function:**
- Single-track metering in DAW environment
- Live DAW audio stream (A) vs reference file loaded from disk (B)
- Real-time analysis with low-latency processing
- Sample-accurate metering for professional use

**Analysis Modules:**
- LUFS loudness metering (integrated, short-term)
- Stereo analysis (phase correlation, stereo width, balance)
- Frequency analysis (spectral balance, peak frequency)
- Waveform visualization
- Level meters (peak, RMS)

**Use Case:**
- Mixing/mastering engineers working within DAW workflow
- Real-time comparison against professional reference tracks
- Informed mixing decisions based on metering data
- DAW parameter automation integration

**Technical Requirements:**
- VST3, AU, AAX formats
- JUCE or iPlug2 framework
- Custom UI rendering to match MixFade visual language
- Real-time DSP processing with minimal latency

### Desktop Companion App (Current MixFade)

**Enhanced Capabilities Beyond VST:**

**1. Full Playback Control:**
- Load and play both audio files independently
- Crossfade between tracks with adjustable curves
- Loop regions, tempo adjustment, pitch shifting
- Complete transport controls (play/pause/seek/stop)

**2. Multi-Track Workflow:**
- Load multiple reference tracks simultaneously
- A/B/C comparison between several files
- Create reference libraries and playlists
- Batch analysis across multiple files

**3. Advanced Analysis:**
- Offline analysis of entire files (not just real-time)
- Export analysis reports (PDF, CSV)
- Historical tracking of analysis data over time
- Compare different versions of the same mix

**4. File Management:**
- Recent files library with quick access
- Reference track organization and tagging
- Metadata search and filtering
- File format conversion tools

**5. Education and Training:**
- Tutorial mode with guided analysis explanations
- Educational content explaining what each meter indicates
- AI-powered suggestions based on analysis data
- Reference track database with genre-specific benchmarks

## Feature Overlap Map

### Shared (Both Products)
- Analysis algorithms (LUFS, stereo, frequency calculations)
- Visual language and UI component library
- Meter display styles and visualization approaches
- Reference loading functionality
- Core brand identity and design system
- Color schemes, typography, iconography

### VST-Only Features
- Real-time DAW integration
- Sample-accurate metering
- Parameter automation within DAW
- Ultra-low latency processing requirements
- Single-track focus

### Desktop-Only Features
- File playback and crossfading
- Multi-track comparison capabilities
- Offline/batch analysis processing
- File management and organization
- Export and reporting functionality
- Educational and training features

## Technical Strategy

### Code Separation Architecture

**Shared Analysis Core:**
- Extract analysis logic into shared library (C++ or Rust)
- Electron app consumes shared library via FFI
- VST plugin consumes shared library directly
- Single source of truth for all analysis algorithms

**Build Pipeline:**
- Shared analysis core (C++/Rust for performance)
- Electron wrapper (React + shared library via FFI)
- VST wrapper (JUCE + shared library directly)
- Consistent testing across all platforms

### Implementation Approach

**Phase 1: Library Extraction**
- Extract analysis algorithms from `audioAnalysis.ts`
- Port to C++ with matching test coverage
- Create FFI bindings for Electron integration
- Validate numerical accuracy across implementations

**Phase 2: VST Development**
- Build JUCE-based VST shell
- Implement UI framework matching MixFade visual language
- Integrate shared analysis core
- Test across DAW platforms ( Ableton, Logic, Pro Tools)

**Phase 3: Desktop Integration**
- Update Electron app to use shared library via FFI
- Maintain existing React UI
- Add cross-product features (sync, export)
- Performance validation

## Product Synergy

### Cross-Product Features
- Reference files loaded in Desktop App sync to VST
- Analysis presets and settings shared between products
- Desktop App generates "reference profiles" for VST
- VST exports current state to Desktop App for deeper analysis
- Unified user account and license management

### Market Positioning
- **VST Plugin:** "Real-time analysis while you work in your DAW"
- **Desktop App:** "Deep analysis and reference management outside the DAW"
- **Bundle Offering:** "Complete MixFade analysis ecosystem"

## User Workflow Examples

### Scenario: Producer Comparing Mix to References

**VST Workflow:**
1. Working in DAW on their track
2. Insert MixFade VST on master bus
3. Drag reference track into plugin
4. See real-time comparison while making mix decisions
5. Adjust mix based on metering feedback
6. Automate parameters if needed

**Desktop App Workflow:**
1. Load finished mix into Desktop App
2. Load 5 different reference tracks
3. Compare mix against all references offline
4. Generate comprehensive analysis report
5. Use educational mode to understand improvement areas
6. Return to DAW with specific targets and benchmarks

### Scenario: Mastering Engineer

**VST Workflow:**
1. Insert on master bus during mastering
2. Compare against genre reference in real-time
3. Make precise adjustments based on metering
4. Verify loudness targets for distribution

**Desktop App Workflow:**
1. Batch analyze entire album against reference
2. Generate consistency reports across tracks
3. Create reference profiles for different streaming platforms
4. Export documentation for clients

## Advantages of This Approach

### Brand Consistency
- Users recognize MixFade quality across products
- Professional appearance maintained in all contexts
- Familiar UX reduces learning curve

### Development Efficiency
- Algorithm development happens once
- UI components conceptually reused
- Testing analysis logic benefits both products
- Shared documentation and educational content

### Market Expansion
- Reach DAW users who prefer plugin workflow
- Serve standalone users who need deeper analysis
- Cross-sell opportunities between products
- Professional credibility through multiple formats

## Challenges and Considerations

### UI Framework Mismatch
- React components don't translate directly to JUCE/iPlug2
- Need to rebuild UI in native framework while maintaining visual fidelity
- Custom drawing required for meters and visualizations
- Responsive design challenges in plugin context

### Performance Requirements
- VSTs have stricter real-time constraints than Electron
- Analysis code must be sample-accurate and low-latency
- Memory management more critical than in Electron
- DSP optimization may be required

### Plugin Format Complexity
- VST2, VST3, AU, AAX each have different requirements
- Platform-specific testing needed (Windows, macOS, Linux)
- Licensing and distribution different from Electron app
- App Store considerations for AU format

### Development Resources
- Need C++/Rust expertise for shared core
- JUCE or iPlug2 framework knowledge required
- Multi-platform testing infrastructure
- DAW compatibility testing across major platforms

## Feasibility Assessment

**Overall Feasibility: HIGH**

This approach is highly feasible as a product strategy because:
- Not "converting" the app, but creating complementary products
- Shared technology reduces duplication
- Clear market differentiation between products
- Proven model by companies like iZotope, FabFilter, Waves

**Key Success Factors:**
- Maintain visual identity consistency
- Ensure numerical accuracy across implementations
- Provide clear value proposition for each product
- Execute seamless cross-product integration

## Next Steps (Thought Experiment)

### Research Phase
- Study JUCE framework capabilities
- Analyze iZotope's technical approach
- Evaluate C++ vs Rust for shared core
- Assess market demand for MixFade VST

### Technical Planning
- Design shared library API
- Plan FFI integration for Electron
- Define VST feature set vs desktop features
- Create development timeline and resource estimates

### Market Validation
- Survey current MixFade users about VST interest
- Research pricing strategies for plugin vs bundle
- Identify key differentiators from existing metering plugins
- Test concept with target user segments

## Conclusion

The MixFade VST strategy leverages existing brand and technology while expanding market reach. By maintaining the shared analysis core and visual identity while creating purpose-built products for different workflows, MixFade can establish a comprehensive audio analysis ecosystem that serves both DAW users and standalone analysis needs.

This approach follows proven industry models while staying true to MixFade's core value proposition: professional-grade audio analysis with exceptional visual presentation.

---

# Part 2: Deeper Analysis (Post-Initial Plan)

This section adds rigor to the initial strategy by examining the competitive landscape, technical reality of the current codebase, and a realistic MVP scope.

## Competitive Analysis

### Direct Competitors (Reference + Metering Plugins)

| Plugin | Price | Strengths | Weaknesses | Key Differentiator |
|---|---|---|---|---|
| **ADPTR Metric AB** | $99 (sale) / $140 | 5 visual modules, 4 loudness matching modes, drag-drop reference, polished UI | Single-purpose plugin, no standalone | Reference comparison focus |
| **iZotope Insight 2** | $199 | True peak, integrated LUFS, surround support, Tonal Balance Control integration | Expensive, dense UI, no reference A/B | Mastering-grade accuracy |
| **Youlean Loudness Meter 2** | Free / $59 Pro | True LUFS (BS.1770-4), broadcast standards, free tier hooks users | Loudness-only, no spectral/stereo | Loudness specialization |
| **TBProAudio dpMeter5** | $59 | Multi-channel, broadcast compliance, extremely cheap | Utilitarian UI, niche audience | Compliance/value |
| **Waves WLM Plus** | $29-99 | Brand recognition, simple workflow | Old UI, basic features | Mass market |
| **MeterPlugs Perception AB** | $79 | Loudness-matched A/B, scientific approach | Limited visual modules | A/B switching focus |

### The Market Gap MixFade Could Fill

Looking at the matrix, here are underserved positions:

**Gap 1: "Reference + Standalone Ecosystem"**
- ADPTR has the reference workflow but no standalone counterpart
- iZotope has the standalone (Insight) but no integrated reference comparison
- **MixFade opportunity**: Ship both products from day one with seamless cross-product sync

**Gap 2: "Modern Visual Language"**
- Most metering plugins look like they're from 2010 (ADPTR is the modern exception)
- MixFade's existing UI/UX work is genuinely a differentiator
- **MixFade opportunity**: "The metering plugin that doesn't make your screen ugly"

**Gap 3: "Education-Forward Metering"**
- Insight assumes you know what you're looking at
- Youlean explains loudness but nothing else
- **MixFade opportunity**: Built-in interpretation, contextual hints, "what does this mean?"

**Gap 4: "Producer-Focused, Not Engineer-Focused"**
- Most metering plugins target mastering engineers
- Bedroom producers don't buy them because they look intimidating
- **MixFade opportunity**: Professional accuracy with approachable UX

### Realistic Positioning

**MixFade VST should not try to compete on:**
- Broadcast compliance (Youlean owns this)
- Mastering accuracy (Insight owns this)
- Price (TBProAudio owns this)

**MixFade VST should compete on:**
- Visual design and UX quality
- Reference-comparison workflow
- Integration with standalone app (unique)
- Educational/contextual presentation
- Producer-friendly approachability

**Likely Price Point**: $79-129 for VST, $49-79 for standalone, $99-149 bundle. Below iZotope, above Waves, comparable to ADPTR.

## Technical Feasibility Assessment

### Audit of Current Analysis Code

Reviewing `audioAnalysis.ts` (1,039 lines) and `useAudioAnalysis.ts` reveals what is portable vs what needs replacement:

#### What's Solid and Portable

**1. Phase Correlation** (lines 944-966)
- Proper Pearson correlation coefficient implementation
- Mathematically correct, directly portable to C++
- Numerical accuracy will match a reference implementation

**2. Stereo Width / Mid-Side** (lines 969-1003)
- Correct M/S matrix math: `M = (L+R)/2`, `S = (L-R)/2`
- Energy-based width calculation is standard
- Directly portable

**3. RMS Calculations** (lines 899-926)
- Standard RMS formula, correct implementation
- Trivially portable

**4. Frequency Band Analysis** (lines 564-647)
- Standard FFT bin-to-frequency mapping
- Bass/Mid/High band separation is correct
- Spectral centroid, rolloff, flatness all correctly implemented
- Portable, but FFT itself is provided by Web Audio API (need to replace with FFT library like FFTW, KissFFT, or pffft in C++)

**5. Smoothing/Averaging Classes** (RMSAverager, StereoAverager, FrequencyAverager)
- Well-designed running-sum implementations (O(1) updates)
- Directly portable to C++

#### What Needs Replacement, Not Porting

**1. LUFS Calculation** ⚠️ **CRITICAL GAP**

Current implementation (line 928-934):
```typescript
estimateLUFS: (rms: number): number => {
  // Simple LUFS estimation based on RMS
  if (rms <= 0) return -70;
  const db = AudioUtils.rmsToDb(rms);
  // Rough conversion to LUFS (this is a simplified approximation)
  return Math.max(-70, Math.min(0, db - 3));
}
```

This is **not real LUFS**. True LUFS per ITU-R BS.1770-4 requires:
- K-weighting filter (high-shelf at ~1681 Hz + high-pass at ~38 Hz)
- Channel weighting (L/R = 1.0, C = 1.0, Ls/Rs = 1.41)
- Mean square calculation over gating blocks (400ms momentary, 3s short-term)
- Absolute gating at -70 LUFS, relative gating at -10 LU

**Implication**: For a VST competing with Youlean and Insight, this must be rebuilt from scratch. This is a significant DSP task, not a port.

**2. True Peak Detection** ⚠️ **MISSING**

Current code only computes sample peak. True peak (per BS.1770-4) requires:
- 4x oversampling using polyphase FIR filter
- Inter-sample peak detection
- dBTP (decibels True Peak) reporting

This is missing entirely. Mastering engineers will reject a meter that doesn't show true peak.

**3. Sample-Rate Handling**

`calculateFrequencyMetrics` hardcodes `sampleRate = 48000` (line 576). Real-world DAWs run at 44.1, 48, 88.2, 96, 176.4, 192 kHz. VST must respect host sample rate.

**4. Update Cadence**

Current code uses `setInterval` at 30-60 FPS for analysis (`useAudioAnalysis.ts` line 141). VSTs process audio in `processBlock` callbacks (typically 64-512 samples per block at host's sample rate). The entire timing model is different:

- Web Audio: Pull-based, ~16ms block, async
- VST: Push-based, sample-accurate, synchronous, real-time priority thread

This isn't a port - it's a fundamentally different processing model.

**5. Float Precision**

Stereo analysis uses `getByteTimeDomainData` (8-bit) and converts to float (line 38-50 of `useAudioAnalysis.ts`). VST receives 32-bit float natively. Higher precision → different numerical results.

### Effort Estimate for Algorithm Layer

| Component | Effort | Notes |
|---|---|---|
| Port phase correlation | 1 day | Direct translation |
| Port stereo width / M-S | 1 day | Direct translation |
| Port RMS / smoothing | 2 days | Multiple averager classes |
| Port frequency band analysis | 2 days | Plus FFT library integration |
| Port spectrogram analysis | 3 days | Spectral centroid, rolloff, flatness |
| **Implement true BS.1770-4 LUFS** | **2-3 weeks** | K-weighting, gating, M/S/I variants |
| **Implement true peak detection** | **1 week** | Polyphase FIR oversampling |
| Sample-rate adaptive code | 3 days | Audit hardcoded values |
| Unit tests + numerical validation | 2 weeks | Compare against reference signals |
| **Total: Algorithm Core** | **~7-9 weeks** | One competent C++ DSP dev |

### Effort Estimate for VST Shell

| Component | Effort | Notes |
|---|---|---|
| JUCE project setup, CMake, signing | 1 week | Multi-platform |
| VST3 plugin scaffolding | 1 week | Parameters, presets, state |
| Audio processing pipeline | 1 week | Real-time safe, lock-free |
| Reference file loading (drag-drop, decoding) | 2 weeks | MP3/WAV/FLAC via dr_libs or libsndfile |
| **UI rebuild in JUCE/native** | **8-12 weeks** | This is the big one |
| Meter rendering (custom drawing) | 3 weeks | OpenGL or JUCE Graphics |
| Cross-platform testing | 2 weeks | Win/Mac, multiple DAWs |
| Code signing, notarization, installers | 1 week | Per platform |
| **Total: VST Shell** | **~20-24 weeks** | One competent VST dev |

### Total Realistic Timeline

**Solo developer**: 12-18 months for shippable v1.0
**Two developers** (DSP + VST/UI): 6-9 months
**Three developers** (DSP + VST + UI/Design): 4-6 months

This excludes ongoing iteration, marketing site, support infrastructure.

## MVP Scoping

### MVP v1.0: "MixFade Metric AB" (the ADPTR analog)

Goal: Ship a viable competitor to ADPTR Metric AB. Not feature parity with iZotope Insight.

**Included Modules (4 of 5):**
1. **Levels** - Peak, RMS, **true LUFS** (M/S/I), true peak
2. **Stereo Image** - Phase correlation, width, balance, M/S levels, vectorscope
3. **Frequency** - Spectrum analyzer, band energies (bass/mid/high), peak frequency
4. **Waveform** - Side-by-side waveform comparison with reference

**Deferred to v1.1+:**
- Spectrogram (complex, less differentiating, can ship later)
- Visualizer mode (butterchurn) - not needed in VST context
- Multiple reference tracks (single reference for v1.0)

**Platforms (v1.0):**
- **VST3 only** for Windows and macOS Intel + Apple Silicon
- AU on macOS (cheap to add since JUCE supports it)
- **Skip AAX** for v1.0 (Pro Tools certification is expensive and slow)
- **Skip Linux VST3** for v1.0 (small audience, defer)

**Loudness Standards (v1.0):**
- Integrated, Short-term, Momentary LUFS
- True peak (dBTP)
- Single standard: ITU-R BS.1770-4 (covers EBU R128, ATSC A/85)
- **Skip**: Custom calibration profiles, broadcast presets (v1.1+)

**Reference Workflow (v1.0):**
- Drag-and-drop reference file loading
- Single reference (not multiple)
- Loudness-matched playback (optional toggle)
- A/B switching with keyboard shortcut

**Cross-Product Integration (v1.0):**
- **None.** Ship VST and Desktop as standalone products.
- Cross-product sync is a v2.0 feature - it requires accounts, cloud, infrastructure that doesn't yet exist.

### Why This Scope Works

**1. It's actually shippable** in a reasonable timeframe (6-9 months with 2 devs)

**2. It directly competes with a known product** (ADPTR Metric AB) - validates demand

**3. It defers expensive infrastructure** (cross-product sync, accounts, cloud)

**4. It avoids feature creep** that has killed many plugin startups

**5. It establishes the brand** - subsequent versions can add Insight-tier features

### Pre-MVP Validation Steps

Before writing any C++:

1. **Build a Web Audio prototype** of true BS.1770-4 LUFS in the existing Electron app
   - Validate the algorithm in JS first (cheap iteration)
   - Compare against Youlean output for verification
   - Prove the standalone app benefits from the same upgrade

2. **Survey current MixFade users** (if any) about VST interest
   - Even 50 responses tell you a lot
   - Pricing sensitivity
   - DAW preferences (informs format priorities)

3. **Build a UI mockup** of the VST in Figma matching MixFade visual language
   - Resolves "can we maintain the look?" question
   - Useful for marketing site even before code exists

4. **Spike: JUCE + custom rendering**
   - 1-2 week prototype of just the meter visuals in JUCE
   - Validates feasibility of matching Electron UI fidelity
   - De-risks the biggest unknown

### Decision Framework: Should You Actually Build This?

Build the VST if:
- You have or can hire a C++/DSP developer
- You can commit 6-12 months without revenue from this
- You have an audience willing to test/buy (or marketing plan to acquire one)
- The standalone app proves out a user base first

Don't build the VST if:
- The standalone app has <100 active users
- You're a solo developer with no DSP background
- You can't validate the LUFS upgrade matters to users
- You're doing it because it's interesting (not because users want it)

**Recommended order of operations:**
1. Polish Electron app, ship to users, build audience
2. Upgrade LUFS to true BS.1770-4 in Electron app (validates algorithm)
3. If standalone has traction → build VST
4. If standalone has no traction → VST won't save it

## Open Questions to Resolve

These should be answered before committing engineering resources:

1. **Who is the target user?** Bedroom producers, mastering engineers, or both? (Affects price, features, marketing)
2. **What's the funding model?** Self-funded, savings, or seeking revenue from current app first?
3. **DSP expertise**: Do you have it, can you hire it, or do you contract it?
4. **Marketing channels**: How do plugin buyers find you? (KVR, Plugin Boutique, YouTube reviewers?)
5. **Trial/demo strategy**: Time-limited, feature-limited, or watermarked output?
6. **Update model**: Perpetual + paid major versions, or subscription?
7. **What does success look like?** $10k/year side income, $100k/year business, or VC-backed startup?

The answers shape every technical and product decision downstream.

---

# Part 3: Current App Overlap and VST Translation Map

This section examines the existing Electron app's feature surface and clarifies what should transfer directly, what should stay desktop-only, and what should be reinterpreted for an ADPTR-style VST.

## Core Framing: Preserve the A/B Mental Model

The current app's strongest product language is its two-deck cockpit:

- **Deck A**: emerald/green identity
- **Deck B**: violet/purple identity
- **Fusion/crossfade**: the visual and interaction language between them
- **Analysis panels**: side-by-side comparison of levels, frequency, stereo, and spectrogram

For a VST, this mental model should remain, but the meaning changes:

| Current Desktop App | Future VST Interpretation |
|---|---|
| Deck A = loaded file A | A = live DAW/host audio |
| Deck B = loaded file B | B = loaded reference file |
| A/B switch controls playback source | A/B switch controls monitoring/reference audition |
| Crossfade between two local players | Optional monitor blend between host and reference |
| Two independent waveforms | Host waveform history + reference waveform |
| Analysis of two files while playing | Real-time host analysis + offline/reference analysis |

This is the key overlap: **the UI shell and product metaphor are reusable even when the audio plumbing changes.**

## Current App Feature Surface

### Navigation / Shell

The app currently uses an activity-bar layout with five primary modes:

1. **Files**
   - Quick load to Deck A / Deck B
   - Drag-and-drop audio staging
   - Recent file list

2. **Analysis**
   - A/B side-by-side analysis
   - Collapsible sections
   - Recent analysis snapshots
   - Crossfade-aware pre/post snapshot behavior

3. **Visualizer**
   - Butterchurn visualizer presets
   - Seed rolling/saving
   - External visualizer window

4. **Settings**
   - Theme selection
   - Analysis update rate
   - Audio/crossfade settings

5. **Help / Report Bug**
   - Support workflow

### Analysis Modules

The app currently exposes four primary analysis tabs:

1. **Levels**
   - Peak-like level display
   - RMS
   - Estimated LUFS
   - Left/right channel values

2. **Frequencies**
   - FFT-based frequency data
   - Bass/mid/high energy
   - Peak frequency
   - Spectral balance labels

3. **Stereo**
   - Phase correlation
   - Stereo width
   - Balance
   - Mid/side levels
   - Mono compatibility label

4. **Spectrogram**
   - Brightness / spectral centroid
   - Dynamic range
   - Activity
   - Tone-vs-noise / spectral flatness
   - High-frequency content / rolloff

## Translation Matrix

| Current Feature | Desktop Role | VST Role | Recommendation |
|---|---|---|---|
| Deck A/B identity | Two local file players | Host audio vs reference | **Keep** |
| Emerald/violet color coding | Track identity | Source identity | **Keep** |
| A/B switch | Playback source selection | Monitor source / compare source | **Keep, reinterpret** |
| Crossfade | Musical transition between files | Optional audition blend | **Keep as secondary feature** |
| Files panel | Load/manage both decks | Load reference only | **Simplify** |
| Recent files | Desktop library convenience | Reference history | **Keep** |
| Analysis panel | A/B file comparison | Host/reference comparison | **Keep** |
| Recent analysis snapshots | Pause-state memory | Session comparison history | **Potential v1.1** |
| Visualizer mode | Entertainment/branding | Not core metering | **Defer** |
| External visualizer window | Desktop-only Electron feature | Not applicable | **Desktop-only** |
| Settings themes | User personalization | Plugin skin/theme | **Keep** |
| Analysis update rate | UI refresh control | UI refresh only, not DSP cadence | **Keep but rename** |
| Export settings | Future report/export workflow | Preset/report export | **Desktop-first** |
| Keyboard shortcuts | App navigation/playback | DAW-safe plugin shortcuts | **Rework carefully** |

## Important Product Insight

The VST should **not** feel like a reduced version of the desktop app. It should feel like the same instrument panel adapted to a DAW context.

In practical terms:

- Keep the A/B visual grammar.
- Keep the analysis cards and comparison rows.
- Keep the theme system.
- Keep drag-and-drop reference loading.
- Remove or hide anything that assumes two independent local players.
- Replace desktop transport assumptions with DAW-host assumptions.

## VST UI Concept

### Proposed Main Layout

**Top Header**
- MixFade logo
- Source labels: `HOST` / `REFERENCE`
- Reference file name
- Loudness-match toggle
- Settings/preset menu

**Left/Center**
- A/B waveform region
  - Host waveform history or scrolling waveform
  - Reference waveform overview
  - Current playback/reference position

**Right or Bottom Analysis Rail**
- Levels
- Frequency
- Stereo
- Spectrogram (v1.1 if deferred)

**Bottom Control Strip**
- A/B monitor switch
- Reference play/stop/seek
- Match loudness
- Reset analysis
- Snapshot/compare button

This resembles the existing app enough to preserve identity, but it is shaped around plugin constraints.

## Desktop App as the Expanded Companion

The desktop app should not simply mirror the VST. It should become the expanded reference-management and offline-analysis environment.

Potential desktop-only strengths:

- Multi-reference libraries
- Offline file-to-file comparison
- Batch analysis
- Exportable reports
- Educational explanations
- Playlist/session organization
- Visualizer/branding experience
- Deep waveform inspection

Potential VST strengths:

- Live mix bus analysis
- Host/reference comparison in context
- Low-latency metering
- Loudness-matched reference auditioning
- Fast decision support while mixing

## Design System Assets Worth Preserving

The existing app already has a useful design system foundation:

- **Theme tokens**
  - `Midnight Bloom`: emerald Deck A + violet Deck B
  - `Golden Hour`: amber Deck A + cyan Deck B
  - `Neon Dusk`: rose Deck A + indigo Deck B

- **Visual motifs**
  - Glass-panel cards
  - Neon glow around active controls
  - Fusion gradient between A and B
  - Collapsible analysis sections
  - Compact sidebar summaries

- **Interaction patterns**
  - Drag-and-drop file loading
  - Recent file/reference recall
  - A/B switching
  - Snapshot-like analysis state retention

These can guide JUCE/native UI mockups even though React components cannot be reused directly.

## Additional Technical Findings

### Settings Model

Current settings include:

- Analysis FFT size
- Analysis update rate
- Smoothing window
- Peak hold time
- Frequency range
- UI theme / meter style / true peak display flag
- Crossfade time and curve
- Buffer size
- File/recent-file behavior
- Export settings
- Keyboard shortcuts

For a VST, this suggests a useful future preset/state model:

- Metering preset
- Display theme
- Reference file path/history
- Loudness matching enabled
- Analysis window settings
- UI layout/collapsed sections

### Local Persistence Caveat

The desktop app currently uses `localStorage` for settings, collapsed sections, recent analysis, and similar state.

For a VST, state storage must be split:

- **Plugin state**: saved in DAW session/project
- **Global preferences**: saved in app/plugin settings directory
- **Reference history**: likely global, but session should remember the currently loaded reference
- **Large reference files**: should not be embedded in DAW session; store path + metadata/fingerprint

This matters because plugin users expect projects to reopen with the same plugin state.

## Updated MVP Implications

Based on the current app's feature surface, the VST MVP should probably be:

1. **A/B host/reference shell**
   - Preserve Deck A/B identity
   - Host audio = A
   - Reference file = B

2. **Levels + true LUFS + true peak**
   - This is mandatory for credibility

3. **Stereo module**
   - Existing code is conceptually strong and visually differentiating

4. **Frequency module**
   - Useful for producer audience and easier to understand visually

5. **Single reference file workflow**
   - Drag/drop, recent references, loudness match

6. **Theme system**
   - One default theme plus optional skins

Defer:

- Spectrogram
- Visualizer
- Multi-reference libraries
- Cloud sync
- Desktop/VST integration
- AAX

## New Strategic Recommendation

Before a C++ VST effort, create a **VST mock mode inside the Electron app**.

This would be a design/product prototype, not a plugin:

- Simulate `Host A` with Deck A
- Simulate `Reference B` with Deck B
- Hide desktop-only panels
- Reorganize the UI into the proposed plugin layout
- Use it for screenshots, user testing, and design validation

Why this helps:

- Validates the VST workflow without JUCE/C++
- Forces clarity on what belongs in the plugin
- Produces marketing/mockup assets
- Helps a future JUCE developer understand the target
- Avoids prematurely building native UI before the product shape is settled
