# Audio Analysis Overview

MixFade provides professional-grade audio analysis tools built on the Web Audio API, designed for detailed audio inspection and quality assessment.

## Core Analysis Components

### **🎛️ Level Meters**
Real-time peak and RMS level monitoring with professional broadcast standards.

#### **Features:**
- **Peak Level Detection**: Instantaneous peak level measurement
- **RMS Calculation**: Root Mean Square for perceived loudness
- **True Peak Detection**: Inter-sample peak detection
- **Headroom Indication**: Visual feedback for optimal recording levels
- **Stereo Channel Separation**: Independent left/right channel monitoring

#### **Implementation:**
```typescript
// LevelMeter.tsx
interface LevelMeterProps {
  audioData: Float32Array;
  channelCount: number;
  sampleRate: number;
}

const LevelMeter: React.FC<LevelMeterProps> = ({ audioData, channelCount, sampleRate }) => {
  const [peakLevels, setPeakLevels] = useState<number[]>([]);
  const [rmsLevels, setRmsLevels] = useState<number[]>([]);
  
  const calculateLevels = useCallback(() => {
    // Peak detection
    const peaks = calculatePeakLevels(audioData, channelCount);
    
    // RMS calculation with time-weighted averaging
    const rms = calculateRMSLevels(audioData, channelCount, sampleRate);
    
    setPeakLevels(peaks);
    setRmsLevels(rms);
  }, [audioData, channelCount, sampleRate]);
};
```

#### **Standards Compliance:**
- **EBU R 128**: European Broadcasting Union loudness standard
- **ITU-R BS.1770**: International loudness measurement
- **AES17**: Audio Engineering Society digital audio measurement

### **📊 Frequency Visualizer**
Real-time spectrum analysis with customizable frequency bands and display modes.

#### **Features:**
- **FFT Analysis**: Fast Fourier Transform for frequency decomposition
- **Octave Band Analysis**: 1/3 octave and full octave band filtering
- **Waterfall Display**: Time-frequency analysis visualization
- **Frequency Response**: System frequency response measurement
- **Customizable Ranges**: User-defined frequency range and resolution

#### **Analysis Modes:**
```typescript
// FrequencyVisualizer.tsx
enum AnalysisMode {
  SPECTRUM = 'spectrum',        // Standard spectrum analyzer
  WATERFALL = 'waterfall',      // Time-frequency waterfall
  OCTAVE_BANDS = 'octave',      // Octave band analyzer
  CORRELATION = 'correlation'    // Phase correlation
}

interface FrequencyAnalysisConfig {
  fftSize: number;              // 512, 1024, 2048, 4096, 8192
  windowFunction: WindowType;   // Hanning, Hamming, Blackman
  averagingMode: AveragingType; // None, Exponential, Linear
  frequencyRange: [number, number]; // Min/max frequency
}
```

#### **Window Functions:**
- **Hanning**: Good for general-purpose analysis
- **Hamming**: Better frequency resolution
- **Blackman**: Lowest spectral leakage
- **Kaiser**: Adjustable trade-off between resolution and leakage

### **🎚️ Stereo Analyzer**
Advanced stereo field analysis for professional audio production.

#### **Analysis Parameters:**
- **Phase Correlation**: Mono compatibility assessment
- **Stereo Width**: Stereo image width measurement
- **Balance**: Left/right channel balance
- **Mid/Side Analysis**: M/S stereo processing visualization
- **Goniometer**: Real-time phase scope display

#### **Implementation:**
```typescript
// StereoAnalyzer.tsx
interface StereoAnalysisData {
  correlation: number;          // -1 to +1 phase correlation
  balance: number;              // -1 (left) to +1 (right)
  width: number;                // 0 (mono) to 2 (wide stereo)
  midSignal: Float32Array;      // Mid (L+R) component
  sideSignal: Float32Array;     // Side (L-R) component
}

const StereoAnalyzer: React.FC<StereoAnalyzerProps> = ({ leftChannel, rightChannel }) => {
  const analyzeStereoField = useCallback(() => {
    // Calculate phase correlation
    const correlation = calculatePhaseCorrelation(leftChannel, rightChannel);
    
    // Compute stereo width
    const width = calculateStereoWidth(leftChannel, rightChannel);
    
    // Generate M/S signals
    const { mid, side } = calculateMidSide(leftChannel, rightChannel);
    
    return { correlation, width, mid, side };
  }, [leftChannel, rightChannel]);
};
```

### **📈 Spectrogram Analysis**
Time-frequency representation showing how the frequency content evolves over time.

#### **Features:**
- **High-Resolution Display**: Detailed time-frequency resolution
- **Color Mapping**: Amplitude representation through color gradients
- **Zoom Controls**: Time and frequency axis zooming
- **Cursor Tracking**: Precise frequency and time readouts
- **Export Capabilities**: Save spectrogram images

#### **Configuration:**
```typescript
// SpectrogramAnalyzer.tsx
interface SpectrogramConfig {
  windowSize: number;           // Analysis window size
  hopSize: number;              // Overlap between windows
  colorMap: ColorMapType;       // Visualization color scheme
  dynamicRange: number;         // dB range for display
  logFrequency: boolean;        // Linear vs logarithmic frequency axis
}

enum ColorMapType {
  VIRIDIS = 'viridis',         // Perceptually uniform
  PLASMA = 'plasma',           // High contrast
  INFERNO = 'inferno',         // Dark background
  MAGMA = 'magma',             // Grayscale friendly
  CUSTOM = 'custom'            // User-defined colors
}
```

### **📏 Loudness Analysis**
Professional loudness measurement compliant with broadcast standards.

#### **Measurements:**
- **LUFS (LKFS)**: Loudness Units relative to Full Scale
- **LU Range**: Loudness range measurement
- **Peak Levels**: True peak and sample peak detection
- **Integrated Loudness**: Long-term loudness assessment
- **Short-term Loudness**: 3-second sliding window measurement

#### **Standards Support:**
```typescript
// LoudnessAnalysis.tsx
interface LoudnessStandards {
  EBU_R128: {
    target: -23,                // LUFS target level
    range: 7,                   // LU range limit
    truePeak: -1               // dBTP limit
  };
  ATSC_A85: {
    target: -24,                // LKFS target (US broadcast)
    range: 10,                  // LU range
    truePeak: -2               // dBTP limit
  };
  STREAMING: {
    spotify: -14,               // Spotify target
    youtube: -14,               // YouTube target
    apple: -16,                 // Apple Music target
    tidal: -14                  // Tidal target
  };
}
```

## Audio Processing Pipeline

### **🔄 Data Flow**
```
Audio File → ArrayBuffer → AudioBuffer → Analysis Nodes → Visualization
     ↓            ↓           ↓              ↓              ↓
File Reader → Decode → AudioContext → AnalyserNode → Canvas Render
```

### **Performance Optimization**

#### **Real-Time Processing**
```typescript
// Optimized audio processing loop
const processAudioFrame = useCallback(() => {
  if (!analyserNode || !isPlaying) return;
  
  // Get frequency data
  analyserNode.getFloatFrequencyData(frequencyData);
  
  // Get time domain data
  analyserNode.getFloatTimeDomainData(timeData);
  
  // Process only if data has changed
  if (hasDataChanged(frequencyData, previousFrequencyData)) {
    updateVisualization(frequencyData, timeData);
  }
  
  // Schedule next frame
  requestAnimationFrame(processAudioFrame);
}, [analyserNode, isPlaying]);
```

#### **Memory Management**
```typescript
// Efficient buffer management
class AudioBufferManager {
  private bufferPool: Float32Array[] = [];
  private maxPoolSize = 10;
  
  getBuffer(size: number): Float32Array {
    const buffer = this.bufferPool.pop() || new Float32Array(size);
    return buffer.length >= size ? buffer : new Float32Array(size);
  }
  
  releaseBuffer(buffer: Float32Array): void {
    if (this.bufferPool.length < this.maxPoolSize) {
      buffer.fill(0); // Clear data
      this.bufferPool.push(buffer);
    }
  }
}
```

## Audio Quality Assessment

### **🔍 Analysis Accuracy**
- **Bit-perfect Processing**: No quality loss in analysis chain
- **High-precision Calculations**: 64-bit floating-point arithmetic
- **Calibrated Measurements**: Reference tone calibration support
- **Temporal Accuracy**: Sample-accurate timing

### **📊 Professional Features**
- **Reference Level Support**: Multiple reference levels (-18, -20, -23 dBFS)
- **Weighting Filters**: A-weighting, K-weighting for loudness
- **Gate Processing**: Threshold-based measurement gating
- **Time Constants**: Multiple averaging time constants

## Error Handling & Validation

### **🛡️ Input Validation**
```typescript
// Audio file validation
const validateAudioFile = async (file: File): Promise<ValidationResult> => {
  // Check file type
  const supportedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac'];
  if (!supportedTypes.includes(file.type)) {
    throw new Error('Unsupported audio format');
  }
  
  // Check file size (max 100MB)
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File too large');
  }
  
  // Validate audio content
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    return {
      valid: true,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels
    };
  } catch (error) {
    throw new Error('Invalid audio file');
  }
};
```

### **⚠️ Error Recovery**
```typescript
// Audio context error handling
const handleAudioContextError = (error: Error) => {
  switch (error.name) {
    case 'NotAllowedError':
      // User blocked audio access
      showPermissionDialog();
      break;
    case 'NotSupportedError':
      // Browser doesn't support Web Audio API
      showCompatibilityError();
      break;
    case 'InvalidStateError':
      // Audio context in invalid state
      restartAudioContext();
      break;
    default:
      // Generic error handling
      logError(error);
      showGenericError();
  }
};
```

## Integration Points

### **🔌 Component Communication**
```typescript
// Audio analysis context
interface AudioAnalysisContext {
  currentFile: AudioBuffer | null;
  analysisResults: AnalysisResults;
  isAnalyzing: boolean;
  startAnalysis: (file: File) => Promise<void>;
  stopAnalysis: () => void;
  updateAnalysisConfig: (config: AnalysisConfig) => void;
}

const AudioAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AudioAnalysisState>(initialState);
  
  const contextValue: AudioAnalysisContext = {
    ...state,
    startAnalysis: useCallback(async (file: File) => {
      // Implementation
    }, []),
    stopAnalysis: useCallback(() => {
      // Implementation
    }, []),
    updateAnalysisConfig: useCallback((config: AnalysisConfig) => {
      // Implementation
    }, [])
  };
  
  return (
    <AudioAnalysisContext.Provider value={contextValue}>
      {children}
    </AudioAnalysisContext.Provider>
  );
};
```

---

This audio analysis system provides professional-grade measurement capabilities while maintaining real-time performance and intuitive user interaction. 