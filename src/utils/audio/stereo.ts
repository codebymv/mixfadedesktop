import type { StereoAnalysis } from './types';
import { calculateRMS, calculateStereoRMS, estimateLUFS } from './levels';

export function calculatePhaseCorrelation(leftSamples: Float32Array, rightSamples: Float32Array): number {
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
  
  // Pearson correlation formula.
  const numerator = n * sumLR - sumL * sumR;
  const denominator = Math.sqrt((n * sumL2 - sumL * sumL) * (n * sumR2 - sumR * sumR));
  
  return denominator === 0 ? 0 : Math.max(-1, Math.min(1, numerator / denominator));
}

export function calculateStereoWidth(leftSamples: Float32Array, rightSamples: Float32Array): number {
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
}

export function calculateMidSide(leftSamples: Float32Array, rightSamples: Float32Array): { midSamples: Float32Array, sideSamples: Float32Array } {
  const n = Math.min(leftSamples.length, rightSamples.length);
  const midSamples = new Float32Array(n);
  const sideSamples = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    midSamples[i] = (leftSamples[i] + rightSamples[i]) / 2;   // (L+R)/2
    sideSamples[i] = (leftSamples[i] - rightSamples[i]) / 2;  // (L-R)/2
  }
  
  return { midSamples, sideSamples };
}

export function calculateStereoAnalysis(leftSamples: Float32Array, rightSamples: Float32Array): StereoAnalysis {
  const { leftRms, rightRms } = calculateStereoRMS(leftSamples, rightSamples);
  const phaseCorrelation = calculatePhaseCorrelation(leftSamples, rightSamples);
  const stereoWidth = calculateStereoWidth(leftSamples, rightSamples);
  const { midSamples, sideSamples } = calculateMidSide(leftSamples, rightSamples);
  
  // Calculate balance (-1 to +1, where -1 = full left, +1 = full right)
  const balance = (leftRms + rightRms) > 0 ? (rightRms - leftRms) / (leftRms + rightRms) : 0;
  
  // Calculate Mid/Side levels
  const midLevel = calculateRMS(midSamples);
  const sideLevel = calculateRMS(sideSamples);
  const midLufs = estimateLUFS(midLevel);
  const sideLufs = estimateLUFS(sideLevel);
  
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
