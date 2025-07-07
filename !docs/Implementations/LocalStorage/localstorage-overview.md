# LocalStorage Implementation

MixFade implements a comprehensive localStorage system for persisting user preferences, recent files, and analysis data across application sessions. The system provides automatic persistence with robust error handling and configurable data management.

## Overview

The localStorage implementation spans three main areas of data persistence:
- **Application Settings**: User preferences and configuration
- **Recent Files**: File history and session management  
- **Analysis Data**: Audio analysis snapshots and comparisons

### **Key Features**
- **Automatic Persistence**: Real-time saving of user data and preferences
- **Error Recovery**: Graceful fallback when localStorage is unavailable
- **Data Validation**: JSON parsing with error handling and defaults
- **Configurable Limits**: User-defined limits for data retention
- **Cross-Session Continuity**: Seamless experience across app restarts

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MixFade Application                      │
│                                                             │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐│
│  │   Settings  │    │  Recent Files   │    │   Analysis   ││
│  │   Context   │    │   Management    │    │   Snapshots  ││
│  │             │    │                 │    │              ││
│  └──────┬──────┘    └─────────┬───────┘    └──────┬───────┘│
│         │                     │                   │        │
│         ▼                     ▼                   ▼        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                localStorage API                        ││
│  │  • mixfade-settings                                   ││
│  │  • mixfade-recent-files                              ││
│  │  • mixfade-recent-analysis                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Settings Persistence

### **SettingsContext Implementation**

The `SettingsContext` provides centralized settings management with automatic localStorage persistence:

```typescript
interface AppSettings {
  analysis: {
    fftSize: 1024 | 2048 | 4096 | 8192;
    updateRate: number;
    smoothingWindow: number;
    peakHoldTime: number;
    frequencyRange: 'full' | 'music' | 'voice';
  };
  ui: {
    theme: 'dark' | 'light' | 'auto';
    sidebarDefaultCollapsed: boolean;
    waveformColorA: string;
    waveformColorB: string;
    meterStyle: 'vu' | 'ppm' | 'digital';
    showTruePeakMeters: boolean;
  };
  audio: {
    crossfadeTime: number;
    crossfadeCurve: 'linear' | 'equal-power' | 'logarithmic';
    bufferSize: 256 | 512 | 1024 | 2048;
    autoPlay: boolean;
  };
  files: {
    recentFilesLimit: number;
    rememberLastDirectory: boolean;
    autoSaveSession: boolean;
  };
  export: {
    audioFormat: 'wav' | 'mp3' | 'flac';
    sampleRate: 44100 | 48000 | 96000;
    bitDepth: 16 | 24 | 32;
    includeAnalysisReport: boolean;
    includeWaveforms: boolean;
    includeSpectrograms: boolean;
  };
  shortcuts: {
    playPause: string;
    crossfadeAB: string;
    toggleSidebar: string;
    openFile: string;
    switchToTrackA: string;
    switchToTrackB: string;
  };
}
```

### **Loading and Initialization**
```typescript
const [settings, setSettings] = useState<AppSettings>(() => {
  // Load settings from localStorage with fallback
  const saved = localStorage.getItem('mixfade-settings');
  if (saved) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
});
```

### **Automatic Persistence**
```typescript
// Save settings to localStorage when they change
useEffect(() => {
  localStorage.setItem('mixfade-settings', JSON.stringify(settings));
}, [settings]);
```

### **Settings Update API**
```typescript
const updateSetting = useCallback(<T extends keyof AppSettings>(
  category: T,
  key: keyof AppSettings[T],
  value: any
) => {
  console.log(`🔧 UPDATE SETTING: ${String(category)}.${String(key)} = ${value}`);
  setSettings(prev => {
    const newSettings = {
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    };
    console.log(`🔧 NEW SETTINGS STATE:`, newSettings);
    return newSettings;
  });
}, []);
```

## Recent Files Management

### **Data Structure**
```typescript
interface RecentFile {
  id: string;                    // Unique identifier (name-size-modified)
  name: string;                  // Original filename
  size: string;                  // Formatted file size
  lastModified: string;          // Formatted last modified date
  lastUsedSide: 'A' | 'B';      // Which deck was used
  file?: File;                   // File object (in-memory only)
  filePath?: string;             // Future: file system path
}
```

### **Loading Recent Files**
```typescript
// Load recent files from localStorage on mount
useEffect(() => {
  const savedRecentFiles = localStorage.getItem('mixfade-recent-files');
  if (savedRecentFiles) {
    try {
      setRecentFiles(JSON.parse(savedRecentFiles));
    } catch (error) {
      console.warn('Failed to load recent files from localStorage:', error);
    }
  }
}, []);
```

### **Saving Recent Files** 
```typescript
// Save recent files to localStorage (without File objects)
useEffect(() => {
  const filesToSave = recentFiles.map(({ file, ...rest }) => rest);
  localStorage.setItem('mixfade-recent-files', JSON.stringify(filesToSave));
}, [recentFiles]);
```

### **File Management Logic**
```typescript
const addToRecentFiles = useCallback((file: File, side: 'A' | 'B') => {
  const fileId = `${file.name}-${file.size}-${file.lastModified}`;

  setRecentFiles(prev => {
    // Remove existing entry if it exists
    const filtered = prev.filter(f => f.id !== fileId);

    // Add new entry at the beginning
    const newFile: RecentFile = {
      id: fileId,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      lastModified: new Date(file.lastModified).toLocaleDateString(),
      lastUsedSide: side,
      file: file, // Store in memory during session
    };

    // Keep only configured limit
    return [newFile, ...filtered].slice(0, settings.files.recentFilesLimit);
  });
}, [settings.files.recentFilesLimit]);
```

### **File Recovery System**
```typescript
const loadFileFromRecent = useCallback((recentFile: RecentFile) => {
  // If File object exists in memory, use directly
  if (recentFile.file) {
    console.log('Using in-memory File object for', recentFile.name);
    if (recentFile.lastUsedSide === 'A') {
      setTrackAWithRecent(recentFile.file);
    } else {
      setTrackBWithRecent(recentFile.file);
    }
    return;
  }

  // Fallback: ask user to select file again
  console.log('File object not found, triggering file selection fallback');
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file && file.name === recentFile.name) {
      if (recentFile.lastUsedSide === 'A') {
        setTrackAWithRecent(file);
      } else {
        setTrackBWithRecent(file);
      }
    }
  };
  input.click();
}, [setTrackAWithRecent, setTrackBWithRecent]);
```

## Analysis Data Persistence

### **Analysis Snapshot Structure**
```typescript
interface AnalysisSnapshot {
  id: string;                                    // Unique snapshot identifier
  timestamp: number;                             // Capture timestamp
  trackAFile?: string;                          // Track A filename
  trackBFile?: string;                          // Track B filename
  trackAAudioLevels?: AudioLevels;              // Track A level analysis
  trackBAudioLevels?: AudioLevels;              // Track B level analysis
  trackAStereoData?: StereoAnalysis;            // Track A stereo data
  trackBStereoData?: StereoAnalysis;            // Track B stereo data
  trackAFrequencyData?: Float32Array;           // Track A frequency data
  trackBFrequencyData?: Float32Array;           // Track B frequency data
  trackAFrequencyAnalysis?: FrequencyAnalysis;  // Track A frequency metrics
  trackBFrequencyAnalysis?: FrequencyAnalysis;  // Track B frequency metrics
  trackAStereoAnalysis?: StereoAnalysis;        // Track A stereo analysis
  trackBStereoAnalysis?: StereoAnalysis;        // Track B stereo analysis
  trackASpectrogramAnalysis?: SpectrogramAnalysis; // Track A spectrogram analysis
  trackBSpectrogramAnalysis?: SpectrogramAnalysis; // Track B spectrogram analysis
}
```

### **Loading Analysis Data**
```typescript
// Load recent analysis from localStorage on mount
useEffect(() => {
  const savedAnalysis = localStorage.getItem('mixfade-recent-analysis');
  if (savedAnalysis) {
    try {
      setRecentAnalysis(JSON.parse(savedAnalysis));
    } catch (error) {
      console.warn('Failed to load recent analysis from localStorage:', error);
    }
  }
}, []);
```

### **Saving Analysis Data**
```typescript
// Save recent analysis to localStorage whenever it changes
useEffect(() => {
  localStorage.setItem('mixfade-recent-analysis', JSON.stringify(recentAnalysis));
}, [recentAnalysis]);
```

### **Automatic Snapshot Capture**
```typescript
// Capture analysis snapshot when tracks pause
useEffect(() => {
  const shouldCapture = (
    (trackAFile || trackBFile) && // Have at least one file loaded
    (!isTrackAPlaying || !isTrackBPlaying) && // At least one track is paused
    (trackASmoothed || trackBSmoothed || /* other analysis data */) // Have analysis data
  );

  if (shouldCapture) {
    const snapshotId = `${Date.now()}-${trackAFile?.name || 'none'}-${trackBFile?.name || 'none'}`;
    
    const newSnapshot: AnalysisSnapshot = {
      id: snapshotId,
      timestamp: Date.now(),
      trackAFile: trackAFile?.name,
      trackBFile: trackBFile?.name,
      trackAAudioLevels: trackASmoothed || undefined,
      trackBAudioLevels: trackBSmoothed || undefined,
      // ... other analysis data
    };

    setRecentAnalysis(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(snap => snap.id !== snapshotId);
      // Add new snapshot at beginning, keep only last 10
      return [newSnapshot, ...filtered].slice(0, 10);
    });
  }
}, [isTrackAPlaying, isTrackBPlaying, trackAFile, trackBFile, /* analysis dependencies */]);
```

## Data Management Features

### **Configurable Limits**
```typescript
// Settings-based data retention limits
files: {
  recentFilesLimit: number;        // Default: 10 files
  rememberLastDirectory: boolean;  // Directory persistence
  autoSaveSession: boolean;        // Session auto-save
}
```

### **Storage Keys**
- `mixfade-settings`: Application settings and preferences
- `mixfade-recent-files`: Recent files list (without File objects)
- `mixfade-recent-analysis`: Analysis snapshots and comparisons

### **Error Handling Strategy**
```typescript
const safeLocalStorageGet = (key: string, fallback: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return fallback;
  }
};

const safeLocalStorageSet = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};
```

## Memory Management

### **File Object Handling**
- **In-Memory Storage**: File objects kept in React state during session
- **localStorage Exclusion**: File objects not serialized to localStorage
- **Recovery Fallback**: File picker dialog when File objects unavailable

### **Analysis Data Serialization**
- **Float32Array Handling**: Converted to regular arrays for JSON serialization
- **Circular Reference Prevention**: Careful object structure design
- **Size Limitations**: Analysis snapshots limited to 10 most recent

### **Session vs Persistent Data**
```typescript
// Session-only data (not persisted)
const sessionData = {
  fileObjects: File[],           // File references
  audioBuffers: AudioBuffer[],   // Decoded audio data
  canvasContexts: any[]          // Rendering contexts
};

// Persistent data (localStorage)
const persistentData = {
  settings: AppSettings,         // User preferences
  recentFileMetadata: RecentFile[], // File metadata only
  analysisSnapshots: AnalysisSnapshot[] // Audio analysis results
};
```

## Performance Considerations

### **Throttled Updates**
- **Settings**: Immediate persistence on change
- **Recent Files**: Batched updates with useEffect
- **Analysis**: Rate-limited snapshot capture

### **Storage Optimization**
```typescript
// Exclude large objects from localStorage
const filesToSave = recentFiles.map(({ file, ...rest }) => rest);
localStorage.setItem('mixfade-recent-files', JSON.stringify(filesToSave));

// Limit analysis snapshot count
return [newSnapshot, ...filtered].slice(0, 10);
```

### **Error Recovery Patterns**
```typescript
// Graceful degradation when localStorage fails
const [settings, setSettings] = useState<AppSettings>(() => {
  try {
    const saved = localStorage.getItem('mixfade-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    // Fallback to defaults if localStorage unavailable
    return DEFAULT_SETTINGS;
  }
});
```

## Browser Compatibility

### **LocalStorage Availability Check**
```typescript
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};
```

### **Quota Management**
- **Storage Limits**: Respects browser localStorage quotas
- **Cleanup Strategy**: Automatic removal of oldest data when limits reached
- **Graceful Failure**: Application continues without persistence if quota exceeded

## Data Privacy and Security

### **Local-Only Storage**
- **No Server Communication**: All data remains on user's device
- **Privacy Compliant**: No external data transmission
- **User Control**: Data persists only in local browser storage

### **Data Sanitization**
```typescript
// Remove sensitive data before storage
const sanitizeForStorage = (data: any) => ({
  ...data,
  file: undefined,        // Remove File objects
  audioBuffer: undefined, // Remove AudioBuffer objects
  privateKeys: undefined  // Remove any sensitive data
});
```

## Development Guidelines

### **Adding New Persistent Data**
1. **Define Interface**: Create TypeScript interface for data structure
2. **Choose Storage Key**: Use `mixfade-` prefix for consistency
3. **Implement Loading**: Add error handling and fallback values
4. **Implement Saving**: Use useEffect for automatic persistence
5. **Add Cleanup**: Include data limit and cleanup logic

### **Testing LocalStorage**
```typescript
// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});
```

### **Debugging LocalStorage**
```typescript
// Debug localStorage usage
console.log('Settings:', localStorage.getItem('mixfade-settings'));
console.log('Recent Files:', localStorage.getItem('mixfade-recent-files'));
console.log('Analysis:', localStorage.getItem('mixfade-recent-analysis'));

// Check storage usage
const storageUsed = JSON.stringify(localStorage).length;
console.log(`LocalStorage usage: ${(storageUsed / 1024).toFixed(2)} KB`);
```

---

MixFade's localStorage implementation provides robust, automatic persistence for user data with comprehensive error handling, performance optimization, and privacy-conscious design suitable for professional audio applications. 