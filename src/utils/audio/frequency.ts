import type { FrequencyAnalysis } from './types';

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
