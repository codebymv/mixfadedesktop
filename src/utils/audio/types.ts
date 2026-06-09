export interface AudioLevels {
  left: number;
  right: number;
  leftRms: number;
  rightRms: number;
  rms: number;
  lufs: number;
  leftLufs: number;  // Add individual L channel LUFS
  rightLufs: number; // Add individual R channel LUFS
}

// NEW: Professional stereo analysis interface
export interface StereoAnalysis {
  phaseCorrelation: number;      // -1 to +1 (Pearson correlation between L/R)
  stereoWidth: number;           // 0-100% (Side energy vs total energy)
  balance: number;               // -1 (left) to +1 (right)
  midLevel: number;              // Mid channel RMS (L+R)/2
  sideLevel: number;             // Side channel RMS (L-R)/2
  midLufs: number;               // Mid channel LUFS
  sideLufs: number;              // Side channel LUFS
  monoCompatibility: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'POOR';
}

// NEW: Professional frequency analysis interface
export interface FrequencyAnalysis {
  bassEnergy: number;            // -60 to 0 dB (20-200 Hz)
  midEnergy: number;             // -60 to 0 dB (200-2000 Hz)
  highEnergy: number;            // -60 to 0 dB (2000-24000 Hz)
  peakFreq: number;              // Hz - Dominant frequency
  peakFreqBand: 'bass' | 'mid' | 'upperMid' | 'high';
  spectralBalance: 'BASS-HEAVY' | 'BALANCED' | 'BRIGHT' | 'SILENT';
}

export interface SmoothedAudioLevels extends AudioLevels {
  leftRmsSmoothed: number;
  rightRmsSmoothed: number;
  rmsSmoothed: number;
  lufsSmoothed: number;
  leftLufsSmoothed: number;  // Add smoothed L LUFS
  rightLufsSmoothed: number; // Add smoothed R LUFS
}

export interface SpectrogramSnapshot {
  timestamp: number;
  frequencyData: Float32Array; // dB values from FFT
  sampleRate: number;
}

export interface SpectrogramAnalysis {
  brightness: number;           // Hz - Spectral centroid (frequency center of mass)
  dynamicRange: number;         // dB - Frequency domain dynamic range  
  activity: number;             // 0-1 - Spectral change rate (how busy the spectrum is)
  toneVsNoise: number;          // 0-1 - Tonal vs noisy content (spectral flatness)
  highFreqContent: number;      // Hz - Spectral rolloff (85% energy cutoff)
}
