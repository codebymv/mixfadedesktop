import React, { useRef, useEffect, useState } from 'react';
import { SpectrogramAnalysis, SpectrogramBuffer, SpectrogramAverager, calculateSpectrogramMetrics } from '../utils/audioAnalysis';
import { getActivityColor, getDynamicRangeColor } from '../utils/analysisFormatters';

interface SpectrogramAnalyzerProps {
  frequencyData: Float32Array;
  isActive: boolean;
  isPlaying: boolean;
  crossfadeVolume?: number;
}

export function SpectrogramAnalyzer({ 
  frequencyData, 
  isActive, 
  isPlaying, 
  crossfadeVolume = 1 
}: SpectrogramAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectrogramBuffer = useRef<SpectrogramBuffer | null>(null);
  const spectrogramAverager = useRef<SpectrogramAverager | null>(null);
  
  const [displayData, setDisplayData] = useState<SpectrogramAnalysis>({
    brightness: 0,
    dynamicRange: 0,
    activity: 0,
    toneVsNoise: 0,
    highFreqContent: 0
  });

  // Initialize spectrogram buffer and averager
  useEffect(() => {
    if (!spectrogramBuffer.current) {
      // 5 seconds window, 100ms updates (matches sidebar analysis)
      spectrogramBuffer.current = new SpectrogramBuffer(5000, 100);
    }
    if (!spectrogramAverager.current) {
      // 300ms window, 100ms updates (matches sidebar analysis)
      spectrogramAverager.current = new SpectrogramAverager(300, 100);
    }
  }, []);

  // Reset buffer and averager when playback stops
  useEffect(() => {
    if (!isPlaying && spectrogramBuffer.current && spectrogramAverager.current) {
      spectrogramBuffer.current.reset();
      spectrogramAverager.current.reset();
      setDisplayData({
        brightness: 0,
        dynamicRange: 0,
        activity: 0,
        toneVsNoise: 0,
        highFreqContent: 0
      });
    }
  }, [isPlaying]);

  // Update spectrogram data from frequency analysis (using same logic as sidebar)
  useEffect(() => {
    if (!isActive) {
      setDisplayData({
        brightness: 0,
        dynamicRange: 0,
        activity: 0,
        toneVsNoise: 0,
        highFreqContent: 0
      });
      return;
    }

    if (frequencyData && isPlaying && spectrogramBuffer.current && spectrogramAverager.current) {
      // Calculate spectrogram metrics from raw FFT data (same as sidebar)
      const spectrogramAnalysis = calculateSpectrogramMetrics(frequencyData, spectrogramBuffer.current, 48000, true, isPlaying);
      
      const shouldUpdate = spectrogramAverager.current.addSample(spectrogramAnalysis);
      
      if (shouldUpdate) {
        const smoothed = spectrogramAverager.current.getSmoothedValues();
        setDisplayData(smoothed);
      }
    }
  }, [isActive, isPlaying, frequencyData]);

  // Professional spectrogram visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spectrogramBuffer.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container with device pixel ratio
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Clear canvas with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!isActive) return;

    // Professional frequency constants
    const minFreq = 20;
    const maxFreq = 20000;
    const minDb = -60;
    const maxDb = 0;

    // Get visible snapshots
    const snapshots = spectrogramBuffer.current.getVisibleSnapshots();
    if (snapshots.length === 0) return;

    // Calculate time range
    const timeWindowMs = spectrogramBuffer.current.getTimeWindowMs();

    // Frequency axis setup (logarithmic)
    const logMinFreq = Math.log10(minFreq);
    const logMaxFreq = Math.log10(maxFreq);
    const logFreqRange = logMaxFreq - logMinFreq;

    // Convert frequency to Y position (inverted, high freq at top)
    const freqToY = (freq: number): number => {
      const logFreq = Math.log10(Math.max(freq, minFreq));
      const normalizedLog = (logFreq - logMinFreq) / logFreqRange;
      return height - (normalizedLog * height); // Invert Y axis
    };

    // Convert dB to color
    const dbToColor = (db: number): string => {
      const normalized = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
      
      // Professional spectrogram color mapping: blue -> green -> yellow -> red
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

    // Draw professional grid overlay
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';

    // Frequency grid lines and labels
    const freqMarkers = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqMarkers.forEach(freq => {
      if (freq >= minFreq && freq <= maxFreq) {
        const y = freqToY(freq);
        
        // Grid line
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        
        // Label
        ctx.textAlign = 'left';
        ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, 2, y - 2);
      }
    });

    // Time grid lines
    const timeIntervals = [1000, 2000, 3000, 4000]; // 1s intervals
    timeIntervals.forEach(intervalMs => {
      const x = (intervalMs / timeWindowMs) * width;
      if (x < width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Time label
        ctx.textAlign = 'center';
        ctx.fillText(`${intervalMs/1000}s`, x, height - 5);
      }
    });

  }, [isActive, isPlaying, frequencyData]);

  // Format frequency for display
  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}k`;
    }
    return `${freq}`;
  };



  // Get frequency-based colors to match FrequencyVisualizer exactly
  const getFrequencyColor = (freq: number) => {
    if (freq < 200) {
      // Bass: Red
      return { text: 'text-red-400', bg: 'bg-red-500' };
    } else if (freq < 2000) {
      // Mid: Orange  
      return { text: 'text-orange-400', bg: 'bg-orange-500' };
    } else if (freq < 8000) {
      // Upper Mid: Green
      return { text: 'text-green-400', bg: 'bg-green-500' };
    } else {
      // High (>= 8000Hz): Purple
      return { text: 'text-purple-400', bg: 'bg-purple-500' };
    }
  };

  // Get dynamic range background color to match the analysis panel
  const getDynamicRangeBgColor = (rangeDb: number) => {
    const textColor = getDynamicRangeColor(rangeDb);
    // Convert text color classes to background color classes
    if (textColor.includes('green')) return 'bg-green-500';
    if (textColor.includes('yellow')) return 'bg-yellow-500';
    if (textColor.includes('orange')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Main Content - Reduced spacing */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spectrogram Visualization */}
        <div className="space-y-2">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-32 bg-slate-900 rounded-lg border border-slate-700/50"
            />
            {isPlaying && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>5s AGO</span>
            <span>NOW</span>
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="space-y-2.5">
          {/* Brightness (Spectral Centroid) */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Brightness</span>
              <span className={`font-mono font-bold ${getFrequencyColor(displayData.brightness).text}`}>
                {formatFrequency(displayData.brightness)}Hz
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getFrequencyColor(displayData.brightness).bg} rounded-full transition-all duration-200`}
                style={{ width: `${Math.min(100, (Math.log10(Math.max(displayData.brightness, 20) / 20) / Math.log10(1000)) * 100)}%` }}
              />
            </div>
          </div>

          {/* High Frequency Content (Spectral Rolloff) */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>High Freq Content</span>
              <span className={`font-mono font-bold ${getFrequencyColor(displayData.highFreqContent).text}`}>
                {formatFrequency(displayData.highFreqContent)}Hz
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getFrequencyColor(displayData.highFreqContent).bg} rounded-full transition-all duration-200`}
                style={{ width: `${Math.min(100, (Math.log10(Math.max(displayData.highFreqContent, 20) / 20) / Math.log10(1000)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Activity (Spectral Change Rate) */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Activity</span>
              <span className={`font-mono font-bold ${getActivityColor(displayData.activity)}`}>
                {(displayData.activity * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  displayData.activity > 0.8 ? 'bg-red-500' :
                  displayData.activity > 0.6 ? 'bg-orange-500' :
                  displayData.activity > 0.4 ? 'bg-yellow-500' :
                  displayData.activity > 0.2 ? 'bg-green-500' : 'bg-green-500'
                }`}
                style={{ width: `${displayData.activity * 100}%` }}
              />
            </div>
          </div>

          {/* Dynamic Range & Harmonic Content */}
          <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-slate-700/50">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">dB Range</span>
                <span className={`font-mono font-bold text-xs ${getDynamicRangeColor(displayData.dynamicRange)}`}>
                  {displayData.dynamicRange.toFixed(1)}dB
                </span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getDynamicRangeBgColor(displayData.dynamicRange)} rounded-full transition-all duration-200`}
                  style={{ width: `${Math.min(100, (displayData.dynamicRange / 40) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Tone vs Noise</span>
                <span className="font-mono font-bold text-xs text-white">
                  {(displayData.toneVsNoise * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-200 ${
                    displayData.toneVsNoise > 0.7 ? 'bg-green-500' :
                    displayData.toneVsNoise > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${displayData.toneVsNoise * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-slate-700/50">
        <div className="grid grid-cols-2 gap-2 text-xs text-audio-text-dim">
          {/* Left Half - Activity Indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-1 bg-blue-500 rounded"></div>
              <span>Calm</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-1 bg-yellow-500 rounded"></div>
              <span>Active</span>
            </div>
          </div>
          
          {/* Right Half - Frequency Bands + Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-1 bg-red-500 rounded"></div>
                <span>Bass</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-1 bg-orange-500 rounded"></div>
                <span>Mid</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-1 bg-green-500 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-1 bg-purple-500 rounded"></div>
                <span>Ultra</span>
              </div>
            </div>
            <div className={`flex items-center gap-1 ${
              crossfadeVolume === 0 ? 'text-red-400' :
              isPlaying ? 'text-green-400' : 'text-slate-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                crossfadeVolume === 0 ? 'bg-red-500' :
                isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
              }`}></div>
              <span className="font-mono text-xs">
                {crossfadeVolume === 0 ? 'MUTED' :
                 isPlaying ? 'PLAYING' : 'PAUSED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}