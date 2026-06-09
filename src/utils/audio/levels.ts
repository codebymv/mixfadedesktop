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

export function linearToDb(linear: number): number {
  if (linear <= 0) return -60;
  return Math.max(-60, 20 * Math.log10(linear));
}

export function dbToLinear(db: number): number {
  if (db <= -60) return 0;
  return Math.pow(10, db / 20);
}

export function rmsToDb(rms: number): number {
  if (rms <= 0) return -60;
  return Math.max(-60, 20 * Math.log10(rms));
}

export function calculateRMS(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

export function calculateStereoRMS(leftSamples: Float32Array, rightSamples: Float32Array): { leftRms: number, rightRms: number, combinedRms: number } {
  const leftRms = calculateRMS(leftSamples);
  const rightRms = calculateRMS(rightSamples);
  
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
}

export function estimateLUFS(rms: number): number {
  // Simple LUFS estimation based on RMS
  if (rms <= 0) return -70;
  const db = rmsToDb(rms);
  // Rough conversion to LUFS (this is a simplified approximation)
  return Math.max(-70, Math.min(0, db - 3));
}

export function estimateChannelLUFS(leftRms: number, rightRms: number): { leftLufs: number, rightLufs: number } {
  const leftLufs = estimateLUFS(leftRms);
  const rightLufs = estimateLUFS(rightRms);
  return { leftLufs, rightLufs };
}
