# MixFade Audio Tools Overview

This document provides a comprehensive overview of MixFade's professional audio analysis tools, designed for real-time audio monitoring, mixing, and mastering applications with broadcast-quality standards.

## System Architecture

MixFade implements a modular audio analysis system with four primary visualization components that work together to provide comprehensive audio monitoring capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Audio Context                        │
│  ┌─────────────────┐    ┌──────────────────────────────────┐│
│  │   Audio Source  │────│     AnalyserNode(s)             ││
│  │  (WaveSurfer)   │    │  • FFT: 2048-4096 points       ││
│  └─────────────────┘    │  • Sample Rate: 48kHz           ││
│                         │  • Smoothing: 0.0-0.1           ││
│                         └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            ┌───────▼────┐  ┌──────▼──────┐  ┌───▼────┐
            │Frequency   │  │Time Domain  │  │ Level  │
            │Data        │  │Samples      │  │Analysis│
            │(dB values) │  │(Float32)    │  │        │
            └───────┬────┘  └──────┬──────┘  └───┬────┘
                    │              │              │
        ┌───────────▼───────────┐  │  ┌───────────▼───────────┐
        │                       │  │  │                       │
   ┌────▼────┐            ┌────▼──▼──▼────┐            ┌────▼────┐
   │Frequency│            │ StereoAnalyzer │            │ Level   │
   │Visualizer│           │ • Vectorscope  │            │ Meters  │
   └─────────┘            │ • Correlation  │            └─────────┘
        │                 │ • M/S Analysis │                 │
   ┌────▼────┐            └────────────────┘            ┌────▼────┐
   │Spectro- │                                          │Peak Hold│
   │gram     │                                          │True Peak│
   │Analyzer │                                          │RMS/LUFS │
   └─────────┘                                          └─────────┘
```

## Audio Analysis Components

### 1. **FrequencyVisualizer** 📊
**Real-time Spectrum Analyzer**

- **Purpose**: Professional frequency domain analysis with logarithmic scaling
- **Features**: 
  - 20Hz-20kHz frequency range with logarithmic distribution
  - Professional color coding (bass=red, mid=orange/yellow, high=blue/purple)
  - Band energy calculation (bass, mid, high)
  - Peak frequency detection with band identification
  - Real-time spectral balance assessment
- **Standards**: Professional -60dB to 0dB range, 48kHz sample rate
- **Performance**: 60fps updates, 2 pixels per bar for smooth rendering

[📖 Detailed Documentation →](./FrequencyVisualizer/component-overview.md)

### 2. **LevelMeters** 📊
**Professional Peak/RMS/LUFS Monitoring**

- **Purpose**: Broadcast-quality dual-channel level monitoring
- **Features**:
  - Independent L/R channel meters with peak hold
  - Sample peak and true peak detection (up to +6dBFS)
  - RMS averaging with 300ms time window
  - LUFS loudness monitoring (EBU R 128 / ITU-R BS.1770)
  - Professional color-coded level zones
  - 8dB/second peak decay rate
- **Standards**: EBU R 128, ITU-R BS.1770, AES17 compliance
- **Performance**: Real-time display with 50ms smoothing updates

[📖 Detailed Documentation →](./LevelMeters/component-overview.md)

### 3. **StereoVisualizer** 🎯
**Vectorscope and Stereo Field Analysis**

- **Purpose**: Professional stereo imaging and phase correlation analysis
- **Features**:
  - Real-time vectorscope with L/R correlation plotting
  - Phase correlation measurement (-1 to +1)
  - Stereo width calculation (0-100%)
  - Mid/Side (M/S) signal analysis
  - Mono compatibility assessment
  - Professional grid overlay with reference lines
- **Standards**: ITU-R BS.1770 correlation, EBU R 128 mono compatibility
- **Performance**: 200 sample points with age-based fading trail

[📖 Detailed Documentation →](./StereoVisualizer/component-overview.md)

### 4. **SpectrogramVisualizer** 🌊
**Time-Frequency Waterfall Analysis**

- **Purpose**: Temporal evolution of frequency content visualization
- **Features**:
  - 5-second time window waterfall display
  - Professional blue-cyan-green-yellow-red color mapping
  - Spectral centroid (brightness) calculation
  - Dynamic range analysis
  - Harmonic content assessment (tonal vs noise)
  - Logarithmic frequency axis (20Hz-20kHz)
- **Standards**: Professional dB scaling, broadcast-quality frequency resolution
- **Performance**: 50ms update rate with efficient memory management

[📖 Detailed Documentation →](./SpectrogramVisualizer/component-overview.md)

## Integration Architecture

### **Data Flow Pipeline**
```typescript
// 1. Audio Context Setup (Professional Configuration)
const audioContext = new AudioContext({ sampleRate: 48000 });
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;                    // 1024 frequency bins
analyser.smoothingTimeConstant = 0.1;       // Minimal smoothing

// 2. Data Extraction
const frequencyData = new Float32Array(analyser.frequencyBinCount);
const timeData = new Float32Array(analyser.fftSize);
const leftSamples = new Float32Array(bufferSize);
const rightSamples = new Float32Array(bufferSize);

// 3. Real-time Analysis
analyser.getFloatFrequencyData(frequencyData);  // For frequency analysis
analyser.getFloatTimeDomainData(timeData);      // For level analysis
leftAnalyser.getFloatTimeDomainData(leftSamples);   // For stereo analysis
rightAnalyser.getFloatTimeDomainData(rightSamples); // For stereo analysis

// 4. Component Integration
<div className="audio-analysis-grid">
  <FrequencyVisualizer frequencyData={frequencyData} isActive={true} isPlaying={isPlaying} />
  <LevelMeter audioLevels={calculatedLevels} isActive={true} isPlaying={isPlaying} />
  <StereoAnalyzer stereoData={stereoAnalysis} leftSamples={leftSamples} rightSamples={rightSamples} />
  <SpectrogramAnalyzer frequencyData={frequencyData} isActive={true} isPlaying={isPlaying} />
</div>
```

### **Shared Infrastructure**

#### **Audio Analysis Utilities** (`audioAnalysis.ts`)
- **RMSAverager**: Time-windowed RMS smoothing with rate limiting
- **StereoAverager**: Stereo field analysis smoothing
- **SpectrogramBuffer**: Time-series frequency data management
- **AudioUtils**: Common calculations (dB conversion, LUFS, correlation)

#### **Professional Standards Compliance**
- **Sample Rates**: 48kHz professional audio standard
- **dB Ranges**: -60dB to +6dB (true peak) measurement ranges
- **Color Standards**: Industry-standard level and frequency color coding
- **Update Rates**: Optimized for real-time professional monitoring

#### **Performance Optimization**
- **Canvas Rendering**: High-DPI support with device pixel ratio scaling
- **Memory Management**: Circular buffers and efficient data structures
- **Rate Limiting**: Prevents over-computation while maintaining responsiveness
- **Parallel Processing**: Independent component updates for smooth performance

## Professional Use Cases

### **Mixing Applications**
- **Frequency Balance**: Real-time EQ guidance with FrequencyVisualizer
- **Level Management**: Professional metering with LevelMeters
- **Stereo Field**: Imaging assessment with StereoVisualizer
- **Content Analysis**: Temporal spectral evolution with SpectrogramVisualizer

### **Mastering Workflow**
- **Spectral Balance**: Frequency distribution analysis
- **Loudness Compliance**: LUFS monitoring for broadcast standards
- **Stereo Imaging**: Phase correlation and mono compatibility
- **Quality Assessment**: Dynamic range and harmonic content analysis

### **Broadcast Monitoring**
- **EBU R 128 Compliance**: LUFS loudness monitoring
- **True Peak Detection**: Over-level protection
- **Mono Compatibility**: Phase correlation assessment
- **Spectral Content**: Frequency domain quality control

### **Audio Forensics**
- **Signal Analysis**: Comprehensive frequency and time domain examination
- **Stereo Verification**: L/R correlation and imaging validation
- **Content Classification**: Tonal vs noise content assessment
- **Temporal Analysis**: Time-frequency evolution tracking

## Technical Specifications

### **Frequency Analysis**
- **Range**: 20Hz - 20kHz (full human hearing spectrum)
- **Resolution**: Variable (depends on FFT size)
- **Scaling**: Logarithmic distribution for professional audio
- **Accuracy**: ±0.1dB measurement precision

### **Level Monitoring**
- **Peak Detection**: Sample and inter-sample (true peak)
- **RMS Integration**: 300ms time window with 50ms updates
- **LUFS Measurement**: Full EBU R 128 / ITU-R BS.1770 compliance
- **Dynamic Range**: -60dB to +6dB measurement capability

### **Stereo Analysis**
- **Correlation**: Pearson correlation coefficient (-1 to +1)
- **Width Measurement**: Energy-based stereo width calculation
- **M/S Analysis**: Mid/Side signal decomposition and analysis
- **Compatibility**: Real-time mono fold-down assessment

### **Temporal Analysis**
- **Time Window**: 5-second historical analysis
- **Update Rate**: 50ms for smooth real-time visualization
- **Buffer Management**: Efficient circular buffering with automatic cleanup
- **Memory Usage**: Optimized for continuous operation

## Cross-Component Communication

### **Shared State Management**
```typescript
interface AudioAnalysisState {
  isActive: boolean;           // Global analysis active state
  isPlaying: boolean;          // Playback state
  crossfadeVolume: number;     // Current crossfade position
  audioLevels: AudioLevels;    // Shared level data
  stereoData: StereoAnalysis;  // Shared stereo analysis
  frequencyData: Float32Array; // Shared frequency data
}
```

### **Synchronized Updates**
All components share synchronized update cycles to ensure:
- **Consistent Timing**: All visualizations update together
- **Data Coherence**: Analysis based on same audio samples
- **Resource Efficiency**: Shared computation where possible
- **Professional Accuracy**: Sample-accurate cross-component correlation

## Development Guidelines

### **Adding New Analysis Tools**
1. **Follow Interface Standards**: Implement consistent prop interfaces
2. **Use Shared Utilities**: Leverage existing analysis classes
3. **Maintain Performance**: Optimize for real-time operation
4. **Professional Standards**: Comply with broadcast/mastering standards
5. **Canvas Optimization**: Use efficient rendering techniques

### **Performance Considerations**
- **Rate Limiting**: Implement appropriate update intervals
- **Memory Management**: Use circular buffers for time-series data
- **Canvas Efficiency**: Minimize draw calls and allocations
- **Data Copying**: Avoid unnecessary Float32Array copying

### **Testing Requirements**
- **Professional Standards**: Validate against known reference signals
- **Performance Benchmarks**: Ensure real-time operation under load
- **Cross-Component Integration**: Test synchronized operation
- **Edge Cases**: Handle silence, noise, and extreme signals

---

MixFade's audio analysis system provides a comprehensive, professional-grade monitoring solution suitable for critical audio production, broadcast, and mastering applications with industry-standard accuracy and real-time performance. 