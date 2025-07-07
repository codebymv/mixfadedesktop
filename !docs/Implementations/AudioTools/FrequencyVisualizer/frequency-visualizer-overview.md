# FrequencyVisualizer Component

The FrequencyVisualizer is a professional-grade real-time spectrum analyzer that provides logarithmic frequency analysis with broadcast-standard color coding and metrics calculation.

## Overview

The FrequencyVisualizer component renders a real-time frequency spectrum display using Canvas API with logarithmic frequency scaling, professional color mapping, and comprehensive frequency band analysis.

### **Key Features**
- **Logarithmic Frequency Scaling**: Professional audio standard 20Hz-20kHz display
- **Real-time Analysis**: 60fps responsive spectrum visualization  
- **Professional Color Coding**: Frequency-dependent color mapping
- **Broadcast Standards**: dB scaling from -60dB to 0dB
- **Frequency Band Analysis**: Bass, Mid, High energy calculations
- **Peak Frequency Detection**: Dominant frequency identification

## Component Interface

### **Props Interface**
```typescript
interface FrequencyVisualizerProps {
  frequencyData: Float32Array;  // FFT frequency data in dB values
  isActive: boolean;           // Component active state
  isPlaying: boolean;          // Audio playback state
  crossfadeVolume?: number;    // Optional crossfade volume (0-1)
}
```

### **Usage Example**
```typescript
<FrequencyVisualizer
  frequencyData={analyserNode.getFloatFrequencyData()}
  isActive={true}
  isPlaying={isPlaying}
  crossfadeVolume={0.75}
/>
```

## Technical Implementation

### **Frequency Analysis Constants**
```typescript
// Professional audio standards
const sampleRate = 48000;          // 48kHz professional sample rate
const nyquistFreq = 24000;         // Maximum analyzable frequency
const minFreq = 20;                // 20Hz minimum (human hearing range)
const maxFreq = 20000;             // 20kHz maximum (human hearing range)
const freqResolution = nyquistFreq / frequencyData.length;
```

### **Logarithmic Frequency Mapping**
The component uses logarithmic frequency distribution for professional audio analysis:

```typescript
// Convert frequency to logarithmic position (0-1)
const freqToLogPosition = (freq: number): number => {
  return Math.log10(Math.max(freq, minFreq) / minFreq) / Math.log10(maxFreq / minFreq);
};

// Convert position back to frequency
const leftFreq = minFreq * Math.pow(maxFreq / minFreq, leftPos);
const rightFreq = minFreq * Math.pow(maxFreq / minFreq, rightPos);
```

### **Professional Color Coding**

#### **Frequency Band Colors**
- **Sub-bass/Bass (20-200Hz)**: Red spectrum
- **Midrange (200-2000Hz)**: Orange to Yellow spectrum  
- **Upper Mid (2000-8000Hz)**: Yellow to Green spectrum
- **Treble (8000-20000Hz)**: Blue to Purple spectrum

#### **Color Calculation**
```typescript
const centerFreq = Math.sqrt(leftFreq * rightFreq); // Geometric mean

if (centerFreq < 200) {
  // Sub-bass and bass: Red
  color = `hsl(0, 100%, ${50 + normalizedHeight * 30}%)`;
} else if (centerFreq < 2000) {
  // Midrange: Orange to Yellow (15° to 60°)
  const hue = 15 + (Math.log10(centerFreq / 200) / Math.log10(10)) * 45;
  color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
} else if (centerFreq < 8000) {
  // Upper midrange: Yellow to Green (60° to 120°)
  const hue = 60 + (Math.log10(centerFreq / 2000) / Math.log10(4)) * 60;
  color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
} else {
  // Treble: Blue to Purple (200° to 280°)
  const hue = 200 + (Math.log10(centerFreq / 8000) / Math.log10(2.5)) * 80;
  color = `hsl(${hue}, 100%, ${50 + normalizedHeight * 30}%)`;
}
```

## Frequency Analysis Metrics

### **Band Energy Calculation**
The component calculates energy levels for three main frequency bands:

```typescript
interface FrequencyMetrics {
  bassEnergy: number;           // 20-200Hz energy (-60 to 0 dB)
  midEnergy: number;            // 200-2000Hz energy (-60 to 0 dB)  
  highEnergy: number;           // 2000-24000Hz energy (-60 to 0 dB)
  peakFreq: number;             // Dominant frequency (Hz)
  peakFreqBand: string;         // Which band contains peak
  spectralBalance: string;      // Overall frequency balance
}
```

### **Analysis Algorithm**
```typescript
const calculateFrequencyMetrics = () => {
  // Initialize tracking variables
  let bassMax = -Infinity, midMax = -Infinity, highMax = -Infinity;
  let bassSum = 0, midSum = 0, highSum = 0;
  let bassCount = 0, midCount = 0, highCount = 0;
  let peakMagnitude = -Infinity;
  let peakFreq = 0;

  // Analyze each frequency bin
  for (let i = 0; i < frequencyData.length; i++) {
    const freq = i * freqResolution;
    const magnitudeDb = frequencyData[i];

    // Track peak frequency
    if (magnitudeDb > peakMagnitude) {
      peakMagnitude = magnitudeDb;
      peakFreq = freq;
    }

    // Accumulate band energies
    if (freq >= 20 && freq < 200) {
      bassMax = Math.max(bassMax, magnitudeDb);
      bassSum += magnitudeDb;
      bassCount++;
    } else if (freq >= 200 && freq < 2000) {
      midMax = Math.max(midMax, magnitudeDb);
      midSum += magnitudeDb;
      midCount++;
    } else if (freq >= 2000) {
      highMax = Math.max(highMax, magnitudeDb);
      highSum += magnitudeDb;
      highCount++;
    }
  }

  // Blend maximum and average for representative values
  const bassEnergy = bassCount > 0 ? Math.max(bassMax, bassSum / bassCount) : -60;
  const midEnergy = midCount > 0 ? Math.max(midMax, midSum / midCount) : -60;
  const highEnergy = highCount > 0 ? Math.max(highMax, highSum / highCount) : -60;
};
```

### **Spectral Balance Analysis**
```typescript
// Determine spectral balance
let spectralBalance = 'BALANCED';
const bassToHigh = bassEnergy - highEnergy;

if (bassToHigh > 6) {
  spectralBalance = 'BASS-HEAVY';
} else if (bassToHigh < -6) {
  spectralBalance = 'BRIGHT';
}
```

## Rendering Implementation

### **Canvas Setup**
```typescript
// High DPI support
const rect = canvas.getBoundingClientRect();
const dpr = window.devicePixelRatio || 1;

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```

### **Bar Rendering**
```typescript
// Logarithmic bar distribution
const numBars = Math.floor(width / 2); // 2 pixels per bar for smooth rendering

for (let i = 0; i < numBars; i++) {
  // Calculate frequency range for this bar
  const leftPos = i / numBars;
  const rightPos = (i + 1) / numBars;
  
  // Convert to frequencies
  const leftFreq = minFreq * Math.pow(maxFreq / minFreq, leftPos);
  const rightFreq = minFreq * Math.pow(maxFreq / minFreq, rightPos);
  
  // Find corresponding FFT bins and average
  const leftBin = Math.floor(leftFreq / freqResolution);
  const rightBin = Math.floor(rightFreq / freqResolution);
  
  let avgMagnitude = 0;
  let binCount = 0;
  
  for (let bin = leftBin; bin <= Math.min(rightBin, frequencyData.length - 1); bin++) {
    if (bin >= 0 && bin < frequencyData.length) {
      avgMagnitude += frequencyData[bin];
      binCount++;
    }
  }
  
  if (binCount > 0) {
    avgMagnitude /= binCount;
  }
  
  // Convert dB to normalized height (-60dB to 0dB range)
  const dbValue = avgMagnitude;
  const normalizedHeight = Math.max(0, Math.min(1, (dbValue + 60) / 60));
  const barHeight = normalizedHeight * height;
  
  // Draw the bar
  ctx.fillRect(barX, height - barHeight, barWidth, barHeight);
}
```

### **Grid Overlay**
```typescript
// Professional frequency markers
const freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

freqMarkers.forEach(freq => {
  if (freq >= minFreq && freq <= maxFreq) {
    const x = freqToLogPosition(freq) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
});
```

## UI Components

### **Header Display**
Shows real-time frequency analysis metrics:
- **Peak Frequency**: Dominant frequency with band color coding
- **Bass/Mid/High Energy**: Real-time dB levels for each band
- **Crossfade Indicator**: Visual crossfade volume display

### **Scale Labels**
Logarithmic frequency scale markers:
`20Hz | 50Hz | 100Hz | 500Hz | 1kHz | 5kHz | 10kHz | 20kHz`

### **Legend**
- **Red**: Bass frequencies (20-200Hz)
- **Orange-Yellow**: Mid frequencies (200-2000Hz) 
- **Yellow-Green**: Upper mid frequencies (2000-8000Hz)
- **Blue-Purple**: High frequencies (8000-20000Hz)

### **Status Indicator**
- **Green Pulsing**: Playing
- **Gray**: Paused
- **Red**: Muted (crossfade = 0)

## Performance Considerations

### **Optimization Techniques**
- **Efficient Bar Count**: 2 pixels per bar for smooth rendering without excessive computation
- **Logarithmic Grouping**: Reduces computation while maintaining frequency resolution
- **RequestAnimationFrame**: Synchronized with display refresh rate
- **Canvas Reuse**: Single canvas element with efficient clearing

### **Memory Management**
- **No Data Copying**: Direct Float32Array processing
- **Minimal Allocations**: Reuse calculation variables
- **Efficient Color Strings**: HSL color calculation without object creation

## Professional Standards Compliance

### **Frequency Analysis**
- **20Hz-20kHz Range**: Full human hearing spectrum
- **Logarithmic Scaling**: Industry standard frequency distribution
- **dB Scaling**: Professional -60dB to 0dB range

### **Visual Standards**
- **Color Coding**: Frequency-dependent professional color mapping
- **Grid Lines**: Standard frequency markers for reference
- **Real-time Response**: <16ms update latency for professional monitoring

## Integration Points

### **Audio Context Integration**
```typescript
// Connect to Web Audio API
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048; // 1024 frequency bins
analyser.smoothingTimeConstant = 0.1; // Minimal smoothing for responsiveness

const frequencyData = new Float32Array(analyser.frequencyBinCount);
analyser.getFloatFrequencyData(frequencyData);

<FrequencyVisualizer frequencyData={frequencyData} isActive={true} isPlaying={isPlaying} />
```

### **React Lifecycle**
- **useRef**: Canvas element reference management
- **useEffect**: Rendering loop with dependency optimization
- **useMemo**: Metrics calculation optimization

---

The FrequencyVisualizer provides professional-grade real-time spectrum analysis with broadcast-standard visualization and comprehensive frequency metrics for critical audio monitoring. 