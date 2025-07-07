# SpectrogramAnalyzer Component

The SpectrogramAnalyzer is a professional-grade time-frequency analyzer that provides real-time spectrogram visualization with waterfall display, spectral analysis metrics, and broadcast-quality frequency domain monitoring for advanced audio analysis.

## Overview

The SpectrogramAnalyzer component renders a real-time spectrogram (waterfall) display showing frequency content evolution over time, with comprehensive spectral analysis including brightness, dynamic range, activity measurement, and tonal content assessment.

### **Key Features**
- **Real-time Spectrogram**: Time-frequency waterfall display
- **Professional Color Mapping**: Blue-green-yellow-red spectral visualization
- **Spectral Analysis**: Brightness, dynamic range, activity metrics
- **Time-based Buffering**: 5-second historical frequency data
- **Logarithmic Frequency Scale**: Professional 20Hz-20kHz display
- **Broadcast Standards**: dB scaling and frequency analysis
- **Temporal Evolution**: Visual frequency content changes over time

## Component Interface

### **Props Interface**
```typescript
interface SpectrogramAnalyzerProps {
  frequencyData: Float32Array;    // Real-time FFT frequency data in dB
  isActive: boolean;              // Component active state
  isPlaying: boolean;             // Audio playback state
  crossfadeVolume?: number;       // Optional crossfade volume (0-1)
}

interface SpectrogramAnalysis {
  peakFrequency: number;          // Hz - Dominant frequency across time window
  spectralCentroid: number;       // Hz - Frequency center of mass (brightness)
  spectralRolloff: number;        // Hz - 85% energy cutoff frequency
  dynamicRange: number;           // dB - Frequency domain dynamic range
  harmonicContent: number;        // 0-1 - Tonal vs noisy content ratio
}
```

### **Usage Example**
```typescript
<SpectrogramAnalyzer
  frequencyData={analyserNode.getFloatFrequencyData()}
  isActive={true}
  isPlaying={isPlaying}
  crossfadeVolume={0.75}
/>
```

## Technical Implementation

### **Spectrogram Buffer System**
```typescript
interface SpectrogramSnapshot {
  timestamp: number;              // Performance.now() timestamp
  frequencyData: Float32Array;    // dB values from FFT analysis
  sampleRate: number;             // Audio sample rate for frequency mapping
}

class SpectrogramBuffer {
  private snapshots: SpectrogramSnapshot[] = [];
  private readonly timeWindowMs: number;    // 5 seconds default
  private readonly maxSnapshots: number;
  private readonly updateInterval: number;  // 50ms update rate

  constructor(timeWindowMs: number = 5000, updateIntervalMs: number = 50) {
    this.timeWindowMs = timeWindowMs;
    this.maxSnapshots = Math.ceil(timeWindowMs / updateIntervalMs);
    this.updateInterval = updateIntervalMs;
  }

  addSnapshot(frequencyData: Float32Array, sampleRate: number): boolean {
    const now = performance.now();
    
    // Rate limiting to prevent buffer overflow
    if (this.lastUpdateTime >= 0 && now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    
    // Create frequency data copy (important: don't store reference)
    const dataCopy = new Float32Array(frequencyData.length);
    dataCopy.set(frequencyData);
    
    // Add new snapshot
    this.snapshots.push({
      timestamp: now,
      frequencyData: dataCopy,
      sampleRate: sampleRate
    });
    
    // Remove old snapshots beyond time window
    const cutoffTime = now - this.timeWindowMs;
    this.snapshots = this.snapshots.filter(snapshot => snapshot.timestamp >= cutoffTime);
    
    // Limit maximum snapshots for memory management
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    
    return true;
  }

  getVisibleSnapshots(): SpectrogramSnapshot[] {
    return this.snapshots.slice(); // Return copy for safety
  }
}
```

### **Spectral Analysis Calculations**

#### **Spectral Centroid (Brightness)**
```typescript
const calculateSpectralCentroid = (frequencyData: Float32Array, sampleRate: number): number => {
  const nyquist = sampleRate / 2;
  const freqResolution = nyquist / frequencyData.length;
  
  let weightedSum = 0;
  let magnitudeSum = 0;
  
  for (let i = 1; i < frequencyData.length; i++) {
    const freq = i * freqResolution;
    const magnitude = Math.pow(10, frequencyData[i] / 20); // Convert dB to linear
    
    weightedSum += freq * magnitude;
    magnitudeSum += magnitude;
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
};
```

#### **Spectral Rolloff (High Frequency Content)**
```typescript
const calculateSpectralRolloff = (frequencyData: Float32Array, sampleRate: number, threshold: number = 0.85): number => {
  const nyquist = sampleRate / 2;
  const freqResolution = nyquist / frequencyData.length;
  
  // Calculate total energy
  let totalEnergy = 0;
  for (let i = 1; i < frequencyData.length; i++) {
    const magnitude = Math.pow(10, frequencyData[i] / 20);
    totalEnergy += magnitude * magnitude;
  }
  
  // Find frequency where 85% of energy is contained
  const targetEnergy = totalEnergy * threshold;
  let cumulativeEnergy = 0;
  
  for (let i = 1; i < frequencyData.length; i++) {
    const magnitude = Math.pow(10, frequencyData[i] / 20);
    cumulativeEnergy += magnitude * magnitude;
    
    if (cumulativeEnergy >= targetEnergy) {
      return i * freqResolution;
    }
  }
  
  return nyquist; // Fallback to Nyquist frequency
};
```

#### **Dynamic Range Analysis**
```typescript
const calculateDynamicRange = (frequencyData: Float32Array): number => {
  let maxDb = -Infinity;
  let minDb = Infinity;
  
  for (let i = 1; i < frequencyData.length; i++) {
    const db = frequencyData[i];
    if (db > -60) { // Ignore noise floor
      maxDb = Math.max(maxDb, db);
      minDb = Math.min(minDb, db);
    }
  }
  
  return maxDb > minDb ? maxDb - minDb : 0;
};
```

#### **Harmonic Content (Tonal vs Noise)**
```typescript
const calculateHarmonicContent = (frequencyData: Float32Array, sampleRate: number): number => {
  const nyquist = sampleRate / 2;
  const freqResolution = nyquist / frequencyData.length;
  
  // Detect peaks (local maxima indicating tonal content)
  let peakEnergy = 0;
  let totalEnergy = 0;
  
  for (let i = 2; i < frequencyData.length - 2; i++) {
    const current = Math.pow(10, frequencyData[i] / 20);
    const prev1 = Math.pow(10, frequencyData[i-1] / 20);
    const prev2 = Math.pow(10, frequencyData[i-2] / 20);
    const next1 = Math.pow(10, frequencyData[i+1] / 20);
    const next2 = Math.pow(10, frequencyData[i+2] / 20);
    
    totalEnergy += current * current;
    
    // Check if this is a local peak (tonal content indicator)
    if (current > prev1 && current > prev2 && current > next1 && current > next2) {
      peakEnergy += current * current;
    }
  }
  
  return totalEnergy > 0 ? peakEnergy / totalEnergy : 0;
};
```

## Professional Spectrogram Visualization

### **Color Mapping System**
Professional spectrogram uses blue-cyan-green-yellow-red progression:

```typescript
const dbToColor = (db: number): string => {
  const minDb = -60;
  const maxDb = 0;
  const normalized = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
  
  if (normalized < 0.25) {
    // Blue to cyan
    const t = normalized / 0.25;
    const r = Math.floor(0 * (1 - t) + 0 * t);
    const g = Math.floor(100 * (1 - t) + 150 * t);
    const b = Math.floor(255 * (1 - t) + 255 * t);
    return `rgb(${r},${g},${b})`;
  } else if (normalized < 0.5) {
    // Cyan to green
    const t = (normalized - 0.25) / 0.25;
    const r = Math.floor(0 * (1 - t) + 0 * t);
    const g = Math.floor(150 * (1 - t) + 255 * t);
    const b = Math.floor(255 * (1 - t) + 0 * t);
    return `rgb(${r},${g},${b})`;
  } else if (normalized < 0.75) {
    // Green to yellow
    const t = (normalized - 0.5) / 0.25;
    const r = Math.floor(0 * (1 - t) + 255 * t);
    const g = Math.floor(255 * (1 - t) + 255 * t);
    const b = Math.floor(0 * (1 - t) + 0 * t);
    return `rgb(${r},${g},${b})`;
  } else {
    // Yellow to red
    const t = (normalized - 0.75) / 0.25;
    const r = Math.floor(255 * (1 - t) + 255 * t);
    const g = Math.floor(255 * (1 - t) + 0 * t);
    const b = Math.floor(0 * (1 - t) + 0 * t);
    return `rgb(${r},${g},${b})`;
  }
};
```

### **Logarithmic Frequency Axis**
```typescript
// Professional frequency constants
const minFreq = 20;     // 20Hz minimum (human hearing)
const maxFreq = 20000;  // 20kHz maximum (human hearing)
const minDb = -60;      // Noise floor
const maxDb = 0;        // Digital full scale

// Convert frequency to Y position (inverted, high freq at top)
const freqToY = (freq: number): number => {
  const logMinFreq = Math.log10(minFreq);
  const logMaxFreq = Math.log10(maxFreq);
  const logFreqRange = logMaxFreq - logMinFreq;
  
  const logFreq = Math.log10(Math.max(freq, minFreq));
  const normalizedLog = (logFreq - logMinFreq) / logFreqRange;
  return height - (normalizedLog * height); // Invert Y axis (high freq at top)
};
```

### **Canvas Rendering**
```typescript
// Draw spectrogram columns
const columnWidth = Math.max(1, width / Math.max(snapshots.length, 100));

snapshots.forEach((snapshot, index) => {
  const x = (index / Math.max(snapshots.length - 1, 1)) * width;
  const freqData = snapshot.frequencyData;
  const sampleRate = snapshot.sampleRate;
  const nyquist = sampleRate / 2;
  const freqResolution = nyquist / freqData.length;

  // Draw frequency bins as vertical strips
  for (let binIndex = 1; binIndex < freqData.length; binIndex++) {
    const freq = binIndex * freqResolution;
    
    // Only draw audible frequencies
    if (freq >= minFreq && freq <= maxFreq) {
      const y1 = freqToY(freq);
      const y2 = freqToY(freq + freqResolution);
      const magnitude = freqData[binIndex];
      
      ctx.fillStyle = dbToColor(magnitude);
      ctx.fillRect(x, Math.min(y1, y2), columnWidth, Math.abs(y2 - y1) + 1);
    }
  }
});
```

### **Professional Grid Overlay**
```typescript
// Frequency grid lines and labels
const freqMarkers = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

ctx.strokeStyle = '#334155';
ctx.lineWidth = 0.5;
ctx.font = '10px monospace';
ctx.fillStyle = '#64748b';

freqMarkers.forEach(freq => {
  const y = freqToY(freq);
  
  // Draw grid line
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  
  // Draw frequency label
  const label = freq >= 1000 ? `${freq/1000}k` : `${freq}`;
  ctx.fillText(label, 5, y - 2);
});

// Time grid lines (every second)
const timeStep = width / (timeWindowMs / 1000); // Pixels per second
for (let i = 1; i < 5; i++) {
  const x = width - (i * timeStep);
  if (x > 0) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}
```

## Spectral Analysis Metrics

### **Analysis Interface**
```typescript
interface SpectrogramAnalysis {
  peakFrequency: number;          // Hz - Most prominent frequency
  spectralCentroid: number;       // Hz - Brightness measure
  spectralRolloff: number;        // Hz - High frequency content
  dynamicRange: number;           // dB - Frequency domain range
  harmonicContent: number;        // 0-1 - Tonal vs noise ratio
}
```

### **Comprehensive Analysis Calculation**
```typescript
const calculateAnalysis = (): SpectrogramAnalysis => {
  if (snapshots.length === 0) {
    return {
      peakFrequency: 0,
      spectralCentroid: 0,
      spectralRolloff: 0,
      dynamicRange: 0,
      harmonicContent: 0
    };
  }

  // Analyze most recent snapshot
  const latest = snapshots[snapshots.length - 1];
  const frequencyData = latest.frequencyData;
  const sampleRate = latest.sampleRate;
  
  return {
    peakFrequency: calculatePeakFrequency(frequencyData, sampleRate),
    spectralCentroid: calculateSpectralCentroid(frequencyData, sampleRate),
    spectralRolloff: calculateSpectralRolloff(frequencyData, sampleRate),
    dynamicRange: calculateDynamicRange(frequencyData),
    harmonicContent: calculateHarmonicContent(frequencyData, sampleRate)
  };
};
```

## UI Display Elements

### **Spectrogram Display**
- **Waterfall Visualization**: Time flows left to right, newest on right
- **Logarithmic Frequency**: Professional Y-axis scaling (20Hz-20kHz)
- **Professional Colors**: Blue-cyan-green-yellow-red magnitude mapping
- **Grid Overlay**: Frequency and time reference lines

### **Analysis Metrics**
- **Peak Frequency**: Dominant frequency with color coding
- **Spectral Centroid**: Brightness measurement (frequency center of mass)
- **Spectral Rolloff**: High frequency content indicator
- **Dynamic Range**: Frequency domain dynamic range in dB
- **Harmonic Content**: Tonal vs noisy content percentage

### **Status Indicators**
- **Time Window**: 5-second historical view
- **Update Rate**: 50ms refresh for smooth visualization
- **Activity Indicator**: Visual playback status

### **Professional Color Coding**
```typescript
const getFrequencyColor = (freq: number) => {
  if (freq < 200) return 'text-red-400';      // Bass
  if (freq < 2000) return 'text-orange-400';  // Mid
  if (freq < 8000) return 'text-green-400';   // Upper mid
  return 'text-purple-400';                   // High
};

const getDynamicRangeColor = (rangeDb: number) => {
  if (rangeDb > 40) return 'text-green-400';   // Excellent dynamic range
  if (rangeDb > 25) return 'text-yellow-400';  // Good dynamic range
  if (rangeDb > 15) return 'text-orange-400';  // Limited range
  return 'text-red-400';                       // Poor dynamic range
};
```

## Performance Optimization

### **Memory Management**
- **Circular Buffer**: Fixed-size snapshot history
- **Data Copying**: Prevent reference sharing with live data
- **Automatic Cleanup**: Remove old snapshots beyond time window
- **Buffer Limits**: Maximum snapshot count for memory safety

### **Rendering Optimization**
```typescript
// Efficient column rendering with proper scaling
const columnWidth = Math.max(1, width / Math.max(snapshots.length, 100));

// Skip rendering for frequencies outside audible range
if (freq >= minFreq && freq <= maxFreq) {
  // Only render necessary frequency bins
}

// Batch canvas operations for performance
ctx.fillRect(x, Math.min(y1, y2), columnWidth, Math.abs(y2 - y1) + 1);
```

### **Update Rate Management**
- **Rate Limiting**: 50ms update interval for smooth display
- **Selective Updates**: Only process new frequency data
- **Efficient Analysis**: Optimized spectral calculations

## Professional Standards

### **Frequency Analysis**
- **20Hz-20kHz Range**: Full human hearing spectrum
- **Logarithmic Scale**: Professional frequency distribution
- **dB Range**: -60dB to 0dB professional monitoring range

### **Visual Standards**
- **Color Mapping**: Industry-standard spectrogram colors
- **Grid References**: Professional frequency and time markers
- **Real-time Response**: <50ms update latency for monitoring

### **Broadcast Compliance**
- **Frequency Resolution**: High-resolution frequency analysis
- **Time Resolution**: Sufficient temporal detail for content analysis
- **Dynamic Range**: Full professional audio range coverage

## Integration Points

### **Audio Context Integration**
```typescript
// Professional spectrogram analysis setup
const analyser = audioContext.createAnalyser();
analyser.fftSize = 4096; // High resolution for detailed analysis
analyser.smoothingTimeConstant = 0.0; // No temporal smoothing

const frequencyData = new Float32Array(analyser.frequencyBinCount);

// Regular updates for spectrogram buffer
setInterval(() => {
  if (isPlaying) {
    analyser.getFloatFrequencyData(frequencyData);
    spectrogramBuffer.addSnapshot(frequencyData, 48000);
  }
}, 50);

<SpectrogramAnalyzer 
  frequencyData={frequencyData}
  isActive={true}
  isPlaying={isPlaying}
/>
```

### **Professional Applications**
- **Audio Analysis**: Spectral content evolution over time
- **Quality Control**: Frequency domain artifact detection
- **Mastering Monitoring**: Spectral balance assessment
- **Forensic Analysis**: Detailed frequency content examination

---

The SpectrogramAnalyzer provides professional-grade time-frequency analysis with real-time waterfall visualization, comprehensive spectral metrics, and broadcast-quality frequency domain monitoring for advanced audio production workflows. 