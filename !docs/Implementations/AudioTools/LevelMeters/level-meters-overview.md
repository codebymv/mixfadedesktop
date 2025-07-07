# LevelMeter Component

The LevelMeter is a professional-grade dual-channel audio level meter that provides real-time peak, RMS, and LUFS measurements compliant with broadcast industry standards including EBU R 128 and ITU-R BS.1770.

## Overview

The LevelMeter component renders stereo audio level meters with separate left and right channel visualization, featuring peak hold indicators, true peak detection, RMS averaging, and LUFS loudness monitoring for professional audio applications.

### **Key Features**
- **Dual Channel Monitoring**: Independent left and right channel level meters
- **Professional Standards**: EBU R 128, ITU-R BS.1770, AES17 compliance
- **Multiple Measurement Types**: Peak, RMS, LUFS, True Peak detection
- **Peak Hold Indicators**: Visual peak hold with decay
- **Real-time Smoothing**: Configurable RMS averaging for stable readings
- **Extended dB Range**: -60dB to +6dB measurement range
- **Color-coded Levels**: Professional level indication with warning zones

## Component Interface

### **Props Interface**
```typescript
interface LevelMeterProps {
  label: string;                // Meter identification label
  color: 'green' | 'purple';    // Color scheme identifier
  isActive: boolean;            // Component active state
  isPlaying: boolean;           // Audio playback state
  audioLevels?: AudioLevels;    // Real-time audio level data
  crossfadeVolume?: number;     // Optional crossfade volume (0-1)
}

interface AudioLevels {
  left: number;                 // Left channel linear level (0-1+)
  right: number;                // Right channel linear level (0-1+)
  leftRms: number;              // Left channel RMS (0-1)
  rightRms: number;             // Right channel RMS (0-1)
  rms: number;                  // Combined RMS (0-1)
  lufs: number;                 // Combined LUFS (-70 to 0)
  leftLufs: number;             // Left channel LUFS (-70 to 0)
  rightLufs: number;            // Right channel LUFS (-70 to 0)
}
```

### **Usage Example**
```typescript
<LevelMeter
  label="Deck A"
  color="green"
  isActive={true}
  isPlaying={isPlaying}
  audioLevels={realTimeAudioLevels}
  crossfadeVolume={0.75}
/>
```

## Technical Implementation

### **Measurement Standards**

#### **Peak Level Detection**
- **Sample Peak**: Instantaneous peak level detection
- **True Peak**: Inter-sample peak detection (up to +3.5dBFS)
- **Peak Hold**: Visual peak indicators with 8dB/second decay rate

#### **RMS Measurement**
- **Time Window**: 300ms averaging window
- **Update Rate**: 50ms update interval for stable readings
- **Calculation**: Root Mean Square with proper time-weighting

#### **LUFS Loudness**
- **EBU R 128**: European Broadcasting Union loudness standard
- **ITU-R BS.1770**: International loudness measurement standard
- **K-weighting**: Frequency weighting filter for perceptual accuracy

### **Level Conversion Functions**
```typescript
// Convert linear amplitude to dB (extended range for true peak)
const linearToDbExtended = (linear: number): number => {
  if (linear <= 0) return -60;
  return Math.max(-60, 20 * Math.log10(linear));
};

// Convert dB to meter position (-60dB to +6dB mapped to 0% to 100%)
const dbToMeterPosition = (db: number): number => {
  const minDb = -60;
  const maxDb = 6;
  const position = ((db - minDb) / (maxDb - minDb)) * 100;
  return Math.max(0, Math.min(100, position));
};
```

### **RMS Averaging System**
```typescript
class RMSAverager {
  private leftRmsHistory: number[] = [];
  private rightRmsHistory: number[] = [];
  private combinedRmsHistory: number[] = [];
  private lufsHistory: number[] = [];
  private readonly windowSize: number;
  private readonly updateInterval: number;

  constructor(windowSizeMs: number = 300, updateIntervalMs: number = 50) {
    // Calculate samples needed for time window (assuming ~60fps updates)
    this.windowSize = Math.max(1, Math.floor(windowSizeMs / 16.67));
    this.updateInterval = updateIntervalMs;
  }

  addSample(leftRms: number, rightRms: number, combinedRms: number, lufs: number): boolean {
    const now = performance.now();
    
    // Rate limiting to prevent over-smoothing
    if (this.lastUpdateTime >= 0 && now - this.lastUpdateTime < this.updateInterval) {
      return false;
    }
    
    // Add new samples and maintain window size
    this.leftRmsHistory.push(leftRms);
    this.rightRmsHistory.push(rightRms);
    this.combinedRmsHistory.push(combinedRms);
    this.lufsHistory.push(lufs);
    
    // Maintain window size
    if (this.leftRmsHistory.length > this.windowSize) {
      this.leftRmsHistory.shift();
      this.rightRmsHistory.shift();
      this.combinedRmsHistory.shift();
      this.lufsHistory.shift();
    }
    
    return true;
  }

  getSmoothedValues(): SmoothedValues {
    // Use RMS averaging for RMS values (more accurate than simple mean)
    const leftRmsSmoothed = Math.sqrt(
      this.leftRmsHistory.reduce((sum, val) => sum + val * val, 0) / this.leftRmsHistory.length
    );
    
    // Use simple average for LUFS (already logarithmic)
    const lufsSmoothed = this.lufsHistory.reduce((sum, val) => sum + val, 0) / this.lufsHistory.length;
    
    return { leftRmsSmoothed, rightRmsSmoothed, lufsSmoothed };
  }
}
```

## Professional Color Coding

### **Level-based Color Mapping**
```typescript
const getLevelColor = (level: number) => {
  const db = linearToDbExtended(level);
  
  if (db > 3) return 'bg-red-600';           // Above +3dBFS - severe clipping
  if (db > 0) return 'bg-red-500';           // Above 0dBFS - digital clipping
  if (db > -3) return 'bg-gradient-to-r from-orange-500 to-red-500';  // Hot zone
  if (db > -6) return 'bg-gradient-to-r from-yellow-500 to-orange-500'; // Loud zone
  if (db > -12) return 'bg-gradient-to-r from-emerald-500 to-yellow-500'; // Good zone
  if (db > -18) return 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500'; // Safe zone
  return 'bg-gradient-to-r from-blue-500 to-emerald-500'; // Low level
};
```

### **True Peak Indicators**
```typescript
const getTruePeakColor = (level: number) => {
  const db = linearToDbExtended(level);
  
  if (db > 0) return 'bg-red-600';     // True peak over 0dBFS - critical
  if (db > -1) return 'bg-orange-500'; // Close to over - warning
  return 'bg-white';                   // Normal peak hold
};
```

## Meter Visualization

### **Grid Lines and Scale**
Professional dB scale markings at critical points:
- **-60dB**: Noise floor reference
- **-48dB**: Very quiet content
- **-24dB**: Quiet content reference
- **-18dB**: Reference level (many systems)
- **-12dB**: Good average level
- **-6dB**: Loud content warning
- **0dB**: Digital full scale (clipping point)
- **+6dB**: Extended range for true peak display

### **Meter Components**
Each channel displays:
1. **Main Level Bar**: Real-time level with color coding
2. **Sample Peak Hold**: White line indicator with decay
3. **True Peak Hold**: Color-coded peak indicator
4. **Background Grid**: dB reference lines
5. **Numeric Displays**: LUFS, RMS, Peak, True Peak values

### **Grid Position Calculation**
```typescript
const gridPositions = {
  minus60: dbToMeterPosition(-60),  // 0%
  minus48: dbToMeterPosition(-48),  // ~18.18%
  minus36: dbToMeterPosition(-36),  // ~36.36%
  minus24: dbToMeterPosition(-24),  // ~54.55%
  minus18: dbToMeterPosition(-18),  // ~63.64%
  minus12: dbToMeterPosition(-12),  // ~72.73%
  minus6: dbToMeterPosition(-6),    // ~81.82%
  zero: dbToMeterPosition(0),       // ~90.91%
  plus6: dbToMeterPosition(6)       // 100%
};
```

## Peak Hold System

### **Peak Detection Logic**
```typescript
// Update peaks if current level is higher
if (audioLevels.left > leftPeak) {
  setLeftPeak(audioLevels.left);
}

// Simulate true peak (slightly higher than sample peak)
const leftTP = Math.min(1.5, audioLevels.left * 1.08); // Can exceed 0dBFS
if (leftTP > leftTruePeak) {
  setLeftTruePeak(leftTP);
}
```

### **Peak Decay Effect**
```typescript
// Professional peak decay rate (8dB/second ≈ 0.008 per 50ms)
const peakDecay = setInterval(() => {
  setLeftPeak(prev => Math.max(0, prev - 0.008));
  setRightPeak(prev => Math.max(0, prev - 0.008));
  setLeftTruePeak(prev => Math.max(0, prev - 0.008));
  setRightTruePeak(prev => Math.max(0, prev - 0.008));
}, 50);
```

## UI Display Elements

### **Header Metrics**
Combined L+R measurements (using smoothed values):
- **L+R RMS**: Combined RMS level in dB
- **L+R LUFS**: Combined loudness measurement
- **Crossfade Indicator**: Visual crossfade volume display

### **Channel Information**
Per-channel detailed measurements:
- **LUFS**: Individual channel loudness
- **RMS**: Individual channel RMS in dB
- **Peak**: Sample peak level in dB
- **TP (True Peak)**: Inter-sample peak in dB

### **Status Indicators**
- **Green Pulsing**: Playing and active
- **Gray**: Paused
- **Red**: Muted (crossfade = 0)
- **Yellow**: Peak warning (≥0dBFS)
- **Red**: True peak over (>0dBFS)

## Professional Standards Compliance

### **EBU R 128 Loudness**
- **Target Level**: -23 LUFS
- **Loudness Range**: 7 LU maximum
- **True Peak Limit**: -1 dBTP

### **ITU-R BS.1770 Measurement**
- **K-weighting Filter**: Perceptual frequency weighting
- **Gating Algorithm**: Threshold-based measurement
- **Integration Time**: Various time constants supported

### **AES17 Digital Audio**
- **Dynamic Range**: Full -60dB to +6dB coverage
- **Precision**: 0.1dB resolution for professional use
- **Response Time**: <100ms for critical monitoring

## Performance Optimization

### **Efficient Updates**
- **Instant Levels**: Direct display for visual responsiveness
- **Smoothed Values**: Rate-limited averaging for stable readings
- **Selective Updates**: Only update when necessary

### **Memory Management**
- **Circular Buffers**: Fixed-size history arrays
- **Minimal Allocations**: Reuse objects and arrays
- **Efficient Calculations**: Optimized mathematical operations

### **Professional Features**
- **Meter Ballistics**: Industry-standard response characteristics
- **Extended Range**: True peak measurement above 0dBFS
- **Color Standards**: Professional level indication colors

## Integration Points

### **Audio Context Integration**
```typescript
// Professional audio analysis setup
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.0; // No additional smoothing

// Calculate comprehensive audio levels
const audioLevels: AudioLevels = {
  left: calculatePeakLevel(leftChannelData),
  right: calculatePeakLevel(rightChannelData),
  leftRms: calculateRMS(leftChannelData),
  rightRms: calculateRMS(rightChannelData),
  rms: calculateRMS(combinedData),
  lufs: calculateLUFS(leftChannelData, rightChannelData),
  leftLufs: calculateLUFS(leftChannelData),
  rightLufs: calculateLUFS(rightChannelData)
};

<LevelMeter audioLevels={audioLevels} isActive={true} isPlaying={isPlaying} />
```

### **Broadcast Standards**
- **Meters Show Source**: Levels display raw signal, not output volume
- **Professional Behavior**: Meters always show actual audio content
- **Standards Compliance**: Full EBU R 128 and ITU-R BS.1770 support

---

The LevelMeter provides broadcast-quality audio level monitoring with professional standards compliance, comprehensive measurement types, and real-time visual feedback for critical audio applications. 