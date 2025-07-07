# StereoAnalyzer Component

The StereoAnalyzer is a professional stereo field analyzer that provides real-time vectorscope visualization, phase correlation analysis, and stereo imaging assessment for professional audio production and broadcast applications.

## Overview

The StereoAnalyzer component renders a real-time stereo vectorscope with comprehensive stereo field analysis, including phase correlation, stereo width measurement, balance detection, and mid/side analysis for professional audio monitoring.

### **Key Features**
- **Professional Vectorscope**: Real-time L/R phase correlation display
- **Stereo Field Analysis**: Width, balance, and imaging measurements
- **Phase Correlation**: Mono compatibility assessment (-1 to +1)
- **Mid/Side Analysis**: M/S stereo processing visualization
- **Goniometer Display**: Professional phase scope visualization
- **Mono Compatibility**: Real-time mono fold-down assessment
- **Smoothed Measurements**: Rate-limited averaging for stable readings

## Component Interface

### **Props Interface**
```typescript
interface StereoAnalyzerProps {
  stereoData: StereoAnalysis;      // Real-time stereo analysis data
  leftSamples?: Float32Array;     // Real-time left channel samples
  rightSamples?: Float32Array;    // Real-time right channel samples
  isActive: boolean;              // Component active state
  isPlaying: boolean;             // Audio playback state
  crossfadeVolume?: number;       // Optional crossfade volume (0-1)
}

interface StereoAnalysis {
  phaseCorrelation: number;       // -1 to +1 (Pearson correlation between L/R)
  stereoWidth: number;            // 0-100% (Side energy vs total energy)
  balance: number;                // -1 (left) to +1 (right)
  midLevel: number;               // Mid channel RMS (L+R)/2
  sideLevel: number;              // Side channel RMS (L-R)/2
  midLufs: number;                // Mid channel LUFS
  sideLufs: number;               // Side channel LUFS
  monoCompatibility: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'POOR';
}
```

### **Usage Example**
```typescript
<StereoAnalyzer
  stereoData={realTimeStereoAnalysis}
  leftSamples={leftChannelSamples}
  rightSamples={rightChannelSamples}
  isActive={true}
  isPlaying={isPlaying}
  crossfadeVolume={0.75}
/>
```

## Technical Implementation

### **Stereo Analysis Calculations**

#### **Phase Correlation (Pearson Correlation)**
```typescript
const calculatePhaseCorrelation = (leftSamples: Float32Array, rightSamples: Float32Array): number => {
  let sumL = 0, sumR = 0, sumLR = 0, sumL2 = 0, sumR2 = 0;
  const n = leftSamples.length;
  
  for (let i = 0; i < n; i++) {
    const l = leftSamples[i];
    const r = rightSamples[i];
    
    sumL += l;
    sumR += r;
    sumLR += l * r;
    sumL2 += l * l;
    sumR2 += r * r;
  }
  
  const meanL = sumL / n;
  const meanR = sumR / n;
  
  const numerator = (sumLR / n) - (meanL * meanR);
  const denominator = Math.sqrt(((sumL2 / n) - (meanL * meanL)) * ((sumR2 / n) - (meanR * meanR)));
  
  return denominator === 0 ? 0 : numerator / denominator;
};
```

#### **Stereo Width Calculation**
```typescript
const calculateStereoWidth = (leftSamples: Float32Array, rightSamples: Float32Array): number => {
  let midEnergy = 0, sideEnergy = 0;
  
  for (let i = 0; i < leftSamples.length; i++) {
    const mid = (leftSamples[i] + rightSamples[i]) / 2;   // M = (L+R)/2
    const side = (leftSamples[i] - rightSamples[i]) / 2;  // S = (L-R)/2
    
    midEnergy += mid * mid;
    sideEnergy += side * side;
  }
  
  const totalEnergy = midEnergy + sideEnergy;
  return totalEnergy === 0 ? 0 : (sideEnergy / totalEnergy) * 100; // Percentage
};
```

#### **Mid/Side Signal Generation**
```typescript
const calculateMidSide = (leftSamples: Float32Array, rightSamples: Float32Array) => {
  const midSignal = new Float32Array(leftSamples.length);
  const sideSignal = new Float32Array(leftSamples.length);
  
  for (let i = 0; i < leftSamples.length; i++) {
    midSignal[i] = (leftSamples[i] + rightSamples[i]) / 2;    // Sum signal
    sideSignal[i] = (leftSamples[i] - rightSamples[i]) / 2;   // Difference signal
  }
  
  return { midSignal, sideSignal };
};
```

### **Stereo Averaging System**
```typescript
class StereoAverager {
  private phaseCorrelationHistory: number[] = [];
  private stereoWidthHistory: number[] = [];
  private balanceHistory: number[] = [];
  private midLevelHistory: number[] = [];
  private sideLevelHistory: number[] = [];
  private readonly windowSize: number;
  private readonly updateInterval: number;

  constructor(windowSizeMs: number = 300, updateIntervalMs: number = 50) {
    // Calculate samples needed for time window (assuming ~60fps updates)
    this.windowSize = Math.max(1, Math.floor(windowSizeMs / 16.67));
    this.updateInterval = updateIntervalMs;
  }

  addSample(stereoData: StereoAnalysis): boolean {
    const now = performance.now();
    
    // Rate limiting to prevent over-smoothing
    if (this.lastUpdateTime >= 0 && now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    
    // Add new samples
    this.phaseCorrelationHistory.push(stereoData.phaseCorrelation);
    this.stereoWidthHistory.push(stereoData.stereoWidth);
    this.balanceHistory.push(stereoData.balance);
    this.midLevelHistory.push(stereoData.midLevel);
    this.sideLevelHistory.push(stereoData.sideLevel);
    
    // Maintain window size
    if (this.phaseCorrelationHistory.length > this.windowSize) {
      this.phaseCorrelationHistory.shift();
      this.stereoWidthHistory.shift();
      this.balanceHistory.shift();
      this.midLevelHistory.shift();
      this.sideLevelHistory.shift();
    }
    
    return true;
  }

  getSmoothedValues(): StereoAnalysis {
    const avgCorrelation = this.phaseCorrelationHistory.reduce((a, b) => a + b, 0) / this.phaseCorrelationHistory.length;
    const avgWidth = this.stereoWidthHistory.reduce((a, b) => a + b, 0) / this.stereoWidthHistory.length;
    const avgBalance = this.balanceHistory.reduce((a, b) => a + b, 0) / this.balanceHistory.length;
    
    return {
      phaseCorrelation: avgCorrelation,
      stereoWidth: avgWidth,
      balance: avgBalance,
      // ... other smoothed values
    };
  }
}
```

## Vectorscope Visualization

### **Professional Vectorscope Display**
The vectorscope plots left channel (X-axis) against right channel (Y-axis) for real-time stereo field visualization:

```typescript
// Sample visualization in vectorscope
for (let i = 0; i < leftSamples.length; i += sampleStep) {
  const l = leftSamples[i];  // Left channel = X axis
  const r = rightSamples[i]; // Right channel = Y axis
  
  // Skip very low amplitude samples to reduce noise
  if (Math.abs(l) > 0.001 || Math.abs(r) > 0.001) {
    samplesBuffer.current.push({
      x: l,
      y: r,
      age: 0  // For fade-out effect
    });
  }
}
```

### **Grid Overlay**
Professional vectorscope grid with reference lines:
- **Center Crosshairs**: L=R line and L+R=0 line
- **Mono Line (+45°)**: Perfect mono correlation (L=R)
- **Anti-phase Line (-45°)**: Anti-phase correlation (L=-R)
- **Concentric Circles**: Amplitude level references

### **Canvas Rendering**
```typescript
// Professional vectorscope grid
ctx.strokeStyle = '#1e293b';
ctx.lineWidth = 1;

// Center crosshairs
ctx.beginPath();
ctx.moveTo(0, centerY);           // Horizontal line
ctx.lineTo(width, centerY);
ctx.moveTo(centerX, 0);           // Vertical line  
ctx.lineTo(centerX, height);
ctx.stroke();

// Diagonal reference lines
ctx.strokeStyle = '#334155';
ctx.lineWidth = 0.5;
ctx.beginPath();
// Mono line (L=R): 45° diagonal
ctx.moveTo(centerX - radius * 0.7, centerY + radius * 0.7);
ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.7);
// Anti-phase line (L=-R): -45° diagonal  
ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
ctx.lineTo(centerX + radius * 0.7, centerY + radius * 0.7);
ctx.stroke();
```

### **Sample Point Rendering**
```typescript
// Draw sample points with age-based fading
samplesBuffer.current.forEach(sample => {
  const x = centerX + (sample.x * radius);
  const y = centerY - (sample.y * radius); // Invert Y for proper orientation
  
  // Age-based opacity for trail effect
  const opacity = Math.max(0.1, 1 - (sample.age * 0.1));
  
  ctx.fillStyle = `rgba(0, 255, 100, ${opacity})`;
  ctx.fillRect(x - 1, y - 1, 2, 2);
});
```

## Stereo Analysis Metrics

### **Phase Correlation Interpretation**
- **+1.0**: Perfect mono (identical L and R)
- **+0.7 to +1.0**: Excellent stereo imaging
- **+0.3 to +0.7**: Good stereo content
- **0.0 to +0.3**: Wide stereo, monitor mono compatibility
- **-0.3 to 0.0**: Very wide, potential mono issues
- **-1.0 to -0.3**: Anti-phase content, mono incompatible

### **Stereo Width Assessment**
- **0-20%**: Mostly mono content
- **20-40%**: Moderate stereo width
- **40-60%**: Good stereo imaging
- **60-80%**: Wide stereo field
- **80-100%**: Very wide, check mono compatibility

### **Mono Compatibility Calculation**
```typescript
const determineMonoCompatibility = (correlation: number, width: number): MonoCompatibility => {
  if (correlation >= 0.7) return 'EXCELLENT';
  if (correlation >= 0.3 && width <= 60) return 'GOOD';
  if (correlation >= 0.0 && width <= 80) return 'WARNING';
  return 'POOR';
};
```

## UI Display Elements

### **Vectorscope Display**
- **Real-time Sample Points**: Visual representation of L/R correlation
- **Grid References**: Professional vectorscope grid overlay
- **Color-coded Points**: Correlation strength indication
- **Fade Trail**: Historical sample visualization with aging

### **Numeric Displays**
- **Phase Correlation**: -1.00 to +1.00 with color coding
- **Stereo Width**: 0-100% measurement
- **Balance**: L/R balance (-100% to +100%)
- **Mid/Side Levels**: Individual M/S channel levels

### **Status Indicators**
- **Mono Compatibility**: Color-coded compatibility assessment
- **Correlation Meter**: Visual correlation strength indicator
- **Balance Indicator**: L/R balance visualization

### **Professional Color Coding**
```typescript
const getCompatibilityColor = (compatibility: string) => {
  switch (compatibility) {
    case 'EXCELLENT': return 'text-green-400';
    case 'GOOD': return 'text-yellow-400';
    case 'WARNING': return 'text-orange-400';
    case 'POOR': return 'text-red-400';
    default: return 'text-slate-400';
  }
};

const getCorrelationColor = (correlation: number) => {
  if (correlation >= 0.7) return 'text-green-400';
  if (correlation >= 0.3) return 'text-yellow-400';
  if (correlation >= 0.0) return 'text-orange-400';
  return 'text-red-400';
};
```

## Performance Optimization

### **Sample Management**
- **Subsampling**: Process every Nth sample for performance
- **Noise Gate**: Skip very low amplitude samples
- **Buffer Management**: Circular buffer with maximum sample count
- **Age-based Cleanup**: Remove old samples for memory efficiency

### **Rendering Optimization**
- **Canvas Reuse**: Single canvas element with efficient clearing
- **Selective Updates**: Only redraw when necessary
- **High DPI Support**: Device pixel ratio scaling
- **Efficient Drawing**: Minimal draw calls with batching

### **Memory Management**
```typescript
// Efficient sample buffer management
const maxSamples = 200; // Professional vectorscope sample count
const sampleStep = Math.max(1, Math.floor(leftSamples.length / 50)); // Subsample

// Age existing samples and remove old ones
samplesBuffer.current = [
  ...newSamples,
  ...samplesBuffer.current.map(s => ({ ...s, age: s.age + 1 }))
].slice(0, maxSamples);
```

## Professional Standards

### **Vectorscope Standards**
- **Phase Correlation Range**: -1.0 to +1.0 (ITU-R BS.1770)
- **Stereo Width Measurement**: Energy-based calculation
- **Mono Compatibility**: EBU R 128 mono fold-down assessment

### **Visual Standards**
- **Grid Layout**: Professional vectorscope reference grid
- **Color Coding**: Industry-standard correlation indication
- **Response Time**: Real-time sample visualization (<16ms latency)

## Integration Points

### **Audio Context Integration**
```typescript
// Extract stereo samples for vectorscope
const leftSamples = new Float32Array(bufferSize);
const rightSamples = new Float32Array(bufferSize);

// Get time domain data from separate analysers
leftAnalyser.getFloatTimeDomainData(leftSamples);
rightAnalyser.getFloatTimeDomainData(rightSamples);

// Calculate stereo analysis
const stereoData: StereoAnalysis = {
  phaseCorrelation: calculatePhaseCorrelation(leftSamples, rightSamples),
  stereoWidth: calculateStereoWidth(leftSamples, rightSamples),
  balance: calculateBalance(leftSamples, rightSamples),
  // ... other measurements
};

<StereoAnalyzer 
  stereoData={stereoData}
  leftSamples={leftSamples}
  rightSamples={rightSamples}
  isActive={true}
  isPlaying={isPlaying}
/>
```

### **Professional Applications**
- **Mixing Monitoring**: Real-time stereo field assessment
- **Mastering Quality**: Mono compatibility verification
- **Broadcast Compliance**: Stereo signal validation
- **Audio Forensics**: Stereo imaging analysis

---

The StereoAnalyzer provides professional-grade stereo field analysis with real-time vectorscope visualization, comprehensive correlation measurements, and broadcast-standard mono compatibility assessment for critical audio production workflows. 