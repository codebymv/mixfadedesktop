import type { ColorThemeId } from '../theme/colorThemes';
import { DEFAULT_COLOR_THEME_ID } from '../theme/colorThemes';

// Settings interface based on actual app functionality
export interface AppSettings {
  // Audio Analysis Settings (based on audioAnalysis.ts)
  analysis: {
    fftSize: 1024 | 2048 | 4096 | 8192;
    updateRate: number; // FPS for analysis updates
    smoothingWindow: number; // ms for RMS/LUFS averaging
    peakHoldTime: number; // ms for peak hold
    frequencyRange: 'full' | 'music' | 'voice';
  };
  
  // Visual/UI Settings
  ui: {
    theme: 'dark' | 'light' | 'auto';
    sidebarDefaultCollapsed: boolean;
    colorThemeId: ColorThemeId;
    meterStyle: 'vu' | 'ppm' | 'digital';
    showTruePeakMeters: boolean;
  };
  
  // Audio Engine Settings (based on WaveformPlayer.tsx)
  audio: {
    crossfadeTime: number; // seconds (currently hardcoded to 2.5)
    crossfadeCurve: 'linear' | 'equal-power' | 'logarithmic';
    bufferSize: 256 | 512 | 1024 | 2048;
    autoPlay: boolean;
  };
  
  // File Management (based on App.tsx recent files logic)
  files: {
    recentFilesLimit: number; // currently hardcoded to 10
    rememberLastDirectory: boolean;
    autoSaveSession: boolean;
  };
  
  // Export Settings
  export: {
    audioFormat: 'wav' | 'mp3' | 'flac';
    sampleRate: 44100 | 48000 | 96000;
    bitDepth: 16 | 24 | 32;
    includeAnalysisReport: boolean;
    includeWaveforms: boolean;
    includeSpectrograms: boolean;
  };
  
  // Keyboard Shortcuts (based on useKeyboardShortcuts.ts)
  shortcuts: {
    playPause: string;
    crossfadeAB: string;
    toggleSidebar: string;
    exitVisualizer: string;
  };
}

// Default settings based on current app behavior
export const DEFAULT_SETTINGS: AppSettings = {
  analysis: {
    fftSize: 2048, // Current default in code
    updateRate: 30,
    smoothingWindow: 300, // Current RMSAverager default
    peakHoldTime: 1000,
    frequencyRange: 'full'
  },
  ui: {
    theme: 'dark',
    sidebarDefaultCollapsed: false,
    colorThemeId: DEFAULT_COLOR_THEME_ID,
    meterStyle: 'digital',
    showTruePeakMeters: true
  },
  audio: {
    crossfadeTime: 2.5, // Current hardcoded value
    crossfadeCurve: 'equal-power', // Current implementation
    bufferSize: 1024,
    autoPlay: false
  },
  files: {
    recentFilesLimit: 10, // Current hardcoded value
    rememberLastDirectory: true,
    autoSaveSession: true
  },
  export: {
    audioFormat: 'wav',
    sampleRate: 48000,
    bitDepth: 24,
    includeAnalysisReport: true,
    includeWaveforms: true,
    includeSpectrograms: true
  },
  shortcuts: {
    playPause: 'Space',
    crossfadeAB: 'Tab',
    toggleSidebar: 'Ctrl+B',
    exitVisualizer: 'Escape',
  }
}; 