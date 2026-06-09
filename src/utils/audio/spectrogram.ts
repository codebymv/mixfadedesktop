import type { SpectrogramAnalysis, SpectrogramSnapshot } from './types';

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
