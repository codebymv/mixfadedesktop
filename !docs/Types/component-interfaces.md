# Component APIs & Interfaces

This document outlines the internal APIs and interfaces used throughout MixFade for component communication and data flow.

## Core Audio Interfaces

### **AudioFile Interface**
```typescript
interface AudioFile {
  id: string;
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  format: AudioFormat;
  buffer: AudioBuffer;
  metadata?: AudioMetadata;
}

interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  bitrate?: number;
  codec?: string;
}

enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  FLAC = 'flac',
  AAC = 'aac',
  M4A = 'm4a'
}
```

### **Analysis Results Interface**
```typescript
interface AnalysisResults {
  levels: LevelAnalysis;
  frequency: FrequencyAnalysis;
  stereo: StereoAnalysis;
  loudness: LoudnessAnalysis;
  spectrogram: SpectrogramData;
  timestamp: number;
}

interface LevelAnalysis {
  peak: {
    left: number;
    right: number;
    overall: number;
  };
  rms: {
    left: number;
    right: number;
    overall: number;
  };
  truePeak: {
    left: number;
    right: number;
  };
}

interface FrequencyAnalysis {
  spectrum: Float32Array;
  octaveBands: OctaveBandData[];
  frequencyRange: [number, number];
  resolution: number;
}

interface StereoAnalysis {
  correlation: number;
  width: number;
  balance: number;
  midSignal: Float32Array;
  sideSignal: Float32Array;
  goniometerData: GoniometerPoint[];
}

interface LoudnessAnalysis {
  integrated: number;      // LUFS
  shortTerm: number;       // LUFS (3s)
  momentary: number;       // LUFS (400ms)
  range: number;           // LU
  truePeak: number;        // dBTP
}
```

## Component Props Interfaces

### **WaveformPlayer Props**
```typescript
interface WaveformPlayerProps {
  audioFile: AudioFile | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoom: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onZoom: (zoom: number) => void;
  onAnalysisUpdate: (results: AnalysisResults) => void;
  className?: string;
  height?: number;
  waveformColor?: string;
  backgroundColor?: string;
}
```

### **Level Meter Props**
```typescript
interface LevelMeterProps {
  levels: LevelAnalysis;
  orientation: 'horizontal' | 'vertical';
  channels: 'mono' | 'stereo';
  showPeak: boolean;
  showRMS: boolean;
  peakHoldTime: number;
  updateRate: number;
  scale: 'linear' | 'logarithmic';
  range: [number, number];
  className?: string;
}
```

### **Frequency Visualizer Props**
```typescript
interface FrequencyVisualizerProps {
  analysisData: FrequencyAnalysis;
  mode: AnalysisMode;
  config: FrequencyAnalysisConfig;
  onConfigChange: (config: FrequencyAnalysisConfig) => void;
  onFrequencySelect: (frequency: number) => void;
  className?: string;
  width?: number;
  height?: number;
}
```

### **Stereo Analyzer Props**
```typescript
interface StereoAnalyzerProps {
  stereoData: StereoAnalysis;
  displayMode: StereoDisplayMode;
  showCorrelation: boolean;
  showGoniometer: boolean;
  showMidSide: boolean;
  onDisplayModeChange: (mode: StereoDisplayMode) => void;
  className?: string;
}

enum StereoDisplayMode {
  CORRELATION = 'correlation',
  GONIOMETER = 'goniometer',
  MID_SIDE = 'midside',
  BALANCE = 'balance'
}
```

## Hook Interfaces

### **useAudioAnalysis Hook**
```typescript
interface UseAudioAnalysisOptions {
  updateInterval: number;
  enableRealTime: boolean;
  analysisConfig: AnalysisConfig;
}

interface UseAudioAnalysisReturn {
  results: AnalysisResults | null;
  isAnalyzing: boolean;
  error: Error | null;
  startAnalysis: (file: AudioFile) => Promise<void>;
  stopAnalysis: () => void;
  updateConfig: (config: Partial<AnalysisConfig>) => void;
}

const useAudioAnalysis = (options: UseAudioAnalysisOptions): UseAudioAnalysisReturn;
```

### **useWaveform Hook**
```typescript
interface UseWaveformOptions {
  container: React.RefObject<HTMLDivElement>;
  waveColor: string;
  progressColor: string;
  height: number;
  responsive: boolean;
}

interface UseWaveformReturn {
  wavesurfer: WaveSurfer | null;
  isReady: boolean;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  load: (audioFile: AudioFile) => Promise<void>;
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
}

const useWaveform = (options: UseWaveformOptions): UseWaveformReturn;
```

### **useAudioContext Hook**
```typescript
interface UseAudioContextOptions {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
  autoStart?: boolean;
}

interface UseAudioContextReturn {
  audioContext: AudioContext | null;
  isSupported: boolean;
  state: AudioContextState;
  start: () => Promise<void>;
  suspend: () => Promise<void>;
  resume: () => Promise<void>;
  close: () => Promise<void>;
  createAnalyser: (options?: AnalyserOptions) => AnalyserNode;
  createGain: (value?: number) => GainNode;
}

const useAudioContext = (options: UseAudioContextOptions): UseAudioContextReturn;
```

## Context Interfaces

### **Audio Analysis Context**
```typescript
interface AudioAnalysisContextType {
  currentFile: AudioFile | null;
  analysisResults: AnalysisResults | null;
  isAnalyzing: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  // File operations
  loadFile: (file: File) => Promise<void>;
  unloadFile: () => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  
  // Analysis controls
  startAnalysis: () => void;
  stopAnalysis: () => void;
  updateAnalysisConfig: (config: Partial<AnalysisConfig>) => void;
  
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const AudioAnalysisContext = React.createContext<AudioAnalysisContextType | null>(null);
```

### **UI Context**
```typescript
interface UIContextType {
  theme: Theme;
  sidebarOpen: boolean;
  activeTab: TabType;
  zoom: number;
  
  // UI actions
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: TabType) => void;
  setZoom: (zoom: number) => void;
  
  // Modal state
  modals: ModalState;
  openModal: (modal: ModalType, props?: any) => void;
  closeModal: (modal: ModalType) => void;
}

enum TabType {
  WAVEFORM = 'waveform',
  ANALYSIS = 'analysis',
  SETTINGS = 'settings'
}

enum ModalType {
  FILE_UPLOAD = 'fileUpload',
  SETTINGS = 'settings',
  ABOUT = 'about',
  ERROR = 'error'
}
```

## Event Interfaces

### **Audio Events**
```typescript
interface AudioLoadEvent {
  type: 'audioLoad';
  file: AudioFile;
  timestamp: number;
}

interface AudioPlayEvent {
  type: 'audioPlay';
  currentTime: number;
  timestamp: number;
}

interface AudioPauseEvent {
  type: 'audioPause';
  currentTime: number;
  timestamp: number;
}

interface AudioSeekEvent {
  type: 'audioSeek';
  time: number;
  timestamp: number;
}

interface AnalysisUpdateEvent {
  type: 'analysisUpdate';
  results: AnalysisResults;
  timestamp: number;
}

type AudioEvent = AudioLoadEvent | AudioPlayEvent | AudioPauseEvent | AudioSeekEvent | AnalysisUpdateEvent;
```

### **Event Handlers**
```typescript
interface AudioEventHandlers {
  onAudioLoad?: (event: AudioLoadEvent) => void;
  onAudioPlay?: (event: AudioPlayEvent) => void;
  onAudioPause?: (event: AudioPauseEvent) => void;
  onAudioSeek?: (event: AudioSeekEvent) => void;
  onAnalysisUpdate?: (event: AnalysisUpdateEvent) => void;
  onError?: (error: Error) => void;
}
```

## Configuration Interfaces

### **Analysis Configuration**
```typescript
interface AnalysisConfig {
  fftSize: number;
  windowFunction: WindowFunction;
  hopSize: number;
  averagingMode: AveragingMode;
  updateInterval: number;
  enableRealTime: boolean;
  
  // Level meter config
  levelMeter: {
    peakHoldTime: number;
    rmsWindow: number;
    updateRate: number;
  };
  
  // Frequency analysis config
  frequency: {
    minFrequency: number;
    maxFrequency: number;
    bandsPerOctave: number;
    logScale: boolean;
  };
  
  // Stereo analysis config
  stereo: {
    correlationWindow: number;
    goniometerDecay: number;
    midSideMode: boolean;
  };
  
  // Loudness config
  loudness: {
    standard: LoudnessStandard;
    gateThreshold: number;
    integrationTime: number;
  };
}

enum WindowFunction {
  HANNING = 'hanning',
  HAMMING = 'hamming',
  BLACKMAN = 'blackman',
  KAISER = 'kaiser'
}

enum AveragingMode {
  NONE = 'none',
  EXPONENTIAL = 'exponential',
  LINEAR = 'linear'
}

enum LoudnessStandard {
  EBU_R128 = 'ebu_r128',
  ATSC_A85 = 'atsc_a85',
  ITU_BS1770 = 'itu_bs1770'
}
```

### **Application Settings**
```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  audioBuffer: {
    size: number;
    count: number;
  };
  display: {
    waveformColor: string;
    backgroundColor: string;
    gridColor: string;
    showGrid: boolean;
    showTimecode: boolean;
  };
  analysis: AnalysisConfig;
  shortcuts: KeyboardShortcuts;
}

interface KeyboardShortcuts {
  play: string;
  pause: string;
  seek: {
    forward: string;
    backward: string;
  };
  zoom: {
    in: string;
    out: string;
    fit: string;
  };
  analysis: {
    start: string;
    stop: string;
    export: string;
  };
}
```

## Utility Type Definitions

### **Common Types**
```typescript
type TimeFormat = 'seconds' | 'samples' | 'timecode';
type FrequencyUnit = 'hz' | 'khz';
type LevelUnit = 'db' | 'linear';
type ColorScheme = 'light' | 'dark';

interface Point2D {
  x: number;
  y: number;
}

interface Range {
  min: number;
  max: number;
}

interface Dimensions {
  width: number;
  height: number;
}
```

---

These interfaces provide type safety and clear contracts for component communication throughout the MixFade application. 