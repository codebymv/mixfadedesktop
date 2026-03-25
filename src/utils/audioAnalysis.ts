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

export class RMSAverager {
  private leftRmsHistory: number[] = [];
  private rightRmsHistory: number[] = [];
  private combinedRmsHistory: number[] = [];
  private lufsHistory: number[] = [];
  private leftLufsHistory: number[] = [];  // Add L LUFS history
  private rightLufsHistory: number[] = []; // Add R LUFS history

  // Running sums for O(1) average calculation
  private leftRmsSumSq: number = 0;
  private rightRmsSumSq: number = 0;
  private combinedRmsSumSq: number = 0;
  private lufsSum: number = 0;
  private leftLufsSum: number = 0;
  private rightLufsSum: number = 0;

  private readonly windowSize: number;
  private readonly updateInterval: number;
  private lastUpdateTime: number = -1;

  constructor(windowSizeMs: number = 300, updateIntervalMs: number = 50) {
    // Calculate how many samples we need for the time window
    // Assuming ~60fps updates, we get about 16.67ms per frame
    this.windowSize = Math.max(1, Math.floor(windowSizeMs / 16.67));
    this.updateInterval = updateIntervalMs;
  }

  addSample(leftRms: number, rightRms: number, combinedRms: number, lufs: number, leftLufs: number, rightLufs: number): boolean {
    const now = performance.now();
    
    // Only update at our specified interval to prevent over-smoothing
    // Allow first sample (when lastUpdateTime is -1) to always be added
    if (this.lastUpdateTime >= 0 && now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    
    this.lastUpdateTime = now;
    
    // Add new samples
    this.leftRmsHistory.push(leftRms);
    this.rightRmsHistory.push(rightRms);
    this.combinedRmsHistory.push(combinedRms);
    this.lufsHistory.push(lufs);
    this.leftLufsHistory.push(leftLufs);
    this.rightLufsHistory.push(rightLufs);

    this.leftRmsSumSq += leftRms * leftRms;
    this.rightRmsSumSq += rightRms * rightRms;
    this.combinedRmsSumSq += combinedRms * combinedRms;
    this.lufsSum += lufs;
    this.leftLufsSum += leftLufs;
    this.rightLufsSum += rightLufs;
    
    // Maintain window size
    if (this.leftRmsHistory.length > this.windowSize) {
      const oldLeftRms = this.leftRmsHistory.shift()!;
      const oldRightRms = this.rightRmsHistory.shift()!;
      const oldCombinedRms = this.combinedRmsHistory.shift()!;
      const oldLufs = this.lufsHistory.shift()!;
      const oldLeftLufs = this.leftLufsHistory.shift()!;
      const oldRightLufs = this.rightLufsHistory.shift()!;

      this.leftRmsSumSq -= oldLeftRms * oldLeftRms;
      this.rightRmsSumSq -= oldRightRms * oldRightRms;
      this.combinedRmsSumSq -= oldCombinedRms * oldCombinedRms;
      this.lufsSum -= oldLufs;
      this.leftLufsSum -= oldLeftLufs;
      this.rightLufsSum -= oldRightLufs;

      // Prevent floating point drift
      if (this.leftRmsSumSq < 0) this.leftRmsSumSq = 0;
      if (this.rightRmsSumSq < 0) this.rightRmsSumSq = 0;
      if (this.combinedRmsSumSq < 0) this.combinedRmsSumSq = 0;
    }
    
    return true;
  }

  getSmoothedValues(): {
    leftRmsSmoothed: number;
    rightRmsSmoothed: number;
    rmsSmoothed: number;
    lufsSmoothed: number;
    leftLufsSmoothed: number;
    rightLufsSmoothed: number;
  } {
    if (this.leftRmsHistory.length === 0) {
      return {
        leftRmsSmoothed: 0,
        rightRmsSmoothed: 0,
        rmsSmoothed: 0,
        lufsSmoothed: -70,
        leftLufsSmoothed: -70,
        rightLufsSmoothed: -70
      };
    }

    const len = this.leftRmsHistory.length;

    // Use RMS averaging for RMS values (more accurate than simple mean)
    const leftRmsSmoothed = Math.sqrt(this.leftRmsSumSq / len);
    const rightRmsSmoothed = Math.sqrt(this.rightRmsSumSq / len);
    const rmsSmoothed = Math.sqrt(this.combinedRmsSumSq / len);

    // Use simple average for LUFS (already logarithmic)
    const lufsSmoothed = this.lufsSum / len;
    const leftLufsSmoothed = this.leftLufsSum / len;
    const rightLufsSmoothed = this.rightLufsSum / len;

    return {
      leftRmsSmoothed,
      rightRmsSmoothed,
      rmsSmoothed,
      lufsSmoothed,
      leftLufsSmoothed,
      rightLufsSmoothed
    };
  }

  reset(): void {
    this.leftRmsHistory = [];
    this.rightRmsHistory = [];
    this.combinedRmsHistory = [];
    this.lufsHistory = [];
    this.leftLufsHistory = [];
    this.rightLufsHistory = [];
    this.leftRmsSumSq = 0;
    this.rightRmsSumSq = 0;
    this.combinedRmsSumSq = 0;
    this.lufsSum = 0;
    this.leftLufsSum = 0;
    this.rightLufsSum = 0;
    this.lastUpdateTime = -1;
  }
}

export class StereoAverager {
  private phaseCorrelationHistory: number[] = [];
  private stereoWidthHistory: number[] = [];
  private balanceHistory: number[] = [];
  private midLevelHistory: number[] = [];
  private sideLevelHistory: number[] = [];
  private midLufsHistory: number[] = [];
  private sideLufsHistory: number[] = [];

  // Running sums for O(1) average calculation
  private phaseCorrelationSum: number = 0;
  private stereoWidthSum: number = 0;
  private balanceSum: number = 0;
  private midLevelSumSq: number = 0;
  private sideLevelSumSq: number = 0;
  private midLufsSum: number = 0;
  private sideLufsSum: number = 0;

  private readonly windowSize: number;
  private readonly updateInterval: number;
  private lastUpdateTime: number = -1;

  constructor(windowSizeMs: number = 300, updateIntervalMs: number = 50) {
    // Calculate how many samples we need for the time window
    // Assuming ~60fps updates, we get about 16.67ms per frame
    this.windowSize = Math.max(1, Math.floor(windowSizeMs / 16.67));
    this.updateInterval = updateIntervalMs;
  }

  addSample(stereoData: StereoAnalysis): boolean {
    const now = performance.now();
    
    // Only update at our specified interval to prevent over-smoothing
    // Allow first sample (when lastUpdateTime is -1) to always be added
    if (this.lastUpdateTime >= 0 && now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    
    this.lastUpdateTime = now;
    
    // Add new samples
    this.phaseCorrelationHistory.push(stereoData.phaseCorrelation);
    this.stereoWidthHistory.push(stereoData.stereoWidth);
    this.balanceHistory.push(stereoData.balance);
    this.midLevelHistory.push(stereoData.midLevel);
    this.sideLevelHistory.push(stereoData.sideLevel);
    this.midLufsHistory.push(stereoData.midLufs);
    this.sideLufsHistory.push(stereoData.sideLufs);

    this.phaseCorrelationSum += stereoData.phaseCorrelation;
    this.stereoWidthSum += stereoData.stereoWidth;
    this.balanceSum += stereoData.balance;
    this.midLevelSumSq += stereoData.midLevel * stereoData.midLevel;
    this.sideLevelSumSq += stereoData.sideLevel * stereoData.sideLevel;
    this.midLufsSum += stereoData.midLufs;
    this.sideLufsSum += stereoData.sideLufs;
    
    // Maintain window size
    if (this.phaseCorrelationHistory.length > this.windowSize) {
      const oldPhaseCorrelation = this.phaseCorrelationHistory.shift()!;
      const oldStereoWidth = this.stereoWidthHistory.shift()!;
      const oldBalance = this.balanceHistory.shift()!;
      const oldMidLevel = this.midLevelHistory.shift()!;
      const oldSideLevel = this.sideLevelHistory.shift()!;
      const oldMidLufs = this.midLufsHistory.shift()!;
      const oldSideLufs = this.sideLufsHistory.shift()!;

      this.phaseCorrelationSum -= oldPhaseCorrelation;
      this.stereoWidthSum -= oldStereoWidth;
      this.balanceSum -= oldBalance;
      this.midLevelSumSq -= oldMidLevel * oldMidLevel;
      this.sideLevelSumSq -= oldSideLevel * oldSideLevel;
      this.midLufsSum -= oldMidLufs;
      this.sideLufsSum -= oldSideLufs;

      // Prevent floating point drift
      if (this.midLevelSumSq < 0) this.midLevelSumSq = 0;
      if (this.sideLevelSumSq < 0) this.sideLevelSumSq = 0;
    }
    
    return true;
  }

  getSmoothedValues(): StereoAnalysis {
    if (this.phaseCorrelationHistory.length === 0) {
      return {
        phaseCorrelation: 0,
        stereoWidth: 0,
        balance: 0,
        midLevel: 0,
        sideLevel: 0,
        midLufs: -70,
        sideLufs: -70,
        monoCompatibility: 'EXCELLENT'
      };
    }

    const len = this.phaseCorrelationHistory.length;

    // Simple average for correlation and balance (bounded values)
    const phaseCorrelation = this.phaseCorrelationSum / len;
    const balance = this.balanceSum / len;
    const stereoWidth = this.stereoWidthSum / len;

    // RMS averaging for level values (more accurate than simple mean)
    const midLevel = Math.sqrt(this.midLevelSumSq / len);
    const sideLevel = Math.sqrt(this.sideLevelSumSq / len);

    // Simple average for LUFS (already logarithmic)
    const midLufs = this.midLufsSum / len;
    const sideLufs = this.sideLufsSum / len;

    // Calculate mono compatibility from smoothed correlation
    let monoCompatibility: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'POOR';
    if (phaseCorrelation > 0.85) monoCompatibility = 'EXCELLENT';
    else if (phaseCorrelation > 0.7) monoCompatibility = 'GOOD';
    else if (phaseCorrelation > 0.3) monoCompatibility = 'WARNING';
    else monoCompatibility = 'POOR';

    return {
      phaseCorrelation,
      stereoWidth,
      balance,
      midLevel,
      sideLevel,
      midLufs,
      sideLufs,
      monoCompatibility
    };
  }

  reset(): void {
    this.phaseCorrelationHistory = [];
    this.stereoWidthHistory = [];
    this.balanceHistory = [];
    this.midLevelHistory = [];
    this.sideLevelHistory = [];
    this.midLufsHistory = [];
    this.sideLufsHistory = [];
    this.phaseCorrelationSum = 0;
    this.stereoWidthSum = 0;
    this.balanceSum = 0;
    this.midLevelSumSq = 0;
    this.sideLevelSumSq = 0;
    this.midLufsSum = 0;
    this.sideLufsSum = 0;
    this.lastUpdateTime = -1;
  }
}

export class SpectrogramAverager {
  private brightnessHistory: number[] = [];
  private dynamicRangeHistory: number[] = [];
  private activityHistory: number[] = [];
  private toneVsNoiseHistory: number[] = [];
  private highFreqContentHistory: number[] = [];

  // Running sums for O(1) average calculation
  private brightnessSum: number = 0;
  private dynamicRangeSum: number = 0;
  private activitySum: number = 0;
  private toneVsNoiseSum: number = 0;
  private highFreqContentSum: number = 0;

  private readonly windowSize: number;
  private readonly updateInterval: number;
  private lastUpdateTime: number = 0;

  constructor(windowSizeMs: number = 300, updateIntervalMs: number = 100) {
    // Calculate how many samples we need for the time window
    // Assuming ~60fps updates, we get about 16.67ms per frame
    this.windowSize = Math.max(1, Math.floor(windowSizeMs / 16.67));
    this.updateInterval = updateIntervalMs;
  }

  addSample(spectrogramData: SpectrogramAnalysis): boolean {
    const now = performance.now();
    
    // Only update at our specified interval to prevent over-smoothing
    if (now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    
    this.lastUpdateTime = now;
    
    // Add new samples
    this.brightnessHistory.push(spectrogramData.brightness);
    this.dynamicRangeHistory.push(spectrogramData.dynamicRange);
    this.activityHistory.push(spectrogramData.activity);
    this.toneVsNoiseHistory.push(spectrogramData.toneVsNoise);
    this.highFreqContentHistory.push(spectrogramData.highFreqContent);

    this.brightnessSum += spectrogramData.brightness;
    this.dynamicRangeSum += spectrogramData.dynamicRange;
    this.activitySum += spectrogramData.activity;
    this.toneVsNoiseSum += spectrogramData.toneVsNoise;
    this.highFreqContentSum += spectrogramData.highFreqContent;
    
    // Maintain window size
    if (this.brightnessHistory.length > this.windowSize) {
      const oldBrightness = this.brightnessHistory.shift()!;
      const oldDynamicRange = this.dynamicRangeHistory.shift()!;
      const oldActivity = this.activityHistory.shift()!;
      const oldToneVsNoise = this.toneVsNoiseHistory.shift()!;
      const oldHighFreqContent = this.highFreqContentHistory.shift()!;

      this.brightnessSum -= oldBrightness;
      this.dynamicRangeSum -= oldDynamicRange;
      this.activitySum -= oldActivity;
      this.toneVsNoiseSum -= oldToneVsNoise;
      this.highFreqContentSum -= oldHighFreqContent;
    }
    
    return true;
  }

  getSmoothedValues(): SpectrogramAnalysis {
    if (this.brightnessHistory.length === 0) {
      return {
        brightness: 0,
        dynamicRange: 0,
        activity: 0,
        toneVsNoise: 0,
        highFreqContent: 0
      };
    }

    const len = this.brightnessHistory.length;

    // Use simple averaging for these metrics
    const brightness = this.brightnessSum / len;
    const dynamicRange = this.dynamicRangeSum / len;
    const activity = this.activitySum / len;
    const toneVsNoise = this.toneVsNoiseSum / len;
    const highFreqContent = this.highFreqContentSum / len;

    return {
      brightness: Math.round(brightness),
      dynamicRange: Math.round(dynamicRange * 10) / 10,
      activity: Math.round(activity * 100) / 100,
      toneVsNoise: Math.round(toneVsNoise * 100) / 100,
      highFreqContent: Math.round(highFreqContent)
    };
  }

  reset(): void {
    this.brightnessHistory = [];
    this.dynamicRangeHistory = [];
    this.activityHistory = [];
    this.toneVsNoiseHistory = [];
    this.highFreqContentHistory = [];
    this.brightnessSum = 0;
    this.dynamicRangeSum = 0;
    this.activitySum = 0;
    this.toneVsNoiseSum = 0;
    this.highFreqContentSum = 0;
    this.lastUpdateTime = 0;
  }
}

export class FrequencyAverager {
  private bassEnergyHistory: number[] = [];
  private midEnergyHistory: number[] = [];
  private highEnergyHistory: number[] = [];
  private peakFreqHistory: number[] = [];

  // Running sums for O(1) average calculation
  private bassEnergySum: number = 0;
  private midEnergySum: number = 0;
  private highEnergySum: number = 0;

  private readonly windowSize: number;
  private readonly updateInterval: number;
  private lastUpdateTime: number = 0;

  constructor(windowSizeMs: number = 300, updateIntervalMs: number = 100) {
    // Calculate how many samples we need for the time window
    // Assuming ~60fps updates, we get about 16.67ms per frame
    this.windowSize = Math.max(1, Math.floor(windowSizeMs / 16.67));
    this.updateInterval = updateIntervalMs;
  }

  addSample(frequencyData: FrequencyAnalysis): boolean {
    const now = performance.now();
    
    // Only update at our specified interval to prevent over-smoothing
    if (now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    
    this.lastUpdateTime = now;
    
    // Add new samples
    this.bassEnergyHistory.push(frequencyData.bassEnergy);
    this.midEnergyHistory.push(frequencyData.midEnergy);
    this.highEnergyHistory.push(frequencyData.highEnergy);
    this.peakFreqHistory.push(frequencyData.peakFreq);

    this.bassEnergySum += frequencyData.bassEnergy;
    this.midEnergySum += frequencyData.midEnergy;
    this.highEnergySum += frequencyData.highEnergy;
    
    // Maintain window size
    if (this.bassEnergyHistory.length > this.windowSize) {
      const oldBassEnergy = this.bassEnergyHistory.shift()!;
      const oldMidEnergy = this.midEnergyHistory.shift()!;
      const oldHighEnergy = this.highEnergyHistory.shift()!;
      this.peakFreqHistory.shift();

      this.bassEnergySum -= oldBassEnergy;
      this.midEnergySum -= oldMidEnergy;
      this.highEnergySum -= oldHighEnergy;
    }
    
    return true;
  }

  getSmoothedValues(): FrequencyAnalysis {
    if (this.bassEnergyHistory.length === 0) {
      return {
        bassEnergy: -60,
        midEnergy: -60,
        highEnergy: -60,
        peakFreq: 0,
        peakFreqBand: 'bass',
        spectralBalance: 'SILENT'
      };
    }

    const len = this.bassEnergyHistory.length;

    // Use simple average for dB values (already logarithmic)
    const bassEnergy = this.bassEnergySum / len;
    const midEnergy = this.midEnergySum / len;
    const highEnergy = this.highEnergySum / len;
    
    // Use median for peak frequency (more stable than average)
    // We cannot easily do running median with O(1), so this remains O(N log N).
    // The array length is small (windowSize), typically < 20, so sort is acceptable.
    const sortedPeaks = [...this.peakFreqHistory].sort((a, b) => a - b);
    const peakFreq = sortedPeaks[Math.floor(sortedPeaks.length / 2)];

    // Determine which frequency band the peak belongs to
    let peakFreqBand: 'bass' | 'mid' | 'upperMid' | 'high' = 'bass';
    if (peakFreq >= 200 && peakFreq < 2000) {
      peakFreqBand = 'mid';
    } else if (peakFreq >= 2000 && peakFreq < 8000) {
      peakFreqBand = 'upperMid';
    } else if (peakFreq >= 8000) {
      peakFreqBand = 'high';
    }

    // Determine spectral balance
    let spectralBalance: 'BASS-HEAVY' | 'BALANCED' | 'BRIGHT' | 'SILENT' = 'BALANCED';
    if (bassEnergy < -50 && midEnergy < -50 && highEnergy < -50) {
      spectralBalance = 'SILENT';
    } else {
      const bassToHigh = bassEnergy - highEnergy;
      if (bassToHigh > 6) spectralBalance = 'BASS-HEAVY';
      else if (bassToHigh < -6) spectralBalance = 'BRIGHT';
    }

    return {
      bassEnergy: Math.max(-60, bassEnergy),
      midEnergy: Math.max(-60, midEnergy),
      highEnergy: Math.max(-60, highEnergy),
      peakFreq: Math.round(peakFreq),
      peakFreqBand,
      spectralBalance
    };
  }

  reset(): void {
    this.bassEnergyHistory = [];
    this.midEnergyHistory = [];
    this.highEnergyHistory = [];
    this.peakFreqHistory = [];
    this.bassEnergySum = 0;
    this.midEnergySum = 0;
    this.highEnergySum = 0;
    this.lastUpdateTime = 0;
  }
}

// Frequency analysis calculation function (based on FrequencyVisualizer)
export function calculateFrequencyMetrics(frequencyData: Float32Array, isActive: boolean = true, isPlaying: boolean = true): FrequencyAnalysis {
  if (!frequencyData || frequencyData.length === 0 || !isActive || !isPlaying) {
    return {
      bassEnergy: -60,
      midEnergy: -60,
      highEnergy: -60,
      peakFreq: 0,
      peakFreqBand: 'bass',
      spectralBalance: 'SILENT'
    };
  }

  const sampleRate = 48000;
  const nyquistFreq = sampleRate / 2;
  const freqResolution = nyquistFreq / frequencyData.length;

  // Use the same approach as the visual spectrum for consistency
  let bassMax = -Infinity, midMax = -Infinity, highMax = -Infinity;
  let bassSum = 0, midSum = 0, highSum = 0;
  let bassCount = 0, midCount = 0, highCount = 0;
  let peakMagnitude = -Infinity;
  let peakFreq = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const freq = i * freqResolution;
    const magnitudeDb = frequencyData[i]; // Raw dB value from analyser

    // Track peak frequency
    if (magnitudeDb > peakMagnitude) {
      peakMagnitude = magnitudeDb;
      peakFreq = freq;
    }

    // Find maximum values in each band (like the visual does)
    // and also accumulate for averaging
    if (freq >= 20 && freq < 200) { // Bass
      bassMax = Math.max(bassMax, magnitudeDb);
      bassSum += magnitudeDb;
      bassCount++;
    } else if (freq >= 200 && freq < 2000) { // Mid  
      midMax = Math.max(midMax, magnitudeDb);
      midSum += magnitudeDb;
      midCount++;
    } else if (freq >= 2000 && freq <= nyquistFreq) { // High
      highMax = Math.max(highMax, magnitudeDb);
      highSum += magnitudeDb;
      highCount++;
    }
  }

  // Use a blend of maximum and average for more representative values
  const bassEnergy = bassCount > 0 ? Math.max(bassMax, bassSum / bassCount) : -60;
  const midEnergy = midCount > 0 ? Math.max(midMax, midSum / midCount) : -60;
  const highEnergy = highCount > 0 ? Math.max(highMax, highSum / highCount) : -60;

  // Determine which frequency band the peak belongs to
  let peakFreqBand: 'bass' | 'mid' | 'upperMid' | 'high' = 'bass';
  if (peakFreq >= 200 && peakFreq < 2000) {
    peakFreqBand = 'mid';
  } else if (peakFreq >= 2000 && peakFreq < 8000) {
    peakFreqBand = 'upperMid';
  } else if (peakFreq >= 8000) {
    peakFreqBand = 'high';
  }

  // Determine spectral balance
  let spectralBalance: 'BASS-HEAVY' | 'BALANCED' | 'BRIGHT' | 'SILENT' = 'BALANCED';
  if (bassEnergy < -50 && midEnergy < -50 && highEnergy < -50) {
    spectralBalance = 'SILENT';
  } else {
    const bassToHigh = bassEnergy - highEnergy;
    if (bassToHigh > 6) spectralBalance = 'BASS-HEAVY';
    else if (bassToHigh < -6) spectralBalance = 'BRIGHT';
  }

  return {
    bassEnergy: Math.max(-60, bassEnergy),
    midEnergy: Math.max(-60, midEnergy), 
    highEnergy: Math.max(-60, highEnergy),
    peakFreq: Math.round(peakFreq),
    peakFreqBand,
    spectralBalance
  };
}

// NEW: Calculate simplified spectrogram metrics from FFT data using SpectrogramBuffer
export function calculateSpectrogramMetrics(frequencyData: Float32Array, spectrogramBuffer: SpectrogramBuffer, sampleRate: number = 44100, isActive: boolean = true, isPlaying: boolean = true): SpectrogramAnalysis {
  // Return silent metrics if not active or playing
  if (!isActive || !isPlaying || !frequencyData || frequencyData.length === 0) {
    return {
      brightness: 0,
      dynamicRange: 0,
      activity: 0,
      toneVsNoise: 0,
      highFreqContent: 0
    };
  }

  // Add current frequency data to spectrogram buffer
  spectrogramBuffer.addSnapshot(frequencyData, sampleRate);
  
  // Calculate analysis using the buffer's sophisticated metrics
  return spectrogramBuffer.calculateAnalysis();
}

// NEW: Professional spectrogram analysis interfaces and classes
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

export class SpectrogramBuffer {
  private snapshots: SpectrogramSnapshot[] = [];
  private readonly timeWindowMs: number;
  private readonly maxSnapshots: number;
  private readonly smoothingWindow: number;
  private readonly updateInterval: number;
  private lastUpdateTime: number = 0;

  constructor(timeWindowMs: number = 5000, updateIntervalMs: number = 50) {
    this.timeWindowMs = timeWindowMs;
    this.updateInterval = updateIntervalMs;
    this.smoothingWindow = 300; // Match other components
    
    // Calculate max snapshots: time window / update interval
    this.maxSnapshots = Math.ceil(timeWindowMs / updateIntervalMs);
  }

  addSnapshot(frequencyData: Float32Array, sampleRate: number): boolean {
    const now = performance.now();
    
    // Throttle updates to prevent over-processing
    if (now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    
    this.lastUpdateTime = now;
    
    // Create snapshot with deep copy of frequency data
    const snapshot: SpectrogramSnapshot = {
      timestamp: now,
      frequencyData: new Float32Array(frequencyData),
      sampleRate
    };
    
    // Add to buffer
    this.snapshots.push(snapshot);
    
    // Maintain time window by removing old snapshots
    const cutoffTime = now - this.timeWindowMs;
    this.snapshots = this.snapshots.filter(s => s.timestamp >= cutoffTime);
    
    // Also maintain max count as safety measure
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }
    
    return true;
  }

  getVisibleSnapshots(): SpectrogramSnapshot[] {
    const now = performance.now();
    const cutoffTime = now - this.timeWindowMs;
    return this.snapshots.filter(s => s.timestamp >= cutoffTime);
  }

  getLatestSnapshot(): SpectrogramSnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  calculateAnalysis(): SpectrogramAnalysis {
    const latest = this.getLatestSnapshot();
    if (!latest || latest.frequencyData.length === 0) {
      return {
        brightness: 0,
        dynamicRange: 0,
        activity: 0,
        toneVsNoise: 0,
        highFreqContent: 0
      };
    }

    const freqData = latest.frequencyData;
    const sampleRate = latest.sampleRate;
    const nyquist = sampleRate / 2;
    const freqResolution = nyquist / freqData.length;

    // Find peak magnitude and calculate spectral metrics
    let peakMagnitude = -Infinity;
    let totalEnergy = 0;
    let weightedFreqSum = 0;

    // Calculate metrics from frequency data
    for (let i = 1; i < freqData.length; i++) { // Skip DC bin
      const magnitude = freqData[i];
      const freq = i * freqResolution;
      
      // Only process audible frequencies (20Hz - 20kHz)
      if (freq >= 20 && freq <= 20000) {
        const linearMag = Math.pow(10, magnitude / 20); // Convert dB to linear
        
        if (magnitude > peakMagnitude) {
          peakMagnitude = magnitude;
        }
        
        totalEnergy += linearMag;
        weightedFreqSum += freq * linearMag;
      }
    }
    const spectralCentroid = totalEnergy > 0 ? weightedFreqSum / totalEnergy : 0;

    // Calculate spectral rolloff (frequency below which 85% of energy lies)
    let runningEnergy = 0;
    const rolloffThreshold = totalEnergy * 0.85;
    let spectralRolloff = 0;

    for (let i = 1; i < freqData.length; i++) {
      const freq = i * freqResolution;
      if (freq >= 20 && freq <= 20000) {
        const linearMag = Math.pow(10, freqData[i] / 20);
        runningEnergy += linearMag;
        
        if (runningEnergy >= rolloffThreshold) {
          spectralRolloff = freq;
          break;
        }
      }
    }

    // Calculate dynamic range (difference between max and average levels)
    let sumMagnitudes = 0;
    let countValidBins = 0;
    
    for (let i = 1; i < freqData.length; i++) {
      const freq = i * freqResolution;
      if (freq >= 20 && freq <= 20000 && freqData[i] > -60) { // Exclude noise floor
        sumMagnitudes += freqData[i];
        countValidBins++;
      }
    }
    
    const averageMagnitude = countValidBins > 0 ? sumMagnitudes / countValidBins : -60;
    const dynamicRange = Math.max(0, peakMagnitude - averageMagnitude);

    // Note: Harmonic content estimation removed as it was calculated but not used
    // This could be re-implemented if needed for future audio analysis features
    
    // Calculate spectral flatness (toneVsNoise metric)
    let geometricMean = 1;
    let arithmeticMean = 0;
    let validFlatnessCount = 0;
    
    for (let i = 1; i < freqData.length; i++) {
      const freq = i * freqResolution;
      if (freq >= 20 && freq <= 20000 && freqData[i] > -60) {
        const linearMag = Math.pow(10, freqData[i] / 20);
        if (linearMag > 0) {
          geometricMean *= Math.pow(linearMag, 1 / freqData.length);
          arithmeticMean += linearMag;
          validFlatnessCount++;
        }
      }
    }
    
    arithmeticMean = validFlatnessCount > 0 ? arithmeticMean / validFlatnessCount : 0;
    const spectralFlatness = arithmeticMean > 0 ? Math.min(1, geometricMean / arithmeticMean) : 0;

    // Calculate activity (spectral change rate over time)
    let activity = 0;
    if (this.snapshots.length >= 2) {
      const current = this.snapshots[this.snapshots.length - 1];
      const previous = this.snapshots[this.snapshots.length - 2];
      
      if (current && previous && current.frequencyData.length === previous.frequencyData.length) {
        let totalChange = 0;
        let validChanges = 0;
        
        for (let i = 1; i < current.frequencyData.length && i < previous.frequencyData.length; i++) {
          const freq = i * freqResolution;
          if (freq >= 20 && freq <= 20000) {
            const change = Math.abs(current.frequencyData[i] - previous.frequencyData[i]);
            totalChange += change;
            validChanges++;
          }
        }
        
        // Normalize activity to 0-1 range (typical changes are 0-10 dB)
        activity = validChanges > 0 ? Math.min(1, (totalChange / validChanges) / 10) : 0;
      }
    }

    return {
      brightness: Math.round(spectralCentroid),
      dynamicRange: Math.round(dynamicRange * 10) / 10, // 1 decimal place
      activity: Math.round(activity * 100) / 100, // 2 decimal places
      toneVsNoise: Math.round(spectralFlatness * 100) / 100, // 2 decimal places
      highFreqContent: Math.round(spectralRolloff)
    };
  }

  reset(): void {
    this.snapshots = [];
    this.lastUpdateTime = 0;
  }

  getTimeWindowMs(): number {
    return this.timeWindowMs;
  }
}

export const AudioUtils = {
  linearToDb: (linear: number): number => {
    if (linear <= 0) return -60;
    return Math.max(-60, 20 * Math.log10(linear));
  },

  dbToLinear: (db: number): number => {
    if (db <= -60) return 0;
    return Math.pow(10, db / 20);
  },

  rmsToDb: (rms: number): number => {
    if (rms <= 0) return -60;
    return Math.max(-60, 20 * Math.log10(rms));
  },

  calculateRMS: (samples: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  },

  // Calculate RMS for stereo channels separately
  calculateStereoRMS: (leftSamples: Float32Array, rightSamples: Float32Array): { leftRms: number, rightRms: number, combinedRms: number } => {
    const leftRms = AudioUtils.calculateRMS(leftSamples);
    const rightRms = AudioUtils.calculateRMS(rightSamples);
    
    // Combined RMS (L+R)
    let combinedSum = 0;
    const totalSamples = leftSamples.length + rightSamples.length;
    
    for (let i = 0; i < leftSamples.length; i++) {
      combinedSum += leftSamples[i] * leftSamples[i];
    }
    for (let i = 0; i < rightSamples.length; i++) {
      combinedSum += rightSamples[i] * rightSamples[i];
    }
    
    const combinedRms = Math.sqrt(combinedSum / totalSamples);
    
    return { leftRms, rightRms, combinedRms };
  },

  estimateLUFS: (rms: number): number => {
    // Simple LUFS estimation based on RMS
    if (rms <= 0) return -70;
    const db = AudioUtils.rmsToDb(rms);
    // Rough conversion to LUFS (this is a simplified approximation)
    return Math.max(-70, Math.min(0, db - 3));
  },

  // Calculate individual channel LUFS
  estimateChannelLUFS: (leftRms: number, rightRms: number): { leftLufs: number, rightLufs: number } => {
    const leftLufs = AudioUtils.estimateLUFS(leftRms);
    const rightLufs = AudioUtils.estimateLUFS(rightRms);
    return { leftLufs, rightLufs };
  },

  // NEW: Professional phase correlation calculation (Pearson correlation coefficient)
  calculatePhaseCorrelation: (leftSamples: Float32Array, rightSamples: Float32Array): number => {
    const n = Math.min(leftSamples.length, rightSamples.length);
    if (n === 0) return 0;

    let sumL = 0, sumR = 0, sumLR = 0, sumL2 = 0, sumR2 = 0;
    
    // Calculate sums needed for Pearson correlation
    for (let i = 0; i < n; i++) {
      const l = leftSamples[i];
      const r = rightSamples[i];
      sumL += l;
      sumR += r;
      sumLR += l * r;
      sumL2 += l * l;
      sumR2 += r * r;
    }
    
    // Pearson correlation formula: r = (n*ΣLR - ΣL*ΣR) / sqrt((n*ΣL² - (ΣL)²)(n*ΣR² - (ΣR)²))
    const numerator = n * sumLR - sumL * sumR;
    const denominator = Math.sqrt((n * sumL2 - sumL * sumL) * (n * sumR2 - sumR * sumR));
    
    return denominator === 0 ? 0 : Math.max(-1, Math.min(1, numerator / denominator));
  },

  // NEW: Professional stereo width calculation (Mid/Side analysis)
  calculateStereoWidth: (leftSamples: Float32Array, rightSamples: Float32Array): number => {
    const n = Math.min(leftSamples.length, rightSamples.length);
    if (n === 0) return 0;

    let midSum = 0, sideSum = 0;
    
    // Calculate Mid/Side energy
    for (let i = 0; i < n; i++) {
      const mid = (leftSamples[i] + rightSamples[i]) / 2;   // (L+R)/2
      const side = (leftSamples[i] - rightSamples[i]) / 2;  // (L-R)/2
      midSum += mid * mid;
      sideSum += side * side;
    }
    
    const midRms = Math.sqrt(midSum / n);
    const sideRms = Math.sqrt(sideSum / n);
    
    // Stereo width as percentage of side energy vs total energy
    const totalEnergy = midRms + sideRms;
    return totalEnergy > 0 ? Math.min(100, (sideRms / totalEnergy) * 100) : 0;
  },

  // NEW: Calculate Mid/Side channels for professional monitoring
  calculateMidSide: (leftSamples: Float32Array, rightSamples: Float32Array): { midSamples: Float32Array, sideSamples: Float32Array } => {
    const n = Math.min(leftSamples.length, rightSamples.length);
    const midSamples = new Float32Array(n);
    const sideSamples = new Float32Array(n);
    
    for (let i = 0; i < n; i++) {
      midSamples[i] = (leftSamples[i] + rightSamples[i]) / 2;   // (L+R)/2
      sideSamples[i] = (leftSamples[i] - rightSamples[i]) / 2;  // (L-R)/2
    }
    
    return { midSamples, sideSamples };
  },

  // NEW: Complete stereo analysis calculation
  calculateStereoAnalysis: (leftSamples: Float32Array, rightSamples: Float32Array): StereoAnalysis => {
    const { leftRms, rightRms } = AudioUtils.calculateStereoRMS(leftSamples, rightSamples);
    const phaseCorrelation = AudioUtils.calculatePhaseCorrelation(leftSamples, rightSamples);
    const stereoWidth = AudioUtils.calculateStereoWidth(leftSamples, rightSamples);
    const { midSamples, sideSamples } = AudioUtils.calculateMidSide(leftSamples, rightSamples);
    
    // Calculate balance (-1 to +1, where -1 = full left, +1 = full right)
    const balance = (leftRms + rightRms) > 0 ? (rightRms - leftRms) / (rightRms + leftRms) : 0;
    
    // Calculate Mid/Side levels
    const midLevel = AudioUtils.calculateRMS(midSamples);
    const sideLevel = AudioUtils.calculateRMS(sideSamples);
    const midLufs = AudioUtils.estimateLUFS(midLevel);
    const sideLufs = AudioUtils.estimateLUFS(sideLevel);
    
    // Determine mono compatibility based on phase correlation
    let monoCompatibility: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'POOR';
    if (phaseCorrelation >= 0.85) monoCompatibility = 'EXCELLENT';
    else if (phaseCorrelation >= 0.7) monoCompatibility = 'GOOD';
    else if (phaseCorrelation >= 0.3) monoCompatibility = 'WARNING';
    else monoCompatibility = 'POOR';
    
    return {
      phaseCorrelation,
      stereoWidth,
      balance,
      midLevel,
      sideLevel,
      midLufs,
      sideLufs,
      monoCompatibility
    };
  }
};